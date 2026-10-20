#!/bin/sh
# cloud-entrypoint.sh — root solo para el volumen y el usuario; el worker queda en uid 1001.
# Railway monta el volumen como root. Sin este paso, uid 1001 no podría escribir en /data.
set -eu
cd /app

if [ "$(id -u)" != "0" ]; then
  echo "cloud-entrypoint: hace falta arrancar como root para soltar privilegios con setpriv" >&2
  exit 1
fi

if ! id hermes >/dev/null 2>&1; then
  groupadd --gid 1001 hermes
  useradd --uid 1001 --gid 1001 --create-home --home-dir /home/hermes --shell /usr/sbin/nologin hermes
fi

DATA="${RAILWAY_VOLUME_MOUNT_PATH:-/data}"
mkdir -p "$DATA/hermes" /home/hermes /run/hermes
# /run es de root (755): uid 1001 puede leer un archivo suyo ahí, pero no borrarlo.
# El env lleva secretos; cloud-run.sh tiene que poder hacer rm. Un directorio propio,
# 700 y de hermes, se lo permite. No vive en el volumen.
chown hermes:hermes /run/hermes
chmod 700 /run/hermes
if [ -d /opt/hermes/hermes-agent ] && [ ! -e "$DATA/hermes/hermes-agent" ]; then
  ln -s /opt/hermes/hermes-agent "$DATA/hermes/hermes-agent"
fi
if [ -d /home/hermes/.hermes ] && [ ! -L /home/hermes/.hermes ]; then
  cp -an /home/hermes/.hermes/. "$DATA/hermes/" 2>/dev/null || true
  rm -rf /home/hermes/.hermes
fi
ln -sfn "$DATA/hermes" /home/hermes/.hermes

# El código queda legible (755 de root). Escritura solo donde el trabajo deja archivos.
chown -R hermes:hermes "$DATA" /home/hermes /app/newsletters /app/brands /app/studio/worker

node --import tsx studio/worker/cloud-launch.ts --write /run/hermes/worker.env
chown hermes:hermes /run/hermes/worker.env
chmod 400 /run/hermes/worker.env

# Mismos flags que SETPRIV_ARGS en cloudEnv.ts. --reset-env vacía el entorno de root;
# cloud-run.sh carga solo el archivo filtrado y lo borra.
exec setpriv --reuid=1001 --regid=1001 --init-groups --inh-caps=-all --no-new-privs --reset-env \
  /bin/sh /app/studio/worker/cloud-run.sh
