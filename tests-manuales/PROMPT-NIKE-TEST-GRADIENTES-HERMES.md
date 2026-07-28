# PROMPT PARA HERMES — Campaña Nike #2 (test de gradientes/sombras/scrim, 2026-07-24)

> Copia todo lo que hay debajo de la línea como primer mensaje de una sesión nueva con Hermes.
> Ya existe una campaña real de Nike (`newsletters/2026/nike/2026-jul-nike-pegasus-42`, aprobada
> y pasando gates). Este prompt crea una SEGUNDA campaña de Nike — mismo brand pack, ángulo de
> campaña distinto — para probar, de punta a punta con el pipeline de agentes real, los 3 cambios
> de motor añadidos hoy: `gradients.heroBackground`, la corrección de la nota de scrim en
> `patterns/fotografia-primero.md`, y la auditoría de `shadows.card`. Ver
> `engine/CHANGELOG.md`, entrada "Gradientes bulletproof, corrección de doc obsoleta y auditoría
> de sombras (2026-07-24)".

---

Eres el Orchestrator de Hermes en `sistema-final/`. Antes de nada, lee `agents/00-orchestrator.md`
y `PROMPT-CONTEXTO-HERMES.md`. Vas a crear una campaña **nueva** para un cliente **ya existente**
en el sistema: Nike (`brands/nike/tokens/brand-tokens.json`, v2.2.1) — usando el motor y el
pipeline real, sin excepciones.

## 🎯 Qué estamos verificando con esta campaña (léelo antes de nada)

Esta campaña NO es para descubrir la marca (eso ya se hizo el 2026-07-24, brand pack real y
verificado) — es para confirmar que 3 cambios de motor añadidos hoy funcionan correctamente de
principio a fin en una campaña real nueva:

1. **`gradients.heroBackground` no rompe nada.** El pack de Nike ya tiene este campo
   (`"none"`, con motivo documentado: `colors.primary`==`colors.deep` y la marca ya es
   fotografía-primero). El build debe completarse sin ningún error de `{{token:}}` sin resolver
   — confírmalo en `production-gate-motor` (Gate "build") y en el `final.html` real: la fila del
   hero debe llevar `background-image:none;` en su `style`, no un placeholder roto.
   **Importante:** esta campaña NO va a mostrar un degradado visible — Nike es, por diseño de
   marca ya verificado, uno de los packs en `"none"`. Si quieres ver el degradado en acción,
   pruébalo en una campaña de `tarifalo`, `adeslas` o `paraycompara` (packs con
   `colors.primary`/`colors.deep` distintos). Aquí lo que se prueba es que el pack con `"none"`
   se comporta correctamente, no que se vea un gradiente.
2. **La nota de scrim corregida se sostiene con esta campaña real.** `patterns/
   fotografia-primero.md` §4 decía que `hero-imagen.html` necesitaba un overlay/scrim porque el
   texto iba superpuesto a la foto — se corrigió hoy porque eso no es lo que hace el componente
   (el texto vive en filas separadas, debajo de la foto, sobre fondo sólido). Que **08 (QA)**
   confirme mirando el `final.html` real de esta campaña: el H1/subtítulo/CTA del hero, ¿están
   visualmente sobre la fotografía o debajo, en su propio bloque de color? Debe ser lo segundo.
3. **`shadows.card` sigue en `"none"` donde debe.** Nike tiene `shadows.card: "none"` (diseño
   plano, ya documentado). Si esta campaña usa algún módulo con caja tipo tarjeta
   (`usp-cards`, `columns-3-beneficios*`), confirma en el `final.html` que esas cajas llevan
   `box-shadow:none;` — el motor ahora SIEMPRE aplica el token ahí (antes no lo hacía en algunos
   componentes), así que el comportamiento correcto es que se aplique el token y resuelva a
   "sin sombra", no que la sombra aparezca de la nada.
4. **`production-gate-motor` en verde, 9/9 gates**, incluido el Gate 8
   (`brand-pack-completeness`) — el pack de Nike ya está completo (Nivel 3 + gradients), así que
   no debería fallar por huecos nuevos.

## Reglas duras (no negociables — las de siempre)

- Todo el HTML sale del motor. `npm run check-engine` antes de tocar `engine/` (no deberías
  necesitar tocarlo para esta campaña — es solo contenido nuevo).
- Todo el branding de Nike YA vive en `brands/nike/tokens/brand-tokens.json` — no lo reescribas
  ni inventes valores nuevos de marca. Si necesitas un dato de marca que no está, es un hueco
  real que declarar (agente 02), no algo que rellenar de memoria.
- `campaign-data.json` valida contra `engine/schema/campaign-data.schema.json` (ajv), forma
  SIEMPRE `{component, data}` por módulo.
- Nada de claims, cifras de rendimiento o comparativas de producto sin confirmar — 29 reglas en
  `scripts/lib/claim-rules.ts`.
- Ángulo de campaña y copy: verificados contra el sitio real (Chrome), nunca de memoria — aunque
  el brand pack ya exista, el COPY de esta campaña concreta (H1, subtítulo, beneficios) es nuevo
  y necesita su propia verificación con `voice.rhythm` ya documentado en el pack.

## Datos de partida (verificados por mí, no inventados)

- **Producto real y URL real de referencia** (distinta de la primera campaña, para que sea un
  test independiente, no una repetición): Nike Pegasus 42, versión mujer, verificada en vivo el
  2026-07-24 (misma ronda de verificación que la URL de hombre ya usada en la primera campaña):
  `https://www.nike.com/t/pegasus-42-womens-road-running-shoes-VCB6baKU/IB1881-602`.
- **Sugerencias razonables mías para esta campaña de prueba, NO hechos verificados — confírmalas
  o ajústalas con el usuario en la fase 01**:
  - Objetivo: dar a conocer la versión mujer del Pegasus 42 y dirigir tráfico a su ficha.
  - CTA principal: "Comprar el Pegasus 42" → la URL de arriba.
  - Nombre de campaña sugerido: `2026-jul-nike-pegasus-42-w`.
  - `metadata.isTestCampaign: true` — campaña de prueba del motor, no un envío real.

## Hero con arte generado

Igual que la primera campaña Nike: **06** ejecuta
`npm run generate-hero-image -- --brand nike --theme "{ángulo de 03}" --campaign
newsletters/2026/nike/2026-jul-nike-pegasus-42-w --source landing --url
https://www.nike.com/t/pegasus-42-womens-road-running-shoes-VCB6baKU/IB1881-602`
(requiere `OPENAI_API_KEY` con facturación activa — si falla, repórtalo como bloqueo, no caigas a
un placeholder). El PNG queda en `brands/nike/design-input/hero-banner.png`; `bannerSrc` en
placeholder explícito hasta que el usuario confirme la URL del CDN.

## Proceso a seguir

1. 00 dirige 01→09. 01 confirma con el usuario los datos de "Datos de partida".
2. 02: el brand pack de Nike YA existe y está completo — no repitas la investigación de marca,
   pero SÍ verifica con Chrome real el copy/beneficios concretos de la ficha de mujer (puede
   diferir del texto ya usado en la ficha de hombre).
3. 03: patrón + estructura + elección de hero (con el brand pack ya diciendo que Nike es
   fotografía-primero, `fotografia-primero` sigue siendo el patrón esperado — que 03 lo confirme
   con motivo, no lo dé por hecho solo porque la otra campaña lo usó).
4. 04/05: diseño y copy nuevos para esta campaña, sin inventar cifras/comparativas.
5. 06: `campaign-data.json` + generación del arte del hero (ver arriba).
6. 07: build vía `node engine/build-newsletter.js --data
   newsletters/2026/nike/2026-jul-nike-pegasus-42-w/06-data/campaign-data.json --out
   newsletters/2026/nike/2026-jul-nike-pegasus-42-w/09-exports/`.
7. 08: QA completo — añade explícitamente al `visual-qa.md` las 3 confirmaciones del punto
   "Qué estamos verificando" de arriba (gradients/scrim/shadows), no solo el checklist habitual.
8. 09: `npm run production-gate-motor -- --campaign newsletters/2026/nike/2026-jul-nike-pegasus-42-w`
   en verde, 9/9 gates, antes de dar la campaña por completada.

## Lo que NO hacer

- No repitas la investigación de marca de 02 desde cero — el pack ya existe y ya pasó Nivel 3.
- No esperes ver un degradado visible en el hero de esta campaña — Nike resuelve a `"none"` por
  diseño ya verificado; si el degradado no aparece, eso es CORRECTO, no un fallo.
- No inventes copy/beneficios de la ficha de mujer copiando literalmente los de la ficha de
  hombre sin verificar — pueden diferir.
- No des la campaña por terminada si el Gate 8 falla o si el `final.html` no muestra
  `background-image:none;`/`box-shadow:none;` exactamente donde se espera.
