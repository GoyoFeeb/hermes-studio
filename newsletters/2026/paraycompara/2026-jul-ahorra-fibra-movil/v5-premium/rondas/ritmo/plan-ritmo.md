# Plan de Ritmo — ronda 03

> Fecha: 2026-07-15
> Objetivo: que ninguna sección consecutiva comparta composición idéntica

---

## Secuencia actual (G8.1 + hero rediseñado)

| # | Sección | Fondo | Alineación | Densidad | Problema |
|---|---|---|---|---|---|
| 1 | Hero | #5E2E91 (morado) | Asimétrica (H1 izq + stat der) | Alta | — |
| 2 | Trust bar | #F8F5FC (lila) | Centrada, 3 items | Baja | — |
| 3 | Tarifas | #FFFFFF (blanco) | Centrada header, 2×2 grid | Media | — |
| 4 | Pasos | **#F8F5FC (lila)** | **Centrada, 3 items** | **Media** | **Composición IDÉNTICA a trust bar** |
| 5 | Revisar | #FFFFFF (blanco) | Izquierda, tarjetas full-width | Media | — |
| 6 | Cierre | #3E244D (morado oscuro) | Centrada | Alta | — |
| 7 | Footer | #F4F3F9 (gris) | Centrada | Baja | — |

**Problema principal:** los pasos (sección 4) repiten el mismo esquema que la trust bar: fondo lila, contenido centrado, 3 ítems. Colisión directa.

---

## Secuencia deseada

| # | Sección | Fondo | Alineación | Densidad | Diferencia respecto a la anterior |
|---|---|---|---|---|---|
| 1 | Hero | #5E2E91 (morado) | Asimétrica H1/stat | Alta | — |
| 2 | Trust bar | #F8F5FC (lila) | Centrada, 3 items | Baja ↓ | Cambio de fondo y caída de densidad |
| 3 | Tarifas | #FFFFFF (blanco) | Centrada header, 2×2 grid | Media ↑ | Fondo blanco, contenido cambia a grid |
| 4 | **Pasos** | **#FFFFFF (blanco)** | **Centrada, menos peso** | **Baja ↓** | **Mismo fondo que tarifas pero densidad cae (es info de apoyo, no protagonista)** |
| 5 | Revisar | #F8F5FC (lila) | Izquierda, tarjetas full-width | Media ↑ | Cambio de fondo + alineación izquierda |
| 6 | Cierre | #3E244D (morado oscuro) | Centrada | Alta ↑ | Cambio de fondo + sube densidad |
| 7 | Footer | #F4F3F9 (gris) | Centrada | Baja ↓ | Cambio de fondo + baja densidad |

**Cambios concretos:**

1. **Pasos → fondo blanco** para romper la duplicación con la trust bar. La sección pasa de 4 a 3 en el mapa de ritmo de fondos (morado → lila → blanco → blanco → lila → morado → gris). Dos blancos seguidos es aceptable porque tarifas tiene alta densidad (grid 2×2 + 4 tarjetas) y pasos tiene baja densidad (3 círculos + texto corto) — el ritmo de densidad compensa el color de fondo.

2. **Revisar → fondo lila** para no tener tres blancos seguidos (tarifas, pasos, revisar). Además, el fondo lila sobre el paso anterior blanco crea una transición visual antes del cierre morado.

3. **Pasos: reducir peso visual** — eliminar la línea conectora entre círculos (solo visible en desktop, y el diagnóstico baseline-notes.md §3 ya la califica como invisible). Sin conector, los pasos se leen como 3 elementos independientes pero ligeros, lo que baja la densidad de la sección frente a tarifas.

## Justificación

- **Trust bar (lila) → Tarifas (blanco)**: cambio de fondo + cambio estructural (3 items → grid)
- **Tarifas (blanco, denso) → Pasos (blanco, ligero)**: mismo fondo pero densidad opuesta (grid 2×2 → 3 círculos pequeños). El ojo nota el cambio de ritmo incluso sin cambio de color
- **Pasos (blanco) → Revisar (lila)**: cambio de fondo + cambio de alineación (centrado → izquierda)
- **Revisar (lila) → Cierre (morado)**: cambio de fondo + sube densidad

Ninguna sección consecutiva comparte fondo Y composición al mismo tiempo.