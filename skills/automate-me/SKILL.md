---
name: automate-me
description: Turn Lachieh's working conventions into a personal mode skill or refresh the existing one.
disable-model-invocation: true
---

# Automate Me

Turn recurring working conventions into one concise `lachieh-mode` skill. Mine
available evidence, ask for intent, draft the skill, and let Lachieh approve the
result.

## Procedure

### 1. Find the current mode

Search project-local `.agents/skills/` and user-local `~/.agents/skills/`
recursively for `lachieh-mode/SKILL.md`. Preserve an existing category and path.
When a skill exists, confirm whether to update it or start again unless the
request already decides that.

For an update:

- Determine the last edit from source control when tracked, otherwise from file
  metadata.
- Gather newer evidence only.
- Ask what is missing or changed.
- Preserve rules that new evidence does not contradict.

Starting again is exceptional. Ask what the current skill gets wrong before
replacing it.

### 2. Gather session evidence

Discover the host's authorized current-session and workspace-history
capabilities at runtime. Use an exposed session API, conversation export, or
explicitly supplied path only when it is scoped to the active workspace. Do not
infer hidden storage locations or search unrelated workspaces. If no history
capability is available, use the current conversation and state that the
evidence set is limited.

Survey the last two to four weeks, or the period since the existing skill was
edited. Divide available history into three independent time slices. Resolve an
`exploration` worker at `S` through `configure-models` for each slice and run the
workers concurrently when the host supports it. Each worker returns a short
list with evidence pointers for:

- response length, tone, format, and corrections.
- delegation, parallelism, and specialist use.
- verification standards and the meaning of done.
- code and prose conventions.
- source-control, review, and delivery practices.
- changes to skills or agent behavior made during tasks.

Elevate patterns seen in at least two slices. Treat a single occurrence as a
question to verify rather than a rule.

### 3. Ask for intent

Use the host's structured question capability when available. Ask one broad
multiple-selection question with four to six relevant areas, then one focused
question about the selected areas. Finish with one free-form question for
anything the choices missed. In update mode, ask about changes and omissions.

### 4. Cluster and filter

Combine session evidence and direct answers into only the sections that have
specific rules. Typical sections are response style, autonomy, investigation,
delegation, code and prose, review and verification, process, and skill
maintenance.

Apply `principle-encode-lessons-in-structure`. Keep judgment-based conventions
in the mode skill. Route a recurring mechanical correction to a type, API,
check, test, or automation proposal instead of relying on prose alone.

### 5. Draft the skill

For a new project skill, write `.agents/skills/lachieh-mode/SKILL.md`. Use
`~/.agents/skills/lachieh-mode/SKILL.md` only when Lachieh chooses a user-local
skill. Preserve the current location during updates.

Draft with `technical-writing`, then apply `unslop` to every line. Use this
frontmatter contract:

- `name: lachieh-mode`.
- a one-scalar description naming Lachieh and the purpose of working in
  Lachieh's style.
- `disable-model-invocation: true`, unless Lachieh explicitly requests automatic
  invocation.

Keep the body operational. Refer to other skills and principles by name rather
than copying them. Add a section only when it changes agent behavior. Use "the
user" or "the human" in reusable imperatives while retaining Lachieh in the
skill identity and invocation description.

### 6. Review and revise

Show the complete draft and ask whether it reads like Lachieh, misses a durable
rule, or overstates a weak pattern. Revise until every retained rule is supported
by repeated evidence or explicit instruction. Sparse output is valid.

### 7. Validate

Discover and run the repository or host validator for `SKILL.md` files when one
is available. Parse frontmatter, verify every local reference, and confirm every
named production skill exists. Treat a validator failure as a blocked artifact
and correct it before publication.

### 8. Publish

For a project-local artifact, discover the repository's base branch and review
workflow. When supported, use an isolated worktree, commit the skill on a task
branch, and open a review request rather than writing directly to the base
branch. For a user-local artifact outside source control, show the final diff and
obtain approval before replacing the file.

## Guardrails

- Preserve user intent over inferred patterns.
- Drop preferences that conflict across sessions until Lachieh resolves them.
- Keep references as pointers and maintain one source of truth.
- Omit default advice that does not change behavior.
- Keep uneven section depth when the evidence is uneven.

## Completion

The selected `lachieh-mode` path contains a valid, reviewed skill. Every rule is
backed by repeated scoped evidence or explicit instruction, every model choice
was resolved through `configure-models`, mechanical lessons were routed to a
stronger mechanism where applicable, and no unrelated session data was read.
