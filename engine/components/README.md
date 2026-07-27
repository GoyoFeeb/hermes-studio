# ⛔ NO REGENERAR ESTOS COMPONENTES

Esta biblioteca es el resultado de F1 del plan de transformación: 15+ rondas de refinamiento
validadas con render real, capturadas una sola vez. **Re-extraerla "desde cero" destruye ese
trabajo** — ya ocurrió una vez (incidente 2026-07-21, ver `engine/CHANGELOG.md`) y costó una
restauración completa.

- Verificar integridad: `npm run check-engine` (compara cada archivo contra `engine/components.lock.json`).
- Añadir un componente NUEVO: procedimiento de 5 pasos en `engine/README.md` § "Cómo añadir
  un componente nuevo" (incluye regenerar el lock).
- Modificar uno existente: solo con motivo documentado en `engine/CHANGELOG.md` + regenerar
  el lock (`npm run check-engine -- --update`).
- El contrato de datos de cada componente está en `INVENTORY.md` y en MODULE_ADAPTERS
  (`lib/assemble.js`) — deben cambiar JUNTOS o el build falla.
