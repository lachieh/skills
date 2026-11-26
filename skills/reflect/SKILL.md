---
name: reflect
description: Review the active session, named threads, or a period of work through three independent lenses and route durable lessons into approved skill, mode, or tooling changes.
disable-model-invocation: true
---

# Reflect

Mine a session, named threads, or a period of work for durable lessons, then
route each lesson to a specific skill edit or structural mechanism.

## When to use

Use Reflect only after an explicit request. Within that review, look for
reusable recipes, corrected dead ends, and workflows not yet captured. Skip
isolated incidents and behavior an invoked skill already described clearly.

## Procedure

### 1. Resolve the source

Reflect reads one of three sources. Use the one the human named, and the active
session when they named none.

- **The active session.** Prefer a structured active-session API or an
  authorized conversation export. Accept a supplied transcript path only when it
  belongs to the active workspace. Match the opening request or active session
  identity before use.
- **Named threads.** Read each one through the host's thread tools or its
  captured record, such as `atuin threads show`.
- **A period of work.** List the threads the human started in that period, in
  the workspaces they named or in all of them when they said so. Drop probes,
  evaluation runs, scheduled prompts, and messages another agent wrote. Build a
  digest of each message the human typed with the end of the agent turn before
  it. Split a large digest by project and run steps 2 and 3 once per part.
  Reviewers open the full record before classifying an ambiguous exchange.

Read only what the human scoped, and do not infer host storage paths. Session
records hold private names and credentials: keep digests and findings out of any
public repository.

If no source can be retrieved, write a compact digest containing the request,
decisions, corrections, tools used, evidence produced, and outcome. Use either
the resolved source or this digest for every reviewer.

### 2. Run three reviewers

Read the three reviewer prompts before delegation. Resolve each reviewer through
`configure-models` with the `review` role at `L`. Spread reviewers across the
configured review providers when available, then run all three concurrently
with the same session source.

| Lens | Prompt |
|---|---|
| Judgment | `references/judgment-reviewer.md` |
| Tooling | `references/tooling-reviewer.md` |
| Divergent | `references/divergent-reviewer.md` |

Give reviewers only the capabilities required to read the session, repository,
and referenced external context. External lookups remain read-only and limited
to identifiers present in the session. Reviewers return findings to the parent
and do not modify files, trackers, or source control.

Pass each prompt without weakening its criteria, substituting the common
session source or digest at the marked location. Account for all three outputs.

### 3. Synthesize

Resolve one `synthesis` worker at `L` through `configure-models`. Pass
`references/synthesizer.md` with all three complete reviewer outputs. The worker
may inspect the target skills and use authorized read-only context tools to
verify citations. It returns Accepted, Rejected, and Backlog sections in the
required format and makes no edits.

Across threads, a lesson seen in two or more is a rule. A lesson seen once is a
question to put to the human in step 5.

### 4. Enforce structurally

Apply `principle-encode-lessons-in-structure` to every Accepted item. Move an
item to Backlog when a type, API, static check, focused test, runtime invariant,
or automation can prevent recurrence more reliably than skill prose. Record the
suggested mechanism.

### 5. Obtain approval and apply

Present the complete Accepted, Rejected, and Backlog result before editing any
skill. Wait for explicit row-by-row approval of Accepted items. Lachie may
select a subset or change a route.

Backlog items that need a repository mechanism are `correct`'s work. File them
automatically in an authorized project tracker when one is available. Tracker submissions do not modify skills and do not wait for skill
edit approval. If no tracker capability is available, retain the items in the
final report.

Follow each approved Routing value:

- For a one-line correction to an existing skill, the parent edits it directly.
- For a working convention of Lachie's, edit `lachie-mode` where the repository
  authors it. Keep rules that new evidence does not contradict, and drop a
  preference that conflicts across threads until Lachie resolves it.
- For a substantive existing-skill edit, use `technical-writing`, apply
  `unslop`, and run a draft, validation, and revision loop.
- For `tune description: <skill path>`, revise through `technical-writing` and
  test representative positive and negative invocation examples.
- For `new skill: <kebab-name>`, create it where the repository authors skills:
  `.apm/skills/<kebab-name>/SKILL.md` in `lachie-skills` (then name it in
  `lachie-mode`), otherwise `.agents/skills/<kebab-name>/SKILL.md`, or the
  user-local `~/.agents/skills/` path when explicitly requested. Use
  `technical-writing` and `unslop` rather than inventing an unreviewed format.

Discover and run any SKILL.md validator exposed by the repository or host on
every touched skill. Verify every local reference resolves. Skip only when no
validator capability exists.

### 6. Report

Return a short list without a preamble:

- edits applied, with one line per skill path.
- new skills created, with one line per path.
- backlog items filed, with tracker references.
- rejected findings, with the synthesizer's reason.

## Completion

All three lens outputs and the synthesis are accounted for. Every model choice
was resolved through `configure-models`. No skill changed without explicit
approval. Applied edits pass available validation and reference checks. Every
remaining lesson appears in Rejected or Backlog with a reason and destination.
