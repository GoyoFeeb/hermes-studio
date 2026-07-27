# Campaign Status — BMW Experiencia Premium

| Campo | Valor |
|-------|-------|
| Campaign | 2026-ago-bmw-experiencia-premium |
| Client | bmw |
| Current Phase | development |
| Estado actual | development |
| Last updated | 2026-07-27 |

## Completed Phases

- [x] **created** — 2026-07-27: campaña creada con `create-campaign` script
- [x] **briefing** — 2026-07-27: 4 documentos escritos
- [x] **analysis** — 2026-07-27: brand analysis, visual analysis, risks
- [x] **strategy** — 2026-07-27: architecture, module selection, structure
- [x] **design** — 2026-07-27: layout, desktop/mobile specs, assets notes
- [x] **copy** — 2026-07-27: subject lines, preheaders, body copy, CTAs
- [x] **data** — 2026-07-27: campaign-data.json validado y build OK
- [x] **development** — 2026-07-27: engine build OK (final.html + final-inline.html)

## Current Phase

- **qa** — 2026-07-27: pendiente de revisión visual y responsive

## Open Issues

- [Q-001] URL principal — ✅ Resuelta: `https://www.bmw.es/es/home.html`
- [Q-002] Hero image — ⏳ **Budget del proyecto agotado, no de la organización.**
  - API key: `sk-proj-` (project-scoped, 164 chars, últimos 4: `IWQA`)
  - Proyecto asociado: `proj_veLRbaoUeib0ql6xH62MJHli`
  - Organización: `user-swf6s4uigmk7drdx86mcdx9x`
  - Error: HTTP 400, `code: billing_hard_limit_reached`, `type: billing_limit_user_error`
  - **El proyecto tiene su propio budget, independiente del límite mensual de la organización ($100, gasto ~$1).**
  - También falla chat completions (HTTP 429, `insufficient_quota`) — confirma que el proyecto completo está sin presupuesto.
  - **Solución**: ir a `platform.openai.com → Projects → proj_veLRbaoUeib0ql6xH62MJHli` → ajustar el budget del proyecto.
    O crear una API key nueva desde otro proyecto con crédito.
- Hero banner CDN — ⏳ Pendiente de subir tras generación

## Production Gate Status

- Not yet run (pre-QA)
