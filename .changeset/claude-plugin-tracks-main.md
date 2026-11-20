---
"lachie-skills": patch
---

The Claude plugin manifest and marketplace entry no longer pin `version`, so Claude Code versions the plugin by commit and `claude plugin update` picks up every change on `main` instead of waiting for a release.
