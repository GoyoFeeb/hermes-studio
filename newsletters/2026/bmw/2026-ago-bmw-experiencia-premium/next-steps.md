# Next Steps — BMW Experiencia Premium

| # | Tarea | Responsable | Depende de | Estado |
|---|-------|-------------|------------|--------|
| 1 | QA visual — capturas 320/375/600/600-dark | Orchestrator (08) | Build completado | ⏳ |
| 2 | QA enlaces — verificar todas las URLs | Orchestrator (08) | Build completado | ⏳ |
| 3 | Subir budget del proyecto OpenAI (no el de organización) — ir a platform.openai.com → Projects → proj_veLRbaoUeib0ql6xH62MJHli → ajustar budget. O crear key nueva desde proyecto con crédito. | Usuario | Error exacto: `billing_hard_limit_reached`. Key sk-proj- scoped al proyecto `proj_veLRbaoUeib0ql6xH62MJHli`. Chat también falla: `insufficient_quota`. | ⏳ BLOQUEANTE |
| 4 | Reintentar generación hero: `npm run generate-hero-image -- --brand bmw --theme "Donde la ingeniería cobra vida..." --campaign newsletters/2026/bmw/2026-ago-bmw-experiencia-premium --source landing --url https://www.bmw.es/es/home.html` | Usuario/Orchestrator | #3 | ⏳ |
| 5 | Subir hero banner al CDN (feebbodigital.com) | Usuario/humano | #4 | ⏳ |
| 6 | Capturar logo PNG de BMW desde bmw.es | Usuario/humano | — | ⏳ |
| 7 | Configurar links unsubscribe/preferences con el ESP | Cliente | — | ⏳ PARA PRODUCCIÓN |
| 8 | Proporcionar dirección física real para legalLine | Cliente | — | ⏳ PARA PRODUCCIÓN |
| 9 | Ejecutar production-gate completo | Orchestrator (09) | #1, #2 | ⏳ |
| 10 | Marcar `productionReady: true` y `isTestCampaign: false` | Orchestrator | #3, #4, #5, #6, #7 | ⏳ PARA PRODUCCIÓN |
