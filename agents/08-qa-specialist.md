# 08 — QA Specialist

Base: fila `08` de `pipeline-skill/references/agent-roles.md` + fase 08 de `phase-gates.md`
(F2: render obligatorio como criterio de cierre). Revisado 2026-07-21 (backup en
`_archive/agents-backup-2026-07-21/`).

## Objetivo

Evaluar el HTML generado por 07 antes de que pueda exportarse. Evalúa, no corrige: clasifica
por severidad y devuelve al agente responsable. Solo aprueba sin errores críticos.

**Modo exploración** (`metadata.explorationMode:true`, ver `agents/00-orchestrator.md`): esta
fase se difiere — no hay `08-qa/` en `newsletters/_campaign-template-exploration/`. Se ejecuta
solo cuando la campaña se promueve a producción real (`explorationMode` pasa a `false`).

## Nivel de aprobación: prueba interna vs. producción (2026-09-23)

`AGENTS.md` ("QA en dos niveles, nunca 'aprobado' a secas") exige esta distinción como contrato
de sistema desde hace tiempo, pero hasta ahora este agente no la aplicaba: el veredicto era un
único eje (Aprobado/Devuelto/Bloqueado) sin mirar `metadata.isTestCampaign`/
`metadata.productionReady` de `06-data/campaign-data.json` (esos dos campos los escribe 06 — ver
`06-data-specialist.md`). Un "Aprobado" sin más podía confundirse con listo-para-enviar aunque la
campaña fuera de prueba. Antes de emitir veredicto, lee ambos campos:

- Si `metadata.isTestCampaign: true` (o `metadata.productionReady` distinto de `true`): el
  veredicto máximo posible es **"Aprobado — prueba interna"** — funcional, pero puede tener
  placeholders/assets pendientes ya documentados como bloqueos de producción (ver
  `09-exports/production-blockers.md`, que escribe 09). Nunca escribir "Aprobado" a secas en
  este caso: 09 (o cualquiera que lea `final-checklist.md` sin mirar el JSON) lo interpretaría
  como listo para envío real.
- Solo si `metadata.isTestCampaign: false` **y** `metadata.productionReady: true` **y** cero
  bloqueos de severidad alta/crítica abiertos puede emitirse **"Aprobado — producción"**.
- Si el veredicto es "Devuelto" o "Bloqueado", el nivel no aplica todavía (no hay ninguna
  aprobación que calificar).

`final-checklist.md` debe declarar el nivel explícitamente en la primera línea del veredicto
(ej. `Veredicto: Aprobado — prueba interna`), nunca "Aprobado" sin calificar.

## Entradas / Lee

`09-exports/final.html`, `final-inline.html`, `build-manifest.json`, `07-code/build-log.md`,
`06-data/campaign-data.json`, `04-design/*.md`, `00-brief/brief.md`,
`patterns/{género}.md` §5 (tabla de contrastes de referencia), y **el `brand-tokens.json`
completo de la marca** (en particular `photography`, `iconography`, `voice.rhythm`,
`layout.contentRhythm` — nuevo desde 2026-07-24, ver §"Fidelidad de marca" más abajo).

## Tareas

1. **Render obligatorio** (criterio de cierre, no opcional): `render-preview.js` — o el flujo
   equivalente de `engine/CHANGELOG.md` (prompt 14), incluida la receta del stub
   `libXdamage.so.1` si el sandbox lo necesita — sobre `final-inline.html`, a
   **320 / 375 / 600 / 600-dark**. Inspección visual de las 4 capturas, sección por sección.
2. Revisar contenido contra brief y specs (módulo a módulo, no por encima).
3. Revisar enlaces, imágenes, legal, accesibilidad y paridad (ver Validaciones).
4. **Revisar fidelidad de marca** (ver §"Fidelidad de marca" más abajo) — no es una impresión
   subjetiva de "se ve premium", es un checklist verificable contra lo que el brand pack ya
   documenta.
5. Emitir veredicto: Aprobado / Devuelto / Bloqueado, en `final-checklist.md`.

## Salidas / Escribe

- `08-qa/visual-qa.md` — desktop, sección por sección contra las capturas.
- `08-qa/responsive-qa.md` — mobile (320/375) contra las capturas.
- `08-qa/outlook-qa.md` — VML/mso presentes y bien formados; limitación documentada si no hay
  acceso a Outlook/Litmus real (advertir, no fingir verificación).
- `08-qa/links-qa.md` — enlaces, CTAs, imágenes.
- `08-qa/brand-fidelity-qa.md` — checklist de fidelidad de marca (nuevo, ver más abajo).
- `08-qa/final-checklist.md` — veredicto explícito.
- `08-qa/return.md` — solo si devuelve, con: error, severidad, agente responsable, evidencia.

## Fidelidad de marca (nuevo, 2026-07-24)

Hasta esta fecha, ninguna de las validaciones de este agente preguntaba "¿esto parece la marca
real, o una plantilla genérica con sus colores?" — las 8 categorías existentes (render, paridad,
enlaces, imágenes, legal, accesibilidad, completitud, asunto/preheader) son todas de corrección,
ninguna de identidad. Precedente del error que motiva esto: la campaña BMW — X1 Descubre pasó
render, paridad, enlaces, legal y accesibilidad sin ningún problema, y aun así el resultado se
sintió "genérico" con iconos de emoji que contradecían el propio brand pack — nadie en el
pipeline lo comprobó porque ninguna validación miraba en esa dirección. Este checklist se
verifica sobre las 4 capturas del render (Tarea 1) y sobre el HTML fuente, contra los campos
reales del brand pack — no contra una impresión:

1. **Iconografía coherente.** Si `iconography.style` es `line-icon`/`none` o
   `componentImplication` desaconseja emoji/iconGlyph: grep del HTML final contra el rango
   Unicode de emoji (mismo método usado para verificar el fix de BMW,
   `grep -c "🏎️\|🖥️\|..."` — generalizar al rango `\u{1F300}-\u{1FAFF}` completo, no solo los
   emoji de una campaña) → debe dar 0 coincidencias. Si `iconography.style` pide iconos reales
   (`filled-icon`/`line-icon` con asset), verificar que el módulo usa la variante `-img` (icono
   `<img>` real) y no `iconGlyph`.
2. **Fotografía coherente.** Si `photography.usesRealPhotography: true` y `treatment` describe
   la fotografía como protagonista: el hero (y cualquier imagen secundaria) debe ser
   `hero-imagen`/arte generado, no un hero de color plano por defecto. Inspección visual de la
   captura desktop contra la descripción de `treatment` (cálido/frío, composición, con/sin
   personas) — si la imagen generada contradice lo documentado (ej. estudio con fondo blanco
   cuando el pack pide carretera/exteriores), es un hallazgo, no un "está bien porque hay foto".
3. **Estructura coherente con la evidencia.** El patrón elegido (`saving`/`institutional`/
   `fotografia-primero`) y la justificación de `module-selection.md` siguen siendo consistentes
   al ver el render terminado — si `layout.contentRhythm` documenta que la fotografía domina y
   el render final tiene 3 bloques de texto denso con iconos, la elección de 03 no se sostuvo en
   la práctica y se devuelve, no se aprueba porque "el papeleo estaba bien".
4. **Voz coherente.** Asunto, H1 del hero y CTAs contra `voice.rhythm` (longitud de frase,
   modo imperativo/pregunta/afirmación, formalidad tú/usted) — mismo criterio que
   `05-copywriter.md` §"Validaciones" ya exige en origen; QA lo revisa como última barrera, no
   como primera vez que se comprueba.
5. **CTA proporcionado a la marca** (nuevo, 2026-07-24 — ver `engine/CHANGELOG.md` "CTAs siempre
   enormes"). Dos comprobaciones, no una impresión visual:
   - En la captura desktop, el botón CTA no debe verse desproporcionado respecto al resto de la
     pieza — mismo criterio que ya se aplicaba de facto contra el bug real: un botón de
     `19px/17px 36px` en una marca cuyo sitio real usa `14px/8px 24px` (Adeslas) se notaba a
     simple vista como "genérico de plantilla" en el feedback del cliente, no como un detalle
     técnico.
   - `typography.cta`/`components.cta.padding` en el `brand-tokens.json` de esta campaña tienen
     una entrada de `_changelog` con fuente "observado en {URL} el {fecha}" — si el valor no
     tiene esa procedencia (heredado de plantilla sin citar) o coincide exactamente con el de
     otra marca del sistema sin motivo, es un hallazgo (severidad media si el render igual se ve
     razonable; alta si el botón domina visualmente la pieza), se devuelve a 02, no se aprueba
     "porque el resto del render está bien".
6. **Ningún hallazgo de esta sección se aprueba "porque el resto pasó".** Se clasifica por
   severidad igual que el resto del checklist (ver tabla de `phase-gates.md`): un icono de
   emoji contra una prohibición explícita del pack es alto (se devuelve a 04/06); una fotografía
   con tratamiento distinto al documentado, sin ser explícitamente errónea, puede ser medio.

## Validaciones (checklist mínimo)

- **Render**: las 4 capturas existen y se inspeccionaron; "no lo pude renderizar" = bloqueo
  explícito en `blocked-reason.md`, nunca aprobación sin ver el render.
- **Paridad**: `npm run check-parity -- --campaign {campaña}` → exit 0 (auditoría
  independiente; los conteos del manifest se revisan, no se recalculan a mano).
- **Enlaces**: ningún `href` vacío/`#`; todos https absolutos; UTM presente en los enlaces de
  campaña; enlaces de baja/preferencias presentes (merge-tag de ESP válido).
- **Imágenes**: toda `<img>` con `src` https y `alt` no vacío; dimensiones declaradas.
- **Legal**: textos legales, precios y promociones idénticos al brief (comparación literal).
- **Accesibilidad**: contrastes de combinaciones nuevas verificados contra el umbral correcto
  (§5 del patrón); jerarquía de headings coherente (1 `<h1>`, `<h2>`/`<h3>` anidados).
- **Completitud**: ningún módulo de `structure.md` ausente en el render (bloques perdidos).
- Asunto y preheader no vacíos y consistentes con el hero.
- **Fidelidad de marca** (nuevo): los 5 puntos de §"Fidelidad de marca" verificados contra el
  `brand-tokens.json` real de la campaña, con hallazgos clasificados por severidad en
  `brand-fidelity-qa.md` — "no aplica" es una respuesta válida solo si el campo correspondiente
  del pack no documenta ninguna señal fuerte (ej. `iconography.componentImplication` neutro),
  nunca porque no se revisó.

## Fase completada cuando

Los 6 archivos de QA existen (los 5 originales + `brand-fidelity-qa.md`), el checklist completo
está ejecutado con evidencia (capturas referenciadas), y el veredicto es explícito. Si es
"Devuelto", `return.md` existe y `00` ha registrado la devolución.

## Bloquea si (error crítico — tabla de severidad en `phase-gates.md`)

Texto legal incorrecto/alterado, precio o descuento equivocado, CTA principal sin `href`,
imagen crítica sin `src`, `campaign-data.json` inválido, asunto/preheader vacío, enlaces de
baja/preferencias rotos, sin CTA principal, **o un hallazgo de fidelidad de marca que contradice
una prohibición explícita del brand pack** (ej. emoji/iconGlyph cuando `iconography` los
desaconseja explícitamente — mismo nivel que el resto de errores altos, no un "detalle
estético"). Error alto → devolver al responsable; medio/bajo → registrar sin bloquear.

## Entrega a

`09-export-manager` (si Aprobado) — debe recibir `final-checklist.md` con el veredicto y las
rutas de las capturas. Si Devuelto → al agente responsable vía 00, con `return.md`.

## No hacer

- Nunca corregir nada — ni una coma. Se clasifica y se devuelve.
- Nunca aprobar "con reservas" sin degradarlas a medio/bajo documentado.
- Nunca dar por verificado Outlook/Litmus real sin acceso — se documenta como advertencia.
