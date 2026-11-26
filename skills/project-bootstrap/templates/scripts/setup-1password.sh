#!/usr/bin/env bash
# Create this project's 1Password vault and its agent-<project> service
# account, store the account's token in the vault, and give this machine that
# token through bootstrap-fnox.sh.
#
# Run once by a human in their own Terminal, signed in to 1Password as an
# owner or administrator. The whole run needs one desktop-app approval. That
# prompt never reaches an agent's shell, so an agent does not run this file.
# Each step skips work already done: rerun it after a timeout.
#
# Adopting a project that already has a vault or a service account:
#   --rename-vault <name>  rename that vault to project-<project> instead of
#                          creating an empty one. Fails when no vault has
#                          that name and project-<project> does not exist.
#   --replace-account      create a new service account and overwrite the
#                          stored token. Every run with this flag creates
#                          another account, so drop it when rerunning.
# The token of an account that is kept must already be stored in the vault as
# op-service-account. Without that item the script stops before it renames
# anything, so an existing account is never replaced by accident.
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
adopting=false
while [ $# -gt 0 ]; do
  case "$1" in
    --rename-vault)
      rename_from="${2:?--rename-vault needs the current vault name}"
      adopting=true
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

has_vault() { op vault get "$1" > /dev/null 2>&1; }
has_token() { op item get "$item" --vault "$1" > /dev/null 2>&1; }
no_token() {
  echo "$1 has no $item item. Keeping the existing account?" >&2
  echo "Rename the item that holds its token to $item." >&2
  echo "Replacing it? Rerun with --replace-account." >&2
  exit 1
}

# The first call raises the approval. Fail here when it is refused, before a
# missing session can pass for a missing vault.
op vault list > /dev/null

if [ -n "$rename_from" ] && has_vault "$rename_from"; then
  if has_vault "$vault"; then
    echo "Both $rename_from and $vault exist; merge or delete one first." >&2
    exit 1
  fi
  # Checked before the rename: a stop after it would leave every reference
  # to the old vault name broken.
  $replace_account || has_token "$rename_from" || no_token "$rename_from"
  op vault edit "$rename_from" --name "$vault" > /dev/null
  echo "Renamed vault $rename_from to $vault."
elif ! has_vault "$vault"; then
  # A mistyped name must not fall through to an empty new vault.
  if [ -n "$rename_from" ]; then
    echo "No vault named $rename_from or $vault; check the name." >&2
    exit 1
  fi
  op vault create "$vault" > /dev/null
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
if $adopting && ! $stored && ! $replace_account; then
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
