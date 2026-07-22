#!/usr/bin/env bash
set -euo pipefail

# Always operate from the repo root (one level up from this script).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BUILD_DIR="$REPO_ROOT/build"
BUCKET="s3://mazegame.callaway.family"
export AWS_PROFILE=ncallaway

# Refuse to deploy unless build/ exists and has something in it, so we never
# mirror an empty directory over the live site.
if [[ ! -d "$BUILD_DIR" ]]; then
  echo "error: build directory '$BUILD_DIR' does not exist — run scripts/build.sh first." >&2
  exit 1
fi
if [[ -z "$(ls -A "$BUILD_DIR")" ]]; then
  echo "error: build directory '$BUILD_DIR' is empty — run scripts/build.sh first." >&2
  exit 1
fi

echo "Syncing $BUILD_DIR/ -> $BUCKET/"
AWS_PROFILE=ncallaway aws s3 sync "$BUILD_DIR/" "$BUCKET/" --delete

# Look up the CloudFront distribution by its domain alias so we don't have to
# hardcode a distribution ID.
DISTRIBUTION_ID="E2WD5L6PRMPF3E"

echo "Invalidating CloudFront cache for $DISTRIBUTION_ID"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"

echo "Deploy complete."
