---
"lachie-skills": minor
---

Changes from a review of two weeks of agent threads.

- The model can load `shipit` and `working-session`. `shipit` loads when the human asks to ship, merge, or land work. It names each gate as a skill to load, waits on checks inside the turn, checks the default branch's run after the merge, and reports one line per gate.
- `lachie-mode` gains a "Finish the work" section, gates written as load steps, and reporting rules. The agent merges a pull request it verified in Lachie's own repositories when the merge does not deploy. An instruction in the thread is the authorization for a deploy or release.
- New skills: `release` runs a production release the human asked for and verifies it, `handoff` moves work to a new thread with one brief, `tidy` removes merged worktrees and settles threads, and `project-operations` makes `project-bootstrap`'s secrets and hosting knowledge loadable in an existing project.
- `project-bootstrap` covers aligning an existing repository, lets an agent run a release the human asked for, stops merged pull requests from cancelling CI on `main`, and writes a "Finishing and reporting" section into each repository's `AGENTS.md`.
- `reflect` reads named threads or a period of work as well as the active session, and takes over refreshing `lachie-mode` from `automate-me`.
- `working-session` runs the dev server in a Herdr tab through `herdr-delegation`, because a background shell command stops at the harness's time limit.
- `unslop` covers interface text. `swarm` requires the boss to read each code slice's diff before merging it. `recall` returns a work timeline when asked and searches another project when the human says the answer is there. `tdd` requires a reproduction before a fix.
- Removed `automate-me` and `bro`, which no captured thread invoked.
- The repository gains a local `release-lachie-skills` skill and a `rollout.sh` script that updates Claude Code, Codex, and OpenCode and compares each installed copy with `main`. The README's Codex update steps now include `codex plugin add`, because upgrading the marketplace leaves the installed plugin on its old version.
