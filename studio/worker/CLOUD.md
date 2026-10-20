# Worker de Hermes en Railway

El mismo `hermes-worker.ts` que en el Mac, en un servicio aparte llamado `hermes-worker`.
Studio sigue en `hermes-studio`. No comparten disco: el HTML vuelve por la API, como hasta ahora.
El candado local solo evita dos procesos en la misma máquina (launchd y un terminal). Varias
réplicas pueden trabajar a la vez: cada una se identifica (`RAILWAY_REPLICA_ID` o `HOSTNAME`),
reclama con un candado en Studio y solo el `/reset` de esa réplica falla los trabajos que ella
arrendó. Cada hueco (`WORKER_CONCURRENCY`, defecto 2) usa su propia carpeta bajo `HERMES_HOME`.

## Aislamiento

1. La imagen (`studio/worker/Dockerfile`) instala Node, Playwright y Hermes Agent.
2. `cloud-entrypoint.sh` arranca como root, prepara el volumen y hace `exec setpriv` a **uid 1001**
   (`--inh-caps=-all`, `--no-new-privs`, `--reset-env`).
3. El entorno que ve el proceso sale de la lista blanca de `cloudEnv.ts`. `WORKER_TOKEN` llega al
   worker para hablar con Studio y `hermesChildEnv` se lo quita a Hermes, igual que en el Mac.
4. No pasan `APP_ACCESS_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
   `MAIL_FROM`, `SESSION_SECRET` ni `ALLOW_NO_AUTH`, aunque estén definidos en el servicio.
5. `GET /heartbeat` y `GET /health` (en `$PORT`) no llevan datos: Railway los usa de healthcheck.
   Además el proceso llama a `POST /api/worker/heartbeat` de Studio para que la web siga viendo
   «Hermes conectado» mientras un trabajo largo no manda progreso.

El estado de Hermes (sesiones, `config.yaml`, login de Nous) queda en el volumen, en `HERMES_HOME`
(`$RAILWAY_VOLUME_MOUNT_PATH/hermes`, montado en `/data`). El código de Hermes queda en `/opt/hermes`.

## Qué no cambia

En el Mac, sin `HERMES_CLOUD`, el worker es el de siempre: `npm run hermes-worker` y `service.sh`.
La nota de webs que bloquean sigue diciendo que el navegador sale desde el Mac en España.
Con `HERMES_CLOUD=1` (lo pone el entrypoint, no hace falta definirla) esa frase dice que el
navegador también sale de EE. UU., porque el servicio está en `iad`.

Los brand packs nuevos que solo existan en el volumen de Studio no están en esta imagen hasta el
siguiente build. Las fichas salen de los packs que viajan en la imagen, igual que un checkout del repo.

## Variables

Nombres en `env.example`. Valores solo en Railway, en el servicio `hermes-worker`:

- `STUDIO_WORKER_URL` — URL pública `https://…` de Studio (sin barra final).
- `WORKER_TOKEN` — el mismo secreto que en `hermes-studio`.
- Una clave de proveedor si Hermes no tiene ya sesión en el volumen (`OPENROUTER_API_KEY`,
  `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` o `NOUS_API_KEY`). La sesión OAuth del Mac
  (`~/.hermes/auth.json`) no viaja con la imagen. Con `NOUS_API_KEY` y sin `auth.json` en el
  volumen, el worker escribe `HERMES_HOME/config.yaml` con `provider: custom:nous-api`, un bloque
  `providers.nous-api` (`api: https://inference-api.nousresearch.com/v1`, `key_env: NOUS_API_KEY`,
  `transport: chat_completions`) y el modelo `deepseek/deepseek-v4-flash`. Copia la clave a
  `HERMES_HOME/.env` (no va dentro del yaml) y, si el CLI lo admite, pasa `--provider custom:nous-api`.
  El CLI instalado (Hermes Agent, canal stable del Dockerfile) no tiene un proveedor `nous-api`:
  ese id sale con «Unknown provider». `provider: nous` sigue siendo el login OAuth.
  Al arrancar, el worker resuelve el proveedor con el intérprete del CLI (sin llamar al modelo) y
  lo deja en el log, con la clave redactada. Si el CLI no está, solo avisa.
- `HERMES_PROVIDER` — opcional. Vacío = `custom:nous-api` si hay `NOUS_API_KEY` y no hay `auth.json`.
  `nous-api` se acepta como alias de `custom:nous-api`. `nous` solo si el volumen tiene la sesión
  OAuth. `anthropic` es el proveedor nativo de Hermes Agent (v0.22.2): `model.provider: anthropic`,
  sin bloque `providers` y sin `base_url`. `ANTHROPIC_API_KEY` se queda en el entorno del proceso;
  no se escribe en `config.yaml` ni en `HERMES_HOME/.env`. Al arrancar, si esa clave no llega al CLI,
  el worker lo marca como proveedor no aceptado. Otro valor (`openrouter`, …) pisa el `config.yaml`.
- `HERMES_INFERENCE_MODEL` — opcional. Con Nous y vacío = `deepseek/deepseek-v4-flash`. Con Anthropic,
  el modelo (p. ej. `claude-sonnet-5-5`). Si el nombre no está en la lista blanca de `cloudEnv.ts`,
  el entrypoint lo tira.
- `HERMES_MODEL_BRIEF`, `HERMES_MODEL_DRAFT`, `HERMES_MODEL_FIX`, `HERMES_MODEL_ART` — opcionales.
  Siguen pasando como `--model` en su fase, junto a `--provider`. Vacío = el modelo de arriba.
  `HERMES_MODEL_ART` vacío = el de `HERMES_MODEL_DRAFT`.
- `WORKER_CONCURRENCY` — opcional. Vacío = 2 trabajos a la vez, cada uno con su `HERMES_HOME`
  (`HERMES_HOME/workers/<réplica>/slot-N`). En el Mac, con 1 y sin `HERMES_CLOUD`, no se aísla el home.
  La puesta al día (miniaturas, nota de calidad, fichas de marca) no ocupa uno de esos huecos.
- `HERMES_JOB_TIMEOUT_MIN` — opcional. Vacío = 20. Tope del trabajo. `HERMES_TIMEOUT_MIN` (180) sigue
  siendo el tope duro del proceso. Si se cumple el de 20 min y el HTML pasa las comprobaciones, se
  entrega; si no, el trabajo falla con la fase en la que se cortó.
- `HERMES_PHASE_MEASURE_MIN` (2), `HERMES_PHASE_PRODUCT_MIN` (3), `HERMES_PHASE_BRIEF_MIN` (6),
  `HERMES_PHASE_DRAFT_MIN` (12), `HERMES_PHASE_SELFAUDIT_MIN` (3), `HERMES_PHASE_FIX_MIN` (4),
  `HERMES_PHASE_ART_MIN` (5), `HERMES_PHASE_ART_REVISE_MIN` (6), `HERMES_PHASE_CHECK_MIN` (2).
- `HERMES_FIX_ROUNDS` (2), `HERMES_MAX_CONTINUES` (2), `HERMES_ART_REVISE_PASSES` (0),
  `HERMES_ART_REPAIR_RETRIES` (1), `HERMES_ART_SCREENSHOTS` (3), `HERMES_ART_COMPARES` (1).
  `HERMES_ART_REVISE_PASSES` vacío o `0` deja la nota visual y el arreglo de defectos, sin reescritura
  de gusto ni comparaciones A/B. `1` o más restaura esa pasada (una sola vez).
- `USD_EUR` — opcional. Cambio para el coste en euros (por defecto `0.86`).
- `HERMES_PRICE_<PROVEEDOR>_<MODELO>` — opcional. Tres números `entrada,salida,cache` en USD por
  millón de tokens. El nombre no va en la lista blanca fija: el entrypoint deja pasar el patrón.
- En `hermes-studio`, `STUDIO_WORKER_SLOTS` (defecto 2) es la capacidad de la cola cuando ningún
  worker ha mandado latido. No hace falta tocarla si el worker latea.

`PORT` lo inyecta Railway. No pongas los secretos de Studio en este servicio.

## Railway, a mano

`.railway/railway.ts` describe los dos servicios. **No aplica nada por sí solo** y este cambio no
se despliega ni se aplica. Cuando toque, en una sesión con el proyecto enlazado:

```bash
railway config plan
```

El plan tiene que **añadir** el servicio `hermes-worker` y el volumen `hermes-worker-volume`
(montaje `/data`, región `iad`) y **dejar** `hermes-studio` y `hermes-studio-volume`.
La línea `github("Javifeebbo/hermes-studio")` de Studio no se toca: es la que ya está aplicada
(el repo se transfirió a `GoyoFeeb/hermes-studio` y GitHub redirige). El worker nuevo usa
`GoyoFeeb/hermes-studio`, que es el nombre que resuelve la instalación de GitHub.
Si el plan propone borrar Studio, parar y no aplicar.

Aplicar (`railway config apply`) crea el servicio y lanza un despliegue. No forma parte de este
cambio. Después, en el dashboard del servicio nuevo: las variables de arriba, y el primer login
de Nous dentro del volumen (no en git). Cuando `/heartbeat` responda y Studio marque a Hermes
conectado, para el worker del Mac (`studio/worker/service.sh uninstall` o cierra el proceso).
