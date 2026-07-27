# Component patterns — Evolución premium (v5-premium)

> Patrones HTML de email reutilizables, documentados antes de escribirse en `final-premium.html`, para que cualquier campaña futura (de Para y Compara o de otra marca, sustituyendo tokens) pueda reutilizarlos. Construidos como HTML de tabla + CSS inline, coherente con la línea `v3-premium/` (no como componentes React Email — ver riesgo de arquitectura documentado en `00-entregables-iniciales-evolucion-premium.md`, §7).

---

## 1. Header con acento de cierre

**Propósito**: dar entrada de marca clara y conectar visualmente con el hero en vez de terminar en un borde duro entre dos colores planos.

**Variantes**: `logo-centrado` (usada aquí), `logo-izquierda` (para campañas más editoriales/informativas).

**Props**: `logoSrc`, `logoWidth`, `logoHeight`, `logoAlt`, `backgroundColor` (token `surfaces.brandHeader`).

**Reglas de contenido**: logo siempre con `alt` descriptivo; nunca añadir navegación (un email no es un sitio web).

**Responsive**: sin cambios entre desktop y mobile — el logo ya usa `max-width:100%`.

**Compatibilidad**: tabla `role="presentation"`, imagen con `width`/`height` explícitos y `display:block`.

**Limitaciones**: el "acento de cierre" es una franja de 3px del mismo color que el fondo del hero (`sectionLila`), no un gradiente — los gradientes CSS no son fiables en Outlook.

---

## 2. Hero editorial sin foto (`heroEditorialNoPhoto`)

**Propósito**: sustituir el placeholder gris "ASSET HERO PENDIENTE" por un hero de pleno derecho cuando no existe fotografía de marca. No es un parche: es una variante de hero tan válida como una con imagen, pensada para permanecer en producción si el cliente no aporta foto, o para servir de interino si la aporta más tarde.

**Variantes**:
- `stat-focus` (implementada aquí): fondo de marca sólido, titular grande en blanco, una cifra de marca como foco visual en lugar de imagen.
- `quote-focus` (documentada, no implementada): mismo esquema pero con una frase corta en vez de una cifra, para campañas sin dato numérico disponible.

**Props**: `background` (token `primary` o `deep`), `eyebrow`, `title`, `subtitle`, `stat.number`, `stat.label`, `cta`.

**Reglas de contenido**: la cifra debe ser un dato ya confirmado en el brief (aquí, "+30 compañías", que en `00-brief/brief.md` figura como mensaje clave aprobado, no como precio pendiente de validar) — nunca un número inventado ni un precio sin aprobar.

**Responsive**: en mobile, el tamaño de la cifra baja de 40px a 32px y el titular de 32px a 26px vía clase `mobile-hero-scale`; el padding lateral pasa de 32px a 24px.

**Compatibilidad**: fondo de color sólido (no imagen de fondo) — funciona igual en Outlook, Gmail y Apple Mail sin fallback adicional porque no depende de `background-image`. Sin dependencia de ningún asset externo, por lo que nunca puede "romperse" por una imagen caída.

**Ejemplo de uso con otra marca** (Demo, `#1A5276`/`#E67E22`): mismo patrón, `background: #1A5276`, cifra y mensaje propios de esa marca — demuestra que el patrón es agnóstico de marca aunque esta implementación use los tokens de Para y Compara.

**Limitaciones**: no sustituye a una fotografía real si la dirección de arte de la marca exige mostrar producto/personas. Es la solución correcta para el caso "sin asset todavía", no un reemplazo permanente de una estrategia de imagen real.

---

## 3. Trust bar con check consistente (`trustCheckmark`)

**Propósito**: sustituir los tres glifos de texto distintos (`%`, `$`, `OK`) por un único símbolo de check (✓) repetido, mismo tamaño en los tres items — coherencia en vez de "iconos improvisados".

**Props**: `items[]` con `{ label }` (el símbolo es fijo, no varía por item).

**Reglas de contenido**: máximo 3 mensajes de confianza, cada uno de menos de 24 caracteres para que no se corte en mobile.

**Responsive**: apilado vertical bajo 599px (ya resuelto con `mobile-stack`, se mantiene).

**Compatibilidad**: el carácter `✓` es texto plano (no icon-font, no SVG) — se renderiza igual en todos los clientes que soporten UTF-8, que es el estándar. Fallback: si un cliente no renderiza el glifo, el texto del `label` sigue siendo legible.

**Limitaciones**: sigue siendo tipografía, no iconografía vectorial real. Se documenta explícitamente como placeholder intencional — cuando existan 3 iconos PNG de marca, sustituir la celda del glifo por `<img>` de 20×20px manteniendo el mismo círculo de fondo.

---

## 4. Lista con acento de color (`listAccentBar`) — SUSTITUIDA en G5, ver §12

**Estado**: patrón original de v5-premium base (2026-07-13). Sustituido en la campaña piloto por `premiumListRow` (§12) el 2026-07-16 tras feedback directo de que esta sección se leía "plana" frente al resto de la pieza (única sección sin tarjeta, sombra ni icono). Se conserva esta entrada como referencia histórica y porque sigue siendo válida para otras campañas/marcas donde una lista de texto puro sea preferible (menos peso visual, menos KB).

**Propósito**: sustituir un bloque de tarjetas circulares repetidas (idéntico al de tarifas) por un formato de lista editorial — dos elementos comparten página, pero se leen distinto.

**Props**: `items[]` con `{ title, text }`, `accentColor` (token `ctaBackground`), `accentWidth` (4px).

**Reglas de contenido**: título corto (2–4 palabras) + una frase de apoyo, sin icono — la diferenciación viene del acento de color y la tipografía, no de un pictograma.

**Responsive**: en mobile cada fila ocupa el 100% (ya es el comportamiento natural al no depender de columnas 50/50).

**Compatibilidad**: el "acento" se implementa como una celda `<td>` de 4px de ancho con `background-color`, no como `border-left` CSS — Outlook interpreta mal los border en `<td>` en algunas versiones; una celda de color es 100% fiable en todos los clientes.

**Limitaciones**: con más de 4 ítems la lista se alarga mucho verticalmente — a partir de 5 ítems, volver al formato de tarjeta 2×2. Además, con más de 4 ítems `premiumListRow` (§12) también se vuelve pesado — el límite de 5 aplica a ambos patrones.

---

## 5. Banda de cierre (`closingBand`)

**Propósito**: dar al CTA final un peso visual distinto al del hero, para que el cierre de la newsletter no se sienta como una repetición exacta del principio.

**Props**: `background` (token `deep`, `#3E244D` — ya documentado en `brand-tokens.json`, nunca usado en el HTML real hasta esta versión), `title`, `subtitle` (ambos en blanco/lila claro), `cta` (mismo botón naranja bulletproof de siempre).

**Reglas de contenido**: el mensaje de cierre debe ser una variación del mensaje de apertura, no una repetición literal — refuerza sin cansar.

**Responsive**: el botón pasa a ancho completo (`mobile-full`) en vez de ancho fijo de 280px, siguiendo la regla de "CTA táctil de ancho completo en mobile" que el resto del sistema ya aplica de forma inconsistente (el CTA hero de v4.1 no era full-width en mobile; en v5-premium sí, en ambos CTAs).

**Compatibilidad**: mismo patrón VML + tabla anidada que ya usa el CTA existente — solo cambia el fondo de la sección contenedora, no la anatomía del botón.

**Limitaciones**: ninguna — es el patrón de menor riesgo de todos los introducidos, porque reutiliza al 100% el componente CTA ya validado.

---

## 6. Footer con cierre de marca

**Propósito**: evitar que el email termine "en frío" pasando directamente del contenido al bloque legal.

**Props**: `tagline` (una línea corta de marca, ej. "Comparador independiente de tarifas de fibra, móvil y televisión."), seguida del bloque legal existente sin cambios.

**Reglas de contenido**: la tagline no debe repetir el eyebrow del hero ni sonar a claim comercial — es una frase de identidad, no de venta.

**Responsive / Compatibilidad**: sin cambios respecto al footer actual, que ya está bien resuelto.

---

## Resumen de qué se reutiliza sin cambios

Para dejar constancia de que esta evolución no descarta lo que ya funciona bien: las **tarjetas de tarifa** (2×2, icono + título + texto) se mantienen prácticamente igual — la propia autoauditoría `visual-qa-phase1.md` §8 las puntúa como consistentes y correctas — solo se les añade un micro-enlace de cierre ("Ver tarifas →") para reforzar la sensación de exploración. Los **3 pasos** ("Cómo funciona") mantienen su estructura, solo se ajusta el tratamiento de la línea conectora entre círculos para diferenciarlos visualmente del resto de secciones.

---

## 7. Patrón decorativo de fondo en el hero (`heroPattern`)

**Propósito**: añadir textura visual sutil al fondo de marca del hero cuando no hay fotografía disponible, sin depender de un asset de diseño externo ni de gradientes CSS.

**Props**: `tileSrc` (URL del PNG tile), `backgroundColor` (token `primary`, para fallback sólido si el cliente ignora el background HTML).

**Variantes**:
- `circles` (implementada aquí): círculos concéntricos de 14% de opacidad en blanco sobre fondo de marca, repetidos en tile de 48×48px generado por código (PIL/Python, no IA generativa).

**Reglas de contenido**: el tile se genera con el script `core/assets/gen-pattern-tile.py`. Color del patrón siempre blanco (contrasta contra el morado de marca). La opacidad no debe superar el 15% para evitar que compita con el contenido textual del hero.

**Compatibilidad**: se aplica mediante el atributo HTML `background=""` (no CSS `background-image`), con `bgcolor` como fallback sólido para Outlook y otros clientes que no soportan background en `<td>`. Outlook muestra el morado sólido sin el patrón — el contenido sigue siendo legible.

**Limitaciones**: `background` en `<td>` no es compatible con Outlook 2007-2021 ni con Gmail web — en esos clientes se ve el color sólido de fallback. Es un realce visual para clientes que lo soportan (Apple Mail, Samsung Mail, Yahoo, clientes modernos), no un elemento del que dependa la comunicación.

---

## 8. Halo en círculos numerados (`circleHalo`)

**Propósito**: dar un anillo de color sutil alrededor de los círculos numerados (01/02/03) de la sección de pasos, evitando que floten visualmente sobre el fondo de sección sin conexión.

**Props**: `haloColor`, `haloPadding` (ambos en `design-tokens-premium.json` → `radius.circleHalo: 4`, `surfaces.stepConnector: "#DCC7E5"`).

**Implementación**: un `<td>` exterior con `background-color:#DCC7E5;border-radius:50%;padding:4px;` que contiene al `<td>` interior del círculo numerado. No requiere imágenes, VML ni CSS complejo — es un color de fondo sólido en un `td` anidado.

**Compatibilidad**: 100% — Outlook renderiza correctamente `background-color` en celdas de tabla. El `padding:4px` crea el halo visible. El `border-radius:50%` solo funciona en el círculo interior (Outlook lo ignora), pero el halo exterior queda como un cuadrado de 4px de margen alrededor del círculo — no es un problema visual porque el fondo de la sección es liso y el cuadrado de 4px no se percibe como tal.

**Reglas de contenido**: el color del halo debe ser un tono intermedio entre el color del círculo (primary) y el fondo de la sección (sectionLila) — `#DCC7E5` cumple esa función. Si se cambia el color de sección, recalcular el tono intermedio.

---

## 9. Sistema de acento premium (`accentSignature`) — ronda G4

**Propósito**: dar una firma visual coherente a la pieza reutilizando un único color ya existente (`light` — `#7B1FA2`, el mismo del texto de los eyebrows) en tres orientaciones distintas, en vez de introducir un color nuevo o un elemento decorativo aislado por sección.

**Variantes**:
- **Kicker rule** (línea centrada, 32×2px, `background-color:#7B1FA2`): sobre cada eyebrow de las 3 secciones de contenido (tarifas, pasos, antes de decidir). Tabla propia de 1 celda, sin texto, `margin:0 auto 10px`.
- **Card top stripe** (franja superior, 4px, `background-color:#7B1FA2`, `border-radius:14px 14px 0 0`): primera fila de cada una de las 4 tarjetas de tarifa, dentro de la misma tabla que ya tiene `border-radius:16px` — el radio de la franja es 2px menor que el de la tarjeta para que anide limpiamente en la esquina redondeada.
- **List accent bar** (ya documentada en §4, usa `ctaBackground`/naranja, no `light` — mantiene su propio color a propósito porque vive en una sección distinta, no compite con las tarjetas).

**Reglas de contenido**: ninguna — es puramente decorativo, no lleva texto ni depende de contenido variable.

**Responsive**: sin clase mobile específica — a ambos tamaños el kicker rule y el card top stripe se comportan igual (elementos de tamaño fijo en px, no dependen del ancho de columna).

**Compatibilidad**: 100% — son celdas de tabla con `background-color` sólido, la misma técnica ya validada en `listAccentBar` y en las bandas de transición degradada. `border-radius` en la celda de la franja es ignorado por Outlook (se ve como rectángulo recto en la esquina superior de la tarjeta) pero no rompe nada — la tarjeta ya pierde su redondeo completo en Outlook de forma consistente (riesgo ya aceptado desde v5-premium base, sin cambios).

**Limitaciones**: ninguna nueva — mismo nivel de riesgo que los patrones ya aceptados (`listAccentBar`, bandas de degradado).

---

## 10. Elevación de insignias circulares (`badgeElevation`) — ronda G4

**Propósito**: unificar la escala de elevación (sombra) que ya existía para tarjetas/CTA/trust-bar-pill, extendiéndola a los dos elementos circulares que quedaban "planos": el halo de los pasos numerados (01/02/03) y los círculos de check de la trust bar.

**Props**: `shadows.badgeStep` (`0 2px 6px rgba(94,46,145,0.18)`) en el halo exterior de cada paso; `shadows.badgeCheck` (`0 1px 3px rgba(94,46,145,0.20)`) en cada círculo de check de la trust bar.

**Compatibilidad**: mismo mecanismo que las sombras ya aprobadas en QA G2/G3 (`box-shadow` ignorado por Outlook, fallback sólido intacto) — cero riesgo nuevo.

**Limitaciones**: ninguna.

---

## 11. Pill de cifra de marca (`statPill`) — ronda G4

**Propósito**: dar a la cifra "+30" del hero un fondo propio tipo insignia/chip (en vez de texto flotando directamente sobre el fondo de marca), reforzando el patrón `heroEditorialNoPhoto` (§2) como elemento central de foco visual del hero.

**Props**: `background: light` (#7B1FA2), `border-radius:20px`, `box-shadow: statPill`, `labelColor: #E4CDF0` (cambiado desde `#C9A8DB` para mantener contraste AA sobre el nuevo fondo).

**Verificación de contraste** (fórmula WCAG, relative luminance): `#FFFFFF` sobre `#7B1FA2` = 8.20:1 (idéntico al ya validado en G3 para el mismo par de colores, invertido); `#E4CDF0` sobre `#7B1FA2` = 5.59:1 — ambos superan AA (4.5:1). El color de label anterior (`#C9A8DB`) habría dado 3.95:1 sobre este nuevo fondo — por debajo de AA para texto de 12px, por eso se cambió.

**Compatibilidad**: `background-color` + `bgcolor` sólido en la tabla del pill (sin imagen, sin gradiente) — funciona igual en todos los clientes; Outlook ignora `border-radius` y `box-shadow` pero conserva el fondo sólido y el contraste de texto.

**Limitaciones**: ninguna — reutiliza únicamente tokens de color ya existentes en la marca (`light`, `#E4CDF0`), sin inventar ningún color nuevo.

---

## 12. Fila de lista premium (`premiumListRow`) — ronda G5, sustituye a `listAccentBar` en esta campaña

**Propósito**: dar a la sección "qué tener en cuenta" el mismo nivel de acabado que el resto de la pieza (tarjetas con sombra, badges con halo, CTA con sombra) — `listAccentBar` (§4) era la única sección sin tarjeta, sombra ni elemento circular, y se leía notablemente más plana que sus vecinas.

**Composición**: combina tres patrones ya validados en vez de introducir uno nuevo — la tarjeta de las tarifas (`border:1px solid #EDE7F3;border-radius:16px;box-shadow: card`), la franja superior de `accentSignature` (§9, color `light` #7B1FA2) y el badge circular con check de `trustCheckmark` (§3, aquí a 36px en vez de 22px, con la sombra `badgeCheck` de `badgeElevation` §10).

**Props**: `items[]` con `{ title, text }` (idéntico a `listAccentBar`), `badgeColor` (token `primary`, #5E2E91 — mismo color que el badge de check de la trust bar, no el naranja del CTA: ver nota de contraste abajo).

**Nota de contraste — por qué el badge es morado y no naranja**: se evaluó un badge naranja (`ctaBackground` #FF5A3C) para diferenciarlo del morado de la trust bar, pero el check blanco sobre ese naranja da solo 3.10:1 de contraste (por debajo de AA-normal). El check blanco sobre `primary` (#5E2E91) da 9.23:1 — el mismo componente ya validado en `trustCheckmark`, sin margen de duda. Se prioriza contraste sobre diferenciación de color; la franja superior (`light`, morado más claro) ya aporta variación cromática suficiente frente a la trust bar.

**Reglas de contenido**: igual que `listAccentBar` — título corto + una frase de apoyo.

**Responsive**: cada fila ya ocupa el 100% del ancho de columna de forma natural (sin depender de layout de 2 columnas), igual que `listAccentBar`.

**Compatibilidad**: 100% — combinación de tres técnicas ya probadas en esta misma pieza (tarjeta con `border-radius`/`box-shadow`, franja de celda con color sólido, círculo con `border-radius:50%` y texto centrado). Outlook pierde el redondeo de tarjeta y franja (fallback ya aceptado desde G4) y el `box-shadow` del badge (fallback: círculo sólido sin sombra, igual que en trust bar).

**Peso**: cada fila pasa de ~2 líneas de tabla a una tarjeta completa — el bloque de 4 ítems sube de ~1.3 KB a ~2.9 KB en el HTML fuente. Aceptable dentro del peso total de la pieza (ver `qa-report.md` § ronda G5).

**Limitaciones**: mismo límite que `listAccentBar` — a partir de 5 ítems, la sección se alarga demasiado; considerar volver a 2 columnas o recortar contenido.

---

## 13. Pase de refinamiento "estilo Apple" (ronda G6, 2026-07-16)

**Propósito**: aplicar de forma sistemática, a las 7 secciones de la pieza, los rasgos que asociamos al lenguaje visual de Apple (apple.com / Apple News): sombras muy difusas en vez de marcadas, tracking negativo en titulares grandes, más aire entre bloques, y curvas más generosas. No es un patrón nuevo aislado — es una revisión transversal de los tokens ya existentes.

**A. Sombras difusas** — se sustituyen todas las sombras "marcadas" (blur corto, alpha alto) por sombras "difusas" (blur grande, offset mayor, alpha bajo). Mismo principio en las 7 sombras del sistema (`card`, `cta`, `trustBar`, `badgeStep`, `badgeCheck`, `badgeCheckLarge`, `statPill`) — ver valores actualizados en `design-tokens-premium.json` → `shadows`. Outlook sigue sin renderizar `box-shadow`; el fallback sólido (borde/fondo) no cambia.

**B. Tracking negativo en titulares grandes** — H1 hero (-0.5px), H2 de sección (-0.3px), headline de la banda de cierre (-0.4px) y la cifra "+30" del hero (-1px). Es el detalle tipográfico más reconocible de Apple: cuanto más grande el tamaño, más se cierra el tracking, para que el titular se lea compacto y "diseñado" en vez de suelto. No se toca el body (14px o menos no se beneficia de tracking negativo, se vuelve ilegible).

**C. Eyebrows con más aire** — `letter-spacing` de 2.5px a 3px en las 4 etiquetas pequeñas en mayúsculas (hero + 3 secciones), un ajuste sutil que da más elegancia a las etiquetas sin cambiar tamaño ni peso.

**D. Radios más generosos** — tarjetas de 16px a 18px, pill de la cifra hero de 20px a 24px. Las franjas superiores de las tarjetas ajustan su radio (14px→16px) para seguir anidando limpiamente.

**E. Ritmo vertical más espacioso** — las 3 secciones de contenido (tarifas, pasos, antes de decidir) pasan de `padding:44px 24px 36px` a `padding:56px 24px 44px`; la banda de cierre de `48px/44px` a `60px/52px`; el footer gana 12px de aire antes del bloque de marca. El interior de las tarjetas (tarifa y lista premium) también gana padding (+4px por lado aprox.).

**F. Cuerpo de texto más cómodo** — `line-height` de 1.45 a 1.5 en las 11 descripciones de tarjetas/pasos/lista (no se tocó el texto legal del footer, que mantiene su estilo propio).

**G. Botón CTA** — padding de `14px 32px` a `17px 36px` (botón más sustancial), sombra difusa (ver A).

**H. Footer** — el nombre de marca en el footer baja de peso 700 a 600 y gana `letter-spacing:0.2px`, para un tono más discreto/editorial en vez de "gritado" — coherente con cómo Apple trata sus footers (información, no venta).

**Compatibilidad**: cero técnicas nuevas — todo son ajustes de valores (padding, radius, box-shadow, letter-spacing) sobre propiedades que ya se usaban. Ningún cambio estructural de tablas/celdas. Verificado balance exacto de tags (`<table>`/`<tr>`/`<td>`) antes y después, y que copy, CTAs y placeholders legales no se tocaron.

**Limitaciones**: como en rondas anteriores, sin verificación visual real en este entorno (sin Chromium/WeasyPrint) — los valores están razonados por principios de diseño conocidos de Apple (sombras difusas, tracking negativo en type grande, espaciado generoso), no contrastados contra una captura real de apple.com en esta sesión. Recomendado confirmar visualmente antes de dar la ronda por definitiva.

---

## 14. Auditoría contra prompt maestro premium-conversión (ronda G7, 2026-07-16)

**Propósito**: aplicar el prompt maestro aportado por el cliente ("menos elementos, mejor seleccionados, mejor jerarquizados") como auditoría correctiva sobre la pieza — eliminar todo lo que el propio sistema había acumulado y que el prompt identifica como ruido.

**Cambios**:

- **Degradados eliminados** (`sectionTransition`, de G1, RETIRADO): las 5 zonas de 24 franjas de 1px se eliminan. El corte limpio entre fondos de sección es más editorial, pesa 12 KB menos y elimina 120 filas de tabla. El patrón de transición degradada queda documentado como retirado — no reutilizar en futuras campañas de esta línea.
- **Disciplina de sombras**: la sombra ahora es un recurso semántico, no decorativo — solo la llevan los elementos con función de foco o clic (tarjetas, CTAs, stat pill). `badgeElevation` (G4) queda retirado.
- **CTA en sentence case**: "Comparar tarifas" en vez de "COMPARAR TARIFAS" — el prompt pide evitar el exceso de mayúsculas; el botón mantiene contraste, peso y tamaño, que es lo que realmente lo hace visible.
- **Enlaces secundarios discretos**: los chips con fondo se convierten en enlaces de texto (naranja, 13px, con flecha) — un solo nivel de botón en toda la pieza, como pide el prompt ("no utilices varios botones con el mismo peso visual").
- **Cuerpo a 14px**: las descripciones de tarjetas/pasos/lista suben de 13 a 14px.

**Qué sobrevive a la auditoría y por qué** (criterio: función, no decoración):

| Elemento | Veredicto | Función |
|---|---|---|
| Kicker rule (G4) | Se mantiene | Único marcador de inicio de sección tras retirar los degradados — jerarquía por repetición |
| Franja superior de tarjetas (G4) | Se mantiene | Firma de marca que unifica los dos tipos de tarjeta (tarifas y lista) |
| Tarjetas premiumListRow (G5) | Se mantienen | Aprobadas explícitamente por el cliente |
| Patrón de fondo hero/cierre | Se mantiene | Identidad de marca, 14% opacidad, fallback sólido — no es un "fondo complejo" |
| Eyebrows en mayúsculas | Se mantienen | Convención de etiqueta editorial (12px + letter-spacing), distinta del "exceso de mayúsculas" del CTA |

**Compatibilidad**: la ronda solo elimina marcado y ajusta valores — cero técnicas nuevas. El corte duro entre secciones es el comportamiento más antiguo y compatible del email HTML.

---

## 15. Rediseño profesional (ronda G8, 2026-07-16)

**Propósito**: ejecutar `prompt-g8-rediseno-profesional.md` — pasar de "parece premium" a "se comporta como profesional". No introduce patrones visuales nuevos: introduce infraestructura.

**Sub-patrones incorporados**:

- **Headings semánticos**: los títulos de sección son `<h2>` y los de tarjeta/paso/fila `<h3>`, siempre con `margin` explícito en el style inline (los resets por defecto de cliente no aplican). Regla del sistema a partir de ahora: ningún título nuevo como `<p>`.
- **UTM por módulo** (`utm` en tokens): todo enlace comercial lleva `utm_content` que identifica el módulo de origen. Convención completa en `docs/naming-conventions.md`.
- **Dark mode defensivo** (`darkMode` en tokens): clases `dm-*` + bloque `@media (prefers-color-scheme: dark)`. Diseñado para Apple Mail/Outlook apps; Gmail lo ignora y aplica su propia inversión — por eso los colores oscuros son conservadores (misma familia cromática de marca, sin invertir el naranja del CTA, que ya funciona sobre oscuro).
- **Saludo personalizado con fallback** (`personalization` en tokens): merge condicional en el subtítulo del hero. El fallback sin nombre es obligatorio — un "Hola ," roto en el primer render descalifica la pieza entera.
- **Composición asimétrica**: la cabecera de "Antes de decidir" rompe el eje centrado (kicker, eyebrow y h2 a la izquierda, con `align="left"` en el td contenedor para que Outlook no recentre las tablas hijas). Patrón disponible para cualquier sección que necesite variación de ritmo.
- **Honestidad tipográfica**: solo se declara el @font-face que realmente existe (Sora 700). Los weight:800 se sintetizan — documentado en el CSS, en los tokens y aquí. Regla: nunca declarar un @font-face sin URL verificada HTTP 200.

**Pendientes que deja G8** (para la ronda de QA visual o para el cliente):
1. URL real del woff2 de Sora 800 (necesita entorno con red a Google Fonts).
2. Set de iconos unificado según `icon-system-spec.md`.
3. Prueba social: activar solo si el cliente confirma "TOP 3 Comparadores España 2025" u otro dato verificable.
4. Confirmar sintaxis de merge del ESP definitivo.
5. QA visual real (Chromium/Litmus), ahora incluyendo dark mode y el corte hero→trust.
