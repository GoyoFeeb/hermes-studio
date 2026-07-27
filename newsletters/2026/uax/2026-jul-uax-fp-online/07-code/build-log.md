# Build log — 2026-jul-uax-fp-online

Agente: 07 HTML Email Developer · 2026-07-22

## Verificación previa

Orden de `modules[]` en `06-data/campaign-data.json`: header-logo → hero-centrado → intro-cta →
columns-3-beneficios → category-grid → usp-cards → banda-cierre → footer — coincide con
`03-strategy/structure.md` ✅. 5 de los 8 componentes no existían — construidos antes del build
(ver `engine/CHANGELOG.md`, entrada 2026-07-22, y `03-strategy/structure.md`).

## Intentos

**Intento 1**: falló — `campaign-data.json` traía un campo `"id"` en cada módulo (heredado del
formato antiguo `{type,content}` del primer intento), no soportado por el schema
(`additionalProperties:false`). Corregido eliminando el campo `id` de los 8 módulos.

**Intento 2**: falló — `category-grid.html` usa `{{#each:rows}}` con `{{#each:items}}` anidado
dentro (para agrupar las 5 categorías en filas de 3). El motor no soportaba anidamiento de
`{{#each}}` (bug real en `engine/lib/assemble.js`, nunca se había manifestado porque ningún
componente anterior anidaba un `{{#each}}` dentro de otro). Corregido: `processEachBlocks()`
nuevo, con parser de profundidad balanceada en vez de la regex no-greedy anterior. **Verificado
sin regresión**: rebuild de `2026-jul-comparar-tv`, `2026-jul-revision-verano` y
`2026-jul-comparar-luz-gas` — `cmp` byte a byte IDÉNTICO en los 3 antes/después del fix.

**Intento 3**: ✓ BUILD OK.

```
node engine/build-newsletter.js \
  --data newsletters/2026/uax/2026-jul-uax-fp-online/06-data/campaign-data.json \
  --out  newsletters/2026/uax/2026-jul-uax-fp-online/09-exports/
```

Salida: `final.html`, `final-inline.html` (30.6 KB), `build-manifest.json`. 0 avisos de la
auto-verificación (`engine/lib/verify.js`): 0 restos de `{{`, conteos `<img>`/UTM/`v:roundrect`
idénticos fuente/inline, `<table>` balanceadas, peso dentro de límite, `charset=UTF-8` presente
(gate añadido el mismo día — ver `engine/CHANGELOG.md`).

## Verificación estructural adicional (manual, sobre el HTML generado)

- `<table>`: 33 abiertas / 33 cerradas. `<tr>`: 54/54. `<td>`: 61/61.
- 0 ocurrencias de `{{` en el HTML final.
- Las 5 categorías del grid aparecen exactamente 1 vez cada una, agrupadas en 2 filas (3+2),
  ambas con celdas al 33% de ancho — confirma que el fix de `{{#each}}` anidado funciona como
  se esperaba.

## Post-build

`npm run check-engine -- --update` — lock regenerado (25 archivos: 5 componentes nuevos +
`lib/assemble.js` + `lib/verify.js` + schema). Ejecutado solo después de confirmar que el motor
funcionaba correctamente, nunca antes.
