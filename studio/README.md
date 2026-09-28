# Hermes Studio

Interfaz web para que el equipo genere newsletters con el pipeline Hermes sin tocar la
estructura de carpetas ni Claude Code: un compañero escribe un brief, el servicio ejecuta las
9 fases (01-09) automáticamente y, si pasa QA y el production gate, le entrega el HTML final.

Ver el diseño completo y las decisiones detrás de esta implementación en el plan de
funcionalidad correspondiente (arquitectura, alcance v1 vs. iteraciones futuras). Este README
es la guía operativa: cómo correrlo y qué limitaciones conocidas tiene hoy.

## Modo standalone con Hermes (el que muestra la interfaz desde 2026-09-24)

El compañero elige la marca, pega el prompt de dirección creativa generado con la skill
`newsletter-creative-brief` y elige de dónde salen las imágenes (assets oficiales o IA). El
trabajo queda **en cola** en Studio y lo ejecuta **Hermes Agent en el Mac del usuario**:

```
Studio (Railway) ──cola──▶ studio/worker/hermes-worker.ts (Mac) ──▶ hermes -z "<prompt + entrega>"
      ▲                                                                   │ (cwd = sistema-final/)
      └──────── HTML + imágenes (base64) ◀── newsletters/{año}/{marca}/hermes/{campaña}/newsletter.html
```

Es el mismo flujo que pegar el prompt en Hermes a mano, automatizado: misma instalación, config,
skills, memoria y suscripción de Nous → misma calidad y mismo tiempo (1-2 h por newsletter). Una
versión anterior llamaba directamente a gpt-5.5 en una sola llamada y producía piezas genéricas:
la calidad de Hermes sale de su bucle de agente (navegar la web real, mirar capturas, corregir).

Antes de subirla, el worker pasa el **control de calidad** (`studio/worker/qualityCheck.ts`):
enlaces e imágenes que responden (404/410/5xx o dominio inexistente = error; 403/429 de webs que
bloquean robots = aviso), preheader, enlace `{{unsubscribe_url}}`, `alt`, enlaces vacíos o a "#",
peso > 102 KB (Gmail lo recorta) y móvil a 375 px. Los errores se le devuelven a Hermes (hasta 2
rondas, como el móvil); los claims de riesgo solo se avisan (la regla da falsos positivos). El informe
se guarda con el trabajo y se ve en el **panel de revisión** del resultado, junto a la autoauditoría
de Hermes (`notas.md`).

Al recibir la newsletter, Studio publica sus imágenes en `/assets` (Gmail no muestra imágenes
`data:`) y la entrega. `/assets/*` es público y solo sirve imágenes; el HTML se sirve con CSP `sandbox`.

### Poner en marcha el worker (en el Mac con Hermes instalado)

1. Railway: variable `WORKER_TOKEN` (secreto largo aleatorio). Sin ella las rutas `/api/worker/*`
   no aceptan nada.
2. `~/.config/hermes-studio/.env` en el Mac, **fuera del repo** (carpeta 700, archivo 600):
   ```
   STUDIO_WORKER_URL=https://<servicio>.up.railway.app
   WORKER_TOKEN=<el mismo valor que en Railway>
   ```
   Hermes trabaja dentro del repo con `--yolo`: en `studio/.env` podía leer el token desde el disco.
   Si el worker aún lo encuentra en `studio/.env`, lo usa pero avisa en el log. Otra carpeta:
   `HERMES_WORKER_ENV_DIR`.
3. Desde `sistema-final/`: `npm run hermes-worker` (usa `caffeinate` para que el Mac no se duerma).
   Mientras esté abierto, el formulario muestra "Hermes conectado".
4. Recomendado: dejarlo como **servicio de macOS** para no depender de una pestaña de terminal:
   `studio/worker/service.sh install` (arranca al iniciar sesión y se reinicia solo si se cae).
   Resto de órdenes: `status`, `logs`, `restart`, `uninstall`. Log: `~/Library/Logs/hermes-worker.log`.
   Solo corre un worker a la vez (candado `studio/worker/.worker.lock`): si hay otro abierto, el
   nuevo espera y toma el relevo cuando el primero se cierra.

Un trabajo a la vez. El worker lanza `hermes chat -q … -Q --yolo`: aprueba solo los comandos (no hay
nadie para confirmarlos), así que Hermes actúa en el Mac igual que en una sesión normal pero sin
pedir permiso. Por eso recibe un entorno **sin** las claves del `.env` del repo ni el `WORKER_TOKEN`,
las credenciales del worker viven fuera del repo y el encargo le prohíbe leer archivos de
credenciales (una web con instrucciones ocultas no debe poder llevárselas). Es una mitigación, no un
aislamiento: Hermes corre con el mismo usuario del Mac. Aislarlo del todo exige otro usuario de macOS
o el backend Docker de Hermes (pendiente, cambia cómo trabaja Hermes). Solo el equipo debe tener la
contraseña.

Robustez: si Hermes termina sin entregar, el worker retoma la sesión con "continúa" (hasta 3 veces);
si el worker se cierra, al volver a arrancar marca como fallido lo que dejó a medias; si el Mac se
apaga o duerme, Studio lo da por perdido tras 10 min sin señales. Cerrar la tapa del Mac lo duerme
aunque `caffeinate` esté activo. Si la subida final falla, el error indica dónde está el HTML en el Mac.

Ajuste recomendado en `~/.hermes/config.yaml` (agent): `intent_ack_continuation: true` — evita que
DeepSeek cierre el turno tras anunciar "Let me..." sin ejecutar nada.

**Instrucción rápida:** en vez de pegar el prompt se puede escribir una frase ("quiero una
newsletter de Adeslas…"). Hermes escribe antes el brief con la skill `newsletter-creative-brief`
(instalada en `~/.hermes/skills/creative/`, destino fijado en HTML standalone) y luego hace la
newsletter con él; el brief queda visible en la página del trabajo.

**Cancelar y pedir cambios** (2026-09-28): un trabajo en cola o en curso se puede cancelar desde su
página (en curso, el worker lo ve en su siguiente aviso de progreso —cada 30 s—, detiene a Hermes y no
sube nada). En una newsletter terminada, "Pedir cambios" crea un trabajo nuevo en el que Hermes, en una
sesión nueva, retoca esa pieza según lo pedido partiendo de su HTML publicado, su `notas.md` y el brief
original (`buildRevisionPrompt`); pasa el control de calidad completo. La versión original no cambia.
"Adaptar a móvil" sigue siendo un retoque solo de la versión móvil.
En la caja de cambios, "Señalar en la vista previa" deja hacer clic sobre la pieza y añade una
referencia exacta a la petición («[Señalado: imagen nº 5 de 7 del HTML, alt «…»]», botón con su
destino, titular o párrafo citado). El marco sigue sin ejecutar scripts: Studio escucha los clics desde
fuera y no deja que abran el enlace. Qué se señala y cómo se describe está en `studio/web/pick.js`
(con tests); `buildRevisionPrompt` explica a Hermes el formato solo si la petición trae referencias.
Debajo, atajos con las peticiones más frecuentes (cambiar titular, acortar textos, otra foto, recortar
el blanco, más aire, CTA más visible).

**En la página del trabajo** (2026-09-28): asunto (el `<title>` del HTML) y preheader con botón de
copiar, "Copiar HTML" para pegarlo en la plataforma de envío, posición en la cola con el inicio
estimado, el progreso en el título de la pestaña y "Avisarme cuando termine" (notificación del
navegador, con la pestaña abierta). "Cómo se ve en la bandeja de entrada" simula la fila de Gmail en
móvil y escritorio: el corte del asunto y el preheader se calcula midiendo el texto a los anchos de
Gmail (no al de la página) y dice cuántos caracteres se leen. Los avisos y errores salen dentro de la página, sin ventanas
emergentes del navegador.

**Versiones** (2026-09-28): cada "Pedir cambios" o "Adaptar a móvil" es una versión de la newsletter
de la que sale. La página del trabajo lista todas las versiones y enlaza con la anterior; en una
versión derivada, "Qué ha cambiado" compara texto, enlaces e imágenes con la anterior
(`studio/web/compare.js`, con tests) y "Antes y después" muestra las dos vistas previas lado a lado.
"Resaltar cambios" marca sobre la propia pieza lo añadido (verde) y, en "Antes y después", lo quitado en
la versión anterior (rojo).

**Editar texto** (2026-09-28): en una newsletter terminada, la vista previa se vuelve editable y el
asunto y el preheader salen como campos. Al guardar se crea una versión nueva al momento, sin Hermes
(`textEditOf`), que pasa la revisión automática (comprobaciones sin red de nuevo; enlaces, imágenes y
móvil heredados). El navegador manda solo los trozos de texto que cambiaron, con su sitio (ruta de
elementos desde `<body>` y hueco entre hijos; `studio/web/textedit.js`), y el servidor los aplica sobre
el HTML publicado sin tocar nada más (`studio/server/textEdit.ts`, con parse5 y sus posiciones en el
código; tests de ida y vuelta con la pieza real de Nike en `studio/server/fixtures/`). También cambia la
copia del texto de los botones para Outlook (VML dentro de `<!--[if mso]>`). Escribir y borrar dentro
de un texto lo hace Studio, no el navegador (Chrome saca del enlace lo escrito al final de un botón y
fusiona bloques al borrar); las selecciones se recortan a un solo trozo de texto; Enter, negrita y
pegar HTML no hacen nada. Si aun así cambia la estructura, no se guarda y se dice dónde.

**Duraciones reales** (2026-09-28): cada trabajo guarda cuándo lo recogió Hermes y cuándo terminó
(`startedAt`/`finishedAt`). Lo que suele tardar cada tipo (instrucción, prompt completo, cambios,
adaptación a móvil) es la mediana de los últimos 10 terminados (`typicalDurations`, mínimo 2; si no,
los valores de antes). Se usa en la cola, en el porcentaje de cambios y adaptaciones (el worker recibe
`expectedSec`), en el formulario ("Suele tardar ~9 min…"), en "Pedir cambios" y en el historial
("tardó 12 min").

**Ver en la pieza** (2026-09-28): cada aviso de la revisión automática que apunta a un sitio concreto
(enlace roto, imagen, claim, imagen sin alt o sin width, flex, desborde en móvil) y cada línea de "Qué ha
cambiado" llevan un botón "Ver" que baja hasta ese elemento en la vista previa y lo hace parpadear. El
desborde se busca midiendo la pieza con la vista en móvil. Qué detalle lleva a qué elemento está en
`studio/web/locate.js` (con tests); los avisos generales (modo oscuro, peso, preheader) no llevan botón.
El historial muestra una fila por newsletter con la versión más reciente (la más reciente que cumple
el filtro, si hay uno) y las demás plegadas en "Ver las otras N versiones".

**Vista previa** (2026-09-28): se pinta desde el HTML descargado en un marco `sandbox="allow-same-origin"`
sin scripts, con la altura real de la pieza (sin scroll interno). Modos de color: Claro, Oscuro (como Apple
Mail: aplica los `@media (prefers-color-scheme: dark)` de la pieza; se fijan en el HTML de la vista previa
porque el marco sigue el modo del sistema de quien mira) e Invertido (aproximación a Gmail/Outlook en
móvil). Solo afecta a la vista previa: la descarga y "Copiar HTML" son la pieza tal cual.

**Miniaturas del historial** (2026-09-28): las genera el worker en el Mac (`studio/worker/thumbnail.ts`:
Chromium sin JavaScript a 800 px, parte de arriba 600×800 → JPEG 300×400 con `sharp`), no Railway, que va
justo de memoria. Las nuevas viajan con la newsletter; las anteriores las pide el worker cuando está libre
(`/api/worker/thumbs/pending`, de 3 en 3). Sin miniatura, la fila muestra las iniciales de la marca. La
cabecera dice con qué newsletter está Hermes (y enlaza con ella) y cuántas esperan; "Mis trabajos" filtra
por el nombre que recuerda el formulario.

**Formulario: borrador y aviso de instrucción vaga** (2026-09-28): lo escrito y sin enviar (tipo, marca,
instrucción e imágenes) se guarda en el navegador y se recupera al volver con el aviso "Borrador sin enviar
recuperado" y "Descartar"; se borra al enviar. Es distinto del autorrelleno del navegador, que sigue
desactivado (se coló sin avisar el 2026-09-24). Antes de enviar, `studio/web/formcheck.js` (con tests,
calibrado con las instrucciones reales) avisa si la instrucción no dice de qué va o para qué/para quién,
o si un "Prompt completo" es demasiado corto; "Enviar igualmente" la manda tal cual.

La página principal muestra el historial (hasta 200 trabajos, con buscador, filtros por marca y estado, y "Reutilizar" para rellenar el formulario con un trabajo anterior). El campo de marca (uno solo desde el 2026-09-28) sugiere
las del volumen de Railway y las del Mac del worker y dice debajo si lo escrito es una marca del
sistema (usa su carpeta de `brands/`) o una nueva. En "Instrucción rápida" hay ejemplos pulsables. Si el prompt no menciona la marca elegida, Studio pide
confirmación antes de encolarlo.

El pipeline de 9 fases descrito abajo sigue en el código (`runner.ts`) pero ya no se ofrece en
la interfaz y la API lo rechaza salvo con `PIPELINE_ENABLED=true`. Sin él, Railway ya no necesita
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY` ni las variables `LLM_*`.

## Cómo funciona (resumen)

El backend es dueño de la orquestación y del filesystem. Cada fase de IA se llama como una
función de generación de contenido sin estado (una llamada a la API de Anthropic con el prompt
del agente correspondiente `agents/0N-*.md` como *system prompt*, pidiendo la salida en un
formato de bloques de archivo) — el modelo nunca tiene una herramienta de escritura directa
sobre el repo. El backend parsea la respuesta y escribe los archivos él mismo, siempre dentro
de la campaña o del brand pack correspondiente (`campaignFs.writeGeneratedFiles` rechaza
cualquier ruta fuera de esos límites).

- Proveedor del modelo configurable (`server/llmClient.ts`): Anthropic por defecto, u OpenAI (o
  cualquier API compatible) con `LLM_PROVIDER=openai` — ver `studio/.env.example`. Los prompts de
  los agentes se escribieron con Claude: con otro modelo, QA y el production gate pueden rechazar
  más al principio.
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
   - `ANTHROPIC_API_KEY` (o `LLM_PROVIDER=openai` para usar solo OpenAI), `OPENAI_API_KEY`
   - `APP_ACCESS_PASSWORD` (contraseña compartida real para el equipo, no la dejes vacía aquí)
   - `STUDIO_PUBLIC_BASE_URL` — la URL pública que Railway te asigna (o tu dominio propio si
     conectas uno), siempre `https://...`
   - `PORT` — Railway asigna el suyo propio automáticamente y lo expone como `PORT`; el
     servicio ya lo lee de `process.env.PORT`, no hace falta fijarlo a mano.
   - `TRUST_PROXY_HOPS` — solo si pones el frontend en Vercel delante (ver sección siguiente):
     fíjala a `2`. Sin Vercel delante, no la definas (por defecto `1`).

5. **Desplegar**:
   ```bash
   railway up
   ```

## Frontend en Vercel (opcional, delante de Railway)

Vercel no puede alojar el backend: la cola en memoria, la escritura en `newsletters/`/`brands/`,
Playwright y la duración de un job completo necesitan un proceso persistente con disco (Railway
o Docker). Lo que sí puede servir Vercel es la interfaz estática (`studio/web/`), reenviando
`/api/*` y `/assets/*` al backend con los rewrites de `studio/web/vercel.json`. Para el navegador
todo es el mismo dominio, así que el frontend no cambia y el Basic Auth sigue funcionando (el
diálogo aparece en la primera llamada a `/api`).

1. Despliega antes el backend en Railway (sección anterior) y anota su URL pública.
2. Sustituye `<TU-URL-RAILWAY>` en `studio/web/vercel.json` por ese dominio (sin `https://`
   duplicado ni barra final).
3. En Railway, fija `TRUST_PROXY_HOPS=2` — con Vercel + Railway delante hay dos proxies; con el
   valor por defecto (1) el limitador de `server/rateLimit.ts` vería la IP de Vercel para todo el
   equipo y compartiríais un único cupo. Contrapartida: una llamada directa a la URL de Railway
   puede falsear un salto de `X-Forwarded-For` y esquivar el limitador por IP (la contraseña
   sigue siendo obligatoria).
4. Despliega solo la carpeta de la interfaz:
   ```bash
   cd studio/web && vercel --prod
   ```
   O, conectando el repo desde el dashboard de Vercel, fija **Root Directory = `studio/web`**,
   Framework Preset = *Other*, sin build command.

`STUDIO_PUBLIC_BASE_URL` puede apuntar a la URL de Railway o a la de Vercel (ambas sirven
`/assets`, público y solo imágenes desde 2026-09-24).

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
