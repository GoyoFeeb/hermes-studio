# Pack de prompts — Fase 5: la Prueba Real

1 solo prompt (26). No es casualidad: F5 existe para medir el criterio de éxito del plan
(`docs/auditoria-total-y-plan-transformacion-2026-07-17.md` §0):

> "Un prompt → una newsletter premium con estructura perfecta, sea de la campaña que sea, con
> agentes que cumplan su función de verdad."

Si F5 necesitara varios prompts, ya habría fallado. El prompt 26 recibe un brief mínimo y debe
producir la campaña completa (00→09) usando EXCLUSIVAMENTE los archivos del sistema: los 10
agentes de `agents/`, el motor de `engine/`, el patrón de `patterns/`, los scripts de
verificación de F3 — sin apoyarse en la memoria de ninguna sesión anterior.

## Prerequisitos (todos cerrados)

- [x] F1 — motor (`docs/f1-motor-cerrado.md`)
- [x] F2 — agentes (`docs/f2-agentes-cerrado.md`), revisados 2026-07-21
- [x] F3 — verificación (`docs/f3-verificacion-cerrada.md`)
- [x] F4 — limpieza (`docs/f4-limpieza-cerrada.md`)

## Qué mide exactamente

| Criterio | Cómo se mide |
|---|---|
| Un prompt basta | El prompt 26 se ejecuta una vez, sin prompts de corrección posteriores (las iteraciones INTERNAS del pipeline — devoluciones de QA, reintentos de build — son legítimas y se documentan; un segundo prompt del usuario no) |
| Cero intervención manual de diseño | Nadie especifica un px, un hex ni un layout fuera de lo que los agentes derivan de brand pack + patrón |
| Estructura premium | La secuencia respeta `patterns/saving.md` y el build pasa `production-gate-motor` completo (los 6 gates, con los bloqueos de cliente documentados si aplican) |
| Calidad comparable a v5 | Render 320/375/600/600-dark comparado contra las capturas de la pieza validada — mismo sistema visual, sin regresiones |
| Los agentes funcionan de verdad | Cada fase deja sus archivos reales (brief, análisis, estrategia, specs, copy, data, build-log, QA, delivery-notes) + los 4 archivos de control sincronizados (`check-control-files` exit 0) |

## Regla de honestidad del pack

Si algo falla, el resultado de F5 es ese fallo, documentado — no se "salva" la prueba
arreglando a mano y contándolo como éxito. Un NO APTO con diagnóstico preciso vale más que un
APTO falso: diría exactamente qué parte del sistema (agente, motor, patrón, script) necesita
otra ronda.

## Fase 5 — CERRADA (2026-07-21)

Veredicto: **APTO** — campaña `2026-jul-comparar-tv` ejecutada end-to-end con 1 solo prompt,
0 devoluciones, 0 intervención manual de diseño, gate 6/6. Con esto, el plan de transformación
completo (F0-F5) queda cerrado. Detalle: `docs/f5-prueba-real-cerrada.md`.
