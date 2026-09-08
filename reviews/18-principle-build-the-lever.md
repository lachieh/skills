# Review 18: Build the Lever

Status: approved and implemented

Source: `tmp/pstack/skills/principle-build-the-lever/SKILL.md`

Implementation: `.apm/skills/principle-build-the-lever/SKILL.md`

## Verdict

Keep the principle with a narrower trigger than the source. Tooling must
materially improve throughput, consistency, or proof.

## Approved concepts

- Automate repetitive or error-prone work.
- Build a deterministic tool when work must be rerun or audited.
- Make the tool safe to rerun.
- Make the tool easier to inspect than the manual work it replaces.
- Treat the tool as an implementation and verification artifact.
- Prefer one deterministic transformation over many hand-applied edits.

## Boundaries

Build the Lever automates current work. Encode Lessons in Structure prevents
recurring mistakes. Make Operations Idempotent governs safe reruns. Prove It
Works governs evidence. Minimum Necessary Complexity keeps the tool smaller than
the problem.
