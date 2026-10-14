---
name: principle-explain-the-number
description: Apply before trusting, reporting, or acting on a measured number. Name what limits it and show that it measured the claimed work.
---

# Explain the Number

A measured number is a claim about a system. Before you trust it, report it,
or act on it, name what limits it and show that it measured the work you claim.

Failed requests, a cache that skipped the work, code that did not run, a side
left on default settings, and run-to-run noise all print plausible numbers.
State the resource or path that stops the result from being substantially
better. A number without that bound is unexplained.

- Name the limiter from a profile or from counters taken during a run, then
  map it to source. Reading the code is not a measurement. The limiter may be
  a core, a lock, the disk, the network, or the load generator.
- List the other things the number could be measuring and rule each one out
  with evidence: errors, skipped or cached work, an untuned side, noise, and a
  piece too small to matter on the path a user waits for.
- Keep the run count, the spread, and the limiter with the number.

For a performance number, run `benchmark-checklist`. For an evaluation result,
check that every trial did the task, that the gap holds across trials and
models, and that the scenario matters.

You skipped this principle when the evidence has no run count, no spread, or no
named limiter, or when the time saved exceeds the time the changed piece took.

`principle-prove-it-works` requires evidence that the outcome happened. This
principle requires evidence that the number measures the claimed work.
