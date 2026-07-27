# PROMPT 25 — Sanear documentación vigente y cerrar F4

## CONTEXTO

Eres el Orchestrator de Hermes. F4 casi cerrada (prompts 23-24 archivaron React Email y los
restos aspiracionales/residuos). Última ronda: que la documentación VIGENTE (no los documentos
históricos de auditoría, que no se tocan) describa el sistema real — objetivo explícito del
plan §1.2: "antes de crecer, hay que hacer que docs = realidad".

## TAREAS

1. **`newsletters/2026/newsletter-system/docs/guides/migration-map.md`** (el documento
   "fantasma" que el plan señala en §1.2 — lista ~13 componentes de los que solo existían 6,
   y esos 6 se archivaron en el prompt 24): actualizar para que refleje la arquitectura real
   post-F1-F4 (motor en `engine/`, sin `core/components/`) o, si ya no tiene función alguna
   tras la limpieza, marcarlo con una cabecera `[SUPERSEDED — ver engine/README.md y
   docs/f1-motor-cerrado.md]` sin borrar su contenido histórico.

2. **READMEs de campaña** (`newsletters/_campaign-template/README.md`,
   `newsletters/2026/*/README.md` de las campañas de plantilla/demo): revisar que no describan
   pasos de "07 — React Email Development" como si fuera el camino vigente — actualizar la
   referencia a `agents/07-html-email-developer.md` (F2) o añadir nota de que el pipeline real
   hoy es el motor.

3. **`README.md` raíz de `sistema-final/`** (si existe) y `pipeline-skill/SKILL.md`: grep de
   menciones a React Email / componentes de `core/` que ya no existen tras F4; actualizar o
   marcar como histórico.

4. **Verificación final de "docs = realidad"**: recorrer cada referencia rota que quede
   (`grep -rn` de rutas que el prompt 24 haya borrado, contra toda la documentación vigente en
   `docs/`, `pipeline-skill/`, `agents/`, `engine/`, `patterns/`) y confirmar que ninguna apunta
   a algo que ya no existe sin una nota de "archivado en `_archive/...`".

5. **Cierre de F4**: `docs/f4-limpieza-cerrada.md` (mismo formato que los cierres anteriores):
   fecha, qué se archivó (tabla con ruta original → ruta de archivo, y qué se pudo borrar vs.
   qué quedó con `ARCHIVED.md` por permiso denegado), qué se saneó en docs, limitaciones
   conocidas. Marcar `prompts-fase4-limpieza/README.md` como completado.

## RESTRICCIONES

- No editar `docs/auditoria-total-y-plan-transformacion-2026-07-17.md`,
  `docs/re-auditoria-sistema-hermes-2026-07-17.md`, ni ningún otro documento de auditoría
  histórica — son el registro de lo que se encontró y cuándo, no se reescriben con
  retrospectiva.
- No archivar ni tocar nada nuevo en esta ronda — solo edición de documentación y el informe de
  cierre.

## CRITERIOS DE ACEPTACIÓN

- [ ] `migration-map.md` actualizado o marcado superseded, sin borrar su historia
- [ ] READMEs de campaña sin describir React Email como el camino vigente
- [ ] 0 referencias rotas sin nota de archivado en la documentación vigente
- [ ] `docs/f4-limpieza-cerrada.md` completo
- [ ] `prompts-fase4-limpieza/README.md` marcado completado
