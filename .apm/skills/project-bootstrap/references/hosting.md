# Hosting

The live environments every project gets: staging and production apps on
Coolify, public traffic through a Cloudflare Tunnel with Full (Strict) TLS,
SQLite backed up to Backblaze B2 by Litestream, a private GHCR image, and two
GitHub environments. The agent does all of it with the tokens in
`Agent Automation` (see `secrets-and-agent-access.md`). The human only approves
the 1Password setup, toggles Chrome remote debugging when a dashboard has no
documented API, and confirms GitHub sudo prompts. The rest is the agent's
work. That includes generating and storing app secrets, creating DNS records,
deploy tokens, and bucket keys, and creating vendor apps through the
signed-in browser. Do not list any of these as a step for the human.

| Environment | Hostname              | Coolify app           | Deploys from                |
| ----------- | --------------------- | --------------------- | --------------------------- |
| staging     | `staging.<domain>`    | `<project>-staging`   | `main`                      |
| production  | `<domain>`, `www.<domain>` redirecting to the apex | `<project>` | `<scope>/server@*` tags |

Work in this order. Each part ends in a check; do not start the next until it
passes. Store every value created along the way in `project-<project>` under
the item names in `secrets-and-agent-access.md` before using it.

## Without a domain

When no domain is bought yet, both environments take hostnames under
`<scratch-zone>`, the zone the human named in step 1:

| Environment | Hostname                           |
| ----------- | ---------------------------------- |
| production  | `<project>.<scratch-zone>`         |
| staging     | `<project>-staging.<scratch-zone>` |

- `<domain>` resolves to `<project>.<scratch-zone>`. Staging is
  `<project>-staging.<scratch-zone>`, not `staging.<domain>`. There is no `www`
  hostname.
- Both hostnames use the zone's existing wildcard DNS record and wildcard
  tunnel route. In the part 1 survey, confirm the record, the route, and the
  certificate the proxy serves for the zone. Add a record, a route, or a
  certificate only where the survey finds one missing.
- Change no setting on the scratch zone. Other projects use it.
- When the project gets its own domain, do parts 2 to 4 for that domain, then
  remove the scratch-zone hostnames from the Coolify apps and `APP_URL` in
  the same change, once their consumers are checked.

## 1. Survey the server

Read before changing anything. The VPS already hosts other apps, and their
setup is the pattern to copy. One page is the exception: Proxy → Dynamic
Configurations shows other projects' private keys (see part 2). Read only the
file names there.

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

Step 2 opens Coolify's Dynamic Configurations page. That page renders every
project's file in full, and each file holds an origin-certificate private key
inline.

- Read only the file names on that page. Get them with an `eval` that
  returns the names and nothing else. A snapshot of the page prints the keys.
- Never print the page's contents: no snapshot, page text, or screenshot of it
  in output. Do not open another project's file to see how it loads a
  certificate. The structure is the one in step 2.
- When a private key reaches your output, rotate it at once, without asking.
  Issue a replacement with `cloudflare-ssl-edit`, replace the PEMs in that
  key's file, and confirm its hostnames still answer over HTTPS. Only then
  revoke the exposed certificate, and store the new pair. Revoking first
  takes that project's hostnames down until the new certificate is in place.
  Then tell the human which key was exposed and that it is replaced. When the
  key belongs to another project and this run cannot write to that project's
  vault, say so in the same message.

1. Issue one with `cloudflare-ssl-edit`: hostnames `<domain>` and
   `*.<domain>`, RSA, 15 years. Verify the certificate matches the private key,
   then store both in `project-<project>` as the documents
   `cloudflare-origin-cert` and `cloudflare-origin-key`.
2. Load it into Traefik: Coolify → Server → Proxy → Dynamic Configurations,
   a new file `<project>-origin-cert.yaml` with the PEMs inline under
   `tls.certificates`. Keep other projects' certificate files untouched,
   except to rotate a key that reached your output (above).
   Confirm the save without printing the file: hash the saved PEMs with an
   `eval` in the page, or in a `umask 077` file, and compare with a hash of
   the vault copies. Only the hashes reach output.
3. On the `<domain>` zone only: SSL mode Full (Strict), Always Use HTTPS on.

## 3. Tunnel routes and DNS

1. Read the tunnel's configuration immediately before the write and keep that
   read as the backup. `PUT` replaces the whole ingress list, and that list
   carries every production app on the server. Another run may have added a
   route since an earlier read, and a list built from the earlier read would
   delete it.
2. Insert routes for `<domain>`, `www.<domain>`, and `staging.<domain>` just
   before the catch-all `http_status:404`. Each goes to
   `https://localhost:443` with `originRequest.originServerName` set to its own
   hostname and TLS verification left on.
3. Diff the new configuration against that read: only this project's three
   routes may differ.
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

Then create one API token per environment: permissions Read, Write, Deploy,
and Read Sensitive (Diagnose reads container logs with it), access scoped to
that environment of `<project>`, no expiry. Store them as
`coolify-deploy-staging` and `coolify-deploy-production`. Verify each reads
its own app and gets 404 on the other's.

Coolify has no documented API for creating API tokens. The UI creates one
with a single Livewire request from a signed-in session, so the form does not
have to be clicked through for each environment:

- Record the network events in the signed-in browser session while creating
  the first token, and capture that one request: its address, the component
  method it calls, and its payload.
- Reuse the captured request from the same session for the second token, and
  for later projects.
- Keep the session cookie and CSRF token out of output and out of any file
  you keep.
- When the replayed request is refused, create the token through the form and
  report what the refusal said.
- This file does not yet carry the request. Propose what you captured as an
  addition to it, with `<coolify-url>` and `<project>` in place of the real
  values and no cookie or token. The skills repository is public.

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
  reviewers are not available for a private repository on the free plan. The
  gate is the tag policy plus the rule that each run of the Release workflow
  needs the human's explicit instruction. Say so in the final account.
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
first production release waits for the human's instruction.
