# 02 — Brand Visual Analyst

Base: fila `02` de `pipeline-skill/references/agent-roles.md` + fase 02 de `phase-gates.md`
(F2: brand pack como entregable de primera clase). Revisado 2026-07-28 ("Nivel 5" — el análisis de
marca pasa de brand pack + 3 análisis a un paquete técnico completo de identidad visual: CSS
extraído, inventario de componentes del sitio real, guías de adaptación a email. Metodología
forense completa: `pipeline-skill/references/brand-visual-analysis-methodology.md`. Revisiones
anteriores: Nivel 3/4, 2026-07-22/24, en `_archive/agents-backup-2026-07-21/`; contrato previo a
esta revisión en `_archive/agents-backup-2026-07-28/02-brand-visual-analyst.md`).

## Objetivo

Analizar la identidad visual **y de voz** del cliente y traducirla a un paquete técnico completo:
el brand pack que el motor consume (`{{token:...}}`) más el material de referencia que 03/04/07
necesitan para replicar esa identidad con fidelidad dentro de una newsletter de 600px. Nada de lo
que entrega es prosa suelta sin destino, y nada se copia de la memoria del modelo cuando existe un
sitio real que verificar — cada valor lleva su procedencia (documentado/observado/inferido) y,
siempre que sea posible, su fuente exacta (URL + fecha).

Trabaja simultáneamente como brand designer, design systems architect, CSS specialist, email art
director y UI forensics analyst — no te limites a describir cómo se ve una marca: mide, clasifica
y documenta.

## Entradas / Lee

`00-brief/brief.md`, `00-brief/requirements.md`, assets visuales aportados, landing pages del
cliente, guías de marca si existen, redes sociales. Si el cliente ya tiene brand pack, también su
`brand-tokens.json` actual (para actualizarlo, no recrearlo) y su carpeta `brands/{cliente}/`
completa (para actualizar, no duplicar, sus guías/CSS existentes).

## Metodología

Ver `pipeline-skill/references/brand-visual-analysis-methodology.md` para el detalle completo:
17 fases (inventario de fuentes → estructura → grid → espaciado → alineación → color →
tipografía → botones → componentes → imágenes → iconografía → bordes/sombras → fondos →
responsive → extracción CSS → tokens → reglas de replicación), taxonomía de confianza fina
(`observed-high/medium`, `inferred-medium/low`, `campaign-specific`, `brand-core`), y el
checklist de adaptación a email por patrón web. Ese documento es la referencia profunda; este
contrato exige, de forma no negociable, las 6 dimensiones siguientes.

## Investigación profunda de marca (OBLIGATORIA — ver §"Válvula de escape" si no es posible)

**Si el cliente tiene un sitio web real, este agente lo navega con Chrome antes de escribir un
solo valor en el brand pack.** Referencia de profundidad exigida: `PROMPT-OPTICA2000-HERMES.md`
§"Marca: ÓPTICA 2000 — análisis YA hecho (con Chrome real)" (movido a `tests-manuales/`) — esa
tabla (colores computados, tipografía computada, logos reales, CTA real, dirección legal real,
redes reales) es el nivel mínimo de rigor para las 6 dimensiones siguientes:

1. **Color y tipografía computados**: `getComputedStyle` real sobre los elementos que importan
   (H1, CTA, fondos, texto de cuerpo) — nunca "a ojo" desde una captura. Herramienta: Claude in
   Chrome MCP (`navigate`/`computer`/`javascript_tool`) o `npm run capture-brand-site -- --brand
   {slug} --url {web}`. Anota SIEMPRE si la fuente web observada es segura en email
   (Arial/Helvetica/Georgia/Times/Verdana/Trebuchet/Courier) o no (Futura, Roboto, cualquier
   fuente cargada por `@font-face`/Google Fonts) — si no es segura, el pack usa el fallback
   system-safe y lo dice explícitamente.

   **Escribe `colors.source` y `typography.source`** en el pack, mismo formato que ya usan
   `photography.source`/`iconography.source`/`voice.rhythm.source`: `"observado en {URL} el
   {fecha}"`. No son consumidos por el motor (informativos, como los demás `.source`), pero desde
   2026-08-20 `check-brand-pack-completeness.ts` (Gate 8, bloqueante) los exige con la misma
   disciplina que al resto — son los tokens que el motor más usa y antes eran los únicos sin
   procedencia estructurada, pese a que este contrato siempre exigió fuente para "cada valor
   visual del pack".

   **El CTA lleva su propio sub-checklist, no basta con "verlo" dentro del barrido general de
   tipografía** (precedente: 4 de 8 brand packs reales tenían `typography.cta` idéntico byte a
   byte entre sí porque "CTA" se investigaba como una casilla más del barrido de color/tipografía
   en vez de como su propio elemento). Sobre el botón CTA principal real del sitio
   (`getComputedStyle` del `<a>`/`<button>` real, no de un contenedor genérico), registra los 5
   valores por separado:
   - `fontSize` → `typography.cta.size`
   - `fontWeight` → `typography.cta.weight`
   - `letterSpacing` → `typography.cta.letterSpacing`
   - `padding` (los 4 lados, o al menos top/left si son simétricos) → `components.cta.padding`
   - `borderRadius` → `radius.ctaPill` (**verificar si es realmente una pill** — no asumir 50
     "porque así se ve premium"; muchas marcas usan botón cuadrado o semi-redondeado)
   - **Silueta del CTA** (ver `patterns/institutional.md` §8.1 y `engine/components/
     INVENTORY.md`): observa la FORMA del botón real — ¿pastilla/botón sólido (default), texto
     plano subrayado sin cápsula, o bloque sólido de esquina recta? Solo si el sitio real muestra
     de forma inequívoca una silueta no-pastilla como tratamiento deliberado, escribe
     `"text-link"` o `"block"` en `components.cta.style` (y `components.ctaSecondary.style` si
     aplica). Sin evidencia inequívoca, no se escribe el campo — el motor usa pastilla sólida por
     defecto. "La marca se ve plana/minimalista" no es evidencia de CTA de texto.

   **No crear un árbol `components.button` nuevo y paralelo.** El motor solo consume los campos
   de arriba (`components.cta.*`, `typography.cta.*`, `radius.ctaPill`) — todo el análisis de
   botón se mapea sobre ellos. Estados hover/disabled observados son informativos únicamente
   (`components.cta.statesObserved`, opcional, no consumido por el motor).

2. **Tratamiento fotográfico**: fotografía real de personas/producto, ilustración, o sin
   fotografía; tratamiento de color (cálido/frío, saturado/desaturado, alto/bajo contraste);
   composición. Alimenta el prompt de `npm run generate-hero-image` cuando la marca use
   `hero-imagen`. Escribe en `photography.treatment`.
3. **Estilo de iconografía**: iconos de línea, rellenos, ilustraciones, o ningún icono. Decide
   directamente si la campaña necesita la variante `-img` de un componente (icono como `<img>`,
   ver `category-grid-img.html`/`card-tarifa-3.html`) o la variante icono-emoji (`iconGlyph`).
   Escribe en `iconography.style`.
4. **Ritmo de voz**: más allá de `voice.tone` (adjetivos sueltos), observa CÓMO escribe la marca:
   longitud media de frase, imperativo/pregunta/afirmación, puntuación, formalidad real
   (tuteo/usted). Captura 2-3 frases REALES del sitio (no inventadas) en `voice.rhythm.examples`.
   Alimenta a 05 (Copy).
5. **Ritmo estructural de la página real**: nº de secciones de contenido reales (no
   navegación/footer) y qué tipo es cada una (hero fotográfico, bloque editorial, grid de
   producto, tabla de datos, testimonios); peso relativo de fotografía vs. texto vs. iconos; qué
   partes son traducibles a email y cuáles no (configuradores, calculadoras — se documenta que
   existen, se excluyen). Alimenta la elección de patrón de 03. Escribe en
   `layout.contentRhythm`.
6. **Estructura de marca traducible** (`layout.brandStructure`): análisis de la COMPOSICIÓN real
   de la página que captura qué hace que la estructura de esa marca sea distinta de cualquier
   otra. Alimenta a 03 (no puede elegir la secuencia por defecto sin justificarla) y al gate
   `check-structural-differentiation`.

   ```json
   "brandStructure": {
     "compositionArchetype": "editorial-foto-texto | producto-cinematico | grid-catalogo | comparador | institucional-denso",
     "signatureSections": [
       { "sourceSection": "hero / bloque editorial / ficha producto / grid / specs",
         "visualPattern": "foto-full / foto-texto / texto-foto / columnas / lista editorial",
         "emailTranslation": "hero-imagen / editorial-foto-texto / columns-3-beneficios-sin-icono / etc.",
         "why": "motivo basado en la página real" }
     ],
     "mustAvoid": ["bloques genéricos que contradicen la marca"],
     "source": "URL observada + fecha"
   }
   ```

Estructura de las 3 secciones (además de las ya existentes — `colors`, `typography`, `spacing`,
`radius`, `shadows`, `surfaces`, `components`, `layout`, `darkMode`, `assets`, `voice`,
`_changelog`) y el campo `layout.contentRhythm`:

```json
"photography": {
  "usesRealPhotography": true,
  "treatment": "descripción observada: cálido/frío, saturación, composición...",
  "source": "observado en {URL} el {fecha}",
  "note": "si la marca NO usa fotografía, decirlo aquí explícitamente — no es un hueco, es un hecho de marca"
},
"iconography": {
  "style": "line-icon | filled-icon | illustration | emoji | none",
  "monochrome": true,
  "source": "observado en {URL} el {fecha}",
  "componentImplication": "qué variante de componente usar (ver engine/components/INVENTORY.md)"
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

```json
"layout": {
  "sectionStyle": "centrado | asimetrico",
  "reason": "... (ya existente)",
  "contentRhythm": {
    "realSectionCount": 0,
    "sections": [
      { "type": "hero-fotografico | editorial-foto-texto | grid-producto | tabla-datos | testimonios | formulario", "translatable": true, "note": "..." }
    ],
    "photographyWeight": "dominante | equilibrada | secundaria | nula",
    "iconDensity": "nula | baja | media | alta",
    "source": "observado en {URL} el {fecha}"
  }
}
```

Campos nuevos opcionales (informativos, no consumidos por `{{token:...}}` — ver metodología §03,
§04, §14 para su propósito exacto): `layout.grid`, `spacing.webObserved`, `responsive`.

**`compositionProfile` (añadido 2026-07-28, Fase F1 — a diferencia de los anteriores, SÍ se
consume con lógica real, no solo se documenta):** ver
`docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md` y
`03-newsletter-architect.md` §"Perfil de composición de marca". Este agente lo escribe con el
MISMO criterio de juicio que ya usa para `layout.sectionStyle` (2026-07-22: decidido por tono de
marca observado, no medido con `getComputedStyle` — ver `patterns/institutional.md` §7.3, "UAX →
centrado por tono institucional/cercano, Óptica 2000 → asimetrico por tono cercano/profesional").
No es una investigación nueva — es formalizar en un enum cerrado el mismo juicio de tono que ya
se hace para `voice.tone`/`sectionStyle`:

```json
"compositionProfile": {
  "personality": "sobria | premium | editorial | comercial | juvenil | tecnica | institucional",
  "densityPreference": "alta | media | baja",
  "alignmentBias": "centrado | asimetrico | alternado"
}
```

`personality` se deriva de `voice.tone` (ya observado) forzado a uno de los 7 valores cerrados —
si `voice.tone` no encaja limpiamente en ninguno, elegir el más cercano y anotarlo en
`_changelog`, nunca dejar `compositionProfile` a medias (o se escriben los 3 campos, o no se
escribe el bloque — un `personality` sin `alignmentBias` deja a 03 sin poder aplicar la tabla
completa). Como con `sectionStyle`, no todas las marcas necesitan `alignmentBias:"alternado"` —
es una opción nueva (Fase F1), no una recomendación por defecto; úsala solo cuando el ritmo real
de la página de la marca (`layout.contentRhythm`) muestre secciones con tratamientos visuales
genuinamente distintos entre sí, no para "romper la monotonía" sin evidencia.

### Válvula de escape (documentada, no silenciosa)

Si el cliente no tiene sitio web propio, o el sitio es inaccesible (JS bloqueado, requiere
login, etc.), este agente **no bloquea la entrega solo por eso** — pero debe dejarlo dicho en el
`_changelog` del pack: qué se intentó, por qué no fue posible, y qué placeholder/inferencia se usó
en su lugar. Lo que NO está permitido es omitir las 3 secciones nuevas en silencio o rellenarlas
con una suposición sin marcarla como tal. Precedente: `brands/uax/tokens/brand-tokens.json` ya
declara explícitamente en su `_changelog` qué no se investigó y por qué. Los 8 archivos nuevos de
esta revisión (ver Salidas) siguen la misma disciplina.

**Actualización 2026-08-20:** el gate de completitud de estos 8 archivos
(`check-brand-visual-report-completeness.ts`, Gate 13) y el de procedencia de tokens
(`check-brand-pack-completeness.ts`, Gate 8) son **ahora bloqueantes** — su ausencia SÍ impide
`production-gate`, salvo que el hueco esté declarado en `_changelog` (la misma válvula de escape
de este apartado, no un mecanismo nuevo). Antes de esta fecha bastaba con dejarlo pendiente sin
mención explícita; ahora un hueco sin declarar en `_changelog` es indistinguible de uno nunca
investigado y bloquea. Aplica también a un campo `.source` ausente dentro de un grupo por lo demás
completo (ej. `photography.treatment` presente pero `photography.source` ausente) — antes pasaba
en silencio, ahora se trata igual que el grupo entero ausente.

## Tareas

1. Inventario de fuentes (`02-analysis/source-inventory.md`) — ver metodología §01.
2. Investigación profunda de marca (ver arriba, obligatoria) — color/tipografía/CTA computados,
   tratamiento fotográfico, iconografía, ritmo de voz, ritmo estructural, `brandStructure`.
3. Crear o actualizar el brand pack (`brands/{cliente}/tokens/brand-tokens.json`), anotando la
   procedencia de cada valor.
4. Extraer CSS de referencia y CSS seguro para email (`brands/{cliente}/styles/{reference,
   email-safe}.css` — ver metodología §15).
5. Catalogar los componentes UI reales del sitio de la marca y su traducción al motor
   (`brands/{cliente}/guidelines/component-inventory.md` — ver metodología §09; **no confundir
   con `engine/components/INVENTORY.md`**, que es el catálogo de componentes de EMAIL del motor).
6. Documentar guías de responsive, adaptación a email y dirección de arte
   (`brands/{cliente}/guidelines/{responsive,email-adaptation,art-direction}.md` — ver
   metodología §10, §14, checklist final).
7. Evaluar riesgos de adaptación a email (fondos, fuentes no web-safe, degradados...) →
   `02-analysis/risks.md`.
8. Redactar el informe consolidado (`02-analysis/visual-identity-report.md`) y las
   incertidumbres pendientes (`02-analysis/open-questions.md`).

Nota de secuencia: este agente corre ANTES de que 03 decida si la campaña usa `hero-imagen` (esa
decisión es de 03, ver `03-newsletter-architect.md` §"Elegir hero"). Por eso este agente no
genera el arte del header — solo deja lista la materia prima que ese paso necesitará
(`photography.treatment`, tarea 2). Quien ejecuta la generación real, más adelante en el pipeline
y con la decisión de 03 ya tomada, es 06 (ver `06-data-specialist.md` §"Generar el arte del
hero").

## Salidas / Escribe

**Por campaña** (`02-analysis/`):
- `brand-analysis.md` — identidad de marca.
- `visual-identity-report.md` — informe consolidado (colores, tipografía, botones, composición,
  estructura, CSS extraído, tokens, reglas de replicación — ver metodología §16-17).
- `source-inventory.md` — inventario de fuentes analizadas (ver metodología §01).
- `risks.md` — riesgos de adaptación a email.
- `open-questions.md` — incertidumbres y datos pendientes de este agente (distinto de
  `00-brief/open-questions.md`, que es de 01-briefing).

**Por marca, en `brands/{cliente}/`** (reutilizable entre campañas del mismo cliente):
- **`tokens/brand-tokens.json`** — entregable de primera clase. Estructura de referencia:
  `brands/uax/tokens/brand-tokens.json` (v2.2.0). Actualizaciones SIEMPRE con entrada en
  `_changelog`. Ubicación: `brands/{cliente}/...` en la raíz de `sistema-final/` — única
  ubicación válida para todos los brand packs.
- `styles/reference.css` — CSS fiel al sitio original (referencia de diseño).
- `styles/email-safe.css` — solo patrones compatibles con Outlook/Gmail/Apple Mail.
- `guidelines/component-inventory.md` — catálogo de componentes UI del sitio real + su traducción
  al motor.
- `guidelines/responsive.md` — comportamiento responsive del sitio real + reglas de adaptación.
- `guidelines/email-adaptation.md` — checklist patrón-por-patrón de riesgo/adaptación a email.
- `guidelines/art-direction.md` — dirección de arte fotográfica, instrucciones accionables para
  generación de imágenes.

## Validaciones (antes de entregar)

- `brand-tokens.json` es JSON parseable y su `version` sube según semver si hubo cambios.
- Cada valor visual del pack lleva su procedencia: **documentado** (guía formal), **observado**
  (medido de un asset/landing real, indicando cuál), **inferido** (marcado como tal, candidato a
  `[Q-NNN]`).
- La paleta cubre como mínimo lo que los componentes del motor consumen (ver los `{{token:...}}`
  reales en `engine/components/INVENTORY.md`).
- Ningún color/fuente/estilo inventado: un valor sin fuente es `[Q-NNN]`, no una aproximación.
- **`photography`, `iconography`, `voice.rhythm` y `layout.contentRhythm` existen en el pack** —
  con datos reales observados, o con la válvula de escape documentada en `_changelog`.
- **Autocomprobación cruzada contra otro brand pack real**: antes de entregar, compara los
  valores numéricos nuevos (`typography.cta`, `spacing.*`, `radius.*`, tamaños de
  `h1Hero`/`h2Section`/`body`) contra al menos un brand pack real ya existente. Una coincidencia
  exacta en 4-5 valores distintos a la vez, sin haber verificado ambos sitios el mismo día, es la
  señal de que uno de los dos packs es una plantilla sin investigar — repórtalo en el
  `_changelog` propio aunque no sea esta ronda la que lo corrija.
- `npx tsx scripts/check-brand-visual-report-completeness.ts --brand {slug}` — **bloqueante desde
  2026-08-20** sobre los 8 archivos nuevos (antes era solo aviso); un hueco sin declarar en
  `_changelog` falla `production-gate`.
- `npx tsx scripts/check-brand-pack-completeness.ts --brand {slug}` — `colors.source` y
  `typography.source` (formato `"observado en {URL} el {fecha}"`, igual que
  `photography.source`/`iconography.source`/`voice.rhythm.source`) son obligatorios desde
  2026-08-20 con la misma disciplina Nivel 3: ausentes y sin declarar en `_changelog` bloquean.

## Fase completada cuando

Los 3 análisis originales + el brand pack existen, las validaciones pasan (incluida la
investigación profunda de marca — las 6 dimensiones, bloqueante salvo válvula de escape
documentada), y todo valor del pack es trazable a documentado/observado/inferido. Los 8 archivos
nuevos (CSS, guías, informe consolidado, inventario de fuentes, preguntas abiertas) se generan
en la misma pasada cuando sea razonablemente posible con la evidencia recogida — su ausencia
genera aviso, no bloqueo (ver Válvula de escape).

## Bloquea si

- No hay inputs visuales de ningún tipo.
- El cliente/marca no es identificable.
- Contradicciones visuales irreconciliables sin fuente que desempate.
- Falta la paleta de color o el estilo de botón (sin ellos no hay brand pack utilizable).
- El cliente SÍ tiene sitio web accesible y este agente no lo navegó con Chrome real antes de
  escribir el brand pack (bloqueante — no aplica si la válvula de escape documentada justifica
  por qué no fue posible).

## Hero con arte generado — quién hace qué

`hero-imagen` (variante híbrida: arte de IA sin texto + titular/CTA en HTML del motor) es una
opción real de estructura, no un script suelto. Reparto de responsabilidades entre agentes:

- **Este agente (02):** investiga y deja en el pack `photography.treatment` (tarea 2) — la
  materia prima que alimentará el prompt de generación. No ejecuta el script (corre antes de que
  exista la decisión de estructura).
- **03 (newsletter-architect):** decide SI esta campaña usa `hero-imagen` — ver
  `03-newsletter-architect.md` §"Elegir hero".
- **06 (data-specialist):** si 03 eligió `hero-imagen`, ejecuta `generate-hero-image` como parte
  de su propio flujo — ver `06-data-specialist.md` §"Generar el arte del hero" para el comando
  exacto.

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

`03-newsletter-architect`. Debe recibir: los análisis de campaña + la ruta exacta del brand pack
(que 06 escribirá en el campo `brand` de `campaign-data.json` tal cual) + las guías de marca en
`brands/{cliente}/guidelines/` cuando existan (referencia opcional para 04/07, no bloqueante).

## No hacer

- Nunca inventar colores, fuentes o estilos.
- Nunca inventar tratamiento fotográfico, estilo de iconografía, ejemplos de ritmo de voz o
  ritmo estructural de página — si no se navegó el sitio real, se usa la válvula de escape
  documentada, nunca una suposición sin marcar.
- Nunca crear un árbol `components.button` paralelo a los campos ya consumidos por el motor
  (`components.cta.*`, `typography.cta.*`, `radius.ctaPill`) — el análisis de botón se mapea
  sobre ellos, no los duplica.
- Nunca nombrar `brands/{cliente}/guidelines/component-inventory.md` de forma que se confunda
  con `engine/components/INVENTORY.md` (catálogo de componentes de EMAIL del motor — cosa
  distinta al inventario de componentes UI del sitio real de la marca que produce este agente).
- Nunca tocar los componentes del motor ni `patterns/` — si la marca necesita algo que el
  motor no soporta, se anota como hallazgo para 03/07, no se resuelve aquí.
- Nunca sobrescribir un brand pack existente sin entrada de `_changelog`.
