# PROMPT 21 — Gate de producción para campañas del motor

## CONTEXTO

Eres el Orchestrator de Hermes. Continúa F3 (prompts 19 y 20 ya escribieron `check-parity.ts`
y `check-control-files.ts`). `production-gate.ts` existe, pero solo sabe validar el pipeline
viejo: sus 3 gates (`validate-newsletter --production`, `check-links --strict`,
`validate-claims --production`) leen literalmente `06-data/newsletter-data.json` con la forma
de módulos de React Email (`modules[i].type`, `.content.title`...). Una campaña construida por
el motor tiene `06-data/campaign-data.json` con una forma distinta
(`modules[i].component`, `.data.h1`...) y el HTML ya no sale de React — sale de
`engine/build-newsletter.js`. Correr `production-gate.ts` tal cual sobre una campaña del motor
falla por el motivo equivocado (archivo no encontrado), no por un problema real de la campaña.

## TAREAS

1. **Decide y documenta la estrategia de convivencia** (los 2 pipelines coexisten hasta F4):
   opción recomendada — un script nuevo `scripts/production-gate-motor.ts` que NO modifica
   `production-gate.ts` (sigue sirviendo campañas React Email tal cual hasta que F4 las
   archive). Justifica la decisión en el propio script si eliges una alternativa.

2. **`scripts/production-gate-motor.ts`** encadena, en este orden, sobre una campaña del motor:
   ```bash
   npx tsx scripts/production-gate-motor.ts --campaign newsletters/{year}/{client}/{campaign}
   ```
   - **Gate 1 — schema**: `campaign-data.json` valida contra
     `engine/schema/campaign-data.schema.json` con `ajv` (reutiliza la misma validación que
     `build-newsletter.js` hace en su paso 1 — no la reimplementes distinta, impórtala o
     invócala).
   - **Gate 2 — build limpio**: `node engine/build-newsletter.js --data ... --out
     {campaña}/09-exports/` termina en `✓ BUILD OK` (si `09-exports/` ya existe de un build
     anterior, re-construye para asegurarte de que el gate certifica el estado ACTUAL de los
     datos, no un build viejo).
   - **Gate 3 — paridad**: `scripts/check-parity.ts` (prompt 19) sobre esa campaña.
   - **Gate 4 — claims**: adapta el escaneo de `validate-claims.ts` (las mismas 29 reglas) a la
     forma de `campaign-data.json` — campos a escanear: `metadata.subjectLine`,
     `metadata.preheader`, y por cada módulo, sus campos de texto reales (`h1`, `subtitle`,
     `title`, `body`, `items[].title`, `items[].body`, `cta.label`...). Puedes extraer la
     tabla de 29 reglas a un módulo compartido (`scripts/lib/claim-rules.ts`) e importarlo desde
     ambos scripts en vez de duplicar las reglas — evita que las dos listas diverjan con el
     tiempo.
   - **Gate 5 — assets HTTP 200**: extrae todas las URLs `https://` de `src=`/`href=` del
     `final-inline.html` regenerado y hace `HEAD` a cada una (mismo patrón que
     `check-links.ts --online`, con timeout y fallo no bloqueante si no hay red en el entorno —
     repórtalo como aviso, no como error, si la causa es falta de conectividad del sandbox, no
     un asset roto de verdad).
   - **Gate 6 — control files**: `scripts/check-control-files.ts` (prompt 20).

3. **Salida**: mismo formato que `production-gate.ts` (resumen ✅/❌ por gate, exit 0 solo si
   todos pasan, mensaje final "candidata a producción, pendiente de aprobación humana" — nunca
   "production ready" sin más).

4. **Pruébalo** contra `newsletters/2026/paraycompara/2026-jul-revision-verano/` (la campaña
   real construida con el motor en esta sesión). Documenta el resultado tal cual salga —
   incluido si falla por `isTestCampaign:true`/`productionReady:false` (que debería fallar, es
   el comportamiento correcto, no un bug del gate).

## RESTRICCIONES

- No modificar `production-gate.ts`, `validate-newsletter.ts`, `check-links.ts` ni
  `validate-claims.ts` — siguen intactos para el pipeline React Email hasta F4.
- No modificar ninguna campaña real más allá de regenerar su `09-exports/` con el motor si el
  gate lo requiere (eso ya es una operación legítima y repetible, no una edición manual).
- Si extraes las reglas de claims a un módulo compartido, verifica que `validate-claims.ts`
  original sigue funcionando exactamente igual tras el cambio (mismas 29 reglas, mismo
  comportamiento) — es una refactorización sin efecto observable en el script viejo, no una
  reescritura.

## CRITERIOS DE ACEPTACIÓN

- [ ] `scripts/production-gate-motor.ts` creado, encadena los 6 gates en orden
- [ ] Gate de claims cubre las 29 reglas sobre la forma real de `campaign-data.json`
- [ ] Gate de assets intenta HTTP 200 real, con fallo por falta de red distinguido de asset
      roto
- [ ] Probado contra una campaña real del motor, con resultado real documentado (no forzado)
- [ ] `production-gate.ts` (el viejo) sigue funcionando sin cambios de comportamiento
- [ ] Documentado en `pipeline-skill/references/script-usage.md`
