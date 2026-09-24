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

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

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

document.getElementById('new-job-btn').addEventListener('click', () => {
  history.pushState({}, '', location.pathname);
  viewJob.hidden = true;
  viewForm.hidden = false;
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

  pollTimer = setTimeout(() => poll(id), 3000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const params = new URLSearchParams(location.search);
if (params.get('job')) {
  showJobView(params.get('job'));
}
