---
name: principle-make-operations-idempotent
description: Apply to operations that may be retried after partial execution. Reconcile current state toward the declared result without duplicating effects.
---

# Make Operations Idempotent

Any operation that may be retried must be safe to retry. Drive from current
authoritative state toward a declared result, recognizing work already complete
and repairing partial progress. Repeated execution must not duplicate effects or
depend on where a prior attempt stopped. Success means the desired state exists,
not that every step ran.

Anything a run leaves behind, such as a lock, a temporary file, a
half-written record, or a claimed job, must be recognizable as stale by the
next run. Judge staleness by evidence that holds wherever the last run could
have stopped, not only in the common case. For example, write to a temporary
path and rename it into place, or compare artifacts by content instead of by
creation order.
