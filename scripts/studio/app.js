const $ = selector => document.querySelector(selector);

const state = {
  candidates: [],
  tree: [],
  families: [],
  counts: {},
  updatedAt: null,
  stagingFile: '',
};

let selectedId = null;
let query = '';
let statusFilter = 'all';
let saveTimer = null;
let saveInFlight = null;
let editVersion = 0;
let dirty = false;

const VERDICT_LABELS = {
  substyle: 'Subestilo',
  style: 'Estilo',
  family: 'Familia',
  alias: 'Alias (sin nodo)',
  defer: 'Aplazado',
};

const CHAR_MAP = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };

function slugify(text) {
  if (!text) return '';
  const mapped = String(text).replace(/[ßæœøłđðþı]/gi, c => CHAR_MAP[c.toLowerCase()] || c);
  return mapped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function isSpotifyId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9]{22}$/.test(value);
}

function parseSpotifyId(value, type) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^[A-Za-z0-9]{22}$/.test(raw)) return raw;
  const pattern = new RegExp(
    `(?:spotify:${type}:|open\\.spotify\\.com\\/(?:intl-[a-z-]+\\/)?${type}\\/)([A-Za-z0-9]{22})`,
    'i'
  );
  const match = raw.match(pattern);
  return match ? match[1] : null;
}

function current() {
  return state.candidates.find(candidate => candidate.id === selectedId) || null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function touch(candidate) {
  candidate.updatedAt = today();
}

function completion(candidate) {
  const placement = candidate.placement || {};
  const artists = candidate.key_artists || [];
  const informational = placement.verdict === 'alias' || placement.verdict === 'defer';
  const placementOk = Boolean(
    placement.verdict &&
      placement.reviewed &&
      (placement.rationale || '').trim().length >= 20 &&
      (placement.sources || []).filter(Boolean).length >= 1
  );
  const spotifyOk = informational
    ? true
    : Boolean(
        isSpotifyId(candidate.spotify_track_id) &&
          artists.length === 3 &&
          artists.every(artist => artist && (artist.name || '').trim() && isSpotifyId(artist.url))
      );
  const exampleOk = informational ? true : Boolean((candidate.example || '').trim());
  const proseOk = informational
    ? true
    : Boolean((candidate.description || '').trim() && (candidate.description_es || '').trim());
  const total = [placementOk, spotifyOk, exampleOk, proseOk].filter(Boolean).length;
  return { placement: placementOk, spotify: spotifyOk, example: exampleOk, prose: proseOk, total };
}

function localIssues(candidate) {
  const errors = [];
  const warnings = [];
  const placement = candidate.placement || {};
  const artists = candidate.key_artists || [];

  if (!candidate.style || !candidate.style.trim()) errors.push('Falta el nombre del género.');
  if (!placement.verdict) errors.push('Falta el veredicto de ubicación.');
  if (!placement.rationale || placement.rationale.trim().length < 20) {
    errors.push('La justificación debe tener al menos 20 caracteres.');
  }
  if (!Array.isArray(placement.sources) || !placement.sources.filter(Boolean).length) {
    errors.push('Falta al menos una fuente.');
  }
  if (!placement.reviewed) errors.push('Marca la ubicación como revisada.');
  const informational = placement.verdict === 'alias' || placement.verdict === 'defer';
  if (placement.verdict === 'family' && (candidate.parentPath || []).length) {
    errors.push('Una familia debe ir en la raíz.');
  }
  if (['substyle', 'style', 'alias'].includes(placement.verdict) && !(candidate.parentPath || []).length) {
    errors.push('Este veredicto necesita un padre.');
  }
  if (!informational) {
    if (!candidate.example || !candidate.example.trim()) errors.push('Falta la pista de ejemplo.');
    if (!isSpotifyId(candidate.spotify_track_id)) errors.push('El ID del track no es válido.');
    if (artists.length !== 3) errors.push('Deben ser exactamente 3 artistas.');
    artists.forEach((artist, index) => {
      if (!artist || !(artist.name || '').trim()) errors.push(`Falta el nombre del artista ${index + 1}.`);
      if (!isSpotifyId(artist && artist.url)) errors.push(`El ID del artista ${index + 1} no es válido.`);
    });
    if (!candidate.description || !candidate.description.trim()) warnings.push('Falta la descripción EN para publicar.');
    if (!candidate.description_es || !candidate.description_es.trim()) warnings.push('Falta la descripción ES para publicar.');
  }
  if ((!candidate.wikipedia_url || !candidate.wikipedia_url.trim()) && !informational) warnings.push('Sin enlace de Wikipedia.');
  if ((placement.sources || []).filter(Boolean).length < 2) warnings.push('Se recomiendan dos fuentes.');

  return { errors, warnings };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

async function boot() {
  try {
    const data = await api('/api/state');
    Object.assign(state, data);
    buildParentOptions();
    renderStats();
    renderFilters();
    renderList();
    const first =
      state.candidates.find(candidate => candidate.priority === 1 && candidate.status === 'draft') ||
      state.candidates.find(candidate => candidate.status === 'draft') ||
      state.candidates[0];
    if (first) selectCandidate(first.id);
    else showEmpty();
  } catch (error) {
    toast(`No se pudo cargar el estado: ${error.message}`, 'err');
  }
}

function showEmpty() {
  $('#empty').hidden = false;
  $('#form').hidden = true;
}

/* ---------- Sidebar ---------- */

function renderStats() {
  const totals = { total: state.candidates.length, draft: 0, ready: 0, published: 0 };
  for (const candidate of state.candidates) {
    totals[candidate.status] = (totals[candidate.status] || 0) + 1;
  }
  $('#stats').innerHTML = `
    <div class="stat"><strong>${totals.total}</strong> en staging</div>
    <div class="stat ready"><strong>${totals.ready}</strong> listos</div>
    <div class="stat"><strong>${totals.published}</strong> publicados</div>
  `;
}

function renderFilters() {
  const counts = { all: state.candidates.length, draft: 0, ready: 0, published: 0 };
  for (const candidate of state.candidates) counts[candidate.status] = (counts[candidate.status] || 0) + 1;
  const filters = [
    ['all', `Todos ${counts.all}`],
    ['draft', `Borradores ${counts.draft}`],
    ['ready', `Listos ${counts.ready}`],
    ['published', `Publicados ${counts.published}`],
  ];
  $('#filters').innerHTML = filters
    .map(([value, label]) => `<button type="button" class="filter${statusFilter === value ? ' active' : ''}" data-filter="${value}">${label}</button>`)
    .join('');
}

function matches(candidate) {
  if (statusFilter !== 'all' && candidate.status !== statusFilter) return false;
  if (!query) return true;
  const haystack = [candidate.style, ...(candidate.parentPath || []), candidate.notes]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function familyOf(candidate) {
  if (!candidate.parentPath || !candidate.parentPath.length) return 'Nueva familia (raíz)';
  return candidate.parentPath[0];
}

function renderList() {
  const visible = state.candidates.filter(matches);
  if (!visible.length) {
    $('#list').innerHTML = '<p class="help" style="padding:12px">Nada por aquí.</p>';
    return;
  }

  const order = state.families.map(family => family.name);
  const groups = new Map();
  for (const candidate of visible) {
    const family = familyOf(candidate);
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(candidate);
  }

  const sortedGroups = [...groups.entries()].sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  $('#list').innerHTML = sortedGroups
    .map(([family, candidates]) => {
      const items = candidates
        .sort((a, b) => (a.priority || 9) - (b.priority || 9) || a.style.localeCompare(b.style))
        .map(candidate => {
          const done = completion(candidate);
          const reviewed = candidate.placement && candidate.placement.reviewed;
          const dotClass = candidate.status === 'published' ? 'published' : candidate.status === 'ready' ? 'ready' : `draft${reviewed ? ' reviewed' : ''}`;
          const path = (candidate.parentPath || []).join(' › ');
          const sub = path || VERDICT_LABELS[candidate.placement && candidate.placement.verdict] || 'Sin ubicar';
          return `
            <button type="button" class="item${candidate.id === selectedId ? ' active' : ''}" data-id="${candidate.id}">
              <span class="dot ${dotClass}"></span>
              <span class="item-main">
                <span class="item-name">${escapeHtml(candidate.style || '(sin nombre)')}</span>
                <span class="item-sub">${escapeHtml(sub)}</span>
              </span>
              <span class="item-score">${done.total}/4</span>
            </button>
          `;
        })
        .join('');
      return `<div class="group-title">${escapeHtml(family)}</div>${items}`;
    })
    .join('');

  for (const button of $('#list').querySelectorAll('.item')) {
    button.addEventListener('click', () => selectCandidate(button.dataset.id));
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Form ---------- */

const artistInputs = [];

function buildParentOptions() {
  const select = $('#f-parent');
  select.innerHTML = '';
  select.add(new Option('— Nueva familia (raíz) —', '[]'));
  for (const node of state.tree) {
    const prefix = node.depth ? '\u00A0\u00A0'.repeat(node.depth) + '· ' : '';
    select.add(new Option(prefix + node.name, JSON.stringify(node.path)));
  }
}

function buildArtists() {
  const container = $('#artists');
  container.innerHTML = '';
  for (let index = 0; index < 3; index += 1) {
    const row = document.createElement('div');
    row.className = 'artist-row';
    row.innerHTML = `
      <input class="artist-name" type="text" placeholder="Artista ${index + 1}" autocomplete="off" />
      <input class="artist-id" type="text" placeholder="URL o ID de Spotify" spellcheck="false" autocomplete="off" />
      <a href="https://open.spotify.com" target="_blank" rel="noopener">Buscar</a>
    `;
    const nameInput = row.querySelector('.artist-name');
    const idInput = row.querySelector('.artist-id');
    const link = row.querySelector('a');

    nameInput.addEventListener('input', () => {
      const candidate = current();
      if (!candidate) return;
      candidate.key_artists[index].name = nameInput.value;
      updateArtistLink(link, candidate.key_artists[index].name);
      afterChange(candidate);
    });

    idInput.addEventListener('input', () => {
      const candidate = current();
      if (!candidate) return;
      const id = parseSpotifyId(idInput.value, 'artist');
      candidate.key_artists[index].url = id || '';
      if (id && idInput.value.trim() !== id) idInput.value = id;
      idInput.classList.toggle('invalid', Boolean(idInput.value.trim()) && !id);
      afterChange(candidate);
    });

    container.appendChild(row);
    artistInputs.push({ nameInput, idInput, link });
  }
}

function updateArtistLink(link, name) {
  link.href = name
    ? `https://open.spotify.com/search/${encodeURIComponent(name)}`
    : 'https://open.spotify.com';
}

function selectCandidate(id) {
  selectedId = id;
  const candidate = current();
  if (!candidate) return;
  if (!Array.isArray(candidate.key_artists)) candidate.key_artists = [];
  while (candidate.key_artists.length < 3) candidate.key_artists.push({ name: '', url: '' });
  if (!candidate.placement) candidate.placement = { verdict: 'substyle', alternatives: [], rationale: '', sources: [], reviewed: false };

  $('#empty').hidden = true;
  $('#form').hidden = false;

  setFormDisabled(candidate.status === 'published');

  $('#f-style').value = candidate.style || '';
  $('#f-verdict').value = candidate.placement.verdict || 'substyle';
  $('#f-priority').value = String(candidate.priority || 2);
  const pathValue = JSON.stringify(candidate.parentPath || []);
  if ([...$('#f-parent').options].some(option => option.value === pathValue)) {
    $('#f-parent').value = pathValue;
  } else {
    $('#f-parent').value = '[]';
  }
  $('#f-rationale').value = candidate.placement.rationale || '';
  $('#f-sources').value = (candidate.placement.sources || []).join('\n');
  $('#f-reviewed').checked = Boolean(candidate.placement.reviewed);
  $('#f-example').value = candidate.example || '';
  $('#f-track').value = candidate.spotify_track_id || '';
  $('#f-wiki').value = candidate.wikipedia_url || '';
  $('#f-desc-en').value = candidate.description || '';
  $('#f-desc-es').value = candidate.description_es || '';
  $('#f-notes').value = candidate.notes || '';

  artistInputs.forEach((input, index) => {
    const artist = candidate.key_artists[index] || { name: '', url: '' };
    input.nameInput.value = artist.name || '';
    input.idInput.value = artist.url || '';
    input.idInput.classList.remove('invalid');
    updateArtistLink(input.link, artist.name);
  });

  renderStatus(candidate);
  renderAlternatives(candidate);
  renderPreview(candidate);
  renderEmbed(candidate);
  updateGates(candidate);
  renderIssues(candidate);
  $('#f-parent').disabled = candidate.placement.verdict === 'family';
  renderMeta(candidate);
  updatePublishButtons(candidate);
  renderList();
}

function setFormDisabled(disabled) {
  for (const element of $('#form').querySelectorAll('input, select, textarea, button')) {
    element.disabled = disabled;
  }
}

function afterChange(candidate) {
  touch(candidate);
  renderPreview(candidate);
  updateGates(candidate);
  updatePublishButtons(candidate);
  renderList();
  markDirty();
  scheduleSave();
}

function bindInput(id, apply, event = 'input') {
  const element = document.getElementById(id);
  element.addEventListener(event, () => {
    const candidate = current();
    if (!candidate) return;
    apply(candidate, element);
    afterChange(candidate);
  });
}

function setupBindings() {
  buildArtists();

  bindInput('f-style', (candidate, element) => {
    candidate.style = element.value;
  });

  bindInput(
    'f-verdict',
    (candidate, element) => {
      candidate.placement.verdict = element.value;
      if (element.value === 'family') {
        candidate.parentPath = [];
        $('#f-parent').value = '[]';
      }
      $('#f-parent').disabled = element.value === 'family';
      renderAlternatives(candidate);
    },
    'change'
  );

  bindInput(
    'f-priority',
    (candidate, element) => {
      candidate.priority = Number(element.value);
    },
    'change'
  );

  bindInput(
    'f-parent',
    (candidate, element) => {
      candidate.parentPath = JSON.parse(element.value);
    },
    'change'
  );

  bindInput('f-rationale', (candidate, element) => {
    candidate.placement.rationale = element.value;
  });

  bindInput('f-sources', (candidate, element) => {
    candidate.placement.sources = element.value
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  });

  bindInput(
    'f-reviewed',
    (candidate, element) => {
      candidate.placement.reviewed = element.checked;
    },
    'change'
  );

  bindInput('f-example', (candidate, element) => {
    candidate.example = element.value;
  });

  bindInput('f-track', (candidate, element) => {
    const id = parseSpotifyId(element.value, 'track');
    candidate.spotify_track_id = id || '';
    if (id && element.value.trim() !== id) element.value = id;
    element.classList.toggle('invalid', Boolean(element.value.trim()) && !id);
    renderEmbed(candidate);
  });

  bindInput('f-wiki', (candidate, element) => {
    candidate.wikipedia_url = element.value;
  });

  bindInput('f-desc-en', (candidate, element) => {
    candidate.description = element.value;
  });

  bindInput('f-desc-es', (candidate, element) => {
    candidate.description_es = element.value;
  });

  bindInput('f-notes', (candidate, element) => {
    candidate.notes = element.value;
  });

  $('#search').addEventListener('input', event => {
    query = event.target.value.trim();
    renderList();
  });

  $('#filters').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    statusFilter = button.dataset.filter;
    renderFilters();
    renderList();
  });

  $('#save').addEventListener('click', () => saveNow(true));

  $('#toggle-ready').addEventListener('click', toggleReady);
  $('#delete').addEventListener('click', removeCandidate);
  $('#publish-one').addEventListener('click', () => publish([current() && current().id]));
  $('#publish').addEventListener('click', () => publish(null));
  $('#dry-run').addEventListener('click', () => publish(null, true));
  $('#copy-ready').addEventListener('click', copyReady);

  window.addEventListener('beforeunload', event => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

function renderStatus(candidate) {
  const badge = $('#status-badge');
  const labels = { draft: 'Borrador', ready: 'Listo', published: 'Publicado' };
  badge.textContent = labels[candidate.status] || candidate.status;
  badge.className = `badge ${candidate.status}`;
}

function renderAlternatives(candidate) {
  const alternatives = (candidate.placement && candidate.placement.alternatives) || [];
  const wrapper = $('#alternatives');
  const container = $('#alternative-chips');
  if (!alternatives.length) {
    wrapper.hidden = true;
    return;
  }
  wrapper.hidden = false;
  container.innerHTML = alternatives
    .map(path => `<button type="button" class="chip" data-path="${escapeHtml(JSON.stringify(path))}">${escapeHtml(path.join(' › '))}</button>`)
    .join('');
  for (const chip of container.querySelectorAll('.chip')) {
    chip.disabled = candidate.status === 'published';
    chip.addEventListener('click', () => {
      const active = current();
      if (!active) return;
      active.parentPath = JSON.parse(chip.dataset.path);
      active.placement.verdict = active.parentPath.length ? 'substyle' : 'family';
      $('#f-parent').value = JSON.stringify(active.parentPath);
      $('#f-verdict').value = active.placement.verdict;
      afterChange(active);
    });
  }
}

function renderPreview(candidate) {
  const path = [...(candidate.parentPath || []), candidate.style || '(sin nombre)'].filter(Boolean);
  const url = `/genres/${path.map(slugify).join('/')}/`;
  const verdict = (candidate.placement && candidate.placement.verdict) || 'substyle';
  const verb = VERDICT_LABELS[verdict] || verdict;
  $('#preview').innerHTML = `
    <span>Se publicará como <strong>${escapeHtml(verb.toLowerCase())}</strong> en:</span>
    <strong>${path.map(escapeHtml).join(' › ')}</strong>
    <code>${escapeHtml(url)}</code>
  `;
  $('#crumbs').innerHTML = path.slice(0, -1).length
    ? `${path.slice(0, -1).map(escapeHtml).join(' › ')} <code>›</code> ${escapeHtml(candidate.style || '')}`
    : `${escapeHtml(candidate.style || '')} <code>· raíz</code>`;
}

function renderEmbed(candidate) {
  const id = candidate.spotify_track_id;
  const wrapper = $('#embed-wrap');
  const iframe = $('#embed');
  if (!isSpotifyId(id)) {
    wrapper.hidden = true;
    iframe.removeAttribute('src');
    return;
  }
  wrapper.hidden = false;
  const src = `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`;
  if (iframe.getAttribute('src') !== src) iframe.setAttribute('src', src);
}

function updateGates(candidate) {
  const done = completion(candidate);
  const verdict = candidate.placement && candidate.placement.verdict;
  const informational = verdict === 'alias' || verdict === 'defer';
  setGate('#gate-placement', done.placement, 'Ubicación revisada');
  setGate('#gate-spotify', informational || (done.spotify && done.example), informational ? 'No aplica' : 'Evidencia completa');
  const proseGate = $('#gate-prose');
  if (informational) {
    proseGate.className = 'gate';
    proseGate.textContent = 'No aplica';
  } else if (done.prose) {
    proseGate.className = 'gate ok';
    proseGate.textContent = 'Completas';
  } else {
    proseGate.className = 'gate warn';
    proseGate.textContent = 'Pendientes';
  }
  updateTrackHelp(candidate);
}

function setGate(selector, ok, label) {
  const element = $(selector);
  element.className = `gate ${ok ? 'ok' : ''}`;
  element.textContent = ok ? label : 'Pendiente';
}

function updateTrackHelp(candidate) {
  const names = (candidate.key_artists || []).map(artist => artist.name).filter(Boolean);
  const term = [candidate.style, ...names].filter(Boolean).join(' ');
  const href = `https://open.spotify.com/search/${encodeURIComponent(term || 'electronic music')}`;
  $('#track-help').innerHTML = `Pega la URL del track y el ID se extrae solo. <a href="${href}" target="_blank" rel="noopener">Buscar en Spotify ↗</a>`;
}

function renderIssues(candidate, force = false) {
  const panel = $('#issues');
  const { errors, warnings } = localIssues(candidate);
  const show = force || (candidate.status === 'ready' && errors.length);
  if (!show || (!errors.length && !warnings.length)) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    ${errors.length ? `<strong>Falta esto para publicar:</strong><ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>` : ''}
    ${warnings.length ? `<div class="warn" style="margin-top:${errors.length ? '8px' : '0'}">${warnings.map(escapeHtml).join(' · ')}</div>` : ''}
  `;
}

function renderMeta(candidate) {
  const parts = [];
  if (candidate.addedAt) parts.push(`Añadido ${candidate.addedAt}`);
  if (candidate.updatedAt) parts.push(`Editado ${candidate.updatedAt}`);
  if (candidate.publishedUrl) parts.push(candidate.publishedUrl);
  $('#meta-line').textContent = parts.join(' · ');
}

function updatePublishButtons(candidate) {
  const toggle = $('#toggle-ready');
  const publishOne = $('#publish-one');
  if (candidate.status === 'ready') {
    toggle.textContent = 'Volver a borrador';
    toggle.disabled = false;
  } else if (candidate.status === 'published') {
    toggle.textContent = 'Ya publicado';
    toggle.disabled = true;
  } else {
    toggle.textContent = 'Marcar listo';
    toggle.disabled = false;
  }
  const verdict = candidate.placement && candidate.placement.verdict;
  publishOne.disabled = candidate.status !== 'ready' || !['substyle', 'style', 'family'].includes(verdict);
}

/* ---------- Actions ---------- */

async function toggleReady() {
  const candidate = current();
  if (!candidate) return;

  if (candidate.status === 'ready') {
    candidate.status = 'draft';
    touch(candidate);
    renderStatus(candidate);
    updatePublishButtons(candidate);
    renderList();
    renderStats();
    markDirty();
    await saveNow(true);
    return;
  }

  if (candidate.status === 'published') return;

  if (!(await saveNow(true))) return;
  try {
    const result = await api('/api/validate', {
      method: 'POST',
      body: JSON.stringify({ candidate }),
    });
    if (!result.ok) {
      renderIssues(candidate, true);
      toast(result.errors[0] || 'Faltan datos.', 'err');
      return;
    }
    candidate.status = 'ready';
    touch(candidate);
    renderStatus(candidate);
    updatePublishButtons(candidate);
    renderIssues(candidate);
    renderList();
    renderStats();
    markDirty();
    await saveNow(true);
    toast('Marcado como listo.', 'ok');
  } catch (error) {
    toast(error.message, 'err');
  }
}

async function removeCandidate() {
  const candidate = current();
  if (!candidate) return;
  const index = state.candidates.indexOf(candidate);
  if (index < 0) return;

  const label = candidate.style || candidate.id;
  const message =
    candidate.status === 'published'
      ? `"${label}" ya está publicado. Se borra solo la ficha del staging; el nodo del árbol y published.log se quedan. ¿Continuar?`
      : `¿Eliminar "${label}" del staging? No toca el árbol publicado.`;
  if (!confirm(message)) return;

  state.candidates.splice(index, 1);
  selectedId = null;
  markDirty();

  if (!(await saveNow(true))) {
    state.candidates.splice(index, 0, candidate);
    selectCandidate(candidate.id);
    renderStats();
    renderFilters();
    return;
  }

  renderStats();
  renderFilters();
  const next = state.candidates[Math.min(index, state.candidates.length - 1)];
  if (next) {
    selectCandidate(next.id);
  } else {
    renderList();
    showEmpty();
  }
  toast(`«${label}» eliminado del staging.`, 'ok');
}

async function publish(ids = null, dryRun = false) {
  const ready = state.candidates.filter(
    candidate =>
      candidate.status === 'ready' &&
      ['substyle', 'style', 'family'].includes(candidate.placement && candidate.placement.verdict) &&
      (!ids || ids.includes(candidate.id))
  );
  if (!ready.length) {
    toast('No hay fichas publicables listas. Las de alias o aplazar no generan nodo; el resto necesita descripciones.', 'err');
    return;
  }
  if (!dryRun) {
    const label = ids && ids.filter(Boolean).length === 1 ? ready[0].style : `${ready.length} ficha(s)`;
    if (!confirm(`¿Publicar ${label} en el árbol EN y ES?`)) return;
  }

  if (!(await saveNow(true))) return;
  try {
    const result = await api('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ dryRun, ids }),
    });
    const ok = result.report.filter(entry => entry.ok).length;
    const failed = result.report.filter(entry => !entry.ok);
    const summary = dryRun
      ? `${ok} lista(s) para publicar${failed.length ? ` · ${failed.length} con problemas` : ''}`
      : `${ok} publicada(s)${failed.length ? ` · ${failed.length} con problemas` : ''}`;
    toast(summary + (failed.length ? `\n${failed[0].label}: ${failed[0].reason}` : ''), failed.length ? 'err' : 'ok');
    if (failed.length) console.table(result.report);

    if (!dryRun) {
      state.candidates = result.state.candidates;
      state.tree = result.state.tree;
      state.families = result.state.families;
      renderStats();
      renderFilters();
      renderList();
      if (current()) selectCandidate(selectedId);
    }
  } catch (error) {
    toast(error.message, 'err');
  }
}

async function copyReady() {
  const ready = state.candidates.filter(candidate => candidate.status === 'ready');
  if (!ready.length) {
    toast('No hay fichas listas.', 'err');
    return;
  }
  const lines = [`# Listos para publicar (${ready.length})`, ''];
  for (const candidate of ready) {
    lines.push(`## ${candidate.style}`);
    lines.push(`- Ruta: ${[...(candidate.parentPath || []), candidate.style].join(' > ')}`);
    lines.push(`- Veredicto: ${candidate.placement.verdict}`);
    lines.push(`- Justificación: ${candidate.placement.rationale}`);
    lines.push(`- Fuentes: ${(candidate.placement.sources || []).join(', ') || '—'}`);
    lines.push(`- Pista: ${candidate.example || '—'} · ${candidate.spotify_track_id || 'sin ID'}`);
    lines.push(
      `- Artistas: ${
        (candidate.key_artists || [])
          .map(artist => `${artist.name || '—'} (${artist.url || 'sin ID'})`)
          .join(', ') || '—'
      }`
    );
    lines.push(`- Wikipedia: ${candidate.wikipedia_url || '—'}`);
    lines.push('');
  }
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    toast(`${ready.length} ficha(s) copiadas al portapapeles.`, 'ok');
  } catch {
    toast('No se pudo copiar al portapapeles.', 'err');
  }
}

/* ---------- Save ---------- */

function markDirty() {
  editVersion += 1;
  dirty = true;
  $('#save-state').textContent = 'Sin guardar…';
  $('#save-state').classList.add('dirty');
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveNow(), 800);
}

async function saveNow(force = false) {
  clearTimeout(saveTimer);
  if (saveInFlight) await saveInFlight;
  if (!dirty && !force) return true;

  const version = editVersion;
  saveInFlight = (async () => {
    try {
      const result = await api('/api/candidates', {
        method: 'POST',
        body: JSON.stringify({ candidates: state.candidates }),
      });
      if (editVersion === version) {
        dirty = false;
        $('#save-state').textContent = 'Guardado';
        $('#save-state').classList.remove('dirty');
      } else {
        $('#save-state').textContent = 'Guardando cambios…';
        scheduleSave();
      }
      if (result.counts) {
        state.counts = result.counts;
        renderStats();
        renderFilters();
      }
      return true;
    } catch (error) {
      $('#save-state').textContent = 'Error al guardar';
      toast(error.message, 'err');
      return false;
    } finally {
      saveInFlight = null;
    }
  })();
  return saveInFlight;
}

/* ---------- Toast ---------- */

let toastTimer = null;

function toast(message, kind = '') {
  const element = $('#toast');
  element.textContent = message;
  element.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.className = 'toast';
  }, 5200);
}

setupBindings();
boot();
