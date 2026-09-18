---
name: working-session
description: Run a live working session with Lachie, where the app runs in a Herdr tab and a headed browser, the human's changes come first, and coverage for those changes fills the gaps as background work.
disable-model-invocation: true
---

# Working Session

Use this when the human asks for a working session: they will watch the running
app, suggest changes as they go, and expect each change to land fast. Coverage
and tests for those changes are still owed, but never ahead of the next change.

## Set up the room

Put the dev server in its own Herdr tab and wait for its ready line, following
the long-running command procedure in `herdr-delegation`. Tell the human the tab
label and the address once it is up.

Open that address in a headed Agent Browser session the human can watch. Name
the session after the task, and pass the same launch flags on every call through
one wrapper script: a call that omits them makes the daemon relaunch the browser
headless, which the human sees as a window that flashes and disappears. Prove the
window is real before reporting it: the browser process carries no headless
flag, and its process id is unchanged across two consecutive commands. Bring the
window to the front.

Keep the app, the tab, and the browser running for the whole session. Close only
what you created, and only when the human ends the session.

## Keep two queues

Track the session in one task file with two queues and a done list. Report which
items moved whenever you report anything.

Queue A holds the human's changes. It always comes first. A new item in Queue A
stops whatever Queue B work is in progress, and Queue B resumes only when Queue
A is empty again.

Queue B holds coverage and tests for what Queue A changed. Every change that
lands in Queue A adds its coverage item to Queue B. Run Queue B items as
background subagents restricted to test files, with only their summaries
returning to the main context. When the change is uncommitted, run them in
place, one at a time, or make a WIP commit first so isolated workers can branch
from it; say which.

## Land each change

Make the change, verify it at the boundary the human is looking at (the browser
for a visible change, the touched surface's tests otherwise), and report in one
short message: what changed, how it was verified, and what moved between the
queues. Do not run the wider quality gates on every change; run them once Queue A
is empty, before declaring the session's work done.

## Completion

Both queues are empty, the repository checks are green, and the human has seen
each change in the running app. The dev server and browser are still up for the
human, and the task file records what landed.
