# Changelog V3 — Para y Compara Newsletter Premium

> Campaña: 2026-jul-ahorra-fibra-movil
> Versión: V3 Premium Static
> Fecha: 2026-07-13

---

## Resumen de cambios

### 1. Cambios de estructura

- **Nuevo orden**: Preheader → Header → Hero (imagen) → Badge promo → Copy hero + CTA → Trust bar → Tarifas 4 cards → Cómo funciona 3 pasos → Qué tener en cuenta → CTA final → Footer
- **Longitud reducida**: ~20% más compacta que la versión V2
- **Single h1**: Solo un `<h1>` real en toda la newsletter (hero headline)
- **Secciones alternas**: Blanco → #F8F5FC (lila claro) → Blanco → #F8F5FC → Blanco → #F8F5FC → #F4F3F9

### 2. Cambios de copy
- Hero eyebrow: "Compara, elige y ahorra" (nuevo, inspirado referencia)
- Hero título: "Ahorra en tu tarifa de fibra y móvil" (nuevo)
- Hero subtítulo: "Descubre la mejor oferta del mercado" (nuevo)
- Microcopy CTA: eliminado (integración más limpia)
- Tarjetas tarifas: texto recortado ~30% más conciso
- Badge promocional: "LA MEJOR OFERTA DEL MES" (nuevo, desde referencia 3000)
- Trust bar: 3 items desde referencia 5000
- CTA final: "Encuentra tu próxima tarifa en minutos" (nuevo)

### 3. Cambios de diseño

#### Header
- Fondo: #5E2E91 (morado profundo, extraído de referencia)
- Padding: 22px 24px 18px (más respirado verticalmente)
- Logo centrado, mismas dimensiones

#### Hero
- **Imagen hero completa**: paraycompara-2000.png desde CDN (misma que referencia visual)
- Badge promocional "LA MEJOR OFERTA DEL MES" en HTML real con fondo blanco y radius 10px
- CTA naranja #FF5A3C con VML bulletproof para Outlook

#### Trust Bar
- Inspirada directamente en paraycompara-5000.png
- Fondo: #EAE0EA (lila pálido), radius 50px (píldora)
- 3 items: icono círculo HTML + texto, sin imágenes externas
- Sin divisores, separación por whitespace

#### Tarjetas de Tarifas
- Misma estructura grid 2×2
- Color título actualizado a #5E2E91
- Copy más conciso (13px, 1.45 line-height)
- Iconos en círculo #F3E5F5, radius 12px

#### Pasos "Cómo funciona"
- Números con fondo #5E2E91, radius 50%, fuente 20px weight 800
- Flechas conectoras en desktop (→), ocultas en mobile
- Mejor alineación vertical

#### "Qué tener en cuenta"
- Microcards sobre fondo #F8F5FC, radius 16px, sin bordes
- Icono en círculo blanco sobre fondo #F8F5FC, radius 50%
- Títulos #5E2E91, 14px bold
- Texto 12px, más compacto

#### CTA Final
- Fondo #F8F5FC, no repite blanco del hero
- Título 26px weight 800
- Mismo CTA bulletproof que hero

#### Footer
- Fondo #F4F3F9 (el más claro)
- Separador #DCCBD9
- Texto legal 11px, color #B0A0AD
- Enlaces | separados por pipe

### 4. Mejoras técnicas

| Aspecto | Antes | Ahora |
|---|---|---|
| `lang` | `lang="en"` | `lang="es"` ✅ |
| Preheader oculto | No tenía | `font-size:1px; mso-hide:all` ✅ |
| Media queries | No | `@media only screen and (max-width:600px)` ✅ |
| Mobile stack | No | Clases `.mobile-stack`, `.mobile-hide`, `.mobile-img` ✅ |
| Bulletproof CTA | No | VML `v:roundrect` + fallback tabla ✅ |
| mso-line-height-rule | No | En todos los p ✅ |
| Outlook fallback | Mínimo | VML + `mso-hide` + font-family inline ✅ |
| Alt text | Vacío | Descriptivo en logo, hero, decorativo en iconos |
| Single h1 | Múltiples h1 | Solo 1 h1 real ✅ |
| Imágenes en CDN | Mezcla local/CDN | Todas HTTPS (paraycompara-2000.png, logo, iconos existentes) ✅ |

### 5. Decisiones de compatibilidad

- **Arial/Helvetica** como font-family (no Google Fonts — no funcionan en email)
- **Tablas** para todo el layout (no flexbox/grid)
- **VML** para botones redondeados en Outlook
- **Border-radius** en cards se pierde en Outlook; el diseño sigue siendo funcional sin él
- **Máximo 600px** de ancho interior
- **Sin JavaScript**
- **Sin SVG** inline complejo
- **Sin background-image** críticas

### 6. Elementos preparados para animación (Fase 2)

- El hero ya tiene espacio para GIF (sustituir `paraycompara-2000.png` por GIF)
- El primer frame del GIF debe coincidir visualmente con la imagen actual
- El CTA queda fuera del GIF para mantener clicabilidad real

### 7. Assets nuevos necesarios para CDN

Los siguientes assets se han generado localmente en `assets-v3/` y están listos para subir:

| Asset | Tamaño | Ruta local |
|---|---|---|
| `hero-poster.png` | ~2 KB | `assets-v3/hero-poster.png` |
| `icon-badge-percent.png` | ~4 KB | `assets-v3/icon-badge-percent.png` |
| `icon-piggybank-purple.png` | ~2 KB | `assets-v3/icon-piggybank-purple.png` |
| `icon-seal-free.png` | ~4 KB | `assets-v3/icon-seal-free.png` |

Actualmente la trust bar usa iconos CSS/HTML en lugar de imágenes para evitar dependencias de CDN.

### 8. Archivos generados (Fase 1)

| Archivo | Ruta | Tamaño |
|---|---|---|
| V3 estático | `v3-premium/paraycompara-v3-premium-static.html` | ~33 KB |
| V3 inline | `v3-premium/paraycompara-v3-premium-static-inline.html` | ~32 KB |
| Preview desktop | `v3-premium/preview-desktop.png` | 198 KB |
| Preview mobile | `v3-premium/preview-mobile.png` | 439 KB |
| Análisis visual | `v3-premium/visual-analysis-reference.md` | — |
| Assets V3 | `v3-premium/assets-v3/` | ~6 KB |