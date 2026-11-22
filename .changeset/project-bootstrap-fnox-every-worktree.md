---
"lachie-skills": patch
---

`project-bootstrap` keeps each machine's service-account token in `~/.config/fnox/projects/<project>.toml`, which the template `fnox.toml` imports, so fnox resolves secrets in every git worktree and not just the checkout that ran `bootstrap-fnox.sh`. The script moves a token an earlier version stored in `fnox.local.toml`. The template also sets `env = "exec"`, so fnox's shell hook no longer resolves every 1Password item on each prompt or exports secrets into the human's shell.
