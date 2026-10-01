# Worker brief

Every worker assignment must stand alone. Start from the task's description in
the task list.

## Goal

State the change the human asked for, as they would check it in the running app.
For a modification, name the earlier commits for the task and what the human
wants different.

## Scope

Name the files or area the change belongs to, and the tasks other workers are
running now. Do not edit tests; the task's tester owns them.

## Shared worktree

The dev server serves this worktree and the human is watching it. Commit only
the paths you changed, by name. Never stage everything, stash, amend, rebase, or
reset, and do not touch changes you did not make.

## Verification

Verify the change at the boundary the human sees: through the running app for a
visible change, otherwise with the touched surface's existing tests. Do not run
the wider quality gates.

## Return

Commit, then return one status:

- `DONE`: the change is committed and verified.
- `BLOCKED`: the change cannot be finished, with the blocker and what was tried.

Include the commit hash, the files changed, the evidence, and anything the tester
should know about the behavior to cover. Do not return raw command or file dumps.
