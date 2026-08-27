# Control Adapter Contract

Benny requires one configured control skill or adapter for the target
application. Set its skill name in `control.skill_name` and its completed
user-facing feature map in `control.feature_map_path`.

Copy and fill `feature-map.example.md` at
`.agents/benny/feature-map.md`. Do not edit the installed example.

If the skill, feature map, or a required capability is absent, ambiguous, or
incomplete, reproduction and correction stop as blocked.

## Required Capabilities

### Start

Start the requested application revision in the requested test environment.

Inputs:

- Repository and revision
- Build or start mode
- Workspace, account, fixture, and feature-state requirements
- Artifact directory
- Completed feature-map path

Return:

- Session identifier
- How the adapter confirmed the application and environment
- Stable application markers
- Running process or target details needed by later calls
- Any missing capability

The adapter distinguishes the target from a similar window, shell, or production
instance.

### Drive The User Surface

Perform real user actions such as clicking, typing, pressing keys, scrolling,
dragging, resizing, and navigation through application controls.

Prefer roles, labels, and stable selectors. Use coordinates only after a current
screenshot. Return each action and its observed state change.

Do not set internal state, call hidden application methods, write directly to
storage, or inject document changes to create the symptom.

### Drive Mapped Features And States

Read the relevant feature-map section before driving the application. Expose
ways to:

- Navigate each mapped feature through its user-visible path.
- Invoke adapter actions listed for that feature.
- Interact with applicable default, hover, focus-visible, active, disabled,
  loading, empty, error, selected, open, expanded, and feature-specific states.
- Arrange preconditions through safe fixtures, permissions, flags, service
  responses, or supported test controls.
- Reset the feature for an independent second attempt.
- Capture the screenshot, recording, and read-only cross-check named by the map.

Use roles, accessible names, ARIA relationships, stable component markers, and
purpose-named data attributes. Avoid generated classes, dynamic hashes, child
indexes, and brittle document positions.

Arranging a precondition does not permit injecting the reported symptom. The
symptom must result from real user interaction.

### Inspect State

Read state to confirm what the interface shows. Valid sources include the
accessibility tree, document or view hierarchy, process state, local logs,
network request status, and application-exposed debug state.

Inspection is read-only. A query that changes state is a drive action and must
represent a real user action.

### Screenshot

Capture current application state to a requested temporary path. Return the file
path, capture time, application marker or window title, and a short description
of what should be visible.

The image includes enough application chrome to identify the target under test.

### Recording

Start and stop a screen recording around the full reproduction path. Return the
file path, start and stop times, captured window or region, and whether audio or
sensitive overlays were omitted.

The recording shows the discriminating final state, not only setup or loading.

### Reset

Restore enough state that a second attempt does not inherit the first attempt's
result. Report what data, navigation, process, session, or fixture state changed.

### Cleanup

Stop processes and sessions created by the adapter. Remove disposable profiles,
workspaces, test fixtures created by the adapter, debug ports, tunnels, and
captures past retention. Report what was stopped, removed, retained, or left for
a person. Cleanup preserves user work.

## Adapter Behavior

The adapter:

- Reports capabilities before reproduction starts.
- Reports which feature-map sections it can drive and which are blocked.
- Uses the same environment inputs for baseline and patched builds.
- Reports startup failures as failures.
- Bounds retries.
- Keeps secrets out of logs and artifacts.
- Keeps captures outside the repository.
- Supports fresh or reset state between attempts.
- Avoids production changes unless the user explicitly configured a safe test
  action.

## Environment Translation

Before declaring an environment block, restate the defect without
platform-specific nouns and determine whether the same behavior can be tested
safely in the available environment.

A named browser may mean an external browser, a named key may mean the configured
shortcut, and a named remote host may mean a delayed or disconnected test target.

Use translated evidence only when it tests the same underlying behavior. Label
it translated. It is not an exact reproduction when the absent environment is
part of the defect. Hardware prompts, operating-system permission dialogs,
device-only capabilities, and unavailable account states may be valid blocks.

## Setup Check

Before enabling reproduction:

1. Start the application.
2. Confirm its stable marker.
3. Load one completed feature-map section.
4. Navigate to that feature through its user path.
5. Exercise one disposable state through mapped actions.
6. Inspect the resulting state.
7. Capture a screenshot.
8. Record a short clip.
9. Reset the feature.
10. Clean up.

Enable reproduction only when all ten steps succeed without any source-channel
message.
