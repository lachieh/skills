# Review 12: Minimum Necessary Complexity

Status: approved and implemented

Source: `tmp/pstack/skills/principle-laziness-protocol/SKILL.md`

Implementation: `.apm/skills/principle-minimum-necessary-complexity/SKILL.md`

## Verdict

Keep the source concept under a name that states the constraint directly and
does not imply a procedure or reduced effort.

## Approved concepts

- Solve the right problem with the least additional complexity.
- Prefer deletion, reuse, and direct changes.
- Add no state, indirection, abstraction, configuration, or surface area that
  the observed outcome does not require.
- Measure simplicity by total maintenance burden rather than line count.
- Avoid speculative structure for unobserved future requirements.

## Boundaries

Fix the Latent Issue determines the right problem. Subtract Before You Add owns
deletion sequencing. Minimize Reader Load owns traceability and working memory.
Model the Domain permits structure that removes coordination or protects an
invariant.
