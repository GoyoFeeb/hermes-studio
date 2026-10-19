# Hermes worker — imagen del servicio Railway `hermes-worker`.
# Contexto de build: la raíz del repo (igual que studio/Dockerfile), porque el trabajo
# usa engine/, brands/, newsletters/ y studio/worker. El proceso final no es root:
# cloud-entrypoint.sh hace exec de setpriv a uid 1001. Ver studio/worker/CLOUD.md.

FROM node:22-slim

# El Node que instala Hermes (tarball de nodejs.org, no el de esta imagen) enlaza
# libatomic.so.1. bookworm-slim no la trae, y el instalador corre como uid 1001
# sin sudo, así que pm/libatomic.py no puede hacer `apt-get install libatomic1`.
# Sin la librería, `node --version` sale 127, pm.cli install devuelve 1 e
# install.sh (bootstrap_pm) termina en "pm install failed".
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git bash util-linux libatomic1 \
 && rm -rf /var/lib/apt/lists/*

# Chromium de Playwright (miniaturas, identidad medida, revisión). Fuera de /root para que uid 1001 lo lea.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx -y playwright@1.61.1 install-deps chromium || true

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx playwright install chromium \
 && chmod -R a+rX /ms-playwright \
 && chmod +x studio/worker/cloud-entrypoint.sh studio/worker/cloud-run.sh

# Hermes Agent en /opt/hermes (código) y el binario en /home/hermes/.local/bin.
# El estado (sesiones, auth) no se queda aquí: el entrypoint apunta HERMES_HOME al volumen.
RUN groupadd --gid 1001 hermes \
 && useradd --uid 1001 --gid 1001 --create-home --home-dir /home/hermes --shell /bin/bash hermes \
 && mkdir -p /opt/hermes \
 && chown -R hermes:hermes /opt/hermes /home/hermes

USER hermes
ENV HOME=/home/hermes \
    HERMES_HOME=/opt/hermes \
    PATH="/home/hermes/.local/bin:${PATH}"
RUN curl -fsSL https://hermes-agent.nousresearch.com/install.sh -o /tmp/install-hermes.sh \
 && bash /tmp/install-hermes.sh --non-interactive --channel stable --skip-computer-use --hermes-home /opt/hermes \
 && rm -f /tmp/install-hermes.sh

# Vuelve a root: el volumen de Railway se monta como root y hay que hacer chown antes de setpriv.
USER root

ENV NODE_ENV=production
EXPOSE 8080

ENTRYPOINT ["studio/worker/cloud-entrypoint.sh"]
