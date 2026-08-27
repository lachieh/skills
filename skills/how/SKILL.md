---
name: how
description: Explain how a subsystem works, trace runtime and data flow, answer ownership questions, or critique an architecture after establishing how it works.
---

# How

Build the working mental model a senior engineer needs to change the subsystem.
Explain behavior from source rather than annotating files or inferring from
names.

## Choose the branch

- **Explain** is the default for walkthroughs, runtime traces, component maps,
  and questions about how code works.
- **Critique** applies when the user asks for architectural problems,
  improvements, placement, ownership, layering, or whether the design is right.

Critique includes Explain. A request for understanding does not trigger Critique.

## Explain

1. Interpret the question and state the inferred scope. Resolve narrow ambiguity
   from context and let the user redirect.
2. Identify the likely trigger, result, and subsystem boundaries.
3. Delegate one exploration task for a narrow question. For a cross-cutting
   question, delegate two to four distinct angles in parallel. Use the
   `exploration` role from `configure-models` and
   `references/explorer-prompt.md`.
4. Require each explorer to return components, execution and data flow, files
   read, boundaries, surprising behavior, and unresolved connections.
5. Reconcile overlap and check contradictions against source.
6. Delegate a draft to the `synthesis` role with
   `references/synthesizer-prompt.md`.
7. Review the draft, verify its central claims, and write the final explanation.

Use a diagram when it makes component, state, or data flow easier to follow.
Route historical motivation to `why` rather than inferring it from current code.

## Critique

1. Complete Explain first.
2. Read `references/critic-prompt.md` and `references/critique-rubric.md`.
3. Resolve the `review` role through `configure-models` at its default `L` size
   for each configured review provider. Give each critic the explanation and
   exact source paths. Critics form judgments from source rather than treating
   the explanation as authority.
4. Verify every finding against the code.
5. Classify findings as **act on**, **consider**, **noted**, or **dismissed**.
6. Present the explanation first and the critique second so either part stands
   on its own.

## Completion

Explain traces the requested behavior from trigger to result, identifies the
important state and decisions, cites exact code locations, and labels unresolved
connections. Critique adds only source-backed findings with a concrete cost.
