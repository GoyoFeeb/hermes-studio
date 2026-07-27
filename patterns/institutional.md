# Patrón de género: institutional

Fecha: 2026-07-22. Segundo patrón de género del motor (el primero, `saving`, es del
2026-07-20). Se crea porque hay una campaña real que lo necesita — regla anti-aspiracional del
plan de transformación respetada (`engine/README.md`, "Cómo añadir un género nuevo"): la
campaña UAX — FP Online llegó con un `campaign-data.json` en un formato antiguo y un
`final.html` escrito a mano, fuera del motor (ver `engine/CHANGELOG.md`, entrada 2026-07-22).
Este patrón es la migración de esa campaña a la vía correcta, con 5 componentes nuevos.

## 1. Secuencia de componentes

> **Desde 2026-07-24 esto es una gramática, no una secuencia fija (ver §10).** Los pasos 1-2 y
> 7-8 son **anclas**: posición fija. Los pasos 3-6 son una **zona libre**: van en el orden que
> el ritmo real de la marca pida, y varios admiten repetición. La tabla siguiente muestra el
> orden POR DEFECTO (el que se usaba obligatoriamente antes), no el único válido.

| # | Componente (`engine/components/`) | Fondo | Obligatorio | Posición |
|---|---|---|---|---|
| — | `_shell.html` (envoltorio, no es un módulo) | — | Siempre | — |
| 1 | `header-logo.html` | Blanco | Sí | **Ancla** |
| 2 | `hero-centrado.html` (o `hero-asimetrico`/`hero-imagen`/`hero-marca-*` si la marca tiene cifra confirmada, arte generado o hero propio) | `colors.primary` | Sí | **Ancla** |
| 3 | `intro-cta.html` o `intro-cta-asimetrico.html` (Nivel 2 — ver §7) | Blanco | Opcional (ver §3) | Zona libre (hasta ×2) |
| 4 | `columns-3-beneficios.html`, `columns-3-beneficios-asimetrico.html` (Nivel 2 — ver §7) o `columns-3-beneficios-sin-icono.html` (si la marca documenta que no usa emoji/iconGlyph, ver §7) | `surfaces.sectionLila` | Sí | Zona libre (hasta ×2) |
| 5 | `category-grid.html` | Blanco | Opcional (ver §3) | Zona libre (hasta ×2) |
| 6 | `usp-cards.html`, `usp-cards-asimetrico.html` (Nivel 2 — ver §7) o `usp-cards-sin-icono.html`/`usp-cards-sin-icono-asimetrico.html` (si la marca documenta que no usa emoji/iconGlyph, ver §7) | `surfaces.sectionLila` | Opcional (ver §3) | Zona libre (hasta ×2) |
| 7 | `banda-cierre.html` o `banda-cierre-asimetrico.html` (Nivel 2 — ver §7) | `colors.deep` | Sí | **Ancla** |
| 8 | `footer.html` | `surfaces.global` | Siempre | **Ancla** |

<!-- PATTERN_SEQUENCE (bloque parseable por engine/build-newsletter.js. GRAMÁTICA, no lista
     rígida, desde 2026-07-24 — ver §10 y la cabecera de engine/lib/pattern.js:
       "N. alternativas (required|optional[, max N])"  → ANCLA (posición fija)
       "-  alternativas (required|optional[, max N])"  → ZONA LIBRE (orden libre, repetible)
     Las líneas "-" consecutivas forman una zona. Mantener sincronizado a mano con la tabla. -->
1. header-logo (required)
2. hero-asimetrico|hero-centrado|hero-imagen|hero-marca-* (required)
- intro-cta|intro-cta-asimetrico (optional, max 2)
- columns-3-beneficios|card-tarifa-3|columns-3-beneficios-asimetrico|columns-3-beneficios-sin-icono (required, max 2)
- category-grid|category-grid-img (optional, max 2)
- usp-cards|usp-cards-asimetrico|usp-cards-sin-icono|usp-cards-sin-icono-asimetrico (optional, max 2)
3. banda-cierre|banda-cierre-asimetrico (required)
4. footer (required)
<!-- /PATTERN_SEQUENCE -->

## 2. Reglas de ritmo

|| # | Sección | Fondo | Alineación | Densidad |
|---|---|---|---|---|---|
|| 1 | Cabecera (logo) | Blanco | Centrada | Baja |
|| 2 | Hero | `colors.primary` (navy) | Centrada | Media |
|| 3 | Intro + CTA | Blanco | Centrada | Baja |
|| 4 | Beneficios (3 col) | `columns-3-beneficios` / `card-tarifa-3` | `surfaces.sectionLila` / Blanco | Centrada | Media |
|| 5 | Grid de categorías | `category-grid` / `category-grid-img` | Blanco | Centrada | Media-alta (filas de 3) |
|| 6 | Credibilidad (USP) | `surfaces.sectionLila` | Centrada | Media |
|| 7 | Banda de cierre | `colors.deep` (navy) | Centrada | Media |
|| 8 | Footer | `surfaces.global` (gris) | Centrada | Baja |

**Regla dura (heredada de `saving.md`): ninguna sección consecutiva repite la misma combinación
fondo+alineación+densidad.** Verificado con la secuencia por defecto (todas las secciones
centradas): 1→2 cambia fondo+densidad, 2→3 cambia fondo, 3→4 cambia fondo+densidad, 4→5 cambia
fondo, 5→6 cambia fondo, 6→7 cambia fondo, 7→8 cambia fondo+densidad.

**Actualización Nivel 2 (2026-07-22):** hasta esta fecha todas las secciones de este género
compartían alineación centrada por diseño — la única variación de ritmo disponible era
fondo/densidad. Ahora existen variantes asimétricas reales de `intro-cta`,
`columns-3-beneficios`, `usp-cards` y `banda-cierre` (ver §7): una marca puede declarar
`layout.sectionStyle: "asimetrico"` en su `brand-tokens.json` para que estas 4 secciones usen
alineación izquierda/dos-columnas en vez de centrada. La regla dura de ritmo (fondo+alineación+
densidad no puede repetirse en 2 secciones consecutivas) se sigue cumpliendo en ambos casos —
cuando una marca es "asimétrico", la alineación pasa a ser una tercera variable disponible
además de fondo/densidad para diferenciar secciones consecutivas, no una obligación de
alternar en cada sección.

**Regla específica de este género (la lección de UAX, 2026-07-22):** ningún elemento opcional
o de longitud variable (badge, promo, nº de ítems) puede vivir DENTRO de una sola columna de un
bloque de N columnas iguales — va en un bloque propio a todo el ancho, antes o después. Ver
cabecera de `columns-3-beneficios.html` y `category-grid.html`.

## 3. Obligatorio vs. opcional

| Módulo | Regla |
|---|---|
| Cabecera, hero, beneficios, banda de cierre, footer | **Obligatorios.** No hay pieza `institutional` sin estos 5. |
| Intro + CTA | **Opcional.** Se incluye si el brief aporta un párrafo de transición real entre el hero y los beneficios — no se rellena con paráfrasis del hero solo para ocupar el hueco. |
| Grid de categorías | **Opcional.** Solo si el brief tiene un catálogo/listado real de categorías o líneas de producto (2-8). Sin eso, se omite el módulo entero. |
| Credibilidad (USP) | **Opcional, 2-4 puntos** (era "exactamente 3" hasta 2026-07-24 — ver §11). Solo con claims de confianza verificables, no inventados. Con menos de 2 se omite el módulo completo. |

## 4. Criterios de contenido por módulo

| Módulo | Qué dato del brief lo alimenta | Si falta |
|---|---|---|
| Cabecera | Logo confirmado (PNG, no SVG — prohibido en email) + una etiqueta corta | Bloquear — sin logo confirmado, usar el nombre de marca como texto (ver `hero-centrado`) y omitir `header-logo` hasta tener el logo |
| Hero | Propuesta de valor + 1 subtítulo | Usar `hero-centrado` si no hay cifra de marca confirmada (igual regla que `saving.md` §4) |
| Beneficios | 2-4 ventajas reales (era "exactamente 3" hasta 2026-07-24, ver §11), con textos de longitud comparable dentro de cada fila (`scripts/check-column-balance.ts` bloquea si divergen >1.6x en palabras a 3-4 columnas, >2.0x a 2) + máximo 1 promo/aviso a nivel de sección | Bloquear — es el módulo estructural de este género, no se puede omitir |
| Grid de categorías | 2-8 categorías/líneas reales con su propia etiqueta | Omitir el módulo entero (ver §3) |
| Credibilidad (USP) | 2-4 puntos de confianza verificables + 1 insignia/reconocimiento real | Omitir el módulo entero (ver §3) |
| Banda de cierre | Mismo CTA del hero, copy de cierre sin inventar plazos o descuentos no confirmados | Bloquear — no hay pieza sin cierre con CTA |
| Footer | Datos legales de la marca | Bloquear en producción (`productionReady:false` hasta tenerlos); placeholder textual solo si `metadata.isTestCampaign:true` |

## 5. Contrastes mínimos (WCAG) — calculados para `brands/uax/tokens/brand-tokens.json` v2.2.0

Misma regla de "texto grande" que `saving.md` §5 (umbral 3:1 si ≥24px normal o ≥18.66px
bold/semibold; si no, 4.5:1). Todos los valores recalculados con la fórmula de luminancia
relativa WCAG 2.x contra los hex reales del pack — no copiados de otro pack.

| Combinación | Contexto | Tamaño/peso | Umbral | Ratio real | Resultado |
|---|---|---|---|---|---|
| `#FFFFFF` / `#003F6F` | H1 hero, badge USP | 28px/800 (H1) | Grande (3:1) | 10.85:1 | ✅ PASS |
| `#C7DEF0` / `#003F6F` | Subtítulo hero, banda de cierre | 15px/400 | Normal (4.5:1) | 7.82:1 | ✅ PASS |
| `#FFFFFF` / `#008CF7` | Texto del CTA principal | 19px/700 | **Grande** (3:1) | 3.45:1 | ✅ PASS (califica como texto grande, mismo patrón que el CTA de `saving.md`, 3.10:1) |
| `#0060AB` / `#FFFFFF` | Eyebrow/kicker sobre blanco | 12px/700 | Normal (4.5:1) | 6.43:1 | ✅ PASS |
| `#0060AB` / `#D9E7F4` | Eyebrow sobre azul claro | 12px/700 | Normal (4.5:1) | 5.11:1 | ✅ PASS |
| `#003F6F` / `#FFFFFF` | h2Section | 22px/800 | Grande (3:1) | 10.85:1 | ✅ PASS |
| `#003F6F` / `#D9E7F4` | h2Section sobre azul claro | 22px/800 | Grande (3:1) | 8.62:1 | ✅ PASS |
| `#666666` / `#FFFFFF` | Body sobre blanco | 13-14px/400 | Normal (4.5:1) | 6.03:1 | ✅ PASS |
| `#666666` / `#D9E7F4` | Body sobre azul claro | 12-13px/400 | Normal (4.5:1) | 4.57:1 | ✅ PASS (ajustado — margen pequeño, no bajar más la opacidad del texto en este fondo) |
| `#666666` / `#F5F5F5` | Footer disclosure | 12px/400 | Normal (4.5:1) | 5.27:1 | ✅ PASS |
| `#003F6F` / `#F5F5F5` | Footer brand | 12px/600 | Normal (4.5:1) | 9.95:1 | ✅ PASS |

### Hallazgo durante la construcción de esta tabla

`colors.lightAccent` original del cliente (`#59A9F3`) se descartó para cualquier uso de texto:
da **4.33:1** sobre `#003F6F`, por debajo del 4.5:1 que necesita como texto normal — a pesar de
ser un azul más vistoso, no pasa. Se usa `onBrandSecondary` (`#C7DEF0`, calculado, 7.82:1) para
todo texto sobre navy en su lugar. Ver `brands/uax/tokens/brand-tokens.json` `_changelog`.

## 6. Límites conocidos de este patrón

- `category-grid.html` agrupa en filas de 3 vía JS en el adaptador (no vía plantilla) — si en
  el futuro se necesitan 2 o 4 por fila, hace falta una variante de layout, no un parámetro.
- ~~`usp-cards.html` es fijo a 3 tarjetas~~ — **resuelto 2026-07-24 (ver §11): admite 2-4.**
  `trust-bar` de `saving.md` SÍ sigue fijo a 3 (motivo en §11).
- `hero-centrado.html` (reusado sin cambios) tiene `'Sora'` hardcodeado como display font — no
  tokenizado, limitación heredada compartida con `saving.md` (ver `brand-tokens.json` de UAX,
  `_changelog`). No se resuelve aquí: tocar `hero-centrado.html` afecta a todas las marcas que
  lo usan y no había necesidad real de cambiarlo para esta campaña.

## 7. Nivel 2 — variedad estructural real, decisión de marca (2026-07-22)

Hasta esta fecha, este género era siempre centrado y siempre la misma secuencia — la única
diferencia real entre marcas era el color/tipografía/radius/shadows (ver `engine/CHANGELOG.md`,
entrada "Nivel 1"). Este apartado documenta el mecanismo por el que la ESTRUCTURA también pasa
a ser una decisión de marca.

### 7.1 Qué existe ahora

4 de los 8 módulos de este género tienen dos variantes de composición, con **idéntico contrato
de datos** (mismo adaptador en `lib/assemble.js` — el layout cambia en la plantilla `.html`, la
forma del JSON no cambia nada):

| Módulo | Variante centrada (por defecto) | Variante asimétrica (Nivel 2) |
|---|---|---|
| Intro + CTA | `intro-cta.html` — título+cuerpo+CTA apilados, centrados | `intro-cta-asimetrico.html` — título+cuerpo a la izquierda (64%), CTA a la derecha (36%), misma fila |
| Beneficios (3) | `columns-3-beneficios.html` — 3 columnas iguales lado a lado, centradas | `columns-3-beneficios-asimetrico.html` — 3 filas apiladas, icono en halo a la izquierda + texto a la izquierda a su derecha (mismo lenguaje visual que `lista-premium.html`/`pasos.html`, pero en fila) |
| Credibilidad (USP) | `usp-cards.html` — insignia final en bloque propio a todo el ancho, debajo de las 3 tarjetas | `usp-cards-asimetrico.html` — insignia como chip compacto junto a la cabecera (eyebrow+título+cuerpo a la izquierda, insignia a la derecha, misma fila); las 3 tarjetas debajo no cambian |
| Banda de cierre | `banda-cierre.html` — título+cuerpo+CTA apilados, centrados | `banda-cierre-asimetrico.html` — título+cuerpo a la izquierda (62%), CTA a la derecha (38%), misma fila (mismo lenguaje que `hero-asimetrico.html`) |

En mobile, las 4 variantes asimétricas apilan igual que la centrada (`class="mobile-stack"`) —
no hay divergencia de comportamiento responsive entre variantes, solo de composición en
desktop/tablet.

**Añadido 2026-07-24 (campaña BMW):** `columns-3-beneficios-sin-icono.html` es una tercera
variante de Beneficios (3), esta vez no de composición sino de contrato de datos — mismo
layout 33/33/33 que la centrada, pero `items[]` no lleva `icon`. Motivo real: el brand pack de
una marca puede documentar (como BMW, ver `brands/bmw/tokens/brand-tokens.json` →
`iconography.componentImplication`) que no usa emoji ni iconos de glifo y que la fotografía es
su único adorno visual — forzar un emoji en ese caso contradice la propia investigación de
marca. Usar solo cuando el pack lo justifique explícitamente, no por defecto.

**Añadido 2026-07-24 (campaña Spotify):** mismo problema, mismo motivo, pero en Credibilidad
(USP): `usp-cards-sin-icono.html`/`usp-cards-sin-icono-asimetrico.html` son la variante de
`usp-cards`/`usp-cards-asimetrico` sin `icon` en `items[]` (sustituido por una barrita de color
de acento). El brand pack de Spotify (ver `brands/spotify/tokens/brand-tokens.json` →
`iconography.componentImplication`) documenta que su único elemento icónico real es el isotipo
de barras de sonido usado como máscara sobre fotografía, no un set de iconos de beneficio — el
motor no tenía forma de omitir `icon` en `usp-cards` hasta esta variante. Mismo criterio que
`columns-3-beneficios-sin-icono`: usar solo cuando el pack lo justifique explícitamente.

**Deliberadamente NO se tocan** en esta ronda: `header-logo`, `hero-*`, `category-grid*` y
`footer`. El hero ya tenía su propia familia de alternativas desde antes (`hero-asimetrico` es,
de hecho, el origen del lenguaje visual que las 4 variantes nuevas reutilizan). `category-grid`
depende de agrupación en filas de 3 vía JS (`lib/assemble.js`) — una variante asimétrica ahí
cambiaría esa lógica de agrupación, no solo la plantilla, y no había necesidad real que lo
justificara en esta ronda (regla anti-aspiracional). `header-logo`/`footer` son bloques
utilitarios sin contenido narrativo — la asimetría no aporta ahí.

### 7.2 Cómo una marca elige

Cada `brand-tokens.json` declara un bloque `layout`:

```json
"layout": {
  "sectionStyle": "centrado",
  "reason": "..."
}
```

`sectionStyle` es `"centrado"` o `"asimetrico"`. Quien escribe `campaign-data.json` (agente 03
Estructura o humano) consulta este campo — igual que ya consulta `colors`/`typography` — y
nombra el componente correspondiente en cada módulo de la lista de arriba (`X` si `centrado`,
`X-asimetrico` si `asimetrico`). El motor **no resuelve esto automáticamente**: sigue el mismo
principio que todo el sistema — `campaign-data.json` declara explícitamente qué componente usa
cada módulo, nunca una inferencia implícita en tiempo de build. `layout.sectionStyle` es una
señal para quien autora la campaña, con la misma fuerza normativa que `voice.tone`, no una
palanca que el motor lea directamente.

### 7.3 Quién es cada cosa hoy

| Marca | `layout.sectionStyle` | Razón |
|---|---|---|
| UAX — FP Online | `centrado` | Su única campaña real (`2026-jul-uax-fp-online`) ya está construida, aprobada y pasando gates en centrado; cambiarla ahora no tiene motivo de negocio y rompería su verificación visual/QA existente. `voice.tone: "institucional, cercano, orientado a resultados"` — el registro serio/corporativo encaja con centrado. |
| Óptica 2000 | `asimetrico` | Sin campaña real construida aún (`PROMPT-OPTICA2000-HERMES.md` es un documento de traspaso, no una campaña ejecutada) — es el candidato natural para estrenar las 4 variantes nuevas cuando se ejecute. `voice.tone: "cercano, profesional, cuidado visual"` — el registro más editorial/boutique de óptica encaja mejor con la asimetría que con el centrado corporativo de UAX. |
| Para y Compara / Tarífalo | `asimetrico` | Usan el género `saving`, no `institutional` — el campo se declara igualmente por consistencia (mismo patrón que `voice` existe en los 3 packs sin importar qué género use cada campaña), y refleja lo que `saving.md` §2 ya documenta como su composición real (`hero-asimetrico`, `lista-premium` alineada a la izquierda). No activa ningún componente nuevo de esta ronda porque `saving.md` no referencia los módulos de `institutional`. |

### 7.4 Verificación

Las 4 variantes nuevas se probaron con un fixture aislado (`engine/_test-output/nivel2-fixture/`,
no una campaña real) que ejercita los 4 componentes con datos de ejemplo — ver
`engine/CHANGELOG.md`, entrada "Nivel 2", para el detalle del build y de por qué no se creó una
campaña ficticia en `newsletters/` (regla anti-aspiracional: no se crea una campaña sin brief
real). Las 4 campañas reales (`tv`, `verano`, `luzgas`, `uax`) no cambian ni un byte — ninguna
nombra los componentes `-asimetrico` en su `campaign-data.json`.

## 8. Jerarquía de CTA (2026-07-24)

Hasta esta fecha, TODOS los CTA del email —el ask principal del hero/banda-cierre Y cualquier
CTA contextual de paso (intro-cta, category-grid)— usaban el mismo `{{include:cta-bulletproof}}`:
misma pastilla sólida, mismo tamaño, mismo peso visual. Evidencia real de por qué esto es un
problema: `2026-jul-spotify-premium-test` renderizaba el CTA del hero ("Prueba Premium gratis")
y el CTA contextual de `intro-cta-asimetrico` ("Empieza tu mes gratis", junto a dos frases de
body copy a un tercio del ancho) con exactamente el mismo `padding`/`font-size`/forma — pese a
que la investigación real de marca (`brands/spotify/tokens/brand-tokens.json`, Chrome real sobre
spotify.com/us/premium/) documentaba que el CTA secundario real de Spotify ("View all plans") es
un botón outline, no una pastilla sólida. La investigación existía; el motor no tenía forma de
usarla.

Ahora existen dos partials de CTA con roles distintos:

| Rol | Partial | Tratamiento | Dónde |
|---|---|---|---|
| **Primario** (el ask del email) | `cta-bulletproof.html` | Pastilla sólida, `padding:17px 36px`, `font-size:19px` | `hero-*`, `banda-cierre*` |
| **Secundario** (CTA de contexto/paso) | `cta-secondary-bulletproof.html` | Outline/ghost, transparente, borde+texto `colors.primary`, `padding:12px 28px`, `font-size:14px` | `intro-cta*`, `category-grid*` |

El color del CTA secundario reutiliza `colors.primary` — no es un token nuevo por marca (ver
`engine/CHANGELOG.md`, entrada "Jerarquía de CTA", para la tabla de ratios de contraste
verificados en las 8 marcas reales antes de decidir esto). Un módulo NUNCA elige entre los dos
partials vía dato/token — el partial que incluye está fijo por componente (igual que `-asimetrico`
está fijo por archivo, no por parámetro), así que la jerarquía primario/secundario ya viene dada
por qué módulo se usa, sin que 03/04 tengan que decidir nada adicional en esta ronda.

**Resuelto 2026-07-25:** el mecanismo pendiente arriba (variante text-link elegible por módulo)
ya existe — ver §8.1. Nike y BMW, las dos candidatas citadas aquí, se investigaron primero con
Chrome real y **ninguna la usa** en la práctica: sus CTA reales (nike.com, bmw.com/es) son
pastillas/botones sólidos, no enlaces de texto plano. La variante queda disponible en el motor
para la marca que sí lo verifique, pero no se ha forzado en ninguna de las 3 marcas piloto de
esta ronda (Worn Wear tampoco — su CTA real en wornwear.patagonia.com es también pastilla).
Aplicarla sin esa verificación habría repetido el error de fondo de esta sesión: inventar una
diferenciación de marca en vez de investigarla.

### 8.1 Vocabulario de formas de CTA (2026-07-25)

Más allá de primario/secundario (§8, que es sobre PESO — qué tan protagonista es un CTA dentro
del email), el motor ahora separa también la FORMA del CTA de su rol. Antes, "primario" y
"pastilla sólida" eran la misma decisión inseparable; ahora un módulo primario puede seguir
siendo protagonista sin ser necesariamente una pastilla, si la marca real lo justifica. Cuatro
siluetas disponibles en `engine/components/` (detalle de tokens en `INVENTORY.md`):

| Silueta | Partial | Cuándo |
|---|---|---|
| Pastilla sólida | `cta-bulletproof.html` | Default — la mayoría de marcas reales del sistema |
| Pastilla outline | `cta-secondary-bulletproof.html` | Rol secundario (§8), no una silueta alternativa por marca |
| Texto + flecha, sin cápsula | `cta-text-link-bulletproof.html` | Solo si Chrome real sobre el sitio de la marca muestra CTA de texto plano como tratamiento deliberado |
| Bloque sólido, esquina recta | `cta-block-bulletproof.html` | Solo si Chrome real muestra botones de esquina recta (no pastilla de radio bajo — eso ya lo cubre `radius.ctaPill`) |

Selección vía `components.cta.style` (CTA primario) / `components.ctaSecondary.style` (CTA
secundario) = `"text-link"` | `"block"` en el brand pack; sin ese campo, comportamiento idéntico
al de antes de esta ronda (las 9 marcas reales de hoy no lo declaran — ver §8, "Resuelto
2026-07-25"). Responsabilidad de **02** (brand-visual-analyst): verificar con Chrome real antes
de escribir el campo — nunca una elección de 03/04 por preferencia compositiva, ni un default
nuevo que sustituya a la pastilla sin evidencia.

## 9. Romper composiciones repetidas (2026-07-24)

Hasta esta fecha, `intro-cta-asimetrico`, `usp-cards-asimetrico` y `banda-cierre-asimetrico`
compartían literalmente el mismo esqueleto: texto ~65% a la izquierda + caja de acento ~33% a la
derecha, `vertical-align:middle`. No fue un accidente — el propio comentario de cabecera de
`banda-cierre-asimetrico.html` (antes de esta ronda) decía explícitamente "mismo lenguaje
compositivo que hero-asimetrico.html... para dar continuidad visual dentro de la familia
asimétrico". Esa "continuidad" es exactamente lo que hace que tres módulos con contenido y
función distintos —una insignia informativa, un CTA de tránsito, el cierre del email— se vean
como el mismo bloque repetido con texto distinto.

Rediseño (ver `engine/CHANGELOG.md`, entrada "Romper composiciones repetidas", para el detalle
técnico completo):

| Módulo | Antes | Ahora |
|---|---|---|
| `usp-cards-asimetrico` / `usp-cards-sin-icono-asimetrico` | Texto 68% + insignia en caja de 32%, columnas de igual peso | Eyebrow en su fila, título + chip de insignia shrink-to-fit (no columna) en la siguiente, cuerpo a todo el ancho debajo |
| `banda-cierre-asimetrico` | Texto 62% + CTA en columna de 38% | Título+cuerpo a todo el ancho arriba (registro editorial), CTA suelto debajo, alineado a la izquierda, ancho fijo (no columna) |
| `intro-cta-asimetrico` | Texto 64-68% + CTA en columna de 32-36% | Sin cambios de composición — ya diferenciado por el fix de jerarquía de CTA (§8): su CTA es ahora visiblemente más pequeño/outline que el de hero/banda-cierre |
| `hero-asimetrico` | H1 56% + cifra destacada 44% | Sin cambios — semántica propia (dato, no acción) que ya lo diferenciaba de los otros 3 |

Principio para futuras variantes/componentes: **la "familia visual" de una marca se expresa en
tokens (color, tipografía, radios, voz), no en clonar la silueta de un módulo a otro.** Dos
módulos pueden compartir marca sin compartir esqueleto — de hecho, deberían diferenciarse por su
función real (dato vs. acción vs. etiqueta vs. cierre), igual que ya se exige que 03 justifique
la elección de patrón/hero contra la evidencia real de la marca (ver §7.2).

## 10. De secuencia fija a gramática (2026-07-24)

### El problema medido

Las 9 secciones anteriores de este documento describen cómo se fue dando variedad al sistema:
variantes asimétricas (§7), variantes sin icono (§7), jerarquía de CTA (§8), romper composiciones
clonadas (§9). Cada una resolvió un problema real. Y aun así el usuario seguía reportando que
las newsletters "se ven genéricas, cambian colores y poco más".

La medición sobre las 12 campañas reales del sistema explica por qué, y no es un problema de
tokens ni de componentes:

```
adeslas       header-logo → hero-centrado → intro-cta → columns-3 → usp-cards → banda-cierre → footer
uax           header-logo → hero-centrado → intro-cta → columns-3 → category-grid → usp-cards → banda-cierre → footer
optica2000    header-logo → hero-centrado → intro-cta → card-tarifa-3 → category-grid-img → banda-cierre → footer
nike          header-logo → hero-imagen   → intro-cta → card-tarifa-3 → banda-cierre → footer
bmw           header-logo → hero-imagen   → intro-cta → columns-3-sin-icono → banda-cierre → footer
spotify       header-logo → hero-imagen   → intro-cta → columns-3-sin-icono → usp-cards → banda-cierre → footer
```

**Las 12 campañas terminan en `banda-cierre → footer`. Las 7 de estos dos géneros empiezan en
`header-logo → hero-*`. Ninguna repite un bloque. Ninguna altera el orden.** No porque nadie
quisiera: porque `engine/lib/pattern.js` lo hacía imposible — un patrón era una lista de N pasos
validada con un algoritmo de 2 punteros que consumía cada paso exactamente una vez. La única
variación disponible entre dos campañas del mismo género era qué opcionales se omitían y qué
variante (`-asimetrico`/`-sin-icono`) se elegía de cada paso.

Dicho de otra forma: **el patrón ERA la plantilla.** Toda la investigación de marca del agente 02
—fotografía, iconografía, ritmo de voz, ritmo estructural de la página real— desembocaba en un
esqueleto idéntico al de la campaña anterior. Ese era el techo real del sistema.

### Qué cambia y qué no

La sintaxis del bloque `PATTERN_SEQUENCE` pasa de lista a gramática (detalle completo en la
cabecera de `engine/lib/pattern.js`):

| | Antes | Ahora |
|---|---|---|
| Orden del cuerpo | Fijo, único | **Libre dentro de la zona** |
| Repetir un bloque | Imposible | **Permitido hasta su `max`** |
| Apertura/cierre | Fijos | Fijos (**anclas** — sin cambio) |
| Componentes del género | Cerrado | Cerrado (**sin cambio**) |
| Bloques obligatorios | Exigidos | Exigidos (**sin cambio**) |

**Lo que NO se ha relajado, deliberadamente** — estas restricciones no eran la causa de la
genericidad, son las que hacen que el email funcione:

- Un componente ajeno al género se sigue rechazando.
- Un bloque obligatorio ausente se sigue rechazando.
- La cabecera sigue abriendo y el cierre+footer siguen cerrando (**anclas**): un email que no
  abre con marca/hero o que no cierra con CTA+legal no es una decisión de diseño, es un error de
  conversión y de cumplimiento.
- Todo lo demás del sistema sigue igual de estricto: schema, contraste WCAG, compatibilidad de
  cliente de email, prohibición de editar el HTML a mano, prohibición de inventar datos de marca.

### Consecuencia para quien compone la campaña (agente 03)

Liberar la gramática no sirve de nada si 03 sigue escribiendo la secuencia por defecto por
inercia — sería el mismo fallo que ya ocurrió con `hero-imagen` (la investigación existía y no
llegaba a la decisión, ver §"Elegir hero" de `agents/03-newsletter-architect.md`). Por eso el
contrato de 03 pasa a exigir que la secuencia se componga contra `layout.contentRhythm` del brand
pack — el nº y tipo de secciones reales de la página de la marca, que 02 ya investiga desde el
2026-07-24 — y que se justifique cualquier desviación del orden por defecto. Ver ese archivo.

### Regla de ritmo con orden libre

La **regla dura de §2** (ninguna sección consecutiva repite fondo+alineación+densidad) era fácil
de verificar cuando el orden era único: se comprobaba una vez, al escribir el patrón. Con orden
libre y repetición, **es responsabilidad de 04 verificarla sobre la secuencia concreta de esta
campaña** — y es más importante que nunca, porque repetir `columns-3-beneficios` dos veces
seguidas produce exactamente el bloque duplicado que §9 acaba de eliminar. Repetir un bloque solo
está justificado si algo lo separa (otro bloque con fondo/densidad distintos entre medias).

## 11. Conteos de ítems: de "exactamente 3" a 2-4 (2026-07-24)

Segunda familia de restricciones arbitrarias, resuelta justo después de la gramática de secuencia
(§10). Detalle técnico completo en `engine/CHANGELOG.md`, entrada "Los conteos fijos".

El resumen: `exactamente 3` no vivía en el schema, vivía en el HTML — 9 de los 10 módulos con
lista de ítems escribían `items[0]`, `items[1]`, `items[2]` literalmente en su plantilla, con
anchos de columna al 33%. Ninguna decisión de diseño lo había elegido: así se escribió la primera
plantilla y las 8 siguientes se copiaron de ella. Toda marca tenía que tener exactamente 3
beneficios y 3 pruebas de credibilidad, tuviera 2 o 5.

Ahora el adaptador reparte los ítems en filas equilibradas y calcula el ancho de cada celda en JS
(mismo mecanismo que `category-grid` ya usaba), y la plantilla itera:

| Nº de ítems | Composición resultante |
|---|---|
| 2 | 1 fila de 2 columnas al 50% |
| 3 | 1 fila de 3 columnas al 33% (**idéntico byte a byte al render anterior**) |
| 4 | 2 filas de 2 columnas al 50% — nunca 4 columnas al 25%, ilegibles a 600px |

Rango admitido: **2-4** en `columns-3-beneficios` (y sus variantes) y `usp-cards` (y las suyas).
No es un límite técnico —el motor reparte cualquier N— sino editorial: cubre los casos reales sin
invitar a meter 6 bloques en un email. Subirlo es cambiar un número en el schema el día que una
campaña real lo pida.

**`trust-bar` y `card-tarifa-3` siguen fijos a 3** — no por criterio de diseño sino porque
generalizarlos exige rehacer cómo se construyen (en `trust-bar`, la celda divisoria de 1px entre
ítems, que el último no lleva), y eso cambiaría el render de campañas ya aprobadas sin que ninguna
campaña real lo esté pidiendo.
