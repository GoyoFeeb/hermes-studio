# Brand Analysis — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 02 (Brand Visual Analyst). Fecha: 2026-08-20.
> Brand pack de origen: `brands/mercedes-amg/tokens/brand-tokens.json`.

## 1. Estado del brand pack

El brand pack de Mercedes-AMG **existía** (v2.2.0, creado 2026-07-30 para la campaña del GT 4
Puertas Coupé eléctrico, no ejecutada). El brief del cliente ordenaba reutilizarlo sin
reinvestigar la identidad. Aun así, el changelog del propio pack (válvula de escape, v2.2.0)
declaraba que los 5 valores del CTA y el body estaban **INFERIDOS** (construcción por fetch del
HTML servido, sin Chrome). Siguiendo el protocolo de verificación cruzada de packs existentes
(precedente New Balance 2026-07-28), los campos de alto riesgo se verificaron con
`getComputedStyle` real sobre https://www.mercedes-amg.com/en/c-class-sedan el 2026-08-20.

### Discrepancias corregidas (pack v2.2.0 → v2.3.0)

| Campo | Pack v2.2.0 (inferido) | Real (getComputedStyle 08-20) | Decisión |
|---|---|---|---|
| typography.cta.size | 13px | **16px** | Corregido a 16 (OBSERVADO) |
| typography.cta.weight | 700 | **500** | Corregido a 500 (OBSERVADO) |
| typography.cta.letterSpacing | 1.5px | **0.45712px** | Corregido a 0.5px (OBSERVADO, redondeo documentado) |
| typography.body.size | 14px | **16px** | Corregido a 16 (OBSERVADO) |
| typography.body.lineHeight | 1.55 | **1.5** (24px/16px) | Corregido a 1.5 (OBSERVADO) |
| components.cta.padding | 17px 40px | **0px 16px** + line-height 28px | Corregido a 12px 24px (DERIVADO email-safe del real; el alto del botón web lo da el line-height) |
| components.cta.borderRadius | 0 | **0px** | ✅ CONFIRMADO (el inferido era correcto) |
| components.cta.backgroundColor | #B21E23 | **rgb(178,30,35)** | ✅ CONFIRMADO |

Detalle del CTA real observado: `<a>` blanco `#FFFFFF` sobre rojo `#B21E23`, `border: 1px solid
#B21E23` (borde del mismo color, invisible en la práctica — no se tokeniza), `text-transform:
none` (el sitio NO pone el CTA en mayúsculas), radio 0.

Detalle del H1 real: `34px`, familia nombrada `titleExtraBold` (el peso vive en el nombre de la
fuente; `font-weight:400` declarado), `text-transform: uppercase`, blanco sobre negro. El pack
tokeniza h1Hero 34/800 — la traducción email-safe del ExtraBold (Helvetica Neue no expone 800
como peso nativo en todos los clientes; se mantiene 800 como token de diseño).

### Cambios aplicados

- `brands/mercedes-amg/tokens/brand-tokens.json` → v2.3.0 con `_changelog` que documenta cada
  before/after con origen (OBSERVADO vs DERIVADO). `check-brand-pack-completeness` → ✅ OK.
- El pack sigue siendo la fuente de verdad visual: **no se tocó** nada más (colores, superficies,
  voice, fotografía, layout, assets).

## 2. Selección de variante de iconos

`iconography.componentImplication` del pack: **ningún icono decorativo en las 9 secciones de la
página de producto**; únicos glifos = 2 iconos funcionales de utilidad. → **Variantes
`-sin-icono` obligatorias** si se necesitan bloques estructurados. En esta campaña ni siquiera se
usan: la arquitectura es 100% fotografía + editorial (ver 03).

## 3. Selección de patrón

Criterios del patrón `fotografia-primero` (patterns/fotografia-primero.md §6), verificados contra
el pack:

1. `photography.usesRealPhotography: true` + treatment «la fotografía lleva TODO el peso
   visual» → ✅ cumple.
2. `iconography.componentImplication` desaconseja iconos → ✅ cumple.
3. `layout.contentRhythm` (9 secciones reales: hero fotográfico + 4 bloques editoriales
   foto+texto + cita + sección de sonido oscura + galerías/tablas NO traducibles) → ✅ cumple:
   la página es foto + texto breve, no comparador ni catálogo.
4. Sin cifras de ahorro → no aplica `saving`.
5. Sin catálogo de 2-8 categorías → no aplica `institutional` con category-grid.

→ **Patrón elegido: `fotografia-primero`.** Secuencia propuesta: header-logo → hero-imagen →
editorial-foto-texto (x1) → editorial-foto-texto-inverso (x1) → banda-cierre → footer.
(Sin intro-cta, sin metric-strip, sin columns-3: justificado en brief.md §4 y en
module-selection del agente 03.)

## 4. Coherencia con campañas previas

No existen campañas previas de Mercedes-AMG en `newsletters/` (verificado). Sin precedentes de
estructura que condicionen la pieza.

## 5. Notas de accesibilidad (heredadas del pack)

- CTA: blanco `#FFFFFF` sobre rojo `#B21E23` = **6.76:1** ✅ PASS AA (sin ajustes; no es el caso
  de contraste problemático de otras marcas).
- ⚠️ **Eyebrow rojo `#B21E23` a 11px/700 sobre negro = 3.11:1 → FALLA AA** (4.5:1). Sobre fondos
  claros (blanco `#FFFFFF`): 3.11:1 tampoco pasa para texto pequeño. **Decisión:** los eyebrows
  sobre fondos oscuros (hero, banda-cierre) usarán blanco o gris `#9F9F9F` (token
  onBrandSecondary ya existente); el rojo queda para los eyebrows sobre fondo claro a
  peso/size mayores o como acento decorativo. Documentado para los agentes 04/05.
- El hero es imagen a sangre con texto DEBAJO (componente hero-imagen del motor: banner en su
  propia fila, copy sobre `colors.primary` negro) → contraste calculable, sin scrim.
