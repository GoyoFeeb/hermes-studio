# Task Log — 2026-jul-adeslas-seguro-medico

## 2026-07-22

| Hora | Acción | Detalle |
|------|--------|---------|
| — | Creación de campaña | Inicio del pipeline para Adeslas Seguro Médico |
| — | Brand tokens | Creado brands/adeslas/tokens/brand-tokens.json v2.2.0 |
| — | Brief | Creado 00-brief/brief.md con concepto, audiencia, estructura |
| — | Copy | Creado 04-copy/copy.md con 10 subject lines, 10 preheaders, todos los textos |
| — | Campaign data | Creado 06-data/campaign-data.json respetando schema y patrón institutional |
| — | QA report | Creado 05-qa/qa-report.md con pre-build checks |
| — | Control files | Creados campaign-status.md, handoff.md, task-log.md, next-steps.md |
| — | Build | ⬜ Pendiente |
| — | Verification | ⬜ Pendiente |

## Decisiones

1. **Patrón**: Se usa institutional (no saving) porque es el patrón adecuado para contenido de marca institucional como seguros de salud.

2. **Módulos excluidos**: No se incluyen `pasos` ni `trust-bar` porque no forman parte de la secuencia del patrón institutional. En su lugar, `usp-cards` cumple la función de 3 puntos de credibilidad.

3. **Icons**: Se usan emojis (iconGlyph) en todos los componentes. No hay assets de icono confirmados por el cliente. El brand pack lo documenta en iconography.componentImplication.

4. **Layout**: centrado (valor por defecto del patrón institutional para marcas nuevas sin preferencia documentada).

5. **Placeholders**: Todos los datos que requieren confirmación del cliente se dejan como {{PLACEHOLDER}} — aceptable para test campaign.
