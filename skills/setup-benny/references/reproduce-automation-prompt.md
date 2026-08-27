# Reproduce Automation Prompt

Read and follow
`.agents/automations/benny/skills/reproduce-and-fix-issues/SKILL.md` for this run.

Load `.agents/benny/configuration.yaml`. Resolve
`models.reproduce` through `.agents/skills/configure-models/SKILL.md`. Stop if
configuration, authorization, role, or size does not resolve.

Recompute the approved scope digest and require it to match
`authorization.approved_scope_digest` before any external write.

The trigger represents a new top-level report in the configured source channel,
or another trigger explicitly approved during setup, and must supply:

```json
{
  "source_channel_id": "{{SOURCE_CHANNEL_ID}}",
  "message_ts": "{{MESSAGE_TS}}",
  "thread_ts": "{{THREAD_TS_OR_EMPTY}}"
}
```

Treat the source channel and root message coordinate as immutable. Stop without
posting when either is missing or conflicts with configuration.

Wait for a configured Benny marker from the trusted triage identity in this
exact thread. Proceed only for the bug or performance marker.

Require the configured control adapter and feature map. Reproduce the exact
discriminating symptom twice through the real interface. Verify an existing pull
request or commit without authoring over it. Attempt one focused correction only
after confirmed reproduction and all operational gates pass. Open only a draft
pull request.

The coordinator is the only external-message author. Delegated workers receive
no message credential or write action. Every source-channel write is a reply in
the original thread.
