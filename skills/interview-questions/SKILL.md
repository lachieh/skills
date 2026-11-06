---
name: interview-questions
description: Build a repo-grounded interview question library with architect, PM, and CEO variants for team practice before technical or acquisition-style interviews.
---

# Interview Questions

Turn the target repository's current implementation and public description into
a shared practice library. Focus on team know-how, hard decisions, footguns, and
open questions an interviewer could probe.

## Ground the questions

Use the supplied repository path, or the current workspace when none is given.
Accept an optional public description, audience, and participant roles. Use
available context rather than requiring those inputs to begin.

1. Read repository instructions, structure, README, and package or build entry
   points. Record the revision and any relevant uncommitted changes so the
   library states which implementation it describes.
2. Trace the key modules and boundaries that support the product's claims.
   Inspect the relevant code, tests, configuration, and failure paths. Follow
   security, auth, hosting, and agent decisions where they exist. A README alone
   is insufficient evidence for implementation behavior.
3. Read the supplied public description alongside the repo's own description.
   If it is a URL, retrieve it with available authorized tools and record the
   source and access date. If unavailable, state the gap and continue from local
   evidence. Distinguish public claims, observed implementation, and inference.
   Treat mismatches as interview topics rather than silently reconciling them.
4. Select themes supported by the evidence. For each, identify the actual choice,
   an edge case or failure mode, and a tradeoff or unresolved decision. Ask why a
   choice was made without inventing its historical rationale. Identify owners
   from supplied context or explicit repository evidence. Otherwise mark the
   owner as unconfirmed.

Security and auth insight can lead when supported. Relevant themes may include
explicit access and deny-by-default rules, connector transparency and sensitive
permissions, browser isolation and untrusted code, cross-domain iframe security,
manifests and versioning, MCP feedback loops, concurrency, and rate limiting.
These are prompts for investigation, not required features or claims about the
target. Treat hosting as context unless evidence supports a distinctive hosting
decision. Prefer judgment and practical systems questions over stack matching
with a prospective acquirer or generic algorithm exercises.

## Build the shared library

Write one Markdown artifact at the requested destination. Otherwise choose and
report a local output path. Keep the same theme IDs across three role sections
so teammates can practice together and find each other's variants.

For each theme, include a concise evidence anchor (repository path and symbol or
line, plus public source when relevant), then write distinct questions:

- **Architect / senior engineer:** Probe implementation mechanics, edge cases,
  failure recovery, alternatives, and architectural tradeoffs. Suggest depth
  such as tracing a concrete request or explaining a specific failure path.
- **PM:** Probe user goals, system behavior, constraints, product tradeoffs, and
  success criteria. Keep implementation detail at the level needed to explain
  the product decision. State when to hand off to the architect for mechanics.
- **CEO:** Probe strategy, landscape, differentiated team judgment, and open
  strategic choices grounded in the product evidence. Suggest a concise framing
  and a clean handoff to the implementation owner for technical follow-ups.

Each entry needs the question, suggested answer depth, and handoff note. Reuse
theme evidence across variants rather than repeating long source excerpts.
Handoffs should identify the boundary of the speaker's answer and the owner or
role to invite next. Do not assign unverified expertise to a named teammate.
Depth guidance describes what to cover, not a fabricated model answer.

Prioritize the strongest likely probes and explain their relevance from the
repo and audience. Label likelihood as inference. Include open evidence gaps
and questions the team must settle before practice. Do not pad the library with
topics absent from the repo or assert private roadmap, security guarantees,
business outcomes, or interviewer intentions without evidence.

## Check the library

Verify central premises against current source. Ensure every theme is specific
enough that it would change for another repo, each role has a usable variant,
and PM/CEO handoffs preserve the right depth. Report the artifact path, covered
themes, and material evidence gaps. Generating the library does not authorize
publishing it or sending it to the team.
