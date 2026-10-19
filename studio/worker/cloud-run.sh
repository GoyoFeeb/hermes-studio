#!/bin/sh
# cloud-run.sh — ya somos uid 1001. Carga la lista blanca, borra el archivo y arranca el worker.
set -eu
# Mismo sitio que cloud-entrypoint.sh. El directorio es de hermes (700), así que
# este uid puede borrar el archivo después de cargarlo.
ENV_FILE=/run/hermes/worker.env
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1091
  . "$ENV_FILE"
  rm -f "$ENV_FILE"
fi
cd /app
if ! command -v hermes >/dev/null 2>&1; then
  echo "AVISO: no está el comando hermes en PATH. El latido sigue; los trabajos fallarán al lanzarlo." >&2
fi
exec node --import tsx studio/worker/hermes-worker.ts
