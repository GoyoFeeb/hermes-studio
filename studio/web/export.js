/**
 * export.js — "Copiar" y "Descargar" para una plataforma de envío, con UTM (2026-09-28).
 *
 * Hermes escribe las variables genéricas {{unsubscribe_url}}, {{view_url}} y {{preferences_url}}: cada
 * plataforma usa las suyas y había que cambiarlas a mano tras pegar. Aquí se traducen al exportar y, si se
 * pide, se añaden parámetros UTM a todos los enlaces de la pieza, también a los botones de Outlook (VML en
 * <!--[if mso]>). La newsletter guardada en Studio no cambia: solo lo que se copia o se descarga.
 * Sin DOM, sobre el HTML como texto: el resto de la pieza queda igual byte a byte.
 * Script clásico en la página (window.HermesExport) y módulo en los tests (studio/web/export.test.js).
 */
(function (root) {
  'use strict';

  /** Variables de cada plataforma. Solo las que se sabe seguras; las que falten se avisan y no se tocan. */
  var PLATFORMS = {
    generic: { label: 'Genérico (sin cambios)', vars: {} },
    mailchimp: { label: 'Mailchimp', vars: { unsubscribe_url: '*|UNSUB|*', view_url: '*|ARCHIVE|*', preferences_url: '*|UPDATE_PROFILE|*' } },
    brevo: { label: 'Brevo', vars: { unsubscribe_url: '{{ unsubscribe }}', view_url: '{{ mirror }}', preferences_url: '{{ update_profile }}' } },
    hubspot: { label: 'HubSpot', vars: { unsubscribe_url: '{{ unsubscribe_link_all }}', view_url: '{{ view_as_page_url }}', preferences_url: '{{ unsubscribe_link }}' } },
    klaviyo: { label: 'Klaviyo', vars: { unsubscribe_url: '{% unsubscribe_url %}', preferences_url: '{% manage_preferences_url %}' } },
    sfmc: { label: 'Salesforce Marketing Cloud', vars: { unsubscribe_url: '%%unsub_center_url%%', view_url: '%%view_email_url%%', preferences_url: '%%profile_center_url%%' } },
  };

  var VAR_RE = /\{\{\s*(unsubscribe_url|view_url|preferences_url)\s*\}\}/g;

  function decodeAmp(s) {
    return s.replace(/&amp;/gi, '&');
  }

  function encodeAmp(s) {
    return s.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;');
  }

  /** Añade los UTM a una URL http(s) sin tocar los que ya tenga (la marca puede llevar los suyos). */
  function withUtm(url, utm) {
    var m = url.match(/^(https?:\/\/[^?#]*)(\?[^#]*)?(#.*)?$/i);
    if (!m) return url;
    var query = m[2] ? m[2].slice(1) : '';
    var present = {};
    query.split('&').forEach(function (pair) {
      if (!pair) return;
      var key = pair.split('=')[0];
      try {
        key = decodeURIComponent(key);
      } catch (e) {
        // parámetro mal codificado: se compara tal cual
      }
      present[key.toLowerCase()] = true;
    });
    var add = [];
    ['source', 'medium', 'campaign', 'content'].forEach(function (k) {
      var v = utm[k];
      if (v && !present['utm_' + k]) add.push('utm_' + k + '=' + encodeURIComponent(v));
    });
    if (!add.length) return url;
    return m[1] + '?' + (query ? query + '&' : '') + add.join('&') + (m[3] || '');
  }

  /** Etiquetas cuyo href es un destino al que se hace clic: <a>, <area> y los botones VML de Outlook. */
  var HREF_RE = /(<(?:a|area|v:roundrect|v:rect|v:shape|v:oval)\b[^>]*?\bhref\s*=\s*)("([^"]*)"|'([^']*)')/gi;

  /**
   * Prepara el HTML para exportar. opts: { platform, utm: { source, medium, campaign, content } | null }.
   * Devuelve { html, replaced: { var: n }, missing: [vars sin equivalente], utmLinks: n }.
   */
  function prepare(html, opts) {
    var platform = PLATFORMS[opts && opts.platform] || PLATFORMS.generic;
    var replaced = {};
    var missing = {};
    var out = String(html).replace(VAR_RE, function (whole, name) {
      var to = platform.vars[name];
      if (!to) {
        if (platform !== PLATFORMS.generic) missing[name] = true;
        return whole;
      }
      replaced[name] = (replaced[name] || 0) + 1;
      return to;
    });
    var utmLinks = 0;
    var utm = opts && opts.utm;
    if (utm && (utm.source || utm.medium || utm.campaign || utm.content)) {
      out = out.replace(HREF_RE, function (whole, head, quoted, dq, sq) {
        var raw = dq != null ? dq : sq;
        var url = decodeAmp(raw.trim());
        if (!/^https?:\/\//i.test(url)) return whole;
        var tagged = withUtm(url, utm);
        if (tagged === url) return whole;
        utmLinks++;
        var q = dq != null ? '"' : "'";
        return head + q + encodeAmp(tagged) + q;
      });
    }
    return { html: out, replaced: replaced, missing: Object.keys(missing), utmLinks: utmLinks };
  }

  /** Campaña por defecto: marca y fecha, en minúsculas y sin acentos (p. ej. "nike-2026-09-28"). */
  function defaultCampaign(brand, isoDate) {
    var slug = String(brand || 'newsletter')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return (slug || 'newsletter') + '-' + String(isoDate || '').slice(0, 10);
  }

  var api = { PLATFORMS: PLATFORMS, prepare: prepare, withUtm: withUtm, defaultCampaign: defaultCampaign };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesExport = api;
})(this);
