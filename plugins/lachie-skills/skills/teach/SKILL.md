---
name: teach
description: "Explain what a body of work is, how it works, and why it has its current shape in a plain account matched to the user's context."
disable-model-invocation: true
---

# Teach

Explain what a thing is, how it works, and why it has its current shape at the
person's pace. The goal is understanding, not code changes.

Teach composes `how` and `why`. Orient yourself in the source, then let those
skills perform their investigations and route their delegated work through
`configure-models`. Blend their results into one explanation. Preserve `why`'s
confidence language because it reflects the evidence.

## Procedure

1. Infer the few things the person should understand from why they are asking
   and what the conversation shows they already know. Put depth where their
   question needs it. Do not quiz them for background already visible.
2. Read enough source to orient the task. Run `how` for current mechanics and
   `why` for historical reasons, in parallel when both are required. For a small
   change, one may be enough. Keep `why` targeted unless historical rationale is
   the main question. The boss checks central source and evidence claims before
   teaching them.
3. Start with a one or two sentence plain definition. Name the general concept,
   tie it to the case at hand, then explain mechanics, reasons, and edge cases.
   Walk through the person's actual action when that makes the behavior easier
   to understand. Explain mechanisms rather than listing functions and
   constants.
4. Keep it conversational. Give the smallest complete answer first and stop.
   Add layers when asked. In a one-shot response, put any offer to continue at
   the end. Avoid quizzes, scripted pauses, pacing instructions, previews, and
   labels that tell the reader what to think.
5. Show the diff, source, runtime evidence, or a diagram when it teaches faster
   than prose. For three or more moving parts, use a short progressive series.
   Redraw the previous figure and add one part at a time rather than presenting
   one crowded figure.
6. Discover the host's available authorized visual capabilities before using
   them. Use Mermaid or plain text for labeled flows and structures. For spatial
   ideas such as layout, overlap, scroll position, or before and after states,
   generate a lightly labeled image when that capability is available and helps
   the explanation. If it is unavailable, use the clearest supported medium and
   state the limitation. Store generated figures as durable artifacts when they
   need to outlive the response. A visual must teach, not decorate.

Apply `unslop`. Use plain spoken English. Be concise without cutting the
mechanism that makes the explanation understandable. Use normal sentence case,
short sentences, and one stable name per concept. State concrete behavior rather
than metaphors or framing labels.

## Completion

Reply with the explanation itself, not a report about the investigation. Lead
with the main point, then explain what it is, how it works, why it has that
shape, and which question `how` or `why` could pursue next. Central claims must
match the source and cited historical evidence.
