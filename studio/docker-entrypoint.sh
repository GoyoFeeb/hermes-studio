#!/bin/sh
# docker-entrypoint.sh — en plataformas de un solo volumen por servicio (Railway, y similares),
# no se pueden montar 3 volúmenes separados (newsletters/, brands/, studio/data/) como hace
# docker-compose.yml en local. Este script consolida los 3 bajo el ÚNICO volumen persistente
# que la plataforma monta, y los enlaza con symlinks a las rutas que el código ya espera —
# así server/paths.ts no necesita saber nada sobre dónde vive el volumen real.
#
# La primera vez que arranca (volumen vacío), siembra newsletters/ y brands/ con el contenido
# que ya viene en la imagen (los brand packs y campañas existentes del repo) para no perderlos.
set -e

# Sin RAILWAY_VOLUME_MOUNT_PATH (docker-compose.yml local/VPS, que ya bind-monta newsletters/,
# brands/ y studio/data directamente) no hay nada que consolidar — tocar esas rutas aquí
# convertiría el bind mount real en un symlink y podría arrastrar un `rm -rf` al host. Se sigue
# de largo directo al comando.
if [ -z "$RAILWAY_VOLUME_MOUNT_PATH" ]; then
  exec "$@"
fi

DATA_DIR="$RAILWAY_VOLUME_MOUNT_PATH"
mkdir -p "$DATA_DIR"

for dir in newsletters brands; do
  if [ ! -d "$DATA_DIR/$dir" ]; then
    echo "[entrypoint] Sembrando $DATA_DIR/$dir con el contenido de la imagen..."
    cp -r "/app/$dir" "$DATA_DIR/$dir"
  fi
  rm -rf "/app/$dir"
  ln -s "$DATA_DIR/$dir" "/app/$dir"
done

mkdir -p "$DATA_DIR/studio-data"
rm -rf /app/studio/data
ln -s "$DATA_DIR/studio-data" /app/studio/data

exec "$@"
