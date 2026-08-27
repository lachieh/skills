---
name: architect
description: Design and implement consequential module, API, state, ownership, or cross-system changes through grounded alternatives and verified delivery.
---

# Architect

Use Architect when jumping directly to code would commit a consequential design
before its consumer workflow, model, ownership, and boundaries are understood.

## Procedure

1. Define the user outcome, consumer workflow, and architectural decision.
2. Run `how` over each affected subsystem. Use its Critique branch when the
   existing structure is part of the problem.
3. Run `why` when historical rationale, incidents, compatibility, or product
   constraints could limit the design.
4. Write realistic consumer usage and acceptance criteria before designing the
   interface.
5. Read `references/design-package.md`, then use `arena` to compare two or three
   complete design packages.
6. Review the selected package with `references/design-review.md` and the
   applicable principles.
7. Run `interrogate` when the selected design is contested, security-sensitive,
   difficult to reverse, or consequential across systems.
8. Continue without a checkpoint unless the user requested one or a missing
   product decision belongs to them.
9. Divide implementation into `principle-verifiable-units-of-work` and assign one
   implementation owner. That owner may delegate bounded tasks beneath it.
10. Review every artifact and every deviation from the selected design.
11. When deviations expose a repeated missing constraint, return to design and
    rerun Arena instead of accumulating workarounds.
12. Independently verify the completed consumer workflow and important failure
    paths.

Design sketches are artifacts for comparison. Do not commit placeholder bodies,
dead scaffolds, or a repository state that does not work.

## Completion

The result matches one coherent design package or records why the design changed.
The consumer workflow, states, interfaces, ownership, boundaries, tradeoffs, and
verification are explicit. The final artifact works at the required boundary and
contains no placeholder architecture.
