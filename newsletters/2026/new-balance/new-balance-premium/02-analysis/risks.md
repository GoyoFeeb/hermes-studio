# Risks: New Balance — new-balance-premium

## Riesgos detectados

| ID | Riesgo | Severidad | Módulo | Mitigación |
|---|---|---|---|---|
| R-001 | Logo solo disponible como SVG en la web | Media | Header | Capturar screenshot y convertir a PNG. Marcar como PENDING-CDN-UPLOAD hasta CDN |
| R-002 | ITC Garamond W01 es fuente de pago — no disponible en email | Media | Tipografía | Usar Georgia como fallback premium. Aceptar que no es idéntico |
| R-003 | Proxima Nova W01 es fuente de pago — no disponible en email | Baja | Tipografía | Usar Helvetica/Arial como fallback. Son visualmente similares |
| R-004 | Dos familias tipográficas distintas (serif + sans) sin webFont único | Baja | Tipografía | No declarar webFont. Usar family system stack para cuerpo y Georgia para display |
| R-005 | Sin iconos en toda la comunicación — requiere variantes -sin-icono | Baja | Componentes | Ya documentado en brand pack. Usar columns-3-beneficios-sin-icono |
| R-006 | Campaña de test — isTestCampaign: true, productionReady: false | Informativo | General | No se enviará. Es validación del motor y brand pack |
| R-007 | Banner hero generado localmente no visible en HTML hasta CDN | Media | Hero | Documentar estado: bannerSrc = PENDING-CDN-UPLOAD hasta CDN real |
| R-008 | No hay claims comerciales que verificar — copy editorial | Ninguno | Claims | Sin riesgo. Motor claims gate pasará sin incidencias |
