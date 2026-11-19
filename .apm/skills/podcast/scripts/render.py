#!/usr/bin/env python3
# /// script
# requires-python = "==3.11.*"
# dependencies = [
#   "kokoro==0.9.4",
#   "soundfile",
#   "numpy",
#   "en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl",
# ]
# ///
"""Render a two-voice episode script to a stereo WAV with Kokoro-82M.

Usage: uv run render.py SCRIPT.md --config episode.json --out DIR/episode.wav
           [--speed 1.15] [--limit N] [--g2p]

The config is JSON:

    {"voices": {"SAM": "am_michael", "PRIYA": "af_heart"},
     "pronunciations": {"Schneider": "/ʃnˈIdəɹ/", "AI-written": "AI written"},
     "speed": 1.15}

A pronunciation wrapped in slashes is a phoneme string for Kokoro's tokenizer.
Anything else is a respelling that replaces the word before synthesis. To
override one occurrence only, write `[word](/phonemes/)` in the script itself.

--g2p prints how the tokenizer will say names, acronyms, numbers and
heteronyms, and renders nothing. Each turn's audio is saved under
DIR/episode.parts/, named by a hash of its voice, speed and text, so a rerun
renders only the turns that changed. DIR/episode.stats.json records each turn's
length and gap.
"""

import argparse
import hashlib
import json
import os
import random
import re
import shutil
import sys
import tempfile
import time
import warnings
from importlib.metadata import version
from pathlib import Path

sys.dont_write_bytecode = True
warnings.filterwarnings("ignore")

from episode import PHONEME_LINK, parse

SAMPLE_RATE = 24000
CHUNK_CHARS = 280
SHORT_CHUNK_CHARS = 60
ESPEAK_PATH_LIMIT = 100
UNKNOWN = "❓"
SENTENCE_END = {".", "!", "?", "…"}
THINKING_START = re.compile(r"(So,|Well|Let me|I don't know|Hmm|Okay\. |No\. And)")
HETERONYMS = {
    "bass", "bow", "close", "content", "does", "lead", "live", "minute", "object", "present",
    "read", "record", "refuse", "resume", "row", "tear", "use", "wind", "wound",
}  # fmt: skip


def espeak_data_path():
    """Return a short real path to the espeak-ng data, copying it there if needed.

    espeak-ng keeps its data path in a fixed buffer and exits the process when
    the path does not fit. phonemizer resolves symlinks, so a link to the long
    path does not help.
    """
    import espeakng_loader

    source = Path(espeakng_loader.get_data_path()).resolve()
    if len(str(source)) <= ESPEAK_PATH_LIMIT:
        return source
    name = f"espeak-ng-data-{version('espeakng-loader')}"
    for root in (Path.home() / ".cache", Path("/tmp")):
        target = (root / name).resolve()
        if len(str(target)) > ESPEAK_PATH_LIMIT:
            continue
        if not (target / "phontab").exists():
            root.mkdir(parents=True, exist_ok=True)
            staging = Path(tempfile.mkdtemp(prefix=name, dir=target.parent))
            shutil.copytree(source, staging / "data")
            try:
                os.replace(staging / "data", target)
            except OSError:
                pass
            shutil.rmtree(staging, ignore_errors=True)
        if (target / "phontab").exists():
            return target
    sys.exit(f"No path under {ESPEAK_PATH_LIMIT} characters is available for the espeak-ng data")


def load_pipeline(with_model):
    from misaki import espeak  # noqa: F401  phonemizer must be loaded before the path is set
    from phonemizer.backend.espeak.wrapper import EspeakWrapper

    data = espeak_data_path()
    EspeakWrapper.set_data_path(str(data))
    print("espeak-ng data:", data, flush=True)
    from kokoro import KPipeline

    if with_model:
        return KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M", device="cpu")
    return KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M", model=False)


def apply_pronunciations(markup, pronunciations):
    """Replace each configured word once, longest first, leaving inline overrides alone."""
    if not pronunciations:
        return markup
    words = "|".join(re.escape(word) for word in sorted(pronunciations, key=len, reverse=True))
    pattern = re.compile(rf"{PHONEME_LINK.pattern}|(?<!\w)(?P<word>{words})(?!\w)")

    def said(match):
        word = match.group("word")
        if word is None:
            return match.group(0)
        replacement = pronunciations[word]
        if replacement.startswith("/") and replacement.endswith("/"):
            return f"[{word}]({replacement})"
        return replacement

    return pattern.sub(said, markup)


def chunks(text):
    """Split at sentence ends into pieces Kokoro can say in one pass."""
    out, current = [], ""
    for sentence in re.findall(r"\S.*?(?:[.!?][\"”’')]*(?=\s)|$)", text):
        if current and len(current) + len(sentence) + 1 > CHUNK_CHARS:
            out.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        out.append(current)
    return out


def trim(audio, np, threshold=0.006):
    """Cut the silence Kokoro pads each chunk with, keeping 40 ms either side."""
    loud = np.nonzero(np.abs(audio) > threshold)[0]
    if not len(loud):
        return audio
    keep = int(SAMPLE_RATE * 0.04)
    return audio[max(loud[0] - keep, 0) : min(loud[-1] + keep, len(audio))]


def turn_speed(text, base):
    """Quick exchanges run a little faster and long explanations a little slower."""
    words = len(text.split())
    return base + (0.04 if words <= 14 else -0.03 if words >= 40 else 0.0)


def synthesize(pipeline, text, voice, speed, np):
    parts = []
    for chunk in chunks(text):
        chunk_speed = 1.0 if len(chunk) < SHORT_CHUNK_CHARS else speed
        for result in pipeline(chunk, voice=voice, speed=chunk_speed):
            if result.audio is not None:
                parts += [trim(np.clip(result.audio.numpy(), -1, 1), np), np.zeros(int(SAMPLE_RATE * 0.22), dtype=np.float32)]
    if not parts:
        sys.exit(f"Kokoro returned no audio for: {text[:70]}")
    return np.concatenate(parts[:-1])


def gap_before(index, turns):
    """Seconds of silence before a turn. A negative value overlaps the previous turn."""
    turn, previous = turns[index], turns[index - 1]
    if turn.new_section:
        gap = 1.1
    elif previous.text.endswith("..."):
        return -0.12
    elif turn.words <= 3:
        gap = 0.13
    elif previous.words <= 3:
        gap = 0.22
    elif THINKING_START.match(turn.text):
        gap = 0.6
    elif previous.text.endswith("?"):
        gap = 0.27
    elif previous.words > 55:
        gap = 0.55
    else:
        gap = 0.36
    return gap * random.Random(index).uniform(0.85, 1.15)


def speech_level(audio, np):
    """RMS over the 100 ms frames that contain speech."""
    frame = SAMPLE_RATE // 10
    frames = audio[: len(audio) // frame * frame].reshape(-1, frame)
    rms = np.sqrt((frames**2).mean(1))
    rms = rms[rms > 0.01]
    return float(np.sqrt((rms**2).mean())) if len(rms) else 0.0


def speaker_gains(turns, segments, speakers, np):
    """One gain per speaker so both sit at the same speech level."""
    levels = {}
    for speaker in speakers:
        own = [(turn, segment) for turn, segment in zip(turns, segments) if turn.speaker == speaker]
        if not own:
            continue
        long = [segment for turn, segment in own if turn.words > 6] or [segment for _, segment in own]
        measured = [level for level in (speech_level(segment, np) for segment in long) if level > 0]
        if not measured:
            sys.exit(f"{speaker}: no audible speech to set a level from")
        levels[speaker] = float(np.median(measured))
    target = sum(levels.values()) / len(levels)
    return {speaker: target / level for speaker, level in levels.items()}, levels


def print_g2p(pipeline, turns, texts):
    """List the words most likely to be mispronounced, with the phonemes Kokoro will say."""
    from misaki import en

    dictionary_only = en.G2P(trf=False, british=False, fallback=None, unk=UNKNOWN)
    seen = {}
    for turn, text in zip(turns, texts):
        spoken = [token for result in pipeline(text, voice=None) for token in result.tokens or []]
        looked_up = dictionary_only(text)[1]
        if len(spoken) != len(looked_up):
            sys.exit(f"line {turn.line}: the two tokenizer passes disagree")
        sentence_start = True
        for token, lookup in zip(spoken, looked_up):
            word, starts_sentence = token.text, sentence_start
            sentence_start = word in SENTENCE_END or (sentence_start and not re.search(r"\w", word))
            if not re.search(r"\w", word) or not token.phonemes:
                continue
            if (token._ or {}).get("rating") == 5:
                reason = "override"
            elif UNKNOWN in (lookup.phonemes or UNKNOWN):
                reason = "guessed"
            elif re.search(r"\d", word):
                reason = "number"
            elif word.lower() in HETERONYMS:
                reason = "heteronym"
            elif word[1:] != word[1:].lower() or (word[0].isupper() and not starts_sentence and word.split("'")[0] != "I"):
                reason = "name or acronym"
            else:
                continue
            entry = seen.setdefault((reason, word, token.phonemes), [0, turn.line])
            entry[0] += 1
    for (reason, word, phonemes), (count, line) in sorted(seen.items(), key=lambda item: (item[0][0], item[0][1].lower())):
        print(f"{reason:16} {word:24} /{phonemes}/  x{count}  first at line {line}")
    print(f"{len(seen)} words to check. Fix a wrong one in the config's pronunciations.")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("script")
    parser.add_argument("--config", required=True, help="JSON with voices, pronunciations and speed")
    parser.add_argument("--out", help="path of the stereo WAV to write")
    parser.add_argument("--speed", type=float, help="base Kokoro speed; overrides the config")
    parser.add_argument("--limit", type=int, default=0, help="render only the first N turns")
    parser.add_argument("--g2p", action="store_true", help="print pronunciations to check and render nothing")
    args = parser.parse_args()

    config = json.loads(Path(args.config).read_text())
    voices = config["voices"]
    pronunciations = config.get("pronunciations", {})
    base_speed = args.speed or config.get("speed", 1.15)

    turns = parse(args.script)
    speakers = list(dict.fromkeys(turn.speaker for turn in turns))
    missing = [speaker for speaker in speakers if speaker not in voices]
    if missing:
        sys.exit(f"No voice in {args.config} for: {', '.join(missing)}")
    if len(speakers) != 2:
        sys.exit(f"The mix needs exactly two speakers; the script has {', '.join(speakers)}")
    if args.limit:
        turns = turns[: args.limit]
    texts = [apply_pronunciations(turn.markup, pronunciations) for turn in turns]

    if args.g2p:
        print_g2p(load_pipeline(with_model=False), turns, texts)
        return
    if not args.out:
        sys.exit("--out is required to render")

    import numpy as np
    import soundfile as sf

    out = Path(args.out)
    parts_dir = out.with_suffix(".parts")
    parts_dir.mkdir(parents=True, exist_ok=True)
    pipeline = None
    segments, rendered, started = [], 0, time.time()
    for index, (turn, text) in enumerate(zip(turns, texts)):
        voice, speed = voices[turn.speaker], turn_speed(turn.text, base_speed)
        key = hashlib.sha256(f"{voice}\n{speed:.3f}\n{text}".encode()).hexdigest()[:16]
        part = parts_dir / f"{key}.wav"
        if part.exists() and part.stat().st_size > 44:
            segment = sf.read(part, dtype="float32")[0]
        else:
            pipeline = pipeline or load_pipeline(with_model=True)
            segment = synthesize(pipeline, text, voice, speed, np)
            staging = part.with_suffix(".tmp.wav")
            sf.write(staging, segment, SAMPLE_RATE, subtype="PCM_16")
            os.replace(staging, part)
            rendered += 1
        segments.append(segment)
        if index % 25 == 0:
            print(f"turn {index}/{len(turns)} {turn.speaker} {len(segment) / SAMPLE_RATE:.1f}s, {time.time() - started:.0f}s elapsed", flush=True)
    print(f"rendered {rendered} turns, reused {len(turns) - rendered}")

    gains, levels = speaker_gains(turns, segments, speakers, np)
    for speaker in levels:
        print(f"{speaker}: speech level {20 * np.log10(levels[speaker]):.1f} dBFS, gain {20 * np.log10(gains[speaker]):+.1f} dB")

    # Each voice sits about 2.4 dB toward its own side; the first speaker takes the left.
    pan = {speakers[0]: (1.0, 0.76), speakers[1]: (0.76, 1.0)}
    gaps = [0.0] + [gap_before(index, turns) for index in range(1, len(turns))]
    length = sum(len(segment) for segment in segments) + int(sum(max(gap, 0) for gap in gaps) * SAMPLE_RATE) + SAMPLE_RATE
    mix = np.zeros((length, 2), dtype=np.float32)
    position, stats = 0, []
    for turn, segment, gap in zip(turns, segments, gaps):
        position = max(position + int(gap * SAMPLE_RATE), 0)
        left, right = pan[turn.speaker]
        mix[position : position + len(segment), 0] += segment * gains[turn.speaker] * left
        mix[position : position + len(segment), 1] += segment * gains[turn.speaker] * right
        stats.append(
            {
                "line": turn.line,
                "speaker": turn.speaker,
                "words": turn.words,
                "start": round(position / SAMPLE_RATE, 2),
                "seconds": round(len(segment) / SAMPLE_RATE, 2),
                "gap": round(gap, 2),
                "peak": round(float(np.abs(segment).max()), 3),
            }
        )
        position += len(segment)
    sf.write(out, np.clip(mix[:position], -1, 1), SAMPLE_RATE, subtype="PCM_16")
    out.with_suffix(".stats.json").write_text(json.dumps(stats, indent=1))

    suspects = 0
    for speaker in levels:
        own = [entry for entry in stats if entry["speaker"] == speaker]
        words, seconds = sum(entry["words"] for entry in own), sum(entry["seconds"] for entry in own)
        print(f"{speaker}: {len(own)} turns, {words / seconds * 60:.0f} wpm while speaking")
        typical = float(np.median([entry["seconds"] / entry["words"] for entry in own if entry["words"] >= 5] or [seconds / words]))
        for entry in own:
            pace = entry["seconds"] / entry["words"]
            if entry["words"] >= 5 and not 0.6 * typical <= pace <= 1.6 * typical:
                suspects += 1
                print(f"  check line {entry['line']}: {pace:.2f} s/word against a typical {typical:.2f}; truncated or stretched?")
    print(f"{suspects} turns with unusual seconds per word")
    print(f"{out}: {position / SAMPLE_RATE / 60:.2f} minutes, {len(turns)} turns")


if __name__ == "__main__":
    main()
