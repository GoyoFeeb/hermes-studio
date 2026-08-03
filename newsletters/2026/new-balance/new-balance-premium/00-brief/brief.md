# Brief: New Balance — new-balance-premium

## Información general

| Campo | Valor |
|---|---|
| Cliente | New Balance |
| Campaña | new-balance-premium |
| Fecha de briefing | 2026-07-28 |
| Estado | completed |
| Fuente del brief | Investigación exhaustiva desde web oficial (newbalance.com), Email Inspire, Studio-Day brand guidelines |

## Objetivo

Crear una newsletter premium que transmita el ADN auténtico de New Balance: el equilibrio entre rendimiento deportivo, diseño contemporáneo, calidad premium, herencia (heritage), innovación técnica y estilo urbano. La pieza debe sentirse como una campaña editorial oficial — no como una newsletter genérica de ecommerce.

## CTA principal

"Descubrir" — tono aspiracional, no transaccional

## Enlace principal

https://www.newbalance.com
Estado: [REFERENCIA OFICIAL LOCALIZADA — pendiente de aprobación cliente]

## Audiencia objetivo

Segmento mixto running + lifestyle. Perfil: 25-45 años, urbano, activo, valora diseño y calidad, sigue la cultura sneaker y el streetwear premium, conoce las colaboraciones (ALD, Stone Island, JJJJound). Sensible a la herencia de marca y la calidad de materiales.

## Tono y estilo

- **Editorial, no publicitario** — cada comunicación debe sentirse como contenido que pertenece
- **Considerado, no reactivo** — cada elemento gana su lugar
- **Seguro, no ruidoso** — la marca sabe lo que es
- **Minimalista y elegante** — mucho espacio en blanco
- **Auténtico** — fotografía natural, no poses forzadas
- **Heritage + innovación** — honrar el legado mirando al futuro

## Mensajes clave

- "We're In It For The Long Run" — filosofía de marca
- Rendimiento sin compromiso estético
- Craft over flash, substance over spectacle
- Made in USA / Made in UK — calidad de fabricación
- Herencia running desde 1906
- El running como estilo de vida, no solo deporte

## Investigación de marca (extraída de newbalance.com)

### Colores reales (CSS custom properties)

| Token | Hex | Uso |
|---|---|---|
| `--nb-color-primary` | `#CF0A2C` | Rojo signature New Balance |
| `--nb-color-primary-hover` | `#92071F` | Hover de rojo |
| `--nb-color-black` | `#151415` | Casi negro — texto, CTAs |
| `--nb-color-white` | `#FFFFFF` | Fondos, textos sobre oscuro |
| `--nb-color-neutral-100` | `#F2F2F3` | Fondos de sección claros |
| `--nb-color-neutral-200` | `#DEE0E1` | Bordes suaves |
| `--nb-color-neutral-400` | `#ABB0B4` | Gris medio |
| `--nb-color-gray` | `#737B82` | Gris texto secundario |
| `--nb-color-ada-gray` | `#767676` | Gris accesibilidad |

### Tipografía real

| Uso | Fuente | Fallback |
|---|---|---|
| Display/Editorial (H2 grandes) | ITC Garamond W01 | Georgia, serif |
| UI/Cuerpo/Navegación | Proxima Nova W01 | -apple-system, Helvetica Neue, Arial, sans-serif |
| Navegación categorías | 16px/300 (Proxima Nova) | — |
| Nav subcategorías | 12px/500 uppercase, 0.8px letter-spacing | — |
| H2 editoriales | 20-40px/500 (ITC Garamond) | — |
| H2 funcionales | 24px/500 (Proxima Nova) | — |
| Body/Cuerpo | 14px/300-400 (Proxima Nova) | — |
| Precios | 14px/300 | — |

### Sistema de espaciado

| Token | Valor |
|---|---|
| `--nb-spacing-01` | 2px |
| `--nb-spacing-02` | 4px |
| `--nb-spacing-03` | 6px |
| `--nb-spacing-04` | 8px |
| `--nb-spacing-05` | 10px |
| `--nb-spacing-06` | 12px |
| `--nb-spacing-07` | 14px |
| `--nb-spacing-08` | 18px |
| `--nb-spacing-09` | 20px |
| `--nb-spacing-10` | 22px |
| `--nb-spacing-11` | 24px |

### CTA Button (confirmado por getComputedStyle)

| Propiedad | Valor |
|---|---|
| Background | #151415 (--nb-color-black) |
| Texto | #FFFFFF |
| Font | 14px/300 Proxima Nova W01 |
| Padding | 16px 12px |
| Border-radius | 2px |
| Letter-spacing | normal |
| Text-transform | none |

## Referencias visuales

- **Web oficial**: newbalance.com — minimalista, fotografía protagonista, mucho espacio en blanco
- **Newsletters reales**: https://www.emailinspire.com/new-balance — 10+ ejemplos con estructura single-column, hero de fotografía, grids de producto, serif editorial para display
- **Brand guidelines (Studio-Day)**: sistema tipográfico, layout modular, filosofía "editorial, not advertising"
- **Colaboraciones**: Aimé Leon Dore (heritage/preppy), Stone Island (técnico), JJJJound (minimalismo absoluto), Teddy Santis (MADE in USA)
- **Fotografía**: lifestyle natural, estudios con luz natural, modelos reales, producto en contexto de uso

## Riesgos detectados

- New Balance no tiene brand pack en el sistema — es first-time onboarding completo
- El patrón correcto es `fotografia-primero` (fotografía protagonista, sin iconos, minimalista)
- ITC Garamond W01 es una fuente serif de pago — no podemos cargarla como webFont en email; usar Georgia como fallback premium
- Proxima Nova W01 también es de pago — usar Arial/Helvetica como fallback del sistema
- El CTA negro (#151415) sobre blanco (#FFFFFF) tiene contraste ~20:1 — pasa WCAG AA nativamente
- No hay claims comerciales que verificar (es copy editorial/aspiracional)
