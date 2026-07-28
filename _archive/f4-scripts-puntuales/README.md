# Archivo — scripts puntuales de sesiones pasadas

**Fecha de archivado:** 2026-07-21 (F4, `docs/auditoria-total-y-plan-transformacion-2026-07-17.md` §1.3).

Scripts de un solo uso de rondas anteriores, superseded por `scripts/render-preview.js` y el
flujo de ronda 07 (iconos oficiales) documentado en `engine/CHANGELOG.md`. Ninguno se importa
desde ningún otro archivo del sistema (verificado antes de archivar).

- `shot-tmp.js`, `shot-g8.js`, `shot-fix.js` — capturas puntuales de rondas G8/G8.1.
- `convert-icons.py` — conversión de iconos de una ronda concreta (ronda 07, ya completada).

**Añadidos 2026-07-28 (auditoría técnica)** — mismo patrón, encontrados sueltos en `scripts/`
en vez de aquí:
- `prepare-preview.py` — reescribe assets a `file://` absoluto para previsualizar localmente la
  campaña `2026-jul-ahorra-fibra-movil`; ruta de campaña y ruta absoluta del desarrollador
  hardcodeadas dentro del script, no como argumentos. Un solo uso, no genérico.
- `_validate-nike.mjs` — valida `campaign-data.json` de la campaña Nike
  `2026-jul-nike-pegasus-42` contra el schema; ruta de campaña hardcodeada. Para validar
  cualquier campaña de forma genérica, usar el schema check integrado en
  `engine/build-newsletter.js` (Gate 1) o `production-gate-motor.ts`.
- `scripts/convert-assets.js`, `scripts/convert-assets.py`, `scripts/create-circles.js`,
  `scripts/fix-asset-paths.py` — utilidades puntuales de preparación de assets, sesión de julio.
