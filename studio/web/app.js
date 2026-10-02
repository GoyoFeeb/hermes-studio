const form = document.getElementById('brief-form');
const viewForm = document.getElementById('view-form');
const viewJob = document.getElementById('view-job');
const viewBrand = document.getElementById('view-brand');
const hero = document.querySelector('.hero');
const clientNameInput = document.getElementById('client-name-input');
const existingBrandInput = document.getElementById('existing-brand-input');

// ---------------------------------------------------------------- acceso a la API (2026-09-30)
// La página es pública pero /api pide la contraseña del equipo (Basic Auth). Sin ella todo respondía 401
// y la página se quedaba a medias sin avisar: píldora vacía, sin historial ni marcas. Ahora cualquier 401
// muestra el aviso de arriba, y los refrescos periódicos se paran (cada intento fallido cuenta para el
// límite de intentos del servidor).
let authMissing = false;

/** Mensaje cuando no llega la respuesta (sin red o Studio caído). Antes, cinco acciones fallaban sin avisar:
 *  el botón volvía a su estado y el error solo quedaba en la consola (2026-09-30). */
const NETWORK_ERROR = 'No se pudo conectar con Studio. Revisa la conexión e inténtalo de nuevo.';

async function apiFetch(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    authMissing = true;
    document.getElementById('auth-banner').hidden = false;
  } else if (authMissing) {
    authMissing = false;
    document.getElementById('auth-banner').hidden = true;
  }
  return res;
}
document.getElementById('auth-reload').addEventListener('click', () => location.reload());

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
    ? 'Marca conocida.'
    : 'Marca nueva: Hermes la investigará desde cero.';
  if (match) describeKnownBrand(match);
}

// Qué sabe Hermes de una marca conocida (2026-10-01): antes el aviso decía siempre «usará sus colores,
// tipografías y logos», pero 16 de 34 marcas no tienen brand pack medido (solo logos o nada).
const brandSummaries = new Map();
async function describeKnownBrand(slug) {
  const hint = document.getElementById('brand-match');
  const render = (data) => {
    if (existingBrandInput.value !== slug) return;
    const card = data?.card;
    const text = !card
      ? 'Marca conocida.'
      : card.hasPack
      ? 'Marca conocida: Hermes usará su brand pack (colores, tipografías, tono y logos).'
      : card.assets.logos.length
      ? 'Marca conocida, sin brand pack medido: Hermes usará sus logos e investigará colores y tono.'
      : 'Marca conocida, sin brand pack ni logos: Hermes la investigará como nueva.';
    hint.innerHTML = `${escapeHtml(text)} <a href="?brand=${encodeURIComponent(slug)}" target="_blank" rel="noopener">Ver ficha</a>`;
  };
  if (brandSummaries.has(slug)) return render(brandSummaries.get(slug));
  try {
    const res = await apiFetch(`/api/brands/${encodeURIComponent(slug)}`);
    if (!res.ok) return;
    const data = await res.json();
    brandSummaries.set(slug, data);
    render(data);
  } catch {
    // sin red: se queda el aviso corto
  }
}
clientNameInput.addEventListener('input', updateBrandMatch);

async function loadBrands() {
  try {
    const res = await apiFetch('/api/brands');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

// ---------------------------------------------------------------- lo que suele tardar (2026-09-28)
// Mediana real de los últimos trabajos de cada tipo (servidor, typicalDurations). Sin datos, lo de siempre.
let typicalDurations = null;

function etaText(kind) {
  const t = typicalDurations?.[kind];
  if (!t) return null;
  return `~${Math.max(1, Math.round(t.sec / 60))} min`;
}

// Cola de Hermes vista desde el formulario (2026-09-30, /api/status → wait): antes el aviso decía "suele
// tardar ~20 min" aunque Hermes estuviera con otra newsletter y hubiera más esperando.
let queueWaitNow = null;
let hermesOnlineNow = true;

const clockAt = (sec) => new Date(Date.now() + sec * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function renderEtaHints() {
  const kind = form.querySelector('input[name="inputKind"]:checked')?.value === 'brief' ? 'brief' : 'instruction';
  const t = typicalDurations?.[kind];
  const ahead = queueWaitNow?.ahead || 0;
  let text = '';
  if (ahead && t) {
    const others = ahead === 1 ? 'otra newsletter' : `otras ${ahead} newsletters`;
    const startMin = Math.max(1, Math.round(queueWaitNow.seconds / 60));
    text = `Hermes tiene delante ${others}: la tuya empezaría en ~${startMin} min y estaría lista hacia las ${clockAt(queueWaitNow.seconds + t.sec)}. `;
  } else if (t) {
    text = t.n
      ? `Suele tardar ${etaText(kind)} (mediana de las últimas ${t.n} con ${kind === 'brief' ? 'prompt completo' : 'instrucción rápida'}). `
      : `Suele tardar ${etaText(kind)}. `;
  }
  if (!hermesOnlineNow) text += 'Hermes no está conectado ahora: empezará en cuanto vuelva. ';
  document.getElementById('eta-hint').textContent = text;
  document.querySelectorAll('[data-eta="new"]').forEach((el) => (el.textContent = t ? etaText(kind) : 'unos 20 minutos'));
  // Cambios y adaptaciones a móvil también esperan su turno (2026-09-30): con cola, cuándo estarían listos.
  const retouchEta = (k) => {
    const d = typicalDurations?.[k];
    if (!d) return 'unos minutos';
    return ahead ? `lista hacia las ${clockAt(queueWaitNow.seconds + d.sec)}, con ${ahead} delante` : `suele tardar ${etaText(k)}`;
  };
  document.querySelectorAll('[data-eta="revision"]').forEach((el) => (el.textContent = retouchEta('revision')));
  document.querySelectorAll('[data-eta="mobile-fix"]').forEach((el) => (el.textContent = retouchEta('mobile-fix')));
  document.querySelectorAll('[data-eta="brief"]').forEach((el) => (el.textContent = etaText('brief') || 'unos 20 minutos'));
  const fix = etaText('mobile-fix');
  if (fix) document.getElementById('mobile-fix-btn').title = `Hermes adapta esta misma pieza a móvil sin cambiar el diseño de escritorio (suele tardar ${fix})`;
}

async function loadHermesStatus() {
  clearTimeout(statusTimer);
  const el = document.getElementById('hermes-status');
  let busy = false;
  try {
    const res = await apiFetch('/api/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { hermesOnline, current, queued = 0, typical, wait } = await res.json();
    queueWaitNow = wait || null; // sin `wait` (servidor anterior): el aviso de siempre
    hermesOnlineNow = !!hermesOnline;
    if (typical) typicalDurations = typical;
    renderEtaHints();
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
    el.textContent = authMissing ? 'Sin sesión' : 'Sin conexión con Studio';
    el.removeAttribute('href');
    el.title = authMissing ? 'Falta la contraseña del equipo: recarga la página e inicia sesión.' : 'No se ha podido consultar el estado. Se reintentará en un minuto.';
    el.className = 'status-pill is-error';
  }
  if (authMissing) return;
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
// prompt completo ya generado con la skill. Los textos no nombran la skill: al equipo no le dice nada (2026-09-30).
const KIND_COPY = {
  instruction: {
    label: 'Instrucción',
    rows: 4,
    placeholder: 'Ej: quiero una newsletter de Adeslas para presentar su seguro dental a familias',
    hint: 'Cuéntalo en una frase: Hermes lo convierte en un brief creativo completo y después hace la newsletter.',
  },
  brief: {
    label: 'Prompt creativo',
    rows: 14,
    placeholder: 'Pega aquí el prompt de dirección creativa completo (concepto, escenas, tono, textos…).',
    hint: 'Hermes sigue tu prompt tal cual, sin reinterpretarlo.',
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
  // Con prompt completo no hay brief que revisar: el prompt ya es el brief.
  document.getElementById('review-brief-field').hidden = kind !== 'instruction';
  updateExamples();
}
form.querySelectorAll('input[name="inputKind"]').forEach((r) =>
  r.addEventListener('change', () => {
    applyKind();
    renderEtaHints();
  })
);
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
    syncRequester();
    // Origen de las imágenes (2026-09-30): el de la última newsletter enviada o, la primera vez, los
    // assets oficiales. Un borrador o un trabajo reutilizado que ya lo traen marcado mandan.
    if (!form.querySelector('input[name="imageMode"]:checked')) {
      let mode = 'official';
      try {
        mode = localStorage.getItem('imageMode') || mode;
      } catch {
        // sin almacenamiento
      }
      const radio = form.querySelector(`input[name="imageMode"][value="${CSS.escape(mode)}"]`);
      if (radio) radio.checked = true;
    }
    try {
      document.getElementById('review-brief-input').checked = localStorage.getItem('reviewBrief') === '1';
    } catch {
      // sin almacenamiento
    }
  })
);

// Quién pide (2026-09-30): con el nombre ya guardado, arriba se lee "Pidiendo como …" y el campo del
// final se oculta; "Cambiar" lo vuelve a mostrar. Sin nombre guardado, el campo se ve como siempre.
let requesterEditing = false;
function syncRequester() {
  const name = savedRequester();
  const compact = !!name && !requesterEditing;
  document.getElementById('requester-note-name').textContent = name;
  document.getElementById('requester-note').hidden = !compact;
  document.getElementById('requester-field').hidden = compact;
}
document.getElementById('requester-change').addEventListener('click', () => {
  requesterEditing = true;
  syncRequester();
  const input = document.getElementById('requester-input');
  input.focus();
  input.select();
});

// ---------------------------------------------------------------- ejemplos de instrucción
// Para quien entra por primera vez: rellenan la instrucción y la marca. Solo con la instrucción vacía
// (o con otro ejemplo): nunca pisan lo que alguien ha escrito.
const EXAMPLES = [
  { label: 'Adeslas · dental', brand: 'Adeslas', text: 'quiero una newsletter de Adeslas para presentar su seguro dental a familias con niños' },
  { label: 'Nike · lanzamiento', brand: 'Nike', text: 'newsletter de Nike para el lanzamiento de sus nuevas zapatillas de running' },
  { label: 'El Corte Inglés · moda', brand: 'El Corte Inglés', text: 'newsletter de El Corte Inglés con las novedades de moda de la nueva temporada' },
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
  scheduleDraftSave();
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
const vagueWarning = document.getElementById('vague-warning');
let pendingPayload = null;
let vaguePayload = null;

function clearFormNotices() {
  brandWarning.hidden = true;
  vagueWarning.hidden = true;
  formError.hidden = true;
  pendingPayload = null;
  vaguePayload = null;
}

async function submitJob(payload) {
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  document.getElementById('brand-send-anyway').disabled = true;
  clearFormNotices();
  try {
    const res = await apiFetch('/api/jobs', {
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
      formError.textContent =
        res.status === 401 ? 'No se ha enviado: necesitas iniciar sesión (mira el aviso de arriba). Tu texto se queda guardado como borrador.' : data.error || 'No se pudo enviar el brief.';
      formError.hidden = false;
      return;
    }
    try {
      localStorage.setItem('requesterName', payload.requesterName || '');
      localStorage.setItem('imageMode', payload.imageMode || '');
      if (payload.inputKind === 'instruction') localStorage.setItem('reviewBrief', payload.reviewBrief ? '1' : '0');
    } catch {
      // sin almacenamiento: no se recuerda
    }
    requesterEditing = false;
    clearDraft();
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
  } catch {
    formError.textContent = NETWORK_ERROR;
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    document.getElementById('brand-send-anyway').disabled = false;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.reviewBrief = payload.inputKind === 'instruction' && payload.reviewBrief === 'true';
  // Instrucción poco concreta (formcheck.js): se avisa antes de gastar 20 minutos de Hermes, sin bloquear.
  const issues = HermesFormCheck.checkInstruction(payload.promptText, payload.inputKind, payload.clientName);
  if (issues.length) {
    clearFormNotices();
    vaguePayload = payload;
    document.getElementById('vague-list').innerHTML = issues.map((i) => `<li>${escapeHtml(i.message)}</li>`).join('');
    vagueWarning.hidden = false;
    document.getElementById('vague-complete').focus();
    return;
  }
  submitJob(payload);
});
document.getElementById('vague-send-anyway').addEventListener('click', () => {
  if (vaguePayload) submitJob(vaguePayload);
});
document.getElementById('vague-complete').addEventListener('click', () => {
  clearFormNotices();
  promptInput.focus();
  promptInput.setSelectionRange(promptInput.value.length, promptInput.value.length);
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
  if (!brandWarning.hidden || !vagueWarning.hidden) clearFormNotices();
});

// ---------------------------------------------------------------- borrador del formulario
// Borrador (2026-09-28): lo escrito y sin enviar se guarda en este navegador y se recupera al volver,
// con un aviso visible y "Descartar". No es el autorrelleno del navegador (que se desactiva con el
// form.reset() del arranque): aquel se coló sin avisar y mezcló un prompt de Prozis con la marca Adeslas.
const DRAFT_KEY = 'formDraft';
const DRAFT_MAX_AGE = 14 * 24 * 3600 * 1000;
let draftTimer = null;

function readDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!d || Date.now() - d.savedAt > DRAFT_MAX_AGE || !(d.promptText || '').trim()) return null;
    return d;
  } catch {
    return null;
  }
}

function saveDraft() {
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    if (!(data.promptText || '').trim()) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ inputKind: data.inputKind, clientName: data.clientName, promptText: data.promptText, imageMode: data.imageMode || '', savedAt: Date.now() })
    );
  } catch {
    // sin almacenamiento: no hay borrador
  }
}

function scheduleDraftSave() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 400);
}

function clearDraft() {
  clearTimeout(draftTimer);
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // sin almacenamiento
  }
  document.getElementById('draft-note').hidden = true;
}

/** Rellena el formulario con el borrador (tras un form.reset) y lo dice. */
async function restoreDraft() {
  const d = readDraft();
  document.getElementById('draft-note').hidden = true;
  if (!d) return;
  setKind(d.inputKind === 'brief' ? 'brief' : 'instruction');
  clientNameInput.value = d.clientName || '';
  promptInput.value = d.promptText;
  const radio = d.imageMode && form.querySelector(`input[name="imageMode"][value="${CSS.escape(d.imageMode)}"]`);
  if (radio) radio.checked = true;
  updateExamples();
  const min = Math.round((Date.now() - d.savedAt) / 60000);
  const ago = min < 1 ? 'hace un momento' : min < 60 ? `hace ${min} min` : min < 48 * 60 ? `hace ${Math.round(min / 60)} h` : `hace ${Math.round(min / 1440)} días`;
  document.getElementById('draft-note-text').textContent = `Borrador sin enviar recuperado (guardado ${ago}).`;
  document.getElementById('draft-note').hidden = false;
  await brandsReady;
  updateBrandMatch();
}

form.addEventListener('input', scheduleDraftSave);
form.addEventListener('change', scheduleDraftSave);
document.getElementById('draft-discard').addEventListener('click', () => {
  clearDraft();
  form.reset();
  promptInput.focus();
});
form.addEventListener('reset', clearFormNotices);

// ---------------------------------------------------------------- avisos flotantes

let toastTimer = null;
/** `action` (opcional): { label, run } → un botón en el aviso, que dura más para dar tiempo a pulsarlo. */
function showToast(message, level = 'info', action = null) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link-btn toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      toast.hidden = true;
      action.run();
    });
    toast.appendChild(btn);
  }
  toast.classList.toggle('is-error', level === 'error');
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), action ? 10000 : level === 'error' ? 7000 : 3000);
}

const STATUS_LABELS = {
  queued: 'En cola',
  running: 'Trabajando',
  review: 'Brief por revisar',
  completed: 'Lista',
  failed: 'Fallida',
  blocked: 'Bloqueada',
  cancelled: 'Cancelada',
};

const IMAGE_LABELS = { official: 'Assets oficiales', ai: 'Imágenes con IA' };

// ---------------------------------------------------------------- historial

const HISTORY_PAGE = 20;
const historyState = { jobs: [], query: '', brand: '', status: '', mine: false, archived: false, shown: HISTORY_PAGE, view: 'list' };
try {
  historyState.view = localStorage.getItem('historyView') === 'gallery' ? 'gallery' : 'list';
} catch {
  // sin almacenamiento
}

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
/** "← Todas las newsletters" lleva al historial cuando termina de cargar. */
let scrollToHistory = false;

// Atajo al historial desde arriba (2026-09-30): queda debajo de todo el formulario y quien entra a ver
// cómo va su newsletter tenía que bajar más de una pantalla. Cuenta newsletters, no versiones.
function renderHistoryJump(jobs) {
  const link = document.getElementById('history-jump');
  const live = jobs.filter((j) => !j.archivedAt);
  const newsletters = live.filter((j) => !j.revisionOf && !j.mobileFixOf && !j.textEditOf && !j.retryOf).length;
  const active = live.filter((j) => j.status === 'running' || j.status === 'queued' || j.status === 'review').length;
  link.hidden = !newsletters;
  link.innerHTML = `Historial · ${newsletters} newsletter${newsletters === 1 ? '' : 's'}${
    active ? ` <span class="is-busy">· ${active} en curso</span>` : ''
  } <span aria-hidden="true">↓</span>`;
}
document.getElementById('how-btn').addEventListener('click', (e) => {
  const panel = document.getElementById('how-panel');
  panel.hidden = !panel.hidden;
  e.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
});
document.getElementById('history-jump').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('history').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

async function loadHistory() {
  clearTimeout(historyTimer);
  try {
    const res = await apiFetch('/api/jobs');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { jobs } = await res.json();
    assignFamilyTitles(jobs);
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
    renderHistoryJump(jobs);

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
    // Después de pintar la lista: antes, la página aún era demasiado corta para llegar al historial.
    if (scrollToHistory && jobs.length) document.getElementById('history').scrollIntoView({ block: 'start' });
    scrollToHistory = false;
    // Mientras haya trabajos en curso, el historial se refresca solo.
    if (jobs.some((j) => j.status === 'running' || j.status === 'queued')) {
      historyTimer = setTimeout(loadHistory, 20000);
    }
  } catch (err) {
    console.error('No se pudo cargar el historial', err);
    // Sin sesión no se insiste (cada intento cuenta para el límite del servidor); si no, en 30 s.
    if (!authMissing) historyTimer = setTimeout(loadHistory, 30000);
  }
}

function filteredJobs() {
  const q = normalize(historyState.query);
  return historyState.jobs.filter((j) => {
    if (historyState.brand && (j.clientSlug || j.clientName) !== historyState.brand) return false;
    if (historyState.status === 'active' && j.status !== 'running' && j.status !== 'queued' && j.status !== 'review') return false;
    if (historyState.status === 'completed' && j.status !== 'completed') return false;
    if (historyState.status === 'failed' && j.status !== 'failed' && j.status !== 'blocked') return false;
    if (historyState.status === 'approved' && !j.approvedAt) return false;
    // Archivadas (2026-09-28): fuera del historial salvo con el chip "Archivadas".
    if (!!j.archivedAt !== historyState.archived) return false;
    if (q && !normalize(`${j.clientName} ${j.requesterName || ''} ${j.familyTitle || ''}`).includes(q)) return false;
    if (historyState.mine && normalize(j.requesterName || '') !== normalize(savedRequester())) return false;
    return true;
  });
}

/** Nombre de cada newsletter (2026-10-01): el que le puso el equipo (en la versión raíz) o, si no, el asunto de
 *  su versión terminada más reciente. Antes cada fila decía solo la marca y varias de Nike no se distinguían. */
function assignFamilyTitles(jobs) {
  const info = familyInfo(jobs);
  const byRoot = new Map();
  for (const j of jobs) {
    const root = info.get(j.id).root;
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(j);
  }
  for (const [root, members] of byRoot) {
    const rootJob = members.find((m) => m.id === root);
    const latest = members.filter((m) => m.subject).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const title = rootJob?.title || latest?.subject || null;
    for (const m of members) m.familyTitle = title;
  }
}

/** Familias de versiones (2026-09-28): cada "Pedir cambios" o "Adaptar a móvil" cuelga de la newsletter
 *  de la que sale. Número de versión por orden de creación y fecha de la última versión de la familia. */
function familyInfo(jobs) {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const parentOf = (j) => j.revisionOf || j.mobileFixOf || j.textEditOf || j.retryOf || null;
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

/** Historial por newsletter (2026-09-28): una fila por familia de versiones. La fila muestra la versión
 *  más reciente que cumple el filtro; las demás van plegadas debajo ("Versiones anteriores"). */
const openFamilies = new Set();

function jobKindLabel(j) {
  return j.revisionOf ? 'Cambios' : j.mobileFixOf ? 'Adaptación a móvil' : j.textEditOf ? 'Texto editado' : j.retryOf ? 'Reintento' : j.fromInstruction ? 'Desde instrucción' : null;
}

/** Lo que ha hecho el cliente en su enlace (2026-10-01), para la fila del historial. */
function clientLabel(j) {
  if (!j.client) return null;
  if (j.client.decision === 'approved') return 'Cliente: aprobada';
  if (j.client.decision === 'changes') return 'Cliente: pide cambios';
  return j.client.open ? `Cliente: ${j.client.open} comentario${j.client.open === 1 ? '' : 's'}` : null;
}

/** "tardó 9 min" (de que Hermes lo recoge a que termina); los retoques de texto son al momento. */
function durationLabel(j) {
  if (j.status !== 'completed') return null;
  if (j.textEditOf) return 'sin Hermes';
  const sec = j.durationSec ?? j.elapsedSec;
  return sec ? `tardó ${formatMinutes(sec)}` : null;
}

/** Fallidos que ya tienen un reintento: no se ofrece reintentarlos otra vez desde el historial (2026-10-01). */
let retriedIds = new Set();

function jobActions(j, { compact = false } = {}) {
  const id = encodeURIComponent(j.id);
  return [
    `<a class="btn btn-ghost row-view" href="?job=${id}">Ver</a>`,
    j.status === 'completed' ? `<a class="btn btn-ghost" href="/api/jobs/${id}/result?download=1">Descargar</a>` : '',
    (j.status === 'failed' || j.status === 'cancelled' || j.status === 'blocked') &&
    !retriedIds.has(j.id) &&
    (!j.error || window.HermesFailure.explainFailure(j.error).retry) // sin la versión de partida, reintentar no sirve
      ? `<button type="button" class="btn btn-secondary" data-retry="${escapeHtml(j.id)}">Reintentar</button>`
      : '',
  ].join('');
}

/** Menú "⋯" de cada fila (2026-10-01): antes, 3-4 botones iguales por fila. A la vista quedan los de uso
 *  frecuente (Ver, Descargar o Reintentar); Reutilizar y Archivar/Recuperar van aquí. */
let openRowMenu = null;
function rowMenu(j, archiveBtn) {
  const id = escapeHtml(j.id);
  const items = [
    `<button type="button" class="menu-item" data-reuse="${id}">Reutilizar la petición</button>`,
    archiveBtn,
  ].join('');
  return `<details class="row-menu" data-menu="${id}"${openRowMenu === j.id ? ' open' : ''}>
      <summary class="btn btn-ghost row-menu-btn" aria-label="Más acciones: ${escapeHtml(j.clientName)}" title="Más acciones">⋯</summary>
      <div class="row-menu-pop">${items}</div>
    </details>`;
}

function closeRowMenus(except) {
  document.querySelectorAll('.row-menu[open]').forEach((d) => d !== except && d.removeAttribute('open'));
  if (!except) openRowMenu = null;
}
// Abrir uno cierra los demás y se recuerda para el repintado del historial. Con el clic y no con el evento
// toggle: este llega después y, con dos clics seguidos, quedaban dos menús abiertos y uno tapaba al otro.
document.addEventListener('click', (e) => {
  const summary = e.target.closest('.row-menu > summary');
  if (summary) {
    const menu = summary.parentElement;
    closeRowMenus(menu);
    openRowMenu = menu.open ? null : menu.dataset.menu; // el navegador lo abre o cierra justo después
    return;
  }
  if (!e.target.closest('.row-menu') || e.target.closest('.menu-item')) closeRowMenus();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !openRowMenu) return;
  const open = document.querySelector('.row-menu[open]');
  closeRowMenus();
  open?.querySelector('summary')?.focus();
});

function statusLabel(j) {
  const running = j.status === 'running' && j.pct != null;
  return (STATUS_LABELS[j.status] || j.status) + (running ? ` · ${j.pct}%` : '');
}

// Fila de cifras (2026-10-02, como la de feebbodigital.com): newsletters, en curso y aprobadas de lo que está a
// la vista. Cuenta newsletters (familias), no versiones; cada cifra pone su filtro de estado.
const STAT_ACTIVE = new Set(['running', 'queued', 'review']);
function renderHistoryStats(families) {
  const box = document.getElementById('history-stats');
  const stats = [
    { status: '', n: families.length, one: 'newsletter', many: 'newsletters' },
    { status: 'active', n: families.filter((m) => m.some((j) => STAT_ACTIVE.has(j.status))).length, one: 'en curso', many: 'en curso' },
    { status: 'approved', n: families.filter((m) => m.some((j) => j.approvedAt)).length, one: 'aprobada', many: 'aprobadas' },
  ];
  box.hidden = !families.length;
  box.innerHTML = stats
    .map(
      (st) =>
        `<button type="button" class="stat${historyState.status === st.status ? ' is-active' : ''}" data-stat="${st.status}" aria-pressed="${historyState.status === st.status}">` +
        `<span class="stat-num">${st.n}</span><span class="stat-label">${st.n === 1 ? st.one : st.many}</span></button>`
    )
    .join('');
}
document.getElementById('history-stats').addEventListener('click', (e) => {
  const stat = e.target.closest('[data-stat]');
  if (!stat) return;
  document.querySelector(`#history-status .chip[data-status="${stat.dataset.stat}"]`)?.click();
});

function renderHistory() {
  renderMineChip();
  const info = familyInfo(historyState.jobs);
  retriedIds = new Set(historyState.jobs.map((j) => j.retryOf).filter(Boolean));
  const families = new Map();
  for (const j of historyState.jobs) {
    const root = info.get(j.id).root;
    if (!families.has(root)) families.set(root, []);
    families.get(root).push(j);
  }
  const matching = new Set(filteredJobs().map((j) => j.id));
  const groups = [];
  for (const [root, members] of families) {
    const hits = members.filter((j) => matching.has(j.id));
    if (!hits.length) continue;
    const byNumber = (a, b) => info.get(b.id).number - info.get(a.id).number;
    const lead = [...hits].sort(byNumber)[0];
    groups.push({ root, lead, others: members.filter((j) => j !== lead).sort(byNumber), latest: info.get(lead.id).latest });
  }
  groups.sort((a, b) => b.latest.localeCompare(a.latest) || a.root.localeCompare(b.root));

  const visible = groups.slice(0, historyState.shown);
  // Las cuentas, de lo que está a la vista (archivadas o no); el chip dice cuántas hay archivadas.
  const scoped = [...families.values()].filter((m) => m.some((j) => !!j.archivedAt === historyState.archived));
  const archivedFamilies = [...families.values()].filter((m) => m.every((j) => j.archivedAt)).length;
  const archivedChip = document.getElementById('archived-chip');
  archivedChip.hidden = !archivedFamilies && !historyState.archived;
  archivedChip.textContent = `Archivadas (${archivedFamilies})`;
  archivedChip.setAttribute('aria-pressed', String(historyState.archived));
  const scopedJobs = scoped.reduce((n, m) => n + m.length, 0);
  const newsletters = (n) => `${n} newsletter${n === 1 ? '' : 's'}${historyState.archived ? (n === 1 ? ' archivada' : ' archivadas') : ''}`;
  const count = scoped.length === scopedJobs ? newsletters(scopedJobs) : `${newsletters(scoped.length)} · ${scopedJobs} versiones`;
  document.getElementById('history-count').textContent = groups.length === scoped.length ? count : `${groups.length} de ${newsletters(scoped.length)}`;
  renderHistoryStats(scoped);
  document.getElementById('history-empty').hidden = groups.length > 0;
  document.getElementById('history-more').hidden = groups.length <= visible.length;

  const listEl = document.getElementById('history-list');
  listEl.classList.toggle('is-gallery', historyState.view === 'gallery');
  document.querySelectorAll('[data-history-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.historyView === historyState.view)));
  if (historyState.view === 'gallery') {
    listEl.innerHTML = renderGallery(visible, info);
    return;
  }
  listEl.innerHTML = visible
    .map(({ root, lead: j, others }) => {
      const id = encodeURIComponent(j.id);
      const when = new Date(j.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
      const fam = info.get(j.id);
      const version = fam.size > 1 ? `<span class="version-tag">Versión ${fam.number} de ${fam.size}</span> · ` : '';
      const approvedJob = [j, ...others].find((x) => x.approvedAt);
      const approved = approvedJob
        ? `<span class="approved-tag">✓ Aprobada${fam.size > 1 ? ` (versión ${info.get(approvedJob.id).number})` : ''}</span> · `
        : '';
      const busy = [j, ...others].some((x) => x.status === 'queued' || x.status === 'running' || x.status === 'review');
      const archiveBtn = j.archivedAt
        ? `<button type="button" class="menu-item" data-unarchive="${escapeHtml(j.id)}">Recuperar del archivo</button>`
        : busy
        ? ''
        : `<button type="button" class="menu-item" data-archive="${escapeHtml(j.id)}">Archivar<small>Con todas sus versiones; no se borra</small></button>`;
      const meta = approved + version + [when, j.requesterName, jobKindLabel(j), IMAGE_LABELS[j.imageMode], durationLabel(j), clientLabel(j)]
        .filter(Boolean)
        .map(escapeHtml)
        .join(' · ');
      const running = j.status === 'running' && j.pct != null;
      const initials = String(j.clientName || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      // Miniatura: la de esta versión o, si aún no tiene (en curso), la de la versión más reciente que la tenga.
      const withThumb = [j, ...others].find((x) => x.hasThumb);
      const thumb = withThumb
        ? `<a class="thumb" href="?job=${id}" tabindex="-1" aria-hidden="true"><img src="/api/jobs/${encodeURIComponent(withThumb.id)}/thumb" alt="" loading="lazy" width="48" height="64" data-initials="${escapeHtml(initials)}"></a>`
        : `<a class="thumb thumb-empty" href="?job=${id}" tabindex="-1" aria-hidden="true">${escapeHtml(initials)}</a>`;
      const open = openFamilies.has(root);
      const listId = `fam-${escapeHtml(root)}`;
      const older = others.length
        ? `<button type="button" class="family-toggle" data-family="${escapeHtml(root)}" aria-expanded="${open}" aria-controls="${listId}">${open ? 'Ocultar' : 'Ver'} ${others.length === 1 ? 'la otra versión' : `las otras ${others.length} versiones`}</button>
          <ol class="family-list" id="${listId}"${open ? '' : ' hidden'}>${others
            .map((o) => {
              const oWhen = new Date(o.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
              const oMeta = [oWhen, jobKindLabel(o) || 'Original', durationLabel(o)]
                .filter(Boolean)
                .map(escapeHtml)
                .join(' · ');
              return `<li>
                <a class="family-name" href="?job=${encodeURIComponent(o.id)}">Versión ${info.get(o.id).number}</a>
                <span class="status-badge status-${escapeHtml(o.status)}">${escapeHtml(statusLabel(o))}</span>
                <span class="meta">${oMeta}</span>
                <span class="row-actions">${jobActions(o, { compact: true })}</span>
              </li>`;
            })
            .join('')}</ol>`
        : '';
      return `<li class="job-row">
          ${thumb}
          <a class="name" href="?job=${id}">${escapeHtml(j.clientName)}${j.familyTitle ? `<span class="row-title">${escapeHtml(j.familyTitle)}</span>` : ''}</a>
          <span class="status-badge status-${escapeHtml(j.status)}">${escapeHtml(statusLabel(j))}</span>
          <p class="meta">${meta}</p>
          <div class="row-actions">${jobActions(j)}${rowMenu(j, archiveBtn)}</div>
          ${running ? `<div class="mini-track" aria-hidden="true"><div style="width:${Number(j.pct) || 0}%"></div></div>` : ''}
          ${j.error ? `<p class="err">${escapeHtml(window.HermesFailure.explainFailure(j.error).summary)}</p>` : ''}
          ${older}
        </li>`;
    })
    .join('');
}

/** Galería (2026-09-28): miniaturas grandes con la misma selección y orden que la lista. La tarjeta lleva
 *  a la versión que representa la familia; las acciones (descargar, archivar…) siguen en la vista de lista.
 *  Desde 2026-09-30, una sola cuadrícula con la marca en cada tarjeta: agrupada por marca, con una o dos
 *  newsletters por marca salía una fila por tarjeta y mucho hueco. */
function renderGallery(groups, info) {
  const cards = groups
    .map(({ lead: j, others }) => {
      const id = encodeURIComponent(j.id);
      const fam = info.get(j.id);
      const withThumb = [j, ...others].find((x) => x.hasThumb);
      const initials = String(j.clientName || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      const thumb = withThumb
        ? `<span class="thumb"><img src="/api/jobs/${encodeURIComponent(withThumb.id)}/thumb" alt="" loading="lazy" width="150" height="200" data-initials="${escapeHtml(initials)}"></span>`
        : `<span class="thumb thumb-empty">${escapeHtml(initials)}</span>`;
      const approved = [j, ...others].find((x) => x.approvedAt);
      const when = new Date(j.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const bits = [
        when,
        fam.size > 1 ? `${fam.size} versiones` : null,
        jobKindLabel(j),
      ].filter(Boolean);
      const status = j.status === 'completed' ? '' : `<span class="status-badge status-${escapeHtml(j.status)}">${escapeHtml(statusLabel(j))}</span>`;
      return `<li><a class="g-card" href="?job=${id}" title="${escapeHtml(`${j.clientName} · ${new Date(j.createdAt).toLocaleString('es-ES')}`)}">
          ${thumb}
          <span class="g-name">${escapeHtml(j.clientName)}</span>${j.familyTitle ? `<span class="g-title">${escapeHtml(j.familyTitle)}</span>` : ''}
          <span class="g-meta">${escapeHtml(bits.join(' · '))}</span>
          ${approved ? `<span class="approved-tag">✓ Aprobada${fam.size > 1 ? ` (v${info.get(approved.id).number})` : ''}</span>` : ''}
          ${status}
        </a></li>`;
    })
    .join('');
  return `<li class="g-all"><ul class="g-grid">${cards}</ul></li>`;
}

document.querySelectorAll('[data-history-view]').forEach((b) =>
  b.addEventListener('click', () => {
    historyState.view = b.dataset.historyView;
    try {
      localStorage.setItem('historyView', historyState.view);
    } catch {
      // sin almacenamiento
    }
    renderHistory();
  })
);

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
document.getElementById('archived-chip').addEventListener('click', () => {
  historyState.archived = !historyState.archived;
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
// "Quitar filtros" (2026-09-30): sin resultados, antes solo quedaba el aviso. Deja la vista (archivadas o no).
document.getElementById('history-clear').addEventListener('click', () => {
  Object.assign(historyState, { query: '', brand: '', status: '', mine: false, shown: HISTORY_PAGE });
  document.getElementById('history-search').value = '';
  document.getElementById('history-brand').value = '';
  document.querySelectorAll('#history-status .chip').forEach((c) => {
    const on = c.dataset.status === '';
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  try {
    localStorage.setItem('historyMine', '0');
  } catch {
    // sin almacenamiento
  }
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
  const arch = e.target.closest('[data-archive], [data-unarchive]');
  if (arch) {
    const archived = !!arch.dataset.archive;
    setArchived(arch.dataset.archive || arch.dataset.unarchive, archived).then((ok) => ok && loadHistory());
    return;
  }
  const fam = e.target.closest('[data-family]');
  if (fam) {
    const root = fam.dataset.family;
    if (openFamilies.has(root)) openFamilies.delete(root);
    else openFamilies.add(root);
    renderHistory();
    document.querySelector(`[data-family="${CSS.escape(root)}"]`)?.focus();
    return;
  }
  const btn = e.target.closest('[data-reuse]');
  if (btn) reuseJob(btn.dataset.reuse);
  const retry = e.target.closest('[data-retry]');
  if (retry) retryJobById(retry.dataset.retry, retry);
});

// "Reutilizar": rellena el formulario con la marca, el prompt y el modo de imágenes de un trabajo
// anterior (para relanzar uno fallido o hacer una variante). No se envía hasta pulsar Generar.
async function reuseJob(id, { useBrief = false } = {}) {
  let job;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}`);
    if (!res.ok) return showToast('No se pudo cargar ese trabajo.', 'error');
    ({ job } = await res.json());
  } catch {
    return showToast(NETWORK_ERROR, 'error');
  }
  if (showFormView() === false) return;
  await brandsReady;
  form.reset();
  const slug = job.input.clientSlug || '';
  clientNameInput.value = job.input.clientName || brandDisplayName(slug);
  // Si el nombre de entonces no lleva a su carpeta ("SegurCaixa Adeslas" → adeslas), se usa el de la carpeta.
  if (slug && knownBrands.includes(slug) && matchBrand(clientNameInput.value) !== slug) clientNameInput.value = brandDisplayName(slug);
  updateBrandMatch();
  setKind(job.input.instruction ? 'instruction' : 'brief');
  document.getElementById('prompt-input').value = job.input.instruction || job.input.briefText || '';
  // El nombre no se copia del trabajo reutilizado: quien lo pide ahora es quien usa esta página.
  if (useBrief && job.input.briefText) {
    setKind('brief');
    document.getElementById('prompt-input').value = job.input.briefText;
  }
  const radio = form.querySelector(`input[name="imageMode"][value="${job.input.imageMode}"]`);
  if (radio) radio.checked = true;
  // Lo reutilizado pasa a ser el borrador: si se recarga la página antes de enviarlo, no se pierde.
  document.getElementById('draft-note').hidden = true;
  saveDraft();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('prompt-input').focus({ preventScroll: true });
}

// ---------------------------------------------------------------- vistas

document.getElementById('back-link').addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return; // abrir en otra pestaña
  e.preventDefault();
  scrollToHistory = true;
  if (showFormView() === false) scrollToHistory = false;
});

// ---------------------------------------------------------------- menú lateral (2026-10-02)
// Como el de feebbodigital.com: Nueva newsletter, Historial y Cómo funciona, más el contacto. Desde un trabajo,
// cada enlace vuelve antes a la portada (con el aviso de cambios sin guardar de showFormView).
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const menuBackdrop = document.getElementById('menu-backdrop');
function setMenu(open) {
  sideMenu.hidden = !open;
  menuBackdrop.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) sideMenu.querySelector('[data-menu]').focus();
  else menuBtn.focus({ preventScroll: true });
}
menuBtn.addEventListener('click', () => setMenu(sideMenu.hidden));
document.getElementById('menu-close').addEventListener('click', () => setMenu(false));
menuBackdrop.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !sideMenu.hidden) setMenu(false);
});
sideMenu.addEventListener('click', (e) => {
  const item = e.target.closest('[data-menu]');
  if (!item) return;
  const where = item.dataset.menu;
  setMenu(false);
  if (viewForm.hidden) {
    if (where === 'history') scrollToHistory = true;
    if (showFormView() === false) {
      scrollToHistory = false;
      return;
    }
  }
  if (where === 'history') {
    document.getElementById('history').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (where === 'how') {
    const how = document.getElementById('how-panel');
    if (how.hidden) document.getElementById('how-btn').click();
    how.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    form.querySelector('textarea, input[type="text"]')?.focus({ preventScroll: true });
  }
});

// ---------------------------------------------------------------- trabajo sin guardar (2026-09-30)
// Textos editados sin guardar o una petición de cambios escrita y sin enviar: salir de la página del
// trabajo (volver, otra newsletter, cerrar la pestaña) los perdía sin avisar.
function unsavedWork() {
  if (viewJob.hidden) return null;
  if (te.active) {
    const { edits } = teEdits();
    if ((edits || []).length || te.alts.size || te.links.size || te.images.size) return 'cambios sin guardar en la pieza';
  }
  if (!reviseBox.hidden && document.getElementById('revise-input').value.trim()) return 'una petición de cambios sin enviar';
  return null;
}

function confirmLeaveJob() {
  const what = unsavedWork();
  return !what || window.confirm(`Tienes ${what}. ¿Salir igualmente? Se perderá lo que no has guardado.`);
}

window.addEventListener('beforeunload', (e) => {
  if (!unsavedWork()) return;
  e.preventDefault();
  e.returnValue = '';
});

/** Devuelve false si quien usa la página prefiere quedarse (ver confirmLeaveJob). */
function showFormView() {
  if (!confirmLeaveJob()) return false;
  clearTimeout(pollTimer);
  currentJob = null;
  setFaviconStatus(null);
  history.pushState({}, '', location.pathname);
  viewJob.hidden = true;
  viewBrand.hidden = true;
  viewForm.hidden = false;
  hero.hidden = false;
  document.title = BASE_TITLE;
  updateSticky();
  loadHistory();
}

document.getElementById('new-job-btn').addEventListener('click', () => {
  if (showFormView() === false) return;
  form.reset();
  restoreDraft();
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
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/mobile-fix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterName: savedRequester() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(data.error || 'No se pudo lanzar la adaptación a móvil.', 'error');
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
  } catch {
    showToast(NETWORK_ERROR, 'error');
  } finally {
    btn.disabled = false;
  }
});

// ---------------------------------------------------------------- reintentar y copiar enlace

/** Relanza un trabajo fallido o cancelado tal cual, en un clic. Lo hace el servidor (2026-10-01): enlaza
 *  el reintento con el fallido (misma familia en el historial) y, si Hermes ya había escrito el brief,
 *  lo reutiliza en vez de generarlo otra vez. Cambios y adaptaciones, sobre la misma versión de origen. */
async function retryJobById(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterName: savedRequester() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(data.error || 'No se pudo reintentar.', 'error');
    if (data.briefReused) showToast('Reintentando con el brief que Hermes ya había escrito.');
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
  } catch {
    showToast(NETWORK_ERROR, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.getElementById('failed-edit').addEventListener('click', () => {
  if (currentJob) reuseJob(currentJob);
});

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

// ---------------------------------------------------------------- enseñarla al cliente (2026-10-01)

/** Enlace público de solo lectura de esta versión (studio/server/share.ts). Se arma con el origen de esta
 *  página: en Vercel, /p/* se reescribe a Railway igual que /api y /assets. */
let shareVersions = [];
function renderShare(share, versions = shareVersions) {
  shareVersions = versions;
  const active = !!share && Date.parse(share.expiresAt) > Date.now();
  document.getElementById('share-empty').hidden = active;
  document.getElementById('share-active').hidden = !active;
  renderClientReview(share);
  // El cliente ya tiene un enlace de otra versión de esta newsletter: se le puede pasar a esta (misma URL).
  const elsewhere = !active && versions.some((v) => v.shared && v.id !== currentJob);
  document.getElementById('share-move').hidden = !elsewhere;
  document.getElementById('share-empty-hint').textContent = elsewhere
    ? 'El cliente tiene el enlace de otra versión. Pásalo a esta y verá la pieza nueva con la misma dirección (sus comentarios se conservan), o crea otro enlace.'
    : 'Sin contraseña, solo esta versión. El cliente puede comentar sobre la pieza y aprobarla o pedir cambios. Caduca a los 14 días.';
  if (!active) return;
  document.getElementById('share-url').value = `${location.origin}/p/${share.token}`;
  const until = new Date(share.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const views = share.views
    ? `abierto ${share.views} ${share.views === 1 ? 'vez' : 'veces'}, la última el ${new Date(share.lastViewedAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    : 'aún no lo ha abierto nadie';
  document.getElementById('share-info').textContent = `Caduca el ${until} · ${views}`;
}

async function shareRequest(method) {
  if (!currentJob) return;
  const id = currentJob;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/share`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify({ by: savedRequester() || undefined }) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(data.error || 'No se pudo cambiar el enlace.', 'error');
    if (id !== currentJob) return;
    renderShare(method === 'POST' ? data.share : null);
    if (method === 'POST') {
      copyText(document.getElementById('share-url').value, 'Enlace creado y copiado: el cliente lo abre sin contraseña.', 'Copia el enlace del recuadro.');
    } else {
      showToast('Enlace desactivado: quien lo tenga ya no podrá abrirlo.');
    }
  } catch {
    showToast(NETWORK_ERROR, 'error');
  }
}
document.getElementById('share-create').addEventListener('click', () => shareRequest('POST'));
document.getElementById('share-move').addEventListener('click', async (e) => {
  if (!currentJob) return;
  const id = currentJob;
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/share/move-here`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(data.error || 'No se pudo pasar el enlace.', 'error');
    if (id !== currentJob) return;
    shareVersions = shareVersions.map((v) => ({ ...v, shared: v.id === id }));
    renderShare(data.share);
    showToast('Enlace pasado a esta versión: el cliente ve la pieza nueva con la misma dirección.');
  } catch {
    showToast(NETWORK_ERROR, 'error');
  } finally {
    btn.disabled = false;
  }
});

// ---------------------------------------------------------------- ficha de marca (2026-10-01)
// Solo lectura: el brand pack lo mide el agente 02 en la web real y cada valor lleva su procedencia. La ficha la
// envía el worker desde el Mac (donde vive el brand pack que usa Hermes): ver studio/worker/brandCard.ts.

const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([0-9.,\s%]{5,40}\))$/i;
const SAFE_LEN = /^\d{1,3}(\.\d+)?(px|%)?( \d{1,3}(\.\d+)?(px|%)?){0,3}$/;

const DARK_STATUS = { 'not-implemented': 'No preparado en el brand pack', implemented: 'Preparado', partial: 'Parcial' };

function brandSection(title, body) {
  return body ? `<section class="brand-section"><h3>${escapeHtml(title)}</h3>${body}</section>` : '';
}
function brandDl(rows) {
  const items = rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd>`);
  return items.length ? `<dl class="brand-dl">${items.join('')}</dl>` : '';
}

function renderBrandView(slug, data) {
  const body = document.getElementById('brand-body');
  const card = data?.card;
  const name = card?.name || brandDisplayName(slug);
  document.title = `Ficha de marca · ${name} · Hermes Studio`;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const logo = card?.logo && /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(card.logo)
    ? `<img src="${escapeHtml(card.logo)}" alt="Logo de ${escapeHtml(name)}" />`
    : `<span>${escapeHtml(initials)}</span>`;
  const when = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const head = `<div class="brand-head">
      <div class="brand-logo${card?.logoOnDark ? ' is-dark' : ''}">${logo}</div>
      <div>
        <h2 id="brand-title" tabindex="-1">${escapeHtml(name)}</h2>
        <p class="hint">${
          !card
            ? 'Sin ficha todavía'
            : card.hasPack
            ? `Brand pack${card.version ? ` v${escapeHtml(card.version)}` : ''}${card.updatedAt ? ` · actualizado el ${escapeHtml(when(card.updatedAt))}` : ''}`
            : 'Sin brand pack medido'
        }</p>
      </div>
    </div>`;
  let content = '';
  if (!card) {
    content = `<p class="brand-empty">${
      data?.onWorker
        ? 'Aún no ha llegado la ficha: la envía el Mac de Hermes cuando está libre (como mucho cada 10 minutos).'
        : 'Esta marca no está en el Mac de Hermes: no hay brand pack ni logos guardados. Hermes la investigará como nueva.'
    }</p>`;
  } else if (!card.hasPack) {
    content = `<p class="brand-empty">Esta marca no tiene brand pack medido. Hermes investiga su web en cada newsletter: lo que encontró (colores, tono, fuentes) está en el brief y en la autoauditoría de cada una.</p>`;
  } else {
    const colors = card.colors
      .filter((c) => SAFE_COLOR.test(c.value))
      .map((c) => `<li><span class="swatch" style="background:${c.value}"></span><span class="swatch-label">${escapeHtml(c.labels.join(' · '))}</span><code>${escapeHtml(c.value)}</code></li>`)
      .join('');
    const ty = card.typography;
    const cta = card.cta;
    const ctaStyle = cta
      ? [
          cta.background && SAFE_COLOR.test(cta.background) ? `background:${cta.background}` : '',
          cta.text && SAFE_COLOR.test(cta.text) ? `color:${cta.text}` : '',
          cta.radius && SAFE_LEN.test(cta.radius) ? `border-radius:${cta.radius}` : '',
          cta.padding && SAFE_LEN.test(cta.padding) ? `padding:${cta.padding}` : '',
        ].filter(Boolean).join(';')
      : '';
    const v = card.voice;
    const ph = card.photography;
    const ic = card.iconography;
    const dm = card.darkMode;
    content = [
      // Solo «en <web> el <fecha>»: el paréntesis técnico (getComputedStyle…) no le dice nada al equipo.
      card.measuredFrom ? `<p class="hint brand-source">Medido ${escapeHtml(card.measuredFrom.replace(/^observado\s+/i, '').split(' (')[0])}</p>` : '',
      brandSection('Colores', colors ? `<ul class="swatches">${colors}</ul>` : ''),
      brandSection(
        'Tipografía',
        ty
          ? brandDl([
              ['Texto', ty.family],
              ['Titulares', ty.display],
              ['Fuente web', ty.webFont],
              ['Titular principal', ty.h1],
              ['Cuerpo', ty.body],
            ]) + (ty.note ? `<p class="hint">${escapeHtml(ty.note)}</p>` : '')
          : ''
      ),
      brandSection(
        'Botón',
        cta && (ctaStyle || cta.label)
          ? `<span class="cta-sample" style="${ctaStyle}">${escapeHtml(cta.label || 'Botón')}</span>${brandDl([['Esquinas', cta.radius], ['Relleno', cta.padding]])}`
          : ''
      ),
      brandSection(
        'Tono de voz',
        v
          ? brandDl([
              ['Tono', v.tone],
              ['Trato', v.formality],
              ['Frases', v.sentenceLength],
              ['Modo', v.mode],
              ['Puntuación', v.punctuation],
            ]) +
            (v.examples.length ? `<ul class="voice-examples">${v.examples.map((e) => `<li>«${escapeHtml(e)}»</li>`).join('')}</ul>` : '') +
            (v.source ? `<p class="hint">Fuente: ${escapeHtml(v.source)}</p>` : '')
          : ''
      ),
      brandSection(
        'Fotografía',
        ph ? brandDl([['Fotografía real', ph.real == null ? null : ph.real ? 'Sí' : 'No']]) + (ph.treatment ? `<p class="brand-text">${escapeHtml(ph.treatment)}</p>` : '') : ''
      ),
      brandSection(
        'Iconos',
        ic ? brandDl([['Estilo', ic.style], ['Monocromo', ic.monochrome == null ? null : ic.monochrome ? 'Sí' : 'No'], ['Color', ic.color]]) + (ic.implication ? `<p class="hint">${escapeHtml(ic.implication)}</p>` : '') : ''
      ),
      brandSection('Modo oscuro', dm ? brandDl([['Estado', DARK_STATUS[dm.status] || dm.status], ['Nota', dm.note]]) : ''),
    ].join('');
  }
  const assets = card
    ? brandSection(
        'Archivos en el Mac de Hermes',
        `<p class="brand-text">${
          card.assets.logos.length ? `Logos: ${card.assets.logos.map((l) => `<code>${escapeHtml(l)}</code>`).join(', ')}.` : 'Sin logos guardados.'
        } ${card.assets.photos ? `${card.assets.photos} foto${card.assets.photos === 1 ? '' : 's'} sin verificar (pueden ser de campañas anteriores).` : ''} ${
          card.assets.ai ? `${card.assets.ai} ${card.assets.ai === 1 ? 'imagen generada' : 'imágenes generadas'} con IA (no son oficiales).` : ''
        }</p>${
          card.assets.broken?.length
            ? `<p class="brand-warn">No son imágenes (descargas fallidas: páginas de error guardadas como imagen), Hermes no las usa: ${card.assets.broken.map((f) => `<code>${escapeHtml(f)}</code>`).join(', ')}.</p>`
            : ''
        }${
          card.assets.mismatched?.length
            ? `<p class="brand-warn">Con la extensión cambiada (hay que convertirlas antes de usarlas): ${card.assets.mismatched.map((f) => `<code>${escapeHtml(f)}</code>`).join(', ')}.</p>`
            : ''
        }`
      )
    : '';
  const list = (data?.newsletters || [])
    .map((n) => {
      const label = n.title || n.subject || new Date(n.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const versions = n.versions > 1 ? ` · ${n.versions} versiones` : '';
      return `<li><a href="?job=${encodeURIComponent(n.id)}">${escapeHtml(label)}</a> <span class="hint">· ${escapeHtml(new Date(n.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))} · ${escapeHtml(STATUS_LABELS[n.status] || n.status)}${versions}</span></li>`;
    })
    .join('');
  const readonly = `<p class="brand-readonly">Solo lectura. El brand pack lo mide el agente de marca en la web real (cada valor con su procedencia). Si algo está mal, pide en una newsletter que Hermes lo vuelva a medir, o avisa a quien mantiene el sistema.</p>`;
  body.innerHTML = head + readonly + content + assets + brandSection('Newsletters de esta marca', list ? `<ul class="brand-newsletters">${list}</ul>` : '<p class="hint">Todavía ninguna.</p>');
}

async function showBrandView(slug) {
  if (!confirmLeaveJob()) return;
  clearTimeout(pollTimer);
  clearTimeout(historyTimer);
  currentJob = null;
  setFaviconStatus(null);
  viewForm.hidden = true;
  hero.hidden = true;
  viewJob.hidden = true;
  viewBrand.hidden = false;
  updateSticky();
  const body = document.getElementById('brand-body');
  body.innerHTML = '<p class="hint">Cargando la ficha…</p>';
  try {
    const res = await apiFetch(`/api/brands/${encodeURIComponent(slug)}`);
    const data = res.ok ? await res.json() : null;
    if (!res.ok) {
      body.innerHTML = `<p class="brand-empty">${res.status === 401 ? 'Inicia sesión para ver la ficha.' : 'No se ha encontrado esa marca.'}</p>`;
      return;
    }
    renderBrandView(slug, data);
    document.getElementById('brand-title')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch {
    body.innerHTML = `<p class="brand-empty">${escapeHtml(NETWORK_ERROR)}</p>`;
  }
}

// ---------------------------------------------------------------- nombre de la newsletter (2026-10-01)

let jobFamilyTitle = null;
function renderJobName(familyTitle, meta) {
  jobFamilyTitle = familyTitle || null;
  if (!document.getElementById('rename-form').hidden) return; // no pisar lo que se está escribiendo
  const shown = jobFamilyTitle || meta?.subject || '';
  document.getElementById('job-name-row').hidden = false;
  const text = document.getElementById('job-name-text');
  text.textContent = shown;
  text.title = jobFamilyTitle ? 'Nombre puesto por el equipo' : shown ? 'Asunto del correo (aún sin nombre propio)' : '';
  document.getElementById('rename-btn').textContent = shown ? 'Renombrar' : 'Ponerle nombre';
}
function closeRename() {
  document.getElementById('rename-form').hidden = true;
  document.getElementById('job-name-row').hidden = false;
}
document.getElementById('rename-btn').addEventListener('click', () => {
  document.getElementById('job-name-row').hidden = true;
  const form = document.getElementById('rename-form');
  form.hidden = false;
  const input = document.getElementById('rename-input');
  input.value = jobFamilyTitle || document.getElementById('job-name-text').textContent;
  input.focus();
  input.select();
});
document.getElementById('rename-cancel').addEventListener('click', closeRename);
document.getElementById('rename-input').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeRename();
});
document.getElementById('rename-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentJob) return;
  const title = document.getElementById('rename-input').value;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(data.error || 'No se pudo renombrar.', 'error');
    closeRename();
    renderJobName(data.title, currentMeta);
    showToast(data.title ? 'Nombre guardado para todas sus versiones.' : 'Nombre quitado: se muestra el asunto.');
    loadHistory();
  } catch {
    showToast(NETWORK_ERROR, 'error');
  }
});

// ---------------------------------------------------------------- revisión del cliente (2026-10-01)

let clientShare = null;
let clientPollTimer = null;

function clientCommentItem(c, current) {
  const when = new Date(c.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<li class="${c.resolvedAt ? 'is-resolved' : ''}" data-comment="${escapeHtml(c.id)}">
      <div class="c-head"><span><strong>${escapeHtml(c.author)}</strong> · ${escapeHtml(when)}${c.resolvedAt ? ` · resuelto${c.resolvedBy ? ` por ${escapeHtml(c.resolvedBy)}` : ''}` : ''}</span>
        <span class="c-actions">${current && c.path ? '<button type="button" class="link-btn" data-client-see>Ver</button>' : ''}${
          current ? `<button type="button" class="link-btn" data-client-resolve="${c.resolvedAt ? '0' : '1'}">${c.resolvedAt ? 'Reabrir' : 'Resuelto'}</button>` : ''
        }</span></div>
      ${c.ref ? `<span class="c-ref">${escapeHtml(c.ref)}</span>` : ''}
      <p class="c-text">${escapeHtml(c.text)}</p>
    </li>`;
}

function renderClientReview(share) {
  clientShare = share && Date.parse(share.expiresAt) > Date.now() ? share : null;
  const comments = clientShare?.comments || [];
  const current = comments.filter((c) => c.jobId === currentJob);
  const older = comments.filter((c) => c.jobId !== currentJob);
  const decision = clientShare?.decision?.jobId === currentJob ? clientShare.decision : null;
  const open = current.filter((c) => !c.resolvedAt).length;
  document.getElementById('tab-client').hidden = !clientShare;
  if (!clientShare && activeJobTab === 'client') showJobTab('preview');
  const badge = document.getElementById('tab-client-badge');
  badge.textContent = decision?.kind === 'approved' ? '✓' : open ? String(open) : '';
  badge.className = `tab-badge${decision?.kind === 'approved' ? ' is-ok' : open || decision?.kind === 'changes' ? ' is-warning' : ''}`;
  const decEl = document.getElementById('client-decision');
  decEl.hidden = !decision;
  if (decision) {
    const when = new Date(decision.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    decEl.className = `client-decision is-${decision.kind}`;
    decEl.innerHTML = `${decision.kind === 'approved' ? '✓ El cliente ha aprobado esta versión' : 'El cliente pide cambios'} · <strong>${escapeHtml(decision.author)}</strong>, ${escapeHtml(when)}${
      decision.note ? `<span class="c-text">${escapeHtml(decision.note)}</span>` : ''
    }`;
  }
  document.getElementById('client-empty').hidden = !!(current.length || decision);
  document.getElementById('client-comments').innerHTML = current.map((c) => clientCommentItem(c, true)).join('');
  document.getElementById('client-actions').hidden = !(open || (decision?.kind === 'changes' && decision.note));
  document.getElementById('client-older').hidden = !older.length;
  document.getElementById('client-older-summary').textContent = `Comentarios sobre otras versiones (${older.length})`;
  document.getElementById('client-older-list').innerHTML = older.map((c) => clientCommentItem(c, false)).join('');
  // Con el enlace activo, lo que haga el cliente aparece sin recargar (cada minuto, con la pestaña visible).
  clearTimeout(clientPollTimer);
  if (clientShare) clientPollTimer = setTimeout(refreshClientReview, 60000);
}

async function refreshClientReview() {
  const id = currentJob;
  if (!id || document.hidden) {
    clientPollTimer = setTimeout(refreshClientReview, 60000);
    return;
  }
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}`);
    if (!res.ok || id !== currentJob) return;
    const data = await res.json();
    const before = JSON.stringify([clientShare?.comments?.length, clientShare?.decision?.at]);
    renderShare(data.job.share, data.versions || shareVersions);
    if (JSON.stringify([clientShare?.comments?.length, clientShare?.decision?.at]) !== before) announce('Hay novedades del cliente.');
  } catch {
    clientPollTimer = setTimeout(refreshClientReview, 60000);
  }
}

function clientCommentById(id) {
  return clientShare?.comments?.find((c) => c.id === id) || null;
}

document.getElementById('panel-client').addEventListener('click', async (e) => {
  const li = e.target.closest('li[data-comment]');
  if (!li) return;
  const c = clientCommentById(li.dataset.comment);
  if (!c) return;
  if (e.target.closest('[data-client-see]')) {
    showJobTab('preview');
    await wait(50);
    const el = c.path ? byPath(previewDoc(), c.path) : null;
    if (!el) return showToast('No aparece en la vista previa.');
    flashInPreview(el);
    return;
  }
  const btn = e.target.closest('[data-client-resolve]');
  if (!btn) return;
  const resolved = btn.dataset.clientResolve === '1';
  btn.disabled = true;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/share/comments/${encodeURIComponent(c.id)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved, by: savedRequester() || undefined }),
    });
    if (!res.ok) return showToast('No se pudo cambiar el comentario.', 'error');
    Object.assign(c, resolved ? { resolvedAt: new Date().toISOString(), resolvedBy: savedRequester() || undefined } : { resolvedAt: undefined, resolvedBy: undefined });
    renderClientReview(clientShare);
  } catch {
    showToast(NETWORK_ERROR, 'error');
  } finally {
    btn.disabled = false;
  }
});

/** Abre «Pedir cambios» con los comentarios sin resolver (y lo que señaló el cliente, marcado en la pieza). */
document.getElementById('client-to-hermes').addEventListener('click', () => {
  if (!clientShare) return;
  const open = (clientShare.comments || []).filter((c) => c.jobId === currentJob && !c.resolvedAt);
  const decision = clientShare.decision?.jobId === currentJob ? clientShare.decision : null;
  const lines = open.map((c) => `${c.ref ? `${c.ref} ` : ''}${c.text.replace(/\s*\n\s*/g, ' ')} (comentario de ${c.author})`);
  if (decision?.kind === 'changes' && decision.note) lines.push(`${decision.note.replace(/\s*\n\s*/g, ' ')} (nota de ${decision.author})`);
  if (!lines.length) return;
  toggleRevise(true);
  const input = document.getElementById('revise-input');
  input.value = (input.value.trim() ? `${input.value.trim()}\n` : '') + `Cambios que pide el cliente:\n${lines.map((l) => `- ${l}`).join('\n')}`;
  showJobTab('preview');
  const doc = previewDoc();
  for (const c of open) {
    if (!c.path) continue;
    pick.picked.push(c.path);
    byPath(doc, c.path)?.setAttribute('data-studio-picked', '');
  }
  if (doc) ensureStudioStyle(doc);
  reviseBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.focus({ preventScroll: true });
  showToast('Comentarios del cliente pasados a «Pedir cambios»: revísalos y envíalos a Hermes.');
});
document.getElementById('share-revoke').addEventListener('click', () => shareRequest('DELETE'));
document.getElementById('share-copy').addEventListener('click', () =>
  copyText(document.getElementById('share-url').value, 'Enlace copiado: el cliente lo abre sin contraseña.', 'Copia el enlace del recuadro.')
);
document.getElementById('share-url').addEventListener('focus', (e) => e.target.select());

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

// ---------------------------------------------------------------- revisar el brief (2026-10-01)

const reviewText = document.getElementById('review-brief-text');
const reviewError = document.getElementById('review-error');

/** El texto solo se rellena al entrar (o si cambia en el servidor sin haberlo tocado aquí): el sondeo
 *  cada 15 s no puede pisar lo que se está escribiendo. */
function renderBriefReview(job) {
  const box = document.getElementById('job-review');
  const show = job.status === 'review';
  box.hidden = !show;
  if (!show) return;
  // El brief ya está en el panel: el desplegable "Brief creativo generado por Hermes" lo repetiría.
  document.getElementById('brief-box').hidden = true;
  const src = job.input.briefText || '';
  const untouched = reviewText.value === (reviewText.dataset.src || '');
  if (reviewText.dataset.job !== job.id || (untouched && reviewText.dataset.src !== src)) {
    reviewText.dataset.job = job.id;
    reviewText.dataset.src = src;
    reviewText.value = src;
    reviewError.hidden = true;
  }
  document.getElementById('review-restore').hidden = reviewText.value === reviewText.dataset.src;
}
reviewText.addEventListener('input', () => {
  document.getElementById('review-restore').hidden = reviewText.value === reviewText.dataset.src;
});
document.getElementById('review-restore').addEventListener('click', () => {
  reviewText.value = reviewText.dataset.src || '';
  document.getElementById('review-restore').hidden = true;
  reviewText.focus();
});
document.getElementById('review-approve').addEventListener('click', async (e) => {
  if (!currentJob) return;
  const id = currentJob;
  const btn = e.currentTarget;
  const edited = reviewText.value.trim() !== (reviewText.dataset.src || '').trim();
  btn.disabled = true;
  reviewError.hidden = true;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/brief-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: edited ? reviewText.value : undefined, by: savedRequester() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      reviewError.textContent = data.error || 'No se pudo aprobar el brief.';
      reviewError.hidden = false;
      return;
    }
    showToast(edited ? 'Brief corregido y aprobado: Hermes hará la newsletter.' : 'Brief aprobado: Hermes hará la newsletter.');
    reviewText.dataset.job = '';
  } catch {
    reviewError.textContent = NETWORK_ERROR;
    reviewError.hidden = false;
  } finally {
    btn.disabled = false;
    if (currentJob === id) poll(id);
  }
});

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
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      document.getElementById('progress-detail').textContent = data.error || 'No se pudo cancelar.';
    }
  } catch {
    // Sin respuesta no se sabe si se canceló: el sondeo de después muestra el estado real.
    showToast('No se pudo confirmar la cancelación: revisa la conexión e inténtalo de nuevo.', 'error');
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
  if (!open) resetPicks();
  if (open && te.active) teClose();
  reviseBox.hidden = !open;
  reviseBtn.setAttribute('aria-expanded', String(open));
  reviseError.hidden = true;
  reviseWarning.hidden = true;
  if (open) document.getElementById('revise-input').focus();
}
reviseBtn.addEventListener('click', () => toggleRevise(reviseBox.hidden));
document.getElementById('revise-close').addEventListener('click', () => toggleRevise(false));
// Huecos sin rellenar de las peticiones frecuentes: se avisa antes de gastar minutos de Hermes (2026-09-30).
const reviseWarning = document.getElementById('revise-warning');
let reviseAnyway = false;
document.getElementById('revise-input').addEventListener('input', () => {
  reviseAnyway = false;
  reviseWarning.hidden = true;
});
document.getElementById('revise-send-anyway').addEventListener('click', () => {
  reviseAnyway = true;
  reviseBox.requestSubmit();
});

reviseBox.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentJob) return;
  const templates = [...reviseBox.querySelectorAll('[data-quick]')].map((c) => c.dataset.quick);
  const issues = reviseAnyway ? [] : HermesFormCheck.checkChangeRequest(document.getElementById('revise-input').value, templates);
  if (issues.length) {
    document.getElementById('revise-warning-list').innerHTML = issues.map((i) => `<li>${escapeHtml(i.text)}</li>`).join('');
    reviseWarning.hidden = false;
    document.getElementById('revise-send-anyway').focus();
    return;
  }
  reviseAnyway = false;
  reviseWarning.hidden = true;
  const submit = reviseBox.querySelector('button[type="submit"]');
  submit.disabled = true;
  reviseError.hidden = true;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Con el nombre de quien la pide ahora (2026-09-30): sin él, el servidor usaba el de la newsletter de
      // partida y los cambios de Luis sobre una pieza de Ana quedaban a nombre de Ana.
      body: JSON.stringify({ changes: document.getElementById('revise-input').value, requesterName: savedRequester() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      reviseError.textContent = data.error || 'No se pudieron enviar los cambios.';
      reviseError.hidden = false;
      return;
    }
    document.getElementById('revise-input').value = ''; // enviada: ya no es trabajo sin guardar
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
  } catch {
    // No se sabe si llegó: la petición se queda escrita y se avisa de mirar el historial antes de repetirla.
    reviseError.textContent = 'No llegó la respuesta de Studio: puede que los cambios no se hayan enviado. Revisa la conexión y mira el historial antes de volver a enviarlos.';
    reviseError.hidden = false;
  } finally {
    submit.disabled = false;
  }
});

// Peticiones frecuentes (2026-09-28): se añaden a la petición en una línea propia. Si traen «…», queda
// seleccionado para escribir encima; si acaban en espacio, falta decir dónde (o señalarlo).
document.querySelector('.quick-changes').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-quick]');
  if (!chip) return;
  const input = document.getElementById('revise-input');
  const base = input.value.replace(/\s+$/, '');
  const text = chip.dataset.quick;
  input.value = (base ? `${base}\n` : '') + text;
  input.focus();
  const hole = text.indexOf('…');
  if (hole >= 0) {
    const at = input.value.length - text.length + hole;
    input.setSelectionRange(at, at + 1);
  } else {
    input.setSelectionRange(input.value.length, input.value.length);
  }
});

// ---------------------------------------------------------------- señalar en la vista previa

/** "Señalar en la vista previa" (2026-09-28). El marco no ejecuta scripts (sandbox sin allow-scripts),
 *  pero es del mismo origen: Studio escucha los clics desde fuera, marca el elemento con un atributo y
 *  una hoja de estilos propia, y no deja que el clic abra el enlace. Qué se señala y cómo se describe
 *  está en pick.js. Lo señalado se guarda como ruta de hijos desde <body> para volver a marcarlo cuando
 *  el marco se recarga (cambio de tema o de comparación). */
const pick = { active: false, picked: [], hover: null };
const PICK_CSS =
  '[data-studio-hover]{outline:3px solid #e6007e!important;outline-offset:-3px;cursor:crosshair!important}' +
  '[data-studio-picked]{outline:3px dashed #8a3ffc!important;outline-offset:-3px}' +
  'html[data-studio-picking] *{cursor:crosshair!important}' +
  // Cambios resaltados (verde: añadido en esta versión; rojo: quitado, en la anterior) y "Ver en la pieza".
  '[data-studio-added]{outline:3px solid #1db980!important;outline-offset:-3px}' +
  '[data-studio-removed]{outline:3px dashed #e5484d!important;outline-offset:-3px}' +
  '[data-studio-flash]{outline:4px solid #ffb020!important;outline-offset:2px;animation:studio-flash .6s ease-in-out 4}' +
  '@keyframes studio-flash{50%{outline-color:rgba(255,176,32,.15)}}';

function previewDoc() {
  const frame = document.getElementById('preview-frame');
  return frame.getAttribute('srcdoc') ? frame.contentDocument : null;
}

function pathOf(el) {
  const path = [];
  while (el && el.parentElement && el.tagName !== 'BODY') {
    path.unshift([...el.parentElement.children].indexOf(el));
    el = el.parentElement;
  }
  return path;
}

function byPath(doc, path) {
  let el = doc.body;
  for (const i of path) el = el?.children[i];
  return el || null;
}

function hasBackground(el) {
  return el.hasAttribute('background') || /background(-image)?\s*:[^;]*url\(/i.test(el.getAttribute('style') || '');
}

/** El elemento que se señala desde el punto pulsado (ver HermesPick.chooseTarget). */
function pickTarget(start) {
  const chain = [];
  for (let el = start; el && el.nodeType === 1; el = el.parentElement) {
    const tag = el.tagName.toLowerCase();
    chain.push({ el, tag, text: tag === 'img' ? '' : el.textContent, isImage: tag === 'img', hasBackground: hasBackground(el) });
    if (tag === 'body') break;
  }
  const i = HermesPick.chooseTarget(chain);
  return i >= 0 ? chain[i] : null;
}

function describePicked(doc, t) {
  if (t.isImage) {
    const imgs = [...doc.querySelectorAll('img')];
    return HermesPick.describe({ kind: 'image', index: imgs.indexOf(t.el) + 1, total: imgs.length, alt: t.el.getAttribute('alt') || '' });
  }
  if (t.tag === 'a' || t.tag === 'button') {
    const style = (t.el.getAttribute('style') || '') + ' ' + (t.el.parentElement?.getAttribute('style') || '');
    const isButton = t.tag === 'button' || /background(-color)?\s*:|padding\s*:\s*[1-9]/i.test(style);
    return HermesPick.describe({ kind: 'link', text: t.el.textContent, href: t.el.getAttribute('href') || '', isButton });
  }
  if (t.hasBackground && !/^(h[1-6]|p|li|blockquote)$/.test(t.tag)) return HermesPick.describe({ kind: 'background', text: t.el.textContent });
  return HermesPick.describe({ kind: 'text', tag: t.tag, text: t.el.textContent });
}

function clearHover(doc) {
  doc?.querySelectorAll('[data-studio-hover]').forEach((el) => el.removeAttribute('data-studio-hover'));
  pick.hover = null;
}

function ensureStudioStyle(doc) {
  if (doc.querySelector('style[data-studio-pick]')) return;
  const style = doc.createElement('style');
  style.setAttribute('data-studio-pick', '');
  style.textContent = PICK_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

/** Prepara el documento del marco: hoja de estilos, lo ya señalado y los oyentes. Se llama en cada carga. */
function armPreview() {
  const doc = previewDoc();
  if (!doc || !doc.body) return;
  ensureStudioStyle(doc);
  markChanges('after');
  annotateLocations();
  doc.querySelectorAll('[data-studio-picked]').forEach((el) => el.removeAttribute('data-studio-picked'));
  for (const path of pick.picked) byPath(doc, path)?.setAttribute('data-studio-picked', '');
  doc.documentElement.toggleAttribute('data-studio-picking', pick.active);
  if (doc.studioArmed) return;
  doc.studioArmed = true;
  doc.addEventListener('mouseover', (e) => {
    if (!pick.active) return;
    const t = pickTarget(e.target);
    if (t?.el === pick.hover) return;
    clearHover(doc);
    if (t) {
      t.el.setAttribute('data-studio-hover', '');
      pick.hover = t.el;
    }
  });
  doc.addEventListener('mouseleave', () => clearHover(doc));
  doc.addEventListener(
    'click',
    (e) => {
      if (!pick.active) return;
      e.preventDefault();
      e.stopPropagation();
      const t = pickTarget(e.target);
      if (!t) {
        showToast('Ahí no hay un bloque concreto: prueba sobre un texto, un botón o una imagen.');
        return;
      }
      const input = document.getElementById('revise-input');
      const caret = document.activeElement === input ? input.selectionStart : input.value.length;
      const next = HermesPick.insertReference(input.value, caret, describePicked(doc, t));
      input.value = next.value;
      pick.picked.push(pathOf(t.el));
      t.el.setAttribute('data-studio-picked', '');
      setPicking(false);
      reviseBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus({ preventScroll: true });
      input.setSelectionRange(next.caret, next.caret);
      announce('Añadido a la petición de cambios.');
    },
    true
  );
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pick.active) setPicking(false);
  });
}

function setPicking(on) {
  pick.active = on && !!previewDoc();
  const btn = document.getElementById('pick-btn');
  btn.setAttribute('aria-pressed', String(pick.active));
  btn.textContent = pick.active ? 'Señalando… (Esc para salir)' : pick.picked.length ? 'Señalar otra cosa' : 'Señalar en la vista previa';
  document.getElementById('pick-banner').hidden = !pick.active;
  document.getElementById('preview-stage').classList.toggle('is-picking', pick.active);
  const doc = previewDoc();
  doc?.documentElement.toggleAttribute('data-studio-picking', pick.active);
  if (!pick.active) clearHover(doc);
}

function resetPicks() {
  setPicking(false);
  pick.picked = [];
  previewDoc()?.querySelectorAll('[data-studio-picked]').forEach((el) => el.removeAttribute('data-studio-picked'));
  setPicking(false);
}

document.getElementById('pick-btn').addEventListener('click', () => {
  if (pick.active) return setPicking(false);
  if (te.active) return;
  if (!previewDoc()) return showToast('La vista previa aún se está cargando.');
  // Solo la versión actual se puede señalar: al comparar, la columna de la izquierda es la anterior.
  if (document.getElementById('compare-toggle').checked) document.getElementById('compare-toggle').click();
  showJobTab('preview');
  setPicking(true);
  document.getElementById('pick-banner').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('pick-cancel').addEventListener('click', () => {
  setPicking(false);
  reviseBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pick.active) setPicking(false);
  else if (e.key === 'Escape' && te.active && document.activeElement?.closest?.('#textedit-box') === null) teCancel();
});

// ---------------------------------------------------------------- editar texto (2026-09-28)

/** "Editar texto": la vista previa se vuelve editable y al guardar se manda solo lo que cambió (ver
 *  textedit.js y studio/server/textEdit.ts). Se bloquea lo que rompería la estructura (saltos de línea,
 *  negritas, pegar HTML, arrastrar); si aun así se rompe, no se guarda y se dice dónde. */
const te = {
  active: false,
  before: null,
  pre: null,
  confirmCancel: false,
  altBefore: [],
  alts: new Map(),
  // Enlaces e imágenes (2026-10-01): destino de antes → nuevo; índice de imagen → src nuevo (URL o archivo subido).
  links: new Map(),
  imgBefore: [],
  images: new Map(),
};
/** Mismo criterio que LINK_RE en studio/server/textEdit.ts. */
const TE_LINK_RE = /^(https?:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+\d][\d\s-]*|\{\{[^{}]+\}\}|\*\|[A-Z_:]+\|\*|%%[a-z_]+%%|\{%[^%]+%\})$/i;
const TE_MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const teBox = document.getElementById('textedit-box');
const teBtn = document.getElementById('edit-text-btn');
const PREVIEW_CONTROLS = '.preview-head input';
const TE_CSS =
  'body[contenteditable]{caret-color:#e6007e;outline:none}' +
  'body[contenteditable] a{cursor:text!important}' +
  'body[contenteditable] *:focus{outline:none}' +
  'body[contenteditable] img{cursor:pointer!important}' +
  '[data-studio-alt]{outline:3px dashed #ffb020!important;outline-offset:-3px}';

/** El bloque oculto del preheader (misma idea que findPreheader en qualityCheck.ts). */
function findPreheaderEl(doc) {
  for (const el of doc.body.querySelectorAll('div, span, td, p')) {
    const style = (el.getAttribute('style') || '').toLowerCase().replace(/\s+/g, '');
    const hidden = /display:none/.test(style) || /mso-hide:all/.test(style) || (/max-height:0/.test(style) && /overflow:hidden/.test(style));
    if ((hidden || /preheader/i.test(el.className || '')) && HermesTextEdit.norm(el.textContent).length >= 10) return el;
  }
  return null;
}

function teEdits() {
  const doc = previewDoc();
  return doc && te.before ? HermesTextEdit.diff(te.before, HermesTextEdit.snapshot(doc.body)) : { edits: [] };
}

function teRenderStatus() {
  const { edits, brokenAt } = teEdits();
  const n = (edits || []).length + te.alts.size + te.links.size + te.images.size;
  const text = brokenAt !== undefined ? 'Se ha borrado o partido un bloque: no se podrá guardar así.' : n ? `${n} cambio${n === 1 ? '' : 's'} sin guardar.` : 'Sin cambios en la pieza todavía.';
  document.getElementById('te-status').textContent = text;
  document.getElementById('te-banner-count').textContent = text;
  te.confirmCancel = false;
  document.getElementById('te-cancel').textContent = 'Cancelar';
  document.getElementById('te-banner-cancel').textContent = 'Cancelar';
}
let teStatusTimer = null;

/** Sustituye la selección (dentro de un único trozo de texto) por `text`, sin dejar que el navegador
 *  reorganice los elementos: al reemplazar TODO el texto de un botón, Chrome borra el <a> y deja el texto
 *  fuera. Devuelve false si la selección no está en un solo trozo de texto. */
function replaceInTextNode(doc, text) {
  const sel = doc.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const r = sel.getRangeAt(0);
  const n = r.startContainer;
  if (n.nodeType !== 3 || r.endContainer !== n) return false;
  // Las posiciones se leen ANTES de cambiar el texto: al cambiarlo, el navegador lleva la selección a 0.
  // Un texto que se queda vacío guarda un marcador invisible (HermesTextEdit.PLACEHOLDER): sin él, Chrome
  // saca el cursor del enlace vacío y lo siguiente que se escribe queda fuera del botón. No llega a la pieza.
  const P = HermesTextEdit.PLACEHOLDER;
  const start = r.startOffset;
  const end = r.endOffset;
  const head = (n.data.slice(0, start) + text).split(P).join('');
  const tail = n.data.slice(end).split(P).join('');
  n.data = head + tail || P;
  const caret = doc.createRange();
  caret.setStart(n, head + tail ? head.length : 1);
  caret.collapse(true);
  sel.removeAllRanges();
  sel.addRange(caret);
  clearTimeout(teStatusTimer);
  teStatusTimer = setTimeout(teRenderStatus, 300);
  return true;
}

/** Una selección que abarca varios trozos de texto (triple clic en un titular, arrastrar de un bloque a
 *  otro) se recorta al trozo pulsado (o al primero): escribir encima cambia ese texto y no se lleva el
 *  bloque de al lado. Se llama al cambiar la selección y otra vez justo antes de escribir o borrar, porque
 *  quien escribe rápido tras un triple clic llega antes que el aviso de selección. */
function clampSelection(doc) {
  const sel = doc.getSelection();
  if (!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if (r.collapsed || (r.startContainer === r.endContainer && r.startContainer.nodeType === 3)) return;
  const walker = doc.createTreeWalker(r.commonAncestorContainer, 4 /* NodeFilter.SHOW_TEXT */);
  let node = walker.currentNode.nodeType === 3 ? walker.currentNode : walker.nextNode();
  const pointed = te.pointNode && te.pointNode.isConnected && r.intersectsNode(te.pointNode) && te.pointNode.data.trim() ? te.pointNode : null;
  for (; node; node = walker.nextNode()) {
    if (pointed && node !== pointed) continue;
    if (!r.intersectsNode(node) || !node.data.trim()) continue;
    const start = node === r.startContainer ? r.startOffset : 0;
    const end = node === r.endContainer ? r.endOffset : node.data.length;
    if (end <= start) continue;
    const clamped = doc.createRange();
    clamped.setStart(node, start);
    clamped.setEnd(node, end);
    sel.removeAllRanges();
    sel.addRange(clamped);
    return;
  }
}

function armTextEdit(doc) {
  if (doc.studioEditArmed) return;
  doc.studioEditArmed = true;
  const style = doc.createElement('style');
  style.setAttribute('data-studio-edit', '');
  style.textContent = TE_CSS;
  (doc.head || doc.documentElement).appendChild(style);
  doc.addEventListener('keydown', (e) => {
    if (!te.active) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      showToast('Aquí no se pueden añadir líneas ni bloques: para eso, «Pedir cambios».');
    } else if ((e.metaKey || e.ctrlKey) && /^[biu]$/i.test(e.key)) {
      e.preventDefault(); // negrita, cursiva, subrayado: cambiarían la estructura
    } else if (e.key === 'Escape') {
      teCancel();
    }
  });
  doc.addEventListener('paste', (e) => {
    if (!te.active) return;
    e.preventDefault();
    const text = (e.clipboardData?.getData('text/plain') || '').replace(/\s*\n\s*/g, ' ');
    if (!replaceInTextNode(doc, text)) doc.execCommand('insertText', false, text);
  });
  doc.addEventListener('drop', (e) => te.active && e.preventDefault());
  // Clic en una imagen: su texto alternativo, en un campo junto a ella.
  doc.addEventListener(
    'click',
    (e) => {
      if (!te.active || e.target.tagName !== 'IMG') return;
      e.preventDefault();
      openAltPop(doc, e.target);
    },
    true
  );
  // Toda escritura y borrado dentro de un trozo de texto la hace Studio (replaceInTextNode), no el navegador:
  // Chrome saca fuera del enlace lo que se escribe al final de un botón, borra el <a> al vaciarlo y fusiona
  // bloques al borrar al principio de un texto. Así la estructura de la pieza no puede cambiar.
  doc.addEventListener('beforeinput', (e) => {
    if (!te.active) return;
    const type = e.inputType;
    if (type === 'insertParagraph' || type === 'insertLineBreak' || /^format/.test(type) || /^history/.test(type)) {
      e.preventDefault();
      return;
    }
    clampSelection(doc);
    const sel = doc.getSelection();
    if (!sel || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    const n = r.startContainer;
    const inText = n.nodeType === 3 && r.endContainer === n;
    if (/^insert(Text|ReplacementText|FromPaste|FromDrop)$/.test(type)) {
      const text = (e.data ?? e.dataTransfer?.getData('text/plain') ?? '').replace(/\s*\n\s*/g, ' ');
      if (inText) {
        e.preventDefault();
        replaceInTextNode(doc, text);
      } else if (!r.collapsed) {
        e.preventDefault(); // una imagen seleccionada: escribir la borraría
      }
      return;
    }
    if (!/^delete/.test(type)) return;
    e.preventDefault();
    if (!inText) return;
    if (!r.collapsed) {
      replaceInTextNode(doc, '');
      return;
    }
    const off = r.startOffset;
    const data = n.data;
    const surrogate = (code) => code >= 0xdc00 && code <= 0xdfff;
    let from = off;
    let to = off;
    if (type === 'deleteContentBackward') from = off - (off > 1 && surrogate(data.charCodeAt(off - 1)) ? 2 : 1);
    else if (type === 'deleteContentForward') to = off + (surrogate(data.charCodeAt(off + 1)) ? 2 : 1);
    else if (type === 'deleteWordBackward') from = off - data.slice(0, off).match(/\S*\s*$/)[0].length;
    else if (type === 'deleteWordForward') to = off + data.slice(off).match(/^\s*\S*/)[0].length;
    else return; // borrar la línea entera: no
    from = Math.max(0, from);
    to = Math.min(data.length, to);
    if (from >= to) return; // al principio o al final del texto: no se fusiona con el de al lado
    const range = doc.createRange();
    range.setStart(n, from);
    range.setEnd(n, to);
    sel.removeAllRanges();
    sel.addRange(range);
    replaceInTextNode(doc, '');
  });
  // El trozo de texto bajo el puntero: con triple clic se selecciona la línea entera y el que cuenta es el pulsado.
  doc.addEventListener('mousedown', (e) => {
    const at = doc.caretRangeFromPoint?.(e.clientX, e.clientY) || null;
    te.pointNode = at && at.startContainer.nodeType === 3 ? at.startContainer : null;
  });
  // Clic en el relleno de un botón o de una celda (fuera de las letras): el cursor quedaría fuera del texto
  // y lo escrito, al lado del botón. Se lleva al final del texto del elemento pulsado.
  doc.addEventListener('mouseup', (e) => {
    if (!te.active) return;
    const sel = doc.getSelection();
    if (!sel) return;
    if (sel.rangeCount && (!sel.getRangeAt(0).collapsed || sel.getRangeAt(0).startContainer.nodeType === 3)) return;
    const walker = doc.createTreeWalker(e.target, 4 /* NodeFilter.SHOW_TEXT */);
    let last = null;
    for (let t = walker.nextNode(); t; t = walker.nextNode()) if (t.data.trim()) last = t;
    if (!last) return;
    const caret = doc.createRange();
    caret.setStart(last, last.data.replace(/\s+$/, '').length);
    caret.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caret);
  });
  doc.addEventListener('selectionchange', () => te.active && clampSelection(doc));
  doc.addEventListener('input', () => {
    clearTimeout(teStatusTimer);
    teStatusTimer = setTimeout(teRenderStatus, 300);
  });
}

function setEditControls(disabled) {
  document.querySelectorAll(PREVIEW_CONTROLS).forEach((i) => (i.disabled = disabled));
  // Lo que abriría otro trabajo o recargaría la vista previa perdería lo escrito sin guardar.
  for (const id of ['revise-btn', 'sticky-revise', 'mobile-fix-btn', 'approve-btn']) document.getElementById(id).disabled = disabled;
  document.getElementById('preview-stage').classList.toggle('is-editing', disabled);
  document.getElementById('te-banner').hidden = !disabled;
}

function teOpen() {
  showJobTab('preview'); // se edita sobre la vista previa
  const doc = previewDoc();
  if (!doc?.body) return showToast('La vista previa aún se está cargando.');
  toggleRevise(false);
  if (document.getElementById('compare-toggle').checked) document.getElementById('compare-toggle').click();
  // El marco de "Antes y después" se recarga al cambiar: se espera a tener el documento definitivo.
  requestAnimationFrame(() => {
    const d = previewDoc();
    if (!d?.body) return;
    te.before = HermesTextEdit.snapshot(d.body);
    te.altBefore = [...d.querySelectorAll('img')].map((img) => img.getAttribute('alt') ?? '');
    te.alts = new Map();
    te.imgBefore = [...d.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '');
    te.images = new Map();
    te.links = new Map();
    renderTeLinks(d);
    armTextEdit(d);
    // Sin los contornos de "Resaltar cambios" mientras se escribe: vuelven al guardar o cancelar.
    d.querySelectorAll('[data-studio-added]').forEach((el) => el.removeAttribute('data-studio-added'));
    d.body.setAttribute('contenteditable', 'true');
    d.body.spellcheck = true;
    te.active = true;
    te.pre = null;
    const preEl = findPreheaderEl(d);
    if (preEl) {
      const prePath = pathOf(preEl).join('.');
      const candidates = te.before.gaps.filter((g) => g.path.join('.') === prePath || g.path.join('.').startsWith(prePath ? `${prePath}.` : ''));
      const best = candidates.sort((a, b) => HermesTextEdit.visiblePart(b.text).length - HermesTextEdit.visiblePart(a.text).length)[0];
      if (best && HermesTextEdit.visiblePart(best.text)) te.pre = { gap: best, visible: HermesTextEdit.visiblePart(best.text) };
    }
    document.getElementById('te-subject').value = currentMeta?.subject || '';
    document.getElementById('te-preheader').value = te.pre?.visible || '';
    document.getElementById('te-preheader-wrap').hidden = !te.pre;
    document.getElementById('te-error').hidden = true;
    teBox.hidden = false;
    teBtn.setAttribute('aria-expanded', 'true');
    setEditControls(true);
    teRenderStatus();
    teBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/** Sale del modo edición. Con `discard`, la vista previa se vuelve a pintar desde el HTML original. */
function teClose({ discard = true } = {}) {
  if (!te.active && teBox.hidden) return;
  closeAltPop();
  te.alts = new Map();
  te.links = new Map();
  te.images = new Map();
  te.active = false;
  te.before = null;
  te.confirmCancel = false;
  teBox.hidden = true;
  teBtn.setAttribute('aria-expanded', 'false');
  setEditControls(false);
  const doc = previewDoc();
  doc?.body?.removeAttribute('contenteditable');
  if (discard && doc) renderFrame('after');
}

function teCancel() {
  const dirty = (teEdits().edits || []).length || te.alts.size || te.links.size || te.images.size || teEdits().brokenAt !== undefined;
  if (dirty && !te.confirmCancel) {
    te.confirmCancel = true;
    document.getElementById('te-cancel').textContent = 'Descartar los cambios';
    document.getElementById('te-banner-cancel').textContent = 'Descartar';
    return;
  }
  teClose();
}

async function teSave() {
  const doc = previewDoc();
  const errorEl = document.getElementById('te-error');
  errorEl.hidden = true;
  if (!doc || !te.before) return;
  const result = HermesTextEdit.diff(te.before, HermesTextEdit.snapshot(doc.body));
  if (result.brokenAt !== undefined) {
    const el = byPath(doc, result.brokenAt ? result.brokenAt.split('.').map(Number) : []);
    const near = el ? HermesTextEdit.norm(el.textContent).slice(0, 60) : '';
    errorEl.textContent =
      'Solo se puede cambiar el texto, no borrar ni partir bloques' +
      (near ? ` (cerca de «${near}»)` : '') +
      '. Cancela para volver a empezar; para cambios de estructura, «Pedir cambios».';
    errorEl.hidden = false;
    if (el) {
      el.setAttribute('data-studio-flash', '');
      setTimeout(() => el.removeAttribute('data-studio-flash'), 3000);
    }
    return;
  }
  const edits = result.edits;
  const newPre = document.getElementById('te-preheader').value.trim();
  if (te.pre && newPre && newPre !== te.pre.visible) {
    const g = te.pre.gap;
    const already = edits.find((e) => e.path.join('.') === g.path.join('.') && e.gap === g.gap);
    const after = HermesTextEdit.replaceVisible(g.text, newPre);
    if (already) already.after = after;
    else edits.push({ path: g.path, gap: g.gap, before: g.text, after });
  }
  const subjectInput = document.getElementById('te-subject').value.trim();
  const subject = subjectInput && subjectInput !== (currentMeta?.subject || '') ? subjectInput : null;
  const alts = [...te.alts].map(([index, after]) => ({ index, before: te.altBefore[index], after }));
  const links = [...te.links].map(([before, after]) => ({ before, after }));
  const images = [...te.images].map(([index, after]) => ({ index, before: te.imgBefore[index], after }));
  const badLink = links.find((l) => !TE_LINK_RE.test(l.after));
  if (badLink) {
    errorEl.textContent = `«${badLink.after.slice(0, 80)}» no es un destino válido: usa una dirección que empiece por https://.`;
    errorEl.hidden = false;
    document.getElementById('te-links').open = true;
    return;
  }
  if (!edits.length && !subject && !alts.length && !links.length && !images.length) {
    errorEl.textContent = 'No has cambiado nada todavía.';
    errorEl.hidden = false;
    return;
  }
  const buttons = [teBox.querySelector('button[type="submit"]'), document.getElementById('te-banner-save')];
  buttons.forEach((b) => (b.disabled = true));
  const checking = links.length || images.length;
  if (checking) document.getElementById('te-status').textContent = 'Guardando y comprobando los enlaces e imágenes nuevos (unos segundos)…';
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/text-edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edits, subject, alts, links, images, requesterName: savedRequester() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      errorEl.textContent = data.error || 'No se pudo guardar.';
      errorEl.hidden = false;
      return;
    }
    teClose({ discard: false });
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
    showToast('Versión nueva guardada.');
  } catch {
    errorEl.textContent = 'No se pudo conectar con Studio. Tus cambios siguen en la vista previa: inténtalo de nuevo.';
    errorEl.hidden = false;
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

// ---- texto alternativo (2026-09-28)
const altPop = document.getElementById('alt-pop');
let altTarget = null;

// ---- destinos de los enlaces (2026-10-01): uno por destino distinto; cambiarlo cambia todos los que van ahí.
function renderTeLinks(doc) {
  const groups = new Map();
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = (a.getAttribute('href') || '').trim();
    if (!href || href.startsWith('#')) continue;
    if (!groups.has(href)) groups.set(href, []);
    groups.get(href).push(a);
  }
  const broken = (reviewChecks.find((c) => c.id === 'links')?.details || []).filter((d) => !/^No verificable/.test(d));
  const list = document.getElementById('te-links-list');
  const isBroken = (href) => broken.some((d) => d.startsWith(`${href} →`));
  const brokenHere = [...groups.keys()].filter(isBroken).length;
  list.innerHTML = [...groups]
    .map(([href, as], i) => {
      const text = as.map((a) => HermesPick.excerpt(a.textContent, 50)).find(Boolean) || (as[0].querySelector('img') ? 'imagen con enlace' : 'sin texto');
      const bad = isBroken(href);
      return `<li${bad ? ' class="is-broken"' : ''}>
          <label for="te-link-${i}"><span>«${escapeHtml(text)}»${as.length > 1 ? ` y ${as.length - 1} más` : ''}</span>${bad ? ' <strong class="te-link-flag">Roto según la revisión</strong>' : ''}</label>
          <input type="text" id="te-link-${i}" data-href="${escapeHtml(href)}" value="${escapeHtml(href)}" spellcheck="false" />
        </li>`;
    })
    .join('');
  document.getElementById('te-links-count').textContent = `(${groups.size}${brokenHere ? `, ${brokenHere} roto${brokenHere === 1 ? '' : 's'}` : ''})`;
  document.getElementById('te-links').open = brokenHere > 0;
}
document.getElementById('te-links-list').addEventListener('input', (e) => {
  const input = e.target.closest('input[data-href]');
  if (!input) return;
  const before = input.dataset.href;
  const after = input.value.trim();
  if (!after || after === before) te.links.delete(before);
  else te.links.set(before, after);
  input.classList.toggle('is-invalid', !!after && after !== before && !TE_LINK_RE.test(after));
  teRenderStatus();
});

let pendingImage = null; // archivo subido en el recuadro de la imagen, como data URL

function openAltPop(doc, img) {
  const index = [...doc.querySelectorAll('img')].indexOf(img);
  if (index < 0) return;
  altTarget = { img, index };
  pendingImage = null;
  const changed = te.images.get(index);
  document.getElementById('img-pop-url').value = changed && !changed.startsWith('data:') ? changed : '';
  document.getElementById('img-pop-file').value = '';
  document.getElementById('img-pop-note').textContent = changed?.startsWith('data:') ? 'Archivo subido (se publica al guardar).' : 'Mejor con la misma proporción que la actual: el ancho se mantiene.';
  document.getElementById('img-pop-error').hidden = true;
  document.getElementById('alt-pop-n').textContent = `${index + 1} de ${te.altBefore.length}`;
  const input = document.getElementById('alt-pop-input');
  input.value = te.alts.has(index) ? te.alts.get(index) : te.altBefore[index];
  // Junto a la imagen, en coordenadas de la página (el marco puede estar escalado).
  const frame = document.getElementById('preview-frame');
  const t = getComputedStyle(frame.closest('.preview-device')).transform;
  const scale = t && t !== 'none' ? new DOMMatrix(t).a : 1;
  const fr = frame.getBoundingClientRect();
  const r = img.getBoundingClientRect();
  altPop.hidden = false;
  const width = altPop.offsetWidth;
  const left = Math.min(Math.max(8, fr.left + r.left * scale), document.documentElement.clientWidth - width - 8);
  const below = fr.top + (r.top + Math.min(r.height, 120)) * scale + 8;
  altPop.style.left = `${left + window.scrollX}px`;
  altPop.style.top = `${below + window.scrollY}px`;
  input.focus();
  input.select();
}

function closeAltPop() {
  altPop.hidden = true;
  altTarget = null;
}

function applyAlt() {
  if (!altTarget) return;
  const value = document.getElementById('alt-pop-input').value.replace(/\s+/g, ' ').trim();
  const { img, index } = altTarget;
  // Imagen nueva: un archivo subido manda sobre la dirección escrita.
  const url = document.getElementById('img-pop-url').value.trim();
  const nextSrc = pendingImage || (url && url !== te.imgBefore[index] ? url : null);
  if (nextSrc && !nextSrc.startsWith('data:') && !/^https:\/\/\S+$/i.test(nextSrc)) {
    const err = document.getElementById('img-pop-error');
    err.textContent = 'La dirección tiene que empezar por https:// (los correos bloquean las imágenes sin https).';
    err.hidden = false;
    return;
  }
  if (nextSrc) {
    te.images.set(index, nextSrc);
    img.setAttribute('src', nextSrc);
    img.setAttribute('data-studio-alt', '');
  }
  if (value === te.altBefore[index].replace(/\s+/g, ' ').trim()) {
    te.alts.delete(index);
    img.removeAttribute('data-studio-alt');
  } else {
    te.alts.set(index, value);
    img.setAttribute('data-studio-alt', '');
  }
  img.setAttribute('alt', value);
  closeAltPop();
  teRenderStatus();
}

document.getElementById('alt-pop-ok').addEventListener('click', applyAlt);
document.getElementById('img-pop-file').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  const err = document.getElementById('img-pop-error');
  err.hidden = true;
  pendingImage = null;
  if (!file) return;
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) {
    err.textContent = 'Solo PNG, JPG, GIF o WebP.';
    err.hidden = false;
    return;
  }
  if (file.size > TE_MAX_IMAGE_BYTES) {
    err.textContent = `Pesa ${Math.round(file.size / 1024)} KB: el máximo es 3 MB (en un email, mejor menos de 500 KB).`;
    err.hidden = false;
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingImage = String(reader.result);
    document.getElementById('img-pop-note').textContent = `${file.name} · ${Math.round(file.size / 1024)} KB${file.size > 500 * 1024 ? ' (pesada para un email)' : ''}. Pulsa «Aplicar».`;
  };
  reader.readAsDataURL(file);
});
document.getElementById('alt-pop-cancel').addEventListener('click', closeAltPop);
document.getElementById('img-pop-url').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applyAlt();
  } else if (e.key === 'Escape') {
    e.stopPropagation();
    closeAltPop();
  }
});
document.getElementById('alt-pop-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applyAlt();
  } else if (e.key === 'Escape') {
    e.stopPropagation();
    closeAltPop();
  }
});

teBtn.addEventListener('click', () => (te.active ? teCancel() : teOpen()));
teBox.addEventListener('submit', (e) => {
  e.preventDefault();
  teSave();
});
document.getElementById('te-banner-save').addEventListener('click', teSave);
document.getElementById('te-cancel').addEventListener('click', teCancel);
document.getElementById('te-banner-cancel').addEventListener('click', teCancel);
['te-subject', 'te-preheader'].forEach((id) => document.getElementById(id).addEventListener('input', () => (te.confirmCancel = false)));

// ---------------------------------------------------------------- exportar para la plataforma (2026-09-28)
// Copiar y Descargar salen con las variables de la plataforma elegida y, si se pide, con UTM (export.js).
// La newsletter guardada no cambia. Plataforma, "Añadir UTM", source y medium se recuerdan en el navegador;
// la campaña se propone por newsletter (marca y fecha).
const EXPORT_PREFS = 'exportPrefs';
const exportPlatform = document.getElementById('export-platform');
const exportUtm = document.getElementById('export-utm');
const UTM_IDS = ['utm-source', 'utm-medium', 'utm-campaign', 'utm-content'];
let currentJobData = null;
let currentVersions = [];

exportPlatform.innerHTML = Object.entries(HermesExport.PLATFORMS)
  .map(([key, p]) => `<option value="${key}">${escapeHtml(p.label)}</option>`)
  .join('');

function readExportPrefs() {
  try {
    return JSON.parse(localStorage.getItem(EXPORT_PREFS) || '{}') || {};
  } catch {
    return {};
  }
}

function saveExportPrefs() {
  try {
    localStorage.setItem(
      EXPORT_PREFS,
      JSON.stringify({
        platform: exportPlatform.value,
        utm: exportUtm.checked,
        source: document.getElementById('utm-source').value.trim(),
        medium: document.getElementById('utm-medium').value.trim(),
      })
    );
  } catch {
    // sin almacenamiento: solo dura esta visita
  }
}

function setupExport(job) {
  const prefs = readExportPrefs();
  exportPlatform.value = HermesExport.PLATFORMS[prefs.platform] ? prefs.platform : 'generic';
  exportUtm.checked = !!prefs.utm;
  document.getElementById('utm-source').value = prefs.source || 'newsletter';
  document.getElementById('utm-medium').value = prefs.medium || 'email';
  document.getElementById('utm-campaign').value = HermesExport.defaultCampaign(job.input.clientName, job.createdAt);
  document.getElementById('utm-content').value = '';
  document.getElementById('utm-fields').hidden = !exportUtm.checked;
  renderExportSummary();
}

function exportOptions() {
  const val = (id) => document.getElementById(id).value.trim();
  return {
    platform: exportPlatform.value,
    utm: exportUtm.checked ? { source: val('utm-source'), medium: val('utm-medium'), campaign: val('utm-campaign'), content: val('utm-content') } : null,
  };
}

function exportedHtml() {
  return HermesExport.prepare(currentHtml || '', exportOptions());
}

const VAR_NAMES = { unsubscribe_url: 'baja', view_url: 'ver online', preferences_url: 'preferencias' };

function renderExportSummary() {
  const el = document.getElementById('export-summary');
  const opts = exportOptions();
  if (!currentHtml || (opts.platform === 'generic' && !opts.utm)) {
    el.textContent = '';
    return;
  }
  const r = exportedHtml();
  const p = HermesExport.PLATFORMS[opts.platform];
  const parts = [];
  if (opts.platform !== 'generic') {
    const done = Object.keys(r.replaced).map((k) => `${VAR_NAMES[k]} → ${p.vars[k]}`);
    parts.push(done.length ? `Copiar y Descargar salen para ${p.label}: ${done.join(', ')}.` : `Copiar y Descargar salen para ${p.label}.`);
    for (const k of r.missing) parts.push(`«${VAR_NAMES[k]}» se queda como {{${k}}}: ${p.label} no tiene una variable equivalente segura; cámbialo allí.`);
    if (!r.replaced.unsubscribe_url && !r.missing.includes('unsubscribe_url')) parts.push(`La pieza no tiene {{unsubscribe_url}}: pon el enlace de baja en ${p.label}.`);
  }
  if (opts.utm) parts.push(`UTM en ${r.utmLinks} enlace${r.utmLinks === 1 ? '' : 's'} (también en los botones de Outlook).`);
  el.textContent = parts.join(' ');
}

exportPlatform.addEventListener('change', () => {
  saveExportPrefs();
  renderExportSummary();
});
exportUtm.addEventListener('change', () => {
  document.getElementById('utm-fields').hidden = !exportUtm.checked;
  saveExportPrefs();
  renderExportSummary();
});
UTM_IDS.forEach((id) =>
  document.getElementById(id).addEventListener('input', () => {
    saveExportPrefs();
    renderExportSummary();
  })
);

/** Descargar: tal cual desde el servidor, o preparado en el navegador si hay plataforma o UTM. */
async function exportDownload(e) {
  const opts = exportOptions();
  if (opts.platform === 'generic' && !opts.utm) return; // enlace normal del servidor
  e.preventDefault();
  if (!currentHtml) await loadResultHtml(currentJob);
  if (!currentHtml) return showToast('No se pudo descargar el HTML.', 'error');
  const blob = new Blob([exportedHtml().html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentJobData?.input.clientSlug || 'newsletter'}-${currentJob}${opts.platform === 'generic' ? '' : `-${opts.platform}`}${opts.utm ? '-utm' : ''}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
document.getElementById('download-link').addEventListener('click', exportDownload);
document.getElementById('sticky-download').addEventListener('click', exportDownload);

// ---------------------------------------------------------------- aprobar para envío (2026-09-28)
// Una sola versión aprobada por newsletter: la que se envía. Se aprueba tras una lista de comprobación.
const APPROVAL_CHECKS = [
  'Revisada en móvil (vista «Móvil»)',
  'Revisada en modo oscuro («Oscuro» e «Invertido»)',
  'Enlaces y botones llevan a donde deben',
  'Asunto y preheader revisados (y cómo se ven en la bandeja)',
  'Precios, fechas, nombres y claims comprobados',
];
/** Dónde se comprueba cada punto de APPROVAL_CHECKS (por posición: el texto se guarda con la aprobación y
 *  no se toca). "Ver" deja la vista previa lista para mirarlo (2026-09-30). */
const APPROVAL_GO = [
  { label: 'Ver en móvil', go: () => setPreviewRadio('previewView', 'mobile') },
  { label: 'Ver en oscuro', go: () => setPreviewRadio('previewTheme', 'dark') },
  { label: 'Ver revisión de enlaces', go: () => showJobTab('review'), target: '.job-tabs', when: () => !!currentJobData?.quality },
  { label: 'Ver asunto y bandeja', go: () => showJobTab('meta'), target: '.job-tabs', when: () => !document.getElementById('tab-meta').hidden },
  null,
];

function setPreviewRadio(name, value) {
  showJobTab('preview');
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (!radio || radio.disabled || radio.checked) return;
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
}

const approveBox = document.getElementById('approve-box');
const approveBtn = document.getElementById('approve-btn');

function renderApproval(job, versions) {
  const banner = document.getElementById('approved-banner');
  banner.hidden = !job.approvedAt;
  if (job.approvedAt) {
    const when = new Date(job.approvedAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    document.getElementById('approved-text').textContent = `✓ Aprobada para envío${job.approvedBy ? ` · ${job.approvedBy}` : ''} · ${when}`;
    banner.title = (job.approvalChecklist || []).length ? `Comprobado: ${job.approvalChecklist.join(' · ')}` : '';
  }
  approveBtn.hidden = !!job.approvedAt || job.status !== 'completed';
  const other = versions.find((v) => v.approved && v.id !== job.id);
  const elsewhere = document.getElementById('approved-elsewhere');
  elsewhere.hidden = !other;
  if (other) {
    elsewhere.innerHTML = `Ojo: la versión aprobada para envío es la <a href="?job=${encodeURIComponent(other.id)}">versión ${other.number}</a>, no esta.`;
  }
  if (job.approvedAt && !approveBox.hidden) toggleApprove(false);
}

function toggleApprove(open) {
  approveBox.hidden = !open;
  approveBtn.setAttribute('aria-expanded', String(open));
  if (!open) return;
  document.getElementById('approve-checklist').innerHTML = APPROVAL_CHECKS.map((c, i) => {
    const go = APPROVAL_GO[i];
    const usable = go && (!go.when || go.when());
    const btn = usable ? `<button type="button" class="link-btn check-go" data-check-go="${i}">${escapeHtml(go.label)}</button>` : '';
    return `<li><label><input type="checkbox" data-check-item="${i}" /><span>${escapeHtml(c)}</span></label>${btn}</li>`;
  }).join('');
  document.getElementById('approve-submit').disabled = true;
  const errors = currentJobData?.quality?.errors || 0;
  const q = document.getElementById('approve-quality');
  q.hidden = !errors;
  q.textContent = errors ? `La revisión automática tiene ${plural(errors, 'error', 'errores')} sin resolver. Revísalos antes de aprobar.` : '';
  approveBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

approveBtn.addEventListener('click', () => toggleApprove(approveBox.hidden));
document.getElementById('approve-checklist').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-check-go]');
  if (!btn) return;
  const go = APPROVAL_GO[Number(btn.dataset.checkGo)];
  go.go();
  document.querySelector(go.target || '#preview-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('approve-close').addEventListener('click', () => toggleApprove(false));
approveBox.addEventListener('change', () => {
  const boxes = [...approveBox.querySelectorAll('[data-check-item]')];
  document.getElementById('approve-submit').disabled = !boxes.every((b) => b.checked);
});
approveBox.addEventListener('submit', async (e) => {
  e.preventDefault();
  const checklist = [...approveBox.querySelectorAll('[data-check-item]:checked')].map((b) => APPROVAL_CHECKS[Number(b.dataset.checkItem)]);
  const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checklist, by: savedRequester() || undefined }),
  }).catch(() => null);
  if (!res?.ok) return showToast('No se pudo aprobar. Inténtalo de nuevo.', 'error');
  toggleApprove(false);
  showToast('Versión aprobada para envío.');
  poll(currentJob);
});
document.getElementById('unapprove-btn').addEventListener('click', async () => {
  // Lo aprobado se guarda antes de quitarlo: "Deshacer" lo restaura con sus comprobaciones y quién lo aprobó
  // (2026-09-30). Antes, un clic sin querer obligaba a repetir la lista entera.
  const id = currentJob;
  const before = { checklist: currentJobData?.approvalChecklist || [], by: currentJobData?.approvedBy };
  const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/unapprove`, { method: 'POST' }).catch(() => null);
  if (!res?.ok) return showToast('No se pudo quitar la aprobación.', 'error');
  showToast('Ya no está aprobada.', 'info', {
    label: 'Deshacer',
    run: async () => {
      const undo = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(before),
      }).catch(() => null);
      if (!undo?.ok) return showToast('No se pudo restaurar la aprobación.', 'error');
      showToast('Aprobación restaurada.');
      if (id === currentJob) poll(id);
    },
  });
  poll(id);
});

// ---------------------------------------------------------------- archivar (2026-09-28)
async function setArchived(id, archived) {
  const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived }),
  }).catch(() => null);
  const data = await res?.json().catch(() => ({}));
  if (!res?.ok) {
    showToast(data?.error || 'No se pudo archivar.', 'error');
    return false;
  }
  showToast(archived ? 'Archivada con todas sus versiones. Está en «Archivadas» del historial.' : 'Recuperada: vuelve a salir en el historial.');
  return true;
}

function renderArchived(job) {
  document.getElementById('job-archived').hidden = !job.archivedAt;
  document.getElementById('archive-btn').hidden = !!job.archivedAt || job.status === 'queued' || job.status === 'running' || job.status === 'review';
}

document.getElementById('archive-btn').addEventListener('click', async () => {
  if (currentJob && (await setArchived(currentJob, true))) poll(currentJob);
});
document.getElementById('unarchive-btn').addEventListener('click', async () => {
  if (currentJob && (await setArchived(currentJob, false))) poll(currentJob);
});

// ---------------------------------------------------------------- atajos de teclado (2026-09-28)
const shortcuts = document.getElementById('shortcuts');

function toggleShortcuts(open) {
  shortcuts.hidden = !open;
  if (open) document.getElementById('shortcuts-close').focus();
  else document.getElementById('shortcuts-btn').focus({ preventScroll: true });
}
document.getElementById('shortcuts-btn').addEventListener('click', () => toggleShortcuts(true));
document.getElementById('shortcuts-close').addEventListener('click', () => toggleShortcuts(false));
shortcuts.addEventListener('click', (e) => {
  if (e.target === shortcuts) toggleShortcuts(false);
});

/** Pulsa un control si se puede usar ahora (visible y activo). */
function pressIfUsable(id) {
  const el = document.getElementById(id);
  if (!el || el.disabled || el.hidden || el.closest('[hidden]') || !el.offsetParent) return false;
  el.click();
  return true;
}

function cycleRadio(name, values) {
  const current = document.querySelector(`input[name="${name}"]:checked`)?.value;
  const next = values[(values.indexOf(current) + 1) % values.length];
  const radio = document.querySelector(`input[name="${name}"][value="${next}"]`);
  if (!radio || radio.disabled) return;
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
  const t = e.target;
  if (t.closest?.('input, textarea, select, [contenteditable]') || t.isContentEditable) return;
  if (!shortcuts.hidden) {
    if (e.key === 'Escape' || e.key === '?') {
      e.preventDefault();
      toggleShortcuts(false);
    }
    return;
  }
  if (viewJob.hidden || te.active || pick.active) return;
  const result = !document.getElementById('job-result').hidden;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  let done = false;
  if (key === '?') {
    toggleShortcuts(true);
    done = true;
  } else if (!result) {
    return;
  } else if (key === 'e') done = pressIfUsable('edit-text-btn');
  else if (key === 'c') done = reviseBox.hidden ? pressIfUsable('revise-btn') : false;
  else if (key === 'd') done = pressIfUsable('download-link');
  // Vista, color y antes/después cambian la vista previa: se muestra su pestaña.
  else if (key === 'v') {
    showJobTab('preview');
    cycleRadio('previewView', ['desktop', 'mobile', 'free']);
    done = true;
  } else if (key === 'o') {
    showJobTab('preview');
    cycleRadio('previewTheme', ['light', 'dark', 'invert']);
    done = true;
  } else if (key === 'b') {
    showJobTab('preview');
    done = pressIfUsable('compare-toggle');
  }
  if (done) e.preventDefault();
});

// "Ver errores": a la revisión automática sin tocar la URL (un #review dispararía la navegación de la página).
document.getElementById('result-errors-link').addEventListener('click', (e) => {
  e.preventDefault();
  showJobTab('review');
  document.querySelector('.job-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---------------------------------------------------------------- pestañas del resultado (2026-09-30)
// Vista previa, revisión, comparación y asunto/bandeja comparten sitio bajo las acciones: antes iban
// apilados y la vista previa empezaba casi dos pantallas más abajo. "Qué ha cambiado" y "Asunto y
// bandeja" solo salen si su bloque tiene algo (lo decide el render de siempre con su `hidden`).
const JOB_TABS = ['preview', 'review', 'compare', 'meta', 'client'];
let activeJobTab = 'preview';

function showJobTab(name, { focus = false } = {}) {
  activeJobTab = name;
  for (const t of JOB_TABS) {
    const tab = document.getElementById(`tab-${t}`);
    const on = t === name;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    document.getElementById(`panel-${t}`).hidden = !on;
    if (on && focus) tab.focus();
  }
  // La vista previa se mide al mostrarse: oculta, el iframe no tiene alto.
  if (name === 'preview') requestAnimationFrame(() => fitFrames());
}

function syncJobTabs() {
  const hasCompare = !document.getElementById('compare').hidden;
  const hasMeta = !document.getElementById('email-meta').hidden || !document.getElementById('inbox').hidden;
  document.getElementById('tab-compare').hidden = !hasCompare;
  document.getElementById('tab-meta').hidden = !hasMeta;
  if ((activeJobTab === 'compare' && !hasCompare) || (activeJobTab === 'meta' && !hasMeta)) showJobTab('preview');
}
const jobTabsObserver = new MutationObserver(syncJobTabs);
['compare', 'email-meta', 'inbox'].forEach((id) =>
  jobTabsObserver.observe(document.getElementById(id), { attributes: true, attributeFilter: ['hidden'] })
);

document.querySelector('.job-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) showJobTab(tab.dataset.tab);
});
document.querySelector('.job-tabs').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const visible = JOB_TABS.filter((t) => !document.getElementById(`tab-${t}`).hidden);
  const i = visible.indexOf(activeJobTab);
  const next =
    e.key === 'Home' ? 0 : e.key === 'End' ? visible.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length;
  e.preventDefault();
  showJobTab(visible[next], { focus: true });
});

document.getElementById('use-brief-btn').addEventListener('click', () => {
  if (currentJob) reuseJob(currentJob, { useBrief: true });
});
window.addEventListener('popstate', () => route());
// Al volver la red no se espera al siguiente reintento.
window.addEventListener('online', () => {
  if (currentJob && pollFailures) poll(currentJob);
});

const PHASE_LABELS = {
  setup: 'Preparando campaña',
  standalone: 'Newsletter',
  hermes: 'Hermes',
  system: 'Sistema',
};

let pollTimer = null;
let currentJob = null;

function showJobView(id) {
  // Cambiar a otro trabajo con algo sin guardar: se pregunta. Quien llama ya cambió la URL: se deja la de este.
  if (currentJob && id !== currentJob && !confirmLeaveJob()) {
    history.replaceState({}, '', `?job=${encodeURIComponent(currentJob)}`);
    return;
  }
  clearTimeout(historyTimer);
  currentJob = id;
  pollFailures = 0;
  setReconnecting(false);
  viewForm.hidden = true;
  hero.hidden = true;
  viewBrand.hidden = true;
  viewJob.hidden = false;
  document.getElementById('job-result').hidden = true;
  showJobTab('preview');
  resultBarHidden = false;
  updateSticky();
  document.getElementById('job-blocked').hidden = true;
  document.getElementById('job-cancelled').hidden = true;
  document.getElementById('job-review').hidden = true;
  clearTimeout(clientPollTimer);
  document.getElementById('rename-form').hidden = true;
  document.getElementById('job-name-row').hidden = true;
  document.getElementById('cancel-row').hidden = true;
  document.getElementById('job-change').hidden = true;
  reviseBox.hidden = true;
  reviseBox.reset();
  reviseBtn.setAttribute('aria-expanded', 'false');
  resetPicks();
  if (te.active || !teBox.hidden) teClose({ discard: false });
  approveBox.hidden = true;
  approveBtn.setAttribute('aria-expanded', 'false');
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

// Fallos pasajeros (2026-09-30): sin red, un 5xx mientras Railway se reinicia en un deploy o un 429. Antes
// un solo fallo dejaba de programar el siguiente sondeo (la página se quedaba congelada) y un 5xx decía
// "Trabajo no encontrado". Ahora se reintenta con esperas crecientes (5 s, 10 s, 20 s… hasta 1 min) y
// "Trabajo no encontrado" queda para el 404.
let pollFailures = 0;

function setReconnecting(on) {
  document.getElementById('job-reconnecting').hidden = !on;
}

async function poll(id) {
  clearTimeout(pollTimer);
  let res = null;
  try {
    res = await apiFetch(`/api/jobs/${id}`);
  } catch {
    // sin red: se reintenta abajo
  }
  if (id !== currentJob) return;
  if (!res || res.status >= 500 || res.status === 429) {
    pollFailures++;
    setReconnecting(true);
    pollTimer = setTimeout(() => poll(id), Math.min(60000, 5000 * 2 ** (pollFailures - 1)));
    return;
  }
  pollFailures = 0;
  setReconnecting(false);
  if (!res.ok) {
    document.getElementById('job-title').textContent = res.status === 401 ? 'Inicia sesión para ver este trabajo' : 'Trabajo no encontrado';
    return;
  }
  const { job, events, notes, meta, queue, hermesOnline, versions, retriedBy, familyTitle, clientMatrix: matrix } = await res.json();
  renderJobName(familyTitle, meta);
  renderVersions(job, versions || []);
  currentJobData = job;
  currentVersions = versions || [];
  renderApproval(job, currentVersions);
  renderArchived(job);
  updateTabTitle(job);
  maybeNotify(job);

  document.getElementById('job-title').textContent = job.input.revisionOf
    ? `${job.input.clientName} · cambios`
    : job.input.mobileFixOf
    ? `${job.input.clientName} · adaptación a móvil`
    : job.input.textEditOf
    ? `${job.input.clientName} · texto editado`
    : job.input.clientName;
  const brandLink = document.getElementById('job-brand-link');
  brandLink.hidden = !job.input.clientSlug;
  brandLink.href = `?brand=${encodeURIComponent(job.input.clientSlug || '')}`;
  brandLink.textContent = `Ficha de marca de ${job.input.clientName}`;
  const changeEl = document.getElementById('job-change');
  changeEl.hidden = !job.input.changeRequest;
  changeEl.textContent = !job.input.changeRequest
    ? ''
    : job.input.textEditOf
    ? `Texto cambiado en Studio, sin Hermes:\n${job.input.changeRequest}`
    : `Cambios pedidos: «${job.input.changeRequest}»`;
  renderRequest(job);
  document.getElementById('cancel-row').hidden = job.status !== 'queued' && job.status !== 'running' && job.status !== 'review';
  document.getElementById('job-meta').textContent = [
    new Date(job.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
    job.input.requesterName,
    IMAGE_LABELS[job.input.imageMode],
    durationLabel({
      status: job.status,
      textEditOf: job.input.textEditOf,
      durationSec: job.startedAt && job.finishedAt ? (Date.parse(job.finishedAt) - Date.parse(job.startedAt)) / 1000 : null,
      elapsedSec: job.progress?.elapsedSec,
    }),
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
      renderReview(job.quality, notes, matrix);
      renderReportShare(job.reportShare);
      renderShare(job.share, versions || []);
      renderMeta(meta, job.input.clientName);
      setupExport(job);
      loadResultHtml(id).then(() => {
        if (id !== currentJob) return;
        updateThemeHint();
        renderFrame('after');
        renderExportSummary();
      });
      setupCompare(job, versions || []);
    }
    return;
  }

  renderRetried(retriedBy);
  renderBriefReview(job);
  if (job.status === 'review') {
    pollTimer = setTimeout(() => poll(id), 15000); // por si otra persona lo aprueba o lo cancela
    return;
  }
  if (job.status === 'cancelled') {
    document.getElementById('job-cancelled').hidden = false;
    return;
  }

  if (job.status === 'blocked' || job.status === 'failed') {
    document.getElementById('job-blocked').hidden = false;
    const why = window.HermesFailure.explainFailure(job.blockedReason || job.error);
    document.getElementById('failed-summary').textContent = why.summary;
    document.getElementById('failed-advice').textContent = retriedBy ? '' : why.advice;
    document.getElementById('blocked-reason').textContent = why.detail || 'Sin detalle.';
    document.querySelector('#job-blocked [data-retry-current]').hidden = !why.retry || !!retriedBy;
    // "Editar y reintentar" abre el formulario con lo pedido: no aplica a cambios ni adaptaciones de una versión.
    document.getElementById('failed-edit').hidden = !!(job.input.revisionOf || job.input.mobileFixOf || job.input.textEditOf);
    document.getElementById('log-box').open = true;
    return;
  }

  pollTimer = setTimeout(() => poll(id), 10000);
}

/** Fallido o cancelado que ya se reintentó (2026-10-01): enlace al reintento en vez de un segundo «Reintentar». */
function renderRetried(retriedBy) {
  document.querySelectorAll('[data-retried]').forEach((p) => {
    p.hidden = !retriedBy;
    if (!retriedBy) return;
    const state = STATUS_LABELS[retriedBy.status] || retriedBy.status;
    p.innerHTML = `Ya se reintentó: <a href="?job=${encodeURIComponent(retriedBy.id)}">ver el reintento</a> (${escapeHtml(state.toLowerCase())}).`;
  });
  document.querySelector('#job-cancelled [data-retry-current]').hidden = !!retriedBy;
}

// ---------------------------------------------------------------- lo que se pidió (2026-09-30)
// Visible en la cabecera también mientras Hermes trabaja o si falla: antes solo se veía con «Reutilizar».
// Cambios, adaptaciones a móvil y ediciones de texto ya lo dicen en su propia línea («Cambios pedidos: …»).
const REQUEST_INLINE_MAX = 280;

function renderRequest(job) {
  const box = document.getElementById('job-request');
  const input = job.input;
  const derived = input.revisionOf || input.mobileFixOf || input.textEditOf;
  const text = derived ? '' : (input.instruction || input.briefText || '').trim();
  box.hidden = !text;
  if (!text || box.dataset.src === text) return;
  box.dataset.src = text;
  const label = input.instruction ? 'Pediste' : 'Prompt creativo';
  box.innerHTML =
    text.length <= REQUEST_INLINE_MAX && !text.includes('\n')
      ? `<p>${label}: <q>${escapeHtml(text)}</q></p>`
      : `<details><summary>${label}: <q>${escapeHtml(cut(text.split('\n')[0], 90))}</q> · ver completo</summary><div class="request-full">${escapeHtml(text)}</div></details>`;
}

// ---------------------------------------------------------------- asunto, preheader y copiar

let currentMeta = null;
/** HTML del resultado, descargado al abrirlo: copiarlo en el mismo clic, sin esperar a la red, evita
 *  que el navegador niegue el portapapeles por haber pasado demasiado tiempo desde el clic. */
let currentHtml = null;

async function loadResultHtml(id) {
  currentHtml = null;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/result`);
    if (res.ok && id === currentJob) currentHtml = await res.text();
  } catch {
    // se reintenta al pulsar "Copiar HTML"
  }
}

function renderMeta(meta, sender) {
  currentMeta = meta;
  const box = document.getElementById('email-meta');
  box.hidden = !meta;
  renderInbox(meta, sender);
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

/** "Cómo se ve en la bandeja" (2026-09-28): la fila de Gmail con remitente, asunto y preheader. El corte
 *  se calcula midiendo el texto a los anchos reales de Gmail (no al ancho de esta página, que en un
 *  portátil deja la fila de escritorio en ~470 px) y se muestra ya cortado, legible en cualquier pantalla. */
const INBOX = {
  font: 'Roboto, Arial, sans-serif',
  mobileWidth: 276, // móvil de 390 px: avatar, márgenes y estrella fuera (= columna de .inbox-row-mobile)
  deskWidth: 760, // portátil de 1.440 px: menú lateral, remitente y fecha fuera
};
let measureCtx = null;

function textWidth(text, weight, size = 14) {
  measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
  measureCtx.font = `${weight} ${size}px ${INBOX.font}`;
  return measureCtx.measureText(text).width;
}

/** Cuántos caracteres de `text` caben en `width` px dejando sitio para «…». */
function fitChars(text, width, weight) {
  if (textWidth(text, weight) <= width) return text.length;
  const room = width - textWidth('…', weight);
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (textWidth(text.slice(0, mid), weight) <= room) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function cut(text, n) {
  return n >= text.length ? text : `${text.slice(0, n).trimEnd()}…`;
}

function renderInbox(meta, sender) {
  const box = document.getElementById('inbox');
  box.hidden = !meta || (!meta.subject && !meta.preheader);
  if (box.hidden) return;
  const from = sender || 'Remitente';
  const subject = meta.subject || '(sin asunto)';
  const pre = meta.preheader || '';

  // Móvil: asunto y preheader en líneas propias.
  const mSub = fitChars(subject, INBOX.mobileWidth, 700);
  const mPre = fitChars(pre, INBOX.mobileWidth, 400);
  // Escritorio: asunto en negrita y, en la misma línea, « – » y el preheader hasta donde quepa.
  const dSub = fitChars(subject, INBOX.deskWidth, 700);
  const restWidth = INBOX.deskWidth - textWidth(subject, 700) - textWidth(' – ', 400);
  const dPre = dSub < subject.length || restWidth <= 0 ? 0 : fitChars(pre, restWidth, 400);

  const set = (sel, text) => box.querySelectorAll(sel).forEach((el) => (el.textContent = text));
  set('[data-inbox="from"]', from);
  set('.inbox-row-mobile [data-inbox="subject"]', cut(subject, mSub));
  set('.inbox-row-mobile [data-inbox="preheader"]', cut(pre, mPre));
  set('.inbox-row-desk [data-inbox="subject"]', cut(subject, dSub));
  set('.inbox-row-desk [data-inbox="preheader"]', cut(pre, dPre));
  box.querySelector('.inbox-row-mobile .inbox-pre').hidden = !pre;
  box.querySelector('.inbox-row-desk .inbox-pre').hidden = !pre || dPre === 0;
  document.getElementById('inbox-avatar').textContent = (from.trim()[0] || '?').toUpperCase();

  const reads = (n, total) => (n >= total ? 'entero' : `${n} de ${total} caracteres`);
  document.getElementById('inbox-mobile-count').textContent =
    `Asunto: ${reads(mSub, subject.length)}` + (pre ? ` · Preheader: ${reads(mPre, pre.length)}` : '');
  document.getElementById('inbox-desk-count').textContent =
    `Asunto: ${reads(dSub, subject.length)}` + (pre ? ` · Preheader: ${dPre ? reads(dPre, pre.length) : 'no se ve'}` : '');
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
  const platform = document.getElementById('export-platform').value;
  copyText(
    exportedHtml().html,
    platform === 'generic' ? 'HTML copiado: pégalo en tu plataforma de envío.' : `HTML copiado para ${HermesExport.PLATFORMS[platform].label}.`
  );
});

// ---------------------------------------------------------------- título de la pestaña y aviso al terminar

const BASE_TITLE = document.title;

// ---------------------------------------------------------------- estado en el icono de la pestaña (2026-09-28)
// Un punto sobre el icono de Studio: azul trabajando o en cola, verde lista, rojo fallida o bloqueada. Se ve
// desde otra pestaña sin tener que leer el título.
const FAVICON_COLORS = { running: '#3d8bff', queued: '#3d8bff', review: '#ffb224', completed: '#1db980', failed: '#e5484d', blocked: '#e5484d' };
const faviconLink = document.querySelector('link[rel="icon"]');
const faviconBase = new Image();
faviconBase.src = '/favicon.png';
let faviconState = null;

function setFaviconStatus(status) {
  const color = FAVICON_COLORS[status] || null;
  if (color === faviconState) return;
  faviconState = color;
  if (!color) {
    faviconLink.href = '/favicon.png';
    return;
  }
  const draw = () => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    ctx.drawImage(faviconBase, 0, 0, 32, 32);
    ctx.beginPath();
    ctx.arc(24, 24, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    if (faviconState === color) faviconLink.href = c.toDataURL('image/png');
  };
  if (faviconBase.complete && faviconBase.naturalWidth) draw();
  else faviconBase.addEventListener('load', draw, { once: true });
}

function updateTabTitle(job) {
  setFaviconStatus(job.status);
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
  document.getElementById('notify-blocked').hidden = !active || !notifySupported || Notification.permission !== 'denied';
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
    review: 'El brief está listo: revísalo para que Hermes haga la newsletter.',
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
let reviewChecks = [];

function renderReview(quality, notes, matrix = null) {
  reviewMatrix = matrix;
  const summary = document.getElementById('review-summary');
  const list = document.getElementById('review-list');
  const message = document.getElementById('result-message');
  document.getElementById('review-empty').hidden = !!quality;
  document.getElementById('result-errors-link').hidden = !quality?.errors;
  const badge = document.getElementById('tab-review-badge');
  badge.textContent = !quality ? '' : quality.errors ? String(quality.errors) : quality.warnings ? String(quality.warnings) : '✓';
  badge.className = `tab-badge${quality ? ` is-${quality.errors ? 'error' : quality.warnings ? 'warning' : 'ok'}` : ''}`;
  badge.title = !quality ? '' : quality.errors ? plural(quality.errors, 'error', 'errores') : quality.warnings ? plural(quality.warnings, 'aviso', 'avisos') : 'Todo correcto';
  message.textContent = 'La newsletter está lista.';
  message.classList.remove('has-errors');

  if (!quality) {
    reviewChecks = [];
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
      message.textContent = `Lista, con ${plural(quality.errors, 'error', 'errores')} por revisar.`;
      message.classList.add('has-errors');
    }
    reviewChecks = [...quality.checks].sort((a, b) => CHECK_ORDER[a.status] - CHECK_ORDER[b.status]);
    list.innerHTML = reviewChecks
      .map((c, ci) => {
        // Desplegable numerado como el de la web (2026-10-02): número en rosa, título grande y el estado a la derecha.
        const num = `<span class="check-num" aria-hidden="true">${String(ci + 1).padStart(2, '0')}</span>`;
        const head = `${num}<span class="check-dot" aria-hidden="true"></span><span class="check-label">${escapeHtml(c.label)}</span><span class="check-state">${escapeHtml(CHECK_STATE[c.status] || c.status)}</span>`;
        if (!c.details.length) return `<li class="check-${escapeHtml(c.status)}"><div class="check-line">${head}</div></li>`;
        const details = c.details
          .map((d, i) => `<li class="${i < (c.errorCount || 0) ? 'is-error' : ''}" data-check="${ci}" data-detail="${i}"><span>${escapeHtml(d)}</span></li>`)
          .join('');
        return `<li class="check-${escapeHtml(c.status)}"><details${c.status === 'ok' ? '' : ' open'}><summary>${head}</summary><ul class="check-details">${details}</ul></details></li>`;
      })
      .join('');
  }
  renderClientMatrix();

  const notesBox = document.getElementById('notes-box');
  notesBox.hidden = !notes;
  notesBox.open = false;
  document.getElementById('notes-text').innerHTML = notes && window.HermesMarkdown ? window.HermesMarkdown.render(notes) : '';
}

// ---------------------------------------------------------------- revisión por programa de correo (2026-10-01)
// Las mismas comprobaciones repartidas por programa (Outlook, Gmail, Apple Mail, móvil y comunes); el reparto lo
// hace el servidor (studio/server/clientMatrix.ts) para que Studio y el informe compartido digan lo mismo.

let reviewMatrix = null;
const CLIENT_STATE = { ok: 'Correcto', warning: 'Revisar', error: 'Error', unknown: 'Sin medir' };

function readReviewView() {
  try {
    return localStorage.getItem('reviewView') === 'checks' ? 'checks' : 'clients';
  } catch {
    return 'clients';
  }
}

function renderClientMatrix() {
  const has = !!reviewMatrix?.length;
  const view = has ? readReviewView() : 'checks';
  document.getElementById('review-tools').hidden = !has;
  document.getElementById('review-disclaimer').hidden = !has || view !== 'clients';
  document.querySelectorAll('[data-review-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.reviewView === view)));
  const box = document.getElementById('review-clients');
  box.hidden = view !== 'clients';
  document.getElementById('review-list').hidden = view === 'clients';
  if (!has) {
    box.innerHTML = '';
    return;
  }
  const indexOf = (id) => reviewChecks.findIndex((c) => c.id === id);
  box.innerHTML = reviewMatrix
    .map((row) => {
      // A la vista, solo errores y avisos; lo correcto, resumido en una línea (la cabecera ya dice el estado).
      const items = row.items
        .filter((it) => it.text && it.level !== 'ok')
        .map((it) => {
          const ci = indexOf(it.checkId);
          const data = ci >= 0 && it.detailIndex >= 0 ? ` data-check="${ci}" data-detail="${it.detailIndex}"` : '';
          return `<li class="is-${escapeHtml(it.level)}"${data}><span><span class="client-item-label">${escapeHtml(it.label)}:</span> ${escapeHtml(it.text)}</span></li>`;
        })
        .join('');
      const okLabels = [...new Set(row.items.filter((it) => it.level === 'ok' && !row.items.some((o) => o.checkId === it.checkId && o.level !== 'ok')).map((it) => it.label))];
      const okAll = okLabels.length && row.id === 'all' ? `<p class="hint client-ok">Correcto: ${escapeHtml(okLabels.join(', '))}.</p>` : '';
      return `<section class="client-card check-${escapeHtml(row.status)}">
          <div class="client-card-head">
            <span class="check-dot" aria-hidden="true"></span>
            <h4>${escapeHtml(row.name)}</h4>
            <span class="client-scope">${escapeHtml(row.scope)}</span>
            <span class="check-state">${escapeHtml(CLIENT_STATE[row.status] || row.status)}</span>
          </div>
          ${items ? `<ul class="check-details">${items}</ul>` : ''}${okAll}
          ${row.notes.map((n) => `<p class="client-note">${escapeHtml(n)}</p>`).join('')}
        </section>`;
    })
    .join('');
  annotateLocations();
}

document.querySelectorAll('[data-review-view]').forEach((b) =>
  b.addEventListener('click', () => {
    try {
      localStorage.setItem('reviewView', b.dataset.reviewView);
    } catch {
      // sin almacenamiento: solo esta visita
    }
    renderClientMatrix();
  })
);
document.getElementById('review-clients').addEventListener('click', (e) => {
  const btn = e.target.closest('.locate-btn');
  if (!btn) return;
  const li = btn.closest('li[data-check]');
  const check = reviewChecks[Number(li.dataset.check)];
  const loc = check && HermesLocate.locatorsFor(check)[Number(li.dataset.detail)];
  if (loc) goToLocation(loc, 'after');
});

/** Texto para pegar en un correo o en Slack: el informe por programa, sin enlaces de Studio. */
function reportText() {
  if (!reviewMatrix) return '';
  // El nombre propio solo si lo tiene: si no, el asunto ya va en su línea.
  const lines = [`Revisión técnica · ${currentJobData?.input.clientName || ''}${jobFamilyTitle ? ` · ${jobFamilyTitle}` : ''}`];
  if (currentMeta?.subject) lines.push(`Asunto: ${currentMeta.subject}`);
  if (currentMeta?.preheader) lines.push(`Preheader: ${currentMeta.preheader}`);
  lines.push('(Comprobaciones del código de la pieza, no capturas de cada programa.)', '');
  for (const row of reviewMatrix) {
    lines.push(`${row.name} · ${row.scope}: ${CLIENT_STATE[row.status] || row.status}`);
    for (const it of row.items) if (it.level !== 'ok' && it.text) lines.push(`  - ${it.label}: ${it.text}`);
    for (const n of row.notes) lines.push(`  · ${n}`);
  }
  return lines.join('\n');
}
document.getElementById('report-copy').addEventListener('click', () =>
  copyText(reportText(), 'Informe copiado como texto.', 'Selecciona y copia el informe a mano.')
);

function renderReportShare(reportShare) {
  const active = !!reportShare && Date.parse(reportShare.expiresAt) > Date.now();
  document.getElementById('report-link').hidden = !active;
  document.getElementById('report-create').hidden = active;
  if (!active) return;
  document.getElementById('report-url').value = `${location.origin}/r/${reportShare.token}`;
  const until = new Date(reportShare.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  document.getElementById('report-info').textContent = `Sin contraseña, solo el informe (no la pieza). Caduca el ${until}`;
}
async function reportShareRequest(method) {
  if (!currentJob) return;
  const id = currentJob;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/report-share`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify({ by: savedRequester() || undefined }) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(data.error || 'No se pudo cambiar el enlace del informe.', 'error');
    if (id !== currentJob) return;
    renderReportShare(method === 'POST' ? data.reportShare : null);
    if (method === 'POST') copyText(document.getElementById('report-url').value, 'Enlace al informe creado y copiado.', 'Copia el enlace del recuadro.');
    else showToast('Enlace al informe desactivado.');
  } catch {
    showToast(NETWORK_ERROR, 'error');
  }
}
document.getElementById('report-create').addEventListener('click', () => reportShareRequest('POST'));
document.getElementById('report-revoke').addEventListener('click', () => reportShareRequest('DELETE'));
document.getElementById('report-url-copy').addEventListener('click', () =>
  copyText(document.getElementById('report-url').value, 'Enlace al informe copiado.', 'Copia el enlace del recuadro.')
);
document.getElementById('report-url').addEventListener('focus', (e) => e.target.select());

// ---------------------------------------------------------------- vista previa escritorio / móvil

const PREVIEW_VIEWS = {
  desktop: { width: 800, label: 'Escritorio · 800 px' },
  mobile: { width: 375, label: 'Móvil · 375 px (iPhone)' },
  free: { width: null, label: 'Libre' },
};

/** Sin vista elegida antes, en pantallas estrechas se abre en Móvil: Escritorio cabía al 33 %, ilegible
 *  en un teléfono (2026-10-01). Una elección guardada, incluida Escritorio, se respeta. */
function readPreviewView() {
  const fallback = window.matchMedia('(max-width: 600px)').matches ? 'mobile' : 'desktop';
  try {
    const v = localStorage.getItem('previewView');
    return v === 'mobile' || v === 'free' || v === 'desktop' ? v : fallback;
  } catch {
    return fallback;
  }
}

// Ancho libre (2026-09-28): ver dónde se rompe el diseño entre móvil y escritorio (tablets, ventanas
// estrechas de webmail). Se recuerda en el navegador.
const FREE_MIN = 320;
const FREE_MAX = 1000;
function readFreeWidth() {
  try {
    const w = Number(localStorage.getItem('previewFreeWidth'));
    return w >= FREE_MIN && w <= FREE_MAX ? w : 600;
  } catch {
    return 600;
  }
}
let freeWidth = readFreeWidth();

function setFreeWidth(w) {
  freeWidth = Math.max(FREE_MIN, Math.min(FREE_MAX, Math.round(w)));
  try {
    localStorage.setItem('previewFreeWidth', String(freeWidth));
  } catch {
    // sin almacenamiento
  }
  document.getElementById('free-width-range').value = String(freeWidth);
  applyPreviewView('free');
  // Otro ancho, otra altura (el texto se recoloca): se vuelve a medir.
  cancelAnimationFrame(setFreeWidth.raf);
  setFreeWidth.raf = requestAnimationFrame(() => requestAnimationFrame(fitFrames));
}
document.getElementById('free-width-range').addEventListener('input', (e) => setFreeWidth(Number(e.target.value)));
document.querySelector('.free-width-presets').addEventListener('click', (e) => {
  const b = e.target.closest('[data-width]');
  if (b) setFreeWidth(Number(b.dataset.width));
});

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
    device.querySelector('iframe').style.width = view === 'free' ? `${freeWidth}px` : '';
  }
  const freeBox = document.getElementById('free-width');
  freeBox.hidden = view !== 'free';
  if (view === 'free') {
    document.getElementById('free-width-range').value = String(freeWidth);
    document.getElementById('free-width-value').textContent = `${freeWidth} px`;
    freeBox.querySelectorAll('[data-width]').forEach((b) => b.classList.toggle('is-active', Number(b.dataset.width) === freeWidth));
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
    (view === 'free' ? `Libre · ${freeWidth} px` : PREVIEW_VIEWS[view].label) + (scale < 1 ? ` · al ${Math.round(scale * 100)} %` : '');
}

// ---------------------------------------------------------------- versiones y comparación

const VERSION_KIND = { original: 'Original', revision: 'Cambios', 'mobile-fix': 'Adaptación a móvil', 'text-edit': 'Texto editado', retry: 'Reintento' };

function renderVersions(job, versions) {
  const self = versions.find((v) => v.id === job.id);
  const parent = self && versions.find((v) => v.id === self.parentId);
  const parentEl = document.getElementById('job-parent');
  // Con la lista de versiones a la vista, "Hecha a partir de…" repetía lo mismo (2026-09-30): solo sin lista.
  parentEl.hidden = !parent || versions.length >= 2;
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
      const here = v.id === job.id;
      // Número a la izquierda y el resto en su columna (2026-10-01): en móvil la descripción se partía y
      // "· esta" quedaba suelto en otra línea.
      return `<li${here ? ' aria-current="page"' : ''}>
          <a href="?job=${encodeURIComponent(v.id)}">Versión ${v.number}</a>
          <span class="v-body"><span class="v-desc">${escapeHtml(desc)}</span>${here ? ' <span class="v-here">esta</span>' : ''}${
            state ? ` <span class="v-state">${escapeHtml(state)}</span>` : ''
          }${v.approved ? ' <span class="v-approved">✓ Aprobada</span>' : ''}</span>
        </li>`;
    })
    .join('');
}

let compareParent = null;
let compareDiff = null;
let compareLocs = [];

function resetCompare() {
  compareParent = null;
  compareDiff = null;
  compareLocs = [];
  document.getElementById('highlight-toggle-wrap').hidden = true;
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
  const res = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/result`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// "Qué ha cambiado" respecto a la versión de la que sale (compare.js): texto por bloques, enlaces e
// imágenes. Sirve para confirmar que Hermes solo tocó lo pedido.
/** "Qué ha cambiado" y "Antes y después" contra cualquier otra versión terminada (2026-09-28). Por
 *  defecto, la versión de la que sale; en la original, se elige. `baseId`: la elegida en "Comparar con"
 *  (null = ninguna; sin definir = la de por defecto). */
async function setupCompare(job, versions, baseId) {
  const self = versions.find((v) => v.id === job.id);
  const others = versions.filter((v) => v.id !== job.id && v.status === 'completed');
  if (!self || !others.length || !window.HermesCompare) return;
  const parent = versions.find((v) => v.id === self.parentId && v.status === 'completed') || null;
  const base = baseId === undefined ? parent : versions.find((v) => v.id === baseId) || null;
  const select = document.getElementById('compare-with');
  select.innerHTML =
    (parent ? '' : '<option value="">Elige una versión…</option>') +
    others
      .map((v) => {
        const what = v.id === self.parentId ? 'de la que sale' : VERSION_KIND[v.kind] + (v.approved ? ' · aprobada' : '');
        return `<option value="${escapeHtml(v.id)}">Versión ${v.number} (${escapeHtml(what)})</option>`;
      })
      .join('');
  select.value = base ? base.id : '';
  document.getElementById('compare').hidden = false;
  if (!base) {
    compareParent = null;
    compareDiff = null;
    compareLocs = [];
    compareBeforeHtml = null;
    document.getElementById('compare-list').innerHTML = '';
    document.getElementById('compare-summary').textContent = '';
    document.getElementById('compare-base').textContent = 'Elige con qué versión compararla: verás qué cambia en texto, enlaces e imágenes, y las dos lado a lado.';
    if (document.getElementById('compare-toggle').checked) document.getElementById('compare-toggle').click();
    document.getElementById('compare-toggle-wrap').hidden = true;
    document.getElementById('highlight-toggle-wrap').hidden = true;
    markChanges('after');
    annotateLocations();
    return;
  }
  const id = job.id;
  let before;
  let after;
  try {
    [before, after] = await Promise.all([fetchResult(base.id), fetchResult(id)]);
  } catch {
    return;
  }
  if (id !== currentJob || select.value !== base.id) return;
  const parentOrBase = base;
  compareParent = parentOrBase;
  compareBeforeHtml = before;
  const diff = window.HermesCompare.compareVersions(before, after);
  compareDiff = diff;
  compareLocs = [];
  // Cada cambio lleva su localizador: lo añadido se busca en esta versión y lo quitado en la anterior.
  const loc = (side, l) => ` data-loc="${compareLocs.push({ side, loc: l }) - 1}"`;
  const items = [];
  const group = (title, list) => {
    if (list.length) items.push(`<li class="group">${escapeHtml(title)}</li>`, ...list);
  };
  group(
    'Texto',
    diff.text.map(
      (d) => `<li class="is-${d.type}"${loc(d.type === 'added' ? 'after' : 'before', { kind: 'text', text: d.text })}><span>${srChange(d.type)}${escapeHtml(d.text)}</span></li>`
    )
  );
  group('Enlaces', [
    ...diff.links.removed.map((u) => `<li class="is-removed"${loc('before', { kind: 'href', url: u })}><span>${srChange('removed')}${escapeHtml(u)}</span></li>`),
    ...diff.links.added.map((u) => `<li class="is-added"${loc('after', { kind: 'href', url: u })}><span>${srChange('added')}${escapeHtml(u)}</span></li>`),
  ]);
  group('Imágenes', [
    ...diff.images.removed.map((u) => `<li class="is-removed"${loc('before', { kind: 'src', url: u })}><span>${srChange('removed')}${escapeHtml(u.split('/').pop())}</span></li>`),
    ...diff.images.added.map((u) => `<li class="is-added"${loc('after', { kind: 'src', url: u })}><span>${srChange('added')}${escapeHtml(u.split('/').pop())}</span></li>`),
  ]);
  const changes = diff.text.length + diff.links.removed.length + diff.links.added.length + diff.images.removed.length + diff.images.added.length;
  const summary = document.getElementById('compare-summary');
  summary.textContent = diff.unchanged ? 'Sin cambios de contenido' : `${changes} cambio${changes === 1 ? '' : 's'}`;
  summary.className = `review-summary ${diff.unchanged ? 'is-warning' : 'is-ok'}`;
  const isParent = base.id === self.parentId;
  document.getElementById('compare-base').textContent = diff.unchanged
    ? `El texto, los enlaces y las imágenes son iguales que en la versión ${base.number}${isParent && job.input.mobileFixOf ? ' (normal en una adaptación a móvil: solo cambia el diseño).' : '. Puede que solo cambiara el diseño.'}`
    : isParent
    ? `Respecto a la versión ${base.number}. En rojo lo que se quitó y en verde lo que se añadió.`
    : `Respecto a la versión ${base.number}. En rojo lo que solo está en la ${base.number}; en verde lo que solo está en esta (la ${self.number}).`;
  document.getElementById('compare-list').innerHTML = items.join('');
  document.getElementById('compare').hidden = false;
  document.getElementById('compare-toggle-wrap').hidden = false;
  document.getElementById('highlight-toggle-wrap').hidden = diff.unchanged;
  markChanges('after');
  annotateLocations();
  document.getElementById('preview-label-before').textContent = isParent ? `Antes · versión ${base.number}` : `Versión ${base.number}`;
  document.getElementById('preview-label-after').textContent = isParent ? `Después · versión ${self.number}` : `Versión ${self.number} (esta)`;
  if (document.getElementById('compare-toggle').checked) renderFrame('before');
}

// ---------------------------------------------------------------- avisos y cambios → sitio en la pieza

/** Resaltar cambios (2026-09-28): verde lo añadido en esta versión y, en "Antes y después", rojo lo que
 *  se quitó en la anterior. Se vuelve a pintar en cada carga del marco (tema, comparación). */
function readHighlight() {
  try {
    return localStorage.getItem('highlightChanges') !== '0';
  } catch {
    return true;
  }
}

function markChanges(side) {
  const frame = document.getElementById(side === 'before' ? 'preview-frame-before' : 'preview-frame');
  const doc = frame.getAttribute('srcdoc') ? frame.contentDocument : null;
  if (!doc || !doc.body) return;
  const attr = side === 'before' ? 'data-studio-removed' : 'data-studio-added';
  doc.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
  if (!compareDiff || !document.getElementById('highlight-toggle').checked) return;
  ensureStudioStyle(doc);
  for (const loc of HermesLocate.changeLocators(compareDiff, side)) HermesLocate.find(doc, loc)?.setAttribute(attr, '');
}

document.getElementById('highlight-toggle').checked = readHighlight();
document.getElementById('highlight-toggle').addEventListener('change', (e) => {
  try {
    localStorage.setItem('highlightChanges', e.target.checked ? '1' : '0');
  } catch {
    // sin almacenamiento: solo dura esta visita
  }
  markChanges('after');
  markChanges('before');
});

function frameDoc(side) {
  const frame = document.getElementById(side === 'before' ? 'preview-frame-before' : 'preview-frame');
  return frame.getAttribute('srcdoc') ? frame.contentDocument : null;
}

/** Botón "Ver" en cada aviso y cada cambio que se encuentra en la vista previa. Lo que se sale del ancho
 *  en móvil siempre lo lleva: se busca al pulsar, con la vista en móvil. Lo quitado se busca en la
 *  versión anterior, que solo se carga al compararlas: también lo lleva siempre. */
function annotateLocations() {
  const doc = frameDoc('after');
  document.querySelectorAll('.locate-btn').forEach((b) => b.remove());
  const add = (li, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'locate-btn';
    btn.textContent = 'Ver';
    btn.setAttribute('aria-label', `Ver en la vista previa: ${label}`);
    li.appendChild(btn);
  };
  document.querySelectorAll('#review-list li[data-check], #review-clients li[data-check]').forEach((li) => {
    const check = reviewChecks[Number(li.dataset.check)];
    const loc = check && HermesLocate.locatorsFor(check)[Number(li.dataset.detail)];
    if (!loc) return;
    if (loc.kind === 'overflow' || (doc && HermesLocate.find(doc, loc))) add(li, li.textContent);
  });
  document.querySelectorAll('#compare-list li[data-loc]').forEach((li) => {
    const entry = compareLocs[Number(li.dataset.loc)];
    if (!entry) return;
    if (entry.side === 'before' || (doc && HermesLocate.find(doc, entry.loc))) add(li, li.textContent);
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Baja hasta un elemento de la vista previa y lo hace parpadear (para lo que no es un aviso de la revisión). */
function flashInPreview(el) {
  const frame = document.getElementById('preview-frame');
  const device = frame.closest('.preview-device');
  const t = getComputedStyle(device).transform;
  const scale = t && t !== 'none' ? new DOMMatrix(t).a : 1;
  const r = el.getBoundingClientRect();
  const top = frame.getBoundingClientRect().top + window.scrollY + r.top * scale;
  window.scrollTo({ top: Math.max(0, top - Math.max(80, (window.innerHeight - r.height * scale) / 2)), behavior: 'smooth' });
  ensureStudioStyle(el.ownerDocument);
  el.setAttribute('data-studio-flash', '');
  setTimeout(() => el.removeAttribute('data-studio-flash'), 3000);
}

async function goToLocation(loc, side) {
  if (activeJobTab !== 'preview') {
    showJobTab('preview');
    await wait(50);
  }
  if (loc.kind === 'overflow' && readCheckedView() !== 'mobile') {
    document.querySelector('input[name="previewView"][value="mobile"]').checked = true;
    applyPreviewView('mobile');
    await wait(50);
    fitFrames();
  }
  if (side === 'before' && !document.getElementById('compare-toggle').checked) document.getElementById('compare-toggle').click();
  let el = null;
  for (let i = 0; i < 15 && !el; i++) {
    el = HermesLocate.find(frameDoc(side), loc);
    if (!el) await wait(200); // la versión anterior se está cargando
  }
  if (!el) {
    showToast('No aparece en la vista previa: puede estar oculto a este ancho.');
    return;
  }
  const frame = document.getElementById(side === 'before' ? 'preview-frame-before' : 'preview-frame');
  const device = frame.closest('.preview-device');
  const t = getComputedStyle(device).transform;
  const scale = t && t !== 'none' ? new DOMMatrix(t).a : 1;
  const r = el.getBoundingClientRect();
  const top = frame.getBoundingClientRect().top + window.scrollY + r.top * scale;
  const height = r.height * scale;
  window.scrollTo({ top: Math.max(0, top - Math.max(80, (window.innerHeight - height) / 2)), behavior: 'smooth' });
  frameDoc(side)?.querySelectorAll('[data-studio-flash]').forEach((x) => x.removeAttribute('data-studio-flash'));
  ensureStudioStyle(el.ownerDocument);
  el.setAttribute('data-studio-flash', '');
  setTimeout(() => el.removeAttribute('data-studio-flash'), 3000);
}

document.getElementById('review-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.locate-btn');
  if (!btn) return;
  e.preventDefault(); // dentro de <summary> no pliega el grupo
  const li = btn.closest('li[data-check]');
  const check = reviewChecks[Number(li.dataset.check)];
  const loc = HermesLocate.locatorsFor(check)[Number(li.dataset.detail)];
  if (loc) goToLocation(loc, 'after');
});
document.getElementById('compare-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.locate-btn');
  if (!btn) return;
  const entry = compareLocs[Number(btn.closest('li[data-loc]').dataset.loc)];
  if (entry) goToLocation(entry.loc, entry.side);
});

document.getElementById('compare-with').addEventListener('change', (e) => {
  if (currentJobData) setupCompare(currentJobData, currentVersions, e.target.value || null);
});

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
  frame.onload = () => {
    fitFrames();
    if (which !== 'before') armPreview();
    else if (frame.contentDocument?.body) {
      ensureStudioStyle(frame.contentDocument);
      markChanges('before');
    }
  };
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

/** Avance de la barra (2026-09-30): se recorta con clip-path en vez de cambiar la anchura, que obligaba a
 *  recalcular la maquetación en cada paso de la animación. El recorte conserva los extremos redondeados. */
function setProgressBar(bar, pct) {
  bar.style.setProperty('--pct', `${Math.max(0, Math.min(100, pct))}%`);
}

function renderProgress(job, queue, hermesOnline) {
  const box = document.getElementById('job-progress');
  // Terminada, la barra al 100 % no aporta nada: lo que tardó ya está en la cabecera (2026-09-29).
  // Con el brief por revisar no hay nada en marcha: el panel de revisión ocupa su sitio.
  if (job.status === 'completed' || job.status === 'review') {
    box.hidden = true;
    return;
  }
  const bar = document.getElementById('progress-bar');
  const track = box.querySelector('.progress-track');
  const p = job.progress;
  if (job.status === 'queued') {
    box.hidden = false;
    setProgressBar(bar, 0);
    track.setAttribute('aria-valuenow', '0');
    document.getElementById('progress-stage').textContent = queue?.ahead
      ? `En cola · ${queue.ahead} trabajo${queue.ahead === 1 ? '' : 's'} delante`
      : 'En cola · eres el siguiente';
    document.getElementById('progress-eta').textContent = queue?.ahead ? `empezará en unos ${formatMinutes(queue.startsInSec)}, hacia las ${clockAt(queue.startsInSec)} (estimado)` : '';
    const kind = job.input.revisionOf
      ? 'Aplicará los cambios pedidos: unos minutos.'
      : job.input.mobileFixOf
      ? 'Solo adapta la versión móvil: unos minutos.'
      : job.input.briefReused
      ? job.input.retryOf
        ? 'Parte del brief que ya escribió en el intento anterior.'
        : 'Hará la newsletter con el brief aprobado.'
      : job.input.instruction
      ? 'Primero escribirá el brief creativo.'
      : '';
    const when = hermesOnline === false
      ? 'Hermes no está conectado ahora mismo: empezará en cuanto vuelva a conectarse.'
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
      setProgressBar(bar, 2);
    }
    return;
  }
  box.hidden = false;
  setProgressBar(bar, p.pct);
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
    eta.textContent = `quedan ~${formatMinutes(p.etaSec)} · lista hacia las ${clockAt(p.etaSec)} (estimado)`;
  } else if (p.stage === 'revisando') {
    // Recta final (Hermes revisa y corrige a su ritmo): en vez de un tiempo que no se cumple,
    // si sigue trabajando o si lleva rato parado.
    eta.textContent = 'recta final: revisando a su ritmo';
  } else {
    // Sin estimación en una fase temprana: la fase se alarga más de lo habitual. Antes decía "recta
    // final" también aquí (Nike · cambios, 2026-09-28: "recta final" al 14 %).
    eta.textContent = 'esta fase va más lenta de lo habitual';
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
// El icono solo no decía en qué modo estabas, y en móvil no hay tooltip: ahora va con su nombre (2026-09-30).
const THEME_SHORT = { auto: 'Auto', light: 'Claro', dark: 'Oscuro' };

function currentStudioTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'light' || t === 'dark' ? t : 'auto';
}

function renderThemeBtn() {
  const t = currentStudioTheme();
  const btn = document.getElementById('theme-btn');
  btn.innerHTML = `<span aria-hidden="true">${THEME_ICON[t]}</span><span class="theme-name">${THEME_SHORT[t]}</span>`;
  btn.setAttribute('aria-label', `Tema: ${THEME_LABEL[t]}. Pulsa para cambiar.`);
  const next = THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
  btn.title = `Tema: ${THEME_LABEL[t]} · pulsa para pasar a ${THEME_LABEL[next]}`;
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
  } else if (job.status === 'review') {
    announce(`${name}: el brief está listo para revisar.`);
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
  const params = new URLSearchParams(location.search);
  const id = params.get('job');
  const brand = params.get('brand');
  if (id) {
    showJobView(id);
  } else if (brand) {
    showBrandView(brand);
  } else {
    if (!confirmLeaveJob()) {
      history.pushState({}, '', `?job=${encodeURIComponent(currentJob)}`);
      return;
    }
    clearTimeout(pollTimer);
    currentJob = null;
    setFaviconStatus(null);
    viewJob.hidden = true;
    viewBrand.hidden = true;
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
restoreDraft();
route();
