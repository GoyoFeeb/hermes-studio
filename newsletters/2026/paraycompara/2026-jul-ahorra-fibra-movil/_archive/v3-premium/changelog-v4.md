# changelog-v4.md — Cambios V4 vs V3

> Campaña: 2026-jul-ahorra-fibra-movil
> Fecha: 2026-07-13

---

## Resumen

V4 es una **corrección focalizada del hero** sobre la base de la V3 aprobada. No se rediseña ningún otro bloque.

## Cambios en el hero

| Aspecto | V3 | V4 |
|---|---|---|
| Imagen hero | `paraycompara-2000.png` (600×420px, referencia antigua) | `hero-paraycompara-v4.png` (600×340px, placeholder para asset final) |
| Altura imagen | 420px | 340px (proporción 5:3) |
| Fondo fallback | #FFFFFF | #F8F5FC |
| Eyebrow | "Compara, elige y ahorra" (13px, #7B1FA2) | "COMPARA, ELIGE Y AHORRA" (12px, #7B1FA2) |
| Titular | "Ahorra en tu tarifa de fibra y móvil" | Sin cambios |
| Subtítulo | "Descubre la **mejor oferta** del mercado." | "Compara ofertas de más de 30 compañías y encuentra una opción que encaje mejor contigo." |
| Badge "LA MEJOR OFERTA DEL MES" | Sí, entre hero y copy | Eliminado (el copy ahora es más completo) |
| Microcopy | No existía | "Gratis, rápido y sin complicaciones." bajo el CTA |
| Orden hero | Imagen → Badge → Eyebrow → Titular → Texto → CTA | Imagen → Eyebrow → Titular → Texto → CTA → Microcopy |
| Contenido duplicado | El hero image contenía CTA "VER OFERTAS" + el HTML tenía CTA "COMPARAR TARIFAS" | Sin duplicación — todo el copy está en HTML |
| Dependencia de imagen | El hero image era el portador visual principal | La imagen es apoyo visual; el mensaje está en HTML |

## Elementos eliminados

- Badge "LA MEJOR OFERTA DEL MES" (reemplazado por microcopy + copy más completo)
- Referencia a `paraycompara-2000.png` (hero antiguo de 420px)
- Todo el código de animación de Fase 2 (archivado en `archive/phase-2-gif/`)

## Elementos archivados

Los siguientes archivos de la Fase 2 se movieron a `archive/phase-2-gif/`:

- `hero-v3-animated.gif`
- `hero-v3-poster.png`
- `hero-v3-first-frame.png`
- `hero-v3-motion-notes.md`
- `paraycompara-v3-premium-animated.html`
- `paraycompara-v3-premium-animated-inline.html`

## Elementos conservados sin cambios

- Header (logo + fondo morado #5E2E91)
- Tarifas (4 cards en 2×2 grid)
- Cómo funciona (3 pasos 01/02/03)
- Qué tener en cuenta (4 microcards)
- CTA final (mismo estilo que el CTA hero)
- Footer (compacto con enlaces + legal)
- Estilos responsive (media queries, mobile-stack, mobile-hide)
- VML bulletproof para ambos CTAs

## Archivos generados (V4)

| Archivo | Tamaño | Descripción |
|---|---|---|
| `final-fixed-v4.html` | 31 KB | HTML V4 con hero corregido |
| `final-fixed-v4-inline.html` | 31 KB | Versión inline para envío |
| `preview-v4-desktop.png` | 148 KB | Preview 600px |
| `preview-v4-480.png` | 162 KB | Preview 480px |
| `preview-v4-390.png` | 159 KB | Preview 390px |
| `preview-v4-375.png` | 160 KB | Preview 375px |
| `preview-v4-320.png` | 158 KB | Preview 320px |
| `hero-asset-spec.md` | — | Especificación del asset visual |
| `changelog-v4.md` | — | Este documento |

## Archivo recomendado para envío

**`final-fixed-v4-inline.html`**

Para activar el hero definitivo: sube `hero-paraycompara-v4.png` al CDN y sobrescribe el placeholder.