# Contributing

This file covers changing the skills and agent, verifying the package, and
releasing it. Installation for each client is in [README.md](README.md).

## Source of truth

Follow [APM's authoring guide](https://microsoft.github.io/apm/producer/author-primitives/).
Edit `.apm/skills/` and `.apm/agents/lachie.agent.md`. Package identity, version,
and marketplace metadata live in `apm.yml`. Do not edit generated root files.

The build installs the package from a copy holding only `apm.yml`, `apm.lock.yaml`,
and `.apm/`, then generates shared `skills/`, Claude `agents/`, both native plugin
manifests and marketplaces, and the OpenCode / Pi package metadata at the root.
Installing from the repository root would let APM read the generated `skills/`
instead of `.apm/skills/`, and the drift check would compare the output with
itself. OpenCode uses the small adapter in `scripts/templates/opencode.js`;
APM 0.30.0 has no OpenCode plugin pack format. `reviews/` stays outside release
archives.

## Set up once

```sh
mise install
mise exec -- hk install
```

`mise.toml` pins OpenCode 2.0.15 and allowlists only the `@opencode/cli`
install script. Native verification resolves the managed executable with
`mise which opencode`, so another globally installed binary cannot shadow it.

`hk install` registers the git hooks declared in `hk.pkl`. On every commit, a
change under `.apm/`, `apm.yml`, or the build script regenerates the root
package files and stages them into the same commit. A commit that touches a
generated root file without a matching source change fails the drift check.
`pre-push` runs the same check without fixing. Set `HK=0` to bypass a hook
deliberately.

## Add or change a skill

1. Create or edit `.apm/skills/<name>/SKILL.md`. The frontmatter carries `name`
   (matching the directory), a one-line `description`, and
   `disable-model-invocation: true` unless the skill should load on its own.
2. Route it from `lachie-mode` when the mode should reach for it.
3. Add a changeset, as described under [Release](#release).
4. Commit. The hook regenerates the root files and adds them to the commit.

## Verify

```sh
mise exec -- uv run scripts/build-release.py --sync
mise exec -- uv run scripts/build-release.py --check
mise exec -- python3 scripts/verify-package.py
mise exec -- python3 scripts/verify-codex-release.py .
mise exec -- python3 scripts/verify-native-release.py .
mise exec -- node scripts/verify-pi-release.mjs .
```

Runtime checks use isolated temporary configuration. CI checks generated files
for drift, tests Codex installation and update, and checks Claude and OpenCode
skill and agent discovery, plus Pi package installation and skill discovery.

## Release

Every pull request carries a changeset, and CI fails without one. Run
`mise exec -- changeset`, choose `patch`, `minor`, or `major`, and write the
line that belongs in the changelog. A change that needs no release uses
`mise exec -- changeset --empty`.

Each push to `main` with pending changesets opens or updates the
`Version packages` pull request. Its commit runs `mise run version`, which
applies the changesets to `package.json` and `CHANGELOG.md`, copies the version
into both `apm.yml` fields, and regenerates the root files. Merging that pull
request leaves `main` on an untagged version, so CI validates it, creates the
`v<version>` tag and GitHub release with that version's changelog, and attaches
one combined ZIP.

All native installers consume `main`. No target-specific branches or releases
are needed. The old runtime branches contain historical releases and are no
longer updated.
