'use strict';

/**
 * lib/assemble.js — motor de resolución de placeholders y ensamblado del HTML.
 * Prompt 13. Convención de placeholders (definida en el prompt 11, ampliada aquí):
 *   {{token:path.to.value}}   — brand-tokens.json
 *   {{data:path.to.value}}    — dato del módulo actual (soporta índices "cards[0].title")
 *   {{#each:name}} ... {{/each}} — repite el bloque interior por cada elemento de scope[name],
 *                                   con el ITEM como nuevo scope (campos sin prefijo)
 *   {{include:component-name}}   — inserta engine/components/{name}.html resuelto con el
 *                                   MISMO scope del padre (ver engine/CHANGELOG.md, prompt 11,
 *                                   y los adaptadores de módulo más abajo para cómo "cta" queda
 *                                   disponible en el scope para que el include lo encuentre)
 *   {{slot:body}}                 — solo en _shell.html, sustituido por el HTML ya ensamblado
 *                                   de todos los módulos, en el orden de campaign-data.json
 *
 * Adaptadores de módulo: traducen la forma "campaign-data.json" (uniforme, `items[]`) a la
 * forma que cada plantilla de componente espera literalmente en sus placeholders (nombres
 * específicos: cards[], steps[], trustItems[], listItems, etc.) — tabla documentada en
 * engine/CHANGELOG.md (prompt 12).
 */

const fs = require('fs');
const path = require('path');

const EACH_OPEN_RE = /\{\{#each:([a-zA-Z0-9_]+)\}\}/;
const EACH_CLOSE = '{{/each}}';
const INCLUDE_RE = /\{\{include:([a-zA-Z0-9_-]+)\}\}/g;
const TOKEN_RE = /\{\{token:([a-zA-Z0-9_.]+)\}\}/g;
const DATA_RE = /\{\{data:([a-zA-Z0-9_.\[\]]+)\}\}/g;
const LEADING_COMMENT_RE = /^\s*<!--[\s\S]*?-->\s*/;

// ── Geometría de celdas para módulos de N columnas (2026-07-24) ────────────────────────────
//
// Motivo (ver engine/CHANGELOG.md, "Los conteos fijos"): hasta esta fecha 9 de los 10 módulos
// con lista de ítems hardcodeaban `items[0]`, `items[1]`, `items[2]` LITERALMENTE en su plantilla
// HTML, con anchos de columna fijos al 33%. El "exactamente 3" no vivía en el schema (ahí solo
// se reflejaba): vivía en el HTML. Consecuencia: toda marca tenía que tener exactamente 3
// beneficios, 3 pruebas de confianza, 3 pasos y 3 tarjetas de credibilidad, tuviera 2 o 5.
//
// El precedente correcto ya existía en el motor: `category-grid` agrupa sus ítems en filas EN JS
// (aquí, en el adaptador) y su plantilla itera con {{#each}}, así que cada fila emite solo las
// <td> que realmente tiene. Estas 2 funciones generalizan ese mecanismo al resto de módulos:
// la plantilla no puede hacer aritmética, así que el ancho y el padding de cada celda se calculan
// aquí y viajan como dato (`colWidth`, `cellPad`).

/**
 * Reparte `items` en filas lo más equilibradas posible, sin dejar filas huérfanas.
 * 2→[2] · 3→[3] · 4→[2,2] · 5→[3,2] · 6→[3,3]  (con maxPerRow=3)
 * Se evita [3,1] a propósito: una fila con un solo ítem a ancho completo debajo de una fila de 3
 * es exactamente el desequilibrio visual que motivó `check-column-balance` en la campaña de UAX.
 */
function balancedRows(items, maxPerRow, gutter) {
  const n = items.length;
  if (n <= maxPerRow) return [{ items: withCellGeometry(items, n, gutter) }];
  const rowCount = Math.ceil(n / maxPerRow);
  const base = Math.floor(n / rowCount);
  const extra = n % rowCount; // las primeras `extra` filas llevan un ítem más
  const rows = [];
  let i = 0;
  for (let r = 0; r < rowCount; r++) {
    const size = base + (r < extra ? 1 : 0);
    rows.push({ items: withCellGeometry(items.slice(i, i + size), size, gutter) });
    i += size;
  }
  return rows;
}

/**
 * Añade a cada ítem su ancho de columna y su padding lateral, según cuántos comparten la fila.
 * `cellPad` reproduce el patrón que las plantillas traían escrito a mano (primera celda sin
 * padding izquierdo, última sin padding derecho, intermedias simétricas) — así el render de 3
 * ítems sale byte a byte igual que antes de esta generalización. `gutter` es el canalón lateral
 * en px que ya usaba cada plantilla (10 en columns-3-beneficios, 6 en usp-cards) — se pasa
 * explícitamente para no unificar de tapadillo dos valores de diseño que ya eran distintos.
 */
/**
 * Geometría para las variantes APILADAS (`-asimetrico` de beneficios): cada ítem es su propia
 * fila, así que no hay ancho que repartir — lo único que varía es que la ÚLTIMA fila no lleva
 * separación inferior. Se emiten los dos paddings completos como dato (en vez de un solo valor)
 * porque la plantilla original escribía `padding:0;` a secas en la última celda de texto, no
 * `padding:0 0 0;` — emitirlos enteros conserva la paridad byte a byte.
 */
function withStackGeometry(items, gap = 20) {
  const last = items.length - 1;
  return items.map((item, idx) => ({
    ...item,
    padIcon: idx === last ? '0 16px 0 0' : `0 16px ${gap}px 0`,
    padText: idx === last ? '0' : `0 0 ${gap}px`
  }));
}

function withCellGeometry(items, perRow, gutter = 10) {
  const width = Math.floor(100 / perRow);
  const half = gutter / 2;
  return items.map((item, idx) => ({
    ...item,
    colWidth: `${width}%`,
    cellPad: perRow === 1 ? '0'
      : idx === 0 ? `0 ${gutter}px 0 0`
      : idx === perRow - 1 ? `0 0 0 ${gutter}px`
      : `0 ${half}px`
  }));
}

/**
 * Adaptadores: component name -> (moduleData) => scope object que la plantilla espera.
 * `cta` se duplica a nivel raíz en hero-asimetrico/banda-cierre para que
 * {{include:cta-bulletproof}} (cuyo propio placeholder es {{data:cta.href}}, sin prefijo) lo
 * encuentre directamente en el scope heredado del padre.
 */
const MODULE_ADAPTERS = {
  'hero-asimetrico': (data) => ({
    hero: { h1: data.h1, stat: data.stat, subtitle: data.subtitle, cta: data.cta },
    cta: data.cta
  }),
  'trust-bar': (data) => ({ trustItems: withCellGeometry(data.items, data.items.length) }),
  // hero-imagen (2026-07-25 — hallazgo durante el test de Worn Wear, ver engine/CHANGELOG.md
  // "El H1 de hero-imagen ignoraba typography.hero.h1"): el H1 y el nombre de marca vivían con
  // color/tamaño/peso HARDCODEADOS (#FFFFFF/28px/800) en la plantilla, aunque el pack ya declara
  // typography.hero.h1.{color,size,weight,lineHeight} desde antes (Worn Wear, Spotify, Nike,
  // BMW). Este es el único adaptador que necesita leer `tokens` además de `data` — se calcula
  // aquí en vez de en la plantilla porque {{token:path}} lanza un error duro si el path no existe
  // (ver renderTemplate, sección 3), y no todos los packs declaran typography.hero.h1 todavía
  // (p.ej. tarifalo) — el fallback a los valores anteriores tiene que vivir en JS, no en el motor
  // de templates, para no romper esos packs.
  'hero-imagen': (data, tokens) => {
    const h1cfg = (tokens && tokens.typography && tokens.typography.hero && tokens.typography.hero.h1) || {};
    return {
      hero: {
        bannerSrc: data.bannerSrc, bannerAlt: data.bannerAlt, brandName: data.brandName,
        h1: data.h1, subtitle: data.subtitle, cta: data.cta,
        h1Color: h1cfg.color || '#FFFFFF',
        h1Size: h1cfg.size || 28,
        h1Weight: h1cfg.weight || 800,
        h1LineHeight: h1cfg.lineHeight || 1.16
      },
      cta: data.cta
    };
  },
  'hero-centrado': (data) => ({
    hero: { brandName: data.brandName, h1: data.h1, subtitle: data.subtitle, cta: data.cta },
    cta: data.cta
  }),
  'card-tarifa': (data) => ({
    cardsSection: { eyebrow: data.eyebrow, title: data.title, subtitle: data.subtitle },
    cards: data.items
  }),
  'pasos': (data) => ({
    stepsSection: { eyebrow: data.eyebrow, title: data.title },
    steps: withCellGeometry(data.items, data.items.length)
  }),
  'lista-premium': (data) => ({
    listSection: { eyebrow: data.eyebrow, title: data.title },
    listItems: data.items
  }),
  'banda-cierre': (data) => ({
    closing: { title: data.title, body: data.body, cta: data.cta },
    cta: data.cta
  }),
  'footer': (data) => ({ footer: data }),
  // Patrón "institutional" (añadido 2026-07-22, campaña UAX — ver engine/CHANGELOG.md):
  'header-logo': (data) => ({ header: data }),
  'intro-cta': (data) => ({
    intro: { title: data.title, body: data.body },
    cta: data.cta
  }),
  'columns-3-beneficios': (data) => ({
    beneficiosSection: { title: data.title, highlight: data.highlight, highlightNote: data.highlightNote },
    // Dos formas del mismo dato, para las dos familias de layout que comparten este adaptador:
    // `beneficiosRows` (con geometría de celda) para las variantes EN COLUMNAS, y `beneficios`
    // (lista plana) para las variantes APILADAS (-asimetrico), donde cada ítem es su propia fila
    // y por tanto el conteo variable ya funcionaba sin necesidad de calcular anchos.
    beneficiosRows: balancedRows(data.items, 3),
    beneficios: withStackGeometry(data.items)
  }),
  // category-grid agrupa "categories" (plano en campaign-data.json) en filas de 3 AQUÍ, en JS —
  // así la plantilla nunca emite una fila con menos <td> "vacíos" que otra: cada fila solo
  // itera sobre los ítems que realmente tiene (ver cabecera de category-grid.html).
  'category-grid': (data) => {
    const items = data.categories;
    const rows = [];
    for (let i = 0; i < items.length; i += 3) rows.push({ items: items.slice(i, i + 3) });
    return {
      gridSection: { title: data.title, intro: data.intro },
      rows,
      cta: data.cta
    };
  },
  'usp-cards': (data) => ({
    uspSection: { eyebrow: data.eyebrow, title: data.title, body: data.body, badge: data.badge },
    uspRows: balancedRows(data.items, 3, 6), // variantes en columnas
    usp: data.items                          // variantes apiladas
  }),
  // editorial-foto-texto* (2026-07-27, evolución brand-native — ver engine/CHANGELOG.md):
  // ambos comparten el mismo contrato de datos, solo cambia el layout de las columnas.
  'editorial-foto-texto': (data) => ({
    edImgSrc: data.imageSrc,
    edImgAlt: data.imageAlt,
    edEyebrow: data.eyebrow,
    edTitle: data.title,
    edBody: data.body,
    cta: data.cta
  }),
  // metric-strip-premium (2026-08-01, campaña Audi A6 e-tron — ver engine/CHANGELOG.md):
  // tira de métricas premium sin iconos, sin cards, sin highlight. Números grandes + labels.
  'metric-strip-premium': (data) => ({
    metricSection: { title: data.title },
    metricItems: withCellGeometry(data.items, data.items.length)
  })
};

// Nivel 2 (2026-07-22, ver engine/CHANGELOG.md): variantes ASIMÉTRICAS de composición para el
// patrón "institutional" — mismo contrato de datos que su contraparte centrada (el layout
// cambia en la plantilla .html, no en la forma del dato), así que reutilizan literalmente el
// mismo adaptador en vez de duplicarlo. Elegir cuál de las dos nombra campaign-data.json es una
// decisión de marca (ver brand-tokens.json → layout.sectionStyle y patterns/institutional.md
// §7), no una decisión del motor.
MODULE_ADAPTERS['banda-cierre-asimetrico'] = MODULE_ADAPTERS['banda-cierre'];
MODULE_ADAPTERS['intro-cta-asimetrico'] = MODULE_ADAPTERS['intro-cta'];
MODULE_ADAPTERS['columns-3-beneficios-asimetrico'] = MODULE_ADAPTERS['columns-3-beneficios'];
MODULE_ADAPTERS['usp-cards-asimetrico'] = MODULE_ADAPTERS['usp-cards'];
// columns-3-beneficios-sin-icono (2026-07-24, campaña BMW — ver engine/CHANGELOG.md): mismo
// adaptador que columns-3-beneficios, el items[].icon simplemente no se usa en la plantilla de
// esta variante (el schema tampoco lo exige para este componente).
MODULE_ADAPTERS['columns-3-beneficios-sin-icono'] = MODULE_ADAPTERS['columns-3-beneficios'];
// usp-cards-sin-icono / -asimetrico (2026-07-24, campaña Spotify — ver engine/CHANGELOG.md):
// mismo adaptador que usp-cards, el items[].icon simplemente no se usa en la plantilla de estas
// variantes (el schema tampoco lo exige para estos componentes).
MODULE_ADAPTERS['usp-cards-sin-icono'] = MODULE_ADAPTERS['usp-cards'];
MODULE_ADAPTERS['usp-cards-sin-icono-asimetrico'] = MODULE_ADAPTERS['usp-cards'];
// editorial-foto-texto-inverso (2026-07-27): mismo contrato de datos, layout invertido.
MODULE_ADAPTERS['editorial-foto-texto-inverso'] = MODULE_ADAPTERS['editorial-foto-texto'];
// card-tarifa-3 / category-grid-img (corregido 2026-07-28 — auditoría técnica): ambos tenían
// una función adaptadora ESCRITA POR SEPARADO con cuerpo idéntico a su contraparte, en vez de
// aliasarse como los 6 pares de arriba — inconsistencia de estilo dentro de este mismo archivo.
// Mismo motivo que el resto: layout distinto en la plantilla .html, forma del dato idéntica.
MODULE_ADAPTERS['card-tarifa-3'] = MODULE_ADAPTERS['card-tarifa'];
MODULE_ADAPTERS['category-grid-img'] = MODULE_ADAPTERS['category-grid'];

/** Escapa &, < y > en contenido de campaña insertado en contexto HTML (spec del prompt 13). */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Camina un path tipo "cards[0].title" o "hero.stat.number" sobre un objeto scope.
 * @returns {*} undefined si el path no existe en ningún punto del recorrido.
 */
function resolveDataPath(scope, dataPath) {
  const tokens = [];
  const re = /([^.\[\]]+)|\[(\d+)\]/g;
  let m;
  while ((m = re.exec(dataPath)) !== null) {
    tokens.push(m[1] !== undefined ? m[1] : Number(m[2]));
  }
  let cur = scope;
  for (const t of tokens) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[t];
  }
  return cur;
}

/** Quita el comentario HTML de cabecera (documentación) de un componente extraído. */
function stripLeadingComment(html) {
  return html.replace(LEADING_COMMENT_RE, '');
}

function readComponent(componentsDir, name) {
  const file = path.join(componentsDir, `${name}.html`);
  if (!fs.existsSync(file)) {
    throw new Error(`Componente "${name}" no encontrado en ${file}.`);
  }
  return stripLeadingComment(fs.readFileSync(file, 'utf8'));
}

/**
 * Procesa {{#each:name}} ... {{/each}} con soporte de ANIDAMIENTO (añadido 2026-07-22, patrón
 * institutional/category-grid — ver engine/CHANGELOG.md). La implementación anterior usaba una
 * única regex no-greedy (`/\{\{#each:...\}\}([\s\S]*?)\{\{\/each\}\}/g`) que, con un
 * {{#each}} anidado dentro de otro, cerraba en el PRIMER {{/each}} literal que encontraba —
 * el del each interior, no el del exterior — dejando el interior roto (sin su propio cierre) y
 * su contenido evaluado contra el scope equivocado. Nunca se había manifestado porque hasta
 * ahora ningún componente anidaba un {{#each}} dentro de otro (lista-premium, el único que usa
 * {{#each}}, no anida). Esta versión cuenta profundidad para encontrar el {{/each}} que de
 * verdad cierra cada apertura, soporta cualquier nivel de anidamiento, y para el caso sin
 * anidar (depth máxima 1) se comporta exactamente igual que antes — mismo output para todo
 * componente existente (verificado: los 3 build-manifests preexistentes no cambian de hash).
 *
 * @param {string} template
 * @param {object} scope
 * @param {object} tokens
 * @param {string} componentsDir
 * @param {{file: string}} ctx
 * @returns {string}
 */
function processEachBlocks(template, scope, tokens, componentsDir, ctx) {
  let out = '';
  let rest = template;
  while (true) {
    const m = rest.match(EACH_OPEN_RE);
    if (!m) {
      out += rest;
      break;
    }
    out += rest.slice(0, m.index);
    const arrName = m[1];
    const afterOpen = m.index + m[0].length;

    let depth = 1;
    let searchFrom = afterOpen;
    let closeIdx = -1;
    while (depth > 0) {
      const nextOpen = rest.indexOf('{{#each:', searchFrom);
      const nextClose = rest.indexOf(EACH_CLOSE, searchFrom);
      if (nextClose === -1) {
        throw new Error(`[${ctx.file}] {{#each:${arrName}}} sin su {{/each}} de cierre correspondiente.`);
      }
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        searchFrom = nextOpen + '{{#each:'.length;
      } else {
        depth--;
        if (depth === 0) closeIdx = nextClose;
        searchFrom = nextClose + EACH_CLOSE.length;
      }
    }

    const inner = rest.slice(afterOpen, closeIdx);
    const arr = resolveDataPath(scope, arrName);
    if (!Array.isArray(arr)) {
      throw new Error(
        `[${ctx.file}] {{#each:${arrName}}} — "${arrName}" no es un array en los datos del ` +
        `módulo (¿falta el campo o el adaptador de módulo no lo expone?).`
      );
    }
    out += arr.map((item) => renderTemplate(inner, item, tokens, componentsDir, ctx)).join('');
    rest = rest.slice(closeIdx + EACH_CLOSE.length);
  }
  return out;
}

/**
 * Resuelve recursivamente {{#each}}, {{include}}, {{token}} y {{data}} sobre un string de
 * plantilla ya cargado (sin su comentario de cabecera).
 *
 * @param {string} template
 * @param {object} scope - datos del módulo actual (ya adaptados)
 * @param {object} tokens - brand-tokens.json completo
 * @param {string} componentsDir
 * @param {{file: string}} ctx - contexto para mensajes de error (nombre del componente actual)
 * @returns {string}
 */
function renderTemplate(template, scope, tokens, componentsDir, ctx) {
  let out = template;

  // 1) {{#each:name}} ... {{/each}} — cada item se convierte en el nuevo scope (sin prefijo).
  // Soporta anidamiento (ver processEachBlocks).
  out = processEachBlocks(out, scope, tokens, componentsDir, ctx);

  // 2) {{include:name}} — mismo scope del padre. resolveIncludeAlias (2026-07-25, ver
  // engine/CHANGELOG.md "Vocabulario de formas de CTA") permite que un brand pack pida una
  // silueta de CTA distinta (components.cta.style / components.ctaSecondary.style) sin tocar
  // cada plantilla que escribe {{include:cta-bulletproof}}/{{include:cta-secondary-bulletproof}}
  // a mano — las plantillas siguen incluyendo el nombre "canónico", el pack decide en runtime
  // qué archivo se lee de verdad. Sin ese campo en el pack, no cambia nada (mismo componente de
  // siempre).
  out = out.replace(INCLUDE_RE, (full, name) => {
    const resolvedName = resolveIncludeAlias(name, tokens);
    const partial = readComponent(componentsDir, resolvedName);
    return renderTemplate(partial, scope, tokens, componentsDir, { file: resolvedName });
  });

  // 3) {{token:path}}
  out = out.replace(TOKEN_RE, (full, tokenPath) => {
    const value = resolveDataPathOnTokens(tokens, tokenPath);
    if (value === undefined) {
      throw new Error(`[${ctx.file}] {{token:${tokenPath}}} — path no existe en brand-tokens.json.`);
    }
    if (value !== null && typeof value === 'object') {
      throw new Error(
        `[${ctx.file}] {{token:${tokenPath}}} — el path resuelve a un objeto/array, no a un ` +
        `valor escalar. Referencia un campo más específico (ej. "${tokenPath}.size").`
      );
    }
    return String(value);
  });

  // 4) {{data:path}} — con escapado HTML
  out = out.replace(DATA_RE, (full, dataPath) => {
    const value = resolveDataPath(scope, dataPath);
    if (value === undefined) {
      throw new Error(
        `[${ctx.file}] {{data:${dataPath}}} — placeholder sin valor (el campo no existe en el ` +
        `scope de datos de este módulo).`
      );
    }
    if (value !== null && typeof value === 'object') {
      throw new Error(
        `[${ctx.file}] {{data:${dataPath}}} — el path resuelve a un objeto, no a un valor de ` +
        `texto/URL. Referencia un campo más específico.`
      );
    }
    return escapeHtml(value);
  });

  return out;
}

// Mapa de siluetas de CTA disponibles, por include "canónico" (2026-07-25 — ver
// engine/CHANGELOG.md, "Vocabulario de formas de CTA"). 'pill' es implícito (el propio nombre
// canónico, sin alias) — solo hace falta declarar las alternativas reales.
const CTA_STYLE_ALIASES = {
  'cta-bulletproof': { tokenPath: 'components.cta.style', alternatives: { 'text-link': 'cta-text-link-bulletproof', 'block': 'cta-block-bulletproof' } },
  'cta-secondary-bulletproof': { tokenPath: 'components.ctaSecondary.style', alternatives: { 'text-link': 'cta-text-link-bulletproof' } }
};

/**
 * Si `name` es uno de los includes de CTA con siluetas alternativas Y el pack pide una vía su
 * token (ej. components.cta.style = "text-link"), devuelve el nombre de archivo real a leer.
 * Para cualquier otro include, o si el pack no declara el campo (o pide un valor no reconocido),
 * devuelve `name` sin cambios — comportamiento idéntico al de antes de este mecanismo.
 */
function resolveIncludeAlias(name, tokens) {
  const cfg = CTA_STYLE_ALIASES[name];
  if (!cfg) return name;
  const requested = resolveDataPathOnTokens(tokens, cfg.tokenPath);
  if (typeof requested === 'string' && cfg.alternatives[requested]) return cfg.alternatives[requested];
  return name;
}

/**
 * Genera el CSS de @font-face para la marca, si el pack declara typography.webFont (2026-07-25 —
 * ver engine/CHANGELOG.md, "Tipografía real por marca"). Antes el @font-face de Sora vivía
 * hardcodeado en _shell.html para las 9 marcas por igual, aunque solo tarifalo lo usara. Ahora es
 * un dato del pack: `typography.webFont = { family, weights: [{weight, url, unicodeRange?}] }`.
 * Sin ese campo, devuelve '' — la marca sigue con su fallback de sistema, sin @font-face alguno.
 * @param {object} tokens - brand-tokens.json
 * @returns {string} bloque(s) @font-face, o '' si el pack no declara typography.webFont
 */
function buildFontFaceCSS(tokens) {
  const webFont = tokens && tokens.typography && tokens.typography.webFont;
  if (!webFont || !Array.isArray(webFont.weights) || webFont.weights.length === 0) return '';
  return webFont.weights
    .map((w) => {
      const unicodeRange = w.unicodeRange ? `\n  unicode-range: ${w.unicodeRange};` : '';
      return `@font-face {\n  font-family: '${webFont.family}';\n  font-style: normal;\n  ` +
        `font-weight: ${w.weight};\n  font-display: swap;\n  ` +
        `src: url(${w.url}) format('woff2');${unicodeRange}\n}`;
    })
    .join('\n');
}

/** Igual que resolveDataPath pero solo para paths simples separados por "." (tokens). */
function resolveDataPathOnTokens(tokens, tokenPath) {
  const parts = tokenPath.split('.');
  let cur = tokens;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object' || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Ensambla el HTML completo: renderiza cada módulo con su adaptador, concatena en orden, y
 * los inserta en _shell.html junto con subject/preheader.
 *
 * @param {object} campaignData - campaign-data.json ya validado contra el schema
 * @param {object} tokens - brand-tokens.json
 * @param {string} componentsDir - engine/components/
 * @returns {string} HTML final (fuente, sin inline)
 */
function assembleNewsletter(campaignData, tokens, componentsDir) {
  const bodyParts = campaignData.modules.map((mod) => {
    let adapter = MODULE_ADAPTERS[mod.component];
    // Heros de marca generados (Claude design, 2026-07-21): mismo contrato de datos que
    // hero-centrado — un único fallback para no crecer MODULE_ADAPTERS por marca.
    if (!adapter && /^hero-marca-[a-z0-9-]+$/.test(mod.component)) {
      adapter = MODULE_ADAPTERS['hero-centrado'];
    }
    if (!adapter) {
      throw new Error(
        `Módulo "${mod.component}" no tiene adaptador en lib/assemble.js (MODULE_ADAPTERS). ` +
        `Si es un componente nuevo, añade su adaptador — ver engine/README.md.`
      );
    }
    const scope = adapter(mod.data, tokens);
    const template = readComponent(componentsDir, mod.component);
    return renderTemplate(template, scope, tokens, componentsDir, { file: mod.component });
  });
  const body = bodyParts.join('\n');

  const shellScope = {
    subject: campaignData.metadata.subjectLine,
    preheader: campaignData.metadata.preheader
  };
  const shellTemplate = readComponent(componentsDir, '_shell');
  // {{slot:body}} y {{slot:fontface}} se sustituyen ANTES de correr renderTemplate — mismo
  // motivo para los dos: el contenido (HTML ya resuelto / CSS con URLs que pueden llevar "&")
  // no debe pasar por el escapado de {{data:}} ni reinterpretarse.
  const fontFaceCSS = buildFontFaceCSS(tokens);
  const shellWithBody = shellTemplate
    .replace('{{slot:fontface}}', () => fontFaceCSS)
    .replace('{{slot:body}}', () => body);
  return renderTemplate(shellWithBody, shellScope, tokens, componentsDir, { file: '_shell' });
}

module.exports = {
  assembleNewsletter,
  renderTemplate,
  resolveDataPath,
  buildFontFaceCSS,
  resolveIncludeAlias,
  stripLeadingComment,
  escapeHtml,
  MODULE_ADAPTERS,
  balancedRows,
  withCellGeometry,
  withStackGeometry
};
