---
name: release-lachie-skills
description: Release a new version of the lachie-skills package and install it in Claude Code, Codex, and OpenCode on every T3 environment. Use when asked to release, publish, or roll out these skills.
---

# Release lachie-skills

Use this in the `lachieh/skills` repository. Asking for a release authorizes
merging the change, merging the version pull request, and updating the installed
plugin on every linked machine. `CONTRIBUTING.md` owns authoring, the changeset
format, and how CI versions and tags. This skill owns the order and the proof.

## 1. Ship the change

1. Confirm the change has a changeset. Every pull request needs one.
2. Run the checks in `CONTRIBUTING.md` under "Verify".
3. Load `shipit` and carry the pull request to merged.

## 2. Release the version

1. The push to `main` opens or updates the `Version packages` pull request from
   `changeset-release/main`. Wait for it, then for its checks.
2. Read its diff: the version in `package.json` and `apm.yml`, the new
   `CHANGELOG.md` entry, and regenerated files only.
3. Merge it.
4. Watch the run on `main` to its end. It creates the `v<version>` tag and the
   GitHub release. Confirm both exist with `gh release view v<version>`.

## 3. Roll out to every environment

Every client installs from `main`, so run this after the release exists.

1. List the environments: this machine, and each one `t3_environment_links`
   returns. An unreachable environment is a finding. Report it; do not skip it
   silently.
2. On this machine, run `scripts/rollout.sh` from this skill's directory.
3. On each linked environment, delegate one task to it in this project. The task
   runs the script from `origin/main`, so the checkout's branch does not matter:

   ```sh
   git fetch origin main
   git show origin/main:.agents/skills/release-lachie-skills/scripts/rollout.sh | bash
   ```

   Ask for the script's full output back, unedited.
4. Read each output. The script updates the plugin in the three clients, and
   installs it in a client that lacks it. It then compares every file under each
   client's installed `skills/` directory with `origin/main`, and prints one line
   per client: `ok`, `MISMATCH`, or `not installed on this machine` when the
   client itself is absent. It exits 1 on any mismatch.
5. For a mismatch, read the log lines printed under it and fix the cause. Rerun
   with `--check` to compare without updating.

A running session keeps the skills it started with. Tell the human that new
sessions get the new version.

## Completion

The change is merged, the `v<version>` tag and release exist, and the script
printed `ok` for every client installed on every reachable environment. Report
one line per environment and client, and name any client or environment that
was missing or unreachable.
