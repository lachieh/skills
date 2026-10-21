---
name: correct
description: Find agent mistakes that recur in this repository and change the repository so each class cannot happen again.
disable-model-invocation: true
---

# Correct

Use this when the same agent mistake has been corrected more than once, or when
asked to make those mistakes impossible. `principle-encode-lessons-in-structure`
picks a prevention mechanism during ordinary work. `automate-me` turns working
conventions into `lachie-mode`. `reflect` reviews one session and proposes skill
edits. This procedure reads repository history and lands the preventing change.

The boss owns the class list, the level choice, the proof, and the rule
table. Delegate a class's code change through `configure-models` with the
`implementation` role at `M`, or `complex-implementation` at `L` when the
structural change requires it. Review the diff before the proof.

## Find the classes

Read recent commits, reverts, review comments, agent instruction files, and
comments that explain workarounds. Group the mistakes into classes. A class
counts when it has happened twice.

## Fix each class

Take the classes that occur most often. Fix one class per commit, at the
earliest level that works:

1. **Structure.** One owner for each piece of state. One supported way to do
   each task. An import of a module's internals from outside that module fails
   the build. One list, with every other view derived from it, or a build
   failure when two lists disagree. Delete the old way and the dead code an
   agent would copy.
2. **Types.** Make the bad state unrepresentable. When bad code still
   compiles, add a lint or CI check whose error names the file, type, or
   function to use instead. When the pattern is already common, fail only when
   a change adds more of it.
3. **Tests.** Assert the behavior. Fix or delete a test that still passes when
   the behavior it checks breaks, or that fails when only the internals change.
4. **Docs or agent rules**, and only for a judgment call. Nothing fails when
   an agent skips them.

Use a written rule only when no earlier level can enforce the class. When a
helper or automation is the earliest mechanism this list does not name, apply
`principle-encode-lessons-in-structure`.

## Prove the check

Each new check must fail on a real past instance of the class. Run that command
locally and in CI. An exception sits on the offending line with a reason, an
expiry, and the human's approval.

## Keep the rule table

Keep a table in the agent instruction file the repository already loads. Each
row names the rule and what enforces it. Create that file only when the
repository has none. When a correction arrives for a rule already in the table
and nothing enforces it, treat that as a repeat and fix it at the earliest
level in the same change. Remove a row once the mistake cannot happen.

## Completion

Report each class, the evidence that it recurred, the level chosen, and why
each earlier level could not enforce it.
