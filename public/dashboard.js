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
let LAST_API_SYNC = null;

let activeDashDept = null;

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
    LAST_API_SYNC = new Date();
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

    const records = await fetchDataset(ds.id);

    if (records === null) {
      DATA_STATUS[ds.id] = 'error';
      DATA_CACHE[ds.id] = [];
    } else {
      DATA_STATUS[ds.id] = 'ok';
      DATA_CACHE[ds.id] = records;
      loaded++;
    }

    buildEmpleoRecords();
    if (typeof invalidateIndicatorsCache === 'function') invalidateIndicatorsCache();
    if (typeof refreshDeptStyles === 'function') refreshDeptStyles();
    if (document.getElementById('dashboard-overlay') && !document.getElementById('dashboard-overlay').classList.contains('hidden')) {
      renderDeptDashboard(activeDashDept);
    }
  }

  const statusEl = document.getElementById('data-status');
  if (statusEl) {
    statusEl.textContent = loaded > 0
      ? `${loaded}/${DATASETS.length} conjuntos cargados · ${EMPLEO_RECORDS.length} registros ubicados`
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

function formatearTitulo(texto) {
  return String(texto)
    .replaceAll('_', ' ')
    .replaceAll('.', ' ')
    .toLowerCase();
}

window.openDashboard = function (deptName) {
  const overlay = document.getElementById('dashboard-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');

  buildDashDeptOptions();

  activeDashDept = deptName || activeDashDept || (
    typeof STATE !== 'undefined' && STATE.selectedDept ? STATE.selectedDept : DEPARTAMENTOS_EMPLEO[0].nombre
  );

  const searchEl = document.getElementById('dash-search');
  if (searchEl) searchEl.value = activeDashDept;

  renderDeptDashboard(activeDashDept);
};

window.closeDashboard = function () {
  const overlay = document.getElementById('dashboard-overlay');
  if (overlay) overlay.classList.add('hidden');
};

function buildDashDeptOptions() {
  const list = document.getElementById('dash-dept-options');
  if (!list || typeof DEPARTAMENTOS_EMPLEO === 'undefined') return;
  list.innerHTML = DEPARTAMENTOS_EMPLEO
    .slice().sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map(d => `<option value="${d.nombre}"></option>`).join('');
}

window.onDashSearchInput = function () {
  const val = (document.getElementById('dash-search')?.value || '').trim();
  const match = DEPARTAMENTOS_EMPLEO.find(d => d.nombre.toLowerCase() === val.toLowerCase());
  if (match) {
    activeDashDept = match.nombre;
    if (typeof STATE !== 'undefined') STATE.selectedDept = match.nombre;
    if (typeof refreshDeptStyles === 'function') refreshDeptStyles();
    renderDeptDashboard(activeDashDept);
  }
};

function buildSpeExploreCard(deptName) {
  const speUrl = 'https://www.serviciodeempleo.gov.co/busca-empleo/';
  return `
    <article class="dash-card chart-card chart-card-wide spe-explore-card">
      <h3>¿Buscas un sector específico? Explóralo en la fuente oficial</h3>
      <p class="hint spe-cta-text">
        GeoPly todavía no tiene un dato oficial que cruce sector económico y departamento
        ${deptName ? `para <strong>${deptName}</strong>` : ''} — esa combinación no se publica hoy como dato abierto.
        Si quieres profundizar por tu cuenta en un sector puntual (tecnología, salud, agro, etc.),
        el Servicio Público de Empleo permite filtrar vacantes reales por departamento y sector:
      </p>
      <a class="btn-ver-mas" href="${speUrl}" target="_blank" rel="noopener noreferrer">
        Ir al buscador del SPE →
      </a>
    </article>`;
}

function renderDeptDashboard(deptName) {
  const contenedor = document.getElementById('dash-contenedor');
  const estado = document.getElementById('dash-estado');
  if (!contenedor) return;

  if (!deptName || typeof DEPARTAMENTOS_EMPLEO === 'undefined') {
    contenedor.innerHTML = `<div class="dash-msg dash-empty">Selecciona un departamento para ver su análisis.</div>`;
    return;
  }

  const idx = computeAllIndicators();
  const r = idx.byDept[deptName];
  if (!r) {
    contenedor.innerHTML = `<div class="dash-msg dash-error">No hay datos DANE cargados para "${deptName}".</div>`;
    return;
  }

  if (estado) {
    const v = verdictFromScore(r.geoplyScore);
    estado.innerHTML = `${deptName} · GeoPly Score <strong style="color:${v.color}">${r.geoplyScore}/100</strong> · ${v.label} · ${r.registrosAsignados} registros de API asignados a la zona`;
  }

  let html = '';
  html += buildScoreOverviewCard(r);
  html += buildStatCard('idxOportunidad', r, { val: `${r.idxOportunidad}/100`, color: colorForScore(r.geoplyScore) });
  html += buildRatesCard(r);
  html += buildInformalidadCard(r);
  html += buildCrecimientoCard(r);
  html += buildSectoresCard('sectoresDemanda', r, 'Sectores con Mayor Demanda');
  html += buildSectoresCard('sectoresEmergentes', r, 'Sectores Emergentes (cociente de localización)');
  html += buildCategoricalCard('nivelEducativo', r);
  html += buildPctCard('insercionJuvenil', r);
  html += buildGeneroCard(r);
  html += buildStatCard('disponibilidadTalento', r, { val: r.disponibilidadTalento != null ? r.disponibilidadTalento : '—', color:'#a78bfa' });
  html += buildDinamicaCard(r);
  html += buildCompetitividadCard(r);
  html += buildTendenciaCard(r);
  html += buildSpeExploreCard(r.deptName);

  contenedor.innerHTML = html;
}

function narrativeToggleHtml(varKey, r, idSuffix) {
  const id = `nar-${varKey}-${idSuffix}`;
  return `
    <button class="ai-toggle-btn ai-toggle-off" style="margin-top:10px;" onclick="toggleNarrative('${id}')">✦ Explicar este gráfico</button>
    <p id="${id}" class="hint narrative-text hidden" style="text-align:left; padding:8px 0 0;">${narrativeFor(varKey, r)}</p>
  `;
}

window.toggleNarrative = function (id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden');
};

function buildScoreOverviewCard(r) {
  const v = verdictFromScore(r.geoplyScore);
  return `
    <article class="dash-card chart-card overview-card chart-card-wide">
      <h3>15. GeoPly Score — Resumen de ${r.deptName}</h3>
      <div class="stat-grid stat-grid-4">
        <div class="stat-box"><div class="stat-label">GeoPly Score</div><div class="stat-value" style="color:${v.color}">${r.geoplyScore}</div></div>
        <div class="stat-box"><div class="stat-label">Índice Oportunidad</div><div class="stat-value">${r.idxOportunidad}</div></div>
        <div class="stat-box"><div class="stat-label">Ranking Competitividad</div><div class="stat-value">#${r.competitividad.puesto}/${r.competitividad.de}</div></div>
        <div class="stat-box"><div class="stat-label">Registros API asignados</div><div class="stat-value">${r.registrosAsignados}</div></div>
      </div>
      ${narrativeToggleHtml('geoplyScore', r, 'overview')}
    </article>
  `;
}

function buildStatCard(varKey, r, opts) {
  const meta = VARIABLE_META[varKey];
  return `
    <article class="dash-card chart-card">
      <h3>${meta.titulo}</h3>
      <div class="stat-box" style="text-align:center;">
        <div class="stat-value" style="color:${opts.color}; font-size:26px;">${opts.val}</div>
      </div>
      ${narrativeToggleHtml(varKey, r, 'stat')}
    </article>
  `;
}

function buildRatesCard(r) {
  const rows = [
    { name: 'Tasa de Desempleo (TD)', val: r.tasaDesempleo, color:'#ff5252' },
    { name: 'Tasa de Ocupación (TO)', val: r.tasaOcupacion, color:'#00ff88' },
    { name: 'Participación (TGP)', val: r.tasaParticipacion, color:'#4fc3f7' },
    { name: 'Subocupación (TS)', val: r.tasaSubocupacion, color:'#ffd700' },
  ];
  const max = 100;
  const bars = rows.map(row => `
    <div class="chart-bar-row">
      <span class="chart-bar-label">${row.name}</span>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(row.val/max*100).toFixed(0)}%;background:${row.color}"></div></div>
      <span class="chart-bar-val">${row.val}%</span>
    </div>`).join('');
  return `
    <article class="dash-card chart-card chart-card-wide">
      <h3>2-3. Tasas Laborales DANE/GEIH</h3>
      <div class="chart-bars">${bars}</div>
      ${narrativeToggleHtml('tasaDesempleo', r, 'rates')}
    </article>
  `;
}

function buildInformalidadCard(r) {
  const val = r.informalidadEstimada;
  return `
    <article class="dash-card chart-card">
      <h3>${VARIABLE_META.informalidadEstimada.titulo}</h3>
      <div class="stat-box" style="text-align:center;">
        <div class="stat-value" style="color:#ffd700; font-size:26px;">${val != null ? val + '%' : 'Sin dato'}</div>
        <div class="stat-label" style="margin-top:6px;">Estimado — ver explicación</div>
      </div>
      ${narrativeToggleHtml('informalidadEstimada', r, 'inf')}
    </article>
  `;
}

function buildCrecimientoCard(r) {
  const c = r.crecimientoEmpleo;
  const color = !c ? '#7da893' : c.direccion === 'mejora' ? '#00ff88' : c.direccion === 'deterioro' ? '#ff5252' : '#ffd700';
  const arrow = !c ? '—' : c.direccion === 'mejora' ? '▲' : c.direccion === 'deterioro' ? '▼' : '→';
  return `
    <article class="dash-card chart-card">
      <h3>${VARIABLE_META.crecimientoEmpleo.titulo}</h3>
      <div class="stat-box" style="text-align:center;">
        <div class="stat-value" style="color:${color}; font-size:24px;">${arrow} ${c ? Math.abs(c.variacionPP) + ' pp' : 'Sin dato'}</div>
        <div class="stat-label" style="margin-top:6px;">${c ? c.direccion.toUpperCase() : ''}</div>
      </div>
      ${narrativeToggleHtml('crecimientoEmpleo', r, 'crec')}
    </article>
  `;
}

function buildSectoresCard(varKey, r, titulo) {
  const list = r[varKey] || [];
  if (!list.length) {
    return `
      <article class="dash-card chart-card chart-card-wide">
        <h3>${VARIABLE_META[varKey].titulo}</h3>
        <div class="dash-msg dash-empty">Sin suficientes registros geolocalizados en ${r.deptName} para esta variable.</div>
        ${narrativeToggleHtml(varKey, r, varKey)}
      </article>`;
  }
  const max = Math.max(...list.map(s => s.count), 1);
  const bars = list.map((s, i) => {
    const color = CHART_COLORS_LOCAL[i % CHART_COLORS_LOCAL.length];
    const extra = s.pct !== undefined ? `${s.pct}%` : `LQ ${s.lq}`;
    return `
      <div class="chart-bar-row">
        <span class="chart-bar-label" title="${s.label}">${s.label}</span>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(s.count/max*100).toFixed(0)}%;background:${color}"></div></div>
        <span class="chart-bar-val">${extra}</span>
      </div>`;
  }).join('');
  return `
    <article class="dash-card chart-card chart-card-wide">
      <h3>${titulo}</h3>
      <div class="chart-bars">${bars}</div>
      ${narrativeToggleHtml(varKey, r, varKey)}
    </article>
  `;
}

const CHART_COLORS_LOCAL = ['#00ff88', '#4fc3f7', '#ffd700', '#a78bfa', '#ff8c69', '#7dff88', '#f0c040'];

function buildCategoricalCard(varKey, r) {
  const data = r[varKey];
  if (!data) {
    return `
      <article class="dash-card chart-card">
        <h3>${VARIABLE_META[varKey].titulo}</h3>
        <div class="dash-msg dash-empty">Campo no identificado en las fuentes actuales.</div>
        ${narrativeToggleHtml(varKey, r, varKey)}
      </article>`;
  }
  const entries = Object.entries(data.counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = data.total;
  let acc = 0;
  const gradientParts = entries.map(([, count], i) => {
    const pct = (count / total) * 100;
    const start = acc; acc += pct;
    return `${CHART_COLORS_LOCAL[i % CHART_COLORS_LOCAL.length]} ${start.toFixed(1)}% ${acc.toFixed(1)}%`;
  });
  const legend = entries.map(([label, count], i) => `
    <div class="pie-legend-row">
      <span class="pie-dot" style="background:${CHART_COLORS_LOCAL[i % CHART_COLORS_LOCAL.length]}"></span>
      <span class="pie-label" title="${label}">${label}</span>
      <span class="pie-val">${count}</span>
    </div>`).join('');
  return `
    <article class="dash-card chart-card">
      <h3>${VARIABLE_META[varKey].titulo}</h3>
      <div class="pie-wrap">
        <div class="pie-chart" style="background:conic-gradient(${gradientParts.join(', ')})"></div>
        <div class="pie-legend">${legend}</div>
      </div>
      ${narrativeToggleHtml(varKey, r, varKey)}
    </article>
  `;
}

function buildPctCard(varKey, r) {
  const data = r[varKey];
  return `
    <article class="dash-card chart-card">
      <h3>${VARIABLE_META[varKey].titulo}</h3>
      <div class="stat-box" style="text-align:center;">
        <div class="stat-value" style="color:#4fc3f7; font-size:26px;">${data ? data.pct + '%' : 'Sin dato'}</div>
      </div>
      ${narrativeToggleHtml(varKey, r, varKey)}
    </article>
  `;
}

function buildGeneroCard(r) {
  const g = r.brechaGenero;
  if (!g) {
    return `
      <article class="dash-card chart-card">
        <h3>${VARIABLE_META.brechaGenero.titulo}</h3>
        <div class="dash-msg dash-empty">Campo de sexo/género no identificado en las fuentes actuales.</div>
        ${narrativeToggleHtml('brechaGenero', r, 'gen')}
      </article>`;
  }
  const total = g.hombre + g.mujer;
  const pctM = Math.round((g.mujer / total) * 100);
  return `
    <article class="dash-card chart-card">
      <h3>${VARIABLE_META.brechaGenero.titulo}</h3>
      <div class="pie-wrap">
        <div class="pie-chart" style="background:conic-gradient(#ff80ab 0% ${pctM}%, #4fc3f7 ${pctM}% 100%)"></div>
        <div class="pie-legend">
          <div class="pie-legend-row"><span class="pie-dot" style="background:#ff80ab"></span><span class="pie-label">Mujeres</span><span class="pie-val">${pctM}%</span></div>
          <div class="pie-legend-row"><span class="pie-dot" style="background:#4fc3f7"></span><span class="pie-label">Hombres</span><span class="pie-val">${100-pctM}%</span></div>
        </div>
      </div>
      ${narrativeToggleHtml('brechaGenero', r, 'gen')}
    </article>
  `;
}

function buildDinamicaCard(r) {
  const d = r.dinamicaEmpresarial;
  const entries = Object.entries(d.porDataset).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]), 1);
  const bars = entries.map(([name, count], i) => `
    <div class="chart-bar-row">
      <span class="chart-bar-label" title="${name}">${name}</span>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(count/max*100).toFixed(0)}%;background:${CHART_COLORS_LOCAL[i%CHART_COLORS_LOCAL.length]}"></div></div>
      <span class="chart-bar-val">${count}</span>
    </div>`).join('') || '<div class="dash-msg dash-empty">Sin registros.</div>';
  return `
    <article class="dash-card chart-card chart-card-wide">
      <h3>${VARIABLE_META.dinamicaEmpresarial.titulo}</h3>
      <div class="chart-bars">${bars}</div>
      ${narrativeToggleHtml('dinamicaEmpresarial', r, 'din')}
    </article>
  `;
}

function buildCompetitividadCard(r) {
  const idx = computeAllIndicators();
  const ranked = Object.values(idx.byDept).sort((a, b) => a.competitividad.puesto - b.competitividad.puesto).slice(0, 8);
  const max = Math.max(...ranked.map(x => x.idxOportunidad), 1);
  const bars = ranked.map(x => `
    <div class="chart-bar-row">
      <span class="chart-bar-label" style="${x.deptName === r.deptName ? 'color:var(--mde-neon);font-weight:700;' : ''}">#${x.competitividad.puesto} ${x.deptName}</span>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(x.idxOportunidad/max*100).toFixed(0)}%;background:${x.deptName === r.deptName ? '#00ff88' : '#4fc3f7'}"></div></div>
      <span class="chart-bar-val">${x.idxOportunidad}</span>
    </div>`).join('');
  return `
    <article class="dash-card chart-card chart-card-wide">
      <h3>${VARIABLE_META.competitividad.titulo} — Top 8</h3>
      <div class="chart-bars">${bars}</div>
      ${narrativeToggleHtml('competitividad', r, 'comp')}
    </article>
  `;
}

function buildTendenciaCard(r) {
  const idx = computeAllIndicators();
  const rows = Object.values(idx.byDept).filter(x => x.crecimientoEmpleo).sort((a,b) => b.crecimientoEmpleo.variacionPP - a.crecimientoEmpleo.variacionPP).slice(0, 8);
  const max = Math.max(...rows.map(x => Math.abs(x.crecimientoEmpleo.variacionPP)), 1);
  const bars = rows.map(x => {
    const c = x.crecimientoEmpleo;
    const color = c.direccion === 'mejora' ? '#00ff88' : c.direccion === 'deterioro' ? '#ff5252' : '#ffd700';
    return `
    <div class="chart-bar-row">
      <span class="chart-bar-label" style="${x.deptName === r.deptName ? 'color:var(--mde-neon);font-weight:700;' : ''}">${x.deptName}</span>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(Math.abs(c.variacionPP)/max*100).toFixed(0)}%;background:${color}"></div></div>
      <span class="chart-bar-val">${c.variacionPP > 0 ? '▲' : c.variacionPP < 0 ? '▼' : '→'} ${Math.abs(c.variacionPP)}pp</span>
    </div>`;
  }).join('');
  return `
    <article class="dash-card chart-card chart-card-wide">
      <h3>${VARIABLE_META.tendenciaRegional.titulo} 2018→2025</h3>
      <div class="chart-bars">${bars}</div>
      ${narrativeToggleHtml('tendenciaRegional', r, 'tend')}
    </article>
  `;
}
