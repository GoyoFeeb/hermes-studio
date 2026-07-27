# Spacing System — Para y Compara Email

> Versión 1.0
> Propósito: Definir una escala de espaciado modular y consistente

---

## Escala base

| Paso | px | Uso |
|---|---|---|
| 1 | 4 | Micro-ajustes |
| 2 | 8 | Espaciado entre icono y texto |
| 3 | 12 | Entre título y body en card |
| 4 | 16 | Padding lateral móvil, gap entre cards |
| 5 | 24 | Padding lateral escritorio, gap entre secciones |
| 6 | 32 | Padding vertical módulos (estándar) |
| 7 | 40 | Padding vertical módulos (amplio) |
| 8 | 48 | Padding vertical hero / CTA final |

**Regla**: No usar valores que no estén en esta escala.

---

## Padding lateral

| Contexto | Desktop (600px) | Móvil (<600px) |
|---|---|---|
| Contenedor general | 24px | 16px |
| Cards | 18px | 14px |
| CTA | 32px | 24px |
| Trust bar | 12px | 12px |

---

## Padding vertical entre módulos

| Módulo | Padding top | Padding bottom |
|---|---|---|
| Header | 22px | 18px |
| Hero imagen | 0 | 0 |
| Hero copy | 32px | 8px |
| Trust bar | 0 lateral | 36px |
| Cards (sección) | 40px | 36px |
| Pasos | 40px | 36px |
| Microcards | 40px | 36px |
| CTA final | 44px | 40px |
| Footer | 28px | 24px |

---

## Espaciado interno de componentes

| Componente | Padding interno | Gap |
|---|---|---|
| Card categoría | 22px 18px 18px | 12px (icono → título) |
| Card beneficio | 22px 14px 18px | 10px (icono → título) |
| Trust bar item | 14px 12px | 6px (icono → texto) |
| CTA botón | 14px 32px | — |
| CTA en móvil | 14px 24px | — |
| Badge promocional | 10px 28px | — |

---

## Espaciado entre elementos dentro de un módulo

| Relación | Distancia |
|---|---|
| Eyebrow → H1 | 12px |
| H1 → Body | 10px |
| Body → CTA | 24px |
| CTA → Microcopy | 10px |
| Título sección → primera card | 24px |
| Título card → body card | 6px |
| Body card → borde inferior | 0px |
| Icono → título card | 12px |
| Última card → borde módulo | 0px |
| Separador → primer texto footer | 16px |
| Enlaces footer → copyright | 12px |

---

## Padding en móvil

Se aplican mediante la clase `mobile-padding`:

```css
@media only screen and (max-width:599px) {
  .mobile-padding {
    padding-left:16px !important;
    padding-right:16px !important;
  }
}
```

---

## Ejemplo: estructura de un módulo típico

```
┌────────────────────────────────┐
│        32px padding top        │  ← módulo
│                                │
│   ┌─ 24px lateral ────────┐   │
│   │                        │   │
│   │   Título (24px bottom) │   │
│   │                        │   │
│   │   ┌─ Card ──────────┐  │   │
│   │   │ 22px 18px 18px  │  │   │
│   │   │ Icono (12px)    │  │   │
│   │   │ Título (6px)    │  │   │
│   │   │ Body            │  │   │
│   │   └─────────────────┘  │   │
│   │                        │   │
│   └────────────────────────┘   │
│                                │
│        36px padding bottom     │
└────────────────────────────────┘
│        40px gap (siguiente)    │
└────────────────────────────────┘
```