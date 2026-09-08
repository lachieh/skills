---
name: why
description: Investigate why code or a decision has its current shape using cited historical evidence, with targeted and full-coverage branches.
---

# Why

Investigate the forces that shaped code: product goals, constraints, incidents,
tradeoffs, rejected alternatives, and decisions. Use `how` for current mechanics.

## Evidence rules

Read `references/evidence.md`. Gather evidence before constructing a narrative.
Every statement about intent needs a citation or an explicit inference label.
Keep contradictions, competing explanations, unavailable sources, and empty
searches visible.

## Establish the code anchor

1. Interpret the target and question from context.
2. Identify exact files, symbols, and line ranges.
3. Find commits that introduced and materially changed the target, following
   renames where possible.
4. Extract pull requests, issues, documents, incidents, and other identifiers
   linked from that history.

The code anchor describes what changed and where to search. Current code does
not prove historical intent.

## Choose the branch

- **Targeted** is the default for a specific decision, constant, regression,
  tradeoff, or narrow rationale question.
- **Archaeology** applies to broad history, postmortems, disputed rationale,
  consequential thresholds, or an explicit request for full coverage.

## Targeted

1. Search source history, commits, pull requests, reviews, and linked issues.
2. Follow references into other authorized evidence systems.
3. Delegate one investigator per relevant source with the `exploration` role and
   `references/investigator-prompt.md`.
4. Stop when direct evidence answers the question or reachable leads are
   exhausted.
5. Delegate a draft to the `synthesis` role, then have the boss verify central
   citations and write the final response.

## Archaeology

1. Discover authorized evidence systems and read `references/sources.md`.
2. Build a coverage plan across every available category relevant to the target.
3. Run one `exploration` investigator per category in parallel.
4. Follow cross-source references in another wave.
5. Record search terms, date ranges, results, contradictions, unavailable
   systems, and searches with no relevant result.
6. Delegate synthesis with `references/synthesizer-prompt.md`.
7. Have the boss spot-check citations and write the final response.

## Completion

Every statement about intent has a citation or an inference label.
Contradictions remain visible. Searches and unavailable sources are recorded
precisely enough to assess coverage. The response does not claim more than the
evidence establishes.
