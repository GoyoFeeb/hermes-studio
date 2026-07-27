# Pack de prompts — Fase 3: Verificación

Serie de 4 prompts para que **Hermes** escriba las herramientas de verificación que el plan de
transformación (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`, §4, fila F3) deja
pendientes tras F1 (motor) y F2 (agentes). Continúa la numeración: 19-22.

## Por qué esta fase

El objetivo explícito de F3 es que 3 fallos históricos reales, ya sufridos y documentados en
este mismo proyecto, sean **irreproducibles** de aquí en adelante:

| Id | Qué pasó | Dónde está documentado |
|---|---|---|
| **H1** | 3 HTML finales de la misma campaña no coincidían entre sí (colores de marca incorrectos en el que se dio por bueno) | `docs/re-auditoria-sistema-hermes-2026-07-17.md` |
| **N1** | El HTML inline certificado como "listo" tenía iconos viejos — estaba desincronizado de su propia fuente, y ningún gate lo detectó | `docs/re-auditoria-sistema-hermes-2026-07-17.md` §N1 |
| **H5** | No existía ningún script que verificara que los 4 archivos de control (`campaign-status.md`, `task-log.md`, `handoff.md`, `next-steps.md`) estuvieran sincronizados entre sí | `docs/re-auditoria-sistema-hermes-2026-07-17.md` §H5 — "el Defecto N1 es exactamente el tipo de fallo que ese script habría atrapado" |

F1 ya resolvió H1/N1 **por construcción** para las campañas que pasan por el motor (paridad
garantizada porque fuente e inline salen de la misma ejecución en memoria — ver
`engine/README.md`). Lo que falta es la **auditoría independiente**: una herramienta que no
confíe ciegamente en lo que el propio build dice de sí mismo, y que además cubra el caso que el
motor no resuelve solo — los 4 archivos de control de H5, que son responsabilidad del
Orchestrator (`agents/00-orchestrator.md`), no del motor.

## Prerequisito

- [x] F1 cerrada (`docs/f1-motor-cerrado.md`) — el motor existe y da la garantía de paridad por
      construcción que `check-parity.js` va a auditar, no a duplicar desde cero.
- [x] F2 cerrada (`docs/f2-agentes-cerrado.md`) — `00-orchestrator.md` y `08-qa-specialist.md`
      ya mencionan `check-control-files.js`/`check-parity.js` como pendientes de esta fase;
      este pack es lo que los convierte en reales.

## Orden

| # | Prompt | Qué construye | Estado |
|---|---|---|---|
| 19 | `19-check-parity.md` | `scripts/check-parity.ts` — paridad fuente/inline independiente del build, detecta desincronización tipo N1 | ✅ completado |
| 20 | `20-check-control-files.md` | `scripts/check-control-files.ts` — sincronización de los 4 archivos de control, cierra H5 | ✅ completado |
| 21 | `21-production-gate-motor.md` | Gate de producción para campañas del motor (JSON + HTML + assets HTTP 200) — el `production-gate.ts` actual solo sabe validar el pipeline viejo (`newsletter-data.json`) | ✅ completado |
| 22 | `22-prueba-de-fuego-f3.md` | Corre el gate completo contra una campaña real regenerada por el motor y confirma que H1/N1/H5 son irreproducibles. Cierre de F3. | ✅ completado — 1 defecto real encontrado y corregido (orden de gates en production-gate-motor.ts) |

## Fase 3 — CERRADA (2026-07-21)

Veredicto: **APTO**. Detalle completo, incluida la corrección de orden de gates encontrada
durante la prueba de fuego del prompt 22, en `docs/f3-verificacion-cerrada.md`.

## Reglas de oro del pack

- **No reescribir lo que F1 ya resolvió.** `check-parity.js` no reimplementa el ensamblado ni
  el inline — solo verifica, desde fuera, que lo que hay en disco es consistente consigo mismo
  y con lo que `build-manifest.json` dice que se construyó. Si algo no cuadra, el fallo es la
  señal de que alguien tocó el output a mano después del build (justo el escenario de N1).
- **Los scripts existentes (`validate-newsletter.ts`, `check-links.ts`, `validate-claims.ts`,
  `production-gate.ts`) siguen operando el pipeline React Email tal cual — no se tocan en este
  pack.** Ese pipeline se archiva en F4, no antes. Los scripts nuevos de F3 son un camino
  paralelo para el pipeline del motor, no un reemplazo de los existentes (todavía).
- **Nada de umbrales blandos.** Un gate de producción no da "casi aprobado" — pasa o falla,
  exit 0 o exit 1, igual que ya hace `production-gate.ts`.
- **Un prompt por sesión, captura antes de cerrar** — misma disciplina que F1 y F2.
- **Ninguna campaña real se corrige aquí.** Si al probar un script contra una campaña real se
  encuentra un defecto real en esa campaña, se documenta como hallazgo — no se corrige dentro
  de este pack (mismo principio que F1/prompt 14: los prompts de verificación auditan, no
  arreglan piezas ajenas a su alcance).
