#!/usr/bin/env bash
# Give this machine the agent-<project> service account token, encrypted to
# this machine's age key, so `fnox exec` never asks a human again.
#
# Run once per machine by a human signed in to 1Password: the single `op read`
# below is the only approval. It writes the gitignored fnox.local.toml.
set -euo pipefail
umask 077

repo="$(cd "$(dirname "$0")/.." && pwd)"
local_config="$repo/fnox.local.toml"
identity="${FNOX_AGE_KEY_FILE:-$HOME/.config/fnox/age.txt}"
vault='project-<project>'
token_ref="op://$vault/op-service-account/credential"

if [ ! -f "$identity" ]; then
  mkdir -p "$(dirname "$identity")"
  age-keygen -o "$identity" 2> /dev/null
fi
recipient="$(age-keygen -y "$identity")"

cat > "$local_config" << EOF
# This machine only (gitignored). Written by scripts/bootstrap-fnox.sh.
[providers.age]
type = "age"
recipients = ["$recipient"]
EOF

# A token already in the environment (a cloud runner) is used as is;
# otherwise the human's 1Password session reads it once.
# No --description on `fnox set`: fnox 1.39 then writes the entry without its
# ciphertext.
if [ -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]; then
  printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN"
else
  op read "$token_ref"
fi | fnox set --config "$local_config" --provider age OP_SERVICE_ACCOUNT_TOKEN > /dev/null

cd "$repo"
grep -q '^OP_SERVICE_ACCOUNT_TOKEN.*value = ' "$local_config" || {
  echo "fnox did not store the token in $local_config" >&2
  exit 1
}
env -u OP_SERVICE_ACCOUNT_TOKEN fnox exec -- op vault get "$vault" > /dev/null
echo "fnox resolves the project vault as agent-<project>; no 1Password prompts from here on."
