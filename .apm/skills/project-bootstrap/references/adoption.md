# Adopting an existing repository

Use this file when the repository already exists and the task is to align it
with the reference architecture. Nothing is rebuilt from zero. The work is a
survey, one plan message, and then the changes the human approved.

## 1. Survey

Read before changing anything. For each step of the procedure in `SKILL.md`,
read the step's reference, then record what the repository has now and how it
differs from the step's result.

Survey the live setup as well as the files: the vaults the project's current
service account sees, the GitHub environments with their secrets and
variables, the Coolify apps, the DNS records, and the tunnel routes. Use the
credentials the project already has. Do not run bare `op`.

**Early exit.** When the survey shows the repository already meets every step
that applies, say so, show the gap table as the evidence, and stop. Make no
change.

## 2. Gap table

Give every step one row: a verdict and a one-line reason.

| Verdict | Meaning                                                        |
| ------- | -------------------------------------------------------------- |
| keep    | What exists meets the step, or is keep-by-default (see below)  |
| replace | What exists changes to the skill's form                        |
| skip    | The step does not apply to this repository                     |

Which steps apply to an existing repository:

- **1, inputs and plan.** Applies. Derive the placeholders from the
  repository as it is. The plan is the message in part 3.
- **2, toolchain.** Survey it and keep a toolchain that works. One part is
  required whatever the verdict: step 3 needs `fnox` and `age` in
  `.config/mise.toml`, with the `[vars]` and `[env]` entries from
  `toolchain.md` that export `OP_SERVICE_ACCOUNT_TOKEN` in every worktree,
  and `fnox.local.toml` in `.gitignore`. Without the mise entries
  `bootstrap-fnox.sh` fails its last check. Without the ignore entry the
  machine's encrypted token can be committed.
- **3, secrets.** Applies in full, through "Adopting an existing project" in
  `secrets-and-agent-access.md`.
- **4 to 7, packages, server, modules, tests.** Survey them and keep the
  application as built. Add a module only when the plan lists it as in.
- **8, verification skill.** Applies. Create it when
  `.agents/skills/verify-<project>/` is missing. Run
  `maintain-verification-skill` when it exists.
- **9, CI and delivery.** Applies to how workflows load secrets, the
  environment gates, and the CI concurrency group. Release tooling is
  keep-by-default.
- **10, environments.** Applies. See the hosting rule below.
- **11, repository documents.** Applies. Merge the `AGENTS.md` sections into
  the existing file. Do not replace the file.
- **12, proof and staging.** Applies, with the repository's own check, build,
  and test commands.
- **13, send back.** Applies.

Rules for the verdicts:

- **Storage, backups, and release tooling are keep-by-default.** The existing
  database, its backup method, and its release process stay. A move to SQLite
  with Litestream, to a B2 bucket, or to date-tagged releases is an optional
  proposal. List optional proposals in their own part of the plan, apart from
  the security and secrets items, and apply one only when the human accepts
  it. Still report a risk in what is kept, such as a database with no copy
  off the server.
- **Hosting moves to the skill's default** (Coolify on the existing VPS behind
  the Cloudflare Tunnel, as in `hosting.md`) unless the human excluded hosting.
  An older document in the repository that recommends another host does not
  override the skill. Correct or delete that document in the same change.
- **The vault is renamed, not kept**, and every reference to it changes in
  the same pull request. See `secrets-and-agent-access.md`.
- **What the alignment replaces is removed in the same change.** Apply
  `principle-finish-the-migration` to every hostname, secret, and workflow the
  alignment replaces. Check its consumers first: the repository, the GitHub
  environments, the DNS records and tunnel routes, and any client that stores
  a server address. When none remains, remove it. Do not keep it because
  something might still use it.

## 3. One plan message

Put all of this in one message before changing anything:

- the gap table;
- every module from step 1 of `SKILL.md`, marked in or out with the reason. Do
  not leave a module out on your own judgement without listing it;
- the security and secrets items, which are not optional;
- the optional proposals, listed apart from them;
- every known gap you will not fix, with the reason;
- the human actions and permission prompts from step 1.

Start when the human approves the plan. Treat later answers as changes to it.

## 4. Apply

Work through the rows marked replace in step order, with each step's own
completion line as the check.

- When step 3 renames the vault or replaces the service account, ship step 3
  first as its own pull request, in the order "Adopting an existing project"
  in `secrets-and-agent-access.md` gives. The rename and every reference to
  the vault land together, so `main` never reads a vault name that no longer
  exists.
- Put the remaining rows on a second branch and open its pull request as
  step 12 describes.
- Load `technical-writing` and `unslop` and apply them to the title and body
  of every pull request the alignment opens.

## Several projects at once

The human may start the same alignment in several repositories in the same
minute. Those runs share one Chrome, one Coolify proxy configuration, and one
Cloudflare Tunnel, and an update to the tunnel replaces every project's
routes.

- Tunnel: re-read the configuration immediately before each write, build the
  new list from that read, and change only this project's entries. A backup
  taken minutes ago may lack a route another run added since.
- Coolify proxy: add or edit only this project's file under Dynamic
  Configurations. The one exception is rotating a private key that reached
  your output, as part 2 of `hosting.md` requires.
- Browser: work in a window or tab this run opened. Leave the others alone.
