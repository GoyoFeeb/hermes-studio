# F4 — Limpieza: cerrada

**Fecha de cierre:** 2026-07-21

**Veredicto:** APTO. Todo lo catalogado en el plan (§1.2, §1.3, §4) se archivó o eliminó según
correspondía; la documentación vigente ya no describe el pipeline React Email ni componentes
core pre-G1 como si fueran el camino operativo actual.

## Restricción técnica encontrada y resuelta

Los archivos de la carpeta montada no se pueden borrar/renombrar directamente
(`rm`/`mv` fallan con "Operation not permitted"). Se resolvió con la herramienta
`allow_cowork_file_delete`: una sola aprobación del usuario sobre `react-email-template/`
habilitó el borrado para toda la carpeta montada, válido durante el resto de la fase.
Procedimiento seguido en cada pieza: copiar a `_archive/f4-*/` primero (con `README.md`
explicando qué es y por qué se archivó), luego borrar el original.

## Qué se archivó

| Pieza | Destino | Borrado del original |
|---|---|---|
| `react-email-template/` | `_archive/f4-react-email-pipeline/react-email-template/` | ✅ |
| `07-code/react-email/` × 4 campañas (`2026-jul-ahorra-fibra-movil`, `demo/2026-jul-test`, `_campaign-template`, `nombre-cliente/...`) | `_archive/f4-react-email-pipeline/campaigns/.../07-code/react-email/` | ✅ |
| `scripts/export-html.tsx`, `scripts/prepare-react-email.ts` | `_archive/f4-react-email-pipeline/` | ✅ |
| Scripts puntuales (`shot-tmp.js`, `shot-g8.js`, `shot-fix.js`, `convert-icons.py`, `scripts/convert-assets.{js,py}`, `scripts/create-circles.js`, `scripts/fix-asset-paths.py`) | `_archive/f4-scripts-puntuales/` | ✅ |
| `.hermes/desktop-attachments/` (2 exports muy tempranos) | `_archive/f4-desktop-attachments/` | ✅ |
| `newsletter-system/core/components/` (6 componentes pre-G1) | `_archive/f4-core-components-pre-g1/` | ✅ |
| `newsletter-system/campaigns/saving/base.html` | `_archive/f4-campaigns-vacias/saving-base.html` | ✅ |
| `brand-library/_template/` | `_archive/f4-brand-library/` | ✅ |
| `ejemplo-proyecto/` | `_archive/f4-ejemplo-proyecto/` | ✅ |

## Qué se eliminó directamente (sin contenido de valor que archivar)

- 9 de 10 carpetas de `newsletter-system/campaigns/` (vacías) + la carpeta `campaigns/` misma tras vaciarla.
- Residuos puntuales ya documentados en `engine/CHANGELOG.md` durante F1: el directorio
  `newsletters/2026/newsletter-system/engine/` (ruta stray de un error de ubicación inicial,
  solo contenía un subdirectorio `components/` vacío), `newsletters/2026/newsletter-system/brands/test-broken/`
  (brand pack de prueba del prompt 13), `agentes/` (directorio vacío, superseded por `agents/`
  desde F2).

## Documentación saneada

- `newsletters/2026/newsletter-system/docs/guides/migration-map.md` — marcado `[SUPERSEDED]`
  con explicación de por qué (listaba ~13 componentes de los que solo 6 existían, y esos 6 ya
  se archivaron); contenido histórico conservado, no borrado.
- `pipeline-skill/SKILL.md` — banner al inicio: 00-06 siguen siendo referencia válida, 07-09
  tienen contrato nuevo en `agents/*.md`, secciones específicas de React Email marcadas
  históricas.
- `pipeline-skill/references/agent-roles.md`, `phase-gates.md`, `script-usage.md` — fila/sección
  07 (y las entradas `prepare-react-email`/`export-html`) marcadas `[SUPERSEDED]`/`[ARCHIVADO]`
  con puntero al contrato vigente, sin borrar la tabla original (fue la base real de la que
  partió F2).
- `docs/workflow.md`, `docs/campaign-lifecycle.md` — fase 07 / condición de salida `development`
  marcadas superseded con la condición vigente al lado.
- 3 plantillas `campaign-status.md` (`_campaign-template`, `demo/2026-jul-test`,
  `nombre-cliente/...`) — el ítem de checklist "React Email Development" renombrado a "HTML
  Email Development (motor)".
- `package.json` (hecho en el prompt 23): descripción actualizada, dependencias de React
  quitadas (nada las usaba), scripts `prepare-react-email`/`export-html` eliminados, scripts de
  F1/F3 (`build-newsletter`, `check-parity`, `check-control-files`, `production-gate-motor`)
  añadidos.
- Documentos de auditoría histórica (`docs/auditoria-*.md`, `docs/re-auditoria-*.md`) — **no
  se tocaron**, por diseño: son el registro de lo que se encontró y cuándo.

## Verificación final

`grep` de rutas archivadas/borradas contra toda la documentación vigente (`docs/`,
`pipeline-skill/`, `agents/`, `engine/`, `patterns/`): toda mención restante tiene una nota
`[SUPERSEDED]`/`[ARCHIVADO]` junto a ella o vive en un documento de auditoría histórica que no
se edita por diseño. `find . -iname "*react-email*" -not -path "*/_archive/*"` y equivalentes
para el resto de piezas archivadas: 0 resultados fuera de `_archive/`.

## Limitaciones conocidas

- `docs/naming-conventions.md` menciona `react-email-template/` como EJEMPLO de convención de
  nombres (kebab-case), no como referencia operativa — se dejó sin tocar deliberadamente, no es
  una referencia rota.
- El contenido de `_archive/` no se ha vuelto a intentar borrar tras copiarlo — es intencional,
  es el propio archivo histórico.
- No se auditó exhaustivamente cada archivo de `docs/` uno por uno (serían decenas); la
  verificación fue por grep de rutas conocidas como archivadas/borradas, no una relectura
  completa de toda la documentación del sistema.

## Siguiente fase

F5 (prueba real end-to-end, un solo prompt, cero intervención manual de diseño) sigue
pendiente, según el orden del plan (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`
§4) — depende de que F1-F4 estén cerradas, que ya lo están.
