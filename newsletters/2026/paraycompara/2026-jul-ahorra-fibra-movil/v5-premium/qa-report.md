# QA Report — v5-premium

> Campaña: Para y Compara — 2026-jul-ahorra-fibra-movil
> Versión: v5-premium (evolución sobre v3-premium/final-fixed-v4.1)
> Fecha: 2026-07-14

---

## QA técnico

| Check | Resultado | Evidencia |
|---|---|---|
| HTML bien formado (DOCTYPE XHTML transitional, `<tbody>` no requerido porque todo usa `<table><tr>` sin `<tbody>` explícito, consistente con el resto del sistema) | ✅ PASS | Estructura idéntica al patrón ya validado en v4.1 |
| `role="presentation"` en todas las tablas de layout | ✅ PASS | 42 ocurrencias (`grep -c 'role="presentation"'`) |
| VML en ambos CTA (hero y banda de cierre) | ✅ PASS | 4 ocurrencias de `v:roundrect` en `final-premium.html` y en `final-premium-inline.html` (igual que v4.1) |
| CSS inline generado correctamente | ✅ PASS | `final-premium-inline.html` generado con el mismo mecanismo que usa el resto del sistema (`juice`, `preserveMediaQueries:true`) — 34.3 KB |
| Media queries conservadas en la versión inline | ✅ PASS | El bloque `@media only screen and (max-width:599px)` permanece en el `<head>` tras el inlining (verificado por inspección del archivo resultante) |
| Sin `[PENDIENTE]` en el HTML | ✅ PASS | `grep -c "PENDIENTE"` → 0 |
| Placeholders legales explícitos y sin resolver a valores inventados | ✅ PASS (intencional) | `[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`, `[DIRECCIÓN FÍSICA — pendiente del cliente]` se mantienen **textualmente iguales** a v4.1 — no se inventan enlaces ni dirección |
| Todas las imágenes con `width`/`height` explícitos y `alt` | ✅ PASS | Logo, iconos de tarifa: todos conservan los atributos de v4.1 |
| Enlaces (`href`) sin vacíos ni `#` | ✅ PASS | Todos los CTA y micro-enlaces "Ver tarifas →" usan `https://paraycompara.com/`, la misma URL de referencia ya usada y documentada en el brief (`00-brief/brief.md`: "Referencia oficial localizada. Pendiente de aprobación cliente.") — no se introduce ninguna URL nueva sin ese mismo nivel de aprobación |
| Peso del HTML | ✅ Aceptable | 35.5 KB editable / 34.3 KB inline — +13% sobre v4.1 (31 KB) por el contenido añadido (banda de cierre, lista editorial, tagline de footer), dentro de límites razonables para email (la mayoría de ESP recomiendan <102 KB para evitar el recorte de Gmail) |
| Sin JS, sin flexbox, sin grid, sin `position:absolute` | ✅ PASS | Ningún patrón nuevo introducido usa estas técnicas; el "acento" de la lista editorial es una celda de tabla con `background-color`, no `border-left` CSS |
| Rutas de imagen | ✅ PASS | Todas apuntan al CDN ya verificado (`feebbodigital.com/creativities-library/paraycompara/2026/jul/`), sin rutas relativas ni `file://` |

## QA visual (revisión sobre la captura desktop generada, ver limitación de herramienta en "QA de compatibilidad" más abajo)

| Check | Resultado |
|---|---|
| Composición: bloque de marca unificado (header+hero) sin costura | ✅ PASS — resuelve el hallazgo crítico C1 de la auditoría |
| Jerarquía: eyebrow → H1 → subtítulo → cifra → CTA → microcopy, orden de lectura claro | ✅ PASS |
| Tipografía: escala nueva aplicada (H1 32px, stat 40px, section 22px, body 13-16px) sin tamaños arbitrarios | ✅ PASS |
| Espaciado: ritmo intencionado por sección (28-48px según peso narrativo, ver `component-patterns.md`) | ✅ PASS |
| CTA reconocible y consistente en los dos usos (hero y cierre), sin competir entre sí | ✅ PASS — un único estilo de botón en toda la pieza |
| Tarjetas: se mantiene el patrón que ya funcionaba (tarifas), se diferencia el de "qué tener en cuenta" (lista vs. tarjeta circular) | ✅ PASS — resuelve I3 |
| Branding: dos tonos de morado de marca usados con intención distinta (`#5E2E91` apertura, `#3E244D` cierre) en vez de repetir el mismo | ✅ PASS |
| Footer con cierre de marca antes del bloque legal | ✅ PASS — resuelve I4 |

## QA responsive

| Check | Resultado | Nota |
|---|---|---|
| Clases `mobile-stack`/`mobile-hide`/`mobile-full`/`mobile-img` presentes y consistentes con el patrón ya validado en `v3-premium/system-audit-final.md` §6 (Playwright real a 320-600px) | ✅ PASS por inspección de código | Mismo mecanismo, extendido con `mobile-pad-sm`, `mobile-hero-h1`, `mobile-hero-stat`, `mobile-section-title` (nuevas, siguiendo el mismo patrón `!important` dentro de `@media max-width:599px`) |
| CTA a ancho completo en mobile en los dos usos (hero y cierre) | ✅ Mejora sobre v4.1 | v4.1 solo tenía el CTA a ancho fijo (280px) en ambos casos; v5-premium añade `class="mobile-full"` a los contenedores de CTA para que se conviertan en botón de ancho completo bajo 599px, cumpliendo la regla "CTA táctil de ancho completo en mobile" que el propio sistema pide en el briefing de esta fase |
| Escalado tipográfico específico de mobile para el hero (H1 32→26px, stat 40→32px) | ✅ Nuevo, no existía en v4.1 | Antes el H1 no tenía ajuste de tamaño en mobile; ahora sí, evitando que un titular de 32px se vea desproporcionado en 320-375px |
| ⚠️ Verificación real de apilado a 320/375/390/480px | **No verificado en este QA** | Ver limitación de herramienta abajo |

## QA de compatibilidad — limitaciones de esta ronda de QA (leer con atención)

Esta campaña se construyó y auditó en un entorno sin acceso a un motor de email real (Litmus/Email on Acid) ni a un navegador headless con dependencias de sistema completas (sin permisos de administrador en el sandbox de trabajo). Para no dejar el entregable sin ninguna captura visual, se generó una aproximación con **WeasyPrint** (motor de renderizado HTML/CSS orientado a impresión/PDF), con dos limitaciones documentadas honestamente:

1. **Las imágenes remotas no se cargaron en la captura** (`preview-desktop.png`, `preview-mobile.png` muestran huecos en vez del logo y los iconos de tarifa). Verificado que la causa es una restricción de red del propio entorno de trabajo (`curl` a la URL del CDN devuelve `403 Forbidden — blocked-by-allowlist`), no un problema del HTML ni del asset: ese mismo CDN está verificado como HTTP 200 en el `campaign-status.md` de la campaña real. En un navegador o cliente de correo real, las imágenes cargarán con normalidad.
2. **La captura "mobile" no dispara realmente las media queries** — WeasyPrint es un motor orientado a paginación de impresión y no emula un viewport de navegador de la forma en que lo hace Chromium/Litmus; por eso `preview-mobile.png`, aunque se generó a un lienzo de 375px de ancho, sigue mostrando el layout de escritorio (tarjetas en 2 columnas, trust bar en fila) en vez del apilado que las clases `mobile-stack` producirían en un cliente real. **No debe usarse como evidencia de que el responsive funciona** — la evidencia de que la técnica funciona es la que ya existe en `v3-premium/system-audit-final.md` (Playwright real, mismo mecanismo de clases, PASS en 320-600px).

**Recomendación explícita**: antes de dar esta versión por apta para producción, repetir el QA visual y responsive en un entorno con Chromium completo (o Litmus/Email on Acid) para confirmar el apilado real a 320/375/390/480px y la carga de imágenes, igual que se hizo para `v3-premium`.

## Veredicto

| Criterio | Estado |
|---|---|
| QA técnico | ✅ Aprobado |
| QA visual (sobre evidencia disponible) | ✅ Aprobado |
| QA responsive (código) | ✅ Aprobado por inspección |
| QA responsive (visual real) | ⚠️ Pendiente de verificación en entorno con Chromium/Litmus |
| Compatibilidad Outlook/Gmail/Apple Mail | ✅ Mismo nivel que v4.1 (que sí superó QA de compatibilidad real, ver `v3-premium/compatibility-matrix.md`) — no se tocó la anatomía del botón CTA ni las técnicas de tabla que ya estaban validadas |
- **Estado general** | ✅ **Aprobado para prueba interna / revisión de diseño.** No aprobado aún para producción — hereda los mismos bloqueos de producción que el resto de la campaña (`fromEmail`, enlaces de baja/preferencias, dirección física, `isTestCampaign: true`), documentados en `../09-exports/production-blockers.md`, que no han cambiado en esta versión |

## Segunda ronda QA (2026-07-15) — cambios G1+G2 sobre final-premium-v2.html

| Check | Resultado | Evidencia |
|---|---|---|
| HTML bien formado | ✅ PASS | Verificado por estructura idéntica a v2. |
| VML en ambos CTA | ✅ PASS | 4 `v:roundrect` en v2-inline. |
| Inline regenerado con juice y verificado | ✅ PASS | Todas las claves (shadow, pattern, chips, halo) coinciden entre hand-sync y juice. |
| Transiciones 24×1px | ✅ PASS | 5 zonas de transición, ~24 franjas cada una. Sin escalones visibles (verificado por vision_analyze en crop 1x). |
| Sombras en tarjetas y CTAs | ✅ PASS | `box-shadow` compatible con clientes modernos. Outlook ignora — fallback sólido aceptable. |
| Iconos sin caja lila | ✅ PASS | 48px directos en tarjeta. |
| Chips "Ver tarifas →" | ✅ PASS | `#FDEDE9` sólido, compatible Outlook. |
| Halo en círculos | ✅ PASS | `#DCC7E5` + padding, sin imágenes. |
| Patrón decorativo en cierre | ✅ PASS | `background` HTML + `bgcolor` fallback. |
| Font Sora descargada | ✅ PASS | HTTP 200, `getComputedStyle(H1)` = "Sora, Segoe UI, Arial". |
| Separadores trust bar | ✅ PASS | 2 separadores `#EDE7F3`, ocultos en mobile. |
| Peso inline | ✅ Aceptable | 47.9 KB. |

## Tercera ronda QA (G3, 2026-07-15) — auditorías y cambios

| Check | Resultado | Evidencia |
|---|---|---|
| Contraste #7B1FA2 sobre #FFFFFF | ✅ PASS | 8.20:1 — supera AA (4.5:1) y AAA (7:1) |
| Contraste #7B1FA2 sobre #F8F5FC | ✅ PASS | 7.60:1 — supera AA |
| Contraste #E4CDF0 sobre #5E2E91 | ✅ PASS | 6.28:1 — supera AA |
| Iconos tarifa (4) HTTP 200 desde CDN | ✅ PASS | Pesos: 1.8 a 3.9 KB. Diferencia documentada como riesgo. |
| Sombra trust bar aplicada | ✅ PASS | `box-shadow:0 1px 4px rgba(94,46,145,0.08)` |
| Footer border-top | ✅ PASS | `border-top:2px solid #DCC7E5` |
| Cross-check: v2.html vs v2-inline | ✅ PASS | 8 patrones coinciden exactamente |
| Clase `mh` | ⚠️ WARNING | G2 reportó `class="mh"` pero el código real usa `class="mobile-hide"`. **La clase mobile-hide SÍ está definida en @media.** Documentación corregida. |

## Cuarta ronda QA (G4, 2026-07-16) — pulido visual sobre final-premium-v2.html

| Check | Resultado | Evidencia |
|---|---|---|
| Kicker rules (3) presentes, 1 por sección de contenido | ✅ PASS | `grep -c 'width="32" height="2"'` → 3 |
| Card top stripe (4) presente, 1 por tarjeta de tarifa | ✅ PASS | `grep -c '14px 14px 0 0'` → 4 |
| Sombra en halo de pasos (3) | ✅ PASS | `grep -c 'rgba(94,46,145,0.18)'` → 3 |
| Sombra en círculos de check trust bar (3) | ✅ PASS | `grep -c 'rgba(94,46,145,0.20)'` → 3 |
| Stat pill con sombra propia (1) | ✅ PASS | `grep -c 'rgba(62,36,77,0.28)'` → 1 |
| VML sin cambios (4 `v:roundrect`) | ✅ PASS | Sin tocar anatomía del CTA |
| `role="presentation"` sin roturas | ✅ PASS | 44 ocurrencias tras G4. Los 3 kicker rules añaden 1 tabla nueva cada uno (+3); las franjas de tarjeta y las sombras de badge se insertan en tablas/celdas ya existentes, sin tablas nuevas |
| Contraste `#FFFFFF` sobre nuevo fondo pill `#7B1FA2` | ✅ PASS | 8.20:1 — igual al ya validado en G3 para el mismo par invertido |
| Contraste label `#E4CDF0` sobre `#7B1FA2` | ✅ PASS | 5.59:1 — supera AA (4.5:1); el color anterior (`#C9A8DB`) habría dado solo 3.95:1 sobre este fondo, por eso se cambió |
| Sin colores nuevos inventados | ✅ PASS | Todo el acento G4 reutiliza `#7B1FA2` (ya usado en eyebrows) y `#E4CDF0` (ya usado en el eyebrow del hero) |
| Sin JS, sin flexbox, sin grid, sin `position:absolute` | ✅ PASS | Todos los cambios son celdas de tabla con `background-color`/`box-shadow`, mismo patrón ya validado en G1-G3 |
| Peso inline | ✅ Aceptable | 51.5 KB (+3.3 KB / +7% sobre v2, 47.9 KB) — dentro de márgenes razonables para email |
| Verificación estructural inline vs. fuente | ✅ PASS | `box-shadow`: 14/14, `7B1FA2`: 11 líneas/11 líneas, `v:roundrect`: 4/4, `@media`: preservado (1 bloque) |

### Limitación de esta ronda

Sin acceso a Chromium (faltan dependencias de sistema, sin permisos de administrador en el sandbox — `sudo npx playwright install-deps` fallado por restricción de contenedor) ni a WeasyPrint (módulo no instalado) en este entorno de trabajo. **No se generó captura visual real para G4.** La verificación de esta ronda es 100% de código (conteos estructurales + cálculo manual de contraste WCAG), sin evidencia visual renderizada — mismo nivel de limitación ya documentado para la ronda base de v5-premium, no ha empeorado ni mejorado. Recomendación sin cambios: repetir QA visual en un entorno con Chromium/Litmus antes de producción, cubriendo ahora también los 5 cambios de esta ronda (kicker rules, card stripes, ambas sombras de badge, stat pill).

## Quinta ronda QA (G5, 2026-07-16) — rediseño de "Antes de decidir"

Motivada por feedback directo del cliente sobre una captura de la sección: se identificó como la más plana de la pieza (única sin tarjeta, sombra ni elemento circular).

| Check | Resultado | Evidencia |
|---|---|---|
| 4 tarjetas nuevas (una por ítem), reemplazando la lista de texto plano | ✅ PASS | Estructura `<table>` con `border`+`border-radius:16px`+`box-shadow` idéntica a las tarjetas de tarifa, 4 ocurrencias |
| Franja superior en cada tarjeta (`accentSignature`) | ✅ PASS | 4 nuevas ocurrencias de `border-radius:14px 14px 0 0` con `background-color:#7B1FA2` |
| Badge circular de check (36px) por ítem | ✅ PASS | `grep -c 'width:36px;height:36px'` → 4; `&#10003;` total 7 (3 trust bar existentes + 4 nuevos) |
| Contraste del check en el badge | ✅ PASS | Blanco sobre `#5E2E91` = 9.23:1 (AAA). Se descartó un badge naranja (`#FF5A3C`) por dar solo 3.10:1 — ver nota en `component-patterns.md` §12 |
| Balance de tags HTML (`table`/`tr`/`td`) | ✅ PASS | 52/52, 200/200, 220/220 — abre y cierra exactos, en fuente e inline |
| Inline regenerado con juice, media query preservada | ✅ PASS | 1 bloque `@media`, 4 `v:roundrect` sin cambios |
| Placeholders legales y copy sin tocar | ✅ PASS | `UNSUBSCRIBE_LINK`/`PREFERENCES_LINK`/`DIRECCIÓN FÍSICA` = 3 en fuente e inline, sin cambios |
| Sin JS, flexbox, grid, position:absolute | ✅ PASS | Cero coincidencias |
| Peso | ⚠️ Notable pero aceptable | 55.6 KB inline (+4.1 KB / +8% sobre G4, 51.5 KB) — la sección pasó de ~1.3 KB a ~2.9 KB en 4 tarjetas nuevas. Sigue muy por debajo del límite de recorte de Gmail (102 KB) |

### Limitación

Misma que G4: sin Chromium ni WeasyPrint disponibles en este entorno — verificación 100% de código + contraste calculado a mano, sin captura visual real generada en esta sesión. El usuario sí compartió una captura de referencia de la versión anterior (pre-G5) que motivó el cambio; no se dispone de una nueva captura del resultado post-G5 para comparar en esta misma sesión.

## Sexta ronda QA (G6, 2026-07-16) — pase de refinamiento "estilo Apple" en toda la pieza

| Check | Resultado | Evidencia |
|---|---|---|
| 7 sombras del sistema pasadas a versión difusa | ✅ PASS | Conteo exacto por valor: card 8, cta 2, trustBar 1, badgeStep 3, badgeCheck(22px) 3, badgeCheckLarge(36px) 4, statPill 1 — total 22, cero valores antiguos remanentes (`grep` de las 6 rgba anteriores → 0) |
| Radios actualizados (card 16→18, statPill 20→24, stripe 14→16) | ✅ PASS | 8 tarjetas + 1 pill + 8 franjas, sin roturas |
| Tracking negativo en 6 titulares grandes (H1, stat, 3×H2, closing headline) | ✅ PASS | `grep -c` de los 4 valores de letter-spacing negativo → 6 en fuente e inline |
| Eyebrows 2.5px→3px (4 ocurrencias) | ✅ PASS | Sin restos del valor anterior |
| Espaciado vertical de secciones (3× contenido, 1× cierre, 1× footer) | ✅ PASS | Valores nuevos verificados por inspección |
| `line-height` 1.45→1.5 en cuerpos de texto (11 de 12 — el footer legal no se tocó a propósito) | ✅ PASS | 11 reemplazos, 1 remanente correcto en footer |
| Balance de tags HTML (`table`/`tr`/`td`) | ✅ PASS | 52/52 tablas en fuente e inline, sin cambio respecto a G5 (cero tablas añadidas o eliminadas en esta ronda — todo son cambios de valores, no de estructura) |
| Inline regenerado con juice, media query preservada | ✅ PASS | 1 bloque `@media`, 4 `v:roundrect` sin cambios |
| Copy, CTAs y placeholders legales sin tocar | ✅ PASS | Mismos conteos que rondas anteriores |
| Sin JS, flexbox, grid, position:absolute | ✅ PASS | Cero coincidencias |
| Peso | ✅ Aceptable | 55.8 KB inline (+0.2 KB sobre G5 — esta ronda es casi neutra en peso porque son cambios de valores, no de marcado) |

### Limitación

Sin Chromium ni WeasyPrint disponibles en este entorno — verificación 100% de código. Los valores de esta ronda (sombras difusas, tracking negativo, espaciado) están razonados sobre principios de diseño de Apple ya conocidos, no contrastados contra una captura real de apple.com/newsletters de Apple en esta sesión de trabajo. Recomendación: validar visualmente en un entorno con Chromium/Litmus antes de dar por definitiva la dirección estética, junto con el resto de QA visual/responsive ya pendiente de rondas anteriores.

## Séptima ronda QA (G7, 2026-07-16) — auditoría contra prompt maestro premium-conversión

Motivada por un prompt maestro aportado por el cliente (diseño premium orientado a conversión: minimalismo editorial, disciplina de sombras, sin degradados innecesarios, CTAs secundarios discretos, sin exceso de mayúsculas, cuerpos de texto legibles).

| Check | Resultado | Evidencia |
|---|---|---|
| Degradados decorativos eliminados ("degradados innecesarios") | ✅ PASS | 120 filas de transición de 1px eliminadas (5 zonas × 24 franjas) — cortes de sección limpios y editoriales. `grep` de patrón de fila → 0 |
| Disciplina de sombras ("no añadir sombras a todos los módulos") | ✅ PASS | De 22 sombras a 11: se conservan solo en elevación con función (8 tarjetas, 2 CTA, 1 stat pill); eliminadas de trust bar pill, badges de check (22px y 36px) y halos de pasos |
| CTA sin exceso de mayúsculas | ✅ PASS | "COMPARAR TARIFAS" → "Comparar tarifas" en las 4 ocurrencias (2 VML + 2 HTML) |
| CTAs secundarios discretos ("no varios botones con el mismo peso visual") | ✅ PASS | Los 4 chips "Ver tarifas →" (fondo #FDEDE9 tipo botón) pasan a enlaces de texto naranja sin fondo — ya no compiten visualmente con el CTA principal. `grep FDEDE9` → 0 |
| Cuerpo de texto legible (prompt: 15-17px; tarjetas a 14px como compromiso razonable en módulos compactos) | ✅ PASS | 12 descripciones de 13px → 14px (line-height 1.5 ya aplicado en G6). Microcopy del hero (13px) y legales (11-12px) sin cambios intencionadamente |
| Un CTA principal + refuerzo en cierre (misma acción, no nueva) | ✅ PASS | Ambos CTA usan el mismo texto y destino — cumple la regla del prompt |
| Balance de tags | ✅ PASS | 52/52 tablas, 80/80 tr, 100/100 td (120 tr menos que G6, todas de los degradados) |
| VML, media query, placeholders legales | ✅ PASS | 4 v:roundrect, 1 @media, 3 placeholders — sin cambios |
| Peso | ✅ Mejora notable | 43.6 KB inline (−12.2 KB / −22% sobre G6, 55.8 KB) — la eliminación de los degradados y chips reduce el marcado sin perder contenido |

### Decisiones de auditoría (qué NO se cambió y por qué)

- **Patrón de fondo del hero/cierre**: se mantiene — 14% de opacidad, con fallback sólido; aporta identidad sin complejidad ("los colores intensos con intención"). No entra en "fondos demasiado complejos".
- **Tarjetas de "Antes de decidir" (G5)**: se mantienen — validadas explícitamente por el cliente en la ronda anterior. La reducción de ruido se hizo en sombras y chips, no revirtiendo trabajo aprobado.
- **Eyebrows en mayúsculas**: se mantienen — etiquetas de 12px con letter-spacing es convención editorial estándar, no "exceso de mayúsculas" (eso aplicaba al CTA).
- **Kicker rules (G4)**: se mantienen — con los degradados fuera, la línea kicker es ahora el único marcador de inicio de sección, gana función (jerarquía por repetición, como pide el prompt).

### Limitación

Misma que rondas anteriores: sin verificación visual real en este entorno. Los cortes de sección ahora son duros (sin transición) — revisar visualmente que el ritmo de la pieza funciona antes de producción.

## Octava ronda QA (G8, 2026-07-16) — rediseño profesional según prompt G8

Ejecución del `prompt-g8-rediseno-profesional.md` (diagnóstico D1–D8). Resultados contra sus criterios de aceptación:

| Criterio | Resultado | Evidencia |
|---|---|---|
| D1 — Sora 800 honesto | ✅ PASS (opción B) | Sin acceso de red a fonts.googleapis.com en este entorno (timeout verificado): se eliminó el bloque 800 duplicado y se documentó en el propio CSS y en los tokens que el 800 se sintetiza desde el 700. 1 solo `@font-face` real (el grep de "2" incluye la nota de comentario). Pendiente: URL real del woff2 800 cuando haya red |
| D2 — Semántica | ✅ PASS | 4 `<h2>` (tarifas, pasos, lista, cierre) y 11 `<h3>` (4 tarjetas + 4 filas de lista + 3 pasos), estilos idénticos conservados, márgenes explícitos. Balance h2/h3 exacto en fuente e inline |
| D3 — UTM | ✅ PASS | 8/8 enlaces comerciales con `utm_source/medium/campaign/content` por módulo (hero-cta ×2, card-movil, card-fibra, card-convergente, card-tv, closing-cta ×2). 0 enlaces desnudos. Convención documentada en `docs/naming-conventions.md` |
| D4 — Copy | ✅ PASS | "Compara todo tipo de tarifas" → "Móvil, fibra o todo en uno"; "Comparar es muy sencillo" → "Tres pasos, sin complicaciones"; "Qué tener en cuenta al comparar" → "Cuatro cosas que conviene revisar"; "Las mejores ofertas" (superlativo, riesgo legal) → "Comparador independiente" (respaldado por la tagline ya validada del footer). Grep de genéricos/superlativos → 0. Prueba social NO añadida: el único dato del brief ("TOP 3 Comparadores España 2025") está [PENDIENTE DE CONFIRMACIÓN] — se respeta la regla de no inventar |
| D5 — Composición asimétrica | ✅ PASS | Cabecera de "Antes de decidir" alineada a la izquierda (kicker con `align="left"`, eyebrow y h2 con `text-align:left`, td contenedor `align="left"` para Outlook). Primera ruptura del ritmo centrado |
| D6 — Iconografía | ✅ Especificado | `icon-system-spec.md` creado: set de 6 iconos unificados (4 tarifa + 2 check), formato, estilo, criterio de aceptación y protocolo de sustitución. Estado actual documentado como placeholder consciente — no se inventaron assets |
| D7 — Dark mode | ✅ PASS | Bloque `@media (prefers-color-scheme: dark)` con 9 clases defensivas (fondos, tarjetas, títulos, cuerpos, eyebrows, footer). Contrastes verificados por cálculo: #D9C2E6/#211C2A y #B9B3C2/#211C2A muy por encima de AA; #8F8899/#171420 ≈ 5.1:1 (AA). Nota: Apple Mail y Outlook (apps) lo respetan; Gmail aplica su propia inversión e ignora este bloque — el fallback claro original sigue siendo válido |
| D8 — Personalización | ✅ PASS | Saludo con merge condicional Mailchimp en el subtítulo del hero: `Hola*\|IF:FNAME\|* *\|FNAME\|**\|END:IF\|*, compara…` — con nombre: "Hola Javier, compara…"; sin nombre: "Hola, compara…". Adaptar sintaxis si el ESP final no es Mailchimp (documentado) |
| Ritmo hero→trust (3.8) | ➖ Diferido con criterio | Sin render real no se puede juzgar el corte duro; técnica de solapamiento compatible documentada en `icon-system-spec.md` para la ronda de QA visual |
| Restricciones | ✅ PASS | 4 VML intactos, tablas 52/52, placeholders legales 3/3, sin JS/flex/grid/absolute, peso inline 45.9 KB (<90 KB) |

### Limitación

La de siempre (sin Chromium/Litmus) más una nueva: sin red a Google Fonts para obtener la URL real de Sora 800 — resuelto por la vía honesta (opción B del prompt). El QA visual real sigue siendo el pendiente número uno antes de producción, ahora con dark mode también por verificar.

## Corrección G8.1 (2026-07-16) — regresión detectada por el cliente + primer QA visual real

**Feedback del cliente**: "solo has cambiado los colores y has deformado los iconos, respecto a la original".

**Diagnóstico con render real** (por fin se consiguió Chromium en el entorno: la única dependencia de sistema que faltaba, `libXdamage.so.1`, se resolvió compilando un stub — headless nunca la invoca; capturas a 600px en esquema claro y oscuro):

1. **El dark mode de G8 era la causa**: con el navegador/SO en modo oscuro, el bloque `prefers-color-scheme:dark` cambiaba todos los fondos (percepción: "solo has cambiado los colores") y dejaba los iconos PNG — trazo morado diseñado para tarjeta blanca — sobre tarjetas oscuras, donde se ven rotos ("deformado los iconos"). Error de proceso: se lanzó dark mode sin assets preparados para fondo oscuro y sin verlo renderizado.
2. **El merge tag `*|IF:FNAME|*` aparecía como texto crudo** en el subtítulo del hero en cualquier previsualización fuera del ESP.

**Correcciones aplicadas**:

| # | Cambio | Justificación |
|---|---|---|
| G8.1a | Metas `color-scheme`/`supported-color-schemes` → `light` (antes `light dark`) | Es la práctica profesional cuando los assets no están preparados para oscuro: pedir explícitamente a Apple Mail/Outlook que NO inviertan. El dark mode vuelve cuando exista set de iconos+logo dark-ready (añadido a icon-system-spec.md como requisito) |
| G8.1b | Bloque `@media (prefers-color-scheme: dark)` y clases `dm-*` eliminados | Ídem — sin asset dark-ready, el dark mode empeora la pieza en vez de protegerla |
| G8.1c | Merge tag retirado del HTML; personalización pasa a snippet documentado en tokens (`personalization`) para insertarse en la fase de carga al ESP | El HTML debe previsualizar limpio; el token se inyecta cuando se conozca el ESP definitivo |

**Verificación con capturas reales** (primera vez en toda la línea v5-premium):
- `g8fix-light-600.png` — render claro correcto: jerarquía, tarjetas, badges y CTAs como se diseñaron
- `g8fix-dark-600.png` — con SO en oscuro, la pieza se mantiene en claro (metas light respetadas por Chromium)
- `g8-dark-600.png` — conservada como evidencia del fallo que motivó esta corrección
- Los iconos del CDN no cargan en el sandbox (allowlist de red) — aparecen como placeholder en las capturas; en cliente real cargan (HTTP 200 verificado en campaign-status). El resto del render es fiel.
- Estructura re-verificada tras la corrección: 52/52 tablas, 4 h2, 11 h3, 8 UTM, 4 VML, placeholders legales intactos, inline 44.5 KB
