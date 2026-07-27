# Module Selection

## Patrón elegido

`saving` — mismo patrón que las campañas Tarifalo existentes. Es un género de comparación/ahorro que encaja con el objetivo de revisión de factura de luz y gas.

## Secuencia de módulos

| # | Componente | Obligatorio | Justificación |
|---|---|---|---|
| 1 | hero-marca-tarifalo | Sí | Hero específico de Tarifalo. Fondo navy con gradiente. Sin cifra (no hay stat confirmado), sin imagen (evita CDN). |
| 2 | card-tarifa-3 | Sí | 3 tarjetas: Luz, Gas, Luz+Gas. Misma estructura que campañas anteriores. |
| 3 | pasos | Sí | 3 pasos del proceso de revisión y comparación. Estructural al género saving. |
| 4 | lista-premium | Opcional | 4 puntos de revisión de factura (consumo, precio kWh, permanencia, servicios). |
| 5 | banda-cierre | Sí | Cierre con CTA repetido sobre fondo deep (#002035). Título ≤45 caracteres. |
| 6 | footer | Siempre | Placeholders legales (test campaign). |

## Módulos descartados

| Módulo | Motivo |
|---|---|
| trust-bar | Opcional. No hay 3 claims de confianza confirmados y verificables del brief sin inventar. Se omite. |
| card-tarifa (4) | Solo hay 3 líneas de producto (Luz, Gas, Luz+Gas). card-tarifa-3 es la variante correcta. |

## Hero elegido

`hero-marca-tarifalo` — criterios:
- Marca con hero de marca personalizado (Claude Design)
- No requiere cifra de marca confirmada (no hay stat)
- No requiere imagen CDN (sin bannerSrc)
- El brand pack de Tarifalo no tiene `photography.usesRealPhotography: true`
- El CTA del hero apunta a URL real de Tarifalo
