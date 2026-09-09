# Hermes Studio — imagen del servicio. Se construye desde la RAÍZ del repo (sistema-final/),
# no desde studio/, porque el servicio necesita el pipeline completo (agents/, engine/,
# scripts/, brands/, patterns/) junto a él. Ver studio/README.md para el comando de build.

FROM node:22-slim

# Dependencias nativas de Playwright/Chromium.
RUN npx -y playwright@1.61.1 install-deps chromium || true

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx playwright install chromium

RUN chmod +x studio/docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

# El entrypoint consolida newsletters/, brands/ y studio/data bajo el único volumen persistente
# que plataformas como Railway montan por servicio — ver studio/docker-entrypoint.sh. En local
# con docker-compose.yml (3 volúmenes reales, bind-mounted directamente sobre esas rutas) es
# inofensivo: los directorios ya existen con el contenido correcto y los symlinks apuntan a sí
# mismos en la práctica.
ENTRYPOINT ["studio/docker-entrypoint.sh"]
CMD ["npx", "tsx", "studio/server/index.ts"]
