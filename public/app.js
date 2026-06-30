'use strict';

const MAP_CENTER = [4.5709, -74.2973];
const MAP_ZOOM   = 5;

const CATEGORY_COLORS = [
  '#00ff88', '#4fc3f7', '#ffd700', '#ff5252', '#a78bfa',
  '#ff8c69', '#7dff88', '#f0c040', '#00c45e', '#80d8ff',
  '#ff80ab', '#7da893',
];

const STATE = {
  layers:           { oportunidad: true, departamentos: true },
  selectedCategory: 'all',
  categoryField:    null,
  categories:       [],
  categoryCounts:   {},
  selectedRecord:   null,
  aiEnabled:        true,
  sidebarLeftOpen:  false,
  sidebarRightOpen: false,
};

let MAP          = null;
let markerLayer   = null;
let heatLayer     = null;
let deptLayer     = null;
let activeMarker  = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
    initMap();
    updateAIToggleUI();
    restoreCategoryFilter();
    loadAllDatasets();
    setInterval(refreshLastSyncLabel, 30000);
  } catch (err) {
    console.error('[GeoPly] Init error:', err);
    showError();
  }
});

function refreshLastSyncLabel() {
  if (typeof LAST_API_SYNC === 'undefined' || !LAST_API_SYNC) return;
  const valEl = document.querySelector('#opp-bars .bar-row:last-child .bar-val');
  const rowNameEl = document.querySelector('#opp-bars .bar-row:last-child .bar-name');
  if (valEl && rowNameEl && rowNameEl.textContent === 'Última sincronización') {
    valEl.textContent = formatLastSync(LAST_API_SYNC);
  }
}

function showError() {
  const loading = document.getElementById('map-loading');
  if (loading) loading.style.display = 'none';
  const error = document.getElementById('map-error');
  if (error) error.classList.remove('hidden');
}

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
  deptLayer   = L.layerGroup().addTo(MAP);

  const loaderTimer = setTimeout(hideLoader, 900);
  MAP.once('load', () => { clearTimeout(loaderTimer); hideLoader(); });

  setTimeout(() => { if (MAP) MAP.invalidateSize({ animate: false }); }, 120);
  MAP.once('load', stampPerf);

  renderDepartamentos();
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

function setSidebarState(side, open) {
  const sidebarEl = document.querySelector(side === 'left' ? '.sidebar-left' : '.sidebar-right');
  const toggleEl  = document.getElementById(side === 'left' ? 'toggle-left' : 'toggle-right');
  if (!sidebarEl || !toggleEl) return;

  sidebarEl.classList.toggle('collapsed', !open);
  toggleEl.classList.toggle('closed', !open);

  toggleEl.textContent = side === 'left'
    ? (open ? '‹' : '›')
    : (open ? '›' : '‹');

  STATE[side === 'left' ? 'sidebarLeftOpen' : 'sidebarRightOpen'] = open;
}

window.toggleSidebar = function (side) {
  const key = side === 'left' ? 'sidebarLeftOpen' : 'sidebarRightOpen';
  setSidebarState(side, !STATE[key]);
};

function showBothSidebars() {
  setSidebarState('left', true);
  setSidebarState('right', true);
}

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

function buildMapLayers() {
  if (!MAP) return;
  if (markerLayer) markerLayer.clearLayers();
  if (heatLayer) { try { MAP.removeLayer(heatLayer); } catch (e) {} heatLayer = null; }
  activeMarker = null;
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

    marker.bindTooltip(buildEmpleoTooltip(item), {
      direction: 'top',
      offset: [0, -6],
      className: 'geoply-tooltip',
      opacity: 1,
    });

    marker.on('click', () => onMarkerClick(item, marker)); // NUEVO: se pasa el marcador
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

function buildEmpleoTooltip(item) {
  const r = item.record;
  const categoria = STATE.categoryField ? r[STATE.categoryField] : null;
  return `
    <div class="gt-name">${item.datasetName}</div>
    <div class="gt-meta">Registro #${item.index + 1}${item.geo.approx ? ' · ubicación aprox.' : ''}</div>
    ${categoria ? `<span class="gt-cat">${categoria}</span>` : ''}
  `;
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

function onMarkerClick(item, marker = null) {
  if (!STATE.aiEnabled) return;
  STATE.selectedRecord = { datasetId: item.datasetId, index: item.index };
  showBothSidebars();
  setActiveMarker(marker);
  showDetailSkeleton();
  setTimeout(() => openRecordDetail(item.datasetId, item.index), 220);
}

function setActiveMarker(marker) {
  if (activeMarker && activeMarker !== marker) {
    const prevEl = activeMarker.getElement && activeMarker.getElement();
    if (prevEl) prevEl.classList.remove('marker-active-pulse');
    try { activeMarker.setStyle({ radius: 6, weight: 1.2 }); } catch (e) {}
  }
  activeMarker = marker || null;
  if (activeMarker) {
    try { activeMarker.setStyle({ radius: 9, weight: 2 }); } catch (e) {}
    const el = activeMarker.getElement && activeMarker.getElement();
    if (el) el.classList.add('marker-active-pulse');
  }
}

function showDetailSkeleton() {
  const emptyEl    = document.getElementById('detail-empty');
  const detailEl   = document.getElementById('record-detail');
  const disabledEl = document.getElementById('detail-disabled');
  const skelEl     = document.getElementById('detail-skeleton');

  if (emptyEl)    emptyEl.classList.add('hidden');
  if (detailEl)   detailEl.classList.add('hidden');
  if (disabledEl) disabledEl.classList.add('hidden');
  if (skelEl)     skelEl.classList.remove('hidden');
}

function hideDetailSkeleton() {
  const skelEl = document.getElementById('detail-skeleton');
  if (skelEl) skelEl.classList.add('hidden');
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

const CATEGORY_STORAGE_KEY = 'geoply_categoria_seleccionada';

window.setCategory = function (val) {
  STATE.selectedCategory = val;
  try { sessionStorage.setItem(CATEGORY_STORAGE_KEY, val); } catch (e) {}
  buildCategoryChips();
  buildMapLayers();
};

function restoreCategoryFilter() {
  try {
    const saved = sessionStorage.getItem(CATEGORY_STORAGE_KEY);
    if (saved) STATE.selectedCategory = saved;
  } catch (e) {}
}

function deptColor(td) {
  if (td <= 8)   return '#00ff88';
  if (td <= 10.5) return '#ffd700';
  return '#ff5252';
}

function renderDepartamentos() {
  if (typeof DEPARTAMENTOS_EMPLEO === 'undefined' || !deptLayer) return;
  deptLayer.clearLayers();
  if (!STATE.layers.departamentos) return;

  DEPARTAMENTOS_EMPLEO.forEach(d => {
    const color = deptColor(d.td);
    let marker;
    try {
      marker = L.circleMarker([d.lat, d.lng], {
        radius: 8,
        fillColor: color,
        fillOpacity: 0.8,
        color: 'rgba(255,255,255,0.35)',
        weight: 1.4,
      });
    } catch (e) { return; }

    const tendencia = (typeof d.td_2018 === 'number')
      ? (d.td < d.td_2018
          ? `📉 Bajó desde ${d.td_2018}% en 2018`
          : `📈 Subió desde ${d.td_2018}% en 2018`)
      : '';

    marker.bindPopup(`
      <div class="popup-body">
        <div class="popup-name">${d.nombre}</div>
        <div class="popup-meta">Departamento · DANE GEIH 2025</div>
        <div class="popup-growth"><strong>Desocupación (TD):</strong> ${d.td}%</div>
        <div class="popup-growth"><strong>Ocupación (TO):</strong> ${d.to}%</div>
        <div class="popup-growth"><strong>Participación (TGP):</strong> ${d.tgp}%</div>
        <div class="popup-growth"><strong>Subocupación (TS):</strong> ${d.ts}%</div>
        <div class="popup-growth"><strong>Población total:</strong> ${d.pob_total.toLocaleString()} mil</div>
        <div class="popup-growth"><strong>Población ocupada:</strong> ${d.pob_ocupada.toLocaleString()} mil</div>
        ${tendencia ? `<div class="popup-meta">${tendencia}</div>` : ''}
      </div>
    `);

    marker.bindTooltip(`
      <div class="gt-name">${d.nombre}</div>
      <div class="gt-meta">TD ${d.td}% · TO ${d.to}%</div>
      <span class="gt-cat" style="background:${color}22;color:${color}">Departamento</span>
    `, { direction: 'top', offset: [0, -6], className: 'geoply-tooltip', opacity: 1 });

    marker.on('click', () => onDeptClick(d, marker)); // NUEVO: se pasa el marcador
    marker.addTo(deptLayer);
  });
}

function onDeptClick(d, marker = null) {
  if (!STATE.aiEnabled) return;
  showBothSidebars();
  setActiveMarker(marker);
  showDetailSkeleton();
  setTimeout(() => openDeptDetail(d), 220);
}

function openDeptDetail(d) {
  const emptyEl    = document.getElementById('detail-empty');
  const detailEl   = document.getElementById('record-detail');
  const disabledEl = document.getElementById('detail-disabled');

  hideDetailSkeleton();

  if (emptyEl)    emptyEl.classList.add('hidden');
  if (detailEl)   detailEl.classList.remove('hidden');
  if (disabledEl) disabledEl.classList.add('hidden');

  const nameEl = document.getElementById('d-name');
  if (nameEl) nameEl.textContent = `${d.nombre} · Departamento`;

  const verdictEl = document.getElementById('d-verdict');
  if (verdictEl) {
    const color = deptColor(d.td);
    verdictEl.textContent  = `TD ${d.td}%`;
    verdictEl.style.cssText = `background:${color}1a;color:${color};border-color:${color}55;`;
  }

  const mEl = document.getElementById('d-metrics');
  if (mEl) {
    const metrics = [
      { lbl:'DESOCUPACIÓN (TD)',   val:`${d.td}%`,  sub:'tasa 2025',        color: deptColor(d.td) },
      { lbl:'OCUPACIÓN (TO)',      val:`${d.to}%`,  sub:'tasa 2025',        color:'#00ff88' },
      { lbl:'PARTICIPACIÓN (TGP)',val:`${d.tgp}%`, sub:'tasa 2025',        color:'#4fc3f7' },
      { lbl:'SUBOCUPACIÓN (TS)',  val:`${d.ts}%`,  sub:'tasa 2025',        color:'#ffd700' },
      { lbl:'POBLACIÓN TOTAL',    val:`${d.pob_total.toLocaleString()}`, sub:'miles de personas', color:'#a78bfa' },
      { lbl:'POBLACIÓN OCUPADA',  val:`${d.pob_ocupada.toLocaleString()}`, sub:'miles de personas', color:'#00ff88' },
    ];
    mEl.innerHTML = metrics.map(m => `
      <div class="metric-box">
        <div class="metric-label">${m.lbl}</div>
        <div class="metric-value" style="color:${m.color}">${m.val}</div>
        <div class="metric-sub">${m.sub}</div>
      </div>`).join('');

    const coordStr = `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`;
    const coordRow = document.createElement('div');
    coordRow.className = 'coord-row';
    coordRow.style.cssText = 'grid-column:1 / -1; margin-top:2px;';
    coordRow.innerHTML = `
      <span style="font-family:var(--ff-mono); font-size:9.5px; color:var(--tx-muted);">${coordStr}</span>
      <button class="copy-coord-btn" onclick="copiarCoordenadas('${coordStr}', this)" title="Copiar coordenadas">📋 Copiar</button>
    `;
    mEl.appendChild(coordRow);
  }

  const aiEl = document.getElementById('d-ai');
  if (aiEl) {
    const tendenciaTxt = (typeof d.td_2018 === 'number')
      ? (d.td < d.td_2018
          ? `La desocupación bajó de <strong>${d.td_2018}%</strong> (2018) a <strong>${d.td}%</strong> (2025): mejora de ${(d.td_2018 - d.td).toFixed(1)} puntos porcentuales.`
          : `La desocupación subió de <strong>${d.td_2018}%</strong> (2018) a <strong>${d.td}%</strong> (2025): incremento de ${(d.td - d.td_2018).toFixed(1)} puntos porcentuales.`)
      : 'No hay dato comparable de 2018 para este departamento.';

    aiEl.innerHTML = `
      <div class="d-ai-title">✦ ANÁLISIS DEL DEPARTAMENTO</div>
      <div class="reasoning-step"><strong>Tendencia 2018 → 2025:</strong> ${tendenciaTxt}</div>
      <div class="reasoning-step"><strong>Población desocupada:</strong> ${d.pob_desocupada.toLocaleString()} mil personas buscando empleo activamente.</div>
      <div class="reasoning-step"><strong>Fuente:</strong> DANE, Gran Encuesta Integrada de Hogares (GEIH), serie anual.</div>
    `;
  }

  const openBtn = document.getElementById('d-open-dataset');
  if (openBtn) openBtn.onclick = null;
}

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

  const bars = [
    { name: 'Datasets cargados',  val: pct,    display: `${loaded}/${total}`, color: '#00ff88' },
    { name: 'Total registros',    val: totalRecords > 0 ? 100 : 0, display: `${totalRecords}`, color: '#a78bfa' },
  ];

  if (typeof DEPARTAMENTOS_EMPLEO !== 'undefined') {
    bars.push({
      name: 'Deptos. DANE/GEIH',
      val: 100,
      display: `${DEPARTAMENTOS_EMPLEO.length}`,
      color: '#4fc3f7',
    });
  }

  if (typeof LAST_API_SYNC !== 'undefined' && LAST_API_SYNC) {
    bars.push({
      name: 'Última sincronización',
      val: 100,
      display: formatLastSync(LAST_API_SYNC),
      color: '#f0c040',
    });
  }

  const barsEl = document.getElementById('opp-bars');
  if (!barsEl) return;
  barsEl.innerHTML = bars.map(b => `
    <div class="bar-row">
      <span class="bar-name">${b.name}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${b.val.toFixed(0)}%;background:${b.color}"></div></div>
      <span class="bar-val" style="color:${b.color}">${b.display}</span>
    </div>`).join('');
}

function formatLastSync(date) {
  if (!(date instanceof Date) || isNaN(date)) return '–';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1)  return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;

  return date.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildTrendInsights() {
  const el = document.getElementById('ai-insights');
  if (!el) return;

  let html = '';

  if (typeof NATIONAL_TRENDS !== 'undefined') {
    const nt = NATIONAL_TRENDS;
    html += `
      <div class="ai-card">
        <div class="ai-card-zone">🇨🇴 Informalidad laboral nacional</div>
        <div class="ai-card-text">${nt.tasa_informalidad_nacional}% de la población ocupada en Colombia
        (${nt.poblacion_ocupada_nacional_miles.toLocaleString()} mil personas) trabaja en condición
        informal — ${nt.poblacion_informal_miles.toLocaleString()} mil personas sin protección laboral formal.</div>
        <span class="ai-badge alta">🔴 Estructural</span>
      </div>
      <div class="ai-card">
        <div class="ai-card-zone">🎓 Empleo y educación universitaria</div>
        <div class="ai-card-text">Los ocupados con educación universitaria crecieron
        ${nt.crecimiento_ocupados_universitarios_pct}% entre 2010 y 2024
        (${nt.ocupados_educ_universitaria_2010_miles.toLocaleString()} → ${nt.ocupados_educ_universitaria_2024_miles.toLocaleString()} mil personas).</div>
        <span class="ai-badge alta">🟢 Tendencia fuerte</span>
      </div>
      <div class="ai-card">
        <div class="ai-card-zone">⚖️ Brecha de género · Bogotá</div>
        <div class="ai-card-text">La tasa de desocupación femenina (${nt.td_mujeres_bogota}%) supera
        en ${nt.brecha_genero_desocupacion_bogota_pp} puntos a la masculina (${nt.td_hombres_bogota}%) en Bogotá.</div>
        <span class="ai-badge media">🟡 Tendencia moderada</span>
      </div>
    `;
  }

  if (!STATE.categoryField || !Object.keys(STATE.categoryCounts).length) {
    if (!html) el.innerHTML = '<p class="hint">Aún no hay suficientes datos para detectar tendencias.</p>';
    else el.innerHTML = html;
    return;
  }
  const total  = EMPLEO_RECORDS.length || 1;
  const sorted = Object.entries(STATE.categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  html += sorted.map(([val, count], i) => {
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

  el.innerHTML = html;
}

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

function openRecordDetail(datasetId, index) {
  const ds     = DATASETS.find(d => d.id === datasetId);
  const record = (DATA_CACHE[datasetId] || [])[index];
  if (!ds || !record) return;

  hideDetailSkeleton();

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
    let coordStr = null;
    if (geo) {
      coordStr = `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`;
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

    if (coordStr) {
      const coordRow = document.createElement('div');
      coordRow.className = 'coord-row';
      coordRow.style.cssText = 'grid-column:1 / -1; margin-top:2px;';
      coordRow.innerHTML = `
        <span style="font-family:var(--ff-mono); font-size:9.5px; color:var(--tx-muted);">${coordStr}</span>
        <button class="copy-coord-btn" onclick="copiarCoordenadas('${coordStr}', this)" title="Copiar coordenadas">📋 Copiar</button>
      `;
      mEl.appendChild(coordRow);
    }
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
  }

  const openBtn = document.getElementById('d-open-dataset');
  if (openBtn) openBtn.onclick = () => openDashboard(datasetId);
}

window.copiarCoordenadas = function (texto, btnEl) {
  const fallbackCopy = () => {
    try {
      const tmp = document.createElement('textarea');
      tmp.value = texto;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.focus();
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      return true;
    } catch (e) { return false; }
  };

  const marcarCopiado = () => {
    if (!btnEl) return;
    const original = btnEl.textContent;
    btnEl.textContent = '✓ Copiado';
    btnEl.classList.add('copied');
    setTimeout(() => {
      btnEl.textContent = original;
      btnEl.classList.remove('copied');
    }, 1600);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto)
      .then(marcarCopiado)
      .catch(() => { if (fallbackCopy()) marcarCopiado(); });
  } else {
    if (fallbackCopy()) marcarCopiado();
  }
};

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
  ['modal-aspirante'].forEach(id => {
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

window.toggleLayer = function (key) {
  if (!(key in STATE.layers)) return;
  STATE.layers[key] = !STATE.layers[key];
  const isOn = STATE.layers[key];

  const toggleEl = document.getElementById(`toggle-${key}`);
  const labelEl  = document.getElementById(`layer-label-${key}`);
  if (toggleEl) {
    toggleEl.classList.toggle('on', isOn);
    toggleEl.classList.toggle('off', !isOn);
    toggleEl.setAttribute('aria-checked', String(isOn));
    const knob = toggleEl.querySelector('.toggle-knob');
    if (knob) {
      knob.classList.toggle('on', isOn);
      knob.classList.toggle('off', !isOn);
    }
  }
  if (labelEl) {
    labelEl.classList.toggle('on', isOn);
    labelEl.classList.toggle('off', !isOn);
  }

  if (key === 'departamentos') {
    renderDepartamentos();
  } else {
    buildMapLayers();
  }
  buildLegendCategories();
};

let howToStep = 1;
const HOWTO_TOTAL_STEPS = 3;

window.abrirHowTo = function () {
  howToStep = 1;
  renderHowToStep();
  const modal = document.getElementById('modal-howto');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

window.cerrarHowTo = function () {
  const modal = document.getElementById('modal-howto');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
};

window.irPasoHowTo = function (n) {
  howToStep = Math.min(Math.max(n, 1), HOWTO_TOTAL_STEPS);
  renderHowToStep();
};

window.pasoSiguienteHowTo = function () {
  if (howToStep >= HOWTO_TOTAL_STEPS) { cerrarHowTo(); return; }
  howToStep++;
  renderHowToStep();
};

window.pasoAnteriorHowTo = function () {
  if (howToStep <= 1) return;
  howToStep--;
  renderHowToStep();
};

function renderHowToStep() {
  document.querySelectorAll('.howto-step').forEach(stepEl => {
    stepEl.classList.toggle('active', Number(stepEl.dataset.step) === howToStep);
  });
  document.querySelectorAll('.howto-dot').forEach(dotEl => {
    dotEl.classList.toggle('active', Number(dotEl.dataset.dot) === howToStep);
  });

  const prevBtn = document.getElementById('howto-prev');
  const nextBtn = document.getElementById('howto-next');
  if (prevBtn) prevBtn.disabled = howToStep === 1;
  if (nextBtn) nextBtn.textContent = howToStep === HOWTO_TOTAL_STEPS ? 'Entendido ✓' : 'Siguiente →';
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('modal-howto');
  if (el) {
    el.addEventListener('click', function (e) {
      if (e.target === el) cerrarHowTo();
    });
  }
});