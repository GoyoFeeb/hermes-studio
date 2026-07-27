# Brand Analysis — BMW Experiencia Premium

## Estado del brand pack

| Recurso | Ruta | Versión | Estado |
|---------|------|---------|--------|
| Brand tokens | `brands/bmw/tokens/brand-tokens.json` | v2.3.1 | ✅ Verificado (getComputedStyle real desde bmw.es, 2026-07-24) |
| Photography treatment | En el pack | — | ✅ Observado desde landing real |
| Iconography style | En el pack | — | ✅ Observado desde landing real |
| Voice rhythm | En el pack | — | ✅ Observado desde landing real |
| Layout content rhythm | En el pack | — | ✅ Observado desde landing real |

## Discrepancias: Paleta solicitada vs Brand pack real

| Rol | Solicitado por usuario | Brand pack real (v2.3.1) | Decisión |
|-----|----------------------|------------------------|----------|
| Blanco fondo | `#FFFFFF` | `#FFFFFF` | ✅ Coinciden |
| Negro primario | `#111111` | `#000000` (primary) / `#262626` (textBody) | ⚠️ Prevalece brand pack |
| Gris oscuro | `#3A3A3A` | No existe en el pack | ⚠️ No se usa — el motor usa `#262626` (darkBg) o `#6F6F6F` (textSecondary) |
| Gris medio | `#6D6D6D` | `#6F6F6F` (textSecondary) | 🔄 Coincidencia aproximada — prevalece `#6F6F6F` |
| Gris claro | `#E6E6E6` | No existe en el pack | ⚠️ El pack usa `#D2D2D7` (border) |
| Gris apoyo | `#F7F7F7` | `#F4F4F4` (lightBg) | 🔄 Coincidencia aproximada — prevalece `#F4F4F4` |
| **Azul BMW** | **`#0066B1`** | **`#1C69D4`** (ctaBackground) | **⛔ CRÍTICO: `#0066B1` fue explícitamente rechazado en `_changelog` v2.2.0 como "inventado, no verificado". Prevalece `#1C69D4`.** |

## Discrepancias: Tipografía y botones

| Aspecto | Solicitado por usuario | Brand pack real (v2.3.1) | Decisión |
|---------|----------------------|------------------------|----------|
| Font display | BMW Type Next | `'Titillium Web', Arial, Helvetica, sans-serif` | ⚠️ BMW TypeNext no es segura en email. Titillium Web es un sustituto geométrico real de Google Fonts. |
| Font body | Helvetica Neue, Helvetica, Arial | `Arial, Helvetica, sans-serif` | ✅ Coherente |
| Weights | 300, 400, 500 | `light: 300, regular: 400, medium: 500, semibold: 600, bold: 700` | ⚠️ El pack incluye 600 y 700 que el usuario pidió evitar. Los componentes del motor los usan para secciones como h2/h3. |
| Button radius | 0px | `3px` | ⚠️ Prevalece el valor real observado (3px) sobre la preferencia del usuario (0px) |
| CTA bg color | — (implícito azul) | `#1C69D4` | ✅ Valor real observado del botón "Configuración y precio" en bmw.es |
| CTA text color | — (implícito blanco) | `#FFFFFF` | ✅ Coherente |
| CTA padding | — (implícito) | `12px 28px` | ✅ Valor real observado |
| CTA font size | — | `15px` | ✅ Valor real observado |
| CTA font weight | — | `500` | ✅ Coherente con lo solicitado |
| CTA letter spacing | — | `0.5px` | ✅ Valor real observado |

## Observaciones clave

1. **El azul #0066B1 no es el azul BMW real.** El brand pack documenta que el valor `#0066B1` fue fabricado por una sesión previa de IA que nunca verificó el sitio real. El azul real de CTA de BMW es `#1C69D4` (observado con `getComputedStyle` desde `https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html`).

2. **El brand pack usa Titillium Web como display font** importada desde Google Fonts (pesos 300/400/700). Es un sustituto geométrico de BMW TypeNext, seguro para email vía `@import` en el `<head>`.

3. **Los botones tienen radio 3px**, no 0px. Prevalece el valor real observado.

4. **La paleta del usuario es más amplia que el brand pack** (gris oscuro #3A3A3A, gris claro #E6E6E6 no existen en el pack). Esto no es problemático — el motor usa los tokens del pack y los que no existen se ignoran.
