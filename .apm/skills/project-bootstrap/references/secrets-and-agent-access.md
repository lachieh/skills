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
- Any credential the agent can create through an API or the signed-in browser
  is the agent's job: app secrets, DNS records, deploy tokens, bucket keys,
  vendor apps. Create it, store it in `project-<project>`, and read it back.
  The human's part is three batched actions: running the setup script once,
  turning on Chrome remote debugging, and confirming GitHub Mobile prompts.

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
after uses the service account, so create it before reading or creating any
other secret.

Copy `templates/scripts/setup-1password.sh` to `scripts/setup-1password.sh`,
substitute its placeholders, and list in `logins` the items to move out of
Private. Do not write a setup script of your own or keep one outside the
repository.

- The approval prompt never reaches an agent's shell: `op` waits, then fails
  with `promptError` or "account is not signed in". Do not run the script from
  the agent. Give the human the one command that runs it in their own
  Terminal, with the absolute path of the checkout that holds the script:
  `bash <checkout>/scripts/setup-1password.sh`.
- The script stops at the first failure (`set -euo pipefail`) and skips work
  already done, so the human can rerun it after a timeout.

The script:

1. Runs `unset OP_SERVICE_ACCOUNT_TOKEN` (see the fnox shell hook below).
2. Exports `OP_ACCOUNT` as `<account>`, so every `op` call uses that account.
   Take the value from `op account list`, and ask which account it is when
   there is more than one.
3. Creates `project-<project>`, and `Agent Automation` when it is missing.
4. Creates the service account and stores its token in the project vault as
   `op-service-account` in one pipeline. 1Password returns the token once.
   The token passes from `op service-account create --raw` to `op item create`
   through the environment and a JSON template on stdin, so it never appears
   in output or process arguments, and it is stored before anything else can
   fail.
5. Moves each login in `logins` out of Private with `op item move`.
6. Runs `scripts/bootstrap-fnox.sh` for this machine (below). Its `op read`
   happens in the same approved session.

Do not wait for the human to say the script ran. Poll every 15 seconds:

```sh
env -i HOME="$HOME" PATH="$PATH" mise x -- sh -c \
  '[ -n "$OP_SERVICE_ACCOUNT_TOKEN" ] && fnox exec -- op vault list'
```

The script is done when this lists exactly `Agent Automation` and
`project-<project>`. A command that only succeeds is not the test: during an
adoption the previous token also lists vaults. The guard keeps `op` from
running without a token, which would raise an approval prompt on the human's
desktop at every poll. After 15 minutes without that result, tell the human
which command you are waiting for.

Then verify with the token alone: a read from `Agent Automation` succeeds and
a write there is refused.

### Adopting an existing project

A project set up before this layout has its own vault and service account
under other names. 1Password cannot add a vault to a service account or change
its permissions after creation, so an account that lacks either grant is
replaced, not extended.

- Keep the existing account only when it already has `read_items` on
  `Agent Automation` and `read_items, write_items` on the project vault.
  Store its token in the vault as `op-service-account` before the setup
  script runs: rename the item that holds it. Without that item and without
  `--replace-account`, the script stops before it renames the vault.
- Rename the vault to `project-<project>`. Do not keep the old name because
  code or workflows read `op://<vault>/…` by name. Update every `op://`
  reference, workflow, fnox file, and script that names the vault in the same
  pull request as the rename. Find them with `git grep -n -F '<old name>'`. A
  vault left under its old name is renamed by hand later, and CD and fnox
  then fail until someone finds every reference.
- Replace the account with the same setup script. `--replace-account` creates
  `agent-<project>` with both grants and overwrites `op-service-account` with
  its token. `--rename-vault '<old name>'` renames the vault first.

The rename and its references change together, in their own pull request,
before the rest of the alignment. In this order:

1. Open the pull request that updates every reference and get its CI green.
   Do not merge it yet. When the account is being replaced, also save the
   token the project uses now to a `umask 077` file outside the repository,
   without printing it. The setup script overwrites every stored copy, and
   step 6 needs the old token.
2. Give the human
   `bash <checkout>/scripts/setup-1password.sh --rename-vault '<old name>'`,
   with `--replace-account` when the account is replaced. `<checkout>` is the
   worktree on the pull request's branch, since the script and the renamed
   references exist only there. Poll as above from that worktree.
3. When the account was replaced, set the new token as
   `OP_SERVICE_ACCOUNT_TOKEN` on each GitHub environment.
4. Merge the pull request at once. Between the rename and the merge, `main`
   reads a vault name that no longer exists, so merge nothing else and start
   no deploy in that time.
5. Rerun `bootstrap-fnox.sh` on each other machine.
6. Revoke the old token on 1Password.com (Developer, Service accounts) last,
   confirm the revocation, then delete the saved token file.

A revoked token does not make `op` fail. `op` falls back to the human's
desktop session, so `op vault list` with the old token can still succeed. A
command that merely succeeds proves nothing. Confirm with
`OP_SERVICE_ACCOUNT_TOKEN="$(cat <file>)" op whoami`, which reports who
answered. A live service-account token prints that account's Integration ID.
The revocation holds when the output no longer shows an Integration ID, or
when the command fails with an authentication error. The fallback can raise
an approval prompt on the human's desktop, so say that the check is coming
before running it.

## fnox

fnox resolves every operator secret. `fnox.toml` is committed and holds only
references. Copy `templates/fnox.toml`: two 1Password providers, `shared`
(`Agent Automation`) and `project` (`project-<project>`), both authenticating
with `token = { secret = "OP_SERVICE_ACCOUNT_TOKEN" }`. Each secret names only
`<item>/<field>`; its provider picks the vault. Declare every project item an
agent will use, so agents use them by name.

fnox's shell hook resolves every declared secret each time a shell enters the
repository, and prints a 1Password warning for each item that does not exist.
The template marks the items that later steps create `if_missing = "ignore"`.
Give the same key to any secret you declare before its item is stored.

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
- With a valid service-account token `op` never asks the desktop app. With no
  token, or a revoked one, it falls back to the desktop session. Never run
  bare `op` in agent work; use `fnox exec -- op …`.
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
  Store the item before adding its line to `fnox.toml`. The template does not
  mark it `if_missing = "ignore"`, so a missing key shows as a warning.
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

Some setup has no documented API: Coolify scoped tokens and GitHub
fine-grained tokens, plus Backblaze keys and bucket settings when
`backblaze-b2-master` is missing. Do it in the human's logged-in Chrome.

- Ask up front, in the step 1 plan: in that Chrome, open
  `chrome://inspect/#remote-debugging` and tick "Allow remote debugging for
  this browser instance".
- Connect to port 9222 explicitly: `agent-browser connect 9222`. Do not rely
  on `--auto-connect` to find the port.
- Chrome shows the human an Allow prompt when the agent connects. Announce
  the connection before making it, so the human expects the prompt. Wait at
  least two minutes for the click, and retry the connection once, before
  reporting a block. A first attempt that times out usually means the human
  has not clicked yet.
- Export the session into the agent's own browser and work there, leaving the
  human's tabs alone. When another agent is using the same Chrome, work in a
  window this run opened.
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
