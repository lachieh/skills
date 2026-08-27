# Architecture critique rubric

Apply only the relevant lenses.

## Domain model

- Does the structure match the real states, rules, transitions, and access
  patterns?
- Do duplicated fields or branches require coordination?
- Does one authoritative representation own each fact?

## Boundaries and effects

- Do boundaries correspond to changes in trust, representation, ownership, or
  effects?
- Is domain policy separate from framework, transport, and storage mechanics?
- Are validation and error decisions made at the right boundary?

## Reader cost

- Does each layer compress complexity, enforce a boundary, or own a lifecycle?
- Can a maintainer trace data origin, mutation, and policy without hidden state?
- Do interfaces hide meaningful decisions or only repeat the implementation?

## Change cost

- Does the design integrate current requirements coherently?
- Do old and new paths coexist without a concrete compatibility requirement?
- Are plausible changes localized by the current ownership model?

## Complexity

- Does each abstraction remove more coordination than it introduces?
- Is complexity concentrated in required behavior rather than configuration,
  forwarding, or speculative flexibility?
- Can existing pieces be removed without losing capability?
