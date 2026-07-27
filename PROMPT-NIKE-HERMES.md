# PROMPT PARA HERMES — Campaña Nike (test de los cambios del 2026-07-24)

> Copia todo lo que hay debajo de la línea como primer mensaje de una sesión nueva con Hermes.
> Nike es una marca **completamente nueva** para el sistema — no hay incidente que poner en
> cuarentena ni brand pack previo. Este prompt existe para probar, con un caso real y exigente,
> los cambios aplicados hoy: patrones dinámicos, decisión de variante de icono, ritmo de voz
> real, checklist de fidelidad de marca en QA, y el nuevo gate de brand-pack-completeness.

---

Eres el Orchestrator de Hermes en `sistema-final/`. Antes de nada, lee `agents/00-orchestrator.md`
y `PROMPT-CONTEXTO-HERMES.md` (contexto vigente del sistema). Vas a crear una campaña **nueva**
para un cliente **nuevo**: Nike — usando el motor y el pipeline existentes, sin excepciones.

## 🎯 Qué estamos verificando con esta campaña (léelo antes de nada)

Esta campaña es, a propósito, un caso exigente para el sistema: Nike es una marca donde la
fotografía real lleva casi todo el peso visual, la iconografía de marca es mínima (el swoosh, no
grids de iconos de beneficios), y la voz es extremadamente distintiva y reconocible (frases
cortas, imperativas, seguras — "Just Do It" es el ejemplo más famoso, pero no lo des por bueno
sin verificarlo: confírmalo observando el sitio real). Si el sistema todavía tira hacia lo
genérico por defecto, esta marca lo va a hacer evidente. Al terminar, estas son las preguntas
concretas que hay que poder responder con evidencia (no con impresión):

1. **¿Qué patrón eligió 03 y por qué?** (`module-selection.md` debe justificarlo contra
   `photography.treatment`, `iconography.componentImplication` y `layout.contentRhythm` del
   brand pack de Nike — ver `agents/03-newsletter-architect.md` §"Elegir el patrón de género".
   Es plausible que `fotografia-primero` encaje si la investigación real de 02 confirma que la
   fotografía domina y hay pocas secciones de contenido traducibles — pero no lo asumas de
   antemano: que lo decida 03 con la evidencia que 02 recoja.)
2. **¿Qué variante de icono decidió 04 y por qué?** (`assets-notes.md` debe decirlo — ver
   `agents/04-email-designer.md` §"Elegir variante de icono". Si Nike no usa iconos de beneficio
   en su propio sitio, la variante correcta casi seguro NO es emoji por defecto.)
3. **¿El copy de 05 se contrastó contra `voice.rhythm` real?** (ver
   `agents/05-copywriter.md` §"Ritmo de voz real" — longitud de frase, modo, ejemplos reales del
   sitio, no adjetivos de tono sueltos.)
4. **¿QA revisó `brand-fidelity-qa.md`?** (ver `agents/08-qa-specialist.md` §"Fidelidad de
   marca" — debe existir como archivo, no solo como mención.)
5. **¿Pasa `npm run production-gate-motor -- --campaign {campaña}` con el nuevo Gate 8
   (brand-pack-completeness) en verde, sin ningún placeholder `[Q-NNN]` disfrazado de dato
   real?** Esta es la comprobación más dura: como Nike es una marca nueva, no hay ninguna válvula
   de escape ya declarada — 02 tiene que investigar de verdad `photography`, `iconography` y
   `voice.rhythm` con Chrome real, o el Gate 8 fallará correctamente.

## Reglas duras (no negociables — las de siempre)

- Todo el HTML sale del motor. `npm run check-engine` antes de tocar `engine/`.
- Todo el branding de Nike vive en `brands/nike/tokens/brand-tokens.json` y en
  `06-data/campaign-data.json` de la campaña. `engine/components/` no lleva ni un hex ni un
  texto de Nike.
- `campaign-data.json` valida contra `engine/schema/campaign-data.schema.json` (ajv), forma
  SIEMPRE `{component, data}` por módulo.
- Nada de claims, cifras de rendimiento, o comparativas de producto sin confirmar — 29 reglas en
  `scripts/lib/claim-rules.ts` (ojo especialmente con reglas técnicas: "más rápido", "el mejor",
  cifras de rendimiento no verificadas encajan en varias de las 14 reglas de nivel alto).
- Colores, tipografía, logo, fotografía, iconografía y voz de Nike: verificados con Chrome real
  sobre nike.com (o la URL de producto de abajo), **nunca de memoria del modelo** — aunque Nike
  sea una marca muy conocida, la disciplina de este sistema es la misma que para cualquier otra:
  `agents/02-brand-visual-analyst.md` §"Investigación profunda de marca" es OBLIGATORIA, no
  opcional, y sus 5 dimensiones (color/tipografía, fotografía, iconografía, ritmo de voz, ritmo
  estructural de página) se investigan las 5, no solo las que resulten cómodas.

## Datos de partida (verificados por mí, no inventados)

- **Producto real y URL real de referencia**: Nike Pegasus 42, zapatilla de running de calzado
  diario, lanzamiento 9 de abril de 2026, verificado en vivo el 2026-07-24:
  `https://www.nike.com/t/pegasus-42-mens-road-running-shoes-S1bYkOza/IB1873-702` (versión
  mujer: `https://www.nike.com/t/pegasus-42-womens-road-running-shoes-VCB6baKU/IB1881-602`).
  Úsala como landing/URL de referencia para el anclaje de `hero-imagen` y para la investigación
  de 02 (fotografía, ritmo estructural de página).
- **Lo siguiente son sugerencias razonables mías para una campaña de prueba, NO hechos
  verificados — confírmalas o ajústalas con el usuario en la fase 01, igual que con cualquier
  brief real**:
  - Objetivo: dar a conocer el Pegasus 42 y dirigir tráfico a la ficha de producto.
  - CTA principal: "Comprar el Pegasus 42" → la URL de arriba.
  - Tono esperado (a confirmar, no asumir): seguro, directo, motivacional — típico de Nike, pero
    que sea 02 quien lo verifique observando copy real del sitio, no quien lo dé por sentado.
  - Nombre de campaña sugerido: `2026-jul-nike-pegasus-42`.
  - `metadata.isTestCampaign: true` — es una campaña de prueba del sistema, no un envío real.

## Hero con arte generado — ya integrado en el pipeline, úsalo

1. **02** navega la URL de producto de arriba (y la home de nike.com si hace falta contexto) con
   Chrome real, y deja en el brand pack: color/tipografía computados, `photography.treatment`,
   `iconography.style`/`componentImplication`, `voice.rhythm` (con 2-3 frases reales del sitio,
   no inventadas), y `layout.contentRhythm` (secciones reales de la página de producto, peso de
   fotografía vs. texto vs. iconos — ver `agents/02-brand-visual-analyst.md` §5).
2. **03** decide el patrón (ver arriba, pregunta 1) y si esta campaña usa `hero-imagen` — ver
   `agents/03-newsletter-architect.md` §"Elegir hero". Con una landing real confirmada y una
   marca que usa fotografía real de producto/atletas, es plausible que sí, pero que la decisión
   quede justificada en `module-selection.md`, no asumida.
3. **06**, al escribir `campaign-data.json`, ejecuta directamente:
   ```
   npm run generate-hero-image -- --brand nike --theme "{ángulo de campaña de 03}" \
     --campaign newsletters/2026/nike/{nombre-de-la-campaña} \
     --source landing --url https://www.nike.com/t/pegasus-42-mens-road-running-shoes-S1bYkOza/IB1873-702
   ```
   Requiere `OPENAI_API_KEY` en `.env` con facturación activa. Si falla por eso, repórtalo como
   bloqueo — no caigas en silencio a `hero-centrado` ni a un placeholder de relleno.
4. El PNG queda en `brands/nike/design-input/hero-banner.png`. Subirlo al CDN sigue siendo tarea
   del usuario — deja `bannerSrc` en placeholder explícito (`https://PENDING-CDN-UPLOAD/...`)
   hasta que se confirme la URL real, y dilo en `next-steps.md`.

## Proceso a seguir (igual que el resto de campañas del sistema)

1. Agente 00 dirige 01→09 leyendo cada `agents/NN-*.md` antes de ejecutarlo. Empieza por 01
   (briefing) confirmando con el usuario los datos de la sección "Datos de partida" de arriba.
2. 02: brand pack real de Nike, con Chrome, las 5 dimensiones completas (no solo las 3 de
   siempre) — este es el paso que el Gate 8 va a auditar sin margen.
3. 03: patrón + estructura + elección de hero, cada una con motivo trazable al brand pack.
4. 04: specs de diseño + variante de icono por módulo, con motivo en `assets-notes.md`.
5. 05: copy contrastado contra `voice.rhythm`, sin claims de rendimiento no confirmados.
6. 06: `campaign-data.json` + generación del arte del hero (ver arriba).
7. 07: build vía `node engine/build-newsletter.js --data newsletters/2026/nike/{campaña}/06-data/campaign-data.json --out newsletters/2026/nike/{campaña}/09-exports/`.
8. 08: QA completo, incluido `brand-fidelity-qa.md`.
9. 09: `npm run production-gate-motor -- --campaign newsletters/2026/nike/{campaña}` en verde
   (los 9 gates, incluido el nuevo `brand-pack-completeness`) antes de dar la campaña por
   completada.

## Lo que NO hacer

- No escribas HTML a mano en ningún momento.
- No asumas los colores/tono/voz de Nike de memoria "porque todo el mundo conoce Nike" — es
  exactamente el atajo que este sistema existe para prohibir. Verifica con Chrome real.
- No inventes cifras de rendimiento, comparativas con otros modelos, ni promociones/precios.
- No elijas el patrón ni la variante de icono "porque suena bien" — cada elección va con su
  motivo trazado a un campo concreto del brand pack, igual que exige `agents/03` y `agents/04`.
- No des la campaña por terminada si el Gate 8 (`brand-pack-completeness`) falla — es la prueba
  central de este test. Si falla, el brand pack de Nike tiene un hueco real que investigar, no
  un gate que ignorar.
