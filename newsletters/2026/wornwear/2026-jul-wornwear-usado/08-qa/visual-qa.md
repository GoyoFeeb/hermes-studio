# Visual QA: 2026-jul-wornwear-usado

## Vista previa

Archivo: `09-exports/final-preview.png` (600×2000px)

## Verificación visual

| Elemento | Esperado | Real | Estado |
|---|---|---|---|
| Header | Logo Worn Wear (naranja) centrado sobre blanco | Logo visible, naranja, centrado | ✅ PASS |
| Hero banner | Foto lifestyle outdoor (placeholder) | Banner visible (esquina sup. izq.) | ✅ PASS |
| Hero brand name | "Patagonia Worn Wear" blanco sobre negro | Texto blanco, legible | ✅ PASS |
| Hero H1 | "Segunda vida. Primera calidad." **naranja #FA4616** | **Naranja** sobre negro ✅ | ✅ PASS |
| Hero subtitle | Gris #494949, explicativo | Gris claro, legible | ✅ PASS |
| Hero CTA | Naranja #FA4616, texto #000000, pill | Naranja con texto negro, forma pill | ✅ PASS |
| Intro section | Fondo blanco, título + body + CTA outline | Blanco, texto legible, CTA outline | ✅ PASS |
| Beneficios | Fondo beige #EFE7DA, 3 columnas, sin iconos | Beige, 3 columnas solo texto | ✅ PASS |
| Highlight card | Caja blanca con borde, "Envío disponible" | Visible, texto legible | ✅ PASS |
| Banda de cierre | Fondo oscuro #1A1A1A, texto blanco, CTA naranja | Oscuro, texto blanco, CTA naranja | ✅ PASS |
| Footer | Fondo beige #EFE7DA, legal placeholders | Beige, texto legal legible | ✅ PASS |

## Problemas visuales detectados

| Issue | Severidad | Nota |
|---|---|---|
| Hero banner solo se ve esquina superior | 🟡 Media | Es un placeholder `PENDING-CDN-UPLOAD` — se reemplazará con asset real |
| Logo "WORN WEAR" se repite (arriba + header label) | 🟢 Baja | El label del componente header-logo repite "WORN WEAR" que ya está en el PNG del logo. El PNG ya incluye "WORN WEAR" + "patagonia" en pequeño. La etiqueta "WORN WEAR" debajo es redundante pero no incorrecta. |

## Veredicto

✅ **PASS** — Sin errores visuales bloqueantes. El H1 es naranja correctamente. Los placeholders son esperados para campaña de test.
