#!/usr/bin/env bash
# Install or update lachie-skills in Claude Code, Codex, and OpenCode on this
# machine, then prove each client has the plugin configured and that its
# installed copy matches origin/main by content.
#
# Run from any clone of lachieh/skills. Pass --check to compare without
# changing anything. Exits 1 when a client that is present does not pass.
set -uo pipefail

check_only=false
[ "${1:-}" = "--check" ] && check_only=true

plugin='lachie-skills@lachie-skills'
source='lachieh/skills'
root="$(git rev-parse --show-toplevel)" || exit 2
tmp="$(mktemp -d)"
trap 'rm -r "$tmp"' EXIT

digest() {
  [ -d "$1" ] || { echo missing; return; }
  (cd "$1" && find . -type f -print0 | LC_ALL=C sort -z |
    xargs -0 shasum -a 256 | shasum -a 256 | cut -c1-12)
}

git -C "$root" fetch --quiet origin main || exit 2
git -C "$root" archive origin/main skills | tar -x -C "$tmp" || exit 2
want="$(digest "$tmp/skills")"
[ "$want" != missing ] && [ -n "$want" ] || {
  echo "could not read skills/ from origin/main" >&2
  exit 2
}
commit="$(git -C "$root" rev-parse --short origin/main)"

claude_dir() {
  python3 - <<'PY'
import json, os
base = os.environ.get("CLAUDE_CONFIG_DIR", os.path.expanduser("~/.claude"))
try:
    data = json.load(open(os.path.join(base, "plugins/installed_plugins.json")))
    print(data["plugins"]["lachie-skills@lachie-skills"][0]["installPath"] + "/skills")
except Exception:
    print("")
PY
}
# Codex and OpenCode keep earlier copies beside the current one, and keep them
# after the plugin is removed from their configuration. The newest directory is
# the one each loads, and only when the configuration still names the plugin.
newest() { ls -td "$@" 2>/dev/null | head -1; }
codex_dir() {
  newest "${CODEX_HOME:-$HOME/.codex}"/plugins/cache/lachie-skills/lachie-skills/*/skills
}
opencode_dir() {
  newest "${XDG_CACHE_HOME:-$HOME/.cache}"/opencode/npm/git-skills-*/*/node_modules/lachie-skills/skills
}

configured_claude() { [ -n "$(claude_dir)" ]; }
# `codex plugin list` waits on remote marketplaces, so read the config file.
configured_codex() {
  grep -A2 -F "[plugins.\"$plugin\"]" "${CODEX_HOME:-$HOME/.codex}/config.toml" \
    2> /dev/null | grep -q 'enabled = true'
}
# OpenCode's service takes a few seconds to list a plugin that was just added.
configured_opencode() {
  local tries=1
  $check_only || tries=10
  while [ "$tries" -gt 0 ]; do
    opencode plugin check < /dev/null 2>> "$log" | grep -q 'lachie-skills' &&
      return 0
    tries=$((tries - 1))
    [ "$tries" -gt 0 ] && sleep 3
  done
  return 1
}

install_or_update_claude() {
  claude plugin marketplace update lachie-skills ||
    claude plugin marketplace add "$source"
  claude plugin update "$plugin" || claude plugin install "$plugin"
}
# `claude plugin update` can report success and leave the old copy in place.
reinstall_claude() {
  claude plugin uninstall "$plugin"
  claude plugin install "$plugin"
}
# Upgrading the marketplace does not refresh an installed plugin. Adding the
# plugin again does.
install_or_update_codex() {
  codex plugin marketplace upgrade lachie-skills ||
    codex plugin marketplace add "$source"
  codex plugin add "$plugin"
}
# `opencode plugin add` reuses a copy already in its cache, however old, so an
# add is followed by an update.
install_or_update_opencode() {
  opencode plugin update "github:$source" && return
  opencode plugin add "github:$source"
  opencode plugin update "github:$source"
}

failed=0
printf '%s origin/main %s skills %s\n' "$(hostname -s)" "$commit" "$want"
for client in claude codex opencode; do
  if ! command -v "$client" > /dev/null 2>&1; then
    printf '%-9s client not installed on this machine\n' "$client"
    continue
  fi
  log="$tmp/$client.log"
  $check_only || "install_or_update_$client" > "$log" 2>&1 < /dev/null
  dir="$("${client}_dir")"
  have="$(digest "$dir")"
  if [ "$have" != "$want" ] && [ "$client" = claude ] && ! $check_only; then
    reinstall_claude >> "$log" 2>&1 < /dev/null
    dir="$(claude_dir)"
    have="$(digest "$dir")"
  fi
  if ! "configured_$client"; then
    failed=1
    printf '%-9s MISMATCH  plugin not configured in %s\n' "$client" "$client"
  elif [ "$have" != "$want" ]; then
    failed=1
    printf '%-9s MISMATCH  %s (has %s)\n' "$client" "${dir:-no install found}" "$have"
  else
    printf '%-9s ok        %s\n' "$client" "$dir"
    continue
  fi
  [ -f "$log" ] && sed 's/^/    /' "$log" | head -40
done
exit "$failed"
