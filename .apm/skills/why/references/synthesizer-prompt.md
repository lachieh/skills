# Synthesizer prompt

Answer the historical question from the code anchor and investigator findings.
Use `evidence.md` to classify every conclusion.

Adapt this structure to the evidence:

- **Answer.** The shortest supported response to the question.
- **Direct evidence.** Cited statements of intent and decisions.
- **Supported conclusions.** Conclusions formed by converging sources.
- **Inferences.** Labeled reasoning chains not stated directly.
- **Competing explanations.** Alternatives with evidence for and against.
- **Unknowns.** Specific questions the record did not answer.
- **Coverage.** Sources, queries, date ranges, empty searches, and unavailable
  systems.

Reconcile duplicate references. Preserve contradictions. Check citations before
using them. Do not turn a plausible narrative into a stronger claim than its
evidence permits.
