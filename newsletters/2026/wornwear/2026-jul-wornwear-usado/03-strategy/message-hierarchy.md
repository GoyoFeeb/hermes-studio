# Message Hierarchy: 2026-jul-wornwear-usado

## Jerarquía de mensajes

Adaptada del patrón `fotografia-primero` (poco texto, fotografía como elemento central, voz corta) y del `layout.contentRhythm` real de wornwear.patagonia.com.

### Nivel 1 — El descubrimiento (Hero)

**Mensaje:** Worn Wear existe y es equipo Patagonia de segunda mano en perfecto estado.

*¿Qué quiere saber primero el lector?* Que hay una tienda de usado de Patagonia que no conocía. El hero con fotografía lifestyle + titular corto + CTA es suficiente para esta primera toma de contacto.

### Nivel 2 — La propuesta de valor (Beneficios)

**Mensaje:** Por qué comprar usado en Worn Wear es buena idea.

*Tras saber que existe, el lector necesita 2-3 razones para considerar la compra:*
1. **Calidad**: mismo equipo Patagonia, verificado, en gran estado
2. **Precio**: más barato que nuevo, sin sorpresas
3. **Garantía**: respaldado por la misma marca

### Nivel 3 — El cierre (Banda de cierre)

**Mensaje:** Ve a verlo tú mismo. El equipo te está esperando.

*Sin presión, sin urgencia, sin descuento exprés. Solo la invitación a descubrir. El CTA cierra el recorrido.*

## Orden de la newsletter

Basado en el contentRhythm real de wornwear.patagonia.com:

```
web: HEADER → HERO SPLIT (foto+texto) → CATEGORÍAS → PRODUCTOS → BANDA OSCURA → INFO → FOOTER
↓       ↓       ↓                    ↓               ↓            ↓            ↓
email: LOGO → HERO-IMAGEN          → INTRO-CTA → BENEFICIOS → BANDA-CIERRE → FOOTER
```

| Posición | Módulo email | Sección web que replica | Peso visual |
|---|---|---|---|
| 1 | header-logo | Header web (logo + nav) | Bajo — presentación |
| 2 | hero-imagen | Hero SPLIT (50% texto beige + 50% foto) | **Alto** — descubrimiento |
| 3 | intro-cta | Transición post-hero (info breve) | Bajo — transición |
| 4 | columns-3-beneficios-sin-icono | Sección de producto/categorías (adaptado a beneficios) | Medio — argumentación |
| 5 | banda-cierre-asimetrico | "Your gear deserves credit" banda oscura | **Alto** — cierre con CTA |
| 6 | footer | Footer negro | Bajo — legal |

## Flujo narrativo

1. **Hero**: "Esto existe." (foto + titular impacto + CTA)
2. **Intro**: "Es para ti si ya compras Patagonia." (transición breve)
3. **Beneficios**: "Tres razones para probarlo." (argumentos sin iconos)
4. **Cierre**: "Vamos, entra a ver." (banda oscura + CTA final)
