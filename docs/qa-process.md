# QA Process: Hermes Newsletter System

> Reescrito 2026-09-23 (auditoría, BUG-H07). La versión anterior describía el proceso de QA
> sobre el pipeline **React Email** original (2026-07-09) — mencionaba al "agente 07 — React
> Email Developer" (archivado en F4, ver `_archive/f4-react-email-pipeline/`), un checklist fijo
> de 40 ítems que no existe en el sistema actual, y no conocía `brand-fidelity-qa.md` ni la
> distinción de dos niveles de aprobación. Este documento es ahora un resumen de lectura rápida;
> la fuente de verdad completa y con más detalle sigue siendo `agents/08-qa-specialist.md` — si
> algo diverge entre los dos, ese archivo gana.

## Visión general

El proceso de QA es obligatorio antes de cualquier exportación. Lo ejecuta el agente **08 — QA
Specialist**, sobre el HTML que produce el motor determinista (`engine/build-newsletter.js`,
ejecutado por el agente 07 — HTML Email Developer). QA evalúa, no corrige: clasifica los
hallazgos por severidad y los asigna al agente responsable (00 gestiona la devolución, nunca 08
edita nada directamente).

**Modo exploración** (`metadata.explorationMode:true`): esta fase se difiere por completo — no
hay `08-qa/` en una campaña en modo exploración. Solo se ejecuta cuando la campaña se promueve a
producción real.

## Nivel de aprobación: prueba interna vs. producción (2026-09-23)

`AGENTS.md` exige esta distinción como contrato de sistema ("QA en dos niveles, nunca 'aprobado'
a secas"). Antes de emitir veredicto, 08 lee `metadata.isTestCampaign`/`metadata.productionReady`
de `06-data/campaign-data.json`:

- `isTestCampaign: true` (o `productionReady` distinto de `true`) → el veredicto máximo posible
  es **"Aprobado — prueba interna"** (funcional, puede tener placeholders/assets pendientes ya
  documentados como bloqueos de producción).
- `isTestCampaign: false` **y** `productionReady: true` **y** cero bloqueos altos/críticos → puede
  emitirse **"Aprobado — producción"**.
- Nunca escribir "Aprobado" sin calificar — ver `agents/08-qa-specialist.md` §"Nivel de
  aprobación" para el detalle completo.

## Áreas de QA

### Render obligatorio (criterio de cierre, no opcional)

Captura en **320 / 375 / 600 / 600-dark** px sobre `final-inline.html` (vía `render-preview.js` o
el flujo equivalente documentado en `engine/CHANGELOG.md`). "No lo pude renderizar" es un bloqueo
explícito en `blocked-reason.md`, nunca una aprobación sin haber visto el render.

### QA visual (desktop, 600px)

- Titulares, cuerpo, CTAs (texto y enlace) contra `06-data/campaign-data.json` y `04-design/*.md`
- Imágenes (src, alt), colores y tipografía contra los tokens reales de la marca
- Espaciados, jerarquía de headings (1 `<h1>`, `<h2>`/`<h3>` anidados coherentes)
- Sin solapamientos, desbordes ni texto cortado

### QA responsive (320/375px)

- Módulos apilados correctamente, imágenes con max-width 100%
- Texto legible sin zoom, CTAs táctiles (mínimo 44px de alto), padding lateral suficiente
- Footer/legal legible en pantalla pequeña

### QA Outlook

VML/mso presentes y bien formados para botones con border-radius, fallback de color sólido para
degradados, ancho de contenedor a 600px estable. **Limitación conocida**: sin acceso real a
Outlook/Litmus, se documenta como advertencia explícita — nunca se da por "verificado" sin haberlo
comprobado de verdad.

### QA de enlaces, imágenes y paridad

- Ningún `href` vacío/`#`; todos https absolutos; UTM presente en enlaces de campaña
- Enlaces de baja/preferencias presentes (merge-tag de ESP válido)
- Toda `<img>` con `src` https y `alt` no vacío, dimensiones declaradas
- `npm run check-parity -- --campaign {campaña}` → exit 0 (auditoría independiente de los
  conteos del `build-manifest.json`, no se recalculan a mano)

### QA legal

Textos legales, precios y promociones idénticos —comparación literal— al brief. Disclaimers
presentes donde corresponden, enlaces a políticas legales funcionan.

### Fidelidad de marca (añadido 2026-07-24, ver `agents/08-qa-specialist.md` §"Fidelidad de
marca" para el detalle completo)

No es una impresión subjetiva de "se ve premium" — es un checklist verificable contra lo que el
brand pack ya documenta:

1. **Iconografía coherente** con `iconography.style`/`componentImplication` (grep contra el rango
   Unicode de emoji si el pack los desaconseja).
2. **Fotografía coherente** con `photography.usesRealPhotography`/`treatment`.
3. **Estructura coherente** con la evidencia de `layout.contentRhythm` y `module-selection.md`.
4. **Voz coherente** con `voice.rhythm` (mismo criterio que ya exige `05-copywriter.md`).
5. **CTA proporcionado a la marca** — tamaño visual + procedencia citada en `_changelog`.

Un hallazgo de esta sección que contradiga una prohibición explícita del brand pack es **severidad
alta** (se devuelve), igual que cualquier otro error alto del checklist — nunca "detalle estético".

## Severidades

| Severidad | Significado | Acción |
|---|---|---|
| **Critical** | La newsletter no puede enviarse. Error funcional o legal. | Bloquear campaña. |
| **High** | Error grave que afecta a la experiencia o al mensaje. | Devolver al agente responsable. |
| **Medium** | Error notable pero no bloqueante. Afecta a calidad visual. | Registrar y sugerir corrección. |
| **Low** | Error menor. Mejorable pero no urgente. | Registrar como mejora. No bloquea. |

### Ejemplos de errores critical

Texto legal incorrecto/alterado, precio o descuento equivocado, CTA principal sin `href`, imagen
crítica sin `src`, `campaign-data.json` inválido, asunto/preheader vacío, enlaces de
baja/preferencias rotos, sin CTA principal.

### Ejemplos de errores high

Color/tipografía que no corresponde a la especificación, imagen con alt text vacío, módulo fuera
de orden, hallazgo de fidelidad de marca que contradice una prohibición explícita del pack.

### Ejemplos de errores medium

Tono ligeramente fuera de `voice.rhythm`, espaciado irregular pero no crítico, alt text genérico,
UTM faltante en enlace secundario, fotografía con tratamiento distinto al documentado sin ser
explícitamente errónea.

### Ejemplos de errores low

Variación mínima de color, espaciado con 1-2px de diferencia, alt text correcto pero mejorable.

## Cuándo aprobar / devolver / bloquear

- **Aprobar** (con el nivel calificado — ver arriba): cero errores critical sin resolver, los
  high están corregidos o tienen plan aceptado, medium/low documentados y aceptados, el checklist
  de `agents/08-qa-specialist.md` §"Validaciones" completo con evidencia (capturas referenciadas).
- **Devolver**: hay errores high con agente responsable identificado → 08 escribe `return.md`
  (error, severidad, agente responsable, evidencia), informa a 00 (estado: `corrections`), 00
  reactiva al agente responsable y, tras la corrección, reactiva QA para re-verificar.
- **Bloquear**: hay errores critical → 08 informa a 00, que genera `blocked-reason.md`; el flujo
  se detiene hasta que el usuario resuelve.

## Archivos de QA

| Archivo | Contenido |
|---|---|
| `08-qa/visual-qa.md` | Revisión visual desktop, sección por sección contra las capturas |
| `08-qa/responsive-qa.md` | Revisión responsive mobile (320/375) contra las capturas |
| `08-qa/outlook-qa.md` | VML/mso presentes y bien formados; limitación documentada si no hay acceso real |
| `08-qa/links-qa.md` | Enlaces, CTAs e imágenes |
| `08-qa/brand-fidelity-qa.md` | Checklist de fidelidad de marca (los 5 puntos de arriba) |
| `08-qa/final-checklist.md` | Veredicto explícito, con nivel de aprobación calificado |
| `08-qa/return.md` | Solo si devuelve: error, severidad, agente responsable, evidencia |

## No hacer

- Nunca corregir nada — ni una coma. Se clasifica y se devuelve.
- Nunca aprobar "con reservas" sin degradarlas a medio/bajo documentado.
- Nunca dar por verificado Outlook/Litmus real sin acceso — se documenta como advertencia.
- Nunca escribir "Aprobado" sin calificar el nivel (prueba interna / producción).
