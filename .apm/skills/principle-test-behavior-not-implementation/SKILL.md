---
name: principle-test-behavior-not-implementation
description: Apply when writing or reviewing tests. Exercise the consumer contract and use an independent expected result that detects a concrete defect.
---

# Test Behavior, Not Implementation

Exercise the code through the interface its consumers use and assert an
observable result against an independent expectation. Identify a concrete
defect the test would catch. A compatible internal refactor should preserve the
test's result.

Prefer concrete inputs and literal expected outputs for example-based tests.
Do not compute the expectation with the implementation being tested or assert
only values constructed by the fixture. Test a configuration's effect instead
of repeating its current value unless that exact value is a public contract.

Use mocks at unavailable or controlled boundaries. Assert the contract at that
boundary, such as the outgoing payload or a required absence of a write, rather
than incidental internal calls. For absence or no-op behavior, establish that
the subject ran and the setup could detect the forbidden effect. A positive
control can establish that sensitivity.

Check whether a plausible broken implementation, such as a no-op or wrong
result, would still pass. Strengthen a test that misses its intended defect.
Remove it only when it protects no useful contract. Judge assertions by their
purpose, not a banned matcher list. Property-based tests, contract snapshots,
compile-time checks, and negative tests can all provide independent evidence.

This principle governs test quality. It does not require adding a test when a
cheaper check provides the necessary evidence.
