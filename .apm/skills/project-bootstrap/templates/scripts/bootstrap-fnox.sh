#!/usr/bin/env bash
# Give this machine the agent-<project> service account token, encrypted to
# this machine's age key, so `fnox exec` never asks a human again.
#
# Run once per machine by a human signed in to 1Password: the single `op read`
# below is the only approval. It writes the gitignored fnox.local.toml in the
# main checkout, even when run from a worktree; .config/mise.toml exports the
# token from there in every worktree.
# A cloud runner with no human session passes --from-env instead.
set -euo pipefail
umask 077

repo="$(git -C "$(dirname "$0")" rev-parse --path-format=absolute --git-common-dir)"
repo="${repo%/.git}"
local_config="$repo/fnox.local.toml"
identity="${FNOX_AGE_KEY_FILE:-$HOME/.config/fnox/age.txt}"
vault='project-<project>'
token_ref="op://$vault/op-service-account/credential"
case "${1:-}" in
  '') from_env=false ;;
  --from-env)
    from_env=true
    : "${OP_SERVICE_ACCOUNT_TOKEN:?--from-env needs OP_SERVICE_ACCOUNT_TOKEN}"
    ;;
  *)
    echo "usage: $0 [--from-env]" >&2
    exit 2
    ;;
esac

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

# mise exports this machine's current, possibly stale, token, so the
# environment is trusted only with --from-env.
# No --description on `fnox set`: fnox 1.39 then writes the entry without its
# ciphertext.
if $from_env; then
  printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN"
else
  env -u OP_SERVICE_ACCOUNT_TOKEN op read "$token_ref"
fi | fnox set --config "$local_config" --provider age OP_SERVICE_ACCOUNT_TOKEN > /dev/null

grep -q '^OP_SERVICE_ACCOUNT_TOKEN.*value = ' "$local_config" || {
  echo "fnox did not store the token in $local_config" >&2
  exit 1
}
cd "$(dirname "$0")/.."
env -i HOME="$HOME" PATH="$PATH" mise x -- fnox exec -- op vault get "$vault" > /dev/null
echo "fnox resolves the project vault as agent-<project> in every worktree; no 1Password prompts from here on."
