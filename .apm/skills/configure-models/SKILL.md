---
name: configure-models
description: Resolve a Lachie agent role and size to a concrete model before delegating, or create and update the model configuration that maps roles to provider tiers.
---

# Configure Models

`~/.config/lachie/models.yaml` is the single source of truth for model
selection. Skills request a role and may request an explicit provider or size.
They do not name concrete models.

## Resolve a role

1. Read `~/.config/lachie/models.yaml`. When it is missing, or names a model the
   host no longer offers, run the setup below first.
2. Use the provider the caller named, otherwise the active provider.
3. Use the size the caller named, otherwise the role's default size.
4. Look up that size in the provider's matrix. `inherit-parent` means the
   subagent request omits its model field.
5. For a review panel, resolve one reviewer per entry in `review-providers`. When
   a requested provider is unavailable, use the active provider at the same size
   and report that provider independence was lost.

## Set up

### 1. Detect models

Identify the current host, active provider, and concrete models available to
subagents. Prefer a host model catalog or documented CLI. If the host exposes no
catalog, derive valid identifiers from tool metadata or a failed disposable
subagent request. Ask the user only for identifiers that cannot be observed.
Never write an identifier that has not been confirmed available.

### 2. Load current configuration

Read `~/.config/lachie/models.yaml` when it exists. Preserve valid explicit
choices and replace values that are no longer available.

### 3. Build provider matrices

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

### 4. Confirm overrides

Show the detected matrices, role mapping, and review providers. Ask only about
missing tiers, ambiguous capability ordering, or changes the user wants. Do not
require confirmation for values already configured and still valid.

### 5. Validate and write

Require every concrete model to exist in the detected catalog. Require every
configured provider to resolve all four sizes. Require every role to name a
default size or `inherit-parent`. Validate explicit role-plus-size requests by
checking that the role exists and the requested size resolves in the selected
provider matrix. Write the complete file atomically so interrupted writes cannot
leave partial configuration and identical reruns produce no diff.

### 6. Verify resolution

Resolve every role at its default size for each configured provider, every
explicit role-plus-size request used by installed skills, and the review panel,
using the steps above.

Finish by reporting the config path, provider matrices, role mapping, review
panel, and any degraded fallback.
