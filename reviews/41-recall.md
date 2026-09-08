# Review 41: Recall

Status: approved and implemented

Implementation: `.apm/skills/recall/SKILL.md`

## Decision

The user elected to keep the source workflow with host/model adaptation.

## Adaptations

- Discover authorized session-record capabilities instead of assuming a storage
  product or path.
- Restrict session reading to the scoped active workspace.
- Route record exploration through `configure-models` with the `exploration`
  role at `S` size.
- Discover source-control and issue-tracker capabilities before live checks.
- Reuse `why` for shared project evidence and preserve its evidence rules.
- Keep raw records with bounded explorers while the boss verifies claims and
  writes the current-state brief.
- Preserve the source scope defaults, parallel mining, status tags, evidence
  citations, problem cap, and single next move.
