# Review 36: Maintain Verification Skill

Status: approved and implemented

Implementation: `skills/maintain-verification-skill/SKILL.md`

## Verdict

Keep the source workflow for source-backed and live maintenance of a
project-local verification skill.

The user elected to keep the source workflow with host/model adaptation.

## Approved Changes

- Locate generated skills under `.agents/skills/verify-*/`.
- Keep the clean, changed, and blocked outcomes and strict edit scope.
- Keep one read-only source worker per feature and one coordinator-owned live
  pass across every feature.
- Resolve readers through `configure-models` with the `exploration` role at `S`
  size and corrections with the `implementation` role at `M` size.
- Make the boss own app driving, worker review, integration, re-proof, and the
  final outcome.
