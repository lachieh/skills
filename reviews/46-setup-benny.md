# Review 46: Setup Benny

Status: approved and implemented

Source: dormant Benny setup procedure

Implementation: `skills/setup-benny/SKILL.md`

## Verdict

Keep as-is with host/model adaptation.

## Approved Adaptations

- Install managed workflow files under `.agents/automations/benny/`.
- Install current production dependencies under `.agents/skills/`.
- Resolve every model choice through `configure-models` by role and S/M/L/XL.
- Replace runner-specific creation mechanics with a reviewed, host-neutral runner
  definition flow.
- Keep repository artifact work autonomous within setup scope.
- Require explicit user approval for live automation changes, standing external
  effects, enablement, and externally visible tests.
- Preserve dormant installation, external configuration under `.agents/benny/`,
  control-adapter checks, commit readiness, and thread-safety verification.
- Bind standing authorization to a canonical scope snapshot and digest that
  includes message permissions and reply limits.
- Bind repository scope to both URL and default pull-request branch.
