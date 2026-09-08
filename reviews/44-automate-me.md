# Review 44: Automate Me

Status: approved and implemented

Source: upstream `automate-me` workflow

Implementation: `.apm/skills/automate-me/SKILL.md`

## Verdict

Keep the workflow substantially as-is with host and model adaptation. Produce a
Lachie-oriented personal mode skill from repeated session evidence and direct
answers.

## Approved adaptations

- Discover authorized session capabilities at runtime and stay within the
  active workspace.
- Use project-local or user-local `.agents/skills/` paths.
- Default the personal artifact to `lachie-mode`.
- Resolve history miners through `configure-models` with the `exploration` role
  at `S`.
- Replace host-provided authoring assumptions with `technical-writing` and
  `unslop`.
- Route mechanically enforceable lessons through
  `principle-encode-lessons-in-structure`.
- Preserve update mode, structured questions, evidence clustering, iterative
  user review, and repository review workflow.

## Completion contract

Every mode rule comes from repeated scoped evidence or explicit instruction.
The selected artifact passes available skill validation, and no unrelated
session history is read.
