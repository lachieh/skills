# Benny Installation Manifest

Install source-managed workflow files under `.agents/automations/benny/`:

| Source | Destination |
| --- | --- |
| `skills/setup-benny/SKILL.md` | `.agents/automations/benny/skills/setup-benny/SKILL.md` |
| `skills/setup-benny/references/installation-manifest.md` | `.agents/automations/benny/skills/setup-benny/references/installation-manifest.md` |
| `skills/setup-benny/references/configuration.example.yaml` | `.agents/automations/benny/skills/setup-benny/references/configuration.example.yaml` |
| `skills/setup-benny/references/triage-automation-prompt.md` | `.agents/automations/benny/skills/setup-benny/references/triage-automation-prompt.md` |
| `skills/setup-benny/references/reproduce-automation-prompt.md` | `.agents/automations/benny/skills/setup-benny/references/reproduce-automation-prompt.md` |
| `skills/triage-issue-reports/SKILL.md` | `.agents/automations/benny/skills/triage-issue-reports/SKILL.md` |
| `skills/triage-issue-reports/references/routing.example.md` | `.agents/automations/benny/skills/triage-issue-reports/references/routing.example.md` |
| `skills/reproduce-and-fix-issues/SKILL.md` | `.agents/automations/benny/skills/reproduce-and-fix-issues/SKILL.md` |
| `skills/reproduce-and-fix-issues/references/control-adapter.md` | `.agents/automations/benny/skills/reproduce-and-fix-issues/references/control-adapter.md` |
| `skills/reproduce-and-fix-issues/references/feature-map.example.md` | `.agents/automations/benny/skills/reproduce-and-fix-issues/references/feature-map.example.md` |
| `skills/reproduce-and-fix-issues/references/verify-existing-fix.md` | `.agents/automations/benny/skills/reproduce-and-fix-issues/references/verify-existing-fix.md` |

Install current production versions of these skills under `.agents/skills/`:

- `configure-models`
- `how`
- `why`
- `tdd`
- `unslop`
- `principle-separate-before-serializing-shared-state`
- `principle-minimize-reader-load`
- `principle-guard-the-context-window`
- `principle-verifiable-units-of-work`
- `principle-fix-the-latent-issue`
- `principle-prove-it-works`

The user-owned files below are initialized from examples and are not refreshed:

- `.agents/benny/configuration.yaml`
- `.agents/benny/feature-map.md`
- `.agents/benny/routing.md`, when routing is configured

Preserve destination-only files. Compare and merge changed managed files. Never
replace a user-owned file during a pack refresh.
