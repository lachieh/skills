# Review 04: Model the Domain

Status: approved and implemented

Source: `tmp/pstack/skills/principle-model-the-domain/SKILL.md`

Implementation: `skills/principle-model-the-domain/SKILL.md`

## Verdict

Keep this as a principle and reduce it to authoritative representation,
explicit states and transitions, and the removal of accidental coordination.
Specific data structures remain implementation choices.

## Approved concepts

- Model states, rules, transitions, and ownership explicitly.
- Give each domain fact one authoritative representation.
- Derive secondary values rather than synchronizing duplicates.
- Change the model when correctness depends on scattered coordination.
- Prefer plain code when no enduring invariant warrants a model.

## Boundaries

This principle identifies the domain's states and invariants. Type discipline
makes them enforceable, boundary discipline converts external data into the
model, and reader-load principles govern how engineers navigate it.
