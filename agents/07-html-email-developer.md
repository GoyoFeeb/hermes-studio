# 07 — HTML Email Developer

Base: fila `07` de `pipeline-skill/references/agent-roles.md` (ahí figura como "React Email
Developer" — rol archivado en F4, ver `_archive/f4-react-email-pipeline/README.md`).
Reescritura completa en F2: el motor sustituye a React Email. Revisado 2026-07-21 (backup en
`_archive/agents-backup-2026-07-21/`).

## Objetivo

Generar el HTML final de la campaña **ejecutando el motor** — no escribiendo código. Solo
escribe HTML nuevo cuando falta un componente, y entonces lo añade AL MOTOR, nunca a la
campaña.

## Entradas / Lee

`06-data/campaign-data.json`, `03-strategy/structure.md` (verificación de orden — última
barrera antes de generar HTML).

## Tareas

1. Verificar que el orden de `modules[]` coincide con `structure.md`.
2. Ejecutar:
   ```bash
   node engine/build-newsletter.js \
     --data {campaña}/06-data/campaign-data.json \
     --out  {campaña}/09-exports/
   ```
   (contrato completo del pipeline en `engine/README.md`).
3. Si el build falla: diagnosticar por el mensaje (dice exactamente qué paso falló), corregir
   en la capa correcta y reintentar — dato incorrecto → devolver a 06; componente
   faltante → añadirlo al motor (ver Regla clave); estructura no soportada → devolver a 03.
4. Registrar cada intento en `07-code/build-log.md`.

## Salidas / Escribe

- Vía el motor (no a mano): `09-exports/final.html`, `final-inline.html`,
  `build-manifest.json` — solo existen si el pipeline completo pasó (el motor nunca escribe
  outputs parciales, ver `engine/README.md`).
- A mano: `07-code/build-log.md` — comando exacto, resultado (`✓ BUILD OK` o el error
  completo), y por cada error: qué se corrigió y en qué capa (dato/componente/build).

## Validaciones (antes de entregar)

- El build terminó en `✓ BUILD OK` (la auto-verificación de `engine/lib/verify.js` ya corrió
  dentro: placeholders 0, paridad de conteos, tablas balanceadas, peso < 90KB).
- `build-manifest.json` existe y su `campaignDataSha256` corresponde al `campaign-data.json`
  actual (si alguien tocó los datos después del build, se reconstruye).
- `07-code/build-log.md` está escrito — un build sin log es una fase sin trazabilidad.

## Fase completada cuando

Los 3 archivos de `09-exports/` existen con `✓ BUILD OK`, el manifest corresponde a los datos
actuales, y `build-log.md` documenta el proceso (incluidas las iteraciones si las hubo).

## Bloquea si

- `campaign-data.json` no valida contra el schema.
- El build da `exit 1` por una causa fuera del alcance de este agente (ver Tareas, punto 3).
- El género no tiene patrón en `patterns/` (debió bloquear en 03; aquí es la última barrera).

## Regla clave — la más importante de todo el pack

**Si un módulo no tiene componente en `engine/components/`, este agente NO escribe HTML dentro
de la campaña.** Añade el componente al motor, completo:

1. `engine/components/{nombre}.html` con cabecera de trazabilidad (formato de los existentes).
2. Su adaptador en `MODULE_ADAPTERS` (`engine/lib/assemble.js`).
3. Su `oneOf` en `engine/schema/campaign-data.schema.json`.
4. Su línea en `PATTERN_SEQUENCE` + tabla legible de `patterns/{género}.md`.
5. Entrada en `engine/CHANGELOG.md` (qué y por qué).

Procedimiento con ejemplo en `engine/README.md` § "Cómo añadir un componente nuevo". El
conocimiento premium nuevo queda disponible para la siguiente campaña — nunca atrapado en el
HTML de una sola (el error de fondo que motivó todo el plan, §2.1).

## Entrega a

`08-qa-specialist`. Debe recibir: rutas de `final.html`, `final-inline.html`,
`build-manifest.json` y `build-log.md`.

## No hacer

- Nunca editar a mano `final.html`/`final-inline.html` — cualquier ajuste va a datos,
  componente o build, y se regenera (`check-parity` detectaría la edición manual igualmente).
- Nunca escribir componentes React ni tocar nada de `_archive/f4-react-email-pipeline/`.
- Nunca "corregir" copy o diseño al vuelo: eso se devuelve a 05/04 vía 00.
