---
name: tidy
description: Remove git worktrees whose work is merged and settle threads whose work is finished. Use when asked to clean up worktrees, close out a thread, or free disk space taken by old checkouts.
---

# Tidy

A worktree is removable only when all three of these hold. Check each one, and
leave the worktree alone when any is false or cannot be checked.

1. **Merged.** Its branch's head is contained in the remote default branch, or
   its pull request is merged. Fetch first. A squash merge leaves the head
   outside the default branch, so check the pull request too.
2. **Clean.** `git status --porcelain` prints nothing: no modified, staged, or
   untracked files, and no stash entry made from that worktree.
3. **Settled.** No unsettled thread uses the worktree. Ask the host's thread
   tools. When the host cannot say, treat the worktree as in use.

## Procedure

1. List every worktree of the repository, or of each repository the human
   named, with the three facts beside it.
2. Remove each worktree that passes all three with `git worktree remove`,
   without `--force`. Then delete its local branch with `git branch -d`, which
   refuses an unmerged branch. Leave remote branches alone unless asked.
3. Run `git worktree prune` once per repository.
4. To close out the current thread: confirm its work is merged and its worktree
   is clean, then settle the thread with the host's tool. Writing "settled" in
   the reply does not settle it. Remove this thread's own worktree last, or
   leave it for the next run.

Never remove the main checkout, a worktree another running agent is using, or
anything outside a repository's worktree list.

## Completion

Report each worktree removed, each one kept with the fact that kept it, the
threads settled, and the disk space freed.
