# Links QA — 2026-jul-uax-fp-online

Agente: 08 QA Specialist · 2026-07-22

| Enlace | URL | UTM `utm_content` | Verificado HTTP 200 |
|---|---|---|---|
| Hero CTA | `https://www.uax.com/fps/online` | `hero-cta` | ⚠️ Sin red en el sandbox (ver `09-exports/delivery-notes.md`) |
| Intro CTA | `https://www.uax.com/fps/online` | `intro-cta` | ⚠️ Sin red |
| Grid CTA | `https://www.uax.com/fps/online` | `grid-cta` | ⚠️ Sin red |
| Cierre CTA | `https://www.uax.com/fps/online` | `closing-cta` | ⚠️ Sin red |
| Logo (header/footer) | `https://www.uax.com/assets/uax/images/uax_fp.png` | — | ⚠️ Sin red |
| Unsubscribe | `[UNSUBSCRIBE_LINK]` (merge-tag ESP) | — | N/A — se resuelve en la plataforma de envío |
| Preferencias | `[PREFERENCES_LINK]` (merge-tag ESP) | — | N/A — se resuelve en la plataforma de envío |

Todos los CTA llevan `utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-uax-fp-online`
más el `utm_content` de la tabla — consistente con `utm` de `06-data/campaign-data.json`.

Ninguna URL resolvió en este entorno (`getaddrinfo EAI_AGAIN`) — el Gate 5 de
`production-gate-motor` lo declara como advertencia, no como fallo, precisamente para no
confundir "sin red" con "roto". Pendiente verificar desde un entorno con salida real antes de
envío (ver `next-steps.md`).
