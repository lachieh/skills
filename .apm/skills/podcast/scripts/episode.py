#!/usr/bin/env python3
"""Parse a two-voice episode script and report how it will sound as speech.

Usage: episode.py SCRIPT.md [--wpm 185]

A turn starts with `**NAME:** text`, NAME in capitals, and runs to the next
blank line. A `## ` heading marks a section change. Every other line is
ignored, so notes and source lists can sit anywhere in the file. render.py and
asr_diff.py import the parser from here.
"""

import argparse
import re
import statistics
import sys
from dataclasses import dataclass
from pathlib import Path

SPEAKER_LINE = re.compile(r"^\*\*([A-Z][A-Z0-9 _-]*):\*\*\s+(.*\S)\s*$")
NEAR_MISS = re.compile(r"^(?:[-*>] +)?\*\*[^*]{1,30}(?::\*\*|\*\*:)\s+\S")
PHONEME_LINK = re.compile(r"\[([^\]]+)\]\(/[^)]*/\)")
READ_ALOUD = [
    (re.compile(r"—|–"), "dash the voice cannot read"),
    (re.compile(r"\[[^\]]*\](?!\()|^\("), "looks like a stage direction"),
    (re.compile(r"https?://|www\."), "URL"),
]


@dataclass
class Turn:
    speaker: str
    markup: str
    new_section: bool
    line: int

    @property
    def text(self):
        """The words as written, without inline `[word](/phonemes/)` overrides."""
        return PHONEME_LINK.sub(r"\1", self.markup)

    @property
    def words(self):
        return len(self.text.split())


def plain(text):
    """Remove Markdown emphasis and code marks, which a voice would not say."""
    return re.sub(r"[*`]", "", text)


def parse(path):
    turns, new_section, open_turn = [], False, None
    for number, line in enumerate(Path(path).read_text().splitlines(), 1):
        line = line.strip()
        match = SPEAKER_LINE.match(line)
        if match:
            open_turn = Turn(match.group(1), plain(match.group(2)).strip(), new_section, number)
            turns.append(open_turn)
            new_section = False
        elif NEAR_MISS.match(line):
            sys.exit(f"{path} line {number}: looks like a speaker line but is not **NAME:** text: {line[:60]}")
        elif line.startswith("#") or not line:
            new_section = new_section or line.startswith("## ")
            open_turn = None
        elif open_turn:
            open_turn.markup = f"{open_turn.markup} {plain(line).strip()}"
    if not turns:
        sys.exit(f"{path}: no lines of the form **NAME:** text")
    for turn in turns:
        if not re.search(r"\w", turn.text):
            sys.exit(f"{path} line {turn.line}: {turn.speaker} has nothing to say")
    return turns


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("script")
    parser.add_argument("--wpm", type=float, default=185, help="words per minute of finished audio")
    args = parser.parse_args()

    turns = parse(args.script)
    lengths = [turn.words for turn in turns]
    total = sum(lengths)
    print(f"{len(turns)} turns, {total} words, about {total / args.wpm:.1f} minutes at {args.wpm:.0f} wpm")
    print(
        f"turn length: median {statistics.median(lengths):.0f} words, longest {max(lengths)}, "
        f"{sum(n <= 4 for n in lengths)} reactions of four words or fewer"
    )
    for speaker in sorted({turn.speaker for turn in turns}):
        own = [turn.words for turn in turns if turn.speaker == speaker]
        print(f"{speaker}: {len(own)} turns, {sum(own)} words")

    problems = []
    speakers = sorted({turn.speaker for turn in turns})
    if len(speakers) != 2:
        problems.append((turns[0], f"the mix needs exactly two speakers, found {', '.join(speakers)}"))
    for turn in turns:
        if turn.words > 80:
            problems.append((turn, f"{turn.words} words; break it up"))
        for pattern, reason in READ_ALOUD:
            if pattern.search(turn.markup):
                problems.append((turn, reason))
    for turn, reason in problems:
        print(f"line {turn.line} {turn.speaker}: {reason}: {turn.text[:70]}")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
