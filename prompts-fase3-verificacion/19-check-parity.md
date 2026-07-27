# PROMPT 19 — check-parity.js: paridad fuente/inline independiente del build

## CONTEXTO

Eres el Orchestrator de Hermes. F1 y F2 están cerradas. Empieza F3: cerrar el hueco que
diagnosticó el plan (§1.4): el motor garantiza paridad fuente/inline **por construcción**
(`lib/verify.js` corre dentro del mismo proceso que escribe los archivos), pero nadie audita
esa garantía **desde fuera**, después del hecho. Es exactamente el escenario del Defecto N1
(`docs/re-auditoria-sistema-hermes-2026-07-17.md`): un inline certificado que en realidad
estaba desincronizado de su fuente, porque nadie volvió a comprobarlo tras la certificación.

## TAREAS

1. **Crea `scripts/check-parity.ts`** (mismo estilo que los scripts existentes: `parseArgs`,
   `resolveCampaignPath`, exit 0/1, sin dependencias nuevas más allá de las ya instaladas —
   `ajv`/`juice` no hacen falta aquí, solo `fs`/`path`/`crypto`).

   ```bash
   npx tsx scripts/check-parity.ts --campaign newsletters/{year}/{client}/{campaign}
   ```

2. **Verificaciones que hace, todas recalculadas desde los archivos reales de
   `09-exports/`, nunca leyendo el veredicto de `build-manifest.json` como si fuera prueba
   suficiente por sí sola:**
   - Recalcula `sha256` de `final.html` y `final-inline.html` y los compara contra
     `sourceSha256`/`inlineSha256` de `build-manifest.json`. Si no coinciden → error explícito
     "el archivo fue modificado después del build" (esto por sí solo habría atrapado N1).
   - Recuenta en `final.html` e `final-inline.html`, de forma independiente (misma lógica que
     `engine/lib/verify.js` pero en un archivo propio, no un `require` cruzado — dos
     implementaciones separadas de la misma regla es la garantía real de "independiente"):
     `<img>`, `utm_source`, `v:roundrect`, balance de `<table>`. Deben coincidir entre fuente e
     inline.
   - Verifica que `campaignDataSha256` de `build-manifest.json` coincide con el sha256 real de
     `06-data/campaign-data.json` en disco — si no coincide, los datos cambiaron después del
     build y el HTML ya no representa esos datos (variante del mismo problema de fondo).
   - Peso del inline: error si ≥90KB, aviso si ≥80KB (mismos umbrales que `lib/verify.js`, para
     que ambas capas estén de acuerdo).

3. **Modo `--campaign-set`** (opcional pero recomendado): recorre
   `newsletters/{year}/{client}/*/09-exports/` y corre la verificación en todas las campañas
   que tengan `build-manifest.json`, para poder auditar el estado de todo el sistema de una
   vez, no solo campaña a campaña.

4. **Pruébalo** contra al menos 2 casos:
   - Una campaña real con build limpio (ej. `newsletters/2026/paraycompara/2026-jul-revision-verano/`)
     → debe pasar limpio, exit 0.
   - Un caso de fallo fabricado a propósito: copia esa misma campaña a una carpeta temporal de
     prueba, edita 1 byte de `final-inline.html` a mano (simulando exactamente el escenario de
     N1) y confirma que `check-parity.js` lo detecta y sale con exit 1. Borra la carpeta de
     prueba al terminar.

## RESTRICCIONES

- No modificar `engine/lib/verify.js` ni ningún componente del motor.
- No modificar ninguna campaña real (el caso de fallo fabricado se prueba en una copia
  temporal, nunca sobre el original).
- No tocar `production-gate.ts` ni los scripts del pipeline React Email — eso es el prompt 21.
- Sin dependencias npm nuevas.

## CRITERIOS DE ACEPTACIÓN

- [ ] `scripts/check-parity.ts` creado, ejecutable con `npx tsx`
- [ ] Recalcula hashes y conteos desde los archivos reales, no confía en el manifest sin
      verificar
- [ ] Detecta el caso de fallo fabricado (archivo tocado a mano tras el build) con exit 1
- [ ] Pasa limpio (exit 0) contra al menos 1 campaña real construida con el motor
- [ ] Documentado en `scripts/README.md` o `pipeline-skill/references/script-usage.md` (añadir
      la entrada, no reescribir el resto del archivo)
