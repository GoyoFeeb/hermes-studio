# Changelog — engine/

> ⚠️ **INCIDENTE 2026-08-01**: Este changelog fue truncado accidentalmente (pasó de ~2777 líneas a ~148)
> durante la corrección de la campaña Audi brand-native. A continuación se reconstruyen todas las
> entradas históricas desde la documentación disponible del proyecto, archivos de archive, y
> memoria operativa del sistema. Las secciones marcadas como "[RECUPERADO]" pueden no ser
> textualmente idénticas al original, pero preservan todo el contenido semántico del motor.
> Ver `memory.md` → Known Gotchas para el incidente completo.

---

## 2026-08-01 — [NUEVO] `metric-strip-premium`: nuevo componente para métricas premium automotrices

### Componente nuevo: `engine/components/metric-strip-premium.html`

Creado por una campaña real (Audi A6 Sportback e-tron). El componente existente `columns-3-beneficios-sin-icono` añadía una caja highlight inferior con "100% eléctrica" y usaba `surfaces.sectionLila` como fondo — estructura que contradice el diseño editorial limpio de las stats strips de marcas automotrices. Este componente es la representación correcta:

- **Sin caja highlight** — solo números grandes + labels breves.
- **Sin iconos** — las métricas son el contenido, no un adorno.
- **Fondo blanco limpio** (`surfaces.white`) — no `surfaces.sectionLila`.
- **Mobile**: apila en una columna (`.mobile-stack`).
- **Contrato de datos**: `{ title, items: [{ value, label }] }`.
- **Adaptador** en `lib/assemble.js`: `metricSection.title` + `metricItems` con `withCellGeometry`.
- **Schema**: nuevo `oneOf` en `campaign-data.schema.json`.
- **Patrón**: añadido a `patterns/fotografia-primero.md` (PATTERN_SEQUENCE + tabla + §3).
- Tests actualizados (31 tests, 0 fail).

### Gate 12 endurecido: `check-structural-differentiation.ts`

Añadido Check 7: si una campaña `fotografia-primero` usa `columns-3-beneficios-sin-icono` para items cuyos títulos son mayoritariamente métricas (kW, km, s, %, CV, V, Nm), emite advertencia y recomienda `metric-strip-premium`.

### Campaña Audi actualizada

`2026-ago-audi-brand-native-a6-etron-test`: sustituido `columns-3-beneficios-sin-icono` por `metric-strip-premium`. Eliminado highlight "100% eléctrica". Tira de métricas limpia con fondo blanco.

---

## 2026-07-27 — [RECUPERADO] Evolución brand-native: editorial-foto-texto*, brandStructure y gate de diferenciación estructural

### Nuevos componentes: `editorial-foto-texto` y `editorial-foto-texto-inverso`

Dos componentes editoriales de imagen+texto en columnas (46/54%), para que las newsletters puedan replicar la estructura editorial real de marcas como Worn Wear (foto + texto breve), Apple (foto producto + titular escueto) y Nike (imagen + copy minimal), en vez de forzar todo el contenido a pasar por `intro-cta` (texto solo).

- **`editorial-foto-texto.html`**: imagen izquierda, texto derecho (eyebrow + título + cuerpo + CTA).
- **`editorial-foto-texto-inverso.html`**: texto izquierda, imagen derecha — mismo contrato de datos.
- Mobile: apilan via `.mobile-stack`.
- CTA contextual via `{{include:cta-secondary-bulletproof}}`.
- Contrato de datos: `{imageSrc, imageAlt, eyebrow, title, body, cta}`.
- Adaptador compartido en `lib/assemble.js`.
- Añadido al `PATTERN_SEQUENCE` de `patterns/fotografia-primero.md` (max 3).

### Gate 12: `check-structural-differentiation.ts` (diferenciación estructural)

Nuevo script con 6 checks (posteriormente 7):
1. Existe `03-strategy/brand-structure-translation.md`.
2. Cita `layout.contentRhythm` o `layout.brandStructure`.
3. Mapea al menos 2 secciones reales a módulos.
4. Si `fotografia-primero` repite `intro-cta` 2+ veces, debe justificarlo.
5. Secuencia idéntica a comodín sin editorial → justificación requerida.
6. Página real con foto+texto traducible y campaña no lo usa → aviso.
7. (Añadido 2026-08-01) Detección de métricas en `columns-3-beneficios-sin-icono`.

Integrado como Gate 12 en `scripts/production-gate-motor.ts`.

### Nuevo campo `layout.brandStructure` en brand packs

El agente 02 debe crear `layout.brandStructure` con `compositionArchetype`, `signatureSections` y `mustAvoid`.

### Actualizaciones de agentes

- 02: añadida tarea 6 — `layout.brandStructure`.
- 03: nuevo entregable `brand-structure-translation.md`.
- 04: tarea 6 — especificar rasgo de página real por módulo.
- 06: tabla actualizada con `editorial-foto-texto*`, validación HTTPS para `imageSrc`.

### Schema actualizado

`campaign-data.schema.json`: añadida rama `oneOf` para `editorial-foto-texto`/`editorial-foto-texto-inverso`.

---

## 2026-07-27 — [RECUPERADO] `generate-hero-image`: sanitización y trazabilidad de prompts

- Script guarda `brands/{brand}/design-input/hero-banner-prompt-attempt.txt` siempre (antes y después de llamar a API).
- Nueva capa `sanitizeLandingPrompt()`: transforma descripciones de landing en dirección de arte segura antes del prompt final. Elimina personajes, logos, emblemas, matrículas, modelos identificables y lenguaje "copiar/recrear la landing".
- En fallos de OpenAI Images, guarda `hero-banner-error.json` con `httpStatus`, `errorType`, `errorCode`, `errorMessage`, `xRequestId`.
- Guarda `hero-banner-visual-description.txt` y `hero-banner-visual-description-sanitized.txt` cuando hay anclaje a página real.

---

## 2026-07-25 — [RECUPERADO] Varios fixes de componentes y brand packs

### `hero-imagen`: H1 ahora respeta `typography.hero.h1` del brand pack

Hallazgo durante el test de Worn Wear: el H1 y nombre de marca vivían con colores/tamaño/peso hardcodeados (#FFFFFF/28px/800) en la plantilla, aunque el pack ya declaraba `typography.hero.h1.{color,size,weight,lineHeight}` desde antes (Worn Wear, Spotify, Nike, BMW). El adaptador de `hero-imagen` ahora lee estos valores con fallback a los hardcodeados para packs que aún no los declaran (ej. tarifalo).

### Vocabulario de formas de CTA

`components.cta.style` permite `"text-link"` o `"block"` como alternativas a la pastilla sólida por defecto. `resolveIncludeAlias()` en assemble.js traduce includes canónicos (`cta-bulletproof`) al archivo real según el brand pack, sin tocar las plantillas.

### Tipografía real por marca

`buildFontFaceCSS()` en assemble.js genera bloques `@font-face` dinámicamente a partir de `typography.webFont` del brand pack. Antes Sora estaba hardcodeado en `_shell.html` para todas las marcas.

### INVENTORY.md

Creado `engine/components/INVENTORY.md` con documentación de cada componente, tokens que consume, campos de datos y notas de compatibilidad email.

---

## 2026-07-24 — [RECUPERADO] Liberación de gramática, columnas flexibles, Nivel 3 de marca

### PATTERN_SEQUENCE como gramática

El bloque `PATTERN_SEQUENCE` pasa de lista rígida (orden fijo) a gramática con anclas (posiciones fijas: header, hero, banda-cierre, footer) y zonas libres (cuerpo: orden libre, repetible). engine/lib/pattern.js se actualiza para parsear esta gramática.

### Columnas flexibles

`balancedRows()` y `withCellGeometry()` en assemble.js: reparten N ítems en filas equilibradas, calculando `colWidth` y `cellPad` por celda. Generaliza el mecanismo que `category-grid` ya usaba. Permite a cualquier módulo con lista de ítems tener conteos variables sin hardcodear.

### Nuevos componentes

- `columns-3-beneficios-sin-icono.html` (BMW): variante sin icono, fondo surfaces.sectionLila.
- `usp-cards.html`, `usp-cards-sin-icono.html`, `usp-cards-asimetrico.html`, `usp-cards-sin-icono-asimetrico.html`.
- `intro-cta-asimetrico.html`, `banda-cierre-asimetrico.html`.
- `cta-text-link-bulletproof.html`, `cta-block-bulletproof.html`.

### Nivel 3 de marca

`layout.contentRhythm`, `photography.treatment`, `iconography.style`/`componentImplication`, `voice.rhythm` se añaden como campos obligatorios del brand pack (observación con Chrome real, no inferencia).

### check-hero-decision.ts (Gate 11)

Verifica que `hero-imagen` se evalúa siempre (2 preguntas: URL real + `photography.usesRealPhotography`). Si ambas son Sí, la elección por defecto es `hero-imagen`. Integrado en production-gate-motor.

### check-column-balance.ts

Verifica equilibrio visual de columnas (ratio ≤ 1.6x entre columna más larga y más corta) y título de cierre ≤ 45 caracteres.

### Patrón `fotografia-primero`

Creado para la campaña BMW X1 Descubre, migrada desde `institutional`. Hero `hero-imagen` sin fallback. Fotografía como elemento dominante. 7 slots.

---

## 2026-07-22 — [RECUPERADO] Patrón institutional, category-grid, asimétricos, anidamiento

### Patrón `institutional.md`

Creado para la campaña UAX FP Online. Segundo patrón del motor. Secuencia: `header-logo → hero-centrado/hero-imagen → intro-cta → category-grid → usp-cards → banda-cierre → footer`.

### Componentes nuevos

- `category-grid.html`: grid de categorías (2-8 items, agrupados en filas de 3).
- `category-grid-img.html`: variante con imagen de categoría en vez de icono.
- `usp-cards.html`: tarjetas de credibilidad con icono y badge.
- `header-logo.html`: bloque de cabecera con logotipo + label opcional.

### Anidamiento de {{#each}}

Motor de placeholders actualizado para soportar bucles anidados (necesario para category-grid que itera filas → celdas).

### `hero-imagen` como opción real de estructura

Se documenta en contratos de agentes que `hero-imagen` es una variante de primera clase (no un script suelto). Reparto: 02 investiga, 03 decide, 06 ejecuta.

---

## 2026-07-21 — [RECUPERADO] F1 Motor: componentes base, build-newsletter.js, verificación

### INCIDENTE 2026-07-21

En esta fecha una sesión de Hermes re-extrajo los componentes desde una fuente equivocada, sobrescribiendo `engine/components/` y rompiendo el build de todas las campañas existentes. Se restauró completamente desde el backup en `_archive/incidente-2026-07-21-tarifalo/`. Ver CHANGELOG-hermes.md en ese directorio para detalles.

### Motor completo

- `engine/build-newsletter.js`: CLI principal, 6 fases: validar schema → cargar tokens → resolver patrón → ensamblar en memoria → inline con juice → auto-verificar → escribir outputs.
- `lib/tokens.js`: carga y resuelve brand-tokens.json (requiere v2.2.0+).
- `lib/pattern.js`: parsea PATTERN_SEQUENCE, valida orden y reglas.
- `lib/assemble.js`: motor de placeholders ({{token}}, {{data}}, {{#each}}, {{include}}, {{slot}}).
- `lib/verify.js`: auto-verificación post-build (charset, {{}}, conteos img/utm/v:roundrect, tablas balanceadas, peso < 90KB).

### Garantía de no dejar outputs parciales

Todo el ensamblado vive en memoria. `fs.writeFileSync` solo se llama tras pasar las 6 fases. Nunca se escribe un `final.html` inválido.

### Componentes base (12 archivos)

- `_shell.html` — envoltorio (DOCTYPE, head, media queries, outer table).
- `hero-centrado.html` — hero centrado.
- `hero-asimetrico.html` — hero asimétrico (H1 izq + stat der).
- `hero-marca-*.html` — heros de marca (Claude design).
- `trust-bar.html` — barra de confianza (3 items).
- `card-tarifa.html` — tarjeta de tarifa (4 items).
- `card-tarifa-3.html` — variante de 3 tarjetas.
- `pasos.html` — 3 pasos numerados con halo.
- `lista-premium.html` — lista premium (4 items con badge de icono).
- `intro-cta.html` — intro + CTA contextual.
- `columns-3-beneficios.html` — 3 columnas de beneficios con icono.
- `banda-cierre.html` — banda de cierre con CTA VML.
- `footer.html` — footer legal.
- `cta-bulletproof.html` — parcial VML+fallback compartido por hero y cierre.
- `cta-secondary-bulletproof.html` — CTA secundario outline.

### Schema

`engine/schema/campaign-data.schema.json` con validación ajv. Formato `{component, data}` uniforme por módulo. `$defs`: httpsUrl, nonPendingString, espResolvedUrl, hexColor, ctaBlock.

### Tests

Suite con `node --test` en `engine/_test/`. Cubre: pattern-grammar, adaptadores de módulo, tokens, build end-to-end con ejemplo.

### Lock del motor

`engine/components.lock.json`: SHA256 de cada archivo en `engine/components/`. Verificado por `check-engine-integrity.ts`.

### Patrón `saving.md`

Primer patrón del motor. Secuencia: `hero-asimetrico → trust-bar → card-tarifa → pasos → lista-premium → banda-cierre → footer`.

---

## 2026-07-17 — [RECUPERADO] Prompt 11: Biblioteca de componentes premium

### Creado

- `engine/components/` con 12 archivos (11 componentes + INVENTORY.md):
  - `_shell.html` — envoltorio de página.
  - `preheader.html` — div oculto con meta description.
  - `hero.html` — hero asimétrico post-ronda-02 (H1 izq + stat der + CTA 19px VML).
  - `trustBar.html` — pill lila con 3 checks.
  - `tarifasHeader.html` — cabecera de sección con kicker rule.
  - `cardTarifa.html` — tarjeta con franja de acento + icono oficial + enlace UTM.
  - `pasos.html` — 3 pasos numerados con halo.
  - `listaPremium.html` — premiumListRow con badge de icono (4 items).
  - `bandaCierre.html` — closing band con CTA VML 19px.
  - `footer.html` — legal + placeholders de baja/preferencias/dirección.
  - `ctaBulletproof.html` — parcial VML+fallback compartido por hero y cierre.

### Convención de placeholders

- Tokens: `{{token:path.to.field}}`, resuelto contra brand-tokens.json.
- Datos de campaña: `{{data:field}}`, resuelto contra campaign-data.json.
- Bucles: `{{#each:items}} ... {{/each}}`.

### Fuente de extracción

`newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html`, estado post-ronda-10.

### Decisiones

- Colores VML hardcodeados en componentes (identidad de marca, no token).
- CDN base URL parametrizada como `{{data:cdnBase}}`.
- `design-tokens-premium.json` como registro histórico (fusionado en brand-tokens.json v2.2.2).

---

## Historial pre-motor (newsletter-system v2.0/v2.1)

El historial completo del sistema anterior está documentado en:
- `newsletters/2026/newsletter-system/docs/releases/changelog-multibrand.md` (v2.0 → v2.1, 2026-07-13)
- `_archive/incidente-2026-07-21-tarifalo/CHANGELOG-hermes.md` (prompts 11-13, F1 motor)
