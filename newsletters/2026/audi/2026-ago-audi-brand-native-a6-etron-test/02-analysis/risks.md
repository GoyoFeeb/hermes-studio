# Risks — Audi A6 Sportback e-tron

## Riesgos de adaptación a email

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Logo Audi en SVG** — la web usa SVG inline de los anillos de Audi, no disponible como PNG | Header usa texto "AUDI" hasta obtener PNG | Pendiente en Q-002 |
| **AudiType no disponible en email** — fuente propietaria no embebible | Usar Inter como webFont alternativo + Arial fallback | Ya implementado en brand pack |
| **Hero-imagen requiere OpenAI API key** | Si no está configurada, no se puede generar arte | Documentado como bloqueo, no cambiar a hero-centrado |
| **Imágenes editorial-foto-texto sin assets CDN** | Usar placeholders PENDING-CDN-UPLOAD | Documentar en next-steps |
| **Datos WLTP pendientes de confirmación cliente** | Las cifras pueden variar | Marcar como "referencia oficial localizada" |
| **Contraste hero sobre fondo degradado** | El hero-imagen no superpone texto — va debajo | Ya verificado en patterns/fotografia-primero.md §4 |
| **Campaña es de prueba — isTestCampaign: true** | Gate 10 (production-readiness) fallará | Esperado — documentado como blocker de producción |
