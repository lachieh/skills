---
name: principle-type-system-discipline
description: Apply in statically typed code when correctness depends on states, variants, schemas, or semantic values. Encode those facts without adding unused precision.
---

# Type System Discipline

Use types to encode the facts correctness depends on. Construct valid values
instead of accepting broad ones and repairing them with repeated checks. Model
variants explicitly, handle them exhaustively, and derive shapes from
authoritative schemas. Treat every cast or non-null assertion as a proof
obligation: establish the fact, redesign the type, or isolate the escape at a
boundary. Add precision only when it removes a real invalid state or partial
operation.

Break this rule sooner than make types harder to use without excluding a real
failure.
