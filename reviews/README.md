# Skill reviews

This ledger tracks the one-at-a-time review of pstack at commit
`2a8044425c7bddf429c3bdedf3ab61e791d34d65` before its ideas are adapted into
the Lachieh skill system.

Each review considers the whole system, observed preferences in Lachieh's
repositories, and agent-writing best practices. Approved reviews become design
inputs. They are not copied implementations.

## Review status

### Lachieh system

- [x] `lachieh` agent
- [x] `lachieh-mode`
- [x] `deslop`
- [x] `shipit`

### Router and principles

- [x] `poteto-mode`
- [x] `principle-prove-it-works`
- [x] `principle-foundational-thinking` (skipped)
- [x] `principle-model-the-domain`
- [x] `principle-fix-the-latent-issue` (supplied by Lachieh)
- [x] `principle-boundary-discipline`
- [x] `principle-type-system-discipline`
- [x] `principle-fix-root-causes` (merged into `principle-fix-the-latent-issue`)
- [x] `principle-sequence-verifiable-units` (implemented as `principle-verifiable-units-of-work`)
- [x] `principle-separate-before-serializing-shared-state`
- [x] `principle-make-operations-idempotent`
- [x] `principle-laziness-protocol` (implemented as `principle-minimum-necessary-complexity`)
- [x] `principle-subtract-before-you-add`
- [x] `principle-minimize-reader-load`
- [x] `principle-redesign-from-first-principles`
- [x] `principle-migrate-callers-then-delete-legacy-apis` (implemented as `principle-finish-the-migration`)
- [x] `principle-outcome-oriented-execution` (merged into `principle-finish-the-migration`)
- [x] `principle-build-the-lever`
- [x] `principle-guard-the-context-window`
- [x] `principle-never-block-on-the-human`
- [x] `principle-experience-first`
- [x] `principle-exhaust-the-design-space`
- [x] `principle-encode-lessons-in-structure`

### Shared policy

- [x] `setup-pstack` (implemented as `configure-models`)
- [x] `unslop`
- [x] `technical-writing`

### Investigation and parallelism

- [x] `how`
- [x] `why`
- [x] `arena`
- [x] `swarm`
- [x] `interrogate`

### Design and implementation

- [x] `architect`
- [x] `tdd`
- [x] `blast-radius`
- [x] `create-verification-skill`
- [x] `maintain-verification-skill`
- [x] `no-comments`
- [x] `typescript-best-practices`

### Composite workflows

- [x] `show-me-your-work`
- [x] `figure-it-out`
- [x] `recall`
- [x] `teach`
- [x] `bro`

### Skill evolution

- [x] `automate-me`
- [x] `reflect`

### Benny automation

- [x] `setup-benny`
- [x] `triage-issue-reports`
- [x] `reproduce-and-fix-issues`

## Review format

Each review records:

1. The source skill's purpose and system relationships.
2. What to keep, change, and drop.
3. How the recommendation fits Lachieh's preferences.
4. The approved contract for the Lachieh system.
5. Open decisions that later reviews must resolve.

After a review is approved or skipped, record the decision and immediately
present the next pending review. Do not wait for a prompt to continue.

A production principle skill begins with a short governing rule. Supporting
explanation, applications, relationships, and examples may follow in the same
document without expanding the rule itself.
