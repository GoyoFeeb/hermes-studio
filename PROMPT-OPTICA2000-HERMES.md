# PROMPT PARA HERMES — Campaña ÓPTICA 2000

> Copia todo lo que hay debajo de la línea como primer mensaje de una sesión nueva con Hermes.
> Este prompt ya viene con el análisis de marca hecho (Fase 1) y el plan (Fase 2) — Hermes
> puede ir directo a Fase 3 (implementación). Si quieres que Hermes vuelva a auditar la web por
> su cuenta antes de construir, dilo explícitamente al pegar este prompt.

---

Eres el Orchestrator de Hermes en `sistema-final/`. Antes de nada, lee `agents/00-orchestrator.md`
y `PROMPT-CONTEXTO-HERMES.md` (contexto vigente del sistema). Vas a crear una campaña **nueva**
para un cliente **nuevo**: ÓPTICA 2000 — usando el motor y el pipeline existentes, sin excepciones.

## Reglas duras (no negociables)

- Todo el HTML sale de `node engine/build-newsletter.js`. Nunca se escribe HTML a mano. Si lo
  necesitas y no existe, se añade AL MOTOR siguiendo el procedimiento de 5 pasos de
  `engine/README.md` — nunca un script de build propio de la campaña (ver `engine/CHANGELOG.md`,
  incidentes de 2026-07-21 y 2026-07-22 para lo que pasa cuando no se respeta esto).
- Antes de tocar `engine/`: `npm run check-engine`. Si el componente que necesitas no existe,
  créalo — no lo improvises fuera del motor.
- Todo el branding de Óptica 2000 vive en `brands/optica2000/tokens/brand-tokens.json` y en
  `06-data/campaign-data.json` de la campaña. `engine/components/` no lleva ni un hex, ni una
  URL, ni un texto de Óptica 2000 — son genéricos para cualquier marca (esto ya es así hoy, no
  hace falta "garantizarlo": ver cualquier componente existente, todos usan `{{token:...}}`).
- `campaign-data.json` valida contra `engine/schema/campaign-data.schema.json` (ajv). La forma
  es SIEMPRE `{component, data}` por módulo — nunca `{type, content}` (esa forma antigua causó
  el incidente de UAX del 2026-07-22, documentado en `engine/CHANGELOG.md`).
- Nada de claims sin verificar, cifras inventadas, ni promociones que no te haya dado el cliente
  — 29 reglas automáticas en `scripts/lib/claim-rules.ts` te bloquean el gate si se cuelan.

## Marca: ÓPTICA 2000 — análisis YA hecho (2026-07-22, con Chrome real sobre optica2000.com)

No hace falta repetir este análisis — está verificado con el navegador, no con memoria del
modelo. Si quieres que Hermes lo reconfirme por su cuenta, puede repetirlo con
`npm run capture-brand-site -- --brand optica2000 --url https://www.optica2000.com/`.

| Elemento | Valor observado | Fuente |
|---|---|---|
| Logo (negro) | `https://gv-brxm.imgix.net/binaries/_ht_1757335173491/content/gallery/es-optica2000/logos/logo_o2m-black.svg` | `<img>` del header, optica2000.com |
| Logo (blanco) | `https://gv-brxm.imgix.net/binaries/_ht_1750057563637/content/gallery/es-optica2000/logos/logo_o2m-01.svg` | footer, optica2000.com |
| Color primario (CTA header, "PIDE CITA") | `#2D2D2D` (negro cálido), texto `#F1F1F1` | computed style real |
| Acento secundario (CTA buscador, barra de promos) | `#526A6B` (verde-salvia apagado) — firma cromática distintiva de la marca | computed style real |
| Texto principal | `#2B2E31` (casi negro) | computed style del `<h1>` real |
| Fondo | `#FFFFFF` | `document.body` |
| Fuente de titulares (web) | Futura, bold | computed style — **no es segura en email, no se usa tal cual** |
| Fuente de cuerpo (web) | Roboto | computed style — **no es segura en email, no se usa tal cual** |
| CTA real del sitio | "Pide Cita" / "PIDE CITA" | header y buscador de centros |
| Razón social / dirección física real | Grandvisión Spain Grupo Óptico, S.A.U. — C/ Monforte de Lemos, 36, Local B-130-131, Centro, 28029 Madrid | footer legal del sitio |
| Redes | Instagram, Facebook, LinkedIn, YouTube (URLs reales en el footer) | footer del sitio |

**No copiado:** ninguna promoción real del sitio (10% newsletter, cupón 50€, 4x3 lentillas) —
no están verificadas para ESTA campaña ni el brief las pide.

## Brand pack a crear

`brands/optica2000/tokens/brand-tokens.json` v2.2.0 — misma estructura que
`brands/uax/tokens/brand-tokens.json` (usarlo de plantilla). Puntos concretos:

- `colors.primary` = `#2D2D2D`, `colors.deep` = `#2D2D2D` (banda de cierre en el mismo negro
  cálido del CTA principal del sitio real).
- `colors.light` / acento = `#526A6B` — verificar contraste antes de usarlo en texto pequeño
  (igual que se hizo con UAX: calcular luminancia relativa real contra blanco y contra
  `#2D2D2D`, no asumir que pasa).
- `colors.ctaBackground` = `#2D2D2D`, `colors.ctaText` = `#F1F1F1` o `#FFFFFF` (comprobar cuál
  de los dos da mejor ratio antes de fijarlo — no eran idénticos en el sitio real).
- `typography.family` = `Arial, Helvetica, sans-serif` (Futura/Roboto no son seguras en email,
  y el propio brief del cliente lo exige explícitamente).
- `assets.logo` = el SVG negro real de arriba — **ojo**: SVG está prohibido como imagen inline
  de email en este sistema (regla ya aplicada en tarifalo, ver `engine/CHANGELOG.md`). Pide al
  cliente una versión PNG del logo, o usa `hero-centrado` (marca como texto) mientras tanto —
  no inventes una conversión SVG→PNG sin el archivo real.
- `assets.headerPatternTile` = `""` (sin tile de marca confirmado, igual que tarifalo/UAX).
- Procedencia de cada valor: **observado** (verificado con Chrome hoy) — anótalo así en el
  `_changelog` del pack, igual que se hizo en `brands/uax/tokens/brand-tokens.json`.

## Estructura → patrón `institutional` (reutilizado, NO crear un patrón nuevo)

El patrón `patterns/institutional.md` (creado el 2026-07-22 para UAX) ya tiene la forma que
pide este brief: cabecera → hero → intro+CTA → beneficios → contenido intermedio → cierre →
footer. Reutilízalo. Mapeo módulo a módulo:

| Sección del brief | Componente | Estado |
|---|---|---|
| Header | `header-logo` | Existe, reutilizar tal cual |
| Hero (foto real + copy vivo) | `hero-imagen` | Existe, reutilizar tal cual — el brief exige explícitamente que el hero NO dependa de texto incrustado en imagen; `hero-imagen` ya es híbrido (arte/foto decorativa + copy en HTML) |
| Bloque de introducción | `intro-cta` | Existe, reutilizar tal cual |
| Bloque de beneficios (3, con icono real, sin promo) | `card-tarifa-3` | **Existe y reutiliza mejor que `columns-3-beneficios`**: ya usa iconos de imagen (no emoji) y NO tiene ningún campo de promo/highlight obligatorio — encaja sin construir nada nuevo. Cada tarjeta pide también `href`/`linkLabel`; enlázalas a la página de reserva o a la sección relevante |
| Situaciones cotidianas (3-4, iconografía real) | **variante nueva de `category-grid`** | `category-grid` ya soporta N ítems en filas de 3 (perfecto para esto), pero su icono hoy es un emoji de texto (`{{data:icon}}` como carácter) — el brief de Óptica 2000 prohíbe emojis y pide iconos gráficos reales. Construye `category-grid` con icono de imagen (`<img src="{{data:icon}}">` en vez de texto), siguiendo el procedimiento de 5 pasos. Nómbralo con claridad (ej. `category-grid` puede quedarse como está para marcas que sí quieran emoji — añade la variante de imagen como componente nuevo si el adaptador no puede servir a ambos con el mismo nombre) |
| Servicios (5 ítems, iconografía real) | La misma variante de imagen de `category-grid` | Reutilizar el componente del punto anterior — mismo patrón, dos usos en la secuencia (posiciones distintas del `PATTERN_SEQUENCE`, ver cómo `pattern.js` ya soporta esto) |
| Bloque de confianza (sin cifras) | **NO uses `usp-cards` tal cual** | `usp-cards` exige un campo `badge` obligatorio (insignia con cifra/reconocimiento) — el brief prohíbe inventar cifras y no hay ninguna verificada. Antes de construir nada, considera si el bloque de confianza puede resolverse con **texto simple dentro de `intro-cta` o de una franja del hero** en vez de un componente nuevo. Si de verdad hace falta un componente propio, constrúyelo sin campo de badge (mismo criterio que "no metas un campo opcional en un componente obligatorio" — ver cabecera de `columns-3-beneficios.html` para el razonamiento) |
| CTA final | `banda-cierre` | Existe, reutilizar tal cual |
| Footer | `footer` | Existe, reutilizar tal cual — esta vez SÍ hay dirección física real (ver tabla de arriba), no hace falta el placeholder `[DIRECCIÓN FÍSICA — pendiente del cliente]` que se usó en UAX |

Si necesitas actualizar `patterns/institutional.md` para incluir estas variantes en su
`PATTERN_SEQUENCE` (formato `N. component-name (required|optional)`, alternativas con `|`), es
edición de un patrón EXISTENTE que ya cubre este género — no es crear uno nuevo.

## Copy (del brief original, ya orientado a conversión — puedes pulirlo sin cambiar el enfoque)

- Preheader: "Reserva tu revisión visual y empieza a cuidar tu mirada."
- Eyebrow: "CUIDADO VISUAL"
- H1: "Vuelve a ver todo con claridad"
- Subtítulo/apoyo: "Tu vista cambia con el tiempo. Una revisión periódica puede ayudarte a
  disfrutar cada detalle con mayor comodidad."
- CTA principal: "Pide tu cita" (coincide con el CTA real del sitio, "Pide Cita")
- CTA secundarios (no compiten visualmente con el principal — usa `cta-bulletproof` solo para
  el principal; los secundarios como enlace de texto, no botón): "Revisa tu vista", "Encuentra
  tu centro", "Descubre nuestros servicios"
- Beneficios: "Atención profesional" / "Tecnología para tu visión" / "Un centro cerca de ti"
  (textos completos en el brief original del usuario — cópialos literalmente en
  `card-tarifa-3`)
- Cierre: "Hazle un hueco a tu salud visual" + "Reserva tu revisión y da hoy el primer paso
  para seguir disfrutando de todo lo que te rodea."

Tono: claro, cercano, tranquilizador, profesional — sin alarmismo, sin diagnósticos médicos,
sin urgencia artificial. El brief original tiene el detalle completo de qué evitar; síguelo.

## Assets — estrategia realista (el schema no admite placeholders de texto en campos de imagen)

A diferencia de campos de texto (`legalLine` sí admite `[DIRECCIÓN FÍSICA — pendiente]`),
`engine/schema/campaign-data.schema.json` exige que todo campo de imagen (`logoSrc`, `icon`,
`bannerSrc`...) sea una URL `https://` real — no acepta `{{placeholder}}` tipo plantilla. Antes
de poder construir y pasar los gates necesitas URLs reales:

- Logo: usa la URL real de arriba si el cliente no manda una propia (ojo con el aviso de SVG).
- Foto del hero e iconos: si el cliente aún no los ha dado, usa una URL de un servicio de
  placeholder real y accesible (ej. `https://placehold.co/...`) SOLO para poder construir y
  verificar el pipeline de principio a fin — nunca la des por buena para producción. Documenta
  cada una en `next-steps.md` con el tamaño/formato exacto que hace falta, y deja
  `metadata.productionReady: false` hasta que las reales estén puestas.
- No generes tú las imágenes (el brief del cliente lo prohíbe explícitamente) — ni con IA ni de
  ningún otro modo.

## Sobre "Doctor Sender" (del prompt original del cliente)

El sistema no tiene un exportador específico para esa plataforma, pero el HTML que ya produce
`engine/build-newsletter.js` cumple de fábrica casi todo lo que pide esa sección: sin JSX/React
(el pipeline de React Email está archivado, ver `_archive/f4-react-email-pipeline/`), sin
comentarios de organización en el HTML final (los comentarios de cabecera de cada componente se
descartan al renderizar), etiquetas balanceadas (verificado automáticamente en cada build),
UTF-8 garantizado (gate añadido el 2026-07-22 en `engine/lib/verify.js`). Antes de entregar,
que el agente 09 revise a mano específicamente: que no haya la secuencia `)-->` en el HTML y que
no haya nada antes del `<!DOCTYPE`. Si de verdad hace falta una exportación distinta para Doctor
Sender, es un hallazgo nuevo para `next-steps.md`, no se improvisa un segundo pipeline.

## Proceso a seguir (igual que el resto de campañas del sistema)

1. Agente 00 dirige 01→09 leyendo cada `agents/NN-*.md` antes de ejecutarlo.
2. Antes de tocar `engine/`: `npm run check-engine`.
3. Construye el brand pack, la campaña, y CUALQUIER componente nuevo (variante de imagen de
   `category-grid`) siguiendo el procedimiento de 5 pasos de `engine/README.md`.
4. Build: `node engine/build-newsletter.js --data newsletters/2026/optica2000/{campaña}/06-data/campaign-data.json --out newsletters/2026/optica2000/{campaña}/09-exports/`
5. Verifica: `npm run check-parity`, `npm run check-control-files`,
   `npm run production-gate-motor -- --campaign newsletters/2026/optica2000/{campaña}` (todos
   los gates encadenados, incluido el de equilibrio de columnas si usas algún bloque de 3
   columnas iguales).
6. `npm run check-engine -- --update` al final, si tocaste algo del motor — nunca antes de
   terminar de verificar que el cambio es correcto.
7. Entrega con los 4 archivos de control de la campaña + `delivery-notes.md`, listando
   explícitamente: qué assets faltan, qué claims necesitan validación del cliente, y qué
   warnings quedan abiertos (mismo formato que `newsletters/2026/uax/2026-jul-uax-fp-online/`).

## Lo que NO hacer

- No escribas HTML a mano en ningún momento.
- No inventes cifras, promociones, descuentos ni certificaciones no verificadas.
- No uses emojis como icono — el brief de Óptica 2000 los prohíbe explícitamente (a diferencia
  de UAX, donde sí se usaron).
- No copies colores/tipografía de memoria — todo lo de la tabla de arriba está verificado con
  Chrome real hoy; si algo cambia en optica2000.com, vuelve a verificarlo, no asumas.
- No des la campaña por terminada sin los gates en verde y sin dejar documentado en
  `next-steps.md` qué falta del lado del cliente (logo PNG, foto del hero, iconos, validación
  de copy).
