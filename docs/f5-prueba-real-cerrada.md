# F5 — Prueba real end-to-end: cerrada

**Fecha:** 2026-07-21 · **Campaña:** `newsletters/2026/paraycompara/2026-jul-comparar-tv/`

**Veredicto: APTO** — el criterio del plan (§0: "un prompt → una newsletter premium con
estructura perfecta... con agentes que cumplan su función de verdad") se cumple, medido contra
los 5 criterios del README del pack.

## Brief usado (todo lo que aportó el usuario)

Cliente: Para y Compara · Tema: televisión y fútbol · Objetivo: comparar tarifas de TV antes
de contratar · CTA: "Comparar tarifas" → paraycompara.com · Datos confirmados: +30 compañías,
copy validado de tarjetas/pasos/trust/lista, 8 iconos en CDN.

## Ejecución por fases

| Fase | Agente | Resultado | Devoluciones |
|---|---|---|---|
| 01 | Briefing Strategist | ✅ 8 datos con fuente, 4 [Q-NNN] no críticas | 0 |
| 02 | Brand Visual Analyst | ✅ Pack v2.2.2 verificado, sin cambios (sin inputs nuevos) | 0 |
| 03 | Newsletter Architect | ✅ 7 módulos, secuencia validada contra PATTERN_SEQUENCE; lista-premium con 3 ítems (primera vez ≠4) | 0 |
| 04 | Email Designer | ✅ Specs trazables a tokens, ritmo verificado, 0 contrastes nuevos, implementabilidad 1:1 | 0 |
| 05 | Copywriter | ✅ Claims 0/0/0 sobre 29 reglas; máximo reuso literal validado; 1 riesgo documentado (título cierre 46/45 chars) | 0 |
| 06 | Data Specialist | ✅ ajv 0 errores | 0 |
| 07 | HTML Email Developer | ✅ BUILD OK en 1 iteración, 36.7 KB, 0 componentes nuevos | 0 |
| 08 | QA Specialist | ✅ APROBADO — render 4 viewports inspeccionado, 0 críticos/altos, 2 medios-bajos registrados | 0 |
| 09 | Export Manager | ✅ Gate 6/6, delivery-notes con rutas exactas | 0 |

## Medición contra los 5 criterios

| Criterio | Resultado |
|---|---|
| Un prompt basta | ✅ 1 prompt de usuario (el brief). 0 prompts de corrección. 0 devoluciones internas de QA. |
| Cero intervención manual de diseño | ✅ Ningún valor visual fuera de brand-tokens.json + patterns/saving.md. 0 ediciones manuales de HTML (`check-parity` exit 0). |
| Estructura premium | ✅ Secuencia = PATTERN_SEQUENCE; `production-gate-motor` 6/6 gates (control files incluidos — primera campaña que los pasa, porque es la primera que recorre el pipeline completo de agentes). |
| Calidad comparable a v5 | ✅ Render 320/375/600/600-dark inspeccionado: mismo sistema visual (hero asimétrico, trust bar, grid con acento, pasos con halo, lista premium, cierre, footer), modo oscuro bloqueado (600-dark byte-idéntico a 600), disciplina de sombras intacta. |
| Agentes funcionan de verdad | ✅ Cada fase dejó sus archivos reales; 4 archivos de control sincronizados en cada transición (`check-control-files` exit 0 al cierre). |

## Hallazgos sobre el sistema (lo que la prueba enseñó)

1. **`create-campaign.ts` falla con EACCES en la carpeta montada de estas sesiones** (su
   `cpSync` no puede copiar; el `cp -r` equivalente sí funciona). El scaffold se hizo manual +
   sustitución de placeholders. Pendiente: hacer el script tolerante o documentar la
   alternativa en `script-usage.md`. No afecta a entornos normales de FS.
2. **`lista-premium` con 3 ítems funciona correctamente** — primera vez que se usa el rango
   variable del componente (la piloto siempre llevó 4). El `{{#each}}` renderiza 3 sin
   degradación visual (verificado en render).
3. **El título de cierre a 46 chars parte en 2 líneas a 600px** — el límite orientativo de 45
   de la spec de 04 es correcto; quedó como riesgo aceptado visible. Futuras campañas: tratar
   45 como límite duro si se quiere 1 línea.
4. Los contratos de `agents/*.md` (revisados 2026-07-21) fueron suficientes para ejecutar cada
   fase sin ambigüedad operativa — ninguna improvisación necesaria fuera de los 2 puntos
   anteriores.

## Limitaciones

- Assets HTTP 200 y Outlook/Litmus real: no verificables desde este entorno (sin red) —
  declarado en delivery-notes, no fingido. Re-verificar antes del envío real.
- La campaña queda `isTestCampaign:true` / `productionReady:false` con los 4 bloqueos de
  cliente heredados (fromEmail, baja/preferencias, dirección, aprobación).

## Plan de transformación: COMPLETO

Con F5 APTO, las 6 fases del plan (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`
§4) quedan cerradas: F0 (fusión tokens) · F1 (motor) · F2 (agentes) · F3 (verificación) ·
F4 (limpieza) · F5 (prueba real). El objetivo del §0 está medido y cumplido.
