# Review 30: Swarm

Status: approved and implemented

Source: `tmp/pstack/skills/swarm/SKILL.md`

Implementation: `skills/swarm/SKILL.md`

## Verdict

Keep Swarm for independent slices and coverage. Arena owns same-artifact races,
selection, and synthesis.

## Approved changes

- Define the complete matrix before fan-out.
- Give every item one independent owner and every worker an isolated output.
- Detect dependencies and shared writes before launch.
- Use configured model roles and sizes.
- Require evidenced status reports and artifact pointers.
- Reassign required slices that drop out or mark coverage blocked.
- Keep raw worker detail out of the boss context.
- Have the boss inspect consequential outputs and retain integration ownership.
- Remove cloud-specific fields, branch assumptions, and race modes.
