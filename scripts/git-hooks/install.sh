#!/bin/sh
# Install prepare-commit-msg hook to block Cursor attribution in commits.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOK_SRC="$ROOT/scripts/git-hooks/prepare-commit-msg"
HOOK_DST="$ROOT/.git/hooks/prepare-commit-msg"
cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST"
echo "Installed: $HOOK_DST"
