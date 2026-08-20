# Delivery Notes — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 09 (Export Manager). Fecha: 2026-08-20.

## Entregables

| Archivo | Descripción |
|---|---|
| 09-exports/final.html | HTML final con logo embebido (base64 PNG) + imágenes CDN oficial |
| 09-exports/final-inline.html | Versión inline (mismo contenido) |
| 09-exports/build-manifest.json | Manifesto del build |
| 09-exports/preview-final-{600,375,320,600-dark}.png | Renders finales (post-embed) |
| 08-qa/logo-header-crop2.png | Verificación del logo visible |

## Estado de la campaña

- ✅ **Prueba interna PASADA** (production-gate-motor: 13/13 gates OK — engine-integrity, schema,
  parity, build, claims, assets, control-files, column-balance, brand-pack-completeness,
  contrast, production-readiness, hero-decision, structural-differentiation).
- ⛔ **Producción: BLOQUEADA** (esperado) — pendientes del cliente:

| Pendiente | Detalle | Fuente |
|---|---|---|
| Q-001 Precio España | Sin fuente oficial (carwow 155.497 € = tercero) — NO incluido | open-questions.md |
| Q-002 Disponibilidad ES | Sin fecha oficial — copy sin plazos | open-questions.md |
| Q-003 Velocidad máxima | 280 (web) vs 250 (prensa 2022) — NO incluida | open-questions.md |
| Q-004 Superlativo 4 cilindros | Afirmación literal de Mercedes — requiere aprobación legal para usarse | open-questions.md |
| Q-005 Línea legal WLTP ES | Texto oficial ES pendiente — provisional en footer | open-questions.md |
| NORMA 600px (H1) | Deuda del motor aceptada por el usuario (fondo expandido); migración PENDING | build-verification.md |
| VML Outlook (H2) | arcsize 50% → pastillas en Outlook desktop (deuda del motor) | outlook-qa.md |

## Assets

| Asset | Fuente | Estado |
|---|---|---|
| Logo (header) | raster local `brands/mercedes-amg/design-input/logo-mercedes-amg-black-588.png` (derivado del lockup oficial SVG `amg-logo.svg`, fill #fff → #000 para cabecera blanca) | ✅ embebido base64 (7.188 B). ⚠️ En Gmail web los data URIs se bloquean → para producción, subir el PNG al CDN y sustituir la URL (o usar el SVG oficial en clientes modernos) |
| Hero | CDN oficial imgix `?fm=jpg&w=1200` (21dfb48e…) | ✅ 200 |
| Tren motriz | CDN oficial imgix `?fm=jpg&w=560&h=420&fit=crop` (d3ff0fcc…) | ✅ 200 |
| Batería | CDN oficial imgix `?fm=jpg&w=560&h=420&fit=crop` (9be0cde6…) | ✅ 200 |
| Logo versión blanca | `logo-mercedes-amg-white-588.png` (pack) | Se conserva en design-input (para cabeceras oscuras futuras) |

## Enlaces

- 4 CTAs verificados HTTP 200 (hero → página modelo ES; editoriales → página modelo EN;
  cierre → configurador oficial https). UTM `{modulo}-cta` (convención del pack).

## Copy / claims

- Asunto: «El impulso llega antes que el ruido» | Preheader: «El C 63 S E PERFORMANCE responde
  desde el eje trasero, antes de que despierte el motor de gasolina.»
- Claims gate 29 reglas: 0 problemas. Presupuesto de marca: «C 63» 3/3, «Mercedes-AMG» 3/3.
- 4 CTAs únicos (Descubrir / Sentir / La batería / Configurar).

## Notas de entrega

- El `logo.png` en design-input apunta ahora a la versión NEGRA (para el header blanco del
  motor); la versión blanca se conserva con su nombre original. El pack `assets.logoPngRaster`
  se actualizó a la versión negra (v2.5.0) — ver changelog.
- El archivo `07-code/` contiene los scripts de inspección/verificación usados en QA
  (inspect-*.js, measure-*.js, verify-embed.js, check-imgs.js, shot-logo.js, sample-logo.js,
  make-logo-black.js, inspect-svg.js, measure-overflow.js) — reutilizables.
- El fix del motor (box-sizing .mobile-stack) quedó en engine/components/_shell.html +
  CHANGELOG 2026-08-20 + lockfile.
