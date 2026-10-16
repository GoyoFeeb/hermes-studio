#!/bin/sh
# cloud-run.sh — ya somos uid 1001. Carga la lista blanca, borra el archivo y arranca el worker.
set -eu
if [ -f /run/hermes-worker.env ]; then
  # shellcheck disable=SC1091
  . /run/hermes-worker.env
  rm -f /run/hermes-worker.env
fi
cd /app
if ! command -v hermes >/dev/null 2>&1; then
  echo "AVISO: no está el comando hermes en PATH. El latido sigue; los trabajos fallarán al lanzarlo." >&2
fi
exec node --import tsx studio/worker/hermes-worker.ts
