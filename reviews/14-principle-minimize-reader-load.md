# Review 14: Minimize Reader Load

Status: approved and implemented

Source: `tmp/pstack/skills/principle-minimize-reader-load/SKILL.md`

Implementation: `skills/principle-minimize-reader-load/SKILL.md`

## Verdict

Keep this as the maintainability principle for indirection and working memory.

## Approved concepts

- Minimize indirection between a question and its answer.
- Minimize hidden or mutable state a reader must remember.
- Require each layer to compress complexity, enforce a boundary, or own a
  lifecycle.
- Keep mutable state in the narrowest possible scope.
- Derive values rather than synchronizing copies.
- Place each invariant at one authoritative location.
- Make data origin and mutation ownership easy to identify.

## Boundaries

Minimum Necessary Complexity limits how much structure exists. This principle
governs how understandable that structure is. Boundary Discipline determines
when an adapter represents a real transition, and Model the Domain owns
authoritative representation.
