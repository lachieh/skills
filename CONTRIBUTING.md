# Contributing

This file covers changing the skills and agent, verifying the package, and
releasing it. Installation for each client is in [README.md](README.md).

## Source of truth

Follow [APM's authoring guide](https://microsoft.github.io/apm/producer/author-primitives/).
Edit `.apm/skills/` and `.apm/agents/lachie.agent.md`. Package identity, version,
and marketplace metadata live in `apm.yml`. Do not edit generated root files.

The build installs the package from a copy holding only `apm.yml`, `apm.lock.yaml`,
and `.apm/`, then generates shared `skills/`, Claude `agents/`, both native plugin
manifests and marketplaces, and the OpenCode 2 / Pi package metadata at the root.
Installing from the repository root would let APM read the generated `skills/`
instead of `.apm/skills/`, and the drift check would compare the output with
itself. OpenCode 2 uses the small adapter in `scripts/templates/opencode2.js`;
APM 0.30.0 has no OpenCode 2 plugin pack format. `reviews/` stays outside release
archives.

## Set up once

```sh
mise install
mise exec -- hk install
```

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
3. Commit. The hook regenerates the root files and adds them to the commit.

## Verify

```sh
mise exec -- node "$(mise where npm:@anthropic-ai/claude-code)/node_modules/@anthropic-ai/claude-code/install.cjs"
mise exec -- node "$(mise where npm:@opencode-ai/cli)/node_modules/@opencode-ai/cli/postinstall.mjs"
mise exec -- uv run scripts/build-release.py --sync
mise exec -- uv run scripts/build-release.py --check
mise exec -- python3 scripts/verify-package.py
mise exec -- python3 scripts/verify-codex-release.py .
mise exec -- python3 scripts/verify-native-release.py .
mise exec -- node scripts/verify-pi-release.mjs . "$(mise where npm:@earendil-works/pi-coding-agent)/node_modules/@earendil-works/pi-coding-agent"
```

The Node commands prepare native binaries because mise skips npm postinstall
scripts. Runtime checks use isolated temporary configuration. CI checks generated
files for drift, tests Codex installation and update, and checks Claude and
OpenCode 2 skill and agent discovery, plus Pi package installation and skill discovery.

## Release

1. Change both versions in `apm.yml`.
2. Run `mise exec -- uv run scripts/build-release.py --sync`.
3. Commit source and generated files together, then push to `main`.
4. Tag that commit with the matching version (for example `v0.4.0`) and push the tag.

All native installers consume `main`. Tagged CI publishes one combined ZIP after
validation. No target-specific branches or releases are needed. The old runtime
branches contain historical releases and are no longer updated.
