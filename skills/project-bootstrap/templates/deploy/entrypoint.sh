#!/bin/sh
# Container entrypoint. With LITESTREAM_REPLICA_URL set, restore the database
# from its replica when the volume is empty, then run the server under
# `litestream replicate`, which streams every WAL change to the replica and
# forwards SIGTERM to the server. Without it, run the server alone.
set -eu

if [ -z "${LITESTREAM_REPLICA_URL:-}" ]; then
  exec nub server-entry.ts
fi

mkdir -p "$(dirname "$DATABASE_URL")"
litestream restore -config /etc/litestream.yml -if-db-not-exists -if-replica-exists "$DATABASE_URL"
exec litestream replicate -config /etc/litestream.yml -exec "nub server-entry.ts"
