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

/** Mensaje de una acción que falla (2026-10-05). Con un 5xx (p. ej. 1-2 min durante cada despliegue de Railway)
 *  solo se decía «No se pudo guardar.»: ahora, que es pasajero y qué hacer; `keepsText` cuando lo escrito sigue en
 *  pantalla. Los errores con motivo propio del servidor (409, 400…) se muestran tal cual. */
function actionError(res, data, fallback, keepsText = false) {
  if (!res || res.status >= 500) {
    return `${fallback} Studio no responde ahora (puede estar actualizándose)${keepsText ? ': lo que has escrito sigue aquí,' : ':'} inténtalo en un minuto.`;
  }
  if (data?.error) return data.error;
  if (res.status === 401) return `${fallback} Necesitas iniciar sesión (mira el aviso de arriba).`;
  if (res.status === 429) return `${fallback} Demasiadas peticiones seguidas: espera un momento y vuelve a intentarlo.`;
  return fallback;
}

// Cargas con brillo de marca (2026-10-06): si una petición tarda más de 400 ms, el logo late (html.is-loading).
let inFlight = 0;
let loadingTimer = null;
async function apiFetch(url, options) {
  inFlight++;
  if (!loadingTimer) loadingTimer = setTimeout(() => document.documentElement.classList.toggle('is-loading', inFlight > 0), 400);
  let res;
  try {
    res = await fetch(url, options);
  } finally {
    inFlight--;
    if (!inFlight) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
      document.documentElement.classList.remove('is-loading');
    }
  }
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

// Antes rellenaba un <datalist>; las sugerencias se calculan al escribir (ver renderBrandSuggest).
function renderBrandOptions() {
  if (document.activeElement === clientNameInput) renderBrandSuggest();
}

/** Newsletters ya hechas de una marca (familias, no versiones), aunque no tenga carpeta en el Mac. */
function historyCountFor(slug) {
  return historyState.jobs.filter((j) => j.clientSlug === slug && !j.revisionOf && !j.mobileFixOf && !j.textEditOf && !j.retryOf).length;
}

function updateBrandMatch() {
  const name = clientNameInput.value.trim();
  const match = matchBrand(name);
  const hint = document.getElementById('brand-match');
  existingBrandInput.value = match;
  hint.classList.toggle('is-existing', !!match);
  hint.classList.toggle('is-new', !!name && !match);
  // Mientras se escribe (2026-10-05): con «Nik» decía «Marca nueva» antes de terminar de escribir Nike. Si alguna
  // marca empieza así, se propone; y si no tiene carpeta pero ya hay newsletters suyas, se dice.
  // Erratas (2026-10-05): «Calvin Kleins Jeans» creó la carpeta calvin-kleins-jeans y el brand pack de la marca no
  // se habría encontrado. Se propone la marca conocida más parecida y, si es nueva, se enseña la carpeta.
  const prefix = !match && name ? brandCandidates(name).find((c) => c.prefix) || closeBrand(name) : null;
  const done = !match && name ? historyCountFor(slugify(name)) : 0;
  const folder = `<code>${escapeHtml(slugify(name))}</code>`;
  if (!name) hint.textContent = '';
  else if (match) hint.textContent = 'Marca conocida.';
  else if (prefix && normalize(prefix.name) !== normalize(name)) {
    hint.innerHTML = `¿Quieres decir <button type="button" class="link-btn" data-brand-pick="${escapeHtml(prefix.name)}">${escapeHtml(prefix.name)}</button>? Si no, será una marca nueva (carpeta ${folder}).`;
  } else if (done) {
    hint.textContent = `Sin brand pack ni logos en el Mac, pero ya hay ${done} newsletter${done === 1 ? '' : 's'} de ${name}: Hermes la investigará otra vez.`;
  } else hint.innerHTML = `Marca nueva: Studio medirá su identidad en su web y Hermes investigará el contenido. Se guardará como ${folder}: revisa que el nombre esté bien escrito.`;
  document.getElementById('brand-url-field').hidden = !name || !!match;
  if (match) describeKnownBrand(match);
  else renderBrandPeek(null);
  renderBrandSide();
}

/** Panel lateral de marca (2026-10-07, formulario a dos columnas en escritorio): la identidad de la marca elegida
 *  (logo, colores, tipografía) y sus últimas newsletters. Sin marca, qué saldrá aquí; con una marca nueva, lo que hará
 *  Studio. Se anima solo al cambiar de marca. */
let brandSideKey = null;
function renderBrandSide() {
  const box = document.getElementById('brand-side');
  if (!box) return;
  const name = clientNameInput.value.trim();
  const slug = existingBrandInput.value || (name ? slugify(name) : '');
  const card = existingBrandInput.value ? brandSummaries.get(slug)?.card : null;
  const recent = slug
    ? historyState.jobs
        .filter((j) => j.clientSlug === slug && j.hasThumb && j.status === 'completed' && !j.archivedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3)
    : [];
  const key = `${slug}|${card ? 1 : 0}|${recent.map((j) => j.id).join(',')}`;
  if (key === brandSideKey) return;
  const changed = !brandSideKey || brandSideKey.split('|')[0] !== slug;
  brandSideKey = key;
  if (!name) {
    box.innerHTML = `<p class="side-kicker">Marca</p><div class="side-empty"><span class="side-empty-art" aria-hidden="true"><i></i><i></i><i></i></span><p>Elige una marca y aquí verás su logo, sus colores y sus últimas newsletters.</p></div>`;
  } else {
    const logo = card?.logo && /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(card.logo) ? card.logo : '';
    const colors = (card?.colors || []).filter((c) => SAFE_COLOR.test(c.value)).slice(0, 8);
    const family = card?.typography?.family;
    const display = existingBrandInput.value ? brandDisplayName(slug) : name;
    const status = !existingBrandInput.value
      ? 'Marca nueva: Studio medirá su identidad en su web antes de empezar.'
      : card?.hasPack
      ? 'Con brand pack: Hermes usará sus colores, tipografías y logos.'
      : 'Marca conocida: Hermes investigará lo que falte.';
    box.innerHTML =
      `<p class="side-kicker">Marca</p>` +
      (logo ? `<span class="side-logo${card.logoOnDark ? ' is-dark' : ''}"><img src="${escapeHtml(logo)}" alt="Logo de ${escapeHtml(display)}"></span>` : `<p class="side-name">${escapeHtml(display)}</p>`) +
      `<p class="side-status">${escapeHtml(status)}</p>` +
      (colors.length
        ? `<ul class="peek-colors side-colors" aria-label="Colores de la marca">${colors
            .map((c, n) => `<li style="--n:${n};--c:${c.value}" title="${escapeHtml(`${c.labels.join(' · ')} ${c.value}`)}"><span>${escapeHtml(c.value)}</span></li>`)
            .join('')}</ul>`
        : '') +
      (family ? `<p class="side-type"><span class="hint">Tipografía</span> ${escapeHtml(family)}</p>` : '') +
      (recent.length
        ? `<p class="side-sub">Últimas newsletters</p><ul class="side-recent">${recent
            .map((j, n) => `<li style="--n:${n}"><a href="?job=${encodeURIComponent(j.id)}" title="${escapeHtml(j.familyTitle || j.clientName || '')}"><img src="/api/jobs/${encodeURIComponent(j.id)}/thumb" alt="" loading="lazy" width="150" height="200"></a></li>`)
            .join('')}</ul>`
        : '');
  }
  if (changed && motionOk()) {
    box.classList.remove('is-in');
    void box.offsetWidth;
    box.classList.add('is-in');
  }
}

/** Panel de marca (2026-10-07, F): al elegir una marca conocida aparece su logo y sus colores caen como fichas. Solo se
 *  anima al cambiar de marca, no a cada letra. Sin logo ni colores en la ficha, no sale. */
let brandPeekFor = null;
function renderBrandPeek(slug, card) {
  const box = document.getElementById('brand-peek');
  if (!box) return;
  if (!slug || !card) {
    brandPeekFor = null;
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  if (brandPeekFor === slug && !box.hidden) return;
  const logo = card.logo && /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(card.logo) ? card.logo : '';
  const colors = (card.colors || []).filter((c) => SAFE_COLOR.test(c.value)).slice(0, 7);
  if (!logo && !colors.length) return renderBrandPeek(null);
  brandPeekFor = slug;
  box.innerHTML =
    (logo ? `<span class="peek-logo${card.logoOnDark ? ' is-dark' : ''}"><img src="${escapeHtml(logo)}" alt="Logo de ${escapeHtml(brandDisplayName(slug))}"></span>` : '') +
    (colors.length
      ? `<ul class="peek-colors" aria-label="Colores de la marca">${colors
          .map((c, n) => `<li style="--n:${n};--c:${c.value}" title="${escapeHtml(`${c.labels.join(' · ')} ${c.value}`)}"><span>${escapeHtml(c.value)}</span></li>`)
          .join('')}</ul>`
      : '');
  box.hidden = false;
  box.classList.remove('is-in');
  void box.offsetWidth;
  if (motionOk()) box.classList.add('is-in');
}
document.getElementById('brand-match').addEventListener('click', (e) => {
  const pick = e.target.closest('[data-brand-pick]');
  if (pick) chooseBrand(pick.dataset.brandPick);
});

// ---------------------------------------------------------------- sugerencias de marca (2026-10-05)
// Combobox propio en vez de <datalist>: enseña el logo de la ficha (si lo hay) y las marcas que solo están en el
// historial (sin carpeta en el Mac). Flechas, Intro y Escape como en un desplegable.
let brandLogos = {};
const brandSuggest = document.getElementById('brand-suggest');
let brandActive = -1;

/** La marca conocida más parecida a lo escrito, con una o dos letras de diferencia en su nombre o en el de la
 *  carpeta («Nkie» → Nike, «Adidass» → Adidas), o cuyo nombre entero está dentro de lo escrito («Puma España»). */
function closeBrand(query) {
  const q = slugify(query).replace(/-/g, '');
  if (q.length < 4) return null;
  let best = null;
  const all = [...knownBrands.map((slug) => ({ slug, name: brandDisplayName(slug) })), ...[...brandNames].filter(([slug]) => !knownBrands.includes(slug)).map(([slug, name]) => ({ slug, name }))];
  for (const c of all) {
    const n = c.slug.replace(/-/g, '');
    const d = n.length >= 4 && q.includes(n) ? 0 : editDistance(q, n);
    const max = n.length >= 8 ? 2 : 1;
    if (d <= max && (!best || d < best.d)) best = { ...c, d };
  }
  return best;
}
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  let before = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // Dos letras cambiadas de sitio («Nkie») cuentan como una errata, no dos.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], before[j - 2] + 1);
    }
    before = prev;
    prev = cur;
  }
  return prev[b.length];
}

function brandCandidates(query) {
  const q = normalize(query);
  const seen = new Set();
  const all = [];
  for (const slug of knownBrands) {
    seen.add(slug);
    all.push({ slug, name: brandDisplayName(slug), folder: true });
  }
  for (const [slug, name] of brandNames) if (!seen.has(slug)) all.push({ slug, name, folder: false });
  return all
    .map((c) => ({ ...c, prefix: normalize(c.name).startsWith(q) || c.slug.startsWith(slugify(query)) }))
    .filter((c) => !q || c.prefix || normalize(c.name).includes(q))
    .sort((a, b) => Number(b.prefix) - Number(a.prefix) || a.name.localeCompare(b.name, 'es'))
    .slice(0, 7);
}

function renderBrandSuggest() {
  const name = clientNameInput.value.trim();
  const items = name && !matchBrand(name) ? brandCandidates(name) : [];
  brandActive = -1;
  brandSuggest.hidden = !items.length;
  clientNameInput.setAttribute('aria-expanded', String(items.length > 0));
  clientNameInput.removeAttribute('aria-activedescendant');
  brandSuggest.innerHTML = items
    .map((c, i) => {
      const initials = c.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
      const logo = brandLogos[c.slug]
        ? `<span class="bs-logo${brandLogos[c.slug] === 'dark' ? ' is-on-dark' : ''}"><img src="/api/brands/${encodeURIComponent(c.slug)}/logo" alt="" loading="lazy"></span>`
        : `<span class="bs-logo is-initials">${escapeHtml(initials)}</span>`;
      const note = c.folder ? '' : `<span class="bs-note">sin carpeta · ${historyCountFor(c.slug)} en el historial</span>`;
      return `<li role="option" id="bs-${i}" data-brand-pick="${escapeHtml(c.name)}" aria-selected="false">${logo}<span class="bs-name">${escapeHtml(c.name)}</span>${note}</li>`;
    })
    .join('');
}

function closeBrandSuggest() {
  brandSuggest.hidden = true;
  brandActive = -1;
  clientNameInput.setAttribute('aria-expanded', 'false');
  clientNameInput.removeAttribute('aria-activedescendant');
}

function chooseBrand(name) {
  clientNameInput.value = name;
  closeBrandSuggest();
  updateBrandMatch();
  clientNameInput.dispatchEvent(new Event('change', { bubbles: true }));
  clientNameInput.focus({ preventScroll: true });
}

clientNameInput.addEventListener('input', renderBrandSuggest);
clientNameInput.addEventListener('blur', () => setTimeout(closeBrandSuggest, 120));
clientNameInput.addEventListener('keydown', (e) => {
  const options = [...brandSuggest.querySelectorAll('[role="option"]')];
  if (brandSuggest.hidden || !options.length) {
    if (e.key === 'ArrowDown' && clientNameInput.value.trim()) renderBrandSuggest();
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    brandActive = (brandActive + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options.forEach((o, i) => o.setAttribute('aria-selected', String(i === brandActive)));
    clientNameInput.setAttribute('aria-activedescendant', options[brandActive].id);
    options[brandActive].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && brandActive >= 0) {
    e.preventDefault();
    chooseBrand(options[brandActive].dataset.brandPick);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeBrandSuggest();
  }
});
// mousedown, no click: el clic llegaría después del blur, con la lista ya cerrada.
brandSuggest.addEventListener('mousedown', (e) => {
  const opt = e.target.closest('[data-brand-pick]');
  if (!opt) return;
  e.preventDefault();
  chooseBrand(opt.dataset.brandPick);
});

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
    renderBrandPeek(slug, card);
    renderBrandSide();
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
    brandLogos = data.logos || {};
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

// Aro de progreso de la píldora: un rectángulo redondeado del tamaño de la píldora, rellenado con pathLength.
let pillRingObserver = null;
function drawPillRing(el, pct) {
  el.insertAdjacentHTML('beforeend',
    '<svg class="pill-ring" aria-hidden="true"><defs><linearGradient id="pill-ring-grad" x1="0" x2="1" y1="0" y2="0">'
    + '<stop offset="0" stop-color="var(--pink)"/><stop offset="1" stop-color="var(--purple)"/></linearGradient></defs>'
    + `<rect class="track"/><rect class="bar" pathLength="100" stroke-dasharray="${pct} 100"/></svg>`);
  sizePillRing(el);
  if (!pillRingObserver && 'ResizeObserver' in window) {
    pillRingObserver = new ResizeObserver(() => sizePillRing(el));
    pillRingObserver.observe(el);
  }
}
function sizePillRing(el) {
  const w = el.offsetWidth, h = el.offsetHeight;
  if (!w || !h) return;
  el.querySelectorAll('.pill-ring rect').forEach((rect) => {
    rect.setAttribute('x', '0.75'); rect.setAttribute('y', '0.75');
    rect.setAttribute('width', String(w - 1.5)); rect.setAttribute('height', String(h - 1.5));
    rect.setAttribute('rx', String((h - 1.5) / 2));
  });
}

async function loadHermesStatus() {
  clearTimeout(statusTimer);
  const el = document.getElementById('hermes-status');
  let busy = false;
  try {
    const res = await apiFetch('/api/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { hermesOnline, current, queued = 0, typical, wait, mailEnabled } = await res.json();
    syncTestEmail(mailEnabled);
    queueWaitNow = wait || null; // sin `wait` (servidor anterior): el aviso de siempre
    hermesOnlineNow = !!hermesOnline;
    if (typical) typicalDurations = typical;
    renderEtaHints();
    const waiting = queued ? ` · ${queued} en cola` : '';
    busy = !!current;
    // En móvil, texto corto («En pausa», sin «Hermes»): el entero no cabía junto al logo y salía cortado (2026-10-05).
    if (current) {
      el.innerHTML = `<span class="lbl-long">Hermes · </span>${escapeHtml(current.clientName)}${current.pct != null ? ` · ${current.pct} %` : ''}${waiting}`;
      el.href = `?job=${encodeURIComponent(current.id)}`;
      el.title = `${current.stageLabel || 'Trabajando'}: abre el trabajo`;
    } else {
      el.innerHTML = hermesOnline
        ? `<span class="lbl-long">Hermes conectado</span><span class="lbl-short">Conectado</span>${waiting}`
        : `<span class="lbl-long">Hermes desconectado</span><span class="lbl-short">En pausa</span>${waiting}`;
      el.removeAttribute('href');
      el.title = hermesOnline ? '' : 'Puedes enviar igualmente: empezará cuando Hermes se conecte.';
    }
    el.className = `status-pill ${current ? 'is-busy' : hermesOnline ? 'is-online' : 'is-offline'}`;
    // Anillo (2026-10-06): se cierra con el progreso de la pieza en curso; libre y conectado, late suave.
    // Trazo SVG sobre el contorno real (2026-10-06): el degradado cónico cortaba en ángulo y dejaba picos en las curvas.
    el.classList.toggle('has-ring', !!current && current.pct != null);
    if (current?.pct != null) drawPillRing(el, Math.max(2, Math.min(100, current.pct)));
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
      // Activada por defecto desde el 2026-10-05 (Paredes: concepto «el negro» con una zapatilla gris, marrón y roja,
      // y sin el Black Friday pedido). Solo se recuerda si alguien la quita; la clave antigua se ignora.
      document.getElementById('art-review-input').checked = localStorage.getItem('artReviewOff') !== '1';
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

// Ejemplos que se escriben solos (2026-10-06): con la instrucción vacía y sin foco, el texto de ejemplo escribe y
// borra los ejemplos de arriba. Solo toca el placeholder: ni el borrador ni lo que se envía. Al enfocar, escribir,
// cambiar a prompt creativo u ocultar la pestaña, vuelve el ejemplo fijo.
const typer = { timer: 0, ex: 0, n: 0, dir: 1 };
function typerActive() {
  return (
    motionOk() &&
    !document.hidden &&
    document.activeElement !== promptInput &&
    !promptInput.value &&
    form.querySelector('input[name="inputKind"]:checked')?.value === 'instruction'
  );
}
function typerStop() {
  clearTimeout(typer.timer);
  typer.timer = 0;
  promptInput.placeholder = KIND_COPY[form.querySelector('input[name="inputKind"]:checked')?.value || 'instruction'].placeholder;
}
function typerTick() {
  if (!typerActive()) return typerStop();
  const text = `Ej: ${EXAMPLES[typer.ex].text}`;
  typer.n += typer.dir;
  let wait = typer.dir > 0 ? 38 + Math.random() * 40 : 14;
  if (typer.n >= text.length) {
    typer.n = text.length;
    typer.dir = -1;
    wait = 2600;
  } else if (typer.n <= 0) {
    typer.n = 0;
    typer.dir = 1;
    typer.ex = (typer.ex + 1) % EXAMPLES.length;
    wait = 500;
  }
  promptInput.placeholder = text.slice(0, typer.n) + (typer.n < text.length ? '▍' : '');
  typer.timer = setTimeout(typerTick, wait);
}
function typerStart() {
  if (typer.timer || !typerActive()) return;
  typer.n = 0;
  typer.dir = 1;
  typer.timer = setTimeout(typerTick, 1200);
}
promptInput.addEventListener('focus', typerStop);
promptInput.addEventListener('input', typerStop);
promptInput.addEventListener('blur', typerStart);
form.querySelectorAll('input[name="inputKind"]').forEach((r) => r.addEventListener('change', () => (typerStop(), typerStart())));
document.addEventListener('visibilitychange', () => (document.hidden ? typerStop() : typerStart()));
setTimeout(typerStart, 1500);

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
  morphSendBtn(submitBtn, true);
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
        res.status === 401 ? 'No se ha enviado: necesitas iniciar sesión (mira el aviso de arriba). Tu texto se queda guardado como borrador.' : actionError(res, data, 'No se ha enviado la newsletter.', true);
      formError.hidden = false;
      return;
    }
    try {
      localStorage.setItem('requesterName', payload.requesterName || '');
      localStorage.setItem('imageMode', payload.imageMode || '');
      if (payload.inputKind === 'instruction') localStorage.setItem('reviewBrief', payload.reviewBrief ? '1' : '0');
      localStorage.setItem('artReviewOff', payload.artReview ? '0' : '1');
    } catch {
      // sin almacenamiento: no se recuerda
    }
    requesterEditing = false;
    clearDraft();
    await flyToJob(submitBtn);
    history.pushState({}, '', `?job=${data.id}`);
    showJobView(data.id);
    landJobView();
  } catch {
    formError.textContent = NETWORK_ERROR;
    formError.hidden = false;
  } finally {
    morphSendBtn(submitBtn, false);
    submitBtn.disabled = false;
    document.getElementById('brand-send-anyway').disabled = false;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.reviewBrief = payload.inputKind === 'instruction' && payload.reviewBrief === 'true';
  payload.artReview = payload.artReview === 'true';
  // La web solo cuenta para una marca nueva (el campo está oculto si es conocida).
  if (!payload.brandUrl || document.getElementById('brand-url-field').hidden) delete payload.brandUrl;
  else if (!/^https?:\/\//i.test(payload.brandUrl)) payload.brandUrl = `https://${payload.brandUrl}`;
  if (payload.brandUrl) payload.brandUrl = payload.brandUrl.replace(/^http:/i, 'https:');
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
  const ms = action ? 10000 : level === 'error' ? 7000 : 3000;
  // Entra como una carta desde abajo con una barra de tiempo (2026-10-06).
  toast.style.setProperty('--toast-ms', `${ms}ms`);
  toast.hidden = false;
  toast.classList.remove('is-in');
  void toast.offsetWidth;
  toast.classList.add('is-in');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), ms);
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
  // La cifra total está en la fila de cifras del historial (2026-10-05): aquí, solo lo que está en curso.
  link.innerHTML = `Ir al historial${active ? ` <span class="is-busy">· ${active} en curso</span>` : ''} <span aria-hidden="true">↓</span>`;
}
document.getElementById('how-btn').addEventListener('click', (e) => {
  const panel = document.getElementById('how-panel');
  panel.hidden = !panel.hidden;
  e.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
});
document.getElementById('history-jump').addEventListener('click', (e) => {
  e.preventDefault();
  jumpTo(document.getElementById('history'), 'start');
});

async function loadHistory() {
  clearTimeout(historyTimer);
  try {
    const res = await apiFetch('/api/jobs');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { jobs, truncated, limit } = await res.json();
    assignFamilyTitles(jobs);
    // Piezas que acaban de terminar con la página abierta (2026-10-06): se iluminan al volver a pintar.
    const justDone = jobs.filter((j) => j.status === 'completed' && lastStatus.has(j.id) && lastStatus.get(j.id) !== 'completed').map((j) => j.id);
    lastStatus = new Map(jobs.map((j) => [j.id, j.status]));
    historyState.jobs = jobs;
    historyState.truncated = truncated ? limit : 0;
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
    document.getElementById('history-skeleton').hidden = true;
    hideHistoryError();
    document.getElementById('history').hidden = jobs.length === 0;
    renderHistoryJump(jobs);
    renderNowStrip(jobs);
    renderShowcase(jobs);
    renderBrandSide();
    renderLiveSteps(jobs);
    animateBars();
    if (justDone.length) celebrateDone(justDone);

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
    document.getElementById('history-skeleton').hidden = true;
    // Sin sesión no se insiste (cada intento cuenta para el límite del servidor); si no, en 30 s.
    if (!authMissing) {
      historyTimer = setTimeout(loadHistory, 30000);
      showHistoryError(30);
    }
  }
}

// Aviso de error del historial (2026-10-05): antes desaparecía sin decir nada y el atajo apuntaba a la nada.
let historyErrorTick = null;
function showHistoryError(seconds) {
  const box = document.getElementById('history-error');
  const sec = document.getElementById('history-error-sec');
  clearInterval(historyErrorTick);
  let left = seconds;
  sec.textContent = String(left);
  box.hidden = false;
  if (document.getElementById('history').hidden) document.getElementById('history-jump').hidden = true;
  historyErrorTick = setInterval(() => {
    left = Math.max(0, left - 1);
    sec.textContent = String(left);
  }, 1000);
}
function hideHistoryError() {
  clearInterval(historyErrorTick);
  document.getElementById('history-error').hidden = true;
}
document.getElementById('history-retry').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  loadHistory().finally(() => {
    btn.disabled = false;
  });
});

function filteredJobs() {
  const q = normalize(historyState.query);
  return historyState.jobs.filter((j) => {
    if (historyState.brand && (j.clientSlug || j.clientName) !== historyState.brand) return false;
    if (historyState.status === 'active' && j.status !== 'running' && j.status !== 'queued' && j.status !== 'review') return false;
    if (historyState.status === 'completed' && j.status !== 'completed') return false;
    if (historyState.status === 'review' && j.status !== 'review') return false;
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

/** "tardó 9 min" (de que Hermes lo recoge a que termina); los retoques de texto son al momento. La espera de
 *  la aprobación del brief no es trabajo de Hermes: va aparte (Paredes, 2026-10-05: 57 min de reloj, 13 de espera). */
function durationLabel(j) {
  if (j.status !== 'completed') return null;
  if (j.textEditOf) return 'sin Hermes';
  const sec = j.durationSec ?? j.elapsedSec;
  if (!sec) return null;
  return `tardó ${formatMinutes(sec)}${j.briefWaitSec >= 60 ? ` + ${formatMinutes(j.briefWaitSec)} esperando tu aprobación del brief` : ''}`;
}

/** Fallidos que ya tienen un reintento: no se ofrece reintentarlos otra vez desde el historial (2026-10-01). */
let retriedIds = new Set();

function jobActions(j, { compact = false } = {}) {
  const id = encodeURIComponent(j.id);
  return [
    // Brief pendiente: el botón dice qué hay que hacer, como en «Ahora mismo» (2026-10-05).
    j.status === 'review'
      ? `<a class="btn btn-secondary" href="?job=${id}">Revisar el brief</a>`
      : `<a class="btn btn-ghost row-view" href="?job=${id}">Ver</a>`,
    j.status === 'completed' ? `<a class="btn btn-ghost row-download" href="/api/jobs/${id}/result?download=1">Descargar</a>` : '',
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
    // En móvil «Descargar» sale de la fila (un HTML en el teléfono rara vez sirve) y queda aquí (2026-10-05).
    j.status === 'completed' ? `<a class="menu-item menu-download" href="/api/jobs/${encodeURIComponent(j.id)}/result?download=1">Descargar HTML</a>` : '',
    `<button type="button" class="menu-item" data-reuse="${id}">Reutilizar la petición</button>`,
    `<button type="button" class="menu-item" data-reuse-other="${id}">Hacer una igual para otra marca</button>`,
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
/** Cifras del pie (2026-10-06): del historial completo (sin filtros ni archivadas); ocultas sin historial. */
function renderFootStats(families) {
  const box = document.getElementById('foot-stats');
  if (!box) return;
  const scored = families.map((m) => [...m].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).find((j) => j.art)).filter(Boolean);
  const avg = scored.length ? Math.round(scored.reduce((s, j) => s + j.art.pct, 0) / scored.length) : null;
  box.hidden = !families.length;
  box.innerHTML =
    `<div><dt>${families.length}</dt><dd>newsletter${families.length === 1 ? '' : 's'} hecha${families.length === 1 ? '' : 's'}</dd></div>` +
    (avg !== null ? `<div><dt>${avg} %</dt><dd>calidad media</dd></div>` : '');
}
document.getElementById('foot-new').addEventListener('click', (e) => {
  e.preventDefault();
  sideMenu.querySelector('[data-menu="new"]').click();
});

function renderHistoryStats(families) {
  const box = document.getElementById('history-stats');
  const stats = [
    { status: '', n: families.length, one: 'newsletter', many: 'newsletters' },
    { status: 'active', n: families.filter((m) => m.some((j) => STAT_ACTIVE.has(j.status))).length, one: 'en curso', many: 'en curso' },
    { status: 'approved', n: families.filter((m) => m.some((j) => j.approvedAt)).length, one: 'aprobada', many: 'aprobadas' },
  ];
  box.hidden = !families.length;
  // Calidad media de la última versión de cada newsletter con revisión de arte (2026-10-06, punto 7).
  const scored = families.map((m) => [...m].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).find((j) => j.art)).filter(Boolean);
  const avg = scored.length ? Math.round(scored.reduce((s, j) => s + j.art.pct, 0) / scored.length) : null;
  box.innerHTML = stats
    .map(
      (st) =>
        `<button type="button" class="stat${historyState.status === st.status ? ' is-active' : ''}" data-stat="${st.status}" aria-pressed="${historyState.status === st.status}">` +
        `<span class="stat-num">${st.n}</span><span class="stat-label">${st.n === 1 ? st.one : st.many}</span></button>`
    )
    .join('') +
    (avg !== null
      ? `<span class="stat stat-static stat-quality" title="Media de la revisión de dirección de arte en ${scored.length} newsletter${scored.length === 1 ? '' : 's'}"><span class="stat-num">${avg} %</span><span class="stat-label">calidad media</span>${qualitySpark(scored)}</span>`
      : '');
  // La línea se dibuja la primera vez que se ve (al repintar cada 20-30 s, ya dibujada).
  const spark = box.querySelector('.q-spark');
  if (!spark) return;
  if (sparkDrawn || !motionOk() || !('IntersectionObserver' in window)) spark.classList.add('is-drawn');
  else {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      sparkDrawn = true;
      spark.classList.add('is-drawing');
    }, { threshold: 0.6 });
    io.observe(spark);
  }
}

/** Calidad con gráfica (2026-10-07, E): la nota de las últimas piezas (hasta 14), de la más antigua a la más reciente,
 *  con la media como línea de puntos y la última pieza marcada. */
let sparkDrawn = false;
function qualitySpark(scored) {
  const pts = [...scored].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-14);
  if (pts.length < 2) return '';
  const W = 220;
  const H = 48;
  const vals = pts.map((j) => j.art.pct);
  const lo = Math.max(0, Math.min(...vals) - 8);
  const hi = Math.min(100, Math.max(...vals) + 8);
  const x = (i) => 4 + (i * (W - 8)) / (pts.length - 1);
  const y = (v) => 4 + (H - 8) * (1 - (v - lo) / Math.max(1, hi - lo));
  const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const last = vals[vals.length - 1];
  const area = `${x(0).toFixed(1)},${H} ${line} ${x(vals.length - 1).toFixed(1)},${H}`;
  return `<svg class="q-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Notas de las últimas ${pts.length} piezas: la última, ${last} %">
    <defs><linearGradient id="q-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pink)" stop-opacity="0.28"/><stop offset="1" stop-color="var(--pink)" stop-opacity="0"/></linearGradient></defs>
    <line class="q-avg" x1="0" x2="${W}" y1="${y(avg).toFixed(1)}" y2="${y(avg).toFixed(1)}"/>
    <polygon class="q-area" points="${area}" fill="url(#q-fill)"/>
    <polyline class="q-line" points="${line}" pathLength="1"/>
    <circle class="q-dot" cx="${x(vals.length - 1).toFixed(1)}" cy="${y(last).toFixed(1)}" r="3.5"/>
  </svg>`;
}
document.getElementById('history-stats').addEventListener('click', (e) => {
  const stat = e.target.closest('[data-stat]');
  if (!stat) return;
  document.querySelector(`#history-status .chip[data-status="${stat.dataset.stat}"]`)?.click();
});

// ---------------------------------------------------------------- «Ahora mismo» (2026-10-05)
// Arriba de la portada: lo que espera al equipo (brief por revisar, comentarios del cliente sin resolver o cambios
// pedidos por él) y lo que está en marcha (fase y barra). Antes había que bajar hasta el historial (1.738 px).
const NOW_MAX = 4;
function nowItem(j, line, action, extra = '', tab = '') {
  const initials = String(j.clientName || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const title = j.familyTitle || j.title || j.subject || '';
  return `<li class="now-item"><a class="now-link" href="?job=${encodeURIComponent(j.id)}${tab ? `&tab=${tab}` : ''}">
      <span class="thumb now-thumb ${emptyThumbClass(j)}" aria-hidden="true">${emptyThumbInner(j, initials)}</span>
      <span class="now-body"><strong>${escapeHtml(j.clientName || '')}</strong>${title ? `<span class="now-title">${escapeHtml(title)}</span>` : ''}
        <span class="now-line">${line}</span>${extra}</span>
      <span class="now-action">${escapeHtml(action)} <span aria-hidden="true">→</span></span>
    </a></li>`;
}
// Sin recargar la página, como el resto de Studio (antes, un enlace normal: recarga entera).
document.getElementById('now-strip').addEventListener('click', (e) => {
  const a = e.target.closest('a.now-link');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  history.pushState({}, '', a.getAttribute('href'));
  route();
});

/** Escaparate de la cabecera (2026-10-06): las últimas piezas terminadas con miniatura, una por marca, hasta 5 (o 3 si
 *  no hay más). Sin piezas se quedan las maquetas del HTML. */
function renderShowcase(jobs) {
  const box = document.getElementById('hero-showcase');
  if (!box) return;
  const seen = new Set();
  const picks = [];
  for (const j of [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const brand = j.clientSlug || j.clientName;
    if (j.archivedAt || j.status !== 'completed' || !j.hasThumb || seen.has(brand)) continue;
    seen.add(brand);
    picks.push(j);
    if (picks.length === 5) break;
  }
  if (picks.length < 3) return;
  const shown = picks.length >= 5 ? picks : picks.slice(0, 3);
  // La más reciente en el centro del abanico.
  const order = shown.length === 5 ? [shown[3], shown[1], shown[0], shown[2], shown[4]] : [shown[1], shown[0], shown[2]];
  // Solo si cambian las piezas (2026-10-07): el historial se refresca cada 20-30 s y repintar el abanico devolvía de
  // golpe la carta señalada a su sitio y hacía parpadear las miniaturas.
  const key = order.map((j) => j.id).join(',');
  if (box.dataset.key === key) return;
  box.dataset.key = key;
  box.removeAttribute('aria-hidden');
  box.setAttribute('aria-label', 'Últimas newsletters de Hermes');
  // La carta (el enlace) se queda en su sitio del abanico y lo que crece es su cara: la zona que reacciona al ratón no
  // se mueve con la animación.
  box.innerHTML = order
    .map(
      (j) =>
        `<a class="show-card" href="?job=${encodeURIComponent(j.id)}" title="${escapeHtml(j.clientName || '')}"><span class="show-face"><img src="/api/jobs/${encodeURIComponent(j.id)}/thumb" alt="Newsletter de ${escapeHtml(j.clientName || '')}" width="300" height="400" loading="lazy"><span class="show-brand">${escapeHtml(j.clientName || '')}</span></span></a>`
    )
    .join('');
  dealShowcase(box);
  startFan(box);
}

// ---------------------------------------------------------------- animaciones (2026-10-06)
// En el lenguaje del abanico de la cabecera: tarjetas que vuelan, aterrizan y se reparten. Con «reducir movimiento»
// no se anima nada (motionOk) y el CSS las apaga.
const motionOk = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Entrada a la página (2026-10-06): solo la primera visita de la sesión. El título sube palabra por palabra y el
 *  abanico se reparte desde una pila (en `renderShowcase`). */
const introOn = (() => {
  if (!motionOk()) return false;
  try {
    if (sessionStorage.getItem('introDone')) return false;
    sessionStorage.setItem('introDone', '1');
  } catch {
    // sin almacenamiento: una vez por carga
  }
  return true;
})();
let introDealt = false;
if (introOn) {
  const h1 = document.querySelector('.hero h1');
  let i = 0;
  const split = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 1) split(child);
      else if (child.nodeType === 3 && child.textContent.trim()) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) frag.append(part);
          else {
            const w = document.createElement('span');
            w.className = 'intro-word';
            w.style.setProperty('--i', String(i++));
            w.textContent = part;
            frag.append(w);
          }
        }
        child.replaceWith(frag);
      }
    }
  };
  if (h1) split(h1);
}
function dealShowcase(box) {
  if (!introOn || introDealt || !box.animate) return;
  introDealt = true;
  const b = box.getBoundingClientRect();
  [...box.querySelectorAll('.show-card')].forEach((card, n) => {
    const r = card.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (r.left + r.width / 2);
    card.animate(
      [
        { translate: `${dx}px 24px`, opacity: 0 },
        { translate: `${dx}px 12px`, opacity: 1, offset: 0.35 },
        { translate: '0 0', opacity: 1 },
      ],
      { duration: 700, delay: 250 + n * 70, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)', fill: 'backwards' }
    );
  });
}

/** Abanico que flota (2026-10-07, pedido del usuario: «como si estuvieran flotando, con un poco de movimiento»). Cada
 *  carta sigue a su posición con un muelle (abrir, cerrar y pasar de una a otra sin saltos ni curvas fijas) y encima
 *  flota despacio, cada una a su ritmo. Con el abanico abierto, las cartas se inclinan un poco hacia el ratón. El CSS
 *  sigue siendo la base: sin JavaScript, en móvil táctil sin hover o con «reducir movimiento», se queda como estaba. */
const fanState = new WeakMap();
let fanBox = null;
let fanHover = null;
let fanPointer = 0;
let fanVisible = true;
let fanFrame = 0;
function startFan(box) {
  if (!box || !motionOk()) return;
  box.classList.add('is-live');
  if (fanBox === box) return;
  fanBox = box;
  // Qué carta se señala (2026-10-07, «al pinchar en el borde se bugea»): antes la decidía la carta bajo el ratón, pero
  // la carta se mueve (flota, se endereza, crece) y en el borde salía de debajo del ratón, se soltaba, volvía y se
  // volvía a coger: tirones y clics perdidos. Ahora las cartas no reciben el ratón (CSS) y la señalada sale de la
  // posición horizontal del ratón sobre huecos FIJOS del abanico abierto, con un margen para no saltar en la frontera.
  const pick = (e) => {
    const card = fanCardAt(box, e.clientX, e.clientY);
    if (card !== fanHover) setFanHover(box, card);
  };
  box.addEventListener('pointermove', (e) => {
    const r = box.getBoundingClientRect();
    fanPointer = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    if (e.pointerType === 'mouse') pick(e);
  });
  box.addEventListener('pointerleave', () => setFanHover(box, null));
  box.addEventListener('focusin', (e) => setFanHover(box, e.target.closest?.('.show-card') || null));
  box.addEventListener('focusout', () => setFanHover(box, null));
  // El clic (o el toque) abre la carta de ese hueco; con Cmd/Ctrl, en otra pestaña.
  box.addEventListener('click', (e) => {
    if (e.target.closest('a.show-card')) return; // teclado (Intro sobre un enlace): lo hace el propio enlace
    const card = fanCardAt(box, e.clientX, e.clientY, true);
    const href = card?.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) window.open(href, '_blank');
    else {
      history.pushState({}, '', href);
      route();
    }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      fanVisible = en.isIntersecting;
      if (fanVisible && !fanFrame) fanFrame = requestAnimationFrame(fanTick);
    }).observe(box);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !fanFrame) fanFrame = requestAnimationFrame(fanTick);
  });
  fanFrame = requestAnimationFrame(fanTick);
}
/** La carta del hueco bajo el ratón: cada carta ocupa una franja vertical fija centrada donde queda en el abanico
 *  abierto. La señalada conserva su franja 14 px más ancha por cada lado (sin saltos en la frontera). Solo enlaces. */
function fanCardAt(box, x, y, ignoreSticky = false) {
  const cards = [...box.querySelectorAll('a.show-card')];
  if (!cards.length) return null;
  const r = box.getBoundingClientRect();
  if (y < r.top || y > r.bottom) return null;
  const narrow = window.matchMedia('(max-width: 760px)').matches;
  const step = narrow ? 26 : 58;
  const half = (narrow ? 120 : 165) / 2;
  const cx = r.left + r.width / 2;
  const slotOf = (c) => fanState.get(c)?.i ?? (parseFloat(getComputedStyle(c).getPropertyValue('--i')) || 0);
  if (!ignoreSticky && fanHover && cards.includes(fanHover) && Math.abs(x - (cx + slotOf(fanHover) * step)) <= step / 2 + 14) return fanHover;
  const is = cards.map(slotOf);
  const lo = Math.min(...is) * step - half;
  const hi = Math.max(...is) * step + half;
  if (x - cx < lo || x - cx > hi) return null;
  let best = null;
  let dist = Infinity;
  cards.forEach((c, n) => {
    const d = Math.abs(x - (cx + is[n] * step));
    if (d < dist) {
      dist = d;
      best = c;
    }
  });
  return best;
}
function setFanHover(box, card) {
  fanHover = card;
  box.querySelectorAll('.show-card.is-hot').forEach((c) => c !== card && c.classList.remove('is-hot'));
  card?.classList.add('is-hot');
  box.classList.toggle('has-hot', !!card);
}
/** Un muelle algo flojo: llega con un pequeño rebote, como algo que flota y se asienta. */
function spring(st, key, target, dt, k = 95, c = 15) {
  const v = (st.v[key] || 0) + ((target - st[key]) * k - (st.v[key] || 0) * c) * dt;
  st.v[key] = v;
  st[key] += v * dt;
}
let fanLast = 0;
function fanTick(now) {
  fanFrame = 0;
  const box = fanBox;
  if (!box || !fanVisible || document.hidden || !box.offsetParent) {
    fanLast = 0;
    return;
  }
  const dt = Math.min(0.05, fanLast ? (now - fanLast) / 1000 : 1 / 60);
  fanLast = now;
  const t = now / 1000;
  const narrow = window.matchMedia('(max-width: 760px)').matches;
  const open = !narrow && box.matches(':hover');
  const cards = [...box.querySelectorAll('.show-card')];
  if (fanHover && !cards.includes(fanHover)) fanHover = null;
  cards.forEach((card, n) => {
    let st = fanState.get(card);
    if (!st) {
      const i0 = parseFloat(getComputedStyle(card).getPropertyValue('--i')) || 0;
      st = { i: i0, x: i0 * 50, y: i0 * i0 * 6, r: i0 * 6, s: 1, ly: 0, v: {}, phase: n * 1.7 + 0.4 };
      fanState.set(card, st);
    }
    const i = st.i;
    const hot = card === fanHover && !narrow;
    // Destino: cerrado, abierto o señalada (los mismos valores que el CSS).
    let x = narrow ? i * 26 : i * 50;
    let y = narrow ? 0 : i * i * 6;
    let r = i * 6;
    if (open) {
      x = i * 58 + fanPointer * 6;
      y = i * i * 8 - 6;
      r = i * 8 + fanPointer * 2.5;
    }
    if (hot) {
      y = 0;
      r = 0;
    }
    spring(st, 'x', x, dt);
    spring(st, 'y', y, dt);
    spring(st, 'r', r, dt);
    spring(st, 's', hot ? 1.4 : 1, dt, 120, 16);
    spring(st, 'ly', hot ? 64 : 0, dt, 120, 16);
    // Flotar: vaivén lento y distinto en cada carta; la señalada casi quieta.
    const amp = hot ? 0.25 : 1;
    const fy = Math.sin(t * 1.05 + st.phase) * 5 * amp;
    const fx = Math.sin(t * 0.63 + st.phase * 1.3) * 2 * amp;
    const fr = Math.sin(t * 0.8 + st.phase * 0.7) * 1.1 * amp;
    card.style.transform = `translate(${(st.x + fx).toFixed(2)}px, ${(st.y + fy).toFixed(2)}px) rotate(${(st.r + fr).toFixed(3)}deg)`;
    const base = 3 - Math.abs(Math.round(i));
    card.style.zIndex = hot ? '7' : st.s > 1.06 ? '6' : String(base);
    const face = card.querySelector('.show-face');
    if (face) face.style.transform = `translateY(${st.ly.toFixed(2)}px) scale(${st.s.toFixed(4)})`;
  });
  fanFrame = requestAnimationFrame(fanTick);
}
startFan(document.getElementById('hero-showcase'));

// ---------------------------------------------------------------- 7.ª tanda de animaciones (2026-10-06)
/** Filtrado que se recoloca: anota dónde estaba cada fila (por su primer enlace), repinta y desliza las que siguen
 *  desde su sitio anterior; las nuevas entran con un fundido. Solo al cambiar un filtro, no en los refrescos. */
function flipRender(listId, render) {
  const before = document.getElementById(listId);
  const keyOf = (li) => li.querySelector('a[href]')?.getAttribute('href');
  const old = new Map();
  if (before && motionOk()) for (const li of before.children) {
    const k = keyOf(li);
    if (k) old.set(k, li.getBoundingClientRect());
  }
  render();
  const list = document.getElementById(listId);
  if (!list || !old.size || !list.animate) return;
  for (const li of list.children) {
    const k = keyOf(li);
    const was = k && old.get(k);
    if (!was) {
      li.animate([{ opacity: 0, transform: 'scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
      continue;
    }
    const now = li.getBoundingClientRect();
    const dy = was.top - now.top;
    const dx = was.left - now.left;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
  }
}

/** Versiones que se despliegan (2026-10-06): la lista crece desde 0 y las versiones entran una tras otra; al ocultar,
 *  se pliega y luego se repinta. */
function foldFamily(list, open) {
  if (!list || list.hidden || !motionOk() || !list.animate) return Promise.resolve();
  const h = list.scrollHeight;
  const frames = open ? [{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }] : [{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }];
  list.style.overflow = 'hidden';
  const anim = list.animate(frames, { duration: open ? 320 : 240, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
  if (open) [...list.children].forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: 60 + i * 50, easing: 'ease-out', fill: 'backwards' }));
  return anim.finished.catch(() => undefined).then(() => {
    list.style.overflow = '';
  });
}

/** Archivar con salida (2026-10-06): la fila se desliza a la derecha, se desvanece y cierra su hueco. */
function leaveRow(row) {
  if (!row || !motionOk() || !row.animate) return Promise.resolve();
  const h = row.offsetHeight;
  row.style.overflow = 'hidden';
  const anim = row.animate(
    [
      { transform: 'none', opacity: 1, height: `${h}px` },
      { transform: 'translateX(40px)', opacity: 0, height: `${h}px`, offset: 0.55 },
      { transform: 'translateX(40px)', opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: '-12px', borderWidth: '0px' },
    ],
    { duration: 520, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)', fill: 'forwards' }
  );
  return anim.finished.catch(() => undefined);
}

/** Descarga con flecha (2026-10-06): una flechita cae en una bandeja sobre el botón y se vuelve ✓. Solo decoración. */
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href*="download=1"]');
  if (!a || !motionOk() || !a.classList.contains('btn')) return;
  a.classList.remove('is-dl');
  void a.offsetWidth;
  a.classList.add('is-dl');
  clearTimeout(a._dlTimer);
  a._dlTimer = setTimeout(() => a.classList.remove('is-dl'), 1600);
});

/** Salto con destello: desplaza como siempre y, al llegar, el destino da un aro rosa que se abre y se apaga. */
function jumpTo(el, block = 'start') {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block });
  if (!motionOk()) return;
  let done = false;
  const flash = () => {
    if (done) return;
    done = true;
    el.classList.remove('is-flash');
    void el.offsetWidth;
    el.classList.add('is-flash');
    setTimeout(() => el.classList.remove('is-flash'), 1000);
  };
  if ('onscrollend' in window) window.addEventListener('scrollend', flash, { once: true });
  setTimeout(flash, 700); // sin desplazamiento (ya estaba a la vista) o sin `scrollend`
}

/** Avisos con sacudida: cualquier aviso (role="alert") que aparece o cambia de texto se sacude y entra deslizándose;
 *  un campo obligatorio vacío que bloquea el envío también se sacude. */
function shake(el) {
  if (!motionOk() || !el) return;
  el.classList.remove('is-shake');
  void el.offsetWidth;
  el.classList.add('is-shake');
  setTimeout(() => el.classList.remove('is-shake'), 600);
}
new MutationObserver((records) => {
  const hit = new Set();
  for (const r of records) {
    const node = r.target.nodeType === 1 ? r.target : r.target.parentElement;
    const alert = node?.closest?.('[role="alert"]');
    if (alert && !alert.hidden) hit.add(alert);
  }
  hit.forEach((el) => !el.hidden && el.offsetParent !== null && shake(el));
}).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true });
document.addEventListener('invalid', (e) => shake(e.target), true);
let lastStatus = new Map();

/** Al enviar: una mini newsletter sale del botón y sube hacia donde aparece el trabajo. */
/** Envío que se transforma (2026-10-06): el botón se encoge a una píldora «Enviando…» mientras sale la petición. */
function morphSendBtn(btn, on) {
  if (!btn) return;
  if (on === btn.classList.contains('is-sending')) return;
  const from = btn.offsetWidth;
  if (on) {
    btn.dataset.label = btn.textContent;
    btn.innerHTML = '<span class="send-dot" aria-hidden="true"></span>Enviando…';
  } else {
    btn.textContent = btn.dataset.label || btn.textContent;
  }
  btn.classList.toggle('is-sending', on);
  if (!motionOk() || !btn.animate) return;
  const to = btn.offsetWidth;
  if (from && to && from !== to) btn.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 320, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
}

async function flyToJob(btn) {
  if (!motionOk() || !btn?.animate) return;
  const r = btn.getBoundingClientRect();
  const card = document.createElement('div');
  card.className = 'fly-card show-mock';
  card.innerHTML = '<i></i><b></b><em></em><em></em>';
  card.style.left = `${r.left + r.width / 2 - 55}px`;
  card.style.top = `${r.top + r.height / 2 - 73}px`;
  document.body.appendChild(card);
  // Aterriza en la píldora de Hermes de la cabecera si está a la vista; si no, arriba en el centro.
  const pill = document.getElementById('hermes-status');
  const pr = pill?.getBoundingClientRect();
  const onPill = pr && pr.width && pr.bottom > 0 && pr.top < window.innerHeight;
  const dx = (onPill ? pr.left + pr.width / 2 : window.innerWidth / 2) - (r.left + r.width / 2);
  const dy = (onPill ? pr.top + pr.height / 2 + 20 : 90) - (r.top + r.height / 2);
  const anim = card.animate(
    [
      { transform: 'translate(0, 0) rotate(0deg) scale(0.4)', opacity: 0 },
      { transform: 'translate(0, -40px) rotate(-6deg) scale(1)', opacity: 1, offset: 0.25 },
      { transform: `translate(${dx}px, ${dy}px) rotate(4deg) scale(0.7)`, opacity: 0.9, offset: 0.85 },
      { transform: `translate(${dx}px, ${dy - 20}px) rotate(0deg) scale(0.5)`, opacity: 0 },
    ],
    { duration: 750, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' }
  );
  await anim.finished.catch(() => undefined);
  card.remove();
  if (onPill) pill.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
}
/** La página del trabajo «aterriza» tras el vuelo. */
function landJobView() {
  if (!motionOk()) return;
  viewJob.classList.remove('is-landing');
  void viewJob.offsetWidth;
  viewJob.classList.add('is-landing');
  setTimeout(() => viewJob.classList.remove('is-landing'), 900);
}

/** Pieza terminada: su fila se ilumina y su miniatura aterriza; en el abanico, la carta nueva cae con rebote. */
function celebrateDone(ids) {
  if (!motionOk()) return;
  for (const id of ids) {
    const href = `?job=${encodeURIComponent(id)}`;
    const row = document.querySelector(`#history-list a[href="${href}"]`)?.closest('li');
    if (row) {
      row.classList.add('just-done');
      setTimeout(() => row.classList.remove('just-done'), 2600);
    }
    // La etiqueta pasa de «Trabajando» a «Lista» con un giro de carta.
    row?.querySelector('.status-badge')?.classList.add('flip-in');
    const card = document.querySelector(`#hero-showcase a[href="${href}"]`);
    if (card) {
      card.classList.add('is-new');
      setTimeout(() => card.classList.remove('is-new'), 1400);
    }
  }
}

/** Cascada: los elementos de la lista entran uno tras otro (como se reparten las cartas). Solo cuando se pide (al
 *  verla por primera vez o al cambiar de vista), no en cada actualización. */
function playCascade(list) {
  if (!list || !motionOk()) return;
  [...list.children].forEach((li, i) => li.style.setProperty('--i', String(Math.min(i, 14))));
  list.classList.remove('is-cascade');
  void list.offsetWidth;
  list.classList.add('is-cascade');
  clearTimeout(list._cascadeTimer);
  list._cascadeTimer = setTimeout(() => list.classList.remove('is-cascade'), 1400);
}

/** Cifras del resumen: cuentan desde 0 la primera vez que se ven. */
function countUp(box) {
  if (!motionOk()) return;
  box.querySelectorAll('.stat-num').forEach((el) => {
    // El valor final se guarda: dos recuentos a la vez (al pintar y al verse) leían el número a medio contar.
    if (el.dataset.counting) return;
    const m = el.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    el.dataset.counting = '1';
    const end = Number(m[1]);
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 900);
      el.textContent = `${Math.round(end * (1 - (1 - k) ** 3))}${m[2]}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    // Siempre acaba en su valor (2026-10-07): sin fotogramas (pestaña en segundo plano, captura de página entera) la
    // cifra se quedaba a medio contar (19 en vez de 39, 36 % en vez de 75 %) hasta el siguiente refresco.
    setTimeout(() => {
      if (el.isConnected) el.textContent = `${end}${m[2]}`;
    }, 1000);
  });
}
if ('IntersectionObserver' in window) {
  const once = (id, fn) => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting && el.children.length)) return;
      io.disconnect();
      fn(el);
    }, { threshold: 0.15 });
    io.observe(el);
  };
  once('history-list', playCascade);
  once('history-stats', countUp);
  once('now-strip', (el) => el.querySelectorAll('.now-list').forEach(playCascade));
}

/** Controles segmentados: una píldora se desliza hasta la opción elegida (formulario, Lista/Galería, vista previa). */
function placePill(seg, animate = true) {
  const pill = seg.querySelector(':scope > .seg-pill');
  const active = seg.querySelector('input:checked + span') || seg.querySelector('.seg-btn[aria-pressed="true"]');
  if (!pill || !active || !active.offsetWidth) return;
  const a = active.getBoundingClientRect();
  const b = seg.getBoundingClientRect();
  if (!animate) pill.style.transition = 'none';
  Object.assign(pill.style, { left: `${a.left - b.left}px`, top: `${a.top - b.top}px`, width: `${a.width}px`, height: `${a.height}px`, opacity: '1' });
  if (!animate) {
    void pill.offsetWidth;
    pill.style.transition = '';
  }
}
document.querySelectorAll('.segmented').forEach((seg) => {
  const pill = document.createElement('i');
  pill.className = 'seg-pill';
  pill.setAttribute('aria-hidden', 'true');
  seg.prepend(pill);
  seg.classList.add('has-pill');
  placePill(seg, false);
  seg.addEventListener('change', () => placePill(seg));
  new MutationObserver(() => placePill(seg)).observe(seg, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  if ('ResizeObserver' in window) new ResizeObserver(() => placePill(seg, false)).observe(seg);
});

// ---------------------------------------------------------------- fondo e interacciones (2026-10-06)
// Fondo: siluetas muy tenues de newsletters (como las maquetas del abanico) que suben despacio a distintas velocidades,
// con parallax al hacer scroll. (2026-10-06: se probó una aurora de marca y el usuario prefirió volver a esta.) Interacciones: tarjetas que se inclinan hacia el ratón, botones magnéticos con onda al
// pulsar, filas que se levantan (CSS) y números de sección con parallax. Todo quieto con «reducir movimiento».
(function backgroundAndInteractions() {
  if (!motionOk()) return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Fondo de newsletters flotando: 12 siluetas en posiciones y ritmos fijos (sin azar: la misma página cada vez).
  const bg = document.createElement('div');
  bg.className = 'bg-float';
  bg.setAttribute('aria-hidden', 'true');
  const spots = [
    [4, 0.9, 44, 0], [14, 0.6, 58, -18], [27, 1.1, 50, -6], [38, 0.7, 64, -33], [52, 1, 47, -12], [63, 0.65, 60, -40],
    [74, 1.2, 54, -22], [86, 0.75, 49, -3], [93, 0.95, 62, -28], [8, 0.8, 57, -45], [46, 0.55, 66, -50], [80, 0.85, 52, -15],
  ];
  bg.innerHTML = spots
    .map(([x, scale, dur, delay], i) => `<span class="bg-card" style="--x:${x}vw;--s:${scale};--d:${dur}s;--dl:${delay}s;--r:${(i % 2 ? 1 : -1) * (4 + (i % 5))}deg"><i></i><b></b><em></em><em></em></span>`)
    .join('');
  document.body.prepend(bg);

  // Hilo que conecta (2026-10-06): en el margen, una línea se dibuja del «01» al «02» según se baja; al llegar,
  // el «02» se ilumina. Ligado al scroll: si se sube, se recoge.
  const formView = document.getElementById('view-form');
  const thread = document.createElement('div');
  thread.className = 'section-thread';
  thread.setAttribute('aria-hidden', 'true');
  thread.innerHTML = '<span class="section-thread-line"></span><span class="section-thread-dot"></span>';
  formView.prepend(thread);
  let threadArrived = false;
  // Segundo tramo (2026-10-06): del «02» al final del historial; al llegar, el pie se ilumina.
  const thread2 = thread.cloneNode(true);
  formView.prepend(thread2);
  const foot = document.querySelector('.foot');
  let footArrived = false;
  const placeThread2 = (b, box) => {
    const hist = document.getElementById('history');
    const top = b.bottom - box.top + 12;
    const height = hist.getBoundingClientRect().bottom - box.top - top;
    if (height <= 40) {
      thread2.hidden = true;
      return;
    }
    thread2.hidden = false;
    thread2.style.top = `${top}px`;
    thread2.style.height = `${height}px`;
    // Al final de la página cuenta como llegado: con un pie alto, el 85 % de la pantalla no alcanzaría el final.
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    const t = atEnd ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.85 - (b.bottom + 12)) / height));
    thread2.style.setProperty('--t', t.toFixed(4));
    if (t >= 1 && !footArrived && foot) {
      footArrived = true;
      foot.classList.remove('is-lit');
      void foot.offsetWidth;
      foot.classList.add('is-lit');
      setTimeout(() => foot.classList.remove('is-lit'), 1800);
    } else if (t < 0.95) footArrived = false;
  };
  const placeThread = () => {
    const nums = formView.querySelectorAll('.section-num');
    const second = nums[1];
    if (nums.length < 2 || !second.offsetParent || formView.hidden) {
      thread.hidden = true;
      thread2.hidden = true;
      return;
    }
    const box = formView.getBoundingClientRect();
    // Sobre el título, no el número: el número tiene parallax y el hilo cambiaría de largo al bajar.
    const a = nums[0].parentElement.getBoundingClientRect();
    const b = second.parentElement.getBoundingClientRect();
    const top = a.bottom - box.top + 12;
    const height = b.top - box.top - 12 - top;
    if (height <= 0) {
      thread.hidden = true;
      return;
    }
    thread.hidden = false;
    thread.style.top = `${top}px`;
    thread.style.height = `${height}px`;
    const t = Math.max(0, Math.min(1, (window.innerHeight * 0.6 - (a.bottom + 12)) / height));
    thread.style.setProperty('--t', t.toFixed(4));
    placeThread2(b, box);
    if (t >= 1 && !threadArrived) {
      threadArrived = true;
      second.classList.remove('is-lit');
      void second.offsetWidth;
      second.classList.add('is-lit');
    } else if (t < 0.95) threadArrived = false;
  };

  // Parallax del fondo y de los números de sección.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      bg.style.setProperty('--py', `${Math.round(window.scrollY * -0.12)}px`);
      document.querySelectorAll('.section-num').forEach((n) => {
        const r = n.parentElement.getBoundingClientRect();
        n.style.setProperty('--px', `${Math.max(-12, Math.min(12, (r.top - window.innerHeight / 2) * 0.04)).toFixed(1)}px`);
      });
      placeThread();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (!fine) return;

  // Tarjetas que se inclinan hacia el ratón, con un brillo que lo sigue. La del formulario, apenas (y nada mientras
  // se escribe en ella).
  // Sin las cartas del abanico de la cabecera: son absolutas y tienen su propio efecto al pasar (inclinarlas las sacaba
  // del abanico como un cuadrado grande y el movimiento chocaba con su transición).
  const TILT = '#brief-form.card, .now-link, .g-card';
  // Rendimiento (2026-10-06): un cálculo por fotograma, no por cada evento del ratón.
  let tiltEvt = null;
  document.addEventListener('pointermove', (e) => {
    if (!tiltEvt) requestAnimationFrame(() => {
      const ev = tiltEvt;
      tiltEvt = null;
      tiltAt(ev);
    });
    tiltEvt = e;
  });
  function tiltAt(e) {
    const card = e.target.closest?.(TILT);
    document.querySelectorAll('.is-tilting').forEach((c) => c !== card && resetTilt(c));
    if (!card) return;
    if (card.matches('#brief-form') && card.contains(document.activeElement) && document.activeElement !== document.body) return resetTilt(card);
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const max = card.matches('#brief-form') ? 1.2 : 6;
    card.classList.add('is-tilting');
    card.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${((px - 0.5) * max).toFixed(2)}deg`);
    card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  }
  function resetTilt(c) {
    c.classList.remove('is-tilting');
    c.style.removeProperty('--rx');
    c.style.removeProperty('--ry');
  }
  document.addEventListener('pointerleave', () => document.querySelectorAll('.is-tilting').forEach(resetTilt));

  // Botones magnéticos: se acercan al cursor (hasta 6 px) y, al pulsar, una onda rosa sale del punto del clic.
  const MAG = '.hero-cta, #brief-form button[type="submit"], .row-view, .history-jump';
  // Solo los botones a la vista (IntersectionObserver) y un cálculo por fotograma: antes se medían todos los «Ver» del
  // historial con cada movimiento del ratón.
  const visibleMag = new Set();
  const magIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((en) => (en.isIntersecting ? visibleMag.add(en.target) : visibleMag.delete(en.target)))) : null;
  const watchMag = () => document.querySelectorAll(MAG).forEach((b) => {
    if (!b.dataset.magWatched) {
      b.dataset.magWatched = '1';
      magIO?.observe(b);
    }
  });
  watchMag();
  new MutationObserver(watchMag).observe(document.body, { childList: true, subtree: true });
  let magEvt = null;
  document.addEventListener('pointermove', (e) => {
    if (!magEvt) requestAnimationFrame(() => {
      const ev = magEvt;
      magEvt = null;
      magnetAt(ev);
    });
    magEvt = e;
  });
  function magnetAt(e) {
    visibleMag.forEach((b) => {
      if (!b.isConnected) return visibleMag.delete(b);
      const r = b.getBoundingClientRect();
      if (!r.width) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.abs(dx) < r.width / 2 + 40 && Math.abs(dy) < r.height / 2 + 30;
      b.style.setProperty('--mx', near ? `${(dx * 0.15).toFixed(1)}px` : '0px');
      b.style.setProperty('--my', near ? `${(dy * 0.25).toFixed(1)}px` : '0px');
      b.classList.add('is-magnetic');
    });
  }
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest?.(`${MAG}, .btn`);
    if (!b) return;
    const r = b.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'click-ripple';
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    b.classList.add('has-ripple');
    b.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  });
})();

// ---------------------------------------------------------------- más animaciones (2026-10-06, 3.ª tanda)

/** Barras de las piezas en curso: crecen desde donde estaban (el historial se repinta en cada actualización y saltaban). */
const lastPct = new Map();
function animateBars() {
  document.querySelectorAll('.now-track > span, .job-row .mini-track > div').forEach((bar) => {
    const id = bar.closest('li')?.querySelector('a[href^="?job="]')?.getAttribute('href') || '';
    const target = bar.style.width;
    const before = lastPct.get(id + bar.className + bar.parentElement.className);
    lastPct.set(id + bar.className + bar.parentElement.className, target);
    if (!motionOk() || !before || before === target) return;
    bar.style.transition = 'none';
    bar.style.width = before;
    void bar.offsetWidth;
    bar.style.transition = 'width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    bar.style.width = target;
  });
}

/** Al abrir un trabajo, la newsletter se despliega desde arriba, como al abrir un correo (una vez por trabajo). */
let unfoldedFor = null;
function unfoldPreview(id) {
  if (!motionOk() || unfoldedFor === id) return;
  unfoldedFor = id;
  const dev = document.getElementById('preview-device');
  if (!dev) return;
  dev.classList.remove('is-unfolding');
  void dev.offsetWidth;
  dev.classList.add('is-unfolding');
  setTimeout(() => dev.classList.remove('is-unfolding'), 1100);
}

/** Pestañas del trabajo: un subrayado rosa que se desliza a la elegida (como las píldoras). */
(function tabInk() {
  const tabs = document.querySelector('.job-tabs');
  if (!tabs) return;
  const ink = document.createElement('i');
  ink.className = 'tab-ink';
  ink.setAttribute('aria-hidden', 'true');
  tabs.appendChild(ink);
  tabs.classList.add('has-ink');
  const place = () => {
    const sel = tabs.querySelector('.job-tab[aria-selected="true"]');
    if (!sel || !sel.offsetWidth) return;
    ink.style.left = `${sel.offsetLeft}px`;
    ink.style.width = `${sel.offsetWidth}px`;
    ink.style.opacity = '1';
  };
  new MutationObserver(place).observe(tabs, { subtree: true, attributes: true, attributeFilter: ['aria-selected', 'hidden'] });
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(tabs);
  place();
})();

/** Raíl lateral: la línea rosa crece al bajar y debajo se marca la sección en la que estás («01», «02»). */
(function railProgress() {
  const rail = document.querySelector('.rail-line');
  const sec = document.getElementById('rail-sec');
  if (!rail) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    rail.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(3) : '0');
    if (!sec) return;
    let current = '';
    document.querySelectorAll('.section-title').forEach((t) => {
      if (t.offsetParent && t.getBoundingClientRect().top < window.innerHeight * 0.5) current = t.querySelector('.section-num')?.textContent || '';
    });
    if (sec.textContent !== current) {
      sec.textContent = current;
      sec.classList.remove('is-new');
      void sec.offsetWidth;
      if (current) sec.classList.add('is-new');
    }
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
})();

/** Formulario: los ejemplos se reparten como cartas la primera vez que aparecen. */
(function examplesDeal() {
  const ex = document.getElementById('examples');
  if (!ex || !motionOk()) return;
  new MutationObserver(() => {
    if (!ex.hidden && !ex.dataset.dealt) {
      ex.dataset.dealt = '1';
      playCascade(ex);
    }
  }).observe(ex, { attributes: true, attributeFilter: ['hidden'] });
  if (!ex.hidden) {
    ex.dataset.dealt = '1';
    playCascade(ex);
  }
})();

// ---------------------------------------------------------------- 4.ª tanda (2026-10-06)

// Con el deslizador de «Libre» el ancho va pegado al dedo: sin transición mientras se arrastra.
(function freeDragNoAnim() {
  const range = document.getElementById('free-width-range');
  const stage = document.getElementById('preview-stage');
  if (!range || !stage) return;
  range.addEventListener('pointerdown', () => stage.classList.add('no-anim'));
  range.addEventListener('input', () => stage.classList.add('no-anim'));
  range.addEventListener('change', () => setTimeout(() => stage.classList.remove('no-anim'), 50));
  window.addEventListener('pointerup', () => setTimeout(() => stage.classList.remove('no-anim'), 50));
})();

/** Copiar con confirmación: el botón pulsado se convierte en un ✓ dibujado durante un segundo. */
let lastPressed = null;
document.addEventListener('pointerdown', (e) => {
  lastPressed = { el: e.target.closest?.('button, a'), at: Date.now() };
}, true);
function confirmCopy() {
  if (!motionOk() || !lastPressed?.el || Date.now() - lastPressed.at > 3000) return;
  const b = lastPressed.el;
  if (b.querySelector(':scope > .copy-check')) return;
  b.classList.add('is-copied');
  b.insertAdjacentHTML('beforeend', '<span class="copy-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>');
  setTimeout(() => {
    b.classList.remove('is-copied');
    b.querySelector(':scope > .copy-check')?.remove();
  }, 1200);
}

/** En la página del trabajo, el fondo animado se para: lo importante es la vista previa (rendimiento, 2026-10-06). */
new MutationObserver(() => document.documentElement.classList.toggle('in-job', !viewJob.hidden)).observe(viewJob, { attributes: true, attributeFilter: ['hidden'] });
document.documentElement.classList.toggle('in-job', !viewJob.hidden);

/** Aprobar con celebración: una ráfaga de cartas de newsletter y destellos rosas sale del botón. */
function celebrateApproval(from) {
  if (!motionOk() || !from?.getBoundingClientRect) return;
  const r = from.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < 16; i++) {
    const card = i % 3 === 0;
    const el = document.createElement('span');
    el.className = card ? 'burst-card' : 'burst-spark';
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    document.body.appendChild(el);
    const angle = (i / 16) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
    const dist = card ? 110 + (i % 4) * 18 : 70 + (i % 5) * 16;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 30;
    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${(i % 2 ? 1 : -1) * 40}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + 40}px)) scale(0.8) rotate(${(i % 2 ? 1 : -1) * 70}deg)`, opacity: 0 },
      ],
      { duration: 1000 + (i % 4) * 120, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }
    ).finished.then(() => el.remove(), () => el.remove());
  }
}
/** El sello «Aprobada» cae con un golpe suave cuando aparece. */
function stampApproval() {
  if (!motionOk()) return;
  let tries = 0;
  const t = setInterval(() => {
    const b = document.getElementById('approved-banner');
    if ((b && !b.hidden) || ++tries > 20) {
      clearInterval(t);
      if (b && !b.hidden) {
        b.classList.remove('is-stamp');
        void b.offsetWidth;
        b.classList.add('is-stamp');
      }
    }
  }, 150);
}

/** Notas que se dibujan: las barras del panel de la revisión de arte se llenan una tras otra (al pintarse y al abrirlo). */
function drawArtBars() {
  if (!motionOk()) return;
  document.querySelectorAll('#art-list .art-bar > span').forEach((bar, i) => {
    bar.animate([{ width: '0%' }, { width: bar.style.width }], { duration: 700, delay: i * 70, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' });
  });
}
document.getElementById('art-box')?.addEventListener('toggle', (e) => {
  if (e.target.open) drawArtBars();
});

/** Paso de la cabecera (1-4) de una pieza en curso según su fase (stageLabel del worker). */
function liveStep(j) {
  const label = j.stageLabel || '';
  if (/^(Escribiendo la newsletter|Aplicando los cambios)/.test(label)) return 2;
  if (/^Revisando/.test(label)) return (j.pct ?? 0) >= 90 ? 4 : 3;
  return 1; // brief, preparación, investigación o lectura de la versión original
}

/** Posición de cada número y cada línea en la fila (0-1): el retraso del degradado que la recorre. */
function placeStepSweep(steps) {
  const box = steps.getBoundingClientRect();
  if (!box.width) return;
  steps.querySelectorAll('li').forEach((li) => {
    const num = li.querySelector('.step-num').getBoundingClientRect();
    const r = li.getBoundingClientRect();
    li.style.setProperty('--pl', ((r.left - box.left) / box.width).toFixed(3));
    li.style.setProperty('--pn', ((num.left - box.left) / box.width).toFixed(3));
  });
}
window.addEventListener('resize', () => {
  const steps = document.querySelector('.hero-steps');
  if (steps) placeStepSweep(steps);
});
document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelector('.hero-steps');
  if (steps) {
    steps.classList.add('is-idle');
    placeStepSweep(steps);
    // Con la tipografía ya cargada cambian los anchos.
    document.fonts?.ready.then(() => placeStepSweep(steps));
  }
});

/** Pasos en vivo (2026-10-06): con una pieza en curso, la línea rosa avanza hasta su paso; sin nada, una luz recorre
 *  los pasos despacio (clase is-idle). */
function renderLiveSteps(jobs) {
  const steps = document.querySelector('.hero-steps');
  const caption = document.getElementById('hero-steps-live');
  if (!steps || !caption) return;
  const running = jobs.find((j) => j.status === 'running' && !j.archivedAt);
  const items = [...steps.querySelectorAll('li')];
  steps.classList.toggle('is-idle', !running);
  steps.classList.toggle('is-live', !!running);
  const current = running ? liveStep(running) : 0;
  items.forEach((li, i) => {
    li.classList.toggle('is-done', i + 1 < current);
    li.classList.toggle('is-current', i + 1 === current);
  });
  // Pasos vivos (2026-10-07, D): la línea hacia el paso siguiente se llena según lo que lleva del actual (tramos
  // aproximados del porcentaje de Hermes: investigar 0-30, escribir 30-75, revisar 75-90, corregir 90-100).
  const SPANS = [[0, 30], [30, 75], [75, 90], [90, 100]];
  if (running) {
    const [a, b] = SPANS[current - 1];
    const fill = Math.max(0.06, Math.min(1, ((running.pct ?? 0) - a) / (b - a)));
    steps.style.setProperty('--fill', fill.toFixed(2));
  }
  placeStepSweep(steps);
  caption.hidden = !running;
  if (running) {
    caption.innerHTML = `<span class="live-dot" aria-hidden="true"></span>Ahora: <a href="?job=${encodeURIComponent(running.id)}">${escapeHtml(running.clientName || 'una newsletter')}</a> · ${escapeHtml(running.stageLabel || 'en marcha')}${running.pct != null ? ` · ${running.pct} %` : ''}`;
  }
}

// Vista previa al pasar por la miniatura de una fila del historial (2026-10-06): una tarjeta grande e inclinada como
// las del abanico de la cabecera, con la parte de arriba de la pieza. Solo con ratón (no en pantallas táctiles).
const peek = document.createElement('div');
peek.className = 'thumb-peek';
peek.setAttribute('aria-hidden', 'true');
peek.innerHTML = '<img alt="" width="300" height="400">';
document.body.appendChild(peek);
let peekFor = null;
function showPeek(img) {
  const r = img.getBoundingClientRect();
  peekFor = img;
  peek.querySelector('img').src = img.currentSrc || img.src;
  const w = 180, h = 240;
  const left = Math.min(window.innerWidth - w - 16, r.right + 16);
  const top = Math.max(16, Math.min(window.innerHeight - h - 16, r.top + r.height / 2 - h / 2));
  peek.style.left = `${left}px`;
  peek.style.top = `${top}px`;
  peek.classList.add('is-on');
}
function hidePeek() {
  peekFor = null;
  peek.classList.remove('is-on');
}
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener('mouseover', (e) => {
    const img = e.target.closest?.('#history-list .thumb img, .job-row .thumb img');
    if (img && img !== peekFor && !img.closest('.is-gallery')) showPeek(img);
    else if (!img && peekFor) hidePeek();
  });
  window.addEventListener('scroll', hidePeek, { passive: true });
}

// Foco de luz en tarjetas (2026-10-06): un brillo rosa suave sigue al cursor en las filas del historial y de marcas.
// Un solo escuchador delegado, a un cambio por fotograma; fuera de las filas no hace nada.
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && motionOk()) {
  let litRow = null;
  let litFrame = 0;
  let litEvent = null;
  const unlit = () => {
    litRow?.classList.remove('is-lit');
    litRow = null;
  };
  document.addEventListener('pointermove', (e) => {
    litEvent = e;
    if (litFrame) return;
    litFrame = requestAnimationFrame(() => {
      litFrame = 0;
      const row = document.documentElement.classList.contains('in-job') ? null : litEvent.target.closest?.('.job-row, .brand-row');
      if (row !== litRow) unlit();
      if (!row) return;
      const r = row.getBoundingClientRect();
      row.style.setProperty('--mx', `${Math.round(litEvent.clientX - r.left)}px`);
      row.style.setProperty('--my', `${Math.round(litEvent.clientY - r.top)}px`);
      row.classList.add('is-lit');
      litRow = row;
    });
  }, { passive: true });
  document.addEventListener('pointerleave', unlit);
}

function renderNowStrip(jobs) {
  const live = jobs.filter((j) => !j.archivedAt);
  const waiting = [];
  for (const j of live) {
    if (j.status === 'review') waiting.push(nowItem(j, 'Brief listo para revisar', 'Revisar el brief'));
    else if (j.client?.open) waiting.push(nowItem(j, `${j.client.open} comentario${j.client.open === 1 ? '' : 's'} del cliente sin resolver`, 'Ver comentarios', '', 'client'));
    else if (j.client?.decision === 'changes') waiting.push(nowItem(j, 'El cliente pide cambios', 'Ver qué pide', '', 'client'));
  }
  const active = live
    .filter((j) => j.status === 'running' || j.status === 'queued')
    .sort((a, b) => (a.status === 'running' ? -1 : 1) - (b.status === 'running' ? -1 : 1) || a.createdAt.localeCompare(b.createdAt))
    .map((j) => {
      if (j.status === 'queued') return nowItem(j, 'En cola', 'Ver');
      const pct = j.pct ?? 0;
      return nowItem(j, `${escapeHtml(j.stageLabel || 'Trabajando')} · ${pct} %`, 'Ver', `<span class="now-track" aria-hidden="true"><span style="width:${Math.max(2, Math.min(100, pct))}%"></span></span>`);
    });
  document.getElementById('now-waiting').innerHTML = waiting.slice(0, NOW_MAX).join('');
  document.getElementById('now-active').innerHTML = active.slice(0, NOW_MAX).join('');
  document.getElementById('now-waiting-group').hidden = !waiting.length;
  document.getElementById('now-active-group').hidden = !active.length;
  document.getElementById('now-strip').hidden = !waiting.length && !active.length;
}

// Miniatura sin imagen (2026-10-05): el logo de la ficha de marca en el cuadrado (blanco, o azul noche si el logo es
// la versión blanca), como los logos de clientes de feebbodigital.com; sin ficha, las iniciales.
// Pieza en marcha que se construye (2026-10-07, C): la miniatura de lo que está haciendo Hermes es una maqueta cuyos
// bloques (logo, imagen, titular, texto, botón) aparecen según avanza, con una línea de escaneo encima. En cola, la
// maqueta respira, sin bloques. Solo los bloques que aparecen desde el último repintado se animan (el historial se
// repinta cada 20-30 s y en tres sitios: «Ahora mismo», la lista y la galería).
const BUILD_BLOCKS = [['tb-logo', 0], ['tb-img', 12], ['tb-h', 35], ['tb-l', 55], ['tb-l is-short', 62], ['tb-btn', 80]];
const buildSeen = new Map();
const isBuilding = (j) => j.status === 'running' || j.status === 'queued';
function buildThumbInner(j) {
  const pct = j.status === 'running' ? j.pct ?? 0 : -1;
  const now = Date.now();
  let rec = buildSeen.get(j.id);
  if (!rec) rec = { prev: motionOk() ? -1 : pct, cur: pct, t: now };
  else if (now - rec.t > 1500) rec = { prev: rec.cur, cur: pct, t: now };
  else rec.cur = pct;
  buildSeen.set(j.id, rec);
  return (
    BUILD_BLOCKS.map(([cls, at]) => `<i class="${cls}${pct >= at ? ' is-on' : ''}${pct >= at && rec.prev < at ? ' is-new' : ''}"></i>`).join('') +
    (j.status === 'running' ? '<i class="tb-scan"></i>' : '')
  );
}
// Miniaturas vacías con carácter (2026-10-07): las canceladas y fallidas, rayadas y apagadas con su estado; las que
// solo tienen iniciales, sobre un tono propio de la marca (sacado de su nombre: el historial no trae sus colores).
const STOPPED = { failed: 'Fallida', cancelled: 'Cancelada' };
function brandHue(name) {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}
function emptyThumbClass(j) {
  if (isBuilding(j)) return `thumb-build${j.status === 'queued' ? ' is-queued' : ''}`;
  const stopped = STOPPED[j.status] ? ' is-stopped' : '';
  return (j.brandLogo ? `thumb-empty thumb-logo${j.brandLogo === 'dark' ? ' is-on-dark' : ''}` : 'thumb-empty') + stopped;
}
function emptyThumbInner(j, initials) {
  if (isBuilding(j)) return buildThumbInner(j);
  const state = STOPPED[j.status] ? `<em class="thumb-state">${STOPPED[j.status]}</em>` : '';
  return (
    (j.brandLogo
      ? `<img src="/api/brands/${encodeURIComponent(j.clientSlug)}/logo" alt="" loading="lazy" data-initials="${escapeHtml(initials)}">`
      : `<span class="thumb-initials" style="--h:${brandHue(j.clientSlug || j.clientName)}">${escapeHtml(initials)}</span>`) + state
  );
}
/** Logo blanco sobre la miniatura blanca (Prozis, 2026-10-07: la miniatura parecía vacía): si sus píxeles visibles son
 *  casi todos claros, la miniatura pasa a fondo oscuro. */
document.addEventListener(
  'load',
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.src.includes('/api/brands/')) return;
    const box = img.closest('.thumb-logo, .now-thumb');
    if (!box || box.classList.contains('is-on-dark')) return;
    try {
      const c = document.createElement('canvas');
      c.width = 48;
      c.height = Math.max(1, Math.round((48 * img.naturalHeight) / Math.max(1, img.naturalWidth)));
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let lum = 0;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        lum += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        n++;
      }
      if (n && lum / n > 0.86) box.classList.add('is-on-dark');
    } catch {
      // imagen de otro origen: se queda como está
    }
  },
  true
);

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
  // Sin filtro, la cifra ya está en la fila de cifras (2026-10-05: salía tres veces); con filtro, "2 de 5".
  document.getElementById('history-count').textContent = groups.length === scoped.length ? (scoped.length === scopedJobs ? '' : count) : `${groups.length} de ${newsletters(scoped.length)}`;
  // El servidor manda los últimos N trabajos: si hay más, se dice en vez de perderlos en silencio (2026-10-05).
  if (historyState.truncated) {
    const el = document.getElementById('history-count');
    el.textContent = `${el.textContent ? `${el.textContent} · ` : ''}solo los ${historyState.truncated.toLocaleString('es-ES')} trabajos más recientes`;
  }
  renderHistoryStats(scoped);
  renderFootStats([...families.values()].filter((m) => m.some((j) => !j.archivedAt)));
  document.getElementById('history-empty').hidden = groups.length > 0;
  document.getElementById('history-more').hidden = groups.length <= visible.length;

  const listEl = document.getElementById('history-list');
  listEl.classList.toggle('is-gallery', historyState.view === 'gallery');
  document.querySelectorAll('[data-history-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.historyView === historyState.view)));
  if (historyState.view === 'gallery') {
    listEl.innerHTML = renderGallery(visible, info);
    return;
  }
  const sepBefore = new Map(byDay(visible).map(({ label, count, items }) => [items[0], daySep(label, count)]));
  listEl.innerHTML = visible
    .map(({ root, lead: j, others }, gi) => {
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
      const meta = approved + version + [when, j.requesterName, jobKindLabel(j), IMAGE_LABELS[j.imageMode], durationLabel(j), j.art ? `calidad ${j.art.pct} %` : null, clientLabel(j)]
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
        : `<a class="thumb ${emptyThumbClass(j)}" href="?job=${id}" tabindex="-1" aria-hidden="true">${emptyThumbInner(j, initials)}</a>`;
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
      return `${sepBefore.get(gi) || ''}<li class="job-row">
          ${thumb}
          <a class="name" href="?job=${id}">${escapeHtml(j.clientName)}${j.familyTitle ? `<span class="row-title">${escapeHtml(j.familyTitle)}</span>` : ''}</a>
          <span class="status-badge status-${escapeHtml(j.status)}">${escapeHtml(statusLabel(j))}</span>
          <p class="meta">${meta}</p>
          <div class="row-actions">${jobActions(j)}${rowMenu(j, archiveBtn)}</div>
          ${running ? `<div class="mini-track" aria-hidden="true"><div style="width:${Number(j.pct) || 0}%"></div></div>` : ''}
          ${j.error ? (({ short, summary }) => `<p class="err" title="${escapeHtml(summary)}">${escapeHtml(short)} <a href="?job=${id}">Ver por qué</a></p>`)(window.HermesFailure.explainFailure(j.error)) : ''}
          ${older}
        </li>`;
    })
    .join('');
}

/** Galería (2026-09-28): miniaturas grandes con la misma selección y orden que la lista. La tarjeta lleva
 *  a la versión que representa la familia; las acciones (descargar, archivar…) siguen en la vista de lista.
 *  Desde 2026-09-30, una sola cuadrícula con la marca en cada tarjeta: agrupada por marca, con una o dos
 *  newsletters por marca salía una fila por tarjeta y mucho hueco. */
/** Historial por días (2026-10-07): «Hoy», «Ayer», «Esta semana» y después por meses, según la última actividad de
 *  cada newsletter (el mismo orden de la lista). Devuelve los tramos con los índices de sus grupos. */
function dayBucket(iso, now = new Date()) {
  const d = new Date(iso);
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff <= 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return 'Esta semana';
  const month = d.toLocaleDateString('es-ES', { month: 'long' });
  const label = month.charAt(0).toUpperCase() + month.slice(1);
  return d.getFullYear() === now.getFullYear() ? label : `${label} ${d.getFullYear()}`;
}
function byDay(groups) {
  const out = [];
  groups.forEach((g, i) => {
    const label = dayBucket(g.latest || g.lead.createdAt);
    const last = out[out.length - 1];
    if (last && last.label === label) {
      last.items.push(i);
      last.count++;
    } else out.push({ label, count: 1, items: [i] });
  });
  return out;
}
function daySep(label, count) {
  return `<li class="day-sep" role="presentation"><span class="day-label">${escapeHtml(label)}</span><span class="day-count">${count}</span></li>`;
}

/** Tarjeta de galería más rica (2026-10-07): un punto de color con el estado (lista, aprobada, con comentarios del
 *  cliente, en marcha, por revisar, fallida) y un anillo con la nota de calidad de la versión más reciente que la tenga.
 *  Así se ve de un vistazo qué falta por mirar. */
function galleryOverlay(j, members) {
  const approved = members.some((x) => x.approvedAt);
  const [tone, label] = approved
    ? ['ok', 'Aprobada']
    : j.client?.open
    ? ['warn', `${j.client.open} comentario${j.client.open === 1 ? '' : 's'} del cliente`]
    : j.client?.decision === 'changes'
    ? ['warn', 'El cliente pide cambios']
    : j.status === 'review'
    ? ['warn', 'Brief por revisar']
    : j.status === 'running' || j.status === 'queued'
    ? ['live', j.status === 'queued' ? 'En cola' : 'En marcha']
    : STOPPED[j.status]
    ? ['bad', STOPPED[j.status]]
    : ['ready', 'Lista para revisar'];
  const scored = [...members].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).find((x) => x.art);
  const pct = scored ? Math.max(0, Math.min(100, Math.round(scored.art.pct))) : null;
  const ring =
    pct === null
      ? ''
      : `<span class="g-score is-${pct >= 76 ? 'high' : pct >= 60 ? 'mid' : 'low'}" title="Calidad: ${pct} %"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" pathLength="100"/><circle class="g-score-arc" cx="18" cy="18" r="15.5" pathLength="100" style="--p:${pct}"/></svg><b>${pct}</b></span>`;
  return `<span class="g-dot is-${tone}" title="${escapeHtml(label)}"><span class="sr-only">${escapeHtml(label)}</span></span>${ring}`;
}
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
        : `<span class="thumb ${emptyThumbClass(j)}">${emptyThumbInner(j, initials)}</span>`;
      const thumbRich = thumb.replace(/<\/span>$/, `${galleryOverlay(j, [j, ...others])}</span>`);
      const approved = [j, ...others].find((x) => x.approvedAt);
      const when = new Date(j.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const bits = [
        when,
        fam.size > 1 ? `${fam.size} versiones` : null,
        jobKindLabel(j),
      ].filter(Boolean);
      const status = j.status === 'completed' ? '' : `<span class="status-badge status-${escapeHtml(j.status)}">${escapeHtml(statusLabel(j))}</span>`;
      return `<li><a class="g-card" href="?job=${id}" title="${escapeHtml(`${j.clientName} · ${new Date(j.createdAt).toLocaleString('es-ES')}`)}">
          ${thumbRich}
          <span class="g-name">${escapeHtml(j.clientName)}</span>${j.familyTitle ? `<span class="g-title">${escapeHtml(j.familyTitle)}</span>` : ''}
          <span class="g-meta">${escapeHtml(bits.join(' · '))}</span>
          ${approved ? `<span class="approved-tag">✓ Aprobada${fam.size > 1 ? ` (v${info.get(approved.id).number})` : ''}</span>` : ''}
          ${status}
        </a></li>`;
    });
  // Por días (2026-10-07): un separador fijo y una cuadrícula por tramo.
  return byDay(groups)
    .map(({ label, count, items }) => `${daySep(label, count)}<li class="g-all"><ul class="g-grid">${items.map((i) => cards[i]).join('')}</ul></li>`)
    .join('');
}

document.querySelectorAll('[data-history-view]').forEach((b) =>
  b.addEventListener('click', () => {
    historyState.view = b.dataset.historyView;
    try {
      localStorage.setItem('historyView', historyState.view);
    } catch {
      // sin almacenamiento
    }
    morphThumbs(renderHistory);
  })
);

/** Lista ↔ galería que se transforma (2026-10-06): cada miniatura viaja y se escala desde su sitio en la vista
 *  anterior (por trabajo); el resto entra con un fundido. Sin pareja, solo el fundido. */
function morphThumbs(render) {
  const list = document.getElementById('history-list');
  const keyOf = (t) => (t.closest('a[href]') || t.closest('li')?.querySelector('a[href]'))?.getAttribute('href');
  const old = new Map();
  if (motionOk()) list.querySelectorAll('.thumb').forEach((t) => {
    const k = keyOf(t);
    const r = t.getBoundingClientRect();
    if (k && r.width && r.bottom > -200 && r.top < window.innerHeight + 200) old.set(k, r);
  });
  render();
  if (!old.size || !list.animate) return playCascade(list);
  list.animate([{ opacity: 0.001 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
  list.querySelectorAll('.thumb').forEach((t) => {
    const was = old.get(keyOf(t));
    if (!was) return;
    const now = t.getBoundingClientRect();
    if (!now.width) return;
    const sx = was.width / now.width;
    const sy = was.height / now.height;
    t.animate(
      [
        { transformOrigin: 'top left', transform: `translate(${was.left - now.left}px, ${was.top - now.top}px) scale(${sx}, ${sy})`, opacity: 1 },
        { transformOrigin: 'top left', transform: 'none', opacity: 1 },
      ],
      { duration: 520, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' }
    );
  });
}

document.getElementById('history-search').addEventListener('input', (e) => {
  historyState.query = e.target.value;
  historyState.shown = HISTORY_PAGE;
  flipRender('history-list', renderHistory);
});
document.getElementById('history-brand').addEventListener('change', (e) => {
  historyState.brand = e.target.value;
  historyState.shown = HISTORY_PAGE;
  flipRender('history-list', renderHistory);
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
  flipRender('history-list', renderHistory);
});
document.getElementById('archived-chip').addEventListener('click', () => {
  historyState.archived = !historyState.archived;
  historyState.shown = HISTORY_PAGE;
  flipRender('history-list', renderHistory);
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
  flipRender('history-list', renderHistory);
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
  flipRender('history-list', renderHistory);
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
    link.classList.remove('thumb-logo', 'is-on-dark');
    link.classList.add('thumb-empty');
    link.textContent = img.dataset.initials || '';
  },
  true
);
document.getElementById('history-list').addEventListener('click', (e) => {
  const arch = e.target.closest('[data-archive], [data-unarchive]');
  if (arch) {
    const archived = !!arch.dataset.archive;
    const row = arch.closest('#history-list > li');
    setArchived(arch.dataset.archive || arch.dataset.unarchive, archived).then(async (ok) => {
      if (!ok) return;
      await leaveRow(row);
      loadHistory();
    });
    return;
  }
  const fam = e.target.closest('[data-family]');
  if (fam) {
    const root = fam.dataset.family;
    const closing = openFamilies.has(root);
    const toggle = async () => {
      if (closing) {
        await foldFamily(document.getElementById(fam.getAttribute('aria-controls')), false);
        openFamilies.delete(root);
      } else openFamilies.add(root);
      renderHistory();
      const btn = document.querySelector(`[data-family="${CSS.escape(root)}"]`);
      btn?.focus();
      if (!closing) foldFamily(btn && document.getElementById(btn.getAttribute('aria-controls')), true);
    };
    toggle();
    return;
  }
  const btn = e.target.closest('[data-reuse]');
  if (btn) reuseJob(btn.dataset.reuse);
  const other = e.target.closest('[data-reuse-other]');
  if (other) reuseJob(other.dataset.reuseOther, { otherBrand: true });
  const retry = e.target.closest('[data-retry]');
  if (retry) retryJobById(retry.dataset.retry, retry);
});

// "Reutilizar": rellena el formulario con la marca, el prompt y el modo de imágenes de un trabajo
// anterior (para relanzar uno fallido o hacer una variante). No se envía hasta pulsar Generar.
/** «Hacer una igual para otra marca» (2026-10-05): la misma petición con el campo Marca vacío. Al elegir la marca
 *  nueva, el nombre de la anterior se cambia por el nuevo dentro del texto («…de Lacoste para…» → «…de Puma…»). */
let reuseSwap = null;
clientNameInput.addEventListener('change', () => {
  const to = clientNameInput.value.trim();
  if (!reuseSwap || !to) return;
  const from = reuseSwap;
  reuseSwap = null;
  if (normalize(from) === normalize(to)) return;
  const prompt = document.getElementById('prompt-input');
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'giu');
  let n = 0;
  prompt.value = prompt.value.replace(re, (_m, pre) => {
    n++;
    return pre + to;
  });
  if (n) {
    saveDraft();
    showToast(`Cambiado «${from}» por «${to}» en el texto (${n} ${n === 1 ? 'vez' : 'veces'}). Revísalo antes de enviar.`);
  }
});

async function reuseJob(id, { useBrief = false, otherBrand = false } = {}) {
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
  reuseSwap = null;
  if (otherBrand) {
    reuseSwap = clientNameInput.value.trim() || job.input.clientName || null;
    clientNameInput.value = '';
    updateBrandMatch();
  }
  const radio = form.querySelector(`input[name="imageMode"][value="${job.input.imageMode}"]`);
  if (radio) radio.checked = true;
  // Lo reutilizado pasa a ser el borrador: si se recarga la página antes de enviarlo, no se pierde.
  document.getElementById('draft-note').hidden = true;
  saveDraft();
  jumpTo(form, 'start');
  (otherBrand ? clientNameInput : document.getElementById('prompt-input')).focus({ preventScroll: true });
}

// ---------------------------------------------------------------- vistas

document.getElementById('back-link').addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return; // abrir en otra pestaña
  e.preventDefault();
  scrollToHistory = true;
  if (showFormView() === false) scrollToHistory = false;
});

// Raíl vertical: los años de Feebbo hasta el actual (la web dice "2010 - 2025" escrito a mano).
document.getElementById('rail-years').textContent = `2010 – ${new Date().getFullYear()}`;

// ---------------------------------------------------------------- menú lateral (2026-10-02)
// Como el de feebbodigital.com: Nueva newsletter, Historial y Cómo funciona, más el contacto. Desde un trabajo,
// cada enlace vuelve antes a la portada (con el aviso de cambios sin guardar de showFormView).
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const menuBackdrop = document.getElementById('menu-backdrop');
// Diálogo (2026-10-05): con el menú abierto, el resto de la página queda inerte (ni foco ni clics), así el
// tabulador no se escapa a lo de detrás.
const behindMenu = ['.topbar', '#app', '.foot', '.side-rail'].map((sel) => document.querySelector(sel)).filter(Boolean);
let menuClosing = 0;
function setMenu(open, instant = false) {
  // Cierre animado (2026-10-06): sale por la derecha y la × vuelve a hamburguesa; al terminar, se oculta como antes.
  if (!open && !instant && !sideMenu.hidden && motionOk() && !menuClosing) {
    menuBtn.setAttribute('aria-expanded', 'false');
    behindMenu.forEach((el) => {
      el.inert = false;
    });
    menuBtn.focus({ preventScroll: true });
    sideMenu.inert = true;
    sideMenu.classList.add('is-closing');
    menuBackdrop.hidden = true; // el fondo transparente ya no se traga clics mientras sale
    if (menuAnim) {
      menuAnim.setDirection(-1);
      menuAnim.play();
    }
    menuClosing = setTimeout(() => {
      menuClosing = 0;
      sideMenu.classList.remove('is-closing');
      sideMenu.inert = false;
      menuAnim?.setDirection(1);
      setMenu(false, true);
    }, 300);
    return;
  }
  if (open && menuClosing) {
    clearTimeout(menuClosing);
    menuClosing = 0;
    sideMenu.classList.remove('is-closing');
    sideMenu.inert = false;
    menuAnim?.setDirection(1);
  }
  sideMenu.hidden = !open;
  menuBackdrop.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  behindMenu.forEach((el) => {
    el.inert = open;
  });
  if (open) {
    renumberMenu();
    // La × se dibuja desde la hamburguesa, como en la web (con menos movimiento, directamente la ×).
    if (menuAnim) {
      if (reduceMotion.matches) menuAnim.goToAndStop(menuAnim.totalFrames - 1, true);
      else menuAnim.goToAndPlay(0, true);
    }
    sideMenu.querySelector('[data-menu]').focus();
  } else if (!instant) menuBtn.focus({ preventScroll: true });
}
/** Los atajos solo funcionan en la página de una newsletter y con teclado: el elemento del menú, solo ahí. La
 *  numeración (01, 02…) se rehace con lo que se ve. */
const touchOnly = window.matchMedia('(hover: none)');
function renumberMenu() {
  document.getElementById('menu-shortcuts-item').hidden = viewJob.hidden || touchOnly.matches;
  let n = 0;
  sideMenu.querySelectorAll('.menu-links li').forEach((li) => {
    if (li.hidden || getComputedStyle(li).display === 'none') return;
    li.querySelector('.menu-num').textContent = String(++n).padStart(2, '0');
  });
}
renumberMenu();
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
document.getElementById('menu-close').addEventListener('click', () => setMenu(false));
menuBackdrop.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !sideMenu.hidden) setMenu(false);
});
sideMenu.addEventListener('click', (e) => {
  const item = e.target.closest('[data-menu]');
  if (!item) return;
  const where = item.dataset.menu;
  // El tema se cambia sin cerrar el menú (en móvil el botón de la cabecera no cabe y vive aquí).
  if (where === 'theme') {
    document.getElementById('theme-btn').click();
    return;
  }
  setMenu(false);
  if (where === 'shortcuts') {
    toggleShortcuts(true);
    return;
  }
  if (where === 'brands') {
    if (confirmLeaveJob()) {
      history.pushState({}, '', '?brands=1');
      route();
    }
    return;
  }
  if (viewForm.hidden) {
    if (where === 'history') scrollToHistory = true;
    if (showFormView() === false) {
      scrollToHistory = false;
      return;
    }
  }
  if (where === 'history') {
    jumpTo(document.getElementById('history'), 'start');
  } else if (where === 'how') {
    const how = document.getElementById('how-panel');
    if (how.hidden) document.getElementById('how-btn').click();
    jumpTo(how, 'center');
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    form.querySelector('textarea, input[type="text"]')?.focus({ preventScroll: true });
  }
});

// El ejemplo largo del campo Marca salía cortado en móvil («…Nike, El C»): allí, uno que cabe (2026-10-05).
{
  const brandInput = document.getElementById('client-name-input');
  const longHint = brandInput.placeholder;
  const narrow = window.matchMedia('(max-width: 640px)');
  const fitHint = () => { brandInput.placeholder = narrow.matches ? 'Marca, p. ej. Nike' : longHint; };
  fitHint();
  narrow.addEventListener('change', fitHint);
}

// ---------------------------------------------------------------- movimiento de feebbodigital.com (2026-10-05)
// Logo animado y hamburguesa → × con las animaciones Lottie oficiales de la web (studio/web/feebbo-logo.json y
// menu-icon.json); el reproductor llega con defer después de este script. Sin él (sin red, bloqueado), se queda
// la imagen fija y la × de texto. Con menos movimiento, el logo no se anima.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let menuAnim = null;
window.addEventListener('DOMContentLoaded', () => {
  if (!window.lottie) return;
  try {
    if (!reduceMotion.matches) {
      const box = document.getElementById('brand-anim');
      const logo = window.lottie.loadAnimation({ container: box, renderer: 'svg', loop: true, autoplay: true, path: '/feebbo-logo.json' });
      logo.addEventListener('DOMLoaded', () => {
        box.hidden = false;
        box.parentElement.querySelector('img').hidden = true;
      });
    }
    const mbox = document.getElementById('menu-anim');
    menuAnim = window.lottie.loadAnimation({ container: mbox, renderer: 'svg', loop: false, autoplay: false, path: '/menu-icon.json' });
    menuAnim.addEventListener('DOMLoaded', () => {
      mbox.hidden = false;
      mbox.parentElement.classList.add('has-anim');
    });
  } catch (err) {
    console.error('No se pudieron cargar las animaciones de la marca', err);
  }
});

// Cabecera fija (como la .navbar de la web): siempre a la vista; al bajar, un fondo translúcido para que se lea.
const topbar = document.querySelector('.topbar');
const markScrolled = () => topbar.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', markScrolled, { passive: true });
markScrolled();

// Entradas al hacer scroll (como las de la web), solo en la portada: títulos de sección, cifras y «Ahora mismo».
// Nunca en la vista previa ni en formularios; con menos movimiento o sin IntersectionObserver, todo quieto.
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        reveal.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -8% 0px' }
  );
  document.querySelectorAll('.section-title, #history-stats, #now-strip').forEach((el) => {
    el.classList.add('reveal');
    reveal.observe(el);
  });
}

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
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo lanzar la adaptación a móvil.'), 'error');
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
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo reintentar.'), 'error');
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

// ---------------------------------------------------------------- enviar una prueba (2026-10-05)
// Por correo de verdad (studio/server/mail.ts, Resend). Sin RESEND_API_KEY y MAIL_FROM en Railway, el bloque lo
// dice y no deja enviar. Las direcciones se recuerdan en este navegador.
const testEmailTo = document.getElementById('test-email-to');
const TEST_EMAIL_HINT = 'Hasta 5 direcciones. Llega con «[Prueba]» delante del asunto.';
let testEmailEnabled = null;
function syncTestEmail(enabled) {
  if (enabled === undefined) return; // servidor anterior: sin el dato, se deja como está
  testEmailEnabled = !!enabled;
  testEmailTo.disabled = !testEmailEnabled;
  document.getElementById('test-email-send').disabled = !testEmailEnabled;
  document.getElementById('test-email-hint').textContent = testEmailEnabled
    ? TEST_EMAIL_HINT
    : 'Aún no está activado: hay que poner RESEND_API_KEY y MAIL_FROM en las variables de Railway.';
}
try {
  testEmailTo.value = localStorage.getItem('testEmailTo') || '';
} catch {
  // sin almacenamiento
}
document.getElementById('test-email-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentJob || !testEmailEnabled) return;
  const to = testEmailTo.value.trim();
  if (!to) {
    testEmailTo.focus();
    return showToast('Escribe al menos una dirección.', 'error');
  }
  const btn = document.getElementById('test-email-send');
  btn.disabled = true;
  btn.textContent = 'Enviando…';
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo enviar la prueba.'), 'error');
    try {
      localStorage.setItem('testEmailTo', to);
    } catch {
      // sin almacenamiento
    }
    showToast(`Prueba enviada a ${data.sent} dirección${data.sent === 1 ? '' : 'es'}. Tarda un minuto en llegar.`);
  } catch {
    showToast(NETWORK_ERROR, 'error');
  } finally {
    btn.disabled = !testEmailEnabled;
    btn.textContent = 'Enviar';
  }
});

// ---------------------------------------------------------------- enseñarla al cliente (2026-10-01)

/** Enlace público de solo lectura de esta versión (studio/server/share.ts). Se arma con el origen de esta
 *  página: en Vercel, /p/* se reescribe a Railway igual que /api y /assets. */
let shareVersions = [];
let pendingJobTab = null;
function renderShare(share, versions = shareVersions) {
  shareVersions = versions;
  const active = !!share && Date.parse(share.expiresAt) > Date.now();
  document.getElementById('share-empty').hidden = active;
  document.getElementById('share-active').hidden = !active;
  renderClientReview(share);
  applyPendingJobTab();
  // El cliente ya tiene un enlace de otra versión de esta newsletter: se le puede pasar a esta (misma URL).
  const elsewhere = !active && versions.some((v) => v.shared && v.id !== currentJob);
  document.getElementById('share-move').hidden = !elsewhere;
  syncClientEmptyShare();
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
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo cambiar el enlace.'), 'error');
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
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo pasar el enlace.'), 'error');
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
      <a class="brands-all-link" href="?brands=1" data-nav>Todas las marcas</a>
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
      .map((c, n) => `<li style="--n:${n}"><span class="swatch" style="background:${c.value}"></span><span class="swatch-label">${escapeHtml(c.labels.join(' · '))}</span><code>${escapeHtml(c.value)}</code></li>`)
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
  const q = data?.quality;
  const quality = q?.points?.length
    ? (() => {
        const avg = Math.round(q.points.reduce((s, p) => s + p.pct, 0) / q.points.length);
        const last = q.points[q.points.length - 1];
        const weak = q.criteria.slice(0, 2).map((c) => `${artLabel(c.id).toLowerCase()} (${String(c.avg).replace('.', ',')})`);
        return brandSection(
          'Calidad',
          `<p>Nota media de la revisión de dirección de arte: <strong>${avg} %</strong> en ${plural(q.points.length, 'pieza', 'piezas')} · la última, ${last.pct} %.</p>` +
            artSparkline(q.points) +
            (weak.length ? `<p class="hint">Lo más flojo de esta marca: ${escapeHtml(weak.join(' y '))} (media sobre 5).</p>` : '')
        );
      })()
    : brandSection('Calidad', '<p class="hint">Todavía sin notas: salen de la revisión de dirección de arte de cada newsletter nueva.</p>');
  const readonly = `<p class="brand-readonly">Solo lectura. El brand pack lo mide el agente de marca en la web real (cada valor con su procedencia). Si algo está mal, pide en una newsletter que Hermes lo vuelva a medir, o avisa a quien mantiene el sistema.</p>`;
  body.innerHTML = head + readonly + content + assets + quality + brandSection('Newsletters de esta marca', list ? `<ul class="brand-newsletters">${list}</ul>` : '<p class="hint">Todavía ninguna.</p>');
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
  body.innerHTML = '<div class="skeleton-job" aria-busy="true"><span class="sr-only">Cargando la ficha…</span><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line is-short"></div><div class="skeleton skeleton-block"></div></div>';
  try {
    const res = await apiFetch(`/api/brands/${encodeURIComponent(slug)}`);
    const data = res.ok ? await res.json() : null;
    if (!res.ok) {
      // Antes, cualquier error decía «No se ha encontrado esa marca» (también un 502 durante un despliegue).
      body.innerHTML =
        res.status === 401
          ? '<p class="brand-empty">Inicia sesión para ver la ficha.</p>'
          : res.status === 404
          ? '<p class="brand-empty">No se ha encontrado esa marca.</p>'
          : brandRetry('Studio no responde ahora (puede estar actualizándose).');
      return;
    }
    renderBrandView(slug, data);
    document.getElementById('brand-title')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch {
    body.innerHTML = brandRetry(NETWORK_ERROR);
  }
}
// ---------------------------------------------------------------- página «Marcas» (2026-10-05)
// Todas las marcas de un vistazo: qué tiene Hermes de cada una (brand pack, logos) y qué falta. Antes los avisos
// (marcas sin logo, archivos rotos) solo se veían abriendo cada ficha. Va en la misma tarjeta que la ficha.
const brandsState = { brands: [], query: '', warnings: false };
function brandWarnings(b) {
  if (!b.hasCard) return []; // sin ficha no hay nada que arreglar: Hermes la investiga como nueva
  return [
    !b.logo ? 'Sin logo' : null,
    b.broken ? `${b.broken} archivo${b.broken === 1 ? '' : 's'} roto${b.broken === 1 ? '' : 's'}` : null,
    b.mismatched ? `${b.mismatched} que no ${b.mismatched === 1 ? 'es' : 'son'} lo que dice` : null,
  ].filter(Boolean);
}
async function showBrandsView() {
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
  document.title = `Marcas · ${BASE_TITLE}`;
  const body = document.getElementById('brand-body');
  body.innerHTML = '<div class="skeleton-job" aria-busy="true"><span class="sr-only">Cargando las marcas…</span><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-block"></div></div>';
  try {
    const res = await apiFetch('/api/brand-overview');
    if (!res.ok) {
      body.innerHTML = res.status === 401 ? '<p class="brand-empty">Inicia sesión para ver las marcas.</p>' : brandRetry('Studio no responde ahora (puede estar actualizándose).');
      return;
    }
    brandsState.brands = (await res.json()).brands || [];
    body.innerHTML = `<div class="brands-head">
        <h2 id="brand-title" tabindex="-1">Marcas</h2>
        <p class="hint">Lo que Hermes tiene de cada marca. Los avisos se arreglan en el Mac, en <code>brands/{marca}/</code>.</p>
      </div>
      <div class="brands-tools">
        <label for="brands-search" class="sr-only">Buscar marca</label>
        <input type="search" id="brands-search" placeholder="Buscar marca…" autocomplete="off" value="${escapeHtml(brandsState.query)}" />
        <div class="chips" role="group" aria-label="Filtrar marcas">
          <button type="button" class="chip" data-brands-filter="all"></button>
          <button type="button" class="chip" data-brands-filter="warnings"></button>
        </div>
      </div>
      <ul class="brands-list" id="brands-list"></ul>`;
    renderBrandsList();
    document.getElementById('brand-title').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch {
    body.innerHTML = brandRetry(NETWORK_ERROR);
  }
}
function renderBrandsList() {
  const list = document.getElementById('brands-list');
  if (!list) return;
  const q = normalize(brandsState.query);
  const withWarnings = brandsState.brands.filter((b) => brandWarnings(b).length).length;
  document.querySelectorAll('[data-brands-filter]').forEach((c) => {
    const on = (c.dataset.brandsFilter === 'warnings') === brandsState.warnings;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', String(on));
    c.textContent = c.dataset.brandsFilter === 'warnings' ? `Con avisos (${withWarnings})` : `Todas (${brandsState.brands.length})`;
  });
  const shown = brandsState.brands.filter((b) => (!brandsState.warnings || brandWarnings(b).length) && (!q || normalize(`${b.name} ${b.slug}`).includes(q)));
  const when = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  list.innerHTML = shown.length
    ? shown
        .map((b) => {
          const initials = b.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
          const logo = b.logo
            ? `<span class="bs-logo${b.logo === 'dark' ? ' is-on-dark' : ''}"><img src="/api/brands/${encodeURIComponent(b.slug)}/logo" alt="" loading="lazy"></span>`
            : `<span class="bs-logo is-initials">${escapeHtml(initials)}</span>`;
          const what = b.hasPack ? 'Brand pack medido' : b.logos ? `Solo logos (${b.logos})` : b.hasCard ? 'Sin brand pack ni logos' : b.onWorker ? 'Ficha pendiente de llegar' : 'No está en el Mac';
          const meta = [what, b.newsletters ? `${b.newsletters} newsletter${b.newsletters === 1 ? '' : 's'}` : 'ninguna newsletter', b.lastAt ? `última el ${when(b.lastAt)}` : null].filter(Boolean);
          const warns = brandWarnings(b);
          return `<li><a class="brand-row" href="?brand=${encodeURIComponent(b.slug)}" data-nav>
              ${logo}
              <span class="brand-row-body"><strong>${escapeHtml(b.name)}</strong><span class="meta">${escapeHtml(meta.join(' · '))}</span></span>
              ${warns.length ? `<span class="brand-warns">${warns.map((w) => `<span class="brand-chip-warn">${escapeHtml(w)}</span>`).join('')}</span>` : ''}
            </a></li>`;
        })
        .join('')
    : `<li class="brand-empty">${brandsState.brands.length ? 'Ninguna marca coincide.' : 'Aún no hay marcas: salen al hacer la primera newsletter o cuando el Mac de Hermes envía sus fichas.'}</li>`;
}
document.getElementById('brand-body').addEventListener('input', (e) => {
  if (e.target.id !== 'brands-search') return;
  brandsState.query = e.target.value;
  flipRender('brands-list', renderBrandsList);
});
document.getElementById('brand-body').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-brands-filter]');
  if (chip) {
    brandsState.warnings = chip.dataset.brandsFilter === 'warnings';
    flipRender('brands-list', renderBrandsList);
    return;
  }
  // Enlaces internos (ficha de una marca, «Todas las marcas») sin recargar la página.
  const a = e.target.closest('a[data-nav]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  history.pushState({}, '', a.getAttribute('href'));
  route();
});

function brandRetry(text) {
  return `<div class="form-warning brand-retry" role="status"><p>${escapeHtml(text)}</p><div class="warning-actions"><button type="button" class="btn btn-secondary btn-sm" data-brand-retry>Reintentar</button></div></div>`;
}
document.getElementById('brand-body').addEventListener('click', (e) => {
  if (!e.target.closest('[data-brand-retry]')) return;
  const params = new URLSearchParams(location.search);
  if (params.get('brand')) showBrandView(params.get('brand'));
  else if (params.has('brands')) showBrandsView();
});

// ---------------------------------------------------------------- nombre de la newsletter (2026-10-01)

let jobFamilyTitle = null;
let jobKindTitle = ''; // «Nike», «Nike · cambios»…
let jobSubject = '';
/** Con nombre del equipo, el nombre es el título y la marca va debajo; sin él, la marca es el título y debajo el
 *  asunto (2026-10-05: antes salía «Nike · cambios» de título y el nombre, más pequeño, debajo). */
function paintJobTitle() {
  document.getElementById('job-title').textContent = jobFamilyTitle || jobKindTitle;
  const sticky = document.getElementById('sticky-title');
  if (sticky) sticky.textContent = jobFamilyTitle || jobKindTitle;
}
function renderJobName(familyTitle, meta) {
  jobFamilyTitle = familyTitle || null;
  jobSubject = meta?.subject || '';
  paintJobTitle();
  if (!document.getElementById('rename-form').hidden) return; // no pisar lo que se está escribiendo
  const shown = jobFamilyTitle ? jobKindTitle : jobSubject;
  document.getElementById('job-name-row').hidden = false;
  const text = document.getElementById('job-name-text');
  text.textContent = shown;
  text.title = jobFamilyTitle ? '' : shown ? 'Asunto del correo (aún sin nombre propio)' : '';
  document.getElementById('rename-btn').textContent = jobFamilyTitle ? 'Renombrar' : 'Ponerle nombre';
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
  input.value = jobFamilyTitle || jobSubject;
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
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo renombrar.'), 'error');
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
  // «Pide cambios» sin atender (2026-10-05): antes la pestaña no avisaba (el contador solo cuenta comentarios).
  const pendingChanges = decision?.kind === 'changes' && !decision.resolvedAt;
  const open = current.filter((c) => !c.resolvedAt).length;
  document.getElementById('tab-client').hidden = !clientShare;
  if (!clientShare && activeJobTab === 'client') showJobTab('preview');
  const badge = document.getElementById('tab-client-badge');
  badge.textContent = decision?.kind === 'approved' ? '✓' : open ? String(open) : pendingChanges ? '!' : '';
  badge.className = `tab-badge${decision?.kind === 'approved' ? ' is-ok' : open || pendingChanges ? ' is-warning' : ''}`;
  badge.title = pendingChanges ? 'El cliente pide cambios' : '';
  const decEl = document.getElementById('client-decision');
  decEl.hidden = !decision;
  if (decision) {
    const when = new Date(decision.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    decEl.className = `client-decision is-${decision.kind}${decision.resolvedAt ? ' is-resolved' : ''}`;
    const resolvedWhen = decision.resolvedAt ? new Date(decision.resolvedAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const control = decision.kind !== 'changes'
      ? ''
      : decision.resolvedAt
      ? `<span class="decision-resolved">Atendida${decision.resolvedBy ? ` por ${escapeHtml(decision.resolvedBy)}` : ''} · ${escapeHtml(resolvedWhen)} · <button type="button" class="link-btn" data-decision-resolve="0">Deshacer</button></span>`
      : `<button type="button" class="btn btn-secondary btn-sm decision-resolve" data-decision-resolve="1">Marcar como atendido</button>`;
    decEl.innerHTML = `${decision.kind === 'approved' ? '✓ El cliente ha aprobado esta versión' : 'El cliente pide cambios'} · <strong>${escapeHtml(decision.author)}</strong>, ${escapeHtml(when)}${
      decision.note ? `<span class="c-text">${escapeHtml(decision.note)}</span>` : ''
    }${control}`;
  }
  document.getElementById('client-empty').hidden = !!(current.length || decision);
  syncClientEmptyShare();
  document.getElementById('client-comments').innerHTML = current.map((c) => clientCommentItem(c, true)).join('');
  document.getElementById('client-actions').hidden = !(open || (pendingChanges && decision.note));
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

// «Marcar como atendido» la decisión del cliente (2026-10-05): sale de «Te esperan» y del aviso; queda en el registro.
document.getElementById('client-decision').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-decision-resolve]');
  if (!btn || !clientShare?.decision) return;
  const resolved = btn.dataset.decisionResolve === '1';
  btn.disabled = true;
  try {
    const res = await apiFetch(`/api/jobs/${encodeURIComponent(currentJob)}/share/decision/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved, by: savedRequester() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo cambiar la decisión.'), 'error');
    clientShare.decision = data.decision;
    renderClientReview(clientShare);
    showToast(resolved ? 'Marcada como atendida.' : 'Vuelve a estar pendiente.');
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
  jumpTo(reviseBox, 'center');
  input.focus({ preventScroll: true });
  showToast('Comentarios del cliente pasados a «Pedir cambios»: revísalos y envíalos a Hermes.');
});
document.getElementById('share-revoke').addEventListener('click', () => shareRequest('DELETE'));

/** El botón de la pestaña Cliente vacía hace lo mismo que el bloque «Enséñala al cliente»: copiar el enlace de
 *  esta versión o, si apunta a otra, pasarlo a esta. Sin ninguno de los dos, no sale (2026-10-05). */
function syncClientEmptyShare() {
  const btn = document.getElementById('client-empty-share');
  const copy = !document.getElementById('share-active').hidden;
  const move = !copy && !document.getElementById('share-move').hidden;
  btn.hidden = !(copy || move);
  btn.textContent = copy ? 'Copiar el enlace del cliente' : 'Pasar el enlace del cliente a esta versión';
  btn.dataset.target = copy ? 'share-copy' : 'share-move';
}
document.getElementById('client-empty-share').addEventListener('click', (e) => {
  document.getElementById(e.currentTarget.dataset.target)?.click();
});
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

// Visible solo cuando la barra de resultado ha quedado por ENCIMA de la pantalla (se ha bajado). Por debajo de
// 1200 px las acciones van debajo de la vista previa (2026-10-05): ahí, también mientras quedan por DEBAJO.
const narrowJob = window.matchMedia('(max-width: 1199px)');
new IntersectionObserver(([entry]) => {
  resultBarHidden = !entry.isIntersecting && (entry.boundingClientRect.top < 0 || narrowJob.matches);
  updateSticky();
}).observe(document.querySelector('.result-bar'));
document.getElementById('sticky-more').addEventListener('click', () => {
  jumpTo(document.querySelector('.job-side'), 'start');
});

document.getElementById('sticky-copy').addEventListener('click', () => document.getElementById('copy-html-btn').click());
// Aprobar desde la barra fija (2026-10-07): abre la aprobación del lateral.
document.getElementById('sticky-approve').addEventListener('click', () => {
  const btn = document.getElementById('approve-btn');
  if (!btn.hidden && btn.getAttribute('aria-expanded') !== 'true') btn.click();
  jumpTo(document.getElementById('approve-box').hidden ? btn : document.getElementById('approve-box'), 'center');
});
document.getElementById('sticky-revise').addEventListener('click', () => {
  toggleRevise(true);
  jumpTo(reviseBox, 'center');
});
document.getElementById('sticky-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---------------------------------------------------------------- revisar el brief (2026-10-01)

const reviewText = document.getElementById('review-brief-text');
const reviewError = document.getElementById('review-error');
const reviewView = document.getElementById('review-brief-view');
const reviewEditBtn = document.getElementById('review-edit');

/** Con formato (por defecto) o el cuadro para corregirlo. Al volver al formato se ve lo corregido. */
function setBriefEditing(on) {
  reviewText.hidden = !on;
  reviewView.hidden = on;
  reviewEditBtn.setAttribute('aria-pressed', String(on));
  reviewEditBtn.textContent = on ? 'Ver con formato' : 'Corregir el brief';
  if (!on) reviewView.innerHTML = window.HermesMarkdown ? window.HermesMarkdown.render(reviewText.value) : escapeHtml(reviewText.value);
}
reviewEditBtn.addEventListener('click', () => {
  const on = reviewText.hidden;
  setBriefEditing(on);
  if (on) reviewText.focus();
});

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
    setBriefEditing(false);
  }
  document.getElementById('review-restore').hidden = reviewText.value === reviewText.dataset.src;
  const missing = document.getElementById('review-missing');
  const gaps = job.briefMissing || [];
  missing.hidden = !gaps.length;
  if (gaps.length) {
    const list = gaps.length === 1 ? gaps[0] : `${gaps.slice(0, -1).join(', ')} y ${gaps[gaps.length - 1]}`;
    missing.innerHTML = `<strong>Ojo:</strong> tu petición pide <strong>${escapeHtml(list)}</strong> y el brief de Hermes no lo recoge. Añádelo con «Corregir el brief» antes de aprobarlo.`;
  }
  const waiting = document.getElementById('review-waiting');
  waiting.hidden = !job.briefReadyAt;
  if (job.briefReadyAt) {
    const sec = (Date.now() - Date.parse(job.briefReadyAt)) / 1000;
    const at = new Date(job.briefReadyAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    waiting.textContent = `Hermes está parado esperando tu aprobación desde las ${at}${sec >= 60 ? ` (${formatMinutes(sec)})` : ''}. Esta espera no cuenta en lo que tarda.`;
  }
}
reviewText.addEventListener('input', () => {
  document.getElementById('review-restore').hidden = reviewText.value === reviewText.dataset.src;
});
document.getElementById('review-restore').addEventListener('click', () => {
  reviewText.value = reviewText.dataset.src || '';
  document.getElementById('review-restore').hidden = true;
  if (reviewText.hidden) setBriefEditing(false);
  else reviewText.focus();
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
      reviewError.textContent = actionError(res, data, 'No se pudo aprobar el brief.', true);
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
      document.getElementById('progress-detail').textContent = actionError(res, data, 'No se pudo cancelar.');
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
// Cambio solo de texto (2026-10-05): se propone «Editar texto», que no espera a Hermes.
document.getElementById('revise-input').addEventListener('input', (e) => {
  document.getElementById('revise-text-hint').hidden = !HermesFormCheck.isSimpleTextChange(e.target.value) || /\[Señalado:[^\]]*imagen/i.test(e.target.value);
});
document.getElementById('revise-to-textedit').addEventListener('click', () => {
  document.getElementById('revise-text-hint').hidden = true;
  document.getElementById('revise-close').click();
  document.getElementById('edit-text-btn').click();
});
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
      reviseError.textContent = actionError(res, data, 'No se pudieron enviar los cambios.', true);
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
      jumpTo(reviseBox, 'center');
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
  jumpTo(document.getElementById('pick-banner'), 'start');
});
document.getElementById('pick-cancel').addEventListener('click', () => {
  setPicking(false);
  jumpTo(reviseBox, 'center');
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
    jumpTo(teBox, 'start');
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
      errorEl.textContent = actionError(res, data, 'No se pudo guardar.', true);
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
  document.getElementById('sticky-approve').hidden = approveBtn.hidden;
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
  jumpTo(approveBox, 'nearest');
}

approveBtn.addEventListener('click', () => toggleApprove(approveBox.hidden));
document.getElementById('approve-checklist').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-check-go]');
  if (!btn) return;
  const go = APPROVAL_GO[Number(btn.dataset.checkGo)];
  go.go();
  jumpTo(document.querySelector(go.target || '#preview-stage'), 'start');
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
  celebrateApproval(document.getElementById('approve-submit'));
  toggleApprove(false);
  showToast('Versión aprobada para envío.');
  poll(currentJob);
  stampApproval();
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
    showToast(actionError(res, data, 'No se pudo archivar.'), 'error');
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
  document.getElementById('job-more').open = false;
  if (currentJob && (await setArchived(currentJob, true))) poll(currentJob);
});
document.getElementById('reuse-other-btn').addEventListener('click', () => {
  document.getElementById('job-more').open = false;
  if (currentJob) reuseJob(currentJob, { otherBrand: true });
});
// El menú «⋯» del pie de la ficha se cierra al pulsar fuera o con Escape, como los del historial.
document.addEventListener('click', (e) => {
  const more = document.getElementById('job-more');
  if (more.open && !e.target.closest('#job-more')) more.open = false;
});
document.addEventListener('keydown', (e) => {
  const more = document.getElementById('job-more');
  if (e.key === 'Escape' && more.open) {
    more.open = false;
    more.querySelector('summary').focus();
  }
});
document.getElementById('unarchive-btn').addEventListener('click', async () => {
  if (currentJob && (await setArchived(currentJob, false))) poll(currentJob);
});

// ---------------------------------------------------------------- atajos de teclado (2026-09-28)
const shortcuts = document.getElementById('shortcuts');

// Se abren con «?» o desde el menú lateral (2026-10-05: antes, un enlace al pie de cada ficha). Al cerrar, el foco
// vuelve a donde estaba.
let shortcutsReturn = null;
function toggleShortcuts(open) {
  shortcuts.hidden = !open;
  // Atajos que se pulsan (2026-10-06): al abrir, las teclas se hunden una tras otra.
  if (open && motionOk()) shortcuts.querySelectorAll('dt kbd').forEach((k, n) => pressKey(k, 260 + n * 80));
  if (open) {
    shortcutsReturn = document.activeElement !== document.body ? document.activeElement : null;
    document.getElementById('shortcuts-close').focus();
  } else (shortcutsReturn?.isConnected ? shortcutsReturn : menuBtn).focus({ preventScroll: true });
}
document.getElementById('shortcuts-close').addEventListener('click', () => toggleShortcuts(false));
function pressKey(k, delay = 0) {
  setTimeout(() => {
    k.classList.remove('is-pressed');
    void k.offsetWidth;
    k.classList.add('is-pressed');
    setTimeout(() => k.classList.remove('is-pressed'), 260);
  }, delay);
}
// Con el diálogo abierto, la tecla que se pulsa se hunde.
document.addEventListener('keydown', (e) => {
  if (shortcuts.hidden || !motionOk() || e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  shortcuts.querySelectorAll('dt kbd').forEach((k) => k.textContent.trim().toUpperCase() === key.toUpperCase() && pressKey(k));
});
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
  // La pestaña va en la dirección (2026-10-05): así se puede compartir «mira el asunto» o recargar sin perderla.
  if (currentJob && !viewJob.hidden) {
    const url = `?job=${encodeURIComponent(currentJob)}${name === 'preview' ? '' : `&tab=${name}`}`;
    if (location.search !== url) history.replaceState(history.state, '', url);
  }
}

/** ?tab=… (enlace directo): se abre esa pestaña en cuanto aparece. «Qué ha cambiado» y «Asunto y bandeja» salen
 *  después de los datos del enlace del cliente, y antes solo se miraba entonces: abrían la vista previa (2026-10-05). */
function applyPendingJobTab() {
  if (!pendingJobTab || document.getElementById(`tab-${pendingJobTab}`).hidden) return;
  showJobTab(pendingJobTab);
  document.querySelector('.job-tabs').scrollIntoView({ block: 'start' });
  pendingJobTab = null;
}

function syncJobTabs() {
  const hasCompare = !document.getElementById('compare').hidden;
  const hasMeta = !document.getElementById('email-meta').hidden || !document.getElementById('inbox').hidden;
  document.getElementById('tab-compare').hidden = !hasCompare;
  document.getElementById('tab-meta').hidden = !hasMeta;
  if ((activeJobTab === 'compare' && !hasCompare) || (activeJobTab === 'meta' && !hasMeta)) showJobTab('preview');
  applyPendingJobTab();
}
const jobTabsObserver = new MutationObserver(syncJobTabs);
['compare', 'email-meta', 'inbox'].forEach((id) =>
  jobTabsObserver.observe(document.getElementById(id), { attributes: true, attributeFilter: ['hidden'] })
);

document.querySelector('.job-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (!tab) return;
  pendingJobTab = null; // lo elegido a mano manda sobre el enlace con el que se llegó
  showJobTab(tab.dataset.tab);
});
document.querySelector('.job-tabs').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const visible = JOB_TABS.filter((t) => !document.getElementById(`tab-${t}`).hidden);
  const i = visible.indexOf(activeJobTab);
  const next =
    e.key === 'Home' ? 0 : e.key === 'End' ? visible.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length;
  e.preventDefault();
  pendingJobTab = null;
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
  resetFrame(document.getElementById('preview-frame-mobile'));
  resetCompare();
  document.getElementById('versions').hidden = true;
  document.getElementById('job-parent').hidden = true;
  document.getElementById('brief-box').hidden = true;
  document.getElementById('brief-box').open = false;
  document.getElementById('brief-text').innerHTML = '';
  document.getElementById('brief-text').dataset.src = '';
  document.getElementById('job-title').textContent = '';
  jobFamilyTitle = null;
  jobKindTitle = '';
  jobSubject = '';
  document.getElementById('job-meta').textContent = '';
  document.getElementById('job-skeleton').hidden = false;
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
    document.getElementById('job-skeleton').hidden = true;
    document.getElementById('job-title').textContent = res.status === 401 ? 'Inicia sesión para ver este trabajo' : 'Trabajo no encontrado';
    return;
  }
  document.getElementById('job-skeleton').hidden = true;
  const { job, events, notes, meta, queue, hermesOnline, versions, retriedBy, familyTitle, clientMatrix: matrix } = await res.json();
  renderJobName(familyTitle, meta);
  renderVersions(job, versions || []);
  currentJobData = job;
  currentVersions = versions || [];
  renderApproval(job, currentVersions);
  renderArchived(job);
  updateTabTitle(job);
  maybeNotify(job);

  jobKindTitle = job.input.revisionOf
    ? `${job.input.clientName} · cambios`
    : job.input.mobileFixOf
    ? `${job.input.clientName} · adaptación a móvil`
    : job.input.textEditOf
    ? `${job.input.clientName} · texto editado`
    : job.input.clientName;
  paintJobTitle();
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
      durationSec:
        job.startedAt && job.finishedAt ? (Date.parse(job.finishedAt) - Date.parse(job.startedAt)) / 1000 - (job.briefWaitSec || 0) : null,
      elapsedSec: job.progress?.elapsedSec,
      briefWaitSec: job.briefWaitSec,
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
      // La barra fija solo se recalculaba cuando la zona de acciones entraba o salía de la pantalla: en móvil, al
      // abrir una newsletter terminada (acciones debajo de la vista previa) no llegaba a salir (2026-10-05).
      requestAnimationFrame(() => {
        const r = document.querySelector('.result-bar').getBoundingClientRect();
        resultBarHidden = r.bottom < 0 || (narrowJob.matches && r.top > window.innerHeight);
        updateSticky();
      });
      document.getElementById('download-link').href = `/api/jobs/${id}/result?download=1`;
      document.getElementById('sticky-download').href = `/api/jobs/${id}/result?download=1`;
      document.getElementById('open-link').href = `/api/jobs/${id}/result`;
      applyPreviewView(job.input.mobileFixOf ? 'mobile' : readPreviewView());
      document.querySelector(`input[name="previewTheme"][value="${readTheme()}"]`).checked = true;
      document.getElementById('mobile-fix-btn').hidden = !!job.input.mobileFixOf;
      renderReview(job.quality, notes, matrix);
      unfoldPreview(id);
      renderTimings(job.timings, job.briefWaitSec);
      renderArtReview(job.artReview);
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
  if (box.hidden) {
    renderMetaWarnings(meta, null);
    return;
  }
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
  renderMetaWarnings(meta, mSub);
}

/** Avisos de asunto y preheader (2026-10-05) y su número en la pestaña. */
function renderMetaWarnings(meta, mobileSubjectChars) {
  const list = document.getElementById('meta-warnings');
  const badge = document.getElementById('tab-meta-badge');
  const warnings = meta && window.HermesMetaCheck ? window.HermesMetaCheck.checkMeta(meta.subject, meta.preheader, { mobileSubjectChars }) : [];
  list.hidden = !warnings.length;
  list.innerHTML = warnings.map((w) => `<li class="is-${escapeHtml(w.level)}">${escapeHtml(w.text)}</li>`).join('');
  const serious = warnings.filter((w) => w.level === 'warning').length;
  badge.textContent = serious ? String(serious) : '';
  badge.className = `tab-badge${serious ? ' is-warning' : ''}`;
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
    confirmCopy();
    return;
  } catch {
    // sigue con el método clásico
  }
  if (copyWithSelection(text)) {
    showToast(okMessage);
    confirmCopy();
  } else showToast(`No se pudo copiar: el navegador no dio permiso para usar el portapapeles. ${failHint}`, 'error');
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
    // Comprobaciones que se marcan (2026-10-06): la 1.ª vez de cada pieza, los puntos entran uno tras otro y su
    // estado salta al llegar. Los refrescos de la misma pieza no lo repiten.
    if (motionOk() && list.dataset.animFor !== currentJob) {
      list.dataset.animFor = currentJob || '';
      [...list.children].forEach((li, n) => {
        li.style.setProperty('--n', String(n));
        li.classList.add('is-ticking');
        setTimeout(() => li.classList.remove('is-ticking'), 900 + n * 90);
      });
    }
  }
  renderClientMatrix();

  const notesBox = document.getElementById('notes-box');
  notesBox.hidden = !notes;
  notesBox.open = false;
  document.getElementById('notes-text').innerHTML = notes && window.HermesMarkdown ? window.HermesMarkdown.render(notes) : '';
}

// Tiempo por fase (2026-10-05, studio/worker/timeline.ts): identidad medida, brief, primera versión, comprobación,
// correcciones, revisión visual. Una barra por fase, proporcional a la más larga; las esperas al modelo que hubo
// que cortar y las rondas de corrección, en el resumen.
function mmss(sec) {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- calidad (2026-10-06, punto 7)
// Notas de la revisión de dirección de arte (studio/worker/hermes-worker.ts): por pieza, en el historial y por marca.
const ART_LABELS = {
  peticion: 'Petición', texto_imagen: 'Texto e imagen', identidad: 'Identidad', concepto: 'Concepto', jerarquia: 'Jerarquía',
  aire: 'Aire', originalidad: 'Originalidad', movil: 'Móvil', oscuro: 'Oscuro', copy: 'Copy',
};
const artLabel = (k) => ART_LABELS[k] || k;
const artFinal = (a) => (a.after && a.kept !== false ? a.after : a.before);
const artPctOf = (notes) => {
  const n = Object.values(notes || {});
  return n.length ? Math.round((n.reduce((x, y) => x + y, 0) / (n.length * 5)) * 100) : null;
};

function renderArtReview(a) {
  const box = document.getElementById('art-box');
  box.hidden = !a?.before;
  renderArtCard(a);
  if (box.hidden) return;
  const fin = artFinal(a);
  const before = artPctOf(a.before);
  const pct = artPctOf(fin);
  document.getElementById('art-sum').textContent = [
    a.after ? (a.kept === false ? `${before} % (la mejora empeoraba: se quedó la versión anterior)` : `${before} % → ${pct} %`) : `${pct} %`,
    a.web ? 'comparada con la web de la marca' : null,
    a.backfill ? 'puntuada después, sin pasada de mejora' : null,
  ]
    .filter(Boolean)
    .join(' · ');
  document.getElementById('art-list').innerHTML = Object.keys(a.before)
    .map((k) => {
      const b = a.before[k];
      const f = fin[k] ?? b;
      const change = f !== b ? ` <span class="hint">(${b} → ${f})</span>` : '';
      return (
        `<li><span class="timings-label">${escapeHtml(artLabel(k))}</span>` +
        `<span class="timings-bar art-bar${f < 4 ? ' is-low' : ''}" aria-hidden="true"><span style="width:${f * 20}%"></span></span>` +
        `<span class="timings-time">${f}/5${change}</span></li>`
      );
    })
    .join('');
  drawArtBars();
  const list = (title, items) => (items?.length ? `<p class="art-notes-title">${title}</p><ul class="art-notes">${items.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : '');
  document.getElementById('art-notes').innerHTML = list('Problemas que vio', a.problemas) + list('Mejoras que propuso', a.mejoras);
}

/** Nota de arte en el lateral (2026-10-07): la nota final y sus cinco criterios en barras, siempre a la vista junto a
 *  la pieza. «Ver detalle» abre la revisión completa (problemas y mejoras) en su pestaña. */
let artCardFor = null;
function renderArtCard(a) {
  const card = document.getElementById('art-card');
  if (!card) return;
  card.hidden = !a?.before;
  if (card.hidden) {
    artCardFor = null;
    return;
  }
  const fin = artFinal(a);
  const pct = artPctOf(fin);
  const tone = pct >= 76 ? 'high' : pct >= 60 ? 'mid' : 'low';
  const key = `${currentJob}|${JSON.stringify(fin)}`;
  const fresh = key !== artCardFor;
  artCardFor = key;
  card.className = `art-card is-${tone}${fresh && motionOk() ? ' is-drawing' : ''}`;
  card.innerHTML =
    `<div class="art-card-head"><span class="art-card-pct">${pct}<small> %</small></span><span class="art-card-title">Dirección de arte<small>${
      a.after && a.kept !== false ? `mejorada desde ${artPctOf(a.before)} %` : a.backfill ? 'puntuada después' : 'nota de Hermes'
    }</small></span><button type="button" class="link-btn" id="art-card-more">Ver detalle</button></div>` +
    `<ul class="art-card-bars">${Object.keys(fin)
      .map(
        (k, i) =>
          `<li style="--i:${i}"><span>${escapeHtml(artLabel(k))}</span><span class="art-card-bar${fin[k] < 4 ? ' is-low' : ''}"><i style="--w:${fin[k] * 20}%"></i></span><b>${fin[k]}</b></li>`
      )
      .join('')}</ul>`;
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('#art-card-more')) return;
  showJobTab('review');
  const box = document.getElementById('art-box');
  box.open = true;
  jumpTo(box, 'start');
});

/** Gráfico pequeño de las notas por fecha (SVG, sin librerías). */
function artSparkline(points) {
  if (points.length < 2) return '';
  const w = 280, h = 64, pad = 6;
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / (points.length - 1));
  // Escala ajustada a las notas (entre la peor y la mejor, con margen): con 0-100 fijo, 70→88 parecía una recta.
  const lo = Math.max(0, Math.min(...points.map((p) => p.pct)) - 5);
  const hi = Math.min(100, Math.max(...points.map((p) => p.pct)) + 5);
  const ys = points.map((p) => h - pad - ((p.pct - lo) / Math.max(1, hi - lo)) * (h - 2 * pad));
  const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return `<svg class="art-spark is-drawing" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Nota de cada pieza por fecha">` +
    `<path d="${line}" pathLength="1" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>` +
    xs.map((x, i) => `<circle style="--i:${i}" cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="3"><title>${escapeHtml(new Date(points[i].createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))}: ${points[i].pct} %</title></circle>`).join('') +
    `</svg>`;
}

function renderTimings(t, briefWaitSec) {
  const box = document.getElementById('timings-box');
  box.hidden = !t?.phases?.length;
  if (box.hidden) return;
  // Las comprobaciones se repiten tras cada corrección: se suman en una sola fila.
  const rows = [];
  for (const p of t.phases) {
    const same = p.id === 'check' && rows.find((r) => r.id === 'check');
    if (same) {
      same.sec += p.sec;
      same.times = (same.times || 1) + 1;
    } else rows.push({ ...p });
  }
  const max = Math.max(1, ...rows.map((r) => r.sec));
  document.getElementById('timings-sum').textContent = [
    `total ${mmss(t.totalSec)}`,
    t.rounds ? plural(t.rounds, 'corrección', 'correcciones') : 'sin correcciones',
    t.hangs?.count ? `${plural(t.hangs.count, 'espera cortada', 'esperas cortadas')} (${mmss(t.hangs.sec)})` : null,
    briefWaitSec >= 60 ? `aparte, ${mmss(briefWaitSec)} esperando tu aprobación del brief` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  document.getElementById('timings-list').innerHTML = rows
    .map(
      (r) =>
        `<li><span class="timings-label">${escapeHtml(r.label)}${r.times > 1 ? ` <span class="hint">×${r.times}</span>` : ''}</span>` +
        `<span class="timings-bar" aria-hidden="true"><span style="width:${Math.max(2, Math.round((r.sec / max) * 100))}%"></span></span>` +
        `<span class="timings-time">${mmss(r.sec)}${r.actions ? ` <span class="hint">· ${plural(r.actions, 'acción', 'acciones')}</span>` : ''}</span></li>`
    )
    .join('');
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
    if (!res.ok) return showToast(actionError(res, data, 'No se pudo cambiar el enlace del informe.'), 'error');
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
  both: { width: null, label: 'Escritorio 800 px y móvil 375 px' },
};

/** Sin vista elegida antes, en pantallas estrechas se abre en Móvil: Escritorio cabía al 33 %, ilegible
 *  en un teléfono (2026-10-01). Una elección guardada, incluida Escritorio, se respeta. */
function readPreviewView() {
  const fallback = window.matchMedia('(max-width: 600px)').matches ? 'mobile' : 'desktop';
  try {
    const v = localStorage.getItem('previewView');
    return v === 'mobile' || v === 'free' || v === 'desktop' || (v === 'both' && !fallback.startsWith('m')) ? v : fallback;
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
  // «Los dos» (2026-10-07): escritorio y móvil lado a lado (con «Antes y después» no: ya hay dos columnas).
  const both = view === 'both' && !compare;
  stage.classList.toggle('is-both', both);
  document.getElementById('preview-col-mobile').hidden = !both;
  const cols = [['preview-col-after', 'preview-device']];
  if (compare) cols.unshift(['preview-col-before', 'preview-device-before']);
  if (both) cols.push(['preview-col-mobile', 'preview-device-mobile']);
  for (const [colId, deviceId] of cols) {
    const device = document.getElementById(deviceId);
    const col = document.getElementById(colId);
    if (deviceId !== 'preview-device-mobile') device.classList.toggle('is-mobile', view === 'mobile');
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
  // El relleno real del escenario (antes 32 fijo): en móvil va sin relleno para verse al 100 % (2026-10-05).
  const stageStyle = getComputedStyle(stage);
  const pad = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
  const mobileDevice = document.getElementById('preview-device-mobile');
  const available = both ? stage.clientWidth - pad - 24 : (stage.clientWidth - pad - (compare ? gap : 0)) / (compare ? 2 : 1);
  const needed = document.getElementById('preview-device').offsetWidth + (both ? mobileDevice.offsetWidth : 0);
  const scale = needed > available && available > 0 ? available / needed : 1;
  if (scale < 1) {
    for (const [colId, deviceId] of cols) {
      const device = document.getElementById(deviceId);
      const col = document.getElementById(colId);
      const label = col.querySelector('.preview-label');
      const labelHeight = label && !label.hidden ? label.offsetHeight + 8 : 0;
      device.style.transform = `scale(${scale})`;
      col.style.width = `${Math.floor((both ? device.offsetWidth : needed) * scale)}px`;
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
  // Sin preferencia guardada, se resalta solo cuando ayuda: pocos cambios respecto a la versión de la que sale
  // (2026-10-05). Con decenas, la vista previa se llenaba de recuadros verdes y no se veía la pieza.
  if (storedHighlight() === null) document.getElementById('highlight-toggle').checked = isParent && changes <= HIGHLIGHT_MAX;
  markChanges('after');
  annotateLocations();
  document.getElementById('preview-label-before').textContent = isParent ? `Antes · versión ${base.number}` : `Versión ${base.number}`;
  document.getElementById('preview-label-after').textContent = isParent ? `Después · versión ${self.number}` : `Versión ${self.number} (esta)`;
  if (document.getElementById('compare-toggle').checked) renderFrame('before');
}

// ---------------------------------------------------------------- avisos y cambios → sitio en la pieza

/** Resaltar cambios (2026-09-28): verde lo añadido en esta versión y, en "Antes y después", rojo lo que
 *  se quitó en la anterior. Se vuelve a pintar en cada carga del marco (tema, comparación). */
const HIGHLIGHT_MAX = 12;
/** true/false si quien usa la página lo eligió a mano; null si nunca lo tocó. */
function storedHighlight() {
  try {
    const v = localStorage.getItem('highlightChanges');
    return v === '1' ? true : v === '0' ? false : null;
  } catch {
    return null;
  }
}
function readHighlight() {
  return storedHighlight() ?? false;
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
    if (r.value === 'both') renderMobileFrame();
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
const revealedPreviews = new Set();
function renderFrame(which) {
  const frame = document.getElementById(which === 'before' ? 'preview-frame-before' : 'preview-frame');
  const html = which === 'before' ? compareBeforeHtml : currentHtml;
  if (!html) return;
  const theme = currentTheme();
  frame.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  // Vista previa que se revela (2026-10-06): la primera vez de cada pieza en la sesión, una capa se retira de arriba
  // abajo con una línea de luz. Cambiar de tema o recargar el marco no la repite.
  const reveal = which !== 'before' && currentJob && motionOk() && !revealedPreviews.has(currentJob);
  if (reveal) revealedPreviews.add(currentJob);
  frame.onload = () => {
    fitFrames();
    if (reveal) {
      const device = document.getElementById('preview-device');
      device.classList.remove('is-revealing');
      void device.offsetWidth;
      device.classList.add('is-revealing');
      setTimeout(() => device.classList.remove('is-revealing'), 1100);
    }
    if (which !== 'before') armPreview();
    else if (frame.contentDocument?.body) {
      ensureStudioStyle(frame.contentDocument);
      markChanges('before');
    }
  };
  frame.srcdoc = themedHtml(html, theme);
  if (which !== 'before') renderMobileFrame();
}

/** La copia a 375 px de «Los dos»: solo se pinta con esa vista elegida. */
function renderMobileFrame() {
  const frame = document.getElementById('preview-frame-mobile');
  if (readCheckedView() !== 'both' || !currentHtml) return;
  const theme = currentTheme();
  frame.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  frame.onload = () => fitFrames();
  frame.srcdoc = themedHtml(currentHtml, theme);
}

/** Alto de cada vista previa = alto real de la pieza a ese ancho. */
function fitFrames() {
  for (const id of ['preview-frame', 'preview-frame-before', 'preview-frame-mobile']) {
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
    // Fundido al cambiar claro/oscuro/invertido (2026-10-06), en vez de un salto.
    if (motionOk()) document.getElementById('preview-device')?.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
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

// Fases como pasos numerados (2026-10-05): las mismas que deduce el worker (hermes-worker.ts, STAGES y EDIT_LABELS)
// más el brief, si se pidió con una frase, y la revisión automática del final, que no tiene fase propia: se marca
// hecha al terminar.
const STEP_LABELS = { preparando: 'Preparar: brand pack e identidad', investigando: 'Investigar la marca', escribiendo: 'Escribir la newsletter', revisando: 'Revisar y corregir' };
const STEP_EDIT_LABELS = { preparando: 'Leer la versión original', investigando: 'Buscar lo que pide el cambio', escribiendo: 'Aplicar los cambios', revisando: 'Revisar y corregir' };
function renderProgressSteps(job) {
  const list = document.getElementById('progress-steps');
  const edit = !!(job.input.revisionOf || job.input.mobileFixOf);
  const labels = edit ? STEP_EDIT_LABELS : STEP_LABELS;
  const steps = [
    ...(job.input.instruction && !job.input.briefReused ? [['brief', 'Escribir el brief creativo']] : []),
    ...Object.entries(labels),
    ['calidad', 'Revisión automática de Studio'],
  ];
  const p = job.progress;
  // Fase desconocida (o aún sin progreso): por el porcentaje, con los tramos del worker (15, 45 y 75 %).
  const byPct = !p ? 'preparando' : p.pct < 15 ? 'preparando' : p.pct < 45 ? 'investigando' : p.pct < 75 ? 'escribiendo' : 'revisando';
  const stage = steps.some(([id]) => id === p?.stage) ? p.stage : byPct;
  let current = job.status === 'running' ? Math.max(0, steps.findIndex(([id]) => id === stage)) : -1;
  if (job.status === 'completed') current = steps.length;
  list.innerHTML = steps
    .map(([, label], i) => {
      const state = i < current ? 'is-done' : i === current ? 'is-current' : '';
      return `<li class="${state}"${i === current ? ' aria-current="step"' : ''}><span class="step-num">${String(i + 1).padStart(2, '0')}</span><span class="step-label">${escapeHtml(label)}</span></li>`;
    })
    .join('');
}

/** Cifras que ruedan (2026-10-06): cada dígito es una columna 0-9 que gira hasta su valor; solo giran los que cambian.
 *  El texto entero va aparte para lectores de pantalla. Si cambia la forma del texto, se rehace sin animar. */
const ROLL_DIGITS = '0123456789'.split('').map((d) => `<span>${d}</span>`).join('');
function rollText(el, text) {
  if (!motionOk()) {
    el.textContent = text;
    delete el.dataset.roll;
    return;
  }
  const skel = text.replace(/\d/g, '0');
  if (el.dataset.roll !== skel) {
    el.innerHTML = `<span class="sr-only">${escapeHtml(text)}</span><span aria-hidden="true">${[...text]
      .map((ch) => (/\d/.test(ch) ? `<span class="roll"><span class="roll-col" style="--d:${ch}">${ROLL_DIGITS}</span></span>` : escapeHtml(ch)))
      .join('')}</span>`;
    el.dataset.roll = skel;
    return;
  }
  el.querySelector('.sr-only').textContent = text;
  const cols = el.querySelectorAll('.roll-col');
  let i = 0;
  for (const ch of text) if (/\d/.test(ch)) cols[i++].style.setProperty('--d', ch);
}
function plainText(el, text) {
  delete el.dataset.roll;
  el.textContent = text;
}

function renderProgress(job, queue, hermesOnline) {
  const box = document.getElementById('job-progress');
  renderProgressSteps(job);
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
    plainText(document.getElementById('progress-stage'), queue?.ahead
      ? `En cola · ${queue.ahead} trabajo${queue.ahead === 1 ? '' : 's'} delante`
      : 'En cola · eres el siguiente');
    plainText(document.getElementById('progress-eta'), queue?.ahead ? `empezará en unos ${formatMinutes(queue.startsInSec)}, hacia las ${clockAt(queue.startsInSec)} (estimado)` : '');
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
      plainText(document.getElementById('progress-stage'), 'Arrancando Hermes');
      plainText(document.getElementById('progress-eta'), '');
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
  rollText(document.getElementById('progress-stage'), `${p.stageLabel} · ${p.pct}%`);
  const eta = document.getElementById('progress-eta');
  eta.classList.remove('is-idle');
  if (job.status === 'completed') {
    plainText(eta, '');
  } else if (p.stage === 'brief') {
    plainText(eta, 'después, la newsletter (~15-20 min)');
  } else if (p.etaSec) {
    rollText(eta, `quedan ~${formatMinutes(p.etaSec)} · lista hacia las ${clockAt(p.etaSec)} (estimado)`);
  } else if (p.stage === 'revisando') {
    // Recta final (Hermes revisa y corrige a su ritmo): en vez de un tiempo que no se cumple,
    // si sigue trabajando o si lleva rato parado.
    plainText(eta, 'recta final: revisando a su ritmo');
  } else {
    // Sin estimación en una fase temprana: la fase se alarga más de lo habitual. Antes decía "recta
    // final" también aquí (Nike · cambios, 2026-09-28: "recta final" al 14 %).
    plainText(eta, 'esta fase va más lenta de lo habitual');
  }
  // Sin acciones no es lo mismo que colgado: el modelo puede estar escribiendo una respuesta larga
  // (Talaria, 2026-09-25: 5 min generando). Gris a partir de 3 min, amarillo a partir de 10.
  const quiet = idleSeconds(p);
  if (job.status === 'running' && quiet != null && quiet >= 180) {
    plainText(eta, quiet >= 600 ? `sin actividad desde hace ${formatAgo(quiet)}` : `generando respuesta · sin acciones desde hace ${formatAgo(quiet)}`);
    eta.classList.toggle('is-idle', quiet >= 600);
  }
  const idle = idleSeconds(p);
  // A partir de 3 min sin acciones ya lo dice la línea de arriba: no se repite aquí (2026-10-05).
  const idleShownAbove = job.status === 'running' && idle != null && idle >= 180;
  document.getElementById('progress-detail').textContent =
    job.status === 'completed'
      ? `Hecha en ${formatMinutes(p.elapsedSec)} · ${p.actions} acciones de Hermes${
          job.briefWaitSec >= 60 ? ` · aparte, ${formatMinutes(job.briefWaitSec)} esperando tu aprobación del brief` : ''
        }.`
      : [
          p.detail,
          idle != null && !idleShownAbove ? `última acción hace ${formatAgo(idle)}` : null,
          `${p.actions} acciones`,
          `${formatMinutes(p.elapsedSec)} de trabajo`,
          job.briefWaitSec >= 60 ? `aparte, ${formatMinutes(job.briefWaitSec)} esperando tu aprobación del brief` : null,
        ]
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
let logShown = { job: null, count: 0 };
function renderLog(events) {
  const key = `${currentJob}:${events.length}`;
  if (key === lastLogKey) return;
  lastLogKey = key;
  const warnings = events.filter((ev) => ev.level === 'error').length;
  // Sin líneas no hay nada que abrir: «Registro de Hermes · 0 líneas» solo ocupaba sitio (2026-10-05).
  document.getElementById('log-box').hidden = !events.length;
  document.getElementById('log-count').innerHTML =
    `· ${events.length} línea${events.length === 1 ? '' : 's'}` +
    (warnings ? ` · <span class="warn">${warnings} aviso${warnings === 1 ? '' : 's'} o error${warnings === 1 ? '' : 'es'}</span>` : '');
  document.getElementById('log-filter').hidden = !warnings;
  const log = document.getElementById('job-log');
  // Registro en vivo (2026-10-06): solo las líneas nuevas de la misma pieza entran con un resalte; al abrir, sin animar.
  const fresh = motionOk() && logShown.job === currentJob && logShown.count > 0 ? logShown.count : null;
  logShown = { job: currentJob, count: events.length };
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
  if (fresh != null) [...log.children].slice(fresh).forEach((li, n) => {
    li.style.setProperty('--n', String(n));
    li.classList.add('is-fresh');
  });
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
  document.getElementById('menu-theme-name').textContent = THEME_SHORT[t];
}

document.getElementById('theme-btn').addEventListener('click', (e) => {
  const next = THEMES[(THEMES.indexOf(currentStudioTheme()) + 1) % THEMES.length];
  const apply = () => {
    if (next === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    // Dentro de la transición: el botón se pinta con el tema ya aplicado (antes mostraba el anterior).
    renderThemeBtn();
  };
  // Cambio de tema con onda (2026-10-06): el nuevo tema se extiende en círculo desde el botón (View Transitions).
  if (document.startViewTransition && motionOk()) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => undefined);
  } else apply();
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
  // Studio ya decide la vista: fuera la silueta del enlace directo (ver <head> de index.html).
  document.documentElement.classList.remove('deep-link');
  const params = new URLSearchParams(location.search);
  const id = params.get('job');
  const brand = params.get('brand');
  const brands = params.has('brands');
  if (id) {
    // ?tab=client (2026-10-05, desde «Te esperan»): se abre esa pestaña en cuanto llegan los datos del trabajo.
    pendingJobTab = JOB_TABS.includes(params.get('tab')) ? params.get('tab') : null;
    showJobView(id);
  } else if (brand) {
    showBrandView(brand);
  } else if (brands) {
    showBrandsView();
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

// ---------------------------------------------------------------- galería viva (2026-10-07)
/** Miniatura que se recorre (A): al quedarse el ratón sobre una pieza de la galería, la miniatura se desliza despacio
 *  de arriba abajo y enseña la newsletter entera. Es la pieza de verdad (su HTML, en un marco sin scripts) reducida al
 *  ancho de la tarjeta. Solo con ratón y sin «reducir movimiento». */
const scrollHtml = new Map();
function scrollHtmlFor(id) {
  if (!scrollHtml.has(id)) {
    // fetch directo, no apiFetch: un hover no debe encender el indicador de carga de la página.
    const p = fetch(`/api/jobs/${encodeURIComponent(id)}/result`)
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null)
      .then((html) => {
        if (!html) scrollHtml.delete(id);
        return html;
      });
    scrollHtml.set(id, p);
  }
  return scrollHtml.get(id);
}
let scrollTimer = null;
function startThumbScroll(card) {
  const thumb = card.querySelector('.thumb');
  const img = thumb?.querySelector('img[src*="/thumb"]');
  if (!img || thumb.querySelector('.thumb-scroll')) return;
  const id = decodeURIComponent((img.getAttribute('src').match(/\/api\/jobs\/([^/]+)\/thumb/) || [])[1] || '');
  if (!id) return;
  scrollHtmlFor(id).then((html) => {
    if (!html || !card.matches(':hover') || thumb.querySelector('.thumb-scroll')) return;
    const frame = document.createElement('iframe');
    frame.className = 'thumb-scroll';
    frame.setAttribute('sandbox', 'allow-same-origin');
    // En claro, como la miniatura (si no, la pieza sigue el tema del navegador y cambia de golpe a su modo oscuro).
    frame.style.colorScheme = 'light';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.onload = () => {
      const doc = frame.contentDocument;
      if (!doc || !card.matches(':hover')) return frame.remove();
      const w = thumb.clientWidth;
      const h = thumb.clientHeight;
      const scale = w / 600;
      const full = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0);
      frame.style.height = `${full}px`;
      const dist = full * scale - h;
      if (dist < 8) return frame.remove();
      frame.style.transform = `scale(${scale})`;
      frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' });
      // Lento y constante: unas dos alturas de tarjeta por segundo y medio, con una pausa arriba y otra abajo.
      const duration = Math.max(2600, Math.min(11000, (dist / h) * 1500));
      frame._run = frame.animate(
        [{ transform: `translateY(0) scale(${scale})` }, { transform: `translateY(-${dist.toFixed(1)}px) scale(${scale})` }],
        { duration, delay: 250, easing: 'cubic-bezier(0.45, 0, 0.4, 1)', fill: 'forwards' }
      );
    };
    frame.srcdoc = html;
    thumb.appendChild(frame);
  });
}
function stopThumbScroll(card) {
  const frame = card.querySelector('.thumb-scroll');
  if (!frame) return;
  const run = frame._run;
  const now = run ? getComputedStyle(frame).transform : null;
  run?.cancel();
  const back = frame.animate(
    [{ transform: now || 'none', opacity: 1 }, { transform: frame.style.transform, opacity: 0 }],
    { duration: 380, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)', fill: 'forwards' }
  );
  back.finished.then(() => frame.remove(), () => frame.remove());
}
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const list = document.getElementById('history-list');
  list.addEventListener('mouseover', (e) => {
    const card = e.target.closest('a.g-card');
    if (!card || card.contains(e.relatedTarget) || !motionOk()) return;
    clearTimeout(scrollTimer);
    // Un momento quieto encima antes de empezar: pasar de largo no carga nada.
    scrollTimer = setTimeout(() => startThumbScroll(card), 350);
  });
  list.addEventListener('mouseout', (e) => {
    const card = e.target.closest('a.g-card');
    if (!card || card.contains(e.relatedTarget)) return;
    clearTimeout(scrollTimer);
    stopThumbScroll(card);
  });
}

/** La carta que se abre (B): al pulsar una pieza de la galería, su miniatura vuela y crece hasta el sitio de la vista
 *  previa en la página del trabajo; cuando la pieza de verdad está cargada, la miniatura se funde con ella. Además, la
 *  galería ya no recarga la página entera al abrir un trabajo. */
function flyCardToPreview(thumb) {
  if (!motionOk() || !thumb) return;
  const r = thumb.getBoundingClientRect();
  if (!r.width) return;
  const fly = document.createElement('div');
  fly.className = 'card-fly';
  fly.setAttribute('aria-hidden', 'true');
  const img = thumb.querySelector('img[src*="/thumb"]');
  if (img) fly.innerHTML = `<img src="${escapeHtml(img.currentSrc || img.src)}" alt="">`;
  else {
    fly.innerHTML = thumb.innerHTML;
    fly.classList.add(...thumb.classList);
  }
  fly.querySelector('.thumb-scroll')?.remove();
  Object.assign(fly.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  document.body.appendChild(fly);
  const place = (el) => {
    const t = el.getBoundingClientRect();
    const height = Math.min(t.height || t.width * 1.33, window.innerHeight - t.top - 24, t.width * 1.33);
    return { left: `${t.left}px`, top: `${t.top}px`, width: `${t.width}px`, height: `${Math.max(120, height)}px` };
  };
  // En el fotograma siguiente o, si el navegador no da fotogramas (pestaña en segundo plano), a los 60 ms: la carta
  // nunca se queda colgada encima de la página.
  let launched = false;
  const launch = (fn) => () => {
    if (launched) return;
    launched = true;
    fn();
  };
  const go = launch(() => {
    const target = document.querySelector('#job-skeleton:not([hidden]) .skeleton-preview') || document.getElementById('preview-device');
    if (viewJob.hidden || !target || !target.getBoundingClientRect().width) return fly.remove();
    const to = place(target);
    fly.animate(
      [
        { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: '8px' },
        { ...to, borderRadius: '14px' },
      ],
      { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    );
    // Se queda en su sitio, respirando, hasta que la vista previa de verdad carga (o 5 s como mucho).
    const frame = document.getElementById('preview-frame');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      frame.removeEventListener('load', onLoad);
      const dev = document.getElementById('preview-device');
      const visible = dev && dev.getBoundingClientRect().width && !viewJob.hidden;
      const steps = visible ? [{ ...place(dev), opacity: 1 }, { ...place(dev), opacity: 0 }] : [{ opacity: 1 }, { opacity: 0 }];
      fly.animate(steps, { duration: 420, easing: 'ease-out', fill: 'forwards' }).finished.finally(() => fly.remove());
    };
    const onLoad = () => setTimeout(finish, 60);
    frame.addEventListener('load', onLoad);
    setTimeout(finish, 5000);
    // Si la página deja de esperar sin vista previa (trabajo en marcha, fallido o no encontrado), se retira ya.
    const watch = setInterval(() => {
      if (done) return clearInterval(watch);
      const waiting = !document.getElementById('job-skeleton').hidden;
      const result = !document.getElementById('job-result').hidden;
      if (viewJob.hidden || (!waiting && !result)) {
        clearInterval(watch);
        finish();
      }
    }, 200);
  });
  requestAnimationFrame(go);
  setTimeout(go, 60);
  setTimeout(() => fly.remove(), 7000);
}
document.getElementById('history-list').addEventListener('click', (e) => {
  const a = e.target.closest('a.g-card');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  stopThumbScroll(a);
  // Antes de cambiar de vista: la miniatura se mide mientras se ve; el vuelo arranca en el fotograma siguiente.
  flyCardToPreview(a.querySelector('.thumb'));
  history.pushState({}, '', a.getAttribute('href'));
  route();
});
