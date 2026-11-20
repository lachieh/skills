---
"lachie-skills": patch
---

`project-bootstrap` covers adopting a project whose 1Password service account predates the vault layout, hands the 1Password setup script to the human to run in their own Terminal, unsets the token fnox's shell hook exports before using the human's session, adds a `cloudflare-workers-deploy` token for Workers deploys, and installs hk hooks by hand instead of from `prepare`, because the hook lives in git config every worktree shares.
