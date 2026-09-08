# Worker brief

Every Swarm assignment must stand alone.

## Goal

State the result this slice must produce and how it contributes to the complete
matrix.

## Scope

Name the exact files, package, subsystem, query range, or coverage cells owned by
this worker. State what belongs to other workers.

## Dependencies and writes

Name required inputs and the isolated branch, worktree, or output path. The
worker must not write state owned by another slice.

## Verification

Give the checks and evidence required for this slice. A report without evidence
cannot receive `PASS`.

## Return

Return one status:

- `PASS`: the slice is complete and verified.
- `ISSUES`: the slice is complete enough to report specific findings.
- `BLOCKED`: the slice cannot complete, with the blocker and work attempted.

Include a concise result, evidence, artifact pointers, consequential findings,
and remaining gaps. Do not return raw command or file dumps.
