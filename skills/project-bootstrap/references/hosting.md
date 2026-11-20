# Hosting

The live environments every project gets: staging and production apps on
Coolify, public traffic through a Cloudflare Tunnel with Full (Strict) TLS,
SQLite backed up to Backblaze B2 by Litestream, a private GHCR image, and two
GitHub environments. The agent does all of it with the tokens in
`Agent Automation` (see `secrets-and-agent-access.md`). The human only approves
the 1Password setup, toggles Chrome remote debugging when a dashboard has no
API, and confirms GitHub sudo prompts.

| Environment | Hostname              | Coolify app           | Deploys from                |
| ----------- | --------------------- | --------------------- | --------------------------- |
| staging     | `staging.<domain>`    | `<project>-staging`   | `main`                      |
| production  | `<domain>`, `www.<domain>` redirecting to the apex | `<project>` | `<scope>/server@*` tags |

Work in this order. Each part ends in a check; do not start the next until it
passes. Store every value created along the way in `project-<project>` under
the item names in `secrets-and-agent-access.md` before using it.

## 1. Survey the server

Read before changing anything. The VPS already hosts other apps, and their
setup is the pattern to copy.

- With `coolify-root`, list servers, projects, and applications. Note the
  server's architecture: CD builds `linux/amd64` only, so an ARM server needs
  an arm64 build added.
- With `cloudflare-tunnel-edit`, find the tunnel the other apps use: their DNS
  records are proxied CNAMEs to `<tunnel-id>.cfargotunnel.com`. Pick a route
  that currently answers 200 as the model; one answering 502 is broken (see
  Let's Encrypt below).
- Read the `coolify` Docker network's subnet from the Coolify server terminal
  (`docker network inspect coolify`). It is the app's `TRUSTED_PROXY_CIDRS`.
  SSH from this machine may be refused; the Coolify UI terminal works.
- Check whether the VPS answers on 80, 443, or 8000 directly, bypassing
  Cloudflare (`curl --resolve <domain>:443:<ip> …`). If it does, a client can
  send `Host: <domain>` with a forged `cf-connecting-ip` and escape the rate
  limiter. Do not change the firewall: it covers every app on the box. Report
  it and recommend a firewall at the VPS provider blocking inbound 80, 443,
  and 8000, since all traffic arrives through the tunnel.

## 2. TLS: origin certificate, zone settings

Let's Encrypt cannot work here: Traefik's HTTP-01 challenge never completes
through a tunnel, so Traefik serves no valid certificate and cloudflared
refuses the connection (502). Use a Cloudflare Origin CA certificate instead.

1. Issue one with `cloudflare-ssl-edit`: hostnames `<domain>` and
   `*.<domain>`, RSA, 15 years. Verify the certificate matches the private key,
   then store both in `project-<project>` as the documents
   `cloudflare-origin-cert` and `cloudflare-origin-key`.
2. Load it into Traefik: Coolify → Server → Proxy → Dynamic Configurations,
   a new file `<project>-origin-cert.yaml` with the PEMs inline under
   `tls.certificates`. Keep other projects' certificate files untouched.
   Re-read the saved YAML and confirm it parses to the same PEM.
3. On the `<domain>` zone only: SSL mode Full (Strict), Always Use HTTPS on.

## 3. Tunnel routes and DNS

1. Back up the tunnel's configuration first. `PUT` replaces the whole ingress
   list, and that list carries every production app on the server.
2. Insert routes for `<domain>`, `www.<domain>`, and `staging.<domain>` just
   before the catch-all `http_status:404`. Each goes to
   `https://localhost:443` with `originRequest.originServerName` set to its own
   hostname and TLS verification left on.
3. Diff the new configuration against the backup: only the three routes may
   differ.
4. With `cloudflare-dns-edit`, create proxied CNAMEs for `@`, `www`, and
   `staging` to `<tunnel-id>.cfargotunnel.com`, idempotently.

Shell `echo` mangles backslashes in the path regexes of existing routes; use
`printf` or `jq` files when reading and diffing the configuration.

Complete when each hostname answers over HTTPS from Traefik: 503 before
anything is deployed, 502 means the certificate chain is wrong. A new
hostname can take a minute while Cloudflare provisions its edge certificate.

## 4. Coolify project and apps

Create project `<project>` with environments `staging` and `production`, and
one Docker-image application in each, through the API with `coolify-root`:

- Image `ghcr.io/<owner>/<project>`, port 3000, a persistent volume at
  `/data`.
- Domains: staging `https://staging.<domain>`; production
  `https://<domain>,https://www.<domain>` with the www-to-apex redirect.
- Certificate resolver `none`, so Traefik serves the origin certificate and
  never asks Let's Encrypt. The field is `settings.traefik_certificate_resolver`;
  re-read it after the `PATCH`, which reports success either way.
- Health check on, path `/healthz`, port 3000.
- Environment variables: `APP_URL`, `BETTER_AUTH_SECRET` (generate 32 random
  bytes per environment and store `better-auth-secret-<environment>` first),
  `TRUSTED_PROXY_CIDRS` (the `coolify` network subnet), and the three
  `LITESTREAM_*` variables from part 5.
- Coolify starts the new container before stopping the old one, so for a few
  seconds both run `litestream replicate` against the same database and
  replica path. Litestream expects one replicating process per database.
  After the first two deploys, check that a `litestream restore` to a scratch
  path succeeds. If it fails, configure the app so Coolify stops the old
  container before starting the new one, and drop the overlap default.
- The image is private. The server's existing `ghcr.io` registry login
  normally pulls it; the first deploy proves it. When it does not, add a
  read-only package token as a registry credential.

Then create one API token per environment in the Coolify UI (no API exists for
it): permissions Read, Write, Deploy, and Read Sensitive (Diagnose reads
container logs with it), access scoped to that environment of
`<project>`, no expiry. Store them as `coolify-deploy-staging` and
`coolify-deploy-production`. Verify each reads its own app and gets 404 on the
other's.

## 5. Backups: Backblaze B2

- One private bucket per project, `<owner>-<project>-litestream`, with the
  lifecycle set to keep only the last version. The default keeps every
  version, and Litestream's pruned files would then be billed indefinitely.
  Change only this bucket's lifecycle.
- One application key restricted to that bucket, read and write, stored as
  `backblaze-b2-litestream` (`username` = key ID). Mint it with
  `backblaze-b2-master` through the B2 API, or in the dashboard when the
  master key is missing. Never regenerate the master key: that revokes the
  current one.
- `LITESTREAM_REPLICA_URL` is `s3://<bucket>/<environment>` with the bucket's
  S3 endpoint and region as the `endpoint` and `region` query parameters
  (Litestream 0.5 reads both from the URL). Staging and production replicate
  to separate paths in the same bucket and never share data.

## 6. GitHub environments

- Repository settings: squash merge only (release notes depend on it).
- `staging`: deployment branch policy `main` only.
- `production`: deployment tag policy `<scope>/server@*` only. Required
  reviewers are not available for a private repository on the free plan; the
  tag policy and the human-run Release workflow are the gate. Say so in the
  final account.
- Variables on each: `APP_URL`, `COOLIFY_URL` (`<coolify-url>`), and
  `COOLIFY_APP_UUID`.
- Secret on each: `OP_SERVICE_ACCOUNT_TOKEN`, piped from `fnox get` into
  `gh secret set --env <environment>` without printing, rejecting an empty
  value. No Coolify token is a GitHub secret; workflows load it from 1Password.

One service account reads both deploy tokens, so a change merged to `main`
could load the production Coolify token during a staging run. That is accepted
by default; report it in the final account. A separate production vault and
service account closes it.

## 7. First staging deploy

Merging the bootstrap pull request runs CD on `main`, which is the first real
test of the image pull, the 1Password step in CI, the deploy script, and
Litestream. Staging needs no approval: merge when CI passes. When CD skips the
deploy or fails, run Diagnose, fix on a branch, merge it to `main`, and
dispatch CD on `main` with `environment: staging` if the merge did not deploy.
The staging environment accepts only `main`.

Complete when `https://staging.<domain>/` and `/healthz` answer 200, the
deploy job passed (with Auth, its issuer and origin checks too), and the container log shows
Litestream replicating. Production is created and wired but not deployed: the
first production release is the human's.
