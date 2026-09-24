#!/bin/bash
# service.sh — el worker de Hermes como servicio de macOS (launchd): arranca al iniciar sesión y se
# relanza si se cae. Uso (desde sistema-final/): studio/worker/service.sh install|uninstall|restart|status|logs
set -euo pipefail

LABEL="com.hermes-studio.worker"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
LOG="$HOME/Library/Logs/hermes-worker.log"
DOMAIN="gui/$(id -u)"
# launchd no carga el perfil del terminal: PATH explícito con node/npx/hermes.
NODE_DIR="$(dirname "$(command -v npx)")"
HERMES_DIR="$(dirname "$(command -v hermes)")"
SERVICE_PATH="$NODE_DIR:$HERMES_DIR:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

write_plist() {
  mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
  cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string><string>-i</string>
    <string>$NODE_DIR/npx</string><string>tsx</string><string>studio/worker/hermes-worker.ts</string>
  </array>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$SERVICE_PATH</string>
    <key>HOME</key><string>$HOME</string>
    <key>LANG</key><string>es_ES.UTF-8</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST
}

case "${1:-status}" in
  install)
    write_plist
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    echo "Servicio instalado: arranca al iniciar sesión y se relanza si se cae. Log: $LOG"
    ;;
  uninstall)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Servicio desinstalado."
    ;;
  restart)
    launchctl kickstart -k "$DOMAIN/$LABEL"
    echo "Servicio reiniciado."
    ;;
  status)
    if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
      launchctl print "$DOMAIN/$LABEL" | grep -E "^\s+(state|pid|last exit code) =" || true
    else
      echo "Servicio no instalado."
    fi
    ;;
  logs)
    tail -n "${2:-40}" -f "$LOG"
    ;;
  *)
    echo "Uso: $0 install|uninstall|restart|status|logs" >&2
    exit 1
    ;;
esac
