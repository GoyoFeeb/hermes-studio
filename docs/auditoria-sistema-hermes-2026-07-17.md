# Auditoría del sistema Hermes — arquitectura completa

Fecha: 2026-07-17 · Alcance: `sistema-final/` completo (no solo la campaña piloto)

## Veredicto

No estás cerca de "un prompt → newsletter premium". Estás cerca de "quince rondas de edición manual guiada por capturas → newsletter premium", y ese proceso todavía no tiene camino de vuelta hacia el pipeline automatizado. Ahora mismo tienes dos sistemas que no se hablan: uno que genera automáticamente (mediocre) y otro que produce calidad premium (manual, no repetible). Ejecutar el pipeline entero hoy con `create-campaign → ... → export-html` te devolvería un resultado peor que el que ya tienes, no el mismo con otro copy.

## Hallazgo 1 — La misma campaña tiene 3 HTML finales que no coinciden entre sí

En `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/` conviven tres linajes independientes:

| Archivo | Origen | Estado |
|---|---|---|
| `09-exports/final.html` (56 KB, 14-jul) | Pipeline oficial: agente 07 (React Email) → `export-html.tsx` → juice | Colores de marca **incorrectos** (`#6B2C5F`, `#F3E5F5` — no son el morado real `#5E2E91`/`#3E244D`). Nadie lo ha vuelto a tocar desde el 14-jul. |
| `v3-premium/` (13-jul) | Intento manual anterior, 8 variantes (`final-fixed`, `v4`, `v4.1`...) | Abandonado. Conservado por la regla "no borres nada", sin marcarse como obsoleto en ningún control file. |
| `v5-premium/final-premium-v2.html` (43 KB, 17-jul) | Edición manual directa, 15+ rondas (G1-G8.1 + rondas Hermes 01-07) | Es el único que de verdad es "premium". Nunca ha pasado por React Email. |

`campaign-status.md` afirma `Production Gate: ✅ production-ready`, pero ese gate se corrió sobre el pipeline oficial/datos de campaña, no sobre `v5-premium/final-premium-v2.html`, que es el archivo que en la práctica vas a enviar. Es decir: el archivo certificado como "listo para producción" y el archivo que realmente quieres enviar son dos ficheros distintos, y no hay ningún paso del sistema que los reconcilie.

## Hallazgo 2 — Los 10 agentes no existen como archivos

`pipeline-skill/SKILL.md` describe el contrato de 10 agentes y dice explícitamente: *"Each agent is a markdown file at `agents/NN-name.md` ... in the system root, not per-campaign."*

Ese directorio `agents/` no existe. Lo que existe es `agentes/` (nombre en español), y está **vacío** (0 archivos). El pipeline de 10 agentes es, hoy, únicamente la narrativa de `SKILL.md` + `references/*.md` — nadie ha escrito el prompt/contrato concreto de "Agente 04 — Email Designer" o "Agente 07 — React Email Developer". Esto significa que cada vez que Hermes actúa como un agente de fase, está improvisando el rol a partir de una descripción de una línea en una tabla, no ejecutando una instrucción persistente y probada. Es la razón estructural de que la calidad y el criterio cambien de ronda a ronda (lo viste tú mismo: rondas 02-05 sin control files sincronizados, CTA documentado como AA cuando no lo pasa, etc.) — no hay un archivo fijo que fuerce consistencia.

## Hallazgo 3 — Tres sistemas de diseño paralelos, ninguno es "el bueno" de forma inequívoca

1. **`react-email-template/`** — 12 componentes React Email + `newsletter-schema.json`. Es el motor que en teoría alimenta `07-code → 09-exports`. Sus componentes (`HeaderBlock`, `HeroBlock`, `CardsGridBlock`...) son genéricos, sin ninguno de los patrones premium.
2. **`newsletters/2026/newsletter-system/`** — sistema "multimarca" en HTML puro (`core/` + `brands/paraycompara/`), con changelog v2.1 que dice haber **portado 4 patrones premium** (`heroEditorialNoPhoto`, `trustCheckmark`, `listAccentBar`, `closingBand`) extraídos de `v5-premium/final-premium.html` — la versión *anterior* a toda la evolución de esta sesión. Su propio changelog admite que en su momento no tuvo acceso al archivo real y tuvo que "reconciliar por aproximación". Tiene ejemplos premium para `educational` y `retargeting`, pero no para `saving` — que es exactamente el género de la campaña piloto. Es decir: el patrón que más se pareció a lo que necesitabas nunca se generalizó al caso que lo originó.
3. **`brand-library/_template/`** — el propio `README.md` de `newsletter-system/` lo declara sin rodeos: *"queda como referencia conceptual, sin mecanismo activo que la consuma"*. Es documentación muerta.

Y dentro de la propia campaña piloto hay un **cuarto** juego de tokens: `v5-premium/design-tokens-premium.json`, que dice explícitamente que "extiende" los tokens de `newsletter-system` pero "vive dentro de la campaña piloto para no tocar el core... hasta validarse". Nunca se validó ni se promovió. Todo el aprendizaje de tipografía, espaciado y sombras conseguido en 15 rondas de pulido está atrapado en un archivo de una sola campaña.

## Hallazgo 4 — Lo premium vive fuera del sistema parametrizado

Ninguna de las mejoras de esta sesión (degradados, sombras, ritmo editorial, jerarquía tipográfica, iconos oficiales) se hizo tocando `newsletter-data.json` + componentes React Email. Se hizo editando HTML/CSS estático a mano, verificando con capturas de Playwright. Es la vía correcta para *llegar* al resultado (no se puede diseñar bien sin ver), pero nadie ha migrado ese resultado final a datos + componentes reutilizables. Consecuencia directa: si mañana pides "una newsletter premium de Para y Compara sobre otra oferta", el sistema no tiene manera de producirla — tendrías que repetir las 15 rondas desde cero, porque el conocimiento de "cómo se ve premium" no está codificado en ningún componente ni token compartido, solo en un HTML de una campaña concreta.

## Hallazgo 5 — La disciplina de control files depende de la memoria del agente, no del sistema

`AGENTS.md`/`SKILL.md` exigen sincronizar 4 archivos de control en cada transición de fase. Es una buena norma, pero no hay ningún script que la verifique (no existe un `check-control-files.ts` o similar). Ya se ha visto fallar dos veces en esta misma campaña: las rondas 02-05 de Hermes no actualizaron `task-log.md`, y `redesign-summary.md` traía una fecha incorrecta. Es una regla que vive solo en prosa; nada la hace cumplir.

## Recomendaciones, en orden de impacto sobre "un prompt → premium"

1. **Declara ganador un único archivo por campaña y archiva el resto.** Mueve `v3-premium/` completo y `09-exports/final.html` desactualizado a `_archive/`, y dejar constancia en `campaign-status.md` de que `v5-premium/final-premium-v2.html` es la fuente única de verdad. Sin esto, cualquier automatización futura no sabrá de qué archivo partir.

2. **Cierra el círculo: convierte el HTML premium en el nuevo componente base**, no al revés. En vez de intentar que el pipeline React Email "alcance" la calidad de `v5-premium` a base de prompts, extrae los patrones ya validados (hero editorial, trust checkmark premium, `premiumListRow`, closing band, sistema de sombras/tracking "estilo Apple") como componentes reales en `react-email-template/components/` y bloques nuevos en `newsletter-schema.json`. Ahora mismo ese trabajo de extracción existe a medias en `newsletter-system/core/components/`, pero apunta a un motor (HTML puro con `juice`) distinto del que usa el pipeline de 10 agentes (React Email + `export-html.tsx`). Hay que elegir un único motor de renderizado — probablemente el HTML+juice, que es el que de verdad se ha usado y validado en Outlook/Gmail — y hacer que el pipeline de agentes escriba directamente sobre esos componentes/tokens, no sobre React Email genérico.

3. **Promueve `design-tokens-premium.json` al core**, resolviendo sus divergencias con `brands/paraycompara/tokens/brand-tokens.json` (letterSpacing, line-height, radios, sombras) en una sola pasada, y borra el archivo de campaña una vez fusionado. Mientras existan dos ficheros de tokens "casi iguales pero no", cada campaña nueva parte de cero en las decisiones finas que hoy diferencian "bonito" de "premium".

4. **Materializa los 10 agentes como archivos reales** en `agents/NN-nombre.md`, con el contenido concreto de qué debe producir cada uno (no solo una fila de tabla). Esto es lo que te permite pedir "genera una newsletter premium" y que el criterio de calidad (contraste WCAG real, ritmo editorial, jerarquía tipográfica) esté en la instrucción del Agente 04 y no dependa de que en esa sesión alguien recuerde pedirlo.

5. **Automatiza la verificación de control files y de gate real vs. archivo real.** Un script simple que, antes de marcar `productionReady: true`, compruebe que el `production-gate` se ejecutó contra el mismo archivo HTML que está en `09-exports/` (por hash o timestamp) evitaría el problema del Hallazgo 1 de forma permanente.

6. **Cuando esto esté resuelto**, el criterio real para saber si ya estás en "un prompt → premium" es: crear una campaña nueva de Para y Compara, ejecutar el pipeline sin ninguna intervención manual de diseño, y que el resultado en `09-exports/final-inline.html` — sin tocarlo — se parezca visualmente a `v5-premium/final-premium-v2.html` en sombras, tipografía, ritmo y componentes. Hoy ese experimento fallaría en el primer render.

## Lo que sí está bien y conviene conservar tal cual

- La disciplina de "nunca inventar datos, todo trazable al brief" (agente 05, `validate-claims`) es sólida y ha atrapado errores reales (superlativos, "gratis" sin confirmar) durante esta sesión.
- El bucle capturar→inspeccionar→corregir antes de cerrar ronda (institucionalizado en los prompts 01-07 para Hermes) es exactamente el mecanismo que faltaba y ya evitó una repetición de la regresión de G8.
- El criterio de aprobación en dos niveles (prueba interna vs. producción) y el registro de blockers por severidad es una buena base de gate — el problema no es el gate, es que corre sobre el archivo equivocado.
