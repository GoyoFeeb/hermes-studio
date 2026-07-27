# PROMPT PARA HERMES — Campaña Spotify (marca nueva, test exigente del motor, 2026-07-24)

> Copia todo lo que hay debajo de la línea como primer mensaje de una sesión nueva con Hermes.
> Spotify es una marca REAL ajena al sistema (no una de las 7 marcas ya existentes), elegida
> específicamente porque su identidad real es la más exigente de probar contra los 5 cambios de
> motor de esta sesión: gradientes bulletproof, auditoría de sombras, gate de contraste WCAG,
> schema estructural de brand-tokens y gate de production-readiness. Ver razonamiento completo
> abajo en "Por qué Spotify".

---

Eres el Orchestrator de Hermes en `sistema-final/`. Antes de nada, lee `agents/00-orchestrator.md`
y `PROMPT-CONTEXTO-HERMES.md`. Vas a crear la **primera** campaña para un cliente **nuevo**:
Spotify. El brand pack YA EXISTE — `brands/spotify/tokens/brand-tokens.json` v2.2.0 — creado en
esta sesión con investigación real (Chrome contra spotify.com/us/premium/, getComputedStyle, más
fuentes secundarias citadas para el lenguaje de diseño de campañas Wrapped). **No lo reescribas ni
inventes valores nuevos** — si falta un dato real, decláralo como hueco (agente 02), no lo
rellenes de memoria.

## Por qué Spotify (identificación, no suposición)

El usuario pidió identificar, entre marcas reales del mundo (no las 7 ya usadas por el sistema),
la que usa más recursos visuales y complejidad en sus newsletters, para un test "exigente". La
investigación (búsqueda web + observación directa en Chrome) señaló a **Spotify** — en concreto el
lenguaje visual de sus campañas Wrapped (degradados vibrantes de alto contraste sobre paletas
reducidas, tipografía como protagonista) — como la referencia más citada en prensa de diseño para
complejidad visual en comunicación de marca.

Hay una tensión real y deliberada en este pack, no un descuido: la identidad de Spotify es
**dark-mode-first** (fondo negro puro `#000000`, verificado en vivo el 2026-07-24 — no el
`#191414` que citan algunas guías de marca de terceros, que no se confirmó en el sitio real).
El motor actual fuerza `color-scheme:light` en todas las marcas. El usuario, al preguntársele,
eligió explícitamente **adaptar Spotify a fondo claro** en vez de forzar un dark-mode real que el
motor no soporta — ver `brands/spotify/tokens/brand-tokens.json` → `darkMode.note` para el
razonamiento completo. Esta campaña es, por tanto, la primera vez que el sistema construye una
marca real cuya identidad nativa tuvo que traducirse deliberadamente a un contexto distinto, en
vez de heredar un layout claro por defecto — y es precisamente lo que la hace "exigente": obliga a
decisiones de diseño reales, no solo a copiar tokens.

**Corrección honesta ya incorporada** (ver `_changelog` del pack, entradas `fix1`/`fix2`): el
primer borrador de este pack usaba el mismo verde vivo (`#1ED760`, real, verificado en vivo) tanto
para el botón CTA como para `colors.primary` (rol de texto de H2 y fondo de hero) — `check-contrast.ts`
lo detectó en rojo (3 de 7 combinaciones fallaban WCAG). Se corrigió desacoplando los roles:
`colors.primary` = negro real (`#000000`), `colors.deep` = verde oscuro derivado/computado
(`#146C43`, no observado — elegido para pasar 4.5:1 con texto blanco), `colors.ctaBackground` se
mantiene el verde vivo real (`#1ED760`) sin tocar. Ahora `check-contrast.ts --brand spotify` da
**7/7**. Esto ya demuestra que el gate de contraste nuevo de esta sesión funciona de verdad — no
es una casilla que siempre pasa.

## 🎯 Qué estamos verificando con esta campaña

1. **`gradients.heroBackground` se ve** — degradado negro→verde
   (`linear-gradient(135deg, #000000 0%, #146C43 100%)`) sobre el hero y la banda de cierre.
   Confírmalo en el `style` del `<td>` correspondiente en `final.html`.
2. **`usp-cards`/`columns-3-beneficios` llevan `box-shadow:{{token:shadows.card}}`** —
   `0 2px 8px rgba(0,0,0,0.06)` (valor de adaptación a fondo claro, documentado en el `_changelog`
   del pack como NO observado en el sitio real de Spotify, que resuelve profundidad con negro +
   bordes, no con sombra). Confírmalo en `final.html`.
3. **`check-contrast.ts` (Gate 9) da 7/7** — ya verificado antes de esta campaña; confirma que el
   copy/estructura nuevos no introducen una combinación de texto no contemplada (por ejemplo, si
   04/05 deciden pintar algún texto en `colors.deep` o `colors.primary` sobre un fondo no previsto
   en las 7 combinaciones fijas, ese riesgo debe detectarse aquí).
4. **`check-brand-pack-completeness.ts` (Gate 8, con la validación de schema estructural nueva de
   hoy) pasa limpio** — ya verificado antes de esta campaña.
5. **`check-production-readiness.ts` (Gate 10) pasa** — con `metadata.isTestCampaign:true`
   cualquier placeholder (logo pendiente, hero banner pendiente) queda como aviso, no como error.
6. **`production-gate-motor` en verde, 11/11 gates** (0-10).
7. **Bonus real de esta marca**: el CTA de Spotify lleva **texto negro sobre fondo verde**
   (`ctaText:#000000` / `ctaBackground:#1ED760`) — ninguna de las 7 marcas del sistema usa esta
   combinación (todas usan texto claro sobre fondo oscuro/de color). Confirma que
   `cta-bulletproof.html` renderiza el texto del botón en negro, no en blanco por defecto/hardcodeado.

## Reglas duras (no negociables — las de siempre)

- Todo el HTML sale del motor. `npm run check-engine` antes de tocar `engine/` (no deberías
  necesitar tocarlo — esto es una campaña de contenido, no un cambio de motor).
- El branding de Spotify YA vive en `brands/spotify/tokens/brand-tokens.json` — no inventes
  valores de marca nuevos. Si necesitas un dato de marca que no está en el pack (ej. un producto
  específico, una cifra de catálogo), es un hueco a declarar (agente 02) o a pedir al usuario, no
  algo que rellenar de memoria.
- `campaign-data.json` valida contra `engine/schema/campaign-data.schema.json` (ajv), forma
  SIEMPRE `{component, data}` por módulo.
- Nada de claims, cifras (número de canciones, artistas, dispositivos compatibles, calidad de
  audio en kbps/bits exactos) sin confirmar contra una fuente real — 29 reglas en
  `scripts/lib/claim-rules.ts`. El pack ya trae copy real verificado en `voice.rhythm.examples`
  que puedes reutilizar o parafrasear con seguridad; cualquier cifra nueva (precio, duración de
  prueba) debe confirmarse contra spotify.com o quedar fuera del copy.
- El logo de Spotify (wordmark + isotipo de barras de sonido) está pendiente de captura real
  (`assets.logo` vacío, `assets.heroBannerPlaceholder` con placeholder `PENDING-CDN-UPLOAD`) —
  con `isTestCampaign:true` esto es un aviso de Gate 10, no un error. No inventes una URL de logo
  real; usa el flujo estándar de captura de asset o deja el placeholder documentado.
- Fotografía: si se genera hero-imagen, el tratamiento debe seguir lo documentado en
  `brands/spotify/tokens/brand-tokens.json` → `photography.treatment` (alto contraste,
  iluminación dramática de estudio) — no fotografía genérica de stock desalineada con la marca.

## Datos de partida

No invento un ángulo de campaña con cifras propias de Spotify no verificadas, pero sí hay una base
real sólida ya investigada en el pack (`voice.rhythm.examples`, `layout.contentRhythm`): la propia
página real de Spotify Premium (spotify.com/us/premium/, observada el 2026-07-24) gira en torno a
una prueba gratuita de 1 mes y 4 pilares de beneficio (sin anuncios, audio sin pérdida, escucha
offline, control total de reproducción). **01 debe confirmar con el usuario**, como mínimo:

- Si el ángulo es "prueba de Spotify Premium gratis" (con base real ya investigada, recomendado) o
  un ángulo distinto — en cuyo caso 02 debe verificar los hechos concretos de ese ángulo antes de
  que 04/05 escriban copy.
- CTA principal y URL real de referencia (spotify.com/premium o la que el usuario confirme).
- Nombre de campaña: `2026-jul-spotify-{ángulo}`, `metadata.isTestCampaign: true`.
- Si el usuario quiere que 02 profundice más en Chrome real (por ejemplo, capturar el bloque de
  planes de precio con detalle, o revisar una landing regional distinta) antes de construir
  `campaign-data.json`.

## Proceso a seguir

1. 00 dirige 01→09. 01 confirma con el usuario los datos de arriba.
2. 02: revisa `brands/spotify/tokens/brand-tokens.json` — ya tiene Nivel 3 completo (colores,
   tipografía, voz, fotografía, iconografía, layout, todos con `source`/fecha). Si el ángulo
   elegido por el usuario necesita un hecho no cubierto (ej. detalle de un plan de precio
   concreto), amplíalo con Chrome real sobre spotify.com y añade entrada de `_changelog` con bump
   de versión — no dupliques la investigación ya hecha, constrúyela encima.
3. 03: patrón + estructura + elección de hero. Dado `layout.sectionStyle:"asimetrico"` ya
   documentado, prioriza patrón/módulos asimétricos coherentes con esa evidencia. Mantén
   `usp-cards`/`columns-3-beneficios` en la secuencia para seguir probando el fix de sombra.
4. 04/05: diseño y copy. Usa `voice.rhythm.examples` como referencia de tono real — frases cortas,
   segunda persona directa, sin exclamaciones forzadas. Sin inventar cifras no confirmadas.
5. 06: `campaign-data.json`.
6. 07: `node engine/build-newsletter.js --data newsletters/2026/spotify/{campaña}/06-data/campaign-data.json --out newsletters/2026/spotify/{campaña}/09-exports/`.
7. 08: QA completo, incluido `brand-fidelity-qa.md` — añade explícitamente las 7 confirmaciones de
   "Qué estamos verificando" arriba.
8. 09: `npm run production-gate-motor -- --campaign newsletters/2026/spotify/{campaña}` en verde
   (11 gates) antes de dar la campaña por completada.

## Lo que NO hacer

- No repliques el fondo negro real de Spotify en el email — el pack ya está adaptado a claro
  deliberadamente (`surfaces.global`/`white` claros, `colors.primary` negro solo como texto/acento
  de hero, no como fondo global de todo el email). Si un módulo termina con fondo negro de página
  completa, revisa qué token se usó mal.
- No elijas un patrón sin `usp-cards`/`columns-3-beneficios` "por simplicidad" — perderías la
  cobertura de prueba del fix de sombra (aunque tampoco los fuerces sin contenido real: en ese
  caso, dilo explícitamente en `module-selection.md`).
- No inventes cifras de catálogo, calidad de audio, número de dispositivos compatibles o precios
  fuera de lo que 01/02 confirmen.
- No des la campaña por terminada si el Gate 8, 9 o 10 fallan sin explicación documentada en
  `next-steps.md`.
- No cambies `colors.ctaText` a blanco "porque así es en las otras marcas" — el negro sobre verde
  es el valor real observado en vivo; ya pasa Gate 9 con 10.94:1.
