# PROMPT PARA HERMES — Campaña BMW

> Copia todo lo que hay debajo de la línea como primer mensaje de una sesión nueva con Hermes.
> A diferencia de `PROMPT-OPTICA2000-HERMES.md`, aquí NO hay análisis de marca previo verificado
> — la única "campaña BMW" que existe hoy es HTML escrito a mano con imágenes de relleno
> (`placehold.co`), fuera del pipeline. Este prompt existe para que la próxima sesión construya
> la campaña de verdad, desde cero, siguiendo el sistema real.

---

Eres el Orchestrator de Hermes en `sistema-final/`. Antes de nada, lee `agents/00-orchestrator.md`
y `PROMPT-CONTEXTO-HERMES.md` (contexto vigente del sistema). Vas a crear una campaña **nueva**
para un cliente **nuevo**: BMW — usando el motor y el pipeline existentes, sin excepciones.

## ⛔ Lo que pasó la última vez con BMW (léelo antes de nada)

El 2026-07-24 una sesión anterior generó `newsletters/2026/bmw/2026-jul-bmw-experience/` sin
pasar por ningún agente: dos archivos HTML escritos a mano (`bmw-newsletter.html`,
`bmw-newsletter-inline.html`), sin `00-brief/`, sin `campaign-data.json`, sin brand pack real, y
con TODAS las imágenes (incluido el hero) apuntando a `https://placehold.co/...` — relleno gris
con texto, no arte real. El concepto creativo ("Diseñado para emocionar"), los colores, y hasta
qué modelos de BMW aparecen fueron inventados por esa sesión sin verificar nada en bmw.es.

**Antes de construir nada nuevo:**
1. Mueve esa carpeta a cuarentena: `mkdir -p _archive/incidente-2026-07-24-bmw && git mv
   newsletters/2026/bmw/2026-jul-bmw-experience _archive/incidente-2026-07-24-bmw/` (o `mv` si no
   hay git en ese estado) — mismo tratamiento que el incidente de Tarífalo del 2026-07-21
   (`_archive/incidente-2026-07-21-tarifalo/`). No se reutiliza ni el copy ni los colores de ese
   HTML: no está verificado, es contenido inventado.
2. No repitas el error: **todo HTML sale de `node engine/build-newsletter.js`**. Si en algún
   punto sientes la tentación de "simplemente escribir el HTML porque el motor no tiene tal
   componente", para — añádelo al motor siguiendo el procedimiento de 5 pasos de
   `engine/README.md`, nunca un archivo aparte.

## Reglas duras (no negociables — las de siempre)

- Todo el HTML sale del motor. `npm run check-engine` antes de tocar `engine/`.
- Todo el branding de BMW vive en `brands/bmw/tokens/brand-tokens.json` (bórralo primero si el
  incidente anterior dejó algo ahí — verifica con `cat brands/bmw/tokens/brand-tokens.json`
  antes de asumir que está vacío o es reutilizable) y en `06-data/campaign-data.json` de la
  campaña. `engine/components/` no lleva ni un hex ni un texto de BMW.
- `campaign-data.json` valida contra `engine/schema/campaign-data.schema.json` (ajv), forma
  SIEMPRE `{component, data}` por módulo.
- Nada de claims, cifras, o modelos/precios de BMW sin confirmar — 29 reglas en
  `scripts/lib/claim-rules.ts`.
- Colores, tipografía y logo de BMW: verificados con Chrome real sobre bmw.es (o la URL que te
  dé el usuario), nunca de memoria del modelo — ver `agents/02-brand-visual-analyst.md`
  §"Investigación profunda de marca", que es OBLIGATORIA, no opcional.

## Antes de construir: pide el brief real al usuario

No inventes el concepto de campaña, el modelo de BMW, la audiencia, ni el CTA — eso es literalmente
la fase 01 del pipeline (`agents/01-briefing-strategist.md`). Como mínimo necesitas del usuario:

- Qué modelo o gama de BMW es el foco de esta campaña (Serie 1, X1, i4, genérico de marca...).
- Objetivo (venta, test drive, configurador, generación de leads...).
- **Una URL real de landing/página de producto en bmw.es a la que apunte el CTA principal** —
  imprescindible si quieres que 03 pueda elegir de verdad `hero-imagen` (ver más abajo); sin
  landing real confirmada, 03 elegirá `hero-centrado` por defecto, correctamente, no por fallo.
- Tono deseado (el HTML del incidente asumía "editorial, premium, aspiracional" — puede servir
  de referencia de estilo, pero confírmalo con el usuario, no lo des por bueno sin más).

## Hero con arte generado — ya integrado en el pipeline, úsalo

Esta es la primera campaña real que puede probar la integración de `hero-imagen` (ver
`engine/CHANGELOG.md`, entrada "`hero-imagen` integrado en el pipeline de agentes"):

1. **02** navega bmw.es (o la URL que dé el usuario) con Chrome real, y además de
   colores/tipografía deja `photography.treatment` en el brand pack — cómo trata BMW la
   fotografía de sus coches (planos, luz, composición) en su propio sitio.
2. **03** decide en `module-selection.md` si esta campaña usa `hero-imagen` — sí, si hay landing
   real confirmada y la marca usa fotografía real (casi seguro que sí, es BMW). Ver
   `agents/03-newsletter-architect.md` §"Elegir hero".
3. **06**, al escribir `campaign-data.json`, ejecuta directamente:
   ```
   npm run generate-hero-image -- --brand bmw --theme "{ángulo de campaña de 03}" \
     --campaign newsletters/2026/bmw/{nombre-de-la-campaña} \
     --source landing --url {cta.href real de esta campaña}
   ```
   Requiere `OPENAI_API_KEY` en `.env` con facturación activa y organización verificada (ver
   `.env.example`). Si falla por eso, repórtalo como bloqueo — no caigas en silencio a
   `hero-centrado` ni, mucho menos, a un placeholder de `placehold.co`.
4. El PNG queda en `brands/bmw/design-input/hero-banner.png`. Subirlo al CDN sigue siendo tarea
   del usuario — deja `bannerSrc` en placeholder explícito (`https://PENDING-CDN-UPLOAD/...`)
   hasta que te confirme la URL real, y dilo en `next-steps.md`.

## Proceso a seguir (igual que el resto de campañas del sistema)

1. Cuarentena del incidente anterior (ver arriba) — primer paso, antes de cualquier otra cosa.
2. Agente 00 dirige 01→09 leyendo cada `agents/NN-*.md` antes de ejecutarlo. Empieza por 01
   (briefing) preguntando al usuario lo que falta de la sección de arriba.
3. 02: brand pack real de BMW, con Chrome, incluidas `photography`/`iconography`/`voice.rhythm`
   (Nivel 3, obligatorio salvo válvula de escape documentada si el sitio no es accesible).
4. 03: patrón + estructura + elección de hero, con motivo.
5. 04/05: diseño y copy, sin inventar cifras/modelos/precios no confirmados.
6. 06: `campaign-data.json` + generación del arte del hero si aplica (ver arriba).
7. Build: `node engine/build-newsletter.js --data newsletters/2026/bmw/{campaña}/06-data/campaign-data.json --out newsletters/2026/bmw/{campaña}/09-exports/`
8. Verifica: `npm run check-parity`, `npm run check-control-files`,
   `npm run production-gate-motor -- --campaign newsletters/2026/bmw/{campaña}`.
9. Entrega con los 4 archivos de control + `next-steps.md` listando explícitamente: URL del CDN
   pendiente para el hero, cualquier dato de BMW sin confirmar, y warnings abiertos.

## Lo que NO hacer

- No escribas HTML a mano en ningún momento — es literalmente lo que salió mal la vez anterior.
- No reutilices el copy, los colores, ni la elección de modelos de BMW del incidente en
  cuarentena — nada de eso está verificado.
- No inventes cifras, precios, modelos disponibles, ni promociones de BMW.
- No elijas `hero-centrado` por defecto sin haber evaluado `hero-imagen` primero (ver
  `agents/03-newsletter-architect.md` §"Elegir hero") — y no uses `placehold.co` ni ningún otro
  servicio de relleno como si fuera el arte final.
- No des la campaña por terminada sin los gates en verde y sin dejar documentado en
  `next-steps.md` qué falta del lado del cliente/usuario.
