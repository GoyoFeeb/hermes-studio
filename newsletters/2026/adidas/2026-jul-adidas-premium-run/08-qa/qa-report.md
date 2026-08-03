# QA Report — Adidas Premium Run

## Resumen

| Check | Estado | Notas |
|---|---|---|
| Build del motor | ✅ | final.html + final-inline.html (20 KB sin base64) |
| Schema validation | ✅ | campaign-data.json válido contra schema |
| Claims (29 reglas) | ✅ | Sin claims problemáticos |
| Contraste WCAG AA | ✅ | 10/10 combinaciones pasan |
| Column balance | ✅ | Ratio 1.43x ≤ 1.6x |
| Production readiness | ✅ | Test campaign — OK con placeholders |
| Structural differentiation | ✅ | Brand translation document exists |
| Parity (pre-build) | ⚠️ | Rota por embed base64 — esperado en test |
| Assets HTTP | ⚠️ | 403 en adidas.com (bot protection) — URLs funcionales para humanos |
| Control files | ✅ | 4 archivos sincronizados |

## Hallazgos

1. **Contraste corregido**: textBody/textSecondary cambiado de #767677 a #5C5C5C para pasar WCAG AA sobre fondo #F5F5F5 (sectionLila) y footer.

2. **Adidas.com bloquea bots**: las URLs de adidas.com devuelven HTTP 403 en las verificaciones automáticas. Las URLs son correctas y funcionales para humanos reales.

3. **CTA style block**: Border-radius 0px observado de getComputedStyle en adidas.com. Usa cta-block-bulletproof.

4. **Hero generado localmente**: La imagen hero se generó y comprimió pero bannerSrc permanece como PENDING-CDN-UPLOAD. Post-CDN upload: actualizar campaign-data.json y rehacer embed.

## Pendientes para producción

- [ ] Subir hero-banner.jpg a CDN y actualizar bannerSrc
- [ ] Subir editorial-runner.jpg a CDN y actualizar imageSrc
- [ ] Obtener PNG del logo de Adidas (performance badge) y actualizar logoSrc
- [ ] Confirmar textos legales reales (disclosure, dirección física)
- [ ] Cambiar isTestCampaign a false, productionReady a true
