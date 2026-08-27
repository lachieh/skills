# Review 47: Triage Issue Reports

Status: approved and implemented

Source: dormant Benny triage procedure

Implementation: `skills/triage-issue-reports/SKILL.md`

## Verdict

Keep as-is with host/model adaptation.

## Approved Adaptations

- Preserve immutable source coordinates and exactly one thread-only verdict.
- Preserve attachment review, cause-aware classification, routing, tracker
  deduplication, cautious creation, and compensation on failed handoff.
- Preserve trusted Benny markers for the reproduction handoff.
- Use current production skill and principle names.
- Resolve coordinator and worker models through `configure-models` by role and
  S/M/L/XL.
- Express message and tracker writes through configured host-neutral actions and
  recorded standing authorization.
- Recompute the approved scope digest before external writes and use a distinct
  permission and limit for a follow-up reply.
