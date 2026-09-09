---
name: principle-guard-the-context-window
description: Apply when orchestrating delegated work or handling large inputs and outputs. Keep decisions and integration state in the main context while delegating detail.
---

# Guard the Context Window

Treat the orchestrator's context as constrained reasoning state. Keep goals,
decisions, dependencies, integration state, review findings, and verification
evidence in the main context. Delegate bounded exploration and implementation,
returning conclusions with file pointers instead of raw payloads. Store durable
detail in artifacts rather than conversation history. Delegate detail, never
ownership or judgment.
