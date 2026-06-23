'use strict';

const DATASETS = Object.freeze([
  { id:'yix6-7yeh', name:'Indicadores del mercado laboral' },
  { id:'2c7k-9iru', name:'Vacantes de empleo' },
  { id:'khhm-wccm', name:'Demanda laboral por sector' },
  { id:'xs69-evan', name:'Oferta de empleo' },
  { id:'2v94-3ypi', name:'Perfiles ocupacionales' },
  { id:'canv-4tj3', name:'Estadísticas de empleo' },
  { id:'daed-z4fw', name:'Tendencias de contratación' },
  { id:'tgvn-r2n9', name:'Empleabilidad regional' },
  { id:'fvq4-wwtz', name:'Sectores económicos' },
  { id:'8pqf-rmzr', name:'Formación para el empleo' },
  { id:'28vu-5tx7', name:'Registro general de referencia' },
]);

const RECORD_LIMIT = 40;
const FETCH_TIMEOUT_MS = 12000;

const DATA_CACHE = {};    
const DATA_STATUS = {};        
let EMPLEO_RECORDS = [];        
let activeDatasetId = null;     

// A new state to track if the summary view is active
let isSummaryViewActive = false;

function buildResourceUrl(id) {
  return `https://www.datos.gov.co/resource/${id}.json?$limit=${RECORD_LIMIT}`;
}

async function fetchDataset(id) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(buildResourceUrl(id), { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    clearTimeout(t);
    console.warn(`[GeoPly] Error consultando dataset ${id}:`, e.message || e);
    return null;
  }
}

async function loadAllDatasets() {
  let loaded = 0;

  for (const ds of DATASETS) {
    DATA_STATUS[ds.id] = 'pending';
    renderDatasetList();

    const records = await fetchDataset(ds.id);

    if (records === null) {
      DATA_STATUS[ds.id] = 'error';
      DATA_CACHE[ds.id] = [];
    } else {
      DATA_STATUS[ds.id] = 'ok';
      DATA_CACHE[ds.id] = records;
      loaded++;
    }

    renderDatasetList();
    if (typeof updateSummary === 'function') updateSummary(loaded, DATASETS.length);
  }

  buildEmpleoRecords();
  detectCategoryField();

  if (typeof buildCategoryChips === 'function') buildCategoryChips();
  if (typeof buildTrendInsights === 'function') buildTrendInsights();
  if (typeof buildMapLayers === 'function') buildMapLayers();

  const statusEl = document.getElementById('data-status');
  if (statusEl) {
    statusEl.textContent = loaded > 0
      ? `${loaded}/${DATASETS.length} conjuntos cargados · ${EMPLEO_RECORDS.length} ubicados`
      : 'No se pudo conectar con datos.gov.co';
  }
}

function buildEmpleoRecords() {
  EMPLEO_RECORDS = [];
  for (const ds of DATASETS) {
    const recs = DATA_CACHE[ds.id] || [];
    recs.forEach((record, index) => {
      const geo = extractGeo(record);
      if (geo) {
        EMPLEO_RECORDS.push({
          datasetId: ds.id,
          datasetName: ds.name,
          index,
          geo,
          record,
        });
      }
    });
  }
}

function buildEconomyEmploymentCard() {
  return `
    <article class="dash-card chart-card overview-card" style="grid-column: 1 / -1;">
      <h3>Economía y Empleo</h3>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Tasa de Crecimiento del Empleo</div>
          <div class="stat-value" style="color:var(--mde-neon)">--%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Tasa de Desempleo</div>
          <div class="stat-value" style="color:var(--blue)">--%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Sectores con Mayor Demanda</div>
          <div class="stat-value" style="color:var(--gold)">--</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Nuevas Vacantes</div>
          <div class="stat-value" style="color:var(--purple)">--</div>
        </div>
      </div>
    </article>
  `;
}

function detectCategoryField() {
  const fieldStats = {};

  for (const item of EMPLEO_RECORDS) {
    for (const [key, val] of Object.entries(item.record)) {
      if (typeof val !== 'string') continue;
      const trimmed = val.trim();
      if (!trimmed || trimmed.length > 40) continue;

      if (!fieldStats[key]) fieldStats[key] = { count: 0, values: new Map() };
      fieldStats[key].count++;
      const lk = trimmed.toLowerCase();
      if (!fieldStats[key].values.has(lk)) fieldStats[key].values.set(lk, trimmed);
    }
  }

  let best = null, bestScore = -1;
  for (const [field, stats] of Object.entries(fieldStats)) {
    const card = stats.values.size;
    if (card < 2 || card > 12) continue;
    if (stats.count > bestScore) {
      bestScore = stats.count;
      best = field;
    }
  }

  STATE.categoryField = best;
  STATE.categories = best ? [...fieldStats[best].values.values()] : [];

  STATE.categoryCounts = {};
  if (best) {
    for (const item of EMPLEO_RECORDS) {
      const v = item.record[best];
      if (typeof v !== 'string') continue;
      const key = v.trim();
      STATE.categoryCounts[key] = (STATE.categoryCounts[key] || 0) + 1;
    }
  }
}

function renderDatasetList() {
  const el = document.getElementById('dataset-list');
  if (!el) return;

  const summaryBtnHtml = `
    <button class="dataset-btn ${isSummaryViewActive ? 'active' : ''}" onclick="showSummaryView()">
      <span class="dataset-btn-name">📊 Resumen General</span>
    </button>
  `;

  const datasetBtnsHtml = DATASETS.map(ds => {
    const status = DATA_STATUS[ds.id] || 'pending';
    const count = (DATA_CACHE[ds.id] || []).length;
    const isActive = ds.id === activeDatasetId;

    let badge = '⏳';
    if (status === 'ok')    badge = `${count}`;
    if (status === 'error') badge = '⚠';

    return `
      <button class="dataset-btn ${isActive ? 'active' : ''}" onclick="showDataset('${ds.id}')">
        <span class="dataset-btn-name">${ds.name}</span>
        <span class="dataset-btn-meta">
          <span class="dataset-btn-id">${ds.id}</span>
          <span class="dataset-btn-badge ${status}">${badge}</span>
        </span>
      </button>
    `;
  }).join('');
  
  el.innerHTML = summaryBtnHtml + datasetBtnsHtml;
}

function showSummaryView() {
  isSummaryViewActive = true;
  activeDatasetId = null;
  renderDatasetList();

  const contenedor = document.getElementById('dash-contenedor');
  if (contenedor) {
    contenedor.innerHTML = buildEconomyEmploymentCard();
  }

  const estado = document.getElementById('dash-estado');
  if (estado) estado.textContent = 'Resumen de Economía y Empleo';

  document.getElementById('dash-view-controls').style.display = 'none';
  document.getElementById('dash-search').style.display = 'none';
}

async function showDataset(id) {
  isSummaryViewActive = false;
  activeDatasetId = id;
  renderDatasetList();

  document.getElementById('dash-view-controls').style.display = 'flex';
  document.getElementById('dash-search').style.display = 'block';

  const estado = document.getElementById('dash-estado');
  const search = document.getElementById('dash-search');
  if (search) search.value = '';

  const ds = DATASETS.find(d => d.id === id);

  if (DATA_CACHE[id] === undefined || DATA_STATUS[id] === 'pending') {
    if (estado) estado.textContent = `Consultando "${ds.name}"…`;
    document.getElementById('dash-contenedor').innerHTML = '';
    DATA_STATUS[id] = 'pending';
    renderDatasetList();
    const records = await fetchDataset(id);
    DATA_CACHE[id] = records || [];
    DATA_STATUS[id] = records === null ? 'error' : 'ok';
    renderDatasetList();
    buildEmpleoRecords();
    if (typeof buildMapLayers === 'function') buildMapLayers();
  }

  const records = DATA_CACHE[id] || [];

  if (DATA_STATUS[id] === 'error') {
    if (estado) estado.textContent = '';
    document.getElementById('dash-contenedor').innerHTML = `
      <div class="dash-msg dash-error">
        ⚠ No se pudo consultar este conjunto de datos. Verifica tu conexión e intenta
        "Actualizar".
      </div>
    `;
    return;
  }

  if (records.length === 0) {
    if (estado) estado.textContent = '';
    document.getElementById('dash-contenedor').innerHTML = `
      <div class="dash-msg dash-empty">No se encontraron registros en este conjunto de datos.</div>
    `;
    return;
  }

  if (estado) estado.textContent = `${ds.name} · ${records.length} registros`;

  const currentMode = dashViewMode;
  dashViewMode = null; 
  setTimeout(() => {
    setDashView(currentMode);
  }, 0);
}


// ... (The rest of the file remains the same, but we need to adjust openDashboard)

window.openDashboard = function(datasetId) {
  const overlay = document.getElementById('dashboard-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');

  if (datasetId) {
    showDataset(datasetId);
  } else if (!activeDatasetId && !isSummaryViewActive) {
    // If nothing is selected, show the first dataset by default
    const first = DATASETS.find(d => (DATA_CACHE[d.id] || []).length > 0) || DATASETS[0];
    showDataset(first.id);
  }
};

function formatearTitulo(texto) {
  return String(texto)
    .replaceAll('_', ' ')
    .replaceAll('.', ' ')
    .toLowerCase();
}

const CHART_COLORS = [
  '#00ff88', '#4fc3f7', '#ffd700', '#a78bfa', '#ff8c69',
  '#7dff88', '#f0c040', '#ff80ab', '#80d8ff', '#7da893',
];

let dashViewMode = 'charts';

window.setDashView = function(mode) {
  dashViewMode = mode;
  document.querySelectorAll('.dash-view-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === mode)
  );
  filtrarDashboard();
};

function renderDashboardView(records, datasetId) {
  if (dashViewMode === 'records') {
    renderDashCards(records, datasetId);
  } else {
    renderDashCharts(records, datasetId);
  }
}

function analyzeRecords(records) {
  const fields = {}; // campo -> array de valores no vacíos

  records.forEach(r => {
    Object.entries(r).forEach(([k, v]) => {
      if (k.startsWith(':')) return;
      if (v && typeof v === 'object') return; // omite geo-points, etc.
      if (v === '' || v === null || v === undefined) return;
      if (!fields[k]) fields[k] = [];
      fields[k].push(v);
    });
  });

  const categorical = [];
  const numeric = [];

  for (const [key, values] of Object.entries(fields)) {
    if (values.length < 2) continue;

    const allNumeric = values.every(v => String(v).trim() !== '' && isFinite(parseFloat(v)));
    if (allNumeric) {
      numeric.push({ key, nums: values.map(v => parseFloat(v)) });
      continue;
    }

    const strs = values.map(v => String(v).trim()).filter(v => v.length > 0 && v.length <= 40);
    if (strs.length < values.length * 0.7) continue;

    const uniq = new Map();
    strs.forEach(s => { const lk = s.toLowerCase(); if (!uniq.has(lk)) uniq.set(lk, s); });

    if (uniq.size >= 2 && uniq.size <= 15 && uniq.size < strs.length) {
      categorical.push({ key, values: strs });
    }
  }

  return { categorical, numeric, total: records.length };
}

function findLabelField(records) {
  const candidates = ['nombre', 'nombre completo', 'titulo', 'title', 'cargo', 'empresa',
    'municipio', 'ciudad', 'denominacion', 'descripcion', 'ocupacion', 'programa', 'sector'];
  if (!records.length) return null;
  for (const key of Object.keys(records[0])) {
    if (candidates.includes(normalizeKey(key))) return key;
  }
  return null;
}

function formatNum(n) {
  if (!isFinite(n)) return '–';
  if (Math.abs(n) >= 1000) return n.toLocaleString('es-CO', { maximumFractionDigits: 1 });
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function renderDashCharts(records, datasetId) {
  const contenedor = document.getElementById('dash-contenedor');
  if (!contenedor) return;

  if (!records.length) {
    contenedor.innerHTML = `<div class="dash-msg dash-empty">Sin registros para graficar con el filtro actual.</div>`;
    return;
  }

  const analysis = analyzeRecords(records);
  const geoCount = records.filter(r => extractGeo(r)).length;
  const labelField = findLabelField(records);

  let html = buildOverviewCard(records.length, geoCount, analysis);

  analysis.categorical.slice(0, 4).forEach(field => {
    html += buildCategoryChartCard(field);
  });

  analysis.numeric.slice(0, 4).forEach(field => {
    html += buildNumericChartCard(field, records, labelField);
  });

  if (!analysis.categorical.length && !analysis.numeric.length) {
    html += `
      <div class="dash-msg dash-empty" style="grid-column:1 / -1">
        No se encontraron suficientes campos numéricos o categóricos para graficar
        este conjunto. Cambia a la vista <strong>"Registros"</strong> para ver el detalle completo.
      </div>
    `;
  }

  contenedor.innerHTML = html;
}

function buildOverviewCard(total, geoCount, analysis) {
  return `
    <article class="dash-card chart-card overview-card">
      <h3>Resumen del conjunto</h3>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Registros</div>
          <div class="stat-value" style="color:var(--mde-neon)">${total}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Geolocalizados</div>
          <div class="stat-value" style="color:var(--blue)">${geoCount}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Campos categóricos</div>
          <div class="stat-value" style="color:var(--gold)">${analysis.categorical.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Campos numéricos</div>
          <div class="stat-value" style="color:var(--purple)">${analysis.numeric.length}</div>
        </div>
      </div>
    </article>
  `;
}

function buildCategoryChartCard(field) {
  const counts = new Map();
  field.values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));

  let sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 7);
  const otherCount = sorted.slice(7).reduce((acc, [, c]) => acc + c, 0);
  if (otherCount > 0) top.push(['Otros', otherCount]);

  const total = field.values.length;
  let acc = 0;
  const gradientParts = top.map(([, count], i) => {
    const pct = (count / total) * 100;
    const start = acc;
    acc += pct;
    return `${CHART_COLORS[i % CHART_COLORS.length]} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
  });
  const gradient = `conic-gradient(${gradientParts.join(', ')})`;

  const legend = top.map(([label, count], i) => {
    const pct = ((count / total) * 100).toFixed(1);
    return `
      <div class="pie-legend-row">
        <span class="pie-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
        <span class="pie-label" title="${label}">${label}</span>
        <span class="pie-val">${count} · ${pct}%</span>
      </div>
    `;
  }).join('');

  return `
    <article class="dash-card chart-card">
      <h3>${formatearTitulo(field.key)}</h3>
      <div class="pie-wrap">
        <div class="pie-chart" style="background:${gradient}"></div>
        <div class="pie-legend">${legend}</div>
      </div>
    </article>
  `;
}

function buildNumericChartCard(field, records, labelField) {
  const nums = field.nums;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = sum / nums.length;

  const indexed = records
    .map((r, i) => ({ r, i, val: parseFloat(r[field.key]) }))
    .filter(x => isFinite(x.val));
  indexed.sort((a, b) => b.val - a.val);
  const top = indexed.slice(0, 8);
  const topMax = top.length ? Math.max(...top.map(t => t.val), 1) : 1;

  const bars = top.map((item, i) => {
    let label = `Registro ${item.i + 1}`;
    if (labelField && item.r[labelField]) {
      label = String(item.r[labelField]);
      if (label.length > 30) label = label.slice(0, 30) + '…';
    }
    const pct = topMax > 0 ? (item.val / topMax) * 100 : 0;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    return `
      <div class="chart-bar-row">
        <span class="chart-bar-label" title="${label}">${label}</span>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct.toFixed(0)}%;background:${color}"></div></div>
        <span class="chart-bar-val">${formatNum(item.val)}</span>
      </div>
    `;
  }).join('');

  return `
    <article class="dash-card chart-card chart-card-wide">
      <h3>${formatearTitulo(field.key)}</h3>
      <div class="stat-grid stat-grid-4">
        <div class="stat-box"><div class="stat-label">Mínimo</div><div class="stat-value">${formatNum(min)}</div></div>
        <div class="stat-box"><div class="stat-label">Máximo</div><div class="stat-value">${formatNum(max)}</div></div>
        <div class="stat-box"><div class="stat-label">Promedio</div><div class="stat-value">${formatNum(avg)}</div></div>
        <div class="stat-box"><div class="stat-label">Suma</div><div class="stat-value">${formatNum(sum)}</div></div>
      </div>
      <div class="chart-bars">${bars}</div>
    </article>
  `;
}

function renderDashCards(records, datasetId) {
  const contenedor = document.getElementById('dash-contenedor');
  if (!contenedor) return;

  if (!records.length) {
    contenedor.innerHTML = `<div class="dash-msg dash-empty">Sin registros para mostrar con el filtro actual.</div>`;
    return;
  }

  contenedor.innerHTML = records.map((item, i) => {
    const geo = extractGeo(item);
    let campos = '';

    Object.entries(item).forEach(([clave, valor]) => {
      if (clave.startsWith(':')) return;
      let display = valor;
      if (display && typeof display === 'object') display = JSON.stringify(display);
      campos += `
        <div class="dato">
          <strong>${formatearTitulo(clave)}</strong>
          <span>${display !== null && display !== undefined && display !== '' ? display : 'No especificado'}</span>
        </div>
      `;
    });

    const mapBtn = geo ? `
      <button class="popup-action-btn dash-map-btn" onclick="verEnMapa('${datasetId}', ${i})">
        📍 Ver ubicación en el mapa
      </button>
    ` : '';

    return `
      <article class="dash-card">
        <h3>Registro ${i + 1}</h3>
        ${campos}
        ${mapBtn}
      </article>
    `;
  }).join('');
}

function filtrarDashboard() {
  if (isSummaryViewActive) return;
  if (!activeDatasetId) return;
  
  const texto = (document.getElementById('dash-search').value || '').toLowerCase();
  const datos = DATA_CACHE[activeDatasetId] || [];
  const ds = DATASETS.find(d => d.id === activeDatasetId);

  if (!texto) {
    renderDashboardView(datos, activeDatasetId);
    document.getElementById('dash-estado').textContent = `${ds.name} · ${datos.length} registros`;
    return;
  }

  const filtrados = datos.filter(item =>
    Object.values(item).some(v => String(v).toLowerCase().includes(texto))
  );

  renderDashboardView(filtrados, activeDatasetId);
  document.getElementById('dash-estado').textContent =
    `Mostrando ${filtrados.length} de ${datos.length} registros`;
}

async function refrescarDataset() {
  if (isSummaryViewActive) {
    // Here you could re-calculate the summary data in the future
    return;
  }
  if (!activeDatasetId) return;

  const id = activeDatasetId;
  const estado = document.getElementById('dash-estado');
  if (estado) estado.textContent = 'Actualizando…';
  DATA_STATUS[id] = 'pending';
  renderDatasetList();

  const records = await fetchDataset(id);
  DATA_CACHE[id] = records || [];
  DATA_STATUS[id] = records === null ? 'error' : 'ok';
  renderDatasetList();
  buildEmpleoRecords();
  detectCategoryField();
  if (typeof buildCategoryChips === 'function') buildCategoryChips();
  if (typeof buildTrendInsights === 'function') buildTrendInsights();
  if (typeof buildMapLayers === 'function') buildMapLayers();

  showDataset(id);
}

function verEnMapa(datasetId, index) {
  const item = (DATA_CACHE[datasetId] || [])[index];
  const geo = item ? extractGeo(item) : null;
  if (!geo) return;

  closeDashboard();

  if (typeof flyTo === 'function') flyTo(geo.lat, geo.lng, 13);
  if (typeof openRecordDetail === 'function') {
    openRecordDetail(datasetId, index);
  }
}

window.closeDashboard = function() {
  const overlay = document.getElementById('dashboard-overlay');
  if (overlay) overlay.classList.add('hidden');
};