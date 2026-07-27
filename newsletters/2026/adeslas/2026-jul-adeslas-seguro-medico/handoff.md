# Handoff — Traspaso a Build

**From:** Orchestrator (brand + campaign data creation)
**To:** Motor de build (engine/build-newsletter.js)

## Contexto

Campaña completa de Adeslas — Seguro Médico, lista para build. Se han creado brand tokens, campaign data, brief, copy, y QA report. Todos los archivos están en la estructura esperada por el motor.

## Archivos entregados

| Archivo | Ruta |
|---------|------|
| Brand tokens | brands/adeslas/tokens/brand-tokens.json |
| Campaign data | newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/06-data/campaign-data.json |
| Brief | newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/00-brief/brief.md |
| Copy | newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/04-copy/copy.md |
| QA report | newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/05-qa/qa-report.md |

## Acción requerida

Ejecutar el build:
```
cd /Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final
node engine/build-newsletter.js \
  --data newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/06-data/campaign-data.json \
  --out newsletters/2026/adeslas/2026-jul-adeslas-seguro-medico/09-exports/
```

Luego ejecutar gates de verificación:
```
npm run check-engine
npm run check-parity
npm run check-control-files
npm run production-gate-motor
```

## Constraints

- Patrón: institutional (secuencia estricta: header-logo → hero-centrado → intro-cta → columns-3-beneficios → usp-cards → banda-cierre → footer)
- No incluir módulos fuera del patrón (no pasos, no trust-bar)
- Placeholders: {{ADESLAS_LOGO_URL}}, {{CTA_URL}}, {{LEGAL_ADDRESS}}, {{UNSUBSCRIBE_URL}}, {{PREFERENCES_URL}} — todos aceptables para test campaign

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Brand pack no encontrado | Baja | Ruta brands/adeslas/tokens/brand-tokens.json existe y es correcta |
| Faltan campos en campaign-data | Baja | Validado contra schema |
| Pattern validation falla | Baja | Secuencia respeta institutional pattern |
| Placeholders sin resolver en output | Media | Verificación post-build detecta restos {{ }} |

## Expected Output

- 09-exports/final.html — HTML fuente
- 09-exports/final-inline.html — HTML con CSS inline (juice)
- 09-exports/build-manifest.json — metadatos del build
