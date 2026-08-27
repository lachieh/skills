# TypeScript Patterns

These examples support the rules in `SKILL.md`. The underlying principles are
language-agnostic. See `principle-type-system-discipline` and
`principle-boundary-discipline`.

## Branded Types

Brand primitives so they cannot be mixed up. Validate once at creation and let
downstream code trust the type.

```ts
type AgentId = string & { readonly __brand: "AgentId" };

function parseAgentId(input: string): AgentId {
  if (!isUUID(input)) throw new Error(`Invalid agent id: ${input}`);
  return input as AgentId;
}

function focusAgent(id: AgentId): void {
  /* input is trusted */
}
```

Match the `readonly __brand: "X"` shape rather than introducing another
convention.

## Discriminated Unions

If a bug raises the question "can this combination happen?", the type is too
loose. Model variants with one literal discriminant field whose value is unique
for each variant.

```ts
// Boolean plus optionals allows contradictory states.
type DiffState = { loading: boolean; diff?: GitDiff; error?: string };

// The union permits only defined states.
type DiffState =
  | { kind: "loading" }
  | { kind: "ready"; diff: GitDiff }
  | { kind: "error"; error: string };
```

Choose one discriminant name such as `kind`, `type`, or `tag` and use it
consistently within the domain.

## Constructive Modeling

Build a type from legal parts rather than repeatedly restricting a loose type at
runtime.

Non-empty collection with a variadic tuple:

```ts
type NonEmpty<T> = [T, ...T[]];

// A plain array forces every caller to account for an empty value.
function pickWinnerLoose(entries: string[]): string {
  if (entries.length === 0) throw new Error("no entries");
  return entries[Math.floor(Math.random() * entries.length)];
}

// The stronger input makes an empty argument unconstructable.
function pickWinner(entries: NonEmpty<string>): string {
  return entries[Math.floor(Math.random() * entries.length)];
}
```

When a plain `T[]` arrives, narrow once with a guard so the fact travels in the
type:

```ts
const isNonEmpty = <T>(arr: T[]): arr is NonEmpty<T> => arr.length > 0;
```

Represent an even-length sequence as pairs:

```ts
type Pairs<T> = [T, T][];
```

Represent a time range as a start and duration:

```ts
// A prose invariant does not constrain the values.
type LooseTimeRange = { start: Date; end: Date }; // start must precede end

// Callers derive the end from the stored representation.
type TimeRange = { start: Date; durationMs: number };
```

Keep `durationMs` a plain number until mixing raw numbers with durations causes a
real risk. Then brand it. Choose the representation that prevents the invalid
state and expose readings such as `pairs.flat()` or `rangeEnd()` on top.

## Simplest Total Type

Keep `T[]` when every operation on it remains total:

```ts
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
```

Strengthen when the loose type forces a non-null assertion, cast, or impossible
case at a use site:

```ts
function newestSessionLoose(sessions: Session[]): Session {
  return sessions.at(0)!;
}

function newestSession(sessions: NonEmpty<Session>): Session {
  return sessions[0];
}
```

Returning `Session | undefined` is the other total signature. Either approach
moves the empty case to the caller that knows what empty means.

## `unknown` Over `any`

External data starts as `unknown`. Narrow it before use.

```ts
function handleUnchecked(input: any) {
  return input.foo.bar;
}

function handle(input: unknown) {
  if (typeof input === "object" && input !== null && "foo" in input) {
    // The compiler now verifies access permitted by this narrowing.
  }
}
```

External sources include RPC payloads, `JSON.parse`, `postMessage`, IPC, file
contents, environment variables, and database results.

## Cast Proof

A cast requires proof. Validate the value or redesign the type before using one.

```ts
const uncheckedUser = data as User;

function parseUser(data: unknown): User {
  if (typeof data !== "object" || data === null) {
    throw new Error("expected object");
  }
  if (!("id" in data) || typeof data.id !== "string") {
    throw new Error("expected id");
  }
  // Validate every remaining field before establishing User.
  return data as User;
}
```

When removing an existing cast, identify what prevents inference:

- Add a missing discriminant and use a discriminated union.
- Narrow an overly broad source type such as `Record<string, unknown>`.
- Add a parser or schema at an untyped boundary.
- Use a validated branded constructor or `satisfies` instead of an unchecked
  cast.

## Narrowing Hierarchy

Use these mechanisms in order:

1. Discriminated union switch or conditional.
2. `in` operator.
3. `typeof` or `instanceof`.
4. User-defined type guard.
5. Cast after runtime validation.

```ts
function area(shape: Shape): number {
  if ("radius" in shape) return Math.PI * shape.radius ** 2;
  return shape.width * shape.height;
}
```

## Type Guards

A guard must verify the claim it makes.

```ts
function isCircle(shape: Shape): shape is Shape & { kind: "circle" } {
  return shape.kind === "circle";
}
```

Prefer direct discriminant narrowing when available. A guard adds a function the
reader must inspect.

## Exhaustiveness

Assign the remaining value to `never` in a default arm. The compiler then
reports unhandled variants.

```ts
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    default: {
      const exhaustive: never = shape;
      return exhaustive;
    }
  }
}

function draw(shape: Shape): void {
  switch (shape.kind) {
    case "circle":
      drawCircle(shape);
      break;
    case "rect":
      drawRect(shape);
      break;
    default: {
      const exhaustive: never = shape;
      void exhaustive;
    }
  }
}
```

Use the return form in value-producing switches and the void form in statement
switches.

## `satisfies` Over `as`

`satisfies` validates without widening literals.

```ts
const widenedConfig = { theme: "dark", cols: 3 } as Config;

const config = { theme: "dark", cols: 3 } satisfies Config;
```

Here `config.theme` remains the literal type `"dark"` instead of widening to
`string`.

## Boundary Validation

Validate once where data enters, then trust established types inside. Apply
`principle-boundary-discipline`.

- Parse wire formats according to the repository's forward-compatibility
  contract. For generated protocol parsers, use their supported unknown-field
  option when forward compatibility requires it.
- Store persisted JSON in a versioned shape and handle parse failure.
- Avoid repeated validation deep in call chains.

## Schema-Derived Types

When a protocol, API schema, query schema, or database migration already defines
a shape, derive from generated types instead of duplicating it.

```ts
type DuplicateCheckSummary = {
  totalCount: number;
  checks: { name: string; status: string }[];
};

import type { ChecksMessage } from "<generated module>";

function renderChecks(
  summary: Pick<ChecksMessage, "totalCount" | "checks">,
) {
  // Render only the fields this consumer requires.
}
```

Reach for `Pick`, `Omit`, `Parameters`, `ReturnType`, `Awaited`, and `typeof`
before declaring another interface.

## Object Arguments

Use an object when positional parameters can be confused:

```ts
openFilePositional(
  uri,
  10,
  1,
  10,
  1,
);

openFile({
  uri,
  selection: {
    startLineNumber: 10,
    startColumn: 1,
    endLineNumber: 10,
    endColumn: 1,
  },
});
```

Keep positional calls in measured allocation-sensitive paths such as per-frame
rendering, tokenizers, and parsers.
