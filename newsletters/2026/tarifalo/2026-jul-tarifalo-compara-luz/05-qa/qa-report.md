# QA Report — 2026-jul-tarifalo-compara-luz

| Campo | Resultado |
|-------|-----------|
| **Revisor** | engine (automated) |
| **Fecha** | 2026-07-22 |
| **Build** | ✅ OK — 27.1 KB inline |
| **Estado** | Pass (with caveats) |

## Build verification

| Check | Status | Detail |
|-------|--------|--------|
| Schema validation | ✅ | campaign-data.json válido contra schema |
| Tags balanced (source) | ✅ | 33 open / 33 close `<table>` |
| Tags balanced (inline) | ✅ | 33 open / 33 close `<table>` |
| No unresolved placeholders | ✅ | 0 `{{` restos en source o inline |
| UTF-8 declared | ✅ | `<meta charset="UTF-8">` presente |
| Inline size | ✅ | 27.1 KB (under 80 KB warning) |
| img count parity | ✅ | 3 in source, 3 in inline |
| utm_source parity | ✅ | 7 in source, 7 in inline |
| VML roundrect parity | ✅ | 4 in source, 4 in inline |

## Assets verification

| URL | Status |
|-----|--------|
| https://tarifalo.com/comparador/luz/?utm_...hero-cta | ✅ HTTP 200 |
| https://tarifalo.com/wp-content/uploads/2023/03/icono-luz-hd.png | ✅ HTTP 200 |
| https://tarifalo.com/comparador/luz/?utm_...card-1 | ✅ HTTP 200 |
| https://tarifalo.com/wp-content/uploads/2023/03/icono-gas-hd.png | ✅ HTTP 200 |
| https://tarifalo.com/comparador/luz/?utm_...card-2 | ✅ HTTP 200 |
| https://tarifalo.com/wp-content/uploads/2023/03/icono-luzgas-hd.png | ✅ HTTP 200 |
| https://tarifalo.com/comparador/luz/?utm_...card-3 | ✅ HTTP 200 |
| https://tarifalo.com/comparador/luz/?utm_...closing-cta | ✅ HTTP 200 |

## Claims validation

29 reglas aplicadas — ✅ sin claims problemáticos detectados.

## Control files

| File | Status |
|------|--------|
| campaign-status.md | ✅ Creado |
| handoff.md | ✅ Creado |
| task-log.md | ✅ Creado |
| next-steps.md | ✅ Creado |

## Production readiness

**❌ NOT ready for production** — isTestCampaign: true, productionReady: false.

### Issues to resolve before production

1. **Logo PNG:** Tarífalo solo tiene SVG (prohibido en email) — hero-centrado usa marca como texto. Pendiente obtener PNG.
2. **Dirección física:** footer.legalLine contiene placeholder "[DIRECCIÓN FÍSICA — pendiente del cliente]". Válido para test campaign.
3. **Savings highlight:** "Ahorra hasta 450 €" mencionado en el brief pero no representado visualmente en el hero (hero-centrado no tiene campo stat).
4. **ESP URLs:** unsubscribeUrl y preferencesUrl usan placeholders [UNSUBSCRIBE_LINK] / [PREFERENCES_LINK].
