# Patrón de género: fotografia-primero

Fecha: 2026-07-24. Tercer patrón de género del motor (los otros dos: `saving`, 2026-07-20;
`institutional`, 2026-07-22). Se crea porque hay una campaña real que lo necesita — regla
anti-aspiracional del plan de transformación respetada (`engine/README.md`, "Cómo añadir un
género nuevo"): la campaña BMW — X1 Descubre llegó forzada dentro de `institutional`, un patrón
pensado para marcas de servicios con bloques de beneficios con icono. El propio brand pack de
BMW (`brands/bmw/tokens/brand-tokens.json`, investigado con observación real de
`bmw.es/es/coches-bmw/x/x1/bmw-x1.html` el 2026-07-24) documenta que la fotografía lleva el peso
visual de la comunicación y que los iconos están desaconsejados — forzarla en un patrón pensado
para grids de beneficios con icono y tarjetas de credibilidad producía una newsletter "genérica"
según feedback real del usuario, aunque cada dato individual fuera correcto. Este patrón es la
migración de esa campaña a una secuencia realmente distinta, no solo un recorte del anterior.

## 1. Secuencia de componentes

| # | Componente (`engine/components/`) | Fondo | Obligatorio |
|---|---|---|---|
| — | `_shell.html` (envoltorio, no es un módulo) | — | Siempre |
| 1 | `header-logo.html` | Blanco | Sí |
| 2 | `hero-imagen.html` — **sin alternativa** (ver §3, no hay fallback a `hero-centrado` en este patrón) | Imagen real a todo el ancho | Sí |
| 3 | `intro-cta.html` o `intro-cta-asimetrico.html` (Nivel 2) | Blanco | Opcional (ver §3) |
| 4 | `editorial-foto-texto.html` o `editorial-foto-texto-inverso.html` | Blanco | Opcional (ver §3 y §8) |
| 5 | `metric-strip-premium.html` | Blanco | Opcional (ver §3) |
| 6 | `columns-3-beneficios-sin-icono.html` — **sin alternativa** (ver §3, no se usan variantes con icono en este patrón) | `surfaces.sectionLila` | Opcional (ver §3) |
| 7 | `banda-cierre.html` o `banda-cierre-asimetrico.html` (Nivel 2) | `colors.deep` | Sí |
| 8 | `footer.html` | `surfaces.global` | Siempre |

<!-- PATTERN_SEQUENCE (bloque parseable por engine/build-newsletter.js. GRAMÁTICA, no lista
     rígida, desde 2026-07-24 — ver la cabecera de engine/lib/pattern.js:
       "N. alternativas (required|optional[, max N])"  → ANCLA (posición fija)
       "-  alternativas (required|optional[, max N])"  → ZONA LIBRE (orden libre, repetible)
     Las líneas "-" consecutivas forman una zona. Mantener sincronizado a mano con la tabla.
     NOTA de este patrón: el hero sigue SIN alternativa (hero-imagen, sin fallback) — esa
     restricción es intencional y de identidad, no arbitraria (ver §3). Lo que se libera es el
     cuerpo: una marca fotográfica puede querer 2 bloques editoriales alternando foto y texto,
     algo que la lista rígida anterior hacía imposible. -->
1. header-logo (required)
2. hero-imagen (required)
- intro-cta|intro-cta-asimetrico (optional, max 3)
- editorial-foto-texto|editorial-foto-texto-inverso (optional, max 3)
- metric-strip-premium (optional, max 2)
- columns-3-beneficios-sin-icono (optional, max 2)
3. banda-cierre|banda-cierre-asimetrico (required)
4. footer (required)
<!-- /PATTERN_SEQUENCE -->

## 2. Reglas de ritmo

|||| # | Sección | Fondo | Alineación | Densidad |
|---|---|---|---|---|---|---|
|||| 1 | Cabecera (logo) | Blanco | Centrada | Baja |
|||| 2 | Hero (fotografía real) | Imagen a todo el ancho | Centrada | Alta (la fotografía lleva el peso visual, no el texto) |
|||| 3 | Intro + CTA (opcional) | Blanco | Centrada | Baja |
|||| 4 | Editorial foto+texto (opcional) | Blanco | Izquierda (imagen 46% / texto 54%) | Media (la imagen mantiene el peso visual, el texto es breve) |
|||| 5 | Métricas premium (opcional) | Blanco | Centrada | Media |
|||| 6 | Beneficios sin icono (opcional) | `surfaces.sectionLila` | Centrada | Media |
|||| 7 | Banda de cierre | `colors.deep` (o color oscuro de marca) | Centrada | Media |
|||| 8 | Footer | `surfaces.global` (gris) | Centrada | Baja |

**Regla dura (heredada de `saving.md`/`institutional.md`): ninguna sección consecutiva repite la
misma combinación fondo+alineación+densidad.** Verificado con la secuencia completa: 1→2 cambia
fondo+densidad, 2→3 cambia fondo+densidad, 3→4 cambia alineación (centrada→izquierda), 4→5 cambia
fondo+densidad, 5→6 cambia fondo, 6→7 cambia fondo+densidad. También verificado con los 3 módulos
opcionales omitidos (el caso mínimo: solo header-logo → hero-imagen → banda-cierre → footer):
1→2 cambia fondo+densidad, 2→5 (hero→banda) cambia fondo+densidad, 5→6 cambia fondo+densidad —
se mantiene sin huecos incluso saltando slots opcionales.

## 3. Obligatorio vs. opcional

| Módulo | Regla |
|---|---|
| Cabecera, hero, banda de cierre, footer | **Obligatorios.** No hay pieza `fotografia-primero` sin estos 4. |
| Hero | **Siempre `hero-imagen`, sin fallback.** A diferencia de `saving.md`/`institutional.md` (que caen a `hero-centrado` si no hay arte generado o cifra de marca confirmada), este patrón existe específicamente para el caso en que la fotografía real es el elemento central — si `hero-imagen` no se puede generar (ver `agents/06-data-specialist.md`, "Generar el arte del hero"), **no se usa este patrón**, se elige `institutional` o `saving` con `hero-centrado` en su lugar. Nunca se degrada este patrón a un hero de color sólido. |
| Intro + CTA | **Opcional.** Igual criterio que `institutional.md` §3: solo si el brief aporta un párrafo de transición real, breve — la brevedad es parte del lenguaje de marca de este patrón (voice.rhythm suele documentar frases cortas), no se rellena para ocupar espacio. |
| Editorial foto+texto | **Opcional (máx. 3).** Bloque editorial que alterna imagen y texto en columnas (46/54%). La variante `editorial-foto-texto-inverso` invierte el orden (texto izquierda, imagen derecha). **Preferir este bloque frente a repetir `intro-cta`** cuando el brief tiene imágenes secundarias útiles (producto en uso, lifestyle, detalle) o cuando `layout.contentRhythm.sections[]` de la página real muestra secciones de tipo foto+texto. Repetir `intro-cta` solo está permitido si `module-selection.md` justifica que no hay imágenes secundarias útiles o que la página real realmente usa bloques text-only (ver §8). |
|| Beneficios sin icono | **Opcional.** Solo si el brief tiene 3 razones/argumentos reales de longitud comparable. A diferencia de `institutional.md`, aquí es opcional y no obligatorio — una marca fotografía-primero puede legítimamente no necesitar ningún bloque de texto estructurado entre el hero y el cierre (la fotografía y el CTA pueden bastar). **Nunca usar `columns-3-beneficios.html` ni `-asimetrico` (con icono) en este patrón** — si el brief necesita iconos reales, este no es el patrón correcto (usar `institutional` con las variantes `-img`). |
|| Métricas premium | **Opcional (máx. 2).** Tira de métricas premium para marcas automotrices o técnicas que presentan datos (potencia, aceleración, autonomía) como contenido editorial: números grandes, labels breves, sin iconos ni caja highlight. Sustituye a `columns-3-beneficios-sin-icono` cuando las métricas son el contenido, no un adorno. Ver `metric-strip-premium.html` para el contrato de datos. |
| Banda de cierre | **Obligatorio.** Mismo CTA del hero o su continuación natural, copy de cierre sin inventar plazos/descuentos no confirmados. |
| Footer | Datos legales de la marca. Bloquear en producción (`productionReady:false`) hasta tenerlos; placeholder solo si `metadata.isTestCampaign:true`. |

## 4. Contrastes mínimos (WCAG) — calculados para `brands/bmw/tokens/brand-tokens.json` v2.2.0

Misma regla que `saving.md`/`institutional.md` (umbral 3:1 si ≥24px normal o ≥18.66px
bold/semibold; si no, 4.5:1). Valores calculados con la fórmula de luminancia relativa WCAG 2.x
contra los hex reales del pack de BMW (script Node ad hoc, no copiados de otro pack).

| Combinación | Contexto | Tamaño/peso | Umbral | Ratio real | Resultado |
|---|---|---|---|---|---|
| `#FFFFFF` / `#1C69D4` | Texto del CTA principal | 15px/500 | Normal (4.5:1) | 5.22:1 | ✅ PASS |
| `#262626` / `#FFFFFF` | Body sobre blanco | 14-16px/400 | Normal (4.5:1) | 15.13:1 | ✅ PASS |
| `#6F6F6F` / `#FFFFFF` | Texto secundario sobre blanco | 12-13px/400 | Normal (4.5:1) | 5.02:1 | ✅ PASS |
| `#6F6F6F` / `#F4F4F4` | Footer texto / footer fondo | 11-12px/400 | Normal (4.5:1) | 4.57:1 | ✅ PASS (ajustado — margen pequeño, mismo patrón que `institutional.md`, no bajar más la opacidad del texto en este fondo) |
| `#000000` / `#FFFFFF` | Texto primario sobre blanco | cualquiera | — | 21.00:1 | ✅ PASS |

**Corregido 2026-07-24 (era un "Pendiente" impreciso):** esta nota original asumía que el `h1`/
`subtitle` del hero se renderizaban superpuestos directamente sobre la fotografía, y que por
tanto su contraste dependería de la imagen generada en cada campaña, no calculable de antemano.
Verificado contra la implementación real de `engine/components/hero-imagen.html`: NO es así — el
banner de imagen ocupa su propia fila (`<tr>`) en la parte superior, decorativo y sin texto
dentro (regla del flujo `generate-hero-image`), y `hero.brandName`/`h1`/`subtitle`/CTA se
renderizan DEBAJO, en filas separadas sobre el fondo sólido de marca (`colors.primary`, más el
`gradients.heroBackground` añadido 2026-07-24 — ver `engine/CHANGELOG.md`, "gradientes
bulletproof"), nunca superpuestos a la foto. El texto no está nunca sobre píxeles de fotografía
real, así que su contraste SÍ es calculable de antemano exactamente igual que en el resto de
combinaciones de esta tabla — no hace falta ningún overlay/scrim: no hay superposición que
resolver. Si en el futuro se diseña una variante que sí superponga texto sobre la foto (hero de
estilo "editorial a sangre completa"), esa variante nueva sí necesitaría declarar su propio
scrim/overlay y su propia fila de la tabla de contrastes — no es el caso de `hero-imagen.html`
hoy.

## 5. Límites conocidos de este patrón

- Solo 7 slots (frente a 8 de `institutional.md`) — deliberado, no un recorte accidental: este
  género es para marcas donde menos módulos de texto estructurado es la decisión correcta, no
  una limitación del motor.
- No tiene `category-grid` ni `usp-cards` — si una campaña fotografía-primero necesita un grid de
  categorías o tarjetas de credibilidad más adelante, evaluar entonces si se añaden a este
  patrón o si la campaña en realidad encaja mejor en `institutional` (regla anti-aspiracional:
  no añadir estos slots sin una campaña real que los necesite).
- `columns-3-beneficios-sin-icono.html` es de 3 columnas fijas — mismo límite heredado que su
  variante con icono.

## 6. Cuándo elegir este patrón (vs. `institutional` o `saving`)

Criterios concretos, verificables contra el `brand-tokens.json` real de la marca — no una
impresión subjetiva de "se ve premium":

1. **`photography.usesRealPhotography: true`** Y `photography.treatment` describe la fotografía
   como el elemento que "lleva el peso visual de la comunicación" (o lenguaje equivalente) — no
   solo que existan fotos, sino que sean protagonistas, no ilustrativas.
2. **`iconography.componentImplication` desaconseja explícitamente iconos/emoji** — el pack dice
   algo como "priorizar fotografía sobre iconos" o "valorar si los iconos son necesarios".
3. **`layout.contentRhythm`** (ver `agents/02-brand-visual-analyst.md`, nueva investigación de
   ritmo estructural) documenta que la página real de referencia alterna bloques grandes de
   fotografía con texto breve (titular + 1 párrafo corto), y NO es una página de comparación de
   precios/tarifas ni un catálogo/grid extenso de productos o categorías.
4. **Ninguna cifra de ahorro/comparación confirmada que justifique `saving.md`** (ver
   `saving.md` §4 — si el brief trae una cifra de ahorro real, ese patrón sigue siendo el
   correcto para campañas de ese género, independientemente de la fotografía de marca).
5. **Ningún catálogo/listado real de 2-8 categorías o líneas de producto** que justifique
   `category-grid` de `institutional.md` — si existe ese catálogo, `institutional` sigue
   siendo más adecuado aunque la marca tenga fotografía fuerte.

Si (1) y (2) se cumplen pero (3) muestra una página de referencia con muchas secciones de datos
técnicos/tablas de precios (como la ficha completa de un modelo en `bmw.es`, que combina
fotografía con configurador, tablas de potencia y ofertas de financiación) — **no se traduce
esa densidad de datos al email**: se documenta en `layout.contentRhythm` qué partes son
traducibles (fotografía + titular + CTA) y cuáles no (tablas de financiación, configurador), y
el patrón sigue siendo válido para la parte traducible. La densidad de datos de la página web no
obliga a replicar esa densidad en el email.

## 7. Verificación

Primera campaña real construida con este patrón: `newsletters/2026/bmw/2026-jul-bmw-x1-descubre`
(migrada desde `institutional` el 2026-07-24 — ver `engine/CHANGELOG.md`). Sus 6 módulos
(`header-logo`, `hero-imagen`, `intro-cta`, `columns-3-beneficios-sin-icono`, `banda-cierre`,
`footer`) ya coincidían con esta secuencia antes de que el patrón existiera formalmente (estaban
forzados dentro de `institutional` con 2 slots opcionales — `category-grid`, `usp-cards` —
simplemente sin usar). El cambio de patrón no altera un solo byte del HTML resultante; solo
corrige qué patrón certifica esa estructura como intencional en vez de accidental.
