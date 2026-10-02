#!/usr/bin/env bash
# Boot a built server image and prove it serves: the homepage, a
# build-hashed asset, and the auth surface.
#
# Usage: smoke-image.sh <image-ref>
set -euo pipefail

image=${1:?Usage: smoke-image.sh <image-ref>}
# A unique name and an ephemeral host port let concurrent jobs share a Docker
# daemon without colliding.
container="smoke-$$-$RANDOM"

cleanup() {
  docker rm --force "$container" > /dev/null 2>&1 || true
}
fail() {
  echo "::error::$1"
  docker logs "$container" || true
  exit 1
}
trap cleanup EXIT

# BETTER_AUTH_SECRET must be present: the server refuses to boot in
# production without it, which is the point of this check.
docker run --detach --name "$container" \
  --env DATABASE_URL=/tmp/<cookie>.db \
  --env BETTER_AUTH_SECRET=smoke-test-secret-0123456789abcdef \
  --publish 127.0.0.1::3000 \
  "$image" > /dev/null

port=$(docker port "$container" 3000/tcp | head -1)
port=${port##*:}
base="http://127.0.0.1:$port"

for attempt in $(seq 1 20); do
  if curl --fail --silent "$base/" > /dev/null; then
    echo "Homepage smoke test passed."
    break
  fi
  if [ "$(docker inspect --format '{{.State.Running}}' "$container")" != true ]; then
    fail "The container exited before serving the homepage."
  fi
  if [ "$attempt" = 20 ]; then
    fail "The homepage did not answer after $attempt attempts."
  fi
  echo "Attempt $attempt failed; retrying."
  sleep 3
done

# The first served response can land before lazy async initializations run;
# prove the process survives them and that the auth surface and a
# build-hashed asset answer correctly.
sleep 5
# -a: the homepage can contain bytes grep treats as binary, which suppresses
# -o output and would falsely fail the asset check.
asset=$(curl --fail --silent "$base/" | grep -ao 'assets/index-[^"]*\.js' | head -1) || true
[ -n "$asset" ] || fail "No build-hashed asset referenced from the homepage."
curl --fail --silent --show-error --header 'Accept: */*' "$base/$asset" > /dev/null \
  || fail "The asset $asset did not answer."
curl --fail --silent --show-error "$base/api/auth/ok" > /dev/null \
  || fail "The auth surface did not answer."
curl --fail --silent --show-error "$base/" > /dev/null \
  || fail "The homepage stopped answering after initialization."
echo "Auth and asset smoke tests passed."
