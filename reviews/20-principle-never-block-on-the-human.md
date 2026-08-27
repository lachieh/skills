# Review 20: Never Block on the Human

Status: approved and implemented

Source: `tmp/pstack/skills/principle-never-block-on-the-human/SKILL.md`

Implementation: `skills/principle-never-block-on-the-human/SKILL.md`

## Verdict

Keep this as the autonomy principle and align it with the approved reversible
artifact policy.

## Approved concepts

- Proceed autonomously on reversible work within task scope.
- Infer intent from context and investigate observable facts directly.
- Make reasonable execution decisions without repeated permission.
- Produce the strongest reversible repository artifact available.
- Let the human review and course-correct asynchronously.
- Try alternatives before reporting a blocker.
- Ask when product direction is missing or an action crosses an external-impact
  boundary.

## Repository actions

Commits, task branches, pushes, and contextual pull-request creation or updates
are reversible task artifacts. Deployments, communication outside repository
workflows, destructive data operations, force-pushing shared branches, and
actions that are difficult to reverse require explicit authorization.

## Removed

Implementation cost does not determine autonomy; reversibility does. Self-healing
behavior belongs to idempotency and operational procedures.
