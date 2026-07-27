# Changelog Multibrand — v2.0

> De: `paraycompara-email-system/` (v1.0, mono-marca)
> A: `newsletter-system/` (v2.0, multi-marca)

---

## v2.0 — 2026-07-13

### Cambio arquitectónico

El sistema pasa de ser un paquete de una sola marca a una arquitectura multimarca con core universal.

### Novedades

| Novedad | Descripción |
|---|---|
| Core universal | 6 componentes estructurales sin marca, tokens técnicos |
| Brand packs | `paraycompara/` y `demo/` con tokens, voice y ejemplos |
| Brand template | `_template/` con instrucciones y JSON vacío |
| Campañas universales | 10 patrones de campaña agnósticos |
| Demo brand | Marca azul con CTA naranja, demuestra independencia del core |
| Previews comparativas | PyC (morado) y Demo (azul) — 6 capturas |

### Migración

| De | A |
|---|---|
| `paraycompara-email-system/tokens/` | `newsletter-system/core/tokens/` + `brands/paraycompara/tokens/` |
| `paraycompara-email-system/components/` | `newsletter-system/core/components/` + `brands/paraycompara/components/` |
| `paraycompara-email-system/campaigns/` | `newsletter-system/brands/paraycompara/examples/` |
| `paraycompara-email-system/guidelines/` | `newsletter-system/core/` + `docs/` |

### Archivos

- Sistema anterior: ~31 archivos en `paraycompara-email-system/`
- Sistema nuevo: ~45+ archivos en `newsletter-system/`
- Archivos migrados: 31
- Archivos nuevos: 20+ (core, demo brand, docs)

### Validación

- Demo brand usa colores diferentes (#1A5276, #E67E22) sin tocar el core
- Ambas marcas generan previews funcionales
- El core no contiene ningún valor de Para y Compara

## v2.1 — 2026-07-13 — Evolución premium (v5-premium)

### Novedades

| Novedad | Descripción |
|---|---|
| 4 patrones premium portados | `heroEditorialNoPhoto`, `trustCheckmark`, `listAccentBar`, `closingBand` — extraídos de la campaña piloto `v5-premium/` de Para y Compara, ahora en `core/components/` |
| Hero unificado header+hero | El patrón heroEditorialNoPhoto unifica el bloque de marca (logo + eyebrow + H1 + cifra + CTA + microcopy) sobre un solo fondo de color de marca, en vez de header + hero separados |
| CTA bulletproof corregido | VML con `width:280px`, `<a>` con `display:block`, `mso-line-height-rule:exactly` en textos — validado contra `final-premium.html` real |
| Trust bar consistente | Glifos `&#10003;` (check unicode) en vez de símbolos mixtos (%, $, OK). Espaciado y bg corregidos según real |
| Lista con acento | Celda `<td width="4">` en vez de `border-left` CSS, con spacer `width="16"` y `font-size:1px` para Outlook |
| Brand tokens extendidos | `h1HeroOnBrand`, `body.size:14`, `statNumber.size:40`, `spacing.hero:56`, `spacing.close:48`, nuevas secciones `radius` y `surfaces` |
| Ejemplos aplicados | `educational-premium.html` y `retargeting-premium.html` con los patrones nuevos; `comparison` mantuvo su hero propio |
| Reconciliación | El archivo fuente `v5-premium/final-premium.html` no estaba disponible al inicio de Fase B/C/D. Todo el contenido generado por aproximación en esas fases se reconcilió contra el archivo real una vez incorporado, corrigiendo estructura, valores de tokens y placeholders |

### Archivos tocados

- `core/components/hero-editorial-no-photo.html` (reescrito completo)
- `core/components/trust-checkmark.html` (reescrito)
- `core/components/list-accent-bar.html` (reescrito)
- `core/components/closing-band.html` (reescrito)
- `core/components/component-gallery.html` (+4 secciones)
- `campaigns/saving/base.html` (reescrito con arquitectura unificada)
- `brands/paraycompara/tokens/brand-tokens.json` (v2.0.0 → v2.1.0)
- `brands/demo/tokens/brand-tokens.json` (v1.0.0 → v2.0.0)
- `brands/paraycompara/examples/educational-premium.html` (nuevo)
- `brands/paraycompara/examples/retargeting-premium.html` (nuevo)
- `brands/demo/examples/saving-premium.html` (nuevo)
- `docs/email-compatibility-rules.md` (nota VML añadida)