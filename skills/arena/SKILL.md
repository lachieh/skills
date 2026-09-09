---
name: arena
description: Produce several independent versions of one consequential artifact, select a base, integrate the strongest compatible ideas, and verify one result.
---

# Arena

Use Arena when one attempt would commit too early to a consequential design or
artifact. For independent slices and coverage, use `swarm`.

## Procedure

1. Define the artifact, shared grounding, acceptance criteria, and verification
   method. Give candidates the criteria.
2. Select two or three meaningfully different providers or design directions.
   Resolve every assignment through `configure-models`. Use the `architecture`
   role at `L` for design candidates. For another artifact, use the role that
   owns the work and state an explicit size.
3. Give each candidate an isolated worktree or output directory. No two
   candidates write the same state.
4. Launch candidates concurrently with the same task context and
   `references/candidate-prompt.md`. Each returns an artifact and short rationale.
5. Wait for all candidates before judging. Record missing candidates.
6. Run one independent cross-provider judge with the `review` role at `L` and
   `references/judge-prompt.md`.
7. Have the boss read every artifact and rationale, score each criterion, compare
   with the judge, and select one base.
8. Identify specific ideas worth integrating. Reject changes that would leave
   the base with conflicting models or duplicated behavior.
9. Delegate one bounded integration task against the selected base. Use the
   `implementation` role at `M`, or `complex-implementation` at `L` when the
   integration requires it. Review the resulting diff.
10. Verify the synthesized artifact independently from the integration author
    with the `review` role at `L`, using another provider when available.
11. Save a decision record using `references/decision-record.md` beside the
    result.

Candidate rationales explain design intent. They do not prove the artifact
works. When candidates diverge because the task or criteria were underspecified,
reframe and rerun instead of averaging the results.

## Completion

One coherent artifact satisfies the acceptance criteria and has independent
verification. The decision record identifies the selected base, integrated and
rejected ideas, missing candidates, judge result, and final evidence.
