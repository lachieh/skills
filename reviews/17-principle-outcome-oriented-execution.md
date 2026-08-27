# Review 17: Outcome-Oriented Execution

Status: merged into `principle-finish-the-migration`

Source: `tmp/pstack/skills/principle-outcome-oriented-execution/SKILL.md`

## Decision

Do not add a separate skill. Its distinct contribution is resistance to
temporary compatibility code created only to keep an unfinished internal
migration usable. That rule now belongs to
`skills/principle-finish-the-migration/SKILL.md`.

The source permission for broken intermediate phases is not retained because
Verifiable Units of Work requires each unit to end in a verified working state.
