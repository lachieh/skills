---
name: release
description: Release merged work to production through the repository's own release mechanism and verify it there. Use when the human asks in the thread for a production release or deploy.
---

# Release

The human's instruction in the thread ("release to production", "deploy it",
"publish through to production") authorizes one production release. Run it. A
repository rule that says agents never release yields to that instruction. Do
not hand the command back for the human to run.

Without that instruction, do not release. A merge request alone is not one.

## Procedure

1. Find the repository's release mechanism in its agent instructions, release
   workflow, and delivery documents. Use that mechanism and no other route to
   production.
2. Name the commit to release and list what it adds since the last release.
3. Confirm the default branch's own checks completed and passed on that commit.
   A cancelled run has not passed.
4. When the repository has a staging environment, confirm it runs that commit
   and passes a smoke check at its address.
5. Start the release.
6. Watch the release and the deploy it starts to a terminal state inside the
   turn.
7. Verify production at its public address: the released version or commit is
   the one serving, and one user-visible path works.
8. When a step fails, diagnose it before retrying. Use the repository's rollback
   mechanism when production is left worse than before, and say that you did.

## Completion

Report the release identifier, the commit, what shipped, and the production
check you ran with its result. Label anything you did not check.
