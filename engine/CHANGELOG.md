# Changelog — engine/

## Prompt 11 — Extracción de la biblioteca de componentes (2026-07-20)

Primer prompt de la Fase 1 (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`, §3.2).
Crea `engine/components/` a partir de la única pieza premium validada del sistema.

### Prerequisito verificado
`brands/paraycompara/tokens/brand-tokens.json` estaba en v2.2.0 (prompt 09 ejecutado el
2026-07-17) antes de empezar.

### Componentes creados
9 componentes activos + 1 parcial compartido (`cta-bulletproof.html`) + 1 stub no usado
(`header.html`, ver más abajo). Detalle completo, con orígenes de línea y tokens/datos de
cada uno, en `engine/components/INVENTORY.md`.

- `_shell.html` — envoltorio de página (doctype/head/preheader/tabla exterior)
- `hero-asimetrico.html` — logo + hero (fusionados, ver decisión abajo)
- `header.html` — **no usado**, stub de redirección a hero-asimetrico.html
- `cta-bulletproof.html` — parcial VML+fallback, usado por hero y banda de cierre
- `trust-bar.html`
- `card-tarifa.html`
- `pasos.html`
- `lista-premium.html`
- `banda-cierre.html`
- `footer.html`

### Convención de placeholders — extensión respecto al prompt
El prompt define `{{token:}}`, `{{data:}}` y `{{#each:}}`. Se añadió `{{include:nombre}}`
para el parcial compartido (`cta-bulletproof`), porque el inventario del prompt pide
explícitamente un componente "usado por hero y cierre" y eso no es representable con los 3
placeholders base. Cuando un padre usa `{{include:cta-bulletproof}}`, sus campos
`{{data:cta.href}}` / `{{data:cta.label}}` se resuelven en el ámbito de datos del PADRE
(`hero.cta` en el hero, `closing.cta` en la banda de cierre). **`build-newsletter.js`
(prompt 13) debe implementar esta resolución de `{{include:}}` con herencia de ámbito.**

### Decisión de diseño — logo fusionado dentro de hero-asimetrico.html
El inventario esperaba `header.html` (logo) y `hero-asimetrico.html` como 2 componentes
separados. En la fuente comparten una única `<table>` (líneas 75-166, 5 filas). Separarlos
exige duplicar la apertura de `<td>/<table>`, lo que rompe el criterio de aceptación "conteos
estructurales fuente vs suma de componentes: exactos" (51→52 tablas). Se priorizó el conteo
exacto sobre la forma del inventario (que el propio prompt marca como aproximado). El logo
vive dentro de `hero-asimetrico.html`; `header.html` quedó como stub documentado (no se pudo
eliminar el archivo — la carpeta montada no permitió el borrado en esta sesión — pero no
contiene markup real).

### Tokens añadidos a brand-tokens.json (v2.2.0 → v2.2.1)
Cada valor visual sin token encontrado durante la extracción se añadió al JSON en vez de
dejarlo hardcodeado, según instrucción del prompt. Detalle completo con verificación línea a
línea contra `09-exports/final.html` en el `_changelog` del propio `brand-tokens.json`.

**Adiciones limpias:** `colors.onBrandSecondary`, `colors.accentHaloLight`,
`colors.footerSeparator`, `assets.headerPatternTile`, y 10 tokens tipográficos nuevos
(`statLabel`, `stepNumber`, `stepTitle`, `cardLinkSecondary`, `trustBarText`, `footerBrand`,
`footerTagline`, `footerDisclosure`, `footerLegal`, `footerLinks`).

**Correcciones de valores stale encontrados durante la extracción** (no eran parte del
prompt 09, se descubrieron ahora):
- `typography.cta.size`: 16 → 19 (el CTA se subió a 19px en la ronda 10, el token nunca se
  actualizó)
- `components.trustBar.backgroundColor`: `#EAE0EA` → `#F8F5FC` (`#EAE0EA` no aparece en el
  HTML real ni una vez)
- `assets.logoWidth`/`logoHeight`: 200/55 → 176/48 (no coincidía con el `<img>` real)

### Hallazgo mayor — bug de producción en la campaña piloto (no corregido, solo documentado)
2 de los 4 ítems de la sección "Antes de decidir" en `09-exports/final.html` (la pieza hoy
marcada "Production Gate: ✅") están rotos: falta el `<h3>` del título y hay una tabla sin
cerrar que anida los ítems siguientes en vez de dejarlos como hermanos. Confirmado por conteo
real de `<h3>` (9 en la fuente, no 11) y verificado también en el HTML inline. Ninguna ronda
de QA anterior lo detectó por falta de verificación real en Outlook/Litmus (limitación ya
documentada en `handoff.md` de la campaña). `lista-premium.html` usa la estructura correcta
para las 4 repeticiones — no se reproduce el bug en el componente reutilizable. La fuente de
la campaña (`v5-premium/final-premium-v2.html`, `09-exports/final.html`) **no se tocó** —
recomendado abrir una corrección de campaña aparte antes de reenviar esa pieza. Detalle
técnico completo en la cabecera de `engine/components/lista-premium.html` y en
`engine/components/INVENTORY.md`.

### Otras anomalías normalizadas (documentadas en cada componente)
- Tarjeta "Móvil" con h3 a 19px (las otras 3 usan 16px) — normalizado a 16px en
  `card-tarifa.html` por ser componente repetible.
- `#666666` vs `#66616A` en descripciones (mismo contexto que `typography.body`, diferencia
  imperceptible) — unificado a `typography.body.color`.

### Verificación de completitud
Conteos estructurales (tablas, filas, headings, imágenes, VML, enlaces) sumados de todos los
componentes contra la fuente real. Resultado: exacto en `<table>` (51), `<tr>` (76), `<h1>`
(1), `<h2>` (4), `<img>` (9), `v:roundrect` (4) y enlaces con href de campaña (8). Los únicos
2 conteos con diferencia (`<td>`: 95 vs 93; `<h3>`: 11 vs 9) tienen la misma causa raíz: la
corrección deliberada del bug de `lista-premium.html` descrita arriba. Detalle completo en
`engine/components/INVENTORY.md`.

### Grep de hex de marca (criterio de aceptación)
`#5E2E91|#3E244D|#7B1FA2|#FF5A3C` en `engine/components/*.html`: 0 ocurrencias en código
funcional. Las únicas 2 coincidencias son texto explicativo dentro de un comentario de
documentación en `banda-cierre.html` (no markup renderizado).

### Restricciones respetadas
- No se modificó `v5-premium/final-premium-v2.html` ni ninguna campaña (verificado: sin
  ediciones, solo lectura).
- No se tocó `newsletter-system/core/components/*.html` (verificado por fecha de
  modificación: 14 de julio, sin cambios).
- VML y condicionales `mso` copiados byte a byte en `_shell.html` y `cta-bulletproof.html`.
- No se creó build script ni schema todavía — son los prompts 12 y 13.

### Pendiente conocido
Existe un directorio vacío residual en
`newsletters/2026/newsletter-system/engine/components/` (ruta antigua, incorrecta, creada por
error antes de identificar que `engine/` debe vivir en la raíz de `sistema-final/` según la
arquitectura objetivo). No contiene archivos y no se pudo eliminar por una restricción de la
carpeta montada en esta sesión — se puede borrar manualmente sin riesgo.

## Prompt 12 — Schema de datos + patrón de género "saving" (2026-07-20)

Segundo prompt de la Fase 1. Define qué datos describe una campaña y qué estructura tiene el
género "saving", para que el ensamblador (prompt 13) tenga un contrato claro.

### Archivos creados
- `engine/schema/campaign-data.schema.json` — JSON Schema draft-07
- `engine/schema/campaign-data.example.json` — la campaña piloto expresada en el nuevo formato
- `patterns/saving.md` — secuencia, ritmo, obligatorio/opcional, criterios de contenido, tabla
  de contrastes WCAG

### Verificación cruzada schema ↔ componentes (criterio de aceptación)
Se extrajeron programáticamente TODOS los placeholders `{{data:...}}` de los 9 componentes
activos (grep + regex sobre `engine/components/*.html`, excluyendo las cabeceras de
documentación) y se comprobó que cada uno tiene un campo correspondiente en el schema. Cobertura
100%, con una capa de traducción de nombres documentada (el schema usa una estructura
`modules[].data` semántica — `{eyebrow, title, items[]}` — en vez de replicar literalmente los
prefijos de placeholder de cada componente):

| Componente | Prefijo de placeholder | Módulo del schema (`component` const) |
|---|---|---|
| `_shell.html` | `subject`, `preheader` | `metadata.subjectLine` → `{{data:subject}}`, `metadata.preheader` → `{{data:preheader}}` (únicos 2 campos que NO viven dentro de `modules[]`, van directo del nivel `metadata`) |
| `hero-asimetrico.html` | `hero.*` | `hero-asimetrico` |
| `cta-bulletproof.html` | `cta.href`/`cta.label` | Resuelto por `{{include:}}` en el ámbito del padre (`hero.cta` / `closing.cta`) |
| `trust-bar.html` | `trustItems[n].text` | `trust-bar` → `data.items[]` |
| `card-tarifa.html` | `cardsSection.*` + `cards[n].*` | `card-tarifa` → `data.{eyebrow,title,subtitle}` + `data.items[]` |
| `pasos.html` | `stepsSection.*` + `steps[n].*` | `pasos` → `data.{eyebrow,title}` + `data.items[]` |
| `lista-premium.html` | `listSection.*` + `icon`/`title`/`body` (dentro de `{{#each}}`) | `lista-premium` → `data.{eyebrow,title}` + `data.items[]` |
| `banda-cierre.html` | `closing.*` | `banda-cierre` → `data.{title,body,cta}` |
| `footer.html` | `footer.*` | `footer` → `data.*` directo |

**`build-newsletter.js` (prompt 13) debe implementar esta tabla de mapeo** al resolver cada
entrada de `modules[]` contra los placeholders del componente correspondiente.

### Reglas heredadas incluidas en el schema
- `nonPendingString` ($def): prohíbe el literal `[PENDIENTE]` en cualquier campo de texto.
- `httpsUrl` ($def): exige `https://` absoluto en `src`/`href` de assets y enlaces comerciales.
- `hexColor` ($def): patrón `^#[0-9A-Fa-f]{6}$`, reservado — ningún campo de `campaign-data.json`
  usa color hoy (los componentes solo leen color de `{{token:}}`, nunca de `{{data:}}`).
- **Excepción añadida, no pedida por el prompt**: `espResolvedUrl` ($def), solo para
  `footer.unsubscribeUrl`/`preferencesUrl`. Acepta una URL https real O un merge-tag de ESP
  entre corchetes (`[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`) — la campaña piloto real usa
  estos placeholders literales porque son tokens que el ESP resuelve al enviar, no datos
  pendientes en el sentido de `[PENDIENTE]`. Sin esta excepción, `campaign-data.example.json`
  no podría validar con el copy real de footer (violaría "cópialo de la pieza, no la
  parafrasees").
- Convención `^_` (patternProperties) a nivel raíz y en los ítems de `lista-premium`, para
  permitir anotaciones tipo `_comment`/`_reconstructed` sin relajar `additionalProperties:false`
  en el resto del documento — misma convención ya usada en `brand-tokens.json`.

### `campaign-data.example.json` — fidelidad del copy
Copy extraído literalmente de `v5-premium/final-premium-v2.html`, módulo a módulo. Única
excepción: los títulos de 2 de los 4 ítems de `lista-premium` ("Cobertura", "Condiciones") no
existen en la fuente (mismo bug documentado en el prompt 11) — se reconstruyeron a partir del
nombre del icono y del cuerpo de texto ya existente, y se marcaron `_reconstructed:true` con
una nota explícita de que deben confirmarse con el autor del copy original antes de usarse en
producción. El resto de campos (33 de 35 en ese módulo, y el 100% del resto de módulos) es
copy real, no parafraseado.

### Validación programática
`campaign-data.example.json` validado contra `campaign-data.schema.json` con la librería
`jsonschema` (Python, Draft7Validator) — 0 errores. El propio schema se validó primero contra
la meta-schema de Draft-07 (`Draft7Validator.check_schema`).

### Corrección de contraste WCAG encontrada al construir la tabla de patterns/saving.md
No pedida por el prompt 09 ni el 11, encontrada ahora al recalcular TODOS los pares de color
con la fórmula real de luminancia relativa (no copiando ratios de documentos anteriores sin
verificar). `brand-tokens.json` v2.2.1 → v2.2.2:
- **Corregido**: `typography.footerTagline.color` (`#99939B` → `#66616A`). El original daba
  2.72:1 sobre `surfaces.global`, por debajo del mínimo AA (4.5:1) — el mismo fallo que ya se
  había corregido una vez en la línea de disclosure del footer (ver `redesign-summary.md` de
  la campaña) pero nunca se propagó a la línea de tagline. Se reutilizó el color ya validado
  de `colors.text.secondary` (5.47:1).
- **Documentado, no corregido**: `typography.cardLinkSecondary` (#FF5A3C a 13px/700 sobre
  blanco = 3.10:1, falla el umbral normal de 4.5:1 porque 13px/700 no califica como "texto
  grande" — el mismo color SÍ pasa en el CTA a 19px/700, que sí califica). Corregirlo exige un
  cambio de diseño (agrandar el enlace) o de color de marca (fuera del alcance de una
  corrección técnica de token) — queda como hallazgo pendiente de decisión en
  `patterns/saving.md` §5.

### Restricciones respetadas
- No se creó ningún género más allá de `saving` (regla anti-aspiracional del plan, §5).
- No se tocaron los componentes del prompt 11, salvo los 2 valores de token corregidos arriba
  (permitido explícitamente por el prompt: "salvo error factual descubierto, documentado en
  CHANGELOG").
- El patrón documenta reglas ya validadas en rondas anteriores (ritmo, sombras, acento de
  color) — no introduce criterios de diseño nuevos sin respaldo histórico.

## Prompt 13 — El ensamblador: engine/build-newsletter.js (2026-07-20)

Tercer y último prompt de la Fase 1. Con componentes (11) y schema+patrón (12) ya existentes,
este prompt escribe el script que los une en un solo comando: `campaign-data.json` → HTML
fuente + inline, paridad garantizada por construcción (nunca desincronizados, porque ambos
salen de la misma ejecución en memoria).

### Archivos creados
- `engine/build-newsletter.js` — punto de entrada (CLI, `--data`/`--out`)
- `engine/lib/tokens.js` — carga de brand-tokens.json, comprobación de versión ≥2.2.0
- `engine/lib/pattern.js` — parseo de `patterns/{pattern}.md` y validación de secuencia
- `engine/lib/assemble.js` — motor de placeholders (token/data/each/include/slot) y
  adaptadores de módulo
- `engine/lib/verify.js` — auto-verificación post-build
- `engine/README.md` — uso, convención de placeholders, cómo extender el motor

### Dependencia añadida
`ajv` (`npm install ajv --save`, v8.20.0) — única dependencia nueva, como pide el prompt
("sin dependencias más allá de juice y ajv"). `juice` ya estaba instalado desde antes.

### Decisión de diseño — nunca escribir outputs parciales, en vez de escribir y borrar
La especificación pedía "si falla, borra los outputs parciales". Se implementó algo más
fuerte: todo el pipeline (validación de schema, tokens, patrón, ensamblado, inline,
auto-verificación) corre en memoria; `fs.writeFileSync` solo se invoca al final, los 3
archivos seguidos, y solo si absolutamente todo pasó. Es estructuralmente imposible dejar un
`final.html` inválido en `09-exports/` porque nunca se llega a escribir uno — más simple y más
difícil de romper por accidente que un mecanismo de "escribe y borra si falla". Verificado en
los 4 casos de error probados (abajo): en ninguno se crea siquiera el directorio `--out`.

### Bloque PATTERN_SEQUENCE añadido a patterns/saving.md
El prompt 13 pide que la secuencia del patrón se mantenga "parseable, formato lista" para que
el script la lea. `patterns/saving.md` (prompt 12) la documentaba solo como tabla Markdown, no
parseable de forma trivial. Se añadió un bloque delimitado por comentarios HTML
(`<!-- PATTERN_SEQUENCE -->` ... `<!-- /PATTERN_SEQUENCE -->`) con una línea por módulo
(`N. component-name (required|optional)`), sin tocar ni quitar la tabla legible existente —
ambas versiones deben mantenerse sincronizadas a mano, documentado en el propio bloque.

### Corrección en el schema — "format" → "pattern" (ajv puro no valida "format")
Al probar el build con `campaign-data.example.json`, ajv avisó (2 veces) de que
`"format": "email"` y `"format": "date"` se ignoraban — ajv sin el paquete `ajv-formats`
(prohibido por el prompt: "sin dependencias más allá de juice y ajv") no implementa
validación de `format`, solo la anota sin comprobarla. Se sustituyeron por `"pattern"` (regex)
en `campaign-data.schema.json` para `metadata.fromEmail` y `metadata.createdAt` — mismo nivel
de validación pretendido, pero que ajv puro sí aplica de verdad. Ningún otro campo del schema
usaba `"format"`.

### Prueba con campaign-data.example.json
Build completo en `engine/_test-output/` sin errores ni avisos. Verificado con conteo
estructural del `final.html` generado contra los totales ya calculados a mano en el prompt 11
(`engine/components/INVENTORY.md`): **coincide exactamente** — 51 `<table>`, 76 `<tr>`, 95
`<td>`, 1 `<h1>`, 4 `<h2>`, 11 `<h3>` (incluye la corrección deliberada del bug de
`lista-premium`), 9 `<img>`, 4 `v:roundrect`, 8 enlaces con UTM. Inline: 38.5 KB (bien por
debajo del límite de 90 KB y del aviso de 80 KB).

### Los 4 caminos de error probados
1. **Data inválido contra el schema** — se quitó `metadata.fromEmail` del example. Resultado:
   `exit 1`, mensaje `"/metadata must have required property 'fromEmail'"`, directorio `--out`
   nunca creado.
2. **Placeholder sin valor** — probado como test directo de `lib/assemble.js` (no vía CLI): con
   el schema al 100% de cobertura de los campos `{{data:...}}` (criterio de aceptación del
   prompt 12), es prácticamente imposible que un dato incompleto pase la validación de schema
   y llegue a esta ruta de error — así que la prueba honesta es unitaria, no de punta a punta.
   Resultado: `renderTemplate` lanza `"{{data:hero.subtitle}} — placeholder sin valor"` al
   recibir un scope sin ese campo.
3. **Token inexistente** — se creó un brand pack de prueba
   (`brands/test-broken/tokens/brand-tokens.json`) sin `typography.h1HeroOnBrand` y se apuntó
   `campaign-data.json` a él. Resultado: `exit 1`,
   `"[hero-asimetrico] {{token:typography.h1HeroOnBrand.size}} — path no existe"`, sin outputs.
4. **Patrón violado** — se quitó el módulo obligatorio `pasos` del example. Resultado:
   `exit 1`, `"Módulo obligatorio "pasos" (posición 4 del patrón) ausente o fuera de orden..."`,
   sin outputs.

### Restricciones respetadas
- El script no retoca diseño — toda discrepancia de fidelidad (si la hay) se corrige en
  componentes o datos, no aquí; la prueba de fuego (prompt 14) es la que mide fidelidad visual.
- No se escribió en ninguna campaña real — todas las pruebas fueron a `engine/_test-output/`,
  `engine/_test-output-err{1,3,4}/` (ninguno de estos 3 llegó a crearse, ver arriba) o vía
  test unitario directo.
- Sin dependencias más allá de juice y ajv.

### Pendiente conocido
Quedan 2 artefactos residuales de las pruebas de esta sesión que no se pudieron borrar por la
misma restricción de la carpeta montada ya documentada en el prompt 11:
`newsletters/2026/newsletter-system/brands/test-broken/` (brand pack de prueba del caso 3) y
los directorios vacíos `engine/_test-output-err1/`, `_err3/`, `_err4/` — en realidad estos 3
últimos **nunca llegaron a crearse** (confirmado con `ls` tras cada prueba), así que no hay
nada que limpiar ahí; el único residuo real es `brands/test-broken/`. Se puede borrar
manualmente sin riesgo — no lo referencia ninguna campaña real.

## Prompt 14 — Prueba de fuego: regenerar la piloto desde el motor (2026-07-20)

Cuarto y último prompt de la Fase 1. Responde la pregunta que justifica todo el trabajo
anterior: ¿el motor reproduce la calidad premium de la pieza validada en 15 rondas? Build
ejecutado con `campaign-data.example.json` → `engine/_test-output/`. Informe completo en
`engine/_test-output/parity-report.md`.

### Veredicto: APTO, 0 iteraciones

Ninguna diferencia encontrada requirió tocar `engine/components/`, `engine/lib/` ni el schema.
Todas las discrepancias de la primera pasada resultaron ser correcciones ya documentadas en
los prompts 11-13, no defectos nuevos:

- **Balance de `<table>`** (49 cierres en el original vs 51 en el regenerado): bug de markup
  preexistente en la pieza piloto (2 tablas sin cerrar); el motor genera HTML siempre
  balanceado por construcción (`lib/verify.js` rechazaría el build si no lo estuviera).
- **`<h3>` (9 vs 11)**: la corrección ya documentada del bug de "Antes de decidir" (prompt 11) —
  2 títulos de item reconstruidos con `_reconstructed: true`.
- **Recuento de gris de footer (`#66616A`/`#99939B`)**: el fix de contraste WCAG de
  `brand-tokens.json` v2.2.2 (prompt 12) aplicado de forma consistente vía token.
- **Altura total ~6-7% menor** en el regenerado: el fix de tamaño de fuente móvil ya
  documentado hace que el título de la banda de cierre quepa en 1 línea en vez de 2.

### Paridad visual — método y hallazgo de proceso

Render con Chromium headless (Playwright) en el sandbox, reconstruyendo el stub
`libXdamage.so.1` que faltaba (receta: `objdump -T` sobre el binario para extraer los 4
símbolos exactos que faltaban — `XDamageQueryExtension`, `XDamageCreate`, `XDamageDestroy`,
`XDamageSubtract` — y compilar un stub no-op con `gcc -shared -fPIC`). Capturas a
320/375/600/600-dark de ambas piezas, comparadas con `pixelmatch`.

La región superior (header → hero → trust bar → cards → pasos, no afectada por el fix
tipográfico) da **0.03-0.04% de píxeles distintos** en los 4 viewports — esencialmente
idéntica; el único origen es un glifo con antialiasing ligeramente distinto en la palabra
"Móvil" de una card, sin impacto visual.

Un primer diff de la región inferior (banda de cierre + footer) con un recorte de altura fija
desde el borde inferior dio resultados engañosos (~28-39% de píxeles distintos, patrón de
"doble exposición"). Diagnosticado como artefacto de método: el recorte de altura fija no
compensaba la diferencia real de ~250px de altura total entre las 2 piezas (causada por el fix
tipográfico ya documentado), así que no alineaba la misma sección en ambas capturas. La
inspección directa con recortes correctamente posicionados confirmó que banda de cierre y
footer tienen el mismo contenido letra por letra, con la única diferencia de que el título
ocupa 1 línea en vez de 2. Detalle completo, con las capturas de evidencia, en
`parity-report.md` §2.

### Restricciones respetadas
- Ninguna edición manual del output regenerado — el build lo genera bit a bit desde
  `campaign-data.example.json`.
- No se tocó `v5-premium/final-premium-v2.html` ni ningún archivo de la campaña piloto
  (solo lectura, para las capturas de referencia).
- Los iconos de CDN no cargan en el sandbox (allowlist de red) — aparecen como placeholder en
  ambas piezas por igual, no se contó como diferencia (excepción explícita del prompt).

### Cierre de F1
Fase 1 completa. Ver `docs/f1-motor-cerrado.md` para la nota de cierre y
`prompts-fase1-motor/README.md` para el checklist marcado.

---

## 2026-07-21 — hero-imagen: cambio de proveedor a Pollinations.ai (gratis, sin clave)

`generate-hero-image.ts` dejó de usar gpt-image (OpenAI) — el usuario topó con el límite de
facturación de su cuenta OpenAI y pidió explícitamente un proveedor gratuito, sin coste alguno.
Se descartó primero DeepSeek como alternativa (verificado por búsqueda web: su API es solo texto
— chat/razonamiento — y admite imagen como *entrada* pero no genera imágenes; su modelo con
capacidad de imagen, Janus-Pro, no se expone vía la API de DeepSeek). Proveedor elegido:
**Pollinations.ai** (`image.pollinations.ai`), plataforma open-source (MIT), sin cuenta ni clave
obligatorias — nivel anónimo gratis siempre (marca de agua discreta, 1 imagen/15s);
`POLLINATIONS_TOKEN` opcional (registro gratis en auth.pollinations.ai) solo quita la marca de
agua y sube el límite, sigue sin facturación. El componente `hero-imagen.html`, el adaptador en
`assemble.js` y la rama del schema NO cambian — son agnósticos al proveedor de imagen, solo
consumen `data.bannerSrc`/`data.bannerAlt` ya resueltos. Cambios: `generate-hero-image.ts`
reescrito (GET a `image.pollinations.ai/prompt/{prompt}`, sin `OPENAI_API_KEY`);
`.env.example`/`.env` actualizados (clave `OPENAI_API_KEY` retirada, añadida
`POLLINATIONS_TOKEN` opcional); `agents/02-brand-visual-analyst.md`,
`PROMPT-CONTEXTO-HERMES.md` y `pipeline-skill/references/script-usage.md` actualizados. No toca
`engine/components.lock.json` (ningún archivo del motor cambió).

---

## 2026-07-22 — hallazgo: campaña UAX fuera del motor, y patrón "institutional" nuevo

**Hallazgo.** El usuario reportó (captura) columnas y tarjetas desalineadas en la newsletter de
UAX — FP Online. Al investigar, `newsletters/2026/uax/2026-jul-uax-fp-online/` resultó estar
COMPLETAMENTE fuera del motor: su `06-data/campaign-data.json` usaba una forma antigua
(`{type, content}`, tipos `columns_3`/`categories`/`usp`/`cta_banner`/`text_cta` que no existen
en `engine/components/`) y su `09-exports/final.html` era HTML escrito a mano — sin
`build-manifest.json`, sin archivos de control, sin paso por `engine/build-newsletter.js`. No es
el mismo incidente del 2026-07-21 (aquella vez el motor SÍ se tocó y se sobrescribió; esta vez
el motor nunca se usó para esta campaña) pero es la misma familia de problema: contenido
producido fuera del pipeline sancionado, sin las protecciones de schema/gates/parity.

**Causa raíz del bug reportado.** En el HTML a mano: (1) la sección de 3 columnas de beneficios
tenía un badge de promo ("50% de la matrícula*") solo dentro de la columna 1, más textos de
longitud muy distinta entre columnas (columna 1 ~12 palabras, columnas 2/3 ~35) — sin ningún
mecanismo que igualara la altura visual; (2) el grid de categorías tenía 5 ítems en filas de
3+2 sin que la fila 2 compartiera estructura/ancho de columna con la fila 1 de forma
garantizada.

**Decisión (con el usuario, vía pregunta explícita):** "Motor completo" en vez de parchear el
HTML a mano — construir los componentes que faltaban, un patrón de género nuevo, migrar los
datos al schema real y reconstruir con `engine/build-newsletter.js`, para que esto no dependa
de que una sesión futura escriba HTML a mano con cuidado, sino que sea estructuralmente
imposible con los componentes del motor.

**Trabajo:**
- **Brand pack nuevo**: `brands/uax/tokens/brand-tokens.json` v2.2.0 — colores/logo observados
  del `campaign-data.json` original (nunca inventados); contrastes WCAG recalculados a mano
  (`colors.light` = `#0060AB`, no el `#008CF7` más claro del CTA, porque este último da solo
  3.45:1 sobre blanco — insuficiente para texto normal de 12px, sí válido para el botón CTA de
  19px/700 que cuenta como "texto grande"). Detalle completo en el `_changelog` del propio pack.
- **5 componentes nuevos** en `engine/components/`: `header-logo.html` (cabecera de logo,
  separada del hero en este género), `intro-cta.html` (párrafo de transición + CTA),
  `columns-3-beneficios.html` (3 columnas iguales — el highlight de promo es a nivel de
  SECCIÓN, a todo el ancho, DEBAJO de las 3 columnas: estructuralmente no puede vivir dentro de
  una sola columna, así que el bug original es irreproducible con este componente),
  `category-grid.html` (grid de 2-8 categorías; el adaptador de `lib/assemble.js` agrupa en
  filas de 3 en JS ANTES de renderizar, así ninguna fila queda con celdas "fantasma" ni un
  ancho de columna distinto al de otras filas), `usp-cards.html` (3 tarjetas de credibilidad +
  insignia). Cada uno con su adaptador en `MODULE_ADAPTERS` (`lib/assemble.js`) y su rama
  `oneOf` en `campaign-data.schema.json` (+ `$defs.iconGlyph`: icono como emoji/texto, no
  imagen — cero dependencia de CDN para un icono decorativo).
- **Patrón de género nuevo**: `patterns/institutional.md` — secuencia, ritmo, obligatorio/
  opcional, criterios de contenido y tabla WCAG completa (mismo formato que `saving.md`).
  Añadido `"institutional"` al `enum` de `pattern` en el schema. Regla anti-aspiracional
  respetada: se crea porque había una campaña real (UAX) que lo necesitaba, no antes.
- **Guardarraíl de código nuevo**: `scripts/check-column-balance.ts` — bloquea el build si las
  3 columnas de un `columns-3-beneficios` tienen un ratio de palabras > 1.6x entre la más larga
  y la más corta. Cierra el lado del problema que la plantilla sola no puede evitar (el copy en
  sí puede desequilibrarse aunque la estructura sea correcta). Añadido como **Gate 7** de
  `scripts/production-gate-motor.ts` (antes terminaba en el Gate 6/control-files) — se aplica a
  CUALQUIER campaña futura que use este componente, no solo a UAX.
- **Campaña migrada**: `newsletters/2026/uax/2026-jul-uax-fp-online/06-data/campaign-data.json`
  reescrito a la forma `{component, data}` real, con `brand: "brands/uax/tokens/brand-tokens.json"`
  y `pattern: "institutional"`. Copy de los 3 beneficios reescrito para quedar equilibrado entre
  columnas (antes 12/38/32 palabras aprox., ahora las 3 en el rango 15-16 — ratio ~1.07x, muy
  por debajo del límite de 1.6x del gate nuevo) sin perder ningún claim del original. El resto
  del copy (categorías, USP, cierre) se conserva del original.
- **`engine/components.lock.json` actualizado** (`npm run check-engine -- --update`) — 5
  componentes nuevos entran al lock.

**No tocado:** ningún componente existente de `saving.md` se modificó. `hero-centrado.html` se
reutiliza tal cual (sin cambios) para el hero de UAX — su subtítulo y el "supportText" del
original se fusionaron en un único `hero.subtitle` en el adaptador de datos, en vez de tocar la
plantilla compartida con otras marcas.


---

## 2026-07-22 — UTF-8 garantizado de serie en toda newsletter (auto-verificación)

Petición del usuario: que TODA newsletter que genere el sistema lleve `UTF-8` siempre, no como
hecho incidental. Comprobado: `engine/components/_shell.html` ya declara
`<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />` como primera etiqueta
de `<head>` (best practice de email — dentro de los primeros 1024 bytes) desde F1, y las 4
campañas reales existentes (`2026-jul-comparar-tv`, `2026-jul-revision-verano`,
`2026-jul-comparar-luz-gas`, `2026-jul-uax-fp-online`) ya lo tienen porque todas pasan por
`_shell.html`. El hueco real no era que faltara HOY, sino que nada lo garantizaba para MAÑANA:
si alguien tocara `_shell.html` y lo quitara por error, ningún gate lo habría detectado.

Cerrado añadiendo un check nuevo en `engine/lib/verify.js` (paso 6 del pipeline,
`verifyBuild()` — corre en TODO build, de cualquier campaña, motor genérico, no específico de
ninguna marca): falla el build si `final.html` o `final-inline.html` no declaran
`charset="UTF-8"` (o el equivalente `http-equiv`). Es la misma filosofía que
`check-column-balance.ts` del hallazgo de UAX: un hecho hoy verdadero se convierte en una
garantía estructural, no en una suposición. `engine/components.lock.json` actualizado (cambia
`lib/verify.js`). Las 4 campañas reales reconstruidas — 0 cambios de contenido, el check nuevo
pasa en las 4 (ya lo tenían).


---

## 2026-07-22 — Nivel 1: tokenización de tipografía/radius/shadows ("subir de nivel" la identidad visual)

Petición del usuario: que las newsletters "copien mucho mejor toda la identidad visual de la
marca", evitando que parezcan "plantillas genéricas que solo cambian colores". Diagnóstico
previo (subagente Explore, read-only): `typography.displayFont`, `radius.*` y `shadows.*`
estaban completamente definidos en los 3 brand packs reales (paraycompara, tarifalo, uax) pero
el 100% sin consumir — todos los componentes de `engine/components/` tenían esos valores
**hardcodeados** con los literales exactos de paraycompara (la primera marca construida, F1).
Solo `colors.*` variaba de verdad entre marcas; el resto de la identidad visual era idéntico en
todas. Confirmado leyendo el pack de paraycompara: `radius.card=18`, `shadows.card=rgba(94,46,145,..)`,
`shadows.cta=rgba(255,90,60,..)`, `typography.displayFont` con `'Sora'` — coinciden byte a byte
con lo hardcodeado.

Alcance de esta ronda (Nivel 1, confirmado con el usuario vía AskUserQuestion —
`spacing.*` queda explícitamente FUERA, es Nivel futuro, por el riesgo de romper paddings
asimétricos ya afinados que no mapean limpio a una escala simple):

- **`typography.displayFont`**: 14 ocurrencias de `font-family:'Sora','Segoe UI',Arial,Helvetica,
  sans-serif` hardcodeado → `{{token:typography.displayFont}}`, en `hero-imagen.html`,
  `pasos.html`, `lista-premium.html`, `card-tarifa.html`, `card-tarifa-3.html`,
  `hero-marca-tarifalo.html`, `hero-asimetrico.html`, `hero-centrado.html`, `cta-bulletproof.html`.
  Además, por consistencia (para que cualquier marca futura que use el patrón `institutional`
  también herede su propio display font en los títulos de sección, no solo Arial fijo), se
  tokenizaron los `<h2>` de sección de `intro-cta.html`, `banda-cierre.html`, `usp-cards.html`,
  `category-grid.html`, `category-grid-img.html` y `columns-3-beneficios.html` (antes
  `Arial,Helvetica,sans-serif` fijo).
- **`radius.card` / `radius.cardStripe` / `radius.ctaPill`**: reemplazan `border-radius:18px`,
  `border-radius:16px 16px 0 0` y `border-radius:50px` hardcodeados en `card-tarifa.html`,
  `card-tarifa-3.html`, `lista-premium.html`, `cta-bulletproof.html`, `trust-bar.html`, y el
  `border-radius:10px` de los componentes del género `institutional` (`usp-cards.html`,
  `category-grid.html`, `category-grid-img.html`, `columns-3-beneficios.html`).
- **`shadows.card` / `shadows.cta`**: reemplazan los `box-shadow` hardcodeados en las mismas
  tarjetas y en `cta-bulletproof.html`.

### Bug real corregido (no solo tokenización — un defecto visual concreto)
`cta-bulletproof.html` tenía `box-shadow:0 12px 28px rgba(255,90,60,0.22)` fijo — el naranja
DE PARAYCOMPARA — en el botón CTA de **todas** las marcas. tarifalo y uax mostraban el tinte de
sombra naranja de paraycompara en su propio botón, en vez del tinte de su propio color de marca.
Con el token, cada marca muestra ahora la sombra de su propio `ctaBackground`.

### Hallazgo colateral: brand pack duplicado y desincronizado de tarifalo
Durante la verificación se descubrió que **existían dos copias** de
`brands/tarifalo/tokens/brand-tokens.json`: la de la raíz del sistema (`brands/tarifalo/...`,
v2.2.1 — la que el motor realmente resuelve primero, según `engine/lib/tokens.js`, y la que
lleva la corrección WCAG real de `ctaText` y el fix de `headerPatternTile`) y una segunda copia
huérfana en `newsletters/2026/newsletter-system/brands/tarifalo/...` (v1.0.x, desactualizada,
sin esas dos correcciones — nunca se usa mientras la primera exista). Esta ronda tocó ambas por
consistencia del campo `displayFont`, pero la copia huérfana sigue sin eliminarse — anotado como
limpieza pendiente, fuera del alcance de Nivel 1 (ver `_changelog` de ese archivo).

### Verificación de byte-parity (las 4 campañas reales, `cmp` + `diff` línea a línea)
- **`2026-jul-comparar-tv`, `2026-jul-revision-verano`** (paraycompara): **1 único diff** en
  ambas — el `<h2>` de `banda-cierre.html` pasa de `Arial,Helvetica,sans-serif` a
  `'Sora','Segoe UI',Arial,Helvetica,sans-serif`. Era la única cabecera de sección que no
  usaba ya el display font de la marca (inconsistencia previa, no una decisión de diseño
  documentada) — con el token, el cierre queda visualmente coherente con el resto de la pieza.
  Cambio visual real, mínimo, e intencional. Todo lo demás, byte a byte idéntico (se normalizó
  además el propio token `displayFont` de paraycompara para incluir el fallback `'Segoe UI'`
  que ya llevaba el literal hardcodeado, evitando diffs de formato sin motivo).
- **`2026-jul-comparar-luz-gas`** (tarifalo): diffs en exactamente los 3 campos documentados en
  el `_changelog` del pack — `radius.card` 18→16, `shadows.card` (tinte neutro provisional →
  tinte navy real de la marca) y `shadows.cta` (naranja de paraycompara → naranja real de
  tarifalo). Cero diffs en cualquier otro campo.
- **`2026-jul-uax-fp-online`**: diffs en el hero/CTA (`'Sora'` → `Arial, Helvetica, sans-serif`,
  el display font real de UAX) y en `shadows.cta` (azul de paraycompara-naranja-erróneo →
  `rgba(0,140,247,..)`, el azul real de UAX). Esta era la campaña que originó todo el
  diagnóstico — el cambio es exactamente el que se buscaba.

### Gates
`npm run check-engine -- --update` — 26 archivos relockeados (16 componentes modificados + 3
brand packs). Los 8 gates de `production-gate-motor.ts` pasan limpios en `tv`, `luzgas` y `uax`
tras el update (los avisos de assets HTTP son falta de red del sandbox, no roto — mismo patrón
que rondas anteriores). `revision-verano` falla el Gate 6 (control-files) por una causa
**no relacionada**: a esa campaña, a diferencia de UAX, nunca se le crearon los 4 archivos de
control (`campaign-status.md`/`task-log.md`/`handoff.md`/`next-steps.md`) — hueco preexistente,
no introducido por esta ronda, pendiente de backfill igual que se hizo con UAX.

**No tocado en esta ronda:** `spacing.*` (Nivel futuro, fuera de alcance por decisión explícita
con el usuario).


---

## 2026-07-22 — Nivel 2: variedad estructural real, decisión de marca

Petición del usuario: "Hoy 'institucional' es siempre centrado, siempre la misma secuencia.
Añadir variantes de composición reales (asimetría opcional, más de 1-2 layouts por sección)
para que la elección de estructura también sea una decisión de marca, no solo de género."
Confirmado con el usuario vía `AskUserQuestion` — alcance "Amplio" (4 componentes, no solo 1-2)
y mecanismo "bloque `layout` en `brand-tokens.json`" (no auto-resolución en el motor, no solo
documentación sin campo declarado).

### Qué se construyó
4 componentes nuevos en `engine/components/`, cada uno variante asimétrica de un módulo
existente del patrón `institutional`, con **idéntico contrato de datos** que su contraparte
centrada (mismo adaptador en `lib/assemble.js`, reutilizado literalmente — el layout cambia en
la plantilla, la forma del JSON no cambia):

- `intro-cta-asimetrico.html` — título+cuerpo izq (64%) / CTA der (36%), en vez de apilado y
  centrado.
- `columns-3-beneficios-asimetrico.html` — 3 filas apiladas (icono en halo izq + texto izq a su
  derecha) en vez de 3 columnas centradas lado a lado. El highlight sigue siendo una franja
  aparte a todo el ancho debajo de las 3 filas — se conserva la regla estructural del hallazgo
  de UAX (Nivel 0): un aviso de longitud variable no puede vivir dentro de un bloque de N
  elementos iguales.
- `usp-cards-asimetrico.html` — insignia final como chip compacto junto a la cabecera
  (eyebrow+título+cuerpo izq, insignia der, misma fila) en vez de bloque a todo el ancho debajo
  de las 3 tarjetas. Las 3 tarjetas no cambian.
- `banda-cierre-asimetrico.html` — título+cuerpo izq (62%) / CTA der (38%), mismo lenguaje
  compositivo que `hero-asimetrico.html` (origen de la familia visual "asimétrico" del sistema).

Deliberadamente NO tocados: `header-logo`, `hero-*` (ya tenía su propia familia de
alternativas), `category-grid*` (depende de agrupación en filas de 3 vía JS en el adaptador —
una variante asimétrica ahí cambiaría esa lógica, no solo la plantilla) y `footer` (bloque
utilitario sin contenido narrativo). Detalle completo, con tabla centrada-vs-asimétrica y
justificación de cada exclusión, en `patterns/institutional.md` §7.

### Mecanismo: `layout.sectionStyle` en `brand-tokens.json`
Bloque nuevo por marca:
```json
"layout": { "sectionStyle": "centrado" | "asimetrico", "reason": "..." }
```
Quien escribe `campaign-data.json` (agente 03 o humano) lo consulta igual que ya consulta
`colors`/`typography`, y nombra el componente correspondiente (`X` o `X-asimetrico`) en cada
módulo. El motor **no infiere nada automáticamente en build-time** — se mantiene el principio
del sistema de que `campaign-data.json` declara explícitamente qué componente usa cada módulo
(opción descartada expresamente por el usuario: auto-resolución en `build-newsletter.js`).

Valores declarados en los 4 packs reales (razón completa en el `_changelog` de cada uno y en
`patterns/institutional.md` §7.3):
- **UAX**: `centrado` — su única campaña real ya está construida y aprobada en centrado;
  cambiarla ahora no tiene motivo de negocio.
- **Óptica 2000**: `asimetrico` — sin campaña real ejecutada aún (`PROMPT-OPTICA2000-HERMES.md`
  es un documento de traspaso), candidata natural para estrenar las 4 variantes; su tono
  ("cercano, profesional, cuidado visual") encaja mejor con composición editorial que con el
  registro corporativo centrado de UAX.
- **Tarífalo / Para y Compara**: `asimetrico` — usan el género `saving`, no `institutional`; se
  declara por consistencia (mismo patrón que `voice`, presente en todos los packs
  independientemente del género que use cada campaña) y refleja lo que `saving.md` §2 ya
  documentaba como su composición real. No activa ningún componente nuevo de esta ronda.

### Schema
`campaign-data.schema.json`: las 4 ramas `oneOf` correspondientes pasan de
`"component": {"const": "X"}` a `"component": {"enum": ["X", "X-asimetrico"]}` — la forma de
`data` no cambia, solo se amplía el nombre de componente aceptado en esa posición.

### `patterns/institutional.md`
`PATTERN_SEQUENCE` actualizado con las 4 nuevas alternativas (`|`). §2 (reglas de ritmo)
actualizado: la alineación deja de ser fija-centrada para este género, pasa a ser una tercera
variable de ritmo disponible junto a fondo/densidad cuando la marca es `asimetrico`. §7 nuevo,
documentación completa del mecanismo (tabla de las 4 variantes, quién es cada marca hoy, y por
qué).

### Verificación
No se creó ninguna campaña ficticia en `newsletters/` para probar esto (regla anti-aspiracional
del sistema, la misma ya invocada al crear `institutional.md` la primera vez). En su lugar:
`engine/_test-output/nivel2-fixture/campaign-data.json` — fixture marcado explícitamente como
NO-campaña, usa las 4 variantes nuevas contra el brand pack real de Óptica 2000
(`layout.sectionStyle: asimetrico`). `node engine/build-newsletter.js` sobre el fixture: BUILD
OK, `verifyBuild()` con 0 errores/0 warnings (placeholder-residue, conteo `<img>`/`utm_source`/
`v:roundrect`, balance de tablas, todo correcto), radius/shadow/displayFont de Óptica 2000
resueltos correctamente en las 4 secciones nuevas (`border-radius:16px`, `font-family:Arial,
Helvetica, sans-serif`).

Las 4 campañas reales (`tv`, `verano`, `luzgas`, `uax`) — ninguna nombra los componentes nuevos
en su `campaign-data.json` — reconstruidas y comparadas byte a byte contra el build anterior a
esta ronda: **las 4, idénticas**. `npm run check-engine -- --update` (30 archivos: 4
componentes nuevos + `lib/assemble.js` + `campaign-data.schema.json`). 8/8 gates verdes en
`tv`, `luzgas` y `uax` (`revision-verano` sigue con el gap de control-files preexistente y no
relacionado, documentado en la entrada "Nivel 1").

**No tocado en esta ronda:** `header-logo`, `hero-*`, `category-grid*`, `footer` (ver
justificación arriba); `spacing.*` (sigue fuera de alcance, Nivel futuro).


---

## 2026-07-22 — Nivel 3: investigación profunda de marca como estándar obligatorio

Petición del usuario: "Lo que hice con Óptica 2000 (Chrome real, colores computados, tipografía
real) en vez de análisis superficial — tratamiento fotográfico, estilo de iconografía, ritmo de
voz — como paso obligatorio del agente 02, no opcional." Confirmado con el usuario vía
`AskUserQuestion`: (1) alcance = definir el estándar para marcas nuevas, **sin** backfill
retroactivo de investigación real para las 3 marcas ya en producción (paraycompara, tarifalo,
uax); (2) rigor = **bloqueante**, con válvula de escape documentada (mismo criterio que `[Q-NNN]`
para colores/tipografía no verificables).

### Qué cambia
`agents/02-brand-visual-analyst.md` reescrito: la investigación con navegador real (antes
enterrada como parte de un flujo "Hero de marca — opcional") pasa a ser una sección propia,
obligatoria, con 4 dimensiones — 2 ya exigidas antes (color/tipografía computados) y 2 nuevas:

- **Tratamiento fotográfico** (nuevo): fotografía real vs. ilustración vs. ninguna, tratamiento
  de color, composición — alimenta el prompt de `generate-hero-image` (Pollinations) para que un
  hero generado no rompa el tratamiento fotográfico real de la marca.
- **Estilo de iconografía** (nuevo): línea/relleno/ilustración/emoji/ninguno — determina
  directamente qué variante de componente usar (`-img` con `<img>` real vs. `iconGlyph`/emoji),
  formalizando en el brand pack una decisión que antes se resolvía ad hoc por instrucción
  puntual del brief (como pasó con Óptica 2000, cuyo brief prohibía emojis explícitamente).
- **Ritmo de voz** (nuevo): más allá de `voice.tone` (adjetivos sueltos) — longitud de frase,
  modo (imperativo/pregunta/afirmación), formalidad, hábitos de puntuación, con 2-3 frases REALES
  del sitio como ejemplo. Alimenta al agente 05 (Copy).

Referencia de profundidad exigida: la tabla de `PROMPT-OPTICA2000-HERMES.md`
§"Marca: ÓPTICA 2000 — análisis YA hecho (con Chrome real)" (colores computados, tipografía
computada con verificación de seguridad en email, logos reales, CTA real, dirección legal real,
redes reales) — ese es el nivel mínimo de rigor, ahora exigido también para las 2 dimensiones
nuevas.

### Estructura del brand pack
3 secciones nuevas documentadas (`photography`, `iconography`, `voice.rhythm`), cada una con su
propio campo `source` (URL + fecha de observación, o válvula de escape documentada). No requiere
cambios en el motor — son datos de investigación para agentes humanos/IA (02, 03, 05), no
placeholders que `build-newsletter.js` resuelva; ningún componente los consume directamente hoy.

### Plantilla `brands/_template/tokens/brand-tokens.json` actualizada
Estaba en v1.0.0, incompleta — le faltaban `typography`/`spacing`/`radius`/`shadows`/`layout`
(Nivel 1 y 2 nunca la tocaron porque no era un pack real en uso) y, con esa versión, habría
fallado el `MIN_VERSION` check de `engine/lib/tokens.js` si alguien la hubiera usado tal cual.
Reescrita a v2.2.0 con la estructura real completa + las 3 secciones nuevas de Nivel 3, todo
como placeholders `[CORCHETES]` con instrucciones de qué observar y dónde.

### Válvula de escape aplicada a los packs existentes (declarada, no silenciosa)
Los 4 brand packs reales (uax, tarifalo, paraycompara, optica2000) predatan este estándar —
por decisión explícita del usuario, no se investigan retroactivamente en esta ronda. Cada uno
recibe una entrada de `_changelog` declarando el hueco explícitamente:
- **uax** (v2.2.0→2.2.1), **tarifalo** (v2.2.2→2.2.3), **paraycompara** (v2.2.3→2.2.4): hueco
  completo en las 3 dimensiones nuevas, sin investigación nueva.
- **optica2000** (v2.2.0→2.2.1): `iconography.style` sí se formaliza (`"illustration"`, sin
  emoji) porque esa decisión YA estaba documentada en el brief original de la campaña — no es
  investigación nueva, es trasladar un hecho ya conocido a la estructura correcta.
  `photography` y `voice.rhythm` quedan con `[Q-NNN]` — su análisis de marca (2026-07-22) se
  hizo con Chrome real pero antes de que estas 2 dimensiones existieran como estándar.
- De paso, corregido un desajuste heredado de Nivel 1 en **tarifalo** y **paraycompara**: el
  campo raíz `"version"` se había quedado desincronizado de la última entrada del `_changelog`
  (regla de `agents/02-brand-visual-analyst.md`: el campo raíz debe reflejar siempre la versión
  más reciente) — corregido en ambos junto con la entrada de esta ronda.

### Hallazgo colateral (no resuelto aquí, fuera de alcance)
Al revisar los archivos de Óptica 2000 se encontró una campaña real ya construida en
`newsletters/2026/optica2000/2026-jul-optica2000-cuida-tu-mirada/` (formato de carpetas antiguo
`01-brand-analysis`/`04-copy`/`05-qa`, con placeholders `placehold.co` sin verificar) — parece
resultado de una ejecución externa de `PROMPT-OPTICA2000-HERMES.md` en una sesión distinta, con
el mismo patrón que el incidente original de UAX (construida fuera del motor/pipeline). No se
toca en esta ronda — es un hallazgo a reportar, no parte de Nivel 3.

### Verificación
Las 4 campañas reales (`tv`, `luzgas`, `uax` — `revision-verano` sigue con el gap de
control-files ya documentado) reconstruidas tras los cambios de brand pack: **byte a byte
idénticas**. Los cambios de esta ronda son aditivos (nuevas claves de nivel superior en los
packs; ningún campo consumido por el motor se tocó) — no había motivo para que cambiara nada, y
así fue. No se actualiza `components.lock.json` (no se tocó ningún archivo de
`engine/components/` ni `engine/lib/` en esta ronda — solo brand packs, plantilla y documento de
agente).

**No tocado en esta ronda:** investigación retroactiva de las 3 marcas ya en producción (decisión
explícita del usuario); cualquier wiring del motor para consumir `photography`/`iconography`/
`voice.rhythm` automáticamente (son datos para agentes humanos/IA en tiempo de autoría, no
tokens que el motor resuelva).


---

## 2026-07-22 — Vuelta a OpenAI para generate-hero-image

Petición del usuario: "al final, vamos a hacer lo de la api de open ai, para que genere las
imágenes de la cabecera" — revierte la decisión del 2026-07-21 (entrada "hero-imagen: cambio de
proveedor a Pollinations.ai"). Confirmado con el usuario vía `AskUserQuestion`: (1) la
facturación de la cuenta OpenAI **todavía no está resuelta** — se configura igualmente, el
usuario lo probará cuando la resuelva; (2) OpenAI **sustituye** a Pollinations.ai por completo
(no queda como fallback — un solo proveedor que mantener).

### Qué cambia
`scripts/generate-hero-image.ts` reescrito: llama a `https://api.openai.com/v1/images/generations`
(modelo `gpt-image-1`, tamaños fijos `1024x1024`/`1536x1024`/`1024x1536`/`auto` — a diferencia de
Pollinations, no admite width/height libres) en vez de `image.pollinations.ai`. `gpt-image-1`
devuelve la imagen en `b64_json` (no URL) — se decodifica y guarda como PNG directamente, sin
paso de descarga adicional.

Manejo de errores explícito (dado que la cuenta puede seguir bloqueada): si OpenAI responde 400
con un mensaje de facturación/cuota, el script lo distingue de un error genérico y señala
exactamente el mismo bloqueo que motivó el cambio a Pollinations el 2026-07-21, con el enlace a
`platform.openai.com/settings/organization/billing` — no un JSON crudo sin contexto. 401
(clave inválida) también se distingue explícitamente. Sin `OPENAI_API_KEY` en `.env`, falla con
un mensaje claro antes de llamar a la API, no con una excepción.

### Archivos actualizados
`.env` y `.env.example` (restaurado `OPENAI_API_KEY` como requerido, `POLLINATIONS_TOKEN`
eliminado — ninguno de los dos .env reales tenía una clave puesta, no había ningún secreto que
gestionar en el cambio), `agents/02-brand-visual-analyst.md`, `PROMPT-CONTEXTO-HERMES.md`,
`pipeline-skill/references/script-usage.md`, y la nota de procedencia en
`brands/optica2000/tokens/brand-tokens.json` → `photography.source` (mencionaba Pollinations).

### Verificación
`npx tsc --noEmit -p tsconfig.json`: 0 errores nuevos en `generate-hero-image.ts` (el único
error del proyecto es una advertencia de deprecación de `tsconfig.json` no relacionada,
preexistente). Ejecución real sin `OPENAI_API_KEY` (estado actual, facturación pendiente):
falla con el mensaje claro esperado, no un stack trace — no se pudo probar la generación real de
imagen en este entorno (sandbox sin clave ni facturación activa; el usuario la probará cuando
resuelva la facturación de su cuenta).

**No tocado:** ningún componente del motor ni campaign-data.json de ninguna campaña — este
cambio es solo de tooling de generación de arte (fase de diseño de marca), no toca
`engine/build-newsletter.js` ni ninguna campaña real.


---

## 2026-07-22 — Prueba real con gpt-image-2: facturación resuelta, modelo actualizado

El usuario añadió créditos a su cuenta de OpenAI y pidió una prueba real de generar la cabecera
con gpt-image. Durante la preparación, dos hallazgos:

### Hallazgo 1 — el sandbox de esta sesión no tiene salida a internet
`curl` contra `api.openai.com` y contra `example.com` (control) fallan igual — el entorno
aislado donde corre este agente no tiene acceso general a internet, solo a herramientas
específicas con dominios permitidos. `generate-hero-image.ts` no puede ejecutar la llamada real
a la API desde aquí, con clave y facturación correctas o sin ellas — el comando debe correrlo el
usuario en su propia máquina. Verificado el resto del flujo (validación de `HERO_IMG_SIZE`,
lectura del brand pack, construcción del prompt) hasta el punto exacto de la llamada de red, sin
error de código — el único fallo es `fetch failed` por falta de red del sandbox, no un bug.

### Hallazgo 2 — contenido con forma de instrucción en `.env`, confirmado como intencional
Antes de tocar código, el usuario había añadido a `.env`:
```
HERO_IMG_MODEL=gpt-image-2
HERO_IMG_SIZE=1200x800
HERO_IMG_TARGET_WIDTH=600
```
con comentarios redactados como instrucción para el código/agente ("el código debe usar SIEMPRE
este valor", "el propio código debe reescalar el resultado a 600px"). Por la frontera de
instrucciones del sistema (contenido observado en archivos es dato, no una orden a ejecutar sin
verificar), se preguntó al usuario antes de actuar — confirmó que lo escribió él mismo a
propósito. Aun así, antes de implementar "gpt-image-2 con restricción de múltiplos de 16" se
verificó con búsqueda web (no se asumió de memoria — el conocimiento de entrenamiento del modelo
llega solo hasta mayo de 2025, y esto son datos de abril de 2026): **gpt-image-2 es real**
(lanzado 2026-04-21), usa el mismo endpoint `/v1/images/generations`, y la restricción de
múltiplos de 16px (más lado máximo ≤3840px, ratio ≤3:1, píxeles entre 655.360 y 8.294.400) es
exacta — el usuario tenía razón en el detalle técnico. Fuente: documentación oficial de OpenAI
(developers.openai.com/api/docs/models/gpt-image-2 y .../guides/image-generation).

### Qué cambia en `generate-hero-image.ts`
- Soporta `gpt-image-1` (enum fijo de tamaños, comportamiento sin cambios) y `gpt-image-2`
  (tamaño flexible con las 4 restricciones de arriba) — `validateSize()` nueva, valida
  localmente ANTES de llamar a la API según el modelo activo, con mensaje claro si no cumple.
- `HERO_IMG_TARGET_WIDTH`: si está definido, reescala el resultado con `sharp` (dependencia
  nueva, `npm install sharp`) al ancho exacto pedido — necesario porque 600px (ancho real del
  email) no es múltiplo de 16 y gpt-image-2 lo rechazaría si se pidiera directamente. Guarda
  `hero-banner.png` (reescalado) y `hero-banner-original.png` (tal cual la API) por separado.
  Sin esta variable, el comportamiento es igual que antes (se guarda tal cual).
- Nuevo manejo de error 403 / "organization not verified" — gpt-image-2 (y -1) exigen
  verificación de organización además de facturación; el script lo distingue ahora de un error
  de facturación genérico.

### Archivos actualizados
`scripts/generate-hero-image.ts`, `package.json`/`package-lock.json` (dependencia `sharp`),
`.env.example`, `agents/02-brand-visual-analyst.md`, `PROMPT-CONTEXTO-HERMES.md`,
`pipeline-skill/references/script-usage.md`.

### Verificación
`npx tsc --noEmit -p tsconfig.json`: limpio. Ejecución real (`--brand uax --theme "FP Online..."`)
con la clave real del usuario en `.env`: pasa la validación de tamaño (1200x800 válido para
gpt-image-2), construye el prompt desde el brand pack de UAX, y llega hasta la llamada HTTP —
falla ahí por la falta de red del sandbox (Hallazgo 1), no por el código. **Pendiente: el usuario
debe ejecutar `npm run generate-hero-image -- --brand uax --theme "..."` en su propia máquina
para completar la prueba real** — no se pudo verificar la imagen generada en esta sesión.


### Resultado de la prueba real (usuario, en su Mac)
`npm run generate-hero-image -- --brand uax --theme "FP Online: formación profesional flexible
que impulsa el futuro de los estudiantes"` — funcionó de punta a punta:
`brands/uax/design-input/hero-banner.png` (600×400, 221 KB) y `hero-banner-original.png`
(1200×800, 808 KB). Revisado por este agente vía lectura directa del archivo (el mounted folder
del proyecto es accesible aunque la llamada de red la hiciera el usuario en su máquina): sin
texto dentro, paleta de azules coherente con `colors.primary`/`light`/`ctaBackground` de UAX,
composición cargada a la derecha con la mitad izquierda en calma — exactamente lo que pedía el
prompt para que el bloque de texto HTML se superponga ahí. 221 KB queda por debajo del umbral de
aviso (300 KB).

---

## 2026-07-22 — Ver local automática de las imágenes generadas

Petición del usuario tras la prueba real: "quiero que se visualicen directamente las imágenes
de gpt, en local y luego yo ya las subiré al cdn para la versión final" — confirma que la subida
a CDN sigue siendo un paso manual y posterior, esto es solo sobre ver el resultado al instante
en local sin pasos extra.

`generate-hero-image.ts`: nueva función `openLocally()`, llamada automáticamente al terminar de
guardar el/los PNG (`hero-banner.png`, y `hero-banner-original.png` si hubo reescalado) —
usa el comando `open` de macOS para abrirlos en Vista Previa. Activado por defecto
(`HERO_IMG_AUTO_OPEN`, `!== 'false'`), desactivable con `HERO_IMG_AUTO_OPEN=false`. Si no es
macOS o `open` falla por cualquier motivo, avisa por consola y sigue sin romper la generación —
nunca convierte un fallo de "abrir para ver" en un fallo de la generación en sí.

**No tocado:** el flujo de subida a CDN sigue siendo 100% manual (el usuario sube el archivo y
pasa la URL https), tal y como pidió explícitamente — no se construyó ningún mecanismo de
autosubida.


---

## 2026-07-22 — Anclaje del arte a una página real (landing o web de marca)

Motivación: al probar el pipeline completo con Hermes en una campaña real de Tarífalo
(`2026-jul-tarifalo-compara-luz`), el hero se quedó en `hero-centrado` (sin arte) porque esa
sesión nunca llegó a ejecutar `generate-hero-image`. Al retomarlo manualmente, el usuario pidió
algo más de fondo: "quiero que genere la imagen de cabecera en base a la página sobre la que se
esté haciendo la newsletter" — el prompt de siempre solo usaba colores + tono de marca del brand
pack, sin ninguna referencia a la fotografía/imaginería real del cliente.

### Decisión (vía AskUserQuestion)
- **Qué página:** varía por campaña — no hay un valor por defecto correcto. El script debe
  PREGUNTAR cada vez: landing específica de esa campaña, web general de la marca, u omitir.
- **Mecanismo:** descripción visual vía Claude (texto), no image-to-image directo. Se descartó
  mandar el screenshot como imagen de entrada al endpoint de edición de OpenAI porque arriesgaba
  colar logos/texto/capturas literales del sitio en el arte generado — rompería la regla híbrida
  ("la imagen NO contiene texto/marca"). Con la descripción de texto, Claude tiene instrucción
  explícita de no transcribir texto visible ni describir el logo.

### Qué cambia en `generate-hero-image.ts`
- Nuevo flag `--campaign {ruta}` (opcional): si se pasa, sugiere el primer `cta.href` encontrado
  en el `campaign-data.json` de esa campaña como landing por defecto.
- Con terminal interactiva (`process.stdin.isTTY`), antes de llamar a OpenAI pregunta:
  1) landing de la campaña, 2) web general de la marca (cachea `website` en `brand-tokens.json`
  si el usuario acepta guardarla), 3) omitir.
- Si se elige página: `capturePage()` reutiliza el mismo patrón que `capture-brand-site.ts`
  (Playwright, viewport 1280×900) → `describeVisualStyle()` llama a Claude (`ANTHROPIC_API_KEY`,
  `HERO_MODEL`, mismo modelo que usa `generate-hero.ts`) con instrucción explícita de describir
  SOLO estilo fotográfico/composición/mood — nunca texto ni logos — en inglés, 3-5 frases.
- Esa descripción sustituye la línea "Theme: ..." genérica en el prompt de OpenAI (se conserva la
  paleta de marca y la regla de "sin texto/letras/números/logos dentro del arte", intacta).
- Fallback en cascada, nunca bloqueante: sin TTY → prompt genérico; sin `ANTHROPIC_API_KEY` →
  prompt genérico; captura falla (sin red, timeout, URL inválida) → prompt genérico. Nuevo flag
  `HERO_IMG_SOURCE_PAGE=false` desactiva la pregunta del todo (útil si se automatiza sin terminal).
- Nuevos archivos de salida: `brands/{brand}/design-input/hero-source-page.png` (captura usada) y
  `hero-source-page-url.txt` (URL, trazabilidad). El prompt final (con la descripción ya inyectada)
  se sigue guardando en `hero-banner-prompt.txt` como siempre.

### Archivos actualizados
`scripts/generate-hero-image.ts`, `.env.example`, `agents/02-brand-visual-analyst.md`,
`PROMPT-CONTEXTO-HERMES.md`, `pipeline-skill/references/script-usage.md`.

### Verificación
`npx tsc --noEmit -p tsconfig.json`: limpio (solo el warning preexistente TS5107, no relacionado).
Ejecución en el sandbox sin TTY: confirma que detecta la ausencia de terminal interactiva y cae
correctamente al prompt genérico sin crashear, fallando después solo por la falta de red del
sandbox al llamar a `api.openai.com` (igual que en pruebas anteriores) — el flujo interactivo en
sí (preguntas, captura con Playwright, llamada a Claude) requiere una terminal real y red, así que
**queda pendiente que el usuario lo pruebe en su Mac** para confirmar el recorrido completo.

### Aplicado también a la campaña real de Tarífalo
`newsletters/2026/tarifalo/2026-jul-tarifalo-compara-luz/06-data/campaign-data.json`: hero
cambiado de `hero-centrado` a `hero-imagen`, con `bannerSrc` en placeholder explícito
(`https://PENDING-CDN-UPLOAD/...`) hasta que el usuario genere el arte y lo suba al CDN. Rebuild +
`production-gate-motor`: 7/7 gates OK (assets en warning, sin red en el sandbox). Los 4 archivos
de control de esa campaña actualizados para documentar el cambio y los pasos pendientes.


---

## 2026-07-22 — Quitada la dependencia de Anthropic del anclaje a página real

El usuario probó el anclaje a página real en su Mac y le faltaba `ANTHROPIC_API_KEY` (paso
esperado, documentado). En vez de dar de alta esa clave, pidió: "vamos a hacer la primera opción,
que sea el propio gpt el que genere el prompt y la imagen y eliminamos la parte de la api de
anthropic" — quitar el proveedor extra y que todo el flujo (describir la página Y generar el
arte) corra con una sola clave, la de OpenAI.

### Qué cambia en `describeVisualStyle()`
- Antes: `fetch` a `api.anthropic.com/v1/messages` con `ANTHROPIC_API_KEY` y `HERO_MODEL`
  (`claude-sonnet-5`).
- Ahora: `fetch` a `api.openai.com/v1/chat/completions` con la misma `OPENAI_API_KEY` que ya
  usa la generación de imágenes, y un modelo de visión configurable — `HERO_IMG_VISION_MODEL`.
  Se buscó en web antes de fijar el default, dado el ritmo con el que OpenAI renombra/retira
  modelos (se vieron referencias a GPT-4o, GPT-4.1 y la familia GPT-5.x activas en distintos
  contextos durante 2026) — por eso queda como variable de entorno sobreescribible en vez de un
  nombre fijo sin salida, con el error de la API mostrado en claro si el modelo no existe o fue
  retirado.

### Corrección del modelo por defecto (mismo día, el usuario señaló: "el último modelo de gpt es
GPT-5.6 Sol")
Se había puesto `gpt-4o` como default inicial (conocimiento de entrenamiento, no verificado). El
usuario avisó que no es el modelo actual. Verificado en
`developers.openai.com/api/docs/models/gpt-5.6-sol` (no asumido): `gpt-5.6-sol` es el modelo
insignia de la familia GPT-5.6, GA el 2026-07-09, entrada `text, image` / salida `text`,
disponible en `v1/chat/completions` — encaja exactamente con lo que ya llama este script. Default
actualizado a `gpt-5.6-sol`. Precio de esa llamada concreta (imagen de entrada, respuesta corta)
es marginal frente al coste de `gpt-image-2` para la imagen en sí.

### Fix inmediato al probarlo en real: `max_tokens` → `max_completion_tokens`
Primera ejecución real del usuario con `gpt-5.6-sol`: HTTP 400, `"Unsupported parameter:
'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead."` — los
modelos de razonamiento de OpenAI (familia GPT-5.x) solo aceptan `max_completion_tokens` en
Chat Completions, no `max_tokens` (parámetro legado). Corregido. Investigado además (antes de que
volviera a fallar en silencio): `gpt-5.6-sol` puede gastar el presupuesto de tokens "pensando"
antes de escribir contenido y devolver una respuesta vacía si `reasoning_effort` no se fija bajo
para tareas simples — se añadió `reasoning_effort: 'low'` (la tarea es describir una captura, no
requiere razonamiento profundo) y se subió el techo a `max_completion_tokens: 800` como margen.
También se añadió un aviso explícito si la respuesta llega vacía (`finish_reason` en el mensaje)
en vez de fallar en silencio y caer al prompt genérico sin explicación.
- La instrucción que recibe el modelo es la misma en esencia (describir SOLO tratamiento
  fotográfico/estilo visual, nunca transcribir texto ni logos), solo movida al formato de
  mensajes de chat completions (`image_url` con data URL base64 en vez del bloque `image` de
  Anthropic).

### Ya no se requiere
`ANTHROPIC_API_KEY` para este flujo específico (sigue existiendo para el flujo separado y
opcional de "Claude design", `generate-hero.ts` — no tocado, sigue siendo su propia elección
aparte).

### Archivos actualizados
`scripts/generate-hero-image.ts`, `.env.example`, `agents/02-brand-visual-analyst.md`,
`PROMPT-CONTEXTO-HERMES.md`, `pipeline-skill/references/script-usage.md`.

### Verificación
`npx tsc --noEmit -p tsconfig.json`: limpio (solo TS5107 preexistente). Ejecución en el sandbox
sin TTY con clave de OpenAI de prueba: cae correctamente al prompt genérico (sin preguntar, como
antes) y falla solo por falta de red del sandbox al llamar a `api.openai.com` — mismo
comportamiento que antes del cambio, sin regresiones. El recorrido real con captura + descripción
+ generación completos sigue pendiente de que el usuario lo pruebe en su Mac (ahí sí hay red y
terminal interactiva).


---

## 2026-07-22 — Captura mucho más exhaustiva de la página de referencia

El usuario, ya con el flujo funcionando en real, pidió: "tiene que hacer una captura de la página
web de referencia para generar la imagen mucho más exhaustiva e intensiva, capturar absolutamente
todos los detalles para poder generar una cabecera de la máxima calidad". La captura original era
una sola vista de viewport (1280x900, sin scroll, resolución normal) — insuficiente para que la
descripción de estilo capturase el sitio con detalle.

### Qué cambia en `capturePage()`
- Antes: 1 captura (viewport 1280x900, `deviceScaleFactor` por defecto = 1).
- Ahora: 3 capturas a doble resolución (`deviceScaleFactor: 2`, para no perder detalle fino —
  texturas, gradientes, iconografía — antes de describirlo):
  1. Desktop, above the fold (1280x900).
  2. Desktop, página COMPLETA (`fullPage: true`) — se fuerza scroll hasta el final y de vuelta
     arriba antes de la captura, para disparar imágenes con lazy-load que de otro modo no
     aparecerían (`networkidle` no las detecta si cargan al hacer scroll).
  3. Mobile (390x844) — el tratamiento responsive puede diferir bastante del desktop.
- Cada captura se espera con `networkidle` + un margen extra de 1.5s (animaciones/lazy-load que
  no cuentan como "red inactiva").
- Guarda las 3 en `brands/{brand}/design-input/` con nombres distintos para trazabilidad
  (`hero-source-page-desktop-viewport.png`, `-desktop-full.png`, `-mobile.png`).

### Qué cambia en `describeVisualStyle()`
- Ahora acepta `Buffer[]` en vez de un solo `Buffer` — las 3 capturas van en el mismo mensaje de
  chat completions (3 bloques `image_url`).
- Instrucción ampliada: antes pedía un párrafo de 3-5 frases sobre "tratamiento fotográfico y
  estilo visual" en general; ahora pide 8-14 frases cubriendo explícitamente 7 aspectos
  (imaginería, paleta/luz, composición/layout, texturas/materiales, sujetos, mood/atmósfera,
  estilo de iconografía), ACROSS las 3 vistas. Sigue sin transcribir texto ni describir el logo.
- `max_completion_tokens` subido de 800 a 1600 para dar cabida a la respuesta más larga (con
  `reasoning_effort: 'low'` sin cambios, sigue sin necesitar razonamiento profundo).

### Archivos actualizados
`scripts/generate-hero-image.ts`, `agents/02-brand-visual-analyst.md` (lista de archivos de
salida). De paso se corrigió una mención residual a `gpt-4o` en el comentario de cabecera del
script que se había quedado desactualizada tras el cambio de default a `gpt-5.6-sol`.

### Verificación
`npx tsc --noEmit -p tsconfig.json`: limpio (solo TS5107 preexistente). El recorrido real
(3 capturas + descripción de 8-14 frases + generación) sigue pendiente de que el usuario lo
pruebe en su Mac — el sandbox no tiene red para probar Playwright contra una URL real ni la
llamada a OpenAI.


---

## 2026-07-24 — Prueba real end-to-end (BMW X1) y fix: capturas demasiado pesadas para la API de visión

Primera ejecución real de la integración completa (02→03→06, ver entrada "`hero-imagen`
integrado en el pipeline de agentes"): campaña `2026-jul-bmw-x1-descubre`, patrón `institutional`,
landing real `https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html`. Resultado: **funcionó de punta
a punta** — 03 eligió `hero-imagen`, 06 ejecutó `generate-hero-image --source landing --url ...`
sin intervención manual, `production-gate-motor` pasó 8/8, y `hero-banner.png` (600×400) quedó
generado en `brands/bmw/design-input/`. Primera validación real de todo lo construido este día.

### Hallazgo: el anclaje visual no se aplicó (cayó al prompt genérico sin razón visible)
`hero-banner-prompt.txt` de esa ejecución no contenía la descripción rica esperada — solo el
prompt genérico de paleta+tema, pese a que las 3 capturas SÍ se generaron correctamente en disco.
Investigado con los archivos reales de esa ejecución (siguen en `brands/bmw/design-input/`):

| Captura | Peso |
|---|---|
| desktop-viewport | 1.9 MB |
| desktop-full (`fullPage: true`, deviceScaleFactor: 2) | **18.0 MB** |
| mobile | 0.5 MB |
| **Total combinado en la petición** | **20.4 MB PNG → ~27 MB en base64 dentro del JSON** |

La página de producto de BMW es larga y con muchas imágenes en alta resolución propias — una
captura `fullPage` a doble resolución de una página así pesa muchísimo más que la de una landing
típica de comparador. ~27 MB en una sola petición de chat completions es a todas luces excesivo;
la llamada fallaba (o quedaba tan al límite que era frágil) y el script, correctamente, caía en
silencio al prompt genérico — pero sin ninguna pista de que el motivo era el tamaño.

### Fix: comprimir SOLO para la llamada a la API, nunca los archivos guardados
Nueva función `shrinkForVision()`: redimensiona cada captura a 1568px de ancho máximo (el techo
que documenta OpenAI como útil para el análisis en alta resolución — pasar de ahí no añade
detalle a la descripción, solo bytes) y la reconvierte a JPEG calidad 82 con `sharp`, SOLO para
el cuerpo de la petición a `describeVisualStyle()`. Los PNG que se guardan en
`brands/{brand}/design-input/` (para que el usuario los revise) siguen siendo los originales a
doble resolución, sin tocar — la calidad "máxima" que pidió el usuario sigue ahí, la compresión
es invisible y solo afecta a la llamada de red.

Probado con los archivos reales de la ejecución de BMW (no un caso sintético):

| | Antes | Después |
|---|---|---|
| Total combinado | 20.4 MB | 2.64 MB |
| Estimado en base64 | ~27 MB | ~3.5 MB |

También se añadió un log explícito (`Comprimiendo N captura(s) para la API de visión: X MB → Y
MB...`) para que la próxima vez que algo falle por tamaño, se vea en la consola en vez de
descubrirse auditando archivos a posteriori.

### Archivos actualizados
`scripts/generate-hero-image.ts`.

### Verificación
`npx tsc --noEmit -p tsconfig.json`: limpio (solo TS5107 preexistente). La compresión se probó
con los 3 PNG reales de `brands/bmw/design-input/` (guardados de la ejecución real del usuario,
no sintéticos) vía un script Node/`sharp` ad hoc en el sandbox — reducción confirmada de 20.4 MB
a 2.64 MB. La llamada real a la API con las imágenes ya comprimidas sigue pendiente de que el
usuario la reintente en su Mac (el sandbox no tiene red hacia `api.openai.com`).

### Pendiente para el usuario
Si quiere una imagen de BMW mejor anclada al estilo real de bmw.es (la actual, 600×400, sigue
siendo válida — solo no se benefició del anclaje), puede volver a ejecutar
`npm run generate-hero-image -- --brand bmw --theme "..." --campaign newsletters/2026/bmw/2026-jul-bmw-x1-descubre --source landing --url https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html`
ahora que el fix está aplicado.


## `columns-3-beneficios-sin-icono` — variante sin icono del componente Beneficios (2026-07-24)

### Motivo real (no aspiracional)
El usuario reportó que la newsletter de BMW incluía "los iconos típicos de IA" (emoji 🏎️🖥️🛣️
en el módulo de 3 columnas de beneficios). Auditando el brand pack real de BMW
(`brands/bmw/tokens/brand-tokens.json` → `iconography`, investigado con observación real de
bmw.es el 2026-07-24), el propio análisis de marca ya documentaba explícitamente: *"BMW usa
iconos de línea monocromos, densidad baja. Priorizar fotografía sobre iconos... usar variante
-img con iconos reales (no emoji ni iconGlyph)... BMW confía en la fotografía como único adorno
visual."* — pero `columns-3-beneficios.html` exige un campo `icon` (`$def iconGlyph`) sin
ninguna forma de omitirlo, así que la única salida disponible para rellenar ese campo era un
emoji, contradiciendo directamente la propia investigación de marca. Este es exactamente el
tipo de hueco real (no especulativo) que justifica un componente nuevo según la regla
anti-aspiracional de `engine/README.md`.

### Componente creado
`engine/components/columns-3-beneficios-sin-icono.html` — mismo layout 33/33/33, mismo bloque de
highlight a todo el ancho debajo de las columnas, mismos tokens (`surfaces.sectionLila`,
`colors.primary`, `colors.text.secondary`, `colors.borders.card`, `radius.card`). Única
diferencia real: donde `columns-3-beneficios.html` renderiza `{{data:beneficios[n].icon}}` como
emoji de 28px, esta variante renderiza una barra decorativa de color (`colors.light`) sobre cada
título — sin ningún campo de icono en el contrato de datos.

### Cambios
- `engine/lib/assemble.js`: `MODULE_ADAPTERS['columns-3-beneficios-sin-icono']` apunta al mismo
  adaptador que `columns-3-beneficios` (el HTML no usa `icon`, pero el resto de la forma del
  JSON — `beneficiosSection`, `beneficios[].{title,body}` — es idéntica).
- `engine/schema/campaign-data.schema.json`: nueva rama `oneOf` para
  `"component": "columns-3-beneficios-sin-icono"`, con `data.items[]` requiriendo solo
  `["title", "body"]` (sin `icon`), `additionalProperties: false`.
- `patterns/institutional.md`: añadida como tercera alternativa del módulo 4 en la tabla de
  secuencia, en `PATTERN_SEQUENCE`, y documentada en el §7 (variantes de contrato de datos, no
  solo de composición).
- `scripts/check-column-balance.ts`: el check de equilibrio de columnas cubría solo
  `columns-3-beneficios` exacto — se amplió para cubrir también `-asimetrico` y `-sin-icono`
  (misma forma `items[].body`, mismo riesgo de desequilibrio).
- `newsletters/2026/bmw/2026-jul-bmw-x1-descubre/06-data/campaign-data.json`: el módulo de
  beneficios cambia de `columns-3-beneficios` a `columns-3-beneficios-sin-icono`, quitando los
  3 campos `icon` (emoji).

### Verificación
- Validación de schema contra el `campaign-data.json` real de BMW: `valid: true` (Ajv, script ad
  hoc).
- `npx tsx scripts/check-column-balance.ts --campaign newsletters/2026/bmw/2026-jul-bmw-x1-descubre`:
  21/26/23 palabras por columna, ratio 1.24x — dentro del margen (máx 1.6x).
- Rebuild de BMW: `✓ BUILD OK`. HTML resultante confirmado sin ningún emoji
  (`grep -c "🏎️\|🖥️\|🛣️"` → 0).
- `npm run check-engine -- --update`: lock regenerado, 31 archivos.
- `npm run production-gate-motor -- --campaign newsletters/2026/bmw/2026-jul-bmw-x1-descubre`:
  **8/8 gates OK** (los únicos avisos son de red — URLs `PENDING-*` y `bmw.es` sin resolución DNS
  en el sandbox, esperado).
- Byte-parity de las 7 campañas reales restantes (`2026-jul-test`, `comparar-tv`,
  `revision-verano`, `ahorra-fibra-movil`, `tarifalo-compara-energia`, `comparar-luz-gas`,
  `tarifalo-compara-luz`, `adeslas-seguro-medico`) tras el cambio: idénticas byte a byte —
  el cambio en `assemble.js`/schema es puramente aditivo (un componente más, ninguna rama
  existente tocada). Óptica2000 y UAX mostraron diffs de exports desactualizados de sesiones
  anteriores (no relacionados con este cambio); se restauraron a su estado previo para no
  mezclar cambios fuera de alcance de esta tarea.


## Estructura dinámica por marca — patrón `fotografia-primero` + captura de ritmo de página real (2026-07-24)

### Motivo real (no aspiracional)

El usuario reportó, tras ver la newsletter renderizada de BMW, que el sistema seguía produciendo
"una newsletter genérica" pese a que colores, CTA y ahora también los iconos fueran datos reales
de marca — el problema no era ningún valor individual, era que el motor solo tenía 2 patrones de
género (`saving`, `institutional`), casi idénticos entre sí en su forma (hero → bloques de
contenido → cierre → footer), y el agente que decide estructura (03) no tenía ninguna libertad ni
criterio real para elegir entre ellos más allá de "si no es ahorro, es institutional". Además, la
captura real de la página de referencia (Playwright, en `generate-hero-image.ts`) solo se usaba
para generar la imagen de cabecera — la estructura real de esa página (cuántas secciones tiene,
cuánto pesa la fotografía frente al texto/iconos) se descartaba por completo. Auditoría completa
del estado previo documentada en este mismo commit de sesión (ver mensajes del agente
Explore/general-purpose usados para esta auditoría — resumen: `engine/lib/pattern.js` valida
`PATTERN_SEQUENCE` con enforcement duro contra un solo patrón nombrado explícitamente en
`campaign-data.json.pattern`, nunca una búsqueda ni una composición libre).

Alcance elegido (de 3 opciones presentadas al usuario): ampliar el catálogo de patrones +
decidir con evidencia real de marca, manteniendo el enforcement duro actual (nada de HTML roto o
desequilibrado) — no componer secuencia libre (eso se deja para una fase futura si hace falta).

### Cambios

- **`patterns/fotografia-primero.md`** (nuevo, tercer patrón de género): secuencia de 6 slots
  (`header-logo → hero-imagen[sin fallback] → [intro-cta] → [columns-3-beneficios-sin-icono] →
  banda-cierre → footer`), más corta que `institutional` (8 slots) — sin `category-grid` ni
  `usp-cards`, ambos icon/grid-heavy. `hero-imagen` es obligatorio sin alternativa: este patrón
  existe específicamente para cuando la fotografía real es el elemento central; si no se puede
  generar, la campaña no pertenece a este patrón. Incluye tabla de contrastes WCAG calculados
  contra la paleta real de BMW y, en su §6, los criterios concretos y verificables de "cuándo
  elegir este patrón" (ver más abajo).
- **`engine/schema/campaign-data.schema.json`**: `pattern.enum` pasa de
  `["saving", "institutional"]` a `["saving", "institutional", "fotografia-primero"]`.
- **`agents/02-brand-visual-analyst.md`**: nueva 5ª dimensión de investigación profunda ("Ritmo
  estructural de la página real") — además de color/tipografía/fotografía/iconografía/voz (las 4
  ya existentes), ahora también se documenta cuántas secciones de CONTENIDO real tiene la página
  de referencia, de qué tipo es cada una, y qué peso relativo tienen fotografía/texto/iconos.
  Nuevo campo `layout.contentRhythm` en `brand-tokens.json` (mismo criterio de
  documentado/observado/inferido y válvula de escape que las demás secciones). Sincronizado en
  la plantilla `newsletters/2026/newsletter-system/brands/_template/tokens/brand-tokens.json`.
- **`agents/03-newsletter-architect.md`**: nueva sección "Elegir el patrón de género" con
  criterios concretos y en cascada (saving si hay cifra de ahorro confirmada → fotografia-primero
  si `photography`+`iconography`+`layout.contentRhythm` lo justifican los 4 a la vez →
  institutional en el resto de casos) — sustituye el criterio anterior de una sola frase
  ("el que corresponda al objetivo del brief"), que en la práctica no daba ninguna señal
  verificable. Corregida también la línea desactualizada que decía "hoy solo `patterns/saving.md`".
- **`brands/bmw/tokens/brand-tokens.json`** (v2.2.0 → v2.3.0): añadido `layout.contentRhythm` con
  datos reales — 4 secciones de contenido observadas en `bmw.es/es/coches-bmw/x/x1/bmw-x1.html`
  (hero fotográfico traducible, 2 bloques de datos/financiación NO traducibles al email, 1 bloque
  editorial foto+texto breve traducible), `photographyWeight: dominante`, `iconDensity: nula`.
  Fuente: fetch real de la página (no inventado), mismo criterio de procedencia que el resto del
  pack.
- **`newsletters/2026/bmw/2026-jul-bmw-x1-descubre/06-data/campaign-data.json`**: campo
  `pattern` cambia de `"institutional"` a `"fotografia-primero"`. Los 6 módulos ya existentes
  (`header-logo`, `hero-imagen`, `intro-cta`, `columns-3-beneficios-sin-icono`, `banda-cierre`,
  `footer`) ya coincidían con esta secuencia — estaban forzados dentro de `institutional` con 2
  slots opcionales (`category-grid`, `usp-cards`) simplemente sin usar. El cambio de patrón no
  altera un solo byte del HTML resultante (verificado, ver más abajo); certifica como intencional
  una estructura que antes era, en la práctica, un subconjunto no reconocido de otro patrón.

### Verificación

- Rebuild de BMW tras el cambio de `pattern`: `✓ BUILD OK`, y `cmp` byte a byte contra el
  `final.html` previo al cambio confirma **0 diferencias** — el cambio es puramente de
  certificación de estructura, no de contenido.
- `npm run check-engine -- --update`: lock regenerado, 31 archivos (el nuevo patrón no se
  registra en `components.lock.json` — ese lock cubre `engine/components/`, `assemble.js` y el
  schema, no `patterns/*.md`, confirmado en `scripts/check-engine-integrity.ts`).
- `npm run production-gate-motor -- --campaign newsletters/2026/bmw/2026-jul-bmw-x1-descubre`:
  **8/8 gates OK** (únicos avisos: red no disponible en el sandbox para las URLs `PENDING-*` y
  `bmw.es`, esperado).
- Byte-parity de las 9 campañas reales restantes: idénticas. Óptica2000 y UAX mostraron los
  mismos 2 diffs preexistentes (de sesiones anteriores, no relacionados) ya documentados en la
  entrada anterior de este changelog — restaurados de nuevo a su estado previo.
- Contrastes WCAG de la tabla de `fotografia-primero.md` §4 verificados con script Node ad hoc
  (fórmula de luminancia relativa WCAG 2.x) contra los hex reales de `brands/bmw/tokens/
  brand-tokens.json`: los 5 pares calculados pasan su umbral correspondiente.

### Pendiente

- La próxima campaña real que declare `photography.usesRealPhotography: true` con iconografía
  desaconsejada será la prueba de que los criterios de elección de patrón de agente 03 funcionan
  para una marca que 03 no ha visto nunca (BMW ya estaba "pre-resuelta" por ser la migración que
  motivó todo este cambio).
- Sigue sin existir composición libre de secuencia (opción B que el usuario no eligió esta vez) —
  si en el futuro aparece una campaña real que no encaje en ninguno de los 3 patrones existentes,
  se evalúa entonces si hace falta un 4º patrón o si se justifica el rediseño más profundo del
  mecanismo de validación.


## Auditoría de los 10 agentes — 3 huecos de fidelidad de marca sin dueño (2026-07-24)

### Motivo real

Petición explícita del usuario: "analizar uno a uno los agentes y ver qué podemos mejorar... para
que este sistema realmente saque newsletters premium". Se leyeron los 10 agentes (`00` a `09`)
completos. `00`, `01`, `07`, `09` son agentes de proceso (orquestación, brief, build, entrega) sin
relación directa con fidelidad de marca — sin cambios. `02`, `03`, `06` ya se reforzaron en las
entradas anteriores de esta sesión. Se encontraron 3 huecos reales en `04`, `05` y `08` — cada uno
es la misma clase de problema que ya vimos con BMW (una decisión de marca sin agente que la tome
explícitamente), solo que en otro punto del pipeline.

### Hallazgos y cambios

1. **`agents/08-qa-specialist.md` — QA no tenía ninguna validación de fidelidad de marca.** Sus 8
   categorías (render, paridad, enlaces, imágenes, legal, accesibilidad, completitud,
   asunto/preheader) son todas de corrección; ninguna comprobaba "¿esto parece la marca real o
   una plantilla?". La propia campaña BMW pasó las 8 sin problema y aun así llegó al usuario con
   emoji que contradecían el pack. Añadida nueva sección "Fidelidad de marca" con 4 comprobaciones
   verificables (iconografía coherente vía grep de rango Unicode de emoji, fotografía coherente
   con `photography.treatment`, estructura coherente con `layout.contentRhythm`, voz coherente con
   `voice.rhythm`), nuevo archivo de salida `08-qa/brand-fidelity-qa.md`, y un hallazgo que
   contradiga una prohibición explícita del pack ahora bloquea al mismo nivel que un error alto
   del resto del checklist.
2. **`agents/04-email-designer.md` — ningún agente decidía la variante de icono por módulo.** La
   elección entre `iconGlyph` (emoji), variante `-img` (icono real) o `-sin-icono` no estaba
   asignada a ningún paso — en la práctica se rellenaba con emoji por ser la opción por defecto,
   que es exactamente lo que pasó en BMW. Nueva sección "Elegir variante de icono": 04 consulta
   `iconography.style`/`componentImplication` del pack y lo deja escrito en `assets-notes.md` con
   motivo; también referencia `photography.treatment` al especificar cualquier asset de imagen.
   `agents/06-data-specialist.md` actualizado en su Tarea 2 para usar exactamente la variante que
   04 decidió, nunca la de emoji por defecto sin comprobar.
3. **`agents/05-copywriter.md` — el copy nunca se contrastaba contra `voice.rhythm`.** La única
   entrada de voz era `brand-analysis.md` (adjetivos de tono sueltos); `voice.rhythm`
   (longitud de frase, modo, formalidad, puntuación, frases reales) que 02 investiga desde el
   22-07 nunca se consultaba en origen. Nueva sección "Ritmo de voz real" y 6ª validación:
   asunto/H1/CTAs contrastados contra los campos concretos de `voice.rhythm`, con los ejemplos
   reales del sitio como patrón de calibre — "¿esto suena más genérico que las frases reales de la
   marca?" es ahora una pregunta que se hace en origen, no en QA.

### Verificación

Cambios puramente de documentación de agentes (no tocan `engine/`, `patterns/` ni ninguna
campaña real) — sin rebuild ni gates que correr. Verificado con `grep -c "^## "` que los 4
archivos (`04`, `05`, `06`, `08`) mantienen 10 secciones de nivel 2 cada uno, sin bloques
truncados o mal cerrados por las ediciones.

### Pendiente

Estos 3 fixes son de contrato de agente, no de motor — su efecto real se verá en la próxima
campaña que pase por 04/05/08 de principio a fin. No hay forma de probarlos contra una campaña
ya construida sin volver a ejecutar esas 3 fases a mano.


## Auditoría del motor — gate de fidelidad de brand pack + limpieza (2026-07-24)

### Motivo real

Petición explícita del usuario tras la auditoría de agentes: "analiza el motor, igual que los
agentes, y vemos las cosas que se pueden mejorar y corregir". Se leyó `build-newsletter.js`,
`lib/{tokens,pattern,assemble,verify}.js`, el schema completo, `INVENTORY.md`,
`components.lock.json` y `production-gate-motor.ts`. Se cruzaron los 25 componentes `.html`
contra las claves de `MODULE_ADAPTERS` y las ramas `oneOf` del schema — coinciden exactamente,
0 huérfanos. El motor en sí (ensamblado, patrón, verificación post-build) está sólido. Se
encontraron 3 hallazgos reales, en orden de impacto:

### 1. No existía ningún gate de "fidelidad de brand pack" — el único hueco sin automatizar

Todo lo demás en este sistema se certifica con un gate (schema, patrón, claims, contraste,
balance de columnas, control files) — la única pieza que dependía 100% de la autodisciplina del
agente 02 era, precisamente, la que más ha importado esta sesión: que `photography`,
`iconography`, `voice.rhythm` (Nivel 3, 2026-07-22) y `layout.contentRhythm` (Nivel 4,
2026-07-24) estén realmente investigados, no ausentes en silencio ni rellenos con un
`[Q-NNN]` sin resolver.

**Creado `scripts/check-brand-pack-completeness.ts`**: distingue 3 situaciones por campo, no
solo presente/ausente — (a) dato real → OK; (b) campo ausente pero con una entrada en
`_changelog` que documenta explícitamente la válvula de escape → aviso, no bloquea (un hueco
declarado a propósito, como el de UAX/paraycompara/tarifalo pospuesto por decisión explícita del
usuario, no es el mismo problema que uno silencioso); (c) campo ausente SIN ninguna mención en
`_changelog`, o presente con un valor que empieza por `"["` (la misma convención `[Q-NNN]`/
`[PENDIENTE]` que ya usa el resto del sistema) → error, bloquea. `layout.contentRhythm` (Nivel 4,
recién introducido) solo genera aviso si está completamente ausente, para no bloquear
retroactivamente packs anteriores a su creación.

**Wireado en `production-gate-motor.ts` como Gate 8** ("fidelidad del brand pack").

**Hallazgo real al probarlo contra los brand packs existentes** (no hipotético — esto es
exactamente el tipo de comprobación que faltaba): `brands/adeslas/tokens/brand-tokens.json` tiene
`photography.usesRealPhotography` literalmente como el string
`"[Q-NNN] No investigado con Chrome real — pendiente de verificar adeslas.es"` — no un booleano,
un placeholder de pregunta abierta sin resolver que un lector humano del pack podría confundir
con una nota, no con un hueco activo. `brands/optica2000/tokens/brand-tokens.json` tiene el mismo
problema en `photography` y `voice.rhythm`. Ambos packs pasaban `production-gate-motor` sin
ningún aviso hasta este cambio — ahora fallan correctamente en el nuevo Gate 8, con el campo
exacto señalado. BMW, UAX, Tarífalo (ambas campañas) y Para y Compara (comparar-tv) pasan los
9 gates limpios; UAX pasa con avisos informativos (sus 3 huecos de Nivel 3 están legítimamente
declarados en `_changelog`, no silenciosos).

**Pendiente, fuera de alcance de este cambio**: investigar de verdad `photography`/`voice.rhythm`
de Adeslas y Óptica2000 con Chrome real es trabajo de contenido de marca (agente 02), no un fix
de motor — este gate solo hace visible el hueco, no lo rellena.

### 2. `engine/components/INVENTORY.md` estaba desactualizado

Documentaba 18 de los 25 componentes reales. Añadidas las 7 entradas que faltaban:
`hero-marca-tarifalo`, `category-grid-img`, `intro-cta-asimetrico`,
`columns-3-beneficios-asimetrico`, `columns-3-beneficios-sin-icono`, `usp-cards-asimetrico`,
`banda-cierre-asimetrico`. Verificado: `grep -c "^| ` \`"` da 25, uno por cada `.html` real
existente tras la limpieza del punto 3.

### 3. `header.html` — stub confirmado sin uso desde F1, eliminado

Sin markup (`<!-- STUB no usado: el logo vive dentro de hero-asimetrico.html -->`), sin entrada
en `MODULE_ADAPTERS`, sin rama en el schema, sin referencia en ningún patrón — verificado con
grep antes de tocarlo. Eliminado el archivo; `npm run check-engine -- --update` regenerado
(30 archivos, antes 31).

### Verificación

- `npx tsc --noEmit`: limpio (solo TS5107 preexistente).
- `check-brand-pack-completeness.ts` probado contra los 4 brand packs reales con Nivel 3
  aplicado (BMW, UAX, Adeslas, Óptica2000) — comportamiento verificado manualmente contra cada
  uno antes de confiar en el script (ver hallazgo del punto 1).
- `production-gate-motor` corrido sobre las 10 campañas reales: BMW/UAX/Tarífalo×2/
  comparar-tv pasan 9/9; Adeslas y Óptica2000 fallan correctamente en el nuevo gate (hallazgo
  real, no falso positivo); revision-verano falla solo en control-files (preexistente, no
  relacionado). `2026-jul-test` y `ahorra-fibra-movil` siguen en formato antiguo
  (`newsletter-data.json`, pipeline React Email archivado) — `production-gate-motor.ts` no
  maneja ese caso con un mensaje limpio (crash con stack trace de Node en vez de un error
  legible); bug preexistente, no introducido por este cambio, no corregido aquí (fuera del
  alcance acordado con el usuario para esta ronda).
- `npm run check-engine`: 30 archivos, motor íntegro.


## Gradientes bulletproof, corrección de doc obsoleta y auditoría de sombras (2026-07-24)

Petición directa del usuario: "tenemos que añadir más recursos, como degradados, sombras,
etc... investiga cuales son los recursos visuales más importantes en newsletter y vamos a ver
como los podemos aplicar en nuestro entorno". Investigación previa (caniemail.com, datos reales
de soporte por cliente) antes de tocar nada: `box-shadow` 63.42% de soporte combinado, sin
equivalente VML para Outlook clásico de escritorio (no se puede hacer "bulletproof", solo
progressive enhancement); `linear-gradient()` 60.46% combinado, CON fallback VML real documentado
(`<v:fill type="gradient">`); `border-radius` 82.92%, ya implementado vía VML `RoundRect` en
`cta-bulletproof.html`. Con esa evidencia, 3 cambios concretos, aprobados explícitamente por el
usuario ("Empieza por los 3"):

### 1. Nuevo token `gradients.heroBackground`

Añadido a la plantilla (`newsletters/2026/newsletter-system/brands/_template/tokens/
brand-tokens.json`) y a los 7 brand packs reales (`tarifalo`, `optica2000`, `uax`, `adeslas`,
`nike`, `bmw`, `paraycompara` — confirmados como los únicos que resuelven `campaign-data.json`
de una campaña real hoy). Se aplica como `background-image` adicional, en el mismo `style` que ya
lleva `background-color`/`bgcolor` sólidos, en `hero-centrado.html`, `hero-asimetrico.html`,
`hero-marca-tarifalo.html`, `hero-imagen.html`, `banda-cierre.html` y
`banda-cierre-asimetrico.html` — CSS puro, sin bloque VML nuevo: en clientes sin soporte
(Outlook clásico de escritorio) la propiedad se ignora y el `bgcolor` sólido ya existente sigue
haciendo su trabajo, exactamente el mismo principio de degradado seguro que ya usa
`shadows.cta` en `cta-bulletproof.html` (que tampoco lleva VML, vive solo en la rama
`<!--[if !mso]>`).

Valor por marca — nunca un color inventado, siempre derivado de `colors.primary`/`colors.deep`
YA verificados de esa marca, o `"none"` con motivo documentado:
- `tarifalo`: `linear-gradient(135deg, #003049 0%, #002035 100%)` (primary/deep reales y
  distintos).
- `adeslas`: `linear-gradient(135deg, #004B87 0%, #003A6B 100%)` (ídem).
- `paraycompara`: `linear-gradient(135deg, #5E2E91 0%, #3E244D 100%)` (ídem).
- `optica2000`, `uax`: `"none"` — `colors.primary` y `colors.deep` son el mismo hex en ambos
  packs; no hay un segundo tono real del que partir sin inventar uno.
- `nike`, `bmw`: `"none"` — mismo motivo (primary==deep) MÁS ambas marcas ya documentan
  identidad plana/fotografía-primero (`iconDensity: nula`, "la fotografía es el único adorno
  visual"); un degradado añadido contradiría esa decisión de marca ya verificada con Chrome
  real, no la refuerza.

Cada pack recibió su propio bump de versión y entrada de `_changelog` con el motivo exacto
(`tarifalo` 2.2.3→2.2.4, `optica2000` 2.2.1→2.2.2, `uax` 2.2.1→2.2.2, `adeslas` 2.2.0→2.2.1,
`nike` 2.2.0→2.2.1, `bmw` 2.3.0→2.3.1, `paraycompara` 2.2.4→2.2.5).

### 2. Corrección de una nota "Pendiente" obsoleta en `patterns/fotografia-primero.md` §4

Al investigar cómo añadir un overlay/scrim de legibilidad para el texto del hero sobre
fotografía real (2º recurso pedido por el usuario), se verificó contra la implementación real de
`engine/components/hero-imagen.html` — y el problema que la nota describía no existe: el banner
de imagen ocupa su propia fila, decorativo y sin texto dentro; `brandName`/`h1`/`subtitle`/CTA se
renderizan en filas SEPARADAS, debajo, sobre el fondo sólido de marca (`colors.primary` +
`gradients.heroBackground` del punto 1) — nunca superpuestos a la foto. No hay superposición que
resolver, así que no hace falta construir ningún mecanismo de scrim: se corrige la nota para que
refleje la implementación real en vez de construir una solución a un problema inexistente (regla
anti-aspiracional). Si en el futuro se diseña una variante de hero que sí superponga texto sobre
la foto, esa variante nueva necesitaría su propio scrim — no es el caso hoy.

### 3. Auditoría de `shadows.card` — aplicación inconsistente encontrada y corregida

`shadows.card`/`shadows.cta` ya se leían correctamente en `card-tarifa.html`,
`card-tarifa-3.html`, `lista-premium.html` y `cta-bulletproof.html` — pero NO en `usp-cards.html`,
`usp-cards-asimetrico.html`, ni en la caja "highlight" de `columns-3-beneficios.html`,
`columns-3-beneficios-asimetrico.html` y `columns-3-beneficios-sin-icono.html`, pese a que las 5
ya declaraban `border` + `border-radius:{{token:radius.card}}` (mismo lenguaje visual de tarjeta
que los componentes que sí llevaban sombra). Añadido `box-shadow:{{token:shadows.card}};` a los 5
— ningún token nuevo requerido, `shadows.card` ya existe en los 7 packs reales (incluido
`"none"` para BMW/Nike, que se respeta tal cual: esas marcas siguen sin sombra, por diseño
plano ya documentado, no por omisión).

### Verificación

- `npm run check-engine -- --update`: 30 archivos, motor íntegro (mismos componentes, nuevo hash
  tras los cambios de contenido).
- Rebuild de las 10 campañas reales: 9/10 reconstruidas limpias
  (`comparar-tv`, `revision-verano`, `comparar-luz-gas`, `tarifalo-compara-luz`,
  `optica2000-cuida-tu-mirada`, `uax-fp-online`, `nike-pegasus-42`, `bmw-x1-descubre`,
  `adeslas-seguro-medico`). `tarifalo-compara-energia` sigue con el mismo bug preexistente ya
  conocido (no introducido en esta ronda): `hero.stat.number`/`hero.stat.label` vacíos en su
  `campaign-data.json`, lo que ya fallaba el schema (`minLength:1`) antes de este cambio — sus
  `09-exports/` quedan tal cual estaban (el build falló sin escribir nada, no se sobrescribió
  nada), así que hoy NO llevan `gradients.heroBackground`; pendiente arreglar el dato de la
  campaña (fuera de alcance de motor) antes de poder regenerarla.
- Diff byte a byte de cada campaña reconstruida contra su export anterior: cambios exactamente
  los esperados y nada más (`background-image` y/o `box-shadow` únicamente) — 2 a 6 líneas de
  diferencia por campaña según cuántos de los 6+5 componentes tocados usa cada una. Sin cambios
  estructurales, sin variación en conteos de `<img>`/`utm_source`/`v:roundrect`.
- `npx tsx scripts/check-parity.ts --campaign-set` sobre las 7 carpetas de cliente: paridad
  fuente/inline verificada en las 9 campañas reconstruidas (hash del manifest coincide con el
  HTML real en disco).
- `npx tsx scripts/production-gate-motor.ts --campaign` sobre las 9: 7/9 pasan los 9 gates
  limpios (`comparar-tv`, `comparar-luz-gas`, `tarifalo-compara-luz`, `uax-fp-online`,
  `nike-pegasus-42`, `bmw-x1-descubre`); `revision-verano` y `optica2000-cuida-tu-mirada` fallan
  en `control-files` (faltan `campaign-status.md`/`task-log.md`/`handoff.md`/`next-steps.md`,
  preexistente, no relacionado); `optica2000-cuida-tu-mirada` y `adeslas-seguro-medico` fallan
  además en `brand-pack-completeness` por los mismos placeholders `[Q-NNN]` de
  `photography`/`voice.rhythm` ya documentados como hallazgo real en la entrada anterior de este
  changelog — ninguno de los 3 fallos lo causa este cambio, verificado comparando el detalle
  exacto de cada gate contra lo ya conocido.


## Auditoría profunda del motor y los 10 agentes — 5 mejoras (2026-07-24)

Petición directa del usuario: "haz un análisis profundo del motor y cada agente y vamos a
aplicar las mejoras pertinentes para obtener el mejor resultado posible y afinar al máximo el
sistema de newsletters". Se auditaron los 10 agentes (`agents/00-09-*.md`) completos y el motor
(`engine/build-newsletter.js`, `lib/assemble.js`, `lib/tokens.js`, `lib/pattern.js`,
`lib/verify.js`, `schema/campaign-data.schema.json`, `scripts/production-gate-motor.ts` y el
resto de gates). **Los 10 agentes no presentaron huecos estructurales nuevos** — las rondas ya
hechas esta sesión (fidelidad de marca, ritmo de voz, patrones dinámicos, elección de variante de
icono) cerraron lo que había. El motor sí tenía 5 hallazgos concretos y verificados; el usuario
aprobó las 5 ("Las 5 ahora, en orden de impacto").

### 1. Ningún gate detectaba placeholders "PENDING-"/de texto en producción real

Verificado antes de tocar nada: `"https://PENDING-CDN-UPLOAD/hero-banner.png"` pasa el `$def
httpsUrl` del schema sin problema (solo exige el prefijo `https://`) — y ya se ha usado en 3
campañas reales de esta sesión (BMW, Nike, Tarífalo) mientras se esperaba la subida real al CDN.
Correcto mientras la campaña sea de prueba, pero nada impedía que el mismo placeholder llegara a
una campaña con `metadata.isTestCampaign:false` sin que ningún gate lo bloqueara. Además,
`campaign-data.schema.json` documenta explícitamente en el comentario de `legalLine` que no
puede hacer validación cruzada `isTestCampaign`/placeholder sin JSON Schema 2019-09 (`if`/`then`)
— "limitación conocida", nunca resuelta.

**Creado `scripts/check-production-readiness.ts`**: si `metadata.isTestCampaign !== true`,
ningún placeholder puede sobrevivir — ni `PENDING-`/`PLACEHOLDER` (case-insensitive) en ninguna
URL de `campaign-data.json` o del HTML exportado, ni un valor de texto que empiece por `[` (salvo
merge-tags de ESP válidos tipo `[UNSUBSCRIBE_LINK]`, excluidos explícitamente). Si
`isTestCampaign:true`, los mismos hallazgos se degradan a avisos informativos. Wireado como
**Gate 10** en `production-gate-motor.ts`.

### 2. `brand-tokens.json` no tenía ningún schema de validación

A diferencia de `campaign-data.json`, un typo estructural (campo mal anidado, tipo incorrecto)
solo se detectaba si algún componente intentaba resolver ese `{{token:...}}` exacto — nunca si el
campo quedaba huérfano. Con 7 packs reales y una estructura cada vez más rica (colors/typography/
spacing/radius/shadows/gradients/surfaces/layout/photography/iconography/voice), era un riesgo
real, no hipotético.

**Creado `engine/schema/brand-tokens.schema.json`**: schema ligero y permisivo
(`additionalProperties:true` en casi todo el árbol a propósito — no bloquea campos nuevos
legítimos por marca, ej. `personalization`/`utm` de Nike/BMW) que solo atrapa errores
estructurales: secciones requeridas ausentes, tipos incorrectos (objeto donde se esperaba
string, radius/shadows con valores que no son string/number/object). Wireado dentro de
`check-brand-pack-completeness.ts` (mismo script, nueva responsabilidad) — sigue siendo el
**Gate 8**. Verificado contra los 7 packs reales: 0 errores de schema nuevos (backward-compatible
confirmado).

### 3. Cero verificación automática de contraste WCAG

Todo el cálculo de luminancia de esta sesión (tarifalo, paraycompara, BMW — ver
`patterns/saving.md` §4, `patterns/institutional.md` §5, `patterns/fotografia-primero.md` §4) se
hizo a mano, documentado como tabla estática — exactamente el tipo de verificación
manual-propensa-a-error que el resto del sistema ya automatizó (paridad, columnas, claims).

**Creado `scripts/check-contrast.ts`**: recalcula la fórmula de luminancia relativa WCAG 2.x real
sobre 7 combinaciones fijas texto/fondo verificadas contra dónde se usan en
`engine/components/*.html` (CTA, cuerpo sobre blanco, cuerpo sobre sección alterna, subtítulo de
hero, cuerpo de banda de cierre, H2 de sección, footer), con el tamaño/peso de fuente real de
cada contexto para elegir el umbral correcto (3:1 texto grande, 4.5:1 normal). Wireado como
**Gate 9**.

**Hallazgo real al probarlo** (no hipotético): `brands/optica2000/tokens/brand-tokens.json` tenía
`colors.text.secondary` en `#6B6B6B`, que da **4.47:1** sobre `surfaces.sectionLila` (#EBEBEB) —
por debajo del mínimo AA de 4.5:1. La propia entrada `_changelog` v2.2.0 de ese pack afirmaba
"4.06:1 — ambos pasan", un cálculo manual incorrecto que nadie había verificado desde que se
escribió (ni siquiera esa cifra alcanzaba 4.5:1). **Corregido** a `#666666` (4.82:1 sobre
`#EBEBEB`, 5.74:1 sobre blanco) en los 8 campos que llevaban el valor anterior — mismo gris que ya
usan tarifalo/uax/adeslas/paraycompara para el mismo rol, no un color nuevo inventado. Óptica 2000
sube a v2.2.3. Verificado: `check-contrast.ts --brand optica2000` → 7/7 tras el fix.

### 4. `production-gate-motor.ts` crasheaba con stack trace en campañas de formato antiguo

Bug documentado 2 veces en este changelog, nunca arreglado hasta ahora. Causa real encontrada:
`gate1Schema` sí comprobaba `fs.existsSync(dataPath)` y fallaba limpio si faltaba
`campaign-data.json` — pero `gate4Claims(dataPath)` se ejecutaba igual, incondicionalmente, con
un `fs.readFileSync(dataPath)` sin ninguna guarda, y moría con `ENOENT` sin capturar. Corregido en
2 capas: (a) `main()` detecta la ausencia de `06-data/campaign-data.json` ANTES de correr ningún
gate y sale limpio con "⏭️ Omitida" (mismo criterio que `check-parity.ts` ya usa para campañas
fuera de su alcance); (b) `gate4Claims` lleva su propia guarda defensiva por si se llama fuera de
`main()`. Verificado: `production-gate-motor.ts --campaign
newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil` (formato antiguo, solo
`newsletter-data.json`) → exit 0 con mensaje legible, sin stack trace.

### 5. Gate 5 (assets) no distinguía placeholder de fallo de red real

Una URL como `https://PENDING-BMW-LOGO/` fallaba el HEAD-request por DNS y se clasificaba
exactamente igual que un asset real inalcanzable por falta de red del sandbox — "puede ser falta
de red del entorno, no un asset roto". Engañoso: un placeholder jamás va a resolver, tenga el
entorno red o no. Corregido: `checkUrl`/`gate5Assets` detectan el patrón `PENDING-`/`PLACEHOLDER`
antes del fetch y lo etiquetan como "placeholder declarado — nunca va a resolver hasta que se
suba el asset real", contado por separado del recuento de "sin red". Sigue siendo solo
informativo (Gate 5 no bloquea); el bloqueo real para producción es responsabilidad del nuevo
Gate 10.

### Verificación

- `npx tsc --noEmit`: limpio (solo TS5107 preexistente).
- `npm run check-engine`: 30 archivos, motor íntegro (sin cambios — nada de esto tocó
  `engine/components/`).
- `check-contrast.ts`/`check-brand-pack-completeness.ts` (schema) probados contra los 7 packs
  reales (`tarifalo`, `optica2000`, `uax`, `adeslas`, `nike`, `bmw`, `paraycompara`): 0 errores
  de schema nuevos; 1 fallo de contraste real encontrado y corregido (Óptica 2000, ver punto 3).
- `production-gate-motor.ts` corrido sobre las 10 campañas reales (incluida la nueva
  `nike-pegasus-42-w`): los 2 gates nuevos (9 contrast, 10 production-readiness) pasan limpios en
  las 10; los 3 fallos preexistentes (`revision-verano`/`optica2000-cuida-tu-mirada` en
  `control-files`, `optica2000-cuida-tu-mirada`/`adeslas-seguro-medico` en
  `brand-pack-completeness`) siguen siendo exactamente los mismos ya documentados — ninguno lo
  causan los cambios de esta ronda.
- `production-gate-motor.ts --campaign newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil`
  (formato antiguo): exit 0, "⏭️ Omitida", sin crash — confirma el fix del punto 4.
- `package.json`: añadidos los scripts `check-brand-pack-completeness`, `check-contrast`,
  `check-production-readiness` (el primero llevaba meses sin entrada en `package.json` pese a
  existir desde antes de esta ronda — corregido de paso).


## Marca real Spotify + usp-cards-sin-icono (2026-07-24)

### Contexto

Se identificó Spotify (marca real ajena al sistema) como el test más exigente disponible para
los 5 cambios de motor de la entrada anterior — identidad dark-mode-first (negro puro
verificado en vivo, no el `#191414` de guías de terceros) adaptada deliberadamente a fondo claro,
CTA con texto negro sobre verde (combinación que ninguna de las 7 marcas del sistema tenía),
degradado negro→verde real. Pack creado en `brands/spotify/tokens/brand-tokens.json` v2.2.0 con
investigación en Chrome real sobre spotify.com/us/premium/ (`getComputedStyle`, DOM real) más
fuentes secundarias citadas para el lenguaje de degradados de las campañas Wrapped. El primer
borrador del pack falló `check-contrast.ts` (3/7) por reutilizar el mismo verde vivo tanto en
`colors.primary` (rol de texto/fondo) como en `colors.ctaBackground` (rol de botón) — corregido
desacoplando los roles (`colors.primary`→negro real, `colors.deep`→verde oscuro derivado
`#146C43`, `ctaBackground` sin tocar) hasta 7/7. Detalle completo en el `_changelog` del propio
pack (entradas `fix1`/`fix2`).

### Hueco real de motor destapado por la primera campaña de prueba

Al construir `2026-jul-spotify-premium-test`, el agente 03 documentó (incorrectamente) en
`module-selection.md` que "usp-cards-asimetrico no tiene variante con icono — las tarjetas USP
no llevan icono en el schema". Falso: `campaign-data.schema.json` exige `icon` como campo
`required` en `usp-cards`/`usp-cards-asimetrico` desde que se crearon (2026-07-22). El agente 06
no tenía forma de omitirlo y rellenó `🌍`/`📱`/`✅` — justo lo que
`brands/spotify/tokens/brand-tokens.json` → `iconography.componentImplication` desaconseja
explícitamente para esta marca. Mismo patrón exacto que el hueco de BMW en la ronda anterior
(`columns-3-beneficios-sin-icono`), esta vez en el componente de credibilidad (USP) en vez de en
beneficios.

### Fix — `usp-cards-sin-icono.html` / `usp-cards-sin-icono-asimetrico.html`

Dos componentes nuevos, mismo contrato de datos que `usp-cards`/`usp-cards-asimetrico` excepto
que `items[]` solo requiere `title`+`body` (sin `icon`) — la ausencia de glifo se compensa con
la misma barrita de color de acento (24×2px, `colors.light`) que ya usa
`columns-3-beneficios-sin-icono.html`. Mismo `box-shadow`/`border`/`radius` en las tarjetas que
sus contrapartes con icono.

- `engine/schema/campaign-data.schema.json`: nueva rama `oneOf` — `component: enum
  ["usp-cards-sin-icono", "usp-cards-sin-icono-asimetrico"]`, `items[]` con `required:
  ["title","body"]` (sin `icon`).
- `engine/lib/assemble.js`: `MODULE_ADAPTERS['usp-cards-sin-icono']` y
  `MODULE_ADAPTERS['usp-cards-sin-icono-asimetrico']` apuntan al mismo adaptador que `usp-cards`
  (el dato no cambia de forma, solo la plantilla).
- `patterns/institutional.md`: documentadas como tercera/cuarta variante de "Credibilidad (USP)"
  en la tabla de secuencia, `PATTERN_SEQUENCE` actualizado (paso 6 ahora acepta las 4 variantes),
  y nueva entrada en §7.1 explicando el motivo real (mismo criterio que BMW/columns-3-beneficios).
- `engine/components/INVENTORY.md`: 2 filas nuevas.
- `newsletters/2026/spotify/2026-jul-spotify-premium-test/`: `campaign-data.json` migrado de
  `usp-cards-asimetrico` (con emoji) a `usp-cards-sin-icono-asimetrico` (sin emoji), y corregido
  el copy de todos los módulos, que había perdido las tildes/acentos españoles en la fase de
  05/06 (bug de contenido, no del motor — el `subjectLine`/`preheader` sí las llevaban
  correctamente, solo el cuerpo del email las perdió).

### Verificación

- `node -e "JSON.parse(...)"` sobre el schema: compila.
- `npm run check-engine -- --update`: lock regenerado tras confirmar el cambio como legítimo
  (documentado aquí).
- `check-contrast.ts --brand spotify`: 7/7 (sin cambios respecto al pack, no afectado por este
  fix de componente).
- `check-brand-pack-completeness.ts --brand spotify`: OK.
- Build + `production-gate-motor` de `2026-jul-spotify-premium-test` tras el fix: ver
  `next-steps.md`/`campaign-status.md` de la propia campaña para el resultado final.


## Jerarquía de CTA — primario vs. secundario (2026-07-24)

### Contexto real, no hipotético

El usuario pidió una revisión a fondo del sistema para que las newsletters dejen de "verse
genéricas" — pidió empezar por los CTA porque "siguen siendo todos enormes". Evidencia concreta:
en `2026-jul-spotify-premium-test/09-exports/final.html`, los 4 CTA del email (hero, intro-cta
contextual, banda de cierre, y el fallback VML) usaban EXACTAMENTE el mismo
`{{include:cta-bulletproof}}` — mismo `padding:17px 36px`, `font-size:19px`, pastilla sólida
completa — sin distinguir "el ask principal del email" de "un enlace de paso junto a dos frases
de body copy". Además, la investigación real de marca SÍ documentaba una jerarquía distinta (el
botón secundario real de spotify.com/us/premium/, "View all plans", es un outline/ghost, no una
pastilla sólida — verificado con Chrome real, ver `brands/spotify/tokens/brand-tokens.json`) y
esa investigación nunca llegaba al HTML porque el motor no tenía ningún componente que pudiera
expresarla. Causa raíz: `cta-bulletproof.html` es el ÚNICO partial de CTA que existe — todos los
módulos lo incluyen igual, sin importar su papel real en la jerarquía del email.

### Fix — `cta-secondary-bulletproof.html`

Partial nuevo: outline/ghost (transparente, borde 1.5px, sin sombra), más pequeño
(`padding:12px 28px`, `font-size:14px` frente a `17px 36px`/`19px` del primario). Usa
`{{token:colors.primary}}` para borde y texto — decisión deliberada, no un color nuevo por marca:
`colors.primary` ya es, en las 8 marcas reales del sistema, el tono oscuro/de texto verificado
(ratio mínimo 8.91:1 sobre blanco, comprobado antes de tocar nada — ver tabla abajo), así que
reutilizarlo mantiene coherencia visual con los H2 de sección sin fabricar ningún token nuevo ni
tocar los 8 brand packs.

| Marca | colors.primary | Ratio sobre blanco |
|---|---|---|
| adeslas | #004B87 | 8.91:1 |
| apple | #1D1D1F | 16.83:1 |
| bmw | #000000 | 21.00:1 |
| nike | #111111 | 18.88:1 |
| optica2000 | #2D2D2D | 13.77:1 |
| tarifalo | #003049 | 13.82:1 |
| uax | #003F6F | 10.82:1 |
| spotify | #000000 | 21.00:1 |

Repuntados a `{{include:cta-secondary-bulletproof}}` (antes `cta-bulletproof`) los 4 módulos cuyo
CTA es contextual/de paso, no el ask principal del email: `intro-cta.html`,
`intro-cta-asimetrico.html`, `category-grid.html`, `category-grid-img.html`. Se mantienen en
`cta-bulletproof.html` (primario, sin cambios): `hero-centrado`, `hero-asimetrico`, `hero-imagen`,
`hero-marca-tarifalo`, `banda-cierre`, `banda-cierre-asimetrico` — son legítimamente el ask
principal del email y deben conservar el máximo peso visual.

`scripts/check-contrast.ts`: 8ª combinación fija — "CTA secundario (outline) sobre blanco"
(`colors.primary` sobre `colors.background.white`, 14px/700, umbral 3:1 por ser texto grande y
negrita — en la práctica todas las marcas superan también el umbral de 4.5:1).

### Alcance deliberado de esta ronda (lo que NO se hizo)

No se creó una variante "texto plano sin botón" (text-link) para marcas con identidad
extremadamente plana (Nike/BMW) — es una mejora real pendiente, pero requiere que agente 03/04
puedan elegir explícitamente esa variante por módulo (mecanismo de decisión, no solo un
componente nuevo). Se deja documentado como siguiente paso en `patterns/institutional.md` §8, no
se fuerza en esta ronda para no bloquear la ganancia inmediata (outline universal, sin fabricar
nada) por una decisión de mecanismo más grande.

### Verificación

- `check-contrast.ts` corrido contra las 8 marcas reales tras el cambio: 8/8 en las 7 marcas
  activas (`adeslas`, `bmw`, `nike`, `optica2000`, `tarifalo`, `uax`, `spotify`); `apple` omite
  ambas combinaciones nuevas por pack legado v1.0.0 sin `colors.text.secondary`/`surfaces.global`
  (comportamiento ya existente, no una regresión de esta ronda).
- `npm run check-engine -- --update`: lock regenerado (5 archivos alterados/nuevos, todos
  documentados aquí — 33 archivos totales).
- Rebuild de las 12 campañas reales (`campaign-data.json`): 11 BUILD OK, 1 fallo — 
  `tarifalo/2026-jul-tarifalo-compara-energia` falla el schema (`stat.number`/`stat.label`
  vacíos en el módulo hero-asimetrico) — confirmado preexistente, sin relación con este cambio
  (falla en la validación de schema, paso previo a que se resuelva ningún `{{include:}}`).
- `production-gate-motor.ts` en las 11 que sí buildean: 8 en verde, 3 con los mismos fallos
  preexistentes ya documentados en la ronda anterior (`revision-verano`/control-files,
  `optica2000-cuida-tu-mirada`/control-files+brand-pack-completeness,
  `adeslas-seguro-medico`/brand-pack-completeness) — ninguno nuevo, ninguno causado por el CTA.
- Verificado en `final.html` de varias campañas (`spotify`, `uax`, `adeslas`) que el CTA
  secundario renderiza `border:1.5px solid {color}` (outline real, no pastilla) en el HTML de
  salida — no solo en el componente fuente.


## Romper composiciones repetidas — familia "asimétrico" (2026-07-24)

### Contexto real

Segundo frente de la misma ronda que "Jerarquía de CTA" (mismo pedido del usuario: que las
newsletter dejen de verse genéricas). Evidencia concreta, ya citada en la entrada anterior:
`banda-cierre-asimetrico.html` documentaba EXPLÍCITAMENTE en su propio comentario de cabecera
"mismo lenguaje compositivo que hero-asimetrico.html... para dar continuidad visual" — es decir,
la repetición de silueta entre hero, intro-cta, usp-cards y banda-cierre no fue un accidente, fue
una decisión de diseño tomada en la ronda Nivel 2 (2026-07-22) que priorizó "coherencia de
familia" sobre variedad real. Efecto medible: en `2026-jul-spotify-premium-test`, `intro-cta-
asimetrico`, `usp-cards-asimetrico` y `banda-cierre-asimetrico` compartían el mismo esqueleto —
texto ~65% a la izquierda + caja de acento ~33% a la derecha, `vertical-align:middle` — cambiando
solo el contenido de la caja (CTA, insignia, CTA). Tres módulos con trabajo/contenido distinto,
la misma silueta.

### Fix — 2 rediseños, sin tocar el contrato de datos

**`usp-cards-asimetrico.html` / `usp-cards-sin-icono-asimetrico.html`** — la insignia era una caja
de 32% de ancho compitiendo visualmente con el título, como si fuera un CTA. Una insignia es una
etiqueta informativa, no una acción — se rediseñó como chip shrink-to-fit (`width="1"` +
`white-space:nowrap`, el truco estándar de columna de ancho automático en email), alineado arriba
y a la derecha del título en su propia fila, con eyebrow en una fila propia arriba y el cuerpo a
todo el ancho debajo. Ya no hay 2 columnas de igual peso en la cabecera de este módulo.

**`banda-cierre-asimetrico.html`** — como banda de CIERRE (el último mensaje, no uno de tránsito
como intro-cta), se le da ritmo propio: título+cuerpo a todo el ancho arriba (registro editorial,
no columna de 62%) y el CTA suelto debajo, alineado a la izquierda, con ancho fijo `280px` en
desktop (mismo valor que ya usaba el fallback VML para Outlook — ahora consistente entre
clientes) y `width:100%` en mobile (`class="mobile-full"`, patrón ya existente). Deja de tener 2
columnas — ya no comparte esqueleto con `intro-cta-asimetrico.html`.

`hero-asimetrico.html` e `intro-cta-asimetrico.html` NO se tocan: el primero tiene semántica
propia real (H1 + cifra destacada, dato no acción) que ya lo diferenciaba; el segundo, tras el fix
de jerarquía de CTA de esta misma ronda, ya renderiza con un CTA visiblemente más pequeño/outline
que antes — suficiente diferenciación sin rehacer su composición.

Ningún cambio toca `campaign-data.schema.json` ni `lib/assemble.js` — el contrato de datos
(`uspSection.*`, `closing.*`) es idéntico, solo cambió el HTML de presentación.

### Verificación

- `npm run check-engine`: detectó los 3 archivos alterados, ninguno más — confirma que el cambio
  no tocó nada fuera de lo pretendido.
- `npm run check-engine -- --update`: lock regenerado tras esta documentación.
- Rebuild de las 11 campañas reales que ya buildeaban: 11/11 BUILD OK, ningún fallo nuevo.
- `production-gate-motor.ts` en las 11: 8 en verde, los mismos 3 fallos preexistentes de siempre
  (`revision-verano`/control-files, `optica2000-cuida-tu-mirada`/control-files+brand-pack-
  completeness, `adeslas-seguro-medico`/brand-pack-completeness) — cero regresiones nuevas.
- Verificado en `final.html` de `2026-jul-spotify-premium-test` (usa `usp-cards-sin-icono-
  asimetrico` y `banda-cierre-asimetrico`): 0 ocurrencias del viejo esqueleto
  `width:68%|32%|62%|38%`; presente el chip shrink-to-fit nuevo (`width="1"` +
  `white-space:nowrap`) y el CTA de cierre con ancho fijo `280px` — confirma que el rediseño
  llegó de verdad al HTML de salida, no solo al componente fuente.


## La investigación de 02 no llegaba a la decisión de estructura — Gate 11 (2026-07-24)

### Contexto real

Tercer frente de la misma ronda ("que las newsletters dejen de verse genéricas"). Evidencia:
`2026-jul-spotify-premium-test` se construyó con `hero-centrado` pese a que `agents/
03-newsletter-architect.md` ya documentaba (desde una ronda anterior) que `hero-imagen` debía
elegirse cuando (a) el brief da una URL de landing real y (b) `photography.usesRealPhotography`
del brand pack es `true`. Las dos se cumplían: el CTA del hero apuntaba a
`https://www.spotify.com/us/premium/` (la misma página que 02 investigó con Chrome real) y el
brand pack documenta fotografía de alto contraste como elemento dominante. El motivo escrito en
`module-selection.md` justificaba por qué NO se usaba `hero-asimetrico` — una variante que nadie
había propuesto — y no mencionaba `hero-imagen` ni una vez. Diagnóstico: los criterios existían
en la documentación, pero estaban escritos como una lista plana de "cuándo usar X" que permite
a quien ejecuta 03 responder la pregunta que le resulte más cómoda (¿por qué no X?) en vez de la
que los criterios realmente activan (¿por qué no hero-imagen, si se cumplen sus condiciones?).

### Fix — checklist forzado + gate automático

**`agents/03-newsletter-architect.md` §"Elegir hero"**, reescrito: ahora exige responder 2
preguntas Sí/No de forma explícita en `module-selection.md`, EN ESTE ORDEN, antes de justificar
cualquier otra variante — (1) ¿URL de landing real? (2) ¿`photography.usesRealPhotography:true`?
— si las dos son "Sí", `hero-imagen` es la variante por defecto, y usar otra exige un motivo que
rebata específicamente esas 2 preguntas, no que argumente contra una variante distinta.

**`scripts/check-hero-decision.ts`** (nuevo) — automatiza la detección del patrón exacto de
arriba: lee `photography.usesRealPhotography` del brand pack, el `cta.href` del módulo hero real
en `campaign-data.json` (¿es una URL real, no un placeholder `PENDING-`/`PLACEHOLDER`?), y si se
cumplen las dos condiciones pero el hero elegido no es `hero-imagen`/`hero-marca-*`, exige que
`module-selection.md` al menos MENCIONE `hero-imagen` (o "arte generado"/"arte de IA") en algún
sitio. No puede juzgar si el motivo para descartarlo es bueno — solo que existe, que es
exactamente lo que faltaba en Spotify.

Wired como **Gate 11** en `production-gate-motor.ts` (`gate11HeroDecision`, mismo patrón que los
gates 9/10) + `npm run check-hero-decision`.

**`03-strategy/module-selection.md` de `2026-jul-spotify-premium-test`** actualizado con el
hallazgo retroactivo (las 2 preguntas respondidas, motivo original tachado y marcado como
incompleto) — la campaña queda deliberadamente en rojo en el Gate 11 hasta que el usuario decida
si reconstruirla con `hero-imagen` real (coste de API OpenAI) o dejarla como está.

### Verificación

- `npx tsc --noEmit`: limpio (solo TS5107 preexistente).
- `check-hero-decision.ts` probado contra las 11 campañas reales que buildean: **1 FAIL**
  (`2026-jul-spotify-premium-test`, el caso real que motivó esto) y **10 OK** — incluidas 3 que
  ya usan `hero-imagen`/`hero-marca-*` (pasan trivialmente) y 7 que no cumplen los 2 criterios a
  la vez (verificado el motivo exacto de cada una: sin URL real, o `usesRealPhotography:false`) —
  cero falsos positivos.
- `production-gate-motor.ts --campaign newsletters/2026/spotify/2026-jul-spotify-premium-test`:
  Gate 11 en rojo, el resto (0-10) en verde — confirma que el gate nuevo no interfiere con nada
  más y aísla exactamente el problema real.


### Cierre: migración real de Spotify a hero-imagen (2026-07-24, mismo día)

El usuario confirmó reconstruir `2026-jul-spotify-premium-test` con `hero-imagen`. Se intentó
generar el arte real con `scripts/generate-hero-image.ts --brand spotify --source skip --theme
"..." --campaign ...` — la llamada a la API de imágenes de OpenAI falló con `No se pudo conectar
con api.openai.com: fetch failed`: este sandbox de Cowork no tiene salida de red a internet
general (mismo motivo, verificado ahora directamente en vez de solo inferido, por el que todas
las URLs externas de Gate 5 fallan con "sin respuesta" en todas las campañas de esta sesión).

Se migró `campaign-data.json` de `hero-centrado` a `hero-imagen` con el contrato de datos
correcto (`bannerSrc`/`bannerAlt`/`brandName`/`h1`/`subtitle`/`cta`, mismo patrón que
`nike-pegasus-42-w`), `bannerSrc` en `https://PENDING-CDN-UPLOAD/hero-banner.png` (mismo
placeholder que ya usan Nike/BMW mientras no hay asset real subido al CDN — el script nunca sube
directamente, es un paso manual de 2 pasos ya documentado en su propia cabecera). El comando
exacto para generar el arte real queda documentado en `module-selection.md` de la campaña, para
ejecutar en un entorno con internet real (máquina del usuario o la sesión de Hermes).

Verificado: rebuild OK (26.1 KB inline), `production-gate-motor` → **12/12 gates en verde**
(0-11, incluido Gate 11 ahora en verde) — el único cambio de estado en Gate 5 es el nuevo
placeholder `hero-banner.png` sumándose al ya existente del logo, mismo tratamiento de aviso que
antes, no bloquea nada con `isTestCampaign:true`.


## El H1 de hero-imagen ignoraba typography.hero.h1 (2026-07-25)

### Qué pasó

Durante la revisión en vivo de la fase 04 (Email Design) del test de Worn Wear, Hermes reportó
como hallazgo propio (I-001, clasificado "limitación preexistente del motor") que el H1 del hero
salía en blanco en vez de en naranja `#FA4616` como especificaba el pack. Antes de aceptarlo como
límite conocido se inspeccionó `engine/components/hero-imagen.html` directamente:

```html
<h1 ... style="...font-size:28px;font-weight:800;color:#FFFFFF;...line-height:1.16;...">
```

Color, tamaño, peso y line-height del H1 (y del `brandName`) estaban **literales en la
plantilla**, sin ningún `{{token:...}}`. Hasta aquí coincide con lo que reportó Hermes. Pero el
pack de Worn Wear ya declaraba `typography.hero.h1.{size,weight,lineHeight,color}` — el mismo
campo que `agents/04` usó para escribir `layout.md` ("H1 — naranja #FA4616, 32px, weight 500") —
y el motor lo ignoraba por completo. No es que faltara el dato: **el dato existía y nadie lo
leía**, exactamente la misma categoría de bug que "CTAs siempre enormes" (arriba) y "El gate de
contraste certificaba contra un tamaño que ya nadie renderiza".

### Por qué era más grave de lo que parecía

Auditar qué otros brand packs reales declaran `typography.hero.h1` reveló que el bug de la
plantilla era, sin proponérselo, lo único que evitaba un problema peor:

| Marca | `typography.hero.h1.color` declarado | `colors.primary` (fondo real del hero) | Qué pasaría si el motor SÍ leyera el token |
|---|---|---|---|
| wornwear | `#FA4616` | `#000000` | Correcto — es justo lo que se esperaba |
| **spotify** | **`#000000`** | **`#000000`** | **Texto invisible — negro sobre negro** |
| **nike** | **`#111111`** | **`#111111`** | **Texto invisible — casi negro sobre casi negro** |
| bmw | `#FFFFFF` | `#000000` | Correcto, coincide con lo ya renderizado |

`typography.hero.h1.color` en los packs de Spotify y Nike se había capturado del texto normal de
la marca sobre fondo CLARO (ficha de producto de Nike, página de producto de Spotify) — nunca se
verificó contra el fondo OSCURO real donde `hero-imagen.html` lo renderiza. Mismo patrón de raíz
que el resto de esta sesión: un valor "observado" en un contexto, reutilizado en otro sin
comprobar si sigue siendo válido. El caso de Spotify es doblemente revelador: `_changelog` de su
propio pack documenta que `fix1` corrigió `colors.onBrandSecondary` a `#FFFFFF` específicamente
para el contraste de texto sobre `colors.primary` — pero nunca tocó `typography.hero.h1.color`,
que seguía apuntando al mismo fondo con el color equivocado.

### Verificación de la corrección de color (antes de tocar el motor)

Antes de reescribir nada se verificó con Chrome si existía precedente real de texto oscuro sobre
fondo oscuro en algún sitio de las dos marcas — para no fabricar un color sin respaldo:

- **spotify.com/us/premium/**: todo headline real sobre fondo oscuro (`rgb(18,18,18)`) usa
  `color:#FFFFFF` — nunca negro. Confirma que `#000000` en el pack estaba mal, y que `#FFFFFF`
  (el mismo valor que ya usa `colors.onBrandSecondary` en ese pack) es la corrección correcta,
  no una invención.
- **nike.com**: la home actual no tiene ningún headline real sobre fondo oscuro que sirva de
  precedente directo, pero todo texto encontrado sobre superficies oscuras de la página
  (controles de vídeo) usa blanco, nunca negro — mismo patrón que el resto de marcas del sistema
  con fondo oscuro (BMW, Spotify). Se adopta blanco por consistencia con la convención ya
  establecida, no por invención.

`brands/spotify/tokens/brand-tokens.json` (v2.2.0→2.2.1) y `brands/nike/tokens/brand-tokens.json`
(v2.2.1→2.2.2) corregidos: `typography.hero.h1.color` de `#000000`/`#111111` a `#FFFFFF` en
ambos, con la evidencia y el razonamiento documentados en el `_changelog` de cada pack.

### Fix del motor

`typography.hero.h1.{color,size,weight,lineHeight}` no se puede leer con `{{token:...}}`
directamente en `hero-imagen.html` porque ese placeholder lanza un error duro si el path no
existe (`renderTemplate`, sección 3 de `lib/assemble.js`) — y no todos los packs lo declaran
(tarifalo, adeslas, uax, optica2000, apple no lo tienen). El fallback tiene que vivir en JS, no
en la plantilla:

- `MODULE_ADAPTERS['hero-imagen']` pasa a recibir `(data, tokens)` — el único adaptador que
  necesita el segundo argumento — y calcula `hero.h1Color/h1Size/h1Weight/h1LineHeight` desde
  `tokens.typography.hero.h1`, con fallback a `#FFFFFF`/`28`/`800`/`1.16` (los mismos valores que
  antes estaban hardcodeados) si el pack no lo declara. `assembleNewsletter` ahora pasa `tokens`
  a `adapter(mod.data, tokens)` — retrocompatible, el resto de adaptadores simplemente ignora el
  segundo argumento.
- `hero-imagen.html` cambia sus 4 literales por `{{data:hero.h1Size}}`/`h1Weight`/`h1Color`/
  `h1LineHeight`.
- `scripts/check-contrast.ts` gana una combinación nueva, "H1 del hero sobre color primario de
  marca", con el mismo mecanismo `sizePath`/`weightPath` ya usado para el CTA — y un
  `fgFallback` nuevo (`Combo.fgFallback`) porque este es el primer combo cuyo color de texto
  también necesita fallback, no solo el tamaño. Sin este combo, un futuro pack con un
  `typography.hero.h1.color` mal verificado (como los de Spotify/Nike antes de esta corrección)
  volvería a colar un H1 invisible sin que ningún gate lo detectara.

### Verificación

Rebuild de las 6 campañas reales que usan `hero-imagen` (tarifalo, spotify, wornwear, nike ×2,
bmw):

| Campaña | H1 antes (hardcode) | H1 después | Resultado |
|---|---|---|---|
| tarifalo (sin `typography.hero.h1`) | 28px/800/#FFFFFF/1.16 | 28px/800/#FFFFFF/1.16 (fallback) | **Byte-idéntico** (hash sha256 sin cambios) |
| bmw | 28px/800/#FFFFFF/1.16 | **32px/300**/#FFFFFF/**1.15** | Cambia — antes el peso/tamaño tampoco coincidían con el pack (`typography.hero.h1` ya declaraba 32/300/1.15) |
| spotify | 28px/800/#000000\*/1.16 | **32px/700/#FFFFFF/1.15** | Corrige — antes habría sido negro sobre negro si el motor leyera el color declarado |
| nike (×2 campañas) | 28px/800/#111111\*/1.16 | 28px/**500**/**#FFFFFF**/**1.2** | Corrige — mismo caso que Spotify |
| wornwear | 28px/800/#FFFFFF/1.16 | **32px/500/#FA4616/1.2** | Corrige — el titular sale naranja, como se aprobó en 03/04 |

\*color que se habría renderizado si el motor hubiera leído el token sin la corrección de pack de
este mismo cambio — con el bug original nunca se manifestó porque el motor no leía el campo.

`check-contrast.ts --brand {spotify,nike,bmw,wornwear,tarifalo,adeslas,uax,optica2000,apple}` →
9/9 packs en verde, incluyendo el combo nuevo. `check-engine-integrity.ts -- --update` tras esta
entrada. `production-gate-motor.ts` verde en las 6 campañas afectadas.


## Por qué se sigue viendo genérico, primer round: el CTA nunca se ajustaba al texto (2026-07-25)

### Qué pasó

Tras revisar el HTML final de Worn Wear ya con todas las correcciones anteriores aplicadas
(tamaño real del CTA, H1 naranja, columnas equilibradas), el usuario planteó una pregunta de
fondo: por qué, después de tantas rondas de corrección, la newsletter seguía viendo "genérica,
de plantilla barata" — con el botón "Descubrir novedades" (2 palabras) ocupando casi el ancho
completo de los 600px del email.

Se inspeccionó `cta-bulletproof.html` directamente en vez de asumir que era un problema de
tamaño de fuente (ya corregido en la ronda "CTAs siempre enormes"). La tabla exterior del botón
tenía:

```html
<table ... style="width:100%;" class="mobile-full">
```

`.mobile-full` es una clase pensada para forzar el ancho completo SOLO en móvil — vive dentro de
`@media only screen and (max-width:599px)` en `_shell.html`, como tap-target de accesibilidad.
Pero como el `width:100%` ya estaba puesto LITERAL en el HTML, la media query no cambiaba nada:
el botón era ancho completo siempre, en cualquier pantalla, sin importar cuánto texto llevara la
etiqueta. Es la causa real de que un CTA corto se viera enorme — no el tamaño de fuente ni el
padding (eso ya estaba bien tokenizado desde la ronda anterior), sino que la cápsula de color
nunca se ajustaba a su contenido. El mismo patrón exacto estaba en `cta-secondary-bulletproof.html`
(el CTA outline de `intro-cta*`/`category-grid*`).

Es, con cierta ironía, la misma ronda que se tituló "CTAs siempre enormes" (2026-07-24) la que
corrigió el tamaño de fuente/padding pero dejó sin tocar la causa más visible del mismo problema.

### Fix

Quitado el `style="width:100%"` inline de la tabla exterior en ambos componentes —
`cta-bulletproof.html` y `cta-secondary-bulletproof.html`. `class="mobile-full"` se mantiene sin
cambios. Resultado: una tabla `role="presentation"` sin ancho explícito se ajusta de forma nativa
a su contenido (comportamiento estándar del patrón "bulletproof button" en email — no es una
técnica nueva ni experimental), así que en desktop el botón encoge al tamaño real del texto +
padding; en móvil, `.mobile-full` sigue forzando el ancho completo para el tap-target, sin
cambios ahí. La tabla contenedora que envuelve el include (en `hero-imagen.html`,
`banda-cierre*.html`, etc.) sigue siendo `width="100%"` — eso es correcto y no se toca: es el
contenedor que centra el botón, no el botón en sí.

### Verificación

Rebuild de las 10 campañas reales que usan `cta-bulletproof`/`cta-secondary-bulletproof`
(adeslas, bmw, nike ×2, optica2000, spotify, tarifalo ×2, uax, wornwear): las 10 cambian de hash
(esperado — todas usan el componente). `check-engine-integrity.ts -- --update` tras esta entrada.
`production-gate-motor.ts` verde en las campañas ya certificadas antes de este cambio, mismo
baseline de fallos preexistentes sin variación.

### Nota — esto no cierra la conversación sobre "por qué se ve genérico"

Este fix resuelve un síntoma concreto y verificable (el botón desproporcionado), pero no es la
única causa. En la misma revisión se identificaron otras dos, pendientes de trabajo futuro:
1. 8 de las 9 marcas reales declaran `typography.displayFont` como "Arial, Helvetica, sans-serif"
   puro — sin fuente web propia — aunque el motor ya soporta `@font-face` real (probado con
   'Sora' para tarifalo). Es probablemente la causa de mayor impacto en la percepción de
   "genérico" y no se aborda en esta entrada.
2. El repertorio de formas de los componentes (caja centrada, píldora, texto centrado) es el
   mismo para las 9 marcas — solo cambian color/radio/padding, no la silueta. Tampoco se aborda
   aquí.


## El prompt de generate-hero-image ignoraba photography.usesRealPhotography (2026-07-25)

### Qué pasó

Con el CTA ya corregido, se probó por primera vez en toda la sesión generar de verdad el arte del
hero de una campaña (Worn Wear) — hasta este punto siempre se había quedado en placeholder
`PENDING-CDN-UPLOAD`, sin revisar nunca visualmente la salida real del pipeline de IA. El
resultado: una ilustración plana estilo serigrafía/riso (una persona con chubasquero naranja y un
perro sobre una roca, montañas en silueta) — no una fotografía, pese a que el brand pack de Worn
Wear declara `photography.usesRealPhotography: true` con un `treatment` detallado ("fotografía
lifestyle de exterior... auténtico, sin filtros... la fotografía lleva el peso visual de la
comunicación"), verificado por el agente 02 contra el sitio real.

La causa, en `scripts/generate-hero-image.ts`: el prompt enviado a la API de imágenes tenía
literalmente `"Flat modern editorial illustration..."` escrito sin condición, para las 9 marcas
por igual. El script nunca leía `pack.photography` — ni `usesRealPhotography` ni `treatment`.
Es exactamente la misma familia de bug que el H1 de `hero-imagen` y el ancho del CTA: un campo
investigado y verificado en el brand pack, ignorado por completo por la pieza del sistema que
debía leerlo. Con esta causa, NINGUNA marca del sistema podía recibir jamás una foto real del
hero — el prompt se lo impedía a todas, sin importar lo que dijera su pack.

### Fix

El prompt ahora lee `pack.photography.usesRealPhotography`. Si es `true`, construye una
instrucción de estilo fotográfico real (lente, iluminación, profundidad de campo, grano,
color de rango completo — explícitamente "NOT an illustration, NOT a flat graphic or vector
treatment, NOT a screen-print/riso poster look", porque el modelo por defecto tiende a esa
estética si no se le prohíbe) e incorpora el `photography.treatment` verificado del pack
directamente en el prompt. Si no lo declara (o es `false` — packs legacy o marcas
genuinamente de identidad gráfica plana), mantiene el comportamiento anterior de ilustración
plana, que deja de ser el default universal para pasar a ser una opción real para quien la tiene.

### Verificación

Sintaxis verificada (`tsc`, `tsx` carga y valida argumentos sin error). No se pudo regenerar la
imagen desde este entorno — el sandbox de Cowork no tiene salida de red a `api.openai.com` ni
puede lanzar Playwright (falta una librería del sistema, sin permisos para instalarla) — así que
la generación y revisión visual del fix se hizo en el entorno local del usuario, con
`OPENAI_API_KEY` real.

**Resultado confirmado por el usuario (2026-07-25):** regenerado el hero de Worn Wear con el
prompt corregido (mismo `--theme`, misma marca, misma URL de anclaje) → fotografía real de
lifestyle outdoor (Land Rover clásico, luz dorada, dos personas con chaquetas naranjas, playa
volcánica y montaña), grano y profundidad de campo fotográficos reales, sin aspecto de ilustración
ni de imagen de stock genérica de IA. Confirma el fix. Beneficia también a Nike y BMW (las otras
2 marcas reales con `usesRealPhotography: true`) — antes de este fix, ninguna marca del sistema
podía recibir jamás una foto real, el prompt se lo impedía a las 9 por igual.

Pendiente (fuera del alcance de esta entrada): subir el PNG a CDN propio y actualizar
`modules[0].data.bannerSrc` en `newsletters/2026/wornwear/2026-jul-wornwear-usado/06-data/campaign-data.json`
— sigue apuntando a `PENDING-CDN-UPLOAD`.


## Tipografía real por marca: de un hardcode global a un mecanismo de verdad (2026-07-25)

### Qué pasó

Con el CTA y el hero ya corregidos, quedaba la tercera causa identificada de "se ve genérico":
8 de las 9 marcas reales del sistema declaraban `typography.displayFont` como Arial/Helvetica
puro, sin ninguna fuente web propia — pese a que el motor ya tenía un mecanismo de `@font-face`
funcionando (usado por una sola marca, tarifalo, con la fuente 'Sora'). El bloque de Sora vivía
literalmente escrito dentro de `engine/components/_shell.html` — la plantilla envolvente que
comparten TODAS las campañas — así que las otras 8 marcas cargaban igualmente ese `@font-face`
sin usarlo nunca (peso muerto, inofensivo pero sin sentido), y no había forma de darle una fuente
propia a ninguna otra marca sin repetir el mismo hardcode a mano por cada una.

### Fix — el mecanismo

1. `lib/assemble.js` gana `buildFontFaceCSS(tokens)`: lee `tokens.typography.webFont` (si el pack
   lo declara — `{ family, weights: [{weight, url, unicodeRange}] }`) y genera los bloques
   `@font-face` correspondientes. Sin ese campo, devuelve `''` — la marca sigue con su fallback de
   sistema, sin @font-face alguno.
2. `_shell.html` cambia el hardcode de Sora por `{{slot:fontface}}` — mismo mecanismo de
   sustitución literal que ya usa `{{slot:body}}` (reemplazo de texto ANTES de `renderTemplate`,
   para que las URLs con posibles `&` no pasen por el escapado HTML de `{{data:}}`).
3. `assembleNewsletter` calcula `fontFaceCSS` una vez por build y lo inyecta en el shell.
4. El bloque real de Sora se movió tal cual (mismas 2 URLs, mismos pesos) a
   `brands/tarifalo/tokens/brand-tokens.json` como su propio `typography.webFont` — es la marca
   que ya lo usa, ahora es un dato de SU pack, no un hardcode del motor.

### Fuentes elegidas — piloto en 3 marcas (Worn Wear, Nike, BMW)

Las 3 marcas reales con `photography.usesRealPhotography: true` (las que más se benefician de
tipografía con carácter, porque ya no dependen de iconos ni de relleno decorativo). Ninguna de
las 3 tiene su fuente real disponible para email — todas son propietarias — así que se buscó un
sustituto real y verificado, nunca "lo que quede bien a ojo":

| Marca | Fuente real (propietaria, no embebible) | Sustituto elegido | Por qué |
|---|---|---|---|
| Worn Wear | RidgewaySans — interna de Patagonia desde 2025, no pública (verificado por búsqueda web) | **IBM Plex Sans** | Grotesco inspirado en Franklin Gothic (terminales angulados, 'g' de doble piso, esqueleto mecánico con toques humanistas) — mismo carácter de grotesco funcional que un custom de marca outdoor. Pesos 300/500/700 calcan la jerarquía que el pack ya declaraba para RidgewaySans. |
| Nike | Helvetica Now Display/Text — licencia comercial Monotype (observado en su web) | **Inter** | 88% de similitud citada con Helvetica Now (fontalternatives.com/compare/inter-vs-helvetica-now) — mismo carácter neo-grotesco neutro y aperturas cerradas; Inter tiene algo más de x-height (optimizado a pantalla) y terminales menos estrictamente rectos que Helvetica. |
| BMW | bmwTypeNextWeb — propiedad de BMW AG (observado en su web) | **Titillium Web** | BMW TypeNext se documenta con formas rectangulares y precisión geométrica (GitHub awesome-design-md/bmw/DESIGN.md). Titillium Web es un sans geométrico descrito con el mismo carácter ("formas cuadradas, vibra tecnológico, se siente engineered"). Peso 300 coincide con el que el pack ya usa para el H1 del hero. |

Las 3 URLs de `fonts.gstatic.com` por marca (9 en total) se obtuvieron de la propia API CSS2 de
Google Fonts (`fonts.googleapis.com/css2?family=...`) vía Chrome real, extrayendo el bloque
`/* latin */` de cada peso — no copiadas de una tabla de terceros — y verificadas HTTP 200 una a
una antes de escribirlas en los packs.

### Verificación

Rebuild de las 15 campañas reales:
- adeslas, optica2000, uax, spotify: sin `typography.webFont` declarado → único cambio es que el
  `@font-face` de Sora (que nunca usaban) desaparece de su HTML — nada más difiere.
- tarifalo (2 campañas): 2 bloques `@font-face` de Sora, ahora leídos desde su propio pack en vez
  de hardcode del motor — mismas URLs, mismos pesos.
- bmw, nike (2 campañas), wornwear: 3 bloques `@font-face` nuevos cada una (Titillium Web / Inter
  / IBM Plex Sans respectivamente), confirmado en el HTML que `typography.displayFont` ya
  referencia la fuente nueva con el fallback de sistema detrás.

`check-engine-integrity.ts -- --update` tras esta entrada. `production-gate-motor.ts` verde en
las campañas certificadas antes de este cambio, mismo baseline de fallos preexistentes.

### Nota — degradación esperada, no un fallo

`@font-face` en email es un terreno de "mejora progresiva": Apple Mail/iOS Mail lo soportan bien,
Gmail (web) y Outlook de escritorio clásico lo ignoran y caen al fallback (`Arial, Helvetica,
sans-serif`, que sigue ahí en la cadena). No es una regresión ni un riesgo — es exactamente cómo
ya funciona el resto del sistema (grados de degradación documentados en VML, gradientes
bulletproof, etc.): quien lo soporta ve la fuente de marca, quien no, ve lo mismo que veía antes.


## Vocabulario de formas de CTA + bug de letter-spacing sin unidad (2026-07-25)

Cuarta y última causa investigada de la ronda "se sigue viendo genérico" (junto a CTA
sobredimensionado, hero-imagen forzado a ilustración, y tipografía de sistema — ver las 3
entradas anteriores de este changelog, todas del mismo día). Cierre de la ronda: dos piezas de
motor nuevas, un hallazgo de bug real detectado en la propia verificación (no reportado por el
usuario), y una decisión deliberada de NO aplicar lo construido a ninguna marca real todavía.

### Vocabulario de formas — qué se construyó

Hasta ahora el motor solo tenía pastilla sólida (`cta-bulletproof.html`) y pastilla outline
(`cta-secondary-bulletproof.html`, ver entrada "Jerarquía de CTA", 2026-07-24) — dos PESOS
visuales de la misma FORMA. Se añaden 2 siluetas nuevas:

- `cta-text-link-bulletproof.html` — texto subrayado + flecha "→", sin cápsula de color. Sin
  bloque VML (un link de texto no necesita el parche de Outlook clásico).
- `cta-block-bulletproof.html` — bloque sólido, `border-radius:0` fijo (deliberadamente NO lee
  `radius.ctaPill` — el punto es una silueta arquitectónica distinta, no una pastilla de radio
  bajo, que ya cubre `cta-bulletproof.html` con el radius real de cada marca).

Mecanismo de selección — `resolveIncludeAlias(name, tokens)` en `lib/assemble.js`: intercepta el
`{{include:cta-bulletproof}}` / `{{include:cta-secondary-bulletproof}}` "canónico" que ya escribe
cada plantilla, y si el pack declara `components.cta.style` / `components.ctaSecondary.style` =
`"text-link"` | `"block"`, redirige a leer el archivo alternativo — sin tocar ninguna plantilla
existente. Sin ese campo (comportamiento por defecto), `resolveIncludeAlias` devuelve el nombre
sin cambios: cero impacto en las 9 marcas reales actuales. Verificado con un script Node
sintético cubriendo resolución sin token, con `text-link`/`block` pedidos, con un valor no
reconocido (fallback seguro), y `renderTemplate()` end-to-end para las 3 formas.

### Por qué NINGUNA marca real usa esto todavía — la parte importante de esta entrada

El hallazgo honesto de esta ronda: se investigó con Chrome real si Worn Wear, Nike o BMW (las 3
candidatas más obvias, por identidad minimalista) usan alguna de estas 2 siluetas en sus sitios
reales — y **las 3 usan pastilla/botón sólido real**, no texto plano ni bloque de esquina recta.
"La marca se ve plana/minimalista" no es evidencia de que su CTA sea un link de texto; hay que
verlo en el propio botón. Aplicar estas siluetas a cualquiera de las 3 sin esa evidencia habría
sido exactamente el tipo de error que motivó esta ronda entera: inventar una diferenciación de
marca en vez de investigarla. Las 2 piezas quedan en el motor, documentadas
(`engine/components/INVENTORY.md`, `patterns/institutional.md` §8.1,
`agents/02-brand-visual-analyst.md` — sub-checklist de CTA), disponibles para la marca que sí lo
verifique en el futuro. Ningún `campaign-data.json`/`brand-tokens.json` real cambia por esta
pieza — impacto esperado en las 15 campañas reales: **cero bytes**.

### Bug encontrado en la propia verificación — letter-spacing sin unidad

Al escribir `cta-text-link-bulletproof.html`/`cta-block-bulletproof.html` con
`letter-spacing:{{token:typography.cta.letterSpacing}};` (mismo patrón que ya usaba
`cta-bulletproof.html` desde siempre), el rebuild+grep de verificación reveló que 3 marcas
(`nike`, `spotify`: `0`; `wornwear`: `-0.2`) guardan ese valor como NÚMERO crudo en su pack, no
como string con unidad. Por especificación CSS, `letter-spacing` con un valor no-cero sin unidad
es inválido y el navegador lo ignora, cayendo a `normal` — es decir, el `-0.2px` de Worn Wear,
investigado y tokenizado con cuidado, **nunca se había aplicado en ningún render de toda la
sesión**, en ninguna campaña, desde que el token existe. Nadie lo reportó porque visualmente
`normal` y `-0.2px` son casi indistinguibles a simple vista — exactamente el tipo de bug que solo
aparece verificando el CSS generado, no mirando la captura.

**Primer intento de fix, descartado por incorrecto:** añadir `px` directamente en las 3
plantillas (`letter-spacing:{{token:...}}px;`). Roto de inmediato para `adeslas`/`uax`/
`optica2000`, cuyo valor real es el string `"normal"` — produce CSS inválido
`letter-spacing:normalpx;`. Detectado por el mismo rebuild+grep antes de reportarlo, nunca llegó
a mostrarse como bueno.

**Fix correcto — a nivel de dato, no de plantilla:** revertidas las 3 plantillas a la inserción
cruda del token (igual que estaba). Normalizados los 3 packs con el valor mal tipado:
`nike`/`spotify` → `"0px"` (string), `wornwear` → `"-0.2px"` (string). Verificado con rebuild +
grep de `letter-spacing:` sobre las 15 campañas reales: todos los valores resultantes son CSS
válido (`normal`, `0.5px`, `0.3px`, `-0.2px`, `0px`, etc.), ninguno unitless-no-cero, ninguno
`normalpx`.

### Verificación final de la ronda

`check-engine-integrity.ts -- --update` tras esta entrada (recoge `_shell.html`,
`lib/assemble.js`, los 2 componentes nuevos, y los 3 brand packs con letterSpacing corregido).
`production-gate-motor.ts` re-ejecutado sobre wornwear, nike (2 campañas), bmw, spotify — verde,
mismo baseline de hallazgos preexistentes que antes de esta ronda. Byte-parity confirmado para
adeslas/uax/optica2000/tarifalo (2): sin cambio alguno, ni por el mecanismo de siluetas (nadie lo
usa) ni por el fix de letter-spacing (sus valores ya eran string con unidad o `"normal"`).

### Balance de la ronda completa "se sigue viendo genérico" (2026-07-25)

Las 4 causas identificadas al inicio de la ronda, resumidas: (1) CTA forzado a `width:100%` en
desktop — corregido, se ajusta al texto. (2) Prompt de `generate-hero-image` forzaba ilustración
para las 9 marcas sin mirar `photography.usesRealPhotography` — corregido y confirmado por el
usuario con una regeneración real. (3) 8/9 marcas sin fuente web propia, todo en Arial/Helvetica
de sistema — corregido con `@font-face` real piloto en Worn Wear/Nike/BMW. (4) Vocabulario de
formas de CTA rígido — el mecanismo existe, pero la investigación real mostró que ninguna marca
piloto lo necesita todavía; queda disponible, no forzado. Y un bug adicional encontrado en el
propio proceso de verificación (letter-spacing sin unidad), no parte del diagnóstico original
pero corregido en la misma ronda por aparecer en el camino.
---

## Nota de recuperacion posterior al bloque literal (2026-07-27)

Las entradas siguientes proceden de reconstruccion documentada tras el incidente y de fragmentos
presentes en las sesiones Codex/Hermes. No son una copia byte-a-byte demostrada del archivo
original completo, pero recogen cambios reales del sistema que faltan en los bloques literales
recuperados hasta 2026-07-25.

## 2026-07-27 — Evolucion brand-native: editorial-foto-texto*, brandStructure y gate de diferenciacion estructural

### Problema detectado

Las newsletters generadas para Audi, BMW, Worn Wear, Nike y otras marcas compartian demasiada
estructura: hero, intro, tres columnas, cierre y footer. Aunque cambiaban colores, fuentes e
imagenes, el sistema tendia a producir una plantilla generica con piel de marca.

El objetivo nuevo del sistema es que cada newsletter parezca creada por el equipo de la marca
de referencia, trasladando no solo tokens visuales, sino tambien ritmo, composicion, jerarquia,
tratamiento fotografico y modo de presentar informacion.

### Nuevos componentes: `editorial-foto-texto` y `editorial-foto-texto-inverso`

Dos componentes editoriales de imagen+texto en columnas (46/54%), para que las newsletters
puedan replicar la estructura editorial real de marcas como Worn Wear (foto + texto breve),
Apple (foto producto + titular escueto) y Nike (imagen + copy minimal), en vez de forzar todo
el contenido a pasar por `intro-cta` (texto solo).

- `editorial-foto-texto.html`: imagen izquierda, texto derecho (eyebrow + titulo + cuerpo + CTA).
- `editorial-foto-texto-inverso.html`: texto izquierda, imagen derecha, con el mismo contrato
  de datos.
- Mobile: apilan via `.mobile-stack` (imagen arriba en normal, texto arriba en inverso).
- CTA contextual via `{{include:cta-secondary-bulletproof}}` (outline, mismo tratamiento que
  `intro-cta`/`category-grid`; no compite con el ask principal del hero/banda-cierre).
- Contrato de datos: `{imageSrc, imageAlt, eyebrow, title, body, cta}`.
- Adaptador compartido en `lib/assemble.js` (el layout cambia solo en la plantilla HTML).
- Añadidos al `PATTERN_SEQUENCE` de `patterns/fotografia-primero.md` como zona libre opcional
  (max 3).

Repetir `intro-cta` sin justificacion queda desaconsejado. Cuando haya imagenes secundarias
utiles, deben preferirse estos componentes editoriales.

### Contrato de datos

```json
{
  "component": "editorial-foto-texto",
  "data": {
    "imageSrc": "https://...",
    "imageAlt": "Descripcion de la imagen",
    "eyebrow": "Detalle",
    "title": "Titular editorial",
    "body": "Texto breve",
    "cta": {
      "label": "Ver mas",
      "href": "https://..."
    }
  }
}
```

### Gate 12: `check-structural-differentiation.ts`

Nuevo script que verifica que la newsletter no es una mera copia de la secuencia por defecto
del patron. Comprueba:

1. Existe `03-strategy/brand-structure-translation.md`.
2. El archivo cita `layout.contentRhythm` o `layout.brandStructure`.
3. Mapea al menos 2 secciones reales de la pagina a modulos del email.
4. Si una campana `fotografia-primero` repite `intro-cta` 2+ veces, debe justificarlo.
5. Si la secuencia coincide exactamente con la comodin sin usar `editorial-foto-texto*`, debe
   existir justificacion explicita.
6. Si la pagina real documenta editorial como traducible y la campana no lo usa, avisa.

Integrado como Gate 12 en `scripts/production-gate-motor.ts`, despues de `hero-decision`.
En campanas de test emite warnings; en produccion puede fallar si falta el archivo de
traduccion estructural o la secuencia es claramente clonada sin justificacion.

### Nuevo campo `layout.brandStructure` en brand packs

El agente 02 debe crear `layout.brandStructure` ademas de `layout.contentRhythm`:

```json
{
  "brandStructure": {
    "compositionArchetype": "editorial-foto-texto | producto-cinematico | grid-catalogo | comparador | institucional-denso",
    "signatureSections": [
      {
        "sourceSection": "...",
        "visualPattern": "...",
        "emailTranslation": "...",
        "why": "..."
      }
    ],
    "mustAvoid": [],
    "source": "URL + fecha"
  }
}
```

Esto alimenta a 03 para que no pueda elegir la secuencia por defecto sin justificarla.

### Actualizaciones de agentes

- 02 (Brand Visual Analyst): anadida tarea 6, `layout.brandStructure` como nuevo campo.
- 03 (Newsletter Architect): nuevo entregable `03-strategy/brand-structure-translation.md`
  con mapeo seccion -> modulo. Se bloquea si solo propone secuencia por defecto sin
  justificarla.
- 04 (Email Designer): tarea 6, especificar que rasgo de cada modulo viene de la pagina real.
- 06 (Data Specialist): tabla actualizada con `editorial-foto-texto*`, validacion HTTPS para
  `imageSrc`, prohibicion explicita de `file://`.

### Schema actualizado

`engine/schema/campaign-data.schema.json`: anadida rama `oneOf` para
`editorial-foto-texto`/`editorial-foto-texto-inverso` con campos:

- `imageSrc` (`httpsUrl`)
- `imageAlt`
- `eyebrow`
- `title`
- `body`
- `cta`

### Lock del motor

Tras anadir componentes, adaptadores y schema, debe regenerarse `engine/components.lock.json`
con `npm run check-engine -- --update` y verificarse de nuevo con `npm run check-engine`.
El lock es parte del contrato de integridad del motor: si cambia un componente sin lock
actualizado, Gate 0 debe bloquear.

---

## 2026-07-27 — `generate-hero-image`: sanitizacion y trazabilidad de OpenAI Images

### Problema detectado

En una campana BMW, el modo `--source landing` genero una descripcion visual desde la pagina
real que incluia terminos asociados a personajes protegidos y entretenimiento. OpenAI Images
devolvio:

```text
HTTP 400
error.code: moderation_blocked
error.type: image_generation_user_error
```

El primer fallo no dejo prompt recuperable porque el script solo guardaba el prompt final tras
exito.

### Cambios

- `hero-banner-prompt-attempt.txt` se guarda siempre antes de llamar a la API.
- `hero-banner-visual-description.txt` guarda la descripcion raw de la pagina cuando hay
  anclaje.
- `hero-banner-visual-description-sanitized.txt` guarda la version depurada.
- `hero-banner-error.json` guarda diagnostico estructurado de fallos.
- Se introdujo `sanitizeLandingPrompt()`.

### Datos guardados en errores

`hero-banner-error.json` debe incluir, cuando esten disponibles:

- `httpStatus`
- `errorType`
- `errorCode`
- `errorMessage`
- `xRequestId`
- `openaiOrganization`
- `openaiProject`
- `model`
- `size`
- `quality`
- `sourceMode`

### Sanitizacion

La funcion elimina o neutraliza:

- personajes o referencias de comic/pelicula;
- logos, emblemas y modelos identificables;
- lenguaje de copia literal de landing;
- precios, URLs y matriculas;
- referencias que puedan sonar a recreacion exacta de material protegido.

La direccion de arte queda formulada como referencia conceptual, no como replica.

---

## 2026-07-27 — Hardening operativo: template, package, tests y contexto Hermes

### Template de campana

`newsletters/_campaign-template/` debe crear `06-data/campaign-data.json`, no solo estructuras
heredadas del pipeline React Email.

### Package scripts

El cierre real de produccion queda claro:

```bash
npm run production-gate-motor -- --campaign ...
```

`production-gate` queda como alias hacia el gate del motor. Los comandos del pipeline anterior
se mantienen solo como `legacy:*` cuando sea necesario para trazabilidad.

### `npm test`

Se anadio un test runner real:

```bash
npm test
```

Debe ejecutar la suite Node (`node --test`) y cubrir, como minimo, librerias del motor y tests
smoke disponibles.

### Contexto Hermes

`PROMPT-CONTEXTO-HERMES.md` se actualizo para reflejar:

- 3 patrones activos;
- gates vigentes del motor;
- fallback `EACCES` ya implementado/documentado;
- `production-gate-motor` como cierre real.

### Limpieza de entregable

El paquete entregable no debe incluir:

- `.env`
- `node_modules`
- `.DS_Store`
- `npx`
- carpetas generadas tipo `hermes-newsletter-system@0.1.0`
- outputs de test no necesarios

### Checks reforzados

- `scripts/check-contrast.ts`: incluye contraste de links secundarios en `card-tarifa*`.
- `engine/components/card-tarifa*.html`: el link secundario usa `colors.primary`.
- `scripts/check-column-balance.ts`: bloquea titulos de cierre demasiado largos para evitar
  saltos de linea pobres en 600px.
---

## Nota operativa posterior al incidente (2026-08-01)

Las entradas siguientes no forman parte del historico preincidente: documentan el propio
incidente de perdida del changelog y el componente `metric-strip-premium` generado durante la
ronda en la que ocurrio la sobrescritura. Se incluyen aqui solo para dejar una version util como
changelog actual del proyecto.

## 2026-08-01 — `metric-strip-premium` para metricas premium automotrices

### Motivo

La campana `newsletters/2026/audi/2026-ago-audi-brand-native-a6-etron-test/` evidencio que
`columns-3-beneficios-sin-icono` seguia imponiendo una estructura generica para datos tecnicos:
tres columnas con caja highlight inferior. Esa composicion no encajaba con una newsletter
premium automotriz, donde las metricas de producto deben sentirse como una tira editorial
limpia, no como cards promocionales.

### Creado

- `engine/components/metric-strip-premium.html`
- Adaptador en `engine/lib/assemble.js`
- Rama `oneOf` en `engine/schema/campaign-data.schema.json`
- Inclusion en `patterns/fotografia-primero.md`
- Verificacion en `scripts/check-structural-differentiation.ts`

### Contrato de datos

```json
{
  "component": "metric-strip-premium",
  "data": {
    "title": "Tecnologia que impulsa el futuro.",
    "items": [
      { "value": "340 kW", "label": "Potencia Launch Control" },
      { "value": "4,5 s", "label": "Aceleracion 0-100 km/h" },
      { "value": "773 km", "label": "Autonomia WLTP estimada" }
    ]
  }
}
```

### Reglas visuales

- Sin iconos.
- Sin caja highlight.
- Sin fondo decorativo.
- Números protagonistas.
- Labels breves.
- Fondo blanco limpio.
- Mobile apilado con `mobile-stack`.

### Gate 12 endurecido

`scripts/check-structural-differentiation.ts` incorpora un check que detecta metricas tecnicas
en `columns-3-beneficios-sin-icono` (`kW`, `km`, `s`, `%`, `CV`, `V`, `Nm`). Si hay uso
mayoritario de metricas, recomienda `metric-strip-premium`. En campanas `productionReady:true`
debe bloquear si no existe justificacion documentada.

---

## 2026-08-01 — Incidente `engine/CHANGELOG.md` y nueva politica de backup

### Que ocurrio

Durante una correccion de la campana Audi brand-native, `engine/CHANGELOG.md` fue sobrescrito
accidentalmente. El archivo paso de aproximadamente 2.777 lineas / 189 KB a una version mucho
mas corta. No existia backup textual completo recuperable en git, Time Machine, editor history,
trash, temporales, `_archive/`, copias `.tgz`, zips, sesiones Hermes ni carpetas de analisis.

### Estado real

- No se pudo restaurar textualmente el original.
- Se reconstruyo una version semantica con las entradas historicas principales.
- Se creo `docs/incidente-changelog-engine-2026-08-01.md`.
- Se actualizo `memory.md` con el incidente y su alcance real.
- Se creo `_archive/changelog-backups/` como ubicacion de backups futuros.
- Se abrio/definio la tarea `task_changelog_backup` para convertir la regla en mecanismo
  ejecutable.

### Decision

El changelog debe tratarse desde ahora como documento critico de infraestructura. Cualquier
cambio debe hacerse con backup previo y edicion incremental. Esta entrada no culpa a una
campana ni al motor: el fallo fue de procedimiento de documentacion.

