---
name: show-me-your-work
description: "Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision, reason, evidence, and result."
disable-model-invocation: true
---

# Show Me Your Work

For work a human reviews after the fact, keep one canonical decision trail so
they can reconstruct what was decided, why, and from which evidence without
rerunning the work or reading an entire session record.

## Format

Use one TSV file with one row per decision. TSV renders as a table in common
repository hosts, works with terminal and spreadsheet tools, and supports
append-only writes. Keep cells on one line and use evidence pointers instead of
prose.

Resolve the directory containing this loaded `SKILL.md`. Copy
`references/decision-log-template.tsv` relative to that directory to start a
clean log. Its columns are:

- **ts.** ISO 8601 timestamp.
- **phase.** Phase or workstream.
- **decision.** What was chosen or done, in one line.
- **why.** The reason in plain language. State a governing principle plainly
  rather than using a jargon tag.
- **evidence.** A commit, pull request, `file:line`, artifact, trace, or
  screenshot path that supports the row.
- **result.** The observed outcome or predicate state, such as `tests pass`,
  `reverted`, `INCONCLUSIVE`, or `open`.

Illustration only:

```tsv
ts	phase	decision	why	evidence	result
2026-05-24T09:02:00Z	frame	counted about 100 units and roughly 75 hours	needed the size before starting a long run	commit 3a9f1c2	found 5 blockers
2026-05-24T09:40:00Z	verification	captured the old output before changing it	needed a comparison that could detect regressions	scripts/snapshot.sh, baseline/	saved 120 reference images
2026-05-24T11:15:00Z	widget	moved the styles without changing appearance	kept the unit narrow and behavior unchanged	commit 7c21e0a, pixel-diff 0	appearance matches, tests pass
2026-05-24T12:30:00Z	widget	rejected delegated output because its images were blank	the artifacts contradicted the report	worktree reset	reverted and tightened the next brief
```

## Log A Row

Write entries as you would explain the decision to a teammate. Use concrete
actions and apply `unslop` to the log text.

Run:

```bash
<show-me-your-work-skill-dir>/scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>
```

The helper adds the timestamp and header, strips tabs and line breaks from
cells, and protects spreadsheet readers from interpreting cell content as a
formula. A direct append is acceptable only when it applies the same safeguards.

Log decision points and checkpoints, not every action: a selected fork, a unit
completed with verification, a pivot or revert and its trigger, a blocker, or a
corrected gate. For iterative work, use one row per iteration. Skip trivial
actions.

## Location

Keep the log as an uncommitted working artifact by default. Use `decisions.tsv`
in the work directory or `.audit/<task-slug>.tsv` for concurrent efforts.

Commit the log when a reviewer needs the trail to assess a consequential result,
such as a large migration or a long-running cross-system change. A committed log
should render beside the diff it explains.

## Rules

- One row records one decision or checkpoint.
- Append only. Add a row that supersedes a wrong decision instead of rewriting
  history.
- Prefer evidence produced by committed scripts so a reviewer can rerun it.
  Apply `principle-encode-lessons-in-structure` to recurring corrections.

## Audit Against The Session

Before handoff, discover what session-record capabilities the current host
provides. Use only records authorized for the active workspace and current run.
Never search another workspace or unrelated private records. If the host exposes
no authorized session record, state that limitation and audit against the
available tool history, live state, and durable artifacts.

Walk the log against what happened:

- Every row maps to a real action.
- Every evidence pointer resolves and supports the claim.
- Every consequential fork, pivot, or abandoned approach appears in the log.
- Every row earns review attention. When an existing row is padding or wrong,
  append a retraction or superseding row rather than removing it.

Correct divergence by appending a row that names the earlier decision and marks
it retracted or superseded. Never delete or rewrite an existing row.

## Independent Review

Before handoff, resolve the `review` role at `L` size through
`configure-models`. Use a configured provider different from the work provider
when available. Report degraded independence when it is not available. The
reviewer reads the trail, authorized session evidence, and durable artifacts,
then flags:

- decisions with weak or missing evidence;
- verification claimed without proof;
- premature, risky, or expanding choices;
- gaps a reviewer could miss on a skim.

The reviewer returns bounded findings with row and artifact pointers. The boss
checks consequential flags against source evidence and owns the final judgment.

Every response for a run that produced a trail ends with an **Attention**
section. State `reviewed with review role (L)` and whether provider independence
was available, then list verified flags. `No flags` is valid.

## Review The Trail

Read from top to bottom and follow the evidence pointers. A row whose evidence
does not resolve, or whose result has not been verified, exposes unfinished
work.

Other skills route their audit trail here instead of defining another format.

## Completion

The append-only log accounts for consequential decisions and checkpoints, every
evidence pointer resolves, the session audit is complete within authorized host
capabilities, and the boss has judged the independent review findings.
