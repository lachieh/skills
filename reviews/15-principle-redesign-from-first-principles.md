# Review 15: Redesign From First Principles

Status: approved and implemented

Source: `tmp/pstack/skills/principle-redesign-from-first-principles/SKILL.md`

Implementation: `.apm/skills/principle-redesign-from-first-principles/SKILL.md`

## Verdict

Keep this as the design principle for integrating new requirements into an
existing system.

## Approved concepts

- Treat a new requirement as part of the system's original premise.
- Reshape existing models, boundaries, APIs, and ownership around that premise.
- Express existing and new behavior through one coherent design.
- Remove structures that only preserve the pre-change shape.
- Judge the final design independently of its migration path.

## Boundaries

Fix the Latent Issue selects the problem. Model the Domain defines resulting
states and invariants. Subtract Before You Add removes superseded structure.
Outcome-Oriented Execution governs the transition, and Verifiable Units of Work
governs delivery.
