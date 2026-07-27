# Responsive QA: 2026-jul-wornwear-usado

## Verificación responsive (≤599px)

Basado en las especificaciones de mobile-spec.md y la verificación de clases `mobile-stack` y `mobile-pad-sm` en el HTML generado.

| Módulo | Clase mobile-stack? | Padding reducido? | Font-size reducido? |
|---|---|---|---|
| header-logo | N/A (centrado) | 16px 20px (vs 20px 24px) | Logo 120px (vs 150px) |
| hero-imagen | N/A (apilado) | 28px 20px 36px | H1: 24px (vs 32px) |
| intro-cta | N/A (centrado) | 32px 20px | Título: 20px (vs 22px) |
| columns-3-beneficios-sin-icono | class="mobile-stack" en filas | 36px 20px | Sin reducción (15px/13px) |
| banda-cierre-asimetrico | class="mobile-stack" | 36px 20px | Título: 20px (vs 22px) |
| footer | N/A (centrado) | 24px 20px 16px | Sin reducción |

## Verificación de stacking

El HTML inline contiene clases `mobile-stack` para las columnas de beneficios y `mobile-full` para CTAs. Las tablas se apilan al 100% en viewports ≤599px mediante la media query `@media only screen and (max-width:599px)`.

## Veredicto

✅ **PASS** — Stacking configurado, padding y font-sizes reducidos según spec. La media query mobile está presente en el HTML.
