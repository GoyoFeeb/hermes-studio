# Mobile Spec — Rolex Datejust "Una fecha para recordar"

## Reglas generales

- El motor ya maneja el apilado móvil vía `class="mobile-stack"` en los módulos asimétricos (`intro-cta-asimetrico`, `banda-cierre-asimetrico`): en mobile (<600px), la columna de texto y la columna de CTA apilan verticalmente.
- Padding se reduce de 40px/32px laterales a 16px/20px (`class="mobile-pad-sm"`).
- Hero banner se escala con `class="mobile-img"` (width:100%, height:auto).
- H1 hero se reduce de 34px a 26px (`typography.hero.h1.mobile.size` en el pack).
- CTA usa `class="mobile-full"` en todos los módulos — ancho completo en mobile, ajustado al texto en desktop (fix de la ronda 2026-07-25, ver `engine/CHANGELOG.md`).

## Ajustes específicos por módulo

### header-logo
- Logo: mantiene dimensiones (90×32), centrado.
- Eyebrow "OYSTER PERPETUAL": mantiene tamaño, no se recorta (11 caracteres, cabe en 320px de ancho mínimo).

### hero-imagen
- Banner: 100% width, height auto — la fotografía macro conserva su composición vertical (no depende de un aspect ratio panorámico frágil).
- H1: 26px (`hero.h1.mobile.size` del pack, ver `typography.hero.h1.mobile`).
- Subtítulo: 14px (`hero.subtitle.mobile.size`).
- CTA: `class="mobile-full"` → botón a ancho completo.

### intro-cta-asimetrico
- Columna de texto (64%) y columna de CTA (36%) apilan verticalmente — título+cuerpo primero, CTA outline debajo, ambos a ancho completo.
- Padding se reduce vía `mobile-pad-sm`.

### columns-3-beneficios-sin-icono
- Los 4 ítems apilan verticalmente (el componente ya soporta 2-4 ítems en columna en mobile, mismo mecanismo que columns-3-beneficios con icono).
- Texto centrado, mismo tamaño que desktop (13px/300 body ya es suficientemente compacto).
- Insignia final (`highlight`/`highlightNote`) mantiene su ancho ajustado al contenido.

### banda-cierre-asimetrico
- Título+cuerpo a todo el ancho arriba (ya lo son en desktop, sin cambio).
- CTA: pasa de ancho fijo (280px) a `class="mobile-full"` — única diferencia real de mobile en este módulo.

### footer
- Sin cambios especiales — el footer es inherentemente apilado en ambos anchos.
