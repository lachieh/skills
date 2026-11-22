#!/usr/bin/env bash
# Give this machine the agent-<project> service account token, encrypted to
# this machine's age key, so `fnox exec` never asks a human again.
#
# Run once per machine by a human signed in to 1Password: the single `op read`
# below is the only approval. It writes ~/.config/fnox/projects/<project>.toml,
# which fnox.toml imports, so every clone and worktree on the machine shares it.
# A cloud runner with no human session passes --from-env instead.
set -euo pipefail
umask 077

repo="$(cd "$(dirname "$0")/.." && pwd)"
machine_config="$HOME/.config/fnox/projects/<project>.toml"
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

mkdir -p "$(dirname "$machine_config")"

# Earlier versions wrote the token into the checkout's own fnox.local.toml,
# which worktrees never see. It is already encrypted to this machine, so move it.
legacy_config="$repo/fnox.local.toml"
if ! $from_env && [ ! -f "$machine_config" ] &&
  grep -q '^# This machine only (gitignored). Written by scripts/bootstrap-fnox.sh.' "$legacy_config" 2> /dev/null; then
  mv "$legacy_config" "$machine_config"
else
  if [ ! -f "$identity" ]; then
    mkdir -p "$(dirname "$identity")"
    age-keygen -o "$identity" 2> /dev/null
  fi
  recipient="$(age-keygen -y "$identity")"

  cat > "$machine_config" << EOF
# This machine only. Written by scripts/bootstrap-fnox.sh in <project>.
[providers.age]
type = "age"
recipients = ["$recipient"]
EOF

  # The environment is trusted only with --from-env, so a stale token exported
  # by some earlier shell is never stored.
  # No --description on `fnox set`: fnox 1.39 then writes the entry without its
  # ciphertext.
  if $from_env; then
    printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN"
  else
    env -u OP_SERVICE_ACCOUNT_TOKEN op read "$token_ref"
  fi | fnox set --config "$machine_config" --provider age OP_SERVICE_ACCOUNT_TOKEN > /dev/null
fi

grep -q '^OP_SERVICE_ACCOUNT_TOKEN.*value = ' "$machine_config" || {
  echo "fnox did not store the token in $machine_config" >&2
  exit 1
}
cd "$repo"
env -i HOME="$HOME" PATH="$PATH" FNOX_AGE_KEY_FILE="$identity" fnox exec -- op vault get "$vault" > /dev/null
echo "fnox resolves the project vault as agent-<project> in every checkout; no 1Password prompts from here on."
