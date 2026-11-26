#!/usr/bin/env bash
# Create this project's 1Password vault and its agent-<project> service
# account, store the account's token in the vault, and give this machine that
# token through bootstrap-fnox.sh.
#
# Run once by a human in their own Terminal, signed in to 1Password as an
# owner or administrator. The whole run needs one desktop-app approval. That
# prompt never reaches an agent's shell, so an agent does not run this file.
# Each step skips work already done: rerun it after a timeout. A run that
# stopped after creating the vault and before storing a token asks for
# --replace-account on the rerun.
#
# Adopting a project that already has a vault or a service account:
#   --rename-vault <name>  rename that vault to project-<project> instead of
#                          creating an empty one. Fails when no vault has
#                          that name and project-<project> does not exist.
#   --replace-account      create a new service account and overwrite the
#                          stored token. Every run with this flag creates
#                          another account, so drop it when rerunning.
# A vault that existed before this run may already have a service account,
# and 1Password has no command that lists them. So the script creates an
# account only in a vault it created in this run, or with --replace-account.
# For any other vault it needs the kept account's token stored there as
# op-service-account, and stops before renaming anything when that is missing.
set -euo pipefail
umask 077

account='<account>'
vault='project-<project>'
shared='Agent Automation'
service_account='agent-<project>'
item='op-service-account'
# Logins this project needs that sit in the human's Private vault, by item
# name. A service account cannot read Private, so each one is moved.
logins=()

rename_from=''
replace_account=false
created_vault=false
while [ $# -gt 0 ]; do
  case "$1" in
    --rename-vault)
      rename_from="${2:?--rename-vault needs the current vault name}"
      shift 2
      ;;
    --replace-account)
      replace_account=true
      shift
      ;;
    *)
      echo "usage: $0 [--rename-vault <name>] [--replace-account]" >&2
      exit 2
      ;;
  esac
done

# mise exports the service account token inside the repository, and with it
# `op` acts as that account, which can create neither a vault nor a service
# account. OP_ACCOUNT selects the account for every `op` call below, including
# the one in bootstrap-fnox.sh.
unset OP_SERVICE_ACCOUNT_TOKEN
export OP_ACCOUNT="$account"

# `op` exits non-zero for a missing item and for a failed request alike, so
# presence is read from a listing. A listing that fails stops the script: a
# timeout must not pass for an absent vault or token and create a second one.
listed() {
  local kind="$1" name="$2" rows
  shift 2
  rows="$(op "$kind" list "$@" --format json)" || {
    echo "Could not list 1Password ${kind}s. Rerun: finished steps are skipped." >&2
    exit 1
  }
  N="$name" python3 -c '
import json, os, sys
key = "title" if sys.argv[1] == "item" else "name"
sys.exit(0 if any(r.get(key) == os.environ["N"] for r in json.load(sys.stdin)) else 1)
' "$kind" <<< "$rows"
}
has_vault() { listed vault "$1"; }
has_token() { listed item "$item" --vault "$1"; }
no_token() {
  echo "$1 exists and has no $item item." >&2
  echo "Keeping its service account? Rename the item with its token to $item." >&2
  echo "No account yet, or replacing it? Rerun with --replace-account." >&2
  exit 1
}


if [ -n "$rename_from" ] && has_vault "$rename_from"; then
  if has_vault "$vault"; then
    echo "Both $rename_from and $vault exist; merge or delete one first." >&2
    exit 1
  fi
  $replace_account || has_token "$rename_from" || no_token "$rename_from"
  op vault edit "$rename_from" --name "$vault" > /dev/null
  echo "Renamed vault $rename_from to $vault."
elif ! has_vault "$vault"; then
  if [ -n "$rename_from" ]; then
    echo "No vault named $rename_from or $vault; check the name." >&2
    exit 1
  fi
  op vault create "$vault" > /dev/null
  created_vault=true
  echo "Created vault $vault."
fi
if ! has_vault "$shared"; then
  op vault create "$shared" > /dev/null
  echo "Created vault $shared."
fi

# 1Password returns the token once. It goes from `create` to the item through
# the environment and stdin, never through arguments or output, and it is
# stored before anything else can fail.
if has_token "$vault"; then
  stored=true
else
  stored=false
fi
if ! $stored && ! $replace_account && ! $created_vault; then
  no_token "$vault"
fi
if $replace_account || ! $stored; then
  token="$(op service-account create "$service_account" \
    --vault "$shared:read_items" \
    --vault "$vault:read_items,write_items" --raw)"
  [ -n "$token" ] || {
    echo "1Password returned no token for $service_account" >&2
    exit 1
  }
  if $stored; then
    store=(op item edit "$item" --vault "$vault")
  else
    store=(op item create - --vault "$vault")
  fi
  T="$token" python3 -c '
import json, os
print(json.dumps({"title": "op-service-account",
  "category": "API_CREDENTIAL",
  "fields": [{"id": "credential", "type": "CONCEALED",
              "label": "credential", "value": os.environ["T"]}]}))' |
    "${store[@]}" > /dev/null
  unset token
  echo "Created $service_account and stored its token as $item."
fi

for login in ${logins[@]+"${logins[@]}"}; do
  if ! op item get "$login" --vault "$vault" > /dev/null 2>&1; then
    op item move "$login" --current-vault Private \
      --destination-vault "$vault" > /dev/null
    echo "Moved $login into $vault."
  fi
done

bash "$(dirname "$0")/bootstrap-fnox.sh"
