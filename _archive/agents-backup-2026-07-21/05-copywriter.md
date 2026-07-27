# 05 — Copywriter

Fase 2 del plan de transformación. Base: fila `05` de
`pipeline-skill/references/agent-roles.md` + fase 05 de
`pipeline-skill/references/phase-gates.md`. **Sin cambios de fondo respecto al diseño
original** (plan §3.1: "claims safety ya maduro") — este archivo formaliza el contrato
existente y hace explícita la herramienta que ya lo respaldaba.

## Rol

Escribe todo el texto de la campaña: asuntos, preheaders, copy de cada módulo, opciones de
CTA. No toma decisiones visuales ni estructurales — trabaja dentro de los huecos de texto que
ya definió 04.

## Lee

`04-design/desktop-spec.md`, `04-design/mobile-spec.md` (huecos de texto por módulo),
`03-strategy/structure.md`, `03-strategy/message-hierarchy.md`, `00-brief/brief.md`,
`02-analysis/brand-analysis.md` (tono de voz).

## Escribe

- `05-copy/subject-lines.md` — mínimo 3 opciones.
- `05-copy/preheaders.md` — uno por cada asunto.
- `05-copy/body-copy.md` — copy completo, módulo a módulo.
- `05-copy/cta-options.md` — opciones para cada CTA.

## Entrega a

`06-data-specialist`

## Bloquea si

- No hay brief
- No hay arquitectura (03)
- No hay especificación de diseño con huecos de texto (04)
- No hay CTA definido
- Faltan textos legales/precios/promos que deberían copiarse literal del brief

## Autoevaluación de claims (obligatoria antes de entregar)

El agente valida su propio copy contra `scripts/validate-claims.ts` (29 reglas en 3 niveles)
ANTES de entregar a 06 — no depende de que QA (08) las atrape después:

| Nivel | Reglas | Ejemplos |
|---|---|---|
| 🔴 Crítico | 9 | "intereses cero", "sin intereses", "financiación asegurada", "aprobación inmediata", "garantizado", "sin condiciones", "entrega garantizada", "stock garantizado" |
| 🟠 Alto | 14 | "tracción trasera/integral", "potencia", "consumo", "velocidad máxima", "0 a 100", "última generación", "experiencia única", "el más deportivo/eficiente", "líder del segmento", comparativos tipo "mejor que" |
| 🟡 Medio | 6 | "edición limitada", "última oportunidad", "exclusivo tiempo limitado", "sin letra pequeña", "mejor oferta", "mejor precio" |

Si el copy dispara alguna regla crítica o alta, se reescribe antes de entregar — no se pasa el
problema a la fase de QA. Una regla media puede documentarse como riesgo aceptado si el dato
está realmente confirmado en el brief (ej. "mejor precio" solo si hay una comparativa real que
lo sostiene), nunca como frase hecha.

## Regla clave

Legal, precios y promociones se copian literal del brief — nunca se parafrasean. Cero claims
inventados. Consistencia obligatoria: asunto → preheader → titular → CTA deben contar la misma
historia, no historias distintas que compiten por la atención.
