# Review 35: Create Verification Skill

Status: approved and implemented

Implementation: `skills/create-verification-skill/SKILL.md`

## Verdict

Keep the source workflow for generating and proving a repository-specific way
to drive real user behavior.

The user elected to keep the source workflow with host/model adaptation.

## Approved Changes

- Generate project-local skills under `.agents/skills/verify-<app>/`.
- Keep repository interview, launch, doctor, drive, evidence, cleanup, helpers,
  feature map, and end-to-end proof requirements.
- Preserve the feature-map reference and examples.
- Resolve authoring through `configure-models` with the `implementation` role at
  `M` size.
- Resolve independent execution through `configure-models` with the `review`
  role at `L` size.
- Make the boss own decomposition, generated-file review, integration, evidence
  inspection, and final claims.
