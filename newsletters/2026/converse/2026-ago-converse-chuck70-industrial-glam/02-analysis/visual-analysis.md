# Visual Analysis: Converse — 2026-ago-converse-chuck70-industrial-glam

## Dirección visual general

**Editorial heritage con actitud.** Converse es una marca de 115+ años cuya silueta es icono cultural. La dirección visual del email replica la web real: **fotografía de producto protagonista sobre fondo blanco infinito**, tipografía sans limpia (Proxima Nova → Arial/Helvetica), **botones cuadrados** (radius 0), negro como color estructural dominante, sin iconografía decorativa. La edición Industrial Glam aporta el matiz: **acabado envejecido** — el "desgaste" es diseño, no suciedad.

## Paleta (tokens del pack converse v2.2.0)

| Rol | Hex | Uso |
|---|---|---|
| Negro primario | `#000000` | Banda de hero (colors.primary), titulares, CTA secundario outline |
| Blanco | `#FFFFFF` | Fondos de escena, texto sobre banda negra |
| Negro profundo | `#1B1B1B` | Banda de cierre (colors.deep), CTA hover |
| Gris secundario | `#757575` | Texto secundario (color real del link "Más información") |
| Gris terciario | `#9B9B9B` | Notas / texto legal terciario |
| Gris claro | `#F4F4F4` | Fondo de footer (--wildsand real) |
| Gris borde | `#E5E5E5` | Separadores, bordes (--mercury real) |
| Pizarra clara | `#D3D2D3` | Subtítulo sobre banda negra (onBrandSecondary, --paleslate real) |
| Rojo marca | `#D62929` | **Solo puntuación** (--punch real; el rojo del parche All Star). NO como CTA — el CTA verificado es negro/blanco |
| Verde/ámbar/rojo estado | `#138410` / `#F5A623` / `#D62929` | Estados (no usados en esta pieza) |

## Tipografía

- **Una sola familia**: Proxima Nova (real) → `Arial, Helvetica, sans-serif` en email (stack de fallback real de la web).
- Jerarquía: hero H1 32px/700 blanco sobre negro → títulos de escena 20px/600 → body 14px/400 → kickers 11px/700 uppercase con letter-spacing 1.5px.
- CTA: 14px/600, letter-spacing normal (real).

## Sistema de botones (un solo estilo, 2 siluetas del motor)

| Silueta | Componente | Color | Uso |
|---|---|---|---|
| Primaria (bloque cuadrado) | `cta-bulletproof` + `radius.ctaPill:0` | bg `#FFFFFF`, texto `#000000` | Hero (Descubrir) + cierre (Hacerlas tuyas) — sobre bandas negras |
| Secundaria (outline) | `cta-secondary-bulletproof` | borde/texto `#000000` sobre blanco | Escena editorial (Ver los detalles) — sobre blanco |

La silueta primaria es **blanca con texto negro** (inversión documentada): visible sobre las bandas negras del hero y el cierre; replica el blanco-sobre-negro real de la marca (nav, tiles oscuros). Contraste 21:1 AAA.

## Composición de escenas (4 + cabecera + footer)

1. **Cabecera**: logo real (SVG→PNG, 120×15 o escalado) centrado, fondo blanco.
2. **Hero**: foto real del producto a sangre (600px) + banda negra (gradiente #000→#1B1B1B) con kicker, H1 blanco "Nuevas, con memoria.", subtítulo #D3D2D3 y CTA blanco cuadrado. *Composición: imagen encima, texto debajo — única.*
3. **Revelación**: fondo blanco, kicker + título 20px + cuerpo 14px centrados. Sin CTA (pausa).
4. **Detalle**: `editorial-foto-texto-inverso` (texto izquierda 54% / foto derecha 46%) — **único** bloque imagen‖texto. Foto de detalle (ángulo/top del producto). CTA secundario outline negro.
5. **Cierre**: banda #1B1B1B, línea de campaña "Solo son zapatillas. Hasta que tú las llevas.", precio/tallas en frase con verbo, CTA blanco cuadrado.
6. **Footer**: #F4F4F4, enlaces legales reales, © 2026 Converse.

## Fotografía / assets

- **Hero**: foto real del PDP (vista a_107, Egret/Egret/Black) — fondo blanco infinito. Descargar vía navegador (Akamai bloquea curl). Si no es descargable, generar con image_generate describiendo la silueta (high top, Egret/negro, mediasuela off-white, cadena metálica) — NUNCA con el logotipo pintado (el logo va como asset aparte).
- **Detalle**: vista e_08 (top and side view) o d_08 (angled) del PDP.
- **Logo**: logo-header.svg (real) → PNG transparente en build.

## Ritmo visual

Banda negra (hero) → blanco (revelación) → blanco con columna foto/texto (detalle, alineación cambiada) → #1B1B1B (cierre) → #F4F4F4 (footer). Fondo/alineación/densidad cambian en cada transición (regla dura del patrón fotografia-primero). Composición imagen‖texto: UNA sola vez.
