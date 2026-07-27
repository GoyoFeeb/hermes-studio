# PROMPT 13 — El ensamblador: engine/build-newsletter.js

## CONTEXTO

Eres el Orchestrator de Hermes. Componentes (11) y schema+patrón (12) existen. Este
prompt crea el script que los une: a partir de un `campaign-data.json` genera el HTML
fuente y el inline **en la misma ejecución** — paridad por construcción. Este script es
lo que hace irreproducible el defecto N1 (inline desincronizado) y el corazón del flujo
"un prompt → newsletter".

## ESPECIFICACIÓN

```bash
node engine/build-newsletter.js \
  --data newsletters/{year}/{client}/{campaign}/06-data/campaign-data.json \
  --out  newsletters/{year}/{client}/{campaign}/09-exports/
```

Pipeline interno, en orden estricto:

1. **Validar** el campaign-data.json contra `engine/schema/campaign-data.schema.json`
   (usa ajv; instálalo si falta). Error de schema → exit 1 con mensaje claro, no genera nada.
2. **Cargar tokens** del brand pack referenciado en `data.brand`. Si el archivo no
   existe o su versión es < 2.2.0 → exit 1.
3. **Resolver el patrón** (`data.pattern` → `patterns/{pattern}.md`): verificar que la
   secuencia de `data.modules` respeta la secuencia y las reglas obligatorio/opcional
   del patrón. Violación → exit 1 listando qué regla se incumple. (El patrón está en
   markdown: extrae la secuencia de su sección 1 — mantenla parseable, formato lista.)
4. **Ensamblar**: `_shell.html` + componentes en el orden de `data.modules`,
   sustituyendo `{{token:...}}` desde los tokens, `{{data:...}}` desde el módulo, y
   expandiendo `{{#each:items}}`. Placeholder sin valor → exit 1 (nunca render con
   `{{...}}` crudo). Escapar contenido en contexto HTML.
5. **Escribir fuente**: `{out}/final.html`.
6. **Inline**: juice con `preserveMediaQueries: true` (recuerda:
   `require('juice').default || require('juice')`) → `{out}/final-inline.html`.
7. **Auto-verificación** (dentro del propio script, siempre):
   - 0 restos de `{{` en ambos archivos.
   - Conteos fuente vs inline: `<img>`, enlaces con UTM, `v:roundrect` — idénticos.
   - Tags balanceados (tablas abiertas = cerradas).
   - Peso inline < 90 KB (aviso a partir de 80).
   - Cualquier fallo → exit 1 y BORRA los outputs parciales (nunca dejar un final.html
     inválido en 09-exports — es el error histórico del sistema).
8. **Manifest**: `{out}/build-manifest.json` — timestamp, hash sha256 de data, fuente e
   inline, versión de tokens, patrón usado, conteos. Este manifest es lo que el
   production-gate de F3 usará para verificar que certifica lo que se construyó.

## TAREAS

1. Escribir el script según la especificación. Node puro + juice + ajv; sin frameworks.
2. Módulos internos separados si lo ves claro (`lib/tokens.js`, `lib/assemble.js`...) —
   pero un solo punto de entrada.
3. **Probarlo de verdad** con `engine/schema/campaign-data.example.json` (prompt 12) →
   genera a un directorio temporal `engine/_test-output/` (no a la campaña real).
4. Probar también los caminos de error: data inválido, placeholder sin valor, token
   inexistente, patrón violado — cada uno debe dar exit 1 con mensaje útil. Documenta
   los 4 casos probados.
5. `engine/README.md`: uso, flags, convención de placeholders, cómo añadir un
   componente nuevo, cómo añadir un género nuevo.
6. Actualizar `engine/CHANGELOG.md`.

## RESTRICCIONES

- El script NO retoca diseño: si el resultado no es fiel, el problema está en los
  componentes o el data — se corrige allí (prompt 14 lo medirá).
- No escribir en ninguna campaña real en este prompt (solo `engine/_test-output/`).
- Sin dependencias más allá de juice y ajv.

## CRITERIOS DE ACEPTACIÓN

- [ ] Build completo del example.json sin errores en `engine/_test-output/`
- [ ] Los 4 caminos de error probados: exit 1 + mensaje claro + sin outputs parciales
- [ ] Auto-verificación integrada (restos de placeholders, conteos, tags, peso)
- [ ] `build-manifest.json` con hashes generado en cada build
- [ ] `engine/README.md` completo
- [ ] CHANGELOG actualizado
