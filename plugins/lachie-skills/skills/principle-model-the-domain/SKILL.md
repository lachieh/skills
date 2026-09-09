---
name: principle-model-the-domain
description: Apply when states, rules, transitions, or ownership are repeated across fields, branches, callers, or files. Give each domain fact one authoritative representation and derive the rest.
---

# Model the Domain

Make the code's structure match the problem's states, rules, and transitions.
Give each domain fact one authoritative representation and derive the rest. If
correctness depends on flags, fields, branches, or callers staying in sync,
change the model. Prefer plain code when no enduring invariant warrants a model.

Break this rule sooner than introduce a model that adds indirection without
removing coordination.
