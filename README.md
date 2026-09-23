# Lachie Skills

LachieH's custom engineering skills with a `/lachie-mode` agent for building the way that he does.
Install from this repository's default branch using your client's native tools.

## What is in the package

- `lachie-mode`: the working mode; boss-led delegation, strict principles, and verified artifacts. Start here.
- Procedures: `architect`, `arena`, `swarm`, `interrogate`, `how`, `why`, `tdd`, `blast-radius`, `figure-it-out`, `working-session`, `herdr-delegation`, `shipit`, `show-me-your-work`, `recall`, `teach`, `bro`.
- Writing and cleanup: `technical-writing`, `unslop`, `deslop`, `no-comments`, `typescript-best-practices`.
- Verification: `create-verification-skill`, `maintain-verification-skill`, `configure-models`.
- Skill maintenance: `automate-me`, `reflect`.
- Principles: every `principle-*` skill is a strict rule loaded before the decision it governs.

The full list with descriptions is in [skills.json](skills.json).

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

## OpenCode

```sh
opencode plugin add 'github:lachieh/skills'
opencode plugin update 'github:lachieh/skills'
```

Select Lachie as a primary agent; installing does not change your default agent.
OpenCode checks for updates and applies them through its native update command.
See [OpenCode plugins](https://opencode.ai/v2/docs/build/plugins).

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

## Contributing

Authoring, verification, and release steps are in [CONTRIBUTING.md](CONTRIBUTING.md).
