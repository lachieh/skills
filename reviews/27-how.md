# Review 27: How

Status: approved and implemented

Source: `tmp/pstack/skills/how/SKILL.md`

Implementation: `skills/how/SKILL.md`

## Verdict

Keep Explain and Critique as explicit branches in one procedure. Critique depends
on the same architecture map and therefore earns a routed subpath rather than a
separate top-level skill.

## Branch contract

- Explain is the default for understanding current behavior.
- Critique fires only for explicit architecture judgment, placement, ownership,
  layering, or improvement questions.
- Critique always completes Explain first.
- Critique-only reviewer prompts and rubrics load only on that branch.

## Approved changes

- Delegate narrow and broad exploration to protect orchestrator context.
- Use configured exploration, synthesis, and review roles.
- Require structured findings and exact source pointers.
- Let a synthesis agent draft, then have the boss verify and own the final text.
- Route historical motivation to `why`.
- Verify critic findings against source and classify them through lead judgment.
