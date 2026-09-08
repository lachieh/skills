---
name: principle-boundary-discipline
description: Apply when code crosses trust, representation, ownership, or side-effect boundaries. Keep domain decisions in a pure core and infrastructure in thin adapters.
---

# Boundary Discipline

At every trust, representation, ownership, or side-effect boundary, convert
external input into domain values and domain results back into external forms.
Keep domain decisions in a pure core and infrastructure in thin adapters.
Validate once at ingress, rely on established invariants inside, and handle
errors where a meaningful decision is possible. Do not leak framework,
transport, or storage representations into the domain.

Break this rule sooner than introduce an adapter that changes nothing.
