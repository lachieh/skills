# Verify An Existing Fix

Use this mode when an open pull request or merged commit plausibly fixes the
report. The existing artifact owns the correction. Verify it without editing it,
opening a competing change, or replacing its pull request.

## Qualify The Artifact

Require one concrete artifact:

- An open pull request with code changes addressing the symptom
- A merged pull request
- A merged commit with matching code and intent

A thread claim, tracker status, branch name, or cause hypothesis without a pull
request or commit is insufficient.

When several artifacts exist, choose the one linked from the source thread or
tracker. Otherwise choose the closest match to affected code and explain why.

## Protect The Working Tree

Use an isolated worktree or clean checkout when supported. Preserve user changes.
Record:

- Baseline revision
- Patched revision
- Pull request or commit URL
- Build and environment inputs shared by both runs

Use the configured public pull request URL form.

## Measure The Baseline

For an open pull request, use its base branch. For a merged correction, use the
revision immediately before it when that revision builds and represents the old
behavior.

Through the configured control adapter:

1. Start the baseline application.
2. Confirm application identity and environment.
3. Run the reported path through real user actions.
4. Observe the discriminating symptom.
5. Reset and repeat it.
6. Capture baseline recording, screenshot, and state check.

If the symptom does not appear twice, there is no valid baseline. Do not claim
the artifact works.

## Measure The Patched Build

Build and run the pull request or fix commit with the same environment and data.

1. Run the same user path.
2. Repeat it twice.
3. Confirm the broken state is absent.
4. Confirm the expected state appears.
5. Capture after recording, screenshot, and the same state check.

Compilation and tests do not replace a running patched application.

## Outcomes

### Confirmed

The baseline reproduces twice and the patched build resolves it twice.

- Set authorized operations status to `status.existing_fix_verified`.
- Link the artifact.
- Post one concise source-thread reply only after source preflight, when
  `allow_existing_fix_thread_reply` is true, and within
  `existing_fix_thread_reply_limit`.
- Include the before and after result.
- Open no pull request.

### Insufficient Fix

The symptom appears on baseline and patched builds.

- Set authorized operations status to `status.existing_fix_insufficient`.
- Link the artifact and state that it did not resolve the symptom.
- Post one concise source-thread result only after source preflight, when
  `allow_existing_fix_thread_reply` is true, and within
  `existing_fix_thread_reply_limit`.
- Open no competing pull request.

### Inconclusive

The baseline does not reproduce, the patched application cannot run, or evidence
does not show the discriminating state.

- Do not claim success.
- State which half could not be measured.
- Keep the result in the operations thread or private run result.
- Post nothing in the source thread.

## Cleanup

Stop both builds, remove temporary profiles and captures according to retention
policy, and return the repository to its prior state without discarding user
work.
