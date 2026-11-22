# Secrets and agent access

How a project and its agents reach credentials: the 1Password vault layout,
the service account, fnox, and logged-in browser sessions for services that
have no API.

## Vault layout

One shared vault, then one vault and one service account per project, all in
the same 1Password account:

| Vault               | Holds                                                    | `agent-<project>` access  |
| ------------------- | -------------------------------------------------------- | ------------------------- |
| `Agent Automation`  | Master tokens every project uses, named by service       | `read_items`              |
| `project-<project>` | Everything only this project uses, including its own SA  | `read_items, write_items` |

- The service account is `agent-<project>`. A leaked token exposes one project
  and the shared vault, and revoking it touches nothing else. Never reuse one
  project's service account for another.
- Write access to its own vault lets agents store what they create: minted
  tokens, generated app secrets, certificates.
- The shared vault stays read-only so one project cannot change another's
  credentials. Adding or renaming a shared item needs the human's session.
- `Agent Automation` is created once per 1Password account and already holds
  these items. Check for them with the service account; ask the human only for
  one that is missing.

| Item                      | What it is                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| `coolify-root`            | Coolify root API token, no expiry                                   |
| `cloudflare-token-minter` | Cloudflare **account** token with Account API Tokens Write          |
| `cloudflare-dns-edit`     | Account token: DNS Write and Zone Read, every zone                  |
| `cloudflare-tunnel-edit`  | Account token: Cloudflare Tunnel Write                              |
| `cloudflare-ssl-edit`     | Account token: SSL and Certificates Write, Zone Settings Write      |
| `backblaze-b2-master`     | Backblaze master application key (`username` holds the key ID)      |
| `github-copilot-requests` | Fine-grained GitHub token, Copilot Requests permission only         |

- Cloudflare tokens are account tokens, not user tokens. The minter creates
  narrower ones over the API when a project needs them.
- Service accounts cannot read Private, Personal, or Employee vaults. Move a
  login the project needs into `project-<project>`; do not copy it, or the two
  drift on the next password change.

### Item names

Every item is lowercase kebab-case `<service>-<purpose>[-<environment>]`, an
API Credential item with its secret in a field named `credential`. Scripts
then always read `op://<vault>/<item>/credential`. A second value, such as a
key ID, goes in `username`.

- Name shared items by service, never by project.
- Project items: `op-service-account`, `coolify-deploy-staging`,
  `coolify-deploy-production`, `better-auth-secret-staging`,
  `better-auth-secret-production`, `backblaze-b2-litestream`,
  `cloudflare-origin-cert`, `cloudflare-origin-key` (the last two are
  documents), and `cloudflare-workers-deploy` when the project deploys a
  Cloudflare Worker.
- Mint `cloudflare-workers-deploy` with `cloudflare-token-minter`:
  `POST /accounts/<account id>/tokens` with one policy on
  `com.cloudflare.api.account.<account id>` granting Workers Scripts Write and
  Account Settings Read. Look up both permission-group IDs with
  `GET /accounts/<account id>/tokens/permission_groups`. wrangler reads it from
  `CLOUDFLARE_API_TOKEN`, so declare it in `fnox.toml` under that name with
  the `project` provider.
- `op://` references break on titles with em dashes or parentheses, and
  `gh secret set` then receives empty input without failing. Refuse an empty
  value before writing any secret anywhere.
- Password items name their field `password`. Create secrets as API
  Credentials instead so the field is `credential`.

## Setup

Creating a vault or a service account needs an owner or administrator, so it
runs under the human's 1Password session, which raises a desktop-app approval
for each new shell. Batch it into **one script and one approval**. Everything
after uses the service account.

- The approval prompt never reaches an agent's shell: `op` waits, then fails
  with `promptError` or "account is not signed in". Do not run the script from
  the agent. Write it to a file and give the human the one command that runs
  it in their own Terminal, then verify with the service account once they
  report back.
- The script stops at the first failure (`set -euo pipefail`) and skips work
  already done, so the human can rerun it after a timeout.

The script:

1. Runs `unset OP_SERVICE_ACCOUNT_TOKEN` (see the fnox shell hook below).
2. Picks the account (`op account list`; ask which is `<account>` when there
   is more than one) and passes `--account` on every command.
3. Creates `project-<project>` (and `Agent Automation` when `op vault list`
   lacks it).
4. Creates the service account and stores its token in the project vault in
   one pipeline. 1Password returns the token once, so it is never printed and
   is stored before anything else can fail:

   ```sh
   token=$(op service-account create "agent-<project>" --account <account> \
     --vault "Agent Automation:read_items" \
     --vault "project-<project>:read_items,write_items" --raw)
   T="$token" python3 -c '
   import json, os
   print(json.dumps({"title": "op-service-account",
     "category": "API_CREDENTIAL",
     "fields": [{"id": "credential", "type": "CONCEALED",
                 "label": "credential", "value": os.environ["T"]}]}))' \
     | op item create --account <account> --vault "project-<project>"
   ```

   `op item create` reads the JSON template from stdin, so the token never
   appears in process arguments.

5. Moves any existing project logins out of Private:
   `op item move <item> --current-vault Private --destination-vault project-<project>`.
6. Runs `scripts/bootstrap-fnox.sh` for this machine (below). Its `op read`
   happens in the same approved session.

Then verify with the token alone: `op vault list` shows exactly the two
vaults, a read from `Agent Automation` succeeds, and a write there is refused.

### Adopting an existing project

A project set up before this layout has its own vault and service account
under other names. 1Password cannot add a vault to a service account or change
its permissions after creation, so an account that lacks either grant is
replaced, not extended.

- Keep the existing account only when it already has `read_items` on
  `Agent Automation` and `read_items, write_items` on the project vault.
- Keep the existing vault when code or workflows read `op://<vault>/…` by
  name, and use its name wherever this skill says `project-<project>`,
  including `vault` in `fnox.toml` and `bootstrap-fnox.sh`.
  Otherwise rename it to `project-<project>`.
- Replace the account in the same setup script: create `agent-<project>` with
  both grants on the vault being kept, and store its token as
  `op-service-account`, piping step 4's JSON template into
  `op item edit op-service-account` when the item exists and `op item create`
  when it does not.
- Then move every consumer to the new token before revoking the old one: the
  `OP_SERVICE_ACCOUNT_TOKEN` secret on each GitHub environment, and
  `bootstrap-fnox.sh` rerun on each machine. Revoke the old token on
  1Password.com (Developer, Service accounts) last.

## fnox

fnox resolves every operator secret. `fnox.toml` is committed and holds only
references. Copy `templates/fnox.toml`: two 1Password providers, `shared`
(`Agent Automation`) and `project` (`project-<project>`), both authenticating
with `token = { secret = "OP_SERVICE_ACCOUNT_TOKEN" }`. Each secret names only
`<item>/<field>`; its provider picks the vault. Declare every project item an
agent will use, so agents use them by name.

The one local secret is the service-account token. Copy
`templates/scripts/bootstrap-fnox.sh`; a human runs it once per machine:

1. Creates `~/.config/fnox/age.txt` (mode 600) when missing.
2. Writes the gitignored `fnox.local.toml` with an `age` provider for that key,
   in the main checkout even when run from a worktree. `.config/mise.toml`
   exports the token from there into every worktree (see `toolchain.md`).
3. Reads the token with one `op read` of
   `op://project-<project>/op-service-account/credential` under the human's
   session. A cloud runner with no human session passes `--from-env` to take
   it from `OP_SERVICE_ACCOUNT_TOKEN` instead.
4. Stores it age-encrypted with `fnox set --provider age`, checks the
   ciphertext landed, then resolves the project vault through
   `mise x -- fnox exec` in a clean environment, the way every worktree reads
   it.

- age, not the Keychain: macOS ties a Keychain "Always Allow" to the binary
  path, and mise installs each fnox upgrade at a new path, so the prompt
  returns after every upgrade.
- `fnox set --description` writes the entry without its ciphertext. Do not pass
  it.
- Only a shell with nothing in its environment proves the setup:
  `env -i HOME="$HOME" PATH="$PATH" mise x -- fnox exec -- …`, run from a
  worktree as well as the main checkout. A check run with the token
  already exported proves nothing.
- With a service-account token `op` never asks the desktop app. Never run bare
  `op` in agent work; use `fnox exec -- op …`.
- mise and fnox's shell hook export `OP_SERVICE_ACCOUNT_TOKEN` into the
  human's own shell whenever it enters the repository. `op` there then acts as the service
  account: it sees two vaults and cannot create a vault or a service account.
  A script that needs the human's session unsets the token first, and
  `bootstrap-fnox.sh` ignores it unless given `--from-env`, so a stale token
  is never stored again.
- Mark secrets that only a tool reads, such as passwords a credential plugin
  fills, `env = false`. `fnox exec` then leaves them out of the child
  environment, and they are read only through `fnox get`.
- CI does not use fnox. Workflows load items with
  `1password/load-secrets-action@v5` (`export-env: true`), and
  `OP_SERVICE_ACCOUNT_TOKEN` is the only GitHub secret, set on the `staging`
  and `production` environments rather than the repository so pull-request
  jobs cannot read it.

## Browser sessions

Use this part when an agent has to work in a site that has no API, such as an
affiliate network or a vendor dashboard.

agent-browser does not commit session state. Its pattern is a stable session
name plus `--restore`: state is saved per machine under
`~/.agent-browser/sessions/` and loaded on the next launch. The repository
holds how to recreate a session, not the session itself.

- **Encryption.** fnox exports `AGENT_BROWSER_ENCRYPTION_KEY`, a 32-byte hex
  value stored in `project-<project>` as `agent-browser-encryption-key`. Saved state is then written as `.json.enc`.
  Without it the state is plaintext JSON readable by other local users.
  agent-browser reads the key when its background process starts, so close
  any session that started without it.
- **Session name.** Use a fixed name, `<project>-<service>`. The
  `session id --scope worktree` form differs per worktree, so other checkouts
  would not find the session.
- **Credentials.** Copy `templates/tools/agent-browser/` (the plugin and its
  config). The plugin implements agent-browser's `credential.read` protocol and
  answers `--item SERVICE` with `fnox get SERVICE_EMAIL` and
  `fnox get SERVICE_PASSWORD`. agent-browser fills the form itself, so the
  password stays out of the agent's environment, command arguments, and
  output. Plugins load only from a file passed with `--config`.
- **Task.** One mise file task per service,
  `.config/mise/tasks/<service>/browser`, written from
  `templates/.config/mise/tasks/service/browser`. It opens the service with
  `--restore --restore-save always --restore-check-url <signed-in glob>`, and
  when the check fails it signs in with `auth login --credential-provider fnox
  --no-navigate`.

Facts that cost time to discover:

- Cloudflare's bot check blocks headless Chrome on many dashboards. Open those
  sessions `--headed`. The check is the human's to pass; do not click it.
- Under the default `--restore-save auto`, a failed restore check disables
  saving, so a fallback login is never stored. Use `always`.
- Many sites end the server-side login when the browser closes, while a
  long-lived trusted-device cookie survives. The restore then keeps the
  device trusted and skips emailed device codes, and the task signs in again
  in seconds. Do not chase a restore that always lands on the login page.
- Two-step logins (email, then password) show the email read-only on the
  second step, and `auth login` will not fill a read-only field. Fill the email
  and continue in the task, clear `readOnly` with `eval`, then run
  `auth login --no-navigate` with explicit selectors.
- The signed-in glob must exclude the device-verification page, which often
  sits under the same `/secure/` prefix as the dashboard.
- A device code goes to the account's email. When the agent cannot read that
  inbox, the task waits for the human to enter it in the window.

## Driving the human's dashboards

Some setup has no API: Coolify scoped tokens, GitHub fine-grained tokens,
Backblaze keys and bucket settings. Do it in the human's logged-in Chrome.

- Ask up front: in that Chrome, open `chrome://inspect/#remote-debugging` and
  tick "Allow remote debugging for this browser instance". Connect with
  agent-browser and approve Chrome's prompt once. Export the session into the
  agent's own browser and work there, leaving the human's tabs alone.
- Copying the profile or its cookie file does not work. Chrome encrypts cookies
  with a Keychain key that agent-browser's launch (`--use-mock-keychain`),
  headless Chrome, and a second profile cannot read, and it drops them. Do not
  spend time on it; ask for the toggle.
- Tell the human to turn the toggle off when the dashboard work is done.
  While it is on, any local process can drive that browser.
- GitHub asks to confirm access before creating tokens. Pick GitHub Mobile and
  send the human the digits the page shows; they approve on the phone.
- GitHub has no API for fine-grained personal tokens.
- Coolify forms are Livewire components. When a typed value does not reach the
  save, set the field on the component and call its save action. Escape closes
  the whole dialog, not just a dropdown.
- Read a secret off a page into a `umask 077` file, never into output, store
  it in 1Password, verify the service account reads it back, then delete the
  file and the exported session.

## Completion

`env -i HOME="$HOME" PATH="$PATH" mise x -- fnox exec -- op vault list`, run
in a worktree, lists exactly the two vaults without a prompt, `fnox exec -- env | cut -d= -f1` lists the
exported secret names and none marked `env = false`, and each browser task, run twice,
reaches the signed-in page and leaves only a `.json.enc` file for its session.
