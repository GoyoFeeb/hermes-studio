# Ronda Ritmo — cambios y verificación

> 2026-07-15

## Cambios

| Sección | Antes | Después | Motivo |
|---|---|---|---|
| Pasos (CÓMO FUNCIONA) | Fondo `#F8F5FC` + línea conectora | Fondo `#FFFFFF` + **sin conector** | Romper duplicación con trust bar. Reducir peso (info de apoyo). |
| Revisar (ANTES DE DECIDIR) | Fondo `#FFFFFF` | Fondo `#F8F5FC` | No tener 3 blancos seguidos (tarifas→pasos→revisar). Crear transición visual antes del cierre morado. |

## Secuencia de ritmo resultante

| # | Sección | Fondo | Alineación | Estructura | Diferencia con anterior |
|---|---|---|---|---|---|
| 1 | Hero | #5E2E91 | Asimétrica | 5 elementos | — |
| 2 | Trust bar | #F8F5FC | Centrada | 3 checks fila | Cambio fondo + baja densidad |
| 3 | Tarifas | #FFFFFF | Centro (header), izq (cards) | 2×2 grid denso | Cambio fondo + sube densidad |
| 4 | Pasos | #FFFFFF | Centrada | 3 círculos, ligero | Mismo fondo, **densidad opuesta** (grid→círculos sueltos) |
| 5 | Revisar | #F8F5FC | Izquierda | 4 tarjetas full-width | Cambio fondo + cambio alineación |
| 6 | Cierre | #3E244D | Centrada | CTA + texto | Cambio fondo + sube densidad |
| 7 | Footer | #F4F3F9 | Centrada | Legal | Cambio fondo + baja densidad |

## Verificaciones

| Check | Resultado |
|---|---|
| Ninguna pareja consecutiva con composición idéntica | ✅ Verificado sobre captura |
| 4 VML | ✅ |
| Inline regenerado (41.6 KB) | ✅ |
| Tags balanceados (v:roundrect, headings, UTM) | ✅ Todos OK |
| Mobile 320px apilado correcto | ✅ Captura revisada |
| Dark mode = claro | ✅ Mismo SHA256 |

## Archivos

- `plan-ritmo.md` — plan escrito antes del código
- `after-{320,375,600,600-dark}.png` — capturas post-cambio en `rondas/ritmo/`
- `final-premium-v2.html` — actualizado
- `final-premium-v2-inline.html` — inline regenerado