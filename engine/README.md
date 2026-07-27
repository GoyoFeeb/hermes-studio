# engine/ — el motor único de generación premium

Creado en la Fase 1 del plan de transformación (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`,
§3.2) a lo largo de 3 prompts (`prompts-fase1-motor/11`, `12`, `13`). Convierte
`campaign-data.json` + un brand pack + un patrón de género en un HTML de email premium, con
paridad fuente/inline garantizada por construcción.

## Uso

```bash
node engine/build-newsletter.js \
  --data newsletters/{year}/{client}/{campaign}/06-data/campaign-data.json \
  --out  newsletters/{year}/{client}/{campaign}/09-exports/
```

Salida (solo si el build es válido de principio a fin — ver "Garantía de no dejar outputs
parciales" abajo):
- `{out}/final.html` — HTML fuente
- `{out}/final-inline.html` — mismo HTML con CSS inline (juice), generado en la misma ejecución
- `{out}/build-manifest.json` — hashes sha256 de data/fuente/inline, versión de tokens, patrón
  usado, conteos de verificación. Es lo que el `production-gate` de la Fase 3 usará para
  comprobar que certifica exactamente lo que se construyó.

Cualquier fallo en cualquier paso del pipeline termina con `exit 1` y un mensaje que dice
exactamente qué falló y dónde — nunca un mensaje genérico.

## Garantía de no dejar outputs parciales

La especificación original pedía "si falla, borra los outputs parciales". Este script hace
algo más fuerte: **nunca escribe nada en `--out` hasta que todo el pipeline (schema, tokens,
patrón, ensamblado, inline, auto-verificación) ha pasado.** Todo el trabajo intermedio vive en
memoria (strings de JavaScript); `fs.writeFileSync` solo se llama al final, los 3 archivos
seguidos. Es imposible que quede un `final.html` inválido en `09-exports/` porque nunca se
escribe uno inválido — el mecanismo es más simple y más difícil de romper por accidente que
"escribir y luego borrar si algo sale mal".

## Pipeline (orden estricto)

1. **Validar** `campaign-data.json` contra `engine/schema/campaign-data.schema.json` con ajv.
2. **Cargar tokens** del brand pack referenciado en `data.brand`. Falla si no existe o su
   versión es `< 2.2.0`.
3. **Resolver el patrón** (`data.pattern` → `patterns/{pattern}.md`): valida que la secuencia
   de `data.modules` respeta el orden y las reglas obligatorio/opcional del bloque
   `PATTERN_SEQUENCE` del patrón.
4. **Ensamblar** en memoria: `_shell.html` + cada componente de `data.modules`, con sus
   placeholders resueltos.
5. **Inline** con juice (`preserveMediaQueries: true`).
6. **Auto-verificar**: `<meta charset="UTF-8">` presente en fuente e inline (garantizado de
   serie para toda newsletter que genere el sistema — añadido 2026-07-22), 0 restos de `{{`,
   conteos `<img>`/UTM/`v:roundrect` idénticos entre fuente e inline, tablas balanceadas, peso
   del inline `< 90 KB` (aviso desde 80 KB).
7. **Escribir** `final.html`, `final-inline.html`, `build-manifest.json` — solo si 1-6 pasaron.

## Convención de placeholders

Definida en el prompt 11, con una extensión (`{{include:}}`) añadida en esa misma ronda:

| Placeholder | Resuelve contra | Ejemplo |
|---|---|---|
| `{{token:path.a.valor}}` | `brand-tokens.json`, vía path con puntos | `{{token:colors.primary}}` |
| `{{data:path.a.valor}}` | Los datos del módulo actual (con índices `[n]`) | `{{data:hero.h1}}`, `{{data:cards[0].title}}` |
| `{{#each:nombre}} ... {{/each}}` | Repite el bloque interior por cada elemento de `scope[nombre]`; dentro del bloque, cada campo del ítem se referencia SIN prefijo | Ver `lista-premium.html` |
| `{{include:nombre-componente}}` | Inserta `engine/components/{nombre}.html` resuelto con el MISMO scope del padre | `{{include:cta-bulletproof}}` en `hero-asimetrico.html` y `banda-cierre.html` |
| `{{slot:body}}` | Solo en `_shell.html` — sustituido por el HTML ya ensamblado de todos los módulos, en orden | — |

Todo `{{data:...}}` se escapa (`&`, `<`, `>`) antes de insertarse — es contenido de campaña,
no marcado de confianza. `{{token:...}}` no se escapa (son valores de diseño internos).

### Adaptadores de módulo

`campaign-data.json` usa una forma uniforme por módulo (`{eyebrow, title, items: [...]}`),
pero cada plantilla de componente espera nombres de placeholder específicos que ya existían
antes del schema (`cards[]`, `steps[]`, `trustItems[]`, `listItems`...). `lib/assemble.js`
define `MODULE_ADAPTERS`: una función por componente que traduce la forma del schema a la
forma que la plantilla necesita. Tabla completa de la traducción en `engine/CHANGELOG.md`
(prompt 12).

Caso especial — `cta.href`/`cta.label`: `cta-bulletproof.html` (el parcial VML+fallback
compartido por hero y banda de cierre) usa placeholders sin prefijo (`{{data:cta.href}}`). Los
adaptadores de `hero-asimetrico` y `banda-cierre` DUPLICAN el objeto `cta` a nivel raíz del
scope (`{ hero: {...}, cta: data.cta }`) precisamente para que el `{{include:cta-bulletproof}}`
lo encuentre ahí — el include hereda el scope completo del padre sin transformarlo.

## Cómo añadir un componente nuevo

1. Créalo en `engine/components/{nombre}.html` con una cabecera de comentario igual a las
   demás (origen, tokens, campos de datos — ver `engine/components/INVENTORY.md` para el
   formato). El comentario de cabecera se descarta automáticamente al renderizar
   (`stripLeadingComment` en `lib/assemble.js`), así que puede ser todo lo largo que haga
   falta.
2. Añade su adaptador a `MODULE_ADAPTERS` en `lib/assemble.js` — la función que traduce
   `data.items`/`data.eyebrow`/etc. a los nombres literales que usan los placeholders del
   componente.
3. Añade el `oneOf` correspondiente en `engine/schema/campaign-data.schema.json` (sección
   `modules.items.oneOf`), con los campos exactos que el componente consume.
4. Si el componente lo usa un patrón existente, añade su línea al bloque `PATTERN_SEQUENCE`
   de `patterns/{pattern}.md` (formato: `N. component-name (required|optional)`) Y a la tabla
   legible de la sección 1 del mismo archivo — deben mantenerse sincronizados a mano.
5. Prueba con un `campaign-data.json` de ejemplo antes de usarlo en una campaña real.

## Cómo añadir un género (patrón) nuevo

Regla anti-aspiracional del plan de transformación: **no crear un patrón nuevo hasta que haya
una campaña real que lo necesite.** Cuando la haya:

1. Crea `patterns/{genero}.md` con las mismas 5 secciones que `patterns/saving.md` (secuencia,
   ritmo, obligatorio/opcional, criterios de contenido, contrastes WCAG) y su propio bloque
   `PATTERN_SEQUENCE`.
2. Añade el nombre al `enum` de `pattern` en `campaign-data.schema.json`.
3. Si el género reutiliza componentes existentes, no hace falta tocar `engine/components/`. Si
   necesita uno nuevo, sigue la sección anterior.

## Estructura de archivos

```
engine/
├── build-newsletter.js       ← punto de entrada (CLI)
├── lib/
│   ├── tokens.js              ← carga y resuelve brand-tokens.json
│   ├── pattern.js              ← parsea y valida patterns/{pattern}.md
│   ├── assemble.js             ← motor de placeholders + adaptadores de módulo
│   └── verify.js                ← auto-verificación post-build
├── components/                 ← prompt 11 (INVENTORY.md tiene el detalle de cada uno)
├── schema/
│   ├── campaign-data.schema.json
│   └── campaign-data.example.json
└── CHANGELOG.md
```

## Dependencias

Solo `juice` (inline de CSS, ya era dependencia del proyecto) y `ajv` (validación de schema,
añadida en el prompt 13 — `npm install ajv --save`). Sin frameworks, sin dependencias
transitivas más allá de las que ajv/juice ya traen. Nota: `ajv` puro (sin `ajv-formats`) no
valida el keyword `"format"` de JSON Schema — por eso el schema usa `"pattern"` (regex) en vez
de `"format": "email"/"date"` para esos 2 campos; con `"format"` ajv solo emite un aviso y no
valida nada de verdad.

## Pendientes conocidos (fuera de alcance de este prompt)

- `card-tarifa` soporta 4 tarjetas (`card-tarifa.html`) y 3 tarjetas (`card-tarifa-3.html`).
  Solo falta la variante de 2, y no debe crearse hasta que una campaña real la necesite.
- El contraste del enlace secundario de `card-tarifa*` quedó resuelto el 2026-07-27 usando
  `colors.primary` y añadiendo su comprobación a `scripts/check-contrast.ts`.
- El bug de la sección "Antes de decidir" pertenece al HTML histórico de la campaña piloto:
  `lista-premium.html` y `campaign-data.example.json` ya generan los títulos correctos. Si esa
  pieza antigua se reenvía, debe regenerarse con el motor, no editar `final.html` a mano.
- `check-column-balance.ts` bloquea títulos de cierre de más de 45 caracteres para mantener una
  línea a 600px.
