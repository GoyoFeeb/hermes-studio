# Risks — Nike Air Force One Relanzamiento

## Riesgos activos

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| 1 | **Logo swoosh capturado como SVG, necesita PNG para email** | El motor requiere una URL de imagen, no SVG inline, para header-logo | Convertir SVG a PNG con sharp (scripts/convert-svg-to-png.js) y guardar en brands/nike/design-input/ |
| 2 | **Voice.rhythm del brand pack es para running (Pegasus 42)** | El copy del AF1 podría sonar a producto técnico-deportivo en vez de lifestyle/icónico | 05 debe ajustar tono manteniendo la voz Nike general |
| 3 | **No hay OpenQuestions resueltas (Q-001 a Q-006)** | Decisiones de producto no confirmadas | Documentar como test-campaign y proceder con isTestCampaign: true |
| 4 | **Página de producto AF1 '07 muestra "Sold Out" para White/White** | Puede que el producto no esté disponible para envío inmediato | Usar precio $115 como referencia, no como claim de disponibilidad |
| 5 | **El brand pack no tiene brandStructure específico para AF1** | Gate 12 requiere brand-structure-translation.md | 03 debe crearlo usando la estructura de página observada |
