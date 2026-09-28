const form = document.getElementById('brief-form');
const viewForm = document.getElementById('view-form');
const viewJob = document.getElementById('view-job');
const hero = document.querySelector('.hero');
const clientNameInput = document.getElementById('client-name-input');
const existingBrandInput = document.getElementById('existing-brand-input');

// ---------------------------------------------------------------- campo único de marca
// Antes había dos campos (desplegable de carpeta + nombre) que podían contradecirse: así se envió un
// prompt de Prozis con la marca Adeslas (2026-09-24). Ahora se escribe el nombre y la página deduce si
// es una marca del sistema (brands/{carpeta}) o una nueva, y lo dice debajo.
let knownBrands = [];
const brandNames = new Map(); // carpeta → nombre tal como lo escribió el equipo (del historial)

/** Igual que slugify() de studio/server/campaignFs.ts: el servidor usa esta carpeta si no hay coincidencia. */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Carpeta de brands/ que corresponde a lo escrito: exacta o sin guiones ("Para y Compara" →
 *  paraycompara, "Óptica 2000" → optica2000). */
function matchBrand(name) {
  const slug = slugify(name);
  if (!slug) return '';
  if (knownBrands.includes(slug)) return slug;
  const flat = slug.replace(/-/g, '');
  return knownBrands.find((b) => b.replace(/-/g, '') === flat) || '';
}

/** Nombres que no se deducen de la carpeta (tildes, siglas, espacios). El resto: "new-balance" → "New Balance". */
const BRAND_DISPLAY = {
  'accion-contra-el-hambre': 'Acción contra el Hambre',
  bmw: 'BMW',
  byd: 'BYD',
  'el-corte-ingles': 'El Corte Inglés',
  feebboletter: 'Feebbo Letter',
  'mercedes-amg': 'Mercedes-AMG',
  msf: 'MSF',
  optica2000: 'Óptica 2000',
  paraycompara: 'Para y Compara',
  uax: 'UAX',
  wornwear: 'Worn Wear',
};

function brandDisplayName(slug) {
  return brandNames.get(slug) || BRAND_DISPLAY[slug] || prettyBrand(slug);
}

function renderBrandOptions() {
  document.getElementById('brand-options').innerHTML = knownBrands
    .map((b) => `<option value="${escapeHtml(brandDisplayName(b))}"></option>`)
    .join('');
}

function updateBrandMatch() {
  const name = clientNameInput.value.trim();
  const match = matchBrand(name);
  const hint = document.getElementById('brand-match');
  existingBrandInput.value = match;
  hint.classList.toggle('is-existing', !!match);
  hint.classList.toggle('is-new', !!name && !match);
  hint.textContent = !name
    ? ''
    : match
    ? `Marca del sistema: Hermes usará su brand pack y sus logos (brands/${match}).`
    : `Marca nueva: Hermes la investigará desde cero (se creará brands/${slugify(name) || '…'}).`;
}
clientNameInput.addEventListener('input', updateBrandMatch);

async function loadBrands() {
  try {
    const res = await fetch('/api/brands');
    const data = await res.json();
    knownBrands = data.brands || [];
    renderBrandOptions();
    updateBrandMatch();
  } catch (err) {
    console.error('No se pudieron cargar las marcas existentes', err);
  }
}
const brandsReady = loadBrands();

// Qué está haciendo Hermes, visible desde cualquier página (2026-09-28): con qué newsletter está, a qué
// porcentaje y cuántas esperan; si está trabajando, la píldora lleva a ese trabajo.
let statusTimer = null;

async function loadHermesStatus() {
  clearTimeout(statusTimer);
  const el = document.getElementById('hermes-status');
  let busy = false;
  try {
    const { hermesOnline, current, queued = 0 } = await (await fetch('/api/status')).json();
    const waiting = queued ? ` · ${queued} en cola` : '';
    busy = !!current;
    if (current) {
      el.textContent = `Hermes · ${current.clientName}${current.pct != null ? ` · ${current.pct} %` : ''}${waiting}`;
      el.href = `?job=${encodeURIComponent(current.id)}`;
      el.title = `${current.stageLabel || 'Trabajando'}: abre el trabajo`;
    } else {
      el.textContent = (hermesOnline ? 'Hermes conectado' : 'Hermes desconectado') + waiting;
      el.removeAttribute('href');
      el.title = hermesOnline ? '' : 'Puedes enviar igualmente: empezará cuando Hermes se conecte.';
    }
    el.className = `status-pill ${current ? 'is-busy' : hermesOnline ? 'is-online' : 'is-offline'}`;
  } catch {
    el.textContent = '';
    el.removeAttribute('href');
    el.className = 'status-pill';
  }
  // Mientras trabaja se refresca más a menudo, para que el porcentaje no se quede viejo.
  statusTimer = setTimeout(loadHermesStatus, busy ? 20000 : 60000);
}
loadHermesStatus();

document.getElementById('hermes-status').addEventListener('click', (e) => {
  const href = e.currentTarget.getAttribute('href');
  if (!href || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  const id = new URLSearchParams(href.slice(1)).get('job');
  history.pushState({}, '', href);
  showJobView(id);
});

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
  updateExamples();
}
form.querySelectorAll('input[name="inputKind"]').forEach((r) => r.addEventListener('change', applyKind));
form.addEventListener('reset', () =>
  setTimeout(() => {
    applyKind();
    updateBrandMatch();
    // Tu nombre se recuerda entre visitas (no hace falta escribirlo cada vez).
    const requester = document.getElementById('requester-input');
    if (!requester.value) {
      try {
        requester.value = localStorage.getItem('requesterName') || '';
      } catch {
        // sin almacenamiento
      }
    }
  })
);

// ---------------------------------------------------------------- ejemplos de instrucción
// Para quien entra por primera vez: rellenan la instrucción y la marca. Solo con la instrucción vacía
// (o con otro ejemplo): nunca pisan lo que alguien ha escrito.
const EXAMPLES = [
  { label: 'Adeslas · seguro dental', brand: 'Adeslas', text: 'quiero una newsletter de Adeslas para presentar su seguro dental a familias con niños' },
  { label: 'Nike · lanzamiento', brand: 'Nike', text: 'newsletter de Nike para el lanzamiento de sus nuevas zapatillas de running' },
  { label: 'El Corte Inglés · temporada', brand: 'El Corte Inglés', text: 'newsletter de El Corte Inglés con las novedades de moda de la nueva temporada' },
  { label: 'Apple · producto', brand: 'Apple', text: 'newsletter de Apple presentando su último iPhone a clientes de España' },
];
const promptInput = document.getElementById('prompt-input');

function updateExamples() {
  const kind = form.querySelector('input[name="inputKind"]:checked')?.value;
  const text = promptInput.value.trim();
  document.getElementById('examples').hidden = kind !== 'instruction' || (!!text && !EXAMPLES.some((ex) => ex.text === text));
}

document.getElementById('examples').insertAdjacentHTML(
  'beforeend',
  EXAMPLES.map((ex, i) => `<button type="button" class="chip" data-example="${i}">${escapeHtml(ex.label)}</button>`).join('')
);
document.getElementById('examples').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-example]');
  if (!chip) return;
  const ex = EXAMPLES[Number(chip.dataset.example)];
  promptInput.value = ex.text;
  clientNameInput.value = ex.brand;
  updateBrandMatch();
  updateExamples();
  promptInput.focus();
});
promptInput.addEventListener('input', updateExamples);

function setKind(kind) {
  form.querySelector(`input[name="inputKind"][value="${kind}"]`).checked = true;
  applyKind();
}


// Avisos del formulario dentro de la página (antes, alert/confirm del navegador).
const brandWarning = document.getElementById('brand-warning');
const formError = document.getElementById('form-error');
let pendingPayload = null;

function clearFormNotices() {
  brandWarning.hidden = true;
  formError.hidden = true;
  pendingPayload = null;
}

async function submitJob(payload) {
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  document.getElementById('brand-send-anyway').disabled = true;
  clearFormNotices();
  try {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    // El prompt no menciona la marca elegida: se pide confirmación en vez de enviarlo a ciegas.
    if (res.status === 409 && data.code === 'brand_mismatch') {
      pendingPayload = payload;
      document.getElementById('brand-warning-text').textContent = data.error;
      brandWarning.hidden = false;
      document.getElementById('brand-send-anyway').focus();
      return;
    }
    if (!res.ok) {
      formError.textContent = data.error || 'No se pudo enviar el brief.';
      formError.hidden = false;
      return;
    }
    try {
      localStorage.setItem('requesterName', payload.requesterName || '');
    } catch {
      // sin almacenamiento: no se recuerda
    }
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
  } catch {
    formError.textContent = 'No se pudo conectar con Studio. Revisa la conexión e inténtalo de nuevo.';
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    document.getElementById('brand-send-anyway').disabled = false;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  submitJob(Object.fromEntries(new FormData(form).entries()));
});
document.getElementById('brand-send-anyway').addEventListener('click', () => {
  if (pendingPayload) submitJob({ ...pendingPayload, confirmBrand: true });
});
document.getElementById('brand-review').addEventListener('click', () => {
  clearFormNotices();
  clientNameInput.focus();
  clientNameInput.select();
});
// Si se cambia algo del formulario, el aviso ya no corresponde a lo que se enviaría.
form.addEventListener('input', () => {
  if (!brandWarning.hidden) clearFormNotices();
});
form.addEventListener('reset', clearFormNotices);

// ---------------------------------------------------------------- avisos flotantes

let toastTimer = null;
function showToast(message, level = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.toggle('is-error', level === 'error');
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), level === 'error' ? 7000 : 3000);
}

const STATUS_LABELS = {
  queued: 'En cola',
  running: 'Trabajando',
  completed: 'Lista',
  failed: 'Fallida',
  blocked: 'Bloqueada',
  cancelled: 'Cancelada',
};

const IMAGE_LABELS = { official: 'Assets oficiales', ai: 'Imágenes con IA' };

// ---------------------------------------------------------------- historial

const HISTORY_PAGE = 20;
const historyState = { jobs: [], query: '', brand: '', status: '', mine: false, shown: HISTORY_PAGE };

// "Mis trabajos" (2026-09-28): el nombre que recuerda el formulario. Sin nombre, el filtro no aparece.
function savedRequester() {
  try {
    return (localStorage.getItem('requesterName') || '').trim();
  } catch {
    return '';
  }
}

function renderMineChip() {
  const chip = document.getElementById('mine-chip');
  const name = savedRequester();
  chip.hidden = !name;
  if (!name) historyState.mine = false;
  chip.textContent = name ? `Mis trabajos (${name})` : 'Mis trabajos';
  chip.setAttribute('aria-pressed', String(historyState.mine));
}

try {
  historyState.mine = localStorage.getItem('historyMine') === '1';
} catch {
  // sin almacenamiento
}
let historyTimer = null;

async function loadHistory() {
  clearTimeout(historyTimer);
  try {
    const { jobs } = await (await fetch('/api/jobs')).json();
    historyState.jobs = jobs;
    // Nombres de marca tal como los escribe el equipo ("El Corte Inglés", no "El Corte Ingles"), solo
    // si llevan a su carpeta: si no, la sugerencia no reconocería la marca.
    let named = false;
    for (const j of jobs) {
      if (j.clientSlug && !brandNames.has(j.clientSlug) && slugify(j.clientName).replace(/-/g, '') === j.clientSlug.replace(/-/g, '')) {
        brandNames.set(j.clientSlug, j.clientName);
        named = true;
      }
    }
    if (named) renderBrandOptions();
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
    if (historyState.mine && normalize(j.requesterName || '') !== normalize(savedRequester())) return false;
    return true;
  });
}

/** Familias de versiones (2026-09-28): cada "Pedir cambios" o "Adaptar a móvil" cuelga de la newsletter
 *  de la que sale. Número de versión por orden de creación y fecha de la última versión de la familia. */
function familyInfo(jobs) {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const parentOf = (j) => j.revisionOf || j.mobileFixOf || null;
  const rootOf = (j) => {
    let cur = j;
    for (let i = 0; i < 50; i++) {
      const next = byId.get(parentOf(cur));
      if (!next) return cur.id;
      cur = next;
    }
    return cur.id;
  };
  const families = new Map();
  for (const j of jobs) {
    const root = rootOf(j);
    if (!families.has(root)) families.set(root, []);
    families.get(root).push(j);
  }
  const info = new Map();
  for (const [root, members] of families) {
    members.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const latest = members[members.length - 1].createdAt;
    members.forEach((j, i) => info.set(j.id, { root, number: i + 1, size: members.length, latest }));
  }
  return info;
}

function renderHistory() {
  renderMineChip();
  // Cada familia junta (la original y debajo sus versiones), ordenadas por su versión más reciente.
  const info = familyInfo(historyState.jobs);
  const list = filteredJobs().sort((a, b) => {
    const fa = info.get(a.id);
    const fb = info.get(b.id);
    return fb.latest.localeCompare(fa.latest) || fa.root.localeCompare(fb.root) || fa.number - fb.number;
  });
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
      const fam = info.get(j.id);
      const version = fam.size > 1 ? `<span class="version-tag">Versión ${fam.number}${fam.number === 1 ? ` de ${fam.size}` : ''}</span> · ` : '';
      const meta = version + [when, j.requesterName, j.revisionOf ? 'Cambios' : j.mobileFixOf ? 'Adaptación a móvil' : j.fromInstruction ? 'Desde instrucción' : null, IMAGE_LABELS[j.imageMode], j.status === 'completed' && j.elapsedSec ? formatMinutes(j.elapsedSec) : null]
        .filter(Boolean)
        .map(escapeHtml)
        .join(' · ');
      const running = j.status === 'running' && j.pct != null;
      const label = (STATUS_LABELS[j.status] || j.status) + (running ? ` · ${j.pct}%` : '');
      const actions = [
        `<a class="btn btn-ghost" href="?job=${id}">Ver</a>`,
        j.status === 'completed' ? `<a class="btn btn-ghost" href="/api/jobs/${id}/result?download=1">Descargar</a>` : '',
        j.status === 'failed' || j.status === 'cancelled' || j.status === 'blocked'
          ? `<button type="button" class="btn btn-secondary" data-retry="${escapeHtml(j.id)}">Reintentar</button>`
          : '',
        `<button type="button" class="btn btn-secondary" data-reuse="${escapeHtml(j.id)}">Reutilizar</button>`,
      ].join('');
      const initials = String(j.clientName || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      const thumb = j.hasThumb
        ? `<a class="thumb" href="?job=${id}" tabindex="-1" aria-hidden="true"><img src="/api/jobs/${id}/thumb" alt="" loading="lazy" width="48" height="64" data-initials="${escapeHtml(initials)}"></a>`
        : `<a class="thumb thumb-empty" href="?job=${id}" tabindex="-1" aria-hidden="true">${escapeHtml(initials)}</a>`;
      return `<li class="job-row${fam.number > 1 ? ' is-version' : ''}">
          ${thumb}
          <a class="name" href="?job=${id}">${escapeHtml(j.clientName)}</a>
          <span class="status-badge status-${escapeHtml(j.status)}">${escapeHtml(label)}</span>
          <p class="meta">${meta}</p>
          <div class="row-actions">${actions}</div>
          ${running ? `<div class="mini-track" aria-hidden="true"><div style="width:${Number(j.pct) || 0}%"></div></div>` : ''}
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
  document.querySelectorAll('#history-status .chip').forEach((c) => {
    c.classList.toggle('is-active', c === chip);
    c.setAttribute('aria-pressed', String(c === chip));
  });
  historyState.status = chip.dataset.status;
  historyState.shown = HISTORY_PAGE;
  renderHistory();
});
document.getElementById('mine-chip').addEventListener('click', () => {
  historyState.mine = !historyState.mine;
  try {
    localStorage.setItem('historyMine', historyState.mine ? '1' : '0');
  } catch {
    // sin almacenamiento
  }
  historyState.shown = HISTORY_PAGE;
  renderMineChip();
  renderHistory();
});
document.getElementById('history-more').addEventListener('click', () => {
  historyState.shown += HISTORY_PAGE;
  renderHistory();
});
// Miniatura que no carga (borrada del volumen, red): se cambia por las iniciales de la marca.
document.getElementById('history-list').addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.closest('.thumb')) return;
    const link = img.parentElement;
    link.classList.add('thumb-empty');
    link.textContent = img.dataset.initials || '';
  },
  true
);
document.getElementById('history-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-reuse]');
  if (btn) reuseJob(btn.dataset.reuse);
  const retry = e.target.closest('[data-retry]');
  if (retry) retryJobById(retry.dataset.retry, retry);
});

// "Reutilizar": rellena el formulario con la marca, el prompt y el modo de imágenes de un trabajo
// anterior (para relanzar uno fallido o hacer una variante). No se envía hasta pulsar Generar.
async function reuseJob(id, { useBrief = false } = {}) {
  const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
  if (!res.ok) return showToast('No se pudo cargar ese trabajo.', 'error');
  const { job } = await res.json();
  showFormView();
  await brandsReady;
  form.reset();
  const slug = job.input.clientSlug || '';
  clientNameInput.value = job.input.clientName || brandDisplayName(slug);
  // Si el nombre de entonces no lleva a su carpeta ("SegurCaixa Adeslas" → adeslas), se usa el de la carpeta.
  if (slug && knownBrands.includes(slug) && matchBrand(clientNameInput.value) !== slug) clientNameInput.value = brandDisplayName(slug);
  updateBrandMatch();
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
  document.title = BASE_TITLE;
  updateSticky();
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
// "Adaptar a móvil": Hermes retoca esta misma pieza (no la rehace) y el resultado es un trabajo nuevo.
document.getElementById('mobile-fix-btn').addEventListener('click', async (e) => {
  if (!currentJob) return;
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(currentJob)}/mobile-fix`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(data.error || 'No se pudo lanzar la adaptación a móvil.', 'error');
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
  } finally {
    btn.disabled = false;
  }
});

// ---------------------------------------------------------------- reintentar y copiar enlace

/** Relanza un trabajo fallido o cancelado tal cual, en un clic (antes: Reutilizar + bajar al formulario
 *  + enviar). Cambios y adaptaciones a móvil se relanzan sobre la misma versión de origen. */
async function retryJob(job) {
  const input = job.input;
  const post = (url, body) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  let res;
  if (input.revisionOf) {
    res = await post(`/api/jobs/${encodeURIComponent(input.revisionOf)}/revise`, { changes: input.changeRequest, requesterName: input.requesterName });
  } else if (input.mobileFixOf) {
    res = await post(`/api/jobs/${encodeURIComponent(input.mobileFixOf)}/mobile-fix`);
  } else {
    res = await post('/api/jobs', {
      mode: 'standalone',
      inputKind: input.instruction ? 'instruction' : 'brief',
      clientName: input.clientName,
      existingBrand: input.brandMode === 'existing' ? input.clientSlug : '',
      promptText: input.instruction || input.briefText,
      imageMode: input.imageMode,
      requesterName: input.requesterName || '',
      confirmBrand: true, // ya se envió una vez con esta marca
    });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return showToast(data.error || 'No se pudo reintentar.', 'error');
  history.pushState({}, '', `?job=${data.id}`);
  showJobView(data.id);
}

async function retryJobById(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
    if (!res.ok) return showToast('No se pudo cargar ese trabajo.', 'error');
    await retryJob((await res.json()).job);
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.querySelectorAll('[data-retry-current]').forEach((b) =>
  b.addEventListener('click', () => currentJob && retryJobById(currentJob, b))
);

document.getElementById('copy-link-btn').addEventListener('click', () => {
  if (currentJob) {
    copyText(
      `${location.origin}${location.pathname}?job=${encodeURIComponent(currentJob)}`,
      'Enlace copiado: cualquiera del equipo con la contraseña puede abrirlo.',
      'Copia la dirección de la barra del navegador.'
    );
  }
});

// ---------------------------------------------------------------- barra fija de acciones

const stickyBar = document.getElementById('sticky-actions');
let resultBarHidden = false;

function updateSticky() {
  const show = !viewJob.hidden && !document.getElementById('job-result').hidden && resultBarHidden;
  stickyBar.hidden = !show;
  document.body.classList.toggle('has-sticky', show);
}

// Visible solo cuando la barra de resultado ha quedado por ENCIMA de la pantalla (se ha bajado).
new IntersectionObserver(([entry]) => {
  resultBarHidden = !entry.isIntersecting && entry.boundingClientRect.top < 0;
  updateSticky();
}).observe(document.querySelector('.result-bar'));

document.getElementById('sticky-copy').addEventListener('click', () => document.getElementById('copy-html-btn').click());
document.getElementById('sticky-revise').addEventListener('click', () => {
  toggleRevise(true);
  reviseBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
document.getElementById('sticky-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---------------------------------------------------------------- cancelar y pedir cambios

const cancelBtn = document.getElementById('cancel-btn');
const cancelConfirm = document.getElementById('cancel-confirm');

function resetCancel() {
  cancelBtn.hidden = false;
  cancelConfirm.hidden = true;
}
cancelBtn.addEventListener('click', () => {
  cancelBtn.hidden = true;
  cancelConfirm.hidden = false;
  document.getElementById('cancel-no').focus();
});
document.getElementById('cancel-no').addEventListener('click', resetCancel);
document.getElementById('cancel-yes').addEventListener('click', async (e) => {
  if (!currentJob) return;
  const id = currentJob;
  const btn = e.currentTarget; // tras un await, e.currentTarget ya es null
  btn.disabled = true;
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      document.getElementById('progress-detail').textContent = data.error || 'No se pudo cancelar.';
    }
  } finally {
    btn.disabled = false;
    resetCancel();
    poll(id);
  }
});

const reviseBox = document.getElementById('revise-box');
const reviseBtn = document.getElementById('revise-btn');
const reviseError = document.getElementById('revise-error');

function toggleRevise(open) {
  reviseBox.hidden = !open;
  reviseBtn.setAttribute('aria-expanded', String(open));
  reviseError.hidden = true;
  if (open) document.getElementById('revise-input').focus();
}
reviseBtn.addEventListener('click', () => toggleRevise(reviseBox.hidden));
document.getElementById('revise-close').addEventListener('click', () => toggleRevise(false));
reviseBox.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentJob) return;
  const submit = reviseBox.querySelector('button[type="submit"]');
  submit.disabled = true;
  reviseError.hidden = true;
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(currentJob)}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes: document.getElementById('revise-input').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      reviseError.textContent = data.error || 'No se pudieron enviar los cambios.';
      reviseError.hidden = false;
      return;
    }
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
  } finally {
    submit.disabled = false;
  }
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
  resultBarHidden = false;
  updateSticky();
  document.getElementById('job-blocked').hidden = true;
  document.getElementById('job-cancelled').hidden = true;
  document.getElementById('cancel-row').hidden = true;
  document.getElementById('job-change').hidden = true;
  reviseBox.hidden = true;
  reviseBox.reset();
  reviseBtn.setAttribute('aria-expanded', 'false');
  resetCancel();
  resetFrame(document.getElementById('preview-frame'));
  resetCompare();
  document.getElementById('versions').hidden = true;
  document.getElementById('job-parent').hidden = true;
  document.getElementById('brief-box').hidden = true;
  document.getElementById('brief-box').open = false;
  document.getElementById('brief-text').innerHTML = '';
  document.getElementById('brief-text').dataset.src = '';
  document.getElementById('job-title').textContent = '';
  document.getElementById('job-meta').textContent = '';
  window.scrollTo({ top: 0 });
  // Cambia la "página": el foco va al título para que el lector de pantalla lo diga.
  document.getElementById('job-title').focus({ preventScroll: true });
  lastAnnouncement = '';
  lastLogKey = '';
  document.getElementById('log-only-warnings').checked = false;
  document.getElementById('log-box').classList.remove('only-warnings');
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
  const { job, events, notes, meta, queue, hermesOnline, versions } = await res.json();
  renderVersions(job, versions || []);
  updateTabTitle(job);
  maybeNotify(job);

  document.getElementById('job-title').textContent = job.input.revisionOf
    ? `${job.input.clientName} · cambios`
    : job.input.mobileFixOf
    ? `${job.input.clientName} · adaptación a móvil`
    : job.input.clientName;
  const changeEl = document.getElementById('job-change');
  changeEl.hidden = !job.input.changeRequest;
  changeEl.textContent = job.input.changeRequest ? `Cambios pedidos: «${job.input.changeRequest}»` : '';
  document.getElementById('cancel-row').hidden = job.status !== 'queued' && job.status !== 'running';
  document.getElementById('job-meta').textContent = [
    new Date(job.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
    job.input.requesterName,
    IMAGE_LABELS[job.input.imageMode],
  ]
    .filter(Boolean)
    .join(' · ');

  const briefBox = document.getElementById('brief-box');
  briefBox.hidden = !(job.input.instruction && job.input.briefText);
  const briefEl = document.getElementById('brief-text');
  if (!briefBox.hidden && briefEl.dataset.src !== job.input.briefText) {
    document.getElementById('brief-instruction').textContent = `Instrucción: «${job.input.instruction}»`;
    briefEl.dataset.src = job.input.briefText;
    briefEl.innerHTML = window.HermesMarkdown ? window.HermesMarkdown.render(job.input.briefText) : '';
  }

  const statusEl = document.getElementById('job-status');
  statusEl.textContent = STATUS_LABELS[job.status] || job.status;
  statusEl.className = `status-badge status-${job.status}`;

  renderProgress(job, queue, hermesOnline);
  renderNotify(job);
  announceJob(job, queue);

  renderLog(events);

  if (job.status === 'completed') {
    const resultBox = document.getElementById('job-result');
    if (resultBox.hidden) {
      resultBox.hidden = false;
      document.getElementById('download-link').href = `/api/jobs/${id}/result?download=1`;
      document.getElementById('sticky-download').href = `/api/jobs/${id}/result?download=1`;
      document.getElementById('sticky-title').textContent = document.getElementById('job-title').textContent;
      document.getElementById('open-link').href = `/api/jobs/${id}/result`;
      applyPreviewView(job.input.mobileFixOf ? 'mobile' : readPreviewView());
      document.querySelector(`input[name="previewTheme"][value="${readTheme()}"]`).checked = true;
      document.getElementById('mobile-fix-btn').hidden = !!job.input.mobileFixOf;
      renderReview(job.quality, notes);
      renderMeta(meta);
      loadResultHtml(id).then(() => {
        if (id !== currentJob) return;
        updateThemeHint();
        renderFrame('after');
      });
      setupCompare(job, versions || []);
    }
    return;
  }

  if (job.status === 'cancelled') {
    document.getElementById('job-cancelled').hidden = false;
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

// ---------------------------------------------------------------- asunto, preheader y copiar

let currentMeta = null;
/** HTML del resultado, descargado al abrirlo: copiarlo en el mismo clic, sin esperar a la red, evita
 *  que el navegador niegue el portapapeles por haber pasado demasiado tiempo desde el clic. */
let currentHtml = null;

async function loadResultHtml(id) {
  currentHtml = null;
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(id)}/result`);
    if (res.ok && id === currentJob) currentHtml = await res.text();
  } catch {
    // se reintenta al pulsar "Copiar HTML"
  }
}

function renderMeta(meta) {
  currentMeta = meta;
  const box = document.getElementById('email-meta');
  box.hidden = !meta;
  if (!meta) return;
  for (const [key, id, missing] of [
    ['subject', 'meta-subject', 'Sin asunto: el HTML no tiene <title>.'],
    ['preheader', 'meta-preheader', 'Sin preheader.'],
  ]) {
    const el = document.getElementById(id);
    el.textContent = meta[key] || missing;
    el.classList.toggle('is-missing', !meta[key]);
    box.querySelector(`[data-copy="${key}"]`).hidden = !meta[key];
  }
}

/** Método clásico (textarea + execCommand): funciona donde la API del portapapeles está bloqueada. */
function copyWithSelection(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

async function copyText(text, okMessage, failHint = 'Usa «Descargar HTML».') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(okMessage);
    return;
  } catch {
    // sigue con el método clásico
  }
  if (copyWithSelection(text)) showToast(okMessage);
  else showToast(`No se pudo copiar: el navegador no dio permiso para usar el portapapeles. ${failHint}`, 'error');
}

document.getElementById('email-meta').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]');
  if (btn && currentMeta?.[btn.dataset.copy]) {
    copyText(currentMeta[btn.dataset.copy], btn.dataset.copy === 'subject' ? 'Asunto copiado.' : 'Preheader copiado.');
  }
});

document.getElementById('copy-html-btn').addEventListener('click', async (e) => {
  if (!currentJob) return;
  if (!currentHtml) await loadResultHtml(currentJob);
  if (!currentHtml) return showToast('No se pudo descargar el HTML para copiarlo.', 'error');
  copyText(currentHtml, 'HTML copiado: pégalo en tu plataforma de envío.');
});

// ---------------------------------------------------------------- título de la pestaña y aviso al terminar

const BASE_TITLE = document.title;

function updateTabTitle(job) {
  const name = job.input.clientName;
  const pct = job.progress?.pct;
  document.title =
    job.status === 'running'
      ? `(${pct != null ? pct : 0} %) ${name} · Hermes Studio`
      : job.status === 'queued'
      ? `En cola · ${name} · Hermes Studio`
      : job.status === 'completed'
      ? `✓ Lista · ${name} · Hermes Studio`
      : `${STATUS_LABELS[job.status] || job.status} · ${name} · Hermes Studio`;
}

// Aviso del navegador cuando el trabajo que se está mirando termina (15-20 min por pieza). Solo con
// la pestaña abierta: no hay notificaciones push. Se recuerda que se quiso aviso para los siguientes.
const notifySupported = 'Notification' in window;
const lastStatusByJob = {};

function wantsNotify() {
  try {
    return localStorage.getItem('notifyDone') === '1';
  } catch {
    return false;
  }
}

function renderNotify(job) {
  const active = job.status === 'queued' || job.status === 'running';
  const granted = notifySupported && Notification.permission === 'granted' && wantsNotify();
  document.getElementById('notify-btn').hidden = !active || !notifySupported || granted || Notification.permission === 'denied';
  document.getElementById('notify-hint').hidden = !active || !granted;
}

document.getElementById('notify-btn').addEventListener('click', async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    try {
      localStorage.setItem('notifyDone', '1');
    } catch {
      // sin almacenamiento: vale para esta visita
    }
  } else {
    showToast('El navegador no permite avisos. Puedes activarlos en los permisos del sitio.', 'error');
  }
  if (currentJob) poll(currentJob);
});

function maybeNotify(job) {
  const before = lastStatusByJob[job.id];
  lastStatusByJob[job.id] = job.status;
  const wasActive = before === 'queued' || before === 'running';
  if (!wasActive || job.status === before || job.status === 'running') return;
  if (!notifySupported || Notification.permission !== 'granted' || !document.hidden) return;
  const text = {
    completed: 'La newsletter está lista.',
    failed: 'El trabajo ha fallado.',
    blocked: 'El trabajo se ha detenido.',
    cancelled: 'El trabajo se ha cancelado.',
  }[job.status];
  if (!text) return;
  const n = new Notification(`${job.input.clientName} · Hermes Studio`, { body: text, icon: '/favicon.png', tag: job.id });
  n.onclick = () => {
    window.focus();
    n.close();
  };
}

// ---------------------------------------------------------------- revisión automática

const CHECK_STATE = { ok: 'Correcto', warning: 'Revisar', error: 'Error' };
const CHECK_ORDER = { error: 0, warning: 1, ok: 2 };

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// Control de calidad del worker (studio/worker/qualityCheck.ts) y autoauditoría de Hermes (notas.md):
// lo que tiene que mirar quien revisa la pieza antes de enviarla, sin abrir el registro.
function renderReview(quality, notes) {
  const summary = document.getElementById('review-summary');
  const list = document.getElementById('review-list');
  const message = document.getElementById('result-message');
  document.getElementById('review-empty').hidden = !!quality;
  message.textContent = 'La newsletter está lista.';
  message.classList.remove('has-errors');

  if (!quality) {
    summary.textContent = '';
    list.innerHTML = '';
  } else {
    const level = quality.errors ? 'error' : quality.warnings ? 'warning' : 'ok';
    summary.className = `review-summary is-${level}`;
    summary.textContent =
      level === 'ok'
        ? 'Todo correcto'
        : [quality.errors ? plural(quality.errors, 'error', 'errores') : null, quality.warnings ? plural(quality.warnings, 'aviso', 'avisos') : null]
            .filter(Boolean)
            .join(' · ');
    if (quality.errors) {
      message.textContent = 'La newsletter está lista, pero tiene errores por revisar.';
      message.classList.add('has-errors');
    }
    list.innerHTML = [...quality.checks]
      .sort((a, b) => CHECK_ORDER[a.status] - CHECK_ORDER[b.status])
      .map((c) => {
        const head = `<span class="check-dot" aria-hidden="true"></span><span class="check-label">${escapeHtml(c.label)}</span><span class="check-state">${escapeHtml(CHECK_STATE[c.status] || c.status)}</span>`;
        if (!c.details.length) return `<li class="check-${escapeHtml(c.status)}"><div class="check-line">${head}</div></li>`;
        const details = c.details
          .map((d, i) => `<li class="${i < (c.errorCount || 0) ? 'is-error' : ''}">${escapeHtml(d)}</li>`)
          .join('');
        return `<li class="check-${escapeHtml(c.status)}"><details${c.status === 'ok' ? '' : ' open'}><summary>${head}</summary><ul class="check-details">${details}</ul></details></li>`;
      })
      .join('');
  }

  const notesBox = document.getElementById('notes-box');
  notesBox.hidden = !notes;
  notesBox.open = false;
  document.getElementById('notes-text').innerHTML = notes && window.HermesMarkdown ? window.HermesMarkdown.render(notes) : '';
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
  const stage = document.getElementById('preview-stage');
  const compare = stage.classList.contains('is-compare');
  document.querySelector(`input[name="previewView"][value="${view}"]`).checked = true;
  const cols = [['preview-col-after', 'preview-device']];
  if (compare) cols.unshift(['preview-col-before', 'preview-device-before']);
  for (const [colId, deviceId] of cols) {
    const device = document.getElementById(deviceId);
    const col = document.getElementById(colId);
    device.classList.toggle('is-mobile', view === 'mobile');
    device.style.transform = '';
    col.style.width = '';
    col.style.height = '';
  }
  // Si el ancho real no cabe (pantallas pequeñas, o dos versiones lado a lado), se escala todo el
  // dispositivo en vez de estrecharlo: así el email se ve exactamente como a ese ancho.
  const gap = 16;
  const available = (stage.clientWidth - 32 - (compare ? gap : 0)) / (compare ? 2 : 1);
  const needed = document.getElementById('preview-device').offsetWidth;
  const scale = needed > available && available > 0 ? available / needed : 1;
  if (scale < 1) {
    for (const [colId, deviceId] of cols) {
      const device = document.getElementById(deviceId);
      const col = document.getElementById(colId);
      const label = col.querySelector('.preview-label');
      const labelHeight = label && !label.hidden ? label.offsetHeight + 8 : 0;
      device.style.transform = `scale(${scale})`;
      col.style.width = `${Math.floor(needed * scale)}px`;
      col.style.height = `${Math.ceil(device.offsetHeight * scale) + labelHeight}px`;
    }
  }
  document.getElementById('preview-size').textContent =
    PREVIEW_VIEWS[view].label + (scale < 1 ? ` · al ${Math.round(scale * 100)} %` : '');
}

// ---------------------------------------------------------------- versiones y comparación

const VERSION_KIND = { original: 'Original', revision: 'Cambios', 'mobile-fix': 'Adaptación a móvil' };

function renderVersions(job, versions) {
  const self = versions.find((v) => v.id === job.id);
  const parent = self && versions.find((v) => v.id === self.parentId);
  const parentEl = document.getElementById('job-parent');
  parentEl.hidden = !parent;
  if (parent) {
    const link = document.getElementById('job-parent-link');
    link.href = `?job=${encodeURIComponent(parent.id)}`;
    link.textContent = `la versión ${parent.number}`;
  }
  const nav = document.getElementById('versions');
  nav.hidden = versions.length < 2;
  if (nav.hidden) return;
  document.getElementById('versions-list').innerHTML = versions
    .map((v) => {
      const desc = v.kind === 'revision' && v.changeRequest ? `«${v.changeRequest}»` : VERSION_KIND[v.kind];
      const state = v.status === 'completed' ? '' : STATUS_LABELS[v.status] || v.status;
      return `<li${v.id === job.id ? ' aria-current="page"' : ''}>
          <a href="?job=${encodeURIComponent(v.id)}">Versión ${v.number}</a>
          <span class="v-desc">${escapeHtml(desc)}</span>
          ${state ? `<span class="v-state">${escapeHtml(state)}</span>` : ''}
        </li>`;
    })
    .join('');
}

let compareParent = null;

function resetCompare() {
  compareParent = null;
  document.getElementById('compare').hidden = true;
  document.getElementById('compare-toggle-wrap').hidden = true;
  document.getElementById('compare-toggle').checked = false;
  document.getElementById('preview-stage').classList.remove('is-compare');
  document.getElementById('preview-col-before').hidden = true;
  document.getElementById('preview-label-after').hidden = true;
  resetFrame(document.getElementById('preview-frame-before'));
  compareBeforeHtml = null;
}

async function fetchResult(id) {
  const res = await fetch(`/api/jobs/${encodeURIComponent(id)}/result`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// "Qué ha cambiado" respecto a la versión de la que sale (compare.js): texto por bloques, enlaces e
// imágenes. Sirve para confirmar que Hermes solo tocó lo pedido.
async function setupCompare(job, versions) {
  const self = versions.find((v) => v.id === job.id);
  const parent = self && versions.find((v) => v.id === self.parentId);
  if (!parent || parent.status !== 'completed' || !window.HermesCompare) return;
  const id = job.id;
  let before;
  let after;
  try {
    [before, after] = await Promise.all([fetchResult(parent.id), fetchResult(id)]);
  } catch {
    return;
  }
  if (id !== currentJob) return;
  compareParent = parent;
  compareBeforeHtml = before;
  const diff = window.HermesCompare.compareVersions(before, after);
  const items = [];
  const group = (title, list) => {
    if (list.length) items.push(`<li class="group">${escapeHtml(title)}</li>`, ...list);
  };
  group(
    'Texto',
    diff.text.map((d) => `<li class="is-${d.type}">${srChange(d.type)}${escapeHtml(d.text)}</li>`)
  );
  group('Enlaces', [
    ...diff.links.removed.map((u) => `<li class="is-removed">${srChange('removed')}${escapeHtml(u)}</li>`),
    ...diff.links.added.map((u) => `<li class="is-added">${srChange('added')}${escapeHtml(u)}</li>`),
  ]);
  group('Imágenes', [
    ...diff.images.removed.map((u) => `<li class="is-removed">${srChange('removed')}${escapeHtml(u.split('/').pop())}</li>`),
    ...diff.images.added.map((u) => `<li class="is-added">${srChange('added')}${escapeHtml(u.split('/').pop())}</li>`),
  ]);
  const changes = diff.text.length + diff.links.removed.length + diff.links.added.length + diff.images.removed.length + diff.images.added.length;
  const summary = document.getElementById('compare-summary');
  summary.textContent = diff.unchanged ? 'Sin cambios de contenido' : `${changes} cambio${changes === 1 ? '' : 's'}`;
  summary.className = `review-summary ${diff.unchanged ? 'is-warning' : 'is-ok'}`;
  document.getElementById('compare-base').textContent = diff.unchanged
    ? `El texto, los enlaces y las imágenes son iguales que en la versión ${parent.number}${job.input.mobileFixOf ? ' (normal en una adaptación a móvil: solo cambia el diseño).' : '. Puede que solo cambiara el diseño.'}`
    : `Respecto a la versión ${parent.number}. En rojo lo que se quitó y en verde lo que se añadió.`;
  document.getElementById('compare-list').innerHTML = items.join('');
  document.getElementById('compare').hidden = false;
  document.getElementById('compare-toggle-wrap').hidden = false;
  document.getElementById('preview-label-before').textContent = `Antes · versión ${parent.number}`;
  document.getElementById('preview-label-after').textContent = `Después · versión ${self.number}`;
}

document.getElementById('compare-toggle').addEventListener('change', (e) => {
  const on = e.target.checked && !!compareParent;
  document.getElementById('preview-stage').classList.toggle('is-compare', on);
  document.getElementById('preview-col-before').hidden = !on;
  document.getElementById('preview-label-after').hidden = !on;
  if (on) renderFrame('before');
  applyPreviewView(readCheckedView());
});

document.querySelectorAll('input[name="previewView"]').forEach((r) =>
  r.addEventListener('change', () => {
    try {
      localStorage.setItem('previewView', r.value);
    } catch {
      // sin almacenamiento: solo dura esta visita
    }
    applyPreviewView(r.value);
    // Al cambiar el ancho, el contenido se recoloca (media queries): se vuelve a medir la altura.
    requestAnimationFrame(() => requestAnimationFrame(fitFrames));
  })
);
new ResizeObserver(() => {
  if (!document.getElementById('job-result').hidden) applyPreviewView(readCheckedView());
}).observe(document.getElementById('preview-stage'));

// ---------------------------------------------------------------- vista previa: altura real y modo oscuro
// La vista previa se pinta desde el HTML ya descargado (srcdoc) en un marco con sandbox="allow-same-origin"
// y SIN allow-scripts: ningún script de la pieza se ejecuta (el HTML lo escribe un modelo que ha leído
// webs), pero Studio puede medir su altura y mostrarla entera, sin barra de scroll interna (2026-09-28).
// Antes era un marco de 720 px con la pieza cargada por URL (CSP sandbox: no se podía medir).

let compareBeforeHtml = null;

/** Aproximación a Gmail y Outlook en móvil con modo oscuro: invierten fondos y textos claros y dejan
 *  las fotos como están. El fondo exterior imita el de esas apps. */
const INVERT_CSS =
  '<style data-studio-preview>' +
  'html{background:#121212!important}' +
  'body{filter:invert(1) hue-rotate(180deg)!important;min-height:100vh}' +
  'img,picture,video,[background],[style*="background-image"],[style*="background:url"],[style*="background: url"]{filter:invert(1) hue-rotate(180deg)!important}' +
  '</style>';

function readTheme() {
  try {
    const t = localStorage.getItem('previewTheme');
    return t === 'dark' || t === 'invert' ? t : 'light';
  } catch {
    return 'light';
  }
}

function currentTheme() {
  return document.querySelector('input[name="previewTheme"]:checked')?.value || 'light';
}

/** El marco sigue el modo claro/oscuro del sistema de quien mira, no el elegido aquí (probado: con el Mac
 *  en oscuro, "Claro" aplicaba los estilos oscuros; color-scheme en el <iframe> no lo cambia). Por eso
 *  las condiciones de la pieza se fijan en el propio HTML: (prefers-color-scheme: X) pasa a una
 *  condición que siempre se cumple o nunca, según el modo elegido. */
function forceScheme(html, scheme) {
  return html.replace(/\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)/gi, (_m, v) =>
    v.toLowerCase() === scheme ? '(min-width: 0px)' : '(max-width: 0px)'
  );
}

/** Declara la pieza que admite modo oscuro (<meta name="color-scheme" content="light dark">)? */
function declaresDark(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some(
    (m) => /name\s*=\s*["']?(color-scheme|supported-color-schemes)/i.test(m[0]) && /content\s*=\s*["'][^"']*dark/i.test(m[0])
  );
}

function themedHtml(html, theme) {
  const out = forceScheme(html, theme === 'dark' ? 'dark' : 'light');
  // Colores por defecto del navegador (fondo, texto, formularios): oscuros solo si la pieza lo declara.
  const scheme = theme === 'dark' && declaresDark(html) ? 'dark' : 'light';
  // Los enlaces de la pieza se abren en otra pestaña (antes, la web de la marca sustituía a la
  // newsletter dentro del marco). rel=noopener: la pestaña nueva no puede tocar Studio.
  const css = `<base target="_blank"><style data-studio-preview>html{color-scheme:${scheme}!important}</style>${theme === 'invert' ? INVERT_CSS : ''}`;
  const safeLinks = out.replace(/<a\b(?![^>]*\brel\s*=)/gi, '<a rel="noopener noreferrer"');
  return /<\/head>/i.test(safeLinks) ? safeLinks.replace(/<\/head>/i, `${css}</head>`) : css + safeLinks;
}

function resetFrame(frame) {
  frame.removeAttribute('src');
  frame.removeAttribute('srcdoc');
  frame.style.height = '';
  frame.style.colorScheme = '';
}

/** Pinta una de las dos vistas previas ('after' = esta versión, 'before' = la anterior al comparar).
 *  El modo oscuro no se aplica en caliente a un documento ya cargado: se recarga el marco. */
function renderFrame(which) {
  const frame = document.getElementById(which === 'before' ? 'preview-frame-before' : 'preview-frame');
  const html = which === 'before' ? compareBeforeHtml : currentHtml;
  if (!html) return;
  const theme = currentTheme();
  frame.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  frame.onload = fitFrames;
  frame.srcdoc = themedHtml(html, theme);
}

/** Alto de cada vista previa = alto real de la pieza a ese ancho. */
function fitFrames() {
  for (const id of ['preview-frame', 'preview-frame-before']) {
    const frame = document.getElementById(id);
    const doc = frame.getAttribute('srcdoc') ? frame.contentDocument : null;
    if (!doc || !doc.documentElement) continue;
    frame.style.height = '200px';
    void frame.offsetHeight; // aplica el alto mínimo antes de medir: así la medida también puede encoger
    const h = Math.max(doc.documentElement.scrollHeight, doc.body ? doc.body.scrollHeight : 0);
    frame.style.height = `${Math.max(200, Math.ceil(h))}px`;
  }
  applyPreviewView(readCheckedView());
}

function updateThemeHint() {
  const theme = currentTheme();
  const hint = document.getElementById('theme-hint');
  document.getElementById('preview-stage').classList.toggle('is-dark', theme !== 'light');
  hint.hidden = theme === 'light';
  if (theme === 'dark') {
    const hasDark = /prefers-color-scheme\s*:\s*dark/i.test(currentHtml || '');
    hint.textContent = hasDark
      ? 'Como Apple Mail o iOS Mail en modo oscuro: la pieza usa sus propios estilos oscuros.'
      : 'Como Apple Mail o iOS Mail en modo oscuro. Esta newsletter no define estilos oscuros (@media prefers-color-scheme), así que se ve igual que en claro.';
  } else if (theme === 'invert') {
    hint.textContent =
      'Aproximación a Gmail y Outlook en móvil con modo oscuro: invierten fondos y textos claros y dejan las fotos como están. El resultado real varía según la app.';
  }
}

document.querySelectorAll('input[name="previewTheme"]').forEach((r) =>
  r.addEventListener('change', () => {
    try {
      localStorage.setItem('previewTheme', r.value);
    } catch {
      // sin almacenamiento: solo dura esta visita
    }
    updateThemeHint();
    renderFrame('after');
    if (document.getElementById('preview-stage').classList.contains('is-compare')) renderFrame('before');
  })
);

function readCheckedView() {
  return document.querySelector('input[name="previewView"]:checked')?.value || 'desktop';
}

function formatMinutes(sec) {
  const min = Math.max(1, Math.round(sec / 60));
  return `${min} min`;
}

function renderProgress(job, queue, hermesOnline) {
  const box = document.getElementById('job-progress');
  const bar = document.getElementById('progress-bar');
  const track = box.querySelector('.progress-track');
  const p = job.progress;
  if (job.status === 'queued') {
    box.hidden = false;
    bar.style.width = '0%';
    track.setAttribute('aria-valuenow', '0');
    document.getElementById('progress-stage').textContent = queue?.ahead
      ? `En cola · ${queue.ahead} trabajo${queue.ahead === 1 ? '' : 's'} delante`
      : 'En cola · eres el siguiente';
    document.getElementById('progress-eta').textContent = queue?.ahead ? `empezará en unos ${formatMinutes(queue.startsInSec)} (estimado)` : '';
    const kind = job.input.revisionOf
      ? 'Aplicará los cambios pedidos: unos minutos.'
      : job.input.mobileFixOf
      ? 'Solo adapta la versión móvil: unos minutos.'
      : job.input.instruction
      ? 'Primero escribirá el brief creativo.'
      : '';
    const when = hermesOnline === false
      ? 'Hermes no está conectado ahora mismo: empezará cuando se conecte el Mac del worker.'
      : queue?.ahead
      ? 'Hermes lo recogerá cuando termine lo que tiene delante.'
      : 'Hermes lo recogerá en unos segundos.';
    document.getElementById('progress-detail').textContent = [when, kind].filter(Boolean).join(' ');
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
  track.setAttribute('aria-valuetext', `${p.pct} %, ${p.stageLabel}`);
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
    eta.textContent = 'recta final: revisando a su ritmo';
  }
  // Sin acciones no es lo mismo que colgado: el modelo puede estar escribiendo una respuesta larga
  // (Talaria, 2026-09-25: 5 min generando). Gris a partir de 3 min, amarillo a partir de 10.
  const quiet = idleSeconds(p);
  if (job.status === 'running' && quiet != null && quiet >= 180) {
    eta.textContent = quiet >= 600 ? `sin actividad desde hace ${formatAgo(quiet)}` : `generando respuesta · sin acciones desde hace ${formatAgo(quiet)}`;
    eta.classList.toggle('is-idle', quiet >= 600);
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

// ---------------------------------------------------------------- registro de Hermes

let lastLogKey = '';

/** Registro con la hora de cada línea, avisos y errores marcados y contados en el título (se ven aunque
 *  el registro esté plegado) y filtro "Solo avisos y errores". Solo se repinta si llegan líneas nuevas:
 *  así no se cierran las notas largas que alguien haya abierto (2026-09-28). */
function renderLog(events) {
  const key = `${currentJob}:${events.length}`;
  if (key === lastLogKey) return;
  lastLogKey = key;
  const warnings = events.filter((ev) => ev.level === 'error').length;
  document.getElementById('log-count').innerHTML =
    `· ${events.length} línea${events.length === 1 ? '' : 's'}` +
    (warnings ? ` · <span class="warn">${warnings} aviso${warnings === 1 ? '' : 's'} o error${warnings === 1 ? '' : 'es'}</span>` : '');
  document.getElementById('log-filter').hidden = !warnings;
  const log = document.getElementById('job-log');
  log.innerHTML = events
    .map((ev) => {
      const when = new Date(ev.ts);
      const time = isNaN(when) ? '' : when.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const phase = ev.phase && ev.phase !== 'hermes' ? `<strong>${escapeHtml(PHASE_LABELS[ev.phase] || ev.phase)}</strong> — ` : '';
      const text = String(ev.message || '');
      // Las notas finales de Hermes ocupan pantallas enteras: plegadas, con el principio a la vista.
      const msg =
        text.length > 280
          ? `<details><summary>${phase}${escapeHtml(text.slice(0, 160))}…</summary>${escapeHtml(text)}</details>`
          : phase + escapeHtml(text);
      return `<li class="log-${escapeHtml(ev.level)}"><time datetime="${escapeHtml(ev.ts || '')}">${time}</time><span class="msg">${msg}</span></li>`;
    })
    .join('');
  log.scrollTop = log.scrollHeight;
}

document.getElementById('log-only-warnings').addEventListener('change', (e) => {
  document.getElementById('log-box').classList.toggle('only-warnings', e.target.checked);
});

// ---------------------------------------------------------------- tema claro / oscuro

const THEMES = ['auto', 'light', 'dark'];
const THEME_LABEL = { auto: 'automático (como el sistema)', light: 'claro', dark: 'oscuro' };
const THEME_ICON = { auto: '◐', light: '☀', dark: '☾' };

function currentStudioTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'light' || t === 'dark' ? t : 'auto';
}

function renderThemeBtn() {
  const t = currentStudioTheme();
  const btn = document.getElementById('theme-btn');
  btn.textContent = THEME_ICON[t];
  btn.setAttribute('aria-label', `Tema: ${THEME_LABEL[t]}. Pulsa para cambiar.`);
  btn.title = `Tema: ${THEME_LABEL[t]}`;
}

document.getElementById('theme-btn').addEventListener('click', () => {
  const next = THEMES[(THEMES.indexOf(currentStudioTheme()) + 1) % THEMES.length];
  if (next === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', next);
  try {
    if (next === 'auto') localStorage.removeItem('studioTheme');
    else localStorage.setItem('studioTheme', next);
  } catch {
    // sin almacenamiento: vale para esta visita
  }
  renderThemeBtn();
  showToast(`Tema ${THEME_LABEL[next]}.`);
});
renderThemeBtn();

// ---------------------------------------------------------------- lectores de pantalla

/** Quitado/añadido también en texto: el color y el signo solos no llegan a un lector de pantalla. */
function srChange(type) {
  return `<span class="sr-only">${type === 'removed' ? 'Quitado: ' : 'Añadido: '}</span>`;
}

let lastAnnouncement = '';

function announce(message) {
  if (!message || message === lastAnnouncement) return;
  lastAnnouncement = message;
  const el = document.getElementById('sr-status');
  el.textContent = '';
  // Vaciar y volver a escribir en otro ciclo: así se anuncia aunque el texto se repita.
  setTimeout(() => (el.textContent = message), 50);
}

/** Solo cambios con sentido (estado, fase, puesto en la cola, resultado), no cada punto del porcentaje:
 *  con el progreso cada 10 s, anunciarlo todo haría la página inservible con lector de pantalla. */
function announceJob(job, queue) {
  const name = job.input.clientName;
  if (job.status === 'queued') {
    announce(queue?.ahead ? `${name}: en cola, ${queue.ahead} trabajo${queue.ahead === 1 ? '' : 's'} delante.` : `${name}: en cola, eres el siguiente.`);
  } else if (job.status === 'running') {
    announce(job.progress?.stageLabel ? `${name}: ${job.progress.stageLabel}.` : `${name}: Hermes ha empezado.`);
  } else if (job.status === 'completed') {
    const q = job.quality;
    const review = !q
      ? ''
      : q.errors
      ? ` La revisión automática encontró ${q.errors} error${q.errors === 1 ? '' : 'es'}.`
      : q.warnings
      ? ` Revisión automática: ${q.warnings} aviso${q.warnings === 1 ? '' : 's'}.`
      : ' Revisión automática: todo correcto.';
    announce(`${name}: la newsletter está lista.${review}`);
  } else if (job.status === 'cancelled') {
    announce(`${name}: trabajo cancelado.`);
  } else {
    announce(`${name}: el trabajo ha fallado. El motivo está en la página.`);
  }
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
    document.title = BASE_TITLE;
    loadHistory();
  }
}

// El navegador restaura el formulario anterior (así se coló un prompt de Prozis con la marca
// Adeslas seleccionada): cada visita empieza en blanco.
form.reset();
applyKind();
route();
