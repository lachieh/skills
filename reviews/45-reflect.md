# Review 45: Reflect

Status: approved and implemented

Source: upstream `reflect` workflow

Implementation: `.apm/skills/reflect/SKILL.md`

## Verdict

Keep the workflow substantially as-is with host and model adaptation. Retain
three independent review lenses, one synthesis pass, structural routing, and
explicit approval before skill edits.

## Approved adaptations

- Discover the active session through authorized runtime capabilities and fall
  back to a bounded digest.
- Remove fixed storage layouts and host-provided tool assumptions.
- Resolve every reviewer through `configure-models` with the `review` role at
  `L`, and the synthesizer with the `synthesis` role at `L`.
- Restrict delegated reviewers to read-only source and referenced context.
- Use `technical-writing` and `unslop` for substantive edits, description
  tuning, and new skills.
- Use `.agents/skills/` for new project-local and user-local artifacts.
- Apply `principle-encode-lessons-in-structure` before prose edits.
- Preserve automatic backlog routing, row-by-row approval, validation, and the
  final applied, created, filed, and rejected report.

## Completion contract

All three reviewers and the synthesizer are accounted for. Every lesson is
approved and applied, rejected with a reason, or routed to a structural backlog
item.
