# Brand Analysis: Aesop

## Identidad de marca

Aesop es una casa australiana de cosmética fundada en 1987 en Melbourne. Su identidad visual es radicalmente distinta a la del resto de marcas del sistema: minimalista, tipográfica, sin modelos humanos, sin promesas de transformación. No es "lujo silencioso" al uso — es una postura intelectual: el producto habla por sí mismo, y la comunicación es casi literaria.

## Señales de identidad visual

| Dimensión | Aesop |
|---|---|
| Color signature | No hay un color de marca — el fondo crema #FFFEF2 es el lienzo. El negro/gris oscuro (#333333, #252525) es el color del texto y los acentos estructurales. |
| Fondo global | Crema #FFFEF2 (NO blanco) |
| CTA | Outline (transparente, borde 1px, border-radius 0) — nunca sólido |
| Tipografía | SuisseIntl (cuerpo) + Zapf-Humanist (display) |
| Logo | "Aesop" en tipografía serif clásica |
| Tono | Preciso, literario, sensorial sin superlativos |
| Fotografía | Producto aislado + ingredientes naturales. Sin modelos. |
| Iconos | Ninguno decorativo. Solo iconos funcionales de UI. |

## Paleta de color inferida (getComputedStyle, Chrome real)

| Color | HEX | Uso observado |
|---|---|---|
| Crema | `#FFFEF2` | Fondo global de toda la página |
| Gris oscuro | `#333333` | Texto principal, navegación, precios |
| Gris footer | `#252525` | Fondo del footer |
| Crema claro | `#FFFEF2` | Texto sobre fondo oscuro (hero, footer) |
| Blanco | `#FFFFFF` | Fondos de imagen de producto en carrusel |
| Gris claro | `#F6F5E8` | Posible fondo de sección alterna (muy sutil) |
| Gris medio | `#666666` | Texto secundario |
| Blanco | `#F1F1F1` | Gris muy claro para fondos secundarios |

## Tipografía

- **Fuente principal**: **SuisseIntl** (Regular 400) — sans-serif, geométrica, espaciado generoso. Usada para cuerpo, navegación, titulares.
- **Fuente medium**: **SuisseIntl-Medium** (Medium 500) — variante seminegra de la misma familia. Usada para CTAs y énfasis suave.
- **Fuente display**: **Zapf-Humanist** (Regular 400) — serif humanista de inspiración caligráfica (Hermann Zapf, tipo Palatino/Optima). Usada para citas literarias y titulares editoriales.
- **Fallback email-safe**: Arial, Helvetica, sans-serif (ninguna de las dos fuentes propietarias está disponible en email).
- **Jerarquía de tamaños** (observados):
  - H1 página: 30px, 400, #FFFEF2 (sobre fondo oscuro) o #333333
  - H2 editorial: 30px, 400
  - H3 producto: 16px, 700, #333333
  - Body: 14px, 400, #333333
  - Nav: 12px, 400, #333333
  - CTA: 14px, 400 (SuisseIntl-Medium = 500)

## Botón CTA (observado en vivo — 5 valores exactos)

| Propiedad | Valor | Nota |
|---|---|---|
| fontSize | `14px` | Real de la web |
| fontWeight | `400` | Real (SuisseIntl-Medium = 500 en web, mapeado a 400 en email-safe) |
| padding | `13px 24px 12px` | Real de la web |
| **borderRadius** | **`0px`** | **Real de la web — ESQUINAS RECTAS, sin redondeo** |
| letterSpacing | `0` (normal) | Real de la web |
| Background | `transparent` (real) / `#252525` (brand pack) | La web usa outline (transparente + borde). El pack usa sólido como compromiso del motor. |
| Texto | `#FFFEF2` (crema) o `#333333` | Sobre fondo oscuro: crema. Sobre fondo claro: gris oscuro. |
| Border | `1px solid #FFFEF2` (sobre oscuro) | La web usa el mismo color que el texto para el borde. |
| Font-family | "SuisseIntl-Medium" → Arial fallback | |
| Display | `inline-block` | |
| Box-shadow | `none` | |
| Text-decoration | `none` | |

⚠️ **Contraste**: El CTA es outline (transparente) en la web real. En email, el motor genera un CTA sólido (#252525 sobre fondo crema). #252525 sobre #FFFEF2 da ~12.24:1 ✅ PASA con margen. El texto del CTA (#FFFEF2) sobre fondo #252525 da ~12.24:1 ✅.

## Logo

**✅ PNG OFICIAL LOCALIZADO**
- URL: `https://www.aesop.com/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-aesop-us-Library/default/dw1e4239a3/images/logo.png`
- Estado: HTTP 200 ✅
- Dimensiones: 140×45px
- El logo muestra "Aesop" en tipografía serif clásica (Didot-style)
- ⚠️ El PNG tiene fondo transparente — funciona sobre #FFFEF2 pero puede perderse sobre fondo oscuro. Verificar versión en blanco para fondos oscuros.

## Voz de marca

La voz de Aesop es **precisa, casi literaria, sin superlativos**. No vende transformación: describe fórmulas, ingredientes y gestos. El tono es sensorial pero contenido — evoca texturas, aromas y rituales sin prometer resultados. Sin exclamaciones, sin urgencia, sin comparativos. Hay espacio para citas literarias (Ada Lovelace en el footer) y observaciones inesperadas.

## ⚠️ Silueta del CTA: style:block + bug VML secundario

El CTA primario de Aesop usa **`components.cta.style: "block"`**, que activa `resolveIncludeAlias()` en `lib/assemble.js` para redirigir `{{include:cta-bulletproof}}` → **`cta-block-bulletproof.html`**: bloque sólido con border-radius FIJO en 0 y `arcsize="0%"` en VML (Outlook recibe un rectángulo, no una píldora). Es la **primera marca del sistema que usa style:block** — el mecanismo existía pero no se había ejercitado con una marca real.

⚠️ **Bug VML en CTA secundario**: `cta-secondary-bulletproof.html` línea 23 tiene `arcsize="50%"` hardcodeado en el VML. Aunque `radius.ctaPill` esté en 0 y el HTML salga cuadrado, **Outlook clásico renderiza el CTA secundario como píldora**. Hallazgo documentado para Agente 07.

| Silueta | Componente | VML arcsize | Estado |
|---|---|---|---|
| Primario (hero, banda-cierre) | `cta-block-bulletproof` (por style:block) | `0%` ✅ Cuadrado en Outlook | ✅ Correcto |
| Secundario (intro, category-grid) | `cta-secondary-bulletproof` | `50%` ❌ Píldora en Outlook | ❌ Bug documentado |
