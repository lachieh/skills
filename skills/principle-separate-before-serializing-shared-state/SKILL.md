---
name: principle-separate-before-serializing-shared-state
description: Apply when concurrent actors may write the same state. Remove shared mutation first; serialize structurally only when one shared state is essential.
---

# Separate Before Serializing Shared State

Before coordinating concurrent writes, remove shared mutation. Give each actor
exclusive ownership of its writable state and merge independent results at a
read boundary. When one shared state is essential, enforce a single writer or
serialization structurally. Instructions to take turns are not concurrency
control.
