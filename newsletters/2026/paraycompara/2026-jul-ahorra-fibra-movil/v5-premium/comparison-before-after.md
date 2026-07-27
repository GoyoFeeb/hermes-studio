# Comparación antes / después — v5-premium vs. v3-premium/final-fixed-v4.1

## Problemas originales (de la auditoría, ver `00-entregables-iniciales-evolucion-premium.md`)

| # | Problema | Severidad | Resuelto en v5-premium |
|---|---|---|---|
| C1 | Hero sin contenido visual real — placeholder gris "ASSET HERO PENDIENTE" | Crítico | ✅ Sí — hero editorial tipográfico sobre fondo de marca, sin dependencia de ningún asset |
| C2 | Trust bar con glifos de texto inconsistentes (`%`, `$`, `OK`) | Crítico | ✅ Sí — check (✓) único y consistente en los 3 items |
| C3 | Repetición del mismo molde de tarjeta en 3 secciones seguidas | Crítico | ✅ Parcial — "qué tener en cuenta" pasa a formato de lista editorial; tarifas y pasos mantienen su propio molde (ya diferenciado entre sí por icono/circulo) |
| I1 | CTA final idéntico al CTA hero | Importante | ✅ Sí — banda de cierre con fondo `#3E244D` (nunca usado en el HTML real hasta ahora), titular y subtítulo propios |
| I2 | Jerarquía tipográfica plana entre títulos de sección | Importante | ✅ Parcial — se introduce una escala documentada (`design-tokens-premium.json`), aunque los H2 de sección se mantienen en 22px por legibilidad; la diferenciación real viene del color de fondo de cada sección, no solo del tamaño |
| I3 | Cajas dentro de cajas en las tarjetas | Importante | ➖ No resuelto en esta versión — las tarjetas de tarifa se mantienen porque la propia auditoría anterior (`visual-qa-phase1.md` §8) las valida como correctas; cambiarlas habría sido decorar sin necesidad, en contra del principio de diseño #1 |
| I4 | Footer sin cierre de marca | Importante | ✅ Sí — línea "Para y Compara / Comparador independiente de tarifas de fibra, móvil y televisión." antes del bloque legal |

## Cambios estructurales

- El **header y el hero se fusionan en un único bloque de marca** (mismo color de fondo `#5E2E91`, sin transición) en vez de dos secciones separadas por un cambio de color duro.
- Se añade una **cifra de marca ("+30" compañías)** como elemento visual central del hero, sustituyendo la necesidad de una fotografía.
- Se añade una **banda de cierre** (`#3E244D`) entre "qué tener en cuenta" y el footer — antes el CTA final vivía dentro de la misma sección lila que el resto del contenido.
- El bloque "qué tener en cuenta" pasa de 4 tarjetas circulares en grid 2×2 a una **lista vertical de 4 filas con acento de color lateral**.

## Cambios visuales

- Nueva escala tipográfica: H1 hero 30px → 32px; se añade un tamaño de "cifra de marca" (40px/800) que no existía; los títulos de sección mantienen 22px pero ahora alternan sobre fondos distintos para diferenciarse.
- Trust bar: `%`/`$`/`OK` → `✓` en los tres círculos, mismo tamaño de fuente (12px) en los tres (antes uno de ellos, "OK", estaba a 8px por necesidad de que cupiera el texto).
- Nuevo uso del token de marca `deep` (`#3E244D`), documentado en `brand-tokens.json` desde el origen del sistema pero nunca aplicado a ningún HTML real hasta esta versión.
- Micro-enlaces "Ver tarifas →" añadidos a las 4 tarjetas de tarifa (antes las tarjetas no tenían ningún elemento interactivo propio, solo el CTA general de la newsletter).
- Línea conectora entre los 3 pasos numerados (antes: solo una flecha de texto `→`, oculta en mobile sin sustituto).

## Componentes nuevos

- Hero editorial sin foto (`heroEditorialNoPhoto`).
- Trust bar con check consistente (`trustCheckmark`).
- Lista con acento de color (`listAccentBar`).
- Banda de cierre (`closingBand`).

Los cuatro documentados con propósito, variantes, props, reglas de contenido, responsive y compatibilidad en `component-patterns.md`, para que sean reutilizables en futuras campañas de Para y Compara (o de otra marca, sustituyendo tokens).

## Componentes modificados

- **CTA**: sin cambios en su anatomía (tabla + VML), pero ahora se usa también en modo `mobile-full` (ancho completo en mobile) en los dos sitios donde aparece — en v4.1 el CTA nunca pasaba a ancho completo en mobile.
- **Footer**: se añade un bloque de cierre de marca antes del contenido legal existente, que no se modifica.
- **Tarjetas de tarifa**: mismas dimensiones, radio y estructura; se añade el micro-enlace de cierre.

## Mejoras responsive

- CTA a ancho completo en mobile (nuevo, en ambos usos).
- Escalado tipográfico específico del hero en mobile (`mobile-hero-h1`, `mobile-hero-stat`) — v4.1 no ajustaba el tamaño del H1 del hero para pantallas pequeñas.
- Nueva clase `mobile-pad-sm` para homogeneizar el padding lateral en mobile en todas las secciones nuevas.

## Mejoras / cambios de compatibilidad

- Se añade `<meta name="color-scheme" content="light dark">` y `<meta name="supported-color-schemes" content="light dark">` (resolviendo IS-10, pendiente desde `v3-premium/issues-found.md`).
- El "acento" de la lista editorial usa una celda de tabla con `background-color`, no `border-left` CSS, evitando el problema conocido de Outlook con bordes en celdas.
- Se mantiene exactamente la misma técnica VML + tabla anidada para los botones — 4 ocurrencias de `v:roundrect`, igual que v4.1.

## Riesgos

Ver tabla completa en `00-entregables-iniciales-evolucion-premium.md` §7. Resumen: el hero editorial es una solución tipográfica válida de forma permanente, no un sustituto forzado de una fotografía futura; el color `#3E244D` es un token ya documentado, no inventado; esta versión hereda el mismo riesgo de mantenimiento que `v3-premium` (vive fuera del pipeline React Email, no se regenera automáticamente desde `newsletter-data.json`).

## Diferencias de HTML

| | v4.1 (`v3-premium/final-fixed-v4.1.html`) | v5-premium (`final-premium.html`) |
|---|---|---|
| Tamaño editable | 31 KB | 35.5 KB (+14%) |
| Tamaño inline | 31 KB | 34.3 KB (+11%) |
| VML (`v:roundrect`) | 4 | 4 (sin cambios) |
| `role="presentation"` | No contado en este análisis | 42 |
| Secciones de fondo distinto | 4 (morado header, lila hero+trust+pasos, blanco tarifas+aspectos, gris footer) | 6 (morado apertura, blanco trust+tarifas, lila pasos, blanco lista, morado oscuro cierre, gris footer) |
| Placeholders legales | `[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`, `[DIRECCIÓN FÍSICA...]` | Idénticos, sin modificar |

## Capturas

- `preview-desktop.png` — aproximación a 600px generada con WeasyPrint. Las imágenes remotas no cargaron por una restricción de red del entorno de trabajo (ver `qa-report.md`), no por un error del HTML.
- `preview-mobile.png` — aproximación a 375px; **no refleja el apilado real** porque WeasyPrint no evalúa media queries de pantalla como un navegador (ver limitación documentada en `qa-report.md`). Se recomienda regenerar en un entorno con Chromium/Litmus antes de aprobar para producción.

## Validación objetiva de si la evolución es real

- Resuelve 2 de 3 problemas críticos por completo y 1 parcialmente, sin retroceder en ninguno de los puntos que la autoauditoría anterior ya calificaba como PASS (tarjetas de tarifa, ritmo vertical, ausencia de espacios muertos).
- Introduce 4 patrones nuevos reutilizables, documentados con la misma disciplina que ya usa el sistema (props, reglas de contenido, compatibilidad) en vez de quedar como cambios sueltos de esta campaña.
- No degrada ninguna de las verificaciones técnicas ya superadas por v4.1 (VML, `role="presentation"`, ausencia de JS/flexbox/grid, placeholders legales intactos).
- Aumenta el peso del HTML un 11-14%, dentro de márgenes aceptables para email.

---

## Segunda ronda de evolución (2026-07-15, aplicada sobre `final-premium-v2.html`)

### Cambios desde la última auditoría

| # | Cambio | Tipo | Detalle técnico |
|---|---|---|---|
| G1a | Degradados falsos → transiciones suaves | Mejora técnica | 24 bandas de 1px con interpolación lineal (14 colores entre #5E2E91→#FFFFFF, etc.) en vez de 6 bandas de 4px con saltos visibles. Aplicado en las 5 transiciones (hero→trust, trust→cards, cards→pasos, pasos→lista, lista→cierre). |
| G1b | Sombra en tarjetas | Visual | `box-shadow:0 2px 8px rgba(94,46,145,0.10)` en las 4 tarjetas de tarifa. Sombra tintada de marca (morada) en vez de gris neutro. |
| G1c | Iconos liberados de caja lila | Estructural | Icons a 48px directos sobre la tarjeta (sin la tabla anidada con fondo #F3E5F5), resolviendo el patrón "caja dentro de caja" documentado como I3 en la auditoría. |
| G1d | Eyebrows sobre H2 de sección | Visual | "QUÉ PUEDES COMPARAR", "EN 3 PASOS", "ANTES DE DECIDIR" — 12px/700/2.5px letter-spacing/#7B1FA2, sobre cada H2 de sección. |
| G1e | Sombra en CTAs | Visual | `box-shadow:0 4px 12px rgba(255,90,60,0.35)` en ambos CTA (hero y banda de cierre) — misma profundidad que las tarjetas, pero con sombra naranja tintada. |
| G1f | Textura de marca en cierre | Visual | `brand-pattern-tile.png` aplicado también en la banda de cierre (`background="#3E244D"` + `bgcolor="#3E244D"`), creando un efecto bookend apertura/cierre. |
| G1g | Halo en círculos numerados | Visual | Anillo de 4px `#DCC7E5` (border-radius:50%, padding:4px) alrededor de cada círculo 01/02/03. |
| G1h | Micro-enlaces convertidos a chips | Visual | "Ver tarifas →" pasa de texto subrayado a chip con `background-color:#FDEDE9;padding:6px 14px;border-radius:20px`. |
| G1i | Fallback tipográfico ampliado | Técnico | `font-family:'Sora','Segoe UI',Arial,Helvetica,sans-serif` — Segoe UI como puente visual entre Sora y Arial para Windows. |

### Refinamientos adicionales (esta ronda)

| # | Cambio | Tipo | Detalle |
|---|---|---|---|
| G2a | Separadores entre items de trust bar | Visual | `width="1"` vertical `#EDE7F3` entre las 3 columnas de la trust bar, oculto en mobile (`class="mh"`). |
| G2b | Espaciado eyebrow→H2 ajustado | Espaciado | `margin-bottom` de 8px a 6px en los 3 eyebrows de sección, para mejorar la conexión visual con el título. |
| G2c | Inline regenerado con juice | Técnico | `final-premium-v2-inline.html` regenerado desde fuente (juice), sustituyendo la versión sincronizada a mano — verificado sin divergencias. |

### Verificación del inline

| Check | Hand-sync | Juice | Resultado |
|---|---|---|---|
| `v:roundrect` | 4 | 4 | ✅ |
| `box-shadow` | 6 | 6 | ✅ |
| `background=` | 2 | 2 | ✅ |
| `brand-pattern-tile` | 2 | 2 | ✅ |
| `Sora` | 10 | 10 | ✅ |
| `Segoe UI` | 8 | 8 | ✅ |
| `FDEDE9` | 4 | 4 | ✅ |
| `DCC7E5` | 5 | 5 | ✅ |

### Archivos

- `final-premium-v2.html` — fuente editable con todos los cambios
- `final-premium-v2-inline.html` — inline regenerado con juice (47.9 KB)
- `comparison-before-after.md` — actualizado
- `qa-report.md` — actualizado
- `design-tokens-premium.json` — actualizado con nuevos tokens
- `component-patterns.md` — actualizado con nuevo patrón circleHalo

---

## Tercera ronda de evolución (G3, 2026-07-15)

### Auditorías previas

| Auditoría | Resultado |
|---|---|
| **Contraste #7B1FA2** (eyebrow, 12px uppercase) sobre #FFFFFF | **8.20:1** ✅ Supera WCAG AA (4.5:1) y AAA (7:1) |
| **Contraste #7B1FA2** sobre #F8F5FC | **7.60:1** ✅ Supera AA |
| **Contraste #E4CDF0** (hero eyebrow) sobre #5E2E91 | **6.28:1** ✅ Supera AA |
| **Iconos tarifa** — pesos y estilos | ⚠️ Diferencia de 2x entre el más pequeño (1.8 KB) y el más grande (3.9 KB). Posible diferencia de complejidad. Documentado como riesgo. |
| **Clase `mh`** — verificación de bug reportado en protocolo | ❌ Falso positivo: la tabla de G2 reportó `class="mh"` pero el código real usa `class="mobile-hide"` (que sí está definida en `@media`). **Corregida la documentación**, no el código. |

### Cambios aplicados

| # | Cambio | Tipo | Detalle técnico |
|---|---|---|---|
| G3a | Sombra en trust bar | Elevación | `box-shadow:0 1px 4px rgba(94,46,145,0.08)` en la píldora de la trust bar, coherente con la elevación de las tarjetas y los CTA. |
| G3b | Borde superior en footer | Visual | `border-top:2px solid #DCC7E5` en el bloque de marca del footer, para darle un cierre visual propio antes del bloque legal. |
| G3c | Iconos auditados | Riesgo documentado | 4 iconos HTTP 200 desde CDN. Pesos: 1.8 KB (móvil) a 3.9 KB (fibra+móvil). Estilos visuales presumiblemente consistentes (misma paleta, mismo trazo). Diferencia de peso documentada como posible indicio de complejidad desigual. |

### Cross-check final

| Patrón | v1.html | v2.html | v2-inline | Resultado |
|---|---|---|---|---|
| `v:roundrect` | 4 | 4 | 4 | ✅ |
| `box-shadow` | 6 | 7 | 7 | ✅ (1 nueva: trust bar) |
| `brand-pattern-tile` | 2 | 2 | 2 | ✅ |
| `background=` | 2 | 2 | 2 | ✅ |
| `Sora` | 10 | 10 | 10 | ✅ |
| `Segoe UI` | 8 | 8 | 8 | ✅ |
| `FDEDE9` | 4 | 4 | 4 | ✅ |
| `DCC7E5` | 5 | 6 | 6 | ✅ (1 nuevo: footer border) |
| Size | 48.6 KB | 48.7 KB | 48.2 KB | ✅ |

### Archivos

- `final-premium-v2.html` — actualizado con G3a+G3b
- `final-premium-v2-inline.html` — regenerado con juice
- `comparison-before-after.md` — actualizado
- `qa-report.md` — actualizado
- `design-tokens-premium.json` — actualizado
- `component-patterns.md` — actualizado

---

## Cuarta ronda de evolución (G4, 2026-07-16) — sistema de acento premium

### Motivación

Rondas anteriores (G1-G3) resolvieron degradados, sombras de tarjeta/CTA/trust-bar, iconos, contraste y bordes. Quedaban "planos" tres elementos: los eyebrows de sección (sin ningún refuerzo visual propio), las tarjetas de tarifa (sin firma de marca en la parte superior) y la cifra "+30" del hero (texto flotando directamente sobre el fondo, sin la sensación de "insignia" que sí tienen ya las tarjetas y el CTA). G4 cierra ese hueco reutilizando colores ya existentes en vez de introducir una paleta nueva.

### Cambios aplicados

| # | Cambio | Tipo | Detalle técnico |
|---|---|---|---|
| G4a | Kicker rule sobre eyebrows | Visual | Línea centrada 32×2px, `background-color:#7B1FA2` (token `light`, ya usado en el texto de los eyebrows), en las 3 secciones de contenido (tarifas, pasos, antes de decidir). |
| G4b | Franja superior en tarjetas de tarifa | Visual | 4px, `background-color:#7B1FA2`, `border-radius:14px 14px 0 0`, primera fila de las 4 tarjetas — les da una firma de marca que antes solo tenían el icono y el borde neutro. |
| G4c | Sombra en halo de pasos numerados | Elevación | `box-shadow:0 2px 6px rgba(94,46,145,0.18)` en el halo de los círculos 01/02/03 — coherente con la escala de elevación ya usada en tarjetas/CTA/trust bar. |
| G4d | Sombra en círculos de check de trust bar | Elevación | `box-shadow:0 1px 3px rgba(94,46,145,0.20)` en los 3 círculos de check — mismo criterio que G4c, unifica todos los elementos circulares de la pieza bajo una escala de elevación común. |
| G4e | Pill de fondo en la cifra "+30" del hero | Visual/Estructural | La cifra y su label pasan de "texto sobre fondo de marca" a "chip elevado": tabla contenedora con `background-color:#7B1FA2`, `border-radius:20px`, `box-shadow:0 4px 14px rgba(62,36,77,0.28)`. El color del label cambia de `#C9A8DB` a `#E4CDF0` (token ya usado en el eyebrow del hero) para mantener contraste AA sobre el nuevo fondo (verificado: 5.59:1, el anterior habría dado 3.95:1). |

### Componentes nuevos

- Sistema de acento premium (`accentSignature`) — kicker rule + card top stripe, documentado en `component-patterns.md` §9.
- Elevación de insignias circulares (`badgeElevation`) — §10.
- Pill de cifra de marca (`statPill`) — §11.

### Disciplina de color

Ningún color nuevo: todo G4 reutiliza `#7B1FA2` (ya usado en los 3 eyebrows desde v5-premium base) y `#E4CDF0` (ya usado en el eyebrow del hero) — coherente con la práctica ya establecida en G1-G3 de no inventar tokens.

### Verificación

| Check | v2 (pre-G4) | v2 (post-G4) | Resultado |
|---|---|---|---|
| Kicker rules | 0 | 3 | ✅ |
| Card top stripes | 0 | 4 | ✅ |
| Sombras badge (paso + check) | 0 | 6 (3+3) | ✅ |
| Stat pill | 0 | 1 | ✅ |
| `v:roundrect` | 4 | 4 | ✅ sin cambios |
| `box-shadow` total | 7 | 14 | ✅ (+7, las 5 nuevas categorías de G4) |
| Tamaño inline | 48.2 KB | 51.5 KB | +6.8% |

### Limitación

Sin verificación visual real esta ronda (sin Chromium ni WeasyPrint disponibles en el entorno) — ver detalle en `qa-report.md` § "Cuarta ronda QA". Recomendación sin cambios respecto a rondas anteriores: confirmar en Chromium/Litmus antes de producción.

### Archivos

- `final-premium-v2.html` — actualizado con G4a-G4e
- `final-premium-v2-inline.html` — regenerado con juice (51.5 KB)
- `comparison-before-after.md` — actualizado
- `qa-report.md` — actualizado
- `design-tokens-premium.json` — actualizado (shadows.badgeStep/badgeCheck/statPill, patterns.accentSignature/statPill/badgeElevation)
- `component-patterns.md` — actualizado (§9, §10, §11)

---

## Quinta ronda de evolución (G5, 2026-07-16) — rediseño de "Antes de decidir"

### Motivación

Feedback directo sobre una captura: "esta sección es la que más hay que mejorar de todas". Comparada con el resto de la pieza (tarjetas con sombra en tarifas, badges con halo en pasos, pill elevado en el hero desde G4), la sección "Antes de decidir" seguía siendo solo texto con una barra de color de 4px — la única sección sin tarjeta, sombra ni elemento circular.

### Cambio

| # | Cambio | Tipo | Detalle técnico |
|---|---|---|---|
| G5a | `listAccentBar` → `premiumListRow` | Estructural | Cada uno de los 4 ítems pasa de "texto + barra de color" a una tarjeta completa: mismo `border`/`border-radius:16px`/`box-shadow` que las tarjetas de tarifa, franja superior de `accentSignature` (G4, color `light` #7B1FA2) y un badge circular de check de 36px (color `primary` #5E2E91, sombra `badgeCheck` de G4), en vez del glifo de texto suelto que tenía antes. |

### Por qué el badge es morado, no naranja

La barra de acento original era naranja (`ctaBackground`). Se evaluó mantener ese naranja en el nuevo badge circular, pero el check blanco sobre `#FF5A3C` da solo 3.10:1 de contraste (falla WCAG AA-normal, 4.5:1). Sobre `primary` (#5E2E91, el mismo morado ya usado en el badge de check de la trust bar) da 9.23:1. Se prioriza legibilidad verificada sobre la diferenciación cromática — la franja superior en `light` (#7B1FA2) ya aporta variación de color suficiente frente a la trust bar sin comprometer contraste.

### Validación objetiva

- Reutiliza 3 patrones ya validados en la propia pieza (tarjeta de tarifa, franja de `accentSignature`, badge de `trustCheckmark`) — cero técnicas nuevas, cero riesgo de compatibilidad nuevo.
- Balance de tags HTML verificado exacto (52/52 tablas, 200/200 tr, 220/220 td) en fuente e inline tras el cambio.
- Copy, CTAs y placeholders legales sin ninguna modificación.
- Contraste del elemento nuevo (badge) calculado y verificado antes de fijar el color, no después.
- Compromiso consciente: +4.1 KB (+8%) en el HTML inline por el peso de 4 tarjetas nuevas — dentro de márgenes aceptables.

### Archivos

- `final-premium-v2.html` — sección "Antes de decidir" reescrita con `premiumListRow`
- `final-premium-v2-inline.html` — regenerado con juice (55.6 KB)
- `comparison-before-after.md` — actualizado
- `qa-report.md` — actualizado (ronda G5)
- `design-tokens-premium.json` — actualizado (`patterns.premiumListRow`)
- `component-patterns.md` — actualizado (§4 marcada como sustituida en esta campaña, §12 nuevo)

---

## Sexta ronda de evolución (G6, 2026-07-16) — pase "estilo Apple" en toda la pieza

### Motivación

Petición explícita: "afinar todas las secciones en general, basándote en la página y newsletters de Apple". A diferencia de G1-G5 (cambios localizados en secciones concretas), G6 es una revisión transversal aplicada a las 7 secciones de la pieza (hero, trust bar, tarifas, pasos, antes de decidir, cierre, footer), basada en 3 rasgos reconocibles del lenguaje de Apple: sombras difusas (no marcadas), tracking negativo en type grande, y espaciado generoso.

### Cambios por categoría

| # | Cambio | Alcance | Detalle |
|---|---|---|---|
| G6a | Sombras difusas | Las 7 sombras del sistema (22 ocurrencias) | Blur mayor, offset mayor, alpha menor — de "sombra pegada" a "elevación suave". Ver tabla de valores en `design-tokens-premium.json` → `shadows` |
| G6b | Tracking negativo | H1 hero, stat "+30", 3× H2 de sección, headline de cierre (6 ocurrencias) | -0.5px a -1px según tamaño — más tracking negativo cuanto más grande el texto |
| G6c | Eyebrows | 4 etiquetas en mayúsculas | `letter-spacing` 2.5px→3px |
| G6d | Radios | 8 tarjetas + 1 pill + 8 franjas | card 16→18px, statPill 20→24px, stripe 14→16px |
| G6e | Espaciado de secciones | 3 secciones de contenido + banda de cierre + footer | Padding vertical +8/+12px por sección, para un ritmo más espacioso |
| G6f | Cuerpo de texto | 11 párrafos de descripción | `line-height` 1.45→1.5 (footer legal excluido a propósito) |
| G6g | CTA | 2 botones (hero + cierre) | Padding 14/32→17/36, sombra difusa |
| G6h | Footer | Nombre de marca | Peso 700→600, `letter-spacing:0.2px` — tono más discreto |

### Validación objetiva

- Cero cambios estructurales: no se añadió ni quitó ninguna tabla/fila/celda en esta ronda — balance de tags idéntico a G5 (52/52 tablas). Todo son ajustes de valores sobre propiedades ya existentes.
- Peso casi neutro: +0.2 KB sobre G5 (55.8 KB inline) — a diferencia de G4/G5, esta ronda no añade marcado nuevo.
- Copy, CTAs, placeholders legales y anatomía VML del botón sin ninguna modificación.
- Los 6 valores de tracking negativo y las 22 sombras verificados por conteo exacto en fuente e inline tras el inlining con juice.

### Limitación

Sin verificación visual real (Chromium/WeasyPrint no disponibles en este entorno) — los valores están razonados sobre principios de diseño de Apple ya conocidos por el equipo, no comparados pixel a pixel contra una captura real de apple.com en esta sesión.

### Archivos

- `final-premium-v2.html` — pase G6 aplicado a las 7 secciones
- `final-premium-v2-inline.html` — regenerado con juice (55.8 KB)
- `comparison-before-after.md` — actualizado
- `qa-report.md` — actualizado (ronda G6)
- `design-tokens-premium.json` — actualizado (shadows, radius, typography con notas `_g6`)
- `component-patterns.md` — actualizado (§13 nuevo)

---

## Séptima ronda de evolución (G7, 2026-07-16) — auditoría contra prompt maestro premium-conversión

### Motivación

El cliente aportó un prompt maestro de diseño de newsletter premium orientada a conversión. Se auditó la pieza contra sus principios y se corrigieron los 5 puntos donde el estado actual los contradecía. Filosofía del prompt: "menos elementos, mejor seleccionados, mejor jerarquizados" — la sensación premium debe venir del control y la disciplina, no de la acumulación de efectos.

### Cambios aplicados

| # | Principio del prompt | Cambio | Detalle |
|---|---|---|---|
| G7a | "Degradados innecesarios" / "fondos demasiado complejos" | Eliminadas las 5 zonas de transición degradada (120 filas de 1px) | Los cortes entre secciones ahora son limpios — el contraste de fondos hace el trabajo de separación, como en las piezas editoriales de referencia. −12 KB de marcado |
| G7b | "No añadas sombras fuertes a todos los módulos" | De 22 sombras a 11 | Solo conservan elevación los elementos con función de foco: tarjetas (8), CTAs (2) y stat pill (1). Trust bar, badges de check y halos de pasos vuelven a plano — la jerarquía de elevación ahora significa algo |
| G7c | "Evita exceso de mayúsculas" | CTA "COMPARAR TARIFAS" → "Comparar tarifas" | En las 4 ocurrencias (VML + HTML), manteniendo peso 700 y letter-spacing 0.5px |
| G7d | "CTA secundarios visualmente más discretos" | Chips → enlaces de texto | Los 4 "Ver tarifas →" pierden el fondo tipo botón (#FDEDE9) y pasan a texto naranja 13px — dejan de competir con el CTA principal |
| G7e | "Cuerpo de texto altamente legible" | Descripciones 13px → 14px | 12 párrafos de tarjetas/pasos/lista. Microcopy y legales sin cambios |

### Qué NO se cambió (decisiones de auditoría)

- Tarjetas de "Antes de decidir" (G5) — aprobadas explícitamente por el cliente
- Patrón de fondo hero/cierre — identidad de marca sutil con fallback sólido
- Eyebrows en mayúsculas — convención editorial de etiquetas, no el "exceso" que señala el prompt
- Kicker rules — ganan función como único marcador de sección tras eliminar los degradados
- Estructura de módulos — ya cumple el orden del prompt (preheader → cabecera+hero → confianza → propuesta de valor → pasos → argumentos → CTA de cierre → footer), con un único CTA principal reforzado en el cierre

### Validación objetiva

- Peso inline: 55.8 KB → 43.6 KB (−22%) — primera ronda que reduce en vez de añadir, coherente con la filosofía del prompt
- Balance de tags exacto (52/52 tablas, 80/80 tr, 100/100 td) en fuente e inline
- VML, media queries, placeholders legales y copy intactos (salvo el case del CTA)
- La acción principal sigue siendo única y consistente (mismo texto y destino en hero y cierre)

### Archivos

- `final-premium-v2.html` — auditoría G7 aplicada
- `final-premium-v2-inline.html` — regenerado con juice (43.6 KB)
- `comparison-before-after.md` — actualizado
- `qa-report.md` — actualizado (ronda G7, con decisiones de auditoría documentadas)
- `design-tokens-premium.json` — actualizado (shadows reducidas, chips retirados, notas `_g7`)
- `component-patterns.md` — actualizado (§14 nuevo)

---

## Octava ronda de evolución (G8, 2026-07-16) — de premium a profesional

### Motivación

Ejecución del `prompt-g8-rediseno-profesional.md`, generado a partir de un diagnóstico verificado de la pieza (8 hallazgos, D1–D8). Rondas G1–G7 trabajaron la estética; G8 trabaja la sustancia: medición, accesibilidad, honestidad técnica, robustez de cliente real y personalización.

### Cambios aplicados

| # | Hallazgo | Cambio |
|---|---|---|
| G8a (D1) | El peso 800 de Sora nunca cargó (ambos @font-face apuntaban al mismo woff2) | Bloque 800 eliminado, sintetización desde 700 documentada en CSS y tokens. URL real pendiente de entorno con red |
| G8b (D2) | 0 `<h2>` — títulos como `<p>` | 4 `<h2>` + 11 `<h3>` reales con estilos idénticos — estructura navegable por lector de pantalla |
| G8c (D3) | 8 enlaces a la home sin UTM | UTM por módulo en los 8 (hero-cta, card-movil/fibra/convergente/tv, closing-cta). Convención documentada en `docs/naming-conventions.md` como requisito de production gate |
| G8d (D4) | Copy genérico + superlativo con riesgo legal | 3 titulares reescritos con especificidad respaldada por el brief; "Las mejores ofertas" → "Comparador independiente". Prueba social no añadida (dato del brief pendiente de confirmación — no se inventa) |
| G8e (D5) | 26 text-align:center, ritmo de plantilla | Cabecera de "Antes de decidir" a la izquierda (con `align="left"` en td para Outlook) — primera variación real de composición |
| G8f (D6) | Iconos PNG dispares + checks tipográficos | `icon-system-spec.md`: set unificado de 6 iconos especificado para producción; estado actual documentado como placeholder consciente |
| G8g (D7) | Sin dark mode | `@media (prefers-color-scheme: dark)` con 9 clases defensivas y contrastes AA calculados. Gmail ignora el bloque (usa su propia inversión) — documentado |
| G8h (D8) | Sin personalización | Saludo `Hola {nombre},` con merge condicional Mailchimp y fallback sin nombre en el subtítulo del hero |

### Validación objetiva

- Los 9 criterios de aceptación del prompt: PASS (el de fuente por la vía honesta — opción B prevista en el propio prompt).
- Tablas 52/52, h2 4/4, h3 11/11 en fuente e inline; VML y placeholders intactos.
- Peso: 45.9 KB inline (+2.3 KB por dark mode, UTM y semántica — sigue 55% por debajo del límite).
- Copy solo con afirmaciones respaldadas por `00-brief/brief.md`; riesgo legal del superlativo eliminado.

### Archivos

- `final-premium-v2.html` / `final-premium-v2-inline.html` — G8 aplicado
- `prompt-g8-rediseno-profesional.md` — el prompt ejecutado
- `icon-system-spec.md` — nuevo (spec de iconos + técnica de solapamiento diferida)
- `docs/naming-conventions.md` — convención UTM añadida (nivel sistema)
- `qa-report.md`, `comparison-before-after.md`, `design-tokens-premium.json`, `component-patterns.md` — actualizados
