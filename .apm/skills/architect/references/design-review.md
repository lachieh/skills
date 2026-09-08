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
