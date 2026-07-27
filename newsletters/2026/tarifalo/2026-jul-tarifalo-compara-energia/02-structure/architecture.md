# Arquitectura del newsletter — Tarífalo Compara Energía

## Secuencia de módulos

Sigue el patrón `saving` con adaptaciones para Tarífalo. La sección "card-tarifa" se reemplaza por "tipos de comparación" (luz/gas/luz+gas, 3 tarjetas).

| # | Módulo | Componente | Fondo | Obligatorio |
|---|---|---|---|---|
| — | Shell (envoltorio) | `_shell.html` | — | Siempre |
| 1 | Hero | `hero.html` adaptado | `#003049` (primary) | Sí |
| 2 | Trust bar | `trustBar.html` | `#FFF1E0` pill sobre `#FFFFFF` | Sí |
| 3 | Ventajas (cards) | `cardTarifa.html` (3 items) | `#FFFFFF` | Sí |
| 4 | Cómo funciona | `pasos.html` | `#FFFFFF` | Sí |
| 5 | Tipos de comparación | `listaPremium.html` | `#FFF1E0` | Sí |
| 6 | Banda de cierre | `bandaCierre.html` | `#002035` (deep) | Sí |
| 7 | Footer | `footer.html` | `#FFF6E7` (global) | Siempre |

## Estructura visual

```
┌─────────────────────────────────────┐
│  SHELL (fondo exterior #FFF6E7)     │
│  ┌───────────────────────────────┐  │
│  │  HERO (fondo #003049)          │  │
│  │  ┌─────┐ ┌──────────────────┐ │  │
│  │  │Logo │ │ H1 + CTA         │ │  │
│  │  └─────┘ └──────────────────┘ │  │
│  ├───────────────────────────────┤  │
│  │  TRUST BAR                     │  │
│  │  ✅ Independiente              │  │
│  │  ✅ Ahorra tiempo              │  │
│  │  ✅ 100% gratuito              │  │
│  ├───────────────────────────────┤  │
│  │  VENTAJAS (3 cards, #FFFFFF)   │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐  │  │
│  │  │ Card1 │ │ Card2 │ │ Card3 │  │  │
│  │  └──────┘ └──────┘ └──────┘  │  │
│  ├───────────────────────────────┤  │
│  │  CÓMO FUNCIONA (3 pasos)      │  │
│  │  ①         ②         ③       │  │
│  ├───────────────────────────────┤  │
│  │  TIPOS DE COMPARACIÓN         │  │
│  │  (fondo #FFF1E0)              │  │
│  │  ⚡ Luz  🔥 Gas  ⚡🔥 Luz+Gas  │  │
│  ├───────────────────────────────┤  │
│  │  BANDA DE CIERRE (fondo deep)  │  │
│  │  [ CTA Comparar tarifas ]      │  │
│  ├───────────────────────────────┤  │
│  │  FOOTER                        │  │
│  │  Baja | Preferencias           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Ritmo visual

- **Hero** → fondo oscuro, asimétrico, densidad media
- **Trust bar** → fondo blanco, baja densidad (pill lila)
- **Ventajas** → fondo blanco, alta densidad (grid 3 cards)
- **Pasos** → fondo blanco, baja densidad (círculos sueltos)
- **Tipos (lista)** → fondo crema, alta densidad (tarjetas apiladas)
- **Cierre** → fondo oscuro, densidad media
- **Footer** → fondo crema claro, baja densidad

## Reglas de ritmo
- Alternancia oscuro/claro: hero (oscuro) → trust (claro) → ventajas (claro) → pasos (claro, excepción por cambio de densidad) → lista (crema) → cierre (oscuro) → footer (crema)
- Solo 2 CTAs: hero y cierre
- Sombras solo en tarjetas y CTA (disciplina G7)
