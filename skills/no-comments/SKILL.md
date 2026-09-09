---
name: no-comments
description: Run a strict comment review, correct accepted findings, and offer executable encodings for stated constraints.
disable-model-invocation: true
---

# No Comments

Run a fresh comment review and act on accepted findings. Authoring agents tend
to defend their own prose, so use an independent reviewer.

The boss owns scope, reviewer assessment, decomposition, integration, and final
claims. The reviewer may edit only comments in the assigned scope and identify
application-code targets. One implementation owner handles accepted code
changes.

## Scope

Use the caller's files or diff. Otherwise discover the repository's base branch
and use the current diff against it, including the working tree. Preserve
pre-existing changes and attribute every reviewer edit before reversing it.

## Steps

1. Read [`references/comment-reviewer.md`](references/comment-reviewer.md).
   Resolve the `review` role at `L` size through `configure-models` and delegate
   one reviewer with the scope and reference path. Do not restate the review
   rules.
2. Inspect the report and reviewer diff. Reject application-code edits, scope
   escapes, exception-protected deletions, misstated `MUST KILL` reasons, and
   flags that treat intentional code as guilty. Flags for surprising behavior in
   code we control remain actionable. A retained comment survives only with
   proof that it concerns a constraint we cannot change.
3. Audit missed lint and TypeScript suppressions in scope. Suppressions of rules
   that protect correctness or safety remain actionable `MUST KILL` findings.
   Restore a deletion only when an exact exception applies and source evidence
   supports it. Before accepting a weak deletion or retention around `IMPORTANT`
   or `do not remove`, run `how` or `why` on the named symbol. Resolve ambiguity
   in favor of removing the comment.
4. If the report fails review, reverse only the reviewer's attributable changes
   and rerun once with the failure named. Reject a second failed report, leave
   the issue open, and mark this run failed.
5. Group accepted code findings into one bounded implementation. If a correction
   requires a new shape, run `architect` once for the accepted set and
   surrounding code, stopping after the design sketch.
6. Resolve the `implementation` role at `M` size through `configure-models` and
   delegate one implementation owner by default. Apply
   `principle-fix-the-latent-issue`,
   `principle-redesign-from-first-principles`, and
   `principle-minimum-necessary-complexity`. Remove every named workaround. If
   the cause is outside scope, implement the smallest supported in-scope
   correction and report the rest as open. These principles do not authorize
   widening scope or changing unproven sibling cases.
7. Constraint comments include `do not remove`, `do not change wording`, or
   `talk to X before changing`. Retain only comments about constraints the team
   cannot change. Offer the least costly in-scope type, runtime check, test, or
   CI rule that enforces the constraint. Wait for interactive approval unless
   the caller pre-approved unattended encoding. If approved, encode the
   constraint and delete the comment. Otherwise delete it, report the
   unenforced constraint, and sketch any out-of-scope work.
8. The boss reviews all diffs, verifies accepted fixes, and reports the deletion
   count, restored comments, reruns, architect sketch, fixes, encoding offers,
   completed encodings, unenforced constraints, and other open work. Apply
   `principle-prove-it-works` to the final claim.
