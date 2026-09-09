---
name: configure-models
description: Configure provider-specific S, M, L, and XL models and map Lachie agent roles to those tiers.
disable-model-invocation: true
---

# Configure Models

Create or update `~/.config/lachie/models.yaml`. This file is the single source
of truth for model selection. Skills request a role and may request an explicit
provider or size. They do not name concrete models.

The role identifies the job contract. Its configured tier is the default size.
When a skill supplies an explicit size, that size overrides the role default and
indexes the selected provider matrix. An explicit provider selects that matrix.
Otherwise use the active provider.

## 1. Detect models

Identify the current host, active provider, and concrete models available to
subagents. Prefer a host model catalog or documented CLI. If the host exposes no
catalog, derive valid identifiers from tool metadata or a failed disposable
subagent request. Ask the user only for identifiers that cannot be observed.
Never write an identifier that has not been confirmed available.

## 2. Load current configuration

Read `~/.config/lachie/models.yaml` when it exists. Preserve valid explicit
choices and replace values that are no longer available.

## 3. Build provider matrices

Map each available provider to `S`, `M`, `L`, and `XL`. Use documented capability
and reasoning tiers rather than model-name ordering. A concrete model may fill
multiple sizes when the provider has fewer than four useful tiers.

Use this shape:

```yaml
version: 1
providers:
  openai:
    S: <confirmed-model>
    M: <confirmed-model>
    L: <confirmed-model>
    XL: <confirmed-model>
  anthropic:
    S: <confirmed-model>
    M: <confirmed-model>
    L: <confirmed-model>
    XL: <confirmed-model>
roles:
  orchestrator: XL
  exploration: S
  mechanical: S
  implementation: M
  complex-implementation: L
  architecture: L
  review: L
  synthesis: L
review-providers:
  - openai
  - anthropic
```

An unavailable provider is omitted. `inherit-parent` is valid as a role value
and means the subagent request omits its model field.

## 4. Confirm overrides

Show the detected matrices, role mapping, and review providers. Ask only about
missing tiers, ambiguous capability ordering, or changes the user wants. Do not
require confirmation for values already configured and still valid.

## 5. Validate and write

Require every concrete model to exist in the detected catalog. Require every
configured provider to resolve all four sizes. Require every role to name a
default size or `inherit-parent`. Validate explicit role-plus-size requests by
checking that the role exists and the requested size resolves in the selected
provider matrix. Write the complete file atomically so interrupted writes cannot
leave partial configuration and identical reruns produce no diff.

## 6. Verify resolution

Resolve every role at its default size for each configured provider, then resolve
every explicit role-plus-size request used by installed skills. Resolve one
reviewer per entry in `review-providers`. If a requested provider is unavailable,
use the active provider at the requested size and report that provider
independence was lost.

Finish by reporting the config path, provider matrices, role mapping, review
panel, and any degraded fallback.
