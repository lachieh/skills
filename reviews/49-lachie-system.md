# Review 49: Lachie System

Status: approved and implemented

Implementations:

- `.apm/agents/lachie.agent.md`
- `.apm/skills/lachie-mode/SKILL.md`
- `.apm/skills/deslop/SKILL.md`
- `.apm/skills/shipit/SKILL.md`

## Contract

The main agent is the boss and delegates bounded implementation by default.
Principles govern decisions without requiring recitals. Procedures own their
workflows. Models resolve by role and size through `configure-models`.

Repository artifacts are autonomous and reversible. Deployment, communication
outside repository workflows, destructive operations, and difficult-to-reverse
actions require separate authorization. `shipit` is manual and authorizes the
repository lifecycle through merge, not deployment.

`deslop` and `no-comments` are automatic code quality gates. `unslop` and
`technical-writing` own prose quality.
