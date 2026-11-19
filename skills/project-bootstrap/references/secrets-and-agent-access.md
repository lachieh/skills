# Secrets and agent access

How a project and its agents reach credentials: the 1Password vault layout,
the service account, fnox, and logged-in browser sessions for services that
have no API.

## Vault layout

Two vaults per project, one service account per project, all in the same
1Password account:

| Vault              | Holds                                                     | Service account access    |
| ------------------ | --------------------------------------------------------- | ------------------------- |
| `Agent Automation` | Credentials every project uses: Cloudflare, Coolify, etc. | `read_items`              |
| `<project>`        | Credentials only this project uses                        | `read_items, write_items` |

The service account is named `<project> agent`. Write access to its own vault
lets agents store what they create, such as a session encryption key. The
shared vault stays read-only so one project cannot change another's
credentials. A leaked token exposes one project and the shared vault, and
revoking it touches nothing else.

`Agent Automation` is created once per 1Password account. Every later project
only adds its own vault and service account.

Service accounts cannot read Private, Personal, or Employee vaults. Move a
login the project needs out of Private into `<project>`; do not copy it, or
the two drift on the next password change.

## Setup

Vault and service-account creation needs an owner or administrator. The agent
runs these `op` commands; each one raises a 1Password desktop-app approval the
human accepts. Run `op` outside the command sandbox: the sandbox blocks the
desktop-app socket and `op` hangs without an error. When `op` reports
`promptError`, the approval was dismissed or timed out; ask, then run it again.

1. Pick the 1Password account (`op account list`) and pass `--account` on
   every command.
2. Create the vaults. Skip `Agent Automation` when `op vault list` shows it.

   ```sh
   op vault create "Agent Automation" --account <account>
   op vault create "<project>" --account <account>
   ```

3. Move existing project logins into `<project>`:
   `op item move <item> --current-vault Private --destination-vault <project>`.
   The item ID changes; refer to items by title.
4. Create the service account and store its token in one pipeline. 1Password
   returns the token once, so it is never printed, and it is stored before
   anything else can fail:

   ```sh
   token=$(op service-account create "<project> agent" --account <account> \
     --vault "Agent Automation:read_items" \
     --vault "<project>:read_items,write_items" --raw)
   T="$token" python3 -c '
   import json, os
   print(json.dumps({"title": "<project> agent service account",
     "category": "API_CREDENTIAL",
     "fields": [{"id": "credential", "type": "CONCEALED",
                 "label": "credential", "value": os.environ["T"]}]}))' \
     | op item create --account <account> --vault Private
   ```

   `op item create` reads the JSON template from stdin, so the token never
   appears in process arguments. The Private copy is the human's backup; the
   service account cannot read it.
5. Verify the scope: `OP_SERVICE_ACCOUNT_TOKEN=… op vault list` lists exactly
   the two vaults.
6. Put the token in the macOS Keychain for fnox, as in [fnox](#fnox).

## fnox

fnox resolves every secret the project uses. `fnox.toml` is committed and holds
only references, never values. Copy `templates/fnox.toml`.

- The `keychain` provider holds the one local secret, the service-account
  token. Each machine stores it once:

  ```sh
  op read "op://Private/<project> agent service account/credential" \
    | fnox set OP_SERVICE_ACCOUNT_TOKEN --provider keychain --key-name op-service-account
  ```

- The `1password` provider reads the token through
  `token = { secret = "OP_SERVICE_ACCOUNT_TOKEN" }`. With a service-account
  token, `op` never asks the desktop app, so agents run without approval
  prompts. This needs fnox 1.48 or later; pin it in `.config/mise.toml`.
- Give the shared vault its own provider instance with `vault = "Agent
  Automation"`, and reference shared items through it.
- Mark secrets that only a tool reads, such as passwords a credential plugin
  fills, `env = false`. `fnox exec` then leaves them out of the child
  environment, and they are read only through `fnox get`.
- Run commands that need secrets as `fnox exec -- <command>`, or have a mise
  task re-exec itself through `fnox exec` when a required variable is missing.

macOS asks once per fnox binary before it reads the Keychain. A read that hangs
is that dialog waiting, often behind other windows or after the screen locked.
"Always Allow" ends it until the next fnox upgrade.

## Browser sessions

Use this part when an agent has to work in a site that has no API, such as an
affiliate network or a vendor dashboard.

agent-browser does not commit session state. Its pattern is a stable session
name plus `--restore`: state is saved per machine under
`~/.agent-browser/sessions/` and loaded on the next launch. The repository
holds how to recreate a session, not the session itself.

- **Encryption.** fnox exports `AGENT_BROWSER_ENCRYPTION_KEY`, a 32-byte hex
  value stored in `<project>`. Saved state is then written as `.json.enc`.
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

## Completion

`fnox provider test op` succeeds, `fnox exec -- env` shows the exported
secrets and none marked `env = false`, and each browser task, run twice,
reaches the signed-in page and leaves only a `.json.enc` file for its session.
