# Review 24: Configure Models

Status: approved and implemented

Source: `tmp/pstack/skills/setup-pstack/SKILL.md`

Implementation: `skills/configure-models/SKILL.md`

## Verdict

Keep the procedure and replace pstack's Cursor-specific paths, roles, and model
defaults with a provider-aware size matrix and one role vocabulary.

## Approved procedure

1. Detect the host, active provider, and available concrete models.
2. Load existing configuration.
3. Map `S`, `M`, `L`, and `XL` for each available provider.
4. Map agent roles to sizes.
5. Ask only about missing or ambiguous choices and requested overrides.
6. Validate every concrete model against the detected catalog.
7. Write the full configuration atomically and idempotently.
8. Resolve every role and cross-provider reviewer once.

## Configuration contract

The host-neutral configuration lives at `~/.config/lachieh/models.yaml`. Skills
request a role and may override its default size or provider. The role defines
the job contract, while the explicit size indexes the selected provider matrix.
A model may fill several sizes when a provider has fewer useful tiers. Missing
providers are omitted, and degraded cross-provider review is reported.

## Removed

- Cursor rules and `alwaysApply` metadata.
- Repeated concrete defaults in skills.
- Skill-specific role names.
- Hardcoded panel model lists.
- The unrelated verification-skill offer.
