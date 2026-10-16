# Worker de Hermes en Railway

El mismo `hermes-worker.ts` que en el Mac, en un servicio aparte llamado `hermes-worker`.
Studio sigue en `hermes-studio`. No comparten disco: el HTML vuelve por la API, como hasta ahora.
No arranques los dos a la vez (el candado solo vale dentro de una máquina): se repartirían la cola
y el `/reset` del que arranca marcaría como fallido lo que está haciendo el otro.

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
  `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` o `NOUS_API_KEY`).

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
