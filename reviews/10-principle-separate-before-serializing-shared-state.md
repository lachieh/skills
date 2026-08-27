# Review 10: Separate Before Serializing Shared State

Status: approved and implemented

Source: `tmp/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md`

Implementation: `skills/principle-separate-before-serializing-shared-state/SKILL.md`

## Verdict

Keep this as the ownership principle for concurrent mutation.

## Approved concepts

- Identify shared mutable state before introducing concurrency.
- Prefer eliminating shared writes over coordinating them.
- Give each actor exclusive ownership of its writable state.
- Merge independent results at a read boundary.
- Serialize structurally when one shared state is essential.
- Do not treat instructions or conventions as concurrency control.

## Boundaries

Boundary discipline governs transitions between the domain and external
mechanisms. This principle governs ownership between concurrent actors. Concrete
locking and serialization techniques belong in procedures and implementation
references.
