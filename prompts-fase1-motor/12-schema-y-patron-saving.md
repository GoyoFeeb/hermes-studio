# PROMPT 12 — Schema de datos de campaña + patrón de género "saving"

## CONTEXTO

Eres el Orchestrator de Hermes. Con la biblioteca de componentes creada (prompt 11),
este prompt define las otras dos piezas que el ensamblador (prompt 13) necesita:
**qué datos** describe una campaña (schema) y **qué estructura** tiene cada género de
newsletter (patrón). El primero de los patrones es gratis: `saving` es exactamente la
estructura de la pieza piloto.

## TAREAS

### 1. `engine/schema/campaign-data.schema.json`

JSON Schema (draft-07) del archivo `campaign-data.json` que cada campaña tendrá en
`06-data/`. Derívalo de la realidad, no lo diseñes en abstracto: abre
`engine/components/INVENTORY.md` y recoge TODOS los campos `{{data:...}}` que
consumen los componentes. Estructura mínima:

- `metadata`: campaignName, clientName, subjectLine, preheader, fromName, fromEmail,
  version, createdAt, `isTestCampaign` (bool), `productionReady` (bool).
- `brand`: ruta al brand pack (`brands/paraycompara/tokens/brand-tokens.json`) —
  el motor lee los tokens de ahí, nunca del campaign-data.
- `pattern`: nombre del patrón de género (`saving`, `educational`...).
- `modules`: array ordenado; cada entrada = `{ component: "card-tarifa", data: {...} }`
  donde `data` cubre los campos del componente (con `items[]` para los repetibles).
- `utm`: source/medium/campaign/content — la convención de `docs/naming-conventions.md`.
- Reglas heredadas del sistema actual que el schema debe conservar: prohibido
  `[PENDIENTE]` como valor (usar `""` o omitir), hex con patrón `^#[0-9A-Fa-f]{6}$`
  donde aplique, `src`/`href` absolutos https.

### 2. `patterns/saving.md`

El patrón de género documenta la ESTRUCTURA premium explícita — lo que hoy está
implícito en la pieza piloto. Contenido:

1. **Secuencia de componentes** (la de la pieza real): preheader → header → hero
   asimétrico → trust bar → cards de producto (×3-4) → pasos → lista premium
   ("antes de decidir", ×3-4) → banda de cierre → footer.
2. **Reglas de ritmo** (extraídas de las rondas 03 y G6/G7, están documentadas en
   `v5-premium/component-patterns.md` y qa-report): no dos secciones consecutivas con
   el mismo fondo/composición; alternancia blanco/lila; CTA principal en el primer
   tercio y repetido en el cierre; disciplina de sombras (solo tarjetas, CTAs y
   stat pill).
3. **Qué es obligatorio y qué opcional** (p. ej. trust bar opcional si no hay 3 claims
   confirmados en el brief; cards mínimo 2, máximo 4).
4. **Criterios de contenido por módulo**: qué tipo de dato del brief alimenta cada
   componente y qué hacer si falta (bloquear vs omitir módulo).
5. **Contrastes mínimos** por combinación de superficie (tabla WCAG con los umbrales
   CORRECTOS — la lección del CTA: texto grande = ≥24px normal o ≥18.66px bold).

### 3. Ejemplo válido

`engine/schema/campaign-data.example.json`: la campaña piloto expresada en el nuevo
formato — módulo a módulo, con el copy real de la pieza. Debe validar contra el schema
(hazlo programáticamente con ajv o validación manual exhaustiva documentada). Este
archivo es la entrada de la prueba de fuego del prompt 14, así que la fidelidad del
copy importa: cópialo de la pieza, no lo parafrasees.

### 4. Actualizar `engine/CHANGELOG.md`.

## RESTRICCIONES

- El schema refleja lo que los componentes consumen — si descubres un desajuste entre
  INVENTORY.md y los componentes reales, corrige el inventario y documéntalo, no
  improvises campos.
- El patrón documenta la pieza real y sus reglas ya validadas. No introduce criterios
  nuevos de diseño no respaldados por el histórico.
- No tocar componentes (prompt 11) salvo error factual descubierto, documentado en
  CHANGELOG.
- No crear los otros 9 géneros — solo `saving`. Los demás se crean cuando haya campaña
  real que los necesite (regla anti-aspiracional del plan, §5).

## CRITERIOS DE ACEPTACIÓN

- [ ] Schema cubre el 100% de los campos `{{data:...}}` de los componentes (verificación
      cruzada documentada)
- [ ] `campaign-data.example.json` valida contra el schema y contiene el copy real de la piloto
- [ ] `patterns/saving.md` con secuencia, ritmo, obligatorio/opcional, criterios de
      contenido y tabla de contrastes con umbrales WCAG correctos
- [ ] Reglas heredadas presentes: sin `[PENDIENTE]`, URLs absolutas, patrón hex
- [ ] CHANGELOG actualizado
