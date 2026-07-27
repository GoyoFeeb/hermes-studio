# Next Steps

## Fase actual

09 — Export (production-gate-motor completado)

## Próximas acciones

- [x] Pipeline completo (agentes 00→09)
- [x] BUILD OK — 25.1 KB inline (v2, tras el fix del 2026-07-24)
- [x] QA 7/7 — gradientes, sombras, CTA negro, VML, placeholders
- [x] **Production Gate motor: 12/12 gates ✅** (0-11, incluido el nuevo Gate 11 hero-decision)
- [x] **Hero migrado de `hero-centrado` a `hero-imagen`** (2026-07-24, hallazgo retroactivo — ver
      `03-strategy/module-selection.md` §"Hero elegido": se cumplían los 2 criterios documentados
      y no se habían evaluado). Rebuild OK, Gate 11 en verde.
- [ ] **Pendiente de cliente/ejecución real:** generar el arte del hero — no pudo hacerse desde
      este sandbox (sin salida a `api.openai.com`, ver módulo-selection.md para el comando exacto
      a correr en un entorno con internet real) y subir el PNG resultante al CDN, sustituyendo
      `https://PENDING-CDN-UPLOAD/hero-banner.png` por la URL real.
- [ ] **Pendiente de cliente:** logo oficial de Spotify (wordmark + isotipo) — assets.logo vacío
- [ ] **Pendiente de cliente:** textos legales de footer para email marketing
- [ ] **Pendiente de cliente:** URL de hero banner real (heroBannerPlaceholder)
- [ ] **Pendiente de cliente:** aprobación final sobre el copy y diseño

## Dependencias

- Ninguna — campaña completa como test interno (isTestCampaign:true)

## Notas

- Primera campaña del sistema para una marca dark-mode-first adaptada a claro
- Primer CTA con texto NEGRO sobre verde (#000000 / #1ED760) — verificado: 10.94:1
- Degradado hero y banda-cierre funcionan con gradients.heroBackground bulletproof
- shadows.card verificadas en ambas secciones (columns-3-beneficios-sin-icono + usp-cards-sin-icono-asimetrico)
- Brand pack Spotify v2.2.0 — 7/7 contraste WCAG, check-brand-pack completo

### Fix 2026-07-24 (tras revisión visual del cliente)

1. **Copy sin tildes en todo el cuerpo del email** (bug de 05/06, no del motor — el
   `subjectLine`/`preheader` sí las llevaban bien). Corregido en `campaign-data.json`, rebuild
   verificado: `música`, `límites`, `pérdida`, `información`, `válida`, `Después`, `Móvil`, `qué`,
   `Tú` aparecen ahora con acento correcto en `final.html`.
2. **usp-cards-asimetrico obligaba a usar emoji** (🌍📱✅) pese a que el brand pack de Spotify
   desaconseja explícitamente iconografía decorativa — `module-selection.md` afirmaba
   erróneamente que no había campo `icon` en el schema; sí lo había (`required`). Se creó
   `usp-cards-sin-icono`/`usp-cards-sin-icono-asimetrico` en el motor (mismo criterio que
   `columns-3-beneficios-sin-icono` para BMW) y se migró la campaña a la variante sin icono.
   Verificado en `final.html`: 0 emoji, 4 `box-shadow` (3 tarjetas USP + 1 highlight de
   beneficios) intactos. Detalle completo en `engine/CHANGELOG.md`.
