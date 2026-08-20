# Project Memory

## Critical Decisions (and why)

<!-- Updated 2026-07-27: brand-native evolution — editorial-foto-texto*, brandStructure,
     structural differentiation gate added. -->

- **Migración completa de React Email a un motor propio (`engine/`), F0-F5, cerrada
  2026-07-21** — decisión tomada porque el pipeline React Email no garantizaba paridad entre el
  HTML fuente y el HTML con CSS inline (el que realmente se envía). El motor nuevo genera ambos
  en la misma ejecución a partir de la misma fuente en memoria, con verificación automática de
  que los conteos de `<img>`/UTM/`v:roundrect` coinciden entre los dos. Ver
  `docs/auditoria-total-y-plan-transformacion-2026-07-17.md` y `docs/f1-motor-cerrado.md` a
  `docs/f5-prueba-real-cerrada.md`.
- **Brand-native newsletters como objetivo (2026-07-27)**: se añaden componentes editoriales
  (`editorial-foto-texto*`), campo `brandStructure` en brand packs, y gate de diferenciación
  estructural (Gate 12) para que las newsletters dejen de ser plantillas genéricas con colores
  cambiados y pasen a traducir la estructura real de la página de la marca. El brand pack ya no
  solo captura tokens visuales; debe capturar estructura traducible de la página real.
- **`engine/build-newsletter.js` nunca escribe outputs parciales** — en vez de "escribir y
  borrar si falla", todo el ensamblado vive en memoria y `writeFileSync` solo se llama tras 6
  fases de verificación. Motivo: es más simple y más difícil de romper por accidente.
- **Prohibido marcar datos de fuente pública como "verificados"** sin aprobación explícita del
  cliente — evita exposición legal por specs de producto desactualizadas o de una variante
  distinta a la que la campaña usa (patrón detectado en la campaña BMW Serie 1).
- **QA con dos niveles de aprobación** (prueba interna vs producción) en vez de un "aprobado"
  binario — permite avanzar campañas de prueba sin bloquear el pipeline, pero deja explícito qué
  falta para producción real (`09-exports/production-blockers.md`).
- **Cierre operativo del motor = `production-gate-motor`** — `npm run production-gate` es solo
  el alias cómodo y debe apuntar siempre al motor. Los comandos React Email quedan bajo
  `legacy:*` en `package.json`.
- **Tests con Node nativo (`node --test`)** — no se añadió Vitest ni otra dependencia nueva. La
  suite cubre tokens, patrones, adaptadores de módulos y un smoke test end-to-end del ejemplo.
- **`AGENTS.md` sigue siendo la constitución; `.agent/*` es adaptador común** — se aplicó
  `common-init` el 2026-07-27 sin sobrescribir el contrato Hermes. `CLAUDE.md` y `.agent/`
  conectan Claude Code/Codex con las reglas existentes.
- **`generate-hero-image` debe sanitizar y trazar prompts con landing real** — decisión de
  2026-07-27 tras el test BMW. La visión de OpenAI puede describir elementos accidentales de una
  landing (p. ej. referencias a superhéroes/personajes promocionales) y contaminar el prompt de
  imagen hasta provocar `moderation_blocked`. El script ahora guarda prompt attempt, descripción
  visual raw/sanitized y error JSON antes de fallar, y sanitiza referencias a personajes, logos,
  emblemas, modelos/matrículas, URLs, precios y lenguaje de copia literal de landing.
- **`engine/CHANGELOG.md` — solo append, nunca reescritura completa** (incidente 2026-08-01,
  ver `docs/incidente-changelog-engine-2026-08-01.md`): una sesión externa usó `write_file`
  (reescribe el archivo entero) en vez de `patch`/append para añadir una entrada, y perdió el
  91% del historial (~2.777 → 148 líneas) de forma irreversible porque el repo no tenía control
  de versiones. Mitigación aplicada: `scripts/backup-changelog.ts` (`npm run changelog:backup`)
  copia el archivo con timestamp a `_archive/changelog-backups/` — ejecutarlo SIEMPRE antes de
  tocar `engine/CHANGELOG.md`, y editar solo por append/patch, nunca reescribiendo el archivo
  completo. El repo ya tiene git desde 2026-07-27, así que un futuro incidente igual sería
  recuperable — pero la regla de comportamiento sigue siendo la primera línea de defensa.

## Known Gotchas

- **`task-log.md`, `handoff.md` y `next-steps.md` se pueden sobrescribir por accidente**: al
  actualizarlos hay que leer el archivo existente y APPEND, nunca `write_file` de golpe. Ya
  pasó dos veces en la campaña DemoSolar (se perdieron 4 entradas acumuladas).
- **`campaign-status.md` puede perder secciones al reescribirse** — debe conservar siempre las 6
  secciones (Campaign, Current Phase, Completed Phases, Open Issues, Production Gate Status,
  Next Step) aunque una quede vacía; no eliminar la sección, solo su contenido si se resuelve.
- **`[PENDIENTE]` en `campaign-data.json` rompe la validación** — los scripts lo tratan
  explícitamente como marcador de invalidez. Si un campo obligatorio no tiene valor real, usar
  `""` (si el tipo lo permite) u omitir el campo si es opcional. Nunca escribir `[PENDIENTE]`.
- **`create-campaign.ts` tiene fallback para `EACCES`** en carpetas montadas en sesiones tipo
  Cowork: intenta `fs.cpSync` y, si falla por permisos, copia archivo por archivo antes de
  sustituir placeholders. Ya no hace falta el scaffold manual salvo fallo externo del filesystem.
- **`render()` de `@react-email/render` devuelve una Promise** — solo relevante si se toca el
  pipeline React Email archivado; requiere `await`. No aplica al motor actual.
- **`juice` es un módulo ESM-only** — `require('juice')` devuelve `{ default: fn }` en vez de la
  función directa; hay que hacer `require('juice').default || require('juice')`.
- **Row/Column de tablas de email no apilan solas en mobile** — cualquier layout de 2+ columnas
  necesita una media query explícita (`min-width: 481px`) para pasar de 1 columna (baseline) a
  2, porque Outlook/Gmail web ignoran media queries y ven siempre el baseline.
- **`card-tarifa` soporta 4 y 3 tarjetas** (`card-tarifa.html` y `card-tarifa-3.html`) — el
  pendiente real es solo la variante de 2 tarjetas, y sigue condicionado a que una campaña real
  la necesite.
- **Contraste de enlace secundario de `card-tarifa*` resuelto 2026-07-27**: el componente usa
  `colors.primary` en vez de `colors.ctaBackground`, y `check-contrast.ts` lo gatea como
  "Enlace secundario de tarjeta sobre blanco".
- **Safety de OpenAI no siempre significa que el brief sea inválido** — en la campaña BMW
  `2026-ago-bmw-experiencia-premium`, el rechazo venía de una descripción visual contaminada
  por elementos de la landing ("superhero"/"costumed figure"), no de la fotografía automotriz.
  Al depurar `hero-imagen`, revisar primero `brands/{brand}/design-input/hero-banner-error.json`,
  `hero-banner-prompt-attempt.txt`, `hero-banner-visual-description.txt` y
  `hero-banner-visual-description-sanitized.txt`.

## Patterns to Follow

- **Cada agente es un archivo `agents/NN-nombre.md`** con estructura fija: Rol, Objetivo
  principal, Inputs aceptados, Archivos que puede leer/escribir, Reglas de trabajo, Proceso paso
  a paso, Criterios de salida/bloqueo, Formatos de archivo, Handoff, Output final.
- **Convención de nombres de campaña**: `newsletters/{año}/{cliente}/{año-mes-cliente-descriptor}/`
  — cliente en minúsculas sin espacios (guiones permitidos).
- **Adaptadores de módulo** (`engine/lib/assemble.js`, `MODULE_ADAPTERS`): `campaign-data.json`
  usa una forma uniforme por módulo (`{eyebrow, title, items: [...]}`), pero cada plantilla de
  componente espera nombres de placeholder específicos ya existentes — el adaptador traduce
  entre ambas formas. Al añadir un componente nuevo, hay que añadir también su adaptador y su
  línea en `PATTERN_SEQUENCE` del patrón correspondiente (mantenido a mano, no autogenerado).
  Ver `engine/README.md` § "Cómo añadir un componente nuevo".
- **Título de cierre**: tratar 45 caracteres como límite duro para que quepa en 1 línea a 600px
  (una campaña con 46 caracteres partió en 2 líneas). Desde 2026-07-27,
  `check-column-balance.ts` falla si `banda-cierre*.data.title` supera 45 caracteres.
- **Hero con imagen generada desde landing real**: usar la descripción sanitizada como dirección
  de arte, no como copia literal de la página. El prompt final debe evitar logos, texto,
  personajes protegidos, modelos identificables, matrículas y lenguaje tipo "copiar/recrear la
  landing"; `hero-imagen` mantiene el copy accesible en HTML.

## Current Focus

Confirmado por el usuario (2026-07-27): tras el cierre de F5 (transformación completa,
2026-07-21), el foco actual es **probar el motor (`engine/`) contra campañas reales de múltiples
marcas** para detectar gaps antes de producción real. Evidencia en el propio repo: campañas en
`newsletters/2026/` para Apple, BMW, Nike, Adeslas, Aesop, Rolex, Spotify, Wornwear, UAX,
Optica2000, Tarifalo y Para y Compara, más prompts de test dedicados en `tests-manuales/`
(movidos ahí 2026-07-28, antes sueltos en la raíz — ver `tests-manuales/README.md` para el
índice) fechados 22-25 jul. Ninguna de estas campañas tiene `productionReady: true` — son
validaciones del motor y de los brand packs, no envíos reales.

Actualización 2026-07-27: el template base ya crea `06-data/campaign-data.json`, el paquete
entregable no debe incluir `.env`, `node_modules`, `.DS_Store`, binarios sueltos ni outputs de
test, y `npm test` existe como suite real de regresión del motor.

Actualización 2026-07-27 (skills aplicados): añadidos `CLAUDE.md`, `.agent/*`,
`docs/hermes-newsletter-system-context.md` y `docs/hermes-newsletter-system-report.md`. El
roadmap existente se conserva como fuente activa; no se crea un roadmap duplicado desde cero.

Actualización 2026-07-27 (deuda F2): cerrados F2.1, F2.2, F2.3 y F2.4 del roadmap técnico. El
único pendiente de esa tanda queda `card-tarifa-2.html`, bloqueado hasta que una campaña real
necesite exactamente 2 tarjetas.

## Do NOT

- **No borrar nada** al modificar campañas existentes sin `--force` o confirmación explícita —
  mover a `_archive/` en caso de duda.
- **No dejar que el Orchestrator corrija el trabajo de un especialista** — si un entregable está
  mal, se devuelve al agente responsable con el motivo.
- **No marcar copy como `Estado: Final` en campañas de test** (`isTestCampaign: true` o bloqueos
  de producción sin resolver) — usar `Estado: Aprobado para prueba interna / pendiente
  validación cliente`.
- **No escribir `[PENDIENTE]` en `campaign-data.json`** — ver Known Gotchas.
- **No crear un patrón nuevo (`patterns/*.md`) especulativamente** — solo cuando una campaña real
  lo necesite.
- **No usar el pipeline React Email archivado** (`_archive/f4-react-email-pipeline/`) como
  referencia para desarrollo nuevo — está superseded por `engine/`.
- **No confiar en `README.md`, `GUIA_NUEVO_PROYECTO.md`, `INFORME_FINAL.md`,
  `CAMBIOS_REALIZADOS.md`, `INVENTARIO_ORIGEN.md` o `RIESGOS_Y_PENDIENTES.md`** para el estado
  actual del sistema — describen el empaquetado original (2026-07-09) y quedan marcados como
  históricos. Usar `context.md` + `AGENTS.md` + este archivo.
- **No reescribir `engine/CHANGELOG.md` completo bajo ningún concepto** (`write_file` o
  equivalente) — solo append/patch, y solo después de `npm run changelog:backup`. Ver Known
  Gotchas / Critical Decisions para el incidente que motivó esta regla.
- **No usar `json.loads()`/`json.dumps()` (ni equivalente) para mutar en bloque un `.json` ya
  existente en este repo** — reserializa el archivo ENTERO con la indentación/estilo de la
  librería, no el original (diffs de cientos de líneas por un cambio de 2 campos), y puede
  colapsar en silencio claves duplicadas preexistentes (el parser se queda solo con la última,
  sin avisar — descubierto 2026-07-28 en `brands/aesop/tokens/brand-tokens.json`, que ya tenía
  una clave `body` repetida). Usar edición de texto quirúrgica (Edit tool, o regex sobre el bloque
  exacto a cambiar) que solo toca las líneas que realmente cambian y deja todo lo demás
  byte-idéntico — mismo criterio que ya rige `engine/CHANGELOG.md` (append/patch, nunca
  reescritura completa), aplicado aquí a cualquier `.json` real del repo, no solo al CHANGELOG.
- **Antes de modificar en bloque varios `brands/*/` o `newsletters/*/`, verificar con `git status`
  cuáles están realmente trackeados** — un directorio puede existir en disco (y aparecer en un
  `find`/`grep`) sin estar bajo control de versiones, perteneciendo al trabajo en curso de la
  sesión concurrente activa en este repo (Hermes Agent CLI). Descubierto 2026-07-28: un script de
  migración masiva tocó por error `brands/adidas/` y `brands/new-balance/` (ambos `??` en `git
  status`, con mtime de la sesión concurrente) antes de revertirlo. `git ls-files` da la lista
  real de lo que es seguro tocar; un listado de directorio no.

Actualización 2026-07-28 (evolución enterprise post-auditoría): implementadas las Fases A, B, C y D
del roadmap de la auditoría técnica — fiabilidad de gates (`execFileSync` + timeout,
`runChildGate()`), backup de CHANGELOG, coherencia documental, unificación de brand packs a
`brands/paraycompara/`, reducción de duplicación (`scripts/lib/cli.ts`, `scripts/lib/brand-path.ts`,
alias de adaptadores clonados), suite de tests 12→32 (geometría de celdas + smoke tests de gates).
4 commits de checkpoint: `e35c81d`/`c83e956`/`a52e378`/`fb8c3bb`. Detalle completo, incluyendo qué
se evaluó y se decidió NO ejecutar (con motivo), en
`docs/implementacion-auditoria-tecnica-2026-07-28.md`. Propuesta de reorganización de agentes
(recomendación: no reorganizar, con evidencia) en
`docs/propuesta-reorganizacion-agentes-2026-07-28.md`. Roadmap de QA visual real (Fase E, sin
ejecutar) en `docs/roadmap-qa-visual-2026-07-28.md`.

Actualización 2026-07-28 (evolución "Nivel 5" del agente 02, commit `4050b71`): `agents/
02-brand-visual-analyst.md` reescrito para producir, además del brand pack, un paquete técnico
completo de identidad visual — CSS extraído (`brands/{cliente}/styles/{reference,email-safe}.css`),
inventario de componentes UI del sitio real (`brands/{cliente}/guidelines/component-inventory.md`
— **no confundir con `engine/components/INVENTORY.md`**, catálogo distinto), guías de responsive/
adaptación a email/dirección de arte, e informe consolidado (`02-analysis/visual-identity-report.md`).
Metodología completa (17 fases forenses) en `pipeline-skill/references/
brand-visual-analysis-methodology.md`. Gate 13 nuevo (`check-brand-visual-report-completeness.ts`)
— deliberadamente NO bloqueante hoy (ningún brand pack real tiene aún estos 9 archivos). Los 12
brand packs reales existentes NO se poblaron con los archivos nuevos en esta pasada (requiere
navegar cada sitio real con Chrome) — quedan pendientes de que el agente 02 se ejecute de nuevo
por marca.

Actualización 2026-07-28 (diagnóstico "newsletters genéricas" + Fase F1, commit `fa84814`):
usuario reportó que las newsletters se ven intercambiables entre marcas. Investigación de 3
agentes en paralelo (23 campañas reales / 13 marcas) confirmó la hipótesis con prueba directa:
las campañas "brand-native" de bandera de Audi y BMW (2026-08-01, construidas para demostrar
diferenciación estructural) son byte-idénticas entre sí. Diagnóstico completo en
`docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md` (causas raíz: `pattern.js`
solo gobierna secuencia, nunca layout; 13 de 27 componentes no tienen ninguna variante de
alineación; `spacing.*` 100% sin consumir; `layout.brandStructure` nunca ramifica ninguna
decisión real). Fase F1 implementada: `compositionProfile` (`personality`/`densityPreference`/
`alignmentBias`) en `brand-tokens.schema.json`, consumido de verdad por
`agents/03-newsletter-architect.md` (no solo documentado — precedente exacto de por qué
`brandStructure` fracasó). `alignmentBias:"alternado"` es la pieza nueva: por primera vez el
sistema puede mezclar centrado/asimétrico módulo a módulo en la misma campaña. Ningún brand pack
real tiene el campo todavía — sin efecto hasta que 02 lo escriba por marca.

Actualización 2026-07-28 (Fase F2, commit `d4f60d5`): `check-structural-differentiation.ts`
(Gate 12) ahora compara la huella estructural de una campaña contra TODAS las demás campañas
reales del mismo patrón (antes solo contra una constante hardcodeada, y solo para
fotografia-primero). Verificado contra datos reales: detecta la colisión Audi/BMW "brand-native"
(100%, la prueba directa que motivó el diagnóstico) y también new-balance/new-balance-premium
(80%). Aviso, no bloqueante todavía. Además se generalizó el check de "secuencia comodín" a los
3 patrones (antes solo fotografia-primero) — esto reveló un hallazgo real no relacionado con el
cambio en sí: `paraycompara/2026-jul-revision-verano` usa la secuencia comodín exacta de
`saving` sin ningún `brand-structure-translation.md`, invisible hasta ahora porque `saving` nunca
tuvo comodín que lo detectara (el mismo tipo de bloqueo ya afectaba a campañas reales de
`fotografia-primero` desde 2026-07-27, ej. `bmw/2026-jul-bmw-x1-descubre` — no es un criterio
nuevo, es cobertura nueva del mismo criterio). Pendiente: si esta campaña de paraycompara necesita
su propio `brand-structure-translation.md` o si el orden comodín es en efecto correcto para esa
marca (en cuyo caso solo falta documentarlo) — no se tocó, fuera del alcance de F2 (ver
`docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md`).

Actualización 2026-07-28 (Fase F3, commits `ed06b8d`/`9e67bc1`/`9f1c429`, 3 bloques):
- **Bloque 1**: `spacing.*` unificado a forma canónica en los 13 brand packs REALMENTE
  trackeados en git (no 15 — `brands/adidas/`/`brands/new-balance/` existían en disco sin estar
  trackeados, pertenecientes a la sesión concurrente activa; se tocaron por error y se
  revirtieron, ver Do NOT). Tipos reales en `brand-tokens.schema.json`.
- **Bloque 2**: `spacing.small`/`spacing.medium` ahora son gutter/gap real de los 8 componentes
  con geometría adaptativa (antes literales fijos 10/6/20) — `pasos.html` además tenía un bug
  latente (hardcodeaba padding ignorando su propio `cellPad`), corregido. Gutter cambia de verdad
  para los 13 packs reales (10→8px, 6→8px) — verificado sin regresión visual.
- **Bloque 3**: 3 componentes nuevos (`pasos-vertical`, `lista-premium-2col`,
  `trust-bar-inline`) para los 3 de los 4 candidatos originales con demanda real confirmada
  (`category-grid`, 1 sola campaña real, quedó fuera). 30 componentes en total (antes 27).

Detalle completo, incluida la corrección de un incidente evitado a tiempo (ver Do NOT: nunca usar
`json.loads()`/`json.dumps()` para mutar JSON en bloque — colapsa duplicados en silencio y
reformatea el archivo entero), en `docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md`.

Actualización 2026-07-28 (Fase F4, commit `96d5841`): los 2 arreglos "mecánicos" de
`card-tarifa`/`category-grid` resultaron ser bugs YA activos en producción al investigarlos
contra campañas reales, no solo deuda teórica. `category-grid` migrado de un bucle propio a
`balancedRows` — `optica2000/2026-jul-optica2000-cuida-tu-mirada` (4 categorías) tenía una fila
huérfana real ("Protección infantil" sola a 33% de ancho); investigar esto reveló además un
SEGUNDO bug no anticipado en `uax/2026-jul-uax-fp-online` (fila de 2 ítems también a 33% cada
uno en vez de 50%, por `width:33%` hardcodeado sin condicionar al tamaño de fila). Ambos
verificados con capturas antes/después, corregidos. `card-tarifa.items` corregido de
`minItems:2` a `minItems:4` (el schema mentía desde Fase 1 — la plantilla nunca soportó menos de
4; la única campaña real con 3 ítems ya estaba rota por un motivo no relacionado, sin demostrar
demanda real). Fase F5 (patrones nuevos por tipo de newsletter, sin fecha) queda pendiente,
documentada en el mismo informe de diagnóstico.

Actualización 2026-08-20 (petición del usuario: "que el sistema capte siempre las fuentes de las
marcas de las campañas"): dos gates de procedencia de marca pasan de aviso a bloqueante, con
evidencia real de que el hueco no era hipotético:
- **`check-brand-pack-completeness.ts` (Gate 8) — bug corregido**: un `.source` AUSENTE (no un
  placeholder) dentro de un grupo por lo demás presente pasaba en silencio —
  `isPlaceholder(undefined)` es `false`, así que el gate nunca comprobaba si el leaf existía.
  Confirmado contra los packs reales antes del fix: `brands/apple` tenía
  `photography`/`iconography`/`voice.rhythm` completos sin ningún `.source` en los tres, y
  `brands/feebboletter` igual en `iconography` — ambos pasaban este gate bloqueante como si
  tuvieran procedencia. Ahora un leaf ausente sigue la misma regla declarado(en `_changelog`)/
  silencioso que ya regía el grupo entero ausente.
- **Alcance ampliado a `colors`/`typography`**: el gate solo exigía procedencia a
  photography/iconography/voice.rhythm/contentRhythm, nunca a los tokens que el motor más
  consume. Se añaden `colors.source`/`typography.source` (mismo formato que los demás `.source`,
  sin cambio de schema — `additionalProperties:true` ya lo permitía, igual que con los otros
  tres). Verificado: los 13 brand packs reales (incluido `nike`, que ya tenía
  photography/iconography/voice.rhythm con fuente) NO tienen `colors.source`/`typography.source`
  — fallan `production-gate` hasta que 02 los añada por marca o se declare el hueco en
  `_changelog`.
- **`check-brand-visual-report-completeness.ts` (Gate 13) — pasa de aviso a bloqueante**: hasta
  ahora la ausencia de `source-inventory.md` y el resto de los 8 archivos "Nivel 5" (rollout
  2026-07-28) nunca fallaba el gate, solo avisaba. Mantiene la misma válvula de escape que Gate 8
  (declarado en `_changelog` → aviso; silencioso → error). Ningún brand pack real declara hoy
  estos 8 archivos en su `_changelog`, así que **toda campaña real empezará a fallar
  `production-gate`** hasta que 02 los genere por marca o se declare el hueco — decisión explícita
  del usuario (eligió expresamente la opción que acepta este efecto retroactivo), no una regresión
  no buscada.
- `agents/02-brand-visual-analyst.md` actualizado: instrucción explícita de escribir
  `colors.source`/`typography.source`, y las referencias a "Nivel 5, aviso, no bloqueante" en
  Válvula de escape y Validaciones corregidas para reflejar el nuevo comportamiento.
- `scripts/gates.smoke.test.js`: test de Gate 13 actualizado de "los 9 artefactos ausentes solo
  avisan" a bloqueante, más un test nuevo que verifica que un artefacto ausente pero declarado en
  `_changelog` sigue siendo solo aviso. `npm test` en 51/51 tras el cambio.
- **Pendiente real, mismo patrón que `brandStructure`/`compositionProfile`** (ver actualización
  2026-07-28 "Nivel 5" y Fase F1 arriba — el precedente exacto de por qué un campo nuevo en
  schema/gate no sirve de nada hasta que 02 lo escribe por marca): ningún brand pack real se
  repobló en esta pasada; los 13 quedan pendientes de que 02 se ejecute de nuevo, o de que se
  declare el hueco en `_changelog` marca por marca.

_Last updated: 2026-08-20_
