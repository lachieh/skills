#!/usr/bin/env bash
# Prints the release tag for a commit: <scope>/server@YYYY.MM.DD in UTC,
# then .2, .3, ... for further releases the same day. Fails when the commit
# already carries a release tag, so a release always contains new changes.
#
# Usage: next-release-tag.sh <commit> [date]
#   date  YYYY.MM.DD, defaulting to today in UTC (tests pass it explicitly)
#
# Reads tags from the local repository; fetch them first.
set -euo pipefail

commit="$1"
date="${2:-$(date -u +%Y.%m.%d)}"
prefix='<scope>/server@'

existing="$(git tag --points-at "$commit" --list "${prefix}*" | head -n 1)"
if [[ -n "$existing" ]]; then
  echo "error: $commit is already released as $existing; merge a change to main first" >&2
  exit 1
fi

tag="${prefix}${date}"
n=1
while git rev-parse --quiet --verify "refs/tags/$tag" > /dev/null; do
  n=$((n + 1))
  tag="${prefix}${date}.${n}"
done
echo "$tag"
