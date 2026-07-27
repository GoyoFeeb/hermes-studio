# 06 — Data Specialist

Fase 2 del plan de transformación. Base: fila `06` de
`pipeline-skill/references/agent-roles.md` + fase 06 de
`pipeline-skill/references/phase-gates.md`. **Cambio de fondo respecto al diseño original**
(plan §3.1): el JSON de salida ya no es del pipeline React Email — es la entrada real del
motor.

## Rol

Convierte todo lo producido por 03/04/05 en el único archivo que el motor necesita para
generar el HTML: `campaign-data.json`. Es la última fase antes de que exista código — todo lo
que falte o esté mal nombrado aquí bloquea el build de 07, así que la precisión de nombres de
campo importa más en este agente que en cualquier otro.

## Lee

`05-copy/body-copy.md`, `05-copy/cta-options.md`, `05-copy/subject-lines.md`,
`05-copy/preheaders.md`, `03-strategy/structure.md` (orden de módulos), `04-design/*.md`
(para confirmar que no falta ningún campo visual que en realidad es dato, ej. números de paso).

## Escribe

`06-data/campaign-data.json` — contra **`engine/schema/campaign-data.schema.json`** (JSON
Schema draft-07, validado con `ajv`). **Esto reemplaza por completo** el
`06-data/newsletter-data.json` + `newsletter-data.ts` del pipeline anterior (formato de
módulos React) — no se escriben ambos, solo el del motor.

Estructura obligatoria: `metadata` (campaña, cliente, asunto, preheader, remitente, versión,
flags `isTestCampaign`/`productionReady`), `brand` (ruta al brand pack), `pattern` (nombre del
género), `modules[]` (secuencia ordenada, un objeto por componente), `utm` (source/medium/
campaign).

### Tabla de nombres de campo por componente (no negociable)

Cada entrada de `modules[]` usa el nombre de componente real y los campos exactos que su
`oneOf` exige en el schema — deben coincidir con lo que `MODULE_ADAPTERS` de
`engine/lib/assemble.js` espera (tabla completa en `engine/CHANGELOG.md`, entrada del prompt
12):

| `component` | Campos de `data` |
|---|---|
| `hero-asimetrico` | `h1`, `stat.{number,label}`, `subtitle`, `cta.{href,label}` |
| `trust-bar` | `items[]` (exactamente 3, cada uno `{text}`) |
| `card-tarifa` | `eyebrow`, `title`, `subtitle`, `items[]` (2-4, cada uno `{icon,title,body,href,linkLabel}`) |
| `pasos` | `eyebrow`, `title`, `items[]` (exactamente 3, cada uno `{number,title,body}`) |
| `lista-premium` | `eyebrow`, `title`, `items[]` (3-4, cada uno `{icon,title,body}`) |
| `banda-cierre` | `title`, `body`, `cta.{href,label}` |
| `footer` | `brandName`, `tagline`, `disclosure`, `unsubscribeUrl`, `preferencesUrl`, `legalLine` |

## Entrega a

`07-html-email-developer`

## Bloquea si

- El JSON no valida contra `campaign-data.schema.json` (correrlo con `ajv`, o dejar que
  `build-newsletter.js` lo valide en su paso 1 — cualquiera de los dos sirve como verificación,
  pero debe hacerse antes de entregar, no descubrirse en 07)
- Falta algún módulo obligatorio del patrón elegido (`patterns/{género}.md`, sección
  obligatorio/opcional — para `saving`: hero, tarjetas, pasos, banda de cierre y footer nunca
  se omiten)
- Algún `href`/`icon` no es una URL `https://` absoluta
- Algún campo de texto contiene el literal `[PENDIENTE]` (prohibido por el `$def`
  `nonPendingString` del schema — si un dato no está confirmado, el campo (o el módulo entero,
  si es opcional) se omite, no se rellena con un placeholder de texto)
- El orden de `modules[]` no coincide con `03-strategy/structure.md`

### Caso especial que no bloquea: merge-tags de ESP

`footer.unsubscribeUrl` y `footer.preferencesUrl` SÍ aceptan un merge-tag de plataforma de
envío entre corchetes mayúsculas (`[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`) — el `$def`
`espResolvedUrl` del schema los distingue explícitamente de `[PENDIENTE]`. No es un dato
pendiente: es un token que el ESP resuelve en el momento del envío, patrón estándar (Mailchimp
y similares). No confundir este caso con el bloqueo anterior.

## Regla clave

`campaign-data.json` es la única fuente de verdad de contenido — cada módulo de `modules[]`
es un bloque, los nombres de campo deben coincidir exactamente con lo que el componente del
motor espera. Nada de contenido hardcodeado fuera de este archivo.
