# Lachieh voice research

Status: incorporated

Herdr agent: `wZ:p2`

OpenCode session: `ses_fbf3a8f73ffe4wQuLDJf1bs7cw`

## Access and sample

The read-only agent used the authenticated GitHub account `lachieh`. No
authorized Slack executable or integration was available, so it did not inspect
Slack or search for credentials.

The retained sample contained 25 public comments from February 2025 through
August 2026:

- 9 issue comments.
- 8 pull-request conversation comments.
- 7 inline reviews.
- 1 general review.

The sample covered 12 repositories under 10 owners or organizations, including
Microsoft, Tambo, Testing Library, Changesets, mise, Perses, Zod, and UnJS. The
agent excluded bots, templates, quotations, code-only comments, short
acknowledgements, and text that appeared generated.

## Findings

- Short verdicts alternate with longer causal explanations.
- Technical comments move through behavior, cause, recommendation, and next
  action.
- Correctness judgments are direct. Taste and preference are labeled and leave
  room for disagreement.
- Requests name the action and explain its impact. Requests to external
  maintainers are more cooperative than comments in owned work.
- Status updates state what happened, own the correction, and end with readiness
  or the next action.
- Technical explanations name the mechanism rather than only asserting a bug.
- Contractions, questions, parentheses, occasional enthusiasm, and sparse dry
  humor occur naturally.
- Endings usually contain an action, question, readiness statement, permission
  to disagree, or thanks.

## Public examples

- Direct scope control: [Tambo PR 3000](https://github.com/tambo-ai/tambo/pull/3000#issuecomment-5358448665).
- Direct correctness judgment: [Charming PR 4672](https://github.com/tambo-ai/charming/pull/4672#discussion_r3806119712).
- Preference labeled as preference: [Charming PR 4101](https://github.com/tambo-ai/charming/pull/4101#discussion_r3714809589).
- Permission to disagree: [Charming PR 4101](https://github.com/tambo-ai/charming/pull/4101#discussion_r3714818182).
- Cooperative external request: [mise-action issue 565](https://github.com/jdx/mise-action/issues/565#issuecomment-5040094463).
- Offer to contribute: [Changesets PR 1557](https://github.com/changesets/changesets/pull/1557#discussion_r1942271655).
- Mechanism-level explanation: [jest-dom issue 662](https://github.com/testing-library/jest-dom/issues/662#issuecomment-3198539281).
- Correction and readiness: [APM PR 2616](https://github.com/microsoft/apm/pull/2616#issuecomment-5396821185).

## Applied changes

The voice reference now covers confidence calibration, context-sensitive
directness, natural contractions and questions, occasional enthusiasm and humor,
and endings that state the decision or next action. The punctuation reference
now permits sparse exclamation marks for genuine thanks and readiness.

Slack-specific voice remains unmeasured.
