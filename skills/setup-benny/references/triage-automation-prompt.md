# Triage Automation Prompt

Read and follow
`.agents/automations/benny/skills/triage-issue-reports/SKILL.md` for this run.

Load `.agents/benny/configuration.yaml`. Resolve `models.triage`
through `.agents/skills/configure-models/SKILL.md`. Stop if configuration,
authorization, role, or size does not resolve.

Recompute the approved scope digest and require it to match
`authorization.approved_scope_digest` before any external write.

The trigger represents a new top-level report in the configured source channel
and must supply:

```json
{
  "source_channel_id": "{{SOURCE_CHANNEL_ID}}",
  "message_ts": "{{MESSAGE_TS}}",
  "thread_ts": "{{THREAD_TS_OR_EMPTY}}"
}
```

Treat the source channel and root message coordinate as immutable. Stop without
posting or writing to the tracker when either is missing or conflicts with
configuration.

The operational file owns evidence review, cause tracing, classification,
routing, deduplication, tracker writes, and the final verdict. Post no progress
messages. Every source-channel write is a reply in the original thread.

The coordinator is the only external-message author. Delegated workers are
read-only, return findings only, and receive no message credential or write
action.

End the single verdict with exactly one configured Benny marker. A bug or
performance marker may add `tracker=<URL>`.
