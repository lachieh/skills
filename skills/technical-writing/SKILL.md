---
name: technical-writing
description: Write or review technical documentation, RFCs, READMEs, pull-request descriptions, and commit messages for a specific reader and task.
---

# Technical Writing

Write for a tired engineer reading once.

## Procedure

1. Identify the artifact, reader, task, and required outcome.
2. Inspect the source material and repository terminology before drafting.
3. For documentation, select the relevant mode from
   `references/document-modes.md`. For pull-request descriptions and commit
   messages, read `references/pull-requests.md`.
4. Outline around the reader's questions and actions.
5. Draft with `references/developer-style.md` and
   `references/controlled-language.md`.
6. Apply `unslop`.
7. Run every command and example that can be executed safely.
8. Verify links, symbols, paths, flags, outputs, and counts against the current
   artifact.
9. Review the result from the reader's starting context.

Product interface copy follows the product's copy rules rather than this
procedure.

## Completion

The artifact serves one identified reader task, uses current project
terminology, gives executable instructions where required, separates reference
from explanation, and contains no unverified command, symbol, link, path,
output, or count.
