'use strict';

/**
 * lib/verify.js — auto-verificación post-build (prompt 13, paso 7 de la especificación).
 * Corre SIEMPRE, en cada build. Cualquier fallo debe hacer que build-newsletter.js salga con
 * exit 1 y borre los outputs parciales — nunca dejar un final.html/final-inline.html inválido
 * en 09-exports/ (es el error histórico N1 del sistema, documentado en next-steps.md de la
 * campaña piloto y en docs/auditoria-total-y-plan-transformacion-2026-07-17.md).
 */

const MAX_INLINE_BYTES = 90 * 1024;
const WARN_INLINE_BYTES = 80 * 1024;

function countOccurrences(str, re) {
  const m = str.match(re);
  return m ? m.length : 0;
}

function tagBalance(str) {
  return {
    open: countOccurrences(str, /<table[ >]/g),
    close: countOccurrences(str, /<\/table>/g)
  };
}

/**
 * @param {string} source - HTML fuente (final.html)
 * @param {string} inline - HTML con CSS inline (final-inline.html)
 * @returns {{ok: boolean, errors: string[], warnings: string[], counts: object}}
 */
const CHARSET_UTF8_RE = /<meta[^>]+charset\s*=\s*["']?utf-8["']?/i;

function verifyBuild(source, inline) {
  const errors = [];
  const warnings = [];

  // 0) UTF-8 declarado explícitamente (añadido 2026-07-22, a petición del usuario: garantizar
  // que TODA newsletter que genere el sistema lleve el charset de serie, no como un hecho
  // incidental de que _shell.html hoy lo tenga — si alguna vez alguien toca _shell.html y lo
  // quita, el build debe fallar aquí, no publicarse sin él). _shell.html ya lo declara como
  // primera etiqueta de <head> (best practice de email: dentro de los primeros 1024 bytes) —
  // este check hace esa garantía estructural, no solo un hecho de hoy.
  if (!CHARSET_UTF8_RE.test(source)) {
    errors.push('final.html no declara <meta charset="UTF-8"> (o equivalente http-equiv) — toda newsletter del sistema debe llevarlo.');
  }
  if (!CHARSET_UTF8_RE.test(inline)) {
    errors.push('final-inline.html no declara <meta charset="UTF-8"> (o equivalente http-equiv) — toda newsletter del sistema debe llevarlo.');
  }

  // 1) 0 restos de placeholders sin resolver
  if (/\{\{/.test(source)) {
    errors.push('final.html contiene restos de "{{" sin resolver — placeholder(s) no sustituido(s).');
  }
  if (/\{\{/.test(inline)) {
    errors.push('final-inline.html contiene restos de "{{" sin resolver — placeholder(s) no sustituido(s).');
  }

  // 2) conteos fuente vs inline: deben ser idénticos (juice no debe alterar estructura)
  const metrics = ['<img', 'utm_source', 'v:roundrect'];
  const counts = {};
  for (const metric of metrics) {
    const re = new RegExp(metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const srcCount = countOccurrences(source, re);
    const inlineCount = countOccurrences(inline, re);
    counts[metric] = { source: srcCount, inline: inlineCount };
    if (srcCount !== inlineCount) {
      errors.push(
        `Conteo de "${metric}" no coincide entre fuente (${srcCount}) e inline (${inlineCount}) ` +
        `— paridad rota (el defecto histórico N1).`
      );
    }
  }

  // 3) tags balanceados (tablas abiertas = cerradas), en ambos archivos
  const srcBalance = tagBalance(source);
  const inlineBalance = tagBalance(inline);
  counts.tableBalance = { source: srcBalance, inline: inlineBalance };
  if (srcBalance.open !== srcBalance.close) {
    errors.push(`final.html: <table> desbalanceadas (${srcBalance.open} abiertas, ${srcBalance.close} cerradas).`);
  }
  if (inlineBalance.open !== inlineBalance.close) {
    errors.push(`final-inline.html: <table> desbalanceadas (${inlineBalance.open} abiertas, ${inlineBalance.close} cerradas).`);
  }

  // 4) peso del inline
  const inlineBytes = Buffer.byteLength(inline, 'utf8');
  counts.inlineBytes = inlineBytes;
  if (inlineBytes >= MAX_INLINE_BYTES) {
    errors.push(`final-inline.html pesa ${(inlineBytes / 1024).toFixed(1)} KB — supera el límite de 90 KB.`);
  } else if (inlineBytes >= WARN_INLINE_BYTES) {
    warnings.push(`final-inline.html pesa ${(inlineBytes / 1024).toFixed(1)} KB — por encima del aviso de 80 KB.`);
  }

  return { ok: errors.length === 0, errors, warnings, counts };
}

module.exports = { verifyBuild, tagBalance, countOccurrences };
