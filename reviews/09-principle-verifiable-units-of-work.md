# Review 09: Verifiable Units of Work

Status: approved and implemented

Source: `tmp/pstack/skills/principle-sequence-verifiable-units/SKILL.md`

Implementation: `skills/principle-verifiable-units-of-work/SKILL.md`

## Verdict

Keep the source principle under the clearer name Verifiable Units of Work.
Preserve its strict sequencing rule without batch exceptions or a separate
escape clause.

## Approved concepts

- Sequence implementation and delivery into small, coherent units.
- Start each unit from a known-good state.
- End each unit in a verified working state before dependent work begins.
- Make commits and pull requests stand alone.
- Let delivery order demonstrate the change.
- Do not defer all verification until the end.

## Boundaries

TDD owns failing-before execution within a unit. The committed unit remains in a
verified working state. Repository procedures own concrete checks and commit
mechanics.
