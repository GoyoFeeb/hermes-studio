# Responsive QA — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 08 (Email QA Specialist). Fecha: 2026-08-20.

## Resultados deterministas (Playwright)

| Viewport | scrollWidth | Overflow | Verificación |
|---|---|---|---|
| 1280 | 1280 | ✅ No | Columna centrada; 0 elementos con rect > viewport |
| 375 | 375 | ✅ No | 0 elementos con rect > viewport (medido con getBoundingClientRect en todos los nodos) |
| 320 | 320 | ✅ No | 0 elementos con rect > viewport |

## Fix aplicado durante el QA (bug real del motor)

- **Síntoma:** scrollWidth 385 a 375 y 330 a 320 (+10px) — las celdas `.mobile-stack`
  apiladas sumaban su padding (10px) al width:100% (content-box).
- **Causa:** `engine/components/_shell.html`, media query `@media only screen and
  (max-width:599px)`, regla `.mobile-stack { display:block !important; width:100% !important }`
  sin box-sizing.
- **Fix:** añadido `box-sizing:border-box !important` (mismo patrón que el fix `.col` de
  standalone, Nike ZF6 2026-08). Lockfile regenerado (`npm run check-engine -- --update`, 41
  archivos), CHANGELOG del motor 2026-08-20, skill actualizado.
- **Verificación post-fix:** 375 → 375 ✅, 320 → 320 ✅ (arriba).

## Comportamiento verificado

| Módulo | Desktop | Mobile | Notas |
|---|---|---|---|
| Header | Logo 150px centrado | Logo fluido | Fallback texto hasta embed |
| Hero | Banner 600px + copy sobre negro | Banner fluido (`mobile-img`) + copy | H1 26px en mobile (media query del motor) |
| Editorial 3 | Imagen izq / texto der (46/54) | Apilado (imagen encima) | Rects marginados (eyebrow left=34px) |
| Editorial 4 | Texto izq / imagen der | Apilado (texto encima — orden DOM del componente inverso) | Espejo en desktop |
| Cierre | CTA centrado | CTA full-width | Fondo #1A1A1A |
| Footer | Enlaces en línea | Enlaces apilados | — |

Nota: el orden de apilado del módulo 4 en mobile (texto → imagen) es el orden DOM del componente
inverso; la visión lo reportó como inversión del patrón — es el comportamiento esperado del
componente, no un defecto.

## Outlook mobile

- Sin VML específico de escenas (los fondos van por bgcolor en hero/cierre para Outlook).
- CTAs: VML roundrect con width fijo 280px (deuda H2 — pastillas en Outlook desktop; en Outlook
  mobile 2013+ el comportamiento puede variar; documentado).

## Veredicto

✅ Responsive PASA a 1280/375/320 tras el fix del motor. Deuda restante: NORMA 600px (H1,
aceptada) y VML Outlook (H2, documentada).
