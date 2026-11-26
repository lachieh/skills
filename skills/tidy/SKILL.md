---
name: tidy
description: Remove git worktrees whose work is merged and settle the thread that finished it. Use when asked to clean up worktrees, close out a thread, or free disk space taken by old checkouts.
---

# Tidy

A worktree is removable only when all three of these hold. Check each one, and
leave the worktree alone when any is false or cannot be checked.

1. **Merged.** Fetch first. Its branch's head is contained in the remote
   default branch, or its pull request is merged and that pull request's head
   commit is the branch's head. A squash merge leaves the head outside the
   default branch, so compare with the pull request. A commit made after the
   merge is unmerged work.
2. **Clean.** `git status --porcelain` prints nothing: no modified, staged, or
   untracked files, and no stash entry made from that worktree. Removal also
   deletes ignored files, which that command hides. List them with
   `git status --porcelain --ignored`, and keep the worktree when any of them
   cannot be rebuilt from the repository: a local database, an env or secrets
   file, uploaded media.
3. **Settled.** A thread made the worktree and that thread is settled. Ask the
   host's thread tools. When the host cannot say, or no thread claims the
   worktree, treat it as in use: someone made it by hand. Remove one of those
   only when the human names it.

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
