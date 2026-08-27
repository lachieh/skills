# Feature Map Example

Map every user-facing feature Benny may reproduce. Read the relevant section
before driving the application. Describe the user view; discover current code
paths at run time.

Copy this file to `.agents/benny/feature-map.md` and set
`control.feature_map_path` to that copy. Pack refreshes do not update the copy.

## Per-feature Template

### `<feature name>`

`<one-line user-visible purpose>`

#### How A User Gets There

- Click path: `<screen> -> <menu, tab, or panel> -> <control>`
- Keyboard shortcut: `<shortcut or none>`

#### How The Control Adapter Drives It

- `<adapter action>` with `<inputs>` should produce `<visible result>`.
- Reset: `<how the adapter returns to fresh state>`.

#### Stable Selectors

- `<role and accessible name>`
- `<ARIA relationship>`
- `<data-component or purpose-named data attribute>`

Avoid generated classes, dynamic hashes, child indexes, and brittle document
positions.

#### States To Exercise

- Default, hover, focus-visible, active, disabled
- Loading, empty, error
- Selected, open, expanded
- `<relevant feature-specific variants>`

Mark states that do not apply.

#### Preconditions And Setup

- Auth: `<account state>`
- Data: `<fixture>`
- Permissions: `<role>`
- Flags: `<flag or none>`
- Services: `<required availability>`

#### Evidence And Cross-check

- Screenshot: `<application identity, feature, and discriminating state>`
- Video: `<entry path, interaction, and final state>`
- Cross-check: `<read-only state or value confirming the interface>`

#### Gotchas

- `<known dead end or wrong surface>`
- `<safe environment translation>`

## Fictional Example

These sections describe a fictional task application.

### Sign In

Lets a user enter the task application.

#### How A User Gets There

- Open the application and choose `Sign in`. No shortcut.

#### How The Control Adapter Drives It

- `open_app`, `click Sign in`, `fill credentials`, and `click Continue` should
  open the item list.
- Reset by signing out and clearing the disposable session.

#### Stable Selectors

- Button `Sign in`, textboxes `Email` and `Password`, and
  `data-component="sign-in-form"`

#### States To Exercise

- Default, focus-visible, submitting, disabled, loading, error

#### Preconditions And Setup

- Disposable account and available authentication service

#### Evidence And Cross-check

- Record landing page through item list. Check read-only session state.

#### Gotchas

- A marketing page is the wrong surface. A missing authentication service is a
  block.

### Item List And Detail

Lets a user browse items and open one.

#### How A User Gets There

- Open the `Items` tab, then choose a row.

#### How The Control Adapter Drives It

- `select_tab Items` and `click <fixture item>` should open its detail.
- Reset by closing the detail and clearing selection.

#### Stable Selectors

- Tab and list named `Items`, fixture-named row, and
  `data-component="item-detail"`

#### States To Exercise

- Loading, empty, error, selected, open, expanded

#### Preconditions And Setup

- Named fixture items, read permission, and available item service

#### Evidence And Cross-check

- Show selection and matching detail title. Check selected-item ID.

#### Gotchas

- Search results may look similar but use a different path.

### Item Editor

Lets a user create or edit an item.

#### How A User Gets There

- Choose `Edit` from detail or `New item` from the list.

#### How The Control Adapter Drives It

- `click Edit`, `fill <field>`, and `click Save` should update detail.
- Reset by restoring the fixture.

#### Stable Selectors

- Buttons `Edit`, `New item`, `Save`, form `Item editor`, and label-linked fields

#### States To Exercise

- Default, focus-visible, dirty, validating, disabled, saving, error, success

#### Preconditions And Setup

- Editable fixture, write permission, and available save service

#### Evidence And Cross-check

- Show field change through updated detail. Check the stored item value read-only.

#### Gotchas

- Do not inject form state. A read-only detail field is not the editor.

### Settings

Lets a user change personal preferences.

#### How A User Gets There

- Open the profile menu, then choose `Settings`.

#### How The Control Adapter Drives It

- `open_menu Profile`, `click Settings`, and `toggle <preference>` should update
  the control.
- Reset by restoring the starting preference.

#### Stable Selectors

- Button `Profile`, menu item `Settings`, region `Settings`, and a purpose-named
  preference attribute

#### States To Exercise

- Closed, open, selected, focus-visible, disabled, loading, error

#### Preconditions And Setup

- Signed-in test account, known preferences, available preference service

#### Evidence And Cross-check

- Show the menu path and final control state. Check the preference value
  read-only.

#### Gotchas

- Operating-system settings are a different surface.

## Completeness Checklist

- Every reproducible user-facing feature has a section.
- Every section names a user path, adapter actions, and reset.
- Selectors use roles, names, ARIA, stable component markers, or purpose-named
  attributes.
- No selector uses generated classes or document position.
- Relevant interaction, loading, empty, error, selected, and expanded states are
  covered.
- Auth, fixtures, permissions, flags, and services are explicit.
- Screenshot, video, and underlying cross-check requirements are explicit.
- Wrong surfaces, dead ends, and safe environment translations are listed.
- Implementation details remain run-time discoveries.
