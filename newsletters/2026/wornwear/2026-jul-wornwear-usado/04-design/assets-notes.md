# Assets Notes: 2026-jul-wornwear-usado

## Assets necesarios

### 1. Logo (✅ Verificado)

| Campo | Valor |
|---|---|
| URL | `https://wornwear.patagonia.com/cdn/shop/files/WW_Logo_Website.png?v=1745518005&width=500` |
| Estado | HTTP 200 ✅ |
| Formato | PNG |
| Dimensiones | 150×42px (display), 500×139px (source) |
| Peso | 38KB |
| Alt text | "Patagonia Worn Wear®" |
| ⚠️ Limitación | Tiene fondo blanco intrínseco — solo usar sobre fondo blanco |

**No usar sobre:** banda de cierre (#1A1A1A), hero (#000000), ni ningún fondo oscuro. No hay versión invertida disponible.

### 2. Hero Banner Image (🔴 PENDIENTE)

| Campo | Valor |
|---|---|
| Tipo | Fotografía lifestyle outdoor |
| Formato | JPG o PNG |
| Dimensiones | 600×340px (o superior, escalable) |
| Contenido | Persona(s) en entorno outdoor con equipo Patagonia (ej. organizando equipo en garaje, mochila al hombro, chaqueta en montaña) |
| Tono visual | Iluminación natural, composición documental, paleta cálida/tierra |
| Alt text | Descriptivo de la escena |
| Fuente sugerida | Descargar de wornwear.patagonia.com (las imágenes del hero SPLIT o de categorías) y redimensionar |

**Opción de generación:** `npm run generate-hero-image` (si hay API key con facturación).
**Plan B si falla:** Placeholder explícito en el HTML (bloque table-based de 280px, fondo #EFE7DA, texto "ASSET HERO PENDIENTE · 600 × 340 PX").

### 3. Fotos de producto / categorías (❌ No disponibles)

No hay assets de producto para esta campaña. Los módulos que en la web real usan fotos de producto (category grid, new arrivals slider) se han reemplazado por texto (beneficios en columns-3-beneficios-sin-icono). No incluir imágenes de producto sin assets verificados.

### 4. Pattern tile (❌ No aplica)

Worn Wear no usa patrones decorativos. `gradients.heroBackground` es "none". No se genera tile de patrón.

## Resumen de assets

| Asset | Estado | Módulo | CDN pendiente |
|---|---|---|---|
| Logo (PNG) | ✅ Verificado HTTP 200 | header-logo | Sí — migrar a CDN antes de producción |
| Hero banner | 🔴 Pendiente de generar | hero-imagen | Sí |
| Íconos de beneficio | ❌ No aplica (sin-icono) | columns-3-beneficios-sin-icono | — |
| Fotos de producto | ❌ No disponibles | — | — |
| Pattern tile | ❌ No aplica | — | — |

## Migración a CDN (producción)

Antes de producción real, migrar los assets locales a CDN:
1. Subir `WW_Logo_Website.png` y el hero banner a CDN
2. Verificar HTTP 200 de cada uno
3. Actualizar rutas en campaign-data.json
4. Re-exportar HTML
5. Verificar: `grep -c 'src="assets/' → 0`, `grep -c 'file://' → 0`
