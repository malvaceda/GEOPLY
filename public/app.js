'use strict';

const MAP_CENTER = [4.5709, -74.2973];
const MAP_ZOOM   = 5;
const MEDELLIN_ZOOM_THRESHOLD = 9.2; // a partir de este zoom se muestran las comunas de Medellín

const STATE = {
  selectedDept:     null,   // nombre del departamento activo
  selectedComuna:   null,   // nombre de la comuna de Medellín activa (si aplica)
  selectedArea:     'all',  // área de interés activa (para el panel de empleo)
  sidebarLeftOpen:  false,
  sidebarRightOpen: false,
};

let MAP           = null;
let deptLayer      = null;
let comunaLayer     = null;
let activeLayerRef  = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
    initMap();
    loadAllDatasets();
    buildDeptQuicklist();
    setInterval(refreshLastSyncLabel, 30000);
  } catch (err) {
    console.error('[GeoPly] Init error:', err);
    showError();
  }
});

function refreshLastSyncLabel() {
  // Reservado para futuros indicadores de frescura de datos en el panel de empleo.
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

  deptLayer   = L.layerGroup().addTo(MAP);
  comunaLayer = L.layerGroup();

  const loaderTimer = setTimeout(hideLoader, 900);
  MAP.once('load', () => { clearTimeout(loaderTimer); hideLoader(); });

  setTimeout(() => { if (MAP) MAP.invalidateSize({ animate: false }); }, 120);
  MAP.once('load', stampPerf);

  renderDeptPolygons();

  MAP.on('zoomend', () => {
    const z = MAP.getZoom();
    const withinMedellin = MAP.getBounds().contains([6.2518, -75.5636]);
    if (z >= MEDELLIN_ZOOM_THRESHOLD && withinMedellin) {
      if (!MAP.hasLayer(comunaLayer)) { comunaLayer.addTo(MAP); renderComunaPolygons(); }
    } else if (MAP.hasLayer(comunaLayer)) {
      MAP.removeLayer(comunaLayer);
    }
  });
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

function showRightSidebar() { setSidebarState('right', true); }

// ------------------------------------------------------------------
// Colores por GeoPly Score
// ------------------------------------------------------------------

function colorForScore(score) {
  if (score >= 70) return '#00ff88';
  if (score >= 45) return '#ffd700';
  return '#ff5252';
}

function buildDeptStyle(deptName, isActive) {
  const idx = computeAllIndicators();
  const r = idx.byDept[deptName];
  const score = r ? r.geoplyScore : 50;
  return {
    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.35)',
    weight: isActive ? 2.4 : 1,
    fillColor: colorForScore(score),
    fillOpacity: isActive ? 0.55 : 0.32,
  };
}

// ------------------------------------------------------------------
// Render de polígonos (departamentos y comunas de Medellín)
// ------------------------------------------------------------------

function renderDeptPolygons() {
  if (!MAP || typeof DEPT_BOUNDARIES === 'undefined') return;
  deptLayer.clearLayers();

  DEPT_BOUNDARIES.features.forEach(feature => {
    const deptName = feature.properties.nombre;
    const layer = L.geoJSON(feature, { style: buildDeptStyle(deptName, false) });

    layer.eachLayer(poly => {
      poly.bindTooltip(buildDeptTooltip(deptName), {
        sticky: true, className: 'geoply-tooltip', opacity: 1,
      });
      poly.on('mouseover', () => { if (STATE.selectedDept !== deptName) poly.setStyle({ fillOpacity: 0.5 }); });
      poly.on('mouseout',  () => { if (STATE.selectedDept !== deptName) poly.setStyle(buildDeptStyle(deptName, false)); });
      poly.on('click', () => selectDept(deptName, poly));
      poly._geoplyName = deptName;
    });

    layer.addTo(deptLayer);
  });
}

function buildDeptTooltip(deptName) {
  const idx = computeAllIndicators();
  const r = idx.byDept[deptName];
  if (!r) return deptName;
  return `
    <div class="gt-name">${deptName}</div>
    <div class="gt-meta">GeoPly Score: ${r.geoplyScore}/100 · TD ${r.tasaDesempleo}%</div>
    <span class="gt-cat" style="background:${colorForScore(r.geoplyScore)}22;color:${colorForScore(r.geoplyScore)}">${verdictFromScore(r.geoplyScore).label}</span>
  `;
}

function renderComunaPolygons() {
  if (!MAP || typeof MEDELLIN_ZONAS === 'undefined') return;
  comunaLayer.clearLayers();

  MEDELLIN_ZONAS.features.forEach(feature => {
    const comunaName = feature.properties.nombre;
    const layer = L.geoJSON(feature, {
      style: { color: 'rgba(255,255,255,0.4)', weight: 1, fillColor: '#4fc3f7', fillOpacity: 0.28 },
    });
    layer.eachLayer(poly => {
      poly.bindTooltip(`
        <div class="gt-name">${comunaName}</div>
        <div class="gt-meta">Comuna de Medellín (zona aproximada)</div>
      `, { sticky: true, className: 'geoply-tooltip', opacity: 1 });
      poly.on('mouseover', () => poly.setStyle({ fillOpacity: 0.45 }));
      poly.on('mouseout',  () => poly.setStyle({ fillOpacity: 0.28 }));
      poly.on('click', (e) => { L.DomEvent.stopPropagation(e); selectComuna(comunaName, poly); });
    });
    layer.addTo(comunaLayer);
  });
}

// ------------------------------------------------------------------
// Selección de departamento / comuna
// ------------------------------------------------------------------

function selectDept(deptName, poly) {
  STATE.selectedDept = deptName;
  STATE.selectedComuna = null;
  showRightSidebar();
  refreshDeptStyles();
  showDetailSkeleton();
  setTimeout(() => openDeptDetail(deptName), 200);
}

function selectComuna(comunaName, poly) {
  STATE.selectedComuna = comunaName;
  showRightSidebar();
  showDetailSkeleton();
  setTimeout(() => openComunaDetail(comunaName), 200);
}

function refreshDeptStyles() {
  deptLayer.eachLayer(group => {
    group.eachLayer(poly => {
      poly.setStyle(buildDeptStyle(poly._geoplyName, poly._geoplyName === STATE.selectedDept));
    });
  });
}

function showDetailSkeleton() {
  document.getElementById('detail-empty')?.classList.add('hidden');
  document.getElementById('record-detail')?.classList.add('hidden');
  document.getElementById('detail-skeleton')?.classList.remove('hidden');
}

function hideDetailSkeleton() {
  document.getElementById('detail-skeleton')?.classList.add('hidden');
}

function metricBoxesHtml(list) {
  return list.map(m => `
    <div class="metric-box">
      <div class="metric-label">${m.lbl}</div>
      <div class="metric-value" style="color:${m.color}">${m.val}</div>
      <div class="metric-sub">${m.sub}</div>
    </div>`).join('');
}

function openDeptDetail(deptName) {
  const idx = computeAllIndicators();
  const r = idx.byDept[deptName];
  if (!r) return;

  hideDetailSkeleton();
  document.getElementById('detail-empty')?.classList.add('hidden');
  document.getElementById('record-detail')?.classList.remove('hidden');

  document.getElementById('d-name').textContent = `${deptName} · Departamento`;

  const verdictEl = document.getElementById('d-verdict');
  const v = verdictFromScore(r.geoplyScore);
  verdictEl.textContent = `GeoPly Score ${r.geoplyScore}/100 · ${v.label}`;
  verdictEl.style.cssText = `background:${v.color}1a;color:${v.color};border-color:${v.color}55;`;

  document.getElementById('d-metrics').innerHTML = metricBoxesHtml([
    { lbl:'DESOCUPACIÓN (TD)',    val:`${r.tasaDesempleo}%`, sub:'tasa 2025', color: colorForScore(r.geoplyScore) },
    { lbl:'OCUPACIÓN (TO)',       val:`${r.tasaOcupacion}%`, sub:'tasa 2025', color:'#00ff88' },
    { lbl:'PARTICIPACIÓN (TGP)',  val:`${r.tasaParticipacion}%`, sub:'tasa 2025', color:'#4fc3f7' },
    { lbl:'SUBOCUPACIÓN (TS)',    val:`${r.tasaSubocupacion}%`, sub:'tasa 2025', color:'#ffd700' },
    { lbl:'POBLACIÓN TOTAL',      val:r.poblacionTotal.toLocaleString(), sub:'miles de personas', color:'#a78bfa' },
    { lbl:'POBLACIÓN OCUPADA',    val:r.poblacionOcupada.toLocaleString(), sub:'miles de personas', color:'#00ff88' },
  ]);

  const teaserEl = document.getElementById('d-teaser');
  if (teaserEl) teaserEl.innerHTML = `<p class="hint" style="text-align:left; padding:0;">${narrativeFor('idxOportunidad', r)}</p>`;

  const openBtn = document.getElementById('d-open-dataset');
  if (openBtn) openBtn.onclick = () => openDashboard(deptName);
}

function openComunaDetail(comunaName) {
  // No hay estadísticas DANE oficiales a nivel de comuna en las fuentes cargadas;
  // se muestra honestamente el contexto departamental (Antioquia) para no inventar cifras locales.
  const idx = computeAllIndicators();
  const r = idx.byDept['Antioquia'];

  hideDetailSkeleton();
  document.getElementById('detail-empty')?.classList.add('hidden');
  document.getElementById('record-detail')?.classList.remove('hidden');

  document.getElementById('d-name').textContent = `${comunaName} · Comuna de Medellín`;

  const verdictEl = document.getElementById('d-verdict');
  verdictEl.textContent = 'Zona aproximada';
  verdictEl.style.cssText = 'background:rgba(79,195,247,0.1);color:#4fc3f7;border-color:rgba(79,195,247,0.4);';

  document.getElementById('d-metrics').innerHTML = metricBoxesHtml([
    { lbl:'DESOCUPACIÓN (ANTIOQUIA)', val:`${r.tasaDesempleo}%`, sub:'referencia departamental', color:'#ffd700' },
    { lbl:'OCUPACIÓN (ANTIOQUIA)',    val:`${r.tasaOcupacion}%`, sub:'referencia departamental', color:'#00ff88' },
  ]);

  const teaserEl = document.getElementById('d-teaser');
  if (teaserEl) teaserEl.innerHTML = `<p class="hint" style="text-align:left; padding:0;">Las fuentes oficiales cargadas (DANE/GEIH) publican tasas laborales a nivel departamental, no por comuna. Se muestra el contexto de Antioquia como referencia más cercana disponible.</p>`;

  const openBtn = document.getElementById('d-open-dataset');
  if (openBtn) openBtn.onclick = () => openDashboard('Antioquia');
}

function buildDeptQuicklist() {
  const el = document.getElementById('dept-quicklist');
  if (!el || typeof DEPARTAMENTOS_EMPLEO === 'undefined') return;
  el.innerHTML = DEPARTAMENTOS_EMPLEO
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map(d => `<span class="chip off" onclick="focusDept('${d.nombre.replace(/'/g, "\\'")}')" role="button">${d.nombre}</span>`)
    .join('');
}

window.focusDept = function (deptName) {
  const centro = (typeof DEPARTAMENTOS_EMPLEO !== 'undefined')
    ? DEPARTAMENTOS_EMPLEO.find(d => d.nombre === deptName) : null;
  if (centro && MAP) MAP.flyTo([centro.lat, centro.lng], 7, { duration: 0.8 });
  selectDept(deptName, null);
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

// ------------------------------------------------------------------
// Modal "Soy Aspirante" — sin cambios de lógica respecto a la versión anterior
// ------------------------------------------------------------------

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