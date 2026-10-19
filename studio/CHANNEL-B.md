# Canal B — Creas IT en el mismo trabajo

En `?job=<id>` se ven dos piezas del mismo brief:

- **Hermes (A).** La que ya genera Studio. No cambia.
- **Creas IT (B).** Un HTML de email ya terminado que un sistema externo adjunta al mismo trabajo.
- **Comparar.** Las dos vistas previas (escritorio y móvil, como el resto de la página) y los mismos criterios del revisor: asunto, preheader, peso del HTML y cada comprobación.

Si B todavía no ha llegado, el selector dice «Creas IT · en preparación». El progreso de Hermes, mientras genera, sigue igual.

B no es un trabajo hijo. Vive en el JSON del trabajo (`channelB`) y en archivos junto a la pieza de Hermes, en el volumen y, si está configurado, en la copia de Supabase:

- `newsletter-b.html` — HTML final, con las imágenes `data:` ya publicadas en `/assets` (el mismo mecanismo que A).
- `newsletter-b.txt` — texto plano, si se envió.
- `revision-b.json` — informe externo, si se envió.

## Token

Variable de entorno: **`STUDIO_SERVICE_TOKEN`**.

- Hay que ponerla en **Railway**, en el servicio que ejecuta `studio/server` (el de Studio, no el del worker). Un secreto largo y aleatorio, **distinto de `WORKER_TOKEN`**. Si coincide con `WORKER_TOKEN`, el canal B no se activa.
- **Vercel no la necesita.** El frontend es estático y `/api` se reescribe al servidor de Railway (`studio/web/vercel.json`). No la pongas en el frontend ni en una variable `NEXT_PUBLIC`: el navegador no debe verla.
- Sin la variable, `POST /api/service/*` responde 404. Con un token incorrecto, 401.

El bot llama al servidor (la URL de Railway, o la de Studio: las dos llegan al mismo sitio). Cabecera `Authorization: Bearer <STUDIO_SERVICE_TOKEN>`. Estas rutas no usan la sesión del equipo.

## Adjuntar la versión B

`POST /api/service/jobs/:id/channel-b`

Sustituye la B anterior si ya había una. No toca el HTML, el estado ni la cola de Hermes.

```json
{
  "html": "<!doctype html><html>...</html>",
  "text": "Versión en texto plano, opcional.",
  "subject": "Asunto opcional. Si falta, se lee el <title>.",
  "preheader": "Preheader opcional. Si falta, se lee el bloque oculto.",
  "author": "Creas IT",
  "channel": "creas-it",
  "review": { "origen": "creas-it", "nota": "Informe libre, acotado." }
}
```

| Campo | Obligatorio | Notas |
| --- | --- | --- |
| `html` | sí | Tiene que incluir `<html>`. Máximo 12 MB. Las imágenes `data:` se publican en `/assets` y el peso que se compara es el de ese HTML final. |
| `text` | no | Texto plano, hasta 200 000 caracteres. |
| `subject` | no | Hasta 300 caracteres. |
| `preheader` | no | Hasta 300 caracteres. |
| `author` | no | Quién la firma. En la página, si falta, se lee «Creas IT». |
| `channel` | no | Identificador `a-z`, `0-9` y guiones, hasta 40 caracteres. Por defecto `creas-it`. |
| `review` | no | JSON (objeto o lista). Se recorta: profundidad 6, 40 claves, cadenas de 2 000 caracteres y 32 KB en total. |

Respuesta `200`:

```json
{
  "ok": true,
  "id": "m1abc234-x7k2",
  "subject": "…",
  "preheader": "…",
  "bytes": 48120,
  "quality": { "errors": 0, "warnings": 2, "checks": [] }
}
```

`quality` es el informe de `studio/worker/qualityCheck.ts` (el mismo revisor que usa el servidor al editar texto: enlaces, imágenes, preheader, peso, Outlook, modo oscuro, baja, alt…). Los errores no rechazan el HTML: se guardan para la comparativa. Lo que el worker mide con Chromium (`renderChecks.ts`: desborde a 375 px, contraste medido, etc.) no corre aquí, porque el servidor no abre navegador. En la comparativa esas filas salen como «No medida» en B.

Ejemplo (el token es ficticio; el id también):

```bash
curl -sS -X POST "https://hermes-studio-beta.vercel.app/api/service/jobs/m1abc234-x7k2/channel-b" \
  -H "Authorization: Bearer ejemplo-no-es-un-secreto" \
  -H "Content-Type: application/json" \
  -d '{"html":"<!doctype html><html><head><title>Asunto</title></head><body><p>Hola</p></body></html>","author":"Creas IT","channel":"creas-it"}'
```

La página del equipo lee el HTML con la sesión normal, en `GET /api/jobs/:id/channel-b` (y `?download=1`, o `?text=1` para el texto plano). Ese GET no acepta el token de servicio: lo usa el navegador ya identificado.

## Crear el trabajo (ClickUp u otro)

`POST /api/service/jobs` — el mismo cuerpo que el formulario de Studio, más el nombre de quien lo pide. Así se puede encolar Hermes sin abrir la web. Opcionalmente, `channelB` con el objeto de arriba adjunta la B en la misma llamada.

```bash
curl -sS -X POST "https://hermes-studio-beta.vercel.app/api/service/jobs" \
  -H "Authorization: Bearer ejemplo-no-es-un-secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "standalone",
    "clientName": "Novo Resort",
    "promptText": "Newsletter de Novo Resort: oferta de áticos este fin de semana",
    "inputKind": "instruction",
    "imageMode": "official",
    "requesterName": "ClickUp",
    "confirmNoBrandUrl": true
  }'
```

Respuesta `201`: `{ "id": "…", "channelB": { "attached": true, "errors": 0, "warnings": 1 } }`. Si el HTML de `channelB` es inválido, no se crea el trabajo (`400`).

Los rechazos son los del formulario: marca y prompt obligatorios, imágenes `official` o `ai`, 409 si el texto no menciona la marca (`confirmBrand: true` lo salta) y 409 si una marca nueva no trae `brandUrl` ni `confirmNoBrandUrl: true`.

Límite: 30 escrituras cada 10 minutos por IP.

## Para activarlo en producción

1. Generar un secreto nuevo (no reutilizar `WORKER_TOKEN` ni pegarlo en el repo).
2. Poner `STUDIO_SERVICE_TOKEN` en el servicio de Studio en Railway y volver a desplegar ese servicio.
3. El frontend llega con el deploy de Vercel de esta rama. No hace falta ninguna variable nueva allí.
4. Probar el `curl` de arriba contra un trabajo de prueba antes de dárselo a Creas IT.
