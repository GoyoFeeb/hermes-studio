# QA Report — Ronda 07: Iconos oficiales de paraycompara.com

> Fecha: 2026-07-17

## Origen

14 SVGs descargados de `https://paraycompara.com/assets/img/` y archivados en `01-inputs/images/oficiales/`.

## PNGs generados (SVG→PNG vía Playwright Chromium, @2x)

| Archivo | Tamaño | Uso |
|---|---|---|
| `icon-tarifa-movil.png` | 1.3 KB, 96×96 | Tarjeta Móvil |
| `icon-tarifa-fibra.png` | 1.9 KB, 96×96 | Tarjeta Fibra |
| `icon-tarifa-convergente.png` | 2.2 KB, 96×96 | Tarjeta Fibra+Móvil |
| `icon-tarifa-tv.png` | 1.7 KB, 96×96 | Tarjeta Televisión |
| `icon-aspecto-datos.png` | 1.0 KB, 72×72 | Lista — Datos móviles |
| `icon-aspecto-cobertura.png` | 2.8 KB, 72×72 | Lista — Cobertura |
| `icon-aspecto-paquetes.png` | 1.9 KB, 72×72 | Lista — Paquetes |
| `icon-aspecto-condiciones.png` | 1.1 KB, 72×72 | Lista — Condiciones |

Todos < 3 KB (spec pedía < 8 KB).

## Decisiones de integración

| Elemento | Decisión | Motivo |
|---|---|---|
| Trust bar checks ✓ | **No se sustituyen** — no hay icono oficial de check en paraycompara.com |
| Pasos 01/02/03 | **No se sustituyen** — `punto1-3.svg` existen pero al renderizar no mejoran visualmente los números actuales |

## Archivos entregados

- 8 PNGs en `09-exports/assets/` (pendientes de subir al CDN)
- `ASSETS_PRODUCCION.md` con tabla de correspondencia archivo local → URL CDN
- Propuesta de la ronda 04 marcada como RECHAZADA en `rondas/assets/qa-report-assets.md`

## Referencias rotas reparadas en ronda 10

Este archivo (`rondas/ronda07/qa-report.md`) fue creado en la ronda 10 para resolver la referencia roja que apuntaba desde `rondas/assets/qa-report-assets.md`.