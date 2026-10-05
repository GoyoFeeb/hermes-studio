/**
 * metacheck.js — avisos de asunto y preheader (2026-10-05).
 *
 * La pestaña «Asunto y bandeja» ya enseñaba cómo se ve la fila en Gmail, pero no avisaba de lo típico: el preheader
 * que repite el asunto (la pieza de Nike: «Crece con cada zancada» / «Crece con cada zancada: la supertrainer…»),
 * que falte o que sea tan corto que Gmail lo complete con el primer texto del correo, o el asunto que en móvil se
 * corta. Script clásico en la página (window.HermesMetaCheck) y módulo en los tests (metacheck.test.js).
 */
(function (root) {
  'use strict';

  var PRE_SHORT = 35; // por debajo, Gmail completa la línea con el primer texto de la pieza

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  /** `mobileSubjectChars`: caracteres del asunto que se leen en un móvil (los calcula la página midiendo). */
  function checkMeta(subject, preheader, opts) {
    var mobile = opts && typeof opts.mobileSubjectChars === 'number' ? opts.mobileSubjectChars : null;
    var s = norm(subject);
    var p = norm(preheader);
    var out = [];
    if (!s) out.push({ level: 'warning', text: 'Sin asunto: el HTML no trae <title>. Escríbelo en tu plataforma de envío.' });
    if (!p) {
      out.push({ level: 'warning', text: 'Sin preheader: Gmail enseñará al lado del asunto el primer texto de la pieza.' });
    } else if (s && (p === s || p.indexOf(s) === 0)) {
      out.push({ level: 'warning', text: 'El preheader empieza repitiendo el asunto: en la bandeja se lee dos veces. Mejor que añada algo nuevo.' });
    } else if (s && s.length >= 12 && p.indexOf(s) !== -1) {
      out.push({ level: 'warning', text: 'El preheader contiene el asunto entero: en la bandeja se lee dos veces.' });
    } else if (String(preheader).trim().length < PRE_SHORT) {
      out.push({ level: 'info', text: 'Preheader corto (' + String(preheader).trim().length + ' caracteres): Gmail completa la línea con el primer texto de la pieza.' });
    }
    if (s && mobile !== null && mobile < String(subject).length) {
      out.push({ level: 'info', text: 'En móvil el asunto se corta tras «' + String(subject).slice(0, mobile).trimEnd() + '…»: lo importante debería ir antes.' });
    }
    return out;
  }

  var api = { checkMeta: checkMeta };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesMetaCheck = api;
})(this);
