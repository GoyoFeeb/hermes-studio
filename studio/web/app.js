const form = document.getElementById('brief-form');
const viewForm = document.getElementById('view-form');
const viewJob = document.getElementById('view-job');
const hero = document.querySelector('.hero');
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
const brandsReady = loadBrands();

async function loadHermesStatus() {
  const el = document.getElementById('hermes-status');
  try {
    const { hermesOnline } = await (await fetch('/api/status')).json();
    el.textContent = hermesOnline ? 'Hermes conectado' : 'Hermes desconectado';
    el.className = `status-pill ${hermesOnline ? 'is-online' : 'is-offline'}`;
    el.title = hermesOnline ? '' : 'Puedes enviar igualmente: empezará cuando Hermes se conecte.';
  } catch {
    el.textContent = '';
    el.className = 'status-pill';
  }
}
loadHermesStatus();
setInterval(loadHermesStatus, 60000);

// Instrucción rápida (Hermes escribe antes el brief con la skill newsletter-creative-brief) o
// prompt completo ya generado con la skill.
const KIND_COPY = {
  instruction: {
    label: 'Instrucción',
    rows: 4,
    placeholder: 'Ej: quiero una newsletter de Adeslas para presentar su seguro dental a familias',
    hint: 'Hermes escribe primero el brief creativo con la skill newsletter-creative-brief (HTML standalone) y luego hace la newsletter.',
  },
  brief: {
    label: 'Prompt creativo',
    rows: 14,
    placeholder: 'Pega aquí el prompt generado con la skill newsletter-creative-brief.',
    hint: 'Hermes ejecuta el prompt tal cual.',
  },
};

function applyKind() {
  const kind = form.querySelector('input[name="inputKind"]:checked')?.value || 'instruction';
  const copy = KIND_COPY[kind];
  const input = document.getElementById('prompt-input');
  document.getElementById('prompt-label').textContent = copy.label;
  document.getElementById('kind-hint').textContent = copy.hint;
  input.placeholder = copy.placeholder;
  input.rows = copy.rows;
  input.style.minHeight = kind === 'instruction' ? '0' : '';
}
form.querySelectorAll('input[name="inputKind"]').forEach((r) => r.addEventListener('change', applyKind));
form.addEventListener('reset', () => setTimeout(applyKind));

function setKind(kind) {
  form.querySelector(`input[name="inputKind"][value="${kind}"]`).checked = true;
  applyKind();
}

// Al elegir una marca existente se rellena el nombre (editable, p. ej. "El Corte Inglés").
existingBrandSelect.addEventListener('change', () => {
  if (existingBrandSelect.value && !clientNameInput.value) {
    clientNameInput.value = prettyBrand(existingBrandSelect.value);
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

const IMAGE_LABELS = { official: 'Assets oficiales', ai: 'Imágenes con IA' };

// ---------------------------------------------------------------- historial

const HISTORY_PAGE = 20;
const historyState = { jobs: [], query: '', brand: '', status: '', shown: HISTORY_PAGE };
let historyTimer = null;

async function loadHistory() {
  clearTimeout(historyTimer);
  try {
    const { jobs } = await (await fetch('/api/jobs')).json();
    historyState.jobs = jobs;
    document.getElementById('history').hidden = jobs.length === 0;

    const brandSelect = document.getElementById('history-brand');
    const current = brandSelect.value;
    const brands = [...new Map(jobs.map((j) => [j.clientSlug || j.clientName, j.clientName])).entries()].sort((a, b) =>
      a[1].localeCompare(b[1], 'es')
    );
    brandSelect.innerHTML =
      '<option value="">Todas las marcas</option>' +
      brands.map(([slug, name]) => `<option value="${escapeHtml(slug)}">${escapeHtml(name)}</option>`).join('');
    brandSelect.value = brands.some(([slug]) => slug === current) ? current : '';

    renderHistory();
    // Mientras haya trabajos en curso, el historial se refresca solo.
    if (jobs.some((j) => j.status === 'running' || j.status === 'queued')) {
      historyTimer = setTimeout(loadHistory, 20000);
    }
  } catch (err) {
    console.error('No se pudo cargar el historial', err);
  }
}

function filteredJobs() {
  const q = normalize(historyState.query);
  return historyState.jobs.filter((j) => {
    if (historyState.brand && (j.clientSlug || j.clientName) !== historyState.brand) return false;
    if (historyState.status === 'active' && j.status !== 'running' && j.status !== 'queued') return false;
    if (historyState.status === 'completed' && j.status !== 'completed') return false;
    if (historyState.status === 'failed' && j.status !== 'failed' && j.status !== 'blocked') return false;
    if (q && !normalize(`${j.clientName} ${j.requesterName || ''}`).includes(q)) return false;
    return true;
  });
}

function renderHistory() {
  const list = filteredJobs();
  const visible = list.slice(0, historyState.shown);
  const total = historyState.jobs.length;
  document.getElementById('history-count').textContent =
    list.length === total ? `${total} trabajo${total === 1 ? '' : 's'}` : `${list.length} de ${total}`;
  document.getElementById('history-empty').hidden = list.length > 0;
  document.getElementById('history-more').hidden = list.length <= visible.length;

  document.getElementById('history-list').innerHTML = visible
    .map((j) => {
      const id = encodeURIComponent(j.id);
      const when = new Date(j.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
      const meta = [when, j.requesterName, j.fromInstruction ? 'Desde instrucción' : null, IMAGE_LABELS[j.imageMode], j.status === 'completed' && j.elapsedSec ? formatMinutes(j.elapsedSec) : null]
        .filter(Boolean)
        .map(escapeHtml)
        .join(' · ');
      const running = j.status === 'running' && j.pct != null;
      const label = (STATUS_LABELS[j.status] || j.status) + (running ? ` · ${j.pct}%` : '');
      const actions = [
        `<a class="btn btn-ghost" href="?job=${id}">Ver</a>`,
        j.status === 'completed' ? `<a class="btn btn-ghost" href="/api/jobs/${id}/result?download=1">Descargar</a>` : '',
        `<button type="button" class="btn btn-secondary" data-reuse="${escapeHtml(j.id)}">Reutilizar</button>`,
      ].join('');
      return `<li class="job-row">
          <a class="name" href="?job=${id}">${escapeHtml(j.clientName)}</a>
          <span class="status-badge status-${escapeHtml(j.status)}">${escapeHtml(label)}</span>
          <p class="meta">${meta}</p>
          <div class="row-actions">${actions}</div>
          ${running ? `<div class="mini-track"><div style="width:${Number(j.pct) || 0}%"></div></div>` : ''}
          ${j.error ? `<p class="err">${escapeHtml(j.error)}</p>` : ''}
        </li>`;
    })
    .join('');
}

document.getElementById('history-search').addEventListener('input', (e) => {
  historyState.query = e.target.value;
  historyState.shown = HISTORY_PAGE;
  renderHistory();
});
document.getElementById('history-brand').addEventListener('change', (e) => {
  historyState.brand = e.target.value;
  historyState.shown = HISTORY_PAGE;
  renderHistory();
});
document.getElementById('history-status').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#history-status .chip').forEach((c) => c.classList.toggle('is-active', c === chip));
  historyState.status = chip.dataset.status;
  historyState.shown = HISTORY_PAGE;
  renderHistory();
});
document.getElementById('history-more').addEventListener('click', () => {
  historyState.shown += HISTORY_PAGE;
  renderHistory();
});
document.getElementById('history-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-reuse]');
  if (btn) reuseJob(btn.dataset.reuse);
});

// "Reutilizar": rellena el formulario con la marca, el prompt y el modo de imágenes de un trabajo
// anterior (para relanzar uno fallido o hacer una variante). No se envía hasta pulsar Generar.
async function reuseJob(id, { useBrief = false } = {}) {
  const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
  if (!res.ok) return alert('No se pudo cargar ese trabajo.');
  const { job } = await res.json();
  showFormView();
  await brandsReady;
  form.reset();
  const slug = job.input.clientSlug || '';
  existingBrandSelect.value = [...existingBrandSelect.options].some((o) => o.value === slug) ? slug : '';
  clientNameInput.value = job.input.clientName || '';
  setKind(job.input.instruction ? 'instruction' : 'brief');
  document.getElementById('prompt-input').value = job.input.instruction || job.input.briefText || '';
  document.getElementById('requester-input').value = job.input.requesterName || '';
  if (useBrief && job.input.briefText) {
    setKind('brief');
    document.getElementById('prompt-input').value = job.input.briefText;
  }
  const radio = form.querySelector(`input[name="imageMode"][value="${job.input.imageMode}"]`);
  if (radio) radio.checked = true;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('prompt-input').focus({ preventScroll: true });
}

// ---------------------------------------------------------------- vistas

function showFormView() {
  clearTimeout(pollTimer);
  currentJob = null;
  history.pushState({}, '', location.pathname);
  viewJob.hidden = true;
  viewForm.hidden = false;
  hero.hidden = false;
  loadHistory();
}

document.getElementById('new-job-btn').addEventListener('click', () => {
  showFormView();
  form.reset();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.getElementById('reuse-btn').addEventListener('click', () => {
  if (currentJob) reuseJob(currentJob);
});
document.getElementById('use-brief-btn').addEventListener('click', () => {
  if (currentJob) reuseJob(currentJob, { useBrief: true });
});
window.addEventListener('popstate', () => route());

const PHASE_LABELS = {
  setup: 'Preparando campaña',
  standalone: 'Newsletter',
  hermes: 'Hermes',
  system: 'Sistema',
};

let pollTimer = null;
let currentJob = null;

function showJobView(id) {
  clearTimeout(historyTimer);
  currentJob = id;
  viewForm.hidden = true;
  hero.hidden = true;
  viewJob.hidden = false;
  document.getElementById('job-result').hidden = true;
  document.getElementById('job-blocked').hidden = true;
  document.getElementById('preview-frame').removeAttribute('src');
  document.getElementById('brief-box').hidden = true;
  document.getElementById('brief-box').open = false;
  document.getElementById('brief-text').textContent = '';
  document.getElementById('job-title').textContent = '';
  document.getElementById('job-meta').textContent = '';
  window.scrollTo({ top: 0 });
  poll(id);
}

async function poll(id) {
  clearTimeout(pollTimer);
  const res = await fetch(`/api/jobs/${id}`);
  if (id !== currentJob) return;
  if (!res.ok) {
    document.getElementById('job-title').textContent = 'Trabajo no encontrado';
    return;
  }
  const { job, events } = await res.json();

  document.getElementById('job-title').textContent = job.input.clientName;
  document.getElementById('job-meta').textContent = [
    new Date(job.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
    job.input.requesterName,
    IMAGE_LABELS[job.input.imageMode],
  ]
    .filter(Boolean)
    .join(' · ');

  const briefBox = document.getElementById('brief-box');
  briefBox.hidden = !(job.input.instruction && job.input.briefText);
  if (!briefBox.hidden && document.getElementById('brief-text').textContent !== job.input.briefText) {
    document.getElementById('brief-instruction').textContent = `Instrucción: «${job.input.instruction}»`;
    document.getElementById('brief-text').textContent = job.input.briefText;
  }

  const statusEl = document.getElementById('job-status');
  statusEl.textContent = STATUS_LABELS[job.status] || job.status;
  statusEl.className = `status-badge status-${job.status}`;

  renderProgress(job);

  const log = document.getElementById('job-log');
  log.innerHTML = events
    .map((ev) => `<li class="log-${ev.level}"><strong>${escapeHtml(PHASE_LABELS[ev.phase] || ev.phase)}</strong> — ${escapeHtml(ev.message)}</li>`)
    .join('');
  log.scrollTop = log.scrollHeight;

  if (job.status === 'completed') {
    const resultBox = document.getElementById('job-result');
    if (resultBox.hidden) {
      resultBox.hidden = false;
      document.getElementById('download-link').href = `/api/jobs/${id}/result?download=1`;
      document.getElementById('open-link').href = `/api/jobs/${id}/result`;
      document.getElementById('preview-frame').src = `/api/jobs/${id}/result`;
      applyPreviewView(readPreviewView());
    }
    return;
  }

  if (job.status === 'blocked' || job.status === 'failed') {
    document.getElementById('job-blocked').hidden = false;
    document.getElementById('blocked-reason').textContent = job.blockedReason || job.error || 'Motivo desconocido.';
    document.getElementById('log-box').open = true;
    return;
  }

  pollTimer = setTimeout(() => poll(id), 10000);
}

// ---------------------------------------------------------------- vista previa escritorio / móvil

const PREVIEW_VIEWS = {
  desktop: { width: 800, label: 'Escritorio · 800 px' },
  mobile: { width: 375, label: 'Móvil · 375 px (iPhone)' },
};

function readPreviewView() {
  try {
    return localStorage.getItem('previewView') === 'mobile' ? 'mobile' : 'desktop';
  } catch {
    return 'desktop';
  }
}

function applyPreviewView(view) {
  const device = document.getElementById('preview-device');
  const stage = document.getElementById('preview-stage');
  device.classList.toggle('is-mobile', view === 'mobile');
  document.querySelector(`input[name="previewView"][value="${view}"]`).checked = true;
  device.style.transform = '';
  stage.style.height = '';
  // Si el ancho real no cabe (pantallas pequeñas), se escala todo el dispositivo en vez de
  // estrecharlo: así el email se ve exactamente como a ese ancho.
  const available = stage.clientWidth - 32;
  const needed = device.offsetWidth;
  const scale = needed > available && available > 0 ? available / needed : 1;
  if (scale < 1) {
    device.style.transform = `scale(${scale})`;
    stage.style.height = `${Math.ceil(device.offsetHeight * scale) + 48}px`;
  }
  document.getElementById('preview-size').textContent =
    PREVIEW_VIEWS[view].label + (scale < 1 ? ` · al ${Math.round(scale * 100)} %` : '');
}

document.querySelectorAll('input[name="previewView"]').forEach((r) =>
  r.addEventListener('change', () => {
    try {
      localStorage.setItem('previewView', r.value);
    } catch {
      // sin almacenamiento: solo dura esta visita
    }
    applyPreviewView(r.value);
  })
);
new ResizeObserver(() => {
  if (!document.getElementById('job-result').hidden) applyPreviewView(readCheckedView());
}).observe(document.getElementById('preview-stage'));

function readCheckedView() {
  return document.querySelector('input[name="previewView"]:checked')?.value || 'desktop';
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
    document.getElementById('progress-detail').textContent = job.input.instruction
      ? 'Esperando a que Hermes lo recoja. Primero escribirá el brief creativo.'
      : 'Esperando a que Hermes lo recoja.';
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
  bar.classList.toggle('is-live', job.status === 'running');
  track.setAttribute('aria-valuenow', String(p.pct));
  document.getElementById('progress-stage').textContent = `${p.stageLabel} · ${p.pct}%`;
  const eta = document.getElementById('progress-eta');
  eta.classList.remove('is-idle');
  if (job.status === 'completed') {
    eta.textContent = '';
  } else if (p.stage === 'brief') {
    eta.textContent = 'después, la newsletter (~15-20 min)';
  } else if (p.etaSec) {
    eta.textContent = `quedan ~${formatMinutes(p.etaSec)} (estimado)`;
  } else {
    // Recta final (Hermes revisa y corrige a su ritmo): en vez de un tiempo que no se cumple,
    // si sigue trabajando o si lleva rato parado.
    const idle = idleSeconds(p);
    eta.textContent = idle != null && idle >= 180 ? `sin actividad desde hace ${formatAgo(idle)}` : 'recta final: revisando a su ritmo';
    eta.classList.toggle('is-idle', idle != null && idle >= 180);
  }
  const idle = idleSeconds(p);
  document.getElementById('progress-detail').textContent =
    job.status === 'completed'
      ? `Hecha en ${formatMinutes(p.elapsedSec)} · ${p.actions} acciones de Hermes.`
      : [p.detail, idle != null ? `última acción hace ${formatAgo(idle)}` : null, `${p.actions} acciones`, `${formatMinutes(p.elapsedSec)} transcurridos`]
          .filter(Boolean)
          .join(' · ');
}

function idleSeconds(p) {
  return p.lastActionAt ? Math.max(0, (Date.now() - p.lastActionAt) / 1000) : null;
}

function formatAgo(sec) {
  return sec < 60 ? `${Math.max(5, Math.round(sec / 5) * 5)} s` : `${Math.round(sec / 60)} min`;
}

// ---------------------------------------------------------------- utilidades

function prettyBrand(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalize(str) {
  return String(str).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML.replace(/"/g, '&quot;');
}

function route() {
  const id = new URLSearchParams(location.search).get('job');
  if (id) {
    showJobView(id);
  } else {
    clearTimeout(pollTimer);
    currentJob = null;
    viewJob.hidden = true;
    viewForm.hidden = false;
    hero.hidden = false;
    loadHistory();
  }
}

// El navegador restaura el formulario anterior (así se coló un prompt de Prozis con la marca
// Adeslas seleccionada): cada visita empieza en blanco.
form.reset();
applyKind();
route();
