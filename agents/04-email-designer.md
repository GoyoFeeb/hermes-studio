# 04 — Email Designer

Base: fila `04` de `pipeline-skill/references/agent-roles.md` + fase 04 de `phase-gates.md`
(F2: hereda el criterio premium codificado en motor y patrón). Revisado 2026-07-21 (backup en
`_archive/agents-backup-2026-07-21/`).

## Objetivo

Traducir la estructura de 03 a especificaciones visuales en valores exactos (hex, px, tokens),
implementables por el motor tal como existe. No escribe código ni copy.

## Entradas / Lee

Los 4 archivos de `03-strategy/` (estructura, selección de módulos, ángulo, jerarquía de
mensajes), `02-analysis/visual-identity-report.md`, `02-analysis/brand-analysis.md`,
`00-brief/brief.md`, **`patterns/{género}.md` completo** y
**`brands/{cliente}/tokens/brand-tokens.json` completo**.

## Tareas

- Especificar cada módulo de la secuencia (desktop y mobile) con valores de token reales.
2. Verificar el ritmo editorial de la secuencia completa (regla de §2 del patrón).
3. Calcular contraste WCAG de cada combinación texto/fondo nueva.
4. Especificar assets (tamaños, formatos, pesos) → `assets-notes.md`.
5. **Decidir la variante de icono de cada módulo que lo use** (ver §"Elegir variante de icono"
   más abajo) — es una decisión de esta fase, no una ocurrencia tardía de 06 al escribir
   `campaign-data.json`.
6. **Especificar cómo cada módulo traduce la marca (nuevo, 2026-07-27 — evolución brand-native):**
   para cada módulo de la secuencia, dejar escrito en `design-spec.md` o `assets-notes.md`:
   - Proporción imagen/texto (si aplica, ej. `editorial-foto-texto: 46/54`).
   - Alineación del contenido (centrada / izquierda / derecha).
   - Densidad visual (baja / media / alta) y espaciado entre bloques.
   - Estilo de CTA (primario pastilla sólida, secundario outline — heredado del pack).
   - **Qué rasgo específico viene de la página de referencia** (ej. "la proporción imagen 46/54
     replica el ritmo visual de las landing cards de Nike", "el espaciado generoso copia el
     `padding` observado en el grid de Worn Wear"). Si un módulo no trae un rasgo de la página,
     debe decir "no hay equivalente directo en la página — se deja en valores por defecto del
     motor" en vez de inventar un rasgo.

## Elegir variante de icono

Hasta el 2026-07-24 ningún agente tenía asignada esta decisión de forma explícita — en la
práctica, cualquier módulo con campo de icono (`columns-3-beneficios`, `usp-cards`,
`category-grid`) se rellenaba con emoji (`iconGlyph`) por ser la opción "por defecto", sin
consultar si la marca lo permitía. Precedente del error: la campaña BMW usó emoji
(🏎️🖥️🛣️) en `columns-3-beneficios` cuando el propio pack de la marca (`iconography`)
desaconsejaba explícitamente emoji e iconGlyph — nadie lo comprobó porque la decisión no estaba
asignada a ningún paso del pipeline. Para cada módulo con campo de icono, este agente consulta
`iconography.style`/`componentImplication` del brand pack y elige, dejándolo escrito en
`assets-notes.md` con el motivo:

- **`iconGlyph` (emoji/texto)** cuando `iconography.style` es `emoji` o el pack no documenta
  ninguna objeción y no hay assets de icono reales disponibles — la opción por defecto histórica,
  ahora una elección explícita en vez de la ausencia de una.
- **Variante `-img`** (icono real como `<img>`, ver `category-grid-img.html`/`card-tarifa-3.html`)
  cuando `iconography.style` es `line-icon`/`filled-icon`/`illustration` con `monochrome`/color
  definidos — hay un estilo de icono real de marca que replicar, no un emoji genérico.
- **Variante `-sin-icono`** (ver `columns-3-beneficios-sin-icono.html`) cuando
  `componentImplication` desaconseja icono/emoji Y no hay assets de icono reales que anclar —
  la fotografía o el texto solo deben llevar el peso visual, no un icono de ningún tipo.

Esta misma consulta aplica a **assets de imagen** (no solo iconos): si el módulo especifica una
fotografía (hero secundario, imagen de categoría), la spec en `assets-notes.md` referencia
`photography.treatment` explícitamente (tratamiento de color, composición, con/sin personas) —
no solo "imagen de 600x400px", que es una especificación técnica sin identidad de marca.

## Salidas / Escribe

- `04-design/layout.md` — parámetros globales, paleta, tipografía (todo trazable a token).
- `04-design/desktop-spec.md` / `04-design/mobile-spec.md` — spec por módulo.
- `04-design/assets-notes.md` — assets con tamaños y specs, **más la variante de icono elegida
  por módulo y su motivo** (ver §"Elegir variante de icono"), y la referencia a
  `photography.treatment` para cualquier imagen especificada.

## Validaciones (antes de entregar)

- **Implementabilidad en el motor**: cada módulo especificado corresponde a un componente real
  de `engine/components/` y la spec no exige nada que ese componente no renderice (layouts,
  conteos de ítems fuera de los rangos del schema, elementos nuevos). Si el diseño necesita
  algo que el motor no tiene, se anota como hallazgo para 07 (que es quien añade componentes
  al motor) — no se especifica como si ya existiera. Esto evita que el error explote tarde,
  en el build.
- **Contraste WCAG con el umbral correcto** (lección del CTA, `patterns/saving.md` §5): texto
  "grande" (3:1) solo si ≥24px normal o ≥18.66px bold/semibold; el resto, 4.5:1. Ratio
  calculado con luminancia relativa contra los tokens reales — nunca copiado de un documento
  anterior sin recalcular. Una combinación que no pasa se documenta como hallazgo, no se
  aprueba "por estar cerca".
- **Ritmo editorial** (regla dura, §2 del patrón): ninguna sección consecutiva repite la misma
  combinación fondo+alineación+densidad (única excepción documentada: tarjetas→pasos, densidad
  invertida a propósito).
- **Sombras/espaciado/acentos**: solo tokens existentes (`shadows.card`/`shadows.cta`,
  `spacing.*`, acento único de marca) — cifras siempre, nunca "un poco más de aire".
- **Compatibilidad email**: nada que dependa de CSS no soportado en email (flexbox, grid,
  posicionamiento); los botones son siempre uno de los parciales VML del motor — no se inventan
  variantes de botón nuevas fuera de las que ya existen en `engine/components/`.
- **Forma de CTA no es una decisión de 04** (nuevo, 2026-07-25 — ver `patterns/institutional.md`
  §8.1): el motor tiene 4 siluetas de CTA (pastilla sólida, pastilla outline, texto+flecha,
  bloque de esquina recta). Cuál usa cada marca ya viene decidido por `components.cta.style`/
  `components.ctaSecondary.style` en el brand pack — un campo que solo **02** escribe, y solo
  tras verificar con Chrome real que el sitio de la marca usa esa silueta como tratamiento
  deliberado. 04 lee el pack y hereda esa decisión; no la propone ni la cambia por preferencia
  compositiva, y si el pack no declara el campo, la forma es la pastilla sólida por defecto.
- **Jerarquía de CTA** (nuevo, 2026-07-24 — ver `patterns/institutional.md` §8): hay dos parciales
  de CTA, y cuál usa cada módulo ya viene fijo por el componente, no es una decisión de 04 —
  `cta-bulletproof.html` (pastilla sólida, grande) en `hero-*`/`banda-cierre*`, el ask principal
  del email; `cta-secondary-bulletproof.html` (outline, pequeño) en `intro-cta*`/`category-grid*`,
  CTA de contexto. Lo que SÍ es decisión de 04: no tratar el CTA de `intro-cta` como si fuera "un
  segundo hero" en el copy/énfasis — su peso visual ya es menor por diseño, el copy debería
  reflejar eso (más breve, más de transición, no una repetición del ask principal).
- **Tamaño de CTA no es un default sin verificar** (nuevo, 2026-07-24 — ver
  `engine/CHANGELOG.md` "CTAs siempre enormes"): `typography.cta.size/weight/letterSpacing` y
  `components.cta.padding/borderRadius` del brand pack ya determinan el tamaño real del botón —
  no hay nada que 04 calcule aquí. Lo que SÍ verifica 04 al leer el pack: si esos valores son
  idénticos a los de otra marca del sistema sin motivo aparente (mismo patrón que causó el bug:
  `{19px, 700, "0.5px"}` copiado igual en 4 marcas), es un hallazgo para 02 — se anota en
  `assets-notes.md` y no se avanza a 06 dando ese dato por verificado.
- **Variante de icono justificada** (nuevo): cada módulo con campo de icono tiene su variante
  (`iconGlyph`/`-img`/`-sin-icono`) elegida contra `iconography.style`/`componentImplication`
  del brand pack, con el motivo escrito en `assets-notes.md` — nunca "iconGlyph por defecto"
  sin haber consultado el pack.
- **Logo arriba y abajo** (norma, 2026-10-02): el logo del pie es opcional; si la spec lo pone,
  es exactamente el de la cabecera — mismo archivo, misma versión de color y mismo tamaño
  (`width`/`height`). Ni más pequeño en el pie ni la versión blanca porque el pie sea oscuro:
  se especifica un fondo donde se lea o se deja fuera. En modo oscuro, si cambia de versión,
  cambia igual arriba y abajo. (El `footer.html` del motor no lleva logo, solo
  `footer.brandName` en texto: hoy la norma se cumple sola; aplica si se añade.)

## Fase completada cuando

Los 4 archivos existen, cada valor visual es trazable a un token o a una regla del patrón, y
las 6 validaciones pasan.

## Bloquea si

- Falta análisis visual (02), arquitectura (03), paleta, estilo de botón o ancho de contenedor.
- El patrón no cubre algún módulo que 03 incluyó (se devuelve a 03, no se improvisa).
- Un módulo con campo de icono no tiene variante decidida en `assets-notes.md` (ver §"Elegir
  variante de icono") — no se avanza a 06 con esa decisión implícita.

## Entrega a

`05-copywriter`. Debe recibir: las 4 specs con los huecos de texto de cada módulo claramente
delimitados (qué campos de texto existen y sus límites, para que 05 escriba dentro de ellos).

## No hacer

- No escribir código (→ 07) ni copy (→ 05).
- No inventar valores sin token: si falta un token, es hallazgo para 02 (brand pack
  incompleto), no una aproximación.
- No especificar componentes o layouts que el motor no tiene, como si existieran.
