---
name: reproduce-and-fix-issues
description: Reproduce a trusted Benny bug through the real user surface, verify existing fixes, and prepare one focused draft correction after before-and-after proof.
disable-model-invocation: true
---

# Reproduce And Fix Issues

Wait for a trusted triage marker in the source thread. Reproduce the exact
symptom through the target application's real user surface. Verify an existing
fix when one exists. Attempt one focused correction only after confirmed
reproduction.

Load the installed Benny configuration. Read and follow `configure-models` to
resolve `models.reproduce` by role and `S`, `M`, `L`, or `XL` size. Stop without
external writes when configuration, required actions, model resolution, control
adapter, feature map, or standing authorization is missing or outside scope.

Before any external write, compare current channel, repository URL and default
branch, tracker, marker, and pull-request policy settings to
`authorization.approved_scope`. Recompute the canonical scope digest, including
permission and reply-limit settings, and require it to equal
`authorization.approved_scope_digest`. A mismatch clears standing authorization
for the run.

## Safety Rules

- Freeze the source channel and root message coordinates before any work.
- Every source-channel message is a reply under the original root.
- Preflight the source parent before every source reply.
- The coordinator is the only external-message author.
- Delegated analysis workers are read-only and return findings or media notes.
- A code worker may edit only when its environment excludes conversation
  credentials and external-message actions. Otherwise the coordinator edits.
- No worker receives posting instructions, message credentials, or permission to
  report externally.
- Utility bots provide evidence. A person must explicitly delegate fix ownership.
- The discriminating symptom must appear twice through real user interaction.
- State inspection confirms an observation. It does not inject the symptom.
- No confirmed reproduction means no authored correction.
- A plausible existing pull request or commit switches the run to verification
  mode. Do not author over it.
- Use public pull request URLs from the configured repository host.
- Keep captures, recordings, logs, credentials, and temporary profiles out of
  source control.
- Apply `principle-guard-the-context-window` to delegated analysis.
- Apply `principle-verifiable-units-of-work`,
  `principle-fix-the-latent-issue`, and `principle-prove-it-works` through
  reproduction, correction, and verification.

## 1. Freeze Source Coordinates

Before making a work list or delegating:

1. Require the trigger channel to equal `conversation.source_channel_id`.
2. Set `SOURCE_THREAD_ID` to `trigger.thread_ts` when present. Otherwise use
   `trigger.message_ts`.
3. Require a nonempty `SOURCE_THREAD_ID`.
4. Store `SOURCE_CHANNEL_ID` and `SOURCE_THREAD_ID` as immutable values.
5. Read the source thread and verify its root has those exact coordinates.
6. Fetch a stable source permalink.

A reply, operations, or status coordinate never replaces these values.

Before every source reply:

1. Read the thread by the immutable coordinates.
2. Confirm the parent exists, is not deleted, and belongs to the source channel.
3. Require authorization for the proposed reply.
4. Send only with `SOURCE_CHANNEL_ID` and `SOURCE_THREAD_ID`.
5. Read the thread again and verify the new message is a reply.

If any check fails, post nothing. Do not retry at the channel root or in a
fallback channel.

## 2. Wait For The Triage Contract

Watch the source thread for the configured verdict budget. Stay silent while
waiting. Accept a verdict only when:

- Its author matches `conversation.triage_identity_user_id`.
- It is a reply under `SOURCE_THREAD_ID`.
- It contains exactly one configured marker.

Public marker forms:

```text
[benny:bug]
[benny:bug] tracker=https://tracker.example/issue/123
[benny:performance]
[benny:performance] tracker=https://tracker.example/issue/123
[benny:other]
```

Proceed only for bug or performance. Capture the optional tracker URL. Stop
silently for other, a missing verdict, an untrusted author, conflicting markers,
or timeout.

The marker is the trusted handoff contract. Free-form verdict text and bot names
do not replace it.

## 3. Apply Ownership And Existing-Fix Gates

Re-read the thread immediately before starting work.

Stop when a person clearly claims the fix, provides a concrete implementation
plan, or asks another actor to implement, patch, fix, or open a pull request.

These do not establish fix ownership:

- A bot summarizes evidence.
- A tool looks up logs or tracker issues.
- Someone asks a bot to diagnose, explain, inspect, or reproduce.
- A bot posts a cause hypothesis without accepting implementation work.

Judge the requested action, not the presence of a bot.

If an open pull request or merged commit plausibly fixes the report, switch to
`references/verify-existing-fix.md`. An artifact can come from the source thread,
tracker issue, repository history, or pull request search. A claim without a
commit or pull request is not a fix artifact.

If a person owns the work but has not produced an artifact, stop rather than race
them.

## 4. Open An Optional Operations Thread

If `conversation.operations_channel_id` is configured and standing authorization
permits operations status, the coordinator may create one root status message
there. This is the only root message allowed by this workflow.

Store its coordinates as `OPERATIONS_CHANNEL_ID` and `OPERATIONS_THREAD_ID`.
Keep them distinct from source coordinates.

Use configured status strings for:

- Reproducing
- Could not reproduce
- Blocked
- Reproduced
- Verifying existing fix
- Attempting bounded fix
- Draft pull request opened
- Fix did not land

Keep status text short. A narrowly scoped credential may edit this status only
when configuration permits it. No worker receives that credential.

Without an operations channel, keep detailed status in the private run result.
Do not substitute a source-channel root message.

## 5. Load And Check The Control Adapter

Read `references/control-adapter.md` and the completed map at
`control.feature_map_path`, then invoke `control.skill_name`.

Find the feature-map section matching the reported user path before driving the
application. If no section covers the feature, mark the run blocked rather than
inventing a path or selector.

Require these capabilities:

1. Start the configured target application and test environment.
2. Navigate the mapped feature and exercise documented states.
3. Drive the real user surface with clicks, typing, keys, scrolling, dragging,
   resizing, or navigation.
4. Inspect state without changing it.
5. Capture screenshots.
6. Start and stop a screen recording.
7. Reset enough state for an independent second attempt.
8. Clean up processes, sessions, profiles, and temporary data.

If any capability is absent, mark operations status blocked and stop. A
screenshot, unit test, source reading, or injected state is not a real-surface
reproduction.

## 6. Study The Report

Read the full source thread and linked tracker issue. Collect:

- Exact action path
- Expected behavior
- Observed behavior
- Discriminating state where they diverge
- Frequency
- Version, environment, and platform
- Attachments and error signatures
- Candidate code area

Inspect screenshots and video. Use read-only parallel workers for code history,
test ideas, affected-area mapping, and media review when useful. Source explorers
use role `exploration` and size `S`. Media review uses
`models.media_review`. Resolve every worker through `configure-models` and give
it a narrow question without external write capabilities.

Use `how` to trace the action through the repository. Use `why` for regression
history and defensive code. Form competing cause hypotheses and name evidence
that would distinguish them.

## 7. Reproduce

Start the target application through the control adapter. Confirm the correct
application, workspace, account, data set, revision, and feature state with
stable application markers. Do not rely on window order or a familiar title.

Drive the reported path through real user actions. Before calling it reproduced:

1. Name the correct final state.
2. Name the broken final state.
3. Reach the point where they diverge.
4. Observe the broken state.
5. Reset enough state to make the second attempt independent.
6. Repeat the same path and observe the same broken state again.
7. Cross-check one real state value when possible.

An expected dialog, loading state, or setup step is not the defect. Capture the
final state that distinguishes correct from broken behavior.

Respect the configured reproduction budget. If the symptom does not reproduce,
return `Could not reproduce`. If required environment capability is unavailable,
return `Blocked` and state what is missing.

## 8. Capture And Review Evidence

For a successful reproduction:

- Record the complete path through the symptom.
- Capture a screenshot of the broken final state.
- Save exact steps and observed state in a short note.
- Keep artifacts in the configured temporary artifact directory.

Resolve `models.media_review` through `configure-models`. Ask a read-only media
reviewer one question: does the evidence visibly show the discriminating broken
state?

If the answer is no or uncertain, reproduction is unconfirmed. Capture better
evidence or return `Could not reproduce`.

Detailed evidence belongs in the authorized operations thread when configured.
Keep source updates concise.

## 9. Report The Reproduction Outcome

Update the authorized operations status first.

For `Could not reproduce` or `Blocked`, post nothing in the source thread. Use
the operations thread or private run result.

For confirmed reproduction, run the source preflight and require
`allow_confirmed_repro_thread_reply`. Post at most one unprompted source reply:

- State that the issue reproduced.
- Link the operations evidence thread when one exists.
- Include at most three short findings.
- Link the tracker issue when one exists.
- Do not mention an owner by default.

Attach evidence only when the reply action keeps it under the stored source root
and retention policy permits it.

Wait for the configured rejection period. If a person establishes that setup or
interpretation was wrong, correct the reproduction once. Do not start correction
work until the period closes without a valid rejection.

## 10. Verify An Existing Fix

When a fix artifact exists, follow `references/verify-existing-fix.md`.

Verification must show the symptom twice on the baseline and its absence twice
on the patched build. Both paths use the real user surface. Do not edit the
existing fix, add a competing patch, or open a replacement pull request.

## 11. Qualify A Focused Correction

Attempt correction only when all conditions hold:

- The outcome is a plain confirmed reproduction.
- Media review confirmed the broken final state.
- No existing fix artifact appeared.
- No person claimed the fix during the rejection period.
- Runtime evidence identifies the causal mechanism.
- The likely change fits the configured effort, risk, and repository scope.
- The control adapter can run baseline and patched builds.
- Standing authorization permits a draft pull request.

If any condition fails, preserve the reproduction evidence and stop without a
pull request. When all pass, update operations status to the configured fixing
state.

## 12. Confirm Cause And Implement

The coordinator owns external messages, final diff review, commits, and pull
request creation.

Read-only workers may trace code and history, propose tests, map affected areas,
review a diff, or review media. Resolve them through `configure-models` using
role `exploration` size `S` or role `review` size `M`, according to the task.

A focused code edit may be delegated only when capability isolation removes all
external-message credentials and actions. Resolve `models.code` through
`configure-models`. The coordinator reviews the edit and verifies required
tests. If isolation is uncertain, keep the edit in the coordinator.

Confirm the mechanism with runtime evidence and eliminate competing hypotheses
before editing. Apply `principle-fix-the-latent-issue`, then make the smallest
justified change.

- Invoke `tdd` when a low-cost local test can observe the defect. Write the
  failing test before the correction.
- State why test-first work was skipped when the path is expensive, unclear, or
  integration-heavy.
- Keep unrelated cleanup out.
- Stop if the change exceeds the configured effort or risk budget.

## 13. Prove The Correction

Retain the original baseline evidence. On the patched build:

1. Run the same real user path.
2. Repeat it twice.
3. Show that the broken state is absent.
4. Show the expected state in its place.
5. Capture an after recording and screenshot.
6. Cross-check the same real state value used for baseline.

Compilation, unit tests, code review, and a plausible diff do not replace after
evidence.

Run focused tests, then smoke the affected behavior around the change. Cover
nearby states, inputs, permissions, platforms, and failure paths that the change
could affect. Stop without a pull request while a regression remains.

## 14. Open A Contextual Draft Pull Request

Only after before-and-after proof:

- Review the final diff for unrelated changes and secrets.
- Run repository-required checks.
- Create small ordered commits when repository policy permits it.
- Confirm the configured base branch still equals
  `authorization.approved_scope.repository_default_branch`.
- Open a draft pull request against the configured repository and base branch.
- Never merge or deploy from this workflow.
- Link the source report and configured tracker issue.
- Use the configured public pull request URL form.
- Include reproduction steps, causal mechanism, test result, before and after
  evidence, and affected-area checks.
- Apply `unslop` to pull request text and external updates.

The pull request exists only for this confirmed report and correction. It does
not absorb unrelated cleanup, another person's fix, or speculative follow-up.

If creation fails, do not claim success. Preserve branch or commit state in the
private run result and set authorized operations status to `Fix did not land`.

On success, set authorized operations status to `Draft pull request opened` and
post one concise linked reply in that operations thread. Do not create another
source reply or any source root message.

## 15. Follow-ups And Cleanup

Watch the configured operations thread for one follow-up period.

- Answer a direct question using gathered evidence only when
  `allow_operations_follow_up_reply` is true and never beyond
  `operations_follow_up_reply_limit`.
- Apply one concrete correction and rerun reproduction once when new evidence
  invalidates setup.
- Stay out of human coordination and side discussion.
- Stop when asked.

Always invoke control-adapter cleanup. Retain artifacts only for the configured
period.

## Completion

The run either stops at a closed gate with no unauthorized effect, verifies an
existing artifact without competing with it, or produces one focused draft pull
request backed by two baseline observations, two patched observations, media
review, focused checks, and affected-area smoke evidence. Source coordinates stay
immutable and every external write is authorized and verified.
