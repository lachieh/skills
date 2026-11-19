---
name: podcast
description: Turn source material into a two-voice podcast episode, a spoken-style script plus mastered stereo audio rendered locally and free on Apple Silicon. Use when asked for a podcast or audio version of threads, documents, or URLs.
---

# Podcast

Produce two artifacts for one named listener: a two-speaker script in Markdown
and a mastered stereo audio file. Everything runs locally with `uv` and
`ffmpeg`. The script decides whether the result sounds like a conversation, so
spend the effort there.

You cannot hear the audio. Report what the checks measured and never say it
sounds good.

## Set up the episode folder

Write every deliverable to a durable folder the human names, or
`~/Documents/podcasts/<episode-slug>/` when they name none. A temp directory
does not survive a reboot. The folder holds the script, `episode.json`, the
per-turn audio, the mix, and the mastered file.

The scripts sit in `scripts/` beside this file and declare their own
dependencies, so `uv run <podcast-skill-dir>/scripts/<name>.py` builds each
environment on first use. `render.py` pins Python 3.11 because Kokoro's
tokenizer fails on 3.13 and later, and it pre-installs the spaCy model that the
tokenizer would otherwise fetch with a `pip` that uv environments lack.

## Write the script

1. Read every source in full. List the facts the episode will state: numbers,
   years, names, and quotations, each with its source.
2. Cast two invented speakers. The interviewer knows what the listener knows and
   never supplies a fact. The expert explains a concept in plain words before
   naming it. Say in the script's opening notes that both are invented and which
   sources the facts come from.
3. Keep facts faithful to the sources. Before the expert states a name, date, or
   author for anything outside them, such as prior art, confirm it by web
   search and list what was checked at the end of the file. Speak in general
   terms about anything not confirmed.
4. Write it to be spoken:
   - Keep turns short: a median near 16 words and none over about 80. Break a
     long explanation by having the other speaker restate it, guess ahead, push
     back, or react. About one turn in six is a reaction of four words or fewer.
   - Use contractions and spoken phrasing. A reaction is a real word such as
     "Right.", "Wait.", or "Okay." Interjections such as "Huh." render weakly.
   - Write only what a voice should say. Stage directions, music cues, URLs,
     and em dashes are read aloud or dropped. End a line with "..." when the
     next speaker cuts in.
   - Budget about 185 words per finished minute. The measured example was 6,400
     words for 34 to 35 minutes at speed 1.15 to 1.17.
5. Start each turn with `**NAME:** text`, the name in capitals, and leave a
   blank line after it. Start each section with a `## ` heading. The scripts
   ignore every other line, so notes and the source list can stay in the same
   file as long as no note begins with a bold capitalised label.
6. Run `python3 <podcast-skill-dir>/scripts/episode.py SCRIPT.md`. It prints
   the turn statistics and the estimated length, and exits non-zero when a turn
   is too long, contains something a voice cannot read, or the script does not
   have exactly two speakers.
7. When rewriting an existing script, diff the facts mechanically. Every number,
   year, proper name, and quoted string in the old version must appear in the
   new one.

## Choose voices and check pronunciation

Write `episode.json` beside the script:

```json
{
  "voices": {"SAM": "am_michael", "PRIYA": "af_heart"},
  "pronunciations": {"Schneider": "/ʃnˈIdəɹ/", "AI-written": "AI written"},
  "speed": 1.15
}
```

Give `af_heart`, the best-graded Kokoro voice, to the speaker with the most
words. Kokoro's male voices grade around C+, and `am_michael` is the one that
has been used.

Before rendering, run:

```sh
uv run <podcast-skill-dir>/scripts/render.py SCRIPT.md --config episode.json --g2p
```

It loads the tokenizer without the voice model and lists each guessed word,
name, acronym, number, and heteronym with the phonemes Kokoro will say. Read
the list. Fix a wrong entry under `pronunciations`: a value wrapped in slashes
is a phoneme string in the notation the list prints, and any other value is a
respelling. To fix one occurrence only, such as a heteronym, write
`[word](/phonemes/)` in the script. Rerun until the list is right.

## Render, master, and verify

```sh
caffeinate -i uv run <podcast-skill-dir>/scripts/render.py SCRIPT.md --config episode.json --out DIR/episode.wav
uv run <podcast-skill-dir>/scripts/master.py DIR/episode.wav DIR/episode.m4a
uv run <podcast-skill-dir>/scripts/asr_diff.py DIR/episode.m4a SCRIPT.md
```

1. `render.py` saves each turn under `DIR/episode.parts/`, keyed by its voice,
   speed, and text. A crash resumes, and a changed line or override re-renders
   only its own turns. It derives each pause from the exchange, matches the two
   speakers' levels, places the voices slightly apart in stereo, and writes
   `DIR/episode.stats.json`. Chunks under 60 characters run at speed 1.0 on
   purpose, because Kokoro rushes short lines.
2. Read its last lines. It flags any turn whose seconds per word is far from
   that speaker's typical pace, which is how a truncated or stretched turn
   shows up. Inspect the text of each flagged turn, fix it, and re-render.
3. `master.py` applies a high-pass filter and light compression, normalises to
   -16 LUFS in two passes, adds quiet room tone so the gaps are not digital
   silence, and encodes with `ffmpeg`. Pass `--atempo` to change the pace
   without re-rendering.
4. `asr_diff.py` transcribes the mastered file with Whisper and lists every word
   heard differently from the script, with the time it first occurs. Most
   differences are spelling or digits, and Whisper can invent a phrase such as
   "thank you" over the closing room tone. Fix the ones where the voice said the
   word wrongly with an override or a respelling, then repeat from step 1. On
   the measured example the word error rate was 2.6% and two of the differences
   were real mispronunciations.

## Hazards

- Never chain a cleanup `rm` after an encode with `;`. A failed encode followed
  by cleanup has deleted a 70-minute render. The scripts delete their own
  staging files only after the encode succeeds.
- Encode with `ffmpeg`. Apple's `afconvert` AAC encoder has become unavailable
  partway through a session.
- In zsh, write `${VAR}` before a colon. `"$VAR:linear=true"` applies the `:l`
  modifier to the variable.
- espeak-ng, the tokenizer's fallback for unknown words, exits the whole process
  when its data path is too long for its buffer. `render.py` copies the data to
  a short real path and prints it. If a render dies with no traceback, check
  that line first.

## Other models

Kokoro-82M is the default because it is fast and predictable: preset voices, an
Apache 2.0 licence, and a 34-minute episode rendered in about 2.5 minutes on an
M4 Max. Two alternatives were rendered from the same script, and the bundled
scripts do not support either.

- VibeVoice 1.5B generates whole conversations and sounds more reactive. It
  took about 90 minutes including re-renders, speaks near 165 words per minute,
  and hallucinates: repeated passages, stray sung phrases, and possible
  background music.
- ChatterBox took 71 minutes.

[tts-bench](https://github.com/5uck1ess/tts-bench) compares more models.

## Completion

The episode folder holds the script, the config, and the mastered audio.
Report the paths, the duration, the Whisper word error rate, each
mispronunciation found and how it was fixed, any difference left unfixed, and
which facts were checked outside the sources. State that no one has listened to
the audio.
