# Tester brief

Every tester assignment must stand alone.

## Goal

Cover the behavior the task's workers committed. Name the commit range and the
behavior the worker reported, and apply
`principle-test-behavior-not-implementation`.

## Scope

Write only test files and fixtures. When a test exposes a defect in the change,
do not fix product code: report it, and the foreman sends it to a worker.

## Shared worktree

Other subagents are committing in this worktree. Commit only the paths you
changed, by name. Never stage everything, stash, amend, rebase, or reset.

## Pause and resume

When told to pause, stop at the next clean point, leave uncommitted test files in
place, and report what is written, what passes, and what is left. When resumed
with a new commit range, reconcile those files with the new behavior before
continuing.

## Verification

Run the new tests and the existing tests for the touched surface. Show that each
new test fails against a plausible defect in the behavior it covers.

## Return

Return one status:

- `DONE`: the tests are committed and pass.
- `PAUSED`: stopped on request, with the state described above.
- `DEFECT`: the change does not behave as reported, with the failing test.
- `BLOCKED`: coverage cannot be finished, with the blocker and what was tried.

Include the commit hash, the tests added, and the command that runs them. Do not
return raw command or file dumps.
