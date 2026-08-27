# Review 19: Guard the Context Window

Status: approved and implemented

Source: `tmp/pstack/skills/principle-guard-the-context-window/SKILL.md`

Implementation: `skills/principle-guard-the-context-window/SKILL.md`

## Verdict

Keep this as the information-allocation principle for the boss and orchestrator
model.

## Approved concepts

- Treat orchestrator context as constrained reasoning state.
- Keep goals, decisions, dependencies, integration state, review findings, and
  verification evidence in the main context.
- Delegate bounded exploration and implementation details.
- Return conclusions with file pointers instead of raw payloads.
- Store durable detail in repository artifacts rather than conversation history.
- Avoid repeated reads and information that cannot affect a decision.
- Delegate detail without delegating ownership or judgment.

## Procedural moves

File counts, turn budgets, and phase sizing belong in orchestration procedures.
Reference placement belongs in skill-authoring guidance. Compaction and handoff
mechanics belong in context-management procedures.

These moves are requirements for the later procedure reviews, not discarded
source content.
