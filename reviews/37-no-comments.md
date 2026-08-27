# Review 37: No Comments

Status: approved and implemented

Implementation: `skills/no-comments/SKILL.md`

## Verdict

Keep the source workflow for independent comment deletion, strict exception
review, root-cause correction, and executable constraint encoding.

The user elected to keep the source workflow with host/model adaptation.

## Approved Changes

- Adapt the specialized reviewer into
  `skills/no-comments/references/comment-reviewer.md` so delegation is
  host-neutral.
- Keep the deletion exceptions, suppression audit, `MUST KILL` findings, rerun
  limit, and reporting requirements.
- Resolve the reviewer through `configure-models` with the `review` role at `L`
  size.
- Resolve accepted code changes through `configure-models` with the
  `implementation` role at `M` size.
- Reference approved root-cause, redesign, complexity, and proof principles.
- Make the boss own scope, report review, integration, verification, and final
  claims.
