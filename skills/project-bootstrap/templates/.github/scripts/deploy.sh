#!/usr/bin/env bash
# Roll a Coolify application to the image this run published, wait for it to
# serve, and prove the deployment answers as APP_URL.
#
# Environment (set per GitHub environment):
#   DEPLOY_ENVIRONMENT  staging | production (for messages)
#   APP_URL             public origin, e.g. https://staging.<domain>
#   IMAGE_TAG           tag to roll to, e.g. sha-<commit>
#   COOLIFY_URL         Coolify base URL (variable)
#   COOLIFY_APP_UUID    the environment's Coolify application (variable)
#   COOLIFY_TOKEN       Coolify token scoped to this environment, loaded from
#                       1Password (project-<project>) by the workflow
set -euo pipefail

: "${DEPLOY_ENVIRONMENT:?}" "${APP_URL:?}" "${IMAGE_TAG:?}"
: "${COOLIFY_URL:?}" "${COOLIFY_APP_UUID:?}" "${COOLIFY_TOKEN:?}"

api="${COOLIFY_URL%/}/api/v1"
app_url="${APP_URL%/}"
here="$(cd "$(dirname "$0")/../.." && pwd)"

coolify() {
  local method=$1 path=$2
  shift 2
  curl --fail-with-body --silent --show-error --request "$method" \
    --header "Authorization: Bearer $COOLIFY_TOKEN" \
    --header 'Content-Type: application/json' \
    "$api$path" "$@"
}

echo "Rolling $DEPLOY_ENVIRONMENT ($COOLIFY_APP_UUID) to image tag $IMAGE_TAG."

# 1. Point the application at this run's image, and keep its public origin in
#    step with the GitHub environment so the two cannot drift.
coolify PATCH "/applications/$COOLIFY_APP_UUID" \
  --data "$(jq -n --arg tag "$IMAGE_TAG" '{docker_registry_image_tag: $tag}')" > /dev/null
coolify PATCH "/applications/$COOLIFY_APP_UUID/envs" \
  --data "$(jq -n --arg url "$app_url" '{key: "APP_URL", value: $url, is_preview: false}')" > /dev/null

# 2. Deploy, then wait for Coolify to report the rollout finished. With a
#    container health check, Coolify only switches traffic to a healthy one.
deployment=$(coolify POST "/deploy?uuid=$COOLIFY_APP_UUID&force=false" | jq -r '.deployments[0].deployment_uuid')
[ -n "$deployment" ] && [ "$deployment" != null ] || {
  echo "::error::Coolify did not start a deployment."
  exit 1
}
echo "Coolify deployment $deployment started."

status=unknown
for _ in $(seq 1 90); do
  status=$(coolify GET "/deployments/$deployment" | jq -r '.status')
  case "$status" in
    finished) break ;;
    failed | cancelled*)
      echo "::error::Coolify deployment $deployment ended as $status. Run the Diagnose workflow for logs."
      exit 1
      ;;
  esac
  sleep 10
done
[ "$status" = finished ] || {
  echo "::error::Coolify deployment $deployment did not finish within 15 minutes (last status: $status)."
  exit 1
}
echo "Coolify deployment $deployment finished."

# [module: Auth]
# 3. Assert the new process advertises APP_URL as its auth issuer. A process
#    booted without its public origin still passes health checks, then refuses
#    every same-origin write.
discovery="$app_url/api/auth/.well-known/openid-configuration"
for attempt in $(seq 1 30); do
  if document=$(curl --fail --silent --show-error "$discovery") \
    && printf '%s' "$document" | node "$here/scripts/assert-deployment-auth-origin.ts" issuer --app-url "$app_url"; then
    break
  fi
  [ "$attempt" = 30 ] && exit 1
  sleep 5
done

# Better Auth checks Origin only on requests that carry a cookie (the CSRF
# case), so each probe sends a throwaway one.
probe() {
  local origin=$1
  curl --silent --show-error --output /tmp/probe-body --write-out '%{http_code}' \
    --request POST "$app_url/api/auth/sign-in/username" \
    --header 'Content-Type: application/json' \
    --header "Origin: $origin" \
    --header 'Cookie: <cookie>.deploy_probe=1' \
    --data '{"username":"deployprobe","password":"deploy-probe-wrong-password"}'
}
untrusted_status=$(probe 'https://deploy-probe.invalid')
untrusted_body=$(cat /tmp/probe-body)
same_status=$(probe "$app_url")
same_body=$(cat /tmp/probe-body)
jq -n \
  --argjson us "$untrusted_status" --arg ub "$untrusted_body" \
  --argjson ss "$same_status" --arg sb "$same_body" \
  '{untrusted: {status: $us, body: $ub}, sameOrigin: {status: $ss, body: $sb}}' \
  | node "$here/scripts/assert-deployment-auth-origin.ts" origin-enforcement --app-url "$app_url"

# [/module]

echo "$DEPLOY_ENVIRONMENT now serves $IMAGE_TAG at $app_url."
