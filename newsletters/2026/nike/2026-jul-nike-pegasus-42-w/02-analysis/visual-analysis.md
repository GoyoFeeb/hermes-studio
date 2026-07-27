# Visual Analysis — Nike Pegasus 42 (Women's)

## Estado
El brand pack de Nike ya existe y está completo (v2.2.1). Los tokens visuales (colores, tipografía, fotografía, iconografía, layout) se obtuvieron por observación real de nike.com. No se repite la investigación.

## Confirmaciones relevantes para esta campaña

### Fotografía
- `photography.usesRealPhotography: true` ✅
- `photography.treatment`: Iluminación high-key de estudio, fondo blanco infinito, perfil lateral, producto aislado sin modelo
- La ficha de mujer usa EXACTAMENTE el mismo tratamiento fotográfico que la de hombre

### Iconografía
- `iconography.componentImplication`: NO usar emoji/iconGlyph en ningún módulo
- Para columns-3-beneficios: usar variante `-sin-icono` o replantear el módulo
- Fotografía como único adorno visual

### Layout
- `layout.sectionStyle: "centrado"` (Nike usa composición limpia y centrada)
- `layout.contentRhythm`: Fotografía domina absolutamente, texto mínimo

### Gradientes
- `gradients.heroBackground: "none"` — colors.primary == colors.deep (#111111), marca plana/fotografía-primero

### Sombras
- `shadows.card: "none"` — diseño plano, sin sombras

## Implicaciones para esta campaña
- Patrón correcto: **fotografia-primero** (cumple los 5 criterios del §6)
- Hero: `hero-imagen` (fotografía real = elemento central de la marca)
- Módulo de beneficios: `columns-3-beneficios-sin-icono` (sin emoji) o ninguno
- Colores: usar `colors.primary` (#111111) como fondo del hero
- Sombras en cajas: `box-shadow:none` por diseño de marca
