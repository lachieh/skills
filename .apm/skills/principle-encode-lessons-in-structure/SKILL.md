---
name: principle-encode-lessons-in-structure
description: Apply when the same correction or instruction appears again. Encode the lesson in a mechanism that prevents recurrence instead of relying on memory.
---

# Encode Lessons in Structure

When the same correction or instruction appears again, encode the lesson in a
mechanism that prevents recurrence. Put the guard at the earliest layer that can
enforce it, remove the text it replaces, and close the loop now.

## Choose the mechanism

Prefer prevention in this order:

1. A domain model or type construction that makes the failure impossible.
2. An API or schema that excludes the invalid operation.
3. Static analysis, lint, or a CI check.
4. A focused test or runtime invariant.
5. Automation or a canonical helper.
6. A skill or written instruction when the rule requires judgment.

## Close the loop

Every correction, failed check, and unexpected result is a signal. Determine
whether it is isolated or recurring, route it to the layer that owns prevention,
and implement the mechanism rather than merely recording the lesson.

`principle-fix-the-latent-issue` identifies the mechanism producing the failure.
`principle-build-the-lever` automates current work. This principle prevents a
learned failure from recurring. Domain modeling and type discipline provide the
strongest forms of prevention.
