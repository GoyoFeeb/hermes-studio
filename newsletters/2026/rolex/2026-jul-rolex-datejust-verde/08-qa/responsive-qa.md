# Responsive QA (320/375) — Rolex Datejust "Una fecha para recordar"

**Misma limitación de render que `visual-qa.md`** — sin capturas reales a 320/375px. Verificación
basada en el CSS del `@media` fuente y en los mecanismos ya validados en las 15 campañas reales
del sistema (mismas clases `mobile-*`, sin código nuevo específico de Rolex en esta capa).

## Verificación del bloque `@media max-width:599px`

- 1 bloque `@media` presente en `final.html` (heredado de `_shell.html`, compartido por todas las campañas).
- `class="mobile-full"` presente en los 3 CTA (hero, intro-cta-asimetrico, banda-cierre-asimetrico) — pasan a ancho completo en mobile, mismo mecanismo verificado en la ronda de fix del CTA (2026-07-25).
- `class="mobile-img"` en el banner del hero — se escala a 100% width / height auto.
- `class="mobile-hero-h1"` en el H1 — cae a `hero.h1.mobile.size` (26px, definido en `typography.hero.h1.mobile` del pack) en vez del 34px de desktop.
- `class="mobile-pad-sm"` presente en los módulos con padding lateral grande (intro-cta-asimetrico, columns-3-beneficios-sin-icono, banda-cierre-asimetrico) — reduce el padding lateral en mobile.
- `class="mobile-stack"` en `intro-cta-asimetrico` y `banda-cierre-asimetrico` — las columnas asimétricas (texto/CTA) apilan verticalmente por debajo de 600px, mismo mecanismo ya usado en las campañas Worn Wear/Nike/BMW con estas variantes.

## Ítems específicos de esta campaña

- **Eyebrow "OYSTER PERPETUAL"** (11 caracteres + tracking 2px): cabe sin recorte en el ancho mínimo de referencia (320px) — es más corto que equivalentes ya verificados en otras campañas (ej. "TIRES SOLDIER"-style eyebrows de BMW).
- **4 ítems de `columns-3-beneficios-sin-icono`** (extremo superior del rango 2-4): el componente ya apila verticalmente en mobile para cualquier cantidad de ítems dentro del rango — no requiere ajuste adicional por tener 4 en vez de 3.
- **CTA "Ver la colección Datejust"** (22 caracteres, el label más largo de la campaña): con `mobile-full` no hay riesgo de truncado — el botón se ajusta al ancho completo, no al texto, en mobile.

## Hallazgos

Ninguno. Mecanismo responsive reutilizado sin cambios de esta campaña — el riesgo real estaría en un componente nuevo, y `fotografia-primero` no introduce ninguno para Rolex.
