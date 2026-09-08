# Lachie Skills

Lachie is an engineering agent and a collection of 47 skills for planning,
implementation, review, verification, writing, automation, and repository
delivery.

## Install With APM

Use APM 0.30.0 to install the package into a project for a specific agent runtime:

```sh
apm install lachieh/skills --target opencode
```

Replace `opencode` with another supported APM target when needed. APM deploys
skills and projects the agent into each target's native format. For example,
Codex receives `.codex/agents/lachie.toml` and OpenCode receives
`.opencode/agents/lachie.md`.

## Install With Codex

Register this repository as a Codex marketplace, then install the plugin:

```sh
codex plugin marketplace add lachieh/skills
codex plugin add lachie-skills@lachie-skills
```

Start a new Codex session after installation so the bundled skills are loaded.

## Install With Skills CLI

Install the full skill collection globally:

```sh
npx skills add lachieh/skills -g --skill '*' -y --full-depth
```

The Skills CLI installs the 47 skills. It does not install the custom agent.

## Package Layout

- `.apm/skills/` contains the 47 skills and their bundled resources.
- `.apm/agents/lachie.agent.md` defines the named orchestrator agent.
- `.agents/plugins/marketplace.json` is the generated Codex marketplace.
- `apm.yml` defines package identity, dependencies, and the publication boundary.
- `.codex-plugin/plugin.json` points native Codex plugin discovery at
  `.apm/skills/`.
- `build/` contains generated bundles, including their synthesized `plugin.json`
  and integrity lockfile. It is gitignored.
- `reviews/` records the source review and adaptation decisions. It is not part
  of the published package.

## Author Primitives

Edit `.apm/` as the single source of primitive content, following
[APM's authoring guide](https://microsoft.github.io/apm/producer/author-primitives/).
Keep each skill in a directory matching its frontmatter `name`. Keep resources
beside the skill and link them from its body. The agent uses the canonical
`.agent.md` suffix.

The principles are task-triggered skills. They are not unconditional rules or
file-glob instructions. Explicitly invoked workflows also remain skills because
this package supports Codex, which does not receive APM prompt primitives.

Add `.apm/instructions/*.instructions.md` with a description and an `applyTo`
glob only for rules that should apply to matching consumer files. Use
`.apm/prompts/*.prompt.md` for parameterized commands when the intended targets
support them. Add hooks or MCP declarations only when a workflow needs those
runtime capabilities. Extend the explicit `includes` list in `apm.yml` when
adding a primitive type that should ship.

`apm install` deploys skills and agents. `apm compile` generates instruction
context, so this package currently has no instruction output to compile.
`apm preview` previews runnable prompt scripts, which this package does not
currently declare. See [compile](https://microsoft.github.io/apm/producer/compile/)
and [prompts](https://microsoft.github.io/apm/producer/author-primitives/prompts/).

## Validate

The repository pins APM 0.30.0 in `mise.toml`. With mise and Python 3.11 or
later installed, run:

```sh
mise install
mise exec -- python3 scripts/verify-package.py
```

The verifier checks primitive parsing, a compile dry run, marketplace drift,
the packed ZIP, and a source install into a temporary consumer project. It
compares every deployed skill resource with its source, parses the Codex agent,
checks the OpenCode agent, and runs `apm view` and `apm audit`. It removes the
temporary project when finished.

For a discovery-only check with the Skills CLI:

```sh
npx skills add ./.apm --list --full-depth
```

Pack an archive and regenerate the marketplace with:

```sh
apm pack --archive --marketplace=codex
```
