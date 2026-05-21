#!/usr/bin/env bash
set -euo pipefail

package_name() {
  tar -xOf "$1" package/package.json | node -e 'let s=""; process.stdin.on("data", d => s += d); process.stdin.on("end", () => console.log(JSON.parse(s).name));'
}

package_version() {
  tar -xOf "$1" package/package.json | node -e 'let s=""; process.stdin.on("data", d => s += d); process.stdin.on("end", () => console.log(JSON.parse(s).version));'
}

publish_if_missing() {
  tarball="$1"
  name="$(package_name "$tarball")"
  version="$(package_version "$tarball")"
  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "$name@$version is already published; skipping."
    return 0
  fi

  if [ "${DRY_RUN:-true}" = "true" ]; then
    npm publish "$tarball" --access public --dry-run
  else
    npm publish "$tarball" --access public
  fi
}

if [ -z "${CONTRACTS_TGZ:-}" ] || [ -z "${API_CLIENT_TGZ:-}" ]; then
  echo "CONTRACTS_TGZ and API_CLIENT_TGZ are required" >&2
  exit 1
fi

publish_if_missing "$CONTRACTS_TGZ"
publish_if_missing "$API_CLIENT_TGZ"
