# Synthesizer prompt

For a narrow question, trace the source from trigger to result and draft the
explanation in one pass. For a cross-cutting question, draft from the original
question and explorer findings. Resolve overlap, and check source when findings
conflict. Do not turn an unresolved connection into a claim.

Adapt these sections to the question:

- **Overview.** What the subsystem does and the scope of the explanation.
- **Key concepts.** The few types and components required to follow the flow.
- **How it works.** The trigger, ordered execution, state and data changes,
  decisions, side effects, and result.
- **Code map.** The files and symbols needed to begin work.
- **Surprises.** Behavior a new maintainer could misread.
- **Unresolved.** Connections the evidence did not establish.

Use exact source pointers. Include a diagram only when it explains a relationship
more clearly than prose.
