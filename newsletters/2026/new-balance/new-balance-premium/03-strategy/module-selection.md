# Module Selection: New Balance — new-balance-premium

## Patrón seleccionado

**`fotografia-primero`** — patrón para marcas donde la fotografía es el elemento visual dominante.

## Criterios de selección (verificados contra brand pack)

| Criterio | Cumple | Evidencia |
|---|---|---|
| `photography.usesRealPhotography: true` | ✅ | New Balance usa fotografía real como elemento visual dominante |
| `iconography.componentImplication` desaconseja iconos | ✅ | "No usar iconos — la fotografía es el único adorno visual" |
| `layout.contentRhythm` muestra foto + texto breve | ✅ | Hero foto → grid producto → editorial foto+texto → footer |
| Sin cifras de ahorro | ✅ | Campaña editorial, no promocional |
| Sin catálogo de categorías | ✅ | No hay category-grid que justifique institutional |

## Módulos seleccionados

| # | Módulo | Tipo | Justificación |
|---|---|---|---|
| 1 | `header-logo` | Required | Logo NB + tagline |
| 2 | `hero-imagen` | Required | Fotografía lifestyle running — la imagen es el mensaje |
| 3 | `editorial-foto-texto` | Optional | "Nuevos colores" — foto lifestyle + texto breve. Refleja el bloque "The 530" de newbalance.com |
| 4 | `editorial-foto-texto-inverso` | Optional | "120 años de herencia" — variante inversa para ritmo visual. Refleja "Trackside Apparel" |
| 5 | `columns-3-beneficios-sin-icono` | Optional | 3 pilares de marca: Rendimiento, Herencia, Estilo. Sin iconos |
| 6 | `banda-cierre` | Required | CTA de exploración final |
| 7 | `footer` | Required | Legal, tagline, enlaces de baja |

## Módulos NO seleccionados

| Módulo | Razón |
|---|---|
| `intro-cta` / `intro-cta-asimetrico` | El hero + primer bloque editorial ya establecen contexto. Añadir intro sería relleno |
| `metric-strip-premium` | New Balance no es marca técnica/automotriz con métricas para strip |
| `usp-cards` / `usp-cards-asimetrico` | Los USP se cubren con columns-3-beneficios-sin-icono |

## Secuencia final

```
header-logo → hero-imagen → editorial-foto-texto → editorial-foto-texto-inverso
→ columns-3-beneficios-sin-icono → banda-cierre → footer
```
