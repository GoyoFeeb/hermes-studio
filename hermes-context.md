# Contexto del proyecto Hermes (pipeline de newsletters) — memoria de la skill `hermes-pipeline`

> Este archivo es la memoria persistente de la skill `hermes-pipeline` entre sesiones de
> auditoría/mejora. **No sustituye a `context.md` ni a `memory.md`** (project-docs), que siguen
> siendo la fuente de verdad técnica y narrativa del proyecto, mantenida por las propias sesiones
> que operan el pipeline. Este archivo es el registro de auditorías externas y su seguimiento:
> qué se diagnosticó, qué se decidió arreglar, y qué sigue abierto — para que una futura sesión de
> esta skill no repita el mismo diagnóstico desde cero.

**Última actualización:** 2026-09-28 (auditoría de sistema completo: ruta real Studio + worker + salidas de Hermes; BUG-H14 a H18 abiertos)

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
| BUG-H15 | Calidad (salida standalone) | La ruta que se usa de verdad (Studio → Hermes) no pasa ningún gate determinista salvo el de móvil. Medido el 2026-09-28 sobre las 8 newsletters de Hermes: CTA de producto con 404 en las 3 versiones de Inglesina (`/products/base-darwin-360-isize`), 5/8 sin preheader, 0/8 con modo oscuro, 3/8 sin condicionales de Outlook; la regla de claims "potencia" salta en Adidas y Talaria (en Talaria es un dato técnico: la regla necesita contexto). | `studio/worker/hermes-worker.ts` (solo `mobileOverflow`), `studio/server/standalone.ts` (`checkEmailHtml`, solo avisos) | **Parcialmente cerrado 2026-09-28** — `studio/worker/qualityCheck.ts`: enlaces/imágenes (404/410/5xx/DNS = error; 403/429 = aviso), preheader, baja, alt, enlaces vacíos, peso Gmail → errores devueltos a Hermes (2 rondas); claims solo aviso. Detecta el 404 y el preheader reales de Inglesina. Preheader y enlaces verificados, obligatorios en el encargo. Pendiente: modo oscuro y Outlook. |
| BUG-H16 | Infra (entrega) | Las imágenes de las newsletters enviadas se sirven desde el dominio de Railway (`STUDIO_PUBLIC_BASE_URL`), en periodo de prueba (vence hacia el 2026-10-10). Si el servicio cae o cambia de dominio, los emails ya enviados se quedan sin imágenes. | `studio/server/standalone.ts` (`publishEmbeddedImages`) | Abierto |
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

