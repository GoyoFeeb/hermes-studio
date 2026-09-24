const form = document.getElementById('brief-form');
const viewForm = document.getElementById('view-form');
const viewJob = document.getElementById('view-job');
const existingBrandSelect = document.getElementById('existing-brand-select');
const clientNameInput = document.getElementById('client-name-input');

async function loadBrands() {
  try {
    const res = await fetch('/api/brands');
    const data = await res.json();
    existingBrandSelect.insertAdjacentHTML(
      'beforeend',
      data.brands.map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('')
    );
  } catch (err) {
    console.error('No se pudieron cargar las marcas existentes', err);
  }
}
loadBrands();

async function loadHermesStatus() {
  const el = document.getElementById('hermes-status');
  try {
    const { hermesOnline } = await (await fetch('/api/status')).json();
    el.textContent = hermesOnline
      ? '🟢 Hermes conectado.'
      : '🟠 Hermes no está conectado ahora mismo: puedes enviar igualmente, empezará cuando se conecte.';
  } catch {
    el.textContent = '';
  }
}
loadHermesStatus();
setInterval(loadHermesStatus, 60000);

// Al elegir una marca existente se rellena el nombre (editable, p. ej. "El Corte Inglés").
existingBrandSelect.addEventListener('change', () => {
  if (existingBrandSelect.value && !clientNameInput.value) {
    clientNameInput.value = existingBrandSelect.value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    const send = () =>
      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    let res = await send();

    // El prompt no menciona la marca elegida: se pide confirmación en vez de enviarlo a ciegas.
    if (res.status === 409) {
      const err = await res.json().catch(() => ({}));
      if (err.code === 'brand_mismatch') {
        if (!confirm(`${err.error}\n\nAceptar = enviar igualmente · Cancelar = revisar la marca`)) return;
        payload.confirmBrand = true;
        res = await send();
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'No se pudo enviar el brief.');
      return;
    }

    const { id } = await res.json();
    history.pushState({}, '', `?job=${id}`);
    showJobView(id);
  } finally {
    submitBtn.disabled = false;
  }
});

const STATUS_LABELS = {
  queued: 'En cola',
  running: 'Trabajando',
  completed: 'Lista',
  failed: 'Fallida',
  blocked: 'Bloqueada',
};

async function loadHistory() {
  try {
    const { jobs } = await (await fetch('/api/jobs')).json();
    const box = document.getElementById('history');
    box.hidden = jobs.length === 0;
    document.getElementById('history-list').innerHTML = jobs
      .map((j) => {
        const when = new Date(j.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
        const who = j.requesterName ? ` · ${escapeHtml(j.requesterName)}` : '';
        const pct = j.status === 'running' && j.pct != null ? ` ${j.pct}%` : '';
        return `<li><a href="?job=${encodeURIComponent(j.id)}">${escapeHtml(j.clientName)}</a>
          <span class="hint">${when}${who}</span>
          <span class="status-badge status-${escapeHtml(j.status)}">${STATUS_LABELS[j.status] || escapeHtml(j.status)}${pct}</span></li>`;
      })
      .join('');
  } catch (err) {
    console.error('No se pudo cargar el historial', err);
  }
}

document.getElementById('new-job-btn').addEventListener('click', () => {
  history.pushState({}, '', location.pathname);
  viewJob.hidden = true;
  viewForm.hidden = false;
  loadHistory();
  form.reset();
});

const PHASE_LABELS = {
  setup: 'Preparando campaña',
  '01': '01 · Briefing',
  '02': '02 · Análisis de marca',
  '03': '03 · Estructura',
  '04': '04 · Diseño',
  '05': '05 · Copy',
  '06': '06 · Datos',
  '07': '07 · Construcción del HTML',
  '08': '08 · QA',
  '09': '09 · Gate de producción',
  standalone: 'Newsletter',
  hermes: 'Hermes',
  system: 'Sistema',
};

let pollTimer = null;

function showJobView(id) {
  viewForm.hidden = true;
  viewJob.hidden = false;
  document.getElementById('job-result').hidden = true;
  document.getElementById('job-blocked').hidden = true;
  poll(id);
}

async function poll(id) {
  clearTimeout(pollTimer);
  const res = await fetch(`/api/jobs/${id}`);
  if (!res.ok) return;
  const { job, events } = await res.json();

  const statusEl = document.getElementById('job-status');
  statusEl.textContent = job.status;
  statusEl.className = `status-badge status-${job.status}`;

  renderProgress(job);

  const log = document.getElementById('job-log');
  log.innerHTML = events
    .map((ev) => `<li class="log-${ev.level}"><strong>${PHASE_LABELS[ev.phase] || ev.phase}</strong> — ${escapeHtml(ev.message)}</li>`)
    .join('');
  log.scrollTop = log.scrollHeight;

  if (job.status === 'completed') {
    document.getElementById('job-result').hidden = false;
    document.getElementById('download-link').href = `/api/jobs/${id}/result?download=1`;
    document.getElementById('preview-frame').src = `/api/jobs/${id}/result`;
    return;
  }

  if (job.status === 'blocked' || job.status === 'failed') {
    document.getElementById('job-blocked').hidden = false;
    document.getElementById('blocked-reason').textContent = job.blockedReason || job.error || 'Motivo desconocido.';
    return;
  }

  pollTimer = setTimeout(() => poll(id), 10000);
}

function formatMinutes(sec) {
  const min = Math.max(1, Math.round(sec / 60));
  return `${min} min`;
}

function renderProgress(job) {
  const box = document.getElementById('job-progress');
  const bar = document.getElementById('progress-bar');
  const track = box.querySelector('.progress-track');
  const p = job.progress;
  if (job.status === 'queued') {
    box.hidden = false;
    bar.style.width = '0%';
    track.setAttribute('aria-valuenow', '0');
    document.getElementById('progress-stage').textContent = 'En cola';
    document.getElementById('progress-eta').textContent = '';
    document.getElementById('progress-detail').textContent = 'Esperando a que Hermes lo recoja.';
    return;
  }
  if (!p || (job.status !== 'running' && job.status !== 'completed')) {
    box.hidden = job.status !== 'running';
    if (job.status === 'running') {
      document.getElementById('progress-stage').textContent = 'Arrancando Hermes';
      document.getElementById('progress-eta').textContent = '';
      document.getElementById('progress-detail').textContent = 'El progreso aparece en menos de un minuto.';
      bar.style.width = '2%';
    }
    return;
  }
  box.hidden = false;
  bar.style.width = `${p.pct}%`;
  track.setAttribute('aria-valuenow', String(p.pct));
  document.getElementById('progress-stage').textContent = `${p.stageLabel} · ${p.pct}%`;
  document.getElementById('progress-eta').textContent =
    job.status === 'completed' ? '' : p.etaSec ? `quedan ~${formatMinutes(p.etaSec)} (estimado)` : 'terminando, algo más de lo habitual';
  document.getElementById('progress-detail').textContent =
    job.status === 'completed'
      ? `Hecha en ${formatMinutes(p.elapsedSec)} · ${p.actions} acciones de Hermes.`
      : `${p.detail} · ${p.actions} acciones · ${formatMinutes(p.elapsedSec)} transcurridos`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const params = new URLSearchParams(location.search);
if (params.get('job')) {
  showJobView(params.get('job'));
} else {
  // El navegador restaura el formulario anterior (así se coló un prompt de Prozis con la marca
  // Adeslas seleccionada): cada visita empieza en blanco.
  form.reset();
  loadHistory();
}
