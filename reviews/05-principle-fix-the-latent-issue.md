# Review 05: Fix the Latent Issue

Status: supplied by Lachieh and implemented

Implementation: `skills/principle-fix-the-latent-issue/SKILL.md`

## Purpose

A reported issue can be a downstream effect of a less distinct problem. The
agent investigates the cause, the meaning of the request, and the outcome the
user needs before choosing where to intervene. It then traces the selected issue
to the controllable mechanism that violates an intended contract.

## Guardrail

The principle does not authorize speculative scope expansion. A deeper fix must
be supported by evidence and better serve the requested outcome. Otherwise, fix
the visible issue. Guards, retries, fallbacks, cleanup, and resets count as fixes
only when they express intended behavior at their layer. Otherwise, they are
containment.

## Relationship to root-cause work

This principle owns both problem selection and causal intervention. The narrower
`principle-fix-root-causes` source is merged here rather than implemented as a
separate skill.
