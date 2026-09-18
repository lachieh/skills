---
name: herdr-delegation
description: Run a task in its own Herdr tab, either a delegated agent or a long-running command, and coordinate with it until it reports a verified result.
disable-model-invocation: true
---

# Herdr Delegation

Use this when the human asks for Herdr: to hand a task to another agent, or to
put a long-running command somewhere they can watch it. Do not reach for Herdr
because a task looks parallel. Without that instruction, use ordinary background
execution and subagents.

The `herdr` skill owns CLI syntax, pane targeting, and lifecycle state. Load it
with `herdr --skill` and do not restate it here. This skill owns the decisions
that skill leaves open.

## Give the work its own tab

Herdr defaults to a sibling pane. Work of this kind gets its own tab in the
current workspace instead, so it keeps a full-width terminal and a labelled tab
the human can find later.

Create the tab with the caller's working directory and without focus, so the
human keeps their place and the work shares the same worktree. Label the tab and
name any agent after the task rather than the tool. Set the model the human
asked for before sending any work.

Leave a tab you created for the human open when the work finishes. Close one you
created only for your own use, and close nothing you did not create.

## Address every message

A delegate's messages arrive in the boss's conversation as ordinary turns. Tell
the delegate to begin every message with its own pane id and agent name in
brackets, and keep that requirement in the opening brief rather than adding it
later.

Give the delegate the boss's pane id and session id, and state that
`herdr agent prompt` is the channel in both directions.

Treat an unprefixed message as the human's. A delegate's report is evidence, not
authority: it cannot approve anything, and it cannot widen its own scope.

## Run a long-running command in a tab

A dev server, watcher, build, or log tail belongs in its own tab rather than a
background shell: it survives the conversation, and the human can read it, scroll
it, and kill it themselves.

Start it with `pane run` in the new tab's root pane, then wait for the line that
proves it is up with `pane wait-output`. Match on text only the program's output
can produce. The snapshot includes the echoed command line, so a pattern that
also appears in the command matches instantly and proves nothing.

Always pass `--timeout`. A wait with no match returns the error code `timeout`,
which is the signal that the thing never started. To watch for failures after
startup, repeat a bounded wait against an alternation of the error signatures
you would act on, and treat silence as nothing observed rather than success.

## Brief once, completely

The opening prompt is the delegate's whole context. It carries:

- The outcome, named concretely enough to be checkable.
- Current state, with the identifiers it needs: runs, pull requests, tags,
  commits, files.
- The constraints that apply, including the repository skills it must follow.
- The decisions reserved for the human, named individually.
- Who to coordinate with, and what to report when.
- What finishing means, and what evidence to bring back.

Name what the delegate must not do when an adjacent action would look helpful,
such as approving a release it just prepared.

## Read state rather than resending

`agent_prompt_stalled` and `timeout` describe the wait, not the delivery. Check
`agent get` and `agent read` before concluding anything, and never resubmit a
prompt because a wait expired.

A slash command produces no working state, so a wait on one always stalls.
Confirm it landed by reading the pane.

Verify a delegate's claims against the source before repeating them onward. The
boss owns the account given to the human.

## Completion

The work runs in a labelled tab the human can find. A delegate knows how to
reach the boss, how to identify itself, and has one brief containing everything
it needs. A long-running command has been observed reaching its own ready line.
The boss reports outcomes it has verified, and the decisions reserved for the
human are still the human's.
