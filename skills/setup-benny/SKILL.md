---
name: setup-benny
description: Install and configure Benny's issue triage and reproduction workflows for a repository.
disable-model-invocation: true
---

# Set Up Benny

Benny is a dormant automation pack. Setup installs repository-local instructions,
configuration, and project skills. A separate automation runner supplies triggers
and authorized integrations.

Repository artifacts may be created and updated autonomously within this setup
task. Creating or changing a live automation, enabling it, sending a test message,
or granting standing permission for messages, tracker writes, and pull requests
requires explicit user approval.

Never put secrets in prompts, skill files, or committed configuration.

## 1. Establish The Target

Ask only when the target repository cannot be inferred. Use these project paths:

- Managed workflow files: `.agents/automations/benny/`
- Project-local skills: `.agents/skills/`
- User configuration: `.agents/benny/configuration.yaml`
- User feature map: `.agents/benny/feature-map.md`
- Optional routing map: `.agents/benny/routing.md`

Read `references/installation-manifest.md`. Merge each managed source file into
the matching destination. Preserve destination-only files and user edits. When a
managed destination differs, inspect and merge it. Ask before replacing content
whose ownership cannot be determined.

If this procedure is already running from the target managed destination, treat
the managed copy as installed and verify every destination in the manifest. Use
the current source package only when refreshing managed files.

Copy the current production versions of every dependency listed in the manifest
into `.agents/skills/`. Preserve a newer project-local version when its contract
still satisfies Benny. The three Benny procedures remain directly readable
automation instructions even if the project also registers them as skills.

Verify every listed file exists in the target before continuing.

## 2. Create User Configuration

Copy `references/configuration.example.yaml` to the user configuration path when
that file is absent. Copy the routing and feature-map examples to their user paths
when absent. Existing user files are never refreshed from examples.

Fill or confirm:

- Source conversation channel and optional operations channel
- Trusted triage identity
- Repository and default branch
- Tracker adapter, destination, labels, and intake status
- Optional routing map
- Required control adapter and completed feature map
- Thread read and reply actions
- Draft pull request action and public URL format
- Status strings, time budgets, and artifact retention
- An OS-appropriate writable artifact directory outside the repository
- Standing external-action permissions
- Approved scope snapshot and digest
- Model role and size for triage, reproduction, code work, and media review

The source channel, trusted triage identity, repository, tracker adapter, control
adapter, and feature map must be explicit. Configuration with placeholders or
missing required values is not ready.

Resolve `control.artifact_directory` during setup. Require a writable temporary
location outside the repository and verify that cleanup preserves artifacts for
the configured retention period.

## 3. Resolve Models

Read and follow `.agents/skills/configure-models/SKILL.md`. Every Benny model
choice has both a role and one of `S`, `M`, `L`, or `XL`. Resolve it through
`~/.config/lachieh/models.yaml` at run time. Store no provider-specific model
identifier in Benny files, runner fields, or prompts.

Use the configured role as the job contract and the configured size as the
capability tier. If the role, size, provider matrix, or fallback cannot resolve,
leave the affected automation disabled.

## 4. Verify Integrations

Triage requires:

- Read access to the source channel, threads, attachment metadata, and files
- Reply access that requires a parent thread coordinate
- Tracker search, read, create, update, and compensation actions
- Repository and history read access for bounded cause tracing

Reproduction requires:

- Source-thread read and reply access
- Optional operations-channel post and edit access
- Repository, history, branch, and check access
- Draft pull request creation
- Tracker read access
- The configured control adapter

Use documented actions exposed by the selected integrations. Keep credentials in
the runner's secret store or environment. Workers receive only the read or write
capabilities required for their narrow task. No delegated worker receives a
conversation credential or external-message action.

## 5. Make Authorization Explicit

Show the user the exact external effects the enabled workflows may perform:

- One triage reply in each accepted source thread
- Tracker updates for confident duplicates
- Tracker creation for clear new bugs, with compensation on handoff failure
- Optional operations-channel status messages
- At most one unprompted confirmed-reproduction reply in the source thread
- At most one triage follow-up reply to a direct question
- At most one existing-fix result reply in the source thread
- At most one operations follow-up reply to a direct question
- A draft pull request after the full correction gate passes

Also show the fixed scope: source channel, operations channel, repository URL and
default branch, tracker destination, allowed marker strings, and draft-only pull
request policy.

Ask the user to approve or reject this standing authorization. Copy every shown
scope value into `authorization.approved_scope`. Compute
`authorization.approved_scope_digest` from the canonical approved scope plus all
`allow_*` fields and reply limits. Canonicalize as sorted-key JSON encoded as
UTF-8 and store its SHA-256 digest. Record approver and date. Any covered setting
change clears approval and requires a new snapshot, digest, and approval.
Repository preparation continues without approval, but live automation creation,
update, enablement, and external test actions do not.

Any action outside the recorded scope needs new approval. Human replies can stop
a run. The workflows never merge or deploy.

## 6. Verify The Control Adapter

Read the installed
`.agents/automations/benny/skills/reproduce-and-fix-issues/references/control-adapter.md`
and the completed feature map.

Confirm the adapter can:

1. Start the requested app revision in a safe test environment.
2. Navigate a mapped feature through the user-visible interface.
3. Exercise mapped states through declared user actions.
4. Inspect state without changing it.
5. Capture screenshots.
6. Start and stop a recording.
7. Reset state for an independent second attempt.
8. Clean up processes, sessions, and temporary data.

Run one harmless adapter check through all eight capabilities. Keep the
reproduction automation disabled if any capability is absent or the completed
feature map does not cover the tested path.

## 7. Prepare Runner Definitions

Identify the automation runner available to the target project. It must support
the configured top-level message trigger, repository checkout, model resolution,
and integrations. If no runner satisfies the contract, finish repository setup
and report the missing runner capabilities.

Use `references/triage-automation-prompt.md` and
`references/reproduce-automation-prompt.md` as the prompt sources. Each runner
definition must:

- Trigger from a new top-level report in the configured source channel, or the
  explicitly approved equivalent trigger.
- Preserve the trigger's channel and root message coordinates.
- Read its exact committed operational file on every run.
- Load the committed configuration or receive all required values directly.
- Resolve its role and size through `configure-models`.
- Expose only the integrations required by that workflow.
- Keep all source-channel writes inside the original thread.

If the user approved live creation or update, create or update one definition at
a time through the runner's normal reviewed configuration flow. Show the final
trigger, repository, model role and size, capabilities, prompt, and external
effects before enablement. Reuse existing definitions rather than creating
duplicates.

If approval is absent, write complete draft definitions to repository artifacts
or report the fields the runner must receive, then stop before any live change.

## 8. Commit Readiness

Verify these files are committed on the revision the runner will check out:

- `.agents/automations/benny/skills/`
- `.agents/benny/configuration.yaml`
- `.agents/benny/feature-map.md`
- The routing map when configured
- Every required `.agents/skills/` dependency

Create a task commit and push the setup artifacts when repository policy permits.
Open or update a review request when the work is branch-shaped. Do not enable a
definition that references uncommitted files or paths outside its checkout.

## 9. Test Thread Safety

The harmless test report and its replies are externally visible. Run this test
only after explicit test approval and after commit readiness passes.

Verify:

1. Triage stores the root coordinate and posts exactly one verdict as a reply.
2. The verdict contains exactly one configured marker.
3. Reproduction accepts a marker only from the configured triage identity.
4. Reproduction retains the same immutable source coordinates.
5. No root message appears in the source channel.
6. A delegated worker cannot use an external-message action.
7. Missing coordinates, a deleted parent, or failed preflight produces no source
   post and no tracker issue.
8. The control adapter completes its harmless real-interface check and cleanup.

Enable normal traffic only after all eight checks pass and the user approves
enablement. Report installed files, unresolved capabilities, authorization,
model role and size assignments, commit readiness, and test evidence.

## Completion

The repository contains the complete dormant pack and required project skills,
configuration contains no placeholders or concrete model identifiers, all
references resolve, the control adapter passes its check, and no live external
effect occurred without explicit approval. Enabled workflows additionally have
recorded standing authorization, committed inputs, and passing thread-safety
evidence.
