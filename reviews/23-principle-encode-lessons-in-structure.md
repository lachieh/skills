# Review 23: Encode Lessons in Structure

Status: approved and implemented

Source: `tmp/pstack/skills/principle-encode-lessons-in-structure/SKILL.md`

Implementation: `skills/principle-encode-lessons-in-structure/SKILL.md`

## Verdict

Keep this as the principle for turning recurring corrections into prevention.

## Approved principle

When the same correction or instruction appears again, encode the lesson in a
mechanism that prevents recurrence. Put the guard at the earliest layer that can
enforce it, remove the text it replaces, and close the loop now.

## Supporting guidance

- Prefer domain and type construction, then APIs and schemas, static checks,
  tests and runtime invariants, automation, and finally judgment-based skills or
  text.
- Treat corrections, failed checks, and unexpected results as signals.
- Distinguish isolated events from recurring patterns.
- Route prevention to the layer that owns it.
- Implement the mechanism rather than merely recording the lesson.

## Boundaries

Fix the Latent Issue identifies the cause. Build the Lever automates current
work. This principle prevents recurrence. Model the Domain and Type System
Discipline provide the strongest structural prevention.
