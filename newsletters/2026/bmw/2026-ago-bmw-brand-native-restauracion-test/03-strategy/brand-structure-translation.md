# brand-structure-translation.md
## Traducción de estructura real de BMW.es al email

**Campaña:** 2026-ago-bmw-brand-native-restauracion-test
**Marca:** BMW
**URL de referencia:** https://www.bmw.es/es/home.html
**Patrón:** fotografia-primero
**Fecha:** 2026-08-01

---

## 1. Secciones reales de bmw.es tomadas como referencia

| # | Sección real (bmw.es) | Tipo de contenido | Traducible al email |
|---|----------------------|-------------------|---------------------|
| 1 | Hero principal (BMW iX / Serie 3) | Fotografía a todo el ancho + frase corta + CTA "Descubrir" | ✅ **Sí** → `hero-imagen` |
| 2 | Modelos destacados (cards de producto) | Grid de cards con imagen + nombre modelo + CTA | ⚠️ Parcial — el grid completo no se traduce 1:1; se usa `editorial-foto-texto` para transmitir la esencia editorial de cada bloque |
| 3 | Editorial BMW — Diseño / Tecnología | Bloques de imagen + titular breve + párrafo corto | ✅ **Sí** → `editorial-foto-texto` / `editorial-foto-texto-inverso` |
| 4 | Datos técnicos en fichas de producto | Tablas con potencia, aceleración, velocidad, consumo | ⚠️ Parcial — las fichas completas son interactivas; la esencia se traduce como `metric-strip-premium` |
| 5 | CTA final / solicitar prueba | Bloque informativo + CTA principal | ✅ **Sí** → `banda-cierre` |
| 6 | Footer legal | Datos corporativos, dirección, copyright | ✅ **Sí** → `footer` |

---

## 2. Patrón visual de cada sección

| Sección | Patrón visual | Composición | Ritmo |
|---------|--------------|-------------|-------|
| Hero | Fotografía dramática a sangre completa, sin apenas texto sobrepuesto | Imagen domina (100%), texto debajo separado | Impacto inmediato, respiro después |
| Bloques editoriales | Imagen(46%) + texto(54%) alternando izquierda/derecha | Columna partida, texto minimalista | Diálogo visual entre foto y texto |
| Métricas | Números grandes + labels breves, sin iconos ni fondos | Tira horizontal limpia | Lectura rápida, impacto de datos |
| Cierre | Fondo oscuro (colors.deep = #000), texto blanco, CTA azul | Centrado, minimal | Contraste con el blanco previo |

---

## 3. Traducción al email — módulos del motor

| Módulo del motor | Sección real que traduce | Justificación brand-native |
|---|---|---|
| `header-logo` | Logo BMW + labeling de precisión | Consistente con el header del sitio |
| `hero-imagen` | Hero fotográfico a sangre | Misma función que en web: primera impresión visual potente |
| `editorial-foto-texto` | Sección "Diseño" (foto + texto breve) | Traduce el bloque editorial de imagen protagonista + texto mínimo |
| `editorial-foto-texto-inverso` | Sección "Tecnología" (texto + foto) | Alterna el orden para mantener ritmo visual sin repetir composición |
| `metric-strip-premium` | Datos técnicos del modelo | Captura la esencia de las tablas técnicas sin replicar complejidad interactiva |
| `banda-cierre` | CTA final / solicitar prueba | Misma función de cierre con CTA principal |
| `footer` | Footer legal corporativo | Traducción directa |

---

## 4. Por qué NO es una plantilla genérica

| Elemento genérico evitado | Alternativa usada | Motivo |
|---------------------------|-------------------|--------|
| `hero → intro → tres columnas → caja highlight → cierre` | Estructura brand-native con `hero-imagen + editorial-foto-texto + editorial-foto-texto-inverso + metric-strip-premium + banda-cierre` | La secuencia genérica fuerza contenido en slots que no corresponden al ritmo real de BMW. BMW no usa "tres beneficios" ni caja highlight — usa fotografía como protagonista y texto mínimo. |
| `columns-3-beneficios` (con iconos) | `editorial-foto-texto` / `editorial-foto-texto-inverso` | BMW tiene `iconDensity: "nula"` — los iconos contradicen el pack de marca |
| `intro-cta` | Omitido (opcional) | El brief de esta campaña no aporta un párrafo de transición real; la brevedad es parte del lenguaje BMW |
| `columns-3-beneficios-sin-icono` | `metric-strip-premium` | Las métricas técnicas no son "beneficios" — son datos editoriales que merecen su propio componente premium |

---

## 5. Decisiones específicas

### Por qué `hero-imagen`

BMW.es usa fotografía real a todo el ancho como hero. `hero-imagen` es el único componente que captura ese patrón visual: banner de imagen decorativo arriba + marca, H1, subtítulo y CTA como HTML vivo debajo. No hay alternativa viable (`hero-centrado` sería un fondo de color sólido que contradice el lenguaje visual de BMW).

### Por qué `editorial-foto-texto` y `editorial-foto-texto-inverso`

`layout.contentRhythm.sections[]` de BMW documenta un bloque editorial de tipo "foto+texto" real en la página: imagen grande + titular corto + 1 párrafo breve. Alternar normal e inverso evita la repetición compositiva y mantiene el ritmo editorial de una marca que no usa iconos ni grids de texto.

### Por qué `metric-strip-premium`

`layout.contentRhythm.sections[]` incluye una sección de "tabla-datos" (potencia, aceleración, velocidad) que, aunque no es traducible 1:1 por ser interactiva, sí merece representación editorial como tira de métricas premium. `metric-strip-premium` captura esa esencia sin iconos ni caja highlight — fondo limpio, números grandes, labels breves, consistente con el minimalismo BMW.

### Elementos evitados

- **`intro-cta`**: opcional en el patrón. No hay párrafo de transición breve que justifique su inclusión sin rellenar espacio — la brevedad es parte de la identidad BMW.
- **`columns-3-beneficios-sin-icono`**: sustituido por `metric-strip-premium` porque lo que BMW presenta no son "beneficios" sino datos técnicos. Usar un componente de beneficios para métricas técnicas falsearía la naturaleza del contenido.
- **`columns-3-beneficios` (con icono)**: prohibido por `iconDensity: "nula"` — los iconos contradicen el análisis de marca.
- **Estructura genérica `hero → intro → tres columnas → caja highlight → cierre`**: no corresponde al ritmo real de ninguna página de BMW.

---

## 6. Referencia al brand pack

- `layout.brandStructure`: el brand pack de BMW documenta explícitamente que la fotografía es el elemento visual dominante (`photographyWeight: "dominante"`) y que los iconos tienen densidad nula (`iconDensity: "nula"`). Este análisis estructural es la base de la decisión de patrón y módulos.
- `layout.contentRhythm`: documenta 4 secciones reales en la página de referencia. Las secciones traducibles (hero fotográfico y bloque editorial foto+texto) se corresponden directamente con `hero-imagen` y `editorial-foto-texto`/`editorial-foto-texto-inverso`. Las secciones no traducibles (tabla de datos y ofertas de financiación con letra legal) se omiten o se traducen conceptualmente (`metric-strip-premium` para la esencia de datos técnicos).
- `photography.usesRealPhotography: true` — confirma que el patrón `fotografia-primero` es el correcto.
- `iconography.componentImplication` desaconseja iconos — refuerza la decisión de no usar variantes con icono.

---

## 7. Gate 12 — Diferenciación estructural

Esta campaña NO repite la estructura genérica por las siguientes razones:

1. **Patrón `fotografia-primero`** — no `saving` ni `institutional`, los dos patrones que sí usan la estructura hero → intro → 3 columnas → cierre.
2. **`hero-imagen` obligatorio** — la fotografía real es el elemento central, no un fondo de color sólido.
3. **Dos bloques `editorial-foto-texto` alternando orden** — esto es específico de marcas foto-dominantes y no aparece en los otros patrones.
4. **`metric-strip-premium` como alternativa a `columns-3-*`** — los datos técnicos se presentan como contenido editorial, no como beneficios estructurados.
5. **Omisión de `intro-cta`** — no hay párrafo de relleno; la newsletter respira con fotografía y métricas.
6. **Sin `columns-3-beneficios-sin-icono`** — el componente de beneficios (ni con ni sin icono) no corresponde a la naturaleza de datos de BMW.
7. **La secuencia total** `header-logo → hero-imagen → editorial-foto-texto → editorial-foto-texto-inverso → metric-strip-premium → banda-cierre → footer` **no aparece en ningún otro patrón** ni en ninguna campaña anterior — es una combinación única para esta interpretación brand-native de BMW.
