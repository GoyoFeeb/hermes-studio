# Campaign Status

## Campaign

| Campo | Valor |
|---|---|
| Cliente | UAX — Universidad Alfonso X el Sabio |
| Campaña | 2026-jul-uax-fp-online |
| Fecha | 2026-07-22 |
| Estado actual | completed |

## Current Phase

| Campo | Valor |
|---|---|
| Fase | — |
| Agente activo | — |
| Objetivo | — |

## Completed Phases

- [x] Briefing (heredado del `00-brief/brief.md` y `04-copy/copy.md` originales)
- [x] Brand / Visual Analysis (brand pack nuevo: `brands/uax/tokens/brand-tokens.json` v2.2.0)
- [x] Newsletter Architecture (patrón de género nuevo: `patterns/institutional.md`)
- [x] Email Design (5 componentes nuevos del motor, contrastes WCAG calculados)
- [x] Copy (migrado del original + beneficios reequilibrados entre columnas)
- [x] Newsletter Data (`06-data/campaign-data.json` reescrito al schema real)
- [x] HTML Email Development (`engine/build-newsletter.js` — ver `agents/07-html-email-developer.md`)
- [x] QA (gate 8/8 — ver `task-log.md`)
- [x] Export

## Open Issues

- [Q-201] `unsubscribeUrl`/`preferencesUrl` van con merge-tags `[UNSUBSCRIBE_LINK]`/`[PREFERENCES_LINK]` — pendientes de la plataforma de envío real.
- [Q-202] `legalLine` lleva el placeholder `[DIRECCIÓN FÍSICA — pendiente del cliente]` — falta la dirección física real.
- [Q-203] Condiciones exactas de "50% de la matrícula*" — verificar redacción legal con el cliente antes de envío real.

## Next Step

Ver `next-steps.md`.
