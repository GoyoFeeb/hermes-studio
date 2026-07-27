# Pack de prompts — Fase 1: el Motor

Serie de 4 prompts para que **Hermes** construya `engine/` — el motor único de generación
premium definido en `docs/auditoria-total-y-plan-transformacion-2026-07-17.md` (§3.2).

A diferencia del pack anterior (`prompts-hermes-rediseno/`, alcance de campaña), estos
prompts son de **alcance de sistema**: crean infraestructura en la raíz de `sistema-final/`.

## Prerequisito (F0)

Antes del prompt 11, deben estar cerrados:

- [ ] Prompt 09 ejecutado — `brands/paraycompara/tokens/brand-tokens.json` en v2.2.0
- [ ] Los 8 PNGs de iconos subidos al CDN (verificable con HTTP 200; lo hace el usuario)

Si el prompt 09 no se ha ejecutado aún, ejecútalo primero — el motor lee tokens del
brand pack fusionado, no de `design-tokens-premium.json` (superseded).

## Orden

| # | Prompt | Qué construye | Estado |
|---|---|---|---|
| 11 | `11-extraccion-componentes.md` | `engine/components/` — ~12 componentes premium extraídos de la pieza validada, parametrizados | ✅ completado |
| 12 | `12-schema-y-patron-saving.md` | `engine/schema/campaign-data.schema.json` + `patterns/saving.md` | ✅ completado |
| 13 | `13-build-newsletter.md` | `engine/build-newsletter.js` — ensamblador con paridad por construcción | ✅ completado |
| 14 | `14-prueba-de-fuego.md` | Regenerar la newsletter piloto desde el motor y verificar paridad visual contra el original | ✅ completado — veredicto APTO, 0 iteraciones |

## Fase 1 — CERRADA (2026-07-20)

Los 4 prompts se ejecutaron en orden, sin saltos. Veredicto de la prueba de fuego: **APTO**.
Detalle completo en `engine/CHANGELOG.md` (entradas de los 4 prompts) y
`docs/f1-motor-cerrado.md` (nota de cierre).

## Reglas de oro del pack

- **La fuente de verdad es la pieza validada**: `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html`
  en su estado post-ronda-10 (CTA 19px, iconos oficiales, 8/8 en fuente e inline). Los
  componentes se extraen de AHÍ — no de `core/components/` (pre-G1, desactualizados) ni
  de memoria.
- **Nada de HTML inventado.** Extraer significa copiar el bloque real y sustituir valores
  por placeholders. Si un valor no está en los tokens v2.2.0, se añade al token — no se
  hardcodea ni se aproxima.
- **VML y condicionales de Outlook se conservan byte a byte** dentro de los componentes.
  Son la parte más frágil y más validada de la pieza.
- **Un prompt por sesión, captura antes de cerrar** — misma disciplina del pack anterior.
- **Ningún cambio en las campañas existentes** durante F1. El motor se construye al lado;
  la piloto solo se usa como referencia de lectura y como patrón de la prueba de fuego.
- **Documentar cada prompt** en un `engine/CHANGELOG.md` (nuevo) — el motor es
  infraestructura de sistema, no campaña, así que no usa los control files de campaña.
