#!/usr/bin/env bash
# Update lachie-skills in Claude Code, Codex, and OpenCode on this machine, then
# prove each installed copy matches origin/main by content.
#
# Run from any clone of lachieh/skills. Pass --check to compare without
# updating. Exits 1 when an installed client does not match.
set -uo pipefail

check_only=false
[ "${1:-}" = "--check" ] && check_only=true

plugin='lachie-skills@lachie-skills'
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
# Codex and OpenCode keep earlier copies beside the current one. The newest
# directory is the one each loads.
newest() { ls -td "$@" 2>/dev/null | head -1; }
codex_dir() {
  newest "${CODEX_HOME:-$HOME/.codex}"/plugins/cache/lachie-skills/lachie-skills/*/skills
}
opencode_dir() {
  newest "$HOME"/.cache/opencode/npm/git-skills-*/*/node_modules/lachie-skills/skills
}

update_claude() {
  claude plugin marketplace update lachie-skills
  claude plugin update "$plugin"
}
# `claude plugin update` can report success and leave the old copy in place.
reinstall_claude() {
  claude plugin uninstall "$plugin"
  claude plugin install "$plugin"
}
# Upgrading the marketplace does not refresh an installed plugin. Adding the
# plugin again does.
update_codex() {
  codex plugin marketplace upgrade lachie-skills
  codex plugin add "$plugin"
}
update_opencode() { opencode plugin update 'github:lachieh/skills'; }

failed=0
printf '%s origin/main %s skills %s\n' "$(hostname -s)" "$commit" "$want"
for client in claude codex opencode; do
  if ! command -v "$client" > /dev/null 2>&1; then
    printf '%-9s not installed on this machine\n' "$client"
    continue
  fi
  $check_only || "update_$client" > "$tmp/$client.log" 2>&1 < /dev/null
  dir="$("${client}_dir")"
  have="$(digest "$dir")"
  if [ "$have" != "$want" ] && [ "$client" = claude ] && ! $check_only; then
    reinstall_claude >> "$tmp/$client.log" 2>&1 < /dev/null
    dir="$(claude_dir)"
    have="$(digest "$dir")"
  fi
  if [ "$have" = "$want" ]; then
    printf '%-9s ok        %s\n' "$client" "$dir"
  else
    failed=1
    printf '%-9s MISMATCH  %s (has %s)\n' "$client" "${dir:-no install found}" "$have"
    [ -f "$tmp/$client.log" ] && sed 's/^/    /' "$tmp/$client.log" | tail -8
  fi
done
exit "$failed"
