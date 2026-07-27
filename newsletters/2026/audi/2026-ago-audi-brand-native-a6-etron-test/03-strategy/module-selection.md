# Module Selection — Audi A6 Sportback e-tron

## Patrón elegido
**`fotografia-primero`**

### Justificación contra brand pack
1. `photography.usesRealPhotography: true` ✅ — Audi usa fotografía real de alta calidad editorial
2. `photography.treatment` describe fotografía como elemento que "lleva el peso visual absoluto" ✅
3. `iconography.componentImplication`: "No usar emoji ni iconGlyph en beneficios — usar variante columns-3-beneficios-sin-icono" ✅
4. `layout.contentRhythm.photographyWeight: "dominante"` ✅
5. No hay cifra de ahorro confirmada → no es `saving` ✅
6. No hay catálogo/grid de productos → no es `institutional` ✅

## Elección de hero
**`hero-imagen`**

### Evaluación de las 2 preguntas obligatorias:
1. **¿El brief da URL de landing real?** Sí → `https://www.audi.es/es/modelos/a6-e-tron/a6-sportback-e-tron/`
2. **¿`photography.usesRealPhotography: true`?** Sí → con treatment que describe fotografía como protagonista

**Decisión**: `hero-imagen` por defecto (ambas preguntas Sí). No hay motivo para elegir otra variante — el CTA real existe, la fotografía es dominante, y el patrón fotografia-primero solo admite hero-imagen sin fallback (ver patterns/fotografia-primero.md §3).

## Secuencia final

| # | Componente | Justificación |
|---|-----------|---------------|
| 1 | header-logo | Obligatorio — apertura de marca |
| 2 | hero-imagen | Hero con fotografía generada + titular + CTA. Traduce el hero de la página de Audi |
| 3 | editorial-foto-texto | Traduce "Destacados/Diseño" de la página: foto (izquierda) + texto (derecha) sobre aerodinámica y silueta. Reemplaza el primer intro-cta de la campaña anterior. |
| 4 | editorial-foto-texto-inverso | Traduce "Interior/Tecnología": texto (izquierda) + foto (derecha) sobre habitáculo y pantallas. Alterna el orden para mantener ritmo visual. Justificado contra `layout.contentRhythm.sections[4]` (seccion-interior) y `brandStructure[3]` (interior y tecnología). |
| 5 | columns-3-beneficios-sin-icono | Traduce la stats strip de la página (340 kW / 4.5s / 773 km). Sin iconos — variante obligada por `iconography.componentImplication`. Justificado contra `layout.contentRhythm.sections[1]` (stats-clave). |
| 6 | banda-cierre | Obligatorio — CTA principal de conversión sobre fondo oscuro |
| 7 | footer | Obligatorio — datos legales |

### Módulos omitidos
- **intro-cta**: Omitido. La página de Audi A6 no tiene un bloque de transición textual entre el hero y los destacados. La transición directa hero → editorial-foto-texto respeta el ritmo real de la marca. No hay contenido de transición que justifique un bloque separado.
- **intro-cta-asimetrico**: Omitido (mismo motivo).
- **banda-cierre-asimetrico**: No se usa — el patrón audi es centrado, no asimétrico.

## Cumplimiento de reglas de ritmo
- 1→2: Cambia fondo (blanco→imagen) + densidad (baja→alta) ✅
- 2→3: Cambia fondo (imagen→blanco) + densidad (alta→media) ✅
- 3→4: Cambia alineación (izquierda imagen→izquierda texto) ✅ (editorial-foto-texto vs inverso)
- 4→5: Cambia fondo (blanco→sectionLila) + densidad (media→media, distinto layout) ✅
- 5→6: Cambia fondo (sectionLila→deep) ✅
- 6→7: Cambia fondo (deep→global) + densidad (media→baja) ✅

Ninguna sección consecutiva repite la misma combinación fondo+alineación+densidad. ✅
