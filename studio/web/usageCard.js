/**
 * usageCard.js — «Tiempo · Tokens · Coste» de un trabajo (2026-10-21).
 *
 * La ficha del trabajo y Resultados pintan el mismo bloque. Sin tokens (trabajos
 * anteriores a este registro) dice «sin datos». El desglose, si hay pasos, va plegado.
 */
(function (root) {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMSS(sec) {
    if (sec == null || !isFinite(Number(sec))) return null;
    var s = Math.max(0, Math.round(Number(sec)));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /** 182000 → «182k». Por debajo de 1000, el entero. */
  function compactTokens(n) {
    var x = Math.max(0, Math.round(Number(n)));
    if (!isFinite(x)) return 'sin datos';
    if (x < 1000) return String(x);
    var million = x >= 1000000;
    var v = x / (million ? 1000000 : 1000);
    var suffix = million ? 'M' : 'k';
    if (v >= 10) return String(Math.round(v)) + suffix;
    return (Math.round(v * 10) / 10).toFixed(1).replace('.', ',') + suffix;
  }

  /** 0.94 → «0,94 €». */
  function formatEur(n) {
    if (n == null || !isFinite(Number(n))) return 'sin datos';
    var sign = Number(n) < 0 ? '-' : '';
    var parts = Math.abs(Number(n)).toFixed(2).split('.');
    return sign + parts[0] + ',' + parts[1] + ' €';
  }

  function tokenSum(usage) {
    if (!usage) return 0;
    if (usage.tokens != null && isFinite(Number(usage.tokens))) return Number(usage.tokens);
    return (Number(usage.inputTokens) || 0) + (Number(usage.outputTokens) || 0) + (Number(usage.cacheTokens) || 0);
  }

  function stepTokens(step) {
    return (Number(step.inputTokens) || 0) + (Number(step.outputTokens) || 0) + (Number(step.cacheTokens) || 0);
  }

  /** La página del trabajo manda el registro crudo. `durationSec` es el de pared, ya descontada la espera del brief. */
  function usageFromJob(job, durationSec) {
    var steps = job && Array.isArray(job.usageSteps) ? job.usageSteps : [];
    var input = Number(job && job.inputTokens) || 0;
    var output = Number(job && job.outputTokens) || 0;
    var cache = Number(job && job.cacheTokens) || 0;
    var known = input + output + cache > 0 || steps.some(function (step) { return stepTokens(step) > 0; });
    return {
      known: known,
      durationSec: durationSec == null || !isFinite(Number(durationSec)) ? null : Number(durationSec),
      inputTokens: known ? input : null,
      outputTokens: known ? output : null,
      cacheTokens: known ? cache : null,
      tokens: known ? input + output + cache : null,
      costEur: known && job && job.costEur != null && isFinite(Number(job.costEur)) ? Number(job.costEur) : known ? null : null,
      steps: known ? steps : [],
    };
  }

  function headline(usage) {
    if (!usage || !usage.known) return 'sin datos';
    var bits = [];
    var time = formatMSS(usage.durationSec);
    if (time) bits.push(time);
    bits.push(compactTokens(tokenSum(usage)) + ' tokens');
    bits.push(usage.costEur == null ? 'sin datos' : formatEur(usage.costEur));
    return bits.join(' · ');
  }

  function stepLine(step) {
    var bits = [];
    if (Number(step.durationSec) > 0) bits.push(formatMSS(step.durationSec));
    var tokens = stepTokens(step);
    if (tokens > 0) {
      bits.push(compactTokens(tokens) + ' tokens');
      bits.push(step.costEur == null || !isFinite(Number(step.costEur)) ? 'sin datos' : formatEur(step.costEur));
    }
    return bits.join(' · ') || 'sin datos';
  }

  function renderBlock(usage) {
    var steps = usage && usage.known && usage.steps && usage.steps.length ? usage.steps : [];
    var list = steps.length
      ? '<details class="usage-break"><summary>Por paso</summary><ul>' +
        steps
          .map(function (step) {
            return '<li><span>' + esc(step.label || step.id || 'Paso') + '</span><b>' + esc(stepLine(step)) + '</b></li>';
          })
          .join('') +
        '</ul></details>'
      : '';
    return (
      '<section class="usage-card" aria-label="Tiempo, tokens y coste">' +
      '<p class="usage-kicker">Tiempo · Tokens · Coste</p>' +
      '<p class="usage-total">' + esc(headline(usage)) + '</p>' +
      list +
      '</section>'
    );
  }

  var api = {
    formatMSS: formatMSS,
    compactTokens: compactTokens,
    formatEur: formatEur,
    usageFromJob: usageFromJob,
    headline: headline,
    renderBlock: renderBlock,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.HermesUsage = api;
})(typeof window !== 'undefined' ? window : globalThis);
