# Review 02: Prove It Works

Status: approved and implemented

Source: `tmp/pstack/skills/principle-prove-it-works/SKILL.md`

Implementation: `.apm/skills/principle-prove-it-works/SKILL.md`

## Verdict

Keep this as a principle. It defines what permits a completion claim. A separate
procedure may define the steps, tools, verifier assignment, evidence storage,
and verdict format used to produce that proof.

## Approved concepts

- Completion is a claim supported by evidence.
- Evidence proves only the scope it observes.
- Proof is bound to the exact artifact and environment checked.
- Verification occurs at the nearest safe, meaningful boundary.
- Intent and self-report are not evidence of behavior.
- Repeatability helps only when the oracle is valid.
- Stale, partial, and inconclusive evidence leaves a claim unproven.
- Higher risk requires broader and more independent verification.

## Boundaries

`principle-prove-it-works` defines the standard. A future `verify-work`
procedure may operationalize it. `tdd` owns red-first bug work,
`principle-sequence-verifiable-units` owns check ordering, project verification
skills own reusable harnesses, and `shipit` owns the repository lifecycle gate.

Build, run, browser, CLI, API, model-selection, and evidence-persistence
instructions do not belong in this principle.
