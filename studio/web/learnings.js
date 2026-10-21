/**
 * Vista del banco de aprendizajes (2026-10-21). La API exige una cuenta @feebbo.com.
 */
(function () {
  const KINDS = { raise: 'subió la nota', drop: 'hizo bajar la nota', qc: 'error de calidad', weak: 'criterio flojo' };
  const status = document.getElementById('status');
  const trend = document.getElementById('trend');
  const list = document.getElementById('list');

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function showTrend(data) {
    const points = data?.points || [];
    if (!points.length) {
      trend.hidden = true;
      return;
    }
    trend.hidden = false;
    const delta = data.delta;
    const deltaText = delta == null ? 'aún no hay dos tramos de 10 para comparar' : `${delta > 0 ? '+' : ''}${delta} puntos respecto a las 10 anteriores`;
    const cls = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
    trend.innerHTML =
      `<p class="meta">Nota inicial media, últimas ${Math.min(10, points.length)}</p>` +
      `<p><strong>${data.recentAvg == null ? '—' : data.recentAvg + ' %'}</strong> <span class="${cls}">${esc(deltaText)}</span></p>` +
      `<p class="meta">${points
        .slice(-12)
        .map((point) => `${esc(point.clientSlug || 'marca')} ${point.total}/${point.max}`)
        .join(' · ')}</p>`;
  }

  function group(learnings) {
    const scopes = [];
    for (const item of learnings) {
      let bucket = scopes.find((entry) => entry.scope === item.scope);
      if (!bucket) {
        bucket = { scope: item.scope, items: [] };
        scopes.push(bucket);
      }
      bucket.items.push(item);
    }
    return scopes;
  }

  function render(data) {
    status.textContent = '';
    showTrend(data.trend);
    const scopes = group(data.learnings || []);
    if (!scopes.length) {
      list.innerHTML = '<p class="hint">Todavía no hay aprendizajes. Se guardan al cerrar un trabajo con nota o con pasadas de mejora.</p>';
      return;
    }
    list.innerHTML = scopes
      .map((bucket) => {
        const title = bucket.scope === 'general' ? 'Generales' : bucket.scope;
        const cards = bucket.items
          .map(
            (item) => `<article data-id="${esc(item.id)}">
              <p class="meta">${esc(KINDS[item.kind] || item.kind)} · ${item.count} ${item.count === 1 ? 'vez' : 'veces'} · impacto ${item.impact > 0 ? '+' : ''}${item.impact}</p>
              <textarea>${esc(item.text)}</textarea>
              <div class="row">
                <button type="button" data-save>Guardar</button>
                <button type="button" class="danger" data-delete>Borrar</button>
              </div>
            </article>`
          )
          .join('');
        return `<section><h2>${esc(title)}</h2>${cards}</section>`;
      })
      .join('');
  }

  async function load() {
    const res = await fetch('/api/learnings', { headers: { Accept: 'application/json' } });
    if (res.status === 401) {
      status.textContent = 'Esta vista es solo para cuentas @feebbo.com. Entra con Google desde Studio.';
      return;
    }
    if (!res.ok) {
      status.textContent = 'No se pudo cargar el banco.';
      return;
    }
    render(await res.json());
  }

  list.addEventListener('click', async (event) => {
    const save = event.target.closest('[data-save]');
    const remove = event.target.closest('[data-delete]');
    const card = event.target.closest('article');
    if (!card || (!save && !remove)) return;
    const id = card.dataset.id;
    if (remove && !confirm('¿Borrar este aprendizaje?')) return;
    status.textContent = 'Guardando…';
    const res = remove
      ? await fetch(`/api/learnings/${encodeURIComponent(id)}`, { method: 'DELETE' })
      : await fetch(`/api/learnings/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: card.querySelector('textarea').value }),
        });
    if (!res.ok) {
      status.textContent = res.status === 401 ? 'Esta vista es solo para cuentas @feebbo.com.' : 'No se pudo guardar.';
      return;
    }
    render(await res.json());
  });

  load().catch(() => {
    status.textContent = 'No se pudo cargar el banco.';
  });
})();
