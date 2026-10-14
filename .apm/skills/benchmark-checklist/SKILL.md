---
name: benchmark-checklist
description: Vet a performance measurement before reporting it or acting on it. Check the limiter, tuning, physical limits, errors, repeatability, end-to-end relevance, and whether the timed work ran.
---

# Benchmark Checklist

Use this when you produce a performance number: a before-and-after, a
regression, a harness you will keep, or a choice between implementations.
`principle-explain-the-number` states the rule. Answer each question from a run.

For a ballpark the user asked for, one run is enough. Still answer whether it
errored and whether the work ran, and say that it is one run. Leave the other
questions unless that run looks wrong. A choice between options is not a
ballpark.

## Before the run

- Write the claim in the words you would ship. The questions test that
  sentence.
- Read the measurement script. Note what it times, what it counts, and what it
  ignores.
- Check load and core count. When the machine is busy and you cannot stop the
  other work, interleave the sides so both see the same noise, and say so.

## Questions

1. **What bounds it?** Name the limiter from a run you do not report.
   Profilers slow the work. Use process CPU (`top`, `pidstat`), a runtime
   profiler (`node --cpu-prof`, `py-spy`, `perf`), I/O wait, and syscall counts
   (`strace -c` on Linux). Map the hot spot to source, and check the load
   generator. If the generator saturates first, you measured the generator. If
   a change did not move the number, find the limiter before calling the change
   useless.
2. **Was each side tuned?** Run every side the way production runs it: release
   builds, production flags, batching, pools, caches as warm or cold as
   production, and the same versions and data. A side on defaults compares
   configurations. A limiter that is a setting, such as a commit per row, a
   debug build, or a missing index, means that side is untuned. Tune it and
   measure again before picking a winner. If you cannot tune it, leave that
   comparison without a winner. Reporting today's settings does not repair an
   untuned side when the user is choosing which option to adopt.
3. **Does the result fit the limits?** Compare bytes per second with disk and
   network bandwidth, and operations per second with the cores available.
   Compare time saved with the time the changed piece took. Removing a piece
   that takes 10% of the run can make the run at most about 11% faster. A
   result past a limit measured a cache, a no-op, or a bug.
4. **Did it error?** Count failures and non-success responses, and check that
   outputs are correct. Rejections are often fast. Timeouts and retries are
   slow. Add the count when the script does not have one.
5. **Does it reproduce?** Run each side at least five times, alternating sides,
   so warmup and drift do not favor one side. Report the median and the range.
   Treat a gap smaller than the run-to-run variation as no measurable
   difference. When the call is close, use a rank-sum test or the harness's
   own statistics.
6. **Does it matter on the path a user waits for?** Beside a micro result,
   measure that path with realistic data sizes and concurrency. Report the
   micro result as a share of the whole. A helper that takes 1% of a request
   can make the request at most about 1% faster.
7. **Did the work run inside the timed region?** Confirm the request reached
   the server, the rows were written, the bytes were read, or the code used
   the result. Generators nobody iterates, promises nobody awaits, results a
   compiler can discard, and timeouts all produce numbers for work that did
   not happen.

## Report

- Lead with the verdict: faster, slower, no measurable difference, or
  inconclusive.
- Give the number, its unit, the run count, the range, and the limiter.
- Call the verdict inconclusive when you claim a difference and cannot name
  the limiter, when a side ran untuned, or when you could not answer questions
  4 and 7. Name the missing check.
- Lead the writeup with that comparison and the conditions a reader needs to
  judge it, per `technical-writing`. Put the runs, the range, and the limiter
  evidence in a linked artifact.
