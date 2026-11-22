---
"lachie-skills": patch
---

`project-bootstrap` resolves fnox secrets in every git worktree. Before, the token lived in a gitignored `fnox.local.toml` that only the bootstrapped checkout had. Now a `main_checkout` mise var finds the main checkout from any worktree, and `.config/mise.toml` exports `OP_SERVICE_ACCOUNT_TOKEN` from that checkout's `fnox.local.toml`. If that file is missing, mise keeps a token the caller already set. `bootstrap-fnox.sh` writes to the main checkout even when run from a worktree, and verifies through `mise x`.
