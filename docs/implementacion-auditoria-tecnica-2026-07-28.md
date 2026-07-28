# Informe de implementación — auditoría técnica enterprise (2026-07-28)

**Alcance ejecutado:** Fases A, B, C y D del roadmap §18 de `auditoria-tecnica-hermes-newsletter-system.md`
(auditoría previa, misma sesión). Cuatro commits de git, cada uno un checkpoint verificado y
reversible: `e35c81d` (Fase A), `c83e956` (Fase B), `a52e378` (Fase D), `fb8c3bb` (Fase C).
**Estado del repo antes de esta pasada:** sin control de versiones. Se inicializó git y se conectó
a `https://github.com/GoyoFeeb/creas-javi` al principio de esta sesión, antes de la auditoría.

---

## 1. Resumen ejecutivo

De los 4 focos de deuda identificados por la auditoría (documentación con dos generaciones sin
resolver, duplicación de lógica operativa, cero cobertura de test sobre los gates, incidente de
pérdida de datos ya materializado), los tres primeros quedan cerrados o sustancialmente reducidos.
El cuarto (incidente del CHANGELOG) ya se había cerrado en la fase de investigación forense previa
a la auditoría (backup + regla de append + `backup-changelog.ts`), y esta pasada añadió el `npm run
changelog:backup` real más la disciplina de uso que se siguió en cada uno de los 4 commits de esta
misma pasada.

De las 8 acciones de "impacto alto" y las 7 de "impacto medio" que la auditoría listó en su §17,
**14 de 15 están implementadas**. La única excepción (revisar la regla de claims "potencia" para
reducir falsos positivos) no se tocó porque requiere criterio editorial sobre qué constituye un
falso positivo real en marcas de automoción/energía — cambiarla sin ese criterio sería una decisión
de producto disfrazada de mantenimiento, exactamente el tipo de intervención no solicitada que la
propia auditoría advierte evitar.

De las 4 acciones de "impacto bajo" que tocan componentes HTML compartidos, **2 se implementaron**
(alias `card-tarifa-3`/`category-grid-img`, corrección de descripciones del schema + `maxLength`) y
**2 se evaluaron y se decidió NO ejecutarlas en esta pasada**, con la justificación registrada en
§4 de este informe — ambas tocan plantillas en uso HOY por 8 y 2 campañas reales de producción
respectivamente, y ninguna de las dos podía completarse con paridad de output verificable sin
ampliar el alcance del motor central de forma no solicitada.

---

## 2. Cambios por fase

### Fase A — Fiabilidad (commit `e35c81d`)

| Cambio | Motivo | Beneficio |
|---|---|---|
| `scripts/backup-changelog.ts` + `npm run changelog:backup` | El incidente de truncado del CHANGELOG (91% de pérdida) ocurrió sin ningún backup previo | Cualquier edición futura del CHANGELOG queda recuperable en `_archive/changelog-backups/` |
| Regla "solo append" documentada de verdad en `memory.md` | La regla existía solo como intención, no como texto verificable | Un agente futuro (IA o humano) tiene la regla escrita, no que inferirla del incidente |
| `execFileSync` + timeout de 120s + `runChildGate()`/`execChildGate()` en `production-gate-motor.ts` y `production-gate.ts` | 8 `execSync` con interpolación de string sobre `/bin/sh` — riesgo de inyección si `--campaign` viniera de datos no controlados; sin timeout, un gate colgado bloqueaba el Production Gate entero | Cero riesgo de inyección de shell; un gate hijo colgado falla en 120s en vez de indefinidamente; 8 bloques duplicados colapsados en una función |
| `try/catch` en `gate4Claims` sobre `JSON.parse` | Si el archivo se corrompía entre gates (proceso externo concurrente — el mismo patrón que causó el incidente del CHANGELOG), el gate moría con un stack trace de Node sin capturar | Fallo legible de gate en vez de crash sin contexto |
| `try/finally` alrededor de `chromium.launch()` en `capture-brand-site.ts` | Un error a mitad de captura dejaba procesos Chromium huérfanos | Cero procesos huérfanos aunque falle la captura |
| `AbortController`/timeout en el `fetch` a la API de OpenAI en `generate-hero-image.ts` | Sin timeout, una llamada colgada bloqueaba indefinidamente | Falla en 60s (descripción) / 120s (generación) con mensaje explícito si es timeout |
| `.github/workflows/ci.yml` (nuevo) | No existía ningún CI — toda verificación era manual | `npm test` + `check-engine-integrity.ts` en cada push/PR a main |

### Fase B — Coherencia documental y estructural (commit `c83e956`)

| Cambio | Motivo | Beneficio |
|---|---|---|
| Banners `[SUPERSEDED]`/`[PARCIALMENTE SUPERSEDED]` en 7 archivos de `pipeline-skill/references/` + corrección de la fila 06 de `agent-roles.md`/`phase-gates.md` | 7/10 archivos de referencia describían el pipeline React Email archivado sin aviso; la fila 06 contradecía directamente a `agents/06-data-specialist.md` | Un agente nuevo que siga el orden de lectura de `SKILL.md` ya no recibe información activamente incorrecta sobre el formato de datos ni el comando de cierre de producción |
| `engine/components/INVENTORY.md` + `scripts/check-component-inventory.ts` (nuevo) | El "catálogo oficial verificado" no documentaba 3 componentes reales en producción, y nada detectaba la deriva | 3 filas añadidas; gate de aviso (no bloqueante) enganchado a `production-gate-motor.ts` que falla visiblemente si vuelve a desincronizarse |
| Unificación de `brands/paraycompara/` a la raíz (antes vivía en `newsletters/2026/newsletter-system/brands/paraycompara/`, un prototipo previo no archivado) | El pack real de Para y Compara solo existía en una ruta de fallback duplicada en 4 archivos distintos, atada al año 2026 | `engine/lib/tokens.js` y 3 scripts pierden su resolución dual de rutas; un solo lugar donde buscar cualquier brand pack |
| 6 descripciones de schema corregidas ("Exactamente 3" → "2-4 ítems", con nota explicativa) + `maxLength:45` real en `banda-cierre.title` | La descripción documentaba una restricción rígida que `minItems`/`maxItems` reales no imponían; el límite de 45 caracteres solo vivía en `check-column-balance.ts`, no en el schema que se supone lo documenta | El schema deja de mentir sobre sus propias restricciones; el límite de título es validable en el punto donde un agente/humano leería el contrato de datos |
| Reconteo de reglas de claims — **revertido a 29/9 tras autodetección de error** (ver §3) | Intento inicial de "corregir" 29→30 basado en un `grep` que contaba mal | Ninguno — se documenta como corrección de una corrección, no como cambio real |
| `prepare-preview.py`/`_validate-nike.mjs` movidos a `_archive/f4-scripts-puntuales/`; 9 `PROMPT-*-HERMES.md` movidos a `tests-manuales/` con README índice | Scripts de una sola sesión con rutas hardcodeadas de un desarrollador concreto viviendo en `scripts/`; prompts de test sueltos en la raíz sin ningún índice de vigencia | `scripts/` solo contiene herramientas reutilizables; los 8 prompts de test tienen cross-reference verificado contra campañas reales en disco |

### Fase D — Refactor de duplicación (commit `a52e378`)

| Cambio | Motivo | Beneficio |
|---|---|---|
| `scripts/lib/cli.ts` (`parseArgs`/`resolveCampaignPath`) | Copiado literalmente en 16 scripts | Una sola implementación; un fix futuro se aplica una vez, no 16 |
| `scripts/lib/brand-path.ts` (`resolveBrandPackPath`/`resolveBrandPackPathOrNull`) | Reimplementado 3 veces tras la unificación de Fase B (ya simplificado, pero aún triplicado) | Una sola implementación con las dos variantes de contrato (throw vs. null) que cada consumidor necesitaba |
| `MODULE_ADAPTERS['card-tarifa-3']`/`['category-grid-img']`: función clonada → alias directo | Dos funciones con cuerpo idéntico a su contraparte, inconsistentes con los otros 6 pares ya aliasados en el mismo archivo | Menos código que mantener sincronizado; verificado con rebuild byte-idéntico de las 5 campañas reales que usan estos componentes |

### Fase C — Cobertura de test (commit `fb8c3bb`)

| Cambio | Motivo | Beneficio |
|---|---|---|
| `balancedRows`/`withCellGeometry`/`withStackGeometry` exportadas desde `assemble.js` + 9 tests nuevos | Estas funciones (usadas por `trust-bar`, `pasos`, `columns-3-beneficios*`, `usp-cards*`, `metric-strip-premium`) solo se probaban indirectamente vía build end-to-end | Reparto de filas sin huérfanos, padding por posición y patrón de última-fila cubiertos directamente; un cambio futuro que rompa la geometría falla en el test, no en producción |
| `scripts/gates.smoke.test.js` (nuevo) — 10 tests con fixtures mínimas (pasa + falla) para Gate 12, Gate 10 y Gate 11 | Cero de los 13 gates de `production-gate-motor.ts` tenía test unitario; Gate 12 (`check-structural-differentiation.ts`) explícitamente priorizado por la auditoría por ser el de heurísticas más frágiles (regex sobre prosa libre) | Gate 12 tiene 4 tests (skip, fail sin justificación, pasa sin ser comodín, pasa con justificación documentada); un cambio futuro en la redacción de los checks que rompa la detección falla visiblemente |

**Suite de tests: 12 → 32 (+167%).** Todos verdes en cada uno de los 4 commits.

---

## 3. Errores propios detectados y corregidos durante la ejecución

En la fase de auditoría (sesión previa a esta implementación) se cometieron dos errores que se
corrigieron dentro de la misma sesión, antes de que llegaran a un commit:

1. **Reconteo erróneo de reglas de claims.** Un `grep -c` que contaba líneas de definición de tipo
   TypeScript junto con objetos de regla reales llevó a "corregir" 29→30 reglas (9→10 críticas) en
   `agents/05-copywriter.md` y `pipeline-skill/references/validate-claims-rules.md`. Se detectó
   ejecutando `CLAIM_RULES.length` directamente (`npx tsx -e "..."`), que confirmó 29 como valor
   real. Ambos archivos se revirtieron a 29/9 antes del commit de Fase B; el único cambio válido de
   ese hallazgo (una ruta de archivo incorrecta en `validate-claims-rules.md`) se mantuvo.
2. **`git add -A` habría mezclado trabajo de una sesión externa concurrente.** Antes de cada uno de
   los 4 commits de esta pasada, `git status` mostró cambios de una sesión activa del Hermes Agent
   CLI trabajando en paralelo sobre una campaña de BMW (`brands/bmw/design-input/*`,
   `newsletters/2026/bmw/2026-ago-bmw-brand-native-restauracion-test/`). Cada commit se hizo
   mediante staging explícito de archivos por ruta, nunca `git add -A`, para no incluir trabajo en
   curso de esa sesión.

---

## 4. Trabajo evaluado y explícitamente diferido (no ejecutado)

Dos de las tareas de "impacto bajo" de la auditoría (§17) se investigaron en profundidad y se
decidió NO ejecutarlas en esta pasada. Ambas están documentadas como tareas completadas-con-decisión
en el tracker de la sesión (no como pendientes olvidadas):

**Migrar `card-tarifa.html`/`card-tarifa-3.html` a `{{#each}}`.** El análisis de la geometría real
del componente reveló que su primera celda usa una notación shorthand de padding de 3 valores que
aplica el gutter a AMBOS lados (no solo al interior), a diferencia de la convención de "solo gutter
interior" que usan los 9 componentes ya migrados a `{{#each}}`/`withCellGeometry`. Reproducirla
exactamente habría exigido un caso especial dedicado en el helper de geometría compartido para
codificar lo que casi con toda seguridad es una inconsistencia no intencional del HTML escrito a
mano, no un diseño deliberado — o, si se migraba con la convención estándar, habría desplazado ~6px
el borde exterior izquierdo de la primera tarjeta en las 8 campañas reales que usan estos
componentes (nike, optica2000, tarifalo ×4, paraycompara ×2). Sin infraestructura de QA visual para
confirmar que ese desplazamiento es en efecto imperceptible, el riesgo sobre datos de producción
reales no se consideró justificado por el beneficio (deduplicar ~15 líneas por archivo).

**Fusionar `editorial-foto-texto.html`/`-inverso.html`.** El motor de plantillas actual no tiene
ningún primitivo condicional (`{{#each}}`/`{{include}}`/`{{token}}`/`{{data}}` son los únicos
soportados). Fusionar de verdad ambas plantillas habría exigido o (a) añadir `{{#if}}` al motor
compartido — ampliando la superficie de riesgo a los 27+ componentes existentes, no solo a estos
2 — o (b) cambiar la firma de los adaptadores de módulo para recibir el nombre del módulo invocado
(afecta a los ~30 adaptadores de `MODULE_ADAPTERS`). Cualquiera de las dos rutas es una modificación
real del motor central (`engine/lib/assemble.js`, archivo bajo integrity-lock), no un refactor
mecánico de bajo riesgo. Además, ambos componentes estaban en uso activo durante esta misma sesión
por la campaña BMW de la sesión concurrente mencionada en §3 — tocar el motor mientras esa campaña
se construye en paralelo es precisamente el patrón de riesgo que causó los dos incidentes de pérdida
de datos que motivaron el backup del CHANGELOG.

**Criterio para revisar esta decisión en el futuro:** si aparece una tercera variante de
orientación de `editorial-foto-texto` (ej. imagen arriba/texto abajo en desktop), el caso para
añadir un primitivo condicional real al motor se vuelve mucho más fuerte que para solo 2 variantes
— en ese punto, la inversión ya no es "ahorrar 10 líneas", es "evitar una tercera plantilla clonada".

---

## 5. Riesgos mitigados (de la tabla §16 de la auditoría)

| ID | Riesgo | Estado tras esta pasada |
|---|---|---|
| R-01 | Pérdida de datos por `write_file` mal usado en herramienta externa | Mitigado parcialmente: `backup-changelog.ts` da recuperabilidad; la causa raíz sigue viviendo en una herramienta externa al repo, fuera de este alcance |
| R-02 | Agente nuevo confía en documentación legacy sin banner | Cerrado: 7/7 archivos de `references/` con banner; fila 06 corregida |
| R-04 | Gate 12 deja de detectar lo que dice sin que ningún test lo note | Cerrado: 4 tests de humo cubren los escenarios pasa/falla documentados |
| R-05 | Inyección de shell vía `execSync` con interpolación | Cerrado: `execFileSync` con array de argumentos en los 2 archivos afectados |
| R-06 | Gate hijo colgado bloquea el Production Gate indefinidamente | Cerrado: timeout de 120s |
| R-08 | Sesión concurrente sin coordinación sobrescribe trabajo en curso | Sin cambio de código posible (es un problema de proceso, no de repo) — mitigado en la práctica por la disciplina de staging explícito de esta sesión, no por una herramienta nueva |

R-03 (vacío combinatorio de componentes) y R-07 (falsos positivos de la regla "potencia") quedan
sin tocar — ambos son decisiones de producto/editoriales, no deuda técnica ejecutable sin ese
criterio (ver §1).

---

## 6. Qué no se tocó y por qué

- **React Email / F4.** `AGENTS.md` lo prohíbe explícitamente. No se tocó.
- **División/fusión de agentes 00-09.** Ver `docs/propuesta-reorganizacion-agentes-2026-07-28.md` —
  la auditoría no encontró responsabilidad huérfana entre agentes consecutivos; la recomendación es
  no reorganizar.
- **QA visual/Outlook real con detección automática de errores de render.** Ver
  `docs/roadmap-qa-visual-2026-07-28.md` — requiere infraestructura de captura/diffing que hoy no
  existe como sistema.
- **`card-tarifa`/`editorial-foto-texto*`.** Ver §4.
- **Regla de claims "potencia".** Ver §1 — decisión editorial, no técnica.

---

## 7. Próximas oportunidades (no urgentes, documentadas para continuidad)

1. Smoke tests para los 5 gates basados en script que quedaron sin cubrir en Fase C (parity,
   control-files, column-balance, brand-pack-completeness, contrast) y los 3 gates inline de
   `production-gate-motor.ts` (schema, claims, assets) — cada uno ya se verificó manualmente contra
   campañas reales durante esta sesión, pero no tiene fixture de test dedicado.
2. Mock/fixture para las dependencias de red (`generate-hero-image.ts`, `capture-brand-site.ts`,
   Gate 5) — permitiría testear el camino de manejo de errores sin gastar cuota real.
3. `docs/qa-process.md` sigue sin actualizar (menciona al agente 07 con su nombre legacy
   "React Email Developer") — no se tocó por estar fuera del árbol de `pipeline-skill/references/`
   auditado en Fase B; mismo tipo de fix, alcance distinto.
4. Revisión editorial de la regla de claims "potencia" con quien tenga criterio de marca sobre
   automoción/energía (ver §1, §5 R-07).
5. Si vuelve a aparecer un componente clon en el futuro (como `card-tarifa-3`/`category-grid-img`
   antes de esta pasada), `check-component-inventory.ts` no lo detecta hoy — solo detecta drift de
   documentación, no duplicación de lógica de adaptador. Sería una extensión natural del mismo script.
