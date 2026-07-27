# Mobile Spec: 2026-jul-wornwear-usado (≤599px)

## Principios responsive

- Todos los módulos apilan verticalmente al 100% de ancho
- Padding lateral se reduce de 32px a 20px (mobile-pad-sm)
- Las filas de columnas se rompen con `class="mobile-stack"`
- Font sizes se reducen ~25% en hero, ~10% en body
- CTA se extiende al 100% del ancho disponible
- Logo se reduce proporcionalmente

## 1. Header (header-logo.html)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Padding | 20px 24px | 16px 20px |
| Logo width | 150px | 120px |
| Logo height | 42px | 34px |

## 2. Hero (hero-imagen.html)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Foto height | 280px | 200px |
| Padding contenido | 36px 32px 40px | 28px 20px 36px |
| H1 size | 32px | **24px** |
| H1 line-height | 1.2 | 1.25 |
| Subtítulo size | 16px | **14px** |
| CTA | width: auto (pill) | **width: 100%** |

## 3. Intro (intro-cta.html)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Padding | 40px 32px | 32px 20px |
| Título size | 22px | 20px |
| Body size | 14px | 14px (sin cambio) |
| CTA | width: auto | width: 100% |

## 4. Beneficios (columns-3-beneficios-sin-icono.html)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Padding | 52px 24px | 36px 20px |
| Columnas | 33%/50% lado a lado | **Apiladas (100%)** |
| Item title size | 15px | 15px (sin cambio) |
| Item body size | 13px | 13px (sin cambio) |
| Highlight card padding | 14px 22px | 12px 16px |

**Comportamiento mobile-stack:** Cuando hay 3 items en desktop, en mobile se apilan uno debajo del otro con separación vertical. Con 2 items en desktop, también se apilan.

## 5. Banda de cierre (banda-cierre-asimetrico.html)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Padding | 44px 32px | 36px 20px |
| Título size | 22px | 20px |
| Body size | 14px | 14px (sin cambio) |
| CTA width | 280px (fijo) | **100%** |
| Alineación título | Izquierda | Izquierda (se mantiene) |

## 6. Footer (footer.html)

| Propiedad | Desktop | Mobile |
|---|---|---|
| Padding | 28px 24px 20px | 24px 20px 16px |
| Brand size | 12px | 12px (sin cambio) |
| Legal size | 11px | 11px (sin cambio) |
