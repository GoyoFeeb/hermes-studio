# Layout: Mercedes-AMG — C 63 S E PERFORMANCE

| Campo | Valor |
|---|---|
| Cliente | Mercedes-AMG |
| Campaña | c63-se-performance |
| Ancho de contenedor | 600px |
| Altura estimada desktop | ~2.150 px |
| Altura estimada mobile | ~2.900 px (apilado) |
| Módulos | 6 |

## Parámetros globales

| Parámetro | Valor |
|---|---|
| Ancho contenedor | 600px (NORMA 600px: cada escena = tabla `width="600" align="center" style="width:600px;max-width:600px;margin:0 auto"` con su bgcolor EN la propia tabla; NUNCA wrapper full-width con fondo expandido) |
| Color fondo general (body) | #F2F2F2 (surfaces.global) — visible a ambos lados de la columna |
| Color fondo contenedor | varía por escena (blanco / negro / #F2F2F2) |
| Padding contenedor | 0 (el aire lo da el padding interno de cada escena) |
| Border-radius global | 0 (lenguaje geométrico de esquina recta del pack: radius.cta 0, radius.card 0) |
| Fuente cuerpo | Helvetica Neue, Helvetica, Arial, sans-serif (fallback email-safe de MBCorpoS — typography.family del pack) |
| Fuente titulares | 'Helvetica Neue', Helvetica, Arial, sans-serif (displayFont del pack) |
| Tamaño cuerpo | 16px / 400 / lh 1.5 (v2.3.0 observado) |
| Tamaño titulares | H1 34px / 800 / lh 1.08; H2 24px / 800 / lh 1.18 |
| Color cuerpo | #4F4F4F sobre fondos claros; #FFFFFF sobre fondos oscuros |
| Color enlaces | #B21E23 (link del pack) — los CTAs son botones, no enlaces |
| Alineación base | Centrada (layout.sectionStyle: centrado del pack) |

## Estructura de escenas (fondos)

| Escena | Fondo (bgcolor en la tabla de 600px) | Token |
|---|---|---|
| 1 Header | #FFFFFF | colors.white |
| 2 Hero | #000000 | colors.primary |
| 3 Editorial foto-texto | #FFFFFF | colors.white |
| 4 Editorial inverso | #F2F2F2 | surfaces.sectionLila |
| 5 Banda-cierre | #1A1A1A | surfaces.sectionDark |
| 6 Footer | #F2F2F2 | surfaces.global |

Ritmo de fondo: blanco → negro → blanco → gris → negro → gris. Ninguna escena consecutiva
repite fondo+alineación+densidad (regla dura del patrón): 2→3 cambia fondo+densidad; 3→4 cambia
fondo+alineación (izq→der); 4→5 cambia fondo+densidad; 5→6 cambia fondo+densidad.

## Notas sobre Outlook

- VML bulletproof en los 4 CTAs (`v:roundrect arcsize="0%"` — CTA block de esquina recta).
  ⚠️ El CTA secundario (`cta-secondary-bulletproof`) tiene `arcsize="50%"` hardcodeado: en
  Outlook desktop los CTAs de los módulos 3-4 saldrían pastilla. Mitigación: dado que el estilo
  de marca es radio 0, evaluar en QA (agente 08) sustituir los secundarios por el primario
  (block) o aceptar la deuda documentada (R-09).
- `bgcolor` en cada tabla de escena (Outlook ignora CSS background en tablas sin bgcolor).
- Imágenes con `width`/`height` explícitos y `?fm=jpg` (imgix).
- Sin degradados: `gradients.heroBackground: none` (mustAvoid del pack).
- Metas color-scheme forzadas a light (darkMode not-implemented).

## Notas sobre compatibilidad general

- Logo en PNG raster (SVG no renderiza en Gmail/Outlook): `design-input/logo-mercedes-amg-white-588.png`.
- Imágenes: si se usara `?auto=format` el CDN negocia webp → SIEMPRE `?fm=jpg` (R-07).
- Cero iconos/emojis (iconography: none del pack), cero degradados decorativos.
- Alt texts sin marca (presupuesto: ver assets-notes.md).
- Sin JS, CSS inline, tablas anidadas ≤ 3 niveles.
