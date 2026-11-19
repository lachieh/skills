#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["mlx-whisper", "jiwer"]
# ///
"""List every word Whisper hears differently from the script.

Usage: uv run asr_diff.py AUDIO SCRIPT.md

Transcribes AUDIO with mlx-whisper and aligns it against the spoken lines of
SCRIPT.md. Prints the word error rate, then each difference with its count and
the time it first occurs. Most differences are spelling or digits. The ones to
fix are words the voice said wrongly.
"""

import argparse
import collections
import re
import sys
import warnings

sys.dont_write_bytecode = True
warnings.filterwarnings("ignore")

import jiwer
import mlx_whisper

from episode import parse

MODEL = "mlx-community/whisper-large-v3-turbo"


def words(text):
    return re.sub(r"[^a-z0-9' ]", " ", text.lower().replace("-", " ")).split()


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("audio")
    parser.add_argument("script")
    args = parser.parse_args()

    reference = words(" ".join(turn.text for turn in parse(args.script)))
    result = mlx_whisper.transcribe(
        args.audio, path_or_hf_repo=MODEL, language="en", condition_on_previous_text=False, word_timestamps=True
    )
    heard, times = [], []
    for segment in result["segments"]:
        for word in segment["words"]:
            for token in words(word["word"]):
                heard.append(token)
                times.append(word["start"])
    if not heard:
        sys.exit(f"Whisper heard no words in {args.audio}")

    outcome = jiwer.process_words(" ".join(reference), " ".join(heard))
    print(
        f"script words {len(reference)}, heard {len(heard)}, WER {outcome.wer:.3f} "
        f"(deleted {outcome.deletions}, inserted {outcome.insertions}, substituted {outcome.substitutions})"
    )
    counts, first = collections.Counter(), {}
    for chunk in outcome.alignments[0]:
        if chunk.type == "equal":
            continue
        key = (
            " ".join(reference[chunk.ref_start_idx : chunk.ref_end_idx]),
            " ".join(heard[chunk.hyp_start_idx : chunk.hyp_end_idx]),
        )
        counts[key] += 1
        at = times[min(chunk.hyp_start_idx, len(times) - 1)]
        first.setdefault(key, f"{int(at // 60)}:{int(at % 60):02d}")
    for (scripted, said), count in counts.most_common():
        print(f"{count}x  script: {scripted!r:38} heard: {said!r:32} first at {first[(scripted, said)]}")


if __name__ == "__main__":
    main()
