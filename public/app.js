'use strict';
window.__geoAppLoaded = true;
window.__geoInitStatus = 'script-loaded';
console.log('[GeoPly] app.js loaded');

const MAP_CENTER = [4.5709, -74.2973];
const MAP_ZOOM   = 5;
const MEDELLIN_ZOOM_THRESHOLD = 9.2; // a partir de este zoom se muestran las comunas de Medellín

const STATE = {
  selectedDept:     null,   // nombre del departamento activo
  selectedComuna:   null,   // nombre de la comuna de Medellín activa (si aplica)
  selectedArea:     'all',  // área de interés activa (para el panel de empleo)
  sidebarLeftOpen:  false,
  sidebarRightOpen: false,
  heroCollapsed: false,
  companySession: null,
  activePage: null,
  userSession: null,
};

const EDUCATION_CONTENT = {
  skills: {
    title: 'Habilidades que no pueden faltar',
    copy: 'Estas habilidades te ayudan a entrar con más fuerza a la vida laboral y a crecer con seguridad.',
    items: [
      ['Comunicación efectiva', 'Permite expresar ideas con claridad, trabajar mejor en equipo y causar una excelente primera impresión.'],
      ['Pensamiento crítico', 'Ayuda a analizar información, tomar decisiones y resolver problemas con criterio.'],
      ['Inglés', 'Es clave en empresas internacionales, formación online y roles con tecnología o comercio global.'],
      ['Herramientas digitales', 'Dominio de Excel, Google Workspace, Canva, Notion o herramientas de productividad mejora tu empleabilidad.'],
      ['Análisis de datos', 'Entender métricas, informes y tendencias te convierte en un perfil más valioso.'],
      ['Trabajo en equipo', 'La mayoría de oportunidades valoran la colaboración, el respeto y la responsabilidad compartida.'],
      ['Resolución de problemas', 'Es una capacidad que demuestra madurez profesional y capacidad de adaptación.'],
      ['Adaptabilidad', 'Los mercados cambian rápido; quien aprende y ajusta su forma de trabajar tiene más oportunidades.'],
      ['Inteligencia emocional', 'Ayuda a manejar el estrés, comunicarse mejor y trabajar bajo presión.'],
      ['Liderazgo', 'Incluso en perfiles junior, mostrar iniciativa y capacidad de conducir procesos es clave.'],
      ['Organización', 'Una buena estructura mejora la productividad y evita errores costosos.'],
      ['Gestión del tiempo', 'Priorizar tareas y cumplir metas marca diferencia en entornos laborales.'],
      ['Creatividad', 'Genera ideas, mejora propuestas y aporta valor en procesos de innovación.'],
      ['Aprendizaje continuo', 'Quien aprende de forma constante se adapta mejor a nuevas herramientas y mercados.'],
      ['Uso de inteligencia artificial', 'Comprender cómo aprovechar la IA es clave en casi todos los sectores.'],
      ['Presentación profesional', 'Una buena imagen, claridad y orden transmiten confianza.'],
      ['Redacción', 'Escribir bien mejora correos, informes, propuestas y documentos.'],
      ['Atención al cliente', 'Es decisiva en ventas, servicio, salud, educación y operaciones.'],
      ['Gestión de proyectos', 'Organizar prioridades, tiempos y recursos es esencial para trabajar con objetivos claros.']
    ]
  },
  trabajos: {
    title: 'Trabajos del presente y del futuro',
    copy: 'Estos sectores están creciendo por la transformación digital, la sostenibilidad y la demanda de talento especializado.',
    items: [
      ['Inteligencia Artificial', 'Diseña soluciones, automatiza procesos y crea experiencias más inteligentes para empresas y usuarios.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Sostenibilidad', 'Impulsa estrategias verdes, eficiencia energética y responsabilidad ambiental.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Salud Digital', 'Conecta tecnología y salud para mejorar diagnósticos, atención y seguimiento.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Tecnología', 'Desarrolla productos digitales, infraestructura y herramientas que apoyan toda la economía.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Diseño', 'Crea experiencias, marca, productos y contenidos con enfoque visual y estratégico.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Operaciones con enfoque tecnológico', 'Optimiza procesos, logística y productividad con herramientas digitales.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Ciberseguridad', 'Protege datos, sistemas y operaciones frente a amenazas y fraudes.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Ciencia de datos', 'Analiza información para descubrir oportunidades, riesgos y tendencias.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Automatización', 'Reduce tareas repetitivas y mejora la eficiencia operativa.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Computación en la nube', 'Diseña y gestiona soluciones escalables y seguras en entornos digitales.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Desarrollo de software', 'Construye aplicaciones, plataformas y herramientas para usuarios y negocios.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Energías renovables', 'Aporta soluciones para la transición energética y la sostenibilidad.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Logística inteligente', 'Optimiza cadenas de suministro con datos, tecnología y automatización.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Marketing Digital', 'Impulsa marcas, ventas y contenido en entornos digitales.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['UX/UI', 'Diseña experiencias intuitivas que mejoran la satisfacción de usuarios.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Biotecnología', 'Combina ciencia, salud y tecnología para innovar en diagnóstico y tratamiento.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Robótica', 'Crea sistemas que automatizan tareas y amplían capacidades tecnológicas.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Ingeniería', 'Diseña soluciones técnicas para infraestructura, procesos y productos.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Fintech', 'Innova en servicios financieros con tecnología, datos y automatización.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades'],
      ['Comercio electrónico', 'Gestiona ventas online, productos, datos y experiencia del cliente.', 'Qué hace', 'Por qué crece', 'Perfiles', 'Habilidades']
    ]
  },
  guia: {
    title: 'Guía de aprendizaje',
    copy: 'Estas rutas te ayudan a construir una base sólida para entrar al mercado laboral con confianza.',
    microcursos: [
      ['Coursera', 'https://www.coursera.org/'],
      ['edX', 'https://www.edx.org/'],
      ['Google Skillshop', 'https://skillshop.withgoogle.com/'],
      ['Cisco Networking Academy', 'https://www.netacad.com/'],
      ['Microsoft Learn', 'https://learn.microsoft.com/'],
      ['IBM SkillsBuild', 'https://skillsbuild.org/'],
      ['Platzi', 'https://platzi.com/'],
      ['SENA Sofía Plus', 'https://www.senasofiaplus.edu.co/'],
      ['LinkedIn Learning', 'https://www.linkedin.com/learning/']
    ],
    proyectos: ['Crear una página web', 'Analizar datos públicos', 'Diseñar una aplicación', 'Crear un dashboard', 'Elaborar un plan de negocios', 'Resolver retos usando IA'],
    rutinas: ['Técnica Pomodoro', 'Active Recall', 'Repetición espaciada', 'Planificación semanal', 'Objetivos diarios', 'Mapas mentales', 'Práctica constante', 'Organización del tiempo']
  }
};

const COMPANY_SAMPLE = [
  { nombre: 'Bancolombia', sector: 'Finanzas y tecnología', ubicacion: 'Bogotá', vacantes: 14, enlace: 'https://www.bancolombia.com/personas/empleos' },
  { nombre: 'Grupo Éxito', sector: 'Retail y operaciones', ubicacion: 'Medellín', vacantes: 9, enlace: 'https://www.grupoexito.com.co/empleos' },
  { nombre: 'Alpina', sector: 'Alimentos y manufactura', ubicacion: 'Bogotá', vacantes: 6, enlace: 'https://www.alpina.com/co/es/empleos/' },
  { nombre: 'SURA', sector: 'Seguros y servicios', ubicacion: 'Medellín', vacantes: 7, enlace: 'https://www.sura.com/es/empleos' },
  { nombre: 'Rappi', sector: 'Tecnología y logística', ubicacion: 'Bogotá', vacantes: 11, enlace: 'https://careers.rappi.com/' },
  { nombre: 'Globant', sector: 'Tecnología y software', ubicacion: 'Bogotá', vacantes: 8, enlace: 'https://careers.globant.com/' }
];

const DEPARTAMENTOS_LIST = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bogotá D. C.','Bolívar','Boyacá','Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia','Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada'
];

let MAP           = null;
let deptLayer      = null;
let comunaLayer     = null;
let activeLayerRef  = null;

document.addEventListener('DOMContentLoaded', () => {
  window.__geoInitStatus = 'dom-ready';
  console.log('[GeoPly] DOMContentLoaded fired');
  try {
    window.__geoInitStatus = 'calling-init-map';
    initMap();
    loadAllDatasets();
    // buildDeptQuicklist(); // Se quitó la lista de botones de departamentos (queda solo el buscador de arriba)
    initInteractivePanels();
    initSearch();
    initCompanyPanel();
    initAuthForms();
    setInterval(refreshLastSyncLabel, 30000);
  } catch (err) {
    window.__geoInitStatus = 'init-error';
    window.__geoInitError = String(err && err.message ? err.message : err);
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
  window.__geoInitStatus = 'inside-init-map';
  const mapEl = document.getElementById('map');
  if (!mapEl) { window.__geoInitStatus = 'missing-map-el'; showError(); return; }

  const loaderTimer = setTimeout(() => {
    hideLoader();
  }, 600);

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

  let __colombiaViewLocked = false; // se pone en true en cuanto el usuario interactúa con el mapa

  MAP.whenReady(() => {
    clearTimeout(loaderTimer);
    hideLoader();
    stampPerf();
    const forceColombiaView = () => {
      if (!MAP || __colombiaViewLocked) return;
      MAP.invalidateSize({ animate: false });
      MAP.setView(MAP_CENTER, MAP_ZOOM, { animate: false });
    };

    // El contenedor del mapa ahora tiene una altura fija por CSS (ver .app-main),
    // pero igual reaccionamos a cambios de tamaño reales (fuentes, resize,
    // apertura/cierre de paneles) en vez de confiar solo en temporizadores fijos.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => forceColombiaView());
      ro.observe(mapEl);
    }

    // Reintentos de respaldo por si ResizeObserver no está disponible o el
    // navegador tarda más de lo esperado en asentar el layout.
    setTimeout(forceColombiaView, 220);
    setTimeout(forceColombiaView, 600);
    setTimeout(forceColombiaView, 1200);
    window.addEventListener('load', forceColombiaView, { once: true });

    // En cuanto el usuario mueve o hace zoom manualmente, dejamos de forzar
    // el centrado automático para no "pelearnos" con su interacción.
    MAP.on('dragstart zoomstart', () => { __colombiaViewLocked = true; });
  });

  renderDeptPolygons();

  window.addEventListener('resize', () => {
    if (MAP) MAP.invalidateSize({ animate: false });
  });

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
  if (!el) return;
  el.classList.add('hide');
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 250);
}

function stampPerf() {
  const badge = document.getElementById('perf-badge');
  if (!badge || !window.__t0) return;
  const ms = Math.round(performance.now() - window.__t0);
  badge.textContent = `⚡ ${ms}ms`;
  badge.title = `Tiempo de carga: ${ms}ms`;
}

window.resetView = function () {
  if (!MAP) return;
  // Primero recalculamos el tamaño real del contenedor (puede haber cambiado
  // si un panel lateral estaba abierto) y solo después centramos; si se hace
  // en el orden contrario, Leaflet puede "centrar" sobre un tamaño viejo y
  // el mapa termina viéndose desplazado de Colombia.
  MAP.invalidateSize({ animate: false });
  MAP.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.9 });
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

  // El panel lateral cambia el ancho disponible del mapa (transición CSS de ~300ms).
  // Leaflet no se entera solo de ese cambio de tamaño, así que se lo avisamos
  // explícitamente cuando termina la transición para que no quede desalineado.
  if (MAP) {
    setTimeout(() => { MAP.invalidateSize({ animate: false }); }, 320);
  }
}

window.toggleSidebar = function (side) {
  const key = side === 'left' ? 'sidebarLeftOpen' : 'sidebarRightOpen';
  setSidebarState(side, !STATE[key]);
};

function showRightSidebar() { setSidebarState('right', true); }

function openSidebarFromNav() {
  setSidebarState('left', true);
  setSidebarState('right', true);
}

function openHeroPanel() {
  const panel = document.getElementById('hero-panel');
  const reopen = document.getElementById('hero-reopen');
  if (panel) {
    panel.classList.remove('collapsed');
    panel.querySelector('.hero-panel-body')?.classList.remove('hidden');
    panel.classList.remove('is-collapsed');
    panel.classList.remove('hidden');
    panel.classList.add('hero-enter');
    panel.addEventListener('animationend', () => {
      panel.classList.remove('hero-enter');
    }, { once: true });
    STATE.heroCollapsed = false;
  }
  if (reopen) reopen.classList.add('hidden');
}

function collapseHeroPanel() {
  const panel = document.getElementById('hero-panel');
  const reopen = document.getElementById('hero-reopen');
  if (!panel) return;
  panel.classList.add('collapsed');
  panel.classList.add('is-collapsed');
  panel.querySelector('.hero-panel-body')?.classList.add('hidden');
  STATE.heroCollapsed = true;
  if (reopen) reopen.classList.remove('hidden');
}

function handleHeroAction(action) {
  if (action === 'collapse-hero') collapseHeroPanel();
  if (action === 'close-hero') {
    closeHeroPanel();
  }
}

function closeHeroPanel() {
  const panel = document.getElementById('hero-panel');
  const reopen = document.getElementById('hero-reopen');
  if (panel) panel.classList.add('hidden');
  if (reopen) reopen.classList.add('hidden');
}

function toggleInfoCard(cardKey) {
  const card = document.querySelector(`.info-card[data-card="${cardKey}"]`);
  if (!card) return;
  card.classList.toggle('collapsed');
  card.querySelector('.card-body')?.classList.toggle('hidden');
}

function closeInfoCard(cardKey) {
  const card = document.querySelector(`.info-card[data-card="${cardKey}"]`);
  if (!card) return;
  card.classList.add('hidden');
}

function initInteractivePanels() {
  document.querySelectorAll('[data-action="collapse-hero"]').forEach(btn => {
    btn.addEventListener('click', () => collapseHeroPanel());
  });
  document.querySelectorAll('[data-action="close-hero"]').forEach(btn => {
    btn.addEventListener('click', () => handleHeroAction('close-hero'));
  });
  document.querySelectorAll('[data-action="toggle-card"]').forEach(btn => {
    btn.addEventListener('click', () => toggleInfoCard(btn.dataset.card));
  });
  document.querySelectorAll('[data-action="close-card"]').forEach(btn => {
    btn.addEventListener('click', () => closeInfoCard(btn.dataset.card));
  });
  document.querySelectorAll('.education-card').forEach(btn => {
    btn.addEventListener('click', () => showEducationPanel(btn.dataset.view));
  });
}

function showEducationPanel(view) {
  openIndependentPage(view);
}

function goHome() {
  closeCurrentPage();
  if (typeof closeDashboard === 'function') closeDashboard();

  openHeroPanel();

  if (MAP) {
    MAP.stop();
    MAP.setView(MAP_CENTER, MAP_ZOOM, { animate: false });
  }

  document.body.style.overflow = '';
}

function showToast(message) {
  const toast = document.getElementById('floating-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2200);
}

function closeCurrentPage() {
  const overlay = document.getElementById('page-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
  STATE.activePage = null;
}

function openIndependentPage(page) {
  const overlay = document.getElementById('page-overlay');
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  const body = document.getElementById('page-body');
  if (!overlay || !title || !subtitle || !body) return;

  STATE.activePage = page;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const pages = {
    'habilidades': {
      title: 'Habilidades que no pueden faltar',
      subtitle: 'Una guía extensa para desarrollar competencias clave para el futuro.',
      body: buildSkillsPage(),
    },
    'trabajos': {
      title: 'Trabajos del presente y del futuro',
      subtitle: 'Explora sectores de alto crecimiento, perfiles y oportunidades.',
      body: buildFutureJobsPage(),
    },
    'guia-aprendizaje': {
      title: 'Guía de aprendizaje',
      subtitle: 'Microcursos, proyectos y rutinas diseñadas para estudiar con propósito.',
      body: buildLearningGuidePage(),
    },
    'guia-empleo': {
      title: 'Guía de empleo',
      subtitle: 'Registra tu perfil y conecta con oportunidades de formación y trabajo.',
      body: buildEmploymentGuidePage(),
    },
    'empresas': {
      title: 'Empresas',
      subtitle: 'Descubre organizaciones reales con vacantes disponibles.',
      body: buildCompaniesPage(),
    }
  };

  const selectedPage = pages[page] || pages['habilidades'];
  title.textContent = selectedPage.title;
  subtitle.textContent = selectedPage.subtitle;
  body.innerHTML = selectedPage.body;
}

function buildSkillsPage() {
  const skills = [
    {
      title: 'Comunicación efectiva',
      summary: 'Permite expresar ideas con claridad, escuchar activa y resolver conflictos con profesionalismo.',
      why: 'Es esencial para entrevistas, trabajo en equipo, ventas, servicio al cliente y liderazgo.',
      how: ['Practica una estructura simple: idea, evidencia, cierre.', 'Escucha sin interrumpir y resume lo que entendiste.', 'Escribe mensajes cortos, claros y con intención.'],
      exercises: ['Graba un audio explicando un tema en 2 minutos.', 'Pide retroalimentación de un compañero sobre tu claridad.'],
      resources: [
        ['Canva Design School', 'https://www.canva.com/design-school/'],
        ['Google Workspace Learning Center', 'https://support.google.com/a/users/answer/9282958'],
        ['YouTube: Comunicación efectiva', 'https://www.youtube.com/results?search_query=comunicacion+efectiva+para+trabajo']
      ]
    },
    {
      title: 'Pensamiento crítico',
      summary: 'Ayuda a analizar información, identificar sesgos y tomar decisiones más acertadas.',
      why: 'Es clave para la toma de decisiones, resolución de problemas y adaptabilidad.',
      how: ['Haz preguntas de fondo: qué, por qué, cómo y qué evidencia hay.', 'Comparte dos versiones de la misma información y evalúa diferencias.', 'Busca contraejemplos antes de concluir.'],
      exercises: ['Analiza una noticia y escribe tres sesgos posibles.', 'Evalúa una decisión de tu día a día desde tres perspectivas.'],
      resources: [
        ['Coursera: Pensamiento crítico', 'https://www.coursera.org/'],
        ['Microsoft Learn', 'https://learn.microsoft.com/'],
        ['YouTube: Pensamiento crítico', 'https://www.youtube.com/results?search_query=pensamiento+critico']
      ]
    },
    {
      title: 'Herramientas digitales',
      summary: 'Dominar hojas de cálculo, documentos, presentaciones y plataformas digitales mejora tu empleabilidad.',
      why: 'Casi todas las empresas valoran productividad, organización y claridad digital.',
      how: ['Aprende Excel, Google Sheets, Docs y Presentaciones.', 'Organiza información con tablas, fórmulas básicas y filtros.', 'Usa plantillas para ahorrar tiempo y mejorar calidad.'],
      exercises: ['Crea un dashboard simple con tres métricas.', 'Organiza una agenda semanal con tablas y colores.'],
      resources: [
        ['Google Skillshop', 'https://skillshop.withgoogle.com/'],
        ['Microsoft Excel training', 'https://support.microsoft.com/es-es/excel'],
        ['Canva', 'https://www.canva.com/']
      ]
    },
    {
      title: 'Análisis de datos',
      summary: 'Entender datos te permite convertir información en decisiones.',
      why: 'Los análisis simples aportan claridad a ventas, operaciones, educación y salud.',
      how: ['Aprende a leer tablas, gráficos y porcentajes.', 'Compara tendencias y detecta cambios de comportamiento.', 'Usa Excel o Google Sheets como punto inicial.'],
      exercises: ['Analiza un conjunto de datos públicos y resume hallazgos.', 'Construye un gráfico simple con tres variables.'],
      resources: [
        ['Google Data Analytics', 'https://www.coursera.org/professional-certificates/google-data-analytics'],
        ['Kaggle', 'https://www.kaggle.com/'],
        ['YouTube: análisis de datos', 'https://www.youtube.com/results?search_query=analisis+de+datos+basico']
      ]
    },
    {
      title: 'Trabajo en equipo',
      summary: 'La colaboración efectiva genera mejores resultados y reduce conflictos.',
      why: 'El trabajo moderno exige coordinación, responsabilidad compartida y empatía.',
      how: ['Define roles claros desde el inicio.', 'Aporta con responsabilidad y respeto por los tiempos.', 'Solicita y ofrece retroalimentación de forma constructiva.'],
      exercises: ['Participa en un proyecto grupal con roles definidos.', 'Haz una retroalimentación en formato positivo y concreto.'],
      resources: [
        ['Coursera: Teamwork', 'https://www.coursera.org/'],
        ['Notion templates', 'https://www.notion.so/templates'],
        ['YouTube: trabajo en equipo', 'https://www.youtube.com/results?search_query=trabajo+en+equipo']
      ]
    },
    {
      title: 'Resolución de problemas',
      summary: 'Encontrar soluciones prácticas y sostenibles es una de las habilidades más demandadas.',
      why: 'Demuestra madurez, criterio y capacidad de adaptación.',
      how: ['Divide el problema en partes.', 'Prioriza el impacto y el esfuerzo.', 'Prueba soluciones pequeñas antes de escalar.'],
      exercises: ['Resuelve un problema real de tu contexto en 5 pasos.', 'Documenta una solución y cómo mejorarla.'],
      resources: [
        ['Microsoft Learn', 'https://learn.microsoft.com/'],
        ['Google for Education', 'https://edu.google.com/'],
        ['YouTube: resolución de problemas', 'https://www.youtube.com/results?search_query=resolucion+de+problemas']
      ]
    },
    {
      title: 'Adaptabilidad',
      summary: 'Aprender rápido y ajustarse a los cambios incrementa las oportunidades laborales.',
      why: 'Los mercados cambian y quien aprende se adapta mejor.',
      how: ['Acepta que el cambio es normal.', 'Mantén una rutina de aprendizaje constante.', 'Prueba nuevas herramientas sin temor.'],
      exercises: ['Aprende una herramienta nueva en una semana.', 'Haz un cambio pequeño en tu rutina y evalúa resultados.'],
      resources: [
        ['LinkedIn Learning', 'https://www.linkedin.com/learning/'],
        ['Coursera', 'https://www.coursera.org/'],
        ['YouTube: adaptabilidad', 'https://www.youtube.com/results?search_query=adaptabilidad']
      ]
    },
    {
      title: 'Inglés',
      summary: 'El inglés abre acceso a contenidos, vacantes internacionales y herramientas globales.',
      why: 'Aumenta tu competitividad y tu capacidad de conectarte con mercados globales.',
      how: ['Practica 20 minutos diarios.', 'Escucha contenido auténtico con subtítulos.', 'Habla aunque sea con errores al inicio.'],
      exercises: ['Escribe un resumen de un video en inglés.', 'Practica una mini presentación de 1 minuto.'],
      resources: [
        ['British Council', 'https://learnenglish.britishcouncil.org/'],
        ['BBC Learning English', 'https://www.bbc.co.uk/learningenglish'],
        ['YouTube: English with Lucy', 'https://www.youtube.com/@EnglishwithLucy']
      ]
    },
    {
      title: 'Inteligencia emocional',
      summary: 'Gestionar emociones y relaciones mejora el desempeño personal y profesional.',
      why: 'Influye en liderazgo, servicio, resolución de conflictos y adaptación.',
      how: ['Reconoce tus emociones antes de reaccionar.', 'Practica pausas para pensar antes de responder.', 'Desarrolla empatía con preguntas abiertas.'],
      exercises: ['Registra tus emociones durante tres días.', 'Practica una conversación difícil con calma y escucha.'],
      resources: [
        ['Coursera: Emotional Intelligence', 'https://www.coursera.org/'],
        ['Verywell Mind', 'https://www.verywellmind.com/'],
        ['YouTube: inteligencia emocional', 'https://www.youtube.com/results?search_query=inteligencia+emocional']
      ]
    },
    {
      title: 'Liderazgo',
      summary: 'Mostrar iniciativa, organización y acompañamiento marca diferencia.',
      why: 'El liderazgo no depende solo del cargo; también de la actitud.',
      how: ['Toma responsabilidad por pequeños procesos.', 'Ayuda a otros sin esperar reconocimiento inmediato.', 'Comunica objetivos con claridad.'],
      exercises: ['Dirige un pequeño proyecto escolar o familiar.', 'Organiza una reunión breve con agenda.'],
      resources: [
        ['HubSpot Academy', 'https://academy.hubspot.com/'],
        ['Microsoft Learn', 'https://learn.microsoft.com/'],
        ['YouTube: liderazgo', 'https://www.youtube.com/results?search_query=liderazgo+efectivo']
      ]
    },
    {
      title: 'Organización',
      summary: 'Organizar tiempos, documentos y tareas produce más seguridad y eficiencia.',
      why: 'Mejora la productividad y reduce errores.',
      how: ['Clasifica tareas por prioridad.', 'Usa listas simples y revisa avances cada día.', 'Mantén un espacio de trabajo claro y ordenado.'],
      exercises: ['Haz una lista de prioridades para esta semana.', 'Diseña una carpeta de trabajo con categorías claras.'],
      resources: [
        ['Trello', 'https://trello.com/'],
        ['Notion', 'https://www.notion.so/'],
        ['YouTube: organización personal', 'https://www.youtube.com/results?search_query=organizacion+personal']
      ]
    },
    {
      title: 'Gestión del tiempo',
      summary: 'Priorizar y ejecutar con foco evita desperdicio de esfuerzo.',
      why: 'Es esencial para cumplir metas, estudiar y trabajar con menos estrés.',
      how: ['Divide tareas grandes en pasos pequeños.', 'Usa bloques de estudio o trabajo.', 'Evita multitareas cuando sea posible.'],
      exercises: ['Haz un plan por bloques de 60 minutos.', 'Identifica la tarea más importante de cada día.'],
      resources: [
        ['Todoist', 'https://todoist.com/'],
        ['Pomofocus', 'https://pomofocus.io/'],
        ['YouTube: gestión del tiempo', 'https://www.youtube.com/results?search_query=gestion+del+tiempo']
      ]
    },
    {
      title: 'Creatividad',
      summary: 'La creatividad ayuda a proponer ideas, mejorar procesos y destacar.',
      why: 'Es valiosa en diseño, marketing, innovación, educación y emprendimiento.',
      how: ['Haz lluvia de ideas sin juzgar.', 'Combina ideas simples en conceptos nuevos.', 'Experimenta con pequeños prototipos.'],
      exercises: ['Crea tres ideas para resolver un problema cotidiano.', 'Diseña un mini prototipo con papel o herramientas digitales.'],
      resources: [
        ['Canva', 'https://www.canva.com/'],
        ['Miro', 'https://miro.com/'],
        ['YouTube: creatividad', 'https://www.youtube.com/results?search_query=creatividad+para+trabajar']
      ]
    },
    {
      title: 'Aprendizaje continuo',
      summary: 'La disciplina de aprender de forma constante aumenta la empleabilidad.',
      why: 'El mercado premia quien aprende rápido y se actualiza.',
      how: ['Establece una meta mensual de aprendizaje.', 'Dedica tiempo a revisar novedades del sector.', 'Documenta lo que aprendes.'],
      exercises: ['Elige un tema y aprende algo nuevo cada semana.', 'Haz un resumen de tus aprendizajes al final del mes.'],
      resources: [
        ['Microsoft Learn', 'https://learn.microsoft.com/'],
        ['Coursera', 'https://www.coursera.org/'],
        ['YouTube: aprendizaje continuo', 'https://www.youtube.com/results?search_query=aprendizaje+continuo']
      ]
    },
    {
      title: 'Uso de Inteligencia Artificial',
      summary: 'Comprender la IA ayuda a trabajar mejor y aprovechar nuevas herramientas.',
      why: 'La IA ya está presente en análisis, contenido, atención y productividad.',
      how: ['Aprende a pedir instrucciones claras.', 'Prueba herramientas de IA para ahorrar tiempo.', 'Verifica siempre la calidad y precisión de la respuesta.'],
      exercises: ['Usa IA para resumir un texto largo.', 'Haz una lluvia de ideas con una herramienta de IA y mejora el resultado.'],
      resources: [
        ['Microsoft Copilot', 'https://copilot.microsoft.com/'],
        ['Google Gemini', 'https://gemini.google.com/'],
        ['YouTube: IA para principiantes', 'https://www.youtube.com/results?search_query=inteligencia+artificial+para+principiantes']
      ]
    }
  ];

  return `
    <div class="page-grid">
      ${skills.map(skill => `
        <article class="page-card">
          <h3>${skill.title}</h3>
          <p>${skill.summary}</p>
          <div class="page-section">
            <h4>¿Por qué importa?</h4>
            <p>${skill.why}</p>
          </div>
          <div class="page-section">
            <h4>Cómo desarrollarla</h4>
            <ul>${skill.how.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
          <div class="page-section">
            <h4>Ejercicios prácticos</h4>
            <ul>${skill.exercises.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
          <div class="page-section">
            <h4>Recursos</h4>
            <ul>${skill.resources.map(([name, url]) => `<li><a href="${url}" target="_blank" rel="noreferrer">${name}</a></li>`).join('')}</ul>
          </div>
        </article>
      `).join('')}
    </div>`;
}

function buildFutureJobsPage() {
  const jobs = [
    ['Inteligencia Artificial', 'Diseña soluciones, automatiza procesos y ayuda a las empresas a tomar decisiones más rápidas y precisas.'],
    ['Sostenibilidad', 'Impulsa estrategias verdes, eficiencia energética y responsabilidad ambiental con enfoque práctico.'],
    ['Salud Digital', 'Conecta tecnología y salud para mejorar diagnósticos, coordinación y atención.'],
    ['Tecnología', 'Desarrolla productos digitales, infraestructura y herramientas para empresas y usuarios.'],
    ['Diseño', 'Crea experiencias, marca, productos y contenidos con criterio visual y estratégico.'],
    ['Ciberseguridad', 'Protege datos, redes, sistemas y operaciones frente a amenazas y fraudes.'],
    ['Ciencia de Datos', 'Analiza información para encontrar patrones, oportunidades y riesgos.'],
    ['Automatización', 'Optimiza procesos y reduce tareas repetitivas mediante herramientas tecnológicas.'],
    ['Desarrollo de software', 'Construye aplicaciones, plataformas y soluciones escalables.'],
    ['Fintech', 'Innovación en servicios financieros con tecnología, datos y seguridad.'],
    ['Comercio electrónico', 'Gestiona ventas online, experiencia del cliente y crecimiento digital.'],
    ['Logística inteligente', 'Optimiza cadenas de suministro con datos, tecnología y automatización.']
  ];

  return `
    <div class="page-grid">
      ${jobs.map(([title, copy]) => `
        <article class="page-card">
          <h3>${title}</h3>
          <p>${copy}</p>
          <div class="page-section">
            <h4>Qué hace este profesional</h4>
            <p>Analiza problemas del sector, diseña soluciones y trabaja con herramientas especializadas para producir impacto real.</p>
          </div>
          <div class="page-section">
            <h4>Dónde estudiar en Colombia</h4>
            <p>Universidades, tecnólogos y centros de formación técnica ofrecen rutas cercanas a estos perfiles.</p>
          </div>
          <div class="page-section">
            <h4>Herramientas y tecnologías</h4>
            <p>Excel, Python, Power BI, IA, automatización, diseño, análisis y gestión digital.</p>
          </div>
          <div class="page-section">
            <h4>Empleabilidad</h4>
            <p>Alta demanda en empresas que están transformando procesos, productos y servicios.</p>
          </div>
        </article>
      `).join('')}
    </div>`;
}

function buildLearningGuidePage() {
  const microcursos = [
    ['Coursera', 'Plataforma global con cursos de universidades y empresas, algunos gratuitos y otros con certificación.'],
    ['edX', 'Ofrece formación académica y profesional, con cursos gratuitos y opciones certificadas.'],
    ['Microsoft Learn', 'Ruta práctica para aprender herramientas y tecnologías Microsoft de forma gratuita.'],
    ['Google Skillshop', 'Capacitación oficial en herramientas y productos Google, ideal para productividad y marketing.'],
    ['Cisco Networking Academy', 'Excelente para redes, ciberseguridad y tecnologías de infraestructura.'],
    ['IBM SkillsBuild', 'Plataforma con cursos gratuitos, retos y recursos para formación digital.'],
    ['Platzi', 'Aprendizaje práctico con rutas orientadas al mercado laboral.'],
    ['SENA Sofía Plus', 'Recursos públicos y gratuitos con enfoque técnico y empresarial.']
  ];
  const proyectos = [
    'Diseñar una landing page con HTML, CSS y un pequeño formulario.',
    'Analizar datos públicos con Excel o Google Sheets y resumir hallazgos.',
    'Crear un dashboard simple con métricas y visualizaciones.',
    'Diseñar una propuesta de negocio o plan de emprendimiento.',
    'Resolver retos con IA y documentar los resultados.'
  ];
  const rutinas = [
    'Pomodoro: 25 minutos de enfoque y 5 de descanso.',
    'Active Recall: responde de memoria antes de revisar la respuesta.',
    'Repetición espaciada: repasa lo aprendido en intervalos crecientes.',
    'Planificación semanal: define metas, tareas y prioridades.',
    'Objetivos diarios: elige 2 o 3 logros concretos por día.'
  ];

  return `
    <div class="page-grid">
      <article class="page-card">
        <h3>Microcursos</h3>
        <div class="page-section">
          <ul>${microcursos.map(([name, copy]) => `<li><strong>${name}</strong>: ${copy}</li>`).join('')}</ul>
        </div>
      </article>
      <article class="page-card">
        <h3>Proyectos</h3>
        <div class="page-section">
          <ul>${proyectos.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
      </article>
      <article class="page-card">
        <h3>Rutinas de estudio</h3>
        <div class="page-section">
          <ul>${rutinas.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
      </article>
    </div>`;
}

function buildEmploymentGuidePage() {
  const saved = JSON.parse(localStorage.getItem('geoply_aspirante') || 'null');
  const hasSaved = Boolean(saved && Object.keys(saved).length);
  const editingEnabled = hasSaved ? Boolean(STATE.guiaEmpleoEditing) : true;
  if (!hasSaved) STATE.guiaEmpleoEditing = true;
  const readOnly = hasSaved && !editingEnabled;
  const disabledAttr = readOnly ? 'disabled' : '';
  const editButton = hasSaved ? `
            <button type="button" id="employment-form-edit-btn" class="form-submit secondary" onclick="toggleEmploymentFormEdit()" ${editingEnabled ? 'disabled' : ''}>
              ${editingEnabled ? 'Edición activa' : 'Editar perfil'}
            </button>` : '';

  return `
    <div class="page-grid page-grid-single">
      <article class="page-card">
        <div class="page-card-header">
          <div>
            <h3>Formulario de orientación laboral</h3>
            <p>Completa tu perfil y ayuda a GeoPly a recomendarte mejores oportunidades.</p>
          </div>
          ${editButton}
        </div>
        <form id="employment-form" class="full-form${readOnly ? ' read-only-form' : ''}" onsubmit="handleEmploymentForm(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-nombre">Nombre</label>
              <input class="form-input" id="guide-nombre" name="nombre" value="${saved?.nombre || ''}" required ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-apellidos">Apellidos</label>
              <input class="form-input" id="guide-apellidos" name="apellidos" value="${saved?.apellidos || ''}" required ${disabledAttr} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-edad">Edad</label>
              <input class="form-input" id="guide-edad" name="edad" type="number" min="14" max="70" value="${saved?.edad || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-ciudad">Ciudad</label>
              <input class="form-input" id="guide-ciudad" name="ciudad" value="${saved?.ciudad || ''}" ${disabledAttr} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-departamento">Departamento</label>
              <input class="form-input" id="guide-departamento" name="departamento" value="${saved?.departamento || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-correo">Correo</label>
              <input class="form-input" id="guide-correo" name="correo" type="email" value="${saved?.correo || ''}" required ${disabledAttr} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-telefono">Teléfono</label>
              <input class="form-input" id="guide-telefono" name="telefono" value="${saved?.telefono || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-nivel">Nivel educativo</label>
              <input class="form-input" id="guide-nivel" name="nivelEducativo" value="${saved?.nivelEducativo || ''}" ${disabledAttr} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-colegio">Colegio</label>
              <input class="form-input" id="guide-colegio" name="colegio" value="${saved?.colegio || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-universidad">Universidad</label>
              <input class="form-input" id="guide-universidad" name="universidad" value="${saved?.universidad || ''}" ${disabledAttr} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-tecnico">Técnico</label>
              <input class="form-input" id="guide-tecnico" name="tecnico" value="${saved?.tecnico || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-tecnologo">Tecnólogo</label>
              <input class="form-input" id="guide-tecnologo" name="tecnologo" value="${saved?.tecnologo || ''}" ${disabledAttr} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-carrera">Carrera</label>
              <input class="form-input" id="guide-carrera" name="carrera" value="${saved?.carrera || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-semestre">Semestre</label>
              <input class="form-input" id="guide-semestre" name="semestre" value="${saved?.semestre || ''}" ${disabledAttr} />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="guide-cursos">Cursos realizados</label>
            <textarea class="form-textarea" id="guide-cursos" name="cursos" placeholder="Coursera, Excel, diseño, IA..." ${disabledAttr}>${saved?.cursos || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="guide-experiencia">Experiencia</label>
            <textarea class="form-textarea" id="guide-experiencia" name="experiencia" placeholder="Experiencia laboral o práctica profesional" ${disabledAttr}>${saved?.experiencia || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-areas">Áreas de interés</label>
              <input class="form-input" id="guide-areas" name="areasInteres" value="${saved?.areasInteres || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-habilidades">Habilidades</label>
              <input class="form-input" id="guide-habilidades" name="habilidades" value="${saved?.habilidades || ''}" ${disabledAttr} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="guide-idiomas">Idiomas</label>
              <input class="form-input" id="guide-idiomas" name="idiomas" value="${saved?.idiomas || ''}" ${disabledAttr} />
            </div>
            <div class="form-group">
              <label class="form-label" for="guide-disponibilidad">Disponibilidad</label>
              <input class="form-input" id="guide-disponibilidad" name="disponibilidad" value="${saved?.disponibilidad || ''}" ${disabledAttr} />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="guide-modalidad">Modalidad deseada</label>
            <select class="form-select" id="guide-modalidad" name="modalidad" ${disabledAttr}>
              <option value="Presencial" ${saved?.modalidad === 'Presencial' ? 'selected' : ''}>Presencial</option>
              <option value="Remota" ${saved?.modalidad === 'Remota' ? 'selected' : ''}>Remota</option>
              <option value="Híbrida" ${saved?.modalidad === 'Híbrida' ? 'selected' : ''}>Híbrida</option>
            </select>
          </div>
          <div class="page-section">
            <h4>Autorización de tratamiento de datos</h4>
            <label class="remember-row"><input type="checkbox" name="tratamientoDatos" value="si" ${saved?.tratamientoDatos ? 'checked' : ''} ${disabledAttr} /> <span>Autorizo el tratamiento de mis datos personales.</span></label>
            <label class="remember-row"><input type="checkbox" name="compartirEmpresas" value="si" ${saved?.compartirEmpresas ? 'checked' : ''} ${disabledAttr} /> <span>Autorizo que mi información sea compartida con empresas interesadas en contratarme.</span></label>
            <label class="remember-row"><input type="checkbox" name="oportunidadesEducativas" value="si" ${saved?.oportunidadesEducativas ? 'checked' : ''} ${disabledAttr} /> <span>Autorizo el uso de mi perfil para mostrar oportunidades educativas.</span></label>
            <label class="remember-row"><input type="checkbox" name="contactoProgramas" value="si" ${saved?.contactoProgramas ? 'checked' : ''} ${disabledAttr} /> <span>Autorizo ser contactado sobre programas técnicos, tecnológicos, universitarios y becas.</span></label>
          </div>
          <button type="submit" id="employment-form-submit" class="form-submit" ${readOnly ? 'disabled' : ''}>Guardar mi perfil</button>
        </form>
        <div id="employment-form-success-screen" class="form-success-screen hidden" aria-live="polite">
          <div class="checkmark-anim" aria-hidden="true">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path class="checkmark-circle" d="M50 5a45 45 0 1 1 0 90 45 45 0 1 1 0-90" fill="none" stroke="#00ff88" stroke-width="6" />
              <path class="checkmark-check" d="M28 53l15 14 29-35" fill="none" stroke="#00ff88" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="form-success-title">¡Formulario exitoso!</div>
          <div class="form-success-text">Tu perfil se guardó correctamente.</div>
          <div class="form-success-countdown" id="employment-form-countdown">Cerrando en 3...</div>
        </div>
      </article>
    </div>`;
}
function buildCompaniesPage() {
  const companies = COMPANY_SAMPLE.map(item => `
    <article class="page-card company-card-page">
      <h3>${item.nombre}</h3>
      <p>${item.sector}</p>
      <div class="page-section">
        <p><strong>Ciudad:</strong> ${item.ubicacion}</p>
        <p><strong>Vacantes:</strong> ${item.vacantes}</p>
        <a href="${item.enlace}" target="_blank" rel="noreferrer">Aplicar ahora</a>
      </div>
    </article>
  `).join('');
  return `<div class="page-grid">${companies}</div>`;
}

window.handleEmploymentForm = function (event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  localStorage.setItem('geoply_aspirante', JSON.stringify(data));
  STATE.userSession = data;
  STATE.guiaEmpleoEditing = false;
  showEmploymentFormSuccess();
};

window.toggleEmploymentFormEdit = function () {
  STATE.guiaEmpleoEditing = true;
  const form = document.getElementById('employment-form');
  if (!form) return;
  form.querySelectorAll('input, select, textarea').forEach(el => el.removeAttribute('disabled'));
  const editBtn = document.getElementById('employment-form-edit-btn');
  if (editBtn) {
    editBtn.textContent = 'Edición activa';
    editBtn.disabled = true;
  }
  const submitBtn = document.getElementById('employment-form-submit');
  if (submitBtn) submitBtn.disabled = false;
};

window.showEmploymentFormSuccess = function () {
  const form = document.getElementById('employment-form');
  const successScreen = document.getElementById('employment-form-success-screen');
  const countdownEl = document.getElementById('employment-form-countdown');
  if (!successScreen || !form) return;
  form.classList.add('hidden');
  successScreen.classList.remove('hidden');
  successScreen.classList.add('visible');
  if (countdownEl) countdownEl.textContent = 'Cerrando en 3...';
  const submitBtn = document.getElementById('employment-form-submit');
  if (submitBtn) submitBtn.disabled = true;
  const editBtn = document.getElementById('employment-form-edit-btn');
  if (editBtn) editBtn.disabled = true;

  let remaining = 3;
  if (window._employmentFormCountdownInterval) {
    clearInterval(window._employmentFormCountdownInterval);
  }
  if (window._employmentFormCloseTimeout) {
    clearTimeout(window._employmentFormCloseTimeout);
  }

  window._employmentFormCountdownInterval = setInterval(() => {
    remaining -= 1;
    if (countdownEl) countdownEl.textContent = `Cerrando en ${remaining}...`;
    if (remaining <= 0) {
      clearInterval(window._employmentFormCountdownInterval);
      window._employmentFormCountdownInterval = null;
    }
  }, 1000);

  window._employmentFormCloseTimeout = setTimeout(() => {
    if (window._employmentFormCountdownInterval) {
      clearInterval(window._employmentFormCountdownInterval);
      window._employmentFormCountdownInterval = null;
    }
    closeCurrentPage();
  }, 5000);
};

window.handleAccountAction = function () {
  const savedUser = JSON.parse(localStorage.getItem('geoply_aspirante') || 'null');
  if (savedUser && savedUser.correo) {
    openIndependentPage('guia-empleo');
    return;
  }
  abrirModal('modal-login');
};

window.goHome = goHome;
window.openIndependentPage = openIndependentPage;
window.closeCurrentPage = closeCurrentPage;

function initSearch() {
  const input = document.getElementById('search-dept-input');
  const suggestions = document.getElementById('search-suggestions');
  if (!input || !suggestions) return;

  const normalizedList = DEPARTAMENTOS_LIST.map(item => ({ original: item, normalized: normalizeKey(item) }));

  input.addEventListener('input', () => {
    const query = normalizeKey(input.value);
    if (!query) {
      suggestions.classList.add('hidden');
      suggestions.innerHTML = '';
      return;
    }

    const matches = normalizedList.filter(item => item.normalized.includes(query)).slice(0, 8);
    if (!matches.length) {
      suggestions.innerHTML = '<button class="suggestion-item" type="button">No se encontró el departamento</button>';
      suggestions.classList.remove('hidden');
      return;
    }

    suggestions.innerHTML = matches.map(item => `<button class="suggestion-item" type="button" data-dept="${item.original}">${item.original}</button>`).join('');
    suggestions.classList.remove('hidden');
    suggestions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.dept;
        suggestions.classList.add('hidden');
        selectDeptFromSearch(btn.dataset.dept);
      });
    });
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const firstMatch = suggestions.querySelector('.suggestion-item');
      if (firstMatch && firstMatch.dataset.dept) {
        input.value = firstMatch.dataset.dept;
        suggestions.classList.add('hidden');
        selectDeptFromSearch(firstMatch.dataset.dept);
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-wrap')) {
      suggestions.classList.add('hidden');
    }
  });
}

function initAuthForms() {
  const loginForm = document.getElementById('form-login');
  const alertEl = document.getElementById('login-alert');
  const successEl = document.getElementById('login-success');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value.trim();
      if (!email || !password) {
        if (alertEl) {
          alertEl.textContent = 'Completa correo y contraseña.';
          alertEl.classList.add('visible');
        }
        return;
      }
      if (!email.includes('@')) {
        if (alertEl) {
          alertEl.textContent = 'Ingresa un correo válido.';
          alertEl.classList.add('visible');
        }
        return;
      }
      if (alertEl) alertEl.classList.remove('visible');
      if (successEl) {
        successEl.classList.add('visible');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const profileData = { nombre: email.split('@')[0], correo: email, password };
      localStorage.setItem('geoply_aspirante', JSON.stringify(profileData));
      STATE.userSession = profileData;
      document.getElementById('nav-login-btn').textContent = 'Mi cuenta';
      const heroBtn = document.getElementById('hero-account-btn');
      if (heroBtn) heroBtn.textContent = 'Mi Cuenta';
      showToast('Bienvenido a GeoPly');
      setTimeout(() => cerrarModales(), 500);
    });
  }
}

function recuperarPassword() {
  alert('Se ha enviado un enlace de recuperación al correo indicado.');
}

function initCompanyPanel() {
  renderCompanyList();
  const storedCompany = localStorage.getItem('geoply_company');
  if (storedCompany) {
    STATE.companySession = JSON.parse(storedCompany);
    showCompanyDashboard();
  }
  const storedUser = localStorage.getItem('geoply_aspirante');
  if (storedUser) {
    STATE.userSession = JSON.parse(storedUser);
    const loginBtn = document.getElementById('nav-login-btn');
    if (loginBtn) loginBtn.textContent = 'Mi cuenta';
    const heroBtn = document.getElementById('hero-account-btn');
    if (heroBtn) heroBtn.textContent = 'Mi Cuenta';
  }
}

function renderCompanyList() {
  const content = document.getElementById('company-list-content');
  if (!content) return;
  content.innerHTML = COMPANY_SAMPLE.map(item => `
    <article class="company-item">
      <div>
        <h4>${item.nombre}</h4>
        <p>${item.sector}</p>
      </div>
      <div class="company-meta">
        <span>${item.ubicacion}</span>
        <span>${item.vacantes} vacantes</span>
      </div>
      <a href="${item.enlace}" target="_blank" rel="noreferrer">Conocer más</a>
    </article>
  `).join('');
}

function showCompanyAuthView(view) {
  document.querySelectorAll('.company-switch').forEach(btn => btn.classList.remove('active'));
  document.getElementById('company-switch-login').classList.toggle('active', view === 'login');
  document.getElementById('company-switch-register').classList.toggle('active', view === 'register');
  document.getElementById('company-auth-login').classList.toggle('hidden', view !== 'login');
  document.getElementById('company-auth-register').classList.toggle('hidden', view !== 'register');
}

function showCompanyDashboard() {
  if (!STATE.companySession) return;
  document.getElementById('company-auth-login')?.classList.add('hidden');
  document.getElementById('company-auth-register')?.classList.add('hidden');
  document.getElementById('company-dashboard')?.classList.remove('hidden');
  const title = document.getElementById('company-dashboard-title');
  const copy = document.getElementById('company-dashboard-copy');
  if (title) title.textContent = `Panel de ${STATE.companySession.nombre}`;
  if (copy) copy.textContent = `${STATE.companySession.sector} • ${STATE.companySession.ubicacion}`;
  renderCompanyVacancies();
}

function editarEmpresaActual() {
  document.getElementById('form-company-edit')?.classList.remove('hidden');
}

function registrarEmpresa(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  localStorage.setItem('geoply_company', JSON.stringify(data));
  STATE.companySession = data;
  showCompanyDashboard();
  showToast(`Bienvenido ${data.nombre}`);
  cerrarModales();
  abrirModal('modal-empresa');
}

function iniciarSesionEmpresa(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  const errorEl = document.getElementById('company-login-error');
  const successEl = document.getElementById('company-login-success');

  if (!data.correo || !data.password) {
    if (errorEl) {
      errorEl.textContent = 'Completa correo y contraseña.';
      errorEl.classList.add('visible');
    }
    return;
  }

  const stored = JSON.parse(localStorage.getItem('geoply_company') || 'null');
  let session;
  if (stored && stored.correo === data.correo && stored.password === data.password) {
    session = stored;
  } else {
    session = {
      nombre: data.correo.split('@')[0],
      correo: data.correo,
      password: data.password,
      sector: 'Sin especificar',
      ubicacion: 'Colombia'
    };
    localStorage.setItem('geoply_company', JSON.stringify(session));
  }

  if (errorEl) errorEl.classList.remove('visible');
  STATE.companySession = session;
  showCompanyDashboard();
  if (successEl) successEl.classList.add('visible');
  showToast(`Panel activado para ${session.nombre}`);

  setTimeout(() => cerrarModales(), 600);
}

function actualizarEmpresa(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  STATE.companySession = { ...STATE.companySession, ...data };
  localStorage.setItem('geoply_company', JSON.stringify(STATE.companySession));
  document.getElementById('form-company-edit')?.classList.add('hidden');
  showCompanyDashboard();
}

function publicarVacante(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  const vacancies = JSON.parse(localStorage.getItem('geoply_vacancies') || '[]');
  vacancies.push({ ...data, id: Date.now() });
  localStorage.setItem('geoply_vacancies', JSON.stringify(vacancies));
  form.reset();
  renderCompanyVacancies();
}

function renderCompanyVacancies() {
  const list = document.getElementById('company-vacancy-list');
  if (!list) return;
  const vacancies = JSON.parse(localStorage.getItem('geoply_vacancies') || '[]');
  list.innerHTML = vacancies.length
    ? vacancies.map(v => `
      <article class="vacancy-item">
        <h5>${v.titulo}</h5>
        <p>${v.descripcion}</p>
        <div class="company-meta">
          <span>${v.tipo}</span>
          <span>${v.ubicacion}</span>
          <span>${v.salario}</span>
        </div>
      </article>`).join('')
    : '<p class="empty-state">Aún no hay vacantes publicadas.</p>';
}

function selectDeptFromSearch(deptName) {
  if (deptName && MAP) {
    selectDept(deptName, null); // abre el panel derecho primero
    showToast(`Mostrando ${deptName}`);

    const findCentro = () => {
      if (typeof DEPARTAMENTOS_EMPLEO === 'undefined') return null;
      return DEPARTAMENTOS_EMPLEO.find(d => d.nombre === deptName)
        || DEPARTAMENTOS_EMPLEO.find(d => normalizeKey(d.nombre) === normalizeKey(deptName))
        || null;
    };

    const flyToDept = () => {
      MAP.invalidateSize({ animate: false });
      const centro = findCentro();
      if (centro) {
        MAP.flyTo([centro.lat, centro.lng], 7, { duration: 0.8 });
      } else {
        console.warn('[GeoPly] No se encontraron coordenadas para el departamento:', deptName);
      }
    };

    // Esperamos a que termine la transición del panel lateral (que cambia el
    // ancho del mapa) y a que invalidateSize lo reajuste, antes de volar —
    // así no vuela sobre un mapa todavía desalineado. Usamos el evento real
    // de fin de transición del panel como disparador principal, con un
    // timeout de respaldo por si el panel ya estaba abierto (sin transición).
    const rightSidebarEl = document.querySelector('.sidebar-right');
    let flown = false;
    const runOnce = () => { if (flown) return; flown = true; flyToDept(); };
    if (rightSidebarEl) {
      rightSidebarEl.addEventListener('transitionend', runOnce, { once: true });
    }
    setTimeout(runOnce, 380);
  }
}

window.iniciarSesion = function (e) {
  e?.preventDefault();
  const loginForm = document.getElementById('form-login');
  if (loginForm) loginForm.requestSubmit();
};

window.showEducationPanel = showEducationPanel;
window.openSidebarFromNav = openSidebarFromNav;
window.openHeroPanel = openHeroPanel;
window.toggleInfoCard = toggleInfoCard;
window.closeInfoCard = closeInfoCard;
window.handleHeroAction = handleHeroAction;
window.showCompanyAuthView = showCompanyAuthView;
window.registrarEmpresa = registrarEmpresa;
window.iniciarSesionEmpresa = iniciarSesionEmpresa;
window.actualizarEmpresa = actualizarEmpresa;
window.publicarVacante = publicarVacante;
window.selectDeptFromSearch = selectDeptFromSearch;

// ------------------------------------------------------------------
// Colores por GeoPly Score
// ------------------------------------------------------------------

function colorForScore(score) {
  if (score >= 70) return '#00ff88';
  if (score >= 45) return '#ffd700';
  return '#ff5252';
}

function colorForDept(deptName) {
  const safeName = String(deptName || '').trim();
  let hash = 0;
  for (let i = 0; i < safeName.length; i += 1) {
    hash = (hash * 31 + safeName.charCodeAt(i)) % 360;
  }
  const hue = (hash + 37) % 360;
  return `hsl(${hue} 70% 58%)`;
}

function buildDeptStyle(deptName, isActive) {
  return {
    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.35)',
    weight: isActive ? 2.4 : 1,
    fillColor: colorForDept(deptName),
    fillOpacity: isActive ? 0.72 : 0.42,
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
  document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
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
  document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.add('hidden'));
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
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', function (e) {
      if (e.target === el) cerrarModales();
    });
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
