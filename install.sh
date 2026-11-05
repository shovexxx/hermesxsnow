#!/usr/bin/env bash
# HermesXSnow installer — copies plugin.js into your Hermes desktop-plugins folder.
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SRC="$SRC_DIR/plugin.js"

# If piped via curl (no local plugin.js), download it.
if [[ ! -f "$PLUGIN_SRC" ]]; then
  PLUGIN_SRC="$(mktemp)"
  curl -fsSL https://raw.githubusercontent.com/shovexxx/hermesxsnow/main/plugin.js -o "$PLUGIN_SRC"
fi

HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
DEST="$HERMES_HOME/desktop-plugins/xsnow-christmas"

mkdir -p "$DEST"
cp "$PLUGIN_SRC" "$DEST/plugin.js"

echo "Installed HermesXSnow -> $DEST/plugin.js"
echo "Now open Hermes desktop and run: Ctrl/Cmd+K -> Reload desktop plugins"
