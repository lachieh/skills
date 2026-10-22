# lachie-skills

## 0.10.0

### Minor Changes

- 836db7a: Let the model load every skill `lachie-mode` routes to, including `lachie-mode`, `configure-models`, and the `no-comments` gate, and check skill routing, frontmatter, and local paths during package verification.

### Patch Changes

- 34cb960: `principle-make-operations-idempotent` requires a leftover lock, temporary file, or half-written record to be recognizable as stale wherever the previous run stopped. `correct` drops a test that still passes when the behavior breaks, or that fails when only the internals change.
- bf6bf61: Tighten skill bodies: cut duplicated instructions in `tdd`, `blast-radius`, `show-me-your-work`, and `teach`, point `automate-me` and `reflect` at the package source instead of installed copies, and stop `figure-it-out` and `configure-models` from blocking on reversible decisions.

## 0.9.0

### Minor Changes

- 30729b6: Add a Cursor and Grok Bot plugin manifest, and build the package with APM 0.33.0.
- 226b757: Add `correct` for repeated agent mistakes, `principle-explain-the-number` and `benchmark-checklist` for measured numbers, and architect checks for split ownership, duplicate paths, importable internals, and hand-synced lists. Verification launch now means a usable application, and `lachie-mode` labels every claim that lacks a measurement.

## 0.8.0

### Minor Changes

- 670475b: Port the project-bootstrap skill's templates and references to Effect 4: `Context.Service` instead of `Context.Tag`, `Layer.effect` for the scoped SQLite connection, `ConfigProvider.layer`, the capitalised `Config` constructors, and `Cause.findErrorOption`.
