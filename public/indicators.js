'use strict';

const AREAS_INTERES = Object.freeze([
  { id: 'tecnologia',     label: 'Tecnología',           color: '#00ff88' },
  { id: 'salud',          label: 'Salud',                color: '#4fc3f7' },
  { id: 'educacion',      label: 'Educación',            color: '#ffd700' },
  { id: 'administracion', label: 'Administración',       color: '#a78bfa' },
  { id: 'ingenieria',     label: 'Ingeniería',           color: '#ff8c69' },
  { id: 'comercio',       label: 'Comercio / Ventas',    color: '#7dff88' },
  { id: 'arte',           label: 'Arte / Diseño',        color: '#ff80ab' },
  { id: 'agropecuario',   label: 'Agropecuario',         color: '#f0c040' },
  { id: 'otro',           label: 'Otro',                 color: '#7da893' },
]);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function normalize(v, lo, hi) { return clamp(((v - lo) / (hi - lo)) * 100, 0, 100); }
function roundN(v, n = 1) { return Math.round(v * 10 ** n) / 10 ** n; }

const SECTORES_FIJOS = Object.freeze([
  { id: 'agricultura',                label: 'Agricultura',                                keywords: ['agricultur', 'agro', 'agrícola', 'campo', 'rural', 'cosech', 'cultiv', 'ganader', 'pecuario', 'silvicultur', 'pesca', 'forestal', 'veterin'] },
  { id: 'mineria',                    label: 'Minería',                                    keywords: ['miner', 'minería', 'extracción', 'carbón', 'petróleo', 'gas', 'hidrocarbur', 'canter', 'mina', 'energético', 'combustible'] },
  { id: 'industrias_manufactureras',  label: 'Industrias manufactureras',                  keywords: ['manufactur', 'fabril', 'producción', 'transformación', 'maquil', 'fábrica', 'industrial', 'procesamient', 'confección', 'textil', 'alimenticia', 'bebidas', 'químic', 'plástic', 'metalúrg', 'automotriz'] },
  { id: 'construccion',              label: 'Construcción',                                keywords: ['construcción', 'construccion', 'obra', 'civil', 'edific', 'inmobiliari', 'arquitect', 'ingeniería civil', 'infraestructur'] },
  { id: 'comercio',                  label: 'Comercio al por mayor y al por menor',        keywords: ['comercio', 'venta', 'retail', 'mayorista', 'minorista', 'distribución', 'mercadeo', 'mercanc', 'almacén', 'tienda', 'supermercado'] },
  { id: 'comunicaciones',            label: 'Comunicaciones',                              keywords: ['comunicación', 'comunicacion', 'telecomunicación', 'telefón', 'internet', 'redes', 'medios', 'radiodifusión', 'telecom', 'conectividad', 'información', 'tecnologías de la información'] },
  { id: 'actividades_financieras',    label: 'Actividades financieras',                    keywords: ['financier', 'bancari', 'crédito', 'seguro', 'inversión', 'finanza', 'bursátil', 'valores', 'tesorer'] },
  { id: 'actividades_inmobiliarias',  label: 'Actividades inmobiliarias',                  keywords: ['inmobiliari', 'bienes raíces', 'propiedad', 'arrendamient', 'alquiler', 'inmueble', 'renta'] },
  { id: 'administracion_publica',     label: 'Administración pública',                    keywords: ['administración pública', 'administracion publica', 'gobierno', 'estatal', 'público', 'oficial', 'estado', 'municipal', 'departamental', 'gubernamental', 'régimen', 'función pública'] },
  { id: 'actividades_profesionales',  label: 'Actividades profesionales, científicas y técnicas', keywords: ['profesional', 'científic', 'técnico', 'consultor', 'asesor', 'investigación', 'asesoría', 'servicios profesionales', 'jurídic', 'legal', 'contable', 'administrativo', 'marketing', 'publicidad', 'diseño', 'ingeniería de sistem', 'consultoría'] },
]);

function countSectorMatches(items) {
  const counts = {};
  SECTORES_FIJOS.forEach(s => { counts[s.label] = 0; });
  
  items.forEach(({ record }) => {
    const vals = Object.values(record).filter(v => typeof v === 'string').map(v => normalizeKey(v));
    
    SECTORES_FIJOS.forEach(sector => {
      const matches = vals.some(val => sector.keywords.some(kw => val.includes(kw)));
      if (matches) counts[sector.label]++;
    });
  });
  
  // Return only sectors that actually had matches, sorted by count descending
  return Object.fromEntries(
    Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  );
}

function matchesAreaKeyword(text, areaId) {
  const t = normalizeKey(text);
  const KEYWORDS = {
    tecnologia:     ['tecnolog', 'sistemas', 'software', 'informatic', 'datos', 'digital'],
    salud:          ['salud', 'enfermer', 'medic', 'clinic', 'hospital'],
    educacion:      ['educ', 'docente', 'pedagog', 'ensen'],
    administracion: ['administra', 'gestion', 'contab', 'finan'],
    ingenieria:     ['ingenier', 'construccion', 'obra', 'civil', 'industrial'],
    comercio:       ['comercio', 'venta', 'retail', 'mercade'],
    arte:           ['arte', 'diseno', 'creativ', 'audiovisual', 'cultura'],
    agropecuario:   ['agro', 'pecuario', 'agricola', 'rural', 'campo'],
  };
  const kws = KEYWORDS[areaId] || [];
  return kws.some(k => t.includes(k));
}

function buildDeptRecordIndex() {
  const index = {};
  DEPARTAMENTOS_EMPLEO.forEach(d => { index[d.nombre] = []; });

  (typeof EMPLEO_RECORDS !== 'undefined' ? EMPLEO_RECORDS : []).forEach(item => {
    if (!item.geo) return;
    let dept = typeof findDeptForPoint === 'function'
      ? findDeptForPoint(item.geo.lat, item.geo.lng)
      : null;

    if (!dept) {
      for (const key of Object.keys(item.record)) {
        const nk = normalizeKey(key);
        if (nk.includes('departamento') || nk === 'depto') {
          const val = normalizeKey(item.record[key]);
          const found = DEPARTAMENTOS_EMPLEO.find(d => normalizeKey(d.nombre) === val);
          if (found) { dept = found.nombre; break; }
        }
      }
    }
    if (dept && index[dept]) {
      index[dept].push(item);
    }
  });
  return index;
}

function detectCategoricalField(items, opts = {}) {
  const exclude = opts.exclude || [];
  const fieldStats = {};
  items.forEach(({ record }) => {
    Object.entries(record).forEach(([key, val]) => {
      if (typeof val !== 'string') return;
      const trimmed = val.trim();
      if (!trimmed || trimmed.length > 40) return;
      const nk = normalizeKey(key);
      if (exclude.includes(nk)) return;
      if (!fieldStats[key]) fieldStats[key] = { count: 0, values: new Map() };
      fieldStats[key].count++;
      const lk = trimmed.toLowerCase();
      if (!fieldStats[key].values.has(lk)) fieldStats[key].values.set(lk, trimmed);
    });
  });
  let best = null, bestScore = -1;
  for (const [field, stats] of Object.entries(fieldStats)) {
    const card = stats.values.size;
    if (card < 2 || card > 15) continue;
    if (stats.count > bestScore) { bestScore = stats.count; best = field; }
  }
  if (!best) return null;
  const counts = {};
  items.forEach(({ record }) => {
    const v = record[best];
    if (typeof v !== 'string') return;
    const t = v.trim();
    if (!t) return;
    counts[t] = (counts[t] || 0) + 1;
  });
  return { field: best, counts };
}

function findFieldByPattern(items, patterns) {
  for (const { record } of items) {
    for (const key of Object.keys(record)) {
      const nk = normalizeKey(key);
      if (patterns.some(p => nk.includes(p))) return key;
    }
  }
  return null;
}

function computeIndicatorsForDept(deptName, deptRecordIndex, allDeptStats) {
  const d = DEPARTAMENTOS_EMPLEO.find(x => x.nombre === deptName);
  if (!d) return null;
  const items = deptRecordIndex[deptName] || [];
  const nt = (typeof NATIONAL_TRENDS !== 'undefined') ? NATIONAL_TRENDS : null;

  const idxOportunidad = roundN(
    0.35 * normalize(d.to, 33, 70) +
    0.30 * (100 - normalize(d.td, 5, 13)) +
    0.20 * normalize(d.tgp, 38, 75) +
    0.15 * (100 - normalize(d.ts, 1, 14))
  );

  const tasaDesempleo = d.td;
  const tasaOcupacion = d.to;

  const avgTD = DEPARTAMENTOS_EMPLEO.reduce((s, x) => s + x.td, 0) / DEPARTAMENTOS_EMPLEO.length;
  const informalidadEstimada = nt
    ? roundN(clamp(nt.tasa_informalidad_nacional + (d.td - avgTD) * 1.6, 25, 80))
    : null;

  let crecimientoEmpleo = null;
  if (typeof d.td_2018 === 'number') {
    const variacionPP = roundN(d.td_2018 - d.td, 2);
    crecimientoEmpleo = {
      variacionPP,
      direccion: variacionPP > 0.3 ? 'mejora' : variacionPP < -0.3 ? 'deterioro' : 'estable',
    };
  }

  const sectorCounts = countSectorMatches(items);
  const totalItems = items.length;
  
  // 6. Sectores con mayor demanda: all sectors with matches, sorted by count
  const sectoresDemanda = totalItems > 0
    ? Object.entries(sectorCounts).map(([label, count]) => ({ 
        label, 
        count, 
        pct: roundN((count / totalItems) * 100) 
      })).sort((a, b) => b.count - a.count).slice(0, 10)
    : [];

  // 7. Sectores emergentes: sectors with LQ > 1.15 compared to national average
  let sectoresEmergentes = [];
  if (totalItems > 0 && allDeptStats && allDeptStats.nationalSectorCounts) {
    const totalNacional = allDeptStats.totalNationalRecords || 1;
    sectoresEmergentes = Object.entries(sectorCounts).map(([label, count]) => {
      const shareLocal = count / totalItems;
      const shareNacional = (allDeptStats.nationalSectorCounts[label] || 0) / totalNacional;
      const lq = shareNacional > 0 ? shareLocal / shareNacional : 0;
      return { label, count, lq: roundN(lq, 2) };
    }).filter(s => s.lq > 1.15).sort((a, b) => b.lq - a.lq).slice(0, 10);
  }

  const eduField = findFieldByPattern(items, ['nivel_educ', 'niveleduc', 'escolarid', 'educacion']);
  let nivelEducativo = null;
  if (eduField) {
    const counts = {};
    items.forEach(({ record }) => {
      const v = record[eduField];
      if (typeof v === 'string' && v.trim()) counts[v.trim()] = (counts[v.trim()] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length) {
      nivelEducativo = { predominante: sorted[0][0], counts, total: items.length };
    }
  }

  const edadField = findFieldByPattern(items, ['edad', 'rango_edad', 'grupo_edad']);
  let insercionJuvenil = null;
  if (edadField) {
    const jovenes = items.filter(({ record }) => {
      const v = String(record[edadField] || '');
      return /1[5-9]|2[0-8]/.test(v) || normalizeKey(v).includes('joven');
    });
    if (jovenes.length) insercionJuvenil = { count: jovenes.length, total: items.length, pct: roundN((jovenes.length / items.length) * 100) };
  }

  const sexoField = findFieldByPattern(items, ['sexo', 'genero']);
  let brechaGenero = null;
  if (sexoField) {
    const counts = { hombre: 0, mujer: 0 };
    items.forEach(({ record }) => {
      const v = normalizeKey(record[sexoField] || '');
      if (v.includes('mujer') || v === 'f' || v.includes('femenin')) counts.mujer++;
      else if (v.includes('hombre') || v === 'm' || v.includes('masculin')) counts.hombre++;
    });
    if (counts.hombre + counts.mujer > 0) brechaGenero = counts;
  }

  const disponibilidadTalento = d.pob_ocupada > 0
    ? roundN((items.length / d.pob_ocupada) * 100, 2)
    : null;

  const porDataset = {};
  items.forEach(({ datasetName }) => { porDataset[datasetName] = (porDataset[datasetName] || 0) + 1; });
  const dinamicaEmpresarial = { totalRegistros: items.length, porDataset };

  const tendenciaRegional = crecimientoEmpleo;

  return {
    deptName,
    raw: d,
    registrosAsignados: items.length,
    idxOportunidad,
    tasaDesempleo,
    tasaOcupacion,
    tasaParticipacion: d.tgp,
    tasaSubocupacion: d.ts,
    poblacionTotal: d.pob_total,
    poblacionOcupada: d.pob_ocupada,
    poblacionDesocupada: d.pob_desocupada,
    informalidadEstimada,
    crecimientoEmpleo,
    sectoresDemanda,
    sectoresEmergentes,
    nivelEducativo,
    insercionJuvenil,
    brechaGenero,
    disponibilidadTalento,
    dinamicaEmpresarial,
    tendenciaRegional,
    competitividad: null,
    geoplyScore: null,
  };
}

let DEPT_INDICATORS_CACHE = null;

function computeAllIndicators(forceRefresh = false) {
  if (DEPT_INDICATORS_CACHE && !forceRefresh) return DEPT_INDICATORS_CACHE;

  const deptRecordIndex = buildDeptRecordIndex();

  const allItems = Object.values(deptRecordIndex).flat();
  
  // Compute national sector counts using fixed sectors (for indicators 6 and 7)
  const nationalSectorCounts = countSectorMatches(allItems);
  
  const allDeptStats = {
    nationalCategoryCounts: nationalSectorCounts,
    totalRecordsWithCategory: allItems.length,
    nationalSectorCounts,
    totalNationalRecords: allItems.length,
  };

  const results = {};
  DEPARTAMENTOS_EMPLEO.forEach(d => {
    results[d.nombre] = computeIndicatorsForDept(d.nombre, deptRecordIndex, allDeptStats);
  });

  const ranked = Object.values(results).sort((a, b) => b.idxOportunidad - a.idxOportunidad);
  ranked.forEach((r, i) => { r.competitividad = { puesto: i + 1, de: ranked.length }; });

  Object.values(results).forEach(r => {
    const scoreOportunidad = r.idxOportunidad;
    const scoreCrecimiento = r.crecimientoEmpleo
      ? normalize(r.crecimientoEmpleo.variacionPP, -3, 5)
      : 50;
    const scoreInformalidad = r.informalidadEstimada != null
      ? 100 - normalize(r.informalidadEstimada, 25, 80)
      : 50;
    const scoreEmergentes = r.sectoresEmergentes.length
      ? clamp(normalize(r.sectoresEmergentes[0].lq, 1, 2.5), 0, 100)
      : 40;
    const scoreCompetitividad = 100 - normalize(r.competitividad.puesto, 1, r.competitividad.de);
    const scoreEducativo = r.nivelEducativo ? 65 : 50;
    const scoreJuvenil = r.insercionJuvenil ? clamp(r.insercionJuvenil.pct, 0, 100) : 50;

    const geoplyScore = roundN(
      0.25 * scoreOportunidad +
      0.20 * scoreCrecimiento +
      0.15 * scoreInformalidad +
      0.15 * scoreEmergentes +
      0.10 * scoreCompetitividad +
      0.10 * scoreEducativo +
      0.05 * scoreJuvenil
    );
    r.geoplyScore = geoplyScore;
  });

  DEPT_INDICATORS_CACHE = { byDept: results, deptRecordIndex, allDeptStats, computedAt: new Date() };
  return DEPT_INDICATORS_CACHE;
}

function invalidateIndicatorsCache() { DEPT_INDICATORS_CACHE = null; }

function verdictFromScore(score) {
  if (score >= 70) return { label: 'Alta oportunidad', color: '#00ff88' };
  if (score >= 45) return { label: 'Oportunidad media', color: '#ffd700' };
  return { label: 'Oportunidad baja', color: '#ff5252' };
}

const VARIABLE_META = {
  idxOportunidad:        { key:'idxOportunidad',        titulo:'1. Índice de Oportunidad Laboral' },
  tasaDesempleo:         { key:'tasaDesempleo',         titulo:'2. Tasa de Desempleo' },
  tasaOcupacion:         { key:'tasaOcupacion',         titulo:'3. Tasa de Ocupación' },
  informalidadEstimada:  { key:'informalidadEstimada',  titulo:'4. Tasa de Informalidad (estimada)' },
  crecimientoEmpleo:     { key:'crecimientoEmpleo',     titulo:'5. Crecimiento del Empleo (2018→2025)' },
  sectoresDemanda:       { key:'sectoresDemanda',       titulo:'6. Sectores con Mayor Demanda' },
  sectoresEmergentes:    { key:'sectoresEmergentes',    titulo:'7. Sectores Emergentes' },
  nivelEducativo:        { key:'nivelEducativo',        titulo:'8. Nivel Educativo Predominante' },
  insercionJuvenil:      { key:'insercionJuvenil',      titulo:'9. Inserción Laboral Juvenil' },
  brechaGenero:          { key:'brechaGenero',          titulo:'10. Brecha Laboral por Sexo' },
  disponibilidadTalento: { key:'disponibilidadTalento', titulo:'11. Disponibilidad de Talento' },
  dinamicaEmpresarial:   { key:'dinamicaEmpresarial',   titulo:'12. Dinámica Empresarial' },
  competitividad:        { key:'competitividad',        titulo:'13. Competitividad Territorial' },
  tendenciaRegional:     { key:'tendenciaRegional',     titulo:'14. Tendencia Regional del Empleo' },
  geoplyScore:           { key:'geoplyScore',           titulo:'15. GeoPly Score' },
};

function narrativeFor(varKey, r) {
  switch (varKey) {
    case 'idxOportunidad': {
      const v = verdictFromScore(r.idxOportunidad);
      return `${r.deptName} obtiene un Índice de Oportunidad Laboral de ${r.idxOportunidad}/100 (${v.label.toLowerCase()}). Este índice combina ocupación, desempleo, participación y subocupación en una sola medida ponderada: entre más alto, más fácil es —en promedio— encontrar empleo formal en la zona.`;
    }
    case 'tasaDesempleo':
      return `La tasa de desocupación en ${r.deptName} es de ${r.tasaDesempleo}%. Esto indica el porcentaje de la fuerza laboral que busca trabajo activamente y no lo encuentra.`;
    case 'tasaOcupacion':
      return `El ${r.tasaOcupacion}% de la población en edad de trabajar en ${r.deptName} se encuentra actualmente ocupada.`;
    case 'informalidadEstimada':
      return r.informalidadEstimada != null
        ? `Se estima una informalidad laboral cercana al ${r.informalidadEstimada}% en ${r.deptName}. Este valor es una proyección basada en la informalidad nacional (${NATIONAL_TRENDS ? NATIONAL_TRENDS.tasa_informalidad_nacional : '—'}%) ajustada por el desempleo relativo del departamento, ya que las fuentes cargadas no publican informalidad por departamento.`
        : `No hay suficiente información para estimar la informalidad de ${r.deptName}.`;
    case 'crecimientoEmpleo': {
      if (!r.crecimientoEmpleo) return `No hay serie histórica disponible para ${r.deptName}.`;
      const c = r.crecimientoEmpleo;
      const txt = c.direccion === 'mejora'
        ? `mejoró ${Math.abs(c.variacionPP)} puntos porcentuales`
        : c.direccion === 'deterioro'
        ? `empeoró ${Math.abs(c.variacionPP)} puntos porcentuales`
        : `se mantuvo prácticamente estable`;
      return `Entre 2018 y 2025 la desocupación en ${r.deptName} ${txt}, lo que sugiere una tendencia de ${c.direccion === 'mejora' ? 'recuperación' : c.direccion === 'deterioro' ? 'deterioro' : 'estabilidad'} del mercado laboral local.`;
    }
    case 'sectoresDemanda':
      if (!r.sectoresDemanda.length) return `Los conjuntos de datos actuales no traen suficientes registros geolocalizados en ${r.deptName} para identificar los sectores con mayor demanda.`;
      return `En ${r.deptName}, el sector con mayor presencia en los registros es "${r.sectoresDemanda[0].label}" (${r.sectoresDemanda[0].pct}% de los registros locales), seguido de ${r.sectoresDemanda.slice(1,3).map(s=>`"${s.label}"`).join(' y ') || '—'}.`;
    case 'sectoresEmergentes':
      if (!r.sectoresEmergentes.length) return `No se detectan sectores con concentración local significativamente mayor a la nacional en ${r.deptName} con los datos actuales.`;
      return `${r.sectoresEmergentes.map(s => `"${s.label}"`).join(', ')} aparece${r.sectoresEmergentes.length===1?'':'n'} sobre-representado${r.sectoresEmergentes.length===1?'':'s'} en ${r.deptName} frente al promedio nacional (cociente de localización > 1.15), lo que indica una posible especialización o crecimiento emergente en esa actividad.`;
    case 'nivelEducativo':
      return r.nivelEducativo
        ? `El nivel educativo con mayor frecuencia entre los registros de ${r.deptName} es "${r.nivelEducativo.predominante}".`
        : `Los conjuntos de datos cargados no incluyen un campo de nivel educativo identificable para ${r.deptName}.`;
    case 'insercionJuvenil':
      return r.insercionJuvenil
        ? `El ${r.insercionJuvenil.pct}% de los registros con dato de edad en ${r.deptName} corresponden a población joven (15-28 años).`
        : `No hay un campo de edad identificable en los registros de ${r.deptName} para calcular inserción juvenil.`;
    case 'brechaGenero': {
      if (!r.brechaGenero) return `No hay un campo de sexo/género identificable en los registros de ${r.deptName}.`;
      const total = r.brechaGenero.hombre + r.brechaGenero.mujer;
      const pctM = roundN((r.brechaGenero.mujer/total)*100);
      return `De los registros con dato de sexo en ${r.deptName}, ${pctM}% corresponden a mujeres y ${roundN(100-pctM)}% a hombres.`;
    }
    case 'disponibilidadTalento':
      return r.disponibilidadTalento != null
        ? `${r.deptName} registra ${r.disponibilidadTalento} registros de oferta/formación por cada 100 mil personas ocupadas, una medida aproximada de qué tan visible es la oferta de talento en las fuentes abiertas para esta zona.`
        : `No hay suficiente información de población ocupada para calcular disponibilidad de talento en ${r.deptName}.`;
    case 'dinamicaEmpresarial':
      return r.dinamicaEmpresarial.totalRegistros > 0
        ? `${r.deptName} concentra ${r.dinamicaEmpresarial.totalRegistros} registros activos repartidos en ${Object.keys(r.dinamicaEmpresarial.porDataset).length} conjunto(s) de datos, lo que da una idea de la dinámica de publicación de vacantes, formación y perfiles en la zona.`
        : `No se encontraron registros geolocalizados de las APIs dentro de ${r.deptName}.`;
    case 'competitividad':
      return `${r.deptName} ocupa el puesto ${r.competitividad.puesto} de ${r.competitividad.de} departamentos en el ranking de competitividad territorial de GeoPly, calculado a partir del Índice de Oportunidad Laboral.`;
    case 'tendenciaRegional':
      if (!r.tendenciaRegional) return `Sin datos de tendencia histórica para ${r.deptName}.`;
      return `La tendencia regional 2018→2025 en ${r.deptName} es de ${r.tendenciaRegional.direccion}.`;
    case 'geoplyScore': {
      const v = verdictFromScore(r.geoplyScore);
      return `El GeoPly Score de ${r.deptName} es ${r.geoplyScore}/100 (${v.label}). Este es el indicador compuesto que resume las 14 variables anteriores en una sola calificación, ponderando oportunidad laboral (25%), crecimiento del empleo (20%), informalidad (15%), sectores emergentes (15%), competitividad territorial (10%), nivel educativo (10%) e inserción juvenil (5%).`;
    }
    default: return '';
  }
}

window.SECTORES_FIJOS = SECTORES_FIJOS;
window.AREAS_INTERES = AREAS_INTERES;
window.matchesAreaKeyword = matchesAreaKeyword;
window.computeAllIndicators = computeAllIndicators;
window.invalidateIndicatorsCache = invalidateIndicatorsCache;
window.verdictFromScore = verdictFromScore;
window.VARIABLE_META = VARIABLE_META;
window.narrativeFor = narrativeFor;
window.buildDeptRecordIndex = buildDeptRecordIndex;
