# Visual QA — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 08 (Email QA Specialist). Fecha: 2026-08-20.
> HTML verificado: 09-exports/final.html (build del motor, post-fix).

## Método

- Render determinista: Playwright (standalone-render-check.js con NODE_PATH) a 1280/375/320 +
  screenshots full-page (final-1280.png, final-375.png, final-320.png).
- Medición de rects con getBoundingClientRect (measure-text2.js) — la medición manda sobre la
  visión (precedente: la visión reportó texto cortado que no existe).
- Render-preview (375/600/600-dark) para el flujo completo.

## Resultados

| Check | Resultado | Evidencia |
|---|---|---|
| Columna centrada en desktop | ✅ | Contenido en columna central sobre gris #F2F2F2 a ambos lados (final-1280.png) |
| Hero (coche + titular) | ✅ | Coche deportivo visible; H1 «Antes del ruido, el impulso.» sobre negro |
| Editoriales en espejo (desktop) | ✅ | Módulo 3: imagen izq / texto der. Módulo 4: texto izq / imagen der |
| Mobile apilado | ✅ | Columnas apiladas; sin desbordes (scrollWidth 375/320 = viewport) |
| Textos marginados en mobile | ✅ | Medido: H1 left=24px, eyebrow LA RESPUESTA left=34px, cierre left=24px — nada pegado al borde (la visión reportó cortes que la medición desmintió) |
| Botones CTA | ✅ | 4/4 visibles e íntegros: rojos «Descubrir la nueva era» y «Configurar el tuyo» (block #B21E23/blanco); blancos outline «Sentir cómo empuja» y «La batería, al detalle» (jerarquía primario/secundario del motor) |
| Imágenes | ✅ | Hero (600px fluida), tren motriz y batería (recorte 4:3 en columnas) — todas cargan (HTTP 200 + naturalWidth > 0) |
| Logo | ⚠️ PENDIENTE | Header con PENDING-CDN-UPLOAD → en el render se muestra el fallback de texto «Mercedes-AMG». El embed base64 del PNG local se ejecuta en el agente 09 (post-production-gate). Hasta entonces NO reclamar logo visible |
| Texto cortado/superpuesto | ✅ | Ninguno (medición + render determinista) |

## Hallazgos de QA (ver 07-code/build-verification.md)

- H1 NORMA 600px: deuda del motor aceptada por el usuario (2026-08-20) — la pieza es prueba
  engine-based con fondo expandido; migración del motor PENDING.
- H2 VML arcsize 50%: en Outlook desktop los 4 CTAs saldrían pastilla (deuda del motor).
- H3 Logo PENDING hasta embed.
- H4 Eyebrow/label: RESUELTO en QA — token typography.eyebrow.color → #8F1418 y colors.light →
  #8F1418 (pack v2.4.0, changelog con ratios). El rojo puro #B21E23 permanece en CTAs
  (6.77:1 ✅) y barrita decorativa.

## Veredicto

✅ PASA como campaña de prueba (isTestCampaign). Bloqueos de producción: logo (embed/CDN),
línea legal WLTP ES (Q-005), NORMA 600px (migración del motor) y VML Outlook (deuda del motor).
