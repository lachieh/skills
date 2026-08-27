---
name: principle-fix-the-latent-issue
description: Apply when a request or visible defect may be a downstream symptom. Choose the right problem from the user goal, then fix its causal mechanism.
---

# Fix the Latent Issue

Treat the visible issue as evidence, not necessarily the problem to solve.
Determine why it occurs, what the user is asking for, and which outcome they
need. Fix the underlying issue when it explains the symptom and better serves
that outcome. Trace the selected issue to the controllable mechanism that
violates an intended contract, and fix it there. A guard, retry, fallback,
cleanup, or reset is a fix only when it expresses intended behavior at that
layer; otherwise it is containment. Correct other instances only when evidence
shows they share the same mechanism.

Break this rule sooner than widen scope around an unproven theory. Fix the
visible issue when evidence does not support a deeper one. When the cause cannot
be controlled, contain the failure without presenting containment as resolution.
