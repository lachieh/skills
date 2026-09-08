# Review rubric

Use only lenses relevant to the artifact.

## Correctness

- Does the artifact achieve its stated outcome?
- Are boundary values, empty states, error paths, and state transitions correct?
- Does behavior remain correct across retries, restarts, and partial execution?

## Security

- Can untrusted input reach a dangerous operation?
- Are authentication and authorization enforced at the right boundary?
- Can secrets or sensitive values reach logs, output, or persisted artifacts?

## State and concurrency

- Do concurrent actors own separate writable state?
- Is essential shared mutation serialized structurally?
- Can stale or partial state change the result of a retry?

## Domain and types

- Does the model express real states, rules, and transitions?
- Do duplicated fields, branches, or callers require coordination?
- Do types enforce facts that correctness depends on without unused precision?

## Boundaries

- Are trust, representation, ownership, and effects handled where they change?
- Is domain policy separated from framework, transport, and storage mechanics?
- Are errors handled where a meaningful decision can be made?

## Evolution

- Does the change integrate the new requirement coherently?
- Does an internal migration remove the old contract and all callers?
- Is compatibility retained without a concrete consumer?

## Reader and complexity cost

- Does each layer compress complexity, enforce a boundary, or own a lifecycle?
- Can state origin, mutation, and policy be traced without hidden context?
- Does the change add more code, configuration, or indirection than its outcome
  requires?

## Verification and experience

- Does evidence directly support the completion claim for the exact artifact?
- Does the changed flow work at the nearest meaningful boundary?
- Does implementation convenience create friction or incomplete behavior for the
  person consuming the result?
