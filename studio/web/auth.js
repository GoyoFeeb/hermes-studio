// Cuentas del equipo (2026-10-13, ver studio/server/auth.ts). Se carga antes que app.js.
//
// Al volver de Google, Supabase deja el resultado en el fragmento de la dirección (#access_token=…): se quita de
// la barra antes que nada y se canjea en el servidor por la sesión de Studio. Sin sesión, se enseña la pantalla
// de entrada encima de la aplicación; al entrar se recarga. Si el servidor no tiene cuentas configuradas, no
// hace nada y todo sigue como antes (contraseña compartida con el diálogo del navegador).
// Con cuentas, la contraseña del equipo se escribe en la tarjeta de entrada (2026-10-14).
(function () {
  var fragment = new URLSearchParams(location.hash.slice(1));
  var accessToken = fragment.get('access_token');
  var loginError = fragment.get('error_description');
  if (accessToken || fragment.get('error')) history.replaceState(null, '', location.pathname + location.search);

  function json(url, options) {
    return fetch(url, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, body: body }; });
    });
  }

  function showLogin(me, message) {
    var box = document.getElementById('login-screen');
    if (!box) return;
    var google = document.getElementById('login-google');
    var password = document.getElementById('login-password');
    var note = document.getElementById('login-note');
    var error = document.getElementById('login-error');
    note.textContent = me.google ? 'Con tu cuenta de ' + me.google.domains.map(function (d) { return '@' + d; }).join(' o ') + '.' : '';
    google.hidden = !me.google;
    password.hidden = !me.password;
    error.textContent = message || '';
    error.hidden = !message;
    if (!me.google && me.password) document.getElementById('login-pass-form').hidden = false;
    google.onclick = function () {
      // Vuelve a esta misma página (también a un enlace directo a una newsletter).
      location.href = me.google.url + '&redirect_to=' + encodeURIComponent(location.origin + location.pathname + location.search);
    };
    // La contraseña del equipo se escribe en la tarjeta (auditoría de UX 2026-10-14, H-01): antes abría el diálogo del
    // navegador y, al cancelarlo, quedaba una página en blanco con «Autenticación requerida.».
    var passForm = document.getElementById('login-pass-form');
    var passInput = document.getElementById('login-pass-input');
    var passSubmit = document.getElementById('login-pass-submit');
    function showError(text) {
      error.textContent = text || '';
      error.hidden = !text;
    }
    password.onclick = function () {
      passForm.hidden = !passForm.hidden;
      password.setAttribute('aria-expanded', String(!passForm.hidden));
      if (!passForm.hidden) passInput.focus();
    };
    passForm.onsubmit = function (e) {
      e.preventDefault();
      if (!passInput.value) return passInput.focus();
      passSubmit.disabled = true;
      showError('');
      json('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: passInput.value }) })
        .then(function (r) {
          if (r.ok) return location.reload();
          passSubmit.disabled = false;
          showError(r.body.error || 'Contraseña incorrecta. Vuelve a intentarlo o entra con Google.');
          passInput.select();
        })
        .catch(function () {
          passSubmit.disabled = false;
          showError('No hay conexión con Studio. Vuelve a intentarlo en un momento.');
        });
    };
    box.hidden = false;
    document.documentElement.classList.add('needs-login');
    // H-02: lo de detrás no se puede tocar ni lo lee el lector de pantalla mientras se ve la entrada.
    ['app', 'side-menu'].forEach(function (id) { var el = document.getElementById(id); if (el) el.inert = true; });
    document.querySelectorAll('body > header, body > aside, body > footer, body > .skip-link').forEach(function (el) { el.inert = true; });
    (me.google ? google : password).focus();
  }

  function start(me) {
    if (!me || me.open || !me.google) return; // sin cuentas configuradas: como siempre
    if (me.user) {
      if (me.user.via === 'google') {
        // «Pidiendo como…» sale de la cuenta: no se escribe ni se cambia a mano.
        try { localStorage.setItem('requesterName', me.user.name || ''); } catch (e) {}
        document.documentElement.classList.add('has-account');
      }
      document.documentElement.classList.add('has-session');
      return;
    }
    showLogin(me, loginError);
  }

  var ready = accessToken
    ? json('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: accessToken }) }).then(function (r) {
        if (!r.ok) loginError = r.body.error || 'No se ha podido iniciar sesión.';
      })
    : Promise.resolve();

  // app.js espera a esto antes de pedir nada: así no carga datos con una sesión a medio crear.
  window.hermesAuthReady = ready
    .then(function () { return json('/api/auth/me'); })
    .then(function (r) {
      var run = function () { start(r.ok ? r.body : null); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
      else run();
      return r.ok ? r.body : null;
    })
    .catch(function () { return null; });

  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('#account-logout, #menu-logout')) return;
    fetch('/api/auth/logout', { method: 'POST' }).then(function () { location.reload(); });
  });
})();
