# Mobile Spec: Mercedes-AMG — C 63 S E PERFORMANCE

## Parámetros mobile

| Parámetro | Valor |
|---|---|
| Ancho de ventana | 320px - 480px |
| Viewport | 100% (fluid) |
| Padding lateral global | 16px (mínimo táctil cómodo) |
| Estrategia general | Hybrid: columnas apiladas, tablas fluidas, CTA full-width |

Regla de fluidificación: `@media only screen and (max-width:620px)` — `.wrap{width:100%!important;max-width:600px!important}` (tablas de escena 600px) y `.row2{width:100%!important;max-width:552px!important}` (filas internas de 2 columnas). Las columnas `.col` apilan con `display:block!important;width:100%!important;box-sizing:border-box!important` (el box-sizing evita la clase de overflows +48px — Nike ZF6 2026-08). Imágenes con `class="img"` → `width:100%!important;height:auto!important` (sin `max-width:100%` en el estilo inline: resolvería contra anchos tentativos de columna).

## Especificación por módulo

### Módulo 1 — Header

**Estrategia mobile:** Sin cambios (redimensionar)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Ancho | 600px | 100% |
| Padding | 28px 24px | 24px 16px |
| Imagen ancho | 150px | 132px (logo) |
| Texto font-size | — | — |
| CTA ancho | — | — |

**Stacking:** no aplica (una sola celda). Logo centrado.
**Outlook mobile:** PNG con width/height explícitos.

### Módulo 2 — Hero

**Estrategia mobile:** Redimensionar (imagen fluida) + texto apilado

| Propiedad | Desktop | Mobile |
|---|---|---|
| Ancho | 600px | 100% |
| Padding | copy 44px 40px 52px | copy 32px 20px 40px |
| Imagen ancho | 600px | 100% (`class="img"`) |
| Texto font-size | H1 34px / body 16px | H1 27px (token h1HeroOnBrand.mobile) / body 16px |
| CTA ancho | auto | 100% |

**Stacking:** banner fluido; copy bajo la foto sobre negro.
**Outlook mobile:** VML roundrect con width fijo legible.

### Módulo 3 — Editorial foto-texto

**Estrategia mobile:** Apilar (imagen encima, texto debajo)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Ancho | 600px | 100% |
| Padding | 56px 24px | 40px 16px |
| Imagen ancho | 254px | 100% (`.col` + `class="img"`) |
| Texto font-size | H2 24px / body 16px | H2 22px / body 16px |
| CTA ancho | auto | 100% |

**Stacking:** `.col` block; la imagen (contenida en su `.col`) queda arriba; texto debajo.
**Outlook mobile:** columnas VML no aplican; tablas apiladas por el media query estándar.

### Módulo 4 — Editorial foto-texto-inverso

**Estrategia mobile:** Apilar (mismo tratamiento que módulo 3; la imagen pasa a estar debajo
del texto en el orden del DOM — si el orden visual es texto→imagen, mantenerlo con el orden de
celdas del componente)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Ancho | 600px | 100% |
| Padding | 56px 24px | 40px 16px |
| Imagen ancho | 254px | 100% |
| Texto font-size | H2 24px / body 16px | H2 22px / body 16px |
| CTA ancho | auto | 100% |

**Stacking:** idéntico al módulo 3 (consistencia de apilado).
**Outlook mobile:** idem.

### Módulo 5 — Banda-cierre

**Estrategia mobile:** Redimensionar + CTA full-width

| Propiedad | Desktop | Mobile |
|---|---|---|
| Ancho | 600px | 100% |
| Padding | 64px 40px | 48px 20px |
| Texto font-size | H2 24px / body 16px | H2 22px / body 16px |
| CTA ancho | auto | 100% |

**Stacking:** texto centrado; CTA a ancho completo.
**Outlook mobile:** VML roundrect ancho fijo.

### Módulo 6 — Footer

**Estrategia mobile:** Apilar enlaces

| Propiedad | Desktop | Mobile |
|---|---|---|
| Ancho | 600px | 100% |
| Padding | 32px 24px 40px | 28px 16px 36px |
| Texto font-size | 12px/11px | 12px/11px |
| CTA ancho | — | — |

**Stacking:** enlaces de baja/preferencias apilados (display:block) con separación.

## Notas generales mobile

- Padding lateral mínimo: 16px.
- Tamaño mínimo: 14px cuerpo, 20px titulares (aquí: 16/22 — cumplido).
- CTAs táctiles: alto ≥ 44px (12px 24px + 16px lh 1.5 ≈ 48px — cumplido).
- Imágenes: `class="img"` con `width:100%!important;height:auto!important` (regla del media
  query; sin max-width:100% inline).
- Verificación: Playwright 375 y 320 → `scrollWidth === viewport` (sin overflow horizontal).
- Escenas: cada tabla de escena mantiene su bgcolor al fluidificar (el fondo viaja con la tabla,
  nunca full-bleed).
