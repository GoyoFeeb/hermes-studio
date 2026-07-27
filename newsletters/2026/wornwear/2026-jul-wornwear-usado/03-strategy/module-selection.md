# Module Selection: 2026-jul-wornwear-usado

## Patrón elegido: `fotografia-primero`

### Motivo (verificación contra los 5 criterios de fotografia-primero.md §6)

| # | Criterio | Worn Wear | ¿Cumple? |
|---|---|---|---|
| 1 | `photography.usesRealPhotography: true` y `treatment` describe fotografía como protagonista | ✅ `usesRealPhotography: true`. Treatment: "fotografía lifestyle de exterior... auténtico, sin filtros... la fotografía lleva el peso visual de la comunicación." | **Sí** |
| 2 | `iconography.componentImplication` desaconseja explícitamente iconos/emoji | ✅ "NO usar iconGlyph de emoji en ningún módulo... Worn Wear es una marca 100% fotografía + tipografía." | **Sí** |
| 3 | `layout.contentRhythm` documenta página real con bloques grandes de fotografía + texto breve | ✅ Hero SPLIT (50% foto), categorías con foto ancho completo, producto aislado sobre blanco, banda oscura de contraste. Sin grids de precios ni tablas. | **Sí** |
| 4 | Ninguna cifra de ahorro/comparación que justifique `saving.md` | ✅ Brief prohíbe explícitamente cifras de impacto ambiental, precios, descuentos. Sin "ahorra X%" ni "desde X€". | **Sí** |
| 5 | Ningún catálogo real de 2-8 categorías que justifique `category-grid` | ⚠️ La web real TIENE 4 categorías (Web Specials, Repaired Collection, Re-Tool, Kids & Baby). La campaña es de AWARENESS, no de catálogo — el brief no pide listar categorías. Se documentan como contenido para futuras campañas, no para esta primera toma de contacto. | **Sí** (la campaña es awareness, no catalog browsing) |

**Conclusión: `fotografia-primero` es el patrón correcto.** Las 4 categorías web existen pero no son el foco de esta campaña de descubrimiento. Si en futuras campañas se necesita listar categorías, usar `institutional` con `category-grid`.

## Hero: hero-imagen

| Decisión | Valor | Justificación |
|---|---|---|
| Tipo | `hero-imagen` | `photography.usesRealPhotography: true`. La marca se sostiene visualmente en fotografía real. `fotografia-primero` NO admite fallback a `hero-centrado` (ver patterns/fotografia-primero.md §3). |
| Arte | Pendiente de generación | Si `generate-hero-image` falla (sin API key / sin internet), se documenta como bloqueo y se usa placeholder explícito. NO se cambia a hero-centrado por este motivo. |
| Banner text | Brand name + headline + CTA | El texto va DEBAJO de la foto (en fila separada), nunca superpuesto (ver patterns/fotografia-primero.md §4). |
| CTA | Naranja #FA4616, texto negro #000000, border-radius 40px | Valores reales del pack (accesibilidad: 5.95:1 ✅). |

## Variante de icono: columns-3-beneficios-sin-icono

**Decisión:** Usar `columns-3-beneficios-sin-icono` para los beneficios.

**Motivo:** El brand pack (`iconography.componentImplication`) desaconseja explícitamente cualquier icono decorativo. `card-tarifa-3` exige `icon` (img 48×48) obligatorio en cada ítem — Worn Wear no tiene iconos que poner ahí. `columns-3-beneficios-sin-icono` usa una barrita de color decorativa en vez de icono, manteniendo la identidad visual de la marca (fotografía + tipografía, sin adornos).

**Alternativa descartada:** `usp-cards-sin-icono` — tiene estructura de tarjeta con borde (box-shadow, border-radius) y badge de insignia. Worn Wear en su web no usa tarjetas con borde en ninguna sección. `columns-3-beneficios-sin-icono` es más fiel al lenguaje visual plano de la marca.

## Módulos seleccionados

| # | Módulo | Componente | Fondo | Obligatorio? | Justificación contra contentRhythm |
|---|---|---|---|---|---|
| 1 | Cabecera | `header-logo.html` | Blanco (header real) | ✅ Ancla | Logo Worn Wear sobre blanco, como en la web real. |
| 2 | Hero | `hero-imagen.html` | Foto banner + #000000 | ✅ Ancla | Replica el peso visual del hero SPLIT real: fotografía lifestyle + headline naranja + CTA. La foto ocupa la parte superior, el texto va debajo sobre fondo negro (colors.primary). |
| 3 | Intro | `intro-cta.html` | Blanco | Opcional | Transición breve post-hero: contextualiza que Worn Wear es para quien ya compra Patagonia nuevo. Refleja el párrafo explicativo que sigue al hero en la web real. |
| 4 | Beneficios | `columns-3-beneficios-sin-icono.html` | Beige #EFE7DA | Opcional (fotografia-primero) | 3 razones para comprar usado. El beige replica el fondo del hero de la web real. Sin iconos. Reemplaza la sección de producto/categorías de la web (que no podemos replicar sin assets de producto). |
| 5 | Banda de cierre | `banda-cierre-asimetrico.html` | Deep #1A1A1A | ✅ Ancla | Replica la sección "Your gear deserves credit" de la web real: banda oscura, alto contraste, CTA principal. Variante asimétrica porque el `sectionStyle` del pack es asimetrico. |
| 6 | Footer | `footer.html` | Beige #EFE7DA | ✅ Ancla | Placeholders legales (test campaign). |

## Módulos descartados y por qué

| Módulo | Motivo |
|---|---|
| `category-grid.html` | `fotografia-primero` no lo incluye. Las 4 categorías web existen pero no son el foco de esta campaña de awareness. Futura campaña: considerar `institutional` con `category-grid`. |
| `usp-cards.html` / `usp-cards-sin-icono.html` | `fotografia-primero` no lo incluye. La credibilidad de Worn Wear va implícita en la marca Patagonia — no necesita tarjetas de prueba social. |
| `card-tarifa-3.html` | Exige `icon` obligatorio (img 48×48). Worn Wear no tiene iconos. Descartado en el brand pack. |
