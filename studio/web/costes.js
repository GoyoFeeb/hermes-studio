/**
 * costes.js — tabla de costes de Hermes Studio (2026-10-20).
 *
 * Filtra por fecha y por quien pidió el trabajo, suma tokens y euros, y arma el CSV.
 * Sin DOM: la página (app.js) pinta la tabla. Fechas en Europe/Madrid.
 * Script clásico en la página (window.HermesCostes) y módulo en los tests.
 */
(function (root) {
  'use strict';

  var STATUS = {
    queued: 'En cola',
    running: 'Trabajando',
    review: 'Brief por revisar',
    completed: 'Lista para revisar',
    failed: 'Fallida',
    blocked: 'Bloqueada',
    cancelled: 'Cancelada',
  };

  var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var NONE = '__none__';

  function dayParts(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    var fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    var bag = {};
    fmt.formatToParts(d).forEach(function (part) {
      if (part.type !== 'literal') bag[part.type] = part.value;
    });
    return bag;
  }

  /** Día del trabajo (cuando empezó, o cuando se creó) en YYYY-MM-DD, hora de Madrid. */
  function dayKey(job) {
    var parts = dayParts(job.startedAt || job.createdAt);
    if (!parts) return '';
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function formatDate(job) {
    var parts = dayParts(job.startedAt || job.createdAt);
    if (!parts) return '—';
    var month = MONTHS[Number(parts.month) - 1] || parts.month;
    return Number(parts.day) + ' ' + month + ' ' + parts.year;
  }

  function formatTime(iso) {
    var parts = dayParts(iso);
    if (!parts) return '—';
    return parts.hour + ':' + parts.minute;
  }

  function formatDuration(sec) {
    if (sec == null || !isFinite(Number(sec))) return '—';
    var s = Math.max(0, Math.round(Number(sec)));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    if (h) return h + ' h ' + String(m).padStart(2, '0') + ' min';
    if (m) return m + ' min' + (r ? ' ' + r + ' s' : '');
    return r + ' s';
  }

  function hasTokenData(job) {
    return (Number(job && job.inputTokens) || 0) + (Number(job && job.outputTokens) || 0) + (Number(job && job.cacheTokens) || 0) > 0;
  }

  function formatTokens(n) {
    if (n == null || n === '' || !isFinite(Number(n))) return '—';
    var x = Math.round(Number(n));
    var sign = x < 0 ? '-' : '';
    return sign + String(Math.abs(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatEur(n) {
    if (n == null || n === '' || !isFinite(Number(n))) return '—';
    var x = Number(n);
    var sign = x < 0 ? '-' : '';
    var abs = Math.abs(x);
    var parts = abs.toFixed(4).split('.');
    var frac = parts[1].replace(/0+$/, '');
    if (frac.length < 2) frac = (parts[1] + '00').slice(0, 2);
    var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return sign + whole + ',' + frac + ' €';
  }

  function statusLabel(status) {
    return STATUS[status] || status || '—';
  }

  function requesterName(job) {
    return String(job.requester || job.requesterName || '').trim();
  }

  function requesterValue(job) {
    return requesterName(job) || NONE;
  }

  /** Trabajos que caen en el rango de fechas (inclusive) y en la persona. */
  function filterJobs(jobs, opts) {
    var from = (opts && opts.from) || '';
    var to = (opts && opts.to) || '';
    var who = (opts && opts.requester) || '';
    return (jobs || []).filter(function (job) {
      var day = dayKey(job);
      if (from && (!day || day < from)) return false;
      if (to && (!day || day > to)) return false;
      if (who && requesterValue(job) !== who) return false;
      return true;
    });
  }

  function sum(jobs, key) {
    return (jobs || []).reduce(function (acc, job) {
      var n = Number(job[key]);
      return acc + (isFinite(n) ? n : 0);
    }, 0);
  }

  function totals(jobs) {
    return {
      jobs: (jobs || []).length,
      inputTokens: sum(jobs, 'inputTokens'),
      outputTokens: sum(jobs, 'outputTokens'),
      cacheTokens: sum(jobs, 'cacheTokens'),
      costEur: sum(jobs, 'costEur'),
    };
  }

  function requesterOptions(jobs) {
    var seen = {};
    (jobs || []).forEach(function (job) {
      seen[requesterValue(job)] = requesterName(job) || 'Sin nombre';
    });
    return Object.keys(seen)
      .sort(function (a, b) {
        return seen[a].localeCompare(seen[b], 'es');
      })
      .map(function (value) {
        return { value: value, label: seen[value] };
      });
  }

  function jobHref(job, origin) {
    var base = String(origin || '').replace(/\/$/, '');
    return base + '/?job=' + encodeURIComponent(job.id);
  }

  function csvCell(value) {
    var s = value == null ? '' : String(value);
    if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function csvEur(n) {
    if (n == null || !isFinite(Number(n))) return '';
    return Number(n).toFixed(4).replace('.', ',');
  }

  function csvInt(n) {
    if (n == null || !isFinite(Number(n))) return '';
    return String(Math.round(Number(n)));
  }

  /** CSV con separador ; y coma decimal, para Excel en español. La primera línea es el BOM. */
  function toCsv(jobs, origin) {
    var header = ['Enlace', 'Marca', 'Quién', 'Fecha', 'Inicio', 'Fin', 'Duración', 'Estado', 'Tokens entrada', 'Tokens salida', 'Tokens caché', 'Coste EUR'];
    var lines = [header.join(';')];
    (jobs || []).forEach(function (job) {
      lines.push(
        [
          jobHref(job, origin),
          job.clientName || '',
          requesterName(job),
          formatDate(job),
          job.startedAt ? formatTime(job.startedAt) : '',
          job.finishedAt ? formatTime(job.finishedAt) : '',
          job.durationSec != null ? formatDuration(job.durationSec) : '',
          statusLabel(job.status),
          csvInt(job.inputTokens),
          csvInt(job.outputTokens),
          csvInt(job.cacheTokens),
          csvEur(job.costEur),
        ]
          .map(csvCell)
          .join(';')
      );
    });
    var all = totals(jobs);
    lines.push(
      ['', 'Total', '', '', '', '', String(all.jobs), '', csvInt(all.inputTokens), csvInt(all.outputTokens), csvInt(all.cacheTokens), csvEur(all.costEur)].join(';')
    );
    return '\uFEFF' + lines.join('\n') + '\n';
  }

  var api = {
    NONE: NONE,
    dayKey: dayKey,
    formatDate: formatDate,
    formatTime: formatTime,
    formatDuration: formatDuration,
    hasTokenData: hasTokenData,
    formatTokens: formatTokens,
    formatEur: formatEur,
    statusLabel: statusLabel,
    requesterName: requesterName,
    requesterValue: requesterValue,
    filterJobs: filterJobs,
    totals: totals,
    requesterOptions: requesterOptions,
    jobHref: jobHref,
    toCsv: toCsv,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesCostes = api;
})(this);
