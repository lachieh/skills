---
name: project-operations
description: Operate a project that already follows the bootstrap architecture, covering 1Password vaults, service accounts, fnox secrets, Coolify, Cloudflare Tunnel, origin certificates, DNS, and signed-in dashboard sessions. Use when reading, creating, or rotating a credential, changing a hostname, or debugging hosting.
---

# Project Operations

Day-two work on a project that already follows the bootstrap architecture:
its secrets, its hosting, and the dashboards that have no API. The detail is
in two reference files of the sibling `project-bootstrap` skill. This file
holds the rules to keep in mind and says which file answers which question.
Read that file before you act. Do not guess at a setting.

## Rules

- One 1Password account holds two vaults an agent can reach.
  `Agent Automation` is shared by every project and read-only.
  `project-<project>` holds what only this project uses. The project's
  `agent-<project>` service account reads both and writes only the second.
  Never use one project's service account for another project.
- Never run bare `op`. Without the service-account token it falls back to the
  human's desktop session and waits on an approval prompt. Run
  `fnox exec -- op …`. Read a declared secret with `fnox exec -- <command>` or
  `fnox get <NAME>`.
- Item names are lowercase kebab-case `<service>-<purpose>[-<environment>]`.
  Each item is an API Credential with its secret in the `credential` field, so
  a reference is `op://<vault>/<item>/credential`.
- A credential that several projects use is named for the service, not the
  project, and belongs in `Agent Automation`. Adding one there needs the
  human's session.
- Before creating an item or a token, look for an existing one in both vaults.
- A new credential goes in `project-<project>`, and is declared in `fnox.toml`
  so agents use it by name. When you have no write route to that vault, say so
  before choosing another store.
- Tokens do not expire. Choose no expiry on every token form.
- Cloudflare tokens are account tokens, not user tokens.
- A credential you can create through an API or the signed-in browser is
  yours to create. Do not hand that work to the human.
- An operational task, such as opening a dashboard session, is a mise task
  under `.config/mise/tasks/`. Build, lint, and test scripts stay where the
  repository keeps them.
- Coolify's Proxy → Dynamic Configurations page renders every project's
  origin-certificate private key. Read only the file names there, and never
  print the page.

## Where the detail is

`../project-bootstrap/references/secrets-and-agent-access.md` answers:

- which items the shared vault holds, and what each token can do;
- how a machine or a worktree gets the service-account token, and how to
  prove a fresh shell reads a secret without a prompt;
- how to replace or revoke a service account, or rename a vault;
- how to keep a signed-in browser session for a site with no API;
- how to work in the human's Chrome for a dashboard with no API: the
  connection on port 9222 and the Allow prompt.

`../project-bootstrap/references/hosting.md` answers:

- why a hostname answers 502 or 503. Let's Encrypt cannot complete through
  the Cloudflare Tunnel, so the proxy serves a Cloudflare origin certificate;
- how to add or move a hostname: the certificate, the tunnel route, the DNS
  record, and the Coolify app's domains;
- how to change the tunnel without deleting another project's routes;
- how the Coolify apps, deploy tokens, backups, and GitHub environments are
  set up, and how to check each one.

Both files use placeholders such as `<project>` and `<domain>`. Resolve them
from the repository's `fnox.toml`, `AGENTS.md`, and workflows.
