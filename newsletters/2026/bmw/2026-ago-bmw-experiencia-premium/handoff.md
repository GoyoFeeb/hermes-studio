# Handoff: Development → QA → Export

| Campo | Valor |
|-------|-------|
| **From** | 07 — HTML Email Developer |
| **To** | 08 — Email QA Specialist / 09 — Export Manager |
| **Status** | Listo para QA |

## Context

La newsletter BMW Experiencia Premium ha sido generada por el motor. Build exitoso. 

### Diagnóstico OpenAI (2026-07-27)

El error detectado inicialmente como "billing limit" fue **confirmado y precisado**:

- **`.env`**: ✅ Encontrado, `OPENAI_API_KEY` presente (164 chars, últimos 4: `IWQA`)
- **`HERO_IMG_MODEL`**: No definido en `.env` → usa `gpt-image-1` (default)
- **`HERO_IMG_SIZE`**: No definido → `1536x1024` (default)
- **Error exacto**: HTTP 400, `error.code: billing_hard_limit_reached`, `error.type: billing_limit_user_error`
- **Mensaje**: "Billing hard limit has been reached."
- **Modelos accesibles**: 117 (gpt-5.6* presente — vision model OK)
- **Diagnóstico**: NO es falta de crédito ni key inválida. Es un **límite de gasto duro (hard limit)** configurado en el proyecto de OpenAI que ya se alcanzó. La cuenta tiene crédito disponible pero el límite lo impide.
- **Solución**: Ir a `platform.openai.com/settings/organization/billing`, subir o desactivar el hard limit, luego reintentar generación.

Pendientes:
1. Hero banner no generado — bloqueado por hard limit de OpenAI
2. Logo BMW no capturado — placeholder PENDING-BMW-LOGO
3. Links de unsubscribe/preferences — placeholders de ESP

## Files to Read

- `06-data/campaign-data.json`
- `09-exports/final.html`
- `09-exports/final-inline.html`
- `09-exports/build-manifest.json`
- `04-design/layout.md`
- `04-design/desktop-spec.md`
- `04-design/mobile-spec.md`

## Required Action (QA Phase)

1. Revisión visual: capturas en 320px, 375px, 600px, 600px+dark-mode
2. Verificar enlaces (hero, intro, banda-cierre → `https://www.bmw.es/es/home.html`)
3. Verificar responsive (tablas, CTA full-width en mobile)
4. Verificar Outlook compatibility (VML en CTAs)
5. Verificar accesibilidad (alt text, contraste)

## Constraints

- No tocar `final.html` ni `final-inline.html` — parity check los protegerá
- `isTestCampaign: true` — no requiere producción

## Risks

- OpenAI billing limita generación de hero banner — se documenta como blocker

## Expected Output

- `08-qa/visual-qa.md`, `responsive-qa.md`, `outlook-qa.md`, `links-qa.md`, `final-checklist.md`
- `09-exports/delivery-notes.md`
