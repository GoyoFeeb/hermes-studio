# PROMPT 24 — Archivar restos aspiracionales y residuos puntuales

## CONTEXTO

Eres el Orchestrator de Hermes. Continúa F4 (prompt 23 ya archivó React Email). Esta ronda
limpia el resto del inventario "a retirar" del plan (§1.2, §1.3): piezas documentadas pero
vacías o fantasma, scripts puntuales de sesiones pasadas, y los residuos concretos que F1-F3
fueron dejando documentados como "no se pudo borrar por restricción de la carpeta montada, se
puede borrar manualmente sin riesgo" — ahora sí se intenta de verdad, con
`allow_cowork_file_delete`.

## TAREAS

1. **Scripts puntuales** → mover contenido a `_archive/f4-scripts-puntuales/` y borrar
   originales (mismo procedimiento del README del pack): `shot-tmp.js`, `shot-g8.js`,
   `shot-fix.js` (raíz), `convert-icons.py` (raíz), `scripts/convert-assets.js`,
   `scripts/convert-assets.py`, `scripts/create-circles.js`, `scripts/fix-asset-paths.py`.

2. **`ejemplo-proyecto/`** → copiar a `_archive/f4-ejemplo-proyecto/`, borrar original.

3. **`.hermes/desktop-attachments/`** → verificar que está vacío o sin función real antes de
   tocar; si confirma "sin función" (como dice el plan), borrar directamente (no hace falta
   archivar contenido sin valor).

4. **`newsletter-system/core/components/`** (6 componentes pre-G1: `list-accent-bar.html`,
   `hero-editorial-no-photo.html`, `component-gallery.html`, `trust-checkmark.html`,
   `closing-band.html`, `section-divider.html`) → copiar a
   `_archive/f4-core-components-pre-g1/`, borrar originales. Motivo: la extracción real de F1
   se hizo desde `v5-premium/final-premium-v2.html` (post-ronda-10), no desde estos — mantener
   ambos vivos es la clase de duplicación que el plan prohíbe explícitamente (§5).

5. **`newsletter-system/campaigns/`** (9 de 10 carpetas de género vacías; solo `saving/base.html`
   tiene contenido) → borrar las 9 carpetas vacías. `saving/base.html` — comparar contra
   `patterns/saving.md` (el patrón real de F1); si es contenido superseded, archivar a
   `_archive/f4-campaigns-vacias/saving-base.html` y borrar el original; si aporta algo que
   `patterns/saving.md` no cubre, señalarlo como hallazgo en vez de borrarlo sin más.

6. **`brand-library/`** (marcada muerta por su propio README: "sin mecanismo activo que la
   consuma") → copiar a `_archive/f4-brand-library/`, borrar original.

7. **Residuos puntuales ya documentados en `engine/CHANGELOG.md` (F1)**:
   - `newsletters/2026/newsletter-system/engine/` (directorio stray de la ruta incorrecta
     inicial del prompt 11, contiene solo un subdirectorio `components/` vacío) → borrar.
   - `newsletters/2026/newsletter-system/brands/test-broken/` (brand pack de prueba del
     prompt 13) → borrar.
   - `agentes/` (directorio vacío, superseded por `agents/` desde F2) → borrar.

8. Actualizar `docs/auditoria-total-y-plan-transformacion-2026-07-17.md` NO — es un documento
   histórico de auditoría, no se edita para reflejar limpiezas posteriores (falsificaría el
   registro de cuándo se encontró cada cosa). En su lugar, la actualización de "qué sigue vivo"
   va en el prompt 25 (saneamiento de docs vigentes, no históricos).

## RESTRICCIONES

- No archivar ni borrar nada de `newsletters/2026/paraycompara/`,
  `newsletters/2026/demo/2026-jul-test/09-exports` ni ninguna campaña con entregas reales —
  esta ronda solo toca las piezas de infraestructura de sistema listadas arriba.
- Verificar contenido antes de borrar cualquier cosa marcada "vacía" — confirmar con `ls`/`find`
  que de verdad no hay nada dentro, no asumir por el nombre.
- Mismo procedimiento de `allow_cowork_file_delete` que el prompt 23; documentar cualquier
  denegación sin insistir.

## CRITERIOS DE ACEPTACIÓN

- [ ] Scripts puntuales archivados y borrados (o con `ARCHIVED.md` si no se pudo)
- [ ] `ejemplo-proyecto/` archivado
- [ ] `core/components/` pre-G1 archivado, con motivo documentado
- [ ] 9 carpetas vacías de `campaigns/` eliminadas; `saving/base.html` resuelto (archivado o
      señalado como hallazgo)
- [ ] `brand-library/` archivado
- [ ] Los 3 residuos puntuales de F1 (stray `engine/`, `test-broken/`, `agentes/`) resueltos
- [ ] Cada acción de borrado documentada: éxito, o denegación de permiso con nota explícita
