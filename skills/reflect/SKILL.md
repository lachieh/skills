---
name: reflect
description: Review the active session through three independent lenses and route durable lessons into approved skill or tooling changes.
disable-model-invocation: true
---

# Reflect

Mine the active session for durable lessons, then route each lesson to a
specific skill edit or structural mechanism.

## When to use

Use Reflect after an explicit request, after a complex task reveals a reusable
recipe, after a corrected dead end exposes a better path, or when an uncaptured
workflow emerges. Skip trivial sessions, isolated incidents, and behavior that
an invoked skill already described clearly.

## Procedure

### 1. Resolve the active session

Discover authorized session and conversation capabilities from the current host
at runtime. Prefer a structured active-session API or an authorized conversation
export. Accept an explicitly supplied transcript path only when it belongs to
the active workspace. Match the opening request or active session identity
before use. Do not infer host storage paths or search unrelated workspaces.

If no session source can be retrieved, write a compact digest containing the
request, decisions, corrections, tools used, evidence produced, and outcome.
Use either the resolved source or this digest for every reviewer.

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

### 4. Enforce structurally

Apply `principle-encode-lessons-in-structure` to every Accepted item. Move an
item to Backlog when a type, API, static check, focused test, runtime invariant,
or automation can prevent recurrence more reliably than skill prose. Record the
suggested mechanism.

### 5. Obtain approval and apply

Present the complete Accepted, Rejected, and Backlog result before editing any
skill. Wait for explicit row-by-row approval of Accepted items. Lachieh may
select a subset or change a route.

File Backlog items automatically in an authorized project tracker when one is
available. Tracker submissions do not modify skills and do not wait for skill
edit approval. If no tracker capability is available, retain the items in the
final report.

Follow each approved Routing value:

- For a one-line correction to an existing skill, the parent edits it directly.
- For a substantive existing-skill edit, use `technical-writing`, apply
  `unslop`, and run a draft, validation, and revision loop.
- For `tune description: <skill path>`, revise through `technical-writing` and
  test representative positive and negative invocation examples.
- For `new skill: <kebab-name>`, create the project artifact at
  `.agents/skills/<kebab-name>/SKILL.md`, or the equivalent user-local
  `~/.agents/skills/` path when explicitly requested. Use `technical-writing`
  and `unslop` rather than inventing an unreviewed format.

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
