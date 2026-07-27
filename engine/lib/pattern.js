'use strict';

/**
 * lib/pattern.js — carga y validación del patrón de género (patterns/{pattern}.md).
 * Prompt 13. Parsea el bloque PATTERN_SEQUENCE y valida que campaign-data.json lo respete.
 *
 * ── REESCRITO 2026-07-24: de "secuencia fija" a "gramática" ────────────────────────────────
 *
 * Motivo real (ver engine/CHANGELOG.md, entrada "Las restricciones eran la causa de la
 * genericidad"): hasta esta fecha un patrón era una LISTA RÍGIDA — N pasos, orden fijo, cada
 * paso consumible UNA sola vez (algoritmo de 2 punteros). La consecuencia medida sobre las 12
 * campañas reales del sistema: TODAS terminan en `banda-cierre* → footer`, TODAS las
 * `institutional`/`fotografia-primero` empiezan en `header-logo → hero-*`, NINGUNA repite un
 * módulo, NINGUNA altera el orden. La única variación posible entre dos campañas del mismo
 * género era qué opcionales se omitían y qué variante (-asimetrico/-sin-icono) se elegía de
 * cada paso. Es decir: el patrón ERA la plantilla. Por eso cada newsletter se veía como la
 * anterior con otros colores, por muy bien investigada que estuviera la marca.
 *
 * La gramática nueva mantiene lo que de verdad debe ser estricto (qué componentes pertenecen al
 * género, qué bloques no pueden faltar, y que el email abra y cierre donde debe) y libera lo que
 * era arbitrario (el orden del cuerpo y la imposibilidad de repetir un bloque).
 *
 * ── SINTAXIS ───────────────────────────────────────────────────────────────────────────────
 *
 * Una regla por línea, dentro del bloque <!-- PATTERN_SEQUENCE --> ... <!-- /PATTERN_SEQUENCE -->:
 *
 *   N. alternativas (required|optional[, max N])   → ANCLA: posición fija en la secuencia
 *   -  alternativas (required|optional[, max N])   → ZONA LIBRE: orden libre entre sus vecinas
 *
 * - `alternativas` son uno o más nombres de componente separados por `|`. Un nombre puede
 *   terminar en `*` como comodín de prefijo (`hero-marca-*`), igual que antes.
 * - `max N` limita cuántas veces puede repetirse esa regla. Si se omite, `max` = 1 — que es
 *   exactamente el comportamiento anterior, así que un patrón escrito solo con líneas `N.`
 *   y sin `max` se valida igual que antes de esta reescritura (retrocompatibilidad real,
 *   verificada byte a byte contra las 12 campañas — ver CHANGELOG).
 * - Las líneas `-` CONSECUTIVAS forman una zona libre, situada entre las anclas que la rodean.
 *   Dentro de una zona, los módulos pueden aparecer en cualquier orden y repetirse hasta su
 *   `max`. Una regla `required` dentro de una zona significa "al menos una vez en algún punto
 *   de la zona", no "en esta posición".
 *
 * Ejemplo (institutional): header y hero son anclas de apertura, cierre y footer son anclas de
 * cierre, y todo el cuerpo es una zona libre donde el autor de la campaña compone según el
 * ritmo real de la marca (`layout.contentRhythm` del brand pack):
 *
 *   1. header-logo (required)
 *   2. hero-asimetrico|hero-centrado|hero-imagen|hero-marca-* (required)
 *   -  intro-cta|intro-cta-asimetrico (optional, max 2)
 *   -  columns-3-beneficios|card-tarifa-3 (required, max 2)
 *   -  category-grid|category-grid-img (optional, max 2)
 *   -  usp-cards|usp-cards-asimetrico (optional, max 2)
 *   3. banda-cierre|banda-cierre-asimetrico (required)
 *   4. footer (required)
 *
 * Lo que la gramática SIGUE bloqueando (no se ha relajado nada de esto):
 *   - Un componente que no pertenece al género.
 *   - Un bloque obligatorio ausente.
 *   - Un ancla fuera de su sitio (el email no puede empezar por el footer ni cerrar sin CTA).
 *   - Repetir un bloque más veces de las que su regla permite.
 */

const fs = require('fs');
const path = require('path');

/** Un nombre de componente encaja con una alternativa (con soporte de comodín de prefijo `*`). */
function matchesAlt(component, alt) {
  return alt.endsWith('*') ? component.startsWith(alt.slice(0, -1)) : component === alt;
}

/** ¿Este módulo encaja con alguna de las alternativas de esta regla? */
function ruleMatches(rule, component) {
  return rule.components.some((alt) => matchesAlt(component, alt));
}

// "1. a|b (required)" | "- a|b (optional, max 2)"
const LINE_RE = /^(?:(\d+)\.|-)\s+([a-zA-Z0-9|*-]+)\s+\((required|optional)(?:\s*,\s*max\s+(\d+))?\)$/;

/**
 * Extrae la gramática del bloque <!-- PATTERN_SEQUENCE ... --> ... <!-- /PATTERN_SEQUENCE -->.
 *
 * @returns {Array<{kind:'anchor', rule:Rule} | {kind:'zone', rules:Rule[]}>} segmentos en orden
 *   donde Rule = {components: string[], required: boolean, max: number, raw: string}
 */
function parsePatternSequence(patternMdContent, patternName) {
  const match = patternMdContent.match(/<!--\s*PATTERN_SEQUENCE[\s\S]*?-->([\s\S]*?)<!--\s*\/PATTERN_SEQUENCE\s*-->/);
  if (!match) {
    throw new Error(
      `patterns/${patternName}.md no tiene un bloque <!-- PATTERN_SEQUENCE --> ... <!-- /PATTERN_SEQUENCE --> ` +
      `parseable. Ver patterns/institutional.md §1 para el formato esperado.`
    );
  }

  const lines = match[1].split('\n').map((l) => l.trim()).filter(Boolean);
  const segments = [];

  for (const line of lines) {
    const m = line.match(LINE_RE);
    if (!m) {
      throw new Error(
        `Línea no parseable en el bloque PATTERN_SEQUENCE de patterns/${patternName}.md: "${line}". ` +
        `Formato esperado: "N. component-name (required|optional[, max N])" para un ancla de ` +
        `posición fija, o "- component-name (required|optional[, max N])" para un bloque de zona ` +
        `libre. Ver la cabecera de engine/lib/pattern.js para la gramática completa.`
      );
    }

    const [, anchorNum, altsRaw, reqRaw, maxRaw] = m;
    const rule = {
      components: altsRaw.split('|'),
      required: reqRaw === 'required',
      max: maxRaw ? parseInt(maxRaw, 10) : 1,
      raw: altsRaw
    };

    if (rule.max < 1) {
      throw new Error(
        `"max ${rule.max}" inválido en patterns/${patternName}.md ("${line}") — max debe ser >= 1. ` +
        `Para que un bloque no aparezca, omítelo del patrón; no se declara con max 0.`
      );
    }

    if (anchorNum !== undefined) {
      segments.push({ kind: 'anchor', rule });
    } else {
      // Líneas "-" consecutivas se agrupan en la misma zona libre.
      const last = segments[segments.length - 1];
      if (last && last.kind === 'zone') last.rules.push(rule);
      else segments.push({ kind: 'zone', rules: [rule] });
    }
  }

  if (segments.length === 0) {
    throw new Error(`Bloque PATTERN_SEQUENCE de patterns/${patternName}.md está vacío.`);
  }
  return segments;
}

/** Carga patterns/{pattern}.md y devuelve su gramática parseada. */
function loadPattern(patternName, systemRoot) {
  const patternPath = path.resolve(systemRoot, 'patterns', `${patternName}.md`);
  if (!fs.existsSync(patternPath)) {
    throw new Error(`Patrón "${patternName}" no encontrado en ${patternPath}.`);
  }
  const content = fs.readFileSync(patternPath, 'utf8');
  const sequence = parsePatternSequence(content, patternName);
  return { patternPath, sequence };
}

/** Todas las alternativas declaradas por la gramática, para el mensaje de error de paso 0. */
function allAlternatives(segments) {
  const out = [];
  for (const seg of segments) {
    if (seg.kind === 'anchor') out.push(...seg.rule.components);
    else for (const r of seg.rules) out.push(...r.components);
  }
  return out;
}

/**
 * Valida que los módulos de campaign-data.json respeten la gramática del patrón.
 *
 * Algoritmo: recorre los segmentos en orden, consumiendo módulos.
 *  - Ancla: el módulo actual debe encajar (hasta `max` veces). Si la regla es `optional` y no
 *    encaja, el ancla se considera omitida y se pasa al siguiente segmento.
 *  - Zona libre: consume, en el orden en que vengan, todos los módulos consecutivos que encajen
 *    con CUALQUIER regla de la zona, llevando la cuenta por regla. Se detiene en el primer
 *    módulo que no encaje con ninguna (o cuya regla ya agotó su `max`) — ese módulo lo evaluará
 *    el segmento siguiente. Al cerrar la zona: toda regla `required` debe haberse usado >= 1 vez.
 *
 * @returns {{ok: true}|{ok: false, errors: string[]}}
 */
function validateModulesAgainstPattern(segments, modules) {
  // ── Paso 0: todo componente debe pertenecer al género ────────────────────────────────────
  const knownAlts = allAlternatives(segments);
  const unknown = modules
    .filter((m) => !knownAlts.some((alt) => matchesAlt(m.component, alt)))
    .map((m) => m.component);
  if (unknown.length) {
    return {
      ok: false,
      errors: [
        `Módulo(s) con componente desconocido para este patrón: ${unknown.join(', ')}. ` +
        `Componentes válidos: ${knownAlts.join(', ')}.`
      ]
    };
  }

  // ── Paso 1: recorrer la gramática ────────────────────────────────────────────────────────
  let j = 0; // índice en modules

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.kind === 'anchor') {
      const { rule } = seg;
      let used = 0;
      while (used < rule.max && j < modules.length && ruleMatches(rule, modules[j].component)) {
        used++; j++;
      }
      if (used === 0 && rule.required) {
        const found = j < modules.length ? `"${modules[j].component}"` : '(fin de la lista de módulos)';
        return {
          ok: false,
          errors: [
            `Bloque obligatorio "${rule.raw}" (ancla de posición fija, segmento ${i + 1} del patrón) ` +
            `ausente o fuera de orden. En esa posición de campaign-data.json hay: ${found}. ` +
            `Las anclas son las únicas posiciones que la gramática sigue fijando — normalmente la ` +
            `apertura (cabecera/hero) y el cierre (CTA final/footer).`
          ]
        };
      }
      continue;
    }

    // Zona libre.
    const counts = new Map(seg.rules.map((r) => [r, 0]));
    while (j < modules.length) {
      const component = modules[j].component;
      const rule = seg.rules.find((r) => ruleMatches(r, component) && counts.get(r) < r.max);
      if (!rule) break; // no encaja (o su regla está agotada): lo evalúa el siguiente segmento
      counts.set(rule, counts.get(rule) + 1);
      j++;
    }

    const missing = seg.rules.filter((r) => r.required && counts.get(r) === 0);
    if (missing.length) {
      return {
        ok: false,
        errors: missing.map(
          (r) =>
            `Bloque obligatorio "${r.raw}" ausente. Está en una zona de orden libre (segmento ` +
            `${i + 1} del patrón): puede ir en cualquier posición dentro de su zona y repetirse ` +
            `hasta ${r.max} vez/veces, pero tiene que aparecer al menos una vez.`
        )
      };
    }
  }

  // ── Paso 2: nada puede sobrar ────────────────────────────────────────────────────────────
  if (j < modules.length) {
    const sobrantes = modules.slice(j).map((m) => m.component);
    return {
      ok: false,
      errors: [
        `Módulo(s) que no encajan en la gramática del patrón (fuera de orden respecto a las ` +
        `anclas, o repetidos más veces de las que su regla permite): ${sobrantes.join(', ')}.`
      ]
    };
  }

  return { ok: true };
}

module.exports = { parsePatternSequence, loadPattern, validateModulesAgainstPattern };
