# Module Selection — BMW Experiencia Premium

## Patrón elegido

**Patrón:** `fotografia-primero`

### Motivo (contra brand pack v2.3.1)

| Criterio | Evidencia en brand pack | Estado |
|----------|------------------------|--------|
| ¿Cifra de ahorro confirmada como eje? | No — no hay cifras de ahorro en el brief. | → No es `saving` |
| `photography.usesRealPhotography: true` | `true` — el pack documenta fotografía real como elemento visual principal. | ✅ |
| `photography.treatment` como protagonista | "Las imágenes llevan el peso visual de la comunicación — el texto es secundario y minimalista." | ✅ |
| `iconography.componentImplication` desaconseja iconos | "BMW confía en la fotografía como único adorno visual." / `iconDensity: nula` | ✅ |
| `layout.contentRhythm.photographyWeight` | `"dominante"` — la fotografía ocupa la mayoría del espacio. | ✅ |
| `layout.contentRhythm.sections` | Hero fotográfico + 2 bloques de datos NO traducibles + 1 bloque editorial foto+texto breve. Sin catálogo extenso. | ✅ |
| ¿Catálogo de 2-8 categorías? | No — no hay un grid de categorías en la página real. | → No necesita `institutional` |

**Conclusión:** Los 4 criterios de `fotografia-primero` se cumplen. Es la elección estructural correcta.

## Hero elegido

**Hero:** `hero-imagen`

### Evaluación de las 2 preguntas obligatorias

| # | Pregunta | Respuesta | Evidencia |
|---|----------|-----------|-----------|
| 1 | ¿El brief da una URL de landing real? | **Sí** | `https://www.bmw.es/es/home.html` — página principal de BMW España, confirmada por el usuario. |
| 2 | ¿`photography.usesRealPhotography` = true? | **Sí** | Brand pack v2.3.1: `usesRealPhotography: true`, `treatment` describe fotografía dominante. |

**Decisión:** `hero-imagen` es la variante de hero para esta campaña. El banner generado por IA (sin texto, sin logotipo) será la imagen protagonista de cabecera. La generación se ejecutará en la fase 06.

## Módulos: incluidos y omitidos

| # | Módulo | Decisión | Motivo |
|---|--------|----------|--------|
| 1 | `header-logo` | ✅ Incluido | Obligatorio del patrón. Marca al inicio. |
| 2 | `hero-imagen` | ✅ Incluido | Obligatorio del patrón. Hero con banner generado. |
| 3 | `intro-cta` | ✅ Incluido | Opcional. El brief tiene contenido para un bloque editorial de transición. Se traduce el patrón real de BMW (editorial foto+texto breve). |
| 4 | `columns-3-beneficios-sin-icono` | ✅ Incluido | Opcional. Se incluye con 3 argumentos de marca (diseño, tecnología, conducción). Sin iconos — variante `-sin-icono`. |
| 5 | `banda-cierre` | ✅ Incluido | Obligatorio del patrón. Cierre con CTA. |
| 6 | `footer` | ✅ Incluido | Siempre. Legal y unsubscribe. |

## Secuencia final

```
header-logo → hero-imagen → intro-cta → columns-3-beneficios-sin-icono → banda-cierre → footer
```

### Justificación del orden

El orden sigue la estructura de `layout.contentRhythm` del brand pack: la página real de BMW alterna hero fotográfico → bloque editorial foto+texto. El `contentRhythm` observado en `bmw.es` muestra: hero fotográfico (traducible) → 2 bloques de datos no traducibles → bloque editorial foto+texto breve (traducible). Se traduce el hero y el bloque editorial; los bloques de datos no se replican en el email (son interactivos/configuradores). El orden por defecto del patrón es correcto para esta marca: hero impactante → transición editorial → argumentos → cierre → footer.

## Claims prohibidos

| Término prohibido | Alternativa permitida |
|-------------------|----------------------|
| "potencia" (palabra) | "energía", "respuesta", "rendimiento" |
| "0 a 100" | "aceleración hasta los 100 km/h" |
| "tracción integral" | "M xDrive" |
| "acelera de X a Y" | "aceleración hasta" |
| "velocidad máxima" | Cifra sola sin "máxima" |
| "mejor", "líder", "más" (comparativos) | Evitar sin evidencia textual |
