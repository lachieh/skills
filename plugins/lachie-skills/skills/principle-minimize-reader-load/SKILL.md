---
name: principle-minimize-reader-load
description: Apply when code is difficult to trace or requires hidden context. Minimize indirection and the mutable state a maintainer must remember.
---

# Minimize Reader Load

Optimize code for the reader who must answer where a value comes from, what can
change it, and which rule applies. Minimize indirection and hidden mutable state.
Every layer must compress complexity, enforce a boundary, or own a lifecycle.
Keep state local, derive values instead of synchronizing copies, and place each
invariant at one authoritative location.
