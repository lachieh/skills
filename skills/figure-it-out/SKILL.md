---
name: figure-it-out
description: "Design an auditable playbook when no narrower workflow fits, then execute it through measured units and a decision trail."
disable-model-invocation: true
---

# Figure It Out

When no narrower production skill fits, design the workflow before writing code.
Use this for a large migration, a consequential multi-part change, or work a
human will review after stepping away. Scale rigor to the risk, run each unit as
an experiment, and leave a decision trail.

Do not replace a focused workflow that already fits. A cross-cutting or
long-running version belongs here when its decomposition, gates, and audit trail
are part of the work.

## Start

Open a task list. Its first item is to read the applicable production principles
referenced below. Add Phases A through E. Keep Phase C as the loop heading and
insert the concrete units designed in Phase B beneath it. Keep exactly one task
in progress.

## Phase A: Frame

Ground the task before committing to a long run. State:

- a falsifiable definition of done using `principle-prove-it-works`;
- the causal problem and controllable mechanism using
  `principle-fix-the-latent-issue`;
- quantified scope, rough units and effort, and blockers found during grounding;
- a rigor level expressed as gates and artifacts, biased higher for difficult to
  reverse or broad-impact work;
- whether an internal migration must apply `principle-finish-the-migration`.

Present the framing and tradeoffs before a multi-hour run. Continue reversible
work under `principle-never-block-on-the-human`, but use one checkpoint before
starting that run.

## Phase B: Design The Workflow

Decompose the work into independently reviewable units. Apply
`principle-verifiable-units-of-work` and order the riskiest unknown first.

- Build the verification mechanism before implementation and capture a
  pre-change baseline so checks compare old and new behavior.
- For consequential design decisions, run `architect`, which uses `arena` for
  alternatives. Skip a second design contest after the design is settled unless
  new evidence invalidates it. Apply `principle-minimum-necessary-complexity`.
- Decide what can fan out. Parallelize only independent boundaries and isolate
  writes under `principle-separate-before-serializing-shared-state`.
- Give bounded implementation to the `implementation` role at `M` size, or the
  `complex-implementation` role at `L` size when the unit requires it. Resolve
  every assignment through `configure-models`.
- Write the phase list as a durable artifact for review.

Insert the designed units beneath Phase C and before Phase D. Run each under the
loop below. Append a decision-log row as each unit lands rather than
reconstructing the trail at the end.

## Phase C: Run The Loop

Treat each unit as an experiment:

1. State the hypothesis and predicate.
2. Make the smallest change that can test it.
3. Measure the real artifact against the predicate.
4. Keep the change if it advances the predicate. Revert it if it does not.
5. Verify the unit before beginning a dependent unit.

Inspect artifacts instead of accepting self-reports. A result that passes too
readily may expose a weak observation method. Blank or stale output is not proof.

Pair consequential delegated work with independent review at the `review` role
and `L` size, resolved through `configure-models`. The boss inspects the artifact
and owns the verdict. If a worker satisfies the wording but misses the outcome,
reset the unit and strengthen the contract. If the gate is wrong, correct it in
its own verified unit.

Every verdict is `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`. An inconclusive
result does not pass.

## Phase D: Keep The Audit Trail

Use `show-me-your-work` for one canonical TSV with a row per consequential
decision and completed unit. Point evidence to durable artifacts. This workflow
usually warrants committing the trail when a reviewer needs it to assess the
result. Prefer checks implemented as committed scripts.

Apply `principle-guard-the-context-window`: the boss retains goals, decisions,
dependencies, integration state, review findings, and verification evidence.
Delegates return bounded conclusions and artifact paths instead of raw payloads.

## Phase E: Verify And Hand Back

Check the integrated result against the Phase A predicate on the real product,
not only the verification mechanism. Encode recurring corrections as domain
constraints, checks, tests, or scripts using
`principle-encode-lessons-in-structure`.

## Completion

Reply with the designed playbook, rigor level and reason, decision-trail path,
what the boss verified against the predicate, and what remains open. The work is
complete only when every unit is accounted for, the integrated predicate has
been measured, and the audit trail resolves to durable evidence.
