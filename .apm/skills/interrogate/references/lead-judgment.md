# Lead judgment

Reviewers are adversarial and context-limited. The boss verifies, filters, and
decides rather than counting votes.

## Act on

A source-backed correctness, security, data, or consequential maintenance
problem within the stated intent. The finding blocks the artifact in its current
form.

## Consider

A real issue whose benefit may not justify the correction cost in the current
scope. State the tradeoff the user must decide.

## Noted

A valid observation with no current action. Keep it only when it affects future
work or explains a constraint.

## Dismissed

A finding contradicted by source, prevented by types or validation, outside the
stated scope, purely stylistic, or based on an unreachable path. State the reason
briefly so the user can override the judgment.

Model agreement affects priority, not truth. A single reviewer can find a real
security or correctness defect. Several reviewers can share the same mistaken
assumption. Verify the path and consequence.
