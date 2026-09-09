# Lachie Skills

Lachie is a collection of 47 engineering skills, plus a standalone APM agent.
Author skills and agent instructions once under `.apm/`. APM builds the release
artifacts; generated runtime files do not belong in the source tree.

## Install and Update in Codex

Register the release marketplace and install the plugin:

```sh
codex plugin marketplace add lachieh/skills --ref codex
codex plugin add lachie-skills@lachie-skills
```

If you previously registered this repository's `main` branch, first run
`codex plugin marketplace remove lachie-skills`, then run the two installation
commands above. Codex requires removing the old registration to change its ref.
The `codex` branch contains tested releases.

Codex refreshes the installed plugin when it updates this Git marketplace. To
request the update explicitly:

```sh
codex plugin marketplace upgrade lachie-skills
```

Start a new session to use the updated skills. No APM installation or ZIP download
is needed on the consumer's machine.

The plugin includes `lachie-mode` and the other 46 skills. Codex plugins do not
register standalone custom agents, so a TOML file in a plugin would not enable a
named Lachie agent. Use APM installation below when you need that separate agent.
See [OpenAI's plugin format](https://developers.openai.com/plugins/build/plugins).

## Install and Update in Claude Code

```sh
claude plugin marketplace add https://github.com/lachieh/skills.git#claude
claude plugin install lachie-skills@lachie-skills
```

The native plugin includes all 47 skills and the Lachie agent. Enable automatic
updates for the `lachie-skills` marketplace in Claude's `/plugin` marketplace
settings ([Claude documentation](https://code.claude.com/docs/en/discover-plugins#configure-auto-updates)), or update explicitly:

```sh
claude plugin marketplace update lachie-skills
claude plugin update lachie-skills@lachie-skills
```

## Install and Update in OpenCode 2

```sh
opencode2 plugin add 'github:lachieh/skills#opencode2'
```

This native plugin registers all 47 skills and Lachie as a selectable primary
agent. It does not change your default agent. OpenCode 2 checks branch-based
plugins for updates at startup; apply an update with:

```sh
opencode2 plugin update 'github:lachieh/skills#opencode2'
```

The release is tested against the OpenCode 2 beta pinned in `mise.toml`. See
[OpenCode 2 plugin management](https://opencode.ai/v2/docs/plugins/). APM has no
OpenCode 2 plugin pack format, so the build wraps APM's deployed primitives in a
small native adapter. No APM installation is required by either native client.

## Install With APM

Using APM 0.30.0, install the portable source for your target:

```sh
apm install lachieh/skills --target codex
```

APM translates `.apm/agents/lachie.agent.md` into
`.codex/agents/lachie.toml`. With `--target opencode`, it writes
`.opencode/agents/lachie.md`. It also installs all 47 skills.

## Install With Skills CLI

```sh
npx skills add lachieh/skills -g --skill '*' -y --full-depth
```

The Skills CLI installs the skills, without the standalone agent.

## Author Primitives

Follow [APM's authoring guide](https://microsoft.github.io/apm/producer/author-primitives/):

- `.apm/skills/<name>/SKILL.md` contains each skill and links its bundled resources.
- `.apm/agents/lachie.agent.md` is the canonical standalone agent source.
- `apm.yml` owns package identity, version, publication boundaries, and marketplace metadata.
- `reviews/` contains review decisions and is excluded from releases.

Principles remain task-triggered skills. Use `.apm/instructions/*.instructions.md`
with `description` and `applyTo` only for rules attached to consumer files.
`apm compile` handles instruction context; `apm install` deploys skills and agents.

## Validate

Tools are pinned in `mise.toml`:

```sh
mise install
mise exec -- node "$(mise where npm:@anthropic-ai/claude-code)/node_modules/@anthropic-ai/claude-code/install.cjs"
mise exec -- node "$(mise where npm:@opencode-ai/cli)/node_modules/@opencode-ai/cli/postinstall.mjs"
mise exec -- python3 scripts/verify-package.py
mise exec -- uv run scripts/build-release.py
mise exec -- python3 scripts/verify-codex-release.py build/release/marketplace
mise exec -- python3 scripts/verify-native-release.py build/release
```

The two Node commands prepare native binaries because mise skips npm postinstall scripts.

The checks validate APM source installation for Codex and OpenCode, exact skill
contents, package integrity, and a real Codex plugin install followed by a
marketplace upgrade. They also install the Claude plugin and check OpenCode 2
agent and skill discovery through its server API. Verification uses isolated
temporary configuration and local artifacts; it does not change your installed plugins.

The build writes only to `build/release/`. Remove that generated directory before
rebuilding. The Codex artifact uses APM's `agent-plugin` format with the supported
skill primitives. Claude uses APM's `claude-plugin` format with its generated
manifest placed in Claude's required `.claude-plugin/` directory. OpenCode 2 uses
APM-deployed content with the adapter in `scripts/templates/opencode2.js`.
Canonical instructions remain exclusively under `.apm/`.

## Release

1. Change the root and marketplace package versions in `apm.yml` together.
2. Commit the change to `main` and push it.
3. Tag that commit with the matching version, for example `v0.3.0`, and push the tag.

The GitHub Actions workflow validates the source, builds with APM 0.30.0, and
checks all three native clients before publishing. It advances the `codex`,
`claude`, and `opencode2` branches, creates immutable artifact tags such as
`claude-v0.3.0`, and attaches three ZIPs to the source tag's GitHub release.

These branches contain only generated release content and source-commit
provenance. Edit `.apm/` on `main`; do not edit generated branches. Failed
validation prevents publication. Retries preserve existing release tags, and
older releases cannot rewind a channel. Consumers track their runtime's branch,
so they do not need to change a pinned tag for each update.
