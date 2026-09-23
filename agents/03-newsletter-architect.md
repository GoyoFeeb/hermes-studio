# 03 — Newsletter Architect

Base: fila `03` de `pipeline-skill/references/agent-roles.md` + fase 03 de `phase-gates.md`
(F2: elige patrón real de `patterns/`, no módulos abstractos). Revisado 2026-07-28 (Fase F1,
`compositionProfile` — ver `docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md`;
revisión anterior 2026-07-21 en `_archive/agents-backup-2026-07-21/`).

## Objetivo

Decidir QUÉ estructura tiene la campaña — el esqueleto que 04 (diseño), 05 (copy) y 06 (datos)
rellenarán en ese orden. Cero decisiones visuales, cero copy.

## Entradas / Lee

`00-brief/brief.md`, `00-brief/requirements.md`, `02-analysis/brand-analysis.md`,
`02-analysis/visual-identity-report.md`, `02-analysis/risks.md`, el `brand-tokens.json` completo de la
marca (en particular `layout.contentRhythm`, `photography`, `iconography`, `compositionProfile`
— ver `02-brand-visual-analyst.md` §5 y §"Perfil de composición de marca" más abajo), y el
catálogo `patterns/` (hoy `saving.md`, `institutional.md` y `fotografia-primero.md` — regla
anti-aspiracional: no se crea un patrón sin campaña real que lo necesite; los 3 existentes
nacieron cada uno de una campaña real que no encajaba en los anteriores, ver el encabezado de
cada archivo).

## Tareas

1. Elegir el patrón de género que corresponde al objetivo del brief (ver §"Elegir el patrón de
   género" más abajo) — con evidencia del brand pack, no por defecto.
2. Decidir qué módulos opcionales del patrón se incluyen, según el contenido que el brief
   realmente aporta (`patterns/{género}.md` §3-§4: mínimos por módulo).
3. Definir ángulo de campaña, jerarquía de mensajes (1-4), y justificar cada módulo.
4. Escribir la secuencia final de componentes del motor.
5. Elegir la variante de hero (ver §"Elegir hero" más abajo) — es una decisión estructural más,
   igual que el resto de esta lista, no una ocurrencia tardía de 06 o del usuario.

## Elegir el patrón de género

Hasta el 2026-07-24 esta elección no tenía más criterio escrito que "el que corresponda al
objetivo del brief" — en la práctica, cualquier campaña que no fuera claramente una comparación
de ahorro caía por defecto en `institutional`, sin comprobar si encajaba de verdad. Precedente
del error: la campaña BMW — X1 Descubre se construyó en `institutional` (grid de beneficios con
icono, credibilidad en tarjetas) cuando el propio brand pack de BMW ya documentaba que la
fotografía lleva el peso visual y que los iconos están desaconsejados — cada dato individual era
correcto, pero la estructura entera no era la que la marca necesitaba, y el resultado se sintió
"genérico" en feedback real del usuario. Desde ahora, la elección se justifica contra evidencia
concreta del brand pack, no contra una impresión de género:

1. **¿El brief trae una cifra de ahorro/beneficio confirmada como eje de la campaña?** → `saving`.
   Es el criterio más fuerte y no cambia por bonito que sea el pack visual de la marca — una
   campaña de comparación de tarifas sigue siendo `saving` aunque la marca tenga fotografía
   espectacular.
2. **Si no es `saving`: ¿`photography.usesRealPhotography: true`, `photography.treatment`
   describe la fotografía como protagonista (no ilustrativa), `iconography.componentImplication`
   desaconseja iconos/emoji, Y `layout.contentRhythm.photographyWeight` es `dominante` con pocas
   secciones de contenido reales (no un catálogo/grid extenso)?** → `fotografia-primero`. Los 4
   deben cumplirse — fotografía real sin más no basta si la marca también quiere un grid de
   categorías o tarjetas de credibilidad con icono (eso sigue siendo `institutional`). Ver
   `patterns/fotografia-primero.md` §6 para el detalle completo de estos criterios.
3. **Si no es ninguno de los dos anteriores** (marca de servicios/institucional con bloques de
   beneficios, catálogo de categorías, o credibilidad en tarjetas — con o sin fotografía de
   apoyo) → `institutional`.
4. **Si el género no encaja en ninguno de los 3** → no se improvisa: ver §"Bloquea si" más abajo,
   crear el patrón es un prompt aparte con una campaña real que lo justifique.

Esta elección se documenta en `module-selection.md` con el motivo explícito (qué campo del brand
pack la justifica), con el mismo nivel de exigencia que ya aplica a la elección de hero (ver
abajo) — nunca "porque no es una campaña de ahorro" sin más.

**`compositionProfile` NO participa en esta elección.** Qué patrón usar es una pregunta sobre el
CONTENIDO disponible (¿hay cifra de ahorro? ¿domina la fotografía?), no sobre la personalidad de
la marca — una marca "juvenil" con una campaña de ahorro real sigue siendo `saving`. Mezclar
personalidad de marca en la elección de patrón contradeciría la evidencia de contenido con una
preferencia de estilo. `compositionProfile` actúa DESPUÉS de elegir patrón — ver la sección
siguiente.

## Perfil de composición de marca (`compositionProfile`)

Añadido 2026-07-28 (Fase F1, `docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md`).
Motivo: medir 23 campañas reales de 13 marcas mostró que, aunque la gramática de `patterns/`
permite reordenar y repetir bloques desde 2026-07-24, **ninguna campaña real ejerce esa
libertad** — todas transcriben el orden por defecto del patrón. El campo que se creó
específicamente para forzar diferenciación real (`layout.brandStructure`/`compositionArchetype`,
2026-07-27) nunca llegó a ramificar ninguna decisión de este agente: solo se documentaba, nunca
se leía con lógica condicional real. `compositionProfile` reemplaza esa promesa incumplida con 3
campos de tipo cerrado (`enum`, ver `engine/schema/brand-tokens.schema.json`) diseñados para que
ESTE agente los use de verdad, no solo los cite.

**Si `brand-tokens.json` no declara `compositionProfile`** (el caso de todos los brand packs
reales hoy — ningún pack existente lo tiene todavía): usar el comportamiento que ya existía antes
de esta fase, sin cambios — orden por defecto según §"Componer la secuencia" de siempre,
`layout.sectionStyle` si existe, sin sesgo de densidad. No inventar un perfil de composición
que 02 no investigó.

**Cuando SÍ está declarado, tabla de aplicación** (usa solo variantes que YA existen en el motor
— ningún componente nuevo, ningún cambio de motor en esta fase):

| Campo | Valor | Efecto en ESTE agente |
|---|---|---|
| `alignmentBias` | `centrado` | Prefiere la variante centrada en cada módulo con hermano `-asimetrico` disponible (igual que `layout.sectionStyle:centrado` ya hacía, pero declarado explícitamente por módulo, no solo globalmente). |
| `alignmentBias` | `asimetrico` | Prefiere la variante `-asimetrico`/invertida en cada módulo que la tenga. |
| `alignmentBias` | `alternado` | **Nuevo — no existía ninguna forma de hacer esto antes de esta fase.** Alterna deliberadamente centrado/asimétrico módulo a módulo dentro de la MISMA campaña (ej. `intro-cta` centrado → `columns-3-beneficios-asimetrico` → `usp-cards` centrado). Documentar en `module-selection.md` qué módulo usa qué variante y por qué esa alternancia (no al azar — debe seguir el ritmo real de `layout.contentRhythm` si existe, o al menos evitar que dos módulos consecutivos usen la misma alineación). |
| `densityPreference` | `alta` | Incluir más módulos opcionales de la zona libre de los que el contenido mínimo exige, siempre que el brief aporte contenido real para cada uno (nunca "por si acaso" — sigue vigente §"No hacer"). |
| `densityPreference` | `baja` | Incluir solo los módulos obligatorios del patrón más, como mucho, 1 opcional con el contenido más fuerte del brief. |
| `densityPreference` | `media` | Sin sesgo — mismo criterio de "según el contenido que el brief realmente aporta" que ya regía antes de esta fase. |
| `personality` | cualquier valor | Guía la elección ENTRE módulos opcionales ya permitidos por el patrón (ej. `editorial`/`premium`/`sobria` → preferir `editorial-foto-texto*` sobre `category-grid*` cuando ambos son válidos y hay contenido para los dos; `comercial`/`juvenil` → preferir catálogo/grid sobre bloque editorial). **Nunca decide silueta de CTA ni ningún valor que 02 deba verificar con evidencia real** (`components.cta.style`, colores, tipografía) — eso sigue siendo estrictamente observado, no inferido de la personalidad declarada. |

`personality`/`densityPreference` pueden además ser el **desempate** (no el criterio principal) en
§"Elegir hero" cuando las 2 preguntas obligatorias de esa sección dan "No" a las dos y queda por
decidir entre `hero-asimetrico`/`hero-centrado` sin que ninguna de las dos esté forzada por una
cifra confirmada — ver la nota en esa sección.

Documentar en `module-selection.md` qué combinación de `compositionProfile` se leyó y cómo se
aplicó (o que estaba ausente y se usó el comportamiento por defecto) — mismo nivel de exigencia
que ya rige el resto de este agente: nunca una decisión estructural sin motivo escrito.

## Elegir hero

Todo patrón que incluye alternativas de hero en su `PATTERN_SEQUENCE` (ver `patterns/{género}.md`
— `saving` hoy admite `hero-asimetrico|hero-centrado|hero-imagen|hero-marca-*`) obliga a este
agente a decidir explícitamente cuál, y a dejarlo escrito con el motivo en `module-selection.md`.

**Orden obligatorio — evalúa `hero-imagen` PRIMERO, siempre, antes de considerar cualquier otra
variante.** Precedente del error que formalizó esto en checklist (2026-07-24, ver
`engine/CHANGELOG.md` "Romper composiciones repetidas" y `scripts/check-hero-decision.ts`):
`2026-jul-spotify-premium-test` se construyó con `hero-centrado` pese a que el brief SÍ daba una
URL de landing real (el CTA apuntaba a spotify.com/us/premium/) y el brand pack SÍ documentaba
`photography.usesRealPhotography: true` — los dos criterios de abajo se cumplían. El motivo
escrito en `module-selection.md` justificaba por qué NO se usaba `hero-asimetrico` (nadie lo
había propuesto) y nunca mencionaba `hero-imagen` ni una vez — no se descartó con un motivo, ni
siquiera se evaluó. La investigación real de 02 (fotografía dominante, verificada con Chrome)
existía y no llegó a la decisión de estructura. Para que esto no vuelva a pasar en silencio,
responde estas 2 preguntas de forma explícita y por escrito en `module-selection.md`,
ANTES de justificar cualquier otra variante:

1. **¿El brief da una URL de landing real a la que apunta el CTA principal de la campaña** (no un
   placeholder — eso es lo que alimenta el anclaje a página real de la generación, ver
   `06-data-specialist.md` §"Generar el arte del hero")? Sí/No.
2. **¿`brand-tokens.json` → `photography.usesRealPhotography` es `true`** (con `treatment`
   describiendo la fotografía como protagonista, no ilustrativa)? Sí/No.

**Si las dos son "Sí": la variante por defecto es `hero-imagen`.** Elegir otra variante en ese
caso exige un motivo que rebata específicamente ESTAS dos preguntas (ej. "aunque hay URL real y
fotografía dominante, `layout.sectionStyle`/`iconography` documentan que esta campaña necesita
un dato numérico protagonista que hero-imagen no puede llevar" — un motivo real, no "no hacía
falta" ni "el degradado ya da suficiente impacto"). No depende de si `OPENAI_API_KEY` está
configurada en este momento — esa es una condición de ejecución de 06, no una razón para no
elegir la estructura correcta aquí; si 06 no puede generarlo, lo reporta como bloqueo con la
elección de 03 documentada, no lo resuelve cambiando la estructura por su cuenta.
`scripts/check-hero-decision.ts` (Gate 11 del motor) verifica automáticamente que, cuando las dos
preguntas son "Sí", `module-selection.md` al menos MENCIONA `hero-imagen` — no puede verificar
que el motivo para descartarlo sea bueno, solo que existe.

**Si alguna de las dos preguntas es "No"**, sigue con el resto de variantes:

- **`hero-asimetrico`** cuando el brief da una cifra de ahorro/beneficio confirmada que merece
  ir en el hero (campo `stat`) y no hay necesidad particular de arte generado.
- **`hero-centrado`** cuando no hay ni cifra confirmada ni landing de referencia útil, o la marca
  no tiene assets/fotografía real que anclar (caso histórico: Tarífalo sin logo PNG confirmado).
- **`hero-marca-*`** solo si 02 completó el flujo de "Claude design" y hay un candidato aceptado
  para esa marca (ver `02-brand-visual-analyst.md` §"Hero de marca").

  **Desempate con `compositionProfile`** (solo si, tras aplicar los 3 criterios de arriba, sigue
  habiendo ambigüedad real entre `hero-asimetrico`/`hero-centrado` — nunca para forzar una cifra
  que no existe): `personality` en `comercial`/`juvenil` inclina hacia `hero-asimetrico` si hay
  algún dato numérico aprovechable aunque no sea el eje central de la campaña; `personality` en
  `editorial`/`premium`/`sobria` inclina hacia `hero-centrado` en vez de forzar un dato secundario
  al hero. Esto es un desempate, no un criterio nuevo — las 2 preguntas obligatorias de arriba
  siguen decidiendo primero.

**Nota si el patrón elegido es `fotografia-primero`:** ese patrón solo admite `hero-imagen`,
sin fallback (ver `patterns/fotografia-primero.md` §3) — si al llegar aquí no hay landing/URL
de referencia útil para anclar la generación, la elección de patrón en sí fue incorrecta;
revisar §"Elegir el patrón de género" antes de forzar un hero-centrado dentro de este patrón.

## Componer la secuencia (no copiar la del patrón)

**Desde 2026-07-24 un patrón es una GRAMÁTICA, no una secuencia fija** (ver
`patterns/institutional.md` §10 y la cabecera de `engine/lib/pattern.js`). Cada patrón declara:

- **Anclas** (líneas `N.` del `PATTERN_SEQUENCE`): posición fija. Normalmente la apertura
  (cabecera/hero) y el cierre (banda de cierre + footer). No se mueven — un email que no abre con
  marca/hero o no cierra con CTA+legal es un error de conversión y cumplimiento, no una decisión
  de diseño.
- **Zona libre** (líneas `-` consecutivas): el cuerpo. Sus bloques van **en el orden que este
  agente decida**, y varios admiten **repetición** (`max N`).

Por qué existe esta sección: hasta esta fecha el orden del cuerpo era único y obligatorio, así
que este agente no componía nada — transcribía. La medición sobre las 12 campañas reales del
sistema lo confirma: **todas terminaban en `banda-cierre → footer`, todas las de estos géneros
empezaban en `header-logo → hero-*`, ninguna repetía un bloque, ninguna alteraba el orden**. Toda
la investigación de marca de 02 desembocaba en el mismo esqueleto, y por eso el usuario reportaba
que las piezas "cambian colores y poco más". Liberar la gramática no arregla nada por sí solo si
este agente sigue escribiendo la secuencia por defecto por inercia — sería el mismo fallo que ya
ocurrió con `hero-imagen` (§"Elegir hero": la investigación existía y no llegaba a la decisión).

**Cómo se compone, por evidencia:**

1. Leer `layout.contentRhythm` del brand pack — 02 ya documenta ahí el nº de secciones reales de
   la página de la marca, de qué tipo es cada una y en qué orden aparecen (ver
   `02-brand-visual-analyst.md` §5).
2. Mapear ese ritmo real a los bloques disponibles de la zona libre. Si la página de la marca
   presenta credibilidad ANTES de detallar beneficios, la newsletter puede hacer lo mismo — ya no
   hay que invertirlo para encajar en el orden del patrón.
3. Repetir un bloque solo si el contenido real lo pide (ej. dos bloques editoriales alternando
   con fotografía en una marca cuya página lo hace) — **y nunca dos iguales seguidos**: eso
   reproduce exactamente el bloque duplicado que `patterns/institutional.md` §9 eliminó. Entre dos
   repeticiones tiene que haber un bloque con fondo/densidad distintos.
4. **Aplicar `compositionProfile` si está declarado** (ver §"Perfil de composición de marca"):
   `densityPreference` decide cuántos opcionales de la zona libre entran (siempre con contenido
   real detrás — nunca "por si acaso"); `alignmentBias` decide qué variante (centrado/asimétrico)
   usa cada módulo que tenga hermano — con `alternado`, esto es precisamente el mecanismo que
   rompe la uniformidad medida en las 23 campañas reales (§"Perfil de composición de marca"):
   variar la alineación módulo a módulo en vez de fijar una sola para toda la campaña.
5. Escribir en `module-selection.md` el orden elegido **y su motivo**, citando el campo de
   `contentRhythm` que lo justifica, más qué variante de alineación usa cada módulo y por qué
   (citando `compositionProfile.alignmentBias` si existe, o `layout.sectionStyle` si es lo único
   disponible). Si el orden coincide con el orden por defecto del patrón, decirlo explícitamente y
   por qué es el correcto para esta marca — "es el orden del patrón" no es un motivo, es la
   ausencia de uno.

## Salidas / Escribe

- `03-strategy/campaign-angle.md`
- `03-strategy/message-hierarchy.md` — mensajes ordenados por prioridad 1-4.
- `03-strategy/module-selection.md` — cada módulo incluido/omitido, con motivo.
- `03-strategy/structure.md` — secuencia EXACTA de componentes del motor, con nombres reales
  de `engine/components/` (para `saving`:
  `hero-asimetrico → [trust-bar] → card-tarifa → pasos → [lista-premium] → banda-cierre → footer`;
  para `fotografia-primero`:
  `header-logo → hero-imagen → [intro-cta] → [editorial-foto-texto] → [columns-3-beneficios-sin-icono] → banda-cierre → footer`).
- **`03-strategy/brand-structure-translation.md`** (nuevo, 2026-07-27 — evolución brand-native):
  documento de traducción estructural que vincula la página real de la marca con la estructura
  de la newsletter. Debe contener:
  - Secciones reales de la página de referencia (de `layout.contentRhythm` del brand pack).
  - Cuáles se traducen al email y cuáles no, con motivo.
  - Módulo elegido para cada sección traducida y por qué.
  - Qué se omite y por qué (ej. "el configurador de producto no se traduce a email").
  - Decisiones estructurales que hacen que esta newsletter sea distinta de una plantilla base:
    orden del cuerpo justificado contra la página real, no contra el orden por defecto del patrón.
  - **Si solo se propone la secuencia por defecto del patrón sin justificarla contra la página
    real, la fase debe bloquearse** con un motivo explícito — el Orchestrator devuelve el
    entregable a 03 para que lo justifique. Ver `scripts/check-structural-differentiation.ts`
    (Gate 12 de production-gate-motor).

## Validaciones (antes de entregar)

- La secuencia de `structure.md` valida contra la gramática del bloque `PATTERN_SEQUENCE` de
  `patterns/{género}.md` (el bloque parseable entre comentarios HTML — la misma fuente que
  `engine/lib/pattern.js` validará en el build; verificar contra él, no contra la tabla legible
  ni de memoria): anclas en su posición, bloques obligatorios presentes, ninguna regla repetida
  por encima de su `max`.
- **El orden del cuerpo está justificado contra `layout.contentRhythm`** (ver §"Componer la
  secuencia") — incluido el caso de que coincida con el orden por defecto del patrón, que también
  necesita motivo. Nunca "es el orden del patrón" como única razón.
- Si algún bloque se repite, hay al menos un bloque con fondo/densidad distintos entre las dos
  apariciones — dos bloques iguales seguidos son el defecto que `patterns/institutional.md` §9
  eliminó, y la gramática nueva no lo impide por sí sola.
- Cada módulo incluido tiene el contenido mínimo disponible en el brief (§4 del patrón,
  columna "Si falta"); cada módulo opcional omitido tiene su motivo en `module-selection.md`.
- 3-7 módulos; más de 7 requiere justificación explícita.
- El CTA principal aparece en el primer tercio de la secuencia.
- Si el patrón admite alternativas de hero (ver §"Elegir hero"), la elección concreta y su motivo
  están en `module-selection.md` — nunca la variante "de siempre" sin evaluar las demás.
- Las 2 preguntas de `hero-imagen` (URL real + `photography.usesRealPhotography`) están
  respondidas explícitamente en `module-selection.md`, aunque la respuesta a ambas sea "No" —
  `scripts/check-hero-decision.ts` (Gate 11) falla la campaña si se cumplen las dos y
  `module-selection.md` no menciona `hero-imagen` en ningún sitio.
- **`module-selection.md` documenta si `compositionProfile` estaba declarado en el brand pack y,
  si lo estaba, cómo se aplicó** (qué módulo usa qué variante de alineación y por qué, cuántos
  opcionales entraron por `densityPreference`) — si no estaba declarado, decir explícitamente que
  se usó el comportamiento por defecto, no dejarlo sin mencionar.

## Fase completada cuando

Los 4 archivos existen, la secuencia valida contra `PATTERN_SEQUENCE`, y cada
inclusión/omisión está justificada con datos del brief.

## Bloquea si

- No hay CTA u objetivo de campaña (heredado del brief).
- Menos de 2 inputs utilizables de la fase 02.
- **El género no tiene patrón en `patterns/`** — se bloquea explícitamente ("no existe
  `patterns/{género}.md`; crear el patrón es un prompt aparte"), nunca se improvisa secuencia.
- El contenido disponible no alcanza el mínimo de un módulo obligatorio del patrón.

## Entrega a

`04-email-designer`. Debe recibir: los 4 archivos de `03-strategy/` (los 4 — el ángulo y la
jerarquía informan el énfasis visual, no solo la estructura).

## No hacer

- Cero decisiones visuales (colores, tipografía, tamaños → 04) y cero copy (→ 05).
- Nunca inventar un patrón ni una variante de secuencia que `PATTERN_SEQUENCE` no permita.
- Nunca incluir un módulo "por si acaso" sin contenido real del brief que lo alimente.
