# Design review

Review a selected design package before implementation.

## Consumer

- Does the interface make the core workflow direct?
- Does implementation convenience create work or exposed choices for the
  consumer?
- Are state, failure, and recovery visible where the consumer needs them?

## Model and types

- Does one representation own each domain fact?
- Do types enforce facts that correctness depends on?
- Do access patterns fit the chosen data structures?

## Ownership and boundaries

- Does each module own one coherent body of policy and state?
- Do boundaries correspond to real changes in trust, representation, ownership,
  effects, or lifecycle?
- Are framework and storage mechanics kept outside domain decisions?

## Partial edits

Screen every candidate before selection. Assume the next editor has opened only
some of the files, copies the nearest example, and takes the shortest path that
still compiles. Prefer the design where a change that looks right in one file
is right for the repository.

- Does one module write each piece of state, with every other module reading it
  or asking that owner to change it?
- Does each task have one supported path? Extra paths lose their callers and
  disappear in that same change.
- Does an import of a module's internals from outside that module fail the
  build?
- Is each set of items listed in one place, with every other view derived from
  it? When a view cannot be derived, does the build fail if the lists disagree?

## Complexity and change

- Does each layer hide meaningful decisions?
- Can any state, option, adapter, or branch be removed?
- Does the design integrate the requirement rather than preserve old and new
  shapes together?
- Can implementation proceed as independently verifiable units?

## Verification

- Can the consumer workflow be exercised directly?
- Are important failure, retry, and concurrency paths observable?
- Does the package state what evidence will permit completion?
