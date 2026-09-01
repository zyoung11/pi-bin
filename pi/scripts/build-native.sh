#!/usr/bin/env bash
#
# Build the statically-compiled pi binary (scriptc, no JS engine).
#
# Usage:
#   ./scripts/build-native.sh                build to ./pi (git-ignored)
#   ./scripts/build-native.sh --out <path>   build to a custom path
#
# Requires: Node 26 shim at ~/bin-node26 (scriptc needs Node 24+).
# Intermediate cli.ll is auto-cleaned after linking.

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

OUT="${ROOT}/pi"
if [[ "${1:-}" == "--out" && -n "${2:-}" ]]; then
	OUT="$2"
fi

export PATH="$HOME/bin-node26:$PATH"

# Clean intermediates from previous runs
rm -f "$ROOT/cli.ll"

node ../scriptc/packages/cli/dist/bootstrap.js build \
	packages/coding-agent/src/cli.ts \
	--npm-static string_decoder \
	--out "$OUT"

# Clean intermediates from this run
rm -f "$ROOT/cli.ll"

echo "Built: $OUT"
