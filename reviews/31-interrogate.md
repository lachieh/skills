# Review 31: Interrogate

Status: approved and implemented

Source: `tmp/pstack/skills/interrogate/SKILL.md`

Implementation: `.apm/skills/interrogate/SKILL.md`

## Verdict

Keep Interrogate as adversarial review for one concrete diff or artifact against
its stated intent.

## Approved changes

- Discover the repository base and fixed point.
- Pass source pointers and commit ranges rather than large inline diffs.
- Resolve one reviewer per configured provider at `L`.
- Give all reviewers the same intent and rubric.
- Require a reachable path, consequence, and source evidence.
- Weight findings by evidence rather than model count.
- Have the boss verify, deduplicate, classify, and own the verdict.
- Replace duplicated quality rules with lenses grounded in approved principles.
- Keep report-only review free of automatic edits.
- Remove hardcoded models, arbitrary file limits, and automatic config repairs.

## Boundary

How Critique reviews an existing subsystem. Arena compares competing artifacts.
Interrogate attacks one concrete change. The caller decides whether to apply
accepted findings.
