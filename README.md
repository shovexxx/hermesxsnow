# HermesXSnow ❄️

Snow + Santa sleigh overlay for the **Hermes Agent desktop app** — a
canvas homage to the classic [xsnow](https://get-xsnow.de/) program,
recreated in JavaScript so it works everywhere (Linux, Windows,
macOS; X11, Wayland, native), with no binary install needed.

Snow falls over every chat/session window, Santa and his reindeer fly
across the screen, and you can tune snowfall, speed, sleigh, and trees
from the `/xsnow` page. Toggle the overlay any time from the titlebar
❄️ button, the status-bar chip, or the command palette.

## Install (one command)

```bash
curl -fsSL https://raw.githubusercontent.com/shovexxx/hermesxsnow/main/install.sh | bash
```

This copies `plugin.js` into your Hermes home's desktop-plugins
folder (`$HERMES_HOME/desktop-plugins/xsnow-christmas/`, default
`~/.hermes/...`). Then in the Hermes desktop app:

1. Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> → **Reload desktop plugins**.
2. Snow starts falling over the chat window. Click **❄️ XSnow** in the
   sidebar to open the control page.

### Manual install

```bash
mkdir -p ~/.hermes/desktop-plugins/xsnow-christmas
curl -fsSL https://raw.githubusercontent.com/shovexxx/hermesxsnow/main/plugin.js \
  -o ~/.hermes/desktop-plugins/xsnow-christmas/plugin.js
```

For a named profile, use `~/.hermes/profiles/<name>/desktop-plugins/`
instead.

### Install from a clone

```bash
git clone https://github.com/shovexxx/hermesxsnow.git
cd hermesxsnow && ./install.sh
```

## That's it

No build step, no dependencies — a single plain-JavaScript ESM file
loaded by the desktop app at runtime. Settings (snowfall, speed,
Santa, trees, overlay on/off) persist per plugin via `ctx.storage`.

Optional, on Linux only: the classic X11 `xsnow` binary can be
installed with `sudo dnf install xsnow` (Fedora) / `sudo apt install
xsnow` (Debian/Ubuntu) and run from a terminal for the original
watery-window effect. The in-app canvas version needs none of this.

## Uninstall

```bash
rm -rf ~/.hermes/desktop-plugins/xsnow-christmas
```

Then reload desktop plugins from the command palette.

## License

MIT — see `LICENSE`.
