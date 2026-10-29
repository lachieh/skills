---
name: working-session
description: Run a live working session with Lachie, where the main agent is a foreman that turns each request into a task, workers implement and commit it, testers add and commit its coverage, and the app runs in a T3 Code background command and preview tab.
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

Each task gets two kinds of subagent, started with T3 Code's `delegate_task` in
`async` mode on the shared checkout and titled after the task:

- `worker[X]` implements task X and commits the change. A modification to X
  after the worker finished gets a new worker, `worker[X]2`, and so on.
- `tester[X]` adds coverage for what the workers on X committed, and commits it.

Brief workers from `references/worker-brief.md` and testers from
`references/tester-brief.md`. Keep each subagent's `taskId` and child thread on
its task. Only their reports return to the foreman: follow the `next` each
delegate result gives, and never poll one with `task_status`, sleeps, or
watchers. When the human wants to watch a subagent, give them its thread link.

## Set up the room

Start the dev server as a background shell command in the session's worktree,
so it keeps running between turns. Do not hand it to `t3_background_wait`: the
session leaves it running, and that tool would hold the thread in Working. Wait
for the ready line in its output with a bounded Monitor until-loop, matching
text only the program's output can produce. Tell the human the address once the
ready line appears.

Open that address with `preview_open` so the human watches the app in a T3 Code
preview tab beside the conversation. Name the tab's purpose after the session in
your message, and keep its `tabId` for every later preview call. Prove the tab
is real before reporting it: `preview_status` shows that tab at the dev server's
address with loading finished.

Keep the app and the preview tab running for the whole session. Close only what
you created, and only when the human ends the session.

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
boundary the human is looking at (the preview tab, with `preview_snapshot`, for
a visible change), tell the
human in one short message, then start `tester[X]` and go back to waiting for the
human.

When the human asks to modify task X:

1. Tell `tester[X]`, if one is running, to pause, with `t3_thread_send` in
   `steer` mode to its child thread. It stops at the next clean point, leaves
   its uncommitted test files in place, and reports where it got to. Mark X
   `paused`.
2. Start `worker[X]2` with the modification and the commits already made for X.
3. When that worker reports its commit, resume the same `tester[X]` by sending
   the new commit range to its child thread with `t3_thread_send`, rather than
   starting a fresh delegate. Keep the `taskId` that send returns.

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
- Every `delegate_task` uses the shared checkout, never `isolation: "worktree"`.
- Before starting a worker, compare its likely files with every running
  worker's. When they overlap, queue the new task until the running one commits,
  and tell the human it is queued.

## End the session

When the human says the session is complete, wait for running workers and
testers to report, and `task_cancel` any the human dropped, then run the repository's quality gates once. Fix failures
through a worker, not by hand. Then push the session's branch and open a pull
request, writing the title and body with `technical-writing` and `unslop`.
Opening the pull request is the end. Do not merge it.

## Completion

Every task the human asked for is `done`, each with a worker commit and a tester
commit, or the human was told why a task stopped short. The repository checks
are green, the pull request is open, and the human has seen each change in the
running app. The dev server and preview tab are still up for the human.
