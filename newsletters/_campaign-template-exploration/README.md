# Campaña de exploración rápida

> Añadido 2026-08-20 — ver `memory.md` (entrada 2026-08-20, "modo exploración") y
> `agents/00-orchestrator.md` §"Modo exploración" para el contexto completo de por qué existe.

Esta campaña se creó con `--mode exploration`. Comparada con `newsletters/_campaign-template/`
(pipeline completo, ~50 archivos), esta plantilla tiene ~18: se difieren los archivos de traspaso
entre sesiones/agentes (control files, checklists de QA de Outlook/responsive, notas de entrega) y
el paquete "Nivel 5" de marca (CSS extraído, inventario de componentes, 4 guías) — **no** se
difiere nada de lo que decide si la campaña es fiel a la marca:

- **02 sigue midiendo con Chrome de verdad**: color/tipografía/CTA computados, tratamiento
  fotográfico, iconografía, ritmo de voz — las 6 dimensiones núcleo de
  `agents/02-brand-visual-analyst.md`, cada una con su `.source` real. Lo que se difiere son los
  8 archivos adicionales (CSS, inventario de componentes, guías) que documentan esa investigación
  para reutilización futura, no la investigación en sí.
- **03 sigue decidiendo estructura real** contra `layout.contentRhythm`/`brandStructure` de la
  marca — `03-strategy/brand-structure-translation.md` sigue siendo obligatorio.
- **El motor real construye el HTML** (`engine/build-newsletter.js`) — no hay ningún atajo aquí.
- **`production-gate-motor.ts` sigue auditando fidelidad de marca y diferenciación estructural**
  (Gate 12, la que detecta genericidad) — solo difiere las 5 gates que auditan cosas que no
  existen todavía en una exploración (paridad de export, HTTP 200 de assets desplegados, archivos
  de control, preparación de producción, informe Nivel 5).

## Antes de enviar de verdad

Si esta campaña pasa a producción real: cambiar `metadata.explorationMode` a `false` (o quitarlo),
completar los 8 archivos "Nivel 5" del brand pack si aún no existen para esta marca, y generar los
archivos de traspaso/QA que faltan — `production-gate-motor.ts` volverá a exigir las 5 gates
diferidas automáticamente en cuanto `explorationMode` no sea `true`.
