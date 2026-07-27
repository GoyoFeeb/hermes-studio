# Mobile Spec — Audi A6 Sportback e-tron (<600px)

## 1. header-logo
- Padding: 12px 16px
- Logo: "AUDI" texto, 13px
- Label opcional: 10px

## 2. hero-imagen
- Banner: 100% ancho (escalado), altura proporcional ~200px
- Título H1: 26px / 300 weight — token `typography.hero.h1.mobile.size`
- Subtítulo: 14px / 400 — token `typography.hero.subtitle.mobile`
- CTA: ancho completo o centrado, mismo estilo
- Padding inferior: 24px

## 3. editorial-foto-texto (mobile)
- **Transición a 1 columna**: la imagen ocupa todo el ancho, el texto va debajo
- Imagen: 100% × ~200px (proporcional)
- Titular: 20px
- Body: 15px
- CTA: mismo estilo

## 4. editorial-foto-texto-inverso (mobile)
- Misma disposición que editorial-foto-texto en mobile: imagen ancho completo, texto debajo (el orden texto/imagen se pierde en mobile — ambos se apilan igual)
- Imagen: 100% × ~200px
- Titular: 20px
- Body: 15px

## 5. columns-3-beneficios-sin-icono (mobile)
- **Transición a 1 columna**: los 3 stats se apilan verticalmente
- Cada stat: número + etiqueta, centrado
- Separador sutil entre cada stat
- Padding: 24px 16px

## 6. banda-cierre (mobile)
- Título: 20px
- Body: 15px
- CTA: ancho completo
- Padding: 32px 16px

## 7. footer (mobile)
- Padding: 16px
- Mismos estilos que desktop

## Nota responsive
Todas las transiciones a 1 columna se manejan con media query `@media (max-width: 599px)`. Baseline (sin media query) es la versión mobile-ready para Outlook/Webmail que no soportan media queries.
