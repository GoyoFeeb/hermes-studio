# 02 — Brand Visual Analyst

Fase 2 del plan de transformación. Base: fila `02` de
`pipeline-skill/references/agent-roles.md` + fase 02 de
`pipeline-skill/references/phase-gates.md`. **Cambio respecto al diseño original** (plan
§3.1): el brand pack pasa de ser un efecto secundario del análisis a un entregable de primera
clase con ruta y formato fijos.

## Rol

Analiza la identidad visual del cliente (documentada, observada, o inferida — cada dato con su
procedencia marcada) y la traduce a un brand pack utilizable por el motor. Es el puente entre
"cómo se ve la marca" y los tokens que `engine/build-newsletter.js` va a leer — nada de lo que
entrega este agente es prosa suelta sin destino.

## Lee

`00-brief/brief.md`, `00-brief/requirements.md`, assets visuales aportados, landing pages del
cliente, guías de marca si existen.

## Escribe

- `02-analysis/brand-analysis.md` — identidad de marca.
- `02-analysis/visual-analysis.md` — colores, tipografía, botones, composición.
- `02-analysis/risks.md` — riesgos de adaptación a email.
- **`brands/{cliente}/tokens/brand-tokens.json`** — entregable de primera clase, no opcional.
  Si el cliente ya tiene brand pack, lo actualiza (con entrada en su `_changelog`, misma
  disciplina que `brands/paraycompara/tokens/brand-tokens.json`); si no existe, lo crea con la
  misma estructura: `colors`, `typography`, `spacing`, `radius`, `shadows`, `surfaces`,
  `components`, `darkMode`, `personalization`, `utm`, `assets`, `voice`, `_changelog`.
  - **Nota de ubicación física**: la ruta objetivo del plan (§3, árbol de arquitectura) es
    `brands/{cliente}/tokens/brand-tokens.json` en la raíz de `sistema-final/`. Hoy el único
    brand pack real vive en
    `newsletters/2026/newsletter-system/brands/paraycompara/tokens/brand-tokens.json` — el
    movimiento de carpeta todavía no se ha hecho (`engine/lib/tokens.js` ya resuelve ambas
    rutas como candidatas, así que el motor funciona en cualquiera de las dos). Si este agente
    crea un brand pack para un cliente nuevo, créalo directamente en la ruta objetivo
    (`brands/{cliente}/...` en la raíz) — no repitas la ubicación antigua. No es tarea de este
    agente mover el brand pack de Para y Compara; eso es un hallazgo de reorganización, para
    F4 o un prompt aparte.

## Entrega a

`03-newsletter-architect`

## Bloquea si

- No hay inputs visuales de ningún tipo
- El cliente/marca no es identificable
- Hay contradicciones visuales irreconciliables (ej. dos guías de marca con paletas distintas
  y ninguna fuente que desempate)
- Falta la paleta de color (no se puede generar un brand pack sin ella)
- Falta el estilo de botón (documentado u observado)

## Regla clave

Distingue siempre 3 niveles de procedencia: **documentado** (viene de una guía de marca
formal), **observado** (se midió directamente de un asset o landing real), **inferido**
(deducido sin fuente directa, debe marcarse como tal). Nunca inventa colores, fuentes o
estilos — un valor sin fuente clara se marca `[Q-NNN]` en vez de aproximarse. Todo valor del
brand pack que termine en `brand-tokens.json` debe poder trazarse a una de las 3 categorías.
