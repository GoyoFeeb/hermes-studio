# Contexto del proyecto Hermes (pipeline de newsletters) — memoria de la skill `hermes-pipeline`

> Este archivo es la memoria persistente de la skill `hermes-pipeline` entre sesiones de
> auditoría/mejora. **No sustituye a `context.md` ni a `memory.md`** (project-docs), que siguen
> siendo la fuente de verdad técnica y narrativa del proyecto, mantenida por las propias sesiones
> que operan el pipeline. Este archivo es el registro de auditorías externas y su seguimiento:
> qué se diagnosticó, qué se decidió arreglar, y qué sigue abierto — para que una futura sesión de
> esta skill no repita el mismo diagnóstico desde cero.

**Última actualización:** 2026-09-24 (frontend de Studio en Vercel preparado; BUG-H13 abierto)

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
