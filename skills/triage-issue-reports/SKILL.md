---
name: triage-issue-reports
description: Triage one configured Benny issue report with evidence review, cause-aware routing, tracker deduplication, and one thread-only verdict.
disable-model-invocation: true
---

# Triage Issue Reports

Classify one report and post one useful verdict in its source thread. Create a
tracker issue only for a clear, new bug. Reproduction and correction belong to
the next workflow.

Load the installed Benny configuration. Read and follow `configure-models` to
resolve `models.triage` by role and `S`, `M`, `L`, or `XL` size. Stop without
external writes when configuration, model resolution, or the required standing
authorization is missing, malformed, incomplete, or outside scope.

Before any external write, compare current channel, repository, tracker, marker,
and pull-request policy settings to `authorization.approved_scope`. Recompute the
canonical scope digest, including permission and reply-limit settings, and
require it to equal `authorization.approved_scope_digest`. A mismatch clears
standing authorization for the run.

## Safety Rules

- The source channel and root message coordinates are immutable.
- Every source-channel message is a reply under the original root.
- Do not post to another channel, broadcast a reply, send a direct message, or
  start a replacement thread.
- Preflight the source parent before any tracker write and immediately before the
  verdict reply.
- A missing, deleted, inaccessible, or uncertain parent ends the run with no
  external writes.
- Post one substantive verdict. Do not narrate progress.
- The coordinator is the only external-message author.
- Delegated workers return findings only. They receive no conversation
  credentials or external-message actions.
- When worker isolation cannot enforce those limits, keep the work in the
  coordinator.
- Every tracker issue links back to the source thread.
- Prefer no issue over a guessed or duplicate issue.
- Apply `principle-separate-before-serializing-shared-state` to source
  coordinates.
- Apply `principle-minimize-reader-load` and `unslop` to the final verdict.

## 1. Freeze Source Coordinates

Before making a work list or delegating:

1. Read `source_channel_id` from the trigger.
2. Require it to equal `conversation.source_channel_id`.
3. Set `SOURCE_THREAD_ID` to `trigger.thread_ts` when present. Otherwise use
   `trigger.message_ts`.
4. Require a nonempty `SOURCE_THREAD_ID`.
5. Store `SOURCE_CHANNEL_ID` and `SOURCE_THREAD_ID` as immutable values.
6. Read the thread and verify its root has exactly those coordinates.
7. Fetch a stable source permalink.

Every later source read and reply uses those stored values. A reply coordinate,
operations coordinate, or status coordinate never replaces them.

## 2. Read The Whole Report

Read the root and current replies before deciding. Capture:

- Reporter wording
- Product version, app build, environment, and platform when present
- Expected and observed behavior
- Frequency and trigger
- Error text or stack signature
- Existing issue, commit, or pull request links
- Any explicit statement that someone is already fixing it

Inspect every relevant attachment:

- Read screenshots at full useful resolution.
- Review video for the state transition that separates correct and broken
  behavior.
- Read logs, traces, and crash text for concrete signatures.
- If specialist media review is useful, resolve `models.media_review` through
  `configure-models` and use a read-only worker with that role and size.
- If an attachment cannot be read, state that limitation in the verdict.

Use evidence already present before asking the reporter for more.

## 3. Trace Cause Before Routing

Do a bounded source and history pass before choosing an owner or destination.
Use `how` to trace the reported action to the observed result. Use `why` when the
report looks like a regression or touches defensive code.

1. Identify the likely code path from action to result.
2. Check whether the visible symptom belongs to that path or a dependency below
   it.
3. Check recent changes when the report looks like a regression.
4. Check whether a merged commit or open pull request already addresses the same
   symptom.
5. Separate confirmed facts from hypotheses.

This pass need not establish the complete cause. It must prevent routing a
visible symptom to an unsupported owner. If repository access is unavailable,
continue with conservative classification, avoid owner claims, and disclose that
cause tracing was unavailable.

Any delegated source exploration uses role `exploration` and size `S`, resolved
through `configure-models`, and remains read-only.

## 4. Classify

Choose one category:

- **Bug:** Intended behavior is violated by wrong output, broken state, an error,
  a crash, a hang, a silent no-op, or a regression.
- **Performance:** The report contains measurable slowness, resource use, frame
  instability, or another performance defect. Treat it as a bug while preserving
  measurements and profiles.
- **Feature request:** Current behavior appears intentional and the reporter
  wants a different behavior or affordance.
- **Question or feedback:** The report asks how something works, states a
  preference without a concrete defect, or offers general feedback.
- **Reroute:** Cause tracing establishes that another configured destination owns
  the issue.

When bug versus feature request is unclear, create nothing. The single verdict
may ask one focused question and must use the configured `other` marker.

## 5. Apply Configured Routing

Read the optional map at `routing.map_path`.

- Match on confirmed product area, code path, or error signature.
- A visible symptom is insufficient when cause tracing points elsewhere.
- If no route matches, state that ownership is unclear.
- Tell the reporter where to take a rerouted issue in the source thread. Do not
  cross-post.

Owner mentions are off by default. One mention is allowed only when all of these
hold:

1. The routing map explicitly names the owner.
2. Configuration permits that mention type.
3. The item is a feature request needing owner input, or repository history
   identifies a likely regression author with strong evidence.
4. The owner is not a broad on-call group.

No other case receives an owner mention.

## 6. Use The Tracker Adapter

The configured adapter must provide:

- Search by text, state, label, source URL, and date range
- Read one issue and its links
- Create an issue with title, body, status, labels, and source URL
- Update an issue without replacing unrelated fields
- Add a source link and recurrence note
- Cancel, close, or delete an issue created by this run if thread handoff fails

Fail closed for any write whose required operation or standing authorization is
unavailable. Resolve configured team, project, status, and labels at run time.
Do not invent identifiers, create labels, assign owners, or set priority unless
configuration requires it.

## 7. Deduplicate

Always check whether the source permalink already appears in a tracker issue or
prior Benny verdict. If it does, create and post nothing.

For bugs and performance reports, search by:

- Exact error or crash signature
- Product area
- Trigger
- Symptom
- Version or date window
- Suspected regression commit
- Source permalink

Choose one result:

- **Confident duplicate:** Same signature; the same area, trigger, and symptom;
  or a confirmed shared cause.
- **Possibly related:** A shared cause is plausible but unproven.
- **Weak resemblance:** Similarity is superficial.
- **No match:** No useful candidate exists.

For a confident duplicate, and only when authorized, add the source permalink and
one short recurrence note. Preserve status, labels, assignment, and unrelated
fields unless configuration says otherwise.

For a possible match, link it in the verdict as uncertain and create nothing. A
long-closed issue is a regression lead, not automatically a live duplicate.

## 8. Decide Whether To Create

Create a tracker issue only when all conditions hold:

1. Classification is bug or performance.
2. Behavior is clearly broken.
3. The defect is live or not known to be fixed.
4. Deduplication found no confident or plausible live match.
5. Source parent and permalink passed preflight.
6. Tracker destination fields resolved.
7. The adapter can compensate if the verdict reply fails.
8. Standing authorization permits tracker issue creation.

Never create for a feature request, question, feedback item, reroute, possible
duplicate, confident duplicate, or already-fixed issue.

The issue contains:

- A plain title naming the area and symptom
- Reporter quote
- Expected and observed behavior
- Version and environment, or `unknown`
- Trigger and frequency
- Source thread permalink
- Short cause-tracing findings with hypotheses labeled
- Inline screenshot or representative video frame when supported
- Links to remaining artifacts
- Configured intake status and labels

Do not put a guessed cause in the title.

## 9. Post One Verdict

Run a fresh source-parent preflight. Require authorization for the triage thread
reply. Post exactly one reply using `SOURCE_CHANNEL_ID` and `SOURCE_THREAD_ID`.
The reply action must reject an empty parent coordinate.

Keep the reply short:

- Lead with the outcome.
- Link the existing or new tracker issue when there is one.
- Mention a reroute or one missing fact when needed.
- Include at most one allowed owner mention.
- End with exactly one marker line.

Marker contract:

```text
[benny:bug]
[benny:bug] tracker=https://tracker.example/issue/123
[benny:performance]
[benny:performance] tracker=https://tracker.example/issue/123
[benny:other]
```

Use only configured marker strings. The reproduction workflow trusts a marker
only when the configured triage identity authored it in this source thread.

Read the same thread after posting and verify the verdict appears under the
stored root. If it does not, never retry without a parent coordinate.

If this run created an issue and the verdict did not land, run the adapter's
compensation action. Verify the issue is canceled, closed, or deleted. If that
cannot be verified, report the failure only in the private run result.

## 10. Watch One Follow-up Window

Watch the source thread for the configured follow-up period, then stop.

- Answer only a direct question to the triage identity, only when
  `allow_triage_follow_up_reply` is true, and never beyond
  `triage_follow_up_reply_limit`.
- Apply a concrete tracker correction when authorized and safe.
- Do not emit a second marker in the same run.
- Stay out of human coordination and side discussion.
- Stop early when asked.

Do not extend the period more than once. A new report starts a new run.

## Completion

The report has one evidence-based classification, tracker deduplication is
accounted for, every external write is authorized and verified, and the source
thread contains at most one Benny verdict under its immutable root. Missing
inputs or failed preflights leave no partial tracker or messaging state.
