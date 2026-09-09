# Pull requests and commit messages

Lead with the concrete problem and resulting behavior. Explain the final change
for a reviewer who has not seen the conversation. Use the repository's title
convention and description template. Scale detail to the change.

Include the scope a reviewer needs, consequential tradeoffs, affected consumers,
and verification outcomes. A small change usually needs one or two sentences
and its validation. Rewrite the title and body when the scope changes.

Keep the body brief enough to scan in about a minute. Link detailed logs,
revision history, and experiment records instead of copying them into it.
Retain the revision, methodology, or limitation needed to assess a claim. For
performance work, give the primary before and after measurement with units and
enough conditions to make the comparison meaningful.

Use screenshots or recordings when they demonstrate behavior. Report what ran
and what it established, including failures and unrun checks that limit the
claim. Keep planned validation distinct from completed verification.

A commit body explains the change without repeating its subject. If the merge
workflow uses the PR description as its commit body, ensure it remains useful
without conversation history or temporary local artifact paths.
