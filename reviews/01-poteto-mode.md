# Review 01: Poteto Mode

Status: approved

Source: `tmp/pstack/skills/poteto-mode/SKILL.md`

## Verdict

Keep the orchestration model, reversible artifact discipline, automatic quality
gates, and explicit model routing. Simplify the router and replace assumptions
that are specific to Cursor, Graphite, fixed model names, or one repository.

## Approved contract

The main agent is the boss and orchestrator. It owns decomposition, decisions,
integration, review, and the final account of the work. Bounded implementation
tasks delegate to subagents by default, including sequential tasks, so detailed
implementation work does not consume the boss's context window.

The boss reviews delegated work and retains goals, decisions, integration state,
review findings, and verification evidence. It does not pass through a
subagent's self-report as proof.

Work in Lachie's own or team repositories should finish as the strongest
reversible repository artifact the context supports. Agents may create commits,
push task branches, and open or update pull requests without asking again. Pull
request creation remains contextual rather than mandatory for every code task.

Deployments, customer or public communication outside the repository workflow,
destructive operations, and other actions with a broad blast radius require
separate authorization.

`deslop` and `no-comments` remain automatic pre-review quality gates.

`shipit` replaces Babysit as a manually triggered workflow. It carries work
through repository quality gates, push, pull request creation or update, CI,
review feedback, and merge. The trigger authorizes repository-scoped lifecycle
actions but not deployment.

Skills request models by role and provider-neutral size. A configuration layer
maps `S`, `M`, `L`, and `XL` to concrete OpenAI and Anthropic models. The main
orchestrator defaults to `XL`; bounded implementation to `M`; complex
implementation, architecture, and adversarial review to `L`; mechanical work
and exploration to `S` or `M`. Cross-provider review is preferred where it adds
independence.

## Changes from the source

- Remove mandatory principle recitals from user-facing replies.
- Keep task lists for meaningful multi-step work without copying playbooks
  verbatim as ceremony.
- Keep implementation delegation as the default rather than requiring parallel
  work as its justification.
- Route architecture review for consequential boundaries, not every function
  call boundary.
- Build tools for repetitive, risky, or auditable work rather than every
  non-trivial task.
- Move detailed prose policy to a dedicated writing skill.
- Discover repository commands, branches, and tools from the environment.
- Replace the conflicting Babysit and Shipping rules with the single `shipit`
  lifecycle.
- Keep concise, direct, impact-first communication without requiring the agent
  to narrate its internal principles.

## Evidence of fit

The contract follows patterns visible across Lachie's repositories: pure,
testable policy behind narrow adapters; strict boundaries without unnecessary
infrastructure; executable verification of edge cases; repository-native
automation; distinctive but accessible product work; and high autonomy with
clear escalation at destructive or externally visible boundaries.

## Open decisions

Concrete model IDs and provider fallback behavior belong to the later setup
skill review. The exact implementation of `deslop`, `no-comments`, and `shipit`
belongs to their individual reviews.
