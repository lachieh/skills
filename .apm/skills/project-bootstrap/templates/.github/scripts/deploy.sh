#!/usr/bin/env bash
set -euo pipefail

# PLACEHOLDER: no deployment target is configured.
#
# Replace the body with the target's rollout, keeping this contract:
#   1. Roll the target to the image this run published.
#   2. Wait until ${APP_URL} serves the new process.
#   3. Assert the deployment is correct, and exit non-zero when it is not.
#      With the Auth module, pipe
#      ${APP_URL}/api/auth/.well-known/openid-configuration into
#      `node scripts/assert-deployment-auth-origin.ts issuer --app-url "$APP_URL"`.
echo "::warning title=Deploy::No deployment target is configured for ${DEPLOY_ENVIRONMENT}. The image was published and nothing was deployed."
