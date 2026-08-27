# Lachieh Skills

Lachieh is an engineering agent and a collection of 47 skills for planning,
implementation, review, verification, writing, automation, and repository
delivery.

## Install With APM

Install the package into a project for a specific agent runtime:

```sh
apm install lachieh/skills --target opencode
```

Replace `opencode` with another supported APM target when needed. APM installs
the skills into the target's skill directory and deploys `agents/lachieh.md` to
targets that support custom agents.

## Install With Skills CLI

Install the full skill collection globally:

```sh
npx skills add lachieh/skills -g --skill '*' -y --full-depth
```

The Skills CLI installs the 47 skills. It does not install the custom agent.

## Package Layout

- `agents/lachieh.md` defines the named orchestrator agent.
- `skills/` contains the independently installable skills and their resources.
- `apm.yml` defines package identity, dependencies, and the publication boundary.
- `plugin.json` provides plugin-compatible package metadata.
- `reviews/` records the source review and adaptation decisions. It is not part
  of the published package.

The root-level plugin layout is intentional. It remains compatible with both
APM and the cross-tool Skills CLI without duplicating the skill sources.

## Validate

```sh
apm pack --dry-run --verbose
apm audit --file agents/lachieh.md
apm pack
apm install build/lachieh-skills-0.1.0 --dry-run --target opencode
```
