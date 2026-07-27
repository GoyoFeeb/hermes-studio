# 07 — HTML Email Developer

Fase 2 del plan de transformación. Base: fila `07` de
`pipeline-skill/references/agent-roles.md` (ahí figura como "React Email Developer").
**Reescritura completa, no extensión** (plan §3.1): el motor (`engine/`, F1) sustituye por
completo a React Email. Este es el agente que más cambia de todo el pack — léelo entero antes
de operar, no solo la tabla resumen.

## Rol

Genera el HTML final de la campaña. A diferencia del diseño original, no escribe código: **
ejecuta el motor**. Solo escribe HTML nuevo cuando el patrón necesita un componente que no
existe todavía — y en ese caso, el HTML nuevo se añade al motor, nunca a la campaña.

## Lee

`06-data/campaign-data.json`, `03-strategy/structure.md` (para verificar que el orden de
`modules[]` coincide con lo que decidió 03).

## Ejecuta (no escribe a mano)

```bash
node engine/build-newsletter.js \
  --data {campaña}/06-data/campaign-data.json \
  --out  {campaña}/09-exports/
```

Contrato completo del pipeline (validación de schema → carga de tokens → resolución de patrón
→ ensamblado → inline con juice → auto-verificación → escritura) en `engine/README.md`. Si el
build termina en `exit 1`, el mensaje dice exactamente qué falló y en qué paso — no hay que
adivinar ni reintentar a ciegas.

## Escribe

Nada **a mano** en `09-exports/` — pero el comando de la sección anterior sí produce, como
efecto de su ejecución, los 3 archivos que 08 espera encontrar ahí: `09-exports/final.html`,
`09-exports/final-inline.html` y `09-exports/build-manifest.json`. Es la salida real de este
agente, solo que generada por el motor en vez de escrita directamente — y solo existe si el
pipeline completo pasó (`engine/README.md`, sección "Garantía de no dejar outputs parciales":
el build nunca escribe un `final.html` inválido, porque no escribe nada hasta que validación,
ensamblado, inline y auto-verificación pasaron los 6 pasos).

El agente además escribe a mano `07-code/build-log.md` (formato libre): el comando exacto
ejecutado, el resultado (`✓ BUILD OK` o el mensaje de error completo) y, si hubo error, qué se
corrigió y en qué capa (dato / componente / build) antes de reintentar — para que quede rastro
de cuántas iteraciones hicieron falta.

## Entrega a

`08-qa-specialist`

## Bloquea si

- `campaign-data.json` no valida contra el schema
- El build termina en `exit 1` por cualquier motivo, y la causa no se puede resolver dentro
  del alcance de este agente (ver regla clave abajo — un componente faltante SÍ se resuelve
  aquí; un dato faltante se devuelve a 06; una estructura que el patrón no soporta se devuelve
  a 03)
- El género de la campaña no tiene patrón en `patterns/` (debería haber bloqueado ya en 03,
  pero 07 es la última barrera antes de generar HTML — no se genera nada sin patrón)

## Regla clave — la más importante de todo este pack

**Si un módulo de `campaign-data.json` no tiene componente en `engine/components/`, este
agente NO escribe HTML dentro de la campaña.** Añade el componente nuevo al motor:

1. `engine/components/{nombre}.html`, con cabecera de trazabilidad (origen, tokens, campos de
   datos) igual que los componentes existentes.
2. Su adaptador en `MODULE_ADAPTERS` de `engine/lib/assemble.js`.
3. Su `oneOf` correspondiente en `engine/schema/campaign-data.schema.json`.
4. Su línea en el bloque `PATTERN_SEQUENCE` (y la tabla legible) de `patterns/{género}.md`.
5. Entrada nueva en `engine/CHANGELOG.md` documentando qué se añadió y por qué.

Procedimiento completo, con ejemplo, en la sección "Cómo añadir un componente nuevo" de
`engine/README.md`. El conocimiento premium nuevo se queda disponible para la siguiente
campaña que lo necesite — nunca atrapado en el HTML de una sola campaña, que es exactamente el
error de fondo que causó todo el trabajo de F1 (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`
§2.1: "el conocimiento premium no está donde el pipeline lo busca").
