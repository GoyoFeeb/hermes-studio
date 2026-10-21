/**
 * results.js — una pieza terminada por página (2026-10-21).
 *
 * Pinta la ficha que devuelve GET /api/results. Sin red: app.js pide la página y navega
 * con ?results=1&job=. Anterior / Siguiente viven en index.html.
 */
(function (root) {
  'use strict';

  var Usage = null;
  if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
    try { Usage = require('./usageCard.js'); } catch (err) { Usage = null; }
  }
  function usageApi() {
    return Usage || (root && root.HermesUsage) || null;
  }

  var STATUS = { ok: 'Correcto', warning: 'Aviso', error: 'Error' };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function jobUrl(id) {
    return '?results=1&job=' + encodeURIComponent(id);
  }

  function positionLabel(page) {
    var total = page && page.total ? page.total : 0;
    if (!total) return '0 de 0';
    var index = (page.offset || 0) + 1;
    return index + ' de ' + total;
  }

  function formatWhen(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  function formatDuration(sec) {
    if (sec == null || !isFinite(Number(sec))) return '—';
    var s = Math.max(0, Math.round(Number(sec)));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function scoreLine(art) {
    if (!art) return 'Sin nota visual';
    return art.score + '/' + art.max + (art.pct != null ? ' · ' + art.pct + ' %' : '');
  }

  function qualityLine(quality) {
    if (!quality) return 'Sin control de calidad';
    if (quality.errors) return quality.errors + (quality.errors === 1 ? ' error' : ' errores');
    if (quality.warnings) return quality.warnings + (quality.warnings === 1 ? ' aviso' : ' avisos');
    return 'Correcto';
  }

  function criteriaList(art) {
    if (!art || !art.criteria || !art.criteria.length) return '';
    return (
      '<ul class="results-criteria">' +
      art.criteria
        .map(function (row) {
          return '<li><span>' + esc(row.label) + '</span><b>' + esc(row.score) + '/5</b></li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function checksList(quality) {
    if (!quality || !quality.checks || !quality.checks.length) return '';
    return (
      '<ul class="results-checks">' +
      quality.checks
        .map(function (row) {
          var name = STATUS[row.status] || row.status;
          return '<li><span>' + esc(row.label) + '</span><b>' + esc(name) + '</b></li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function safeUrl(url) {
    return /^https:\/\/[^\s"'<>]+$/.test(url || '') ? url : '';
  }

  function safePreview(url) {
    return /^\/api\/jobs\/[a-z0-9-]+\/(?:result|channel-b)$/.test(url || '') ? url : '';
  }

  function improveSection(imp) {
    if (!imp || !imp.passes || !imp.passes.length) return '';
    var n = imp.passes.length;
    var summary = [
      imp.initial && imp.final ? imp.initial + ' → ' + imp.final : '',
      n + (n === 1 ? ' pasada' : ' pasadas'),
      formatDuration(imp.durationSec),
    ]
      .filter(Boolean)
      .join(' · ');
    if (!imp.reached && imp.belowMax && imp.belowMax.length) summary += '. Siguen por debajo: ' + imp.belowMax.join(', ');
    else if (!imp.reached && imp.qcErrors) summary += '. Quedan ' + imp.qcErrors + (imp.qcErrors === 1 ? ' error de calidad' : ' errores de calidad');
    var steps = imp.passes
      .map(function (pass) {
        var line =
          'Pasada ' +
          pass.n +
          ' · ' +
          (pass.before || '—') +
          ' → ' +
          (pass.after || 'sin nota') +
          ' · ' +
          formatDuration(pass.durationSec) +
          ' · ' +
          (pass.kept ? 'se queda' : 'se descarta');
        var criteria = (pass.criteria || [])
          .map(function (row) {
            var change =
              row.after == null || row.after === row.before ? row.before + '/5' : row.before + '/5 → ' + row.after + '/5';
            return '<li>' + esc(row.label) + ': ' + esc(change) + '</li>';
          })
          .join('');
        var changed = (pass.changed || [])
          .map(function (line) {
            return '<li>' + esc(line) + '</li>';
          })
          .join('');
        return (
          '<li><p>' +
          esc(line) +
          '</p>' +
          (pass.reason ? '<p class="hint">' + esc(pass.reason) + '</p>' : '') +
          (criteria ? '<ul>' + criteria + '</ul>' : '') +
          (changed ? '<ul>' + changed + '</ul>' : '') +
          '</li>'
        );
      })
      .join('');
    return '<section class="results-improve"><h3>Iteraciones de mejora</h3><p>' + esc(summary) + '</p><ol>' + steps + '</ol></section>';
  }

  function versionBlock(version) {
    if (!version) return '<p class="hint">No hay versión B.</p>';
    var preview = safePreview(version.preview);
    return (
      '<section class="results-version">' +
      '<h3>Versión ' + esc(version.label) + '</h3>' +
      '<p>Nota visual: ' + esc(scoreLine(version.art)) + '</p>' +
      criteriaList(version.art) +
      '<p>Control de calidad: ' + esc(qualityLine(version.quality)) + '</p>' +
      checksList(version.quality) +
      (version.label === 'B' ? improveSection(version.improve) : '') +
      '<iframe class="results-frame" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Vista previa ' +
      esc(version.label) +
      '" src="' +
      esc(preview) +
      '"></iframe>' +
      '</section>'
    );
  }

  function renderUsage(item) {
    var U = usageApi();
    if (!U) return '';
    var usage = item && item.usage ? item.usage : { known: false };
    return U.renderBlock(usage);
  }

  function render(page) {
    var item = page && page.items && page.items[0];
    if (!item) return '<p class="results-empty">Aún no hay piezas terminadas.</p>';
    var taskHref = safeUrl(item.clickupUrl);
    var task = taskHref
      ? '<a href="' + esc(taskHref) + '" target="_blank" rel="noopener">Tarea en ClickUp</a>'
      : '—';
    return (
      '<header class="results-meta">' +
      '<p class="results-client">' + esc(item.clientName || '—') + '</p>' +
      renderUsage(item) +
      '<dl>' +
      '<div><dt>Campaña</dt><dd>' + esc(item.campaignName || item.title || '—') + '</dd></div>' +
      '<div><dt>Tarea</dt><dd>' + task + '</dd></div>' +
      '<div><dt>Quién la pidió</dt><dd>' + esc(item.requesterName || '—') + '</dd></div>' +
      '<div><dt>Fecha</dt><dd>' + esc(formatWhen(item.finishedAt || item.createdAt)) + '</dd></div>' +
      '<div><dt>Duración</dt><dd>' + esc(formatDuration(item.durationSec)) + '</dd></div>' +
      '<div><dt>Nota visual</dt><dd>' + esc(scoreLine(item.art)) + '</dd></div>' +
      '<div><dt>Control de calidad</dt><dd>' + esc(qualityLine(item.quality)) + '</dd></div>' +
      '</dl>' +
      '<p><a href="?job=' + esc(encodeURIComponent(item.id)) + '">Abrir el trabajo</a></p>' +
      '</header>' +
      criteriaList(item.art) +
      checksList(item.quality) +
      improveSection(item.improve) +
      '<div class="results-versions">' +
      versionBlock(item.versions && item.versions.a) +
      versionBlock(item.versions && item.versions.b) +
      '</div>'
    );
  }

  var api = {
    jobUrl: jobUrl,
    positionLabel: positionLabel,
    formatWhen: formatWhen,
    formatDuration: formatDuration,
    render: render,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesResults = api;
})(this);
