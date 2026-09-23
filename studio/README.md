# Hermes Studio

Interfaz web para que el equipo genere newsletters con el pipeline Hermes sin tocar la
estructura de carpetas ni Claude Code: un compañero escribe un brief, el servicio ejecuta las
9 fases (01-09) automáticamente y, si pasa QA y el production gate, le entrega el HTML final.

Ver el diseño completo y las decisiones detrás de esta implementación en el plan de
funcionalidad correspondiente (arquitectura, alcance v1 vs. iteraciones futuras). Este README
es la guía operativa: cómo correrlo y qué limitaciones conocidas tiene hoy.

## Cómo funciona (resumen)

El backend es dueño de la orquestación y del filesystem. Cada fase de IA se llama como una
función de generación de contenido sin estado (una llamada a la API de Anthropic con el prompt
del agente correspondiente `agents/0N-*.md` como *system prompt*, pidiendo la salida en un
formato de bloques de archivo) — el modelo nunca tiene una herramienta de escritura directa
sobre el repo. El backend parsea la respuesta y escribe los archivos él mismo, siempre dentro
de la campaña o del brand pack correspondiente (`campaignFs.writeGeneratedFiles` rechaza
cualquier ruta fuera de esos límites).

- Fases 01/03/04/05: llamada de texto puro.
- Fase 02: Playwright captura la web real de la marca (screenshots + `getComputedStyle` de
  selectores clave) y Claude interpreta esos datos — no conduce el navegador turno a turno.
- Fase 06: ensambla `campaign-data.json`, lo valida contra el schema del motor (`ajv`), y
  genera la imagen de hero por IA si el patrón la necesita.
- Fase 07: determinista, invoca directamente `engine/build-newsletter.js`.
- Fase 08: renderiza 4 tamaños (`scripts/render-preview.js`) y pide un veredicto a Claude.
- Fase 09: corre `scripts/production-gate-motor.ts` y escribe `delivery-notes.md`.

Solo se ofrece el HTML para descargar si QA = **Aprobado** y el production gate pasa. Si no,
el compañero ve el motivo exacto en la interfaz.

## Correr en local

```bash
# Desde la raíz del repo (sistema-final/):
npm install
npx playwright install chromium
cp .env.example .env            # ANTHROPIC_API_KEY, OPENAI_API_KEY
cp studio/.env.example studio/.env   # APP_ACCESS_PASSWORD, PORT, STUDIO_PUBLIC_BASE_URL
npm run studio
```

Abre `http://localhost:3000`. Con `ALLOW_NO_AUTH=true` (por defecto en `.env.example`, solo para
desarrollo local) el servicio no pide contraseña. Sin `APP_ACCESS_PASSWORD` NI `ALLOW_NO_AUTH=true`,
el servicio se niega a arrancar en vez de quedar abierto por accidente (auditoría 2026-09-23).

## Desplegar en Railway

Railway construye directamente desde `railway.json` (apunta a `studio/Dockerfile`, contexto en
la raíz del repo) — no hace falta tocar nada del Dockerfile para esto. Pasos:

1. **Cuenta y login** (los tienes que hacer tú, no un asistente): crea una cuenta en
   [railway.app](https://railway.app) si no tienes una, y en esta terminal:
   ```bash
   railway login
   ```
   Esto abre el navegador para autenticarte. Confírmame cuando termine.

2. **Crear/enlazar el proyecto** — desde la raíz del repo (`sistema-final/`):
   ```bash
   railway init
   ```
   (o `railway link` si ya creaste el proyecto desde el dashboard de Railway).

3. **Añadir un volumen persistente** al servicio desde el dashboard de Railway (Settings →
   Volumes → New Volume). El punto de montaje puede ser el que quieras (por defecto `/data`);
   Railway inyecta automáticamente `RAILWAY_VOLUME_MOUNT_PATH` con esa ruta, y
   `studio/docker-entrypoint.sh` la usa para consolidar ahí `newsletters/`, `brands/` y
   `studio/data/` (ver el comentario en ese archivo — sin volumen, cada redeploy borraría todas
   las campañas y brand packs generados).

4. **Variables de entorno** (dashboard → Variables, o `railway variables --set CLAVE=valor`):
   - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
   - `APP_ACCESS_PASSWORD` (contraseña compartida real para el equipo, no la dejes vacía aquí)
   - `STUDIO_PUBLIC_BASE_URL` — la URL pública que Railway te asigna (o tu dominio propio si
     conectas uno), siempre `https://...`
   - `PORT` — Railway asigna el suyo propio automáticamente y lo expone como `PORT`; el
     servicio ya lo lee de `process.env.PORT`, no hace falta fijarlo a mano.

5. **Desplegar**:
   ```bash
   railway up
   ```

## Desplegar con Docker en tu propio host/VPS

```bash
# Desde la raíz del repo:
docker compose -f studio/docker-compose.yml up --build -d
```

Requisitos para producción real:

- Desplegar detrás de un proxy con **HTTPS** y apuntar `STUDIO_PUBLIC_BASE_URL` a esa URL
  https — el servicio sirve él mismo las imágenes que genera (hero, logo capturado) en
  `/assets/...`, y el schema de `campaign-data.json` exige URLs `https://` para todo asset.
- Persistir `newsletters/`, `brands/` y `studio/data/` (ya montados como volúmenes en
  `docker-compose.yml`) — son el estado real del sistema, no se pueden perder en un redeploy.
- Configurar `APP_ACCESS_PASSWORD` y quitar/desactivar `ALLOW_NO_AUTH` — sin contraseña NI ese
  flag, el servicio ya no arranca (antes quedaba abierto a quien tuviera la URL; ver auditoría
  2026-09-23).

## Alcance de esta v1 — limitaciones conocidas

- **Un job a la vez.** La cola es secuencial (`server/queue.ts`) para no arriesgar escrituras
  concurrentes sobre `brands/`/`newsletters/`. Con volumen de equipo pequeño es suficiente; si
  hace falta paralelismo real, la vía natural es aislar cada job en su propio git worktree.
- **Sin reintento automático tras un "Devuelto" de QA.** Si la fase 08 no aprueba, o el
  production gate (09) falla, el job termina bloqueado mostrando el motivo — no reintenta solo
  la fase responsable (la tabla de enrutamiento de `agents/00-orchestrator.md` describe cómo
  sería ese bucle; queda para la siguiente iteración).
- **Fase 02 no es interactiva.** En vez de un agente conduciendo un navegador turno a turno
  (el ideal descrito en `agents/02-brand-visual-analyst.md`), el backend captura 2 screenshots
  y `getComputedStyle` de un puñado fijo de selectores y se los pasa a Claude ya extraídos. Es
  más rápido y predecible para un servicio desatendido, pero puede pasar por alto matices que
  una sesión interactiva sí captaría.
- **Generación de hero simplificada.** `heroImage.ts` no tiene el paso de visión sobre la
  landing real que sí tiene `scripts/generate-hero-image.ts` (el prompt sale directo del brief
  que escribe la persona, no de una descripción automática de la página). El saneado de texto en
  sí (`scripts/lib/sanitize-hero-prompt.ts`, el fix del incidente de moderación de 2026-07-27 —
  ver `memory.md`) sí se aplica al brief desde la auditoría 2026-09-23 (`phases/dataPhase.ts`).
- **Si al motor (fase 07) le falta un componente**, el job se bloquea para revisión humana en
  vez de dejar que un agente edite `engine/components/` sin supervisión — coherente con la
  regla propia del proyecto de que un componente nuevo nunca se improvisa por campaña.
- **Auth de equipo = una sola contraseña compartida (Basic Auth).** No hay usuarios ni roles.
  Suficiente para v1; migrar a algo más granular es un cambio de `server/index.ts` aislado.
  Protegida contra fuerza bruta desde 2026-09-23: `server/rateLimit.ts` corta a 20 intentos
  fallidos / 5 min por IP (solo cuenta fallos, no penaliza uso normal ya autenticado) y a 5
  jobs creados / 10 min por IP (cada job dispara llamadas reales a Anthropic/OpenAI). Limitador
  en memoria por proceso, sin dependencia nueva — no vale para varias réplicas (ver cabecera del
  archivo), coherente con que Studio hoy es un solo proceso con una cola secuencial.

## Verificación antes de anunciarlo al equipo

1. Con una campaña ya construida a mano (p. ej. `newsletters/2026/new-balance/new-balance-premium/`),
   confirma que `phases/buildPhase.ts` y `phases/qaExportPhase.ts` funcionan invocando los
   scripts reales, sin gastar tokens de IA.
2. Envía un job con una marca **ya existente** (evita la fase 02) y un brief corto — revisa a
   mano los `.md` que aparecen en la campaña nueva creada por el propio servicio.
3. Envía un job con una **marca nueva** real para validar la captura de Playwright y que
   `brand-tokens.json` pasa `check-brand-pack-completeness.ts`.
4. Corre un job completo de punta a punta y confirma que, si el production gate falla, la
   interfaz muestra el motivo sin ofrecer ningún archivo — y que si pasa, `final-inline.html`
   se descarga y abre bien en el navegador.
