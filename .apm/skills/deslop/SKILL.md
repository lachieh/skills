---
name: deslop
description: Review a code diff before commit or review and remove unnecessary complexity, generated boilerplate, duplication, and unsupported compatibility without changing intended behavior.
---

# Deslop

Apply this quality gate to the final code diff before commit or review.

## Procedure

1. Establish the intended behavior and inspect the complete diff against its
   repository base.
2. Read the surrounding code and repository conventions before changing the
   diff.
3. Apply the relevant principles, especially Minimum Necessary Complexity,
   Subtract Before You Add, Minimize Reader Load, Model the Domain, Boundary
   Discipline, and Type System Discipline.
4. Remove dead code, duplicate rules, speculative branches, unnecessary options,
   pass-through layers, redundant state, unsupported compatibility, and verbose
   boilerplate.
5. Reuse existing repository mechanisms when they already own the behavior.
6. Keep abstractions that hide real policy, enforce a boundary, or own a
   lifecycle. Do not flatten structure merely to reduce lines.
7. Preserve the intended behavior. Keep unrelated cleanup out of the diff.
8. Run focused checks after each correction and the repository-required checks at
   the end.
9. Inspect the final diff and report what was removed or simplified with the
   evidence that behavior remains correct.

`no-comments` separately reviews comments. `unslop` separately reviews prose.

## Completion

Every remaining addition is required by observed behavior, repository policy, or
a real boundary. The final diff is smaller or clearer without changing intent,
and relevant checks and behavior verification pass.
