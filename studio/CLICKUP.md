# ClickUp → Hermes Studio

Cuando se crea una tarea en la lista **JAVI AI** (`901223474074`, workspace Feebbo), ClickUp avisa a
Studio y Studio abre un trabajo. El aviso entra por el servicio Railway **hermes-studio**. No hace
falta nada en **hermes-worker**: estas variables no van en su lista blanca.

La ruta es `POST /api/integrations/clickup`. ClickUp firma el cuerpo en bruto (`X-Signature`,
HMAC-SHA256 en hexadecimal con el secret del webhook). Sin `CLICKUP_WEBHOOK_SECRET` la ruta
responde 401 y no crea trabajos.

## Variables (solo hermes-studio)

Ponlas en Railway, servicio `hermes-studio`. No las copies a `hermes-worker` ni al repo.

| Variable | Obligatoria | Qué es |
|---|---|---|
| `CLICKUP_WEBHOOK_SECRET` | Sí, para activar | El `webhook.secret` que devuelve el alta. Sin ella la ruta está apagada (401). |
| `CLICKUP_API_TOKEN` | Para leer la tarea y comentar | Token personal de ClickUp (Settings → Apps). No es el secret del webhook. |
| `CLICKUP_LIST_ID` | No | Lista que abre trabajos. Por defecto `901223474074`. |
| `CLICKUP_COMMENT` | No | `1` publica comentarios en la tarea: el enlace al crear el trabajo, el aviso si sigue en cola, el aviso de que el brief se reestructuró, el aviso de que Hermes ha empezado, y al terminar o fallar un comentario que menciona a quien creó la tarea. Cualquier otro valor, o vacío, no comenta. No hay variable nueva para el aviso de fin ni para el del brief. |
| `CLICKUP_DEFAULT_ASSIGNEE_ID` | No | Id numérico de ClickUp. Si la tarea llega sin asignado, se le pone este usuario y no se busca el nombre. Sin ella, se busca a **Javier Condado** entre los miembros de la workspace. |
| `CLICKUP_TEAM_ID` | No | Si está, la búsqueda de Javier Condado se limita a esa workspace. El script de alta del webhook ya lo usaba. |
| `ANTHROPIC_API_KEY` | Para reescribir un brief vago | La misma clave que el worker. Sin clave (ni `NOUS_API_KEY` si el proveedor es Nous), el trabajo se abre con el texto original. |
| `HERMES_PROVIDER` | No | El del worker (`anthropic` o `nous-api`). Si no está y hay `ANTHROPIC_API_KEY`, se usa Anthropic. |
| `HERMES_INFERENCE_MODEL` | No | Modelo del worker. Con Anthropic y sin modelo, `claude-sonnet-5-5`. |
| `HERMES_MODEL_BRIEF` | No | Si está, solo este paso lo usa, por delante de `HERMES_INFERENCE_MODEL`. |

Opcional, solo si la web deja de estar en Vercel: `STUDIO_WEB_URL` (https). El enlace del comentario
sale de ahí. Si no está, el enlace es `https://hermes-studio-beta.vercel.app/?job=<id>`.

El script de alta, no el servidor, también lee `CLICKUP_TEAM_ID` (id de la workspace, el número de
`https://app.clickup.com/<team_id>/…`) y, si hace falta, `CLICKUP_WEBHOOK_ENDPOINT`.

## Qué abre un trabajo

- `taskCreated` si la tarea nace en `CLICKUP_LIST_ID` (`history_items[].parent_id`). Si el aviso no
  trae lista, Studio lee la tarea y solo crea si `task.list.id` coincide. Sin token, ese caso se
  ignora (200) para no abrir trabajos de toda la workspace.
- `taskUpdated` y `taskMoved` solo si el historial dice que la tarea **entra** en la lista
  (`field: section_moved`, destino = la lista, origen distinto). El alta de abajo no se suscribe a
  esos eventos. Si más adelante quieres los movimientos, hay que volver a registrar el webhook con
  `taskMoved` (o `taskUpdated`) además de `taskCreated`.

Cualquier otro evento responde 200 e `ignored`, para que ClickUp no reintente.

El trabajo reutiliza `enqueueStandaloneJob`, el mismo alta que `POST /api/jobs` después de validar
el formulario: instrucción rápida, imágenes oficiales, revisión de arte activada. No pide la
confirmación de marca ni de web del formulario: si faltan, el trabajo se crea igual.

El aviso `taskCreated` no trae el texto de la tarea, solo `task_id`. Con `CLICKUP_API_TOKEN`,
Studio hace `GET https://api.clickup.com/api/v2/task/{id}?include_markdown_description=true`
(`Authorization` es el token, sin `Bearer`) y rellena el brief del trabajo: nombre, descripción
(`markdown_description`, si no `text_content`, si no el HTML en texto, con los `href`) y, si
vienen, adjuntos y enlaces `https` que no son de ClickUp. `briefReused` queda activo: el worker
maqueta con ese brief y no pide a Hermes que escriba otro. Sin token, o si la API no responde, el
trabajo se abre igual pero el brief sigue vacío y Hermes intenta escribirlo.

La marca sale, por este orden, de un campo **Cliente** / **Client** / **Marca** / **Brand**; de una línea
`Marca:` / `Cliente:` en el nombre o la descripción; de una ficha de marca ya sincronizada si el nombre
aparece en el título o la descripción; y, si no, del texto (`Nike — Verano` → Nike, `newsletter Feebbo` →
Feebbo, y un prefijo `PRUEBA` / `TEST` no se queda con la marca). En el campo y en esa línea, un enlace
markdown, una URL o una URL entre paréntesis no forma parte del nombre
(`Cliente: Feebbo ([https://feebbo.com](https://feebbo.com))` → Feebbo). La campaña sale del campo **Campaña** / **Campaign** y se
guarda en `campaignName`. Una URL `https://` de la descripción (que no sea de ClickUp) es
`brandUrl`, también cuando iba dentro del markdown del nombre. El id de tarea, su URL y quien la creó quedan en el trabajo: `requesterName` (el username,
nunca el correo) y `clickupCreatorId` (el id numérico de ese usuario en ClickUp). `clientId` y
`campaignId` están reservados para vincular cliente y campaña; esta integración no los rellena y no
toca la base de datos.

Antes de dejar el trabajo en cola, Studio prepara la tarea (`studio/server/clickupPrepare.ts`):

- **Asignado.** Si `assignees` viene vacío, asigna a Javier Condado. El id sale de
  `GET /api/v2/team` (el `username`, sin distinguir mayúsculas ni tildes) o de
  `CLICKUP_DEFAULT_ASSIGNEE_ID` si está puesta. Si ya hay alguien asignado, no se toca.
- **Estado.** Solo si la tarea no trae estado, se pone `BACKLOG` (o el estado de la lista que se
  llame igual, con la grafía que tenga la lista). Si ya tiene estado, no se cambia.
- **Brief.** Si la descripción no tiene el marcador `<!-- hermes-brief -->` ni los once campos
  (Cliente/Marca, URL de la marca, Producto/servicio, Objetivo, Formato, CTA, Idioma, Tono, Público,
  Mensajes clave, Imágenes), el modelo la reescribe en español y se guarda en la tarea. Debajo queda
  el texto de la persona, bajo `Descripción original:`. El trabajo usa esa descripción. Si ya está
  estructurada, no se vuelve a llamar al modelo ni se vuelve a comentar. Con `CLICKUP_COMMENT=1` se
  publica un comentario corto diciendo que el brief se reestructuró. Si el modelo o ClickUp fallan,
  el trabajo se abre igual: con el brief nuevo si el modelo respondió, o con el texto original si no.

Cuando el trabajo termina (`POST /api/worker/jobs/:id/complete`) o falla (`/fail`), y `CLICKUP_COMMENT=1`,
Studio publica otro comentario en la misma tarea. Si hay `clickupCreatorId`, el cuerpo es un array
`comment` con `notify_all: false`. El primer bloque es la mención como la documenta ClickUp
(`{type: "tag", user: {id}}`, sin `text` y sin `attributes`); el segundo es la frase, que empieza por
un espacio. ClickUp pinta ese array en el orden enviado y escribe el nombre en el hueco del tag, así
que la mención queda delante y avisa a esa persona. Un `text` dentro del tag se concatena al final de
`comment_text` y reordenar los bloques no lo mueve. El enlace
va sin ángulos. El texto, en español, es
`@Nombre tu trabajo está listo: https://hermes-studio-beta.vercel.app/?job=<id> · duración M:SS · nota visual X/50 · M:SS · 182k tokens · 0,94 €`

La cola `· M:SS · 182k tokens · 0,94 €` solo entra si el trabajo tiene tokens. Sin ellos, el aviso
queda como antes. La mención sigue la primera. El euro sale de `HERMES_USD_EUR` (defecto 0,92) y de
`studio/worker/price-table.json` (Anthropic Sonnet 5.5: 2 / 10 / lectura 0,10 / escritura 5 min 2,50 /
escritura 1 h 4 USD por millón). `HERMES_PRICE_TABLE` pisa esa tabla. Esas variables tienen que estar
en `hermes-studio` (el brief) y en `hermes-worker` (el resto de llamadas).
En líneas siguientes, `Vista previa A: https://hermes-studio-beta.vercel.app/api/jobs/<id>/result`
y, si el trabajo tiene versión B, `Vista previa B: …/api/jobs/<id>/channel-b`
(la duración y la nota solo si existen; la nota es la suma de los criterios, sobre 50). Si hubo
pasadas de mejora, la nota dice la inicial, la final y cuántas fueron:
`nota visual 40/50 → 48/50 (2 pasadas)`. Si no llegó al objetivo, añade los criterios que siguen
por debajo del máximo. Si falla:
`@Nombre el trabajo ha fallado: motivo en una línea. https://…/?job=<id>` (sin vistas previas). Sin id de creador, el mismo aviso
sale como texto plano, sin `@`. El aviso se escribe una vez por trabajo: un reintento de la ruta o
otra réplica ve la reserva y no vuelve a comentar. Si ClickUp no responde, la reserva se suelta y
el siguiente intento puede publicar.

La web tiene una vista de resultados (`/?results=1`, y `/?results=1&job=<id>` para abrir una pieza).
`GET /api/results` pagina las piezas terminadas, la más nueva primero (`limit`, `offset` o `cursor`).
Pasa por el mismo acceso que el resto de `/api` (cuenta `@feebbo.com`). `/?job=<id>` sigue abriendo
la ficha de trabajo, no el paginador.

Si ClickUp repite el aviso, y ya hay un trabajo con ese `clickupTaskId`, la ruta responde 200 con
ese id y no abre otro. La respuesta sale antes de terminar de leer la tarea. Mientras se lee, el
trabajo lleva `clickupPending` y el worker no lo coge. A los dos minutos entra en la cola aunque la
lectura no haya vuelto, con el texto que hubiera.

El cupo es el de `POST /api/jobs`: 5 peticiones cada 10 minutos por IP, con contador aparte para no
gastar el del formulario.

## Alta del webhook

1. Despliega este código en `hermes-studio` (sin mergear a mano a `main` desde aquí: el despliegue
   lo hace quien corresponda). La ruta existe, pero sigue en 401 hasta que tenga el secret.
2. Crea un token personal en ClickUp. No lo subas al repo.
3. Registra el webhook. El script lee el token del entorno:

```bash
CLICKUP_API_TOKEN=pk_… CLICKUP_TEAM_ID=… npm run clickup-webhook -- register
```

Eso hace `POST https://api.clickup.com/api/v2/team/{team_id}/webhook` con:

```json
{
  "endpoint": "https://hermes-studio-production-761e.up.railway.app/api/integrations/clickup",
  "events": ["taskCreated"],
  "list_id": 901223474074
}
```

4. La respuesta trae `webhook.secret` una sola vez. Pégalo en Railway → `hermes-studio` →
   `CLICKUP_WEBHOOK_SECRET` y reinicia el servicio **antes** de crear una tarea de prueba.
5. Pon también `CLICKUP_API_TOKEN` en ese mismo servicio. Sin él el trabajo se abre, pero el
   encargo no tiene la descripción. `CLICKUP_COMMENT=1` si quieres los comentarios, incluido el aviso
   a quien creó la tarea cuando el trabajo termina o falla y el aviso de brief reestructurado. Sin
   esa variable (o con otro valor) no se comenta. Hace falta el mismo `CLICKUP_API_TOKEN`: no hay
   variable nueva. Para reescribir un brief vago, pon también `ANTHROPIC_API_KEY` (y, si no es el
   modelo por defecto, `HERMES_PROVIDER` y `HERMES_INFERENCE_MODEL`) en este servicio.
6. Crea una tarea en JAVI AI. En la tarea (si el comentario está activo) y en Studio debe aparecer
   el trabajo. El enlace es `https://hermes-studio-beta.vercel.app/?job=<id>`.

Listar (el secret no se imprime) y borrar:

```bash
CLICKUP_API_TOKEN=pk_… CLICKUP_TEAM_ID=… npm run clickup-webhook -- list
CLICKUP_API_TOKEN=pk_… npm run clickup-webhook -- delete <webhook_id>
```

Si `CLICKUP_TEAM_ID` no está y el token solo ve una workspace, el script usa esa. Si ve varias,
las enumera (id y nombre) y para.

## Riesgos

- Un 401 (secret mal puesto o aún vacío) puede dejar el webhook en fallo. ClickUp deja de enviar
  cuando se acumulan fallos. Si pasa: `list` (mira `health`), `delete`, vuelve a `register` y
  actualiza el secret **antes** de crear otra tarea. Cada alta trae un secret nuevo.
- 429 también es un fallo para ClickUp. El cupo es 5 avisos / 10 min por IP de salida de ClickUp.
  Una ráfaga de tareas, o varios reintentos, puede frenar el webhook y, si ClickUp insiste, marcarlo
  como enfermo. Los reintentos del mismo task id no crean otro trabajo, pero sí consumen cupo.
- Sin URL en la descripción, el trabajo se crea igual. Hermes puede investigar la marca como en un
  envío del formulario confirmado sin web: no des por hecho el dominio a partir del nombre.
- El comentario y la lectura de la tarea usan el token personal de quien lo creó. Si esa cuenta se
  desactiva, ClickUp deja de avisar y Studio deja de poder leer la tarea.
- Los enlaces de adjuntos se guardan en el encargo. A veces son URLs temporales de ClickUp.
- `clientId` / `campaignId` no se rellenan. El vínculo con cliente y campaña queda para cuando
  exista ese modelo; no hay migración en este cambio.
