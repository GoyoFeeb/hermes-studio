# issues-found.md — Issues detectados y resueltos

> Campaña: 2026-jul-ahorra-fibra-movil — V3 Premium
> Auditoría: Fase 3 QA completo
> Fecha: 2026-07-13

---

## Issues resueltos

| # | Issue | Severidad | Causa | Solución | Estado |
|---|---|---|---|---|---|
| IS-01 | Hero image ausente en animated HTML | 🔴 Crítica | Path relativo incorrecto (`../hero-v3-animated.gif`) | Corregido a ruta local + poster CDN | ✅ Resuelto |
| IS-02 | Breakpoint cards en desktop | 🟡 Media | `max-width:600px` triggereaba a 600px exactos | Cambiado a `max-width:599px` | ✅ Resuelto |
| IS-03 | Section titles en gris | 🟡 Media | Color #2D2D2D en lugar de #5E2E91 | Cambiados todos a #5E2E91 | ✅ Resuelto |
| IS-04 | Trust bar white-space:nowrap | 🟢 Baja | Podía causar overflow en mobile estrecho | Eliminado `white-space:nowrap` | ✅ Resuelto |
| IS-05 | Animated HTML paths locales | 🔴 Crítica | `src="hero-v3-animated.gif"` no funciona en email | Documentado como pendiente de CDN. Versión estática usa CDN | ✅ Documentado |

## Issues abiertos (pendientes)

| # | Issue | Severidad | Depende de | Solución propuesta |
|---|---|---|---|---|
| IS-06 | `[UNSUBSCRIBE_LINK]` placeholder | 🟢 Baja | Cliente | Solicitar enlace real de baja |
| IS-07 | `[PREFERENCES_LINK]` placeholder | 🟢 Baja | Cliente | Solicitar enlace real de preferencias |
| IS-08 | `[DIRECCIÓN FÍSICA]` placeholder | 🟢 Baja | Cliente | Solicitar dirección física legal |
| IS-09 | GIF no subido a CDN | 🟡 Media | Deploy | Subir `hero-v3-animated.gif` (75 KB) al CDN para versión animada |
| IS-10 | Modo oscuro sin meta tag | 🟢 Baja | Mejora opcional | Añadir `<meta name="color-scheme" content="light dark">` y data-ogsc/ogsb si se desea control fino |

## Issues no detectados

| Categoría | Resultado |
|---|---|
| Elementos descentrados | ✅ Ninguno |
| Texto overflow | ✅ Ninguno |
| Scroll horizontal | ✅ Ninguno en ningún viewport |
| Enlaces vacíos | ✅ Ninguno |
| Imágenes rotas (static) | ✅ Ninguna (todas CDN, HTTP 200 verificadas) |
| Código React Email residual | ✅ Ninguno |
| CSS incompatible | ✅ Ninguno (sin flexbox, grid, JS) |
| h1 duplicados | ✅ Un solo h1 |

## Estados por archivo

| Archivo | Estado | Notas |
|---|---|---|
| `paraycompara-v3-premium-static.html` | ✅ Listo para envío | Usa CDN, sin paths locales, sin GIF |
| `paraycompara-v3-premium-static-inline.html` | ✅ Listo para envío | Inline, CDN, sin paths locales |
| `final-fixed.html` | ✅ Listo para envío | Copia de static con CDN |
| `final-fixed-inline.html` | ✅ **RECOMENDADO** | Archivo definitivo para copiar en plataforma de envío |
| `paraycompara-v3-premium-animated.html` | ⚠️ Pendiente CDN | GIF necesita subida a CDN |
| `paraycompara-v3-premium-animated-inline.html` | ⚠️ Pendiente CDN | Idem |