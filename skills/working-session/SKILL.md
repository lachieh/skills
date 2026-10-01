---
name: working-session
description: Run a live working session with Lachie, where the main agent is a foreman that turns each request into a task, workers implement and commit it, testers add and commit its coverage, and the app runs in Herdr and a headed browser.
disable-model-invocation: true
---

# Working Session

Use this when the human asks for a working session: they will watch the running
app, ask for changes as they go, and expect each change to land fast. Coverage
for those changes is still owed, but never ahead of the next change.

## Roles

The main agent is the foreman. It talks to the human, owns the task list, starts
and stops subagents, verifies their reports, and keeps the room running. It does
not edit product code or tests itself, so its context stays free for the human.

Each task gets two kinds of background subagent, named after the task:

- `worker[X]` implements task X and commits the change. A modification to X
  after the worker finished gets a new worker, `worker[X]2`, and so on.
- `tester[X]` adds coverage for what the workers on X committed, and commits it.

Brief workers from `references/worker-brief.md` and testers from
`references/tester-brief.md`. Only their reports return to the foreman.

## Set up the room

Run the dev server in Herdr whether or not this session runs inside Herdr,
following the placement and long-running command procedures in
`herdr-delegation`. Inside Herdr it gets a new tab directly after the current
one. Outside Herdr it gets its own workspace rooted at the current worktree or
folder. Either way it keeps running between commands, and the human can find
and read it. Tell the human the tab or workspace label and the address once the
ready line appears.

Open that address in a headed Agent Browser session the human can watch. Name
the session after the task, and pass the same launch flags on every call through
one wrapper script: a call that omits them makes the daemon relaunch the browser
headless, which the human sees as a window that flashes and disappears. Prove the
window is real before reporting it: the browser process carries no headless
flag, and its process id is unchanged across two consecutive commands. Bring the
window to the front.

Keep the app, the Herdr tab or workspace, and the browser running for the whole
session. Close only what you created, and only when the human ends the session.

## Track every request as a task

Each request from the human becomes one task in the harness task list, or in a
session task file when the harness has none. Write the description so it can be
handed to a worker unchanged: the outcome the human asked for, the surface they
will look at, the files or area involved when known, and how to check it. A
request that changes an open task updates that task rather than adding a new one.

A task moves through these states, and the foreman reports which tasks moved
whenever it reports anything:

1. `queued`: it waits for a running worker that touches the same files.
2. `working`: a worker is implementing it.
3. `testing`: the worker's commit is in, and a tester is covering it.
4. `paused`: the tester stopped because the task is being modified.
5. `done`: the tester's commit is in and the foreman has verified it.

## Run the loop

When the human asks for something, add the task and start its worker straight
away in the background. Do not wait for other tasks to finish, and do not make
the human wait for anything but the answer they asked for.

When a worker reports a commit, read its evidence, check the change at the
boundary the human is looking at (the browser for a visible change), tell the
human in one short message, then start `tester[X]` and go back to waiting for the
human.

When the human asks to modify task X:

1. Tell `tester[X]`, if one is running, to pause. It stops at the next clean
   point, leaves its uncommitted test files in place, and reports where it got
   to. Mark X `paused`.
2. Start `worker[X]2` with the modification and the commits already made for X.
3. When that worker reports its commit, resume the same `tester[X]` with the new
   commit range, rather than starting a fresh one.

When a tester reports its commit, check that the tests ran and touch only test
files, then mark the task `done`. When it reports a defect in the change, handle
it as a modification to the task, and tell the human.

## Share one worktree safely

Every worker and tester works in the session's worktree, because that is what
the dev server serves and the human watches. Concurrent subagents keep out of
each other's way structurally:

- Each subagent commits only the paths it changed, by name. It never stages
  everything, stashes, amends, rebases, or resets.
- Testers write only test files and fixtures.
- Before starting a worker, compare its likely files with every running
  worker's. When they overlap, queue the new task until the running one commits,
  and tell the human it is queued.

## End the session

When the human says the session is complete, wait for running workers and
testers to report, then run the repository's quality gates once. Fix failures
through a worker, not by hand. Then open a pull request for the session's
branch: follow the commit and pull-request steps of `shipit`, write the title
and body with `technical-writing` and `unslop`, and apply the relevant
`principle-*` skills to what the branch contains. Opening the pull request is
the end; do not merge it.

## Completion

Every task the human asked for is `done`, each with a worker commit and a tester
commit, or the human was told why a task stopped short. The repository checks
are green, the pull request is open, and the human has seen each change in the
running app. The dev server and browser are still up for the human.
