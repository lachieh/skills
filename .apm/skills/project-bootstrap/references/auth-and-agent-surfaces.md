# Auth And Agent Surfaces

Optional modules. Build the selected ones in the order below; each later
module depends only on modules above it. Paths are under `apps/server/src`
unless a package is named; a `templates/` path is copied from there.

## Auth

Better Auth with the Drizzle adapter. The application is its own identity
provider.

- Dependencies: `better-auth` in `apps/server` and `packages/db`.
- Tables: generate the Better Auth schema into `packages/db/src/schema/auth.ts`
  and pass each table to `drizzleAdapter(database, { provider: 'sqlite', schema })`.
- `server/auth-identifiers.ts`
  (`templates/apps/server/src/server/auth-identifiers.ts`): a leaf module with
  no Better Auth import. It resolves the origin (`APP_URL`, then `BETTER_AUTH_URL`, then
  `http://localhost:3000`), the issuer (`<origin>/api/auth`), and the JWKS URL.
  Every other module names these through it, which avoids an import cycle
  through the auth instance.
- `server/auth.ts` (`templates/apps/server/src/server/auth.ts`):
  `createBetterAuth({ database, baseURL, secret, environment, rateLimit })`.
  Settings to keep:
  - `advanced.cookiePrefix: '<cookie>'`.
  - `advanced.ipAddress.ipAddressHeaders`: `cf-connecting-ip`, `x-real-ip`,
    `x-forwarded-for`, the same list the gateway strips or sets.
  - `rateLimit: { enabled: rateLimit }`, on in every environment. Better
    Auth defaults it to production only. `RATE_LIMIT_ENABLED=false` exists for
    the browser suite alone.
  - Throw when `NODE_ENV` is `production` and the secret is absent.
- The template enables `emailAndPassword` with the `username` plugin. Swap in
  the sign-in methods the project needs.
- `server/request-session.ts`: the one place server functions read the session
  from the request and write `Set-Cookie` back through TanStack Start
  (`setCookie` from `@tanstack/react-start/server`).
- `server/auth-edge.ts`: `getBetterAuthRequestHandler(run)` resolves the auth
  instance from the runtime and returns `auth.handler`; the gateway routes
  `/api/auth/*` to it.
- The auth instance is built once per runtime owner through
  `runtime/owner-resources.ts` and served at `/api/auth/*` by the gateway.
- Authorization is separate from authentication: an application-layer guard
  judges a grant for the signed-in account and records the decision. Browser
  pages, the operator API, and MCP tools all pass through that one guard.

Complete when a Vitest test signs in against a migrated in-memory database and
`GET /api/auth/ok` answers from the built server.

## OAuth authorization server

Required by the MCP door and by the operator API. Adds to the Auth module:

- Dependencies: `@better-auth/oauth-provider`, `@better-auth/mcp`.
- Plugins: `jwt()` for signed access tokens and JWKS,
  `oauthDeviceAuthorization()`, and
  `mcp({ loginPage, consentPage, resource, scopes })`.
- Scopes in `auth-identifiers.ts`: `openid`, `profile`, `email`,
  `offline_access`, plus the resource scopes of the selected modules.
- `server/oauth-provisioning.ts`
  (`templates/apps/server/src/server/oauth-provisioning.ts`): an idempotent
  startup step that registers the protected resource and each managed public
  client (no secret, token endpoint
  auth `none`, grant types `device_code` and `refresh_token`). The device grant
  issues tokens only for clients and resources it already knows.
- `packages/device-grant` (`<scope>/device-grant`,
  `templates/packages/device-grant/`): the client side of RFC 8628 as an Effect
  with typed refusals, plus the managed client identifiers. The
  server and every client import the identifiers from here, so they cannot
  drift.
- A `/device` route where a signed-in person enters or confirms the user code.
- Tokens come from `/api/auth/oauth2/token`. They are JWTs bound to an RFC 8707
  resource indicator. The first-party `/device/token` route issues opaque
  tokens with no audience, which the resource servers reject.

Complete when a test requests a device code, approves it as a seeded account,
and receives a JWT whose `aud` is the resource identifier.

## MCP door

A Streamable HTTP MCP server at `/mcp`, acting as an OAuth resource server.

- `packages/mcp` (`<scope>/mcp`, `templates/packages/mcp/`): depends on
  `@modelcontextprotocol/server` and `@better-auth/mcp`; dev `jose` and `zod`.
- `createMcpFetchHandler({ serverName, serverVersion, allowedHosts, allowedOrigins, issuer, resource, jwksUrl, tools, responseMode: 'json' })`
  returns `(request: Request) => Promise<Response>`. It validates `Host` and
  `Origin`, verifies the bearer JWT against JWKS for issuer, audience, and
  expiry, and builds one server instance per request with the verified caller
  in `context.authInfo`.
- Scopes: `mcp` to connect, `mcp:write` for tools registered with
  `registerWriteTool`. A missing scope gets an RFC 6750 `insufficient_scope`
  challenge so a client can step up.
- Tools are supplied by registrars in `server/mcp-tools.ts`, exporting
  `createMcpTools(run)`. A tool handler calls the same application use case as
  the matching page, resolving its services inside the handler rather than at
  registration.
- `server/mcp.ts` (`templates/apps/server/src/server/mcp.ts`, with
  `mcp-server-card.ts`) wires configuration (`MCP_ALLOWED_HOSTS`,
  `MCP_ALLOWED_ORIGINS`, defaulting to localhost plus the deployment hostname)
  and serves a server card at `/.well-known/mcp/server-card.json`.
- The gateway also routes `/.well-known/oauth-protected-resource` (RFC 9728) to
  Better Auth so clients discover the authorization server.
- `<scope>/mcp/testing` exports a token harness that mints signed tokens against
  a local JWKS for transport tests.

Complete when a test calls a read tool with a harness token, a token without
`mcp:write` is refused on a write tool, and an unauthenticated request gets a
`401` with a `WWW-Authenticate` challenge.

## Operator API and CLI

A REST door for operators and automation, and a generic client for it.

- `server/operator-resource-api.ts` serves `/api/resources`.
  `GET /api/resources` answers without a token and publishes the contract:
  resources, operations, the scope each needs, and the resource identifier a
  device grant must name. Unsupported operations are listed with a reason.
- Every other request crosses three boundaries in order: token verification
  (signature, issuer, audience, expiry), strict Zod validation of path, query,
  and body before any storage read, then authorization (issued to the CLI
  client, carries the scopes, account holds a current grant).
- `server/operator-session.ts` projects a verified token into the session
  credential the application services already resolve, so no use case forks
  into a token-flavoured copy.
- Scopes: `cli:read`, `cli:write`, `cli:deploy`.
- `packages/cli` (`<scope>/cli`): `@oclif/core`, `effect`,
  `<scope>/device-grant`; dev `oclif`, `tsx`. Binary name `<cookie>`.
  Commands are verbs over a resource name: `get`, `list`, `create`, `patch`,
  `delete`, plus `auth login`, `auth logout`, and `config set-server`. The
  client sends documents uninterpreted; the server owns validation.
- Contexts per environment are stored at `.<cookie>/config.json` with mode
  `0600`, overridable by an environment variable.
- `packages/cli/turbo.json` extends the root and adds `oclif.manifest.json` to
  the `build` outputs. Add a root script
  `"cli": "nub --cwd packages/cli exec tsx bin/dev.js"`.
- Document the contract in `docs/operator-api.md` and the client in
  `docs/cli.md`.

Complete when an e2e spec logs the CLI in by device grant against the spawned
server and lists one resource.

## WebMCP

Page-scoped tools for an agent acting in the visitor's browser, through the
draft `document.modelContext` API. No polyfill: when the API is absent, nothing
registers.

Copy `templates/apps/server/src/features/webmcp/`, tests included.

- `features/webmcp/model-context.ts`: the minimal API types and
  `findModelContext()`.
- `features/webmcp/tool.ts`: `defineTool({ name, description, input, execute })`
  turns a Zod object into the advertised JSON Schema
  (`z.toJSONSchema(input, { io: 'input' })`) and runs the handler only on parsed
  input.
- `features/webmcp/provider.tsx`: `WebMcpProvider`, mounted in
  `routes/__root.tsx`, and `useWebMcpTools(tools)`, which registers on mount
  and unregisters by `AbortSignal` on navigation.
- Page tools live beside their route as `routes/-<route>.webmcp.ts`: a pure
  factory `create<Page>Tools(deps)` that is tested directly, and a
  `use<Page>Tools(data)` hook that memoizes the array. Array identity drives
  registration.
- Trying it: Chrome 149 with `chrome://flags/#enable-webmcp-testing` exposes
  `document.modelContext` on a secure origin.
- Tool names are snake_case. Read-only tools carry `{ readOnlyHint: true }`.
  Navigating tools return `{ navigatedTo }`.

Complete when a unit test exercises one factory and an e2e spec stubs
`document.modelContext` and observes the tool registered on its page only.

## Agent-readable surfaces

Machine-readable representations of public pages, served by the gateway before
the application.

- `server/content-negotiation.ts`
  (`templates/apps/server/src/server/content-negotiation.ts`):
  `preferredRepresentation(accept)` returns `html` or `markdown`.
- `server/derived-surface-responses.ts`: `createDerivedSurfaceHandler(...)`
  answers `robots.txt`, `sitemap.xml`, `llms.txt`, `index.md`, and a markdown
  rendering of each public page, or `undefined` for any other path. It reads
  through the same application projections as the HTML pages, so one
  publication rule decides both.
- `runtime/derived-surfaces.ts`: `loadDerivedSurfaceHandlerEffect()` builds the
  handler over `SqliteConnection` and maps every storage failure to one
  `DerivedSurfaceUnavailable`, which the gateway answers with `503`.
- The gateway adds `Vary: Accept` and a `Link` header advertising the sitemap,
  `index.md`, and `llms.txt` on HTML responses, and answers a markdown `404`
  when a markdown request misses.

Complete when an e2e spec fetches a public page with `Accept: text/markdown`,
and every sitemap URL answers `200`.

## Boundary audit

Custom lint rules that keep the layers honest. Add once `apps/server` has real
adapters.

- `packages/oxlint-plugin` (`@repo/oxlint-plugin`): plain JS, loaded through
  `jsPlugins` in `oxlint.config.ts`. A plugin rule runs only when the config
  names it.
- `scripts/effect-audit-policy.ts`: the single list of audited globs and the
  approved adapter files for each rule. `oxlint.config.ts` turns it into
  overrides, and `scripts/effect-audit.ts` reads the same lists for the checks
  that need the whole tree (cross-module floating Effects, exactly one resolved
  `effect` version, every package script assigned to a command boundary).
- Rules confine Drizzle to infrastructure adapters, network calls and
  environment reads to approved files, Better Auth to its edge, Effect
  execution to approved run sites, and forbid first-party Promise logic in the
  application layer.
- Add `"effect-audit": "nub exec tsx scripts/effect-audit.ts"` to the root
  scripts and to `check`, an `effect-audit` step to `hk.pkl`, the policy and
  plugin paths to the Turbo `lint` inputs, and a CI step.

Complete when a deliberate violation in a scratch file fails `nub run lint`
and removing it passes.
