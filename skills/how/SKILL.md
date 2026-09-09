---
name: how
description: Explain how a subsystem works, trace runtime and data flow, and identify current ownership and boundaries. Use interrogate for architectural review and why for historical rationale.
---

# How

Build the working mental model a senior engineer needs to change the subsystem.
Explain behavior from source rather than annotating files or inferring from
names.

## Procedure

1. Interpret the question and state the inferred scope. Resolve narrow ambiguity
   from context and let the user redirect.
2. Identify the likely trigger, result, and subsystem boundaries.
3. For a narrow question, delegate one read-only task to explore and draft the
   explanation in one pass using `references/synthesizer-prompt.md` and the
   `synthesis` role from `configure-models`.
4. For a cross-cutting question, delegate two to four distinct read-only angles
   in parallel using the `exploration` role and `references/explorer-prompt.md`.
   Reconcile their findings, then delegate a draft to the `synthesis` role with
   `references/synthesizer-prompt.md`.
5. Verify the draft's central claims against source and write the final
   explanation. Preserve unresolved connections.

Use a diagram when it makes component, state, or data flow easier to follow.
Route historical motivation to `why` rather than inferring it from current code.

For an architectural review, establish the relevant flow here, then pass its
source paths and intended behavior to `interrogate`. A request for explanation
alone does not trigger review.

## Completion

The explanation traces the requested behavior from trigger to result, identifies
the important state and decisions, cites exact code locations, and labels
unresolved connections.
