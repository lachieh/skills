FROM node:24-bookworm-slim AS nub

ARG NUB_VERSION=0.11.1
RUN npm install --global "@nubjs/nub@${NUB_VERSION}"

WORKDIR /app

FROM nub AS build-tools

RUN apt-get update \
    && apt-get install --yes --no-install-recommends build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

FROM build-tools AS build

COPY . .
RUN nub install --frozen-lockfile
RUN nub run build

FROM build-tools AS production-dependencies

COPY . .
RUN nub install --prod --frozen-lockfile

FROM debian:bookworm-slim AS litestream

ARG LITESTREAM_VERSION=0.5.18
ARG TARGETARCH
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && case "$TARGETARCH" in amd64) arch=x86_64 ;; arm64) arch=arm64 ;; *) echo "unsupported $TARGETARCH" && exit 1 ;; esac \
    && curl --fail --silent --show-error --location \
      "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-linux-${arch}.tar.gz" \
      | tar --extract --gzip --directory /usr/local/bin litestream

FROM nub AS production

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=/data/<project>.db

# The database (and Litestream's WAL state) lives on a volume mounted here.
RUN mkdir -p /data
VOLUME /data

# curl: Coolify's health check runs curl or wget inside the container in place
# of the HEALTHCHECK below.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=litestream /usr/local/bin/litestream /usr/local/bin/litestream
COPY deploy/litestream.yml /etc/litestream.yml
COPY --chmod=0755 deploy/entrypoint.sh /usr/local/bin/<cookie>-entrypoint

# Copy the workspace wholesale from the stage that installed it, rather than
# listing packages by hand. A hand-maintained list silently drops any new
# packages/* runtime dependency and leaves a dangling workspace symlink in
# apps/server/node_modules.
COPY --from=production-dependencies /app/package.json /app/nub.lock ./
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/packages ./packages
COPY --from=production-dependencies /app/apps/server ./apps/server
COPY --from=build /app/apps/server/dist ./apps/server/dist

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

WORKDIR /app/apps/server
CMD ["<cookie>-entrypoint"]
