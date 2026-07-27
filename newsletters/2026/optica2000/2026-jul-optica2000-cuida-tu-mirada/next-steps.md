# Next Steps — Óptica 2000: Cuida tu mirada

## Build Status
✅ Brand tokens created: `brands/optica2000/tokens/brand-tokens.json`
✅ Component variant created: `engine/components/category-grid-img.html`
✅ Adapter added in `engine/lib/assemble.js`
✅ Schema entry added for `category-grid-img`
✅ Pattern updated: `patterns/institutional.md`
✅ Campaign content files created (brief, brand-analysis, copy, QA)
✅ Campaign data created: `campaign-data.json`
⬜ Build pending: run `node engine/build-newsletter.js`

## Assets pendientes del cliente

### Logo (CRÍTICO)
- **Actual**: SVG en `brands/optica2000/tokens/brand-tokens.json` → `assets.logo`
- **Problema**: SVG no es compatible en email (ningún cliente lo renderiza)
- **Workaround actual**: Placeholder text "ÓPTICA 2000" en hero-centrado + placehold.co en header-logo
- **Solicitar al cliente**: Logo en formato PNG, fondo transparente
  - Ancho mínimo: 320px (escalable a 160px en el email)
  - Alto: proporcional
  - Formato: PNG-24 con fondo transparente

### Iconos de categorías (PENDIENTE)
- **Actual**: Placeholders en `https://placehold.co/48x48/...`
- **Solicitar al cliente**: Iconos personalizados para cada categoría
  - Tamaño: 48x48px
  - Formato: PNG con fondo transparente
  - Categorías que necesitan icono:
    1. Gafas graduadas
    2. Lentes de contacto
    3. Gafas de sol
    4. Protección infantil

### Iconos de beneficios / cards (PENDIENTE)
- **Actual**: Placeholders en `https://placehold.co/48x48/...`
- **Solicitar al cliente**: Iconos para las 3 tarjetas de beneficios
  - Tamaño: 48x48px
  - Formato: PNG con fondo transparente
  - 3 iconos: Atención profesional, Tecnología, Centro cercano

### Hero image (OPCIONAL)
- **Actual**: No hay imagen de hero específica (hero-centrado usa fondo de color sólido)
- Si el cliente quiere una imagen de fondo o banner, proporcionar:
  - Tamaño: 600x350px
  - Formato: JPG o PNG

## Acciones post-build
- [ ] Verificar tags balanceados en `final.html` y `final-inline.html`
- [ ] Verificar visualmente en cliente de email
- [ ] Probar en mobile responsive
- [ ] Revisar contraste WCAG
- [ ] Cambiar `metadata.isTestCampaign` a `false` cuando esté listo para producción
- [ ] Rellenar `fromEmail` real del cliente
- [ ] Confirmar enlaces UTM con el equipo de marketing
