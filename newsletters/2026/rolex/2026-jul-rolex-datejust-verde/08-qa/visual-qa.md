# Visual QA (desktop) — Rolex Datejust "Una fecha para recordar"

## Limitación de render — declarada, no disimulada

El render obligatorio a 4 capturas (320/375/600/600-dark) no se pudo generar en esta ronda:
`render-preview.js` depende de Playwright/Chromium, que en el sandbox de Cowork falla con
`error while loading shared libraries: libXdamage.so.1` y sin acceso root para instalar la
dependencia (mismo bloqueo ya documentado en la generación del hero de Worn Wear, ver
`engine/CHANGELOG.md`). Se intentó además abrir `final-inline.html` como `file://` en Claude in
Chrome (que sí tiene red real) — la extensión rechaza navegar a páginas locales por política de
seguridad del navegador ("Can't interact with browser internal pages"). Ninguna de las 2 vías
disponibles en este entorno permite el render real.

**En su lugar**, esta QA se basa en inspección exhaustiva del HTML fuente (`07-build/final.html`)
verificado programáticamente contra los datos y specs, sección por sección — no es render visual,
pero sí verificación real del contenido y los valores exactos que un render mostraría. Se declara
explícitamente como limitación, no como render completado (mismo criterio que ya aplica este
sistema a Outlook/Litmus sin acceso real — ver `08-qa/outlook-qa.md`).

## Verificación módulo a módulo (contra `07-build/final.html`)

| # | Módulo | Verificado | Resultado |
|---|---|---|---|
| 1 | header-logo | `label` = "OYSTER PERPETUAL" presente, logo con placeholder declarado | ✅ Coincide con `desktop-spec.md` |
| 2 | hero-imagen | `<h1>` = "Una fecha para recordar" (34px/700/#FFFFFF), subtítulo presente, CTA "Descubrir el Datejust" con href real+UTM | ✅ Coincide |
| 3 | intro-cta-asimetrico | Título "Una ventana a las 3.", cuerpo con las 2 frases verificadas, CTA "Ver la colección Datejust" | ✅ Coincide |
| 4 | columns-3-beneficios-sin-icono | 4 ítems presentes (Oystersteel+Everose, hermeticidad Oyster, cronómetro, lupa Cyclops), 0 emoji/iconGlyph | ✅ Coincide, 0 coincidencias de emoji (rango `\u{1F300}-\u{1FAFF}`) |
| 5 | banda-cierre-asimetrico | Título "Descubrir el Datejust en persona.", CTA repite "Descubrir el Datejust" | ✅ Coincide |
| 6 | footer | brandName, tagline, disclosure de campaña de prueba, merge-tags de baja/preferencias | ✅ Coincide |

## Verificación técnica adicional

- **Placeholders sin resolver:** 0 coincidencias de `{{...}}` en el HTML final — todos los tokens/datos se resolvieron.
- **`@font-face`:** 2 bloques presentes (Archivo 300 y 700) — el mecanismo `{{slot:fontface}}` funcionó para una marca nueva.
- **Colores clave presentes en el HTML compilado:** `#127749` (CTA/primary, ×4), `#0B3E27` (deep/cierre), `#249A64` (acento light, divisor), `#F8F8F8`/`#FFFFFF` (fondos) — todos coinciden con `brands/rolex/tokens/brand-tokens.json`.
- **`letter-spacing`:** todos los valores tienen unidad o son `normal` — sin el bug `normalpx` corregido en la ronda anterior.
- **`<title>`:** "Una fecha para recordar." — coincide con `subjectLine`.
- **Un solo `<h1>`** en todo el documento — jerarquía de headings correcta.

## Hallazgos

Ninguno de severidad alta o crítica. Limitación de render documentada arriba (no bloquea per se — el propio checklist del agente permite "advertencia, no fingir verificación" para restricciones de entorno ya precedentes en este sistema).
