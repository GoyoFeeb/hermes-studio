# PROMPT 23 — Archivar el pipeline React Email (motor perdedor)

## CONTEXTO

Eres el Orchestrator de Hermes. F1-F3 están cerradas: el motor (`engine/`) es el único camino
validado (`docs/f1-motor-cerrado.md`). El plan (§1.3) marca React Email como "motor perdedor,
decisión ya tomada: HTML+juice" — su única producción real fue un `final.html` de colores
incorrectos ya archivado en su día. Toca archivarlo formalmente.

## TAREAS

1. Crear `_archive/f4-react-email-pipeline/` con esta estructura, copiando (no moviendo) el
   contenido real:
   - `react-email-template/` completo (template, componentes, schema)
   - Por cada campaña con `07-code/react-email/` no vacío
     (`2026-jul-ahorra-fibra-movil`, `demo/2026-jul-test`, `_campaign-template`,
     `nombre-cliente/2026-jul-nombre-campana`, `ejemplo-proyecto/...` si aplica): una copia
     bajo `_archive/f4-react-email-pipeline/campaigns/{client}/{campaign}/07-code/react-email/`
   - `scripts/export-html.tsx`, `scripts/prepare-react-email.ts`
   - `newsletter-system/.../newsletter-schema.json` (el de formato de módulos React, si existe
     fuera de `react-email-template/`)
   - Un `README.md` en la raíz del archivo explicando qué es esto, por qué se archivó, fecha,
     y qué lo sustituye (`engine/`).

2. Intentar borrar los originales (`react-email-template/`, cada `07-code/react-email/`,
   `scripts/export-html.tsx`, `scripts/prepare-react-email.ts`) siguiendo el procedimiento del
   README del pack (`rm -rf` → si falla, `allow_cowork_file_delete` → reintentar → si sigue
   fallando, dejar un `ARCHIVED.md` en el sitio original en vez de fingir que se borró).

3. Actualizar `package.json`: los scripts `prepare-react-email` y `export-html` — si sus
   archivos fuente se borraron, quitar la entrada del `scripts` de `package.json` (con nota en
   el propio commit/cambio de qué se quitó y por qué); si no se pudieron borrar, dejar la
   entrada pero añadir un comentario o entrada en `pipeline-skill/references/script-usage.md`
   marcándolos `[ARCHIVADO — ver _archive/f4-react-email-pipeline/]`.

4. Actualizar `pipeline-skill/references/script-usage.md` y `pipeline-skill/references/agent-roles.md`
   (fila 07, que hoy sigue diciendo "React Email Developer" en la referencia base) con una nota
   de que ese rol está superseded por `agents/07-html-email-developer.md` (F2) — sin borrar la
   fila (sigue siendo la base documentada de la que partió F2, tiene valor histórico).

## RESTRICCIONES

- No tocar `06-data/` ni `09-exports/` de ninguna campaña real — solo `07-code/react-email/`.
- No tocar `engine/` en absoluto.
- Si `allow_cowork_file_delete` deniega el permiso para alguna ruta, no insistir ni buscar
  rodeos (`sudo`, cambiar permisos, etc.) — documentar y seguir.

## CRITERIOS DE ACEPTACIÓN

- [ ] `_archive/f4-react-email-pipeline/` con todo el contenido copiado y un README explicativo
- [ ] Originales borrados donde el permiso lo permitió; `ARCHIVED.md` donde no
- [ ] `package.json` sin scripts rotos apuntando a archivos ya archivados sin nota
- [ ] `script-usage.md` y `agent-roles.md` actualizados con la nota de superseded
