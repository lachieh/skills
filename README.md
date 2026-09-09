# Lachie Skills

47 engineering skills, with a native Lachie agent for Claude Code and OpenCode 2.
Install from this repository's default branch using your client's native tools.
APM is used only by maintainers to generate the package.

## Codex

```sh
codex plugin marketplace add lachieh/skills
codex plugin add lachie-skills@lachie-skills
codex plugin marketplace upgrade lachie-skills
```

If already registered with `--ref codex`, remove that marketplace and register it
again without a ref. Codex updates installed plugins when refreshing the marketplace.
Start a new session to use updated skills. Codex plugins expose skills, including
`lachie-mode`; they do not register standalone custom agents.

## Claude Code

```sh
claude plugin marketplace add lachieh/skills
claude plugin install lachie-skills@lachie-skills
claude plugin marketplace update lachie-skills
claude plugin update lachie-skills@lachie-skills
```

Enable automatic updates for this marketplace in `/plugin` → Marketplaces.
If previously registered against the `claude` branch, remove the old marketplace
and register it again using the command above. The package includes the Lachie agent.
See [Claude's update settings](https://code.claude.com/docs/en/discover-plugins#configure-auto-updates).

## OpenCode 2

```sh
opencode2 plugin add 'github:lachieh/skills'
opencode2 plugin update 'github:lachieh/skills'
```

Select Lachie as a primary agent; installing does not change your default agent.
For an existing `#opencode2` installation, remove that entry with
`opencode2 plugin remove 'github:lachieh/skills#opencode2'` before adding the new one.
OpenCode 2 checks for updates and applies them through its native update command.
The beta version used for verification is pinned in `mise.toml`.
See [OpenCode 2 plugins](https://opencode.ai/v2/docs/plugins/).

## Pi

```sh
pi install https://github.com/lachieh/skills
pi update --extensions
```

The `pi` manifest in `package.json` exposes all skills. It does not register a
standalone agent or load the OpenCode adapter as a Pi extension.
See [Pi packages](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md).

## Hermes

```sh
hermes skills tap add lachieh/skills
hermes skills search lachie
hermes skills install lachieh/skills/skills/lachie-mode
hermes skills update
```

The tap exposes the shared `skills/` directory. Install individual skills by
replacing `lachie-mode` with their directory name. Adding a tap makes skills
available for discovery; it does not install all of them. Hermes receives skills,
including `lachie-mode`, rather than a standalone Lachie agent.
See [Hermes skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/).

## Authoring and Verification

Follow [APM's authoring guide](https://microsoft.github.io/apm/producer/author-primitives/).
Edit `.apm/skills/` and `.apm/agents/lachie.agent.md`. Package identity, version,
and marketplace metadata live in `apm.yml`. Do not edit generated root files.

The build generates shared `skills/`, Claude `agents/`, both native plugin
manifests and marketplaces, and the OpenCode 2 / Pi package metadata at the root.
OpenCode 2 uses the small adapter in `scripts/templates/opencode2.js`; APM 0.30.0
has no OpenCode 2 plugin pack format. `reviews/` stays outside release archives.

```sh
mise install
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
