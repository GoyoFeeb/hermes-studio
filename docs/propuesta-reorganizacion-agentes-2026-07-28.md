# Propuesta de reorganización de agentes (00-09) — 2026-07-28

**Estado: propuesta para aprobación explícita. No se ha modificado ningún archivo de `agents/*.md`
como parte de este documento.** Dividir/fusionar contratos de agente cambia cómo se producen
campañas reales usadas hoy por sesiones humanas y de IA — el mismo tipo de cambio amplio y sin
acuerdo previo que ya causó dos incidentes de pérdida de datos en esta sesión. Este documento existe
para que la decisión se tome con evidencia, no para ejecutarla.

## Recomendación

**No reorganizar los 10 agentes en esta pasada.**

## Evidencia

La auditoría técnica del 2026-07-28 (`docs/auditoria-tecnica-hermes-newsletter-system.md` en el
scratchpad de esa sesión — ver §4 "Análisis detallado de cada agente") evaluó individualmente los
10 contratos y encontró:

- Los 10 agentes están calificados "bien especificado" o superior; ninguno tiene un contrato
  ambiguo, contradictorio (salvo la fila 06 de `agent-roles.md`, ya corregida en Fase B) o con
  responsabilidad huérfana.
- Cita textual del hallazgo relevante: *"todas las [zonas grises] que en teoría podrían existir
  (silueta de CTA, variante de icono, cuándo usar hero-imagen, quién valida contraste) están
  resueltas explícitamente y con referencia cruzada entre los archivos implicados — no encontré
  responsabilidad genuinamente huérfana entre agentes consecutivos vigentes."*
- El patrón de evolución del sistema (incidente documentado → fix con dueño claro, repetido para
  Spotify/hero, BMW/patrón, Adeslas/contraste) es reactivo pero funcional — no hay evidencia de que
  una responsabilidad se haya perdido entre dos agentes por falta de un tercero intermedio.

No dividir/fusionar cuando la evidencia no lo pide es la misma disciplina anti-aspiracional que la
auditoría señaló como la mejor practicada del proyecto (Fase E, componentes sin consumidor real). Se
aplica el mismo criterio aquí.

## La única señal real de tamaño desproporcionado

El agente 02 (Brand Visual Analyst) es el más pesado del set (20.7 KB) — no porque su contrato sea
ambiguo (la auditoría lo califica como "el mejor especificado de los 10"), sino porque **mezcla
contrato con historial extenso de incidentes documentados** (5 revisiones "Nivel 3" narradas en el
propio archivo).

Esto no es una razón para dividir el agente en dos — el contrato en sí (qué debe hacer un análisis
de marca, qué campos debe llenar) sigue siendo una sola responsabilidad coherente. Es una razón para
separar **contrato** de **bitácora de incidentes** dentro del mismo agente, si su tamaño sigue
creciendo:

- `agents/02-brand-visual-analyst.md` — solo el contrato vigente (qué hacer, qué campos, qué
  válvulas de escape existen).
- `agents/02-brand-visual-analyst-history.md` (o similar) — el historial narrado de las 5
  revisiones, referenciado desde el contrato pero no inline.

**Esto tampoco se ejecuta en esta pasada** — 20.7 KB no es un problema operativo hoy (ningún agente
reportó dificultad real para seguir el contrato), es una observación para el futuro si el archivo
sigue creciendo con cada incidente nuevo.

**Nota (2026-07-28, mismo día — evolución "Nivel 5"):** el contrato de `agents/
02-brand-visual-analyst.md` se reescribió el mismo día en que se escribió esta observación, para
soportar un paquete de identidad visual mucho más amplio (17 fases de análisis, 9 artefactos
nuevos — ver `pipeline-skill/references/brand-visual-analysis-methodology.md`). La cifra "20.7 KB"
queda desactualizada como snapshot, pero la recomendación de fondo no cambia y de hecho se aplicó
por adelantado en la reescritura: el detalle metodológico nuevo se separó a un archivo de
referencia aparte (`pipeline-skill/references/brand-visual-analysis-methodology.md`) en vez de
inlinearse en el contrato — el mismo movimiento "contrato vs. bulto" que esta sección recomienda,
aplicado a metodología nueva en vez de al historial de incidentes existente (que sigue inline, sin
mover, exactamente como esta propuesta decidió). El contrato resultante (~320 líneas) se mantiene
en el mismo orden de magnitud que antes de la reescritura (313 líneas).

## Criterios para revisar esta recomendación

Reorganizar dejaría de ser prematuro si aparece evidencia de alguno de estos escenarios concretos,
no hipotéticos:

1. Una campaña real queda bloqueada porque dos agentes consecutivos no se ponen de acuerdo sobre
   quién decide algo que hoy no está resuelto explícitamente (hoy: 0 casos documentados).
2. Un agente crece más allá de ~2x el tamaño del siguiente más grande sin que sea por historial de
   incidentes separable (hoy: 02 es el más grande, pero por la razón de §"señal real" arriba, que sí
   tiene una solución de bajo riesgo sin tocar el contrato).
3. Se añade un dominio de decisión genuinamente nuevo (ej. multi-idioma, un segundo motor de render)
   que no encaja limpiamente en ninguno de los 10 roles actuales — en ese caso la pregunta no es
   "dividir un agente existente" sino "el rol 10 necesita nacer", una decisión de producto distinta.
