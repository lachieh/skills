FROM node:24-bookworm-slim AS nub

ARG NUB_VERSION=0.7.5
RUN npm install --global "@nubjs/nub@${NUB_VERSION}"

WORKDIR /app

FROM nub AS build-tools

# Satisfy the root prepare script without installing development-only Git hooks.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends build-essential python3 \
    && rm -rf /var/lib/apt/lists/* \
    && ln --symbolic /bin/true /usr/local/bin/hk

FROM build-tools AS build

COPY . .
RUN nub install --frozen-lockfile
RUN nub run build

FROM build-tools AS production-dependencies

COPY . .
RUN nub install --prod --frozen-lockfile

FROM nub AS production

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Copy the workspace wholesale from the stage that installed it, rather than
# listing packages by hand. A hand-maintained list silently drops any new
# packages/* runtime dependency and leaves a dangling workspace symlink in
# apps/server/node_modules; that has crashed the published image twice.
# Only apps/server and packages/* are taken, so nothing else in the repository
# ships from here.
COPY --from=production-dependencies /app/package.json /app/nub.lock ./
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/packages ./packages
COPY --from=production-dependencies /app/apps/server ./apps/server
COPY --from=build /app/apps/server/dist ./apps/server/dist

EXPOSE 3000

WORKDIR /app/apps/server
CMD ["nub", "server-entry.ts"]
