---
name: recall
description: "Reconstruct recent working context from authorized session records, live state, and shared project evidence, then return a compact current-state brief."
disable-model-invocation: true
---

# Recall

Before starting or resuming work, reconstruct the user's recent context and
return a compact account of where the work stands and what should happen next.

Keep the search scoped. Delegate heavy record reading while the boss retains
only findings, artifact pointers, conflicts, and the final brief.

Context comes from two records. Authorized session records show what this agent
and the user did and decided. Shared project evidence contains activity around
the same code, including reports, fixes, reversions, incidents, source history,
issues, documents, and error tracking. Use `why` to investigate that shared
record rather than reconstructing history from session records alone.

## Procedure

1. Classify the request. Recall combines recent context across sessions before
   work resumes. For one known session, use the host's authorized resume
   capability when available instead of mining a corpus. Turning repeated work
   into automation or writing a human-readable activity summary is a different
   workflow. If the user already supplied a complete current-state capsule, use
   it and skip record mining.
2. Lock the scope. State the time window, named topic, and workspace. Default to
   the active workspace and the last seven days. Preserve an explicit request
   for all available history rather than silently narrowing it.
3. Discover the current host's capabilities for authorized session discovery
   and reading. Use only records belonging to the scoped workspace. Exclude the
   current session and records identified by the host as delegated, evaluation,
   or test runs. Do not guess storage paths or inspect unrelated records. Record
   unavailable capabilities as coverage limits.
4. For one or two candidate sessions, search directly. For a larger corpus,
   divide it into independent time or record slices and delegate them in
   parallel. Resolve the `exploration` role at `S` size through
   `configure-models`.
5. Give every explorer the same topic terms and schema. Order candidates by
   observed modification time rather than identifier. Search for the topic
   first, read only relevant regions, and return one block per session with:
   topic, user goal, decisions, open threads, struggles and corrections,
   artifacts, and the host's stable session identifier. Raw records remain with
   the explorers.
6. When the request names a feature, file, subsystem, area, or bug, run `why` in
   parallel with session mining. Ask it for current state, attempts that did not
   hold, and reports that remain open. Reuse its source investigators and
   evidence rules. Searches with no result and unavailable authorized sources
   remain findings. Skip this sweep only for activity recall with no named
   target.
7. Verify mined claims against live state. Discover and use the repository's
   available source-control and issue-tracker capabilities. Check branches,
   commits, pull requests, issues, and artifacts that the search surfaced. When
   the answer depends on exact agent actions, inspect the complete authorized
   session record rather than relying on an excerpt.
8. Have the boss reconcile conflicts, verify central claims, and write the brief
   below. Delegated summaries are leads, not final evidence.

## Output Contract

Lead with the capsule, then threads, problems, and next move.

- **Capsule.** At most five bullets describing the work and its overall state.
- **Threads.** One line each, prefixed with exactly one status tag:
  `[merged #N]`, `[open PR #N]`, `[in flight <branch>]`,
  `[verified, uncommitted]`, `[reverted #N]`, or
  `[planned, not started]`.
- **Problems.** At most five recurring problems. Include continuing reports and
  any fix that shipped and was reverted.
- **Next move.** The single most useful concrete action.

Exclude adjacent work unless it blocks the named topic. Cut detail before
cutting thread coverage. Apply `unslop`, cite session findings by stable host
identifier, cite shared evidence by its source identifier or link, and remove
private context from public output.

## Completion

Reply with the brief in the output contract. Every central current-state claim
must be checked against live evidence or labeled with its coverage limit. The
boss owns the synthesis and next-action judgment.
