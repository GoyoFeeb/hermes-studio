# 02 — Brand Visual Analyst

Base: fila `02` de `pipeline-skill/references/agent-roles.md` + fase 02 de `phase-gates.md`
(F2: brand pack como entregable de primera clase). Revisado 2026-07-22 ("Nivel 3" — investigación
profunda de marca pasa de flujo opcional a paso obligatorio, ver `engine/CHANGELOG.md`; revisión
anterior 2026-07-21 en `_archive/agents-backup-2026-07-21/`).

## Objetivo

Analizar la identidad visual **y de voz** del cliente y traducirla al brand pack que el motor
consumirá. Es el puente entre "cómo se ve y cómo suena la marca" y los `{{token:...}}` que
`engine/build-newsletter.js` resuelve — nada de lo que entrega es prosa suelta sin destino, y
nada se copia de la memoria del modelo cuando existe un sitio real que verificar.

## Entradas / Lee

`00-brief/brief.md`, `00-brief/requirements.md`, assets visuales aportados, landing pages del
cliente, guías de marca si existen. Si el cliente ya tiene brand pack, también su
`brand-tokens.json` actual (para actualizarlo, no recrearlo).

## Investigación profunda de marca (OBLIGATORIA — ver §"Válvula de escape" si no es posible)

Hasta el 2026-07-21 este agente trataba el análisis con navegador real como un flujo opcional
("Hero de marca — opcional", más abajo). Desde el 2026-07-22 es el paso estándar, no una mejora
aspiracional: **si el cliente tiene un sitio web real, este agente lo navega con Chrome antes de
escribir un solo valor en el brand pack.** Referencia de profundidad exigida:
`PROMPT-OPTICA2000-HERMES.md` §"Marca: ÓPTICA 2000 — análisis YA hecho (con Chrome real)" — esa
tabla (colores computados, tipografía computada, logos reales, CTA real, dirección legal real,
redes reales) es el nivel mínimo de rigor para las 4 dimensiones siguientes:

1. **Color y tipografía computados** (ya exigido desde antes, ahora formalizado aquí):
   `getComputedStyle` real sobre los elementos que importan (H1, CTA, fondos, texto de cuerpo) —
   nunca "a ojo" desde una captura de pantalla. Herramienta: Claude in Chrome MCP
   (`navigate`/`computer`/`javascript_tool`) o `npm run capture-brand-site -- --brand {slug}
   --url {web}`. Anotar SIEMPRE si la fuente web observada es segura en email (Arial/Helvetica/
   Georgia/Times/Verdana/Trebuchet/Courier) o no (Futura, Roboto, cualquier fuente cargada por
   `@font-face`/Google Fonts) — si no es segura, el pack usa el fallback system-safe y lo dice
   explícitamente (ver `typography.family` de Óptica 2000: Futura/Roboto observadas, Arial
   usada).

   **El CTA en concreto lleva su propio sub-checklist, no basta con "verlo" dentro del barrido
   general de tipografía** (fix 2026-07-24, ver `engine/CHANGELOG.md` "CTAs siempre enormes" —
   el precedente del error: 4 de 8 brand packs reales tenían `typography.cta` idéntico byte a
   byte entre sí — `{size:19, weight:700, letterSpacing:"0.5px"}` — porque "CTA" se investigaba
   como una casilla más del barrido de color/tipografía en vez de como su propio elemento con
   propiedades propias; el motor encima lo tenía hardcodeado e ignoraba el token, así que el
   dato incorrecto nunca se notó en ningún render). Sobre el botón CTA principal real del sitio
   (`getComputedStyle` del `<a>`/`<button>` real, no de un contenedor genérico), registrar los 5
   valores por separado y explícitamente:
   - `fontSize` → `typography.cta.size`
   - `fontWeight` → `typography.cta.weight`
   - `letterSpacing` → `typography.cta.letterSpacing`
   - `padding` (los 4 lados, o al menos top/left si son simétricos) → `components.cta.padding`
   - `borderRadius` → `components.cta.borderRadius` / `radius.ctaPill` (**verificar si es
     realmente una pill — muchas marcas usan un botón cuadrado o semi-redondeado; no asumir 50
     "porque así se ve premium"**, ver Adeslas/Óptica 2000: `border-radius:0px` real, cuadrado)
   - **Silueta del CTA** (nuevo, 2026-07-25 — ver `patterns/institutional.md` §8.1 y
     `engine/components/INVENTORY.md`): además de los 5 valores numéricos de arriba, observar la
     FORMA del botón real — ¿pastilla/botón sólido (el default), texto plano subrayado sin
     cápsula, o bloque sólido de esquina recta? Solo si el sitio real muestra de forma inequívoca
     una de las dos siluetas no-pastilla como tratamiento deliberado (no un botón con
     `border-radius` bajo, que sigue siendo pastilla), escribir `"text-link"` o `"block"` en
     `components.cta.style` (y `components.ctaSecondary.style` si aplica al CTA de contexto). Sin
     esa evidencia inequívoca, no se escribe el campo — el motor usa pastilla sólida por defecto.
     Precedente de lo que NO justifica el campo: Nike, BMW y Worn Wear se verificaron con Chrome
     real en la ronda del 2026-07-25 y las 3 usan pastilla/botón sólido real, pese a tener
     identidad visual minimalista — "la marca se ve plana" no es evidencia de CTA de texto.
2. **Tratamiento fotográfico** (nuevo, Nivel 3): observar cómo usa la marca la fotografía en su
   propio sitio — ¿fotografía real de personas/producto, o ilustración, o sin fotografía? ¿Qué
   tratamiento de color (cálido/frío, saturado/desaturado, alto o bajo contraste)? ¿Composición
   (primeros planos, planos abiertos, con o sin personas, con o sin texto superpuesto)? Esto
   alimenta el prompt de `npm run generate-hero-image` cuando la marca use `hero-imagen` — un
   hero generado que no respeta el tratamiento fotográfico real de la marca es exactamente el
   problema que motivó "subir de nivel" la identidad visual (ver `engine/CHANGELOG.md`, Nivel 1).
   Escribir en `photography.treatment` del pack (ver estructura abajo).
3. **Estilo de iconografía** (nuevo, Nivel 3): ¿la marca usa iconos de línea, iconos rellenos,
   ilustraciones, o directamente nunca usa iconos (solo fotografía/texto)? ¿Monocromo o a color?
   Esta observación decide directamente qué componente usar en `campaign-data.json`: si la marca
   usa iconografía gráfica real, el módulo correspondiente necesita su variante `-img` (icono
   como `<img>`, ver `category-grid-img.html`/`card-tarifa-3.html`) en vez de la variante con
   icono-emoji (ver `iconGlyph` en el schema) — decisión ya tomada así para Óptica 2000 (su
   brief prohibía emojis explícitamente) pero que antes se resolvía por instrucción puntual del
   brief, no por una observación de marca capturada en el pack. Escribir en `iconography.style`.
4. **Ritmo de voz** (nuevo, Nivel 3): más allá de `voice.tone` (adjetivos sueltos, ej. "cercano,
   profesional"), observar CÓMO escribe la marca en su propio sitio/redes: longitud media de
   frase (corta y directa vs. larga y explicativa), uso de imperativo vs. pregunta vs.
   afirmación, puntuación (uso de exclamaciones, guiones, mayúsculas para énfasis), nivel de
   formalidad real (tuteo/usted, contracciones). Capturar 2-3 frases REALES del sitio como
   ejemplo (no inventadas) en `voice.rhythm.examples`. Esto alimenta al agente 05 (Copy) para
   que el copy de la newsletter suene a la marca y no a un tono genérico de "email marketing".
5. **Ritmo estructural de la página real** (nuevo, 2026-07-24 — fix al hallazgo de la campaña
   BMW, ver `engine/CHANGELOG.md`): las 4 dimensiones anteriores capturan identidad VISUAL
   (color, foto, iconos, voz), pero hasta ahora ninguna capturaba identidad ESTRUCTURAL — cuántos
   bloques de contenido tiene realmente la página de referencia, en qué orden, y si se apoyan en
   fotografía, en grids de producto/categoría, o en texto explicativo largo. Sin esto, 03 elegía
   patrón "por defecto" (casi siempre `institutional`) en vez de por evidencia, y el resultado se
   sentía como plantilla aunque cada color/fuente fuera correcto. Observar, sobre la MISMA página
   ya visitada para las 4 dimensiones anteriores (normalmente la landing/ficha de producto que
   también servirá de referencia para `hero-imagen`):
   - **Nº de secciones de contenido reales** (no de navegación/footer/menú) y qué tipo es cada
     una: hero fotográfico, bloque editorial (foto+titular+párrafo corto), grid de
     productos/categorías, tabla de datos/precios, testimonios, formulario. Un ancla de
     navegación in-page (`#section`) suele delimitar cada bloque real — útil para contar.
   - **Peso relativo de fotografía vs. texto vs. iconos** en esos bloques: ¿la fotografía ocupa
     la mayoría del espacio y el texto es breve (titular corto + 1 párrafo), o el texto/los datos
     dominan (fichas técnicas, tablas de precios, comparativas)?
   - **Qué partes son traducibles a un email** y cuáles no: configuradores, tablas de
     financiación o calculadoras interactivas NO se traducen — se documenta que existen pero se
     excluyen, no se intenta replicar su densidad de datos en el email.
   Esto alimenta directamente la elección de patrón de 03 (ver `03-newsletter-architect.md`
   §"Elegir el patrón de género" y `patterns/fotografia-primero.md` §6) — antes esa elección no
   tenía ninguna evidencia real que consultar más allá de "esto no es una campaña de ahorro,
   así que `institutional`". Escribir en `layout.contentRhythm` del pack (ver estructura abajo).
   6. **Estructura de marca traducible (nuevo, 2026-07-27 — evolución brand-native):** además de
      `layout.contentRhythm` (qué secciones tiene la página), este agente debe crear
      `layout.brandStructure` en el brand pack — un análisis de la COMPOSICIÓN real de la página
      que captura qué hace que la estructura de esa marca sea distinta de cualquier otra. Esto
      alimenta directamente a 03 para que no pueda elegir la secuencia por defecto sin justificarla,
      y al gate `check-structural-differentiation` para verificar que la newsletter no es una copia
      genérica. Estructura:

   ```json
   "brandStructure": {
     "compositionArchetype": "editorial-foto-texto | producto-cinematico | grid-catalogo | comparador | institucional-denso",
     "signatureSections": [
       {
         "sourceSection": "hero / bloque editorial / ficha producto / grid / specs",
         "visualPattern": "foto-full / foto-texto / texto-foto / columnas / lista editorial",
         "emailTranslation": "hero-imagen / editorial-foto-texto / columns-3-beneficios-sin-icono / etc.",
         "why": "motivo basado en la página real — qué hace que esta sección sea única de esta marca"
       }
     ],
     "mustAvoid": ["bloques genéricos que contradicen la marca"],
     "source": "URL observada + fecha"
   }
   ```

Estructura de las 3 secciones nuevas en `brand-tokens.json` (además de las ya existentes —
`colors`, `typography`, `spacing`, `radius`, `shadows`, `surfaces`, `components`, `layout`,
`darkMode`, `assets`, `voice`, `_changelog`) — y el nuevo campo `layout.contentRhythm`:

```json
"photography": {
  "usesRealPhotography": true,
  "treatment": "descripción observada: cálido/frío, saturación, composición...",
  "source": "observado en {URL} el {fecha}",
  "note": "si la marca NO usa fotografía (solo ilustración/color plano), decirlo aquí explícitamente — no es un hueco, es un hecho de marca"
},
"iconography": {
  "style": "line-icon | filled-icon | illustration | emoji | none",
  "monochrome": true,
  "source": "observado en {URL} el {fecha}",
  "componentImplication": "qué variante de componente usar (ver engine/components/INVENTORY.md — sufijo -img vs iconGlyph)"
},
"voice": {
  "tone": "... (ya existente)",
  "rhythm": {
    "sentenceLength": "corta/directa | larga/explicativa",
    "mode": "imperativo | pregunta | afirmación",
    "formality": "tú | usted",
    "punctuationHabits": "...",
    "examples": ["frase real 1 del sitio", "frase real 2 del sitio"],
    "source": "observado en {URL} el {fecha}"
  }
}
```

Y dentro del bloque `layout` ya existente (`sectionStyle`, `reason`), el nuevo campo:

```json
"layout": {
  "sectionStyle": "centrado | asimetrico",
  "reason": "... (ya existente)",
  "contentRhythm": {
    "realSectionCount": 0,
    "sections": [
      { "type": "hero-fotografico | editorial-foto-texto | grid-producto | tabla-datos | testimonios | formulario", "translatable": true, "note": "breve descripción de qué hay y si se traduce al email" }
    ],
    "photographyWeight": "dominante | equilibrada | secundaria | nula",
    "iconDensity": "nula | baja | media | alta",
    "source": "observado en {URL} el {fecha}"
  }
}
```

### Válvula de escape (documentada, no silenciosa)

Si el cliente no tiene sitio web propio, o el sitio es inaccesible (JS bloqueado, requiere
login, etc.), este agente **no bloquea la entrega solo por eso** — pero debe dejarlo dicho en el
`_changelog` del pack, con la misma disciplina que ya existe para `[Q-NNN]`: qué se intentó, por
qué no fue posible, y qué placeholder/inferencia se usó en su lugar. Lo que NO está permitido es
omitir las 3 secciones nuevas en silencio o rellenarlas con una suposición sin marcarla como tal.
Precedente: `brands/uax/tokens/brand-tokens.json` ya declara explícitamente en su `_changelog`
qué no se investigó y por qué (`typography.displayFont` limitación heredada) — mismo criterio.

## Tareas

1. Documentar identidad, paleta, tipografía, botones, composición → archivos de análisis.
2. Investigación profunda de marca (ver arriba) — color/tipografía computados, tratamiento
   fotográfico, iconografía, ritmo de voz, ritmo estructural de la página real.
3. Evaluar riesgos de adaptación a email (fondos, fuentes no web-safe, degradados...) → `risks.md`.
4. Crear o actualizar el brand pack (ver Salidas), anotando la procedencia de cada valor.

Nota de secuencia: este agente corre ANTES de que 03 decida si la campaña usa `hero-imagen` (esa
decisión es de 03, ver `03-newsletter-architect.md` §"Elegir hero"). Por eso este agente no
genera el arte del header — solo deja lista la materia prima que ese paso necesitará
(`photography.treatment` de la tarea 2). Quien ejecuta la generación real, más adelante en el
pipeline y con la decisión de 03 ya tomada, es 06 (ver `06-data-specialist.md` §"Generar el arte
del hero" — es la tarea que rompe con el precedente de `2026-jul-tarifalo-compara-luz`, donde
`hero-imagen` nunca se consideró porque ningún agente lo tenía documentado como opción real).

## Salidas / Escribe

- `02-analysis/brand-analysis.md` — identidad de marca.
- `02-analysis/visual-analysis.md` — colores, tipografía, botones, composición.
- `02-analysis/risks.md` — riesgos de adaptación a email.
- **`brands/{cliente}/tokens/brand-tokens.json`** — entregable de primera clase. Estructura de
  referencia: `brands/uax/tokens/brand-tokens.json` (v2.2.0, es la más reciente y completa) o
  la plantilla `newsletters/2026/newsletter-system/brands/_template/tokens/brand-tokens.json`
  (`colors`, `typography`, `spacing`, `radius`, `shadows`, `surfaces`, `components`, `layout`,
  `photography`, `iconography`, `darkMode`, `personalization`, `utm`, `assets`, `voice`,
  `_changelog`). Actualizaciones SIEMPRE con entrada en `_changelog`.
  - Ubicación: `brands/{cliente}/...` en la raíz de `sistema-final/` — única ubicación válida
    para todos los brand packs, incluido Para y Compara (unificado 2026-07-28, auditoría
    técnica: antes vivía en `newsletters/2026/newsletter-system/brands/paraycompara/`, un
    prototipo previo del sistema; `engine/lib/tokens.js` ya no tiene ninguna ruta de fallback).

## Validaciones (antes de entregar)

- `brand-tokens.json` es JSON parseable (`node -e "JSON.parse(...)"` o equivalente) y su
  `version` sube según semver si hubo cambios.
- Cada valor visual del pack lleva su procedencia en una de 3 categorías: **documentado**
  (guía formal), **observado** (medido de un asset/landing real, indicando cuál), **inferido**
  (marcado como tal, candidato a `[Q-NNN]`).
- La paleta cubre como mínimo lo que los componentes del motor consumen: `colors.primary`,
  fondo de secciones, color de CTA, colores de texto sobre claro y sobre marca (ver los
  `{{token:...}}` reales en `engine/components/INVENTORY.md`).
- Ningún color/fuente/estilo inventado: un valor sin fuente es `[Q-NNN]`, no una aproximación.
- **`photography`, `iconography`, `voice.rhythm` y `layout.contentRhythm` existen en el pack** —
  con datos reales observados, o con la válvula de escape documentada en `_changelog` si no fue
  posible.
- **Autocomprobación cruzada contra otro brand pack real** (nuevo, 2026-07-24 — mismo caso que
  motivó el sub-checklist de CTA arriba): antes de entregar, comparar los valores numéricos
  nuevos (`typography.cta`, `spacing.*`, `radius.*`, tamaños de `h1Hero`/`h2Section`/`body`)
  contra al menos un brand pack real ya existente (`brands/*/tokens/brand-tokens.json`). Una
  coincidencia exacta ocasional es posible (dos marcas pueden compartir de verdad un tamaño de
  fuente), pero **una coincidencia exacta en 4-5 valores numéricos distintos a la vez, sin haber
  verificado ambos sitios el mismo día, es la señal de que uno de los dos packs es una plantilla
  sin investigar, no una casualidad de marca** — repórtalo como hallazgo en el `_changelog` propio
  aunque no sea esta ronda la que lo corrija (igual que la válvula de escape de `[Q-NNN]`: se
  declara, no se disimula).

## Fase completada cuando

Los 3 análisis + el brand pack existen, las validaciones pasan (incluida la investigación
profunda de marca — las 5 dimensiones, bloqueante salvo válvula de escape documentada), y todo
valor del pack es trazable a documentado/observado/inferido.

## Bloquea si

- No hay inputs visuales de ningún tipo.
- El cliente/marca no es identificable.
- Contradicciones visuales irreconciliables sin fuente que desempate.
- Falta la paleta de color o el estilo de botón (sin ellos no hay brand pack utilizable).
- El cliente SÍ tiene sitio web accesible y este agente no lo navegó con Chrome real antes de
  escribir el brand pack (Nivel 3, bloqueante — no aplica si la válvula de escape documentada
  justifica por qué no fue posible).

## Hero con arte generado — quién hace qué

`hero-imagen` (variante híbrida: arte de IA sin texto + titular/CTA en HTML del motor) es una
opción real de estructura, no un script suelto. Reparto de responsabilidades entre agentes (fix
2026-07-22 al precedente `2026-jul-tarifalo-compara-luz`, donde `hero-imagen` nunca se consideró
porque no estaba documentado como opción en ningún contrato de agente):

- **Este agente (02):** investiga y deja en el pack `photography.treatment` (tarea 2) — la
  materia prima que alimentará el prompt de generación. No ejecuta el script (corre antes de que
  exista la decisión de estructura).
- **03 (newsletter-architect):** decide SI esta campaña usa `hero-imagen` — ver
  `03-newsletter-architect.md` §"Elegir hero".
- **06 (data-specialist):** si 03 eligió `hero-imagen`, ejecuta `generate-hero-image` como parte
  de su propio flujo (ya tiene el `cta.href` real de la campaña a mano) — ver
  `06-data-specialist.md` §"Generar el arte del hero (si el componente es `hero-imagen`)" para el
  comando exacto y el reparto de qué se automatiza y qué sigue siendo manual (subida al CDN).

## Hero de marca (Claude design — opcional, marcas nuevas)

Si la marca es nueva y quiere un hero propio (más allá de las variantes genéricas del motor),
este agente invoca el flujo de diseño con Claude — en tiempo de diseño de marca, NUNCA
escribiendo HTML a mano:

1. `npm run capture-brand-site -- --brand {slug} --url {web del cliente}` (requiere red)
2. `npm run generate-hero -- --brand {slug}` (requiere ANTHROPIC_API_KEY)
3. `npm run validate-hero -- --brand {slug} --accept` — si la validación falla, se regenera o
   se queda con hero-centrado; JAMÁS se edita el candidato a mano para que pase.

El hero aceptado (`hero-marca-{slug}`) se usa en `campaign-data.json` con el mismo contrato de
datos que `hero-centrado`. La revisión visual final la hace 08 en la primera campaña que lo use.

## Entrega a

`03-newsletter-architect`. Debe recibir: los 3 análisis + la ruta exacta del brand pack (que
06 escribirá en el campo `brand` de `campaign-data.json` tal cual).

## No hacer

- Nunca inventar colores, fuentes o estilos.
- Nunca inventar tratamiento fotográfico, estilo de iconografía, ejemplos de ritmo de voz o
  ritmo estructural de página — si no se navegó el sitio real, se usa la válvula de escape
  documentada, nunca una suposición sin marcar.
- Nunca tocar los componentes del motor ni `patterns/` — si la marca necesita algo que el
  motor no soporta, se anota como hallazgo para 03/07, no se resuelve aquí.
- Nunca sobrescribir un brand pack existente sin entrada de `_changelog`.
