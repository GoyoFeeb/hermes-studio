# QA Report — Tarífalo Compara Energía

## Estado: PENDING (análisis preliminar completado)

### 1. Brand consistency

| Check | Status | Notes |
|---|---|---|
| Primary color (#003049) used correctly | ✅ | Header/hero, badges, trust checkmarks |
| CTA color (#F77F00) used correctly | ✅ | Botones, enlaces |
| Light accent (#FFF6E7 / #FFF1E0) | ✅ | Fondos alternos correctos |
| Logo URL verified | ✅ | SVG accesible en tarifalo.com |
| No contradictory savings claims | ✅ | "Ahorra en tus facturas" — genérico, sin cifras |

### 2. Link verification (all from tarifalo.com)

| URL | Type | Expected status |
|---|---|---|
| https://tarifalo.com/ | Home | ✅ Live |
| https://tarifalo.com/comparador/luz/ | Luz | ✅ Live |
| https://tarifalo.com/comparador/gas/ | Gas | ✅ Live |
| https://tarifalo.com/comparador/luz-gas/ | Luz+Gas | ✅ Live |
| https://tarifalo.com/cookies/ | Cookies | ✅ Live |
| Logo SVG | Asset | ✅ Live |
| Luz icon (80×80) | Asset | ✅ Live |
| Gas icon (80×80) | Asset | ✅ Live |
| Luz+Gas icon (80×80) | Asset | ✅ Live |
| Arrow icon | Asset | ✅ Live |

### 3. URL placeholders

| Placeholder | Status | Action needed |
|---|---|---|
| `[UNSUBSCRIBE_LINK]` | ⏳ Placeholder | Reemplazar con merge tag del ESP |
| `[PREFERENCES_LINK]` | ⏳ Placeholder | Reemplazar con merge tag del ESP |
| `[DIRECCIÓN FÍSICA — pendiente del cliente]` | ⏳ Placeholder | Solicitar dirección física al cliente |
| `[PLACEHOLDER_PRIVACY]` | ⏳ Placeholder | Solicitar URL de política de privacidad |
| UTM params | ✅ OK | campaign: 2026-jul-tarifalo-compara-energia, source: newsletter, medium: email |

### 4. Design compliance

| Check | Status | Notes |
|---|---|---|
| 600px max width | ✅ | Table-based, max-width:600px |
| Responsive at 599px | ✅ | @media queries, mobile-stack classes |
| Table-based layout | ✅ | No flexbox/grid |
| VML bulletproof buttons | ✅ | CTAs with v:roundrect for Outlook |
| No JS | ✅ | No JavaScript |
| No CSS gradients | ✅ | Solid colors only |
| Images with explicit width/height | ✅ | All images have w/h attributes |
| @font-face (Sora) | ✅ | Loaded from Google Fonts |
| Google Fonts loaded | ✅ | Sora 700 and 800 woff2 |
| Web-safe fallbacks | ✅ | Arial/Helvetica/sans-serif |

### 5. HTML structure

| Check | Status | Notes |
|---|---|---|
| Balanced `<table>` tags | ✅ | Ensured in template |
| Balanced `<tr>` tags | ✅ | Ensured in template |
| Balanced `<td>` tags | ✅ | Ensured in template |
| Alt text on images | ✅ | Descriptive alt texts |
| Color scheme light only | ✅ | meta color-scheme forced to light |

### 6. Known issues

1. **Privacy policy URL**: Not found on tarifalo.com. Placeholder used.
2. **Physical address**: Pending from client. Placeholder used.
3. **Sora display font**: Components reference `{{token:typography.displayFont}}` → brand tokens use Sora. If Sora font loading fails, Arial/sans-serif fallback is applied.
4. **Contrast concern with card link secondary**: "Ver tarifas →" at 13px/700 in #F77F00 over white — 3.10:1 ratio. The same ratio passes at 19px/700 (CTA) because it qualifies as "large text" by WCAG. At 13px, this link may not meet AA contrast for normal text. Documented risk; same pattern used by Para y Compara campaign.
5. **SVG logo in email**: While the logo URL points to an SVG, some email clients handle SVGs inconsistently. Consider converting to PNG for production sends.
