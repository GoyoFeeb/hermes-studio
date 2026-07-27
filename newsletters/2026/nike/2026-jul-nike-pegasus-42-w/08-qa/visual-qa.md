# Visual QA — Nike Pegasus 42 Women

## Verificaciones específicas del motor (3 cambios verificados en final.html)

### 1. gradients.heroBackground (Nike → "none")
**Esperado**: `background-image:none` en el bloque de texto del hero.
**Real**: ✅ `background-color:#111111;background-image:none;` (L91, L221 en final.html)
**Veredicto**: ✅ PASS — Token "none" resuelto correctamente. No hay placeholder roto `{{token:gradients.heroBackground}}`. El background sólido `#111111` (colors.primary) es correcto para Nike.

> ⚠️ Nota: No se ve un degradado visible. Esto es CORRECTO por diseño de marca — Nike tiene colors.primary == colors.deep (#111111) y photography.treatment documenta que la fotografía es el único adorno visual. gradients.heroBackground: "none" es deliberado.

### 2. Scrim / Superposición de texto en hero
**Esperado**: El H1/subtítulo/CTA del hero están DEBAJO de la fotografía, en filas separadas sobre fondo sólido. No hay overlay/scrim porque no hay superposición.
**Real**: ✅ El HTML muestra:
- L93-100: `<tr>` con `<img>` banner (la foto)
- L104+: Marca como texto, H1 (`<h1>`), subtítulo (`<p>`), CTA — todos en `<tr>` independientes debajo del banner
- El fondo de esos `<tr>` es `#111111` (colors.primary), no la imagen

**Veredicto**: ✅ PASS — La nota corregida de fotografia-primero.md §4 se sostiene: no hay superposición de texto sobre la fotografía.

### 3. shadows.card (Nike → "none")
**Esperado**: Las tarjetas de columns-3-beneficios-sin-icono deben tener `box-shadow:none`.
**Real**: ✅ `box-shadow:none;` en L206 (tarjetas de beneficios), L142 y L245 (CTAs).
**Veredicto**: ✅ PASS — Token "none" aplicado correctamente. Diseño plano de Nike respetado.

## Visual verification summary
- No se han generado capturas de render aún (pendiente de hero image)
- Build produce HTML válido sin placeholders `{{` sin resolver
- Tag balance: OK (4 v:roundrect, 2 img, 0 utm_source — coherente)

## Next
- Esperar hero image generada
- Ejecutar production-gate-motor
- Regenerar preview tras confirmar hero URL
