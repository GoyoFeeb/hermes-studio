# Next Steps

**Campaña completada como prueba interna.** Pendiente de datos reales del cliente para producción.

## Producción (esperando inputs del cliente)

1. fromEmail real (ej: newsletter@paraycompara.com)
2. fromName real (ej: "Para y Compara")
3. Logo oficial en alta resolución
4. Enlaces reales de baja y preferencias
5. Dirección física legal
6. Cambiar isTestCampaign a false
7. Cambiar productionReady a true
8. Subir assets a CDN y actualizar rutas en HTML
9. (Opcional) Confirmar uso de precios/promociones
10. (Opcional) Confirmar sorteo iPhone 16
11. Definir parámetros UTM
12. Ejecutar production-gate para validación final

## Ya completado en la pasada visual/técnica

- ✅ `lang="en"` → `lang="es"` en final.html y final-inline.html
- ✅ Preheader hidden div: font-size/font-family/color explícitos
- ✅ Preview PNG regenerado (152.5 KB, 600x2029px)
- ✅ `09-exports/production-blockers.md` creado con lista completa
- ✅ `09-exports/delivery-notes.md` actualizado con datos reales
- ✅ Control files actualizados

## v5-premium evolution completado (2026-07-13)

- ✅ Fase A: VML bulletproof en CTA (4 ocurrencias), types.ts corregido, HeroBlock sin color hardcodeado
- ✅ Fase B: Sistema multibrand documentado, paraycompara-email-system archivado, saving base creado
- ✅ Fase C: 4 patrones premium portados a core/components/ (heroEditorialNoPhoto, trustCheckmark, listAccentBar, closingBand)
- ✅ Fase D: educational-premium.html + retargeting-premium.html creados (comparison sin cambios — hero propio preservado)
- ✅ Fase E: 5 capturas reales Playwright desde v5-premium/final-premium.html, outlook-qa.md rellenado, production-gate validate-claims ✅ (29 reglas, 0 problemas)
- ✅ Fase F: email-compatibility-rules.md, changelog v2.1, control files actualizados
- ✅ Reconciliación: contenido de Fase B/C/D corregido contra fuente real (final-premium.html)
- ⚠️ E.2: 3 advertencias en outlook-qa.md — verificación Outlook/Litmus pendiente (sin acceso en este entorno)

## Bucle de verificación visual operativo (2026-07-15)

- ✅ `scripts/render-preview.js` — captura 320/375/600/600-dark, exit code ≠ 0 en fallo
- ✅ Baseline: `v5-premium/baseline/base-{320,375,600,600-dark}.png` — 4 PNGs > 50 KB
- ✅ Modo oscuro verificado: idéntico a claro (metas light funcionando)
- ✅ `v5-premium/baseline/baseline-notes.md` — diagnóstico de 3 mejoras priorizadas
- ✅ `docs/visual-verification.md` — flujo documentado: cambio → inline → captura → revisión
- ✅ Control files actualizados, HTML sin modificar (checksum verificado)
- ⏭️ Siguiente ronda: usar render-preview.js antes/después para ciclar cambios visuales

## v5-premium ronda G4 completado (2026-07-16)

- ✅ Sistema de acento premium: kicker rule (32×2px) sobre los 3 eyebrows de sección + franja superior (4px) en las 4 tarjetas de tarifa, ambos reutilizando el color `#7B1FA2` ya usado en los eyebrows (sin colores nuevos)
- ✅ Elevación unificada: sombra en halo de pasos numerados (3) y en círculos de check de trust bar (3), coherente con la escala ya usada en tarjetas/CTA/trust-bar pill
- ✅ Pill elevado en la cifra "+30" del hero, con label recoloreado (`#E4CDF0`) para mantener contraste AA (5.59:1) sobre el nuevo fondo
- ✅ `final-premium-v2-inline.html` regenerado con juice (51.5 KB), verificado sin divergencias con la fuente
- ✅ `qa-report.md`, `comparison-before-after.md`, `design-tokens-premium.json`, `component-patterns.md` actualizados
- ⚠️ Sin verificación visual real en esta ronda — Chromium (faltan dependencias de sistema, sin sudo) y WeasyPrint (no instalado) no disponibles en el entorno de esta sesión. Verificación fue solo de código (grep de conteos + contraste WCAG calculado a mano). Pendiente confirmar visualmente antes de producción.
- ➖ No se portaron los cambios G1-G4 a `newsletter-system/core/components/` — viven solo en la campaña piloto por ahora

## v5-premium ronda G5 completado (2026-07-16)

- ✅ Sección "Antes de decidir" rediseñada: de lista de texto plano (`listAccentBar`) a tarjetas elevadas (`premiumListRow`) — tarjeta con borde/sombra/franja + badge circular de check de 36px por ítem, reutilizando 3 patrones ya validados en el resto de la pieza (tarjeta de tarifa, franja de `accentSignature` G4, badge de `trustCheckmark`)
- ✅ Contraste del badge calculado antes de fijar color: morado (`primary`, 9.23:1) elegido sobre naranja (`ctaBackground`, 3.10:1 — insuficiente)
- ✅ `final-premium-v2-inline.html` regenerado (55.6 KB), balance de tags HTML verificado exacto (52 tablas / 200 tr / 220 td)
- ✅ Copy, CTAs y placeholders legales sin modificar
- ✅ Documentación actualizada: `qa-report.md` (ronda G5), `comparison-before-after.md`, `design-tokens-premium.json` (patterns.premiumListRow), `component-patterns.md` (§4 marcada como sustituida en esta campaña, §12 nuevo)
- ⚠️ Sin verificación visual real (Chromium/WeasyPrint no disponibles en este entorno) — mismo pendiente que arrastra la campaña desde antes de G4

## v5-premium ronda G6 completado (2026-07-16)

- ✅ Pase de refinamiento "estilo Apple" aplicado a las 7 secciones: sombras difusas (blur grande/alpha bajo en vez de sombras marcadas), tracking negativo en los 6 titulares grandes (H1, stat, 3×H2, closing), eyebrows con más letter-spacing, radios de tarjeta y pill más generosos, espaciado vertical ampliado entre secciones, `line-height` más cómodo en cuerpos de texto, CTA más sustancial, footer más discreto
- ✅ Cero cambios estructurales — balance de tablas idéntico a G5 (52/52), solo ajuste de valores sobre propiedades ya existentes
- ✅ `final-premium-v2-inline.html` regenerado (55.8 KB), copy/CTAs/placeholders legales sin modificar
- ✅ Documentación actualizada: `qa-report.md` (ronda G6), `comparison-before-after.md`, `design-tokens-premium.json` (shadows/radius/typography con notas `_g6`), `component-patterns.md` (§13 nuevo)
- ⚠️ Sin verificación visual real — los valores están razonados sobre principios de diseño de Apple ya conocidos, no comparados contra una captura real de apple.com en esta sesión (mismo pendiente que arrastra la campaña desde G4)

## v5-premium ronda G7 completado (2026-07-16)

- ✅ Auditoría contra el prompt maestro premium-conversión aportado por el cliente ("menos elementos, mejor seleccionados")
- ✅ Degradados de transición eliminados (120 filas de 1px, 5 zonas) — cortes de sección limpios, −12 KB
- ✅ Disciplina de sombras: de 22 a 11 — solo tarjetas, CTAs y stat pill (la sombra vuelve a significar "clicable o protagonista")
- ✅ CTA "COMPARAR TARIFAS" → "Comparar tarifas" (sentence case, sin perder contraste ni peso)
- ✅ Los 4 chips "Ver tarifas" pasan a enlaces de texto discretos — un solo nivel de botón en toda la pieza
- ✅ Descripciones de 13 → 14px
- ✅ Inline regenerado: 43.6 KB (−22% vs. G6)
- ✅ Documentado qué NO se cambió y por qué (tarjetas G5 aprobadas, patrón de fondo, eyebrows, kicker rules) en qa-report.md y component-patterns.md §14
- ⚠️ Los cortes entre secciones ahora son duros (sin degradado) — conviene revisión visual del ritmo antes de producción (Chromium/Litmus, mismo pendiente de siempre)

## v5-premium ronda G8 completado (2026-07-16) — rediseño profesional

- ✅ Ejecutado `v5-premium/prompt-g8-rediseno-profesional.md` (diagnóstico D1-D8), 15/15 criterios de aceptación PASS
- ✅ Semántica: 4 `<h2>` + 11 `<h3>` reales (antes 0 — todo eran `<p>`)
- ✅ Medición: UTM por módulo en los 8 enlaces + convención documentada en `docs/naming-conventions.md` (requisito de production gate a partir de ahora)
- ✅ Copy: 3 titulares con especificidad respaldada por el brief; "Las mejores ofertas" (superlativo con riesgo) → "Comparador independiente"
- ✅ Honestidad técnica: @font-face 800 duplicado eliminado (nunca cargó — apuntaba al woff2 del 700)
- ✅ Dark mode defensivo (9 clases `dm-*`, contrastes AA calculados; Gmail lo ignora — documentado)
- ✅ Personalización: saludo con merge condicional FNAME y fallback sin nombre
- ✅ Composición: cabecera de "Antes de decidir" a la izquierda (primera ruptura del eje centrado)
- ✅ `icon-system-spec.md`: set de 6 iconos unificados especificado para encargo

### Nuevos pendientes que deja G8
1. URL real del woff2 de Sora 800 (requiere entorno con red a Google Fonts)
2. Producir el set de iconos según `icon-system-spec.md`
3. Prueba social: activar solo si el cliente confirma "TOP 3 Comparadores España 2025"
4. Confirmar ESP definitivo y aplicar el snippet de personalización (en tokens → `personalization`)
5. QA visual en cliente real (Litmus/Email on Acid) — el render de navegador ya está cubierto

## Corrección G8.1 completado (2026-07-16)

- ✅ Regresión reportada por el cliente, diagnosticada con el PRIMER render real de la línea v5 (Chromium conseguido en sandbox vía stub de libXdamage)
- ✅ Causa: el dark mode de G8 (fondos oscuros + iconos morados ilegibles = "iconos deformados") y el merge tag FNAME crudo en el hero
- ✅ Dark mode retirado, metas `color-scheme: light` (la pieza ya no se altera con el SO en oscuro — verificado con captura)
- ✅ Personalización movida a snippet de ESP (tokens → `personalization`), el HTML previsualiza limpio
- ✅ Requisito de assets dark-ready documentado en `icon-system-spec.md` para reintroducir dark mode en el futuro
- 📸 Capturas en `v5-premium/`: `g8fix-light-600.png` (estado actual), `g8fix-dark-600.png` (verificación anti-inversión), `g8-dark-600.png` (evidencia del fallo), `g0-original-600.png` (comparación con la base v5)

## Ronda 08 — Archivar linajes muertos y declarar fuente única (2026-07-17)

### Contexto
Auditoría estructural del sistema encontró que la campaña tenía **3 HTML finales no coincidentes**: `09-exports/final.html` (pipeline, colores incorrectos #6B2C5F), `v3-premium/` (abandonado), `v5-premium/final-premium-v2.html` (premium real). El `production-gate` certificaba el primero; el que se enviaría era el tercero.

### Acciones
- ✅ `v3-premium/` → `_archive/v3-premium/` (8 variantes, conservadas)
- ✅ Pipeline oficial obsoleto → `_archive/09-exports-pipeline-oficial-2026-07-14/` (final.html, final-inline.html, final-preview.png)
- ✅ `_archive/README.md` con trazabilidad de cada archivo archivado
- ✅ `09-exports/final.html` y `09-exports/final-inline.html` = copias de `v5-premium/final-premium-v2.html`
- ✅ Verificado: colores correctos #5E2E91 (29 ocurrencias), #3E244D (2), 0 #6B2C5F
- ✅ Re-certificación: validate-claims ✅ (29 reglas), check-links ❌ (2 placeholders), production-gate ❌ (solo bloqueos del cliente)
- ⚠️ Limitación documentada: el `production-gate` valida `06-data/newsletter-data.json`, no el HTML final en `09-exports/`
- ✅ Control files actualizados

### Próximos pasos tras esta ronda
1. ~~🔴 Subir iconos oficiales al CDN~~ — ✅ completado (ver sección "Assets CDN completado" abajo)
2. ~~Fusión de tokens: `design-tokens-premium.json` → `brands/paraycompara/tokens/brand-tokens.json`~~ — ✅ completado (ver "Prompt 09" abajo)
3. Crear archivos de agente reales en `agents/NN-nombre.md` (F2 del plan)
4. Elegir motor único y portar patrones premium (F1 del plan — ver `docs/auditoria-total-y-plan-transformacion-2026-07-17.md`)

## Ronda 10 — Cierre de pendientes (2026-07-17)

- ✅ **N1 crítico resuelto**: inline regenerado desde fuente + paridad 8/8 iconos verificada. `09-exports/final.html` y `final-inline.html` ya son idénticos a `v5-premium/final-premium-v2.html` y su inline.
- ✅ **CTA contraste**: subido a 19px bold (WCAG large text ✅ 3.10:1 ≥ 3:1). Opción A implementada.
- ✅ task-log.md completo con rondas 02-05-07-10
- ✅ redesign-summary.md fecha corregida a 2026-07-17
- ✅ `rondas/ronda07/qa-report.md` creado (referencia rota reparada)
- ✅ `icon-system-spec.md` actualizado con set oficial y rechazo de propuesta 04
- ✅ Control files sincronizados

## Assets CDN completado

- ✅ 12/12 PNGs verificados HTTP 200 en CDN
- ✅ `newsletter-data.json` actualizado con URLs HTTPS
- ✅ `final.html` y `final-inline.html` regenerados con rutas absolutas
- ✅ Sin src relativos, file://, /Users/javifeebbo ni SVG
- ✅ preview regenerada desde CDN

## Prompt 09 — Fusión de tokens completado (2026-07-20)

- ✅ `brand-tokens.json` (core) v2.1.0 → v2.2.0
- ✅ Los 3 conflictos marcados en el prompt verificados contra `09-exports/final.html` (no contra memoria ni contra ninguno de los 2 JSON a ciegas):
  - `h1Hero`/`h1HeroOnBrand`: ninguna de las 2 hipótesis del prompt era correcta. Valor real: 28px/800/lineHeight 1.16/letterSpacing -0.5px/#FFFFFF, mobile 26px/1.18. `h1HeroOnBrand` actualizado; `h1Hero` (variante texto oscuro) sin tocar.
  - `typography.body.size`: confirmado 14 (el 13 de premium era resto de antes de G7).
  - `radius.card`: confirmado 18 (cambio de G6, el 16 de core era el resto viejo).
- ⚠️ La misma verificación destapó 2 discrepancias más no listadas en el prompt original, corregidas igual: `eyebrow.letterSpacing` (2.5px→3px) y `typography.statNumber` (40px/-1px → 56px/-1.5px, desactualizado por igual en ambas fuentes — refleja el hero asimétrico de G8).
- ⚠️ `shadows.statPill` y `components.patterns.statPill` se fusionaron (adición limpia según el prompt) pero quedan marcados `verified: false` / `status: unverified` — no hay pill ni sombra alrededor de la cifra en el HTML real, probablemente obsoletos tras G8. Confirmar antes de reutilizar en el motor (F1).
- ✅ `_changelog` añadido dentro de `brand-tokens.json` con la traza completa de la fusión.
- ✅ `design-tokens-premium.json` marcado `_superseded` (no borrado, sigue como registro histórico G1-G8.1).
- ✅ `core/components/*.html` sin tocar — sigue reflejando el estado pre-G1, pendiente explícito de F1.
- ➡️ **Próximo paso del plan**: F1 — motor único. Prompts ya escritos en `prompts-fase1-motor/` (11-extracción-componentes, 12-schema-y-patrón, 13-build-newsletter, 14-prueba-de-fuego).