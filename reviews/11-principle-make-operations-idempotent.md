# Review 11: Make Operations Idempotent

Status: approved and implemented

Source: `tmp/pstack/skills/principle-make-operations-idempotent/SKILL.md`

Implementation: `skills/principle-make-operations-idempotent/SKILL.md`

## Verdict

Keep this as the retry-safety principle for state-changing operations.

## Approved concepts

- Any operation that may be retried must be safe to retry.
- Reconcile current authoritative state toward a declared result.
- Recognize completed work and repair partial progress.
- Prevent repeated execution from duplicating effects.
- Measure success by resulting state rather than procedural steps.

## Boundaries

Shared-state separation governs concurrent actors. Idempotency governs repeated
execution of one operation. Verifiable Units of Work governs implementation and
delivery sequencing. Concrete locking, scheduling, cleanup, and idempotency-key
mechanics belong in procedures.
