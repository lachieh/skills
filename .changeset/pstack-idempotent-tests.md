---
"lachie-skills": patch
---

`principle-make-operations-idempotent` requires a leftover lock, temporary file, or half-written record to be recognizable as stale wherever the previous run stopped. `correct` drops a test that still passes when the behavior breaks, or that fails when only the internals change.
