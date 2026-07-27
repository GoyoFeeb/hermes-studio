# Requirements — Audi A6 Sportback e-tron Brand-Native Test

## Técnicos
- [x] Motor `engine/` con soporte para `editorial-foto-texto.html` y `editorial-foto-texto-inverso.html`
- [x] Brand pack Audi v2.2.0 existente (necesita añadir `layout.brandStructure`)
- [x] Patrón `fotografia-primero` (soporta editorial-foto-texto*)
- [x] Script `check-structural-differentiation.ts`
- [x] Gate 12 en `production-gate-motor`

## Estructurales
- [ ] Secuencia debe usar `editorial-foto-texto` y/o `editorial-foto-texto-inverso`
- [ ] NO repetir `intro-cta` 3 veces como la campaña anterior
- [ ] Máximo 1 `intro-cta` (justificado si aparece)
- [ ] Debe existir `03-strategy/brand-structure-translation.md`
- [ ] Debe existir `layout.brandStructure` en brand pack

## Copy
- [ ] Asunto: titular corto, premium
- [ ] Preheader: resumen técnico sin claims inventados
- [ ] Cuerpo: dividido en 3 bloques editoriales (diseño/aerodinámica, tecnología/carga, interior/experiencia)
- [ ] CTA primario en hero + banda-cierre
- [ ] CTA secundario en editorial-foto-texto (opcional)

## Legales
- [ ] Aviso WLTP en disclosure
- [ ] CO₂: 0 g/km
- [ ] Unsubscribe: [UNSUBSCRIBE_LINK]
- [ ] Preferencias: [PREFERENCES_LINK]

## Assets
- [ ] Logo Audi PNG pendiente → usar nombre "AUDI" como texto
- [ ] Hero imagen: generated via generate-hero-image, pending CDN upload
- [ ] Imágenes editorial-foto-texto: pending CDN upload
