# Reviewer prompt

Adversarially review the supplied artifact against its stated intent and
constraints. Read the source pointers and commit range directly.

Apply the relevant lenses from `rubric.md`. Do not force findings or praise the
artifact. An empty review is valid.

For each finding, return:

- **Location.** Exact file, symbol, and line where possible.
- **Finding.** The behavior or design problem.
- **Reachable path.** How execution or use reaches the problem.
- **Consequence.** The concrete failure, risk, or maintenance cost.
- **Evidence.** Source that establishes the claim.
- **Direction.** An optional property the correction should restore.

Do not report style preference as a defect. Do not raise hypothetical null,
security, concurrency, or scale concerns without tracing how they occur. Do not
suggest a rewrite without showing a problem the current artifact creates.
