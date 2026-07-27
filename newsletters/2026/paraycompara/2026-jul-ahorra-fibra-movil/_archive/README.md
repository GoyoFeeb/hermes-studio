# _archive — Linajes sustituidos

> Fecha: 2026-07-17
> Razón: Auditoría del sistema Hermes (Prompt 08) — tres HTML finales no coincidían entre sí.
> Se declara `v5-premium/final-premium-v2.html` (y su copia en `09-exports/final.html`) como
> única fuente de verdad de esta campaña desde esta fecha.

## Contenido

| Carpeta | Contenido | Sustituido por |
|---|---|---|
| `v3-premium/` | 8 variantes del intento manual anterior a v5 (13-jul), colores y estructura no coincidentes con el diseño final. | `v5-premium/final-premium-v2.html` |
| `09-exports-pipeline-oficial-2026-07-14/` | `final.html`, `final-inline.html`, `final-preview.png` generados por el pipeline React Email (agente 07 → `export-html.tsx`) con colores de marca incorrectos (`#6B2C5F`/`#F3E5F5` — no el morado real `#5E2E91`/`#3E244D`). | `09-exports/final.html` y `09-exports/final-inline.html` (copia de `v5-premium/final-premium-v2.html` y su inline) |

## Nota

Ningún archivo fue borrado. Todo el contenido original permanece íntegro dentro de `_archive/`.