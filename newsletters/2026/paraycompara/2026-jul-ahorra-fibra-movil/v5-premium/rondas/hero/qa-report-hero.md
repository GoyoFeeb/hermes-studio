# QA Report — Ronda Hero

> Fecha: 2026-07-15
> Archivo: `final-premium-v2.html` (rediseño del bloque de marca, hero+header)

## Cambios vs baseline G8.1

| Elemento | Antes (G8.1) | Después (Hero) |
|---|---|---|
| Eyebrow | "COMPARA, ELIGE Y AHORRA" (12px, #E4CDF0) | **Eliminado** — el H1 ahora es el primer mensaje |
| H1 | 32px centrado | **28px alineado a la izquierda** en columna 56% |
| Subtítulo | 16px independiente | **15px unificado** con el microcopy |
| Stat +30 | Pill #7B1FA2 con sombra, 40px | **56px texto directo** sobre fondo morado, sin caja — columna 44% derecha |
| Microcopy | línea independiente "Gratis, rápido..." | **Fusionado** en el subtítulo |
| Elementos hero | **7** (logo, eyebrow, H1, subtítulo, statPill, CTA, microcopy) | **5** (logo, H1, stat, subtítulo, CTA) |

## Verificaciones

| Check | Resultado |
|---|---|
| 4 VML en la pieza | ✅ PASS (2 hero + 2 closing) |
| Captura 600-dark = 600 claro | ✅ PASS (mismo SHA256) |
| H1 semántico | ✅ PASS (1 único `<h1>`) |
| UTM en hero CTA | ✅ PASS (`utm_content=hero-cta`) |
| Metas light forcing | ✅ PASS (`color-scheme: light`) |
| Inline regenerado (42.3 KB) | ✅ PASS |
| Tags balanceados | ✅ PASS (src vs inline coinciden en v:roundrect, UTM, h1-h3) |
| Subtitle wraps 3 líneas a 600px | ⚠️ WARNING — texto largo. Aceptable por legibilidad. |
| Diseño sin foto | ⚠️ Documentado — el hero sigue siendo tipográfico. Palanca de mayor impacto cuando haya asset real. |

## Diagnóstico tras revisar capturas

**Aciertos:**
- El "+30" a 56px funciona como elemento gráfico dominante. Sin la caja pill, se integra mejor con el fondo morado.
- La jerarquía asimétrica (H1 izquierda, stat derecha) da ritmo visual que el centrado apilado no tenía.
- Reducir de 7 a 5 elementos simplifica la lectura sin perder información.
- Vista 320px: apilado correcto (H1 arriba, stat abajo, subtítulo, CTA). Sin overflow.

**Debilidades (para rondas futuras):**
- El subtítulo unificado (16px→15px, fusionado con microcopy) ocupa 3 líneas a 600px. Sería mejorable con un texto más corto aprobado por copy.
- El diseño sigue sin foto — el patrón decorativo y la tipografía son sustitutos válidos pero no reemplazan un asset real.