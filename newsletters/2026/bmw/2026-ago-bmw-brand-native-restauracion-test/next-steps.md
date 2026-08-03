# next-steps.md

| # | Pendiente | Responsable | Prioridad | Impacto en producción |
|---|---|---|---|---|
| 1 | Generar hero banner con `generate-hero-image` | 07 — HTML Email Developer | Alta | bannerSrc placeholder → real |
| 2 | Subir hero/banner/logo al CDN | 09 — Export Manager | Alta | URLs placeholder → reales |
| 3 | Actualizar `bannerSrc` en campaign-data.json | 06 — Data Specialist | Alta | Hero imagen roto sin CDN |
| 4 | Sustituir placeholders legales (dirección física, copyright) | Cliente | Alta | Footer incompleto |
| 5 | Validar claims técnicos (velocidad, aceleración, potencia) | Cliente | Media | Las métricas son ilustrativas de test |
| 6 | Cambiar `isTestCampaign` a `false` | Orchestrator | Alta | Antes de producción |
| 7 | Cambiar `productionReady` a `true` | Orchestrator | Alta | Antes de producción |
| 8 | Re-ejecutar `production-gate-motor` tras resolver bloqueos | Orchestrator | Alta | Gate de cierre |
