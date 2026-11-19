#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["soundfile", "numpy"]
# ///
"""Master a rendered voice mix: high-pass, light compression, loudness, room tone.

Usage: uv run master.py IN.wav OUT.m4a [--lufs -16] [--atempo 1.0] [--room-db -58]

Loudness is normalised in two ffmpeg passes. A low noise bed is added so the
gaps between turns are not digital silence. ffmpeg picks the encoder from the
OUT extension. IN.wav is left in place.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

VOICE_CHAIN = "highpass=f=70,acompressor=threshold=-21dB:ratio=2.2:attack=8:release=160:makeup=1.5"
EDGE_SECONDS = 0.6


def room_tone(samples, rate, rng):
    """Noise weighted toward low frequencies, at unit RMS."""
    spectrum = np.fft.rfft(rng.standard_normal(samples).astype(np.float32))
    freqs = np.fft.rfftfreq(samples, 1 / rate)
    shape = 1 / np.maximum(freqs, 40) ** 0.9
    shape[freqs > 3500] *= np.exp(-(freqs[freqs > 3500] - 3500) / 900)
    shape[freqs < 45] = 0
    tone = np.fft.irfft(spectrum * shape, samples).astype(np.float32)
    return tone / np.sqrt((tone**2).mean())


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--lufs", type=float, default=-16.0, help="integrated loudness target")
    parser.add_argument("--atempo", type=float, default=1.0, help="speed change without pitch change")
    parser.add_argument("--room-db", type=float, default=-58.0, help="room tone level in dBFS")
    args = parser.parse_args()

    loudnorm = f"loudnorm=I={args.lufs}:TP=-1.5:LRA=11"
    measure = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", args.source, "-af", f"{VOICE_CHAIN},{loudnorm}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    reports = re.findall(r"\{[^{}]*\}", measure.stderr)
    if measure.returncode or not reports:
        sys.exit(f"ffmpeg could not measure {args.source}:\n{measure.stderr[-2000:]}")
    measured = json.loads(reports[-1])
    second_pass = (
        f"{loudnorm}:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
        f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
        f":offset={measured['target_offset']}:linear=true"
    )

    output = Path(args.output)
    staging = output.with_name(output.stem + ".mastering.wav")
    rate = sf.info(args.source).samplerate
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", args.source, "-af", f"{VOICE_CHAIN},{second_pass},atempo={args.atempo}", "-ar", str(rate), str(staging)],
        check=True,
    )

    voice, rate = sf.read(staging, dtype="float32", always_2d=True)
    edge = int(rate * EDGE_SECONDS)
    silence = np.zeros((edge, voice.shape[1]), np.float32)
    padded = np.concatenate([silence, voice, silence])
    rng = np.random.default_rng(7)
    room = np.stack([room_tone(len(padded), rate, rng) for _ in range(voice.shape[1])], 1) * 10 ** (args.room_db / 20)
    fade = np.linspace(0, 1, edge, dtype=np.float32)[:, None]
    room[:edge] *= fade
    room[-edge:] *= fade[::-1]
    sf.write(staging, np.clip(padded + room, -1, 1), rate, subtype="PCM_16")

    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(staging), "-b:a", "112k", str(output)], check=True)
    staging.unlink()
    print(f"{output}: {len(padded) / rate / 60:.2f} minutes, target {args.lufs} LUFS, input measured {measured['input_i']} LUFS")


if __name__ == "__main__":
    main()
