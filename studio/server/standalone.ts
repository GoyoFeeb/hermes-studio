/**
 * standalone.ts — modo "HTML standalone" de Hermes Studio, ejecutado por Hermes Agent.
 *
 * El compañero pega el prompt de dirección creativa que genera la skill
 * `newsletter-creative-brief`. El trabajo queda en cola aquí; un worker en el Mac del usuario
 * (studio/worker/hermes-worker.ts) lo recoge, lanza `hermes chat -q` con SU instalación (config,
 * skills, memoria, suscripción de Nous) dentro de sistema-final/ y devuelve el HTML.
 *
 * Por qué no una llamada directa al modelo (versión anterior, 2026-09-24 mañana): la calidad de
 * Hermes sale de su bucle de agente — ~100 acciones por newsletter (navegar la web real de la
 * marca, mirar capturas con visión, escribir, renderizar, mirar y corregir; 15-20 min). Una sola llamada a
 * gpt-5.5 producía piezas genéricas "de sistema primitivo" (feedback del usuario).
 *
 * Este módulo: compone el encargo para Hermes (prompt pegado + instrucciones de entrega) y, al
 * recibir el resultado, publica sus imágenes en /assets y guarda la newsletter.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ROOT, DATA_DIR } from './paths';
import { writeMirrored } from './mirror';
import { getJob, updateJob, appendEvent, listJobs, type Job, type JobArtReview, type JobTimings, type JobUsageStep } from './store';
import { toPublicAssetUrl } from './heroImage';
import type { QualityReport, QualityCheckItem } from '../worker/qualityCheck';
import { findPreheader, staticChecks } from '../worker/qualityCheck';
import { sanitizeImproveRecord, type JobImprove } from '../worker/improveLoop';
import { applyTextEdits, type TextEdit, type AltEdit, type LinkEdit, type ImageEdit } from './textEdit';
import { createJob } from './store';
import { joinLabels, requestTerms } from './requestCoverage';
import { CLAIMS_BRIEF_RULE, CLAIMS_PIECE_RULE } from '../worker/claims';
import { COPY_RULES } from '../worker/copyCheck';
import { forecastStart, runningRemainingSec, type QueueActor } from './queueEta';
import { workerCapacity } from './workerPool';
import { leaseExpired } from './claimQueue';
import { MOBILE_NOTES_TEMPLATE, NOTES_TEMPLATE, REVISION_NOTES_TEMPLATE, notesFileRule } from '../worker/selfAudit';
import { PATTERNS_GUIDE, catalogIndex } from '../hermes/catalog';

/** Gmail recorta los emails de más de ~102 KB de HTML ("Mensaje recortado"). */
const GMAIL_CLIP_BYTES = 102 * 1024;
const DATA_URI_RE = /data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)/g;

export function log(jobId: string, message: string, level: 'info' | 'error' | 'success' = 'info'): void {
  appendEvent(jobId, { phase: 'hermes', level, message });
}

/** Corto a propósito: Hermes copia esta ruta a mano y con nombres largos se equivoca (el
 *  2026-09-24 escribió "integradon" por "integracion" y dejó el HTML en otra carpeta). */
export function standaloneCampaignSlug(job: Job): string {
  return `${job.createdAt.slice(0, 10)}-${job.id.slice(-6)}`;
}

/** Carpeta de trabajo (relativa a sistema-final/) donde Hermes debe dejar la newsletter — la
 *  misma ruta en el Mac (salida de Hermes) y en Railway (copia publicada). */
export function standaloneOutputDir(job: Job): string {
  return path.join('newsletters', job.createdAt.slice(0, 4), job.input.clientSlug, 'hermes', standaloneCampaignSlug(job));
}

/** Norma del 2026-10-02: el logo del pie, si lo hay, es exactamente el de la cabecera. Studio lo comprueba
 *  (studio/worker/qualityCheck.ts, "Logo arriba y abajo") y devuelve la pieza si no coincide. */
const LOGO_RULE = [
  '- Logo arriba y abajo: el logo del pie es opcional, pero si lo pones tiene que ser EXACTAMENTE el de la',
  '  cabecera: el mismo archivo (misma versión de color) y el mismo tamaño (mismos width/height en atributos',
  '  y estilo). No lo encojas en el pie ni cambies a la versión blanca porque el pie sea oscuro: pon el logo',
  '  sobre un fondo donde se lea o déjalo fuera. Si en modo oscuro cambias a otra versión, cámbiala igual',
  '  arriba y abajo. Studio lo comprueba y te devolverá la pieza si no coinciden.',
];

/** Identidad, maquetación y mercado (2026-10-05). La de Siroko salió toda en Arial, con grises neutros, la misma
 *  estructura «imagen + titular + texto» repetida y el texto pegado a las fotos: el encargo solo pedía requisitos
 *  técnicos (Outlook, modo oscuro, móvil) y la regla de Outlook decía «tipografías con alternativa genérica (p. ej.
 *  Arial)», que Hermes cumplía poniendo Arial sin más. Studio comprueba fuentes y espacios al recibir la pieza
 *  (studio/worker/qualityCheck.ts y layoutProblems en hermes-worker.ts). */
export const DESIGN_RULES = [
  '- Identidad de marca OBLIGATORIA (la pieza tiene que reconocerse como de la marca sin ver el logo):',
  '  · Tipografía: la de la marca. Mira qué fuente usa su web oficial (estilos calculados de titulares y texto) o',
  '    su brand pack; cárgala con <link> o @import (Google Fonts u otra URL pública) y ponla primera en cada',
  '    font-family, con Arial/Helvetica solo DETRÁS como respaldo para Outlook. Si la fuente de la marca no se puede',
  '    cargar en un email, usa la alternativa web más parecida (dilo en notas.md). Nunca Arial como fuente principal',
  '    salvo que la marca use de verdad Arial o Helvetica (y entonces cítalo con su fuente en notas.md).',
  '  · Colores: los de la marca, medidos en su web oficial o en su brand pack (fondo, texto, acento, botones). Nada',
  '    de grises neutros genéricos (#111/#555/#f7f7f7) ni del rojo, azul o negro «de plantilla» si no son los suyos.',
  '    Anota en notas.md cada color con su origen.',
  '  · Si existe brands/{marca}/tokens/brand-tokens.json, sus colores, tipografía, tono y tratamiento de foto mandan.',
  '- Maquetación (Studio lo mide al recibir la pieza):',
  '  · Aire: nunca un texto pegado a una imagen. Entre una foto y el texto que la sigue o la precede, al menos 32 px',
  '    (padding de la celda, no solo margin del texto). Ritmo vertical coherente: mismos espacios entre bloques',
  '    equivalentes, en múltiplos de 8 (24, 32, 48, 64).',
  '  · Fondos: el EXTERIOR (body, alrededor de la pieza) y el de la PIEZA (el lienzo de 600 px) se distinguen a simple',
  '    vista en claro y en oscuro (p. ej. un neutro de la marca algo más oscuro alrededor de un lienzo blanco o de color):',
  '    si son iguales, las secciones se funden con la página. Studio lo mide.',
  '  · Sin franjas sueltas: la separación entre secciones va en el padding de cada sección, nunca en una fila separadora',
  '    con color propio; dos secciones de color distinto van pegadas. En oscuro, cada fondo (también el de las celdas de',
  '    foto) tiene su versión oscura: una celda blanca que se queda blanca es una franja. Studio las mide (4-28 px).',
  '  · Móvil: laterales de 20-24 px a 375 px (aplica de verdad la clase de la media query a cada celda con texto;',
  '    una clase definida y sin usar no cuenta). Botones alineados con el texto y con el mismo margen lateral.',
  '  · Estructura propia del concepto: al menos un módulo pensado para ESTA pieza (comparativa, rejilla, cita,',
  '    bloque a dos columnas, texto sobre color, secuencia numerada…), no solo «imagen a todo el ancho + titular +',
  '    texto» repetido. No copies la estructura de otras newsletters de newsletters/ ni de la raíz del repo: cada',
  '    pieza parte del concepto de su brief.',
  '- Mercado: la pieza es para España y en castellano. Precios en euros (€) y enlaces de la web española de la marca',
  '  (p. ej. /es/). Si solo encuentras el precio en otra moneda o en otra web, no lo pongas: anótalo como pendiente.',
];

/** Encargo completo para Hermes: el prompt pegado, tal cual, más las reglas de entrega. */
export function buildHermesPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  const images =
    job.input.imageMode === 'ai'
      ? 'Imágenes: GENÉRALAS CON IA con tu herramienta de generación de imágenes (hero, producto, ambiente). El logo, en cambio, SIEMPRE el oficial de la marca.'
      : 'Imágenes: SOLO fotografía oficial de la marca, sacada de su web oficial, newsroom o press kit. Si más abajo ' +
        'hay una «Ficha de producto y galería de campaña ya extraídas», sus fotos ya están descargadas: úsalas (la imagen ' +
        'principal, a todo el ancho tras el logo, de las ★). Si te falta alguna, ' +
        'fetch-image con su URL de origen. No generes imágenes con IA. Las fotos de ' +
        `brands/${job.input.clientSlug}/design-input/ pueden venir de campañas anteriores generadas con IA: ` +
        'úsalas solo si puedes confirmar que están publicadas en la web oficial.';
  return [
    job.input.briefText.trim(),
    '',
    '---',
    '## Instrucciones de entrega (Hermes Studio — ejecución automatizada)',
    '',
    `- Marca: ${job.input.clientName}${job.input.clientSlug ? ` (carpeta brands/${job.input.clientSlug}/ si existe)` : ''}.`,
    ...requestLines(job),
    `- ${images}`,
    '- Nadie va a responder preguntas durante esta ejecución: no uses clarify ni esperes confirmación.',
    '  Si falta un dato, no lo inventes: déjalo fuera de la pieza y anótalo como pendiente.',
    ...CLAIMS_PIECE_RULE,
    ...COPY_RULES,
    '- Texto e imagen (Q2, Studio lo revisa): elige la foto de cada escena ANTES de escribir su texto, y el titular y el',
    '  texto hablan de lo que se ve en ESA foto (producto, color, uso, personas). Si el brief pide para una escena algo que',
    '  ninguna foto muestra, cambia el texto; nunca lo afirmes sobre una foto que no lo enseña.',
    ...(job.input.instruction
      ? [
          '- Lo que el brief deja como pendiente NO se investiga aquí y NO entra en la pieza, salvo que la «Ficha de producto',
          '  ya extraída» de Studio (más abajo, si la hay) lo traiga. Esta fase maqueta; no vuelve a navegar la web.',
        ]
      : [
          // «Prompt completo» (2026-10-07, recuperado el 08-10): sin brief, nadie ha investigado; la línea de arriba hizo
          // que Prozis (07-10) y Nike (08-10) salieran sin datos ni fotos del producto.
          '- Este prompt no ha pasado por un brief: haz tú la investigación que pide (unas 12 búsquedas o páginas), con fuente',
          '  para cada dato y foto, y después maqueta. Lo que no verifiques no entra en la pieza.',
        ]),
    `- Entrega UN ÚNICO archivo HTML de email, final y listo para enviar, en: ${outDir}/newsletter.html`,
    `  Revísalo con \`npm run render-newsletter -- ${outDir}/newsletter.html\`: deja en _trabajo/render-hoja.jpg la pieza a`,
    '  600 px, a 375 px y en oscuro en una sola imagen. Mírala con vision_analyze (una vez por revisión) y corrige. No',
    '  escribas tus propios scripts de captura ni levantes servidores.',
    `- Base técnica: copia studio/hermes/email-base.html a ${outDir}/newsletter.html y diseña DENTRO (Studio adjunta su`,
    '  contenido completo y el de los módulos al final de este encargo: no los leas del disco). Trae resuelto lo',
    '  técnico (tabla fantasma y 96 ppp de Outlook, modo oscuro declarado, preheader, media query de móvil con .px/.stack/',
    '  .fluid, enlace de baja). Módulos técnicos de ejemplo (foto + texto, dos columnas, botón VML) en',
    '  studio/hermes/email-modulos.md. La base NO decide el diseño: tipografía, colores, módulos y ritmo salen del brief',
    '  y de la marca. Rellena todos los [MARCADORES] y no quites lo técnico.',
    '- Módulos: los del catálogo de Studio que nombra el brief van al final de este encargo (HTML probado en Outlook y',
    '  modo oscuro); el resto, en studio/hermes/catalogo.md y studio/hermes/modulos/<id>.html. Reutiliza su estructura y',
    '  adapta textos, colores, tipografía e imágenes a la marca. Un módulo propio del concepto también vale.',
    '- Imágenes en ese HTML: SIEMPRE descargadas en la carpeta del trabajo y enlazadas con ruta local (relativa al HTML).',
    `  Descárgalas con \`npm run fetch-image -- <url> ${outDir} [nombre]\`: funciona aunque la web bloquee el enlace`,
    '  directo (403), convierte un SVG a PNG al doble de tamaño y comprime a 1200 px. Nunca URLs de la web o del CDN de',
    '  la marca en el HTML. Studio las publica al recibir la newsletter.',
    '- Logo OBLIGATORIO arriba del todo: el oficial de la marca, en PNG, en la carpeta del trabajo, con alt con el nombre',
    '  de la marca (si Studio ya lo midió, está en brands/<marca>/design-input/logo-medido.png). Si no consigues el logo',
    '  oficial, dilo como pendiente en notas.md; no lo sustituyas por texto.',
    '- Si una imagen no se ve en tu propio render (rota, en blanco, 403), la pieza NO está terminada: descárgala de',
    '  otra forma o cámbiala por otra oficial. No la des por buena como «problema de red».',
    '- Preheader OBLIGATORIO (el bloque oculto ya está en la base): una frase que complemente al asunto (<title>).',
    '- Enlaces: solo URL oficiales que ya tienes (brief, ficha de producto); nunca inventes una. No las abras con el',
    '  navegador para comprobarlas: check-newsletter comprueba que todas respondan.',
    '- Modo oscuro OBLIGATORIO: define en el @media (prefers-color-scheme: dark) de la base los fondos, textos y CTA en',
    '  oscuro coherentes con la marca (si el logo es oscuro, una versión clara o un fondo que lo haga legible).',
    '  La hoja de render-newsletter lo incluye: nada blanco sobre blanco ni negro sobre negro.',
    '- Outlook de escritorio OBLIGATORIO: maqueta con tablas (nada de flex/grid), atributo width en cada <img>, fondos',
    '  con imagen con alternativa VML y la tipografía de la marca con un respaldo genérico DETRÁS (p. ej. \'Fuente de',
    '  marca\', Arial, sans-serif).',
    '- Footer: el enlace de baja (href="{{unsubscribe_url}}", ya en la base) es obligatorio; añade el aviso legal de la',
    '  marca si procede.',
    ...LOGO_RULE,
    ...DESIGN_RULES,
    `- Scripts y archivos auxiliares (conversiones, comprobaciones, capturas): en ${outDir}/_trabajo/`,
    '  o en /tmp. Nunca en scripts/, en la raíz del repo ni en brands/ (ahí solo logos e imágenes de marca).',
    '- Móvil OBLIGATORIO a 375 px (iPhone, incluido en la hoja de render-newsletter). Nada puede salirse del ancho ni',
    '  quedar cortado; usa las clases de la base (.px en cada celda con texto, .stack en columnas, .fluid en imágenes).',
    `- Comprobación OBLIGATORIA antes de terminar: \`npm run check-newsletter -- ${outDir}/newsletter.html\`. Es la misma`,
    '  que hace Studio al recibir la pieza (móvil, espacios, contraste, letra, estructura, enlaces, imágenes, tipografía,',
    '  logo, Outlook, modo oscuro, marcadores): aplica sola los arreglos mecánicos y te dice el resto. Corrige y repítela',
    '  hasta que salga sin errores. Si sale limpia, Studio no te devolverá la pieza.',
    ...notesFileRule(outDir, NOTES_TEMPLATE),
    '- Respuesta final: breve — concepto y lo que quede pendiente. La autoauditoría va en el archivo, no solo en esta respuesta.',
  ].join('\n');
}

/** La petición del equipo en el encargo (Paredes, 2026-10-05: pedía pre-Black Friday y la pieza no lo nombraba).
 *  Studio comprueba en la pieza la ocasión y la oferta (requestCoverage.ts). */
function requestLines(job: Job): string[] {
  const request = job.input.instruction?.trim();
  if (!request) return [];
  const terms = requestTerms(request).filter((t) => t.kind !== 'audience');
  return [
    `- Petición original del equipo: «${request}». La pieza la cumple; si el brief se apartó de ella, manda la petición.`,
    ...(terms.length
      ? [`  OBLIGATORIO en el texto visible de la pieza (Studio lo comprueba): ${joinLabels(terms)}, nombrado tal cual (asunto, titular o una escena).`]
      : []),
  ];
}

/** El brief está pendiente: el trabajo llegó como instrucción básica y Hermes aún no lo ha escrito. */
export function needsBrief(job: Job): boolean {
  return !!job.input.instruction && !job.input.briefText.trim();
}

/** Brief creativo propio de Studio (2026-10-05, auditoría de agentes). Antes se cargaba la skill
 *  newsletter-creative-brief, que en el Mac ha crecido a ~100 KB por archivo (bucles de skill_view, contexto enorme en
 *  cada llamada) y que en destino standalone omite la identidad de marca, así que el encargo tenía que contradecirla.
 *  Aquí va su método condensado —un solo concepto, escenas con función narrativa, patrones prohibidos y
 *  autoauditoría— con secciones fijas (la newsletter las encuentra siempre en el mismo sitio) y un tope de extensión:
 *  el brief se pega entero en el encargo de la newsletter y cada palabra se paga en cada llamada al modelo. */
export const BRIEF_MAX_WORDS = 1200;

export function buildBriefPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  const slug = job.input.clientSlug || '{marca}';
  const images =
    job.input.imageMode === 'ai'
      ? 'Las imágenes de la pieza se generarán con IA (el logo, siempre el oficial): describe en la sección 6 qué debe mostrar cada una.'
      : 'Solo fotografía oficial de la marca, de su web oficial (nada generado con IA): en la sección 6, la página oficial donde está cada imagen (no hace falta la URL del archivo).';
  const mustCover = requestTerms(job.input.instruction || '');
  return [
    `Escribe el brief de dirección creativa de una newsletter de ${job.input.clientName}. NO cargues skills: el método está aquí.`,
    '',
    `Petición del equipo: «${job.input.instruction!.trim()}»`,
    `Marca: ${job.input.clientName} (carpeta brands/${slug}/ si existe).`,
    ...(mustCover.length
      ? [`Lo que la petición pide y el brief tiene que recoger (Studio lo comprueba): ${joinLabels(mustCover)}.`]
      : []),
    '',
    '## La petición manda',
    '- Cada cosa que pide (ocasión de compra como Black Friday o Navidad, oferta, público, producto) llega al brief.',
    '  Corrige las erratas obvias de la petición (p. ej. «black frisay» es Black Friday).',
    '- Si nombra una ocasión, es el eje de la pieza: el concepto, el asunto y al menos una escena la nombran tal cual.',
    '- Si nombra un público, el concepto, el tono y las escenas se escriben para él (dilo en la sección 1).',
    '',
    // Paredes (2026-10-05): concepto «el negro» para una zapatilla gris, marrón y roja, y escenas con personas que
    // la web no tenía. Con imágenes de IA no aplica: se describen las que harán falta.
    ...(job.input.imageMode === 'ai'
      ? []
      : [
          '## Primero mira las fotos, después el concepto',
          '- Antes de elegir el concepto, abre la página oficial del producto con el navegador y MIRA sus fotos (captura +',
          '  visión): qué colores tiene de verdad, si hay personas o ambiente o solo producto sobre fondo liso.',
          '- El concepto y las escenas se construyen con lo que muestran esas fotos. Nunca un concepto sobre un atributo que',
          '  las fotos no enseñan: el nombre comercial del color (p. ej. «Negro») puede no ser lo que se ve.',
          '- No pidas fotos que no has visto en la web oficial (personas, calle, ambiente): si solo hay producto, diseña escenas',
          '  que funcionen con producto.',
          '',
        ]),
    '## Decisiones ya tomadas (no preguntes)',
    '- Nadie va a responder preguntas: no uses clarify. Si falta el producto o la campaña concreta, elige la opción más',
    '  razonable para la marca ahora mismo (lanzamiento o campaña vigente en su web oficial española) y dilo en el brief.',
    '- Mercado: España y castellano. Precios en euros y páginas de la web española de la marca.',
    `- Imágenes: ${images}`,
    '- Presupuesto: el brief se escribe en unos 12 minutos y unas 60 acciones EN TOTAL (búsquedas, páginas y navegador',
    '  cuentan igual). No busques la URL de cada imagen ni el precio en el texto: cita la URL EXACTA de la ficha de cada',
    '  producto (no la home) y Studio saca de ella el precio, el envío y las fotos antes de maquetar.',
    '- Resolver o quitar: lo que no verifiques va a «Fuera de la pieza» y nadie lo investigará después. No escribas',
    '  escenas ni copy que dependan de un dato sin verificar (salvo el precio o el envío de una ficha citada).',
    '- Investigación: unas 12 búsquedas o páginas, solo para el CONTENIDO: el producto, la página de la campaña vigente',
    '  y, si la hay, una newsletter o landing reciente de la marca para el tono (no para copiarla). La',
    '  identidad visual: si más abajo hay una sección «Identidad de la marca ya medida» o existe',
    `  brands/${slug}/tokens/brand-tokens.json, úsala tal cual y no la vuelvas a medir; si no, mídela en la web oficial`,
    '  (estilos calculados de titulares, texto y botones; colores de fondo, texto y acento).',
    '',
    ...PATTERNS_GUIDE,
    '- Catálogo de módulos de Studio (HTML de email probado en Outlook, Gmail y modo oscuro; la newsletter recibe el de',
    '  los que nombres en la sección 5):',
    ...catalogIndex(),
    '',
    '## Método (no lo copies en el brief: aplícalo)',
    '- Un solo concepto rector, escrito como frase. Todo titular deriva de él; nada compite con él.',
    '- La escena 1 abre con una imagen principal a todo el ancho (una foto que la sostenga sola: horizontal y grande).',
    '- 3 a 5 escenas, cada una con una función narrativa distinta (apertura de impacto, revelación de una capacidad',
    '  contada como experiencia, pausa o detalle diferenciador, cierre). Si dos escenas cumplen la misma función, fusiónalas.',
    '- Al menos una escena con un módulo propio del concepto (comparativa, rejilla, cita, dos columnas, dato sobre color de',
    '  marca, secuencia…), no solo «foto a todo el ancho + titular + texto».',
    '- Copy: máximo 40 palabras por bloque; cada dato técnico dentro de una frase con verbo, contado como experiencia.',
    '- Los titulares hablan al cliente: nada de códigos de color (#25282a), referencias internas ni jerga de diseño.',
    ...COPY_RULES,
    '- Si verificas el precio y la pieza es para vender (ocasión de compra, oferta, lanzamiento), el precio sale en una escena.',
    CLAIMS_BRIEF_RULE,
    '',
    `## Entregable: ${outDir}/brief.md (write_file), con EXACTAMENTE estas secciones y como mucho ${BRIEF_MAX_WORDS} palabras`,
    `# Brief — ${job.input.clientName} — <producto o campaña>`,
    '## 1. Concepto — la frase rectora, por qué encaja con la marca y el producto, cómo recoge cada punto de la',
    '   petición (ocasión, oferta, público) y el patrón elegido (oferta y precio, institucional o fotografía primero) (3-4 líneas).',
    '## 2. Identidad de marca — tipografía de titulares y de texto (nombre exacto, de dónde sale y cómo cargarla en un',
    '   email: Google Fonts o la alternativa web más parecida), paleta (hex de fondo, texto, acento y botón, con su',
    '   origen), estilo de botón, tono de voz y tratamiento de foto. Logo: ruta del PNG si ya existe o URL oficial.',
    '## 3. Datos verificados — cada precio, cifra, nombre de modelo o dato técnico con su URL oficial, y la URL exacta',
    '   de la ficha de cada producto. Lo no verificado va en «Fuera de la pieza»: NO entra y no se investigará después.',
    '   Si la petición pide una oferta (descuento, rebajas, Black Friday…), la primera línea es «Oferta: …» con el descuento',
    '   (%), el precio antes → ahora, las fechas y las condiciones, con su URL; o «Oferta: sin cifra verificada». Studio',
    '   exige en la pieza la cifra que pongas aquí.',
    '## 4. Asunto y preheader — asunto (≤ 50 caracteres) y preheader (≤ 90) que lo complemente.',
    '## 5. Escenas — una por escena: función narrativa, imagen (la foto concreta de «6. Imágenes» y lo que se ve en ella),',
    '   titular y texto (≤ 40 palabras) escritos sobre lo que muestra ESA foto, módulo (el id del catálogo',
    '   entre comillas invertidas, p. ej. `editorial-foto-texto`, o «propio: …» si ninguno sirve),',
    '   CTA (si lleva; cada CTA con un texto distinto) y el aire con la anterior.',
    job.input.imageMode === 'ai'
      ? '## 6. Imágenes — lista: para qué escena, qué debe mostrar (descripción para generarla) y encuadre.'
      : '## 6. Imágenes — solo las que has VISTO: para qué escena, qué muestran de verdad (colores, fondo, personas sí/no),\n' +
        '   la URL completa de la página oficial donde están (Studio descarga de ellas la galería de la campaña) y encuadre.\n' +
        '   La primera, la imagen principal.',
    '## 7. Prohibido en esta pieza — siempre: ficha de datos sueltos sin verbo; rejilla de 3 columnas icono + título +',
    '   párrafo; la misma composición imagen/texto repetida; el mismo texto de CTA dos veces; texto duplicado; marcadores',
    '   sin rellenar; el nombre de la marca en texto con CSS en lugar del logo oficial; Arial como fuente principal;',
    '   grises o colores «de plantilla» que no son de la marca. Añade los vicios propios de esta categoría si los hay.',
    '## 8. Autoauditoría — las preguntas que la pieza debe responder con «no» antes de entregarse: ¿dos frases compiten',
    '   por ser el titular? ¿algún bloque de números sin verbo? ¿CTA repetido? ¿texto duplicado? ¿marcadores? ¿más de 5',
    '   escenas o la misma composición 3 veces? ¿logo reconstruido con texto? ¿fuente o colores que no son de la marca?',
    '   ¿falta algo de la petición? ¿algún texto describe algo que las fotos no muestran?',
    '',
    '- NO generes la newsletter ni ningún HTML: solo el brief. La newsletter se hace en otro paso.',
    '- Respuesta final: una línea con el concepto elegido.',
  ].join('\n');
}

/** HTML publicado de un trabajo terminado (con las imágenes ya en URLs https de /assets). */
export function readResultHtml(job: Job): string | null {
  if (job.status !== 'completed' || !job.resultRelPath) return null;
  try {
    return fs.readFileSync(path.join(ROOT, job.resultRelPath), 'utf8');
  } catch {
    return null;
  }
}

/** Encargo de "Adaptar a móvil": el worker deja el HTML original en `_trabajo/original.html`
 *  (fuera de la carpeta raíz para que no cuente como entrega) y Hermes escribe la versión adaptada.
 *  Las newsletters hechas antes de la comprobación móvil (Adidas, Inglesina…) eran tablas fijas de
 *  600 px sin ninguna media query: rehacerlas costaba 20 min; esto, unos minutos. */
export function buildMobileFixPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  return [
    `Adapta a móvil la newsletter de ${job.input.clientName} que está en ${outDir}/_trabajo/original.html.`,
    'Es una pieza ya aprobada: NO la rediseñes, NO cambies textos, imágenes, colores ni orden, NO investigues',
    'la marca ni cargues skills. La versión de escritorio (600 px) debe quedar idéntica.',
    '',
    '## Qué hacer',
    '- Añade (o corrige) un bloque <style> con @media only screen and (max-width: 620px) y clases en el HTML:',
    '  contenedor principal al 100 %; imágenes con width:100% !important y height:auto !important;',
    '  columnas apiladas (display:block; width:100%); paddings laterales de ~20 px; titulares más pequeños',
    '  que puedan partir línea; botones que no se salgan (ancho automático o 100 %).',
    '- Sustituye anchos fijos que impidan encoger (width="600" en tablas contenedoras → width="100%" con',
    '  max-width:600px, o la clase de la media query). Mantén los atributos width de las imágenes para Outlook.',
    '- Mantén las URLs de las imágenes tal cual (ya están publicadas).',
    '',
    '## Entrega',
    `- Guarda el resultado en ${outDir}/newsletter.html (write_file). Scripts y capturas en ${outDir}/_trabajo/.`,
    '- Renderízalo a 375 px y a 600 px y míralo: a 375 px nada puede salirse del ancho ni quedar cortado, y a',
    '  600 px debe verse igual que el original.',
    `- Antes de terminar: \`npm run check-newsletter -- ${outDir}/newsletter.html --retoque\` (lo mismo que mide Studio al`,
    '  recibirlo). Corrige lo que diga del móvil y repítelo hasta que salga sin errores de móvil.',
    ...notesFileRule(outDir, MOBILE_NOTES_TEMPLATE),
    '- Nadie va a responder preguntas: no uses clarify. Respuesta final: una línea.',
  ].join('\n');
}

/** Encargo de "Pedir cambios": el worker deja en `_trabajo/` el HTML publicado (original.html) y la
 *  autoauditoría de esa versión (notas-original.md, con las fuentes de cada dato). Sesión nueva y no
 *  la original: con 70+ acciones acumuladas, retomarla con DeepSeek es lento y caro, y lo necesario
 *  (pieza, fuentes y brief) ya está aquí. */
export function buildRevisionPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  const images =
    job.input.imageMode === 'ai'
      ? 'Si el cambio pide una imagen nueva, puedes generarla con IA (el logo, siempre el oficial).'
      : 'Si el cambio pide una imagen nueva, solo fotografía oficial de la web de la marca, con su URL de origen.';
  return [
    `Aplica cambios a la newsletter de ${job.input.clientName} que está en ${outDir}/_trabajo/original.html.`,
    `Su autoauditoría (fuente de cada dato y origen de cada imagen) está en ${outDir}/_trabajo/notas-original.md.`,
    '',
    '## Cambios pedidos por el equipo',
    job.input.changeRequest!.trim(),
    '',
    '## Cómo',
    '- Aplica SOLO lo pedido. Mantén el resto igual: diseño, estructura, textos, imágenes y enlaces que no',
    '  afecte el cambio. No rehagas la pieza ni cambies el concepto salvo que se pida.',
    '- Si el cambio necesita un dato nuevo (precio, cifra, nombre de modelo), sácalo de la web oficial y',
    '  anota la fuente; si no lo encuentras, no lo inventes: deja la pieza como estaba en ese punto y dilo.',
    `- ${images}`,
    '- No cargues skills ni investigues la marca más allá de lo que pida el cambio.',
    ...(/\[Señalado:/.test(job.input.changeRequest || '')
      ? [
          '- Las referencias «[Señalado: …]» las ha marcado el equipo haciendo clic sobre la pieza: dicen qué',
          '  elemento es exactamente. Las imágenes van numeradas por orden de aparición de las <img> en el HTML',
          '  (logo incluido); los textos se citan tal cual aparecen. Aplica cada petición a ese elemento.',
        ]
      : []),
    '- Si cambias el logo (archivo, versión o tamaño), cámbialo igual arriba y abajo: el del pie, si lo hay,',
    '  tiene que ser exactamente el de la cabecera. Si la pieza ya los tiene distintos (otro archivo o más',
    '  pequeño en el pie), iguala el del pie al de la cabecera aunque no se haya pedido: es una norma de Studio.',
    '- Si un cambio pedido contradice una regla de la pieza (claims, datos sin fuente, enlace de baja),',
    '  no lo apliques en esa parte y explícalo en las notas.',
    '',
    '## Entrega',
    `- Guarda el resultado en ${outDir}/newsletter.html (write_file). Scripts y capturas en ${outDir}/_trabajo/.`,
    '- Un render a 600 y a 375 px para comprobar el cambio basta: no rehagas capturas de toda la pieza ni revises lo',
    '  que no has tocado.',
    `- Antes de terminar: \`npm run check-newsletter -- ${outDir}/newsletter.html --retoque\` (lo mismo que mide Studio`,
    '  al recibirlo: móvil, enlaces, imágenes, preheader…). Corrige lo que hayas introducido tú y repítelo.',
    `- Imagen nueva: \`npm run fetch-image -- <url> ${outDir} [nombre]\` (la descarga aunque la web bloquee el enlace`,
    '  directo, convierte SVG a PNG y comprime); enlázala con ruta local.',
    ...notesFileRule(outDir, REVISION_NOTES_TEMPLATE),
    '- Nadie va a responder preguntas: no uses clarify. Respuesta final: una línea.',
    '',
    '## Referencia: brief original de la pieza',
    job.input.briefText.trim(),
  ].join('\n');
}

/** El prompt tiene que hablar de la marca elegida: el 2026-09-24 se envió un prompt de Prozis con
 *  la marca Adeslas seleccionada (el navegador había rellenado el formulario) y Hermes recibió
 *  "usa solo assets de Adeslas" para una campaña de Prozis. */
export function promptMentionsBrand(prompt: string, clientName: string, clientSlug: string): boolean {
  const norm = (t: string): string =>
    t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const text = ` ${norm(prompt)} `;
  return [clientName, clientSlug.replace(/-/g, ' ')].map(norm).some((n) => n.length > 1 && text.includes(` ${n} `));
}

/** Con el worker enviando progreso cada 30 s, 10 min sin señales = trabajo perdido (Mac apagado o
 *  dormido, worker cerrado). Antes eran 4 h y solo se comprobaba cuando el worker pedía trabajo:
 *  con el Mac apagado, la página se quedaba en "running" indefinidamente. */
export const HERMES_STALE_MS = 10 * 60 * 1000;

export function sweepStaleHermesJobs(): void {
  const now = Date.now();
  for (const j of listJobs()) {
    if (j.input.mode !== 'standalone' || j.status !== 'running') continue;
    const leaseDead = leaseExpired(j.lease?.until, now);
    const stale = now - Date.parse(j.updatedAt) > HERMES_STALE_MS;
    if (!leaseDead && !stale) continue;
    const error = leaseDead
      ? 'El worker dejó de renovar este trabajo (el arrendamiento caducó). Vuelve a enviarlo.'
      : 'Hermes dejó de responder (¿Mac apagado, dormido o worker cerrado?). Vuelve a enviarlo.';
    log(j.id, error, 'error');
    updateJob(j.id, { status: 'failed', error });
  }
}

// Marcas que existen en el Mac del worker (donde trabaja Hermes). El desplegable mostraba las del
// volumen de Railway, que no incluyen lo que Hermes descarga en el Mac (p. ej. brands/prozis).
const WORKER_BRANDS_FILE = path.join(DATA_DIR, 'worker-brands.json');
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

export function saveWorkerBrands(brands: unknown): void {
  if (!Array.isArray(brands)) return;
  const clean = [...new Set(brands.filter((b): b is string => typeof b === 'string' && SLUG_RE.test(b)))].slice(0, 1000).sort();
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(WORKER_BRANDS_FILE, JSON.stringify(clean));
  } catch {
    // no crítico: el desplegable seguirá con las marcas de Railway
  }
}

export function readWorkerBrands(): string[] {
  try {
    return JSON.parse(fs.readFileSync(WORKER_BRANDS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/** Avisos no bloqueantes: se muestran en el progreso para que el compañero los revise. */
export function checkEmailHtml(html: string): string[] {
  const warnings: string[] = [];
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes > GMAIL_CLIP_BYTES) warnings.push(`Pesa ${Math.round(bytes / 1024)} KB: Gmail lo recortará (límite ~102 KB).`);
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const badSrc = imgs.filter((t) => !/\bsrc\s*=\s*["']https:\/\//i.test(t));
  if (badSrc.length) warnings.push(`${badSrc.length} imagen(es) sin src https absoluto — no se verán en el correo.`);
  const noAlt = imgs.filter((t) => !/\balt\s*=/i.test(t));
  if (noAlt.length) warnings.push(`${noAlt.length} imagen(es) sin atributo alt.`);
  if (!/unsubscribe|darse de baja|baja/i.test(html)) warnings.push('No se ve enlace de baja.');
  return warnings;
}

/** Las imágenes llegan incrustadas en base64 (el worker convierte así las rutas locales del Mac).
 *  Los clientes de correo como Gmail no muestran imágenes data:, así que cada una se guarda en
 *  brands/{marca}/design-input/hermes/{campaña}/ y se sustituye por su URL pública en /assets. */
export function publishEmbeddedImages(html: string, job: Job): { html: string; count: number } {
  const relDir = path.join('brands', job.input.clientSlug, 'design-input', 'hermes', standaloneCampaignSlug(job));
  const byHash = new Map<string, string>();
  const out = html.replace(DATA_URI_RE, (_m, type: string, b64: string) => {
    const buf = Buffer.from(b64, 'base64');
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
    let url = byHash.get(hash);
    if (!url) {
      const ext = type === 'svg+xml' ? 'svg' : type === 'jpeg' ? 'jpg' : type;
      const rel = path.join(relDir, `img-${hash}.${ext}`);
      fs.mkdirSync(path.join(ROOT, relDir), { recursive: true });
      writeMirrored(path.join(ROOT, rel), buf);
      url = toPublicAssetUrl(rel);
      byHash.set(hash, url);
    }
    return url;
  });
  return { html: out, count: byHash.size };
}

/** El informe llega del worker por la red: se guarda solo lo que tiene la forma esperada, acotado. */
export function sanitizeQuality(raw: unknown): QualityReport | undefined {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as QualityReport).checks)) return undefined;
  const statuses = ['ok', 'warning', 'error'];
  const checks: QualityCheckItem[] = (raw as QualityReport).checks
    .filter((c) => c && typeof c === 'object' && statuses.includes(c.status))
    .slice(0, 20)
    .map((c) => {
      const details = (Array.isArray(c.details) ? c.details : []).slice(0, 30).map((d) => String(d).slice(0, 600));
      return {
        id: String(c.id || '').slice(0, 40),
        label: String(c.label || '').slice(0, 80),
        status: c.status,
        details,
        errorCount: Math.max(0, Math.min(details.length, Number(c.errorCount) || 0)),
      };
    });
  return {
    checkedAt: String((raw as QualityReport).checkedAt || new Date().toISOString()).slice(0, 40),
    errors: checks.filter((c) => c.status === 'error').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
    checks,
  };
}

/** Tiempos por fase que manda el worker (timeline.ts): llegan por la red, se guarda solo lo que tiene forma. */
export function sanitizeTimings(raw: unknown): JobTimings | undefined {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as JobTimings).phases)) return undefined;
  const r = raw as JobTimings;
  const n = (v: unknown, max = 86400): number => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  return {
    phases: r.phases.slice(0, 20).map((p) => ({
      id: String(p?.id || '').slice(0, 20),
      label: String(p?.label || '').slice(0, 60),
      sec: n(p?.sec),
      ...(p && Number.isFinite(Number(p.actions)) ? { actions: n(p.actions, 10000) } : {}),
      // Desglose de la primera versión (2026-10-15): investigación, escritura y autorrevisión.
      ...(Array.isArray(p?.parts) && p.parts.length
        ? { parts: p.parts.slice(0, 3).map((x) => ({ id: String(x?.id || '').slice(0, 20), label: String(x?.label || '').slice(0, 40), sec: n(x?.sec) })) }
        : {}),
    })),
    hangs: { count: n(r.hangs?.count, 100), sec: n(r.hangs?.sec) },
    rounds: n(r.rounds, 20),
    totalSec: n(r.totalSec),
  };
}

const COST_MODEL_RE = /^[A-Za-z0-9._:@/+-]{1,160}$/;
const COST_PROVIDER_RE = /^[\w.:/+-]{1,80}$/;

function costPick(raw: Record<string, unknown>, camel: string, snake: string): unknown {
  return raw[camel] !== undefined ? raw[camel] : raw[snake];
}

function costTokens(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(1e15, Math.round(n));
}

function costMoney(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1e6) / 1e6;
}

const USAGE_STEP_ID = /^[a-z0-9][a-z0-9-]{0,48}$/;

function sanitizeUsageSteps(raw: unknown): JobUsageStep[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: JobUsageStep[] = [];
  for (const item of raw.slice(0, 48)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    if (!USAGE_STEP_ID.test(id)) continue;
    const labelRaw = typeof row.label === 'string' && row.label.trim() ? row.label.trim() : id;
    const modelRaw = typeof row.model === 'string' ? row.model.trim() : '';
    const providerRaw = typeof row.provider === 'string' ? row.provider.trim() : '';
    const inputTokens = costTokens(row.inputTokens ?? row.input_tokens) || 0;
    const outputTokens = costTokens(row.outputTokens ?? row.output_tokens) || 0;
    const cacheReadTokens = costTokens(row.cacheReadTokens ?? row.cache_read_tokens) || 0;
    const cacheWriteTokens = costTokens(row.cacheWriteTokens ?? row.cache_write_tokens) || 0;
    const cacheTokens = costTokens(row.cacheTokens ?? row.cache_tokens) ?? cacheReadTokens + cacheWriteTokens;
    const durationSec = Math.min(7 * 24 * 3600, costTokens(row.durationSec ?? row.duration_sec) || 0);
    if (inputTokens + outputTokens + cacheTokens + durationSec <= 0) continue;
    out.push({
      id,
      label: labelRaw.slice(0, 80),
      model: modelRaw && COST_MODEL_RE.test(modelRaw) ? modelRaw : null,
      provider: providerRaw && COST_PROVIDER_RE.test(providerRaw) ? providerRaw : null,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      cacheTokens,
      costUsd: costMoney(row.costUsd ?? row.cost_usd),
      costEur: costMoney(row.costEur ?? row.cost_eur),
      durationSec,
    });
  }
  return out;
}

export type JobUsagePatch = Pick<
  Job,
  | 'inputTokens'
  | 'outputTokens'
  | 'cacheTokens'
  | 'cacheReadTokens'
  | 'cacheWriteTokens'
  | 'costUsd'
  | 'costEur'
  | 'model'
  | 'provider'
  | 'usageSteps'
>;

/** Tokens y coste que manda el worker. Undefined si el cuerpo no trae ninguno (worker anterior). */
export function sanitizeJobCost(raw: unknown): JobUsagePatch | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const keys: [string, string][] = [
    ['inputTokens', 'input_tokens'],
    ['outputTokens', 'output_tokens'],
    ['cacheTokens', 'cache_tokens'],
    ['cacheReadTokens', 'cache_read_tokens'],
    ['cacheWriteTokens', 'cache_write_tokens'],
    ['costUsd', 'cost_usd'],
    ['costEur', 'cost_eur'],
    ['model', 'model'],
    ['provider', 'provider'],
    ['usageSteps', 'usage_steps'],
  ];
  if (!keys.some(([camel, snake]) => r[camel] !== undefined || r[snake] !== undefined)) return undefined;
  const modelRaw = costPick(r, 'model', 'model');
  const providerRaw = costPick(r, 'provider', 'provider');
  const model = typeof modelRaw === 'string' && COST_MODEL_RE.test(modelRaw.trim()) ? modelRaw.trim() : null;
  const provider = typeof providerRaw === 'string' && COST_PROVIDER_RE.test(providerRaw.trim()) ? providerRaw.trim() : null;
  const steps = sanitizeUsageSteps(r.usageSteps !== undefined ? r.usageSteps : r.usage_steps);
  return {
    inputTokens: costTokens(costPick(r, 'inputTokens', 'input_tokens')),
    outputTokens: costTokens(costPick(r, 'outputTokens', 'output_tokens')),
    cacheTokens: costTokens(costPick(r, 'cacheTokens', 'cache_tokens')),
    cacheReadTokens: costTokens(costPick(r, 'cacheReadTokens', 'cache_read_tokens')),
    cacheWriteTokens: costTokens(costPick(r, 'cacheWriteTokens', 'cache_write_tokens')),
    costUsd: costMoney(costPick(r, 'costUsd', 'cost_usd')),
    costEur: costMoney(costPick(r, 'costEur', 'cost_eur')),
    model,
    provider,
    ...(steps ? { usageSteps: steps } : {}),
  };
}

function usageSignal(part: { inputTokens?: number | null; outputTokens?: number | null; cacheTokens?: number | null; cacheReadTokens?: number | null; cacheWriteTokens?: number | null; usageSteps?: JobUsageStep[] }): boolean {
  const flat = (part.inputTokens || 0) + (part.outputTokens || 0) + (part.cacheTokens || 0) + (part.cacheReadTokens || 0) + (part.cacheWriteTokens || 0);
  if (flat > 0) return true;
  return (part.usageSteps || []).some((step) => step.inputTokens + step.outputTokens + step.cacheTokens > 0);
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function stepKey(step: JobUsageStep): string {
  return `${step.id}\0${step.model || ''}\0${step.provider || ''}`;
}

/** Totales planos de un trabajo antiguo, como un paso, para no perderlos al sumar otro. */
function stepsAlreadyOn(job: Job): JobUsageStep[] {
  if (job.usageSteps?.length) return job.usageSteps.map((step) => ({ ...step }));
  const used = (job.inputTokens || 0) + (job.outputTokens || 0) + (job.cacheTokens || 0);
  if (!used) return [];
  return [
    {
      id: 'previo',
      label: 'Uso anterior',
      model: job.model ?? null,
      provider: job.provider ?? null,
      inputTokens: job.inputTokens || 0,
      outputTokens: job.outputTokens || 0,
      cacheReadTokens: job.cacheReadTokens || 0,
      cacheWriteTokens: job.cacheWriteTokens || 0,
      cacheTokens: job.cacheTokens || 0,
      costUsd: job.costUsd ?? null,
      costEur: job.costEur ?? null,
      durationSec: 0,
    },
  ];
}

function totalsFromSteps(steps: JobUsageStep[]): Pick<Job, 'inputTokens' | 'outputTokens' | 'cacheTokens' | 'cacheReadTokens' | 'cacheWriteTokens' | 'costUsd' | 'costEur' | 'usageSteps'> {
  let input = 0;
  let output = 0;
  let cache = 0;
  let read = 0;
  let write = 0;
  let usd = 0;
  let eur = 0;
  let priced = true;
  let any = false;
  for (const step of steps) {
    input += step.inputTokens;
    output += step.outputTokens;
    cache += step.cacheTokens;
    read += step.cacheReadTokens;
    write += step.cacheWriteTokens;
    const used = step.inputTokens + step.outputTokens + step.cacheTokens;
    if (!used) continue;
    any = true;
    if (step.costUsd == null || step.costEur == null) priced = false;
    else {
      usd += step.costUsd;
      eur += step.costEur;
    }
  }
  return {
    inputTokens: input,
    outputTokens: output,
    cacheReadTokens: read,
    cacheWriteTokens: write,
    cacheTokens: cache,
    costUsd: !any ? 0 : priced ? round6(usd) : null,
    costEur: !any ? 0 : priced ? round6(eur) : null,
    usageSteps: steps,
  };
}

/**
 * `replace`: el libro del worker ya trae el total del trabajo (incluido lo sembrado).
 * Un cuerpo a cero no borra tokens que ya estaban (el export de la sesión a veces llega vacío).
 * `merge`: suma pasos nuevos (nota hecha después, versión B) y recalcula los totales.
 */
export function usagePatch(job: Job, raw: unknown, mode: 'replace' | 'merge'): Partial<Job> | undefined {
  const incoming = sanitizeJobCost(raw);
  if (!incoming || !usageSignal(incoming)) return undefined;
  if (mode === 'replace') return incoming;
  if (!incoming.usageSteps?.length) return usageSignal(job) ? undefined : incoming;
  const merged = new Map<string, JobUsageStep>();
  for (const step of stepsAlreadyOn(job)) merged.set(stepKey(step), step);
  for (const step of incoming.usageSteps) merged.set(stepKey(step), step);
  return {
    ...totalsFromSteps([...merged.values()]),
    model: job.model || incoming.model || null,
    provider: job.provider || incoming.provider || null,
  };
}

/** Fila de la vista Costes. Incluye archivados: el listado no recorta el historial. */
export function costJobSummary(job: Job): {
  id: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: Job['status'];
  clientName: string;
  clientSlug: string;
  requester: string | null;
  durationSec: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheTokens: number | null;
  costUsd: number | null;
  costEur: number | null;
  model: string | null;
  provider: string | null;
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
} {
  return {
    id: job.id,
    createdAt: job.createdAt,
    startedAt: job.startedAt || null,
    finishedAt: job.finishedAt || null,
    status: job.status,
    clientName: job.input.clientName,
    clientSlug: job.input.clientSlug,
    requester: job.input.requesterName || null,
    durationSec: durationSec(job),
    inputTokens: job.inputTokens ?? null,
    outputTokens: job.outputTokens ?? null,
    cacheTokens: job.cacheTokens ?? null,
    cacheReadTokens: job.cacheReadTokens ?? null,
    cacheWriteTokens: job.cacheWriteTokens ?? null,
    costUsd: job.costUsd ?? null,
    costEur: job.costEur ?? null,
    model: job.model ?? null,
    provider: job.provider ?? null,
  };
}

/** `?fields=cost` (también si llega repetido). El historial normal no lo pide. */
export function wantsCostFields(fields: unknown): boolean {
  if (fields === 'cost') return true;
  return Array.isArray(fields) && fields.includes('cost');
}

/** Lo ya gastado, para que el siguiente proceso del mismo trabajo no lo pierda. */
export function priorUsageOf(job: Job): {
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  model: string | null;
  provider: string | null;
  steps?: JobUsageStep[];
} | undefined {
  const inputTokens = job.inputTokens || 0;
  const outputTokens = job.outputTokens || 0;
  const cacheTokens = job.cacheTokens || 0;
  const steps = job.usageSteps?.filter((step) => step.inputTokens + step.outputTokens + step.cacheTokens > 0);
  if (inputTokens + outputTokens + cacheTokens <= 0 && !steps?.length) return undefined;
  return {
    inputTokens,
    outputTokens,
    cacheTokens,
    cacheReadTokens: job.cacheReadTokens || 0,
    cacheWriteTokens: job.cacheWriteTokens || 0,
    model: job.model ?? null,
    provider: job.provider ?? null,
    ...(steps?.length ? { steps } : {}),
  };
}

/** Revisión de dirección de arte que manda el worker: notas 1-5 por criterio y listas de texto cortas. */
export function sanitizeArtReview(raw: unknown): JobArtReview | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const notes = (v: unknown): Record<string, number> | undefined => {
    if (!v || typeof v !== 'object') return undefined;
    const out: Record<string, number> = {};
    for (const [k, n] of Object.entries(v as Record<string, unknown>).slice(0, 20)) {
      const num = Number(n);
      if (/^[a-z_]{2,20}$/.test(k) && num >= 1 && num <= 5) out[k] = Math.round(num);
    }
    return Object.keys(out).length ? out : undefined;
  };
  const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 10).map((x) => x.slice(0, 400)) : []);
  const before = notes(r.before);
  if (!before) return undefined;
  const after = notes(r.after);
  return {
    before,
    ...(after ? { after } : {}),
    ...(typeof r.kept === 'boolean' ? { kept: r.kept } : {}),
    web: r.web === true,
    problemas: list(r.problemas),
    mejoras: list(r.mejoras),
    ...(r.backfill === true ? { backfill: true } : {}),
  };
}

/** Registro de iteraciones de mejora que manda el worker. */
export function sanitizeImprove(raw: unknown): JobImprove | undefined {
  return sanitizeImproveRecord(raw);
}

/** Piezas terminadas de los últimos `days` días sin notas de calidad (2026-10-06): el worker, libre, las puntúa con la
 *  revisión de dirección de arte (sin corregirlas) para que el historial y las fichas de marca arranquen con datos. */
export function pendingArtReviews(limit: number, days = 7): { id: string; outputDir: string; slug: string; request: string; prompt: string; html: string }[] {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  return listJobs()
    .filter((j) => j.input.mode === 'standalone' && j.status === 'completed' && !j.artReview && !j.artReviewFailed && j.createdAt >= since)
    .slice(0, limit)
    .flatMap((j) => {
      const html = readResultHtml(j);
      return html
        ? [{ id: j.id, outputDir: standaloneOutputDir(j), slug: j.input.clientSlug || '', request: j.input.instruction || '', prompt: (j.input.briefText || '').slice(0, 8000), html }]
        : [];
    });
}

/** Asunto (el <title> del HTML: es donde Hermes lo deja) y preheader de una newsletter terminada,
 *  para copiarlos a la plataforma de envío sin abrir el archivo (2026-09-28). */
export function resultMeta(job: Job): { subject: string | null; preheader: string | null } | null {
  const html = readResultHtml(job);
  if (!html) return null;
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const subject = title
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { subject: subject || null, preheader: findPreheader(html) };
}

export type JobKind = 'instruction' | 'brief' | 'revision' | 'mobile-fix';

export function jobKind(job: Job): JobKind | null {
  if (job.input.textEditOf) return null; // sin Hermes: no cuenta para las duraciones
  if (job.input.mobileFixOf) return 'mobile-fix';
  if (job.input.revisionOf) return 'revision';
  // Un reintento con el brief ya escrito tarda como uno de prompt completo, no como uno desde instrucción.
  return job.input.instruction && !job.input.briefReused ? 'instruction' : 'brief';
}

/** Duración real de un trabajo terminado: de que Hermes lo recoge a que termina. Los anteriores al
 *  2026-09-28 no guardan esas horas: se usa el último tiempo que mandó el worker con el progreso.
 *  Con brief a revisar, la espera de la aprobación (`briefWaitSec`) no cuenta (2026-10-05). */
export function durationSec(job: Job): number | null {
  if (job.startedAt && job.finishedAt)
    return Math.max(1, Math.round((Date.parse(job.finishedAt) - Date.parse(job.startedAt)) / 1000) - (job.briefWaitSec || 0));
  return job.status === 'completed' && job.progress?.elapsedSec ? job.progress.elapsedSec : null;
}

/** Valores por defecto mientras no hay al menos 2 trabajos terminados de ese tipo. */
const DEFAULT_SECONDS: Record<JobKind, number> = { instruction: 25 * 60, brief: 20 * 60, revision: 8 * 60, 'mobile-fix': 6 * 60 };
const TYPICAL_SAMPLE = 10;

/** Lo que suele tardar cada tipo (2026-09-28): la mediana de los últimos 10 terminados de ese tipo. */
export function typicalDurations(): Record<JobKind, { sec: number; n: number }> {
  const byKind: Record<JobKind, number[]> = { instruction: [], brief: [], revision: [], 'mobile-fix': [] };
  const done = listJobs() // más recientes primero
    .filter((j) => j.input.mode === 'standalone' && j.status === 'completed');
  for (const j of done) {
    const kind = jobKind(j);
    const sec = durationSec(j);
    if (kind && sec && byKind[kind].length < TYPICAL_SAMPLE) byKind[kind].push(sec);
  }
  const out = {} as Record<JobKind, { sec: number; n: number }>;
  for (const kind of Object.keys(byKind) as JobKind[]) {
    const list = byKind[kind].sort((a, b) => a - b);
    out[kind] = list.length >= 2 ? { sec: list[Math.floor(list.length / 2)], n: list.length } : { sec: DEFAULT_SECONDS[kind], n: 0 };
  }
  return out;
}

export function typicalSeconds(job: Job): number {
  const kind = jobKind(job);
  return kind ? typicalDurations()[kind].sec : 0;
}

function queueActors(): QueueActor[] {
  const durations = typicalDurations();
  const now = Date.now();
  const out: QueueActor[] = [];
  for (const j of listJobs()) {
    if (j.input.mode !== 'standalone') continue;
    const kind = jobKind(j);
    const typical = kind ? durations[kind].sec : 0;
    if (j.status === 'running') {
      const elapsed = j.startedAt
        ? Math.max(0, (now - Date.parse(j.startedAt)) / 1000 - (j.briefWaitSec || 0))
        : (j.progress?.elapsedSec ?? 0);
      out.push({
        id: j.id,
        status: 'running',
        createdAt: j.createdAt,
        sec: runningRemainingSec(typical, elapsed, j.progress?.etaSec),
      });
    } else if (j.status === 'queued') {
      out.push({ id: j.id, status: 'queued', createdAt: j.createdAt, sec: typical });
    }
  }
  return out;
}

/** Cuánto falta para que haya un hueco para un trabajo nuevo (o para los creados antes de `before`).
 *  La capacidad es la que anuncian los workers; sin avisos, STUDIO_WORKER_SLOTS (defecto 2). */
export function queueWait(before?: string): { ahead: number; seconds: number } {
  const actors = queueActors().filter((a) => a.status === 'running' || !before || a.createdAt < before);
  const synthetic: QueueActor = {
    id: '__wait__',
    status: 'queued',
    createdAt: before || '9999-01-01T00:00:00.000Z',
    sec: 0,
  };
  const forecast = forecastStart([...actors, synthetic], '__wait__', workerCapacity());
  return { ahead: forecast?.ahead ?? 0, seconds: forecast?.startsInSec ?? 0 };
}

/** Posición en la cola de un trabajo standalone en espera y cuándo empezará. */
export function queueInfo(job: Job): { ahead: number; startsInSec: number; runningAhead: number; queuedAhead: number; message: string } | null {
  if (job.status !== 'queued' || job.input.mode !== 'standalone') return null;
  const forecast = forecastStart(queueActors(), job.id, workerCapacity());
  if (!forecast) return null;
  return {
    ahead: forecast.ahead,
    startsInSec: forecast.startsInSec,
    runningAhead: forecast.runningAhead,
    queuedAhead: forecast.queuedAhead,
    message: forecast.message,
  };
}

export interface JobVersion {
  id: string;
  number: number;
  createdAt: string;
  status: Job['status'];
  kind: 'original' | 'revision' | 'mobile-fix' | 'text-edit' | 'retry';
  parentId: string | null;
  changeRequest: string | null;
  approved: boolean;
  /** Tiene el enlace del cliente activo (2026-10-01): para ofrecer pasarlo a otra versión. */
  shared: boolean;
}

function parentIdOf(job: Job): string | null {
  return job.input.revisionOf || job.input.mobileFixOf || job.input.textEditOf || job.input.retryOf || null;
}

/** Todas las versiones de una newsletter (2026-09-28): la original y los "Pedir cambios" y "Adaptar
 *  a móvil" que cuelgan de ella, directa o indirectamente, numeradas por orden de creación. */
export function versionFamily(job: Job): JobVersion[] {
  const all = listJobs().filter((j) => j.input.mode === 'standalone');
  const byId = new Map(all.map((j) => [j.id, j]));
  const rootOf = (j: Job): string => {
    let cur = j;
    for (let i = 0; i < 50; i++) {
      const parent = parentIdOf(cur);
      const next = parent ? byId.get(parent) : undefined;
      if (!next) return cur.id;
      cur = next;
    }
    return cur.id;
  };
  const root = rootOf(job);
  return all
    .filter((j) => rootOf(j) === root)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((j, i) => ({
      id: j.id,
      number: i + 1,
      createdAt: j.createdAt,
      status: j.status,
      kind: j.input.revisionOf ? 'revision' : j.input.mobileFixOf ? 'mobile-fix' : j.input.textEditOf ? 'text-edit' : j.input.retryOf ? 'retry' : 'original',
      parentId: parentIdOf(j),
      changeRequest: j.input.changeRequest ? j.input.changeRequest.slice(0, 300) : null,
      approved: !!j.approvedAt,
      shared: !!j.share && Date.parse(j.share.expiresAt) > Date.now(),
    }));
}

/** Asunto de una versión terminada para el historial (2026-10-01). El HTML publicado no cambia: se guarda por
 *  ruta y solo se lee del disco la primera vez (el historial pide la lista entera cada pocos segundos). */
const subjectCache = new Map<string, string | null>();
export function cachedSubject(job: Job): string | null {
  if (job.status !== 'completed' || !job.resultRelPath) return null;
  if (!subjectCache.has(job.resultRelPath)) subjectCache.set(job.resultRelPath, resultMeta(job)?.subject || null);
  return subjectCache.get(job.resultRelPath) ?? null;
}

/** Pone (o quita, con texto vacío) el nombre de la newsletter: va a la versión raíz de su familia. */
export function renameFamily(job: Job, title: string): Job {
  const root = getJob(versionFamily(job)[0]?.id || job.id) || job;
  const clean = title.replace(/\s+/g, ' ').trim().slice(0, 120);
  return updateJob(root.id, { title: clean || undefined });
}

/** Autoauditoría de Hermes (notas.md) de un trabajo terminado, para el panel de revisión. */
export function readResultNotes(job: Job): string | null {
  if (job.status !== 'completed' || !job.campaignRelPath) return null;
  try {
    return fs.readFileSync(path.join(ROOT, job.campaignRelPath, 'notas.md'), 'utf8').slice(0, 60000);
  } catch {
    return null;
  }
}

const THUMB_MAX_BYTES = 400 * 1024;
const THUMB_LONG_MAX_BYTES = 1500 * 1024;

/** Guarda la miniatura (base64 de un JPEG que envía el worker) junto a la newsletter. Solo se acepta
 *  un JPEG de verdad y de tamaño razonable: llega por la red y se sirve después como imagen. */
export function saveThumbnail(job: Job, b64: unknown): { thumbRelPath: string; thumbW?: number } | null {
  if (typeof b64 !== 'string' || !job.campaignRelPath) return null;
  const buf = Buffer.from(b64, 'base64');
  const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (!isJpeg || buf.length > THUMB_MAX_BYTES) return null;
  const rel = path.join(job.campaignRelPath, 'thumb.jpg');
  writeMirrored(path.join(ROOT, rel), buf);
  const thumbW = jpegSize(buf)?.width;
  return { thumbRelPath: rel, ...(thumbW ? { thumbW } : {}) };
}

/** Guarda la tira larga (ver worker/thumbnail.ts). Devuelve siempre `thumbLongH`: 0 si no llegó ninguna válida
 *  (pieza corta), para que no se le vuelva a pedir al worker. */
export function saveThumbnailLong(job: Job, b64: unknown): { thumbLongRelPath?: string; thumbLongH: number } {
  if (typeof b64 !== 'string' || !job.campaignRelPath) return { thumbLongH: 0 };
  const buf = Buffer.from(b64, 'base64');
  const size = jpegSize(buf);
  if (!size || size.width !== THUMB_HD_WIDTH || buf.length > THUMB_LONG_MAX_BYTES) return { thumbLongH: 0 };
  const rel = path.join(job.campaignRelPath, 'thumb-long.jpg');
  writeMirrored(path.join(ROOT, rel), buf);
  return { thumbLongRelPath: rel, thumbLongH: size.height };
}

/** Ancho de las miniaturas desde el 2026-10-13 (ver worker/thumbnail.ts). Las guardadas con menos se regeneran. */
export const THUMB_HD_WIDTH = 600;

/** Medidas de un JPEG leyendo su cabecera (el marcador SOF), sin decodificar la imagen. */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/** Newsletters terminadas sin miniatura (anteriores a esta función): el worker las genera cuando está
 *  libre, de pocas en pocas, a partir del HTML publicado. Con `hd` (un worker que ya las saca a 600 px)
 *  entran también las guardadas a 300 × 400; a un worker antiguo no se le piden, porque las devolvería
 *  igual y se le volverían a pedir sin fin. Lo mismo con `long` y las que no tienen tira larga. */
export function pendingThumbnails(limit: number, can: { hd?: boolean; long?: boolean } = {}): { id: string; html: string }[] {
  return listJobs()
    .filter((j) => j.input.mode === 'standalone' && j.status === 'completed' && !j.thumbFailed)
    .filter((j) => !j.thumbRelPath || (can.hd && (j.thumbW ?? 0) < THUMB_HD_WIDTH) || (can.long && j.thumbLongH === undefined))
    .slice(0, limit)
    .flatMap((j) => {
      const html = readResultHtml(j);
      return html ? [{ id: j.id, html }] : [];
    });
}

export function completeStandaloneJob(jobId: string, rawHtml: string, finalMessage: string, quality?: QualityReport, thumbnail?: string, timings?: JobTimings, thumbnailLong?: unknown): void {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} no encontrado`);
  const outRel = standaloneOutputDir(job);
  const outAbs = path.join(ROOT, outRel);
  fs.mkdirSync(outAbs, { recursive: true });

  const { html, count } = publishEmbeddedImages(rawHtml, job);
  if (count) log(jobId, `${count} imagen(es) publicada(s) en /assets.`, 'success');

  writeMirrored(path.join(outAbs, 'prompt.md'), job.input.briefText, 'utf8');
  if (job.input.instruction) writeMirrored(path.join(outAbs, 'instruccion.md'), job.input.instruction.trim() + '\n', 'utf8');
  if (job.input.changeRequest) writeMirrored(path.join(outAbs, 'cambios.md'), job.input.changeRequest.trim() + '\n', 'utf8');
  writeMirrored(path.join(outAbs, 'newsletter.html'), html, 'utf8');
  if (finalMessage.trim()) writeMirrored(path.join(outAbs, 'notas.md'), finalMessage.trim() + '\n', 'utf8');

  for (const w of checkEmailHtml(html)) log(jobId, `Aviso: ${w}`, 'error');
  if (finalMessage.trim()) log(jobId, `Nota de Hermes: ${finalMessage.trim().slice(0, 1500)}`);

  updateJob(jobId, {
    status: 'completed',
    currentPhase: null,
    finishedAt: new Date().toISOString(),
    progress: job.progress ? { ...job.progress, pct: 100, stage: 'terminado', stageLabel: 'Terminada', detail: '', etaSec: 0 } : undefined,
    campaignRelPath: outRel,
    resultRelPath: path.join(outRel, 'newsletter.html'),
    ...(quality ? { quality } : {}),
    ...(timings ? { timings } : {}),
  });
  // Después de marcarla terminada: saveThumbnail necesita campaignRelPath. Si falla, el historial
  // muestra las iniciales de la marca; no es motivo para perder la newsletter.
  const done = getJob(jobId);
  const thumb = done && thumbnail ? saveThumbnail(done, thumbnail) : null;
  if (thumb) updateJob(jobId, thumb);
  // `undefined` es un worker que aún no manda tira larga: se le pedirá cuando se actualice.
  if (done && thumb && thumbnailLong !== undefined) updateJob(jobId, saveThumbnailLong(done, thumbnailLong));
  log(jobId, 'Newsletter lista.', 'success');
}

/**
 * "Editar texto" (2026-09-28): versión nueva hecha en Studio, sin Hermes. Aplica los retoques sobre el HTML
 * publicado del trabajo de origen (textEdit.ts) y la deja terminada en el acto, con su revisión automática:
 * las comprobaciones sin red se repiten sobre el HTML nuevo; enlaces, imágenes y móvil se heredan de la
 * versión de origen (editar el texto no cambia URLs; el móvil se midió con el mismo diseño).
 * Todo síncrono: el worker no puede recoger el trabajo entre que se crea y se marca terminado.
 */
export function createTextEditVersion(
  source: Job,
  edits: TextEdit[],
  subject: string | null,
  requesterName?: string,
  alts: AltEdit[] = [],
  links: LinkEdit[] = [],
  imageEdits: ImageEdit[] = []
): Job {
  const html = readResultHtml(source);
  if (!html) throw new Error('La newsletter de origen no está disponible.');
  const applied = applyTextEdits(html, edits, subject, alts, links, imageEdits);
  const { changes, outlookCopies } = applied;
  let out = applied.html;
  if (!changes.length) throw new TextEditNoChanges('No hay cambios que guardar.');

  const clip = (t: string): string => (t.length > 160 ? `${t.slice(0, 159)}…` : t);
  const summary = changes.map((c) => `«${clip(c.before)}» → «${clip(c.after)}»`).join('\n');
  const job = createJob({
    mode: 'standalone',
    clientSlug: source.input.clientSlug,
    clientName: source.input.clientName,
    brandMode: source.input.brandMode,
    briefText: source.input.briefText,
    imageMode: source.input.imageMode,
    requesterName: requesterName || source.input.requesterName,
    textEditOf: source.id,
    changeRequest: summary.slice(0, 4000),
  });

  // Imágenes subidas en Studio (2026-10-01): se publican en /assets como las de Hermes, con URL absoluta.
  if (imageEdits.some((e) => e.after.trim().startsWith('data:'))) out = publishEmbeddedImages(out, job).html;
  const outRel = standaloneOutputDir(job);
  const outAbs = path.join(ROOT, outRel);
  fs.mkdirSync(outAbs, { recursive: true });
  writeMirrored(path.join(outAbs, 'newsletter.html'), out, 'utf8');
  writeMirrored(path.join(outAbs, 'prompt.md'), job.input.briefText, 'utf8');
  writeMirrored(path.join(outAbs, 'cambios.md'), summary + '\n', 'utf8');
  const who = job.input.requesterName ? ` por ${job.input.requesterName}` : '';
  const notes = [
    (readResultNotes(source) || '').trim(),
    `## Retoque en Studio (${new Date().toISOString().slice(0, 16).replace('T', ' ')}${who}, sin Hermes)`,
    ...changes.map((c) => `- «${c.before}» → «${c.after}»`),
    '',
    links.length || imageEdits.length
      ? 'Cambiaron textos, enlaces o imágenes; el diseño es el de la versión anterior. Los datos nuevos no tienen fuente anotada.'
      : 'Solo cambió el texto: diseño, imágenes y enlaces son los de la versión anterior. Los datos nuevos que',
    links.length || imageEdits.length ? '' : 'se hayan escrito aquí no tienen fuente anotada.',
  ]
    .filter((l, i) => i > 0 || l)
    .join('\n');
  writeMirrored(path.join(outAbs, 'notas.md'), notes + '\n', 'utf8');

  const carried = (source.quality?.checks || []).filter((c) => c.id === 'links' || c.id === 'images' || c.id === 'mobile');
  const checks = [...carried.filter((c) => c.id !== 'mobile'), ...staticChecks(out), ...carried.filter((c) => c.id === 'mobile')];
  const quality: QualityReport = {
    checkedAt: new Date().toISOString(),
    errors: checks.filter((c) => c.status === 'error').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
    checks,
  };
  const now = new Date().toISOString();
  log(job.id, `Retoque en Studio${who} sobre la newsletter ${source.id}: ${changes.length} cambio(s), sin Hermes.`, 'success');
  if (outlookCopies) log(job.id, `También en la versión para Outlook de ${outlookCopies} botón(es) (VML).`, 'success');
  return updateJob(job.id, {
    status: 'completed',
    currentPhase: null,
    campaignRelPath: outRel,
    resultRelPath: path.join(outRel, 'newsletter.html'),
    quality,
    startedAt: now,
    finishedAt: now,
  });
}

export class TextEditNoChanges extends Error {}

/** Todos los trabajos de la familia de versiones de `job` (la original y sus cambios y adaptaciones). */
export function familyJobs(job: Job): Job[] {
  return versionFamily(job)
    .map((v) => getJob(v.id))
    .filter((j): j is Job => !!j);
}

/** Aprueba una versión para envío y quita la aprobación de las demás de su familia: solo una se envía. */
export function approveVersion(job: Job, checklist: string[], by?: string): Job {
  const now = new Date().toISOString();
  for (const other of familyJobs(job)) {
    if (other.id !== job.id && other.approvedAt) {
      updateJob(other.id, { approvedAt: undefined, approvedBy: undefined, approvalChecklist: undefined });
      log(other.id, `Ya no es la versión aprobada: se aprobó otra (${job.id}).`);
    }
  }
  log(job.id, `Aprobada para envío${by ? ` por ${by}` : ''}.`, 'success');
  return updateJob(job.id, { approvedAt: now, approvedBy: by, approvalChecklist: checklist });
}

/** Archiva (o recupera) la familia entera. Devuelve cuántos trabajos cambiaron. */
export function archiveFamily(job: Job, archived: boolean): number {
  const members = familyJobs(job);
  if (archived && members.some((j) => j.status === 'queued' || j.status === 'running' || j.status === 'review')) {
    throw new Error('Hay una versión en cola o en marcha: cancélala o espera a que termine antes de archivar.');
  }
  const at = archived ? new Date().toISOString() : undefined;
  let changed = 0;
  for (const j of members) {
    if (!!j.archivedAt === archived) continue;
    updateJob(j.id, { archivedAt: at });
    log(j.id, archived ? 'Archivada.' : 'Recuperada del archivo.');
    changed++;
  }
  return changed;
}
