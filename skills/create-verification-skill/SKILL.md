---
name: create-verification-skill
description: Generate a project-local skill that drives an application's real user surface and captures behavioral proof.
disable-model-invocation: true
---

# Create A Verification Skill

Every serious project needs a scripted way to drive the real application and
prove behavior: launch it, exercise a feature the way a user does, and capture
evidence. This skill generates that capability under
`.agents/skills/verify-<app>/`, tailored to the repository. Write the generated
skill for an agent reading it cold in the middle of a task.

The boss owns repository interview, decomposition, generated-skill review,
integration, and final claims. Delegate bounded authoring and independent
verification through configured roles.

## 1. Interview The Repository, Not The User

Answer these questions from the codebase. Ask the user only for facts that
cannot be observed.

- **Surface:** What does a user touch: web UI, CLI or TUI, desktop application,
  API, mobile application, or library? A repository can have several surfaces.
  Pick the primary one and note the rest.
- **Run:** How does the application start locally? Prefer the repository's
  documented development command. Note ports, environment variables, seed data,
  and authentication.
- **Drive:** How can an agent interact with it programmatically? Prefer existing
  harnesses such as browser tests, expect scripts, PTY helpers, HTTP endpoints,
  or debug ports. Otherwise choose a generic recipe: browser automation for web
  and desktop web shells, a PTY or terminal multiplexer for CLI and TUI, or HTTP
  for services.
- **Observe:** What evidence can be captured: screenshots, terminal records,
  response bodies, logs, exit codes, or database state?
- **Isolate:** Can two instances run side by side using separate ports, data
  directories, or profiles? If not, make the generated skill refuse to drive a
  shared instance.

If the checkout does not build or start as-is, fix that first or report the
failure precisely before generating the skill. Resolve a bounded baseline repair
through `configure-models` with the `implementation` role at `M` size and
delegate it by default. When an irrelevant missing asset blocks startup, the
generated skill may create it as verification scaffolding and remove it during
cleanup.

## 2. Generate The Skill

Define the target and acceptance criteria, then resolve the `implementation`
role at `M` size through `configure-models` and delegate one bounded authoring
owner by default. The boss reviews every generated file and integrates accepted
work.

Write `.agents/skills/verify-<app>/SKILL.md` with YAML frontmatter containing
`name: verify-<app>` and a description that names the application, surface, and
invocation conditions. Include these sections, grounded in observed repository
facts with no placeholders:

- **Launch:** Give the exact verification start command, readiness signal, and
  teardown. For a short-lived CLI or TUI, launch means building or installing
  once and starting each drive in an isolated PTY or terminal session.
- **Doctor:** Give one read-only check that determines whether this instance is
  worth driving: process state, expected version or build, port ownership, and
  valid authentication. Run it first whenever state is uncertain.
- **Drive:** Give harness commands with stable handles from the repository.
  Prefer accessibility labels, data attributes, prompt strings, and route paths
  over coordinates and tab order.
- **Evidence:** State what to capture and where. Exercise the real user path,
  capture the action and resulting state, and verify side effects alongside the
  visible result. Use mocks only where a production boundary already isolates
  an external system. Verify what dry-run or test modes actually skip by
  observing files, network activity, and repository state.
- **Cleanup:** Tear down only instances and scratch state created by the run.
  Never kill by process name. Preserve evidence at the location named by the
  skill.
- **Helpers:** Make every shipped helper executable and document its invocation
  in the skill body.

## 3. Seed The Feature Map

Create `.agents/skills/verify-<app>/features/README.md` plus one file per
user-facing feature that can be identified. Start with the top three to five
features from routes, commands, menus, or documentation. Follow
[`references/feature-map-example/`](references/feature-map-example/).

Each feature file explains what the feature is, how a user reaches it, how the
harness drives it, and which observable end state proves it works. Use these
four H2 headings:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with <harness>`
4. `Gotchas`

The feature map is the repository's maintained verification source. A proof
that drives one convenient entry point is incomplete when the map lists others.

## 4. Prove The Generated Skill

Resolve the `review` role at `L` size through `configure-models` and assign a
worker other than the author to run the generated instructions end to end once:
launch, doctor, drive one mapped feature, capture evidence, and clean up. After
cleanup, confirm the evidence still exists at the named location.

The boss inspects the evidence and generated files, fixes or delegates any
failure, and requires cleanup after every failed iteration so attempts do not
strand processes or ports. Apply `principle-prove-it-works`. A generated skill
that has not been executed is a draft rather than a deliverable.

## 5. Offer The Maintenance Loop

Point the user to `maintain-verification-skill` for keeping the map accurate as
the application changes. Suggest a cadence only when asked.
