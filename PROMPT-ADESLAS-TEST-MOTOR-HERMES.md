# PROMPT PARA HERMES — Campaña Adeslas #2 (test de motor, 2026-07-24)

> Copia todo lo que hay debajo de la línea como primer mensaje de una sesión nueva con Hermes.
> Adeslas es, de las 7 marcas reales del sistema, la que combina en una sola campaña real
> (`2026-jul-adeslas-seguro-medico`) MÁS de los recursos añadidos/corregidos hoy: gradiente real
> visible (`gradients.heroBackground` con dos tonos distintos, a diferencia de BMW/Nike/UAX/
> Óptica2000 que resuelven a `"none"`), y los DOS componentes donde se corrigió hoy la
> inconsistencia de sombra (`usp-cards` y `columns-3-beneficios`, ambos usados en su patrón
> `institutional`). Ver razonamiento completo abajo en "Por qué Adeslas".

---

Eres el Orchestrator de Hermes en `sistema-final/`. Antes de nada, lee `agents/00-orchestrator.md`
y `PROMPT-CONTEXTO-HERMES.md`. Vas a crear una **segunda** campaña para un cliente **ya
existente**: Adeslas (`brands/adeslas/tokens/brand-tokens.json`, v2.2.1) — usando el motor y el
pipeline real, sin excepciones.

## Por qué Adeslas (identificación, no suposición)

Comparé las 7 marcas reales por 2 ejes — riqueza del brand pack y qué componentes usa su campaña
real — antes de elegir:

| Marca | ¿Gradiente visible? | ¿Usa usp-cards/columns-3-beneficios (shadow fix de hoy)? | Módulos reales |
|---|---|---|---|
| **Adeslas** | ✅ `linear-gradient(135deg, #004B87 0%, #003A6B 100%)` | ✅ **ambos** (`usp-cards` + `columns-3-beneficios`) | 7 |
| Paraycompara | ✅ (pack más "decorado" en general — 8 sub-patrones en `components.patterns`) | ❌ (patrón `saving`, no usa esos 2 componentes) | 7 |
| Tarifalo | ✅ | ❌ (patrón `saving`) | 5-6 |
| UAX | ❌ (`primary`==`deep`) | ✅ ambos + `category-grid` | 8 |
| Óptica 2000 | ❌ | ❌ (usa `category-grid-img`, no usp-cards/columns) | 7 |
| BMW / Nike | ❌ (identidad plana, por diseño) | ❌ (`columns-3-beneficios-sin-icono`, sin sombra) | 6 |

Paraycompara tiene el `brand-tokens.json` más rico en general (más líneas, más sub-patrones
decorativos históricos), pero al usar el patrón `saving` nunca toca `usp-cards`/
`columns-3-beneficios` — no puede probar el fix de sombra de hoy. UAX sí prueba el fix de sombra
pero su gradiente resuelve a `"none"` (no hay degradado visible). **Adeslas es la única marca que
prueba ambos a la vez en una campaña real**: gradiente visible Y los 2 componentes corregidos hoy.
Es también la marca con más huecos de investigación de marca pendientes (`photography`/
`voice.rhythm` con placeholder `[Q-NNN]` sin resolver, hallazgo real de la auditoría de hoy) — así
que esta campaña es también la oportunidad de que **02** cierre ese hueco de verdad, con Chrome
real, en vez de dejarlo como pendiente una ronda más.

## 🎯 Qué estamos verificando con esta campaña

1. **`gradients.heroBackground` se ve** en el hero y en la banda de cierre —
   `linear-gradient(135deg, #004B87 0%, #003A6B 100%)` sobre el `background-color`/`bgcolor`
   sólido existente. Confírmalo mirando el `style` del `<td>` del hero en `final.html`.
2. **`usp-cards`/`columns-3-beneficios` llevan `box-shadow:{{token:shadows.card}}`** — antes de
   hoy no lo llevaban. Confírmalo en `final.html`: la caja de las 3 tarjetas USP y la caja
   "highlight" bajo las 3 columnas de beneficios deben tener `box-shadow:0 2px 8px
   rgba(0,0,0,0.06);` (el valor real de `shadows.card` de Adeslas), no ausente.
3. **`check-contrast.ts` (Gate 9) pasa** — Adeslas ya pasaba 7/7 combinaciones antes de esta
   campaña; confirma que sigue así con el copy/estructura nuevos (los colores no cambian, pero
   verifica que ningún módulo nuevo introduce una combinación de texto no contemplada).
4. **`check-brand-pack-completeness.ts` (Gate 8, incluida la validación de schema estructural
   nueva de hoy) — la oportunidad real**: si **02** investiga de verdad `photography`/
   `voice.rhythm` sobre segurcaixaadeslas.es (o la URL real que confirme el usuario) con Chrome
   real, este gate debería pasar limpio por primera vez para esta marca. Si no es posible
   investigar, la válvula de escape debe quedar documentada en `_changelog` — no en silencio.
5. **`check-production-readiness.ts` (Gate 10) pasa** — con `isTestCampaign:true` cualquier
   placeholder queda como aviso, no como error; confirma que el reporte lo dice así, no en
   silencio.
6. **`production-gate-motor` en verde, 11/11 gates** (0-10, incluidos los 3 nuevos de hoy:
   contrast, production-readiness, y la validación de schema dentro de brand-pack-completeness).

## Reglas duras (no negociables — las de siempre)

- Todo el HTML sale del motor. `npm run check-engine` antes de tocar `engine/` (no deberías
  necesitar tocarlo — esto es una campaña de contenido, no un cambio de motor).
- El branding de Adeslas YA vive en `brands/adeslas/tokens/brand-tokens.json` — no inventes
  valores de marca nuevos; si falta un dato real, es un hueco que declarar (agente 02), no algo
  que rellenar de memoria.
- `campaign-data.json` valida contra `engine/schema/campaign-data.schema.json` (ajv), forma
  SIEMPRE `{component, data}` por módulo.
- Nada de claims, cifras de cobertura, precios o comparativas de pólizas sin confirmar — 29
  reglas en `scripts/lib/claim-rules.ts` (especial cuidado con seguros médicos: cifras de
  cobertura, exclusiones y plazos de carencia son terreno legal sensible).
- Colores/tipografía de Adeslas: ya verificados en el pack (v2.2.0, sin Chrome real — ver
  `_changelog`). **Photography y voice.rhythm SÍ deben verificarse con Chrome real en esta
  ronda si el sitio es accesible** — es precisamente el hueco que esta campaña puede cerrar.

## Datos de partida

No invento un ángulo de campaña nuevo para Adeslas (no tengo hechos verificados de un producto
concreto de Adeslas en esta sesión, a diferencia de Nike donde sí verifiqué URLs reales). **01
debe pedir al usuario**, como mínimo:

- Qué modalidad/producto de seguro médico es el foco (dental, salud completa, seguro de
  reembolso, etc.) — la campaña existente (`2026-jul-adeslas-seguro-medico`) ya cubre "seguro
  médico" genérico; esta segunda campaña debería tener un ángulo distinto para no repetir
  contenido (ej. "seguro dental", "revisión anual", "salud para familias").
- Objetivo (contratación, cita previa, cotizar precio).
- CTA principal y URL real de referencia en segurcaixaadeslas.es (imprescindible para que 02
  pueda investigar `photography`/`voice.rhythm` con Chrome real sobre esa página concreta).
- Nombre de campaña sugerido: `2026-jul-adeslas-{ángulo}`, `metadata.isTestCampaign: true`.

## Proceso a seguir

1. 00 dirige 01→09. 01 confirma con el usuario los datos de arriba.
2. **02: cierra el hueco de Nivel 3 de Adeslas si el sitio es accesible** — `photography.
   usesRealPhotography`/`treatment` y `voice.rhythm.*` con Chrome real sobre la URL que dé el
   usuario, sustituyendo los `[Q-NNN]` actuales por datos reales (o documentando por qué no fue
   posible, sin dejarlo en silencio). Actualiza `brands/adeslas/tokens/brand-tokens.json` con
   entrada de `_changelog` y bump de versión.
3. 03: patrón (con Adeslas ya en `institutional`, confirma que sigue encajando con la evidencia
   nueva de 02) + estructura + elección de hero — mantén `usp-cards` y `columns-3-beneficios` en
   la secuencia si el contenido del brief los sostiene, precisamente para seguir probando el fix
   de sombra de hoy.
4. 04/05: diseño y copy, sin inventar cifras de cobertura/precio no confirmadas.
5. 06: `campaign-data.json`.
6. 07: `node engine/build-newsletter.js --data newsletters/2026/adeslas/{campaña}/06-data/campaign-data.json --out newsletters/2026/adeslas/{campaña}/09-exports/`.
7. 08: QA completo, incluido `brand-fidelity-qa.md` — añade explícitamente las 6 confirmaciones
   de "Qué estamos verificando" arriba.
8. 09: `npm run production-gate-motor -- --campaign newsletters/2026/adeslas/{campaña}` en verde
   (11 gates) antes de dar la campaña por completada.

## Lo que NO hacer

- No repitas literalmente el copy/estructura de `2026-jul-adeslas-seguro-medico` — es una segunda
  campaña con ángulo propio, no un duplicado.
- No elijas un patrón sin `usp-cards`/`columns-3-beneficios` "por simplicidad" — perderías
  precisamente la cobertura de prueba que motiva esta campaña (aunque tampoco los fuerces si el
  brief no da contenido real para ellos: en ese caso, dilo explícitamente en
  `module-selection.md` y acepta la campaña con menos cobertura de prueba antes que rellenar un
  módulo sin contenido real).
- No inventes cifras de cobertura, precios, carencias ni exclusiones de pólizas.
- No des la campaña por terminada si el Gate 8 (ahora con validación de schema estructural) o el
  Gate 9 (contraste) o el Gate 10 (production-readiness) fallan sin explicación documentada en
  `next-steps.md`.
