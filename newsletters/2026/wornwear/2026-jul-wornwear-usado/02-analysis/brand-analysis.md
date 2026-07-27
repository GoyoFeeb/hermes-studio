# Brand Analysis: Patagonia Worn Wear

## Identidad de marca

Worn Wear es el programa de ropa y equipamiento de segunda mano de Patagonia. Opera como submarca con identidad visual propia (wornwear.patagonia.com), que NO comparte paleta, tipografía ni estilo de botón con patagonia.com.

### Señales de identidad visual

| Dimensión | Worn Wear | Patagonia (marca madre) |
|---|---|---|
| Color signature | Naranja #FA4616 | Rojo #D32F2F |
| Fondo hero | Beige #EFE7DA | Blanco/imágenes |
| Footer | Negro #000000 | Variable |
| Tipografía | RidgewaySans | Futura/Patagonia propia |
| Logo | "WORN WEAR" (serif) + "patagonia" | Logo montaña + "Patagonia" |
| Tono | Directo, funcional, outdoor utility | Activismo ambiental, aventura épica |
| Fotografía | Lifestyle outdoor documental | Expediciones, naturaleza majestuosa |

Conclusión: **Son marcas distintas.** Worn Wear no es una "variante de color" de Patagonia. Tiene su propia personalidad visual, más terrenal, más de garaje que de cumbre. No heredar nada de la marca madre sin verificarlo en el propio wornwear.patagonia.com.

## Paleta de color inferida (getComputedStyle, Chrome real)

| Color | HEX | Uso observado |
|---|---|---|
| Naranja marca | `#FA4616` | Headline hero, CTA buttons, enlaces, subtítulo hero |
| Beige cálido | `#EFE7DA` | Fondo hero (lado texto), secciones alternas |
| Negro | `#000000` | Texto principal, footer background, bordes de botón |
| Gris medio | `#494949` | Precios secundarios, texto secundario |
| Blanco | `#FFFFFF` | Fondos de producto, header, CTA inverso |
| Gris claro | `#D3D4D5` | Separadores, bordes |
| Negro profundo | `#1A1A1A` | Sección "Your gear deserves credit" background |

## Tipografía

- **Fuente propietaria**: RidgewaySans en 3 pesos (Regular 300, Medium 500, Bold 700)
- **Fuente navegación**: Avenir Next LT Pro Medium (solo para menú superior)
- **Fallback email-safe**: Arial, Helvetica, sans-serif (la propia marca declara "GTStandard-M, sans-serif" con Arial como fallback final)
- **Jerarquía de tamaños** (observados): H1 hero 40px (h3 Large), h2 sección 28px (h2 Regular), body 16px (Paragraph), body secondary 14px (Product Card Subfield)

## Botón CTA (observado en vivo — 5 valores exactos)

| Propiedad | Valor | Nota |
|---|---|---|
| fontSize | `16px` | Real del site |
| fontWeight | `500` | Real del site |
| padding | `9px 28px` | Real del site |
| borderRadius | `40px` | Real del site |
| letterSpacing | `-0.2px` | Real del site |
| Background | `#FA4616` | Naranja marca |
| Texto | `#000000` (negro) | Decisión de accesibilidad — la web real usa blanco |
| Border | `4px solid #FA4616` | Mismo color que bg |
| Font-family | "Button" (RidgewaySans-Medium) | → Arial fallback |
| Display | `flex` (web) → `block` (email) | |
| Box-shadow | `none` | |
| Margin top | `24px` | |

⚠️ **Contraste**: El texto del botón CTA es #000000 (negro) sobre fondo #FA4616 (naranja) — 5.95:1, ✅ PASA WCAG AA. DECISIÓN CONSCIENTE: la web real de Worn Wear usa texto blanco (3.53:1, no pasa AA). En email se adopta negro por accesibilidad, mismo criterio que Spotify (negro sobre verde). Ver _changelog v2.2.1 para la discusión completa.

El botón secundario (Trade In sobre fondo negro) es inverso: fondo blanco, texto negro, border `4px solid white`.

## Fotografía

Worn Wear usa **fotografía real de outdoor lifestyle** con estas características:
- Iluminación natural, composición documental
- Personas reales en entornos auténticos (garajes, montaña, furgonetas, bosques)
- Paleta cromática cálida/tierra coherente con el beige de marca
- Producto fotografiado AISLADO sobre blanco puro en secciones de compra
- Sin filtros ni postproducción agresiva
- Sin ilustraciones, sin renders 3D, sin iconos decorativos

## Logo

**✅ PNG OFICIAL LOCALIZADO**
- URL: `https://wornwear.patagonia.com/cdn/shop/files/WW_Logo_Website.png?v=1745518005&width=500`
- Estado: HTTP 200, 38KB
- Dimensiones: 150×42px (display), escalable
- El logo muestra "WORN WEAR" en tipografía serif y "patagonia" en pequeño debajo
- **⚠️ Limitación**: El PNG tiene fondo blanco intrínseco. No funcionará sobre fondos oscuros (banda de cierre, footer) sin una versión invertida. Pendiente de confirmar si existe logo negativo (blanco sobre fondo oscuro).

## Voz de marca

La voz de Worn Wear es **directa, funcional, honesta**, con orgullo contenido de la durabilidad. Sin florituras, sin jerga técnica, sin exclamaciones. El titular "Put Used to Use" captura el tono: coloquial pero no informal, con un juego de palabras sutil pero sin forzarlo.

## Conclusiones para el newsletter

1. **Hero**: Debe usar fotografía real — hero-imagen es la elección correcta
2. **CTA**: Naranja #FA4616 con texto NEGRO #000000, border-radius 40px (pill), sin sombra. ⚠️ El texto negro es decisión de accesibilidad — la web real usa blanco (ver changelog).
3. **Paleta**: Beige #EFE7DA para fondos alternos, blanco para producto, negro para contraste
4. **Sin iconos decorativos**: Worn Wear no usa iconos en ninguna sección. Usar columns-3-beneficios-sin-icono o usp-cards-sin-icono (NO card-tarifa-3)
5. **Logo**: Disponible en PNG — usarlo en header sobre fondo blanco
6. **Tono en español**: Traducir la voz directa y funcional. "Pon lo usado a trabajar" como posible adaptación de "Put Used to Use"
