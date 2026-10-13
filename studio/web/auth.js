// Cuentas del equipo (2026-10-13, ver studio/server/auth.ts). Se carga antes que app.js.
//
// Al volver de Google, Supabase deja el resultado en el fragmento de la dirección (#access_token=…): se quita de
// la barra antes que nada y se canjea en el servidor por la sesión de Studio. Sin sesión, se enseña la pantalla
// de entrada encima de la aplicación; al entrar se recarga. Si el servidor no tiene cuentas configuradas, no
// hace nada y todo sigue como antes (contraseña compartida con el diálogo del navegador).
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
    google.onclick = function () {
      // Vuelve a esta misma página (también a un enlace directo a una newsletter).
      location.href = me.google.url + '&redirect_to=' + encodeURIComponent(location.origin + location.pathname + location.search);
    };
    password.onclick = function () { location.href = '/api/auth/password'; };
    box.hidden = false;
    document.documentElement.classList.add('needs-login');
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
    if (!e.target.closest || !e.target.closest('#account-logout')) return;
    fetch('/api/auth/logout', { method: 'POST' }).then(function () { location.reload(); });
  });
})();
