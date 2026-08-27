# Review 07: Type System Discipline

Status: approved and implemented

Source: `tmp/pstack/skills/principle-type-system-discipline/SKILL.md`

Implementation: `skills/principle-type-system-discipline/SKILL.md`

## Verdict

Keep the language-independent principle and move syntax, examples, and
language-specific patterns to specialist skills.

## Approved concepts

- Encode facts that correctness depends on in the type system.
- Construct valid values instead of repeatedly repairing broad ones.
- Model variants explicitly and handle them exhaustively.
- Derive types from authoritative schemas.
- Treat casts and non-null assertions as proof obligations.
- Add precision only when it removes a real invalid state or partial operation.

## Boundaries

Domain modeling identifies states and invariants. Type discipline makes selected
invariants compiler-enforced. Boundary discipline establishes facts about
external values. Language-specific skills own syntax and patterns.

The principle applies when a static type system already exists. It does not
require converting small scripts or dependency-free tools to a typed language.
