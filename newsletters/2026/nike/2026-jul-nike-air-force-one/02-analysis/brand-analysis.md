# Brand Analysis — Nike Air Force One Relanzamiento

## Brand pack existente
- **Ubicación:** `brands/nike/tokens/brand-tokens.json`
- **Versión:** 2.2.3
- **Creado para:** Nike Pegasus 42 (running, 2026-07-24)
- **Última actualización:** 2026-07-28 (Fase F3 — spacing.close añadido)

## Verificación con getComputedStyle (nike.com, página AF1 '07, 2026-07-29)

### Colores
| Token | Valor en pack | Observado en web | Estado |
|---|---|---|---|
| colors.primary | #111111 | rgb(17,17,17) = #111111 | ✅ Coincide |
| colors.textBody | #707072 | rgb(112,112,114) = #707072 | ✅ Coincide |
| colors.white | #FFFFFF | rgb(255,255,255) = #FFFFFF | ✅ Coincide |
| colors.lightBg | #F5F5F5 | rgb(245,245,245) = #F5F5F5 | ✅ Coincide |
| colors.ctaBackground | #111111 | rgb(17,17,17) — botones y enlaces | ✅ Coincide |
| colors.black | #111111 | rgb(17,17,17) — texto primario | ✅ Coincide |

### Tipografía
| Aspecto | Pack value | Observado en web | Estado |
|---|---|---|---|
| Font family (body) | Helvetica, Arial, sans-serif | "Helvetica Now Text", Helvetica, Arial, sans-serif | ✅ Correcto (Helvetica Now no es segura en email, fallback correcto) |
| Font family (display) | 'Inter', Helvetica, Arial, sans-serif | "Helvetica Now Display Medium" | ⚠️ Inter como sustituto webFont documentado en el pack |
| H1 size/weight | 20px/500 (h1Section) | 20px/500 en AF1 product page | ✅ Coincide |
| Body size | 16px (bodyLarge) | 16px en página de producto | ✅ Coincide |

### Logo
| Aspecto | Estado |
|---|---|
| assets.logo en brand pack | Vacío (pendiente) → CAPTURADO de nike.com |
| Tipo | SVG inline desde nike.com (64×22, viewBox 0 0 64 22) |
| Color | fill="#111111" (negro) |
| Fuente | Observado en nav principal de nike.com, clase "swoosh-svg" |

## Voice.rhythm — verificación para AF1 vs Pegasus 42
El brand pack actual tiene voice.rhythm basado en copy técnico de running (Pegasus 42). Para AF1, el tono debe ser más cultural e icónico. El AF1 no es un producto técnico-deportivo como el Pegasus — es un icono del streetwear. Sin embargo, el tono Nike general (seguro, directo, aspiracional) se mantiene.

**Recomendación:** Mantener el voice.rhythm actual como base Nike, pero 05 debe ajustar el tono de técnico-deportivo a cultural/icónico para AF1.

## Conclusión
El brand pack Nike v2.2.3 es válido y sus valores coinciden con lo observado en nike.com para la página del Air Force 1 '07. No requiere cambios estructurales mayores. Se actualiza `assets.logo` con el SVG capturado.
