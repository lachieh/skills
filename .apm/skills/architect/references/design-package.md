# Design package

Write consumer usage before types and module structure. Each Arena candidate
must provide one coherent package.

## Outcome and usage

- The user or caller goal.
- The core workflow from their perspective.
- Two or three realistic usage examples.
- Acceptance criteria and behavior deliberately excluded.

## Model

- Domain states, rules, transitions, and invariants.
- Authoritative data representations and derived values.
- Access patterns and ownership of mutation.

## Interfaces and ownership

- Public interfaces, signatures, and types.
- Module responsibilities and private implementation choices.
- Trust, representation, ownership, and effect boundaries.
- External dependencies and lifecycle.

## Behavior

- Data and control flow.
- Failure, retry, recovery, and concurrency behavior.
- Verification approach at the consumer boundary.

## Decisions

- Alternatives considered.
- Accepted tradeoffs.
- Open product decisions and risks.
- The first verifiable implementation unit.

Keep this as a design artifact. Do not add placeholder implementation files to
the product source.
