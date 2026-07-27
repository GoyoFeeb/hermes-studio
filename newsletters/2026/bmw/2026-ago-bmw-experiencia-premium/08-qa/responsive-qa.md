# Responsive QA — BMW Experiencia Premium

| Aspecto | Desktop (600px) | Mobile (320-375px) | Estado |
|---------|----------------|-------------------|--------|
| Header logo | 120px centrado | 100px centrado | ✅ Estructural |
| Hero banner | 600×350px | Fluid width, auto height | ✅ Estructural |
| Hero H1 | 32px | 26px | ✅ Estructural |
| Hero subtitle | 16px | 14px | ✅ Estructural |
| CTA | Inline | Full-width recomendado | ✅ Estructural |
| Columns-3 | 3 columnas | 1 columna (stack) | ✅ Estructural |
| Banda-cierre | Centrado | Centrado | ✅ Estructural |

## Pruebas pendientes

- [ ] Captura real a 320px
- [ ] Captura real a 375px
- [ ] Captura real a 600px

## Notas

- Los CTAs usan VML (`v:roundrect`) para Outlook — compatible
- La fuente Titillium Web se carga vía `@import` en `<head>` — fallback Arial/Helvetica
- Sin JavaScript — compatible con todos los clientes
