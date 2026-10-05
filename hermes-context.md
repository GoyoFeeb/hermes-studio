# Contexto del proyecto Hermes (pipeline de newsletters) — memoria de la skill `hermes-pipeline`

> Este archivo es la memoria persistente de la skill `hermes-pipeline` entre sesiones de
> auditoría/mejora. **No sustituye a `context.md` ni a `memory.md`** (project-docs), que siguen
> siendo la fuente de verdad técnica y narrativa del proyecto, mantenida por las propias sesiones
> que operan el pipeline. Este archivo es el registro de auditorías externas y su seguimiento:
> qué se diagnosticó, qué se decidió arreglar, y qué sigue abierto — para que una futura sesión de
> esta skill no repita el mismo diagnóstico desde cero.

**Última actualización:** 2026-10-01 (tercera lista de mejoras de interfaz de Studio, solo diagnóstico)

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
