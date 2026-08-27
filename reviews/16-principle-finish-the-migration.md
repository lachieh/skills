# Review 16: Finish the Migration

Status: approved and implemented

Source: `tmp/pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md`

Implementation: `skills/principle-finish-the-migration/SKILL.md`

## Verdict

Keep the source concept under a shorter name. It defines completion for internal
migrations without concrete external or persisted compatibility requirements.

## Approved concepts

- A migration is incomplete while in-scope callers use the old contract.
- Remove the old API in the same migration.
- Remove compatibility adapters, legacy branches, obsolete tests, and stale
  documentation.
- Do not preserve dual paths for hypothetical consumers.
- Do not introduce compatibility paths solely to keep an unfinished internal
  migration usable.
- Verify the new contract rather than superseded behavior.

## Boundaries

Redesign From First Principles defines the target design. Subtract Before You
Add removes superseded structure. This principle defines migration completion.
Verifiable Units of Work governs delivery. Concrete external or persisted
consumers require an explicit compatibility design.
