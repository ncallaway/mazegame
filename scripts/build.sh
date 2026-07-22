#!/usr/bin/env bash
set -euo pipefail

# Always operate from the repo root (one level up from this script), regardless
# of where the script is invoked from, so we never rm -rf a stray build/ dir.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BUILD_DIR="$REPO_ROOT/build"

npm run build

rm -rf "${BUILD_DIR:?}"
mkdir -p "$BUILD_DIR"

cp index.html "$BUILD_DIR/"
cp game.js "$BUILD_DIR/"
cp game.css "$BUILD_DIR/"
cp -r assets "$BUILD_DIR/"
