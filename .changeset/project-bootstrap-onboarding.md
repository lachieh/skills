---
"lachie-skills": minor
---

project-bootstrap now takes a project live,. It settles every input and the plan in one round. Each project gets a `project-<project>` vault and an `agent-<project>` service account, whose token is stored age-encrypted per machine, and 1Password items use scriptable `<service>-<purpose>[-<environment>]` names. Staging and production run on Coolify behind a Cloudflare Tunnel with an origin certificate, with Litestream backups to B2. Production releases are date tags with communiqué notes, replacing Changesets. Bootstrap now also writes a verification skill. It folds in the fixes that run needed: nub's GitHub backend, `@repo/tsconfig` as a runtime dependency, SQLite WAL, a database-backed auth rate limit, curl for Coolify's health check, deploys started with `POST`, and CD change detection that covers every file reaching the image.
