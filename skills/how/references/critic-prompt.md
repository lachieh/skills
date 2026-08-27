# Critic prompt

Review the architecture described by the supplied explanation. Use the
explanation as a map, then read the cited source and form an independent
judgment.

Find architectural problems rather than line-level bugs or style preferences.
For each finding, return:

- **Finding.** The specific structural problem.
- **Evidence.** Exact code that demonstrates it.
- **Cost.** What it makes harder, less safe, slower, or more expensive.
- **Direction.** The property a correction must restore, without proposing a
  rewrite unsupported by the evidence.

An empty result is valid. Do not manufacture findings to fill the rubric.
