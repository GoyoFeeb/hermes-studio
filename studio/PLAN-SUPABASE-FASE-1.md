# Plan — Fase 1 de la migración a Supabase: los datos

Fecha: 2026-10-12 · Estado: hechos los pasos 1 a 6: copia de trabajos, eventos y fichas activada en Railway, y migración de lo existente terminada con «Disco y Supabase coinciden» (110 trabajos, 51 fichas, 2.819 archivos, 214 MB). Paso 6: `studio/server/mirror.ts` (lo que escribe el servidor en newsletters/ y brands/ se copia a Storage; el flujo antiguo de 9 fases escribe con scripts aparte y no pasa por ahí). Pendiente: pasos 7 y 8. Copia del volumen en `../backups/`. El plan gratuito responde 429 a ráfagas: el listado y la subida van con pausas y reintentos.

## Objetivo

Que los datos de Studio dejen de depender del volumen de Railway: los **trabajos** pasan a Postgres y los
**archivos** (newsletters terminadas, miniaturas, imágenes publicadas, fichas de marca) a Supabase Storage.

Railway **sigue siendo el servidor** durante toda la fase. La web, el worker del Mac y las 44 rutas `/api`
no cambian. Al terminar, el volumen de Railway es solo una copia de trabajo que se puede reconstruir.

Fuera de esta fase: usuarios (fase 2), cola y Playwright en el worker (fase 3), apagar Railway (fase 4).

## Qué hay hoy en el volumen

| Dato | Dónde | Quién lo escribe |
|---|---|---|
| Trabajos | `studio/data/jobs/<id>.json` | `store.ts` (`createJob`, `updateJob`) |
| Eventos de cada trabajo | `studio/data/jobs/<id>.events.ndjson` | `store.ts` (`appendEvent`) |
| Fichas de marca del worker | `studio/data/brand-cards/<marca>.json` | `brandCards.ts` |
| Resultado de cada newsletter | `newsletters/…/{newsletter.html, prompt.md, instruccion.md, cambios.md, notas.md}` + miniatura | `standalone.ts` (`completeStandaloneJob`, `saveThumbnail`) |
| Imágenes publicadas de los correos | `brands/<marca>/…`, servidas en `/assets` | `standalone.ts` (`publishEmbeddedImages`), `heroImage.ts` |
| Brand packs | `brands/<marca>/` | repo + capturas (`brandCapture.ts`) |

No he podido medir el volumen real de producción: la carpeta local `studio/data/jobs` está vacía. En local,
`newsletters/` pesa unos 290 MB y `brands/` unos 120 MB. El primer paso del plan es medirlo en Railway.

## Decisión de diseño: copia en memoria y en disco, Supabase como fuente de verdad

`store.ts` es **síncrono** y lo usan 8 archivos del servidor (`listJobs()` se llama 18 veces). Pasarlo a
consultas asíncronas obligaría a tocar casi todas las rutas. Para esta fase propongo no hacerlo:

- **Trabajos:** al arrancar, el servidor carga todos los trabajos de Postgres en memoria. Las lecturas siguen
  siendo síncronas contra esa copia. Cada escritura actualiza la memoria y se envía a Postgres en una cola
  ordenada, con reintentos. Funciona porque hay un único servidor y un único worker.
- **Archivos:** se siguen escribiendo en disco como ahora y, a continuación, se suben a Storage. Si al leer
  un archivo no está en disco (volumen nuevo), se descarga de Storage.

Coste de esta decisión: si el servidor muere entre la escritura en memoria y el envío a Postgres, se pierde
ese último cambio. Lo acoto en el paso 3 (vaciar la cola al recibir SIGTERM, que el servidor ya gestiona).
En la fase 4 esta capa desaparece y la web lee de Supabase directamente.

## Esquema de Postgres

```sql
create table jobs (
  id            text primary key,              -- mismo formato que hoy (JOB_ID_RE)
  created_at    timestamptz not null,
  updated_at    timestamptz not null,
  status        text not null,                 -- queued | running | review | blocked | failed | completed | cancelled
  client_slug   text not null,
  requester     text,
  archived_at   timestamptz,
  data          jsonb not null                 -- el objeto Job entero, tal cual está hoy en el JSON
);
create index jobs_status_idx  on jobs (status);
create index jobs_created_idx on jobs (created_at desc);

create table job_events (
  id      bigint generated always as identity primary key,
  job_id  text not null references jobs(id) on delete cascade,
  ts      timestamptz not null,
  phase   text not null,
  level   text not null,                       -- info | error | success
  message text not null
);
create index job_events_job_idx on job_events (job_id, id);

create table brand_cards (
  slug       text primary key,
  updated_at timestamptz not null,
  data       jsonb not null
);
```

El `Job` va entero en `data` (jsonb) porque cambia a menudo: lleva unos 30 campos y se añaden cada semana.
Las columnas sueltas son solo las que hacen falta para filtrar. RLS activado y **sin políticas**: en esta
fase solo entra el servidor con la clave `service_role`. Las políticas llegan con los usuarios, en la fase 2.

## Buckets de Storage

| Bucket | Visibilidad | Contenido | Ruta |
|---|---|---|---|
| `newsletters` | privado | HTML, `.md` y miniatura de cada trabajo | la misma `campaignRelPath` de hoy |
| `assets` | **público** | imágenes de `brands/` que cargan los correos | la misma ruta que hoy tras `/assets/` |
| `brand-packs` | privado | el resto de `brands/` (tokens, `.md`, capturas) | `brands/<marca>/…` |

Mantener las mismas rutas relativas hace que `campaignRelPath`, `resultRelPath` y `thumbRelPath` sigan
valiendo sin migrar ningún trabajo.

## Las imágenes de los correos ya enviados

Los correos que ya se han enviado apuntan a `STUDIO_PUBLIC_BASE_URL/assets/…`, es decir, a Railway. Esas
URL no se pueden cambiar. En esta fase:

- Railway **sigue sirviendo `/assets`** igual que hoy. Nada se rompe.
- Las newsletters nuevas siguen usando la misma URL. No cambio a la URL pública de Supabase todavía.
- El cambio de URL se decide en la fase 4, y exige una redirección permanente desde el dominio antiguo o un
  dominio propio delante. Lo dejo anotado como condición para apagar Railway.

## Pasos

Cada paso se puede desplegar solo y deja el sistema funcionando.

1. **Medir y preparar.** Contar trabajos y tamaño de `newsletters/` y `brands/` en el volumen de Railway.
   Crear el proyecto de Supabase (región UE), las tablas y los buckets. Variables nuevas en Railway:
   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Las pones tú; yo no manejo esas claves.
2. **Capa de acceso** (`studio/server/supabase.ts`, nuevo): cliente, cola de escrituras ordenada con
   reintentos, y subida y descarga de archivos. Sin las variables, no hace nada y todo sigue en disco: así
   el entorno local y los tests no necesitan Supabase.
3. **Escritura doble de trabajos.** `store.ts` sigue escribiendo el JSON y, además, envía cada cambio a
   Postgres. Lo mismo `brandCards.ts`. Al recibir SIGTERM, el servidor espera a vaciar la cola.
4. **Script de migración** (`scripts/migrate-to-supabase.ts`, nuevo): sube trabajos, eventos, fichas y
   archivos existentes. Se puede repetir sin duplicar nada. Se ejecuta dentro de Railway, que es donde está
   el volumen.
5. **Comprobación** (`scripts/check-supabase-parity.ts`, nuevo): compara disco y Supabase (número de
   trabajos, contenido de cada uno, número de eventos, lista y tamaño de archivos) y lista las diferencias.
6. **Escritura doble de archivos.** `standalone.ts` y `heroImage.ts` suben a Storage lo que escriben.
7. **Dar la vuelta a la lectura.** Con la comprobación del paso 5 en cero durante varios días de uso real,
   el servidor carga los trabajos desde Postgres al arrancar y descarga de Storage los archivos que falten.
   El JSON en disco pasa a ser copia de seguridad.
8. **Limpieza.** `docker-entrypoint.sh` deja de sembrar el volumen desde la imagen. Actualizar
   `studio/README.md` y `hermes-context.md`.

## Archivos que cambian

| Archivo | Cambio |
|---|---|
| `studio/server/supabase.ts` | nuevo |
| `studio/server/store.ts` | escritura doble; carga inicial desde Postgres (paso 7) |
| `studio/server/brandCards.ts` | escritura doble |
| `studio/server/standalone.ts` | subir resultado, miniatura e imágenes publicadas; descargar si falta |
| `studio/server/heroImage.ts` | subir la imagen generada |
| `studio/server/index.ts` | esperar la carga inicial antes de escuchar; vaciar la cola en SIGTERM |
| `studio/supabase/migrate-to-supabase.ts` | nuevo: migra y comprueba (`--check` solo comprueba). Fuera de `scripts/`, que vigila el lock del motor |
| `studio/docker-entrypoint.sh` | paso 8 |
| `package.json` | sin cambios: `supabase.ts` usa el `fetch` de Node, sin dependencia nueva (decidido al hacer el paso 2) |

No cambian: `studio/web/*`, `studio/worker/*`, las rutas `/api`, ni `vercel.json`.

## Cómo se da marcha atrás

Hasta el paso 7, quitar las dos variables de Supabase en Railway devuelve el sistema al estado de hoy: el
disco sigue completo. Después del paso 7, el JSON en disco se sigue escribiendo, así que la vuelta atrás es
un interruptor (`STORE_SOURCE=disk`) más un redeploy.

## Riesgos

- **Pérdida del último cambio** si el servidor muere con la cola sin vaciar. Mitigado con el SIGTERM y con
  la comprobación de paridad; no eliminado.
- **Tamaño de `/api/worker/jobs/:id/complete`** (hasta 80 MB con imágenes incrustadas): la subida a Storage
  se hace después de responder al worker, para no alargar esa petición.
- **Plan de Supabase:** el gratuito da 1 GB de Storage y pausa el proyecto tras una semana sin uso. Con lo
  medido en local ya se roza el límite; hay que contar con el plan Pro.
- **Datos de clientes en un servicio nuevo:** briefs y newsletters pasan a estar en Supabase. Conviene
  confirmar región UE y quién tiene acceso al proyecto.

## Qué necesito de ti para empezar

1. Que crees el proyecto de Supabase (o me digas en cuál) y pongas las dos variables en Railway.
2. Confirmar el plan Pro, o que acepto el gratuito para las pruebas.
3. El visto bueno a la decisión de diseño (copia en memoria + escritura doble) frente a reescribir el
   almacén como asíncrono ya en esta fase.
