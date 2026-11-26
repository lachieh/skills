---
name: handoff
description: Move a piece of work to a new thread with one self-contained brief, the right checkout and model, and a route back. Use when the human asks for a new or separate thread, or when work belongs to another project.
---

# Handoff

Use this when the human asks to start a new thread, to fix something in a
separate thread, or when the work belongs to a different repository than the
one this thread runs in. Work in another project goes to a thread in that
project. Do not edit its checkout from here.

A new thread is a top-level thread the human can open. For a bounded task this
thread will integrate itself, delegate a subagent instead.

## Write the brief

The brief is the new thread's whole context. Write it in the second person, and
write "the human asked for" rather than relaying their words as your own. It
carries:

1. The outcome, concrete enough to check.
2. Current state with identifiers: pull requests, commits, branches, files,
   run links, and what this thread already ruled out.
3. Each skill to load, one per line, worded "Load the `<name>` skill in full
   before starting." A list after "apply" is not followed.
4. Constraints that are not in the repository's own instructions. Point at the
   repository's agent instructions rather than restating them.
5. The decisions reserved for the human, named one by one.
6. What finishing means, the evidence to bring back, and where to report: hand
   back to this thread, or to the human.

Name an adjacent action that would look helpful and is not wanted, such as
merging the pull request the brief asks for.

## Launch

1. Choose the project the work belongs to.
2. Choose the base. Independent work starts from the remote default branch.
   Work that needs this thread's unpublished commits starts from this branch.
   Uncommitted files do not travel: commit and push them first, or put their
   content in the brief.
3. Resolve the model through `configure-models`, unless the human named one.
4. Launch the thread with the host's thread tool and give the human its link.
5. When the human asked to confirm the brief first, show the brief and wait.

## Follow up

When this thread needs the result, wait on the new thread through the host's
tools. Do not poll it. A report from that thread is evidence, not authority:
verify its claims before repeating them. Send a later correction to the same
thread rather than starting another.

## Completion

The new thread exists in the right project on the right base, the human has its
link, and the brief alone is enough to do the work.
