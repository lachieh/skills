---
name: blast-radius
description: Find what a change could break outside its diff and prove the central safety fact by running real code.
disable-model-invocation: true
---

# Blast Radius

Find what a change breaks somewhere else before it ships. Use for "blast radius
of X," "what could this break," or reviewing a small diff that is not yet
trusted.

This skill complements `how` and `why`. `how` explains what the code does. `why`
explains why it has its current shape. Blast Radius identifies what a change can
break elsewhere.

Listing callers is not the job. A source search can do that quickly. The job is
the breakage a direct search does not expose.

The boss owns scope, decomposition, risk synthesis, integration, and the final
claim. Delegate bounded source inspection by default, but verify every central
claim against source or execution before accepting it.

## Prove, Do Not Merely Describe

A plausible blast-radius writeup does not establish safety. Find the one or two
facts the assessment depends on and prove them by running code. Words are the
starting point, not the delivered evidence.

### Confidence Ladder

For each fact the change's safety depends on, reach the strongest inexpensive
level and report where the evidence stopped.

1. The report asserts it. This has no value by itself.
2. The report cites the exact `file:line` or the dependency's own source.
3. The failure path is traced step by step and shown to be unreachable.
4. A script or test runs the real code and fails clearly if the fact is false.
5. The behavior is reproduced in the running application.

Any central safety fact that does not reach level 4 remains unproven. Level 4 is
often one small script that imports the dependency version the application ships
and calls the exact function under review.

## Steps

1. Read the change, including the diff, added, changed, and deleted symbols, and
   the behavior that now differs. Use `why` when pull requests, commits, or
   historical constraints matter.
2. Define the complete investigation and assign independent source-reading
   slices when useful. Resolve the `exploration` role at `S` size through
   `configure-models`. The boss retains the cross-cutting risk model and checks
   worker citations.
3. Find the central safety fact. Most changes that look risky are safe because a
   small number of facts hold. State each fact precisely and use it to eliminate
   irrelevant possibilities.
4. Look where direct search stops. Read dependency source, its pinned version,
   and local patches. Determine execution order such as tasks, unmount, and
   teardown. Follow indirect contracts such as API JSON, database columns, wire
   formats, other languages reading the same bytes, feature flags, and code
   several calls downstream.
5. Assess each risk by its reachable path, probability, and consequence. Keep
   confirmed risks separate from cases checked and cleared. Cite exact
   locations, preserve searches with no result as evidence, and do not invent a
   caller or API.
6. Prove the central safety fact. When proof requires a bounded script or test,
   resolve the `implementation` role at `M` size through `configure-models` and
   delegate one owner by default. Run the real code and retain the output. Mark
   facts that cannot be proved at reasonable cost as unproven.
7. For a broad or consequential change, use `arena` so independent candidates
   investigate the same question. The boss compares their evidence and owns the
   merged result.
8. Independently inspect the proof and apply `principle-prove-it-works` before
   making the final safety claim.

## What To Return

- **What it does.** State what changed, including behavior not clear from the
  diff.
- **Central safety fact.** State the fact, confidence level, and proof. Write
  `unproven` when the evidence does not establish it.
- **Risks.** Include only supported risks. For each, name the failure path,
  `file:line`, probability, consequence, and verification method.
- **Cleared.** State what was checked and why it is safe.
- **Before merge.** Give the least costly test or reproduction that catches the
  material failure, including any proof script created.

Write the result through `unslop`, cite real code, and remove private material
before publishing it.
