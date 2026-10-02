# CI And Delivery

Workflows, the container image, and the deployment placeholder. Every file
here is in `templates/` at its target path; this reference explains them.

## Composite setup action

`.github/actions/setup/action.yml`, used by every job. Inputs: `install`
(default `true`), `frozen` (default `true`), `turbo-cache` (default `false`).
Steps:

1. `jdx/mise-action` with `install: true, cache: true`.
2. `nubjs/setup-nub` with `cache: false`.
3. Resolve `nub store path` and the Nub cache directories, then cache them
   with `actions/cache`, keyed on `hashFiles('nub.lock', '.config/mise.toml')`.
4. Install `build-essential` and `python3` when `make` or `g++` is missing.
   `better-sqlite3` compiles natively.
5. `nub install --frozen-lockfile`, when `install` is `true`.
6. When `turbo-cache` is `true`, `rharkor/caching-for-turbo`, pinned by commit
   SHA. It serves Turbo's remote cache from the GitHub Actions cache, so jobs
   on empty runners replay each other's task results.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests.
Concurrency group `ci-${{ github.workflow }}-${{ github.ref }}` with
`cancel-in-progress: true`. Include the pull request `closed` type with every
job guarded by `github.event.action != 'closed'`: the run does nothing but
joins the group and cancels CI still running for a merged branch.

| Job          | Needs    | Runs                                                              |
| ------------ | -------- | ----------------------------------------------------------------- |
| `static`     |          | format, lint, typecheck, merge markers, build                     |
| `test`       |          | `nub run test`, then `nub run test:scripts`                       |
| `e2e`        | `static` | install Chromium unless the Turbo result is cached, `nub run e2e` |
| `docker`     | `static` | build the image without pushing, run the smoke test               |
| `ci-success` | all      | fails unless every required job passed                            |

- Build and the static checks share one job because toolchain setup costs more
  than the checks. Each step after the first has `if: ${{ !cancelled() }}` so
  one run reports every failure.
- `static` classifies the changed paths of a pull request and outputs `code`.
  A change touching only `docs/`, `plans/`, `.agents/`, or `*.md` skips `e2e`
  and `docker`. `ci-success` accepts those skips only when `static` succeeded
  and reported `code == 'false'`.
- `e2e` asks `turbo run e2e --dry=json` for the cache status of
  `<scope>/e2e#e2e` and skips the browser install on a hit.
- `ci-success` is the single required status check. Tell the user to mark it
  required in branch protection; nothing in the repository can.
- Add the boundary-audit step to `static` when that module is selected.

## Container image

`templates/Dockerfile`, multi-stage on `node:24-bookworm-slim`.

- `hk` is linked to `/bin/true` so the root `prepare` script succeeds without
  installing git hooks.
- Copy `packages/` wholesale. A hand-maintained list of packages drops the
  next new runtime dependency and leaves a dangling workspace symlink, which
  crashes the image at startup.
- `NUB_VERSION` matches `packageManager` in the root `package.json`.

`.github/scripts/smoke-image.sh <image>` boots the image and proves it serves.
It runs the container with a unique name, an
ephemeral host port, `DATABASE_URL=/tmp/<cookie>.db`, and a throwaway
`BETTER_AUTH_SECRET`, then requires:

1. `GET /` answers within the retry window and the container is still running.
2. After a short wait for lazy initialisation, a build-hashed asset referenced
   by the homepage answers.
3. `GET /api/auth/ok` answers, when the Auth module is selected.
4. `GET /` still answers.

On failure it prints `docker logs`.

## CD

`.github/workflows/cd.yml`. Triggers: push to `main`, push of a
`<scope>/server@*` tag, and `workflow_dispatch` with an `environment` choice of
`staging` or `production`.

| Job                 | Runs                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| `release`           | `changesets/action` in `apps/server`: opens the version PR or tags        |
| `changes`           | `turbo run build --affected --dry=json`; outputs whether the server moved |
| `publish-image`     | build, smoke test, then push to `ghcr.io/${{ github.repository }}`        |
| `deploy-staging`    | GitHub environment `staging`; runs the deploy script                      |
| `deploy-production` | GitHub environment `production`; runs the deploy script                   |
| `cleanup`           | prunes untagged image versions, keeping ten                               |

- `publish-image` builds into the local daemon, smoke tests that exact image,
  and pushes afterwards. Pushing first would publish a crashing image under a
  tag an environment pulls on its next restart.
- Image tags: `nightly` for `main` and staging dispatches, `sha-<sha>` always,
  the version and `latest` for a server tag, `latest` for a production
  dispatch.
- Staging deploys on a push to `main` or a staging dispatch. Production
  deploys only on a server tag or a production dispatch.

### Deployment placeholder

The deployment target is a placeholder until the user names one. Both deploy
jobs bind their GitHub environment, pass that environment's `APP_URL`
variable, and run one script:

See `deploy-staging` in `templates/.github/workflows/cd.yml` and
`templates/.github/scripts/deploy.sh`.

Leave the placeholder in place and report it in the final account. When the
user names a target, write only the script body and add the target's secrets
and variables to both GitHub environments; the workflow shape stays.

Step 3 of the contract matters with the Auth module. A process that boots
without its public origin still answers health checks and serves assets, then
advertises `http://localhost:3000/api/auth` and refuses every same-origin
write. `templates/scripts/deployment-auth-origin.ts` and its command-line
shell `assert-deployment-auth-origin.ts` carry the assertion, with tests:
`issuer` checks that `<APP_URL>/api/auth/.well-known/openid-configuration`
reports the issuer `<APP_URL>/api/auth`, and `origin-enforcement` checks that
a sign-in `POST` with an untrusted `Origin` is refused while the same origin is
accepted. Keep them with any target. A proxied deployment also sets
`TRUSTED_PROXY_CIDRS`.

One worked body, for a platform with a REST API: write `APP_URL` to the
application's environment, call its restart endpoint, poll the discovery
document until the issuer assertion passes, then run the origin probes. A
sibling `diagnose.yml` dispatch that prints the target's status and recent
logs saves the operator from needing credentials locally.

### Deployment authority

Write this rule into the new repository's `AGENTS.md`: a merge to `main` is a
staging deploy, and each production deploy needs explicit human authorization.
Agents do not create `<scope>/server@*` tags, do not dispatch the workflow with
`environment: production`, and do not merge the Changesets version pull
request.

## Runners

`<runner>` defaults to `ubuntu-latest`. For self-hosted runners, list the
labels in `.actionlint.yaml`. On a headless macOS runner, point
`DOCKER_CONFIG` at a workspace directory holding `{"auths":{}}` so Docker never
reaches for the locked keychain.
