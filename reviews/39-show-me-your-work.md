# Review 39: Show Me Your Work

Status: approved and implemented

Implementation: `.apm/skills/show-me-your-work/SKILL.md`

## Decision

The user elected to keep the source workflow with host/model adaptation.

## Adaptations

- Discover authorized session records through current host capabilities.
- Keep session access within the active workspace and current run.
- Resolve independent review through `configure-models` with the `review` role
  at `L` size.
- Prefer a different configured provider and report when that independence is
  unavailable.
- Keep final review judgment with the boss.
- Preserve the TSV template, safe append helper, evidence audit, attention
  report, and append-only completion criteria.
