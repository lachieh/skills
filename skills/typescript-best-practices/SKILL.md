---
name: typescript-best-practices
description: Apply TypeScript-specific type modeling, narrowing, boundary validation, API, testing, and telemetry practices when reading or editing any .ts or .tsx file.
---

# TypeScript Best Practices

Apply `principle-type-system-discipline` first. This skill grounds that principle
in TypeScript syntax.

| Rule | Summary |
|------|---------|
| Discriminated unions | Model variants with a literal `kind` discriminant so invalid state combinations cannot be represented. Avoid optional-field bags. |
| Branded types | Brand primitives with `& { readonly __brand: "X" }` so they cannot be mixed up. Validate once at creation. |
| Constructive modeling | Build shapes so invalid values cannot be constructed. Use `[T, ...T[]]` for non-empty collections, `[T, T][]` for pairs, and `start` plus `duration` for a range. |
| Simplest total type | Keep `T[]` while every operation remains total. Strengthen to `NonEmpty<T>` only where the loose type forces `!`, a cast, or an impossible-case throw. |
| `unknown` over `any` | External data is `unknown`. `any` disables type checking everywhere it reaches. |
| Cast proof | Treat every `as` as a proof obligation. Cast only after runtime validation at a boundary. |
| Narrowing hierarchy | Discriminant switch, then `in`, then `typeof` or `instanceof`, then a verified type guard, then a justified cast. |
| Type guards | Verify the full claim. Name guards `isX` or `hasX`. |
| Exhaustiveness | Assign to a `never` local in default arms so new variants produce a compiler error. |
| `satisfies` over `as` | Validate a value without widening its literal types. |
| Boundary validation | Validate where data enters and trust established types inside. Apply `principle-boundary-discipline`. |
| Schema-derived types | Reach for `Pick`, `Omit`, `Parameters`, `ReturnType`, `Awaited`, and `typeof` before declaring a duplicate interface. |
| Object arguments | Prefer object parameters where positional ordering can cause mistakes. Skip this on measured allocation-sensitive paths. |
| Real tests | Prefer real framework primitives and a running build. Mock only boundaries that cannot run locally. Apply `principle-prove-it-works`. |
| Structured telemetry | Prefer structured diagnostics with enough context to debug from an identifier. Avoid `console.log` in shipped code. |

See [`references/patterns.md`](references/patterns.md) for examples.
