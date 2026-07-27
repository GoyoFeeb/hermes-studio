# Brand Analysis: UAX — FP Online 2026

## Información general

| Campo | Valor |
|---|---|
| Cliente | UAX (Universidad Alfonso X el Sabio) |
| Marca | UAX FP (Formación Profesional) |
| Industria | Educación superior / Formación Profesional |
| Fecha del análisis | Julio 2026 |
| Fuentes consultadas | https://www.uax.com/, https://www.uax.com/fps/online |
| Estado del análisis | completo |

## Resumen de identidad visual

UAX presenta una identidad visual corporativa limpia, moderna y profesional centrada en una paleta de azules. La marca transmite confianza, solvencia académica y cercanía. El sitio web usa un diseño claro con tipografía sans-serif, botones de bordes redondeados y acentos gráficos diagonales. La versión FP (uax_fp.png) mantiene la misma identidad visual pero con un logo que integra "FP" de forma diferenciada, indicando la oferta de Formación Profesional.

## Elementos de marca disponibles

| Elemento | Estado | Fuente |
|---|---|---|
| Logotipo | ✅ | https://www.uax.com/assets/uax/images/uax_fp.png |
| Paleta de color | ✅ | Extraída del sitio web |
| Tipografía | Parcial | Sans-serif (Open Sans / Arial / Helvetica) |
| Guía de estilo | Parcial | Inferida del diseño del sitio |
| Imágenes de producto | ❌ | No disponibles para newsletter |
| Iconografía | Parcial | Iconos funcionales del sitio (whatsapp, teléfono, menú) |
| Newsletters anteriores | Parcial | Demo template en el sistema |
| Landing pages | ✅ | https://www.uax.com/fps/online |

## Paleta de color

| Color | Hex | Uso |
|---|---|---|
| Primary Navy | #003F6F | Fondos de secciones principales, títulos |
| Medium Blue | #0060AB | Acentos secundarios, fondos de secciones |
| CTA / Electric Blue | #008CF7 | Botones de acción, enlaces |
| Light Accent | #59A9F3 | Detalles decorativos, hover states |
| BG Light | #D9E7F4 | Fondos de secciones alternativos |
| Text Dark | #161616 | Cuerpo de texto principal |
| Secondary Text | #666666 | Textos secundarios, metadata |
| Light Gray | #F5F5F5 | Fondos de tarjetas, separadores |
| White | #FFFFFF | Fondos principales, texto sobre azul |

## Tipografía

- **Familia principal:** Open Sans, Arial, Helvetica, sans-serif (web-safe fallback)
- **Estilo:** Clean sans-serif, limpio, buena legibilidad
- **Jerarquía:** Títulos en bold navy, cuerpo en regular, CTAs en bold azul eléctrico

## Tono visual general

Limpio, profesional, moderno. Confianza académica combinada con accesibilidad. Uso generoso de espacio en blanco. Esquinas redondeadas en elementos interactivos. Acentos diagonales como elemento gráfico distintivo.

## Notas sobre adaptación a email

- Usar tablas para layout (max-width 600px)
- Botones VML bulletproof para Outlook compatibilidad
- Fondos de color sólido en secciones (no imágenes de fondo)
- La marca UAX debe mostrarse prominentemente en el header
- El logo FP específico refuerza la oferta de Formación Profesional

## Contradicciones visuales

- No se detectaron contradicciones visuales significativas
- El logo oficial de UAX FP está disponible y es coherente con la identidad general de UAX
- La paleta es consistente en todo el sitio web

## Addenda — 2026-07-22 (rebuild vía motor, ver engine/CHANGELOG.md)

Esta carpeta se llamaba `01-brand-analysis` (numeración inconsistente con
`newsletters/_campaign-template`) y fue el único artefacto de fase que sobrevivió al primer
intento de campaña, que se construyó fuera del motor (HTML escrito a mano). Al reconstruir la
campaña por el pipeline real se creó el brand pack formal
`brands/uax/tokens/brand-tokens.json` v2.2.0 a partir de esta misma paleta, con 2 ajustes que
esta versión del análisis no cubría (documentados con su cálculo en el `_changelog` del pack):

- `colors.light` (eyebrow/kicker) usa `#0060AB` ("Medium Blue" de esta tabla), NO `#008CF7`
  ("CTA / Electric Blue"): verificado que el azul de CTA da solo 3.45:1 sobre blanco —
  insuficiente para texto normal de 12px (necesita 4.5:1). Sí es válido para el propio botón
  CTA (19px/700 cuenta como "texto grande", umbral 3:1).
- `onBrandSecondary` (texto claro sobre navy) se fijó en `#C7DEF0`, calculado para pasar 4.5:1
  sobre `#003F6F` (dio 7.82:1) — "Light Accent" (`#59A9F3`) de esta tabla se descartó para
  texto: solo da 4.33:1 sobre navy, no llega.
- Carpeta renombrada a `02-analysis` (numeración correcta de `_campaign-template`).
