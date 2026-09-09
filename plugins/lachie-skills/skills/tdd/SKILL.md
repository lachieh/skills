---
name: tdd
description: Use only for an explicit TDD, failing-test, or regression-test request, or a bug with a clear low-cost local test target.
disable-model-invocation: true
---

# TDD Bug Fix

When fixing a bug with a clear, low-cost test path, make the broken behavior
executable before changing production code. The goal is a focused regression
test that fails before the fix and passes after it.

Do not force a test when it would be impractical. If the available test would
require broad harness setup, brittle mocks, slow end-to-end infrastructure,
production-only state, vague reproduction steps, or large unrelated fixture
churn, skip adding a new test and use the closest useful verification instead.

The boss owns the decomposition, worker brief, diff review, integration, and
final claims. One implementation owner carries the red-green sequence so the
test and fix remain one verifiable unit.

## Workflow

1. **Understand the bug.** Identify the intended behavior, current behavior,
   affected path, and smallest observable reproduction.
2. **Choose the narrowest executable check.** Prefer the closest unit,
   component, integration, or regression test already used for that code path.
   If no practical test path is clear, do not create one from scratch solely to
   satisfy the workflow.
3. **Assign the bounded implementation.** Resolve the `implementation` role at
   `M` size through `configure-models` and delegate one owner by default. Give
   that owner the expected behavior, scope, test command, and required
   failing-before and passing-after evidence.
4. **Write the failing test first.** Add the smallest focused test that would
   have caught the bug. Apply `principle-test-behavior-not-implementation`.
5. **Run the new test before fixing.** Confirm it fails for the intended reason.
   If it passes or fails for an unrelated reason, correct the test or
   reproduction before editing the implementation.
6. **Fix the bug.** Make the smallest production change that satisfies the
   intended behavior while preserving nearby contracts. Apply
   `principle-fix-the-latent-issue` and
   `principle-minimum-necessary-complexity` when choosing the correction.
7. **Rerun the regression test.** Confirm the test now passes.
8. **Review and verify independently.** The boss inspects the test and
   production diff, reruns the regression check, and runs relevant adjacent
   tests, type checks, lint, or scenario checks when the change has broader
   risk. Apply `principle-prove-it-works` before making the final claim.

## If a Failing Test Is Impractical

Do not silently skip the regression step. Before fixing, explain why a failing
test is impossible or not worth the cost, then choose the closest executable
regression check available. Examples include a targeted script, manual
reproduction command, browser automation, snapshot comparison, log assertion,
or focused integration check.

Prefer no new test over a bad test. A bad test mostly tests mocks, encodes
current implementation details, depends on timing or unrelated global state,
needs expensive infrastructure for a small fix, or would be deleted immediately
after proving the fix.

## Guardrails

- Do not change tests merely to match a wrong implementation.
- Do not weaken existing assertions unless the expected behavior has genuinely
  changed and the reason is clear.
- Keep the regression test focused on the bug. Avoid broad fixture churn or
  unrelated coverage expansion.
- Do not add tests when the practical signal is weak. Use manual or scripted
  verification and state why.
- If the bug is flaky, make the test deterministic where possible and document
  the signal being locked down.
- If the bug exposes a broader class of failures, first land the focused
  regression path, then consider additional sibling coverage.

## Final Response

Report the evidence, not only the outcome:

- Name the failing-before test or executable check and the failure it produced.
- Name the passing-after test run and any nearby validation performed.
- If failing-before evidence could not be demonstrated, state why and describe
  the closest regression check used instead.
