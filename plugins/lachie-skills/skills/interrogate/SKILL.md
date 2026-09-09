---
name: interrogate
description: Run an evidence-based, multi-provider adversarial review of a concrete diff, artifact, or existing subsystem against its stated intent.
---

# Interrogate

Interrogate returns a boss-owned verdict on a concrete artifact. It does not apply
changes in report-only use. A calling implementation or `shipit` procedure may
act on accepted findings.

## Procedure

1. Determine the artifact, fixed point, surrounding context, and applicable
   standards. For a diff, discover the base branch. For an existing subsystem,
   identify exact source paths. Use an existing source-backed explanation or
   run `how` to establish its runtime flow before review.
2. State the intended outcome, constraints, and excluded scope. Use
   `principle-fix-the-latent-issue` when the artifact appears to solve the wrong
   problem.
3. Read `references/reviewer-prompt.md` and `references/rubric.md`.
4. Give every reviewer the same intent, criteria, source snapshot or commit
   range, and source pointers. Avoid large inline payloads.
5. Resolve assignments through `configure-models`, then run one read-only
   reviewer per configured review provider at the `review` role and `L` size.
6. Require each finding to name an exact location, reachable path, concrete
   consequence, evidence, and optional correction direction.
7. Have the boss inspect the relevant source and verify every consequential
   finding.
8. Merge duplicate findings and record substantive disagreement. Agreement raises
   priority but does not prove a finding.
9. Apply `references/lead-judgment.md` and classify every finding as **act on**,
   **consider**, **noted**, or **dismissed**.
10. Return accepted findings first. Include an agreement map only when it changes
    confidence or priority.

Arena compares competing artifacts. Interrogate reviews one artifact against
its intended behavior, including an existing subsystem grounded by `how`.

## Completion

Every accepted finding cites exact code, demonstrates a reachable path, and
states a concrete consequence. Every reviewer is accounted for. The boss owns
the verdict and filters unsupported preferences and hypothetical concerns.
