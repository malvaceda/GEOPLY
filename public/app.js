'use strict';

/* ═══════════════════════════════════════════════════════════
   CONFIGURACIÓN GLOBAL
═══════════════════════════════════════════════════════════ */
const MAP_CENTER = [4.5709, -74.2973];
const MAP_ZOOM   = 5;

const CATEGORY_COLORS = [
  '#00ff88', '#4fc3f7', '#ffd700', '#ff5252', '#a78bfa',
  '#ff8c69', '#7dff88', '#f0c040', '#00c45e', '#80d8ff',
  '#ff80ab', '#7da893',
];

const STATE = {
  layers:           { oportunidad: true },
  selectedCategory: 'all',
  categoryField:    null,
  categories:       [],
  categoryCounts:   {},
  selectedRecord:   null,
  legendOpen:       false,
  aiEnabled:        true,
};

let MAP         = null;
let markerLayer = null;
let heatLayer   = null;

/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initMap();
    updateAIToggleUI();
    loadAllDatasets();
  } catch (err) {
    console.error('[GeoPly] Init error:', err);
    showError();
  }
});

function showError() {
  const loading = document.getElementById('map-loading');
  if (loading) loading.style.display = 'none';
  const error = document.getElementById('map-error');
  if (error) error.classList.remove('hidden');
}

/* ═══════════════════════════════════════════════════════════
   MAPA
═══════════════════════════════════════════════════════════ */
function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) { showError(); return; }

  MAP = L.map('map', {
    center: MAP_CENTER,
    zoom:   MAP_ZOOM,
    zoomControl: true,
    preferCanvas: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(MAP);

  markerLayer = L.layerGroup().addTo(MAP);

  const loaderTimer = setTimeout(hideLoader, 900);
  MAP.once('load', () => { clearTimeout(loaderTimer); hideLoader(); });

  setTimeout(() => { if (MAP) MAP.invalidateSize({ animate: false }); }, 120);
  MAP.once('load', stampPerf);
}

function hideLoader() {
  const el = document.getElementById('map-loading');
  if (!el || el.classList.contains('hide')) return;
  el.classList.add('hide');
  setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 450);
}

function stampPerf() {
  const badge = document.getElementById('perf-badge');
  if (!badge || !window.__t0) return;
  const ms = Math.round(performance.now() - window.__t0);
  badge.textContent = `⚡ ${ms}ms`;
  badge.title = `Tiempo de carga: ${ms}ms`;
}

window.resetView = function () {
  if (MAP) MAP.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.9 });
};

window.flyTo = function (lat, lng, zoom = 12) {
  if (MAP && typeof lat === 'number' && typeof lng === 'number')
    MAP.flyTo([lat, lng], zoom, { duration: 0.8 });
};

function categoryColor(value) {
  if (!value || !STATE.categories.length) return CATEGORY_COLORS[CATEGORY_COLORS.length - 1];
  let idx = STATE.categories.findIndex(c => c.toLowerCase() === String(value).toLowerCase());
  if (idx < 0) idx = STATE.categories.length;
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
}

function colorForItem(item) {
  if (STATE.categoryField) {
    const val = item.record[STATE.categoryField];
    if (typeof val === 'string' && val.trim()) return categoryColor(val.trim());
  }
  return CATEGORY_COLORS[CATEGORY_COLORS.length - 1];
}

function getFilteredRecords() {
  if (STATE.selectedCategory === 'all' || !STATE.categoryField) return EMPLEO_RECORDS;
  return EMPLEO_RECORDS.filter(item => {
    const val = item.record[STATE.categoryField];
    return typeof val === 'string' && val.trim() === STATE.selectedCategory;
  });
}

/* ═══════════════════════════════════════════════════════════
   MARCADORES & CALOR
═══════════════════════════════════════════════════════════ */
function buildMapLayers() {
  if (!MAP) return;
  if (markerLayer) markerLayer.clearLayers();
  if (heatLayer) { try { MAP.removeLayer(heatLayer); } catch (e) {} heatLayer = null; }
  const data = getFilteredRecords();
  if (STATE.layers.oportunidad) {
    renderMarkers(data);
    renderHeat(data);
  }
  buildLegendCategories();
}

function renderMarkers(data) {
  data.forEach(item => {
    const color = colorForItem(item);
    let marker;
    try {
      marker = L.circleMarker([item.geo.lat, item.geo.lng], {
        radius: 6,
        fillColor: color,
        fillOpacity: 0.85,
        color: 'rgba(255,255,255,0.3)',
        weight: 1.2,
      });
    } catch (e) { return; }
    marker.bindPopup(buildEmpleoPopup(item));
    marker.on('click', () => onMarkerClick(item));
    marker.addTo(markerLayer);
  });
}

function renderHeat(data) {
  if (!window.__heatReady) return;
  try {
    const pts = data.map(item => [item.geo.lat, item.geo.lng, 0.6]);
    if (!pts.length) return;
    heatLayer = L.heatLayer(pts, {
      radius: 28, blur: 22, maxZoom: 12, max: 1.0,
      gradient: { 0: '#060a0e', 0.25: '#00401f', 0.5: '#008A45', 0.75: '#00ff88', 1: '#ffffff' },
    }).addTo(MAP);
    if (heatLayer && heatLayer._canvas)
      heatLayer._canvas.style.pointerEvents = 'none';
  } catch (e) {
    console.warn('[GeoPly] heatLayer error:', e);
  }
}

function buildEmpleoPopup(item) {
  const r = item.record;
  const categoria = STATE.categoryField ? r[STATE.categoryField] : null;
  const approxNote = item.geo.approx
    ? '<div class="popup-meta">Ubicación aproximada (centro de municipio/departamento)</div>'
    : '';
  const extras = Object.entries(r)
    .filter(([k, v]) => typeof v === 'string' && v.trim() && !k.startsWith(':') && k !== STATE.categoryField && v.length <= 60)
    .slice(0, 3);
  const extrasHtml = extras.map(([k, v]) => `
    <div class="popup-growth"><strong>${formatearTitulo(k)}:</strong> ${v}</div>`).join('');

  return `
    <div class="popup-body">
      <div class="popup-name">${item.datasetName}</div>
      <div class="popup-meta">Registro #${item.index + 1}</div>
      ${categoria ? `<div class="popup-growth"><strong>${formatearTitulo(STATE.categoryField)}:</strong> ${categoria}</div>` : ''}
      ${extrasHtml}
      ${approxNote}
    </div>`;
}

window.onMarkerClickById = function (datasetId, index) {
  const item = EMPLEO_RECORDS.find(r => r.datasetId === datasetId && r.index === index);
  if (item) onMarkerClick(item);
};

function onMarkerClick(item) {
  if (!STATE.aiEnabled) return;
  STATE.selectedRecord = { datasetId: item.datasetId, index: item.index };
  openRecordDetail(item.datasetId, item.index);
}

function buildCategoryChips() {
  const el = document.getElementById('filter-chips');
  if (!el) return;
  if (!STATE.categoryField || !STATE.categories.length) {
    el.innerHTML = '<p class="hint">No se detectó un campo de categoría con suficientes datos.</p>';
    return;
  }
  const sorted = [...STATE.categories].sort((a, b) => (STATE.categoryCounts[b] || 0) - (STATE.categoryCounts[a] || 0));
  const chips = ['all', ...sorted];
  el.innerHTML = chips.map(val => {
    const isAll  = val === 'all';
    const label  = isAll ? 'Todas' : val;
    const count  = isAll ? EMPLEO_RECORDS.length : (STATE.categoryCounts[val] || 0);
    const color  = isAll ? 'var(--mde-neon)' : categoryColor(val);
    const on     = STATE.selectedCategory === val;
    return `
      <span class="chip ${on ? 'on' : 'off'}" onclick="setCategory('${val.replace(/'/g, "\\'")}')" role="button">
        <span class="chip-dot" style="background:${color}"></span>
        ${label} <span class="chip-count">${count}</span>
      </span>`;
  }).join('');
}

window.setCategory = function (val) {
  STATE.selectedCategory = val;
  buildCategoryChips();
  buildMapLayers();
};

function updateSummary(loaded, total) {
  const pct = total > 0 ? (loaded / total) * 100 : 0;
  const circumference = 2 * Math.PI * 42;
  const ring  = document.getElementById('ring-progress');
  const num   = document.getElementById('opp-score-num');
  const color = pct >= 70 ? '#00ff88' : pct >= 40 ? '#ffd700' : '#ff5252';
  if (ring) {
    ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
    ring.style.stroke  = color;
    ring.style.filter  = `drop-shadow(0 0 6px ${color})`;
  }
  if (num) { num.textContent = Math.round(pct); num.style.color = color; }

  const totalRecords = DATASETS.reduce((acc, ds) => acc + (DATA_CACHE[ds.id] || []).length, 0);
  const geoPct = totalRecords > 0 ? Math.min(100, (EMPLEO_RECORDS.length / totalRecords) * 100) : 0;
  const catPct = STATE.categories && STATE.categories.length
    ? Math.min(100, (STATE.categories.length / 12) * 100) : 0;

  const bars = [
    { name: 'Datasets cargados',  val: pct,    display: `${loaded}/${total}`, color: '#00ff88' },
    { name: 'Total registros',    val: totalRecords > 0 ? 100 : 0, display: `${totalRecords}`, color: '#a78bfa' },
  ];

  const barsEl = document.getElementById('opp-bars');
  if (!barsEl) return;
  barsEl.innerHTML = bars.map(b => `
    <div class="bar-row">
      <span class="bar-name">${b.name}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${b.val.toFixed(0)}%;background:${b.color}"></div></div>
      <span class="bar-val" style="color:${b.color}">${b.display}</span>
    </div>`).join('');
}

function buildTrendInsights() {
  const el = document.getElementById('ai-insights');
  if (!el) return;
  if (!STATE.categoryField || !Object.keys(STATE.categoryCounts).length) {
    el.innerHTML = '<p class="hint">Aún no hay suficientes datos para detectar tendencias.</p>';
    return;
  }
  const total  = EMPLEO_RECORDS.length || 1;
  const sorted = Object.entries(STATE.categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  el.innerHTML = sorted.map(([val, count], i) => {
    const share = (count / total) * 100;
    const level = share >= 35 ? 'alta' : share >= 15 ? 'media' : 'baja';
    return `
      <div class="ai-card" style="animation-delay:${i * 80}ms">
        <div class="ai-card-zone">📈 ${formatearTitulo(STATE.categoryField)}: ${val}</div>
        <div class="ai-card-text">${count} registros geolocalizados (${share.toFixed(0)}% del total) coinciden con esta categoría.</div>
        <span class="ai-badge ${level}">
          ${level === 'alta' ? '🟢 Tendencia fuerte' : level === 'media' ? '🟡 Tendencia moderada' : '🔴 Tendencia emergente'}
        </span>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   AI TOGGLE
═══════════════════════════════════════════════════════════ */
function updateAIToggleUI() {
  const btn = document.getElementById('ai-toggle-btn');
  if (!btn) return;
  if (STATE.aiEnabled) {
    btn.textContent = 'Desactivar tendencias';
    btn.classList.remove('ai-toggle-off');
    btn.classList.add('ai-toggle-on');
  } else {
    btn.textContent = 'Activar tendencias';
    btn.classList.remove('ai-toggle-on');
    btn.classList.add('ai-toggle-off');
  }
}

window.toggleAI = function () {
  STATE.aiEnabled = !STATE.aiEnabled;
  updateAIToggleUI();
  const trendBlock = document.getElementById('ai-insights')?.closest('.panel-block');
  if (!STATE.aiEnabled) {
    const emptyEl    = document.getElementById('detail-empty');
    const detailEl   = document.getElementById('record-detail');
    const disabledEl = document.getElementById('detail-disabled');
    if (detailEl)   detailEl.classList.add('hidden');
    if (emptyEl)    emptyEl.classList.add('hidden');
    if (disabledEl) disabledEl.classList.remove('hidden');
    if (trendBlock) trendBlock.classList.add('hidden');
    STATE.selectedRecord = null;
  } else {
    const disabledEl = document.getElementById('detail-disabled');
    const emptyEl    = document.getElementById('detail-empty');
    if (disabledEl) disabledEl.classList.add('hidden');
    if (emptyEl)    emptyEl.classList.remove('hidden');
    if (trendBlock) trendBlock.classList.remove('hidden');
  }
};

/* ═══════════════════════════════════════════════════════════
   DETALLE DE REGISTRO (sidebar derecho)
═══════════════════════════════════════════════════════════ */
function openRecordDetail(datasetId, index) {
  const ds     = DATASETS.find(d => d.id === datasetId);
  const record = (DATA_CACHE[datasetId] || [])[index];
  if (!ds || !record) return;

  document.getElementById('detail-empty')?.classList.add('hidden');
  document.getElementById('record-detail')?.classList.remove('hidden');
  document.getElementById('detail-disabled')?.classList.add('hidden');

  const nameEl = document.getElementById('d-name');
  if (nameEl) nameEl.textContent = `${ds.name} · #${index + 1}`;

  const verdictEl = document.getElementById('d-verdict');
  const categoria = STATE.categoryField ? record[STATE.categoryField] : null;
  if (verdictEl) {
    if (categoria) {
      const color = categoryColor(categoria);
      verdictEl.textContent  = categoria;
      verdictEl.style.cssText = `background:${color}1a;color:${color};border-color:${color}55;`;
    } else {
      verdictEl.textContent  = ds.name;
      verdictEl.style.cssText = 'background:rgba(0,255,136,0.1);color:#00ff88;border-color:rgba(0,255,136,0.3);';
    }
  }

  const entries = Object.entries(record).filter(([k]) => !k.startsWith(':'));
  const numericEntries = entries.filter(([, v]) => v !== '' && v !== null && isFinite(parseFloat(v)) && typeof v !== 'object');

  const mEl = document.getElementById('d-metrics');
  if (mEl) {
    const metrics = [];
    const geo = extractGeo(record);
    if (geo) {
      metrics.push({ lbl: 'UBICACIÓN', val: `${geo.lat.toFixed(2)}, ${geo.lng.toFixed(2)}`, sub: geo.approx ? 'aproximada' : 'exacta', color: '#4fc3f7' });
    }
    numericEntries.slice(0, 5).forEach(([k, v]) => {
      metrics.push({ lbl: formatearTitulo(k).toUpperCase(), val: v, sub: 'valor numérico', color: '#00ff88' });
    });
    mEl.innerHTML = metrics.slice(0, 6).map(m => `
      <div class="metric-box">
        <div class="metric-label">${m.lbl}</div>
        <div class="metric-value" style="color:${m.color}">${m.val}</div>
        <div class="metric-sub">${m.sub}</div>
      </div>`).join('');
  }

  const aiEl = document.getElementById('d-ai');
  if (aiEl) {
    const usedKeys = new Set(numericEntries.slice(0, 5).map(([k]) => k));
    const rest     = entries.filter(([k]) => !usedKeys.has(k));
    aiEl.innerHTML = `
      <div class="d-ai-title">✦ DETALLE DEL REGISTRO</div>
      ${rest.slice(0, 12).map(([k, v]) => {
        let val = v;
        if (val && typeof val === 'object') val = JSON.stringify(val);
        if (val === '' || val === null || val === undefined) val = 'No especificado';
        return `<div class="reasoning-step"><strong>${formatearTitulo(k)}:</strong> ${val}</div>`;
      }).join('')}`;     
    const openBtn = document.getElementById('d-open-dataset');
    if (openBtn) openBtn.onclick = () => openDashboard(datasetId); 
  }
}

function calcularScoreSimulado(record) {
  let score = 60;
  const numVals = Object.values(record)
    .filter(v => v !== '' && v !== null && isFinite(parseFloat(v)));
  score += Math.min(numVals.length * 3, 20);
  const catVal = STATE.categoryField ? record[STATE.categoryField] : null;
  if (catVal) score += 10;
  return Math.min(score, 100);
}

window.abrirModal = function (id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (id === 'modal-aspirante') {
    const saved = localStorage.getItem('geoply_aspirante');
    if (saved) {
      mostrarPerfilAspirante(JSON.parse(saved));
    }
  }
};

window.cerrarModales = function () {
  const modal = document.getElementById('modal-aspirante');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';

  // Resetear estado del modal
  const succEl  = document.getElementById('success-aspirante');
  const profileEl = document.getElementById('profile-aspirante');
  const form    = document.getElementById('form-aspirante');
  if (succEl)    succEl.classList.remove('visible');
  if (profileEl) profileEl.classList.add('hidden');
  if (form) {
    form.style.display = '';
    delete form.dataset.editMode;
    const btn = form.querySelector('.form-submit');
    if (btn) btn.textContent = 'Registrarme en GeoPly';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ['modal-aspirante', 'modal-empresa'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', function (e) {
        if (e.target === el) cerrarModales();
      });
    }
  });
});

function mostrarPerfilAspirante(data) {
  document.getElementById('form-aspirante').style.display = 'none';
  document.getElementById('success-aspirante').classList.remove('visible');

  const labels = {
    correo:              'Correo',
    telefono:            'Teléfono',
    municipio:           'Municipio',
    nivel_educativo:     'Nivel educativo',
    experiencia_anios:   'Años de experiencia',
    area_interes:        'Área de interés',
    aspiracion_salarial: 'Aspiración salarial (COP)',
    descripcion:         'Perfil / habilidades',
  };

  document.getElementById('profile-nombre').textContent = data.nombre || '—';

  const fieldsEl = document.getElementById('profile-fields');
  fieldsEl.innerHTML = Object.entries(labels)
    .filter(([k]) => data[k] !== undefined && data[k] !== '')
    .map(([k, label]) => `
      <div class="profile-field">
        <span class="profile-field-label">${label}</span>
        <span class="profile-field-value">${data[k]}</span>
      </div>`).join('');

  document.getElementById('profile-aspirante').classList.remove('hidden');
}

window.activarEdicionAspirante = function () {
  const saved = JSON.parse(localStorage.getItem('geoply_aspirante'));
  if (!saved) return;

  document.getElementById('profile-aspirante').classList.add('hidden');

  const form = document.getElementById('form-aspirante');
  form.style.display = '';
  form.dataset.editMode = 'true';

  form.nombre.value            = saved.nombre            || '';
  form.correo.value            = saved.correo            || '';
  form.telefono.value          = saved.telefono          || '';
  form.municipio.value         = saved.municipio         || '';
  form.nivel_educativo.value   = saved.nivel_educativo   || 'universitario';
  form.experiencia_anios.value = saved.experiencia_anios || 0;
  form.area_interes.value      = saved.area_interes      || 'tecnologia';
  form.aspiracion_salarial.value = saved.aspiracion_salarial || 1300000;
  if (form.descripcion) form.descripcion.value = saved.descripcion || '';

  form.querySelector('.form-submit').textContent = 'Actualizar mi perfil';
};

window.registrarAspirante = async function (e) {
  e.preventDefault();
  const form      = e.target;
  const btn       = form.querySelector('.form-submit');
  const errEl     = document.getElementById('err-aspirante');
  const succEl    = document.getElementById('success-aspirante');
  const isEditing = form.dataset.editMode === 'true';
  const saved     = isEditing
    ? JSON.parse(localStorage.getItem('geoply_aspirante'))
    : null;

  btn.classList.add('loading');
  btn.textContent = 'Enviando…';
  if (errEl) errEl.classList.remove('visible');

  const data = {
    nombre:              form.nombre.value.trim(),
    correo:              form.correo.value.trim(),
    telefono:            form.telefono.value.trim(),
    municipio:           form.municipio.value.trim(),
    nivel_educativo:     form.nivel_educativo.value,
    experiencia_anios:   parseInt(form.experiencia_anios.value) || 0,
    area_interes:        form.area_interes.value,
    aspiracion_salarial: parseInt(form.aspiracion_salarial.value) || 0,
    descripcion:         form.descripcion?.value?.trim() || '',
  };

  try {
    const url    = isEditing && saved?.id
      ? `/api/registro-aspirante/${saved.id}`
      : '/api/registro-aspirante';
    const method = isEditing && saved?.id ? 'PUT' : 'POST';

    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);
    const result = await res.json();

    if (result.success) {
      localStorage.setItem('geoply_aspirante',
        JSON.stringify({ ...data, id: result.id || saved?.id }));
      form.style.display = '';
      delete form.dataset.editMode;
      btn.textContent = 'Registrarme en GeoPly';
      form.style.display = 'none';
      if (succEl) succEl.classList.add('visible');
    } else {
      throw new Error(result.error || 'Error desconocido');
    }
  } catch (err) {
    console.warn('[GeoPly] registro aspirante (modo offline):', err.message);
    localStorage.setItem('geoply_aspirante',
      JSON.stringify({ ...data, id: saved?.id || Date.now() }));
    form.style.display = 'none';
    delete form.dataset.editMode;
    btn.textContent = 'Registrarme en GeoPly';
    if (succEl) succEl.classList.add('visible');
  } finally {
    btn.classList.remove('loading');
  }
};

let currentDatasetId = null;
let dashView         = 'charts';

window.openDashboard = function (datasetId) {
  const overlay = document.getElementById('dashboard-overlay');
  if (overlay) overlay.classList.remove('hidden');
  renderDatasetList();
  if (datasetId) selectDataset(datasetId);
};

window.closeDashboard = function () {
  const overlay = document.getElementById('dashboard-overlay');
  if (overlay) overlay.classList.add('hidden');
};

window.setDashView = function (view) {
  dashView = view;
  document.querySelectorAll('.dash-view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  renderDashContent();
};

window.filtrarDashboard = function () { renderDashContent(); };

window.refrescarDataset = function () {
  if (currentDatasetId) {
    delete DATA_CACHE[currentDatasetId];
    loadAllDatasets();
  }
};

function renderDatasetList() {
  const el = document.getElementById('dataset-list');
  if (!el) return;
  el.innerHTML = DATASETS.map(ds => {
    const cached = DATA_CACHE[ds.id];
    const badge  = cached === undefined ? 'pending' : Array.isArray(cached) ? 'ok' : 'error';
    const badgeTxt = badge === 'pending' ? 'Cargando' : badge === 'ok' ? `${cached.length} reg.` : 'Error';
    return `
      <button class="dataset-btn ${currentDatasetId === ds.id ? 'active' : ''}" onclick="selectDataset('${ds.id}')">
        <span class="dataset-btn-name">${ds.name}</span>
        <div class="dataset-btn-meta">
          <span class="dataset-btn-id">${ds.id}</span>
          <span class="dataset-btn-badge ${badge}">${badgeTxt}</span>
        </div>
      </button>`;
  }).join('');
}

function selectDataset(id) {
  currentDatasetId = id;
  renderDatasetList();
  renderDashContent();
}

function renderDashContent() {
  const contenedor = document.getElementById('dash-contenedor');
  const estadoEl   = document.getElementById('dash-estado');
  if (!contenedor) return;

  if (!currentDatasetId) {
    contenedor.innerHTML = '<div class="dash-msg dash-empty">Selecciona un conjunto de datos en el panel izquierdo.</div>';
    if (estadoEl) estadoEl.textContent = 'Sin selección';
    return;
  }

  const ds      = DATASETS.find(d => d.id === currentDatasetId);
  const records = DATA_CACHE[currentDatasetId];

  if (!records) {
    contenedor.innerHTML = '<div class="dash-msg dash-empty">Cargando datos…</div>';
    if (estadoEl) estadoEl.textContent = 'Cargando…';
    return;
  }

  if (!Array.isArray(records)) {
    contenedor.innerHTML = '<div class="dash-msg dash-error">Error al cargar este conjunto de datos.</div>';
    if (estadoEl) estadoEl.textContent = 'Error';
    return;
  }

  const q       = (document.getElementById('dash-search')?.value || '').toLowerCase().trim();
  const filtered = q
    ? records.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)))
    : records;

  if (estadoEl) estadoEl.textContent = `${filtered.length} de ${records.length} registros · ${ds?.name || ''}`;

  if (dashView === 'charts') {
    contenedor.innerHTML = renderCharts(filtered, records, ds);
  } else {
    contenedor.innerHTML = filtered.length === 0
      ? '<div class="dash-msg dash-empty">Sin resultados para esa búsqueda.</div>'
      : filtered.slice(0, 60).map((r, i) => renderRecordCard(r, i, ds)).join('');
  }
}

function renderRecordCard(r, i, ds) {
  const entries = Object.entries(r).filter(([k]) => !k.startsWith(':'));
  const score   = calcularScoreSimulado(r);
  const geo     = extractGeo(r);
  const geoBtn  = geo
    ? `<button class="popup-action-btn dash-map-btn" onclick="closeDashboard();flyTo(${geo.lat},${geo.lng},14)">📍 Ver en mapa</button>`
    : '';
  return `
    <div class="dash-card">
      <h3>${ds?.name || 'Registro'} · #${i + 1}
        <span class="verificada-badge">GeoPly ${score}%</span>
      </h3>
      ${entries.slice(0, 8).map(([k, v]) => `
        <div class="dato">
          <strong>${formatearTitulo(k)}</strong>
          <span>${v || 'N/D'}</span>
        </div>`).join('')}
      ${geoBtn}
    </div>`;
}

function renderCharts(filtered, all, ds) {
  const total    = all.length;
  const geoCount = EMPLEO_RECORDS.filter(r => r.datasetId === currentDatasetId).length;
  const keys     = Object.keys(all[0] || {}).filter(k => !k.startsWith(':'));
  const strKeys  = keys.filter(k => {
    const vals = all.map(r => r[k]).filter(v => typeof v === 'string' && v.trim() && v.length < 50);
    return vals.length > total * 0.5;
  });

  let charts = `
    <div class="dash-card overview-card chart-card">
      <h3>Resumen General</h3>
      <div class="stat-grid stat-grid-4">
        <div class="stat-box"><div class="stat-label">Total registros</div><div class="stat-value">${total}</div></div>
        <div class="stat-box"><div class="stat-label">Geolocalizados</div><div class="stat-value" style="color:#4fc3f7">${geoCount}</div></div>
        <div class="stat-box"><div class="stat-label">Cobertura geo</div><div class="stat-value" style="color:#00ff88">${total > 0 ? Math.round(geoCount / total * 100) : 0}%</div></div>
        <div class="stat-box"><div class="stat-label">Campos</div><div class="stat-value" style="color:#a78bfa">${keys.length}</div></div>
      </div>
    </div>`;

  strKeys.slice(0, 3).forEach(key => {
    const counts = {};
    all.forEach(r => {
      const v = (r[key] || '').trim();
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!sorted.length) return;

    const maxVal = sorted[0][1];
    const colors = CATEGORY_COLORS;

    charts += `
      <div class="dash-card chart-card chart-card-wide">
        <h3>${formatearTitulo(key)}</h3>
        <div class="chart-bars">
          ${sorted.map(([v, c], i) => `
            <div class="chart-bar-row">
              <span class="chart-bar-label" title="${v}">${v}</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width:${Math.round((c / maxVal) * 100)}%;background:${colors[i % colors.length]}"></div>
              </div>
              <span class="chart-bar-val">${c}</span>
            </div>`).join('')}
        </div>
      </div>`;
  });

  return charts;
}

/* ═══════════════════════════════════════════════════════════
   HELPER
═══════════════════════════════════════════════════════════ */
function formatearTitulo(str) {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}