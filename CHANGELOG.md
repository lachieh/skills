# lachie-skills

## 0.13.0

### Minor Changes

- 6aaf1fe: Changes from a review of two weeks of agent threads.
  
  - The model can load `shipit` and `working-session`. `shipit` loads when the human asks to ship, merge, or land work. It names each gate as a skill to load, waits on checks inside the turn, checks the default branch's run after the merge, and reports one line per gate.
  - `lachie-mode` gains a "Finish the work" section, gates written as load steps, and reporting rules. The agent merges a pull request it verified in Lachie's own repositories when the merge does not deploy. An instruction in the thread is the authorization for a deploy or release.
  - New skills: `release` runs a production release the human asked for and verifies it, `handoff` moves work to a new thread with one brief, `tidy` removes merged worktrees and settles threads, and `project-operations` makes `project-bootstrap`'s secrets and hosting knowledge loadable in an existing project.
  - `project-bootstrap` covers aligning an existing repository, lets an agent run a release the human asked for, stops merged pull requests from cancelling CI on `main`, and writes a "Finishing and reporting" section into each repository's `AGENTS.md`.
  - `reflect` reads named threads or a period of work as well as the active session, and takes over refreshing `lachie-mode` from `automate-me`.
  - `working-session` runs the dev server in a Herdr tab through `herdr-delegation`, because a background shell command stops at the harness's time limit.
  - `unslop` covers interface text. `swarm` requires the boss to read each code slice's diff before merging it. `recall` returns a work timeline when asked and searches another project when the human says the answer is there. `tdd` requires a reproduction before a fix.
  - Removed `automate-me` and `bro`, which no captured thread invoked.
  - The repository gains a local `release-lachie-skills` skill and a `rollout.sh` script that updates Claude Code, Codex, and OpenCode and compares each installed copy with `main`. The README's Codex update steps now include `codex plugin add`, because upgrading the marketplace leaves the installed plugin on its old version.

## 0.12.1

### Patch Changes

- d23f714: `project-bootstrap` resolves fnox secrets in every git worktree. Before, the token lived in a gitignored `fnox.local.toml` that only the bootstrapped checkout had. Now a `main_checkout` mise var finds the main checkout from any worktree, and `.config/mise.toml` exports `OP_SERVICE_ACCOUNT_TOKEN` from that checkout's `fnox.local.toml`. If that file is missing, mise keeps a token the caller already set. `bootstrap-fnox.sh` writes to the main checkout even when run from a worktree, and verifies through `mise x`.

## 0.12.0

### Minor Changes

- 5d09a9e: Add podcast to turn source material into a two-voice script and mastered audio rendered locally with Kokoro, with scripts for rendering, mastering, and a Whisper diff against the script.
- 1e2944b: project-bootstrap now takes a project live,. It settles every input and the plan in one round. Each project gets a `project-<project>` vault and an `agent-<project>` service account, whose token is stored age-encrypted per machine, and 1Password items use scriptable `<service>-<purpose>[-<environment>]` names. Staging and production run on Coolify behind a Cloudflare Tunnel with an origin certificate, with Litestream backups to B2. Production releases are date tags with communiqué notes, replacing Changesets. Bootstrap now also writes a verification skill. It folds in the fixes that run needed: nub's GitHub backend, `@repo/tsconfig` as a runtime dependency, SQLite WAL, a database-backed auth rate limit, curl for Coolify's health check, deploys started with `POST`, and CD change detection that covers every file reaching the image.
- 56bd150: Add a secrets step to project-bootstrap: a shared `Agent Automation` vault plus a per-project 1Password vault and service account, fnox reading the service-account token, and an agent-browser credential plugin and mise task for signing in to sites with no API.
- c11b1c8: Add interview-questions to build repo-grounded practice libraries with architect, PM, and CEO variants and handoff notes.

### Patch Changes

- 925dfba: The Claude plugin manifest and marketplace entry no longer pin `version`, so Claude Code versions the plugin by commit and `claude plugin update` picks up every change on `main` instead of waiting for a release.
- 8c5df62: `project-bootstrap` covers adopting a project whose 1Password service account predates the vault layout, hands the 1Password setup script to the human to run in their own Terminal, unsets the token fnox's shell hook exports before using the human's session, adds a `cloudflare-workers-deploy` token for Workers deploys, and installs hk hooks by hand instead of from `prepare`, because the hook lives in git config every worktree shares.

## 0.11.0

### Minor Changes

- dc32b2b: `working-session` runs on T3 Code instead of Herdr. The dev server runs as a background command, the human watches the app in a T3 Code preview tab, and workers and testers are `delegate_task` children that the foreman pauses and resumes through their threads.

## 0.10.1

### Patch Changes

- babc8ba: `principle-make-operations-idempotent` judges a leftover's staleness by evidence that holds wherever the previous run could have stopped, covers a claimed job as well as a lock, temporary file, or half-written record, and adds comparison by content as a second example. The 0.10.0 note for `correct` said it drops a weak test. The skill fixes or deletes it.

## 0.10.0

### Minor Changes

- 836db7a: Let the model load every skill `lachie-mode` routes to, including `lachie-mode`, `configure-models`, and the `no-comments` gate, and check skill routing, frontmatter, and local paths during package verification.

### Patch Changes

- 34cb960: `principle-make-operations-idempotent` requires a leftover lock, temporary file, or half-written record to be recognizable as stale wherever the previous run stopped. `correct` drops a test that still passes when the behavior breaks, or that fails when only the internals change.
- bf6bf61: Tighten skill bodies: cut duplicated instructions in `tdd`, `blast-radius`, `show-me-your-work`, and `teach`, point `automate-me` and `reflect` at the package source instead of installed copies, and stop `figure-it-out` and `configure-models` from blocking on reversible decisions.

## 0.9.0

### Minor Changes

- 30729b6: Add a Cursor and Grok Bot plugin manifest, and build the package with APM 0.33.0.
- 226b757: Add `correct` for repeated agent mistakes, `principle-explain-the-number` and `benchmark-checklist` for measured numbers, and architect checks for split ownership, duplicate paths, importable internals, and hand-synced lists. Verification launch now means a usable application, and `lachie-mode` labels every claim that lacks a measurement.

## 0.8.0

### Minor Changes

- 670475b: Port the project-bootstrap skill's templates and references to Effect 4: `Context.Service` instead of `Context.Tag`, `Layer.effect` for the scoped SQLite connection, `ConfigProvider.layer`, the capitalised `Config` constructors, and `Cause.findErrorOption`.
