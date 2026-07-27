# Risks — BMW Experiencia Premium

## Riesgos técnicos

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| R1 | **Logo BMW no disponible** — el brand pack no tiene logo capturado. El header usará `PENDING-BMW-LOGO` como placeholder. | El header aparecerá sin logo real en previews de test. | Documentado como bloqueo conocido. Subir logo oficial PNG/vector desde bmw.es antes de producción. |
| R2 | **Hero banner no subido al CDN** — la imagen generada por `hero-imagen` queda en local hasta subida manual al CDN. | Gate de assets falla (esperado en test campaign). | `isTestCampaign: true` — no bloquea. Documentar en next-steps.md. |
| R3 | **URL principal no verificada con la marca** — `https://www.bmw.es/es/home.html` es la página principal de BMW España pero no fue verificada con un representante de BMW. | La URL podría cambiar o no ser la deseada para la campaña. | Confirmada por el usuario como URL principal. Marcada como "pendiente de aprobación cliente" en la documentación. |
| R4 | **Fuente web Titillium Web** — cargada desde Google Fonts, puede no renderizar en algunos clientes de email (Gmail app, Outlook). | Fallback a Arial/Helvetica/sans-serif. La pieza se ve diferente sin la display font. | Aceptado. El brand pack documenta que Arial es el fallback primario y es consistente con la identidad BMW. |

## Riesgos de claims

| # | Riesgo | Nivel | Mitigación |
|---|--------|-------|------------|
| R5 | **Uso involuntario de "potencia"** en copy — el claims checker tiene regla HIGH para `\bpotencia\b`. | Alto | Reformular: usar "energía", "respuesta", "rendimiento". Ver skill reference bmw-m4-campaign. |
| R6 | **Uso involuntario de "0 a 100"** — el claims checker tiene regla HIGH para `\b0\s*a\s*100\b`. | Alto | Reformular: "aceleración hasta los 100 km/h". |
| R7 | **Uso involuntario de "tracción integral"** — el claims checker tiene regla HIGH para `\btracción\s*integral\b`. | Alto | Usar "M xDrive" (sistema específico BMW). |
| R8 | **Comparativas no verificadas** — cualquier comparativo ("mejor", "líder") sin evidencia. | Alto | No usar comparativos sin confirmación textual del brief. |

## Riesgos de producción

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| R9 | **Dirección física pendiente** — el `legalLine` usa `[DIRECCIÓN FÍSICA — pendiente del cliente]` | No se puede enviar sin dirección física real (requisito legal). | Bloqueo de producción documentado. No bloquea test campaign. |
| R10 | **Links de unsubscribe/preferences** — usan `[UNSUBSCRIBE_LINK]` y `[PREFERENCES_LINK]` | El ESP debe proporcionar estos enlaces. | Bloqueo de producción documentado. Placeholders aceptables en test. |
