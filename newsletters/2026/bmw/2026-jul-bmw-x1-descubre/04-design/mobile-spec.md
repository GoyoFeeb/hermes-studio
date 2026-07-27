# Mobile Spec — BMW X1 "Descubre"

## Reglas generales

- El motor ya tiene `class="mobile-stack"` en todos los componentes del patrón institutional: en mobile (< 600px), las columnas apilan verticalmente.
- Padding se reduce de 40px/32px laterales a 16px/20px (`class="mobile-pad-sm"`).
- Hero image se escala con `class="mobile-img"` (width:100%, height:auto).
- H1 hero se reduce a 26px (`class="mobile-hero-h1"`).

## Ajustes específicos por módulo

### header-logo
- Logo: mantiene dimensiones (120x36), centrado.
- Padding: 28px 24px 14px → el componente ya lo maneja.

### hero-imagen
- Banner: 100% width, height auto.
- Título: 26px (mobile override en el componente).
- CTA: `class="mobile-full"` → botón a ancho completo.

### intro-cta
- Padding: 48px 40px → se reduce vía `mobile-pad-sm`.
- CTA: `class="mobile-full"`.

### columns-3-beneficios
- Las 3 columnas apilan verticalmente (`class="mobile-stack"`).
- Padding: se reduce.
- Iconos centrados, texto centrado.

### banda-cierre
- Padding: se reduce.
- CTA: `class="mobile-full"`.

### footer
- Sin cambios especiales en mobile — el footer es inherentemente apilado.
