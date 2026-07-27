# Structure — 2026-jul-uax-fp-online

Agente: 03 Newsletter Architect · 2026-07-22 (reconstrucción vía motor — ver `engine/CHANGELOG.md`)

Esta carpeta no existía en el primer intento de campaña (construido fuera del motor). Se
rellena a posteriori con la arquitectura real que se implementó en la reconstrucción, sin
inventar una secuencia distinta a la que de verdad se usó.

## Patrón de género

`institutional` (`patterns/institutional.md`) — patrón nuevo, creado en esta misma
reconstrucción porque no existía ningún patrón que cubriera una campaña institucional/educativa
(el único disponible, `saving.md`, es para comparadores de producto). Regla anti-aspiracional
respetada: se creó porque había una campaña real que lo necesitaba.

## Secuencia de módulos (orden real de `06-data/campaign-data.json`)

| # | Componente | Justificación |
|---|---|---|
| 1 | `header-logo` | Cabecera separada del hero (a diferencia de `saving`, donde el logo vive dentro de `hero-asimetrico`) — el diseño de UAX tiene una banda de logo propia sobre blanco |
| 2 | `hero-centrado` | UAX no tiene una cifra de marca confirmada tipo "+30 compañías" que exija `hero-asimetrico` — se usa la variante centrada (marca como texto, sin stat) |
| 3 | `intro-cta` | El brief original traía un párrafo de transición real entre el hero y los beneficios — módulo opcional del patrón, incluido porque había contenido genuino que ponerle |
| 4 | `columns-3-beneficios` | Núcleo del género — 3 ventajas, obligatorio |
| 5 | `category-grid` | El brief trae un catálogo real de 5 categorías de titulaciones — módulo opcional del patrón, incluido |
| 6 | `usp-cards` | El brief trae 3 puntos de confianza + 1 insignia (TOP 2 Forbes) verificables — módulo opcional, incluido |
| 7 | `banda-cierre` | Cierre con CTA, obligatorio |
| 8 | `footer` | Obligatorio |

## Componentes nuevos que hizo falta construir

Ninguno de los 8 módulos de arriba existía como tal antes de esta campaña, salvo `banda-cierre`
y `footer` (ya del patrón `saving`, reutilizados sin cambios). Se construyeron 5 componentes
nuevos siguiendo el procedimiento de 5 pasos de `engine/README.md`: `header-logo.html`,
`intro-cta.html`, `columns-3-beneficios.html`, `category-grid.html`, `usp-cards.html`. Detalle
completo de cada uno (datos, tokens, decisiones de diseño) en el comentario de cabecera de cada
archivo y en `engine/CHANGELOG.md`, entrada 2026-07-22.

## Decisión que NO se tomó aquí

El highlight de "50% de la matrícula*" se sacó de dentro de la columna 1 de beneficios (así
estaba en el intento original, fuera de motor) y se convirtió en un aviso de sección, común a
las 3 columnas — ver `05-copy/copy.md` (addenda) y la cabecera de `columns-3-beneficios.html`
para el razonamiento completo. Es la causa estructural del bug de alineación que motivó toda
esta reconstrucción.
