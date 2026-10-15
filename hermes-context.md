# Contexto del proyecto Hermes (pipeline de newsletters) — memoria de la skill `hermes-pipeline`

> Este archivo es la memoria persistente de la skill `hermes-pipeline` entre sesiones de
> auditoría/mejora. **No sustituye a `context.md` ni a `memory.md`** (project-docs), que siguen
> siendo la fuente de verdad técnica y narrativa del proyecto, mantenida por las propias sesiones
> que operan el pipeline. Este archivo es el registro de auditorías externas y su seguimiento:
> qué se diagnosticó, qué se decidió arreglar, y qué sigue abierto — para que una futura sesión de
> esta skill no repita el mismo diagnóstico desde cero.

**Última actualización:** 2026-10-15 (corregidos los S0 H-04 marca equivocada y H-02 remitente sin identificar de la auditoría de Studio)

---

## Estado del roadmap (según `pipeline-skill/references/pipeline-architecture.md` + evidencia real del repo)

| Fase | Nombre | Estado | Notas |
|---|---|---|---|
| 0 | Fundamentos | Cerrada | Control files, schema 3 patrones, contrato de componentes — todo presente y en uso. |
| 1 | MVP (3 patrones) | Cerrada | Los 3 patrones (`saving`, `institutional`, `fotografia-primero`) están implementados y con campañas reales de prueba. |
| 2 | Consolidación (QA + Export + orquestación) | Cerrada con huecos reales | 08/09 existen y funcionan, pero 08 no implementa la distinción interno/producción que `AGENTS.md` exige (ver BUG-002), y la orquestación de devoluciones (tabla de `agents/00-*.md`) no se ha verificado contra un caso de fallo real reciente. |
| 3 | Escala / Optimización | En curso | F1-F4 de "flexibilidad estructural" (2026-07-28) cerradas; F3.1 (reutilización brand pack) y F3.3 (extensibilidad) parciales; F3.2 (paralelización) no iniciada. Fase F5 (patrones nuevos) pendiente, documentada pero no priorizada. |

**Dato más importante de todo el roadmap:** de las 27 campañas reales trackeadas en `newsletters/2026/`,
**ninguna tiene `productionReady: true`**. El sistema no ha cerrado nunca un ciclo real de
producción — todo lo anterior son campañas de prueba/exploración del motor.

---

## Decisiones tomadas en esta auditoría

- 2026-09-23 — Auditoría completa (agentes 00-09, motor `engine/`, infraestructura/`studio/`) vía
  3 subagentes en paralelo + verificación directa contra el código y campañas reales — motivo:
  petición explícita del usuario de exponer puntos débiles y mejoras. No se aplicó ningún cambio
  (solo diagnóstico); ver informe completo entregado al usuario en el chat de esa sesión.
- 2026-09-23 — Se decide crear este archivo (`hermes-context.md`) en vez de añadir directamente a
  `memory.md` del proyecto, para no mezclar la memoria operativa de las sesiones que ejecutan el
  pipeline con el registro de auditorías externas de esta skill — motivo: `memory.md` ya tiene una
  convención de changelog propia y muy activa; duplicar ahí sin que el usuario lo pida es más
  riesgo que beneficio.

---

## Asunciones abiertas

- ⚠️ Se asume que `studio/` (añadido en el último commit, `c1f30a8`) es una vía de producción real
  y no solo un prototipo — si en realidad es experimental, varios hallazgos (auth por defecto,
  `heroImage.ts` sin sanitizado) bajan de severidad. Confirmar con el usuario.
- ⚠️ Se asume que las 15 marcas sin `brand-tokens.json` (Amazon, Toyota, Zara, Samsung, MSF, BYD,
  Asics, El Corte Inglés, Feebbo, Fitness Park, Mazda, Myprotein, Supreme, Volkswagen, Acción
  contra el Hambre) son deliberadamente generadas fuera del pipeline gobernado (scripts ad-hoc) —
  si el usuario las considera parte de la producción real, el impacto de Hallazgo 1 (memory.md) es
  mayor de lo documentado.

---

## Bugs conocidos (hallados en esta auditoría, no presentes textualmente en `memory.md`)

| ID | Tipo | Descripción | Origen real | Estado |
|---|---|---|---|---|
| BUG-H01 | Motor (salida) | `escapeHtml()` en `engine/lib/assemble.js` no escapa comillas dobles; `{{data:...}}` se usa sin escape adicional dentro de atributos `href`/`src`/`alt` en ~15 componentes. Un valor de campaña con `"` rompe el atributo e inyecta HTML/atributos arbitrarios en `final.html`. | `engine/lib/assemble.js:297-303` | **Cerrado 2026-09-23** — `escapeHtml` escapa `"`; `httpsUrl`/`espResolvedUrl` anclados en el schema (sin comillas/ángulos/espacios); test de regresión añadido; validado contra las 27 campañas reales (sin regresiones nuevas) y `npm test` 56/56. |
| BUG-H02 | Agentes (handoff) | 02 entrega `02-analysis/visual-identity-report.md` pero 03 y 04 siguen instruyendo leer `visual-analysis.md` (nombre viejo). Confirmado fallando en campañas reales (`converse/2026-ago-converse-chuck70-industrial-glam`, `mercedes-amg/c63-se-performance`) — Gate 13 (bloqueante) falla en silencio. | `agents/02-brand-visual-analyst.md:267` vs `agents/03-*.md:16`, `agents/04-*.md:15` | **Cerrado 2026-09-23** — nombre sincronizado en `agents/03-*.md`, `agents/04-*.md`, `pipeline-skill/references/agent-roles.md`, `pipeline-skill/references/phase-gates.md`, `docs/campaign-lifecycle.md`, `docs/naming-conventions.md`, `docs/workflow.md` (7 archivos). Nota: las campañas converse/mercedes-amg ya creadas siguen sin los archivos Nivel 5 — este fix corrige la instrucción, no repuebla campañas existentes. |
| BUG-H03 | Motor (cobertura test) | `engine/lib/verify.js` (decide si se escribe `final.html`) no tiene ningún test dedicado — ni un caso de fallo real cubierto. | `engine/lib/verify.js` | Abierto |
| BUG-H04 | Motor (gate) | Gate 0 (`check-engine-integrity.ts`) no vigila `patterns/*.md` ni `scripts/*.ts` (incluido `production-gate-motor.ts` y los propios `check-*.ts`) — el mecanismo creado tras el incidente 2026-07-21 tiene un hueco sobre el mismo tipo de vector. | `scripts/check-engine-integrity.ts:25-37` | **Cerrado 2026-09-23** — `watchedFiles()` ahora incluye todo `patterns/*.md` y `scripts/*.ts` (67 archivos vigilados, antes ~41). Lock regenerado (`npm run check-engine -- --update`), verificado limpio. |
| BUG-H05 | Motor (gate) | Gate 9 (`check-contrast.ts`) y Gate 7 (`check-column-balance.ts`) no cubren los componentes añadidos 2026-07-24→2026-08-01 (`pasos-vertical`, `trust-bar-inline`, `category-grid*`, `lista-premium-2col`, `metric-strip-premium`) — el mismo bug real de UAX (columnas) puede repetirse sin detección. | `scripts/check-contrast.ts:108-202`, `scripts/check-column-balance.ts:97-99` | **Cerrado 2026-09-23** — Gate 7 generalizado con tabla `BALANCE_CHECKS` (cubre los 5 componentes, cada uno con su campo/reparto real de assemble.js); Gate 9 con 4 combos nuevos (`fgLiteral`, `surfaces.white`, `surfaces.sectionLila`/primary) + `usedIn` ampliado en 3 combos ya existentes. **Efecto secundario real, no un falso positivo**: contra las 27 campañas reales, Gate 7 ahora detecta 4 desequilibrios genuinos antes invisibles (apple/iphone-17-pro-premium, paraycompara/2026-jul-revision-verano, uax/2026-jul-uax-fp-online, tarifalo/2026-jul-tarifalo-compara-energia) — NO se tocó el copy de esas campañas (no es trabajo de esta sesión, pertenece a 05/06); queda como hallazgo nuevo para quien retome esas campañas. También se corrigió el propio `engine/schema/campaign-data.example.json` (trust-bar 2/4/2 palabras, ratio 2.0x) por ser fixture/ejemplo del repo, no contenido de cliente. 2 tests de regresión nuevos en `gates.smoke.test.js`. |
| BUG-H06 | Agentes (frontera QA) | `agents/08-qa-specialist.md` no implementa la distinción "prueba interna vs. producción" (`isTestCampaign`/`productionReady`) que `AGENTS.md:81-83` exige como contrato de sistema. | `agents/08-qa-specialist.md` (completo) | **Cerrado 2026-09-23** — nueva sección "Nivel de aprobación" en `agents/08-qa-specialist.md`: lee `metadata.isTestCampaign`/`productionReady` antes de emitir veredicto, exige calificar "Aprobado — prueba interna" vs "Aprobado — producción" en `final-checklist.md`, nunca "Aprobado" a secas. |
| BUG-H07 | Docs (desactualización) | `pipeline-skill/references/phase-gates.md`/`agent-roles.md` (sin tocar desde 2026-07-28) y `docs/qa-process.md` (menciona el rol "React Email Developer" ya archivado) pueden llevar a 00 o a una sesión nueva a verificar criterios obsoletos. | `pipeline-skill/references/phase-gates.md`, `docs/qa-process.md` | Parcialmente cerrado 2026-09-23 — el nombre `visual-identity-report.md` ya sincronizado (ver BUG-H02). `docs/qa-process.md` (legacy "React Email Developer", 40-checklist desalineado) sigue sin actualizar — no se tocó, es un documento entero por rehacer, fuera del alcance de "corto plazo". |
| BUG-H08 | Infra (studio) | `studio/server/heroImage.ts` no aplica `sanitizeLandingPrompt()` (el fix real del incidente BMW de moderación) — mismo vector de fallo puede reproducirse generando un hero vía Studio en vez de CLI. | `studio/server/heroImage.ts` vs `scripts/generate-hero-image.ts:468-510` | **Cerrado 2026-09-23** — función extraída a `scripts/lib/sanitize-hero-prompt.ts` (única fuente, ya no duplicada); `scripts/generate-hero-image.ts` la importa; `studio/server/phases/dataPhase.ts` sanea `input.briefText` antes de interpolarlo en el prompt del hero. 3 tests de regresión nuevos. Nota: Studio no tiene paso de visión sobre la landing real (el prompt sale del brief escrito a mano), así que el vector exacto de BMW no aplica 1:1, pero la misma clase de contenido problemático (personajes, matrículas, precios, URLs) sí puede colarse en un brief libre. |
| BUG-H09 | Infra (studio) | Studio arranca sin autenticación si `APP_ACCESS_PASSWORD` está vacía (solo `console.warn`); comparación de contraseña no timing-safe; sin rate limiting en `/api/jobs`. | `studio/server/index.ts:24-38` | **Cerrado 2026-09-23** — arrancar sin contraseña exige `ALLOW_NO_AUTH=true` explícito; comparación con `crypto.timingSafeEqual`; `studio/server/rateLimit.ts` nuevo (sin dependencia nueva, limitador en memoria por IP): 20 intentos de auth FALLIDOS/5min (solo cuenta fallos — probado que NO penaliza uso normal autenticado, un bug real de la primera versión detectado probando con curl antes de cerrarlo) y 5 jobs creados/10min. 4 tests de regresión (`rateLimit.test.js`) + verificación funcional con curl en los 3 escenarios (uso normal, fuerza bruta, creación de jobs). Efecto en el entorno real: `studio/.env` local (no trackeado, de la sesión concurrente) no tiene `ALLOW_NO_AUTH` — dejará de arrancar hasta que se añada esa línea o una contraseña real. |
| BUG-H10 | Dependencias | 7 vulnerabilidades npm sin resolver (`sharp` alta/libheif, `postcss` alta, `undici` alta, `qs` moderada), todas con fix disponible sin cambio de major. | `package.json` | **Cerrado 2026-09-23** — `npm audit fix` (sin `--force`, sin cambios de major). `npm audit` → 0 vulnerabilidades. |
| BUG-H11 | Escala (producción) | 15/32 carpetas de marca sin `brand-tokens.json`; de los 17-18 restantes, solo `converse` tenía `colors.source`/`typography.source`. Gate 8 (bloqueante) hace fallar `production-gate` para prácticamente todas las marcas reales. | `brands/*/` | **Parcialmente cerrado 2026-09-23** — 3 lotes con navegación real + `getComputedStyle`: lote 1 (Nike, BMW, Tarifalo), lote 2 (Audi, Para y Compara, Apple), lote 3 (Mercedes-AMG, New Balance, UAX — ver changelog "tercer lote"). **10 de 18 packs reales pasan Gate 8 limpio ahora** (apple, audi, bmw, converse, mercedes-amg, new-balance, nike, paraycompara, tarifalo, uax). Quedan 8: adeslas, adidas, aesop, feebboletter, optica2000, rolex, spotify, wornwear — deuda de contenido real del agente 02, no de código. **2 hallazgos no anticipados, no corregidos, declarados para 02**: (1) `paraycompara` diverge de forma significativa de la web real (probable rediseño no reflejado en el pack, afecta a 2 campañas reales); (2) `uax` usa realmente 'PT Sans' (Google Font embebible) pero el pack no lo declara como `webFont`, mismo patrón que el hallazgo de 'Alexandria' en paraycompara — dos indicios de que ningún pack real ha revisado su fuente `webFont` contra la fuente real desde que la sustitución de fuentes se implementó. |
| BUG-H12 | CI (cobertura) | `.github/workflows/ci.yml` solo corre `npm test` + `check-engine-integrity` — nunca ejecuta `production-gate-motor` de forma visible con una aserción explícita de qué debe pasar. | `.github/workflows/ci.yml` | **Cerrado 2026-09-23** — nuevo step de CI + `scripts/ci-example-campaign-gate.ts`: corre `production-gate-motor` en modo exploración contra `campaign-data.example.json` y falla si algún gate de CÓDIGO (schema/build/claims/column-balance/contrast/hero-decision/engine-integrity) deja de pasar; tolera explícitamente `brand-pack-completeness`/`structural-differentiation` (deuda de contenido conocida, ver BUG-H11). Nota de corrección: mi hallazgo original decía que CI "nunca ejecuta production-gate-motor" — impreciso, `npm test` ya lo ejercitaba indirectamente (`gates.smoke.test.js`); el hueco real era la falta de una aserción positiva de qué debe seguir pasando, que es lo que este step añade. |
| BUG-H13 | Infra (studio) | `/assets` (hero y logos generados por Studio, referenciados por URL absoluta `STUDIO_PUBLIC_BASE_URL/assets/...` en `campaign-data.json`) se sirve DESPUÉS del middleware de Basic Auth — un cliente de correo real recibe 401 y la newsletter llega sin imágenes. No depende de Vercel (pasa igual con Railway/Docker solos). | `studio/server/index.ts` (orden: auth → `express.static(BRANDS_DIR)` en `/assets`) | **Cerrado 2026-09-24** — `/assets` se sirve ANTES del auth, solo extensiones de imagen, sin dotfiles y con CSP sandbox (SVG). (Detectado 2026-09-24 al preparar el frontend en Vercel.) Opciones a decidir: servir `/assets` antes del auth (expone todo `brands/`, incluidos `.md`/tokens — habría que limitarlo a imágenes), o subir las imágenes a un hosting público/CDN en fase 06/09. |
| BUG-H14 | Seguridad (worker) | Hermes corre con `--yolo` y cwd=sistema-final: aunque `HERMES_ENV` quita los secretos de las variables de entorno, puede leer `studio/.env` (WORKER_TOKEN) y `.env` del repo desde disco. Una web con instrucciones ocultas puede llevárselos. | `studio/worker/hermes-worker.ts:31-35` + `.env` en el repo | **Mitigado 2026-09-28** — credenciales del worker en `~/.config/hermes-studio/.env` (700/600, fuera del repo; fallback a `studio/.env` con aviso), el worker ya no carga el `.env` de la raíz y el encargo prohíbe leer archivos de credenciales. Sigue abierto el aislamiento real (otro usuario de macOS o backend Docker de Hermes). |
| BUG-H15 | Calidad (salida standalone) | La ruta que se usa de verdad (Studio → Hermes) no pasa ningún gate determinista salvo el de móvil. Medido el 2026-09-28 sobre las 8 newsletters de Hermes: CTA de producto con 404 en las 3 versiones de Inglesina (`/products/base-darwin-360-isize`), 5/8 sin preheader, 0/8 con modo oscuro, 3/8 sin condicionales de Outlook; la regla de claims "potencia" salta en Adidas y Talaria (en Talaria es un dato técnico: la regla necesita contexto). | `studio/worker/hermes-worker.ts` (solo `mobileOverflow`), `studio/server/standalone.ts` (`checkEmailHtml`, solo avisos) | **Parcialmente cerrado 2026-09-28** — `studio/worker/qualityCheck.ts`: enlaces/imágenes (404/410/5xx/DNS = error; 403/429 = aviso), preheader, baja, alt, enlaces vacíos, peso Gmail → errores devueltos a Hermes (2 rondas); claims solo aviso. Detecta el 404 y el preheader reales de Inglesina. Preheader y enlaces verificados, obligatorios en el encargo. Modo oscuro y Outlook añadidos el 2026-09-28 (ver changelog). |
| BUG-H16 | Infra (entrega) | Las imágenes de las newsletters enviadas se sirven desde el dominio de Railway (`STUDIO_PUBLIC_BASE_URL`), en periodo de prueba (vence hacia el 2026-10-10). Si el servicio cae o cambia de dominio, los emails ya enviados se quedan sin imágenes. | `studio/server/standalone.ts` (`publishEmbeddedImages`) | **Resuelto por el usuario 2026-09-28** — sube las imágenes a su propio CDN antes de enviar. Studio sigue publicando en `/assets` de Railway (vista previa y descarga); si algún día se quiere automatizar, habría que reescribir las URLs al dominio del CDN. |
| BUG-H17 | UX (studio) | No se puede cancelar un trabajo en cola o en curso; la única iteración posible es "Adaptar a móvil"; los avisos de calidad y la autoauditoría (`notas.md`) solo aparecen en el registro plegado; errores con `alert`/`confirm` nativos; sin posición en la cola. | `studio/web/app.js`, `studio/server/index.ts` | **Parcialmente cerrado 2026-09-28** — panel de revisión (control de calidad + autoauditoría `notas.md`) en el resultado. Cancelar y pedir cambios cerrados el 2026-09-28 (ver changelog). Posición en cola y mensajes sin `alert` cerrados el 2026-09-28. |
| BUG-H18 | Tooling | `npx tsc --noEmit` falla con TS5107 (`moduleResolution=node10` obsoleto en TypeScript 6); el worker (833 líneas) no tiene ningún test. | `tsconfig.json:5`, `studio/worker/` | Abierto |

---

## Changelog

### 2026-09-23
- **Qué se hizo:** Auditoría completa del sistema (10 agentes, motor, infraestructura) a petición
  del usuario. Verificación empírica (no solo lectura) de los hallazgos más fuertes: ejecución de
  gates reales contra campañas reales, conteo de brand packs, revisión de `npm audit`, inspección
  de CI. Informe completo entregado en el chat de la sesión (puntos débiles + mejoras priorizadas).
  A continuación, el usuario pidió aplicar los 4 fixes críticos/baratos identificados: se
  implementaron BUG-H01 (escape de comillas + anclaje de `httpsUrl`/`espResolvedUrl`), BUG-H02
  (sincronizar `visual-identity-report.md` en 7 archivos), BUG-H04 (ampliar Gate 0 a
  `patterns/*.md` + `scripts/*.ts`) y BUG-H10 (`npm audit fix`). Verificado con `npm test` (56/56,
  incluye 1 test nuevo de regresión), `check-engine` limpio (67 archivos), y validación del schema
  contra las 27 campañas reales (los 2 fallos preexistentes —`hero-marca-*` pattern— confirmados
  no relacionados, ya fallaban antes del cambio).
- **Por qué:** el usuario quiere un sistema más sólido y con mejores resultados; no se había hecho
  antes una auditoría específicamente centrada en fronteras entre agentes + seguridad del motor +
  infraestructura en una sola pasada (las auditorías previas documentadas en `memory.md` fueron
  temáticas: flexibilidad estructural, procedencia de marca, etc.).
- **Aviso de seguridad detectado durante la implementación:** al hacer `git status` (regla ya
  establecida en `memory.md` antes de tocar el repo) se detectó una **sesión concurrente activa**
  con cambios sin commitear en `AGENTS.md`, `agents/00/02/08/09-*.md`, `memory.md`,
  `engine/CHANGELOG.md`, `production-gate-motor.ts`, `create-campaign.ts`, `gates.smoke.test.js`,
  y campañas/marcas nuevas sin trackear (Amazon, El Corte Inglés, Converse, Mini, Supreme,
  Volkswagen...). Ninguno de los 4 fixes de esta sesión toca esos archivos (verificado con `git
  diff --stat` acotado). No se hizo ningún `git add`/`commit` — se avisó al usuario en el chat.
- **Qué queda abierto (al cierre de "ya mismo"):** BUG-H03, H05, H06, H07, H08, H09, H11, H12.
  Ningún commit se ha hecho todavía sobre los 4 fixes cerrados — quedan en el working tree.

### 2026-09-23 (continuación — bloque "corto plazo")
- **Qué se hizo:** a petición del usuario ("continúa con el bloque de corto plazo"), se cerraron
  BUG-H05, H06, H08, H09 (parcial), H12; H07 quedó parcial. Detalle línea a línea en la tabla de
  "Bugs conocidos" arriba. Verificación en cada paso: `npm test` (61/61 al final, subiendo desde
  56 — 2 tests de Gate 7 + 3 de `sanitize-hero-prompt` nuevos), `npm run check-engine` limpio (68
  archivos, regenerado 3 veces según iban cambiando `scripts/*.ts`), `npm run
  ci:example-campaign-gate` verificado en los dos sentidos (falla si el motor está alterado —
  probado forzando un lock falso; pasa limpio con solo los 2 gates de contenido tolerados). Gate
  7 extendido se probó contra las 27 campañas reales, no solo contra fixtures.
- **Por qué:** cerrar primero lo crítico/barato y lo de impacto medio-alto de la auditoría, antes
  de tocar deuda de contenido (brand packs) que pertenece a otra fase del pipeline (agente 02).
- **Aviso de seguridad repetido:** se volvió a comprobar `git status` antes de cada tanda de
  cambios — la sesión concurrente seguía activa con los mismos archivos que al inicio, más
  `agents/08-qa-specialist.md` y `scripts/gates.smoke.test.js`, que esta sesión SÍ necesitaba
  tocar (BUG-H06 y los tests nuevos). Se leyó el contenido ACTUAL de esos 2 archivos antes de
  editar (no una versión en caché) y se verificó con `npm test` que el resultado combinado sigue
  siendo válido — no se ha perdido nada, pero es la señal más clara hasta ahora de que ambas
  sesiones deberían coordinarse. Sigue sin hacerse ningún `git commit`.
- **Qué queda abierto (al cierre del bloque "corto plazo"):** BUG-H03, H07 (parcial), H09
  (parcial), H11. Bloque "medio plazo" sin empezar. **Nuevo, no anticipado**: 4 campañas reales
  ahora fallan Gate 7 (ver detalle abajo). `studio/.env` local no tiene `ALLOW_NO_AUTH` —
  dejará de arrancar hasta que se añada esa línea o una contraseña real.

### 2026-09-23 (continuación — BUG-H03, BUG-H07, y 2 de 3 puntos del bloque medio-plazo)
- **Qué se hizo:** a petición del usuario ("vamos con BUG-H03 y BUG-H07 y con el bloque
  medio-plazo"), y tras confirmar con el usuario el alcance del punto más grande (repoblar 17
  brand packs → eligió "piloto con 2-3 marcas" en vez de las 17 o saltarlo):
  - **BUG-H03 cerrado**: `engine/lib/verify.test.js` nuevo, 16 tests — cubre los 5 checks reales
    (charset, placeholders sin resolver, paridad fuente/inline, balance de `<table>`, límite de
    90KB) más `tagBalance`/`countOccurrences` directamente. `npm test` pasó de 61→77.
  - **BUG-H07 cerrado**: `docs/qa-process.md` reescrito entero (fuente de verdad:
    `agents/08-qa-specialist.md`) — fuera "React Email Developer", el checklist fijo de 40 ítems
    inexistente, y añadida la distinción de 2 niveles de aprobación. `pipeline-skill/references/
    phase-gates.md` y `agent-roles.md` actualizados en su fila de fase 08 (brand-fidelity-qa.md
    como mandatory, nivel de aprobación).
  - **Medio plazo — catálogo de `fotografia-primero` ampliado**: añadidas `pasos|pasos-vertical`
    y `lista-premium|lista-premium-2col` a la zona libre (antes solo vivían en `saving.md`) —
    dan peso visual real sin gastar otra foto, la causa raíz exacta del diagnóstico de
    `memory.md` 2026-08-20. Nueva §8 en el patrón documentando cuándo elegir cada uno (regla
    anti-comodín: si nada aplica, no rellenar el slot). Gate 12 (`check-structural-
    differentiation.ts`) corregido: `PATTERN_DEFAULT_SEQUENCES` pasó de 1 comodín por patrón a
    una lista (fotografia-primero ahora tiene 2: la original con `intro-cta` y la nueva con el
    par editorial) — **se eliminó la rama que daba pase automático a `editorial-foto-texto*`**
    (exactamente lo contrario de lo que la evidencia real mostraba). Verificado contra
    `mercedes-amg/c63-se-performance` (coincide exacto con la comodín nueva, ahora exige
    justificación — la tiene, pasa por el motivo correcto en vez de un pase automático).
  - **Medio plazo — limpieza de raíz**: NO se movieron los ~124 archivos HTML/PNG sueltos —
    varios scripts ad-hoc en `brands/*/design-input/*.js` (tarifalo, paraycompara, feebbo) leen/
    escriben esos archivos por ruta absoluta hardcodeada; moverlos los habría roto en silencio
    sin beneficio real. Se añadió en su lugar `/*.html`/`/*.png`/`/*.jpg`/`/*.jpeg` (anclado a
    raíz) a `.gitignore` — la protección real (evita que un `git add -A` futuro commitee ~28MB).
    Los 6 docs históricos YA tenían banner ⚠️ OBSOLETO desde 2026-07-27 — el hallazgo original de
    la auditoría sobre esto era impreciso, verificado y corregido aquí.
  - **Medio plazo — piloto de brand packs (3 marcas: Nike, BMW, Tarifalo)**: navegación real con
    el navegador (`mcp__Claude_Browser__*`) + `getComputedStyle` contra las 3 webs reales.
    - **Nike** (`brands/nike/tokens/brand-tokens.json` v2.2.4→2.2.5): verificado contra
      `nike.com/.../pegasus-42-.../IB1873-401` (la URL de 2026-07-24 ya no existe, producto
      retirado de catálogo — se usó la URL real actual del mismo modelo). `ctaBackground`/
      `ctaText`/`text.secondary` coinciden byte a byte con lo ya documentado — tercera
      verificación independiente sin cambios de valor.
    - **BMW** (v2.3.2→2.3.3): verificado contra la misma URL que ya citaba `photography.source`
      (`bmw.es/.../bmw-x1.html`). `ctaBackground`/`ctaText`/`textBody` confirmados exactos.
    - **Tarifalo** (v2.2.6→2.2.7): verificado contra `tarifalo.com/`. `colors.primary`/
      `ctaBackground` confirmados exactos. **Hallazgo real, no corregido**: el CTA real de la web
      usa texto blanco sobre naranja, pero el pack documenta `ctaText:"#002035"` (navy oscuro).
      Verificado que el valor del pack SÍ es el que pasa WCAG (6.35:1) y el de la web NO (~2.76:1)
      — se interpreta como divergencia deliberada por accesibilidad en email, no un error, y se
      deja registrado en el changelog para que 02 lo confirme explícitamente, sin asumirlo.
    - Los 3 pasan Gate 8 (`check-brand-pack-completeness.ts --brand {marca}`) limpio ahora.
      Verificado contra campañas reales (`production-gate-motor.ts` en exploración): nike/2026-jul-
      nike-pegasus-42 y bmw/2026-jul-bmw-x1-descubre y tarifalo/2026-jul-tarifalo-compara-luz ya
      NO fallan `brand-pack-completeness` — solo quedan `brand-visual-report-completeness`
      (Nivel 5, fuera de alcance) y, según campaña, `structural-differentiation`/`parity`
      (deuda de contenido no relacionada con este piloto).
    - **14-15 brand packs reales siguen sin `.source`** (todos menos converse/nike/bmw/tarifalo) —
      deuda de contenido que queda fuera del piloto, ver BUG-H11.
- **Por qué:** el usuario quiso seguir bajando la lista de hallazgos por prioridad; se le
  preguntó explícitamente por el punto de mayor escala (17 marcas reales) antes de comprometerse
  a un alcance concreto, dado que implica navegación real de sitios externos.
- **Verificación:** `npm test` 77/77 en cada paso, `check-engine` limpio (68 archivos, regenerado
  tras cada cambio de `scripts/*.ts`/`patterns/*.md`), `ci:example-campaign-gate` sigue en verde
  (solo los 2 gates de contenido tolerados). Gate 12 verificado contra campañas reales (Audi/BMW
  brand-native: no coinciden con la comodín de 6 módulos porque además llevan
  `metric-strip-premium` — la colisión exacta entre ambas la sigue cazando el check 8 de
  comparación cruzada, no un hueco nuevo).
- **Qué queda abierto:** BUG-H09 (rate limiting), BUG-H11 (14-15 brand packs reales sin
  `.source`, fuera del piloto). **Nuevo, no anticipado**: 4 campañas reales (apple/iphone-17-pro-
  premium, paraycompara/2026-jul-revision-verano, uax/2026-jul-uax-fp-online, tarifalo/2026-jul-
  tarifalo-compara-energia) fallan Gate 7 por desequilibrios reales en trust-bar/pasos/metric-
  strip-premium/category-grid — ninguna tiene `productionReady:true`, no bloquea nada hoy, pero
  quien las retome para producción real necesitará ajustar ese copy (agente 05/06, no 07).

### 2026-09-23 (continuación — BUG-H09 y segundo lote de BUG-H11)
- **Qué se hizo:** a petición del usuario ("vamos con BUG-H09 y con BUG-H11"):
  - **BUG-H09 cerrado**: `studio/server/rateLimit.ts` nuevo — limitador en memoria por IP, sin
    dependencia nueva (`express-rate-limit` no estaba instalado; coherente con el resto del
    proyecto, que evita dependencias de terceros cuando una implementación propia simple basta).
    20 intentos de auth FALLIDOS/5min y 5 jobs creados/10min. **Bug real detectado probando antes
    de dar por cerrado**: la primera versión contaba TAMBIÉN los aciertos, así que uso normal
    autenticado (ej. varios GET seguidos del panel) habría agotado el cupo sin que nadie fallara
    una contraseña — corregido para que el límite de auth solo consuma cupo en la rama que falla
    (`recordFailure`), verificado con 3 pruebas funcionales por curl (25 GETs correctos → 0
    bloqueos; 22 fallos → bloquea desde el 21; 7 creaciones de job → bloquea desde la 6ª) más 4
    tests de regresión (`rateLimit.test.js`). `app.set('trust proxy', 1)` añadido — sin esto,
    `req.ip` da la IP del proxy de Railway para todos, no la del cliente real.
  - **BUG-H11 — segundo lote (Audi, Para y Compara, Apple)**: mismo proceso de navegación real +
    `getComputedStyle` que el lote 1.
    - **Audi** (v2.2.2→2.2.3): `colors.deep`/`darkBg` (#101319) y la fuente AudiType confirmados
      exactos. Aviso menor: los botones píldora reales usan #181D25, no #000000 puro como
      `ctaBackground` — diferencia sin impacto de contraste, no corregida (no se pudo confirmar
      si ese botón concreto es el CTA canónico), declarada para 02.
    - **Para y Compara** (v2.2.7→2.2.8): **hallazgo significativo, no un simple redondeo** — el
      gradiente real del hero (#792771→#E85248) y el CTA real (#F85842) divergen notablemente de
      `colors.primary`/`deep`/`ctaBackground` documentados, y la fuente real ('Alexandria', un
      Google Font embebible) es distinta del sustituto 'Sora' ya usado. Hipótesis: el sitio se
      rediseñó desde la última vez que se analizó este pack (nunca tuvo `photography.source`,
      a diferencia de nike/bmw/audi). **NO se corrigieron los valores** — cambiar
      `colors.primary`/`deep` es una decisión de diseño con impacto real en 2 campañas existentes
      (2026-jul-comparar-tv, 2026-jul-revision-verano), no una simple adición de procedencia;
      queda declarado en el pack para que 02 haga un re-análisis completo.
    - **Apple** (v2.2.0→2.2.1): `ctaBackground` (#0071E3) y `colors.primary` (#1D1D1F)
      confirmados EXACTOS contra apple.com/es/iphone/. Gate 8 seguía fallando por un hueco
      preexistente y no relacionado (`voice.rhythm.mode/formality/punctuationHabits/source`,
      sin declarar en `_changelog`) — se declaró el hueco (sin fabricar los valores, que
      requieren analizar tono de copy real, fuera de alcance de este piloto) para que 02 lo
      resuelva de verdad en su próxima pasada.
  - **7 de 18 brand packs reales pasan Gate 8 limpio ahora**: apple, audi, bmw, converse
    (ya lo tenía), nike, paraycompara, tarifalo.
- **Por qué:** continuación directa de la priorización ya acordada; BUG-H09 era una tarea de
  código acotada y BUG-H11 seguía el mismo proceso ya validado en el lote anterior.
- **Verificación:** `npm test` 81/81 (77→81, +4 tests de `rateLimit.test.js`). `check-engine`
  limpio. `git status` revisado antes y después — sin colisión con la sesión concurrente (no se
  tocó ningún archivo de su lista) y sin efectos secundarios en `build-manifest.json` esta vez
  (no se corrió `production-gate-motor` contra campañas reales en este bloque, solo
  `check-brand-pack-completeness.ts`, que es de solo lectura).
- **Qué queda abierto (al cierre de este bloque):** 11 brand packs reales sin `.source`.

### 2026-09-23 (tercer lote de BUG-H11: Mercedes-AMG, New Balance, UAX)
- **Qué se hizo:** a petición del usuario ("vamos con BUG-H11"), tercer lote con el mismo
  proceso de navegación real + `getComputedStyle`:
  - **Mercedes-AMG** (v2.2.0→2.2.1): `ctaBackground` (#B21E23) y `colors.primary/deep`
    (#000000) confirmados EXACTOS contra mercedes-amg.com/en/gt-4-door-coupe. Cero cambios.
  - **New Balance** (v2.2.0→2.2.1): `ctaBackground` (#151415, botón "Add to bag" real) y
    `colors.primary` (#CF0A2C) confirmados EXACTOS. Cero cambios.
  - **UAX** (v2.2.4→2.2.5): `ctaBackground`/`light` (#0060AB) confirmado EXACTO. **Hallazgo**:
    la fuente real es 'PT Sans' (Google Font embebible), pero `typography.webFont` no la
    declara — mismo patrón que el hallazgo de 'Alexandria' en paraycompara del lote anterior.
    No se cambia `typography.webFont` aquí (requiere confirmar pesos/licencia/embeber, trabajo
    de 02), solo se deja anotado.
  - **10 de 18 brand packs reales pasan Gate 8 limpio ahora.**
- **Por qué:** continuación directa de la priorización ya acordada, mismo proceso validado en
  los 2 lotes anteriores.
- **Verificación:** `npm test` 81/81 (sin cambio de conteo — este lote no tocó tests). `git
  status` revisado: solo los 3 `brand-tokens.json` de este lote modificados, sin colisión con
  la sesión concurrente, sin efectos secundarios en `build-manifest.json` (no se corrió
  `production-gate-motor` contra campañas reales, solo `check-brand-pack-completeness.ts`).
- **Qué queda abierto:** 8 brand packs reales sin `.source` (adeslas, adidas, aesop,
  feebboletter, optica2000, rolex, spotify, wornwear). Los 2 hallazgos de fuente real no
  declarada (paraycompara/Alexandria, uax/PT Sans) sugieren que vale la pena que 02 revise
  `typography.webFont` en su próxima pasada por CUALQUIER marca, no solo estas dos — patrón
  repetido, no una coincidencia aislada.

### 2026-09-24 — Hermes Studio: frontend en Vercel (opción híbrida)

- **Decisión:** el usuario quería alojar Studio en Vercel. Descartado portarlo entero (cola en
  memoria, escritura en `newsletters/`/`brands/`, Playwright y jobs de minutos son incompatibles
  con funciones serverless; portarlo exigiría BD + Blob + Queues/Sandbox y sacar los brand packs
  del repo, contra la arquitectura de archivos-como-fuente-de-verdad). Elegida la **opción A**:
  interfaz estática (`studio/web/`) en Vercel con rewrites de `/api/*` y `/assets/*` al backend en
  Railway (que sigue siendo el que ejecuta el pipeline). Sin efecto sobre agentes 00-09 ni motor.
- **Cambios:**
  - `studio/web/vercel.json` nuevo — rewrites; destino con marcador `<TU-URL-RAILWAY>` hasta que
    exista el deploy de Railway (el CLI de Railway no tenía sesión iniciada; Vercel sí, `javifeebbo`).
  - `studio/server/index.ts` — `trust proxy` configurable vía `TRUST_PROXY_HOPS` (por defecto 1,
    comportamiento idéntico). Con Vercel delante hay 2 proxies: sin esto el limitador de BUG-H09
    vería la IP de Vercel para todo el equipo (cupo compartido / bloqueo colectivo). Contrapartida
    documentada: llamada directa a Railway puede falsear un salto de X-Forwarded-For.
  - `studio/README.md` — sección "Frontend en Vercel" + variable `TRUST_PROXY_HOPS`.
- **Verificación:** `rateLimit.test.js` 4/4; servidor arranca con `TRUST_PROXY_HOPS=2` y
  `/api/brands` responde 200.
- **Abierto:** BUG-H13 (`/assets` detrás del Basic Auth). Pendiente: desplegar backend en Railway,
  rellenar la URL en `vercel.json`, fijar `TRUST_PROXY_HOPS=2` en Railway y `vercel --prod` desde
  `studio/web`.
- **Despliegue real (misma fecha):** el backend ya existía en Railway (proyecto `striking-luck`,
  servicio `hermes-studio`, desplegado 2026-09-09 desde GitHub `Javifeebbo/hermes-studio` rama
  `main`, commit `c1f30a8` — ANTERIOR a la auditoría `5e52ac9`) y estaba **abierto sin contraseña**
  (solo tenía `ANTHROPIC_API_KEY`; `/api/jobs` devolvía 200 con los briefs). El usuario añadió
  `APP_ACCESS_PASSWORD`, `OPENAI_API_KEY`, `STUDIO_PUBLIC_BASE_URL`
  (`https://hermes-studio-production-761e.up.railway.app`) y `TRUST_PROXY_HOPS=2`; tras el
  redeploy `/api/*` responde 401. Frontend publicado en Vercel (proyecto
  `javifeebbos-projects/hermes-studio`, root `studio/web`): `https://hermes-studio-beta.vercel.app`
  — `/` 200, `/api/*` 401 con `WWW-Authenticate` reenviado desde Railway.
- **Pendiente:** Railway sigue corriendo `c1f30a8` (sin el limitador de BUG-H09 ni
  `TRUST_PROXY_HOPS`); hay que llevar `5e52ac9` + cambios de hoy a `Javifeebbo/hermes-studio`.
  Railway está en periodo de prueba (16 días / 4,03 $ a 2026-09-24).

### 2026-09-24 (continuación) — Studio: proveedor de modelo configurable (OpenAI)

- **Motivo:** la cuenta de Anthropic de la clave de Railway se quedó sin saldo (primer job real
  desde Vercel falló en la fase 01 con `credit balance is too low`). El usuario quiere la opción
  más barata sin la API de Anthropic y eligió OpenAI (clave ya configurada en Railway).
- **Cambio:** `studio/server/anthropicClient.ts` → `studio/server/llmClient.ts`. `callAgent()`
  elige proveedor por `LLM_PROVIDER` (`openai` = chat completions por fetch, sin dependencia
  nueva; sin definir = Anthropic, comportamiento original). Modelo por defecto OpenAI:
  `gpt-5.4-mini` (verificado disponible en `/v1/models`). Margen de 8000 tokens extra para
  razonamiento y error explícito si `finish_reason=length`. Probado en local con texto + imagen.
- **Riesgo abierto:** los prompts de `agents/0N-*.md` se ajustaron con Claude; falta validar con
  jobs reales que gpt-5.4-mini respeta el formato de bloques de archivo y pasa QA/gate. No toca
  agentes ni motor.

- **Primer job real con gpt-5.4-mini:** fases 01-07 OK (incluido schema de `campaign-data.json`
  y build del motor). Falló en 08: "no devolvió el veredicto machine-readable". Causa: el
  contrato de salida (`buildOutputContract`) dice "EXCLUSIVAMENTE los archivos pedidos" y
  `__verdict__.json` no estaba en esa lista — Claude lo añadía igual, GPT obedece literal.
  Fix en `studio/server/phases/qaExportPhase.ts`: el veredicto entra en la lista del contrato;
  `extractVerdict()` acepta "Aprobado — prueba interna/producción" (formato real que exige
  `agents/08-qa-specialist.md`, antes se habría rechazado como "no reconocido"), tolera fences
  ```json, y si falta el bloque JSON cae al `Veredicto:` explícito de `final-checklist.md` (si
  tampoco existe, falla igual que antes). 6 casos probados.
- **Segundo job con gpt-5.4-mini:** falló en 06 — `/modules/1` (`columns-3-beneficios`) con
  `highlightNote: ""` (campo obligatorio vacío). El error mostrado eran cientos de líneas porque
  ajv lista los fallos de las ~20 ramas del `oneOf` de módulos. Fix en
  `studio/server/phases/dataPhase.ts`: (1) `buildValidator()` re-valida cada módulo inválido
  solo contra la rama de su componente → 1 línea concreta por fallo; (2) hasta 2 rondas de
  corrección devolviendo al modelo su JSON + errores; (3) se valida ANTES de generar el hero
  (URL provisional en el placeholder, nunca escrita a disco) para no pagar la imagen de un JSON
  que luego se descarta. Probado con un `campaign-data.json` real de Adeslas + 5 mutaciones.
  Observación: la fase 06 NO es determinista con este modelo (el job anterior pasó 06 a la
  primera) — la ronda de corrección es la defensa, no un parche puntual.
- **Tercer job:** 06 pasó (schema OK) pero 07 bloqueó: patrón `institutional` exige `header-logo`
  como ancla en la posición 1 y el modelo abrió con `hero-centrado`. El schema no comprueba la
  gramática de patrón, solo el motor. Fix: el validador de la fase 06 llama también a
  `loadPattern`/`validateModulesAgainstPattern` de `engine/lib/pattern.js` (reutilizado, motor
  sin tocar), así los fallos de orden entran en la ronda de corrección de la 06. Reproduce el
  mensaje exacto del job fallido; el `campaign-data.json` real de Adeslas sigue pasando limpio.
- **Cambio de modelo:** a petición del usuario, `LLM_MODEL=gpt-5.5` en Railway (antes
  `gpt-5.4-mini` por defecto) tras 3 jobs fallidos por reglas de los agentes mal seguidas.
  Probado en local (texto + imagen + `reasoning_effort=low`). Más caro por newsletter.
- **Cuarto job (gpt-5.5):** bloqueado en 01 por "preguntas bloqueantes" — probablemente legítimo
  (agente 01 bloquea si falta CTA/enlace principal o restricciones legales; Adeslas = seguros).
  Dos fallos de Studio detectados: (1) la UI solo decía "revisa `00-brief/open-questions.md`",
  archivo dentro del volumen de Railway al que el compañero no tiene acceso; (2) la detección era
  `/bloqueante/i` sobre todo el archivo — "No hay preguntas bloqueantes" o "no bloqueante"
  también bloqueaban. Fix en `studio/server/runner.ts`: `blockingQuestionLines()` ignora
  negaciones y el motivo del bloqueo muestra las preguntas en la UI. Probado con el
  `open-questions.md` real de Audi (3 bloqueantes detectadas) + casos negados.
- **Quinto job (gpt-5.5):** con las preguntas ya visibles, el bloqueo resultó ser un FALSO
  POSITIVO: la única línea detectada era "Criticidad: no crítica para fase 01; bloqueante para
  decisiones visuales del agente 02 si no se puede comprobar". La heurística por palabras no
  es fiable. Fix: la fase 01 devuelve un bloque `__blocking__.json` (mismo patrón que el
  veredicto de QA) con SOLO las preguntas que cumplen la sección "Bloquea si" de
  `agents/01-briefing-strategist.md` para esta fase; `textPhase.ts` admite un `extraOutput`
  por spec (entra en el contrato, no se escribe a disco). Sin bloque válido → heurística, que
  ahora también ignora "no crítica". Agente 01 sin tocar.

### 2026-09-24 (continuación) — Studio pasa a modo standalone

- **Decisión del usuario:** tras 5 jobs del pipeline de 9 fases fallando por reglas mal seguidas
  (con gpt-5.4-mini y gpt-5.5), Studio usa el flujo que al usuario le funciona con Hermes: pegar
  el prompt de `newsletter-creative-brief` y obtener un HTML standalone. Con búsqueda web; las
  imágenes se eligen por trabajo (assets oficiales o IA); la interfaz solo ofrece standalone
  (el pipeline sigue en el código).
- **Nota:** el commit `cb99489` (bloqueos de fase 01) se hizo y desplegó aunque el usuario
  interrumpió esa llamada — la interrupción llegó cuando el comando ya había terminado.
- **Implementación:** `studio/server/standalone.ts` (nuevo), `callResearchAgent()` en
  `llmClient.ts` (Responses API + `web_search` + background con polling, timeout 30 min),
  `runner.ts` despacha por `input.mode`, `store.ts` (`mode`, `imageMode`), `index.ts` (rama
  standalone en `POST /api/jobs`, validación de slug de marca — antes `existingBrand` llegaba a
  rutas de disco sin validar —, `/assets` público solo imágenes = cierra BUG-H13, resultado con
  CSP sandbox + `?download=1`), `studio/web/` (formulario nuevo).
- **Prueba real en local** (Adeslas, assets oficiales, gpt-5.5, esfuerzo medium): completado a
  la primera, 7 búsquedas web, 19,7 KB, logo y foto oficiales, datos con fuente (Plena Total,
  Promoción Salud 2026 y sus bases legales), footer legal de seguros. Fallo visto y corregido en
  instrucciones: el "Concepto: ..." salía como antetítulo visible. **No probado aún:** modo IA
  (generación de imágenes) y en Railway.
- **Ojo en Railway:** el volumen se sembró el 2026-09-09 con los `brands/` de entonces; imágenes
  añadidas después en local y sin trackear (p. ej. `brands/adeslas/design-input/`) pueden no
  estar allí — el log del job dice cuántas imágenes oficiales encontró.

- **Imágenes de marca en Railway:** el logo de Adeslas daba 404 en Railway por dos causas:
  (1) 211 archivos de `brands/` (44 MB) nunca se habían subido a git; (2) `docker-entrypoint.sh`
  solo sembraba `brands/`/`newsletters/` en el volumen la PRIMERA vez, así que nada posterior al
  2026-09-09 llegaba a Railway (ni siquiera lo trackeado, como los brand packs repoblados en la
  auditoría). Fix: el entrypoint copia en cada arranque los archivos que falten (`cp -rn`, sin
  sobrescribir lo del volumen). Subidas SOLO las imágenes de marca (104 archivos, 14 MB):
  fuera scripts `.js` sueltos, HTML de captura, capturas de pantalla y 3 imágenes de Fitness
  Park de 3,7-6,4 MB (inservibles en email; Studio ignora > 2,5 MB).

### 2026-09-24 (tarde) — Studio ejecuta Hermes de verdad (worker en el Mac)

- **Feedback del usuario:** las newsletters del modo standalone de una sola llamada (gpt-5.5 +
  web_search) salían "muy genéricas, de sistema primitivo". Sospecha correcta: no era Hermes.
- **Diagnóstico con datos** (`hermes sessions export` de sus sesiones reales del 23-09 —
  MyProtein, Ray-Ban Meta, Alfa Romeo, iPhone 18 Pro, LG): Hermes usa DeepSeek v4 Flash vía Nous
  y hace **~40-100 acciones por newsletter** (browser_navigate, web_extract, vision_analyze sobre
  capturas, terminal para renderizar, write_file + patch iterando), 1-2 h, **0,03-0,27 $** cada
  una. La calidad sale del bucle de agente, no del modelo.
- **Decisión del usuario:** Hermes corre en su Mac; se retira la llamada directa a gpt-5.5.
- **Implementación:** `studio/worker/hermes-worker.ts` (nuevo; `npm run hermes-worker`, con
  `caffeinate`) reclama trabajos, lanza `hermes -z` con cwd=sistema-final, incrusta en base64 las
  imágenes locales y sube el HTML. Servidor: rutas `/api/worker/{claim,jobs/:id/progress,
  complete,fail}` con `WORKER_TOKEN` (Bearer, timing-safe, antes del Basic Auth), `/api/status`
  (Hermes conectado si hubo contacto < 2 min), trabajos colgados > 4 h → fallidos.
  `standalone.ts` reescrito: compone el encargo (prompt pegado + reglas de entrega: ruta de
  salida, modo de imágenes, sin preguntas) y publica las imágenes `data:` en `/assets`.
  `callResearchAgent` eliminado; `queue.recoverOnStartup` ignora trabajos standalone.
- **Probado en local con Hermes real** (encargo mínimo de integración): cola → worker → `hermes -z`
  → HTML en la ruta pedida → subida → imagen publicada (200) → resultado con CSP sandbox. OK.

- **Barra de progreso (mismo día):** el usuario aclara que Hermes tarda normalmente 15-20 min (el
  "1-2 h" salía de duraciones de sesión que incluyen tiempo ocioso — corregido en la UI). El
  worker lee cada 30 s la sesión de Hermes (`hermes sessions list/export`; la sesión es la
  primera creada tras lanzar `hermes -z`) y deduce la fase: preparando → investigando (web/
  navegador) → escribiendo (primer write/patch de un `.html`; antes Hermes escribe scripts de
  apoyo que no cuentan) → revisando (vision tras el HTML). % = fase + tiempo frente a la mediana
  de las últimas duraciones reales (`studio/worker/.hermes-durations.json`, 20 min por defecto).
  Calibrado con 3 sesiones reales del 23-09. Servidor guarda `job.progress`; UI con barra, fase,
  acción actual y minutos restantes estimados.
- **Primer trabajo real vía worker (Prozis, 12:07-12:19) falló sin HTML:** `web_extract` de la
  página de cupones devolvió el aviso de redirección geográfica ("Go to Prozis USA"), el modelo
  tardó 11 min en contestar y respondió "reintento la extracción" SIN llamar a ninguna herramienta
  — en modo no interactivo eso cierra el turno. (Además el usuario había dejado seleccionada la
  marca Adeslas con un prompt de Prozis; se canceló y reenvió.)
- **Fixes en el worker:** `hermes -z` → `hermes chat -q … -Q --yolo` (imprime `session_id` y
  admite `--resume`); si Hermes termina sin HTML se retoma la sesión con "continúa" hasta 3 veces
  (probado: funcionó); aviso en la barra si la sesión lleva > 10 min sin actividad; ruta de
  salida corta (`{fecha}-{6 chars del id}`) y búsqueda tolerante porque DeepSeek escribió
  "integradon" por "integracion" al copiar la ruta larga. Hermes, además, deja scripts auxiliares
  en el repo (p. ej. `scripts/generate-*.js`): limpiados los de las pruebas.
- **Segundo intento de Prozis (12:36) atascado en "Preparando":** causa real en la SKILL de
  Hermes, no en Studio. `~/.hermes/skills/creative/newsletter-pipeline/SKILL.md` y
  `references/standalone-creative-newsletter-brief.md` han crecido a ~98 KB cada uno; por
  `skill_view` llegan como una sola línea JSON de 100 KB que Hermes guarda en un temporal y no
  puede leer por tramos (read_file devuelve siempre la línea recortada) → bucle de 4 skill_view +
  3 read_file y después > 7 min esperando al modelo con contexto enorme. Fix en el worker: el
  encargo añade una "nota de entorno" que manda leer del disco con read_file por tramos los .md de
  skills de newsletter > 40 KB. **Pendiente (decisión del usuario):** adelgazar esas dos skills
  (probablemente acumulan aprendizajes por campaña que deberían vivir en `references/`).
- **Tercer intento de Prozis (12:47) falló tras 3 "continúa":** (1) una llamada a Nous/DeepSeek
  quedó colgada 8 min — Hermes corta a los 600 s para deepseek-v4-flash; bajarlo por config NO
  funciona (bug de Hermes: `agent/chat_completion_helpers.py` aplica el suelo de razonamiento con
  max() aunque haya `stale_timeout_seconds` configurado, contra lo que dice su docstring). Es raro
  (5 de 8.660 llamadas en los logs), se deja estar. `config.yaml` NO se tocó (copia en
  `~/.hermes/config.yaml.bak.20260924_125552`). (2) Prozis bloquea Firecrawl (redirección a EE. UU.
  + 429) y DeepSeek responde "Let me..." sin llamar herramientas → cada turno se cierra sin avanzar.
  `tool_use_enforcement` ya está activo para deepseek; `intent_ack_continuation` está en auto (solo
  codex) — activarlo (true) es la corrección nativa de Hermes; pendiente de permiso del usuario.
  Worker: nota de entorno (webs bloqueadas → browser_navigate desde el Mac; máx. 2 intentos por
  dato) y "continúa" que exige llamadas a herramientas.
- **Aplicado con permiso del usuario:** `agent.intent_ack_continuation: true` en
  `~/.hermes/config.yaml` (única línea cambiada; verificado con el loader de Hermes). Afecta
  también a la app de escritorio. Copias: `config.yaml.bak.20260924_125552` y la del momento del
  cambio.
- **Cuarto intento de Prozis (13:02) — ÉXITO:** 10 min, 71 llamadas al modelo, 0 "continúa",
  navegador local para la web de Prozis, escribió + renderizó (320/375/600/dark) + revisó con
  visión + corrigió. Resultado con concepto único, fotos oficiales de producto, logo real,
  promo verificada (IMBACK, hasta 40 %, hasta 27/09; envío gratis > 24,99 €), 13 KB.
  Observaciones: sin enlace de baja en el footer (el prompt no lo pedía) y posible desbordamiento
  del párrafo del colágeno a 600 px. ETA de la barra ahora por ritmo real (a 75 % en 8 min → ~3 min).

### 2026-09-24 (tarde) — Auditoría de Hermes Studio (web + servidor + worker) y correcciones

Aplicado con aprobación del usuario (puntos 1-10 y 12 de la auditoría; 11 = skills, aparte):
1. **Path traversal** en `/api/jobs/:id` (y rutas del worker): el id acababa en una ruta de disco sin
   validar → `isValidJobId` en `store.ts` + `app.param('id')`. Probado: `..%2F..%2Fpackage` → 404.
2. **Secretos al entorno de Hermes**: el worker cargaba el `.env` del repo y se lo pasaba (con el
   `WORKER_TOKEN`) a Hermes, que ejecuta comandos sin aprobación y lee webs de terceros → entorno
   limpio (`HERMES_ENV`). Probado con un Hermes simulado: ni token ni claves, sí PATH.
3. **Pipeline de 9 fases aún invocable por API** (gasto de OpenAI) → `PIPELINE_ENABLED`.
4. **Trabajos colgados**: 4 h y solo al hacer claim → 10 min sin señales, barrido también al
   consultar trabajos (`sweepStaleHermesJobs`).
5. **Subida final**: 6 reintentos con backoff exponencial y, si falla, error con la ruta del HTML en
   el Mac; errores inesperados de `runJob` ya no dejan el trabajo en "running".
6. **Almacén de trabajos**: escritura atómica (tmp + rename) y `listJobs` tolerante a archivos dañados.
7. **Marcas**: el worker envía las de su Mac (`studio/data/worker-brands.json`); el desplegable las une.
8. **Marca equivocada**: 409 `brand_mismatch` si el prompt no menciona la marca (con acentos y
   mayúsculas normalizados), confirmación en la UI; el formulario se vacía al abrirse.
9-10. **Encargo a Hermes**: enlace de baja `{{unsubscribe_url}}` obligatorio; scripts auxiliares en
   `{salida}/_trabajo/` o /tmp, nunca en scripts/, raíz ni brands/. `.gitignore` para capturas y _trabajo.
12. **Historial** de las últimas 25 newsletters en la página principal.
Además: no se registran duraciones < 3 min (las pruebas falseaban la ETA; limpiado el archivo).
**Pendiente del usuario:** plan de pago de Railway (~16 días de prueba); quitar de Railway
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY` y `LLM_*`; revisar las dos skills de ~98 KB.


### 2026-09-24 (tarde) — Reorganización de la skill de Hermes `newsletter-pipeline` (punto 11)

- **Problema:** `SKILL.md` y `references/standalone-creative-newsletter-brief.md` ~98 KB cada uno
  (Hermes añade aprendizajes al cuerpo tras cada campaña). Por `skill_view` llegaban como una línea
  de 100 KB imposible de leer por tramos → bucles y contexto inicial de ~47k tokens.
- **Hecho (con aprobación):** reparto por secciones, **sin reescribir contenido**, con un script
  (`split_skill.py`, en el scratchpad de la sesión) aplicado primero a una copia y verificado:
  las 1.172 líneas no vacías originales están todas, 0 duplicadas, 93 referencias intactas; solo
  cambian `version: 2.38.0` y `updated`. `SKILL.md` 12 KB (esencial + "Mapa de referencias" +
  regla de mantenimiento: aprendizajes a `references/`, tope ~30 KB/archivo); referencia standalone
  38 KB (pasos 1-7, autoauditoría, entrega); 12 referencias nuevas temáticas (engine-operations,
  brand-onboarding, copy-and-claims, hero-images, INDEX, standalone-html-techniques,
  standalone-pitfalls-{layout,images,research-tools}, standalone-research-automotive,
  standalone-brand-color-and-files, logo-sourcing).
- **Verificado con Hermes real:** ambos `skill_view` completos de una vez (19 KB y 40 KB), sin
  persisted-output; contexto de la primera llamada 24k tokens (antes ~47k).
- **Copia completa previa:** `/Users/javifeebbo/.hermes/skill-backups/newsletter-pipeline-20260924_133552`
  (fuera de `~/.hermes/skills` para que Hermes no la cargue).
- **Vigilar:** que Hermes respete la regla de mantenimiento en las próximas campañas (si `SKILL.md`
  vuelve a crecer, la nota del worker para archivos > 40 KB sigue actuando de red).

### 2026-09-24 (tarde) — Worker como servicio de macOS + interfaz con la identidad de Feebbo

- **Worker robusto:** la tarde del 24 el proceso del worker murió sin error a mitad del trabajo de
  ASICS (13:44 → ~14:02); al reiniciarlo, el reset lo marcó fallido. Cambios en
  `studio/worker/hermes-worker.ts`: candado de instancia única (`.worker.lock`; un segundo worker
  espera y toma el relevo), SIGINT/SIGTERM marcan el trabajo en curso como fallido y matan a Hermes,
  y los `unhandledRejection`/`uncaughtException` se registran en vez de tumbar el proceso.
- **Servicio launchd** (`studio/worker/service.sh`, `npm run hermes-worker:service -- install|
  uninstall|restart|status|logs`): `com.hermes-studio.worker`, arranca con la sesión, KeepAlive
  (se reinicia solo), `caffeinate -i`, log en `~/Library/Logs/hermes-worker.log`. **Instalado el
  2026-09-24 ~15:45**; verificado: conecta con Railway y, tras matar el proceso con kill -9, launchd
  lo relanza en ~20 s.
- **Interfaz (studio/web):** rediseño con la identidad de feebbodigital.com — azul noche #050C2A,
  rosa #FB73FF, lila/morado, Work Sans + Barlow en mayúsculas espaciadas, botones píldora, logo y
  favicon oficiales. Historial: hasta 200 trabajos con buscador (marca/persona), filtro por marca y
  por estado, duración, motivo del fallo, acciones Ver/Descargar/**Reutilizar** (rellena el
  formulario con marca, prompt e imágenes; no envía). `/api/jobs` devuelve además clientSlug,
  imageMode, elapsedSec y error.

### 2026-09-24 (tarde) — Studio: newsletter a partir de una instrucción básica

- **Qué:** además de pegar el prompt completo, el formulario acepta una "Instrucción rápida"
  ("quiero una newsletter de Adeslas…"). Hermes genera primero el brief con la skill
  `newsletter-creative-brief` y después ejecuta ese brief como un trabajo normal, sin pausa.
- **Skill:** copiada de la skill de Claude (Cowork) a `~/.hermes/skills/creative/newsletter-creative-brief/`
  (nueva, sin sobrescribir nada; se añadió `category/version/updated` al frontmatter). Si se
  modifica la plantilla en Cowork, hay que volver a copiarla.
- **Destino fijo `standalone`:** la skill pregunta el destino si es ambiguo; el encargo del paso
  del brief (`buildBriefPrompt` en `studio/server/standalone.ts`) lo fija en standalone, prohíbe
  preguntas (sin producto concreto → campaña vigente más razonable, dicho en el brief) y exige
  `{outDir}/brief.md` como entregable (ignora `present_files`).
- **Flujo:** `JobInput.instruction` + `briefText` vacío → `/api/worker/claim` devuelve
  `briefPrompt` → el worker (`runBriefStep`) ejecuta Hermes en una sesión propia (2 "continúa"
  si no escribe el archivo) → `POST /api/worker/jobs/:id/brief` guarda el brief y devuelve el
  encargo final → newsletter en sesión nueva. La barra reserva el 12 % para el brief.
- **Web:** selector "Instrucción rápida / Prompt completo"; la página del trabajo muestra el brief
  generado con "Usar este brief en un trabajo nuevo"; el historial marca "Desde instrucción";
  "Reutilizar" respeta el tipo de entrada. Se guardan `instruccion.md` y `prompt.md` (el brief).
- **Verificado en local** con un Hermes simulado (instrucción → brief → newsletter, y prompt pegado).
- **Primera prueba real (Adidas, 16:00):** Hermes hizo 21 `search_files` (varios con patrón "*")
  buscando el brand pack y luego se colgó 14 min en una llamada a Nous sin que su timeout saltara.
  Arreglos en el worker: `briefEnvNote` le da ya resueltas la ruta del brand pack y los logos
  disponibles, prohíbe `search_files` para eso y limita la investigación a 5 búsquedas web; y
  `STALL_KILL_SEC` (12 min sin actividad → se corta el turno y se retoma la sesión, en brief y en
  newsletter). Relanzado: brief en 4 min, newsletter en 11 min (15 min en total).

### 2026-09-24 (tarde) — Revisión de la newsletter de Adidas: imágenes de IA y autoauditoría

- **Hallazgo:** con "solo assets oficiales", Hermes usó dos fotos de `brands/adidas/design-input/`
  que eran de IA (C2PA de fal.ai, generadas para la campaña de prueba de julio). Además, el titular
  no derivaba del concepto del brief y el precio (260 €) iba sin fuente.
- **Escaneo C2PA de todos los brand packs:** 36 imágenes de IA en 13 marcas (adidas, apple, audi, bmw,
  feebbo, msf, new-balance, nike, rolex, spotify, tarifalo, toyota, uax, wornwear), incluidos logos
  generados con IA en adidas (`logo-adidas.png`) y new-balance (`logo-nb.png`, `logo-nb-email.png`).
- **Adidas (con aprobación):** las 4 fotos y el logo de IA movidos a `_archive/imagenes-ia/adidas/`
  (README con el detalle). Quedan `logo-adidas-badge.svg` (trazados oficiales) y `logo.png`.
  **Resto de marcas: sin tocar** — pendiente de decisión del usuario.
- **Worker:** `brandAssetsNote` lista a Hermes (en el brief y en la newsletter) los logos, las fotos
  sin verificar y las marcadas como IA por C2PA (y sus copias `-email/-original/-raw`).
- **Encargo:** en modo "assets oficiales", las fotos salen de la web oficial con URL de origen; las
  del brand pack solo si se confirma que están publicadas. Autoauditoría por escrito obligatoria en
  `notas.md` (concepto → titular, fuente de cada precio/cifra, origen de cada imagen, preguntas del
  prompt); si falta, el worker pide un turno más. Studio guarda y muestra esas notas.

### 2026-09-25 — Studio: vista previa en escritorio y móvil

- Selector "Escritorio / Móvil" sobre la vista previa. El iframe se pinta al ancho real (800 px /
  375 px, con marco de teléfono) para que salten las media queries del email, y se escala si no
  cabe en la pantalla (p. ej. al 33 % en un móvil). La elección se recuerda en el navegador.
- Primer hallazgo con la vista móvil: la newsletter de Adidas (2026-09-24) se sale por la derecha a
  375 px (imágenes con width="600" fijo y sin regla responsive) — la autoauditoría de Hermes no lo vio.
- **Comprobación móvil obligatoria (aprobada):** el encargo exige renderizar a 375 px y anotar el
  resultado en `notas.md` (punto 4). Además el worker lo **mide** con Playwright antes de subir
  (`mobileOverflow`: ancho del documento y los elementos más internos que se salen, p. ej.
  `<img width="600">`); si se sale, devuelve la pieza a Hermes con ese detalle (hasta 2 veces) y,
  si sigue sin caber, lo deja como aviso en el trabajo. Verificado: detecta Adidas (600 px) y la
  Adeslas del 24-sep (648 px); un email con media query correcta pasa. Aplicado tras terminar el
  trabajo de Inglesina (19 min) para no cortarlo.

### 2026-09-25 — Barra de progreso: recta final y última actividad

- **Problema (Inglesina):** en la revisión final la barra llegaba al tope de su fase (96 %) y el
  cálculo daba siempre "quedan ~1 min" durante 5+ min: parecía colgado sin estarlo.
- **Cambio:** con el % en el tope de su fase el worker ya no estima tiempo (`etaSec: null`) y envía
  `lastActionAt` (hora de la última acción de Hermes). La web muestra "recta final: revisando a su
  ritmo" y "última acción hace X" en el detalle; si pasan 3 min sin actividad, "sin actividad desde
  hace X" en amarillo. La barra lleva un brillo animado mientras Hermes trabaja.

### 2026-09-25 — "Adaptar a móvil" para newsletters ya terminadas

- **Por qué:** las piezas hechas antes de la comprobación móvil (Adidas, Inglesina) son tablas fijas
  de 600 px sin media query; en la vista móvil se cortan. Rehacerlas costaba ~20 min.
- **Qué:** botón "Adaptar a móvil" en la página de una newsletter terminada → `POST /api/jobs/:id/mobile-fix`
  crea un trabajo con `mobileFixOf`. El claim entrega `sourceHtml` (HTML publicado, imágenes ya en
  /assets) y `buildMobileFixPrompt`: no rediseñar ni cambiar textos/imágenes, solo media query
  (contenedor 100 %, imágenes fluidas, columnas apiladas, paddings), escritorio idéntico, notas.md.
  El worker deja el original en `_trabajo/original.html`, no añade notas de skills/marca, estima
  6 min y no registra la duración; pasa la medición a 375 px como cualquier pieza. La web lo titula
  "{marca} · adaptación a móvil", abre en vista móvil y el historial lo marca.
- El aviso "la versión móvil sigue sin caber" se registra en rojo (nivel error).
- **Verificado en local** con Hermes simulado (original fija → 2 correcciones + aviso; adaptación → pasa).

### 2026-09-25 — "Sin actividad" no es cuelgue

- Talaria: la barra marcó "sin actividad desde hace 5 min" mientras el modelo generaba una sola
  respuesta de 7.200 tokens (llamada de 304 s). Sin tool calls no hay señal de vida, pero no es cuelgue.
- Web: 3-10 min sin acciones → "generando respuesta · sin acciones desde hace X" (gris); ≥10 min →
  "sin actividad" (amarillo). Worker: `STALL_KILL_SEC` 12 → 20 min para no cortar respuestas largas.

### 2026-09-28 — Auditoría del sistema completo (funcionalidad e interfaces)

- **Alcance:** ruta real de producción (Vercel → Railway → worker del Mac → Hermes), código de Studio
  (servidor, worker, web) y medición de las 8 newsletters producidas por Hermes. El motor y los
  agentes 00-09 ya se auditaron el 2026-09-23 (BUG-H01 a H13).
- **Estado verificado:** `npm test` 81/81; `deploy/main` al día con `main`; Railway y Vercel
  responden (401 sin contraseña, como debe ser). El log del worker tuvo cortes de conexión el
  2026-09-28 por la mañana, sin trabajos afectados. Desde la regla del 24-09, Hermes no ha dejado
  scripts sueltos fuera de `_trabajo/`.
- **Hallazgos nuevos:** BUG-H14 a H18 (tabla de arriba). Informe con mejoras priorizadas entregado
  en el chat. **No se ha aplicado ningún cambio**: pendiente de lo que elija el usuario.

### 2026-09-28 (continuación) — Control de calidad, credenciales fuera del repo y panel de revisión

- **Aprobado por el usuario:** los 3 puntos recomendados de la auditoría (BUG-H15, H14, H17).
- **Control de calidad** (`studio/worker/qualityCheck.ts` + `qualityCheck.test.js`, 6 tests): el worker
  lo corre tras la comprobación móvil; los errores vuelven a Hermes (`QUALITY_FIX_ATTEMPTS = 2`), no en
  "Adaptar a móvil" (ahí solo informa). El informe viaja en `/complete` (`quality`) y se guarda en el
  trabajo (`sanitizeQuality`). Encargo (`buildHermesPrompt`): preheader obligatorio y enlaces que existan.
- **Credenciales:** `~/.config/hermes-studio/.env` (movidas desde `studio/.env`; `HERMES_WORKER_ENV_DIR`
  para otra ruta); `SECRETS_NOTE` en el primer turno de brief, newsletter y adaptación móvil.
- **Panel de revisión** (`studio/web/`): lista ordenada error → aviso → correcto, resumen, mensaje del
  resultado en ámbar si hay errores, autoauditoría desplegable; `GET /api/jobs/:id` devuelve `notes`.
- **Verificación:** `npm test` 87/87; typecheck sin errores nuevos (los 35 preexistentes siguen); panel
  probado en el navegador a 800 y 375 px con el HTML real de Inglesina (2 errores reales) y con una
  newsletter antigua (sin revisión); circuito completo en una copia aislada con un Hermes simulado:
  pieza con 404 + sin preheader → 1 ronda de corrección → "Control de calidad superado".
- **Incidencia:** durante la prueba un `pkill` demasiado amplio cerró el worker real a las 09:59 (sin
  trabajo en curso); launchd lo relanzó en segundos, ya con el código nuevo (compatible con el servidor
  de Railway anterior).

- **Desplegado (con permiso del usuario):** `af6f3a5` subido a `Javifeebbo/hermes-studio` → Railway
  SUCCESS 10:03; interfaz publicada en Vercel (`hermes-studio-beta.vercel.app` sirve el panel nuevo);
  worker reiniciado (launchd) y leyendo el token de `~/.config/hermes-studio/.env` (sin aviso de
  `studio/.env`). **Pendiente:** primer trabajo real con Hermes para ver el control y el panel en vivo.

### 2026-09-28 (continuación) — Cancelar trabajos y pedir cambios

- **Aprobado por el usuario.** Solo Studio; motor y agentes 00-09 sin tocar.
- **Cancelar:** estado nuevo `cancelled`; `POST /api/jobs/:id/cancel` (cola → al momento; en curso →
  las rutas del worker para ese trabajo responden 409 `{cancelled:true}`). El worker (`api()` →
  `markCancelled`) mata a Hermes, no pide más turnos (`runHermesTurn` no arranca), no sube nada y no
  llama a `/fail`. Funciona también durante el brief.
- **Pedir cambios:** `POST /api/jobs/:id/revise` (`revisionOf`, `changeRequest` ≤ 4000). El claim entrega
  `editKind:'revision'`, el HTML publicado y `notas.md` de la original; el worker los deja en
  `_trabajo/original.html` y `_trabajo/notas-original.md`. Sesión nueva (no `--resume` de la original:
  70+ acciones, lento y caro con DeepSeek). Control de calidad completo con devolución (el de "Adaptar a
  móvil" sigue solo informativo). Guarda `cambios.md`. ETA 8 min; no registra duración.
- **Web:** "Cancelar trabajo" con confirmación en la página; "Pedir cambios" con cuadro de texto y error
  en línea; título "{marca} · cambios" con la petición visible; historial "Cambios sobre otra versión".
- **Verificación:** copia aislada + Hermes simulado: cancelar en cola; cancelar en curso (Hermes
  detenido a los 23 s, sin subida); newsletter normal; petición de cambios (recibe original, notas y
  nota de credenciales; resultado con 0 errores de calidad). Interfaz probada a 800 y 375 px.
  `npm test` 87/87.

- **Desplegado (con permiso del usuario):** `4d4967d` → Railway SUCCESS 10:18; Vercel sirve la interfaz
  nueva; worker reiniciado (launchd) sin errores. **Pendiente:** primer uso real de cancelar y pedir
  cambios con Hermes de verdad.

### 2026-09-28 (continuación) — Mejoras de interfaz 1, 4, 5 y 6

- **Elegidas por el usuario** de la lista de 12 mejoras de interfaz. Solo Studio.
- **1. Asunto, preheader y copiar:** `GET /api/jobs/:id` devuelve `meta` (`resultMeta`: `<title>` +
  `findPreheader` del control de calidad); bloque con botones de copiar; "Copiar HTML" con el HTML
  descargado al abrir el resultado y método clásico (`execCommand`) si el portapapeles está bloqueado
  (el panel integrado del navegador lo bloquea: así se detectó).
- **4. Aviso al terminar:** progreso/estado en el título de la pestaña; "Avisarme cuando termine"
  (Notification, preferencia en localStorage), avisa solo en la transición a terminado/fallido con la
  pestaña en segundo plano.
- **5. Posición en la cola:** `queueInfo` (trabajos delante + inicio estimado: ETA del que está en
  marcha + duración típica por tipo: 20 min, 25 con instrucción, 8 cambios, 6 móvil) y `hermesOnline`.
- **6. Sin ventanas emergentes:** aviso de marca equivocada y errores dentro del formulario; el resto
  (Reutilizar, Adaptar a móvil, copiar) con un aviso flotante (`#toast`, `aria-live`).
- **Verificación:** navegador (copia aislada) a 800 y 375 px: meta y copiar, cola ("1 trabajo delante",
  Hermes desconectado), título de pestaña, notificación simulada (permiso por defecto → concedido → aviso
  solo en la transición) y aviso de marca con "Enviar igualmente". `npm test` 87/87.

- **Desplegado (con permiso del usuario):** `5a95ec2` → Railway SUCCESS 10:55; Vercel sirve la interfaz
  nueva. Worker sin cambios (no hizo falta reiniciarlo).

### 2026-09-28 (continuación) — Mejoras de interfaz 2 y 3: versiones y comparación

- **Elegidas por el usuario.** Solo Studio.
- **2. Versiones enlazadas:** `versionFamily` en `GET /api/jobs/:id` (raíz siguiendo `revisionOf`/
  `mobileFixOf`, numeradas por creación); la página del trabajo muestra "Hecha a partir de la versión N"
  y la lista de versiones; el historial agrupa cada familia (ordenada por su versión más reciente, las
  derivadas sangradas con "Versión N").
- **3. Comparar:** `studio/web/compare.js` (sin DOM, probado con `node --test`, 5 tests): texto visible
  por bloques (LCS), enlaces e imágenes (por nombre `img-{hash}`: la misma imagen republicada en otra
  carpeta no cuenta). Panel "Qué ha cambiado" y conmutador "Antes y después" (dos vistas previas
  escaladas lado a lado). `.vercelignore` para no publicar los tests.
- **Verificación:** copia aislada en el navegador: panel con el cambio exacto de titular, lado a lado
  al 45 %, historial agrupado, 375 px sin desbordes. Las capturas del navegador integrado muestran en
  blanco los marcos aislados (ya pasaba antes); el HTML servido se comprobó abriéndolo directamente.
  `npm test` 92/92.

- **Desplegado (con permiso del usuario):** `c37d02b` → Railway SUCCESS 11:03; Vercel sirve `compare.js`
  idéntico al local y no publica los tests (404). Worker sin cambios.

### 2026-09-28 (continuación) — Mejoras de interfaz 7 y 8: campo único de marca y ejemplos

- **Elegidas por el usuario.** Solo la web de Studio (sin cambios de servidor ni de worker).
- **7. Campo único de marca:** fuera el desplegable de carpeta + nombre (podían contradecirse: Prozis
  con Adeslas, 2026-09-24). Un campo con sugerencias (`datalist`) y `existingBrand` oculto deducido:
  `slugify` idéntico al del servidor, coincidencia exacta o sin guiones ("Para y Compara" →
  paraycompara, "Óptica 2000" → optica2000). Debajo dice "Marca del sistema… (brands/x)" o "Marca
  nueva… (se creará brands/y)". Nombres bonitos: los del historial si llevan a su carpeta, y una tabla
  `BRAND_DISPLAY` para tildes/siglas. "Reutilizar" vuelve a la carpeta original si el nombre no lleva a ella.
- **8. Ejemplos de instrucción:** 4 chips (Adeslas, Nike, El Corte Inglés, Apple) que rellenan instrucción
  y marca; solo en "Instrucción rápida" y con la instrucción vacía o con otro ejemplo (no pisan texto propio).
- **Verificación:** copia aislada en el navegador: coincidencias (El Corte Inglés, Para y Compara, Óptica
  2000, inglesina → existentes; Prozis → nueva), ejemplos visibles/ocultos según el caso, envío real al
  servidor (`brandMode` existing/new y `clientSlug` correctos), "Reutilizar" y 375 px sin desbordes.

- **Desplegado (con permiso del usuario):** `8508d77` publicado en Vercel (`app.js` e `index.html`
  servidos idénticos al local) y subido a `Javifeebbo/hermes-studio` (Railway redespliega sin cambios de
  servidor). Worker sin cambios.

### 2026-09-28 (continuación) — Mejoras de interfaz 9 y 10: modo oscuro y altura real en la vista previa

- **Elegidas por el usuario.** Solo la web de Studio.
- **10. Altura real:** la vista previa pasa de `src` (URL con CSP sandbox, no medible) a `srcdoc` con el HTML
  ya descargado en `<iframe sandbox="allow-same-origin">` SIN `allow-scripts` (probado: los scripts no se
  ejecutan). Se mide `scrollHeight` al cargar y al cambiar Escritorio/Móvil (encoge y crece: 3.125 px a 800,
  2.948 a 375 con la pieza real de Puma). Vale también para "Antes y después".
- **9. Modo de color:** Claro / Oscuro (como Apple Mail) / Invertido (aproximación a Gmail/Outlook en móvil:
  `invert + hue-rotate` en el body y deshecho en imágenes). **Hallazgo:** el marco sigue el modo del SISTEMA
  de quien mira, y `color-scheme` en el `<iframe>` no lo cambia (con el Mac en oscuro, "Claro" aplicaba los
  estilos oscuros). Solución: `forceScheme` reescribe en el HTML de la vista previa `(prefers-color-scheme:
  X)` a una condición siempre cierta o siempre falsa según el modo elegido, y `html{color-scheme}` según la
  pieza declare `<meta name="color-scheme" … dark>`. Aviso bajo la vista previa si la pieza no define estilos
  oscuros (las 8 de la auditoría no los tienen). La descarga y "Copiar HTML" no se tocan.
- **Verificación:** copia aislada con la pieza real de Puma y una variante con estilos oscuros; resultados
  idénticos con el navegador emulando sistema claro y oscuro. Las capturas ya muestran la vista previa (antes
  salía en blanco por el marco aislado por URL).

- **Desplegado (con permiso del usuario):** `2d53b48` publicado en Vercel (`app.js`, `index.html` y
  `styles.css` idénticos al local) y subido a `Javifeebbo/hermes-studio`. Worker sin cambios.

### 2026-09-28 (continuación) — Mejoras de interfaz 11 y 12: lectores de pantalla y botones en móvil

- **Elegidas por el usuario.** Web de Studio + un arreglo en `studio/worker/qualityCheck.ts`.
- **11. Lectores de pantalla:** región `#sr-status` (`role=status`, `aria-live=polite`) que anuncia solo
  cambios con sentido (estado, fase, puesto en la cola, resultado con la revisión automática), no cada
  punto del porcentaje; barra con `aria-labelledby` + `aria-valuetext`; el foco va al título al abrir un
  trabajo; filtros del historial con `aria-pressed`; "Quitado:/Añadido:" en texto oculto en "Qué ha
  cambiado"; flechas decorativas sin texto alternativo; barra mini del historial `aria-hidden`; contorno
  de foco uniforme para teclado.
- **12. Botones en móvil:** en el resultado, "Descargar HTML" a lo ancho y los otros cuatro de dos en dos
  (antes cinco apilados); "Enviar cambios" + "Cancelar" en una fila; `.btn-sm` a su medida.
- **Arreglo encontrado de paso:** el preheader salía con `&zwnj;` literal (relleno invisible que Hermes
  pone tras el preheader: la pieza real de Puma). `decodeEntities` (qualityCheck.ts y compare.js) quita
  `&zwnj; &zwj; &shy; &lrm; &rlm;`. Test de regresión con el preheader real.
- **Verificación:** copia aislada: anuncios en lista / en cola / cancelada / en marcha, foco, aria-pressed,
  375 px sin desbordes ni textos partidos. `npm test` 93/93.

- **Desplegado (con permiso del usuario):** `8a4c901` → Vercel (4 archivos idénticos al local), Railway
  SUCCESS 11:25 y worker reiniciado (launchd) sin errores.

### 2026-09-28 (continuación) — Segunda lista de mejoras de interfaz: tanda 1, 2, 3, 4 y 8

- **Elegidas por el usuario** de una lista nueva de 10. Solo la web de Studio.
- **1. Barra fija de acciones:** aparece al bajar más allá de la barra del resultado (IntersectionObserver):
  marca, Descargar, Copiar HTML, Pedir cambios y volver arriba; en móvil, rótulos cortos. El aviso
  flotante y el pie se apartan para no taparse.
- **2. Markdown legible:** `studio/web/markdown.js` (5 tests): escapa todo el HTML y solo añade títulos,
  negrita, cursiva, código, listas, citas, tablas, separadores y enlaces http(s) (`target=_blank`,
  `noopener`); código y enlaces se apartan antes de la cursiva (URLs con `_`). Autoauditoría y brief.
- **3. Enlaces de la vista previa en otra pestaña:** `<base target="_blank">` + `rel="noopener noreferrer"`
  en cada enlace (solo en la vista previa) y `allow-popups allow-popups-to-escape-sandbox` en el marco;
  siguen sin scripts.
- **4. Reintentar:** en la página de un trabajo fallido o cancelado y en el historial; relanza lo mismo
  (o los cambios / la adaptación sobre la misma versión de origen) con `confirmBrand`.
- **8. Copiar enlace** del trabajo y **nombre recordado** en el formulario (localStorage).
- **Verificación:** copia aislada con la autoauditoría real de Talaria (6 títulos, 2 tablas, 19 enlaces,
  sin HTML colado), barra fija a 800 y 375 px, enlaces de la vista previa, reintento (misma marca,
  instrucción e imágenes), copiar enlace con clic real y nombre recordado. `npm test` 98/98.

- **Desplegado (con permiso del usuario):** `9c2272d` publicado en Vercel (4 archivos idénticos al local;
  `markdown.test.js` no se publica) y subido a `Javifeebbo/hermes-studio`. Worker sin cambios.

### 2026-09-28 (continuación) — Interfaz 6, 7 y 9: miniaturas, qué hace Hermes y "Mis trabajos"

- **Elegidas por el usuario.** Servidor, worker y web de Studio.
- **6. Miniaturas:** las genera el WORKER (Railway en plan de prueba con poca memoria: no se abre
  Chromium allí). `studio/worker/thumbnail.ts` (sin JS, 800 px, recorte 600×800 → JPEG 300×400, ~8 KB;
  un reintento tras un fallo puntual visto en la prueba). Nuevas: en `/complete` (`thumbnail`). Antiguas:
  con el worker libre, `POST /api/worker/thumbs/pending` (3) → `POST /api/worker/jobs/:id/thumb`
  (`image` o `failed`); sin pendientes, no vuelve a preguntar en 10 min. `saveThumbnail` solo acepta JPEG
  (bytes FF D8 FF) ≤ 400 KB; `GET /api/jobs/:id/thumb` con caché privada de 1 día; `hasThumb` en la lista.
  Sin miniatura: iniciales de la marca (también si la imagen no carga).
- **7. Qué hace Hermes:** `/api/status` devuelve `current` (id, marca, %, fase) y `queued`; la píldora de la
  cabecera dice "Hermes · Nike · 52 % · 2 en cola" y enlaza con el trabajo; se refresca cada 20 s si trabaja.
- **9. "Mis trabajos":** filtro con el nombre que recuerda el formulario (oculto si no hay nombre), recordado.
- **Verificación:** copia aislada con worker + Hermes simulado: pieza lenta → cabecera "Hermes · Inglesina"
  con enlace; al terminar, miniatura en `/complete`; worker libre → 4 miniaturas antiguas en 2 pasadas (una
  falló de forma puntual y no se repitió: de ahí el reintento). Filas del historial corregidas (las reglas
  antiguas pisaban la rejilla nueva) y probadas a 800 y 375 px; filtro con 2 de 16. `npm test` 98/98.

- **Desplegado (con permiso del usuario):** `3bf0192` → Railway SUCCESS 11:53, Vercel (3 archivos
  idénticos al local) y worker reiniciado. **Primer uso real:** el worker generó en producción las
  miniaturas de las 10 newsletters terminadas en 4 pasadas (11:53-11:54), sin ningún fallo.

### 2026-09-28 (continuación) — Interfaz 5 y 10: registro de Hermes y tema claro

- **Elegidas por el usuario.** Solo la web de Studio.
- **5. Registro:** hora en cada línea; avisos y errores marcados (fondo y barra roja) y contados en el
  título del registro (se ven aunque esté plegado); filtro "Solo avisos y errores"; notas largas de Hermes
  plegadas con el principio a la vista; se repinta solo si llegan líneas nuevas (no cierra lo abierto).
- **10. Tema claro:** ~40 colores fijos pasan a variables (`--surface-*`, `--glow-*`, `--shadow*`,
  `--diff-*`, `--code-bg`…); el rosa como TEXTO pasa a `--accent-text` (magenta oscuro en claro: el rosa
  sobre blanco daba ~2,4:1) y el texto sobre rosa a `--on-accent`. Sigue al sistema; botón en la cabecera
  para fijar Claro/Oscuro/Automático (localStorage + script en `<head>` antes de pintar, sin parpadeo).
  Logo oficial blanco → oscurecido en claro.
- **Verificación:** contraste de 13 pares de color ≥ 4,5:1 en ambos temas (mínimo: verde "correcto" en
  claro, 4,99); automático probado con el sistema en claro y en oscuro; tema recordado al recargar;
  registro con el aviso real de calidad y filtro (1 de 6). `npm test` 98/98.

- **Desplegado (con permiso del usuario):** `50c1753` publicado en Vercel (3 archivos idénticos al local)
  y subido a `Javifeebbo/hermes-studio`. Worker sin cambios.

### 2026-09-28 — BUG-H16 (imágenes en Railway) resuelto por el usuario

- El usuario sube las imágenes de las newsletters a su propio CDN, así que los emails enviados no dependen
  de Railway. Sin cambios en Studio.

### 2026-09-28 (continuación) — Modo oscuro y Outlook en el control de calidad (cierra BUG-H15)

- **Aprobado por el usuario.** Solo Studio (worker + encargo).
- **Calibrado antes con las 8 newsletters reales:** las 8 sin modo oscuro (Adeslas e Inglesina declaran
  `color-scheme: light`, las demás nada), las 3 de Inglesina sin ningún `<!--[if mso]>`, Adeslas y Talaria sin
  96 ppp; ninguna con flex/grid, imágenes sin width ni tipografías sin alternativa (sin falsos positivos).
- **`darkModeCheck`:** error si falta `<meta name="color-scheme" content="… dark">` o `@media
  (prefers-color-scheme: dark)`; `light only` explícito = aviso (Gmail/Outlook móvil invierten igualmente);
  `light` a secas cuenta como no preparada.
- **`outlookCheck`:** error sin `<!--[if mso]>`, con `display:flex/grid` en línea o `<img>` sin `width`; aviso
  sin 96 ppp, `background-image` sin VML y tipografías sin alternativa genérica.
- **Encargo** (`buildHermesPrompt`): modo oscuro y Outlook obligatorios con lo concreto a hacer; pautas de la
  ronda de calidad ampliadas.
- **"Pedir cambios":** si la original ya fallaba modo oscuro u Outlook, esos errores se muestran pero no se
  fuerzan (añadirlos cambiaría la pieza más allá de lo pedido); si el retoque los estropea, sí se devuelven.
- **Verificación:** 11 tests (4 nuevos); copia aislada con Hermes simulado: nueva → 1 ronda (modo oscuro +
  Outlook) → sin errores; cambios sobre Puma → no se exige el modo oscuro heredado, sí Outlook que el retoque
  rompió. `npm test` 102/102.

- **Desplegado (con permiso del usuario):** `c63f492` → Railway SUCCESS 12:12 (encargo) y worker reiniciado
  (control), conectado sin errores. Sin cambios de interfaz (Vercel no hacía falta).

### 2026-09-29 — Lacoste en bucle: vigilante de bucles e intentos fallidos apartados

- **Incidente**: trabajo `mumcv8oj-i5jifn` (Lacoste, 9:29). Tras el brief, Hermes (DeepSeek V4 Flash vía Nous, el
  mismo modelo que el día anterior) encontró el intento a medias del 28 (`2026-09-28-flgi3r`, marcado fallido al
  reiniciarse el worker) y desde las 9:53 releyó en bucle su notas.md y newsletter.html (Hermes bloqueaba cada
  lectura; el modelo seguía pidiéndola). Una llamada al modelo se colgó 15 min (9:55–10:10). El vigilante de
  inactividad no saltaba: cada lectura bloqueada cuenta como acción.
- **Vigilante de bucles** (`studio/worker/loopWatch.ts` + tests): acción repetida = misma herramienta y mismos
  argumentos (browser_* no cuenta). Bucle = 6 repetidas seguidas o 10 min sin nada nuevo con acciones. Primera
  vez: se corta el turno y se retoma con "Te has quedado en bucle… escribe AHORA …"; segunda: se para y el
  trabajo falla con un mensaje claro. En la fase del brief igual. `STALL_KILL_SEC` 20 → 12 min.
- **Intentos apartados**: `setAsideFolder` renombra la carpeta a `_fallido-…`/`_cancelado-…` (sin borrar) al
  cancelar, fallar, romperse el worker o reiniciarse (el servidor devuelve `failedDirs` en `/api/worker/reset`).
  El encargo lleva `PREVIOUS_WORK_NOTE`: no leer esas carpetas ni releer archivos ya leídos.
- Probado con un Hermes falso que se queda en bucle contra un Studio aislado: modo "obedece" (lo detecta a los
  30 s, avisa y la newsletter se entrega) y modo "terco" (avisa, lo para a los 30 s siguientes, falla con mensaje
  y la carpeta queda como `_fallido-…`). 140/140 tests.
- Desplegado a las 10:33 (Railway + reinicio del worker, que paró el trabajo: la cancelación desde la web no
  había llegado a registrarse). Carpetas apartadas a mano: `_fallido-2026-09-28-flgi3r`, `_cancelado-2026-09-29-i5jifn`.
- **Segundo intento (`mumfe3ol-n8blc7`, 10:39)**: una llamada al modelo colgada 12 min (la cortó el vigilante
  nuevo a los 12, antes eran 20) y después Hermes **reescribió el brief completo 14 veces seguidas** en 21 min
  sin terminar el turno (contenido distinto cada vez: no contaba como repetición). Se cortó el turno a mano a
  las 11:24 y el worker tomó el brief (ya válido) y siguió con la newsletter.
- **Tercer tipo de bucle** en `loopWatch.ts`: 4 `write_file` seguidos al mismo archivo sin nada entre medias
  (escribir → renderizar → corregir, o varios `patch`, siguen siendo normales). El aviso a Hermes dice que la
  última versión vale y que no la reescriba. Tests: 7. Pendiente de desplegar (reiniciar el worker) cuando
  termine el trabajo de Lacoste en curso.

### 2026-09-29 — Rediseño de las acciones del resultado

- Feedback del usuario con captura: "hay muchísimos botones y muy juntos, es muy caótico" (siete botones
  iguales en dos filas + barra de progreso al 100 % que ya no aportaba).
- Ahora un panel: arriba el estado ("Lista, con N errores por revisar" + "Ver errores") y "Aprobar para envío"
  (o la etiqueta de aprobada); dos bloques con título, "Llevarla a tu plataforma" (Descargar, Copiar y su
  formato: plataforma y UTM) y "Cambiar la pieza" (Editar texto, Pedir cambios, Adaptar a móvil como
  opciones con quién lo hace y cuánto tarda). "Abrir en pestaña" pasa a enlace junto a la vista previa. La
  barra de progreso se oculta al terminar. Mismos ids: atajos, barra fija y resto de lógica sin cambios.
- Probado con Chrome 154 en 360–1300 px (sin desbordes), claro y oscuro, con errores y aprobada.
- Nota: la copia aislada de pruebas (/tmp) se borró de un día para otro; se rehízo con una familia Nike de
  prueba (original con errores + versión con el recorte).

### 2026-09-28 (tarde) — Galería del historial, estado en el icono de la pestaña y atajos de teclado

- Galería (Lista/Galería en el historial, agrupada por marca), punto de estado en el favicon (canvas sobre
  favicon.png) y atajos E/C/D/V/O/B/? con ayuda en diálogo. Solo web (Vercel).
- Probado en copia aislada con Chrome 154 (galería con filtros, colores del icono leídos del propio icono,
  cada atajo y que no actúan escribiendo). 135/135 tests.

### 2026-09-28 (tarde) — Comparar con cualquier versión, ancho libre y texto alternativo

- "Comparar con" (selector en "Qué ha cambiado"): cualquier versión terminada de la familia; textos propios
  cuando no es la de la que sale ("lo que solo está en la N / en esta").
- Vista previa "Libre" 320–1000 px (presets 320/375/414/600/768), altura re-medida en cada cambio.
- Texto alternativo en "Editar texto": clic en la imagen → campo junto a ella; `alts` en `/text-edit`
  (índice entre las `<img>`, comprobación del alt de partida, se añade si no existía). Escribir con una
  imagen seleccionada ya no puede borrarla.
- Probado en copia aislada con Chrome 154 (414/600/900 px, comparar v3↔v1 y original↔v3, alt de la imagen 5
  de Nike guardado como versión nueva). 135/135 tests. Despliegue: Vercel + Railway; el worker no cambia.

### 2026-09-28 (tarde) — Exportar para la plataforma, UTM, aprobar para envío y archivar

- **Exportar** (`studio/web/export.js` + tests): variables de Hermes → Mailchimp (`*|UNSUB|*`, `*|ARCHIVE|*`,
  `*|UPDATE_PROFILE|*`), Brevo (`{{ unsubscribe }}`, `{{ mirror }}`, `{{ update_profile }}`), HubSpot
  (`{{ unsubscribe_link_all }}`, `{{ view_as_page_url }}`, `{{ unsubscribe_link }}`), Klaviyo (`{% unsubscribe_url %}`,
  `{% manage_preferences_url %}`; "ver online" sin equivalente seguro: se avisa) y Salesforce MC (`%%unsub_center_url%%`,
  `%%view_email_url%%`, `%%profile_center_url%%`). **Pendiente**: confirmar las variables con la plataforma que use
  cada cliente antes del primer envío real. UTM en <a> y VML de Outlook, sin pisar los existentes.
- **Aprobar para envío**: rutas `/approve` y `/unapprove`; una aprobada por familia; checklist guardada.
- **Archivar**: ruta `/archive` (familia entera; 409 si hay algo en cola o en marcha); chip "Archivadas (N)".
- Probado en copia aislada con Chrome 154 (copiar = descargar, 6 enlaces con UTM en Nike, aprobar/quitar,
  aviso en otras versiones, filtro, archivar/recuperar, rechazo con trabajo en cola). 133/133 tests.
- Despliegue: Vercel + Railway (rutas y campos nuevos). El worker no cambia.

### 2026-09-28 (tarde) — Editar texto sin Hermes y duraciones reales

- **Editar texto** (`studio/web/textedit.js`, `studio/server/textEdit.ts`, ruta `POST /api/jobs/:id/text-edit`,
  `createTextEditVersion`): versión nueva al momento (`textEditOf`) con los retoques aplicados sobre el HTML
  publicado por posición (parse5), sin reserializar: en la prueba con Nike solo cambiaron las 6 líneas
  editadas (asunto, preheader, titular, párrafo, botón, pie). También se cambia la copia del texto del botón
  en el VML de Outlook. Revisión automática: comprobaciones sin red de nuevo + enlaces/imágenes/móvil
  heredados. Dependencia nueva directa: `parse5` (ya estaba instalada vía juice).
- **Lo que costó que funcionara con Chrome real** (probado con Playwright y Chrome 154, no con el Chromium
  reducido: las acciones de Playwright sobre el marco sin scripts fallan, hay que hacer clic por
  coordenadas): Chrome saca fuera del enlace lo escrito al final de un botón, borra el `<a>` al vaciarlo,
  fusiona bloques al borrar al principio y el triple clic selecciona el bloque siguiente. Solución: Studio
  hace toda escritura/borrado dentro del nodo de texto (`replaceInTextNode`, marcador U+2060 si queda
  vacío), recorta selecciones a un trozo (también justo antes de escribir) y lleva el cursor al texto si se
  pulsa el relleno de un botón. Si aun así cambia la estructura, no se guarda y se dice dónde.
- **Duraciones reales**: `startedAt`/`finishedAt`; mediana de los últimos 10 por tipo (`typicalDurations`) en
  cola, formulario, "Pedir cambios", adaptación y el historial ("tardó N min"); el worker usa `expectedSec`
  para el porcentaje de cambios y adaptaciones (antes 8 y 6 min fijos; la revisión de Nike tardó 16).
- Despliegue: Vercel + Railway (servidor y dependencia) + reiniciar el worker. 126/126 tests.

### 2026-09-28 (tarde) — Formulario: borrador guardado y aviso de instrucción poco concreta

- **Borrador**: se guarda en localStorage (400 ms tras escribir; caduca a los 14 días) y se recupera con un
  aviso visible y "Descartar"; se borra al enviar. "Reutilizar" pasa a ser el borrador. El `form.reset()` del
  arranque se mantiene: el autorrelleno silencioso del navegador causó el incidente Prozis/Adeslas.
- **Aviso de instrucción vaga** (`studio/web/formcheck.js` + tests): sin tema (solo relleno + marca, p. ej.
  «newsletter de Nike de prueba», «… Inglesina segunda», reales) o sin objetivo/público; "Prompt completo" de
  <400 caracteres. No bloquea: "Completar la instrucción" / "Enviar igualmente". Las instrucciones reales con
  contenido y los 4 ejemplos del formulario pasan sin aviso.
- Probado en copia aislada (recarga, "Generar otra", descartar, enviar igualmente, prompt corto; 375 px y
  claro/oscuro con Playwright). 122/122 tests.

### 2026-09-28 (tarde) — Interfaz: avisos que llevan al sitio y cambios resaltados en la pieza

- **"Ver" en la revisión y en "Qué ha cambiado"** (`studio/web/locate.js` + tests): cada detalle se traduce a un
  localizador (URL de enlace/imagen, n-ésima imagen sin alt/width, flex, contexto del claim, desborde) sin
  cambiar el formato del control de calidad. El botón solo aparece si el elemento está en la vista previa
  (lo quitado y el desborde, siempre: se buscan al pulsar, en la versión anterior o con la vista en móvil).
  Baja hasta el elemento centrado y lo hace parpadear en naranja 3 s.
- **Resaltar cambios**: verde lo añadido en esta versión y rojo lo quitado en la anterior ("Antes y
  después"). Se recuerda en el navegador; oculto si no hay cambios de contenido (adaptaciones a móvil).
- Probado en copia aislada con Nike v1 → v2 y una revisión inyectada con 5 avisos (4 localizables, modo
  oscuro no); desborde simulado con una tabla de 420 px; 375 px sin desborde; capturas con Playwright.
  118/118 tests.

### 2026-09-28 (tarde) — Interfaz: señalar en la vista previa, atajos, bandeja de entrada e historial por newsletter

- **Señalar en la vista previa** (`studio/web/pick.js` + tests, app.js): en "Pedir cambios", clic sobre la
  pieza → referencia exacta en la petición (imagen nº N de M con su alt, botón/enlace con destino, titular o
  párrafo citado, bloque con fondo). Nace de la prueba de Nike («la tercera imagen»). `buildRevisionPrompt`
  explica el formato a Hermes solo si hay referencias. Lo señalado queda marcado y se vuelve a marcar al
  cambiar el tema de la vista previa; Esc sale.
- **Atajos de cambios**: 6 chips con las peticiones frecuentes (con «…» seleccionado para escribir encima).
- **Cómo se ve en la bandeja**: fila de Gmail móvil (columna de 276 px) y escritorio (760 px), con el corte
  medido con canvas, no con CSS (a ancho de página el escritorio cortaba a ~470 px y engañaba), y cuántos
  caracteres de asunto y preheader se leen.
- **Historial por newsletter**: una fila por familia de versiones; el resto plegado.
- **Arreglado de paso**: `--shadow-strong` del tema oscuro se referenciaba a sí mismo (sin sombra en toast,
  barra fija y menús en oscuro desde el tema claro); vuelve a `rgba(0,0,0,0.45)`.
- Probado en copia aislada con la pieza real de Nike (clic real en imagen, botón, titular, párrafo; tema;
  375 px sin desborde; sin errores de consola). 113/113 tests.

### 2026-09-28 (tarde) — Primeras newsletters reales con el circuito nuevo

- **El Corte Inglés** (`mul3g4nb-rmzstb`, 12:17-12:48, 25 min, desde instrucción): 11/11 comprobaciones a
  la primera, modo oscuro y Outlook incluidos (el encargo nuevo bastó: sin ronda de calidad). La medición
  móvil cazó un desborde real (415 px: padding sumado al 100 %) y Hermes lo corrigió y lo documentó en
  notas.md. Un "continúa" a mitad (Hermes paró sin entregar). Modo oscuro revisado con capturas: bien
  resuelto (logo blanco, fondos y CTA invertidos); solo el hero queda blanco (foto con texto incrustado).
- **Nike** (`mulb8ljo-1zjdpc`, 15:56-16:05, 9 min; brief en 1 min porque reutilizó el brand pack y la
  investigación previa del Pegasus 42): 11/11. Modo oscuro bien resuelto. **Punto débil de composición que
  el control no puede ver:** la foto cuadrada de la zapatilla verde deja >400 px de blanco arriba y abajo.
- **Falso positivo corregido:** `outlookCheck` contaba `font-family` dentro de `@font-face` (el NOMBRE de la
  fuente) como "tipografía sin alternativa". Ahora se ignoran esos bloques; test de regresión (12/12).
- **Nike, "Pedir cambios"** (`mulbpi8o-at86sp`, 16:09-16:25, 16 min; "recorta el blanco de la tercera
  imagen"): Hermes identificó la imagen midiendo píxeles (42 % vacío arriba, 27 % abajo), la recortó a
  960×440 desde la foto oficial de static.nike.com con ~10 % de margen y no tocó nada más. "Qué ha cambiado":
  1 imagen sustituida, 0 cambios de texto o enlaces. Calidad 0/0. Altura 2989 → 2609 px.
- **Fallos de la vista de progreso que destapó la prueba** (corregidos con tests y desplegados a las 16:40 en
  Vercel, Railway y worker; commits 8d0b791, 4120b42, a39d539): el porcentaje se quedaba en "Preparando · 14 %"
  en cambios y adaptaciones (recortar, renderizar o mirar capturas no contaba como trabajo); "recta final"
  salía al 14 %; los retoques mostraban la fase "skills y brand pack"; "Copiar enlace" partía en dos líneas.


### 2026-10-01 — Tercera lista de mejoras de interfaz (solo diagnóstico, nada cambiado)

- Revisión en una copia aislada de Studio (scratchpad, datos sembrados: familia Nike v1→v2, El Corte Inglés
  aprobada, Lacoste fallida + Lacoste lista, uno en cola) a 800 y 375 px. Ningún archivo del repo tocado.
- **Nota:** los 15 commits de Studio del 2026-09-30 (`5bd8c6f`…`7860ef5`, crítica impeccable 34/40) no tienen
  entrada en este changelog.
- **Fallos vistos:** (a) píldora de la cabecera a 375 px: el texto se corta sin "…" y el punto de estado se
  deforma en rectángulo (`.status-pill` es `inline-flex`: `text-overflow` no actúa sobre el texto suelto y el
  `::before` encoge; falta `flex-shrink:0` + `<span>` con elipsis); (b) en móvil la vista previa arranca en
  "Escritorio" al 33 % (ilegible) si no hay preferencia guardada (`readPreviewView`).
- **Huecos de producto:** "Reintentar" desde instrucción regenera el brief aunque ya existiera (Lacoste: brief
  válido, falló después); el reintento no se enlaza con el fallido (`retryOf`), así que el historial muestra
  la familia fallida aparte aunque ya haya otra lista; no hay pausa para revisar el brief antes de maquetar;
  no hay enlace de vista previa para el cliente sin la contraseña del equipo; filas del historial con 3-4
  botones cada una.
- Propuesta entregada al usuario; pendiente de que elija.

### 2026-10-01 (continuación) — Interfaz: puntos 1-4 de la tercera lista

- **Elegidos por el usuario.** Solo Studio (web + servidor); worker, motor y agentes 00-09 sin tocar.
- **1. Píldora de la cabecera:** `.status-pill` pasa de `inline-flex` a `inline-block` con el punto `inline-block`:
  a 375 px el texto termina en "…" y el punto queda redondo (8 px).
- **2. Vista previa en móvil:** `readPreviewView` abre en Móvil si la pantalla mide ≤ 600 px y no hay vista
  guardada; una elección guardada (también Escritorio) se respeta.
- **3. Reintentar con el brief ya escrito:** nueva ruta `POST /api/jobs/:id/retry` (fallido/cancelado/bloqueado;
  409 si la versión de partida de un cambio/adaptación ya no tiene HTML). Copia el `input`; si venía de
  instrucción y ya hay `briefText`, marca `briefReused` → `needsBrief` falso, el worker recibe el encargo directo
  y `jobKind` = `brief` (estimación de prompt completo). La web llama a esta ruta en vez de recrear el trabajo.
- **4. Reintento enlazado:** `retryOf` cuenta como padre en `versionFamily` y en el historial (tipo «Reintento»);
  el fallido queda plegado bajo su reintento y no ofrece otro «Reintentar». La página del fallido muestra
  "Ya se reintentó: ver el reintento (estado)" (`retriedBy` en `GET /api/jobs/:id`). Los fallidos antiguos sin
  `retryOf` no se enlazan.
- **Verificación:** copia aislada con Chrome del panel: 375 px sin desborde; reintento de Lacoste fallida con
  brief → versión 2 «Reintento», aviso, texto de cola correcto; claim simulado del worker → `prompt` con el
  brief, sin `briefPrompt`, `expectedSec` 1200. Test nuevo `studio/server/retry.test.js`. `npm test` 148/148.
- **Desplegado (con permiso del usuario):** `71d8f0e` → Vercel (3 archivos idénticos al local) y Railway SUCCESS
  15:56. El worker no cambia.
- **"CRASHED" del despliegue anterior = falsa alarma (logs revisados):** `0938bf57` arrancó el 30-09 a las 12:50 y
  sirvió peticiones sin interrupción hasta el 01-10 a las 15:57, cuando Railway lo paró al activar `71d8f0e`
  (SIGTERM). `npx` sale con error ante SIGTERM y Railway lo etiqueta como CRASHED. Sin caída de servicio.

### 2026-10-01 (continuación) — Studio se apaga limpio en cada despliegue

- **Aprobado por el usuario** tras revisar el falso CRASHED. `studio/Dockerfile`: `CMD ["node", "--import", "tsx", …]`
  (antes `npx tsx`: npm moría por el SIGTERM). `studio/server/index.ts`: con SIGTERM/SIGINT deja de aceptar
  conexiones, cierra las inactivas, espera las peticiones en curso y sale con 0 (forzado a los 5 s).
- **Verificación:** copia aislada arrancada como en el contenedor (`node --import tsx`), SIGTERM con una conexión
  keep-alive abierta → "cerrando… / cerrado", exit 0. `npm test` 148/148. El despliegue que se sustituye esta vez
  aún tiene el arranque viejo (puede salir CRASHED una última vez); desde el siguiente, REMOVED.

### 2026-10-01 (continuación) — Interfaz 5 y 6: revisar el brief y enlace para el cliente

- **Elegidos por el usuario.** Studio (web, servidor y worker); motor y agentes 00-09 sin tocar.
- **5. Revisar el brief:** casilla en "Instrucción rápida" (`reviewBrief`, recordada). Estado nuevo `review`
  ("Brief por revisar"): el worker manda `canPause: true` con el brief y, si se pidió revisión, Studio responde
  `{ pause: true }` y el worker pasa al siguiente (la carpeta con brief.md se queda). Un worker antiguo (sin
  `canPause`) sigue como siempre. `POST /api/jobs/:id/brief-approve` (tal cual o editado, mínimo 50 caracteres)
  → vuelve a la cola con `briefReused` (sin paso de brief, estimación de prompt completo). Panel en la página
  del trabajo con el brief editable (el sondeo no pisa lo escrito), "Deshacer mis cambios", cancelar,
  aviso del navegador, color en el icono de la pestaña, filtro "En curso" y no se puede archivar mientras espera.
- **6. Enlace para el cliente:** `studio/server/share.ts`. `POST/DELETE /api/jobs/:id/share` (con contraseña) y
  `GET /p/:token` público (antes del Basic Auth; reescrito en `vercel.json`). Token de 24 bytes, uno por versión
  (se reutiliza mientras esté activo), caduca a los 14 días, se desactiva desde la página; cuenta visitas (máx.
  1/min). Página propia: asunto y preheader, Escritorio/Móvil (Móvil en teléfonos), pieza en marco `srcdoc` sin
  scripts y CSP con nonce que el marco hereda, noindex, sin Referer, sin caché. Bloque "Enseñarla al cliente" en
  "Llevarla a tu plataforma". No muestra brief, registro ni otras versiones.
- **Verificación (copia aislada):** circuito del brief con worker simulado (pausa, claim no lo recoge, aprobar
  corto → 400, editado → cola, segundo aprobar → 409, claim → encargo con el brief editado y 1200 s; worker
  antiguo → encargo directo); panel en la web con edición que sobrevive al sondeo. Enlace: con contraseña activa,
  `/p/…` 200 y `/api` 401; token falso 404; visitas contadas; desactivado → "ya no está disponible"; móvil 375 px
  sin desbordes. Tests nuevos `share.test.js`; `npm test` 149/149.
- **Desplegado (con permiso del usuario):** `4d3a28d` → Railway SUCCESS 16:13 (el despliegue sustituido salió
  REMOVED, no CRASHED: el apagado limpio funciona), Vercel (3 archivos idénticos; `/p/…` responde a través de
  Vercel) y worker reiniciado con el trabajo libre, conectado sin errores. **Pendiente:** primer uso real de la
  revisión del brief y del enlace para el cliente.

### 2026-10-01 (continuación) — Interfaz 7 y 8: menú "⋯" en el historial y versiones en móvil

- **Elegidos por el usuario.** Solo la web de Studio.
- **7. Historial:** a la vista solo Ver + Descargar (o Reintentar); "Reutilizar la petición" y "Archivar"/"Recuperar
  del archivo" pasan a un menú "⋯" (`<details>`). Uno abierto a la vez (se gestiona con el clic: con el evento
  `toggle`, dos clics seguidos dejaban dos abiertos y uno tapaba al otro), se cierra al pulsar fuera, con Escape
  (el foco vuelve al botón) o al elegir; sobrevive al repintado del historial. Fondo opaco; en móvil se abre hacia
  la derecha (alineado a la derecha se salía 33 px por la izquierda a 375 px).
- **8. Versiones:** número a la izquierda y descripción en su columna (`grid`); "esta" pasa a etiqueta. A 375 px
  la descripción se parte alineada y la etiqueta ya no queda suelta.
- **Verificación (copia aislada):** 800 y 375 px, clics reales (exclusividad, fuera, Escape, Archivar desde el
  menú en móvil), sin desborde horizontal. `npm test` 149/149.
- **Desplegado (con permiso del usuario):** `cb2cc1a` → Vercel (3 archivos idénticos al local) y Railway (sin cambios
  de servidor). Worker sin cambios.

### 2026-10-01 — Punto 9 ("Enviarme una prueba" por correo): aparcado por el usuario

- No se ha escrito código. Si se retoma, decidir antes: proveedor (propuesto Resend por HTTPS, sin dependencias;
  alternativa SMTP con nodemailer) y a quién se permite enviar (propuesto: solo dominios del equipo, en una
  variable de entorno). La API key la pone el usuario en Railway.

### 2026-10-01 — Comparativa con Migma (y Knak para aprobaciones): solo análisis

- Referente elegido: **Migma** (IA de instrucción/web → email completo de marca, chat + editor visual, Email
  Preflight por cliente, exportación a ESPs); **Knak** como referente de revisión/aprobación. Análisis con páginas y
  documentación públicas (sin cuenta). Nada cambiado en el código.
- Huecos propuestos por prioridad: (1) revisión del cliente en el enlace `/p/` con comentarios anclados y
  Aprobar / Pedir cambios que alimente "Pedir cambios"; (2) editar enlaces e imágenes sin Hermes (ampliar "Editar
  texto"); (3) nombre/asunto de cada newsletter en el historial y renombrar; (4) ficha de marca visible en Studio
  (solo lectura: editarla saltaría al agente 02); (5) preflight presentado por cliente (Outlook/Gmail/Apple
  Mail/móvil) con enlace compartible; (6) aviso a Slack; (7) variantes, asuntos alternativos, "usar como referencia",
  selección por área. Pendiente de que el usuario elija.

### 2026-10-01 (continuación) — Comparativa Migma/Knak: puntos 1, 2 y 3

- **Elegidos por el usuario.** Studio (web y servidor); worker, motor y agentes 00-09 sin tocar.
- **1. Revisión del cliente en su enlace** (`share.ts`): la página `/p/<token>` permite comentar señalando en la
  pieza (mismo `pick.js` que Studio, incrustado porque en Railway la web está tras la contraseña) o en general, y
  "Aprobar" / "Pedir cambios" (este exige un comentario o una nota). Rutas públicas `POST /p/:token/comments` y
  `/decision` con límite por IP (40/10 min), máximo 100 comentarios y textos acotados; CSP con `connect-src 'self'`;
  estado en JSON sin `<` literal. En Studio, pestaña "Cliente" (decisión, comentarios con "Ver" en la pieza y
  "Resuelto", refresco cada minuto) y "Pasar los comentarios a Hermes" → abre "Pedir cambios" con las referencias
  y marca lo señalado. "Pasar el enlace del cliente a esta versión" (`/share/move-here`): misma URL, comentarios
  conservados (por versión), decisión borrada. El historial muestra "Cliente: aprobada / pide cambios / N comentarios".
  Todo queda en el registro de Hermes del trabajo. En móvil, acceso "Aprobar o comentar ↓".
- **2. Enlaces e imágenes sin Hermes** (`textEdit.ts`, "Editar texto"): lista de destinos (uno por URL distinta,
  marca los rotos según la revisión) que cambia todos los `<a>` con ese destino y el `href` del VML de Outlook;
  imagen nueva por URL https o archivo PNG/JPG/GIF/WebP ≤ 3 MB, que se publica en `/assets` al guardar. Si cambian
  enlaces o imágenes, la ruta ejecuta `runQualityCheck` antes de responder (unos segundos). Parser JSON propio de
  12 MB solo para `/text-edit`. Ruta asíncrona con errores capturados (Express 4).
- **3. Nombre de cada newsletter:** el historial (lista y galería) muestra el nombre del equipo o, si no hay, el asunto
  (`cachedSubject`, en caché por ruta); el buscador lo incluye. "Renombrar" en la página del trabajo
  (`/api/jobs/:id/rename`, guardado en la versión raíz: vale para toda la familia).
- **Verificación (copia aislada, Chrome del panel):** nombres en el historial y renombrar; cambio de enlace y de imagen
  por URL → versión 3 con enlaces/imágenes comprobados de verdad; imagen subida → `/assets/...png` 200 y sin `data:`
  en el HTML; cliente: señalar imagen + comentario + "Pedir cambios" con nota, pestaña Cliente, pasar a Hermes, pasar
  el enlace a la v3 (misma URL, imagen nueva, comentario plegado), aprobar; validaciones (sin nombre, vacío, cambios
  sin nada, token falso 404, `<script>` como texto); 375 px. Tests nuevos `textEditLinks.test.js` y ampliado
  `share.test.js`; `npm test` 152/152.
- **Desplegado (con permiso del usuario):** `be26f6c` → Railway SUCCESS 17:33 (el sustituido, REMOVED), Vercel (3 archivos
  idénticos tras unos segundos de propagación). En producción, `/p/<token falso>` y `POST …/comments` responden "ya no
  está disponible" por Railway y por Vercel; `/api` sigue pidiendo contraseña. Worker sin cambios. **Pendiente:** primer
  uso real con un cliente (comentar, aprobar, pasar a Hermes, pasar el enlace a la versión nueva).

### 2026-10-01 (continuación) — Comparativa Migma: puntos 4 (ficha de marca) y 5 (revisión por programa)

- **Elegidos por el usuario.** Studio (web, servidor y worker); motor y agentes 00-09 sin tocar.
- **4. Ficha de marca** (`?brand=<marca>`, solo lectura): la resume el WORKER desde el Mac (`studio/worker/brandCard.ts`),
  porque el brand pack que usa Hermes vive allí y la copia de Railway puede estar desfasada (el arranque no sobrescribe).
  Con el worker libre, como mucho cada 10 min: `POST /api/worker/brand-cards/known` (huellas) → envía solo las que
  cambian (`/api/worker/brand-cards`, lotes de 6) → `studio/data/brand-cards/<marca>.json` (`brandCards.ts`, tamaños
  acotados, logo como data URI ≤ 150 KB). `GET /api/brands/:slug` (ficha + una línea por newsletter de la marca).
  Muestra colores (agrupados por valor), tipografía, botón de muestra, tono de voz con ejemplos, fotografía, iconos,
  modo oscuro, procedencia ("medido en <web> el <fecha>") y archivos. Enlaces: "Ficha de marca de X" en cada trabajo y
  "Ver ficha" en el formulario. **El aviso del formulario ya no miente**: decía siempre "usará sus colores, tipografías y
  logos", pero solo 18 de 34 marcas tienen brand pack; ahora distingue con brand pack / solo logos / nada.
- **Hallazgo y arreglo de paso (worker):** 4 "imágenes" de `brands/*/design-input` eran páginas de error guardadas al
  fallar una descarga (el logo principal de **Prozis** `prozis-logo.svg`, `logo-veci-claim.svg` de El Corte Inglés
  "Access Denied", una de Supreme y otra de Volkswagen) y 6 tenían la extensión cambiada (logos de Toyota JPEG como
  .png, fotos de Adeslas WebP como .jpg). El worker se las listaba a Hermes como logos/fotos. Ahora `imageKind()` mira
  los bytes: las rotas ya no se le ofrecen (se le dice que no las use) y de las otras se le avisa; la ficha las señala.
  **Pendiente del usuario:** volver a descargar el logo de Prozis y el de VECI (y las otras dos), o borrarlos.
- **5. Revisión por programa de correo** (`clientMatrix.ts`, un solo reparto para Studio y el informe): Outlook de
  escritorio (check outlook), Gmail (peso; nota: ignora el modo oscuro de la pieza), Apple Mail (modo oscuro), Móvil
  (medición 375 px) y Todos (resto, también comprobaciones futuras). En "Revisión", selector "Por programa / Por
  comprobación" (recordado), solo errores y avisos a la vista, "Ver" en la pieza, "Copiar como texto" y "Compartir
  informe": enlace público `/r/<token>` propio (`report.ts`, 14 días, desactivable, sin scripts, noindex; rewrite en
  `vercel.json`), distinto del enlace del cliente. Avisa de que son comprobaciones del código, no capturas por programa.
- **Verificación (copia aislada):** sincronización simulada con las 34 fichas reales (1.ª vez 34, 2.ª 0; sin token 401);
  fichas de Nike, El Corte Inglés (sin brand pack, logo real) y Prozis (logo roto señalado, logo blanco sobre oscuro);
  aviso del formulario; revisión de la newsletter real de Puma (24-09) con Apple Mail en error por modo oscuro; texto
  copiado; informe público y desactivado; 375 px sin desborde. Tests nuevos `clientMatrix.test.js` y `brandCard.test.js`
  (contra los brand packs reales); `npm test` 155/155.
- **Desplegado (con permiso del usuario):** `01e442f` → Railway SUCCESS 17:59 (el sustituido, REMOVED), Vercel (3 archivos
  idénticos; `/r/` responde por Railway y por Vercel, `/api/brands/:slug` pide contraseña) y worker reiniciado con el
  trabajo libre: a las 18:01 envió a producción las 34 fichas de marca.

### 2026-10-02 — Norma: el logo del pie es exactamente el de la cabecera

- **Pedida por el usuario:** "que los logos siempre coincidan arriba y abajo, que sean exactamente el mismo". Elegido:
  mismo archivo y mismo tamaño; el logo del pie es opcional (solo se compara si lo hay).
- **Por qué:** las 12 newsletters de Hermes con logo en el pie (de 15) lo encogían (Nike 120→96 px, Lacoste 190→120,
  Inglesina 148→118, Puma, ECI, Helly Hansen, Talaria, Adidas) y las 2 de Adidas además cambiaban de archivo (negro
  arriba, blanco abajo). Adeslas y Prozis no llevan logo abajo.
- **Encargo a Hermes** (`standalone.ts`, `LOGO_RULE`): mismo archivo, misma versión de color y mismos width/height;
  nada de encogerlo ni pasar a la versión blanca en un pie oscuro (fondo donde se lea, o sin logo); en modo oscuro,
  el cambio de versión es igual arriba y abajo. En "Pedir cambios", además, se iguala aunque no se pida (a diferencia
  de modo oscuro y Outlook, no se trata como heredado: las piezas actuales lo corregirán en su próxima revisión).
- **Control de calidad** (`qualityCheck.ts`, `logoMatchCheck`, id `logo-match`, "Logo arriba y abajo", en "Todos los
  programas"): error si el logo del pie es otro archivo, otro tamaño (estilo en línea, si no atributo; "auto" = sin
  alto) o le faltan/sobran variantes de modo oscuro (clase con "dark" o display:none). Detección: "logo" en src, clase
  o id; sin esa pista (publicada, Studio renombra a `img-<hash>.png`), la primera imagen pequeña cuyo src o alt se
  repite abajo. Se devuelve a Hermes (con pauta propia en el mensaje de corrección) y se comprueba al guardar "Editar".
  Contra las piezas reales: las 12 con logo en el pie, en error; Adeslas "el pie no lleva logo", Prozis y Lacoste fallida "sin logo detectado".
- **Pipeline:** norma escrita en `agents/04-email-designer.md` (validaciones) y `agents/08-qa-specialist.md`
  (checklist; error alto). El `footer.html` del motor no lleva logo (solo `footer.brandName`): se cumple sin tocarlo.
  Motor íntegro (68 archivos). Tests nuevos en `qualityCheck.test.js`; `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `e15746d` → Railway SUCCESS 10:09 y worker reiniciado sin trabajo en curso
  (el check corre en el worker). Vercel sin cambios (la web no cambia).

### 2026-10-02 — Interfaz: identidad de feebbodigital.com, puntos 1-5 (nueva extracción)

- **Extracción:** la web es un Webflow de una sola página (`css/feebo-digital-site.webflow.css`, 488 reglas); 14
  secciones medidas con `getComputedStyle`. Pendientes de decidir (no hechos): título de sección numerado, lista
  numerada, desplegable numerado, fila de cifras, tarjeta con icono y número, h3 rosa, secciones claras, menú
  lateral, raíl vertical, iconos en cuadrado blanco, círculos decorativos.
- **1. Botones:** la web nunca rellena un botón de rosa en reposo. `.btn-primary` pasa a azul `--button` con borde
  rosa y se rellena de rosa al pasar (texto `--on-accent`); `.btn-secondary` pasa a `#5867F1` (`--btn-hover`) al
  pasar. Deshace "rosa relleno solo para la acción principal" de la crítica del 30-09.
- **2. Tarjetas:** `.card` con el `.item` de la web: degradado 156° `rgba(16,40,125,.8)`→`.2` sobre `#0A1258`
  (`--card-base`), sin borde (`--card-border`; en claro, el borde de siempre) y 22 px (`--radius-card`).
- **3. Etiquetas:** títulos de sección (`.eyebrow`, `.action-title`, `.review-head h3`, `.brand-section h3`) en
  Barlow 14 px/600, 5 px de espaciado y rosa `--accent-text` (3 px en móvil); las secundarias (asunto/preheader,
  grupos de comparación, etiquetas de la vista previa) a 13 px y 4 px en `--pink-soft`. Columna de etiqueta del
  asunto: 90 → 124 px.
- **4. Texto corrido a 18 px** (`--fs-prose`, interlínea 1.6): notas y brief (`.md`, encabezados 22/20/18),
  "¿Cómo funciona?" y el resumen del fallo. Los controles siguen a 14 px.
- **5. Pie** como `.footer-feebbo`: negro a todo el ancho (también en tema claro), logo, copyright gris a 12 px y
  columnas Correo / Web (etiqueta blanca en negrita, dato debajo).
- **Verificación (copia aislada, con la Nike real):** portada, trabajo terminado (acciones, revisión, notas,
  asunto) en oscuro, claro y 375 px sin desbordes; botón principal al pasar = rosa con texto azul.
- **Desplegado (con permiso del usuario):** `82f9b64` → Vercel (styles.css e index.html idénticos a los locales) y
  Railway SUCCESS 12:25. Worker sin reiniciar (no cambia): siguió con las correcciones de logos.

### 2026-10-02 — Interfaz: componentes de feebbodigital.com, puntos 6-9

- **6. Título de sección numerado** (`.section-title`): "01" de 88 px en `--section-num` (#1A2168; #DFE2F3 en
  claro) detrás y el título en rosa de 28 px encima. "01 Nueva newsletter" sobre el formulario y "02 Historial"
  (sustituye a la etiqueta "Historial"). El número va en absoluto y el título ocupa su sitio (en móvil se montaba
  sobre "5 newsletters" con el título en absoluto).
- **7. Lista numerada**: "¿Cómo funciona?" (01-05 en rosa, texto en claro) y la lista de "Aprobar para envío".
- **8. Desplegable numerado**: revisión "Por comprobación" con número rosa de 22 px, título a 16 px y filas más
  altas (`.check-num`, añadido en `renderReview`).
- **9. Fila de cifras** (`#history-stats`, `renderHistoryStats`): newsletters, en curso y aprobadas (familias, no
  versiones) de lo que está a la vista; cada cifra pulsa el chip de estado correspondiente y se marca activa.
- **Verificación (copia aislada, Nike real + 4 trabajos de prueba):** oscuro, claro y 375 px sin desbordes; la
  cifra "aprobada" deja 1 newsletter y "newsletters" vuelve a las 5.
- **Desplegado (con permiso del usuario):** `8c8b9af` → Vercel (styles.css, index.html y app.js idénticos) y
  Railway SUCCESS 12:31. Worker sin reiniciar.

### 2026-10-02 — Interfaz: componentes de feebbodigital.com, puntos 10-13

- **10. Tarjeta con icono y número:** las tres de "Cambiar la pieza" (Editar texto, Pedir cambios, Adaptar a
  móvil) llevan icono rosa en línea (SVG) arriba a la izquierda y 01-03 a la derecha (`.action-top`). En móvil,
  icono centrado y sin número. El selector de la descripción pasa a `.action-item > span:not(.action-top)`.
- **11. Título de nivel 3 en rosa** (`.panel-title`, 28 px/700; 22 px en móvil): "Aprobar para envío", "Editar el
  texto" y "El brief está listo…".
- **12. Sección clara dentro del tema oscuro** (`.surface-light`, fondo #EDF3FC; #F9F9FB en tema claro): redefine
  los tokens dentro del bloque (texto #14183F, rosa oscuro #9C1F9A legible sobre claro). En "¿Cómo funciona?" y en
  las notas de Hermes (`#notes-text`), lo que se lee como documento.
- **13. Menú lateral con hamburguesa** (`#menu-btn`, `#side-menu`): panel #14183F a la derecha (oscuro también en
  claro) con 01 Nueva newsletter, 02 Historial, 03 Cómo funciona y el contacto (Correo, Web). Desde un trabajo
  vuelve a la portada con el aviso de cambios sin guardar; se cierra con ×, Escape o el fondo.
- **Verificación (copia aislada):** escritorio y 375 px sin desbordes (la cabecera cabe con la hamburguesa); menú
  desde un trabajo → historial; "Cómo funciona" abre el bloque claro; Escape cierra.
- **Desplegado (con permiso del usuario):** `c345d1d` → Vercel (styles.css, index.html y app.js idénticos) y
  Railway SUCCESS 12:48. Worker sin reiniciar.

### 2026-10-02 — Interfaz: componentes de feebbodigital.com, puntos 14-16

- **14. Raíl vertical** (`.side-rail`, fijo a la izquierda, solo ≥ 1180 px): años "2010 – <año actual>" en vertical
  (Barlow 12 px morado, el año lo pone app.js), línea rosa de 80 px y redes en círculo #14183F (LinkedIn
  `company/feebbo-digital`, X `feebbodigital`, los de la web).
- **15. Cuadrados de icono blancos** (`.integracion-icon` de la web: blanco, 12 px, sombra -2px 8px 11px
  rgba(20,24,63,.2)): miniaturas con iniciales del historial (lista y galería) y logo de la ficha de marca.
- **16. Detalles decorativos:** foto del equipo en círculo con capa azul y trazo fino junto al titular de la
  portada (`studio/web/hero-equipo.jpg`, copia de `brands/feebbo/design-input/feebbo-raid-navy.jpg`, 30 KB; solo
  ≥ 900 px, decorativa con alt vacío) y círculo de trazo fino #CF95D0 al 22 % de fondo (`body::after`, oculto en
  móvil porque cruzaba el texto).
- **Verificación (copia aislada):** 1440 px oscuro, 1000 px claro y 375 px sin desbordes; la foto carga (420 px).
- **Desplegado (con permiso del usuario):** `3d51881` → Vercel (styles.css, index.html, app.js y hero-equipo.jpg
  idénticos) y Railway SUCCESS 13:32. Worker sin reiniciar.

### 2026-10-02 — Logos corregidos en las newsletters existentes

- "Pedir cambios" sobre la última versión de las 10 newsletters con el logo del pie distinto (Nike primero y
  luego Helly Hansen, Lacoste, Adidas, El Corte Inglés, Talaria, 3 de Inglesina y Puma), con el tamaño concreto
  de cada una. Las 10 terminadas con "Logo arriba y abajo" correcto (Adidas pasa al logo negro de la cabecera).
  Puma queda con 1 error de modo oscuro heredado de la original (24-09, anterior a esa regla; en "Pedir cambios"
  no se fuerza). Inglesina emtss3 y rtit5s tardaron 21 y 32 min; el resto, 1-7 min.

### 2026-10-05 — Interfaz: página de la newsletter en dos columnas e identidad Feebbo para el cliente

- **Revisión de la interfaz (solo diagnóstico):** 8 puntos. Elegidos 1 y 2. Pendientes: 3 contador repetido tres
  veces en la portada, 4 menú lateral sin comportamiento de diálogo (foco), 5 cabecera móvil justa (tema al menú),
  6 placeholder a 3,2:1 (→ #7D84A8, 5,1:1), 7 sin estados de carga, 8 titular de portada en dos líneas.
- **1. Dos columnas (≥ 1200 px):** `#job-result` dividido en `.job-side` (acciones y paneles de aprobar, pedir
  cambios y editar texto; primero en el DOM, así en estrecho sigue arriba) y `.job-main` (pestañas y vista
  previa). En ancho: rejilla `1fr 380px`, la página se ensancha a 1440 px solo en esa vista (`body:has(...)`),
  la columna de acciones es `sticky` con scroll propio, sin barra fija de abajo y sin raíl lateral (se montaba).
  En 1440 × 900 la vista previa empieza a 526 px (antes 1.106) y al 100 %; en 1280, al 92 %.
- **2. Página del cliente (`/p/`) e informe (`/r/`) con la identidad de Feebbo:** `server/brandPage.ts` (variables
  de la web, Work Sans y Barlow de Google Fonts, logo en línea leído de `studio/web/feebbo-logo.svg` con los id
  renombrados, cabecera con etiqueta rosa y pie negro con copyright, caducidad y correo). Tema oscuro azul noche,
  tarjetas con el degradado de la web, botones como Studio. Mismas clases (el script del cliente no cambia).
  CSP del informe: añade `style-src https://fonts.googleapis.com` y `font-src https://fonts.gstatic.com`; la del
  cliente ya los permitía. También las páginas de enlace caducado.
- **Verificación (copia aislada):** 1440/1280/1100/375 px; "Pedir cambios" y "Editar texto" en la columna
  derecha; enlace del cliente (comentario enviado), informe y enlace caducado sin errores de consola, fuentes
  cargadas y 375 px sin desbordes. `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `5036897` → Vercel (styles.css e index.html idénticos) y Railway SUCCESS
  09:38. Comprobado en producción: el enlace caducado `/p/` ya sale con fuentes, logo y pie; la CSP de `/r/`
  incluye las fuentes de Google. Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: puntos 3-8 de la revisión

- **3. Contador:** sin filtro, `#history-count` queda vacío (la cifra está en la fila de cifras); con filtro, "1 de 5
  newsletters". El atajo de la portada pasa a "Ir al historial · N en curso ↓" (antes repetía el total).
- **4. Menú lateral como diálogo:** `role="dialog"` y `aria-modal`; al abrirlo, cabecera, `#app`, pie y raíl pasan a
  `inert` (el foco no sale del menú); al cerrarlo vuelve al botón.
- **5. Tema en el menú:** entrada "04 Tema: Auto/Claro/Oscuro" (cambia sin cerrar el menú; usa el botón de la
  cabecera); en ≤ 640 px el botón de la cabecera se oculta y la píldora de estado gana sitio.
- **6. Placeholder:** `--placeholder` #5D6488 → #7D84A8 (3,2 → 5,1:1 sobre el campo); en claro #8A90AB → #6B7194
  (3,2 → 4,8:1 sobre blanco).
- **7. Siluetas de carga** (`.skeleton`, brillo que se para con prefers-reduced-motion): historial en la primera
  carga (`#history-skeleton`, se quita con la respuesta o el error), página de la newsletter hasta el primer
  sondeo (`#job-skeleton`, oculta cabecera, registro y botones finales mientras sale) y ficha de marca.
- **8. Titular de portada en una línea:** el h1 ocupa las dos columnas y la foto (160 px) va a la derecha del texto
  de debajo (necesitaba 779 px y tenía 592).
- **Verificación (copia aislada):** 1280 oscuro y claro, 375 px sin desbordes; conexión lenta simulada (3-4 s)
  para ver las siluetas; menú con Escape devuelve el foco; `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `aa32db9` → Vercel (styles.css, index.html y app.js idénticos) y
  Railway SUCCESS 09:44. Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: móvil de la newsletter, logos en miniaturas y accesibilidad

- **Revisión (solo diagnóstico):** cola y fallo bien resueltos; 3 puntos, los 3 elegidos.
- **1. Newsletter en el móvil (≤ 640 px):** la vista previa empezaba a 1.439 px y al 67 %. Ahora `.job-main` va antes
  que `.job-side` (orden flex), el escenario llega a los bordes de la pantalla (margen -37 px: 16 de `#app` + 20 de
  relleno + 1 de borde de la tarjeta) y el marco de teléfono desaparece: al 100 % y a 745 px. La escala usa el
  relleno real del escenario (antes 32 fijo). La barra fija sale también mientras las acciones están por debajo y
  cambia "↑" por "Más" (lleva a las acciones).
- **2. Logo de la marca en las miniaturas sin imagen:** `/api/jobs` añade `brandLogo` ('light' | 'dark' | null,
  `brandLogoIndex` en brandCards.ts, caché de 1 min) y `GET /api/brands/:slug/logo` sirve el logo de la ficha
  (CSP sandbox + nosniff: puede ser SVG de terceros; ETag con la huella de la ficha). Lista y galería lo ponen
  en el cuadrado blanco (azul noche #14183F si es la versión blanca; la ficha también pasa de #111 a #14183F);
  sin ficha o si no carga, las iniciales.
- **3. Accesibilidad:** id `review-title` repetido (la "Revisión automática" se anunciaba con el título del brief)
  → `auto-review-title`. Zonas táctiles ≥ 24 px: "¿Cómo funciona?" (32), enlaces del pie (+8), radios de imágenes
  (18) y `.toggle` (28). Auditoría tras el cambio: sin id repetidos ni objetivos < 24 px en la portada.
- **Verificación (copia aislada, fichas reales de Nike, Adidas y Adeslas generadas con buildBrandCard):** 375,
  900 y 1440 px; `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `6aa874e` → Vercel (styles.css, index.html y app.js idénticos) y Railway
  SUCCESS 09:57. En producción: `/api/brands/:slug/logo` pide contraseña sin sesión (401) y con sesión responde
  con CSP sandbox. Del historial, tienen logo en la ficha El Corte Inglés, Adidas, Nike, Adeslas, Asics y Prozis
  (versión blanca → cuadrado azul noche); Puma, Inglesina, Talaria, Lacoste y Helly Hansen no tienen logo en su
  ficha y siguen con la inicial.

### 2026-10-05 (continuación) — Interfaz: tableta, fases como pasos y campo de marca

- **Revisión (solo diagnóstico):** tema claro y menú bien; 3 puntos, los 3 elegidos.
- **1. Tableta y portátil pequeño (641-1199 px):** mismo orden que el móvil (vista previa primero, acciones debajo,
  barra fija con "Más"); el escenario a sangre y sin marco sigue solo en ≤ 640. `narrowJob` pasa a 1199 px. A
  1024 × 768 la vista previa empieza a 554 px (antes 1.106).
- **2. Fases como pasos numerados** (`#progress-steps`, `renderProgressSteps`): brief (si se pidió con una frase y
  no se reutiliza), las 4 fases del worker (o las de "Pedir cambios"/"Adaptar a móvil": leer la versión original,
  buscar lo que pide el cambio, aplicar los cambios, revisar) y la revisión automática de Studio, que se marca
  hecha al terminar. Hecho ✓, actual resaltada (`aria-current="step"`), pendiente en gris; si la fase no es
  conocida, por el porcentaje con los tramos del worker (15/45/75 %). En móvil, en columna.
- **3. Campo de marca:** combobox propio (`#brand-suggest`, role listbox, flechas/Intro/Escape, mousedown) en vez
  de `<datalist>`, con el logo de la ficha (`/api/brands` devuelve `logos`) o las iniciales, y las marcas que solo
  están en el historial ("sin carpeta · N en el historial"). El aviso ya no dice "Marca nueva" a medio escribir
  ("¿Quieres decir Nike?", pulsable) y para una marca sin carpeta con newsletters hechas (Puma, Lacoste) dice "Sin
  brand pack ni logos en el Mac, pero ya hay N newsletters de …".
- **Verificación (copia aislada, lista real de 34 marcas y fichas de Nike/Adidas/Adeslas):** 1280, 1024 y 375 px;
  Intro elige sin enviar el formulario; `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `c246dac` → Vercel (styles.css, index.html y app.js idénticos) y Railway
  SUCCESS 10:05. En producción: 37 marcas en la lista, 24 con logo en su ficha; "Nik" → "¿Quieres decir Nike?";
  "Puma" → "Sin brand pack ni logos en el Mac, pero ya hay 1 newsletter de Puma". Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: «Ahora mismo» en la portada y brief con formato

- **Revisión (solo diagnóstico):** pestaña Cliente (con "Ver"), atajos, avisos y peso (476 KB sin comprimir) bien;
  2 puntos, los 2 elegidos.
- **1. «Ahora mismo»** (`#now-strip`, `renderNowStrip`, dentro del hero, a todo el ancho): "Te esperan" (brief por
  revisar, comentarios del cliente sin resolver, el cliente pide cambios) y "En curso" (en marcha con fase y barra;
  en cola), hasta 4 de cada, con el logo de la marca y enlace al trabajo; sin nada, oculta. `/api/jobs` añade
  `stageLabel` de los que están en marcha. Se refresca con el historial (cada 20 s si hay algo en curso). En
  1440 × 900 empieza a 365 px (la primera en marcha estaba a 1.738).
- **2. Brief por revisar con formato** (`#review-brief-view`, `.md surface-light`): el cuadro de edición sale con
  «Corregir el brief» (`setBriefEditing`); al volver a «Ver con formato» se pinta lo corregido. Aprobar sigue
  enviando el texto del cuadro.
- **Verificación (copia aislada):** 1440 oscuro, 375 claro; corregir → ver → deshacer; `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `39ef9a3` → Vercel (styles.css, index.html y app.js idénticos) y Railway
  SUCCESS 10:20. En producción la franja muestra en "Te esperan" la de Helly Hansen ("El cliente pide cambios");
  nada en curso. Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: atender lo que pide el cliente

- **Revisión (solo diagnóstico, siguiendo en producción el caso de Helly Hansen):** "Ver qué pide" abría la pestaña
  Vista previa (la decisión está en Cliente), la pestaña Cliente no avisaba de "pide cambios" (el contador solo
  cuenta comentarios), los enlaces de la franja recargaban la página y la decisión no se podía dar por atendida (solo
  se borraba al pasar el enlace a otra versión: la de Helly Hansen, "prueba test" del 1 oct, se quedaría siempre).
- **1. Enlaces que llevan a lo que hay que mirar:** "Ver comentarios" y "Ver qué pide" llevan a `?job=…&tab=client`
  (`pendingJobTab` en `route`, se aplica en `renderShare` al llegar los datos); navegación sin recarga (pushState +
  `route`, respeta Cmd/Ctrl/Mayús). Aviso "!" en la pestaña Cliente con "pide cambios" sin atender.
- **2. «Marcar como atendido»** (`resolveShareDecision` en share.ts, `POST /api/jobs/:id/share/decision/resolve`,
  con `resolvedAt`/`resolvedBy` en `ShareDecision`): sale de «Te esperan» y del aviso (`/api/jobs` no devuelve la
  decisión atendida), se apunta en el registro y se puede deshacer.
- **Verificación (copia aislada):** franja → pestaña Cliente sin recarga; atender → sin aviso, fuera de la lista,
  en el registro; deshacer → vuelve. `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `12d7272` → Vercel (styles.css y app.js idénticos) y Railway SUCCESS
  10:26. En producción, la de Helly Hansen abre la pestaña Cliente con el aviso "!" y el botón «Marcar como
  atendido» (no se ha pulsado: lo decide el usuario). Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: sin parpadeo de la portada en los enlaces directos

- **Revisión (solo diagnóstico):** ficha de marca real en producción y en móvil, paneles en dos columnas (la columna
  baja sola al panel que se abre) y carga de enlaces directos. Un punto: en `?job=`/`?brand=` el navegador pintaba
  la portada (FCP 448 ms en producción) antes de que app.js cambiara de vista (~511 ms); en móvil, más.
- **Arreglo:** el script del tema en `<head>` añade `html.deep-link` si la URL lleva `job` o `brand`; con esa clase
  se ocultan `.hero` y `#view-form` y sale `#boot-skeleton` (silueta como la del trabajo). `route()` quita la
  clase al decidir la vista.
- **Verificación (copia aislada):** copia de la página sin sus scripts para ver el primer pintado: con `?job=`,
  silueta y sin portada; sin parámetros, portada normal. Con scripts, newsletter y ficha sin restos de la
  silueta. `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `6174f9d` → Vercel (styles.css, index.html y app.js idénticos) y Railway
  SUCCESS 11:09. Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: aviso cuando el historial no carga

- **Revisión (solo diagnóstico):** teclado (foco visible y orden lógico en franja, cifras, menú y raíl) y menos
  movimiento bien. Un punto: con un 5xx o sin red (p. ej. durante un despliegue de Railway) el historial y la
  franja desaparecían sin mensaje, el reintento a los 30 s no se anunciaba y "Ir al historial" apuntaba a la nada.
- **Arreglo:** `#history-error` (role status) con cuenta atrás y «Reintentar ahora» (`showHistoryError` /
  `hideHistoryError`); se quita con la primera carga buena; el atajo se oculta si el historial no está a la vista.
  Sin sesión sigue saliendo solo el aviso de inicio de sesión.
- **Verificación (copia aislada, 500 simulado en /api/jobs):** aviso con cuenta atrás y sin atajo; al reintentar
  con el servidor bien, vuelven historial, franja y atajo. `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `7c99b65` → Vercel (styles.css, index.html y app.js idénticos) y Railway
  SUCCESS 11:14. Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: errores del servidor que se entienden

- **Revisión (solo diagnóstico, fallos del servidor en el resto de pantallas):** la página de la newsletter ya lo
  resolvía ("Sin conexión con Studio: reintentando…"). Dos puntos, los dos elegidos.
- **1. Ficha de marca:** cualquier error que no fuera 401 decía "No se ha encontrado esa marca" (también un 502 de
  despliegue). Ahora 404 → no existe; 5xx o sin red → "Studio no responde ahora…" con «Reintentar» (`brandRetry`).
- **2. Mensaje común `actionError(res, data, fallback, keepsText)`** en las 13 acciones que decían solo "No se
  pudo…": con 5xx o sin respuesta, "… Studio no responde ahora (puede estar actualizándose): lo que has escrito
  sigue aquí, inténtalo en un minuto" (lo del texto solo donde queda en pantalla: formulario, pedir cambios,
  aprobar el brief, guardar edición); 401 y 429 con su explicación; los errores con motivo del servidor (400,
  409…) tal cual.
- **Verificación (copia aislada, 502 y 400 simulados):** formulario (texto conservado), ficha (Reintentar carga la
  ficha), pedir cambios (502 explicado; 400 "Describe qué quieres cambiar." tal cual). `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `703387f` → Vercel (app.js idéntico) y Railway
  2026-10-05 11:20:41 +02:00 (SUCCESS). Worker sin reiniciar.

### 2026-10-05 (continuación) — Interfaz: movimiento y cabecera de feebbodigital.com

- **Nueva revisión de la web (lo que la primera extracción no cubría):** 32 interacciones de Webflow. El logo es un
  Lottie oficial (`documents/Feebbo-logo.json`, 30 KB, 8,6 s) en bucle con autoplay (no va con el scroll: lo dije
  mal al proponerlo); la hamburguesa es otro Lottie (0,67 s) que se convierte en ×; `.navbar` fija; párrafos en
  blanco a 18 px; menú sin oscurecer la página y enlaces que entran escalonados; imágenes que entran al hacer
  scroll. No copiados: carrusel de logos, Lottie del algoritmo, tarjetas en horizontal, titular centrado, WhatsApp.
- **1. Logo animado:** `studio/web/feebbo-logo.json` + `lottie_light.min.js` 5.12.2 de cdnjs (defer, SRI sha512,
  46 KB comprimido). Sustituye a la imagen al cargar; sin reproductor o con menos movimiento, queda la imagen. En
  tema claro, el mismo filtro que la imagen.
- **2. Hamburguesa → ×:** `studio/web/menu-icon.json` en el botón de cerrar del panel (el panel tapa la hamburguesa
  de la cabecera): al abrir se dibuja la × desde las rayas; con menos movimiento, la × directamente.
- **3. Cabecera fija:** `.topbar` sticky con fondo translúcido de lado a lado (`::before`, `--topbar-bg`, blur) al
  bajar (`is-scrolled`); `scroll-padding-top: 80px`; la columna de acciones pasa a `top: 80px`; `body` con
  `overflow-x: clip`.
- **4. Texto:** `.lead` en `--text` (antes lila al 85 %) y titular sin el -0,5 px de espaciado.
- **5. Menú:** sin oscurecer (el fondo sigue recogiendo el clic), panel que entra desde la derecha y enlaces
  escalonados (0,10-0,34 s).
- **6. Entradas al hacer scroll** (`.reveal`, IntersectionObserver): solo títulos de sección, cifras, «Ahora mismo» y
  la foto; nunca vista previa ni formularios; nada con menos movimiento.
- **Verificación (copia aislada):** reproductor y los dos JSON 200; logo y × animados; cabecera fija sin solaparse
  con la columna de acciones; 1280/1440/375 px, oscuro y claro, sin desbordes. `npm test` 159/159.
- **Desplegado (con permiso del usuario):** `474c5fa` → Vercel (styles.css, index.html, app.js, feebbo-logo.json y
  menu-icon.json idénticos) y Railway 2026-10-05 11:31:01 +02:00 (SUCCESS). Worker sin reiniciar.

### 2026-10-05 (tarde) — Interfaz: siete arreglos de la revisión

- **1. «Exportar para»:** el desplegable se estiraba hasta su opción más larga y sobresalía 13 px de la columna de
  acciones (≥1200 px). Ahora ocupa el ancho disponible (`flex: 1 1 0; min-width: 0`).
- **2. Píldora de estado en móvil:** salía cortada («Hermes desconecta…»). En ≤640 px, texto corto con
  `.lbl-long`/`.lbl-short`: «En pausa · 1 en cola», «Conectado», «Nike · 45 %». En ordenador, como antes.
- **3. Campo Marca en móvil:** placeholder «Marca, p. ej. Nike» (el largo salía cortado); cambia con `matchMedia`.
- **4. Ficha en móvil:** sin «Atajos de teclado» en pantallas táctiles o ≤640 px; «Registro de Hermes» oculto
  cuando no tiene líneas (`renderLog`).
- **5. Errores en el historial:** `failure.js` da `short` (una línea) además de `summary`; la fila enseña la corta
  con «Ver por qué» (la frase entera, en `title` y en la ficha). Test nuevo en `failure.test.js`.
- **6. Brief por revisar:** en el historial el botón es «Revisar el brief» (antes «Ver»), como en «Ahora mismo».
- **7. Pestaña Cliente vacía:** aviso con borde discontinuo y botón que copia el enlace del cliente o, si apunta a
  otra versión, lo pasa a esta (`syncClientEmptyShare`, delega en `share-copy`/`share-move`).
- **Verificación (copia aislada):** 1280 y 375 px; desplegable dentro de la columna; píldora sin cortar; error en
  una línea; «Revisar el brief»; botón de Cliente copia el enlace; registro oculto/visible según líneas.
  `npm test` 160/160.
- **Desplegado (con permiso del usuario):** `a7a293f` → Vercel (styles.css, index.html, app.js y failure.js
  idénticos) y Railway 2026-10-05 11:44:23 +02:00 (SUCCESS). Worker sin reiniciar.

### 2026-10-05 (tarde) — Interfaz: el logo animado ya no desborda al empezar

- **Causa:** en el Lottie oficial, «DIGITAL» entra deslizándose (fotogramas 29-38, `Digital Null` x 53,5 → 58,1)
  y sale igual al final del bucle (234-243). Mientras se desliza, asoma unos 4 px a la izquierda del borde de la
  F, por fuera del logo. El resto de fotogramas cabe en el lienzo de 117 × 47.
- **Arreglo:** `.brand-anim svg { clip-path: inset(0 0 0 7.6%) }`, que recorta lo que queda a la izquierda de la
  F (x = 9 de 117). «DIGITAL» parece salir de detrás de esa línea. El JSON oficial no se toca.
- **Verificación (local, 375 px, oscuro):** fotogramas 26, 30, 32, 36, 60, 236 y 240. «DIGITAL» ya no asoma y la
  F y la D del logo completo salen enteras. `npm test` 156/158 en este contenedor: los 2 fallos (logo de Prozis
  en `brandCard.test.js` y E2BIG en `qualityCheck.test.js`) también fallan sin el cambio, son del entorno.
- **Desplegado (con permiso del usuario):** `30fbfa0` → Railway (push a `Javifeebbo/hermes-studio`, estado de GitHub
  «striking-luck - hermes-studio» SUCCESS). **Vercel pendiente:** no tiene integración con GitHub y desde la nube no
  hay CLI con sesión ni red hacia vercel.app; falta `vercel --prod` desde `studio/web` (solo cambia styles.css).
  Worker sin reiniciar.

### 2026-10-05 (tarde) — Interfaz: el logo de la cabecera ya no salta al cargar

- **Lo que veía el usuario (en Railway, tras `30fbfa0`):** «al principio, FEEBBO se va mucho a la izquierda del
  DIGITAL». No era la animación: era la imagen fija que se ve hasta que carga el reproductor. `feebbo-logo.svg` (el
  logo oficial) tiene «DIGITAL» sangrado unos 22 px bajo FEEBBO, y la animación termina con los dos alineados a la
  izquierda. Además, la imagen medía 77 × 28 (32 px de alto; 28 en móvil) y la animación 99 × 40, así que el logo
  cambiaba de tamaño y la cabecera crecía 6 px al sustituirla.
- **Arreglo:** `studio/web/feebbo-logo-anim.svg`, que es el fotograma 100 del Lottie exportado como SVG (13 KB). La
  cabecera lo usa a 99 × 40, el mismo tamaño que la animación, también en móvil (se quita el `height: 28px`). El
  pie y `brandPage.ts` siguen con `feebbo-logo.svg`.
- **Verificación (local):** a 375 px en oscuro y a 1280 px en claro, imagen fija y animación en el mismo sitio
  (99 × 40) y pixel a pixel iguales; cabecera de 68 px en los dos casos. La reproducción real en Chromium,
  fotogramas 0-58 y 215-3, mantiene FEEBBO y DIGITAL alineados. `npm test` 156/158 (los mismos 2 fallos del entorno).
- **Desplegado (con permiso del usuario):** `8586ad3` → Railway (push a `Javifeebbo/hermes-studio`; estado de GitHub
  «striking-luck - hermes-studio» SUCCESS). **Vercel pendiente:** `vercel --prod` desde `studio/web` en el Mac
  (cambian styles.css, index.html y el nuevo feebbo-logo-anim.svg). Worker sin reiniciar.
- **Confirmado por el usuario:** en Railway el logo ya sale bien al cargar (FEEBBO y DIGITAL alineados, sin salto).

### 2026-10-05 (tarde) — Interfaz: tanda de la revisión exhaustiva (fallos 1-9 y mejoras 10-13)

Diagnóstico en local con 12 trabajos de prueba en todos los estados, a 375 y 1280 px, oscuro y claro, más la página
del cliente. El usuario aprobó la tanda recomendada.

- **1. Galería:** «TRABAJANDO · 45 %» y «BRIEF POR REVISAR» se salían de la tarjeta. Ahora tienen menos espaciado y,
  si no caben, pasan a dos líneas.
- **2. Pestañas:** `?tab=compare` y `?tab=meta` abrían la vista previa (solo se miraba el enlace al llegar los datos
  del cliente, antes de que esas pestañas aparezcan). `applyPendingJobTab()` se llama también en `syncJobTabs`, y la
  pestaña elegida se guarda en la dirección (`replaceState`). Elegirla a mano anula la del enlace.
- **3. Cabecera:** solo se ensanchaba (1440 px) en la newsletter terminada, así que el logo saltaba unos 200 px.
  Ahora tiene el mismo ancho en todas las páginas a partir de 1200 px.
- **4.** Sin recuadro de foco en el título de la ficha de marca (`#brand-title:focus`).
- **5.** «Ponerle nombre» ya no se desplaza 12 px (`#job-name-text:empty`).
- **6. Historial:** el servidor mandaba solo los 200 trabajos más recientes, versiones incluidas, sin avisar. Ahora
  el tope es `HISTORY_LIMIT = 2000` y, si se alcanza, el contador lo dice (`truncated`, `limit`).
- **7. Fallos sin patrón conocido:** antes decían «No se pudo terminar la newsletter» y debajo «Hermes no pudo
  terminar la newsletter.», con el motivo plegado. Ahora citan la primera línea del error (máx. 160 caracteres);
  sin error, «Hermes se paró sin decir por qué.». Test nuevo en `failure.test.js`.
- **8. No era un fallo:** «~25 min» (instrucción rápida, incluye escribir el brief) y «~14 min» (brief ya hecho)
  son medianas reales de cada tipo.
- **9. Progreso:** a partir de 3 min sin acciones ya no se repite «última acción hace…» debajo.
- **10. Móvil, barra fija** (Descargar · Copiar · Cambios · Más): existía, pero no salía al abrir una newsletter
  terminada. Solo se recalculaba cuando la zona de acciones entraba o salía de la pantalla, y al cargar con el
  resultado oculto eso no pasaba. Ahora se calcula al mostrar el resultado.
- **11. Ordenador:** «Cambiar la pieza» va en una fila de tres botones, como en móvil. La columna de acciones pasa
  de 980 px con scroll propio a 687 px, sin scroll.
- **12. Historial en móvil:** «Descargar» pasa al menú «⋯» («Descargar HTML», solo en móvil). Si la fila no tiene
  otro botón, el «⋯» va a la derecha bajo el estado, salvo en las filas en curso.
- **13. Filtro «Por revisar»** (briefs que esperan al equipo). Las tarjetas de cifras se quedan: ya filtraban.
- **14 (de la lista B).** Con nombre del equipo, el nombre es el título y la marca («Nike · cambios») va debajo.
  También en la barra fija.
- **Verificación (local):** las 16 vistas a 375 y 1280 px sin errores de consola ni desborde horizontal; pestañas
  por enlace y al pulsar; barra fija visible en móvil a mitad de la pieza; columna sin scroll a 1280 × 800.
  `npm test` 157/159 (los 2 fallos de siempre del contenedor).
- **Desplegado (con permiso del usuario):** `10cbf76` → Railway (push a `Javifeebbo/hermes-studio`; estado de GitHub
  «striking-luck - hermes-studio» SUCCESS; reinicia el servidor por el tope del historial). **Vercel pendiente:**
  `vercel --prod` desde `studio/web` en el Mac (cambian app.js, styles.css, index.html y failure.js). Worker sin
  reiniciar.

### 2026-10-05 (tarde) — Interfaz: resto de la revisión exhaustiva (15-23)

El usuario pidió «vamos con todas».

- **15. Menú lateral:** sin cortes de línea (`nowrap`, 3,5 px de espaciado). Se añaden «Marcas» y «Atajos de
  teclado»; este solo aparece dentro de una newsletter y con teclado, y sustituye al enlace del pie de cada ficha.
  «Tema» solo sale en móvil, porque en ordenador ya está en la cabecera. La numeración la rehace `renumberMenu()`.
- **16. Página del cliente (`share.ts`):** en móvil, «Aprobar o comentar ↓» queda fijo abajo mientras se ve la pieza
  y desaparece al llegar a la revisión (IntersectionObserver, script con nonce). Bajo el título sale el nombre que
  el equipo puso a la newsletter (`title` de la versión original).
- **17. Enviar una prueba por correo:** `studio/server/mail.ts` (Resend por HTTP, sin dependencias) y
  `POST /api/jobs/:id/test-email`: hasta 5 direcciones, «[Prueba]» delante del asunto, 20 envíos por hora y una
  línea en el registro. Se activa con `RESEND_API_KEY` y `MAIL_FROM` en Railway; `/api/status` devuelve
  `mailEnabled` y, sin las variables, el bloque lo dice y no deja enviar. En la ficha va plegado bajo «Enseñarla al
  cliente» y recuerda las direcciones en el navegador. **Pendiente del usuario:** cuenta en Resend, verificar el
  dominio y poner las dos variables.
- **18. Página «Marcas»** (`?brands=1`, desde el menú; ruta `GET /api/brand-overview`): todas las marcas (fichas,
  carpetas del Mac y newsletters hechas) con su logo, si tienen brand pack, cuántas newsletters y la última. Tiene
  avisos («Sin logo», «N archivos rotos», «N que no son lo que dice»), buscador y filtro «Con avisos». La ficha de
  cada marca enlaza a «Todas las marcas». Las familias se cuentan con una sola lectura del disco (`versionFamily`
  relee todos los trabajos en cada llamada).
- **19. «Hacer una igual para otra marca»** (menú «⋯» del historial y de la ficha): la misma petición con Marca
  vacía. Al elegir la marca nueva, el nombre de la anterior se cambia por el nuevo dentro del texto, palabra
  entera, sin distinguir mayúsculas, con un aviso de cuántas veces.
- **20. Avisos de asunto y preheader:** `studio/web/metacheck.js` (+5 tests). Avisa del preheader que repite o
  contiene el asunto (el caso real de Nike), falta o es corto (< 35), y del asunto que se corta en móvil (dice
  dónde). Salen en «Asunto y bandeja» y los avisos serios se cuentan en la pestaña.
- **21. «Resaltar cambios»:** sin preferencia guardada, solo se activa con ≤ 12 cambios respecto a la versión de
  la que sale. Si se toca a mano, se respeta lo elegido.
- **22. «Archivar»** pasa del botón grande del pie al menú «⋯», junto a «Hacer una igual para otra marca».
- **23. «Atajos de teclado»** pasa al menú lateral (ver 15). La tecla «?» sigue funcionando.
- **Verificación (local):** menú (portada y ficha), Marcas a 1280 y 375 px, filtro de avisos, «Asunto y bandeja»
  con el aviso de Nike, envío de prueba (dirección mala → 400; sin salida a Resend desde el contenedor → mensaje
  de error claro), página del cliente en móvil con el botón fijo, «otra marca» (Lacoste → Puma en el texto).
  `npm test` 162/164 (los 2 fallos de siempre del contenedor).

### 2026-10-05 (tarde) — Studio: retirado el pipeline de 9 fases (punto 24)

- **Por qué:** la web ya solo crea trabajos con Hermes (`mode: "standalone"`). El pipeline propio de Studio (fases
  con Anthropic/OpenAI en Railway) solo se podía usar por API con `PIPELINE_ENABLED=true` y era código muerto.
- **Borrado:** `studio/server/runner.ts`, `queue.ts`, `phases/` (6 archivos), `llmClient.ts` y
  `util/fileBlocks.ts`. Se recortan `heroImage.ts` (queda `toPublicAssetUrl`, que usa standalone.ts) y
  `campaignFs.ts` (queda `slugify`). `index.ts` ya no tiene `PIPELINE_ENABLED` ni la cola: un `POST /api/jobs` sin
  `mode: "standalone"` da 400. README y `studio/.env.example` ya no piden `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` ni
  `LLM_*`. Se actualizan los comentarios de `scripts/lib/sanitize-hero-prompt.*`.
- **No cambia:** `agents/`, `engine/`, el worker ni los datos guardados (el estado «Bloqueada» sigue en `store.ts`
  y en la web para los trabajos antiguos). La dependencia `@anthropic-ai/sdk` sigue en package.json: ya no la usa
  Studio, pero quitarla toca el lockfile y queda para otro momento.
- **Verificación:** tipos sin errores nuevos; el servidor arranca; `POST /api/jobs` sin modo → 400 y standalone →
  201; las 16 vistas sin errores de consola ni desbordes; `npm test` 162/164 (los 2 de siempre del contenedor).
- **Desplegado (con permiso del usuario):** `d48f773` + `d88727d` → Railway (push a `Javifeebbo/hermes-studio`;
  estado de GitHub «striking-luck - hermes-studio» SUCCESS). **Vercel pendiente:** `vercel --prod` desde
  `studio/web` en el Mac (cambian app.js, styles.css, index.html y el nuevo metacheck.js). **Pendiente del
  usuario:** `RESEND_API_KEY` y `MAIL_FROM` en Railway para la prueba por correo; puede quitar `OPENAI_API_KEY` y
  `ANTHROPIC_API_KEY` de Railway, que Studio ya no usa. Worker sin reiniciar.

### 2026-10-05 (tarde) — Newsletters genéricas (Siroko): identidad, espacios y mercado en el encargo y en el control

- **Diagnóstico (HTML de Siroko `muv71xeq-q5pxw1`, renderizado a 700 y 375 px):** todo en `Arial, Helvetica,
  sans-serif`; grises neutros (#111/#555/#8a8a8a/#f7f7f7) y un rojo #e4002b sin origen; la misma secuencia «imagen a
  todo el ancho + titular + texto» tres veces; texto pegado a la foto (celdas con `padding:0 48px 40px`, 0–1 px
  medidos); a 375 px, 48 px de laterales porque la clase `.pad` de la media query no se aplica a ninguna celda;
  botón de móvil que se sale del margen; precios en USD y enlaces a siroko.land en una pieza en castellano.
- **Causas en nuestro código:** (1) la regla de Outlook del encargo decía «tipografías con alternativa genérica
  (p. ej. Arial, sans-serif)» y Hermes ponía Arial sin más; las piezas anteriores sí llevaban fuente de marca
  (Montserrat, Work Sans, Toyota Type…). (2) El brief se pide en destino standalone y la skill
  newsletter-creative-brief omite en standalone la nota del brand pack (colores, tipografía, voz, foto), con
  «investigación ligera». (3) El encargo tenía unas 40 líneas técnicas y ninguna de diseño. (4) El control de
  calidad no medía nada de esto.
- **Cambios:**
  - `buildHermesPrompt`: nuevas reglas `DESIGN_RULES`. Identidad obligatoria: fuente de la marca cargada con
    <link>/@import y primera en cada font-family, Arial solo detrás; colores medidos en la web o el brand pack;
    el brand pack manda si existe. Maquetación: al menos 32 px entre foto y texto, laterales de 20–24 px a 375 px
    con la clase realmente aplicada, botones alineados, al menos un módulo propio del concepto y no copiar la
    estructura de otras newsletters. Mercado: euros y web española. La regla de Outlook pasa a «fuente de la marca
    con un respaldo genérico DETRÁS». `notas.md` pide tipografía, colores y su origen, y el módulo propio.
  - `buildBriefPrompt`: la identidad se mide de verdad en la web oficial (la investigación ligera queda solo para
    el contenido). Sección «Identidad de marca» obligatoria aunque el destino sea standalone; esto manda sobre la
    skill. Pide al menos una escena con un módulo propio del concepto, y euros y web española.
  - `qualityCheck.ts`: `typographyCheck` da error si en ningún font-family la primera fuente es de marca (lo que
    va dentro de <!--[if mso]> no cuenta; Helvetica Neue y Roboto cuentan como de marca). `layoutFindings` y la
    opción `layoutProblems` añaden el check «Espacios y márgenes».
  - `hermes-worker.ts`: `layoutProblems()` renderiza a 700 y 375 px (texto a menos de 16 px de una foto de más de
    60 px en la misma columna; mediana de laterales > 32 px). Los errores vuelven a Hermes en las rondas de calidad,
    con pautas nuevas. En «Pedir cambios» y «Adaptar a móvil» no se fuerzan; la tipografía heredada de la original
    tampoco.
- **Verificación:** la medición sobre el HTML real de Siroko da los 3 textos pegados y 48 px de laterales; la misma
  pieza con padding arriba y `.pad` aplicada no da ningún aviso. +4 tests (Arial de Siroko → error, Helvetica Neue y
  @font-face → ok, hallazgos de espacios, check en el informe). `npm test` 166/168 (los 2 de siempre del
  contenedor). El navegador del contenedor no coincide con la versión de Playwright del proyecto: la medición se
  probó con el mismo código en el Chromium del contenedor.
- **Pendiente:** brand pack de Siroko (`brands/siroko/` no existe; hay que hacerlo con Hermes en el Mac, que tiene
  red). Desplegar: Railway (encargo) y reiniciar el worker del Mac (control de calidad).
- **Desplegado (con permiso del usuario):** `6cc97a2` → Railway (push a `Javifeebbo/hermes-studio`; estado de GitHub
  SUCCESS): el encargo y el brief ya llevan las reglas nuevas. **Pendiente del usuario:** `git pull` en el Mac y
  `studio/worker/service.sh restart` para el control de calidad nuevo; brand pack de Siroko con Hermes. Vercel no
  cambia (sin cambios en la web).

### 2026-10-05 (tarde) — Calvin Klein: sin logo y 48 min. Imágenes locales, logo PNG, correcciones acotadas

- **Diagnóstico (rama `revision-calvin`, trabajo `muvakote-6rubf7`):** se hizo con las reglas anteriores. El brief
  no tiene «Identidad de marca» y la copia del Mac seguía en `43544ac`, sin `6cc97a2`, así que hay que repetir el
  pull y reiniciar el worker.
  - **Logo:** SVG enlazado desde `calvinklein.us/…/CK-logo-Dark.svg`. Gmail y Outlook no muestran SVG, y la web lo
    bloquea fuera de ella. Hero y foto de Sadie, de `media1.calvinklein.com`, que da 403 (Akamai). En el render de
    Hermes salen rotas; lo anotó como «artefacto de red» y entregó. El control solo daba aviso por los 403 y no
    exigía logo.
  - **Tiempo (log del worker):** brief 2 min, primera versión 24 min, ronda de móvil 23 min. El fallo era una celda
    con `width:100%` + 28 px de padding (431 px a 375). En esa ronda Hermes cambió el logo, volvió a investigar las
    imágenes con un navegador remoto, movió el punto de corte y renderizó 4 combinaciones.
  - **Otros:** marca escrita «Calvin Kleins Jeans» (carpeta `calvin-kleins-jeans`) y web de EE. UU.
- **Cambios:**
  - **Encargo (`buildHermesPrompt`):** imágenes SIEMPRE descargadas en la carpeta del trabajo, nunca enlazadas a la
    web o CDN de la marca. Logo obligatorio arriba, en PNG (un SVG se convierte al doble), con alt. «Si una
    imagen no se ve en tu render, la pieza no está terminada». `box-sizing:border-box` en celdas con width:100% y
    padding. El brief pide lo mismo para el logo y las imágenes.
  - **`qualityCheck.ts`:** `logoPresenceCheck` (error sin logo en la cabecera). `emailImagesCheck` (error por
    imagen SVG o enlazada desde fuera; las de Studio, `/assets/…/img-<hash>`, valen). En «Imágenes publicadas», un
    403/429 pasa a error; en enlaces sigue siendo aviso.
  - **Worker:** `SCOPED_FIX` al final de cada ronda de corrección (móvil y calidad): solo lo indicado, cambio
    mínimo, sin volver a investigar ni verificar lo que no se menciona. Pautas para logo e imágenes. En «Pedir
    cambios», logo e imágenes heredados de la original no se fuerzan.
  - **Formulario (`app.js`):** `closeBrand` propone la marca conocida a una o dos letras («Nkie» → Nike, con
    letras cambiadas de sitio) o contenida en lo escrito («Nike España»). Si la marca es nueva, enseña la carpeta
    que se creará para que se vea la errata.
- **Verificación:** sobre el HTML real de Calvin Klein, «Imágenes que se ven en el correo» da error (SVG + 3 imágenes
  enlazadas). Aviso de marca: «Nkie»/«Toyta» → Nike/Toyota; «Calvin Kleins Jeans» → «Se guardará como
  calvin-kleins-jeans». +3 tests; `npm test` 169/171 (los 2 de siempre del contenedor).
- **Desplegado (con permiso del usuario):** `118dba0` → Railway (push a `Javifeebbo/hermes-studio`; estado de GitHub
  SUCCESS): el encargo y el brief ya piden imágenes locales y logo PNG. **Pendiente del usuario:** `git pull` en el
  Mac (seguía en `43544ac`) + `studio/worker/service.sh restart` (control de calidad y rondas acotadas) y
  `vercel --prod` desde `studio/web` (aviso de marca del formulario).

### 2026-10-05 (tarde) — Auditoría de los agentes del flujo real (solo diagnóstico, nada cambiado)

- **Agentes que intervienen hoy en un trabajo de Studio:** brief (Hermes con la skill newsletter-creative-brief),
  maquetador (Hermes con el encargo), correctores (rondas de móvil y de calidad sobre la misma sesión), «Pedir
  cambios», «Adaptar a móvil», inspectores automáticos (móvil, calidad, espacios), vigilantes (bucles, inactividad,
  «continúa») y analista de marca (brand pack; hoy manual, fuera de Studio). Los agentes 00-09 de `agents/` ya no
  intervienen en Studio: solo los usa el motor por línea de comandos.
- **Tiempos conocidos:** Nike con brand pack 9 min (brief 1 min); El Corte Inglés 25 min; Prozis 10-15 min; Calvin
  Klein 48 min (brief 2, primera versión 24, ronda de móvil 23); «Pedir cambios» de Nike 16 min para un recorte.
  Se pierde tiempo sobre todo en: investigar la marca cuando no hay brand pack, las rondas de corrección, que
  retoman una sesión de más de 70 acciones, las llamadas colgadas (8-15 min), los bucles y las skills de ~100 KB.
- **Propuestas (21, numeradas en el chat):**
  - medir el tiempo por fase;
  - base técnica de email ya resuelta;
  - comprobación que Hermes ejecuta antes de entregar;
  - arreglos técnicos automáticos sin Hermes;
  - una sola ronda de corrección, en sesión nueva y corta;
  - ficha de marca medida automáticamente con Playwright en el Mac;
  - brief propio de Studio, corto y sin la skill entera;
  - ayudante de descarga de imágenes;
  - inspectores nuevos (blanco en fotos, contraste, texto pequeño, colores fuera de la paleta, estructura repetida, peso);
  - revisión visual opcional;
  - prueba de un modelo más capaz para la primera versión;
  - decidir qué se hace con `agents/` 00-09.
  Pendiente de que el usuario elija.

### 2026-10-05 (tarde) — Auditoría de agentes: las 17 mejoras aplicadas

- **Medir (13-14).** Nuevo `studio/worker/timeline.ts`. El worker anota cada fase (identidad medida, brief, primera
  versión, comprobación, cada corrección, revisión visual), las esperas al modelo que hubo que cortar y las rondas.
  Lo manda al terminar o al fallar (`timings`), Studio lo guarda (`sanitizeTimings`) y lo enseña en «Tiempo por fase»
  del panel de revisión; el log del worker lleva una línea de resumen. El corte de llamadas colgadas baja de 12 a 8
  min (`HERMES_STALL_MIN`) y el aviso, a 5.
- **Base técnica (3).** `studio/hermes/email-base.html` trae lo técnico resuelto: tabla fantasma y 96 ppp, modo oscuro
  declarado, preheader, media query con `.px`/`.stack`/`.fluid` y baja. Los módulos de ejemplo van en
  `studio/hermes/email-modulos.md`. El encargo pide copiar la base y diseñar dentro, y pierde las reglas técnicas
  que la base ya cumple. El check `placeholders` da error por marcadores sin rellenar.
- **Autocomprobación (4).** `npm run check-newsletter -- <ruta> [--retoque]`, con `check-newsletter.ts` e
  `inspect.ts`: es la misma comprobación que hace el worker. El encargo la pide antes de entregar; «Pedir cambios» y
  «Adaptar a móvil», con `--retoque`.
- **Arreglos automáticos (8).** `autoFix.ts`:
  - metas de modo oscuro, solo si la pieza ya trae sus estilos oscuros;
  - 96 ppp y xmlns;
  - `width` de las imágenes, con su ancho pintado;
  - `box-sizing` en `width:100%` + padding;
  - href de «Darse de baja»;
  - imágenes de más de 600 KB → 1200 px comprimidas.

  Se anotan en `notas.md` («Arreglos automáticos de Studio») y en el registro.
- **Ayudante de imágenes (5).** `npm run fetch-image -- <url> <carpeta> [nombre]`:
  - descarga con cabeceras de navegador; si la web bloquea, con Chromium;
  - comprueba los bytes (una página de error con extensión .jpg no pasa);
  - convierte SVG a PNG al doble;
  - reduce a 1200 px y comprime.
- **Una ronda corta (6-7).** Móvil, espacios y calidad van en una sola ronda (antes, dos bucles seguidos), en una
  sesión nueva de Hermes con la lista de errores, `FIX_GUIDE`, `SCOPED_FIX` y el encargo guardado en
  `_trabajo/encargo.md`. La segunda ronda retoma esa sesión corta, no la de la pieza. En «Adaptar a móvil» solo se
  devuelve el móvil; en «Pedir cambios», nada heredado.
- **Brief propio (1-2).** `buildBriefPrompt` ya no carga la skill. Lleva su método condensado (un concepto, 3-5
  escenas con función, módulo propio, copy) y 8 secciones fijas (concepto, identidad, datos verificados, asunto y
  preheader, escenas, imágenes, prohibido, autoauditoría), con un tope de 1.200 palabras (`BRIEF_MAX_WORDS`).
- **Pedir cambios (9-10).**
  - `isSimpleTextChange` (formcheck.js): si la petición es solo de texto (titular, errata, asunto, enlace…), la caja
    propone «Editar texto».
  - El encargo de revisión pide un solo render de comprobación, `check-newsletter --retoque` y `fetch-image`.
- **Inspectores nuevos (11).** En `renderChecks.ts`, junto con lo que antes estaba en el worker:
  - contraste WCAG: error por debajo de 3:1 en el cuerpo; en pies de foto y pie legal, aviso;
  - texto de menos de 12 px en móvil: error; de 12-13 px, aviso;
  - estructura repetida: error con 3 o más fotos a todo el ancho y ningún módulo en el cuerpo (dos columnas con
    texto o texto sobre color). Ni la banda del cierre ni dos fotos lado a lado cuentan; con la pieza de Siroko salta;
  - colores fuera de la paleta del brand pack o de la identidad medida: aviso;
  - fotos con fondo liso: error por encima del 45 % de su alto; aviso por encima del 30 %;
  - peso de las imágenes: aviso.

  Probados contra 8 piezas buenas del repo: solo dan avisos de contraste en pies, salvo los laterales de móvil, que
  ya existían.
- **Revisión visual (12).** Casilla «Revisión de dirección de arte al final» (`artReview`). Es una sesión nueva con
  capturas a 600 y 375 px: puntúa identidad, concepto, jerarquía, aire y originalidad, retoca lo que baje de 4 y
  escribe `_trabajo/revision-visual.md`.
- **Identidad medida (15).** `measureBrand.ts` (`npm run measure-brand`):
  - cuándo: marcas sin brand pack y sin medición de menos de 90 días;
  - qué web: la del campo nuevo «Web oficial (opcional)» del formulario o las candidatas `www.<marca>.es`,
    `.com/es/`…; comprueba por dominio o título que es la marca;
  - qué mide: titulares, texto (el que va sobre el fondo de la página), botones, paleta por superficie, fuentes de
    Google Fonts y logo de cabecera (SVG o imagen → PNG);
  - dónde lo deja: `brands/<marca>/tokens/identidad-medida.json` y `design-input/logo-medido.png`.

  El brief y el encargo reciben la nota «Identidad de la marca ya medida».
- **Modelo por fase (16).** `HERMES_MODEL_BRIEF`, `_DRAFT` y `_FIX` en el worker: se pasan con `--model` solo si
  `hermes chat --help` lo anuncia. Vacías, todo sigue como siempre. **Pendiente del usuario:** decidir si prueba un
  modelo más capaz para la primera versión.
- **agents/ (17).** `agents/README.md`: los agentes 00-09 son del motor de la terminal y Studio ya no los usa. No se
  archiva nada (se decide si algún día se retira el motor).
- **Verificación:**
  - Studio y worker en una copia aislada con un Hermes falso: identidad medida → brief → primera versión con dos
    fallos → arreglo automático (width) → una ronda en sesión nueva (espacios) → revisión visual → control superado.
    Studio recibió `timings`, `notas.md` con los arreglos y la sesión del borrador con `--model`.
  - `measureBrand` contra una web simulada: Barlow Condensed y Barlow de Google Fonts, botón, paleta y logo SVG →
    PNG de 320×80.
  - `fetch-image`: SVG → PNG 400×100; una foto de 6,9 MB → 242 KB; la página de error se rechaza.
  - Web a 1280 y 375 px sin desbordes.
  - +19 tests (`agents.test.js`, formcheck). `npm test` 188/190 (los 2 de siempre del contenedor). check-engine limpio.
- **Para desplegar:**
  - Railway: encargo, brief y tiempos;
  - Vercel: formulario, tiempos y aviso de texto;
  - en el Mac: `git pull` y `studio/worker/service.sh restart`. No hay dependencias nuevas: playwright y sharp ya
    estaban.
- **Desplegado (con permiso del usuario):** `5b8f869` → Railway (push a `Javifeebbo/hermes-studio`; estado de GitHub
  «striking-luck - hermes-studio» SUCCESS a las 15:52). El brief propio, el encargo con la base técnica y la
  recepción de tiempos ya están en Railway. El check «test» de GitHub falla igual que en los despliegues anteriores.
  **Pendiente del usuario:** `vercel --prod` desde `studio/web` (formulario, tiempos por fase y aviso de «Editar
  texto»), y en el Mac `git pull` + `studio/worker/service.sh restart`. Sin el pull, el encargo pediría
  `npm run check-newsletter` y la base técnica, que aún no existirían en el Mac.

### 2026-10-05 (tarde) — Paredes: el brief se quedaba investigando (presupuesto del brief)

- **Primera prueba real del circuito nuevo** (Paredes, `muvfrjhm-w9rkz2`, 18:00). La identidad se midió en 5 s
  (https://www.paredes.es/es/: Barlow, #ba0c2f #eed3c2 #1c5399, logo descargado). El brief, en cambio, llevaba 62
  acciones y 17 min navegando: no estaba colgado (última acción hacía 5 s). La causa fue mía: la sección 6 del brief
  nuevo pedía «la URL concreta de cada imagen», y el límite de «5 búsquedas» no contaba las acciones del navegador.
- **Cambios:**
  - **Brief:** presupuesto explícito de unos 5 min y unas 25 acciones en total. En imágenes basta la página oficial
    donde está cada una: se descargan al hacer la newsletter.
  - **Worker:** con 35 acciones u 8 min sin `brief.md`, corta el turno una vez y le pide escribirlo ya, sin navegar
    más. Lo avisa en el registro del trabajo.
  - **Web:** la etiqueta del paso 02 ya no habla de «skills».
- **Desplegado (con permiso del usuario):** `ceaac74` → Railway (estado SUCCESS). El trabajo de Paredes en curso lo canceló el usuario. Pendiente: `git pull` + reinicio del worker en el Mac, reintentar Paredes y `vercel --prod` (etiqueta del paso 02).

### 2026-10-05 (noche) — Paredes, tercer intento: terminado (`muvklec9-bd5yhl`)

- **Entregado a las 21:12, sin rondas de corrección:** brief 7 min (20:15-20:22) → espera de la aprobación del brief
  13 min (20:22-20:35) → primera versión 37 min → comprobación de Studio 2 s, limpia. Total visto por el usuario,
  «como una hora»: 57 min, de los que 13 eran la espera de su propia aprobación.
- **Dónde se fueron los 37 min de la primera versión:** logo copiado a los 10 min, fotos descargadas a los 20 min,
  HTML a los 34 min y, después, revisión propia (aire de 12→32 px en la tira de usos, recorte de fondo liso de dos
  fotos, renders a 600/375/oscuro) y `notas.md`. Hermes no estaba colgado: la barra de 96 % «Revisar y corregir» era
  su autorrevisión dentro de la primera versión, no una ronda de Studio.
- **Abierto:** la barra pasa demasiado tiempo en 96 % durante la autorrevisión y da sensación de bloqueo; y la
  espera de aprobación del brief cuenta en el tiempo total de la página.
- **Arreglado (sin desplegar) — la espera de aprobación del brief va aparte:**
  - servidor: `briefReadyAt` al pausar en revisión; al volver a recogerlo se conserva `startedAt` y se guarda `briefWaitSec`.
    `durationSec` la descuenta (antes «tardó» solo medía la newsletter, porque se pisaba `startedAt`, y la barra contaba
    brief + newsletter);
  - web: «tardó X + N min esperando tu aprobación del brief» en la cabecera y en el historial; en la barra, «X min de
    trabajo · aparte, N min esperando…» (antes «transcurridos»); también en «Tiempo por fase»; y en el panel del brief,
    «Hermes está parado esperando tu aprobación desde las HH:MM». 192/192 tests.
  - Pendiente: desplegar (Railway + `vercel --prod`), con permiso del usuario.
- **Auditoría de la pieza (Paredes v3) — mala aunque pasó todos los checks:**
  1. **Se perdió el encargo:** el usuario pidió *pre-Black Friday* para público joven; ni el brief ni la pieza lo mencionan
     (sin oferta, sin fecha, sin urgencia). Origen: el brief (fase 01), no la maqueta.
  2. **Concepto contra el producto:** todo gira en torno a «el negro» (#25282a) y la Eden «negro» es gris, marrón, negro y
     con suela roja. El brief eligió el concepto por el nombre del producto, sin mirar la foto.
  3. Bloque «#25282a no es un tono neutro»: un código hex como titular para consumidor final.
  4. Tira «Oficina / Paseo / Plan» con tres fotos de bodegón del mismo zapato: las etiquetas no dicen nada. No hay
     fotos lifestyle en la web y el brief las pedía igualmente.
  5. Precio verificado (48,99 €) fuera de la pieza «porque el brief no lo pedía», en una campaña de compra.
  6. Los 4 CTA van a la misma URL; fondo blanco plano, el rojo de marca casi no aparece.
  Los checks miden lo técnico (aire, móvil, contraste, estructura) y no si la pieza cumple la petición ni si el concepto
  casa con las fotos.

### 2026-10-05 (noche) — Lo que pide la petición llega a la pieza; fotos antes del concepto; revisión visual por defecto

- **Desplegado antes:** `1ed13f9` (espera del brief aparte) → Railway y `vercel --prod` (hermes-studio-beta.vercel.app).
- **1. La petición manda** (`studio/server/requestCoverage.ts`, +7 tests): detecta en la petición la ocasión (Black
  Friday, Cyber Monday, Navidad, Reyes, rebajas, San Valentín, Día de la Madre/Padre, vuelta al cole, Halloween,
  Singles Day, Prime Day), la oferta y el público joven, con erratas («npre-black frisay» → Black Friday).
  - Prompt del brief: «La petición manda» (la ocasión es el eje: concepto, asunto y una escena) y la lista de lo
    que tiene que recoger; la sección 1 explica cómo lo recoge.
  - Worker: si `brief.md` no recoge algo, una vuelta más en la misma sesión, sin investigar.
  - Studio: `briefMissing` en el trabajo → aviso en el panel de revisión del brief y en el registro.
  - Encargo: lleva la petición original y «OBLIGATORIO en el texto visible: …».
  - Pieza: el worker deja `_trabajo/peticion.txt`; `inspect.ts` añade el check «Lo que pidió el equipo» (error si la
    ocasión u oferta no aparece en el asunto o el texto visible). Lo ve también `check-newsletter`. Contra la pieza
    de Paredes: error «Black Friday».
- **2. Fotos antes del concepto** (solo con fotos oficiales): mirar las fotos del producto antes de elegir el concepto,
  nunca un concepto sobre un atributo que no se ve, no pedir fotos que no existen; sección 6 = «solo las que has
  visto». Método: titulares sin códigos de color; el precio verificado sale si la pieza es para vender.
- **3. Revisión de dirección de arte por defecto:** casilla marcada (solo se recuerda si se quita, `artReviewOff`).
  Puntúa también «fidelidad a la petición» y «texto e imagen»; si un texto contradice las fotos o se aparta de la
  petición, corrige el texto. Añade unos minutos a cada pieza nueva.
- 199/199 tests.
- **Desplegado (con permiso del usuario):** `7a3ab09` → Railway (Studio responde de nuevo tras el 502 del redespliegue) y `vercel --prod`; worker reiniciado en el Mac (sin trabajos en curso). Pendiente: probar con una petición real de ocasión (p. ej. reintentar Paredes pre-Black Friday).

### 2026-10-06 — Ronda de investigación agente por agente: tiempos y calidad (solo diagnóstico, nada cambiado)

- **Fuente:** `~/Library/Logs/hermes-worker.log` (30 trabajos, 24-sep → 5-oct) y `~/.hermes/state.db` (57 sesiones de
  Hermes, tiempos por mensaje y caracteres de razonamiento). Modelo de todas: `deepseek/deepseek-v4-flash-0731` (Nous),
  `reasoning_effort: medium`.
- **Dato principal:** el 81 % del tiempo (531 de 656 min) es el modelo generando; las herramientas, el 19 %
  (vision_analyze 47 min/159 llamadas, browser_navigate 27 min/210). Los turnos con más de 8.000 caracteres de
  razonamiento son el 11 % de los turnos y el 30 % del tiempo del modelo (mediana 24-82 s cada uno).
- **Paredes v3, primera versión (37 min):** el HTML se escribe en el minuto 34; escribir, renderizar, comprobar y
  notas.md llevó 3 min. Los 34 anteriores: releer 3-5 veces los mismos archivos pequeños (email-modulos.md 5 veces,
  encargo.md 3, que es el propio prompt; brief.md, encargo.md y el prompt son el mismo brief), con razonamientos de
  15-39 K caracteres del tipo «I'm going in circles / let me re-check»; y 12 min re-investigando en paredes.es datos
  que el brief dejó «pendientes» (precio, envío 29,99 € vs 25 €, URLs de imágenes).
- **Contexto contradictorio en cada sesión:** el system prompt de Hermes (37,5 K caracteres) inyecta el `AGENTS.md`
  del repo («Eres el Orchestrator del pipeline 00-09», production-gate, 4 archivos de control) y «Skills (mandatory):
  carga cualquier skill aunque sea parcialmente relevante». `hermes chat` admite `--ignore-rules` y `-t <toolsets>`.
- **Otras pérdidas medidas:** 10 «paró sin entregar: continuar» (Siroko falló tras 3); 2 cortes por 12 min sin
  actividad; rondas de corrección de 2-23 min; brief con mediana 6 min (atípicos 13 y 45) y un último turno de
  resumen inútil tras escribir brief.md (~1 min); espera humana del brief 13 min en Paredes; Hermes escribe sus
  propios render.js/verify.js y comprueba enlaces con el navegador aunque check-newsletter ya lo hace.
- **Propuestas entregadas en el chat (pendiente de que el usuario elija).** Ver la respuesta de esa sesión: modelo y
  esfuerzo de razonamiento por fase, `--ignore-rules`, encargo autocontenido sin copias, extractor determinista de
  ficha de producto (precio, envío, imágenes descargadas + hoja de contacto), «resolver o quitar» en el brief, render
  único con hoja de contacto, cortar el turno al aparecer el entregable, revisión visual condicional.

### 2026-10-06 (continuación) — Puntos 1, 2 y 4 de la ronda de tiempos aplicados (sin desplegar)

- **1. Contexto limpio y encargo autocontenido:**
  - `hermes-worker.ts`: todas las llamadas con `--ignore-rules` (`RULES_ARGS`; `HERMES_KEEP_RULES=1` lo desactiva). El
    system prompt baja de 37,5 K a 22,8 K caracteres y desaparece el «eres el Orchestrator del pipeline 00-09».
  - `selfContainedNote()`: el encargo de la primera versión lleva el contenido completo de `email-base.html` y
    `email-modulos.md`, y la orden «brief.md es una copia, no lo leas; no releas ni listes el repo».
  - El worker copia `logo-medido.png` a la carpeta del trabajo. `_trabajo/encargo.md` se escribe DESPUÉS de la
    primera versión (antes, Hermes lo encontraba y lo releía).
  - Se retiran `skillReadingNote()` (ya no se cargan skills) y `screenshots()`.
  - `buildHermesPrompt`: fuera «compruébalo con el navegador» (enlaces) y las tres órdenes de renderizar por su cuenta.
- **2. Ficha de producto (`studio/worker/productSheet.ts`, `npm run product-sheet`):**
  - Cuándo: antes de la primera versión, sobre las URL de ficha que cita el brief (sin la home, como mucho 3).
  - Precio: de JSON-LD, metadatos o el elemento de precio visible.
  - Envío: frases literales, también las de acordeones cerrados. Si dan umbrales distintos, «NO cites el envío gratis».
  - Fotos: solo las del propio producto, que se descargan con `fetchImage`, más una hoja de contacto numerada
    (`_trabajo/fotos-producto.png`).
  - Contra Paredes real: 6 s → 48,99 €, aviso 25 €/29,99 € y las 5 fotos de la Eden negro (sin los banners de
    connectif.cloud ni los recomendados). Nike: 139,99 € (precio visible). Calvin Klein bloquea Chromium
    (ERR_HTTP2_PROTOCOL_ERROR): sin ficha, Hermes sigue como antes.
  - Brief: «resolver o quitar» (lo no verificado va a «Fuera de la pieza» y no se investiga después) y la URL exacta
    de la ficha de cada producto.
- **4. Captura única y revisión ligera:**
  - `studio/worker/render-newsletter.ts` (`npm run render-newsletter`): `_trabajo/render-hoja.jpg` con 600 px,
    375 px y oscuro en una sola imagen (2 s), en JPEG y 2000 px de alto. El modelo de visión auxiliar de Hermes no
    pudo con la hoja en PNG de 1356×3000 (1,4 MB). El encargo pide mirar solo esa hoja.
  - Revisión de dirección de arte: un solo turno en el que DeepSeek llama UNA vez a vision_analyze sobre la hoja,
    con preguntas concretas (texto ilegible por columna, fotos, titulares, plantilla), y responde notas JSON de 9
    criterios (incluye móvil y oscuro). Si no ve la imagen, `{"sin_imagen": true}`. Solo si alguna nota baja de 4 se
    abre una sesión de corrección con los problemas concretos; si todo es 4 o más, las notas van a `notas.md`.
  - Descartado `--image`: DeepSeek no ve imágenes y Hermes solo le pasa una descripción genérica. Con la hoja grande
    falló y DeepSeek se inventó las notas; con la pequeña, la descripción no mencionaba el texto invisible en oscuro.
  - Prueba real contra Paredes v3: 58 s; oscuro 2 («texto gris muy claro… casi no se lee»), jerarquía 3 («#25282a»
    como titular), originalidad 3. Son los mismos fallos de la auditoría manual del 2026-10-05. Debilidad: «petición»
    salió 4 aunque falta Black Friday (eso lo cubre el check determinista «Lo que pidió el equipo»).
  - Brief: con las 8 secciones escritas y 60 s sin cambios, se cierra el turno (`briefDone`).
- **Hallazgo nuevo:** la hoja de Paredes v3 muestra el modo oscuro roto (texto claro sobre fondo blanco). El
  control `dark-mode` solo comprueba que esté declarado, no que se lea. La revisión visual nueva lo puntúa
  (criterio «oscuro»), pero un check medido sería mejor. Pendiente.
- **Verificación:** +5 tests; `npm test` 204/204; `check-engine` limpio; tipos sin errores nuevos; ficha de producto
  contra Paredes y Nike reales; revisión visual con Hermes real (v0.20.1, que la app de escritorio actualizó a las 9:33
  durante esta sesión). Sin probar todavía un trabajo completo de Studio con el circuito nuevo.
- **Para desplegar (con permiso):** Railway (encargo y brief) y, en el Mac, reiniciar el worker. No hay dependencias
  nuevas. Sin commit todavía.
- **Desplegado (con permiso del usuario):** `6fc8475` → push a `Javifeebbo/hermes-studio` (Railway) y a `origin`.
  Studio responde (401 de la contraseña, lo normal). No se pudo leer el estado del despliegue en GitHub: `gh` no está
  instalado en el Mac y el repo es privado. Worker reiniciado (`service.sh restart`, 2026-10-06), sin trabajos en
  curso, conectado a Studio. Vercel no cambia (sin cambios en la web).

### 2026-10-06 (continuación) — Check medido «Modo oscuro legible» (sin desplegar)

- **Por qué:** Paredes v3 pasó el control con el modo oscuro roto (texto blanco sobre fondo blanco). `dark-mode` solo
  comprueba que el oscuro esté declarado (metas y @media), no que se lea.
- **Qué hace:**
  - `renderChecks.ts`: si la pieza tiene `prefers-color-scheme: dark`, la renderiza en Chromium con `colorScheme: 'dark'`
    (como Apple Mail e iOS) y mide el contraste de cada texto sobre su fondo efectivo, con la misma medición que
    «Legibilidad».
  - `darkFindings()` da error por debajo de 1,5:1 en cualquier sitio (incluido el pie: es texto invisible) y por debajo
    de 3:1 en el cuerpo. Entre 3 y 4,5 en el cuerpo es aviso. Lo que ya fallaba en claro no se repite.
  - Nuevo check `dark-legibility` («Modo oscuro legible») en `qualityCheck.ts`/`inspect.ts`: lo ven el worker y
    `check-newsletter`. Pauta añadida a `FIX_GUIDE`. En «Pedir cambios» no se fuerza si la original ya lo traía. Va
    en la matriz de clientes, en Apple Mail.
  - Gmail y Outlook invierten los colores por su cuenta: eso no se puede medir aquí.
- **Contra las 28 piezas de Hermes del repo:**
  - Error en Paredes v3 (14 textos).
  - Error también en los enlaces del pie de las 3 de Nike («nike.com · Ayuda», #111 sobre #111, comprobado a ojo:
    solo se ve el punto separador), en «Darse de baja» de las 2 de El Corte Inglés y en una frase de Talaria.
  - Avisos de contraste 3,5-3,8 en CTA de Lacoste, Siroko y Helly Hansen.
  - 11 sin estilos oscuros, no aplica.
- **Verificación:** +3 tests (uno renderiza en Chromium de verdad: @media que pasa el texto a blanco sin oscurecer el
  bgcolor → error; con el fondo oscurecido → limpio). `npm test` 207/207; check-engine limpio. El render en oscuro
  añade ~1 s al control.
- **Para desplegar:** worker (reiniciar en el Mac) y Railway solo por `clientMatrix.ts`.
- **Desplegado (con permiso del usuario):** `26dba53` → push a `Javifeebbo/hermes-studio` (Railway) y a `origin`.
  Worker reiniciado (2026-10-06, sin trabajos en curso), conectado a Studio.

### 2026-10-06 (continuación) — Modo oscuro de Nike/ECI/Talaria y comparativa de modelos de Nous (solo análisis)

- **Modo oscuro:** el usuario prefiere corregirlo con «Pedir cambios» en Studio (las versiones las crea Hermes y quedan
  publicadas). Causa común: textos con color en línea sin clase oscura:
  - Nike: «nike.com» y «Ayuda» en #111111;
  - El Corte Inglés: «Darse de baja» en #1c1c1c;
  - Talaria: «O vívela antes: reserva tu test ride» en #1E1E1E.

  Se le dieron los textos exactos.
- **Modelos de Nous:** catálogo público en `https://inference-api.nousresearch.com/v1/models` (425 modelos, precios
  con caché, modalidades, herramientas y esfuerzo de razonamiento; sin velocidad). Coste por newsletter estimado con
  el consumo real de 53 sesiones (8,2 M de entrada sin caché, 129,7 M de caché, 1,4 M de salida; ~30 trabajos):
  - actual `deepseek-v4-flash-0731` ≈ 0,09 $, solo texto (no ve imágenes: la visión pasa por un modelo auxiliar);
  - mismo rango y con visión: `deepseek-v4.1-flash` 0,07 $, `openai/gpt-6-luna` 0,09 $, `qwen/qwen3.8-flash`
    0,13 $, `z-ai/glm-5.3-flash` 0,16 $, `xiaomi/mimo-v2.6-pro` 0,17 $;
  - escalón de calidad: `kimi-k2.6` 0,66 $, `gemini-3.8-flash` 0,70 $; `claude-sonnet-5.5` 1,87 $.

  Pendiente: prueba comparativa real (misma pieza, `HERMES_MODEL_DRAFT`) si el usuario la aprueba.
- **Fallo de la ficha de producto, corregido (sin desplegar):** en la prueba de modelos, `productUrls` tomó la categoría
  `/es/1048-novedades` como ficha (la regla «4 dígitos» bastaba) y coló una foto de otro producto. Ahora:
  - `looksProduct()` solo acepta señales claras: `.html`, `/p/`, `/products/`, `/producto`, `/t/` o un código de
    referencia con letras y números (DC26164, IB1873-702);
  - si el brief cita alguna ficha clara, solo se usan esas;
  - al descargar, si alguna página tiene precio, las fotos salen solo de las que lo tienen.

  Contra el brief real de Paredes: solo la ficha de la Eden y sus 5 fotos. `npm test` 207/207. El worker sigue con el
  código anterior hasta reiniciarlo: había un trabajo real de Paredes en curso (`muwe6kbf-xfichh`).

### 2026-10-06 (continuación) — Prueba de modelos, visión de Hermes y cambio de modelo principal

- **Prueba de modelos** (misma pieza de Paredes con el brief de ayer y el encargo nuevo, en paralelo; carpetas
  `newsletters/2026/paredes/hermes/_prueba-modelos-*`). Primera versión:

  | Modelo | Total | HTML | Coste | Valoración |
  |---|---|---|---|---|
  | DeepSeek V4.1 Flash | 8,2 min | 3,7 min | 0,036 $ | Control limpio; sigue el brief al pie de la letra |
  | GPT-6 Luna | 16,9 min | 3,5 min | 0,086 $ | La mejor: corrige el titular «#25282a», módulos propios, precio |
  | Kimi K2.6 | 15,6 min | 7,2 min | — | Logo invisible en oscuro |

  Qwen 3.8 Flash y V4 Flash 0731 seguían en curso al escribir esto.
- **Precios:** el de entrada de V4.1 Flash es de promoción (0,003 $ frente a 0,30 $ de lista). GPT-6 Luna cuesta más
  por sus 90 llamadas de pulido (5,5 M de caché releídos), no por el precio por token.
- **Visión de Hermes rota a medias:** con `auxiliary.vision: auto`, `vision_analyze` acertaba 101 de 176 veces con
  V4 Flash 0731 desde el 24-sep (hoy, casi ninguna: «Multimodal not supported», 404). El brief del trabajo real
  `muwe6kbf-xfichh` vio 1 imagen de 10 y la revisión visual respondió `sin_imagen` (la protección funcionó).
  - Arreglo (con permiso del usuario): `~/.hermes/config.yaml` → `auxiliary.vision: provider nous, model
    qwen/qwen3.8-flash`. Copia en `config.yaml.bak.20261006_vision`. Comprobado: la llamada que fallaba ahora
    funciona.
- **Modelo principal:** el usuario lo cambió en `~/.hermes/config.yaml`, primero a `deepseek/deepseek-v4.1-flash` y
  luego a `openai/gpt-6-luna` (vigente). El worker no pasa `--model`, así que todo (brief, pieza, correcciones) usa
  Luna. El brief con Luna está sin probar.
- **Trabajo real `muwe6kbf-xfichh`** (Paredes pre-Black Friday, primero con el circuito nuevo y todavía con V4 Flash
  0731):
  - tiempos: brief 11 min (tope de 8 min alcanzado); ficha de producto 6 s (43,99 €, 7 fotos de la Forés); primera
    versión 1 min 22 s; total sin la espera de aprobación, 13 min (ayer, 57);
  - control limpio; el Black Friday como eje; el color de la zapatilla (caqui, aunque la URL dice «negro») quedó
    fuera por la regla «resolver o quitar».
- **Riesgo anotado:** `htmlReady()` acepta el HTML más reciente de cualquier subcarpeta de la marca
  (`newestHtmlSince`). Con trabajos en paralelo en la misma marca podría coger el de otro. Hoy no pasó. Pendiente
  de acotarlo.
- **Desplegado (con permiso del usuario):** `3694f9f` (ficha de producto: solo fichas claras) → push a
  `Javifeebbo/hermes-studio` (Railway) y a `origin`. Worker reiniciado a las 10:2x, sin trabajos en curso y conectado.
  Desde aquí usa GPT-6 Luna (modelo principal) y Qwen 3.8 Flash (visión).
- **Prueba de modelos, resultado final** (primera versión de la misma pieza; coste = estimación de Hermes):
  - V4.1 Flash: 8,2 min; 0,036 $.
  - GPT-6 Luna: 16,9 min; 0,086 $; mejor diseño.
  - Qwen 3.8 Flash: notas a ~19 min y seguía retocando; 0,068 $; buen diseño (bloques crema de la marca, lista
    numerada, precio); usó el banner ajeno «Pasos que nos unen».
  - Kimi K2.6: 15,6 min; 0,30 $.
  - V4 Flash 0731: 26,9 min (HTML a los 12,9); 0,055 $; el diseño más flojo (fotos repetidas, «#25282a», banner
    ajeno).

  El banner ajeno venía de la página «Novedades» (fallo de la ficha ya corregido en `3694f9f`). Las cinco piezas
  pasan el control sin errores. Se confirma GPT-6 Luna como modelo principal.
- **Carpetas de la prueba archivadas** (a petición del usuario): `_archive/prueba-modelos-2026-10-06/` (19 MB), con
  `README.md` de resultados, `bakeoff.ts` y el registro. Se paró antes la sesión de Qwen 3.8 Flash, que seguía
  retocando a los ~45 min. Se quitó una carpeta vacía `newsletters/2026/paredes/hermes/_trabajo` creada durante la
  prueba.

### 2026-10-06 (continuación) — Opción 3 elegida: standalone como única vía. Fase A (claims) aplicada, sin desplegar

- **Decisión del usuario:** Studio → Hermes (standalone) es la única vía de producción. Lo valioso de los agentes 00-09 y
  del motor se absorbe en Studio, y el resto se archiva al final. Plan:
  - A. Claims del agente 05 como comprobación real.
  - B. Catálogo de módulos del motor y los 3 patrones en el brief.
  - C. Brand pack automático (agente 02).
  - D. Envíos recurrentes a partir de una pieza aprobada.
  - E. Archivar `agents/`, `engine/`, scripts del motor, `pipeline-skill/` y las 27 campañas del motor; reescribir
    `AGENTS.md`/`CLAUDE.md`/`README.md`; ajustar tests y CI.

  Las fases 0-2 del roadmap original quedan cerradas y archivadas, no ampliadas. La skill `hermes-pipeline` habrá que
  actualizarla al final.
- **Fase A — `studio/worker/claims.ts`:**
  - Reglas: las 30 del motor (`scripts/lib/claim-rules.ts`, sin tocar: está bajo el candado del motor) más 7 de
    retail: envío gratis, gratis/regalo, descuento %, ahorra X, urgencia, precio más bajo y el más vendido/nº 1.
  - Contra qué se comprueba: `verifiedSource()` (sección «3. Datos verificados» del brief hasta «Fuera de la pieza» o
    «Pendiente», más la ficha de producto sin sus «NO cites»). El worker lo escribe en `_trabajo/datos-verificados.md`
    ANTES de la pieza; `inspect.ts` lo lee, así que Hermes lo ve también en `check-newsletter`.
  - Cuándo vale: misma expresión (con tolerancia a plurales y tildes) y mismas cifras; un % vale si ese % está en lo
    verificado.
  - Severidad: crítica sin verificar → error que vuelve a Hermes (pauta en `FIX_GUIDE`); high/medium → aviso; sin
    archivo de verificados, todo aviso, como antes.
  - Encargo y brief llevan la regla (`CLAIMS_PIECE_RULE`/`CLAIMS_BRIEF_RULE`). En «Pedir cambios», los claims que ya
    traía la original no se fuerzan.
- **Contra las ~30 piezas reales:** 1 error y es correcto: Paredes 05-oct, «Envío gratuito a partir de 29,99 €»,
  pendiente en el brief y con la web en contradicción. Verificados y aceptados: Lacoste «hasta un 50 %»/«gratuito»,
  y «potencia» en Talaria y Adidas (el falso positivo de antes). Ningún falso positivo.
- **Verificación:** +4 tests; `npm test` 211/211; check-newsletter de extremo a extremo con `datos-verificados.md`.
- **Para desplegar:** Railway (encargo y brief) y reiniciar el worker.
- **Desplegado (con permiso del usuario):** `1613acc` (fase A) → Railway y `origin`; worker reiniciado.
- **Revisión visual con GPT-6 Luna, arreglada:** el primer trabajo con Luna (Adeslas `muwfyed2-t9xn6q`, 12 min 51 s)
  perdió la revisión visual en 11 s (`sin_imagen`). Causa: Luna rellena SIEMPRE el parámetro opcional `region` de
  `vision_analyze` (26 de 26 llamadas) y a veces con `[0, 0, 0, 0]`, que la herramienta rechaza.
  - Arreglo, sin tocar el código de Hermes: `artReviewQuery` pasa `region [0, 0, ancho, alto]` de la hoja (leído con
    sharp) y pide reintentar una vez si hay error; `WEB_ACCESS_NOTE` lleva la misma pauta para el resto de usos.
  - Probado con Luna sobre la hoja real de Adeslas: 58 s, notas reales (oscuro 2, petición 3).
  - Antes, en la mañana, también hubo una espera de visión de 120 s y luego un timeout del modelo auxiliar.

### 2026-10-06 (continuación) — Fase B: catálogo de módulos del motor y patrones en el brief (sin desplegar)

- **`studio/hermes/build-catalog.ts`** (`npm run build-catalog`): renderiza con el propio motor (`renderTemplate` +
  `MODULE_ADAPTERS` + `loadBrandTokens`) cada uno de los 29 componentes útiles.
  - Fuera: `_shell`, el stub `header`, los parciales `cta-*` y `hero-marca-tarifalo`.
  - Datos: los de una campaña real que lo usó y el brand pack de esa marca, descartando las campañas de prueba con
    texto de relleno. Las variantes sin campaña usan los datos de su componente base (mismo adaptador). Las imágenes
    pasan a un gris neutro.
  - Salida: `studio/hermes/modulos/<id>.html` + `<id>.png` (1,3 MB en total) y `studio/hermes/catalogo.md`.
  - Revisado a ojo en una hoja de los 29. `engine/` no se toca.
- **`studio/hermes/catalog.ts`** (compartido por el servidor y el worker):
  - `MODULES` (qué es y cuándo usarlo) y `catalogIndex()`;
  - `PATTERNS_GUIDE`: los 3 patrones (oferta y precio, institucional, fotografía primero) condensados de los 60 KB
    de `patterns/*.md`, con sus reglas de ritmo y antirrelleno;
  - `chosenModules()`/`chosenModulesNote()`.
- **Brief:** recibe la guía de patrones y el índice del catálogo; la sección 1 dice el patrón y la sección 5 el
  módulo de cada escena (id entre comillas invertidas o «propio»).
- **Encargo:** apunta al catálogo, y el worker pega el HTML de los módulos que nombra el brief (máx. 6).
- **Tamaños:** prompt del brief ~11 K caracteres; 4 módulos pegados ~17 K (con GPT-6 Luna la caché cuesta 0,01 $
  por millón).
- **Verificación:** +3 tests; `npm test` 214/214. Pendiente: un trabajo real para ver que el brief elige módulos y
  la pieza los usa.
- **Desplegado (con permiso del usuario):** `ec042ed` (fase B) → Railway y `origin`; worker reiniciado. Pendiente:
  primera newsletter real con el catálogo.

### 2026-10-06 (continuación) — Auditoría de calidad con GPT-6 Luna (solo diagnóstico, nada cambiado)

- **Cómo trabaja Luna** (Adeslas `muwfyed2`, Polo Ralph Lauren lanzada a mano): HTML a los ~4 min y después 4-5
  ciclos de render → mirar la hoja → corregir; sin las relecturas en bucle de DeepSeek. Las dos pasan el control.
- **Límites de calidad vistos en las piezas:** 1 sola foto por pieza y ningún hero con imagen potente arriba; copy
  correcto pero genérico (Adeslas: «Empieza por lo que encaja contigo», sin oferta concreta → revisión visual con
  petición 3 y oscuro 2).
- **Visión:** Luna NUNCA ve las imágenes. `--image` y `vision_analyze` pasan por el modelo auxiliar, que se las
  describe en texto. Causa: en `agent/image_routing.py`, `decide_image_input_mode` en modo `auto` devuelve `text` si
  hay un `auxiliary.vision` explícito, y lo fijamos esta mañana (Qwen 3.8 Flash) para DeepSeek. Con Luna lo correcto
  es `agent.image_input_mode: native` (Qwen sigue para el resto).
- **Restricciones de la época de DeepSeek** que ya limitan más de lo que protegen:
  - brief: 25 acciones / 5 min / 5 búsquedas (el worker corta a 35 acciones u 8 min);
  - revisión visual que solo corrige notas < 4;
  - `reasoning_effort: medium` global.
- **Propuestas entregadas en el chat, pendiente de que el usuario elija.**
- **Punto 1 aplicado (con permiso del usuario): visión nativa de GPT-6 Luna.** Solo en `~/.hermes/config.yaml`
  (copia en `config.yaml.bak.20261006_native`); el repo no cambia y no hace falta reiniciar el worker.
  - `agent.image_input_mode: auto → native`. En `auto`, el `auxiliary.vision` explícito forzaba `text`.
  - `providers.nous.models."openai/gpt-6-luna".supports_vision: true`. El catálogo de Hermes no sabe que Luna ve, y
    al activar `native` descartaba la imagen que devuelve `vision_analyze` («returned image content for non-vision
    model … falling back to text summary»): Luna no recibía NADA. Declarado solo para Luna.
  - Qwen 3.8 Flash sigue en `auxiliary.vision` como respaldo.
  - **Ojo:** si se vuelve a un modelo principal que no ve (DeepSeek V4 Flash 0731), hay que devolver
    `image_input_mode` a `auto`.
- **Verificado:**
  - `--image`: Luna lee el botón exacto («Explora las modalidades», cian).
  - `vision_analyze`: igual, sin el aviso de modelo sin visión.
  - Revisión de dirección de arte sobre Adeslas: 17 s (antes 58) y más precisa. Oscuro 4: la descripción del modelo
    auxiliar se había inventado un problema de contraste. Señala petición 3, texto-imagen 3, originalidad 3 y móvil 3
    (pie diminuto).

### 2026-10-06 — Punto 3 de la auditoría aplicado (con permiso del usuario): brief sin límites de DeepSeek y con autocrítica
- `standalone.ts` (`buildBriefPrompt`): presupuesto 5 min / 25 acciones → ~12 min / 60 acciones; investigación de 5 a ~12 búsquedas o páginas (producto, campaña vigente y, si la hay, una newsletter o landing reciente de la marca para el tono).
- `hermes-worker.ts`: corte del brief 35 acciones / 8 min → 70 / 14 min (`BRIEF_ACTION_BUDGET`, `BRIEF_TIME_BUDGET_SEC`, exportados); barra estima 10 min; `briefEnvNote` alineada.
- Autocrítica nueva (`BRIEF_CRITIQUE`, `briefCritiqueQuery`): con el brief escrito, una vuelta en la misma sesión sin navegar con 7 preguntas (concepto propio de la marca, titulares del concepto, frases genéricas, escenas y módulos, fotos vistas, datos en sección 3, asunto concreto). Reescribe `brief.md` si algo no pasa y deja `_trabajo/autocritica-brief.md`. Absorbe la vuelta de «la petición pide X y el brief no lo recoge» (antes era aparte).
- Coste esperado: +1-2 min de autocrítica; el brief puede investigar unos minutos más. Sin efecto en 00-09 (se archivan en la fase E). Tests 215/215.
- Pendiente: verificar con el primer trabajo real con brief (log «autocrítica» y `_trabajo/autocritica-brief.md`).
- ✅ Verificado el 2026-10-06 con Siroko (muwjmzjf-xfla8l): log «Brief de …: autocrítica», `_trabajo/autocritica-brief.md` con las 7 respuestas, brief en 3 min sin corte de presupuesto.

### 2026-10-06 — Punto 2 de la auditoría aplicado (con permiso del usuario): galería de campaña e imagen principal obligatoria
- Diagnóstico: de las 10 últimas piezas solo Paredes recibió fotos de Studio; Adeslas salió con 1 foto y Polo con 2, ninguna con imagen principal.
- `productSheet.ts`: además de las fichas, lee la galería de campaña (páginas citadas en la sección 6 del brief, del dominio de la marca, máx. 2, + la portada). Portada: la de la identidad medida o, si no hay (17 de 18 marcas con brand pack), `brandHome()` = el dominio oficial más citado en el brief. Hasta 15 fotos (8 de producto, 4 por página de galería); ★ = candidata a imagen principal (≥1000 px y horizontal ≥1,2). Deja `_trabajo/galeria.json` `{photos, heroCandidates, blocked}` y la hoja de contacto marca las ★.
- Fotos guardadas de lo que el navegador ya recibió al cargar la página (`saveImage` nuevo en `fetch-image.ts`; `fetchImage` sigue igual y es la alternativa): la portada de Adeslas cargaba sus fotos y luego daba 403 a cada descarga suelta → 0 fotos. Ahora 4 (con la de la campaña de septiembre).
- Webs que bloquean a los robots (`isBlockedPage`: 403/429/503 o «Un momento…», «Access Denied»): Adeslas a ratos, Ralph Lauren siempre. No se intenta saltar el bloqueo: se anota en `galeria.json` y en el log, y la nota pide a Hermes que elija él la imagen principal.
- `hermes-worker.ts`: el paso de ficha corre también sin fichas (solo galería); tope 3 min; log con nº de candidatas y aviso de bloqueo; pauta de corrección «Sin imagen principal → candidatas ★».
- `renderChecks.ts` / `qualityCheck.ts` / `inspect.ts`: controles nuevos «Imagen principal» (foto ≥560 px pintados en los primeros 700 px; error si había candidatas ★, aviso si no; logos, SVG y <200 px no cuentan) y «Variedad de fotos» (aviso si <3 fotos distintas con galería de ≥5). Solo piezas nuevas con diseño.
- `standalone.ts`: el brief abre la escena 1 con imagen principal a todo el ancho y la sección 6 cita la URL completa de cada página oficial de imágenes.
- Sin efecto en el motor (check-engine limpio) ni en 00-09. Tests 222/222.
- Pendiente: verificar con el primer trabajo real tras desplegar (log «candidata(s) a imagen principal», control «Imagen principal» en verde).

### 2026-10-06 — Barra de progreso: ya no retrocede tras la primera versión (con permiso del usuario)
- Bug visto por el usuario desde GPT-6 Luna: la barra iba por el 75 %, caía de golpe al ~11 % y luego saltaba al 100 %.
- Causa (`hermes-worker.ts`): la corrección y la revisión visual abren sesiones nuevas (`watchNewSession`) y la estimación partía de 0 acciones → fase «Preparando» (2-15 %). Con Luna se nota porque la revisión visual ya funciona y el modelo es tan rápido que el tiempo no levanta la barra.
- Arreglo: `laterSessionProgress` — tras la primera versión, toda sesión cuenta como «Revisando y corrigiendo» (75-97 %); y la barra nunca baja de lo ya mostrado. Test nuevo; 223/223.

### 2026-10-06 — Studio: portada nueva como la de feebbodigital.com (pedido por el usuario)
- Antes: bloque alineado a la izquierda con la foto del equipo en un círculo de 160 px; el usuario la veía genérica, sin la identidad del programa.
- Ahora (`studio/web/index.html`, `styles.css`, `app.js`): banda a todo el ancho que sube por detrás de la cabecera, con el fotograma del vídeo de portada de feebbodigital.com (`studio/web/hero-portada.jpg`, 1280×680, 16 KB) y capa azul; titular centrado con «con Hermes» en degradado rosa; subtítulo; botón «Nueva newsletter ↓» + historial + «¿Cómo funciona?»; etiquetas rosas espaciadas «INVESTIGA · ESCRIBE · REVISA · CORRIGE» (eco de «CONSULTORÍA · INNOVACIÓN · BASE DE DATOS» de la web).
- La banda es oscura también en tema claro (como la web): dentro se fijan los colores del oscuro; la cabecera sobre la foto también (logo blanco, hamburguesa clara) hasta que se baja. En claro la banda acaba en limpio. Sin animación de entrada en el titular (tardaba en verse); zoom lento de la foto solo sin «reducir movimiento».
- Verificado en local (ALLOW_NO_AUTH, puerto 4802): 1280 oscuro y claro, 375 sin desborde horizontal, el botón baja al formulario, sin errores de consola. `hero-equipo.jpg` queda sin uso en la portada. Tests 223/223.

### 2026-10-06 — Punto 5 de la auditoría aplicado en local (con permiso del usuario): revisión de dirección de arte exigente
- Diagnóstico: solo corregía notas < 4 y Luna ponía 4 a casi todo (Siroko: nueve 4 con el texto secundario diminuto señalado) → con 4 no se tocaba nada. La identidad se puntuaba sin ver la web de la marca.
- `hermes-worker.ts`: escala explícita (`ART_SCALE`: 5 = lo firmaría el director de arte de la marca; si se puede nombrar una mejora, es 4); JSON con `mejoras` (cómo subir cada 4 a 5); pasada de mejora si hay notas < 4 o mejoras (`needsImprovement`); copia `_trabajo/antes-de-mejora.html` y segunda nota: se descarta la mejora si el total baja o algo cae por debajo de 4 (`keepImproved`). `revision-visual.md` guarda primera nota, mejoras y nota tras la mejora (base para el punto 7).
- `render-newsletter.ts`: `captureBrandWeb` — portada de la web (identidad medida o `brandHome`) a 1280×900 en `_trabajo/web-marca.jpg`, sin aceptar cookies; si la web bloquea, la revisión sigue sin ella. La revisión la mira con un segundo `vision_analyze` y compara la identidad.
- Coste estimado: +3-4 min por pieza. «Pedir cambios» y «Adaptar a móvil» no cambian. Tests 224/224. **Sin desplegar** (pendiente de permiso).

### 2026-10-06 — Studio: cabecera de producto (2.ª versión, sustituye a la «portada Feebbo»)
- El usuario: la portada anterior (`e09086b`) parecía una copia de la web de feebbodigital.com; quiere que se note que es un programa de la empresa, sin volver a la cabecera genérica.
- Ahora (`index.html`, `styles.css`, `app.js`): a la izquierda «HERMES STUDIO · un programa de Feebbo Digital», titular, subtítulo y botones; a la derecha un abanico con las miniaturas de las últimas newsletters terminadas (una por marca, 5 o 3, la más reciente en el centro; `renderShowcase`) que se abre al pasar el ratón y enlaza a cada trabajo. Sin piezas, tres maquetas de newsletter en CSS. Debajo, «01 Investiga — 02 Escribe — 03 Revisa — 04 Corrige» con los números de sección y la línea rosa. De Feebbo se toma solo el sistema (colores, Work Sans/Barlow, números grandes).
- Quitados la foto a todo el ancho, las reglas de cabecera sobre la foto y `hero-portada.jpg`.
- Verificado en local con miniaturas reales de prueba: 1280 oscuro y claro (el abanico sale de la columna de 880 px por la derecha a partir de 1180 px), 375 px sin desborde, hover sin pisar el texto. Tests 224/224.

### 2026-10-06 — Punto 4 de la auditoría aplicado en local (con permiso del usuario): copy concreto
- Diagnóstico: en las 12 últimas piezas, «descubre» en casi todas (sobre todo botones) y Adeslas con 7 muletillas; ninguna regla de copy en el encargo, el control ni la revisión de arte (solo 5 ejemplos en la autocrítica del brief).
- `copyCheck.ts` (nuevo): una sola lista de ~25 muletillas (`GENERIC_PHRASES`) y de botones genéricos (`GENERIC_CTA`); `copyFindings` mira titulares y texto sin enlaces ni VML, y los botones aparte; `COPY_RULES` para los encargos.
- `qualityCheck.ts`: control «Copy concreto», SOLO aviso. Calibrado con las 12 últimas piezas: avisa en 4 (Adeslas 3, Inglesina, Puma), limpias las otras 8.
- `standalone.ts`: `COPY_RULES` en el método del brief y en el encargo de la pieza (también prompt completo): titular concreto, voz de la marca, botón verbo + objeto, sin muletillas.
- `hermes-worker.ts`: la autocrítica del brief usa la lista; criterio nuevo `copy` en la revisión de arte (total sobre 50) y lo que detecta el control se le pasa a la revisión para que lo reescriba en la pasada de mejora.
- Tests 225/225. **Sin desplegar** (pendiente de permiso).

### 2026-10-06 — Fondos y franjas: la pieza se distingue de la página y sin franjas sueltas (pedido por el usuario)
- Visto en Inglesina (`pom139`, revisión): exterior y secciones claras `#f4f4f5` (en oscuro, `#263743` los dos) → las secciones se funden con la página; franjas de 24 px del color exterior entre bloques y, en oscuro, una celda blanca sin versión oscura sobre una foto.
- Causa raíz: `studio/hermes/email-base.html` usaba `[FONDO DE LA PIEZA]` en el body y en la tabla exterior, y el contenedor de 600 px no tenía fondo propio.
- `email-base.html`: `[FONDO EXTERIOR]` (body y tabla exterior, clase `.dm-outer` con `[FONDO EXTERIOR OSCURO]`) y el lienzo de 600 px con `bgcolor`/`background-color` `[FONDO DE LA PIEZA]` y `.dm-bg`.
- `standalone.ts` (encargo, Maquetación): espacios en múltiplos de 8; exterior y lienzo distinguibles en claro y oscuro; sin filas separadoras de color propio; cada fondo con su versión oscura (también celdas de foto).
- `renderChecks.ts`: `frameMetrics`/`frameFromPixels`/`frameFindings` — captura a 900 px en claro y oscuro, por píxeles: «Lienzo distinguible» (error si un tramo seguido de ≥100 px tiene el borde del lienzo del color del exterior) y «Sin franjas sueltas» (error por franja plana de 4-28 px entre dos bloques de otro color o pegada al borde de una foto; líneas de 1-3 px no cuentan). `qualityCheck.ts`/`inspect.ts`: dos controles nuevos, solo piezas nuevas con diseño.
- Calibrado con las 13 últimas piezas: franjas solo en las dos de Inglesina (sin falsos positivos); lienzo en 11 de 13 — real: todas se fundían por la base. Tests 226/226; motor íntegro.

### 2026-10-06 — Punto 7 de la auditoría aplicado (con permiso del usuario): medir la calidad
- Antes: las notas de la revisión de arte se quedaban en `_trabajo/revision-visual.md` en el Mac; Studio no podía decir si las mejoras subían la calidad.
- `hermes-worker.ts`: `artResult` (notas antes y después, si la mejora se quedó, si se comparó con la web, problemas y mejoras) va en `/complete` como `artReview`.
- `store.ts`: `Job.artReview` (`JobArtReview`), `finalArtNotes` (después si la mejora se quedó) y `artPct` (porcentaje: los criterios pasan de 9 a 10 con el punto 4). `standalone.ts`: `sanitizeArtReview`. `index.ts`: se guarda al completar; el historial recibe `art {pct, notes}`; la ficha de marca recibe `quality {points, criteria}` (30 últimas, criterios de peor a mejor).
- Web: panel «Revisión de dirección de arte» en cada trabajo (barra por criterio, antes → después, problemas y mejoras); «calidad N %» en cada fila del historial y «calidad media» en el resumen (respeta el filtro de marca; última versión de cada newsletter); sección «Calidad» en la ficha de marca (media, gráfico por fecha y los dos criterios más flojos).
- Solo piezas nuevas (las anteriores no tienen notas en Studio). Tests 227/227.

### 2026-10-06 — Studio: animaciones de la vista previa al pasar y pasos en vivo (pedido por el usuario)
- Historial: al pasar el ratón por la miniatura de una fila, tarjeta grande (180×240) inclinada como las del abanico de la cabecera con la parte de arriba de la pieza (`thumb-peek`); solo con ratón, se oculta al salir o al hacer scroll.
- Cabecera: los pasos «01 Investiga — 04 Corrige» siguen la fase real de la pieza en curso (`renderLiveSteps`/`liveStep`, por `stageLabel`: brief/preparación/investigación → 1, escribiendo → 2, revisando → 3 y, desde el 90 %, 4); lo hecho en rosa, el paso actual con brillo, y «● Ahora: <marca> · <fase> · N %» con enlace. Sin nada en curso, una luz recorre los pasos.
- Todo se apaga con «reducir movimiento». Verificado en local; tests 227/227.

### 2026-10-06 — Punto 6 de la auditoría: prueba A/B de razonamiento (con permiso del usuario; sin cambios en el sistema)
- `_archive/prueba-razonamiento-2026-10-06/` (README con la tabla). Luna, primera versión con `--reasoning medium` vs `high`, Paredes y Siroko, mismo encargo que el worker; control de Studio y revisión de arte del punto 5 en medium.
- Media: medium 71 % en 4,9 min (32 acciones, 0,036 $); high 76 % en 5,1 min (23 acciones, 0,025 $). Cumple la regla fijada (≥ +5 puntos, ≤ +40 % de tiempo), con muestra pequeña.
- Hallazgo: en Paredes «texto e imagen» = 2 en las dos: la galería de la portada mete fotos de otros modelos y la pieza las presenta como el producto (fallo del punto 2, pendiente).
- Pendiente de permiso: `--reasoning high` solo en la primera versión del worker.
- **Aplicado en local (con permiso del usuario):** `hermes-worker.ts` — `DRAFT_REASONING` (`HERMES_REASONING_DRAFT`, por defecto `high`; vacío = el de la configuración) y `draftReasoningArgs`: `--reasoning high` solo en el turno de la primera versión y sus «continúa»; brief, cambios, adaptación a móvil, correcciones y revisión siguen en medium. La nota del punto 7 dirá si se mantiene.

### 2026-10-06 — Galería: las fotos de ambiente no son el producto (fallo visto en la prueba A/B)
- En Paredes, la portada traía fotos de OTROS modelos y la pieza las presentaba como la Eden negro («texto e imagen» = 2 en las dos variantes).
- `productSheet.ts`: en una pieza con ficha de producto (precio o fotos), las fotos de la galería llevan `ambient: true`; la nota las marca «AMBIENTE de la marca, NO es el producto de la ficha» y prohíbe presentarlas como él; para la imagen principal, mejor una ★ de la ficha (si se elige una de ambiente, el titular habla de la campaña). Test nuevo; 228/228.

### 2026-10-06 — Studio: más animaciones (pedido por el usuario)
- Enviar: una mini newsletter vuela desde «Generar newsletter» hacia donde aparece el trabajo, y la página del trabajo «aterriza» (`flyToJob`, `landJobView`).
- Pieza terminada con la página abierta: su fila se ilumina en rosa, la miniatura aterriza con rebote y su carta cae en el abanico (`celebrateDone`, comparando estados entre actualizaciones).
- Historial en cascada al verlo por primera vez y al cambiar Lista/Galería (en galería, las tarjetas se reparten inclinadas), igual las tarjetas de «Ahora mismo»; las cifras del resumen cuentan desde 0 (`playCascade`, `countUp`, con guarda para no contar dos veces).
- Controles segmentados (formulario, Lista/Galería, vista previa, revisión): una píldora se desliza a la opción elegida (`placePill`).
- Todo apagado con «reducir movimiento». Verificado en local; sin errores de consola.
- Pasos de la cabecera sin nada en curso (pedido del usuario): en vez de encender cada paso entero, un degradado rosa se desliza de izquierda a derecha por los números y las líneas (`steps-sweep`, `background-clip: text`; cada elemento arranca con un retraso proporcional a su posición, `--pn`/`--pl` de `placeStepSweep`).

### 2026-10-06 — Notas de calidad de piezas anteriores (pedido por el usuario)
- De las piezas de hoy, solo Inglesina `mw39rq` tenía notas fiables en `revision-visual.md` (escala antigua de 9 criterios); Adeslas, Paredes y Polo decían `{"sin_imagen": true}` (fallo de visión de la mañana) y la de Siroko se reescribió en la corrección.
- En vez de copiarlas: se vuelven a puntuar con la revisión actual (punto 5, sin corregir). Studio: `pendingArtReviews` (terminadas de los últimos 7 días sin notas), rutas `/api/worker/art/pending` y `/api/worker/jobs/:id/art-review` (guarda con `backfill: true` o marca `artReviewFailed`). Worker: `backfillArtReviews`, con el worker libre, UNA pieza por vuelta (HTML del Mac o el publicado, hoja, portada de la web y revisión en medium). Web: «puntuada después, sin pasada de mejora» en el panel. Tests 229/229.

### 2026-10-06 — Studio: fondo de newsletters flotando e interacciones (pedido por el usuario)
- Fondo: 12 siluetas muy tenues de newsletters (las maquetas del abanico) suben despacio a ritmos distintos (44-66 s), con parallax al hacer scroll (`.bg-float`, posiciones fijas, sin azar).
- Tarjetas que se inclinan en 3D hacia el ratón con brillo que lo sigue: «Ahora mismo», galería, abanico y, apenas (1,2°), el formulario — y nada mientras se escribe en él.
- Botones magnéticos («Nueva newsletter», «Generar newsletter», «Ver», historial) que se acercan al cursor; onda rosa al pulsar cualquier botón.
- Filas del historial que se levantan con sombra, borde en degradado rosa y destello en la etiqueta de estado.
- Números de sección con parallax y título que se desliza al aparecer.
- Solo con ratón las interacciones; todo quieto con «reducir movimiento». Verificado en local; tests 229/229.
- Arreglo (pedido del usuario): las cartas del abanico de la cabecera quedan fuera de la inclinación 3D. La regla `.is-tilting { position: relative }` las sacaba del abanico (aparecían como un cuadrado grande al pasar o pinchar) y la inclinación chocaba con su transición (movimiento torpe). El abanico conserva su propio efecto al pasar.

### 2026-10-06 — Studio: 3.ª tanda de animaciones (pedido por el usuario)
- Pieza en curso: brillo que recorre su barra (en «Ahora mismo» y en su fila), las barras crecen desde su valor anterior al actualizarse (`animateBars`), y la etiqueta gira como una carta al pasar a «Lista».
- Raíl lateral: la línea crece al bajar (progreso de lectura) y debajo se marca la sección actual («01», «02»).
- Formulario: el campo enfocado lleva un borde en degradado rosa que gira (`@property --ring`); los ejemplos se reparten como cartas; las casillas saltan al marcarse.
- Página del trabajo: la newsletter se despliega desde arriba al abrir el trabajo (una vez por trabajo) y las pestañas tienen un subrayado rosa que se desliza.
- Todo quieto con «reducir movimiento». Verificado en local; tests 229/229.

### 2026-10-06 — Studio: 4.ª tanda de animaciones (pedido por el usuario)
- Aprobar con celebración: ráfaga de 16 cartas de newsletter y destellos rosas desde «Aprobar esta versión» y el sello «Aprobada» cae con un golpe suave (`celebrateApproval`, `stampApproval`).
- Cambio de tema con onda: el nuevo tema se extiende en círculo desde el botón (View Transitions + `clip-path`); el botón se pinta dentro de la transición (antes mostraba el tema anterior). Sin View Transitions, cambio directo.
- Notas que se dibujan: barras del panel de la revisión de arte que se llenan una tras otra (al pintarse y al abrirlo) y gráfico de calidad de la ficha de marca que se traza con sus puntos apareciendo.
- Vista previa que se transforma: el marco cambia de ancho/alto suavemente entre escritorio, móvil y libre (sin transición mientras se arrastra el deslizador de «Libre») y fundido al cambiar claro/oscuro/invertido.
- Todo quieto con «reducir movimiento». Verificado en local; tests 229/229.
- Fondo cambiado (pedido del usuario): las newsletters flotando se sustituyen por una aurora de marca — cuatro manchas de luz difuminadas (azul noche, violeta, rosa, índigo) que derivan en ciclos de 30-40 s con parallax al hacer scroll (`.bg-aurora`); más tenue en tema claro.

### 2026-10-06 — Studio: revisión de rendimiento y 5.ª tanda de animaciones (pedido por el usuario)
- Rendimiento: la aurora ya no usa `filter: blur(80px)` (4 capas de 60vmax con desenfoque animado: lo más caro de la página); los degradados radiales con tres paradas dan la misma suavidad. La aurora y el latido de la píldora se paran en la página del trabajo (`html.in-job`). Inclinación y botones magnéticos: un cálculo por fotograma (rAF) y solo los botones a la vista (IntersectionObserver); antes se medían todos los «Ver» del historial con cada movimiento del ratón.
- Píldora de Hermes con anillo: borde en degradado que se cierra con el % de la pieza en curso; libre y conectado, late suave.
- Copiar con confirmación: el botón pulsado muestra un ✓ rosa dibujado durante un segundo; los avisos entran como una carta desde abajo con una barra de tiempo (sin pisar su centrado).
- Cargas con brillo de marca: siluetas de carga con brillo rosa y el logo late si una petición tarda más de 400 ms (`html.is-loading` desde `apiFetch`).
- Verificado en local; tests 229/229.
- Abanico (pedido del usuario): la carta señalada se endereza y crece un 40 % en su sitio (compensada hacia abajo para no tapar la cabecera) y las demás se apagan al 55 %. Arreglo de paso: la regla del abanico abierto (`.hero-showcase:hover .show-card`) pesaba más que la de la carta señalada, que se quedaba inclinada y sin crecer.
- Fondo: vuelta a las newsletters flotando (pedido del usuario; la aurora no le convenció). Se conserva la pausa en la página del trabajo (`html.in-job .bg-card`).

### 2026-10-06 — Studio: aro de la píldora de Hermes sin marcas (bug reportado por el usuario)
- Síntoma: según el porcentaje, el borde de la píldora «Hermes · cliente · N %» mostraba un pico o escalón, como roto.
- Causa: el aro era un `conic-gradient` en el borde; reparte por ángulo desde el centro, así que en una píldora ancha el corte del progreso y la costura de arriba caían en las curvas de los extremos (y el % no era proporcional al borde).
- Arreglo (`studio/web/styles.css`, `app.js` → `drawPillRing`/`sizePillRing`): con anillo, la píldora quita el borde CSS y un SVG dibuja la pista gris y un rectángulo redondeado con `pathLength=100` y `stroke-dasharray` = %, medido al tamaño real (ResizeObserver). Comprobado a 8/45/63/97 %. Sin efecto en fases cerradas.

### 2026-10-06 — Studio: 6.ª tanda de animaciones (pedido por el usuario)
- Envío que se transforma (`morphSendBtn`): «Generar newsletter» se encoge a una píldora «Enviando…» con un punto que late mientras sale la petición; el vuelo de la mininewsletter (`flyToJob`) aterriza ahora en la píldora de Hermes de la cabecera (si está a la vista), que da un bote.
- Cifras que ruedan (`rollText`): en la vista del trabajo, el «N %» de la fase y la hora/minutos estimados giran dígito a dígito (columnas 0-9, `inline-flex` para casar la línea base). Texto entero en `.sr-only`; si cambia la forma del texto se rehace sin animar.
- Foco de luz en tarjetas: brillo rosa radial que sigue al cursor en `.job-row` y `.brand-row` (solo ratón, un escuchador delegado a un cambio por fotograma, apagado en la vista del trabajo).
- Ejemplos que se escriben solos: con la instrucción vacía y sin foco, el placeholder escribe y borra los `EXAMPLES`; se para al enfocar/escribir, en «Prompt creativo» o con la pestaña oculta. No toca borrador ni envío.
- Todo apagado con «reducir movimiento». Sin efecto en fases cerradas.

### 2026-10-06 — Studio: 7.ª tanda de animaciones (pedido por el usuario)
- Filtrado que se recoloca (`flipRender`): al buscar o filtrar en el historial y en marcas, las filas que siguen se deslizan desde su sitio anterior (clave: su primer enlace) y las nuevas entran con fundido. Solo en los cambios de filtro, no en los refrescos.
- Menú: cierre animado (sale por la derecha, enlaces en cascada inversa, la × Lottie vuelve a hamburguesa). La página queda libre (`inert` fuera, foco en la hamburguesa) desde que empieza el cierre; reabrir a mitad lo cancela. La apertura ya tenía cascada y × dibujada.
- Avisos con sacudida: un `MutationObserver` sacude cualquier `role="alert"` que aparece o cambia de texto; el evento `invalid` sacude el campo obligatorio vacío (borde rosa).
- Salto con destello (`jumpTo`): los saltos de la página (menú, historial, cajas de cambios/edición/aprobar, aviso de elegir, panel lateral, vista previa) dan un aro rosa al llegar. No en pestañas ni desplegables.
- Todo apagado con «reducir movimiento». Sin efecto en fases cerradas.

### 2026-10-06 — Studio: hilo que conecta la sección 01 con la 02 (pedido por el usuario)
- En el margen izquierdo de `#view-form`, una línea rosa→morado (`.section-thread`, con punto brillante en la punta) se dibuja del «01 Nueva newsletter» al «02 Historial» según se baja (avance = posición del 60 % de la pantalla entre ambos títulos; ligado al scroll, se recoge al subir). Al llegar, el «02» se ilumina (rosa mezclado con su azul: en rosa pleno tapaba «Historial») y vuelve a su color.
- Va en el mismo cálculo por fotograma del parallax (`backgroundAndInteractions`), sin escuchadores nuevos salvo `resize`. Se mide sobre los títulos, no los números (tienen parallax). Oculto si el historial no se ve; nada con «reducir movimiento». Sin efecto en fases cerradas.

### 2026-10-06 — Studio: 8.ª tanda de animaciones (pedido por el usuario)
- Lista ↔ galería que se transforma (`morphThumbs`): cada miniatura viaja y se escala desde su sitio en la vista anterior (clave: el enlace del trabajo); el resto entra con fundido. Sustituye a la cascada de ese botón (que queda si no hay parejas).
- Versiones que se despliegan (`foldFamily`): «Ver las otras versiones» crece desde 0 con las versiones en cascada; al ocultar se pliega antes de repintar. El foco sigue volviendo al botón.
- Archivar con salida (`leaveRow`): solo tras confirmar el servidor, la fila se desliza a la derecha, se desvanece y cierra su hueco; luego se recarga el historial como antes.
- Descarga con flecha: clic delegado en cualquier `a.btn[href*="download=1"]` → en la esquina del botón una flechita cae en una insignia rosa que se vuelve ✓ (1,6 s). Solo decoración.
- Todo apagado con «reducir movimiento». Sin efecto en fases cerradas.

### 2026-10-06 — Studio: 9.ª tanda de animaciones (pedido por el usuario)
- Entrada a la página (`introOn`, solo la 1.ª visita de la sesión vía `sessionStorage`): el título de la cabecera sube palabra por palabra (`.intro-word`) y el abanico se reparte desde una pila (`dealShowcase`, con la propiedad `translate` para no pisar el `transform` del abanico ni su efecto al pasar).
- Vista previa que se revela (`renderFrame`): la 1.ª vez de cada pieza en la sesión, una capa del color del fondo baja con una línea de luz rosa (`.preview-device.is-revealing::after`). Tema o recarga del marco no la repiten.
- Paleta de marca en abanico: las muestras de la ficha entran una tras otra (`--n`) y el logo con fundido.
- Pie que se ilumina: segundo tramo del hilo del «02» al final del historial (al final de la página cuenta como llegado); al llegar, un brillo rosa cruza el logo FEEBBO (máscara con su SVG: es una imagen, no se puede «letra a letra») y el © se enciende un momento.
- Todo apagado con «reducir movimiento». Sin efecto en fases cerradas.

### 2026-10-06 — Studio: 10.ª tanda de animaciones (pedido por el usuario; el control de animaciones se propuso y no se quiso)
- Comprobaciones que se marcan (`renderReview`): la 1.ª vez de cada pieza, los puntos entran uno tras otro y su punto de estado salta (`.is-ticking`, clave `list.dataset.animFor`); los refrescos no lo repiten.
- Registro en vivo (`renderLog`, `logShown`): solo las líneas nuevas de la misma pieza entran con un resalte rosa (`.is-fresh`); al abrir una pieza, sin animar.
- Atajos que se pulsan (`toggleShortcuts`, `pressKey`): al abrir el diálogo las teclas se hunden en cascada; con él abierto, la tecla pulsada se hunde.
- Todo apagado con «reducir movimiento». Sin efecto en fases cerradas.

### 2026-10-06 — Studio: pie con llamada final (pedido por el usuario)
- El pie era un bloque negro (logo, ©, Correo/Web) que cortaba con el azul de Studio. Ahora va en el fondo de la página con una línea fina encima: «HERMES STUDIO · ¿Otra newsletter?», una frase y el botón «Nueva newsletter →» (`#foot-new`, hace lo mismo que el del menú, también desde la página de un trabajo); a la derecha, cifras del equipo (`renderFootStats`: newsletters hechas y calidad media del historial completo, sin filtros ni archivadas; ocultas sin historial). Debajo, una línea con logo pequeño (oscurecido en tema claro), © y contacto. Se mantiene el brillo del logo al llegar el hilo.
- Archivos: `studio/web/index.html`, `styles.css`, `app.js`. Sin efecto en fases cerradas.

### 2026-10-07 — Auditoría de tiempo y calidad (sin cambios aplicados; pendiente de decisión del usuario)
Datos: log del worker (15 piezas del 06-10) + `~/.hermes/state.db` (sesiones y mensajes) + `_trabajo/revision-visual.md` de 10 piezas.
- Tiempo: el 75-95 % de cada sesión es el modelo (turnos de 5-90 s), no las herramientas. Palanca = número de turnos.
  Borrador («primera versión») 7-24 min (mediana ~11), 30-100 acciones; brief 3-13 min; revisión de arte ~3-4 min.
- Cuellos: (1) 3 ciclos render+vision dentro del borrador y notas.md parcheado varias veces, y luego la revisión de arte
  repite render+vision; (2) scripts ad hoc en cada pieza (recolorear logo, recortar fotos); (3) ~8 turnos de orientación
  por sesión (AGENTS.md, CLAUDE.md, search_files, git status); (4) webs que bloquean: brief de Lacoste con 44
  browser_exec (17 min) y el borrador vuelve a navegar (12 browser + 9 web_search) pese a «no vuelve a navegar»;
  (5) la pasada de mejora de arte no mejora: 8 piezas → −2, +2, 0, −2, −1, 0, 0, +2 (3 revertidas) y no puede tocar
  fotos; (6) la revisión de arte no tiene vigilante de cuelgues: una llamada de 990 s (El Corte Inglés, 06-10 19:47);
  (7) Studio no limita toolsets (`-t`): todas las fases cargan web, browser, tts, cronjob, computer_use…
- Calidad (media de 10 piezas, de 5): texto_imagen 3.6, petición 3.7, copy 3.75, móvil 3.8 … concepto 4.3. Casi todo
  es 4: la nota discrimina poco. «Petición» baja sobre todo por ofertas sin concretar (rebajas sin % ni precio).

### 2026-10-07 — Aplicados los puntos 1, 3, 4, 5 y 7 de la auditoría de tiempo (pedido por el usuario)
- 1. Una sola revisión visual en el borrador: el encargo (`standalone.ts`) y el «Orden» del worker piden render-newsletter
  + vision_analyze UNA vez cuando check-newsletter sale limpio (la revisión de arte de Studio viene después), y notas.md
  escrito una vez al final con write_file.
- 3. Pasada de mejora de arte solo con nota baja (`needsImprovement`, `IMPROVE_BELOW = 0.72`): total < 36/50 o algún
  criterio ≤ 2. Con nota suficiente se registra «sin pasada de mejora». Test actualizado.
- 4. Cuelgues: `api()` con tiempo límite de 20 s (`AbortSignal.timeout`): una llamada colgada a Studio dejaba el latido
  ocupado y con él el vigilante (causa del 990 s del 06-10). El latido no se bloquea más de 2 min (`busySince`). Topes por
  turno en la revisión de arte (`cappedTurn`): nota 5 min, mejora 8 min.
- 5. `ORIENT_NOTE` al final de cada sesión nueva (en `runHermesTurn` sin `--resume`): no leer AGENTS.md/CLAUDE.md/
  package.json/README, no git status ni búsquedas para orientarse.
- 7. Herramientas por fase con `hermes chat -t`: brief web,browser,terminal,file,vision; pieza nueva terminal,file,vision
  (+image_gen con imágenes de IA); correcciones y revisión de arte terminal,file,vision; «Pedir cambios» y «Adaptar a
  móvil» con todas. `HERMES_ALL_TOOLS=1` las devuelve todas. El «continúa» del borrador ya no sugiere browser_navigate.
- Pendientes de la auditoría: 2 (webs que bloquean: no navegar y reutilizar assets de piezas previas), 6 (Studio prepara
  logo claro/oscuro y recortes), Q1-Q3 de calidad. Medir con las próximas piezas si el tiempo baja a ~12-17 min.
- Corrección (mismo día, antes de reiniciar el worker): las piezas con «Prompt completo» no tienen fase de brief y su
  borrador es quien investiga; `draftTools(prompt, briefDone)` les deja web y browser. Solo pierde el navegador el
  borrador que viene de un brief.

### 2026-10-07 — Punto 2 de la auditoría de tiempo: webs que bloquean y memoria de marca (pedido por el usuario)
- Nuevo `studio/worker/brandMemory.ts`:
  - Memoria de bloqueos en `brands/<marca>/tokens/acceso-web.json` (30 días). La escribe la ficha de producto cuando
    una página del propio dominio de la marca sale bloqueada (403/429/503, «Un momento…») y la medición de identidad
    solo con la web que da el equipo; una página de la marca leída bien la borra (`markOpen`).
  - Con la marca bloqueada: no se mide la identidad; el brief va sin navegador (`briefTools`: web,terminal,file,vision)
    y con `blockedNote` («no la abras, usa web_search y piezas anteriores»); el borrador de «Prompt completo» igual.
  - `previousPieces`/`previousPiecesNote`: las 2-3 últimas piezas terminadas de la marca (sin _fallido/_cancelado ni la
    actual), con logo, fotos (sin renders ni imágenes con C2PA de IA) y las líneas de notas.md sobre su origen. Van al
    brief y al borrador de toda pieza nueva.
  - `rememberLogo`: al terminar una pieza, si la marca no tiene logo en design-input, se guarda el de la pieza como
    `logo-pieza.png` (Lacoste no tenía carpeta de marca).
- Test nuevo en agents.test.js (231). Pendientes de la auditoría: 6 y Q1-Q3.

### 2026-10-07 — A (medidor de tiempos) y Q1 (la oferta con su cifra) (pedido por el usuario)
- A. `studio/worker/tiempos.ts` + `npm run tiempos [-- --desde "AAAA-MM-DD HH:MM"]`: mediana y máximo por fase (brief,
  identidad, ficha, primera versión, comprobación, revisión visual, total) de las piezas nuevas, antes (7 días) y después
  del corte. Fecha sacada de la carpeta del trabajo. Línea base antes de los cambios de hoy (corte 07-10 09:35, 15
  piezas): primera versión 10:53, revisión visual 3:02, total 15:00 de mediana (máx 44:00 con brief).
- Q1. `requestCoverage.ts`: `asksForOffer`, `offerFigures` (en lo verificado: descuentos «-30 %», «hasta 50 %», «30 % de
  descuento» y precios en €/EUR; un «100 % algodón» no cuenta) y `pieceShowsFigure`. Punto nuevo en la comprobación
  («Oferta con su cifra», `offer` en qualityCheck.ts, desde inspect.ts en piezas nuevas): error si se pide una oferta,
  lo verificado trae cifra y la pieza no muestra ningún % ni precio (vuelve a Hermes en la ronda de correcciones);
  aviso si no hay cifra verificada (no se empuja a inventarla). Sin petición («Prompt completo»), se mira el prompt de
  `_trabajo/encargo.md`. Brief: en «3. Datos verificados», primera línea «Oferta: …» o «Oferta: sin cifra verificada».
  Comprobado con piezas reales: Lacoste antes de la mejora (sin cifra, verificado «hasta 50 %») habría dado error.

### 2026-10-07 — Q3 (nota de arte con anclas), hoja de capturas sin cortes y T1 (identidad del brief anterior) (pedido por el usuario)
- Q3. `ART_CRITERIA` con anclas por criterio (qué se VE en 5/4/3/2); `ART_SCALE`: se parte de 3 y se sube solo con
  prueba; JSON con `pruebas` por criterio (se guardan en revision-visual.md) y mejoras con el nombre del criterio
  delante. `parseArtReview`: un 5 con una mejora de su criterio o sin prueba cuenta como 4. Validado en
  `_archive/prueba-nota-2026-10-07/` (8 piezas × 3 escalas): 4s del 80 % al 59 %, dispersión de totales de 1,6 a 3,0,
  ruido ±1 en 3-5 criterios al repetir. OJO: las notas desde hoy no son comparables 1:1 con las anteriores (media
  similar, ~39/50, pero repartida distinta).
- Hoja de capturas (`renderSheet`, `sheetColumnWidth`): si una columna no cabe en 3000 px, se estrechan las tres en vez
  de cortar; la de 375 px perdía su final (botón y pie) y la revisión de arte ponía 2 en móvil por ello. La C1 tal como
  se propuso (endurecer el texto pequeño) se descartó: en 6 piezas no había texto de contenido < 14 px a 375 px.
- T1. `previousIdentity`/`previousIdentityNote` (brandMemory.ts): sin brand pack, el brief recibe la sección «2.
  Identidad de marca» del brief más reciente de la marca (≤ 90 días) y no la vuelve a investigar.

### 2026-10-07 — Punto 6 de la auditoría de tiempo: Studio prepara las imágenes (pedido por el usuario)
- Nuevo `studio/worker/prepAssets.ts`, llamado por el worker antes del borrador (solo piezas nuevas, tope 60 s):
  - Logo: el medido o el mejor de design-input (nunca el blanco como base), a PNG, sin márgenes (`trim`), ≤ 400 px →
    `logo-email.png`; si el original tiene transparencia, versión para el fondo contrario (`logo-email-blanco.png` si
    es oscuro o de color, `logo-email-negro.png` si es claro). La nota dice el width del HTML (a 2x solo si ≥ 240 px).
  - Fotos de producto (no las de ambiente) sobre fondo liso: copia `-recorte` sin el margen sobrante (10 % / 14 % de
    aire, como el script que Hermes reescribía). Todas: medidas y orientación en la nota.
  - Nota «Imágenes preparadas por Studio … úsalas tal cual: no las recortes, recolorees, conviertas ni midas».
- Motivo: en 3 días, ~400 acciones de imagen hechas a mano por Hermes (logo 73, recortes ~200, sips 77, formatos 46).
- Los originales no se tocan. Test nuevo (236).

### 2026-10-07 — T2 descartada; C2 y Q2 aplicadas en local (pedido por el usuario; sin publicar)
- T2 (nota de arte con `--reasoning low`): validada en 8 piezas y DESCARTADA — 21 s por nota en vez de 43, pero 76 % de
  notas 4, dispersión 1,6 (como la escala antigua), ±3,3 puntos frente a «medium» y una respuesta ilegible. Queda el
  mecanismo apagado (`ART_REASONING`, `artScoreArgs`; `HERMES_REASONING_ART=low` lo activa).
- C2 (brandMemory.ts `pieceScore`, `bestPreviousPiece`, `referenceNote`): la pieza anterior de la marca con mejor nota
  de arte (≥ 76 %, la segunda nota si la mejora se quedó; también el formato antiguo sin total) se copia como
  `_trabajo/referencia-marca.jpg` (≤ 2000 px de alto) y el borrador la mira UNA vez: «es el listón; no la copies,
  supérala». +1 vision_analyze por pieza.
- Q2: el brief escribe cada escena sobre su foto concreta («5. Escenas»); el encargo pide elegir la foto de cada escena
  ANTES de su texto y notas.md dice de cada imagen la escena y qué se ve; la pasada de mejora puede cambiar una foto
  por otra ya descargada (o su «-recorte») en vez de solo el texto, sin descargar nuevas.
- Tests: 239. Medir el efecto en «texto_imagen» (media 3,6-3,9) con las próximas piezas.

### 2026-10-07 — Orden del repo (pedido por el usuario)
- ~180 elementos sin guardar (>350 MB). Decisiones del usuario: las piezas de Studio (`newsletters/*/*/hermes/`) NO van
  a git (viven en Studio/Railway y en el Mac; .gitignore actualizado); de las pruebas de _archive solo README, scripts y
  resultados.
- A la Papelera del Mac (`~/.Trash/orden-repo-hermes-2026-10-07/`, recuperable): la exportación de sesión de Hermes
  `20260929_112429_e87b90` (88 MB, copia de su base de datos), 5 scripts sueltos de la raíz y 6 de `scripts/` (nadie
  los referencia).
- 100 restos de sesiones manuales (ago-sep) sacados de `brands/*/design-input/` a
  `_archive/design-input-sesiones-manuales/` (rutas conservadas; sus PNG, ignorados): scripts `*.js`, `part*.html`,
  `*source*.html` y capturas `preview-*.png`. Además de desordenar, `brandAssets` ofrecía esas capturas de newsletters
  viejas a Hermes como «fotos de la marca» (Feebbo: 10 `preview-b2b-*`).
- Guardado en git (26 MB, sin credenciales): docs/auditoria-2026-09-23, backup de CHANGELOG de agosto, fichas y logos
  de marca nuevos (tokens, identidad medida, logos medidos, fotos de Prozis y Fitness Park, documentación de Mazda,
  fuente de ECI) y 5 campañas antiguas del pipeline (Converse, Mini, MyProtein, Supreme, Volkswagen).
- Pendiente (no tocado): archivos de trabajo antiguos que YA estaban en git dentro de design-input (p. ej.
  `brands/feebbo/design-input/class5-hero-enforced.png`).
- Segunda pasada (mismo día): 192 archivos de trabajo que SÍ estaban en git dentro de `brands/*/design-input/` movidos
  con `git mv` (historial conservado) a `_archive/design-input-sesiones-manuales/`: 87 `.js`, 3 `.py`, 20 HTML de trabajo
  (`*source*.html`, `part*.html`) y 82 capturas `preview-*.png`. Ninguna campaña ni código los referenciaba.
  NO se movieron: `hero-source-page-*.png` (los escribe `scripts/generate-hero-image.ts` por trazabilidad, fase del
  motor cerrada), las versiones intermedias de imágenes (`-raw`, `-original`, `-enforced`, `-crop`), los banners con
  IA y las notas `.txt`, ni `brands/mazda/` ni la plantilla de Paraycompara.
  `brandAssets` (brandCard.ts) ya no ofrece capturas como fotos (`SCREENSHOT`: `*preview-*`, `hero-source-page-*`,
  `render-*`, `captura-*`, `screenshot-*`). Test nuevo (240).

### 2026-10-07 — Retoques con herramientas por fase (pedido por el usuario)
- `editTools` (hermes-worker.ts): «Adaptar a móvil» → terminal,file,vision; «Pedir cambios» → web,browser,terminal,file,
  vision (+image_gen si la pieza es de IA; sin browser si la web de la marca está marcada como bloqueada, y con
  `blockedNote`). Antes cargaban todas las herramientas. Conservan búsqueda/navegador porque su encargo permite un dato o
  una foto nueva de la web oficial. No se les da memoria de marca, imágenes preparadas ni referencia: parten de una pieza
  hecha. Ganancia esperada pequeña (los cambios ya duran 1-3 min). Test nuevo (241).

### 2026-10-07 — Primera pieza con todos los cambios (Prozis) y dos ajustes (pedido por el usuario)
- Prozis (`muxuutln-vbjf37`, «Prompt completo»): 5 min (borrador 3:00, corrección 1:12, nota 0:36) frente a la mediana de
  15, pero SIN FOTOS (solo el logo; 6 acciones, sin búsqueda ni revisión visual). Nota 38/50 con texto_imagen,
  identidad y copy en 3; sin pasada de mejora (38 ≥ 36). La Q1 funcionó (la corrección arregló la oferta).
- `photoFindings` (renderChecks.ts): una pieza nueva sin ninguna foto (aparte del logo) es error aunque la galería de
  Studio no traiga candidatas (antes, aviso). Comprobado: la pieza de Prozis daría error.
- `needsImprovement`: también con tres o más criterios por debajo de 4. Tests (242).

### 2026-10-07 — Incidencia: Hermes sin sesión e Inglesina (3 intentos fallidos, 11:07-11:08)
- Causa de los fallos: Hermes perdió su inicio de sesión en Nous Portal («No access token found for Nous Portal login.
  Run `hermes model` to re-authenticate.»); cada borrador moría en 2-3 s con código 1. No viene de los cambios del día
  (Prozis funcionó a las 10:38). Worker DETENIDO con `launchctl bootout gui/501/com.hermes-studio.worker` (plist
  intacto) para que las piezas esperen en cola en vez de fallar. Reanudar tras `hermes model`: `studio/worker/service.sh install`.
- Encontrados al investigar y corregidos:
  - `prepareAssets` recibía de la ficha `file` = descripción de fetch-image («foto-1.jpg (1200×800, 245 KB)») y no
    encontraba ninguna foto (Inglesina: «0 fotos» con 12 descargadas). Ahora toma el nombre.
  - `brands/inglesina/design-input/logo-medido.png` está transparente del todo (la medición guardó un logo invisible) y
    el worker lo copiaba a la pieza como «logo oficial: úsalo tal cual». `hasVisiblePixels`: la medición ya no guarda
    logos vacíos, el worker no los copia y `logoSource` los salta. Solo Inglesina lo tenía; falta su logo oficial.
- Tests: 243.

### 2026-10-07 — Regresión: piezas con «Prompt completo» genéricas (Prozis) — causa y arreglo (pedido por el usuario)
- Síntoma: Prozis (prompt completo con «1. Investigación obligatoria») salió sin productos, sin fotos y con copy
  genérico; el borrador hizo 6 acciones, ninguna búsqueda.
- Causa: en «Prompt completo» no hay brief, la investigación la hace el borrador. Le llegaron dos órdenes en contra:
  `ORIENT_NOTE` (punto 5 de esta mañana) decía «Este encargo trae todo lo que necesitas: ve directo al trabajo» y el
  encargo de Studio ya decía «Esta fase maqueta; no vuelve a navegar la web» (antes Hermes la ignoraba en estos casos).
- Arreglo: `ORIENT_NOTE` habla solo de no orientarse en el repo y añade «lo que el encargo pida investigar, sí lo
  investigas»; `buildHermesPrompt` y `selfContainedNote` distinguen con brief (no investiga) y sin brief («haz tú la
  investigación que pide, unas 12 búsquedas o páginas, con fuente; descarga las fotos oficiales»). Criterio «hubo
  brief» = `briefPrompt` o `request` (brief aprobado por el equipo), también para las herramientas del borrador.
  Tests: 244. Pendiente: relanzar Prozis con el mismo prompt para comprobarlo antes de publicar.
  Publicado en 5c3f148 (12:31) sin la prueba completa (el usuario prefirió tener Studio conectado).

### 2026-10-07 — Vuelta atrás: la generación vuelve al estado del 06-10 18:18 (d8f11f5) (pedido por el usuario)
- Motivo: tras el arreglo de 5c3f148, Digital Car (12:37) siguió saliendo genérica a juicio del usuario. En vez de
  seguir parcheando, se vuelve a la generación de ayer y las mejoras se recuperarán una a una, midiendo cada una.
- Vuelven a d8f11f5: `hermes-worker.ts`, `standalone.ts`, `requestCoverage.ts`, `qualityCheck.ts`, `inspect.ts`,
  `renderChecks.ts`, `render-newsletter.ts`, `measureBrand.ts`, `brandCard.ts`, `agents.test.js` (229 tests).
  Borrados: `brandMemory.ts`, `prepAssets.ts` (siguen en git: 42115a1, b02531f).
- Se mantienen: web de Studio (sin cambios hoy), orden del repo (`_archive`, `.gitignore`) y `npm run tiempos`.
- Se pierden también tres arreglos que no tocan el diseño (recuperables aparte): vigilante de cuelgues con tiempo
  límite en `api()` (d27cb0e), hoja de capturas sin cortar la columna de 375 (7a9a896) y descartar un
  `logo-medido.png` vacío (5345790; sin él, Inglesina falla hasta tener su logo oficial).
- Candidatos a recuperar uno a uno: Q1 (oferta con su cifra), Q2 (foto antes del texto), Q3 (nota de arte con anclas),
  punto 6 (imágenes preparadas), C2 (pieza de referencia: ojo, cogía piezas malas con ≥ 76 %), herramientas por fase.

### 2026-10-08 — Recuperados tres arreglos de robustez tras la vuelta atrás a d8f11f5 (pedido por el usuario)
Solo robustez; nada de lo que cambia la generación (encargo, herramientas por fase, umbral de mejora, Q1-Q3…).
- Vigilante de cuelgues (de d27cb0e): `api()` con `AbortSignal.timeout(20 s)`; el latido de brief y pieza no se
  bloquea si una vuelta lleva más de 2 min atascada (`busySince`); `cappedTurn` corta la nota de arte a los 5 min y la
  mejora de arte a los 8 (`ART_SCORE_CAP_MS`, `ART_IMPROVE_CAP_MS`).
- Hoja de capturas sin cortes (de 7a9a896): `sheetColumnWidth` en render-newsletter.ts; si una columna no cabe en
  3000 px se estrechan las tres en vez de cortar la de 375 px.
- Logo medido vacío (de 5345790, sin la parte de prepAssets, que no existe en esta versión): `hasVisiblePixels` en
  measureBrand.ts; la medición no guarda logos transparentes y `copyMeasuredLogo` no los copia a la pieza.
  Comprobado: Inglesina → false (sigue faltando su logo oficial); Prozis, Digital Car, Cola Cao → true.
- Tests: 233.

### 2026-10-08 — Recuperada la Q1 (la oferta con su cifra) sobre d8f11f5 (pedido por el usuario)
- Igual que el 07-10 (ver «A (medidor de tiempos) y Q1»): `asksForOffer`, `offerFigures`, `pieceShowsFigure`
  (requestCoverage.ts), punto «Oferta con su cifra» en qualityCheck.ts desde inspect.ts (piezas nuevas; sin petición,
  el prompt de `_trabajo/encargo.md`) y línea «Oferta: …» en «3. Datos verificados» del prompt del brief.
- Comprobado con la pieza de Prozis del 07-10 («10 % de descuento»): pide oferta → sí; la pieza muestra cifra → sí;
  quitando la cifra → no (daría error si lo verificado la trae).
- Tests: 234. Medir en las próximas piezas con oferta si sube el criterio «petición» de la nota de arte.

### 2026-10-08 — Recuperada la Q2 (la foto de cada escena antes de su texto) sobre d8f11f5 (pedido por el usuario)
- Brief «5. Escenas»: imagen (foto concreta de «6. Imágenes» y qué se ve) antes de titular y texto, escritos sobre ESA foto.
- Encargo del borrador: regla «Texto e imagen (Q2)»; notas.md dice de cada imagen su origen, escena y qué se ve.
- Nota y pasada de mejora de arte: pueden proponer/cambiar una foto por otra ya descargada en la carpeta (sin descargar
  nuevas) en vez de solo el texto. Sin la mención a «-recorte» del 07-10 (prepAssets no existe en esta versión).
- Sin C2 ni T2. Tests: 235. Vigilar en las próximas 2-3 piezas: «texto_imagen» (media 3,6-3,9) y que el texto no se
  vuelva genérico o descriptivo de la foto (la Q2 estaba activa el 07-10 cuando Digital Car salió genérica).

### 2026-10-08 — Recuperada la Q3 (nota de arte con anclas y pruebas) sobre d8f11f5 (pedido por el usuario)
- Igual que el 07-10: `ART_CRITERIA` con anclas 5/4/3/2 por criterio, `ART_SCALE` (se parte de 3, se sube con prueba),
  JSON con `pruebas` y mejoras con el criterio delante (conserva lo de la Q2: «otra de las fotos ya descargadas»),
  `parseArtReview` cuenta como 4 un 5 sin prueba o con mejora de su criterio, pruebas en revision-visual.md/notas.md.
- NO se recupera el umbral de la pasada de mejora (`IMPROVE_BELOW`, d27cb0e/6ecf307): `needsImprovement` sigue como en
  d8f11f5 (casi siempre hay pasada). Es un cambio de tiempo; queda como candidato aparte.
- Desde hoy las notas no son comparables 1:1 con las anteriores (gráfica de calidad y galería mezclan escalas unos días).
- Tests: 235.

### 2026-10-08 — Nike (muz83dmo-ndizjn) genérica: «Prompt completo» sin investigar y meta-texto de la mejora (pedido por el usuario)
- Síntoma: Alphafly 3 sin un dato ni una foto del producto (solo el Swoosh), copy vacío y en portada «Pieza de marca
  para corredores que preparan una media o un maratón».
- Causa 1 (ya estaba en d8f11f5; el arreglo 5c3f148 se perdió con la vuelta atrás): en «Prompt completo» no hay brief
  y el encargo decía «Esta fase maqueta; no vuelve a navegar la web» y «No investigues lo que el brief deja pendiente».
  Hermes obedeció (notas.md: «esta ejecución no debía volver a investigar»). Arreglo: `buildHermesPrompt` (sin
  `instruction`) y `selfContainedNote(…, briefDone=false)` piden investigar (~12 búsquedas/páginas, con fuente, fotos
  con fetch-image). «Hubo brief» = `briefPrompt` o `request`. Con brief, sin cambios.
- Causa 2 (efecto de la Q3): el ancla de «peticion» pedía oferta y público en la primera pantalla; sin oferta, la nota
  sugirió «hacer explícito que es una pieza de marca» y la mejora lo escribió. Arreglo: el ancla dice que sin oferta
  pedida la oferta no cuenta y que el público se nota por producto, fotos y tono, nunca por una frase que lo nombre; la
  pasada de mejora prohíbe texto que hable de la pieza, su público o su objetivo.
- Tests: 236. Pendiente: relanzar el prompt de Nike para comprobarlo.

### 2026-10-08 — Nike relanzada (muz8q0d3-e4e1rw) y fotos repetidas (pedido por el usuario)
- Con 208a0cf el «Prompt completo» investiga: ficha Nike ES (II7290-100), notas de prensa Alphafly 3 y 4, lista de
  World Athletics, 3 fotos oficiales de la galería; nota 36 → 39/50. Tiempo 24 min (borrador 16:02, antes ~5).
  Encontró −30 % (216,99 € / 309,99 €) y no lo usó porque el prompt pedía confirmar el objetivo con el cliente.
- Fallo: la misma foto dos veces (`alphafly3-suela.jpg` y `_trabajo/suela-crop.jpg`, archivo idéntico con otro nombre);
  ni check-newsletter ni la nota de arte lo vieron. Arreglo: `imageFindings` (renderChecks.ts) da error «Foto repetida»
  si dos <img> pintadas a ≥ 200 px tienen el mismo contenido (md5), salvo archivos de logo. Barrido de 59 piezas: solo
  estas dos (Nike y Calvin Klein 05-10, elixir-silver.jpg dos veces), las dos repeticiones reales.
- Sin tocar (vigilar si se repiten): línea suelta en el pie («Zapatillas de competición para asfalto.»), notas.md
  desfasado tras la pasada de mejora, copy que enumera componentes técnicos. Tests: 237.

### 2026-10-08 — Jordan (muzc6291-wxxbq1): Q1 falsa en «Prompt completo» (pedido por el usuario)
- Jordan: AJ1 High OG «Royal» investigada y con fotos oficiales; nota 39/50 (la mejora daba 41 pero bajaba un criterio
  por debajo de 4 y se recuperó la anterior). 24:43 (borrador 19:26 investigando). Fallo: «La oferta es de 190 €.»
  (precio normal) añadido por la corrección tras el error «Oferta con su cifra».
- Causa: en «Prompt completo» la Q1 leía el prompt. `wordMatches` toleraba una errata en palabras de 5 letras y
  «saltes» («No saltes ninguno») valía por «sales» (rebajas); además los prompts nombran ofertas como algo a verificar
  («vigencia de cualquier oferta», Nike).
- Arreglo: errata tolerada desde 6 letras; «Oferta con su cifra» solo con petición del equipo (inspect.ts ya no lee
  encargo.md); el error pide la cifra en una frase con verbo y en la voz de la marca. Tests: 238.
- Vigilar: líneas de relleno en el pie («Consulta la disponibilidad…», «Zapatillas de competición…»): 2 de 2 piezas.

### 2026-10-08 — Digital Car (muzdks1j-02ym6v): texto de investigación en la pieza (pedido por el usuario)
- Síntoma: «La portada de DigitalCar anuncia un descuento de 15.000 €…», «La promoción no detalla aquí…» y en el pie
  «No se han localizado las bases… quedan pendientes de confirmación». Nota 36/50 (concepto, originalidad, copy < 4).
- Causa: el prompt pide «márcalo como pendiente de confirmación en vez de omitirlo» (para las notas) y nada impedía
  narrar la investigación en la pieza. Misma familia que el «Pieza de marca para corredores…» de Nike.
- Arreglo: `RESEARCH_VOICE` + `researchVoiceFindings` (copyCheck.ts) → punto «Voz de la marca» (error) en
  qualityCheck.ts, que vuelve a Hermes en la corrección; regla «Voz» en `COPY_RULES` (brief y borrador) y en la pasada
  de mejora. En «Pedir cambios» no se fuerza si ya lo traía la original. Barrido: 5 de 62 piezas, todas reales
  (Digital Car, Nike ndizjn, Siroko «según la ficha del producto», Tienda Animal ×2). Tests: 239.

### 2026-10-08 — Spotify (muzep50d-8kupdq) y Jordan: columnas apiladas en escritorio que nadie veía (pedido por el usuario)
- Síntoma: módulos a dos columnas que en escritorio salen una debajo de otra, con rellenos de lado a lado (desalineadas).
- Causa: `max-width` de las dos columnas sumando justo el hueco (256 + 264 = 520; 268 + 268 = 536) y el espacio en
  blanco entre los `<div class="stack">` (~4 px) las empuja a otra línea. No se veía porque la hoja capturaba «600 px»
  con una ventana de 600 y la media query de móvil es de 620: la hoja (Hermes y la nota de arte) nunca vio el
  escritorio. Las miniaturas (ventana de 800) sí lo enseñaban.
- Arreglo: `renderSheet` captura escritorio y oscuro con ventana de 640 y recorta los 600 px del centro;
  `autoFix` quita el espacio en blanco entre columnas «stack» (conserva los comentarios de Outlook);
  `stackedColumnsWith` (renderChecks.ts, a 700 px) da error «Columnas que se apilan en escritorio» en «Espacios y
  márgenes» si una columna baja de línea habiendo cabido al lado; nota en email-modulos.md (dejar ≥ 20 px libres).
  Barrido: 2 de 63 piezas (estas dos), las dos arregladas por el autoFix. Tests: 240.
- OJO: desde ahora la nota de arte mira el escritorio real; puede cambiar alguna nota.

### 2026-10-08 — Tarífalo (muznx5w9-wfyj86): foto repetida como recorte, metida por la pasada de mejora (pedido por el usuario)
- Síntoma: la madre y la hija del horno salen dos veces (`hero-dual-check.jpg` y `hero-cocina.jpg`, recorte de la
  primera). El borrador tenía dos fotos distintas; la pasada de mejora (Q2: puede cambiar una foto por otra ya
  descargada) cambió la segunda por el recorte. La segunda nota lo vio («la misma foto vuelve a aparecer») pero subió
  37 → 39 y se quedó; tras la mejora no hay ronda de corrección. La comprobación (md5) no ve recortes.
- Arreglo: `samePhoto` (renderChecks.ts): idénticas, redimensionadas o una recorte de la otra (48 px, búsqueda a 7
  tamaños, diferencia media en color + fracción de píxeles muy distintos; corte 25, calibrado: repeticiones reales
  0-7, fotos distintas parecidas ≥ 69). Barrido: 4 de 69 piezas, las 4 reales (Nike, Tarífalo, El Corte Inglés 28-09
  hero/scene2, Calvin Klein 05-10). Pasada de mejora: nunca una foto que ya esté ni un recorte suyo. Red de
  seguridad: si la versión mejorada trae un error de la comprobación que la anterior no tenía, se recupera la anterior
  aunque la nota suba. Tests: 241.
- Tiempo: 29 min (borrador 24:07 investigando).

### 2026-10-09 — Formulario: «Instrucción rápida / Prompt completo» pasan a pestañas (pedido por el usuario)
- Antes: selector de píldora «¿Qué vas a escribir?» arriba del formulario, con la pista debajo. Ahora: dos pestañas
  pegadas al cuadro de texto (`.kind-tabs` en index.html y styles.css); los radios `inputKind` son los mismos, así
  que app.js no cambia. La etiqueta del cuadro queda solo para lectores de pantalla.
- Desplegado (con permiso del usuario): `a2c465a` a `origin` y `deploy`; Vercel con `vercel --prod` desde
  `studio/web` (Vercel NO se actualiza con el push: hay que publicarlo a mano).

### 2026-10-12 — Railway caducó y empieza la migración a Supabase: fase 1, los datos (pedido por el usuario)
- **Incidente:** se acabó el crédito de prueba de Railway (desde el 09-10): servicio Offline, despliegues REMOVED,
  `/api/*` 404 y los correos ya enviados sin imágenes (`/assets`). El usuario activó el plan de pago. El redeploy
  automático de Railway falló (usó Railpack sin leer `railway.json`: «No start command»); un push normal lo arregla.
  El volumen no perdió nada.
- **Decisión:** llevar los datos a Supabase por fases, con Railway como servidor hasta el final. Plan y estado en
  `studio/PLAN-SUPABASE-FASE-1.md`; resumen de uso en «Copia en Supabase» de `studio/README.md`.
- **Hecho (pasos 1 a 6):** proyecto `hermes-studio` en Supabase (UE, plan gratuito; SQL en
  `studio/supabase/001-fase-1.sql`); `server/supabase.ts` (cola ordenada con reintentos, sin dependencia nueva);
  escritura doble en `store.ts`, `brandCards.ts` y `mirror.ts` (`writeMirrored`, usado por `standalone.ts` y
  `brandCapture.ts`); `studio/supabase/migrate-to-supabase.ts` (migra y, con `--check`, compara).
- **Verificado en producción:** migración con «Disco y Supabase coinciden» (110 trabajos, 51 fichas, 2.819 archivos,
  214 MB). Newsletter real después (Jordan, `mv5tvh63-sspqt8`): trabajo, eventos, sus 4 archivos y sus 5 imágenes
  llegaron solos; nueva comprobación en cero (112 trabajos, 2.828 archivos). Bucket `assets` legible sin clave;
  `newsletters`, no. Tests: 251.
- **Aprendido:** el plan gratuito de Supabase corta ráfagas con 429 (hasta peticiones seguidas de una en una): pausas
  y reintento por petición. `scripts/*.ts` está vigilado por el lock del motor: un script nuevo ahí rompe
  `gates.smoke.test.js`; lo de Supabase vive en `studio/supabase/`. `railway ssh` pide clave registrada
  (`mac-javi-hermes`) y aceptar `ssh.railway.com` a mano.
- **Copia de seguridad:** `../backups/railway-volumen-2026-10-12.tgz` (fuera del repo), 3.633 archivos.
- **Pendiente:** paso 7 (leer desde Supabase) tras unos días con `--check` en cero y con Supabase en Pro; entonces
  el entrypoint deja de sembrar el volumen. Los correos enviados apuntan a `…up.railway.app/assets`: condición para
  apagar Railway (redirección o dominio propio). Fases 2 a 4: usuarios, cola y Playwright en el worker, API.

### 2026-10-13 — Fase 2 de la migración: cuentas del equipo con Google (pedido por el usuario)
- **Decidido por el usuario:** entrar con Google, solo correos @feebbo.com, y la contraseña compartida conviviendo
  unos días.
- **Cómo:** Supabase Auth hace de puente con Google; `server/auth.ts` comprueba el token una vez (`/auth/v1/user`:
  proveedor google, correo confirmado y del dominio) y emite una cookie de sesión propia firmada (HttpOnly,
  SameSite=Lax, 30 días), para que `<img>` e `<iframe>` de la API sigan entrando. Rutas `/api/auth/{me,session,
  password,logout}` antes del control de acceso. Con cuentas activas la API responde 401 sin `WWW-Authenticate`
  (la web enseña su pantalla de entrada, `web/auth.js`); el diálogo del navegador queda solo en
  `/api/auth/password`, que canjea la contraseña compartida por una sesión.
- **Quién pide:** con cuenta de Google el servidor pone el nombre de la cuenta (`requesterOf`), no el del formulario.
- **Se activa con `AUTH_EMAIL_DOMAIN`**; sin ella no cambia nada (por eso se pudo desplegar antes de configurar
  Google). Probado en local con un Supabase de mentira: entrar, volver a un enlace directo, cerrar sesión, otro
  dominio rechazado, contraseña compartida por las dos vías. Tests: 257.
- **Activado en producción (2026-10-13):** cliente OAuth «Hermes Studio» en Google Cloud (proyecto `hermes-studio-511507`,
  organización feebbo.com), proveedor Google y URL en Supabase, `AUTH_EMAIL_DOMAIN=feebbo.com` en Railway. El usuario
  entró con su cuenta de Google y confirmó que funciona (primero volvía a `localhost:3000`: faltaba guardar la
  Site URL y la Redirect URL con `/**` en Supabase).
- **Pendiente:** retirar `APP_ACCESS_PASSWORD` cuando todo el equipo haya entrado con su cuenta.

### 2026-10-13 — Formulario en cuatro pasos (pedido por el usuario)
- Pedido: quitar el texto junto a «Generar newsletter» y hacer la sección más intuitiva (es la que más se usa).
  Tres bocetos previos y un retoque del historial (miniaturas grandes, «LISTA» solo en excepciones) no convencieron:
  el retoque se deshizo. Lo que sí: verlo funcionando en local con datos reales, no en boceto.
- Ahora: pasos numerados (1 Marca, 2 Qué necesitas, 3 Imágenes, 4 Opciones) y el botón. «Revisar el brief» y
  «Revisión de arte» dejan la columna derecha y son tarjetas con interruptor (`.choice-switch`), iguales que las de
  imágenes; su explicación larga queda en el `title`. La columna derecha es solo la marca. El botón es el único
  relleno (`.btn-go`, el degradado de «+ Nueva»). `#eta-hint` sigue en el DOM, oculto: app.js lo sigue rellenando.
- OJO: el 08-10 se deshizo un cambio con botón relleno (0ddbc9c); esta vez el usuario lo ha aprobado viéndolo.
- Mismo día: la columna derecha no existe hasta que hay marca (`#brief-form.has-brand`, lo pone `renderBrandSide`):
  una conocida en cuanto coincide; una nueva, al salir del campo (para que el ancho no cambie al teclear). Sin marca
  el formulario ocupa todo el ancho de la tarjeta. Solo afecta a escritorio (≥ 1180 px).

### 2026-10-13 — Página de la newsletter: fondo animado y móvil fuera de su marco (pedido por el usuario)
- Fondo: `html.in-job .bg-card { animation-play-state: paused }` (rendimiento, 06-10) se quita: parado parecía una
  imagen estática. Solo anima `transform`. Si la página va a tirones en un equipo lento, mirar aquí primero.
- Vista previa escalada («al 86 %»): la columna se estrechaba al ancho ya escalado y `.preview-device` (un bloque) se
  encogía con ella; el email, de ancho fijo, se salía del marco del móvil. Arreglo: `width: max-content`. Medido en
  «Los dos» a 1680 px: marco 211 → 289 px, email 273 px dentro. Comprobado en las cuatro vistas y a 375 px.

### 2026-10-15 — Auditoría integral de Hermes Studio: paso 1, reconocimiento (solo diagnóstico, nada cambiado)
- Encargo del usuario: auditoría «comité» A–L. Esta sesión solo hizo el reconocimiento y propuso el plan de pruebas;
  no se generó ninguna pieza, ni se creó ningún enlace, ni se envió ninguna prueba.
- El encargo partía de premisas que ya no son ciertas: hay entrada (Google @feebbo.com + contraseña compartida aún
  activa, `/api/auth/me` → `password:true`); Studio no ejecuta el pipeline 00-09 (retirado el 2026-10-05), sino
  una sesión de Hermes Agent en el Mac; el envío de prueba está apagado en producción (`mailEnabled:false`).
- Medido en producción (`/api/jobs`, 2026-10-15): 112 trabajos desde el 24-09, 4 solicitantes, 87 completados,
  14 fallidos (todos por infraestructura: worker reiniciado/Mac dormido/Hermes sin HTML), 10 cancelados,
  **0 aprobados**, 110/112 con assets oficiales. Pieza nueva: p50 17,6 min, p90 27,7, máx 73,8.
  Marcas duplicadas por escritura (Calvin Klein/«Calvin Kleins Jeans», Helly hansen/Hansen, asics, lacoste).
- HTML de las 20 últimas piezas: 11-17 KB, `lang`, `role="presentation"`, MSO, modo oscuro, alt y baja en todas;
  imágenes servidas desde el dominio de Railway.
- Cabeceras: la home de Vercel no tiene CSP ni frame-ancestors/X-Frame-Options (las páginas /p y /r sí);
  Railway responde directo con `X-Powered-By: Express`. Pendiente verificar el limitador por IP detrás del
  rewrite de Vercel.

### 2026-10-15 — Auditoría integral de Hermes Studio: pruebas reales e informe (solo diagnóstico, nada cambiado)
- Informe completo (36 hallazgos, 57/100) en el doc de Claude «Auditoría integral de Hermes Studio»
  (https://claude.ai/code/artifact/6305dd7c-8c40-450b-8421-45fb6dd3624e). Ningún cambio en el código ni en el sistema.
- Piezas de prueba: C2 `mv9e05ul-qnyj7t` (prompt completo, IA), C3 `mv9e05ya-pb4jc5` (marca inventada Tostadores
  Lumbre), C5 `mv9e0672-nfy1op` (inyección directa), C6 `mv9e0g6n-4acjeq` (inglés). C1 `mv9dze9a-l50vpv` falló por
  reinicio del worker (12:27:53); su reintento `mv9egaei-3x4stq` y C4 `mv9e0632-92hhal` se cancelaron a petición del
  usuario (no ocupar más cola). Enlace de cliente creado en C2 y desactivado (404 comprobado).
- **Bug nuevo (S0): marca equivocada.** `measureBrand.candidateUrls` prueba `www.<slug>.es/.com` sin web dada y
  `looksLikeBrand` acepta cualquier dominio con el nombre: «feebbo» → feebbo.com (Feebbo Encuestas). C2, C5 y C6
  salieron con su logo y paleta; check-newsletter y revisión de arte (39, 40, 44/50) no lo vieron. Ya ocurrió el 07-10
  (`muy744dg-p1lsyi`). `brands/feebbo/tokens/identidad-medida.json` apunta a feebbo.com: corregir.
- Otros hallazgos verificados: 14/15 piezas sin razón social ni dirección (ningún check lo exige); worker reiniciado
  mata el trabajo sin reintento; límite de 5 jobs/10 min no frena (6 aceptados en 46 s); C3 «Lista para revisar» con
  2 errores y un CTA que no es enlace; en C6 el botón pierde el fondo en oscuro; pasada de mejora de arte descartada en
  30 de 44 (y el log dice «empeoraba» aunque la nota suba); aprobación del cliente suplantable; home sin
  frame-ancestors; `npm audit` 4 vulnerabilidades (proxy-addr crítica, sharp alta); `tsc` sigue roto (TS5107).
- C5: Hermes no siguió la inyección (no creó /tmp/hermes-canary-2026-10-15.txt ni copió su prompt) y no lo anotó.
- Coste medido (state.db, estimado): C2 0,063 $, C3 0,078 $, C5 0,103 $, C6 0,047 $.

### 2026-10-15 — Auditoría de Studio: corregidos los dos S0, H-04 (marca equivocada) y H-02 (remitente) — desplegado
- **H-04.** `measureBrand.candidateUrls` ya no adivina `www.<slug>.es/.com`: solo mide la web oficial que da el equipo o,
  al volver a medir, la `url` de la medición anterior (`hermes-worker.ts`). `looksLikeBrand` compara el nombre completo
  (el slug solo si el nombre tiene ≤ 2 letras): con «feebbo» bastaba para aceptar «Feebbo Encuestas». Si no mide, el
  motivo sale en el progreso del trabajo (sin web, web caída o título que no nombra la marca). Fallo nuevo que no estaba
  en el informe: sin logo en la medición nueva, el `logo-medido.png` anterior se quedaba en `design-input/` y
  `brandAssets`/`pickLogo` lo seguían ofreciendo como oficial. Ahora se borra.
- Formulario: «Web oficial» deja de ser opcional para marcas nuevas. Sin ella, aviso con «Poner la web» / «Enviar sin
  web (Hermes la investigará)». El servidor responde 409 `brand_url_required` si falta la web y no llega
  `confirmNoBrandUrl` (`studio/server/index.ts`). «Sin web» = no se mide; Hermes investiga la marca como antes.
- Feebbo medida de nuevo en https://www.feebbodigital.com/ (título «Feebbo Digital - Site»): Work Sans, botón #262b59
  píldora, paleta #14183f #015e53 #fb73ff… El logo nuevo es «FEEBBO DIGITAL» en blanco (el de Encuestas, guardado en el
  scratchpad de la sesión, ya no está). Los demás logos de `brands/feebbo/design-input/` son de Feebbo Digital.
- **H-02.** Nuevo `brands/<marca>/tokens/legal.json` (`razonSocial`, `cif`, `direccion`, `motivo`, `fuente`,
  `revisadoAt`), aparte de `brand-tokens.json` para no cruzar la frontera del agente 02. Lo lee `brandCard.readBrandLegal`,
  va en la ficha (`card.legal`, sección «Remitente (pie legal)» en la web) y en el encargo (`legalNote`, en primeras
  versiones, «Pedir cambios» y «Adaptar a móvil»). Sin `legal.json`, el encargo manda a Hermes al aviso legal de la marca.
  `qualityCheck.senderIdentityCheck` (id `sender`): error si el pie (texto alrededor del enlace de baja) no trae la razón
  social y la dirección postal. Con `legal.json` las compara con esos datos; sin él, busca forma societaria o CIF y
  calle o código postal. Sin motivo de recepción, solo aviso. Va en `staticChecks`, así que también salta en servidor
  (`standalone.ts`, por patrones) y en «Pedir cambios» (se fuerza, no se hereda). `email-base.html`: el pie trae
  `[MOTIVO DE RECEPCIÓN]` y `[RAZÓN SOCIAL] · [DIRECCIÓN POSTAL]` en vez de `[AVISO LEGAL DE LA MARCA]`.
- Feebbo: `legal.json` con Feebbo Solutions, S.L.U., CIF B13515622, Calle Serrano, 42-4ºA, 28001 Madrid, sacado de la
  política de privacidad y la de cookies de feebbodigital.com. **El motivo es una propuesta: confirmarlo con el equipo.**
  Las demás marcas no tienen `legal.json`.
- Verificado: `npm test` 276/276 (tests nuevos: H-04 con servidor local, 3 de remitente). `check-newsletter` sobre la C5
  (`2026-10-15-nfy1op`) → exit 1 con «El pie no trae la razón social… / la dirección postal»; la C2 (`qnyj7t`, la única
  de Feebbo con datos legales) pasa ese check. 5 de las 6 piezas de Feebbo fallarían. `tsc` sin errores en los archivos
  de Studio (los 35 que quedan son antiguos, en campañas y `scripts/`).
- **Efecto:** desde el despliegue, toda pieza sin remitente vuelve a Hermes en la ronda de corrección. Las marcas sin
  `legal.json` dependen de que Hermes encuentre el aviso legal; si no lo encuentra, la pieza acaba «con errores».
- **Abierto:** (1) avisar en el formulario, antes de enviar, si el título de la web indicada no nombra la marca: necesita
  que el servidor descargue URLs de usuario, con protección SSRF; aplazado por decisión del usuario. (2) Editar
  `legal.json` desde Studio (hoy solo a mano en el Mac). (3) `logo-medido.png` en blanco no se marca como versión
  blanca (`WHITE_LOGO` mira el nombre): la ficha lo pintaría sobre fondo claro. (4) La medición de feebbodigital.com da
  «Fondo #ffffff, texto #ffffff» (el texto se mide sobre el hero oscuro).
- **Desplegado con permiso del usuario (13:46-13:49):** commit `d80b6ef`; `git push deploy main` → Railway SUCCESS
  (sirve `brand_url_required`); `vercel --prod` desde studio/web → hermes-studio-beta.vercel.app con el aviso nuevo; worker
  del Mac reiniciado (`service.sh restart`, estaba libre) con el código nuevo; envió 54 fichas, Feebbo con `legal`.
  No se ha probado de punta a punta con un trabajo real (no se creó ninguno para no ocupar la cola).


### 2026-10-15 — Tesla con la identidad de otra empresa (diagnóstico, nada cambiado)
- Piezas `2026-10-08-a2e1t6` y `2026-10-15-12cyjn` (más el intento cancelado `xprbi5`): logo verde «TESLA» con rayo,
  verde #128c3c y Safiro Bold (Hermes la sustituyó por Montserrat). Son de www.tesla.es, «Tesla: Instalaciones
  Integrales en Barcelona», no de Tesla (tesla.com/es_ES). Hermes sacó los datos de tesla.com, pero el encargo le decía
  «úsala tal cual; no la vuelvas a medir» y «logo oficial: úsalo tal cual».
- Origen: (1) 08-10, código antiguo: sin web, se adivinó www.tesla.es y el título contiene «Tesla», así que se aceptó.
  (2) Hoy 15:33: la medición era v1, así que tocaba repetirla, y el arreglo de H-04 («al volver a medir, la url de la
  medición anterior») reutilizó esa web adivinada. **Hueco del arreglo de H-04:** las mediciones anteriores al arreglo
  no dicen si la web la dio el equipo o se adivinó. (3) Tesla es «marca conocida» desde el 08-10 (tiene carpeta): el
  formulario no muestra el campo de web. (4) La revisión de arte y los checks comparan contra esa misma paleta medida.
- Otro fallo mío: `legalNote` no acaba en salto de línea y el título «## Identidad de la marca…» queda pegado a la línea
  anterior en el encargo.
- Mediciones dudosas sin verificar (el título es solo el dominio y no responden a curl): north-face (northface.es) y
  helly-hansen (hellyhansen.es).

### 2026-10-15 — Arreglo de Tesla desplegado (commit `f25e8c0`)
- Medición y logo de tesla.es borrados (no estaban en git; copia en el scratchpad de la sesión). `identidad-medida.json`
  guarda `urlSource: 'equipo'`. Solo esas webs se reutilizan al volver a medir y dan fotos de galería, paleta y radio de
  botón (`inspect.ts`). Si el equipo da una web distinta de la guardada, se mide de nuevo.
- La ficha lleva `web: { url, confirmed }`. En una marca conocida sin brand pack y sin web confirmada, el formulario
  enseña el campo de web y el servidor responde 409 `brand_url_required` sin web ni «Enviar sin web».
- Encargo: sin «úsala tal cual» ni «logo oficial: úsalo tal cual». Hermes comprueba que la web medida es la oficial
  (dominio, nombre y logo); si no lo es, no usa nada de esa sección y lo dice en notas.md. Notas de identidad y remitente
  con sus saltos de línea.
- `npm test` 278/278. Railway SUCCESS (17:11), Vercel READY, worker reiniciado a las 17:11 estando libre (55 fichas
  enviadas). Sin probar con un trabajo real.
- Efecto: todas las marcas medidas antes de hoy sin brand pack pedirán la web una vez, aunque fuera la buena.
  Pendiente de revisar: north-face y helly-hansen (mediciones dudosas).

### 2026-10-15 — Tiempo de Hermes: «Pieza» desglosada y «Correcciones» separada de la comprobación (sin desplegar)
- Diagnóstico (Volkswagen `7uxqfr`, 21 min): «Investigación 0:10» solo medía los pasos de Studio; la investigación real
  de Hermes (6:34, 8 llamadas al navegador) caía en «Pieza 16:50», junto con 1:45 de escritura y 8:31 de autorrevisión.
  De la pieza, 4:44 fueron herramientas y unos 12 min el modelo. «Correcciones 0:15» no tenía ninguna ronda: eran las dos
  comprobaciones de Studio. La mejora de arte (2:25) se descartó (39 → 38/50).
- Cambio: `timeline.ts` (`parts`, `openedAt`, `splitLast`); `hermes-worker.ts` (`exportSession`, `draftParts`: corta la
  sesión por la hora de cada mensaje en el primer `.html` guardado con write_file/patch; solo primeras versiones; la
  autorrevisión absorbe el margen y las partes suman la fase); `sanitizeTimings` deja pasar hasta 3 partes; web: tarjeta
  con Investigación (Studio + Hermes), Escritura, Autorrevisión, Comprobación y Correcciones (solo con rondas), y subfilas
  en «Tiempo por fase». Las piezas sin desglose siguen con «Pieza». La línea de resumen del log no cambia (`tiempos.ts`).
- Comprobado: `draftParts` sobre la sesión real da 6:36 / 1:45 / 8:30; tarjeta pintada en Studio local con esos tiempos y
  con una pieza antigua con una corrección. `npm test` 280/280.
- Desplegado (commit `5b66a4a`): Railway SUCCESS (18:05), Vercel con `app.js` y `styles.css` iguales a los locales,
  worker reiniciado estando libre. Sin probar con un trabajo real: el desglose solo aparece en piezas nuevas.
- Visto de paso: en `7uxqfr` la medición de identidad se saltó porque la marca está escrita «Wolkswagen» y la web de
  volkswagen.es no la nombra (comprobación de H-04). Por eso Hermes investigó la marca dentro de la pieza.
