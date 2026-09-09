---
name: swarm
description: Partition a complete body of work or coverage into independent slices, run them concurrently, and return one accounted result.
---

# Swarm

Use Swarm for independent slices and coverage. Use `arena` when several
candidates attempt the same artifact.

## Procedure

1. Define the complete work or coverage matrix and its done predicate.
2. Divide the matrix into independent slices. Every required item belongs to one
   slice.
3. Identify dependencies, shared writes, and integration order before fan-out.
4. Remove shared mutation or serialize affected slices outside the swarm.
5. Give each worker a self-contained brief containing the goal, scope,
   exclusions, output, verification, and report shape. Use
   `references/worker-brief.md`.
6. Give writing workers isolated branches, worktrees, or output paths.
7. Resolve the appropriate role and size through `configure-models`, then launch
   all independent workers concurrently.
8. Require `PASS`, `ISSUES`, or `BLOCKED` with evidence and artifact pointers.
9. Reassign a missing required slice. If it cannot be completed, mark the swarm
   blocked rather than reducing coverage silently.
10. Have the boss inspect artifacts and verify consequential findings.
11. Aggregate one compact table of slices, status, evidence, issues, and gaps.
12. Hand implementation artifacts to one integration owner.

Keep raw worker payloads out of the boss context. Worker reports point to
evidence. They do not replace inspection.

## Completion

Every required slice has an evidenced result. Missing coverage is explicitly
blocked rather than omitted. The boss returns one consolidated report and
retains ownership of integration and final judgment.
