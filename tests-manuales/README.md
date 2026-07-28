# Tests manuales de marca — prompts de verificación del motor

Reubicados aquí 2026-07-28 (auditoría técnica) — antes vivían sueltos en la raíz del repo
(`PROMPT-*-HERMES.md`, fechados 22-25 jul), sin ningún índice de qué se había ejecutado ni con
qué resultado.

## Cómo usarlos

Cada archivo tiene dos secciones (ver cabecera de cualquiera de ellos):
- **§A — Brief**: lo que se le pasa a Hermes/al agente, sin pistas de qué se está probando.
- **§B — Qué debería pasar**: solo para quien lanza el test, nunca para el agente — describe
  qué debería encontrar el sistema por su cuenta y cómo verificarlo. Pasarle §B al agente
  invalida el test.

## Índice — verificado 2026-07-28 contra `newsletters/2026/{marca}/`

Estado objetivo (existe o no una campaña real con ese nombre en el repo) — **no** implica que
la campaña haya pasado el production gate completo ni que el test haya salido bien, solo que se
ejecutó hasta el punto de generar la campaña. Ver `campaign-status.md` de cada campaña para el
estado real.

| Prompt | Marca | Campaña(s) encontrada(s) en el repo |
|---|---|---|
| `PROMPT-ADESLAS-TEST-MOTOR-HERMES.md` | Adeslas | `2026-jul-adeslas-seguro-medico` |
| `PROMPT-AESOP-TEST-MOTOR-HERMES.md` | Aesop | `2026-jul-aesop-ritual-facial` |
| `PROMPT-BMW-HERMES.md` | BMW | `2026-jul-bmw-x1-descubre`, `2026-ago-bmw-experiencia-premium`, `2026-ago-bmw-m4-coupe`, `2026-ago-bmw-brand-native-restauracion-test` |
| `PROMPT-NIKE-HERMES.md` | Nike | `2026-jul-nike-pegasus-42` |
| `PROMPT-NIKE-TEST-GRADIENTES-HERMES.md` | Nike | `2026-jul-nike-pegasus-42-w` |
| `PROMPT-OPTICA2000-HERMES.md` | Óptica 2000 | `2026-jul-optica2000-cuida-tu-mirada` |
| `PROMPT-SPOTIFY-TEST-MOTOR-HERMES.md` | Spotify | `2026-jul-spotify-premium-test` |
| `PROMPT-WORNWEAR-TEST-MOTOR-HERMES.md` | Worn Wear | `2026-jul-wornwear-usado` |

`PROMPT-CONTEXTO-HERMES.md` **no** está en esta carpeta — sigue en la raíz del repo porque es el
prompt de arranque de sesión (contexto general, no un test de marca).

## Nota

Ninguna de las campañas listadas arriba tiene `productionReady: true` — son validaciones del
motor y de los brand packs, no envíos reales (ver `memory.md` § Current Focus).
