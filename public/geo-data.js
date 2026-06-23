/**
 * geo-data.js — GeoPly · Tabla de geolocalización de respaldo
 * ════════════════════════════════════════════════════════════
 * Muchos datasets de datos.gov.co NO traen latitud/longitud,
 * sino el nombre del municipio o departamento. Esta tabla permite
 * ubicar esos registros aproximadamente en el mapa (centro del
 * municipio/departamento) cuando no hay coordenadas explícitas.
 *
 * Las claves están normalizadas: minúsculas, sin tildes, sin
 * caracteres especiales. Usa normalizeKey() para consultarla.
 */

'use strict';

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita tildes
    .replace(/[^a-z0-9 ]/g, ' ')       // quita signos
    .replace(/\s+/g, ' ')
    .trim();
}

// [lat, lng] — capitales de departamento + municipios de Antioquia
// relevantes para el reto (formato [latitud, longitud])
const COL_COORDS = Object.freeze({
  // ── Antioquia / Medellín y área metropolitana ──
  'medellin':            [6.2476, -75.5658],
  'bello':               [6.3373, -75.5580],
  'itagui':              [6.1719, -75.6122],
  'envigado':            [6.1719, -75.5814],
  'sabaneta':            [6.1500, -75.6166],
  'la estrella':         [6.1583, -75.6436],
  'caldas':              [6.0917, -75.6342],
  'copacabana':          [6.3486, -75.5078],
  'girardota':           [6.3789, -75.4453],
  'antioquia':           [6.5500, -75.8300],
  'rionegro':            [6.1551, -75.3753],

  // ── Capitales de departamento (Colombia) ──
  'bogota':              [4.7110, -74.0721],
  'bogota d c':          [4.7110, -74.0721],
  'cundinamarca':        [4.8000, -74.1000],
  'cali':                [3.4516, -76.5320],
  'valle del cauca':     [3.7000, -76.4000],
  'barranquilla':        [10.9685, -74.7813],
  'atlantico':           [10.7000, -74.9000],
  'cartagena':           [10.3910, -75.4794],
  'bolivar':             [9.0000, -74.5000],
  'bucaramanga':         [7.1193, -73.1227],
  'santander':           [6.8000, -73.2000],
  'cucuta':              [7.8939, -72.5078],
  'norte de santander':  [7.9000, -72.9000],
  'pereira':             [4.8087, -75.6906],
  'risaralda':           [5.0000, -75.9000],
  'manizales':           [5.0689, -75.5174],
  'caldas departamento': [5.2000, -75.3000],
  'armenia':             [4.5339, -75.6811],
  'quindio':             [4.4600, -75.6700],
  'ibague':              [4.4389, -75.2322],
  'tolima':              [4.4000, -75.2000],
  'neiva':               [2.9273, -75.2819],
  'huila':               [2.5000, -75.5000],
  'pasto':               [1.2136, -77.2811],
  'narino':              [1.5000, -77.5000],
  'popayan':             [2.4448, -76.6147],
  'cauca':               [2.5000, -76.8000],
  'monteria':            [8.7479, -75.8814],
  'cordoba':             [8.0000, -75.7000],
  'sincelejo':           [9.3047, -75.3978],
  'sucre':               [8.8000, -74.7000],
  'valledupar':          [10.4631, -73.2532],
  'cesar':               [9.5000, -73.5000],
  'santa marta':         [11.2408, -74.1990],
  'magdalena':           [10.4000, -74.4000],
  'riohacha':            [11.5444, -72.9072],
  'la guajira':          [11.5000, -72.9000],
  'quibdo':              [5.6947, -76.6611],
  'choco':               [5.7000, -76.6000],
  'tunja':               [5.5353, -73.3678],
  'boyaca':              [5.5000, -73.3000],
  'villavicencio':       [4.1420, -73.6266],
  'meta':                [3.9000, -73.5000],
  'florencia':           [1.6144, -75.6062],
  'caqueta':             [1.0000, -75.5000],
  'arauca':              [7.0844, -70.7591],
  'yopal':               [5.3378, -72.3959],
  'casanare':            [5.3000, -72.0000],
  'mocoa':               [1.1471, -76.6486],
  'putumayo':            [1.0000, -76.5000],
  'leticia':             [-4.2153, -69.9406],
  'amazonas':            [-1.5000, -71.5000],
  'inirida':             [3.8653, -67.9239],
  'guainia':             [3.0000, -68.0000],
  'mitu':                [1.1983, -70.1733],
  'vaupes':              [0.8000, -70.5000],
  'puerto carreno':      [6.1891, -67.4859],
  'vichada':             [5.0000, -69.0000],
  'san jose del guaviare':[2.5708, -72.6443],
  'guaviare':            [2.0000, -72.5000],
  'colombia':            [4.5709, -74.2973],
});

/**
 * Intenta extraer coordenadas [lat, lng] de un registro de la API
 * usando, en orden:
 *  1. Campos geo-point tipo GeoJSON ({type:'Point', coordinates:[lon,lat]})
 *  2. Campos explícitos de latitud/longitud
 *  3. Nombre de municipio o departamento (vía COL_COORDS)
 * Devuelve {lat, lng, approx:boolean} o null si no se pudo ubicar.
 */
function extractGeo(record) {
  if (!record || typeof record !== 'object') return null;

  // 1. GeoJSON Point embebido (campos como the_geom, georeferencia, etc.)
  for (const key of Object.keys(record)) {
    const val = record[key];
    if (val && typeof val === 'object' && val.type === 'Point' && Array.isArray(val.coordinates)) {
      const [lon, lat] = val.coordinates;
      const flat = parseFloat(lat), flon = parseFloat(lon);
      if (isFinite(flat) && isFinite(flon) && Math.abs(flat) <= 90 && Math.abs(flon) <= 180) {
        return { lat: flat, lng: flon, approx: false };
      }
    }
  }

  // 2. Campos explícitos lat/lng
  const LAT_KEYS = ['latitud', 'lat', 'latitude', 'y', 'coord y', 'coordenada y'];
  const LNG_KEYS = ['longitud', 'long', 'lon', 'lng', 'longitude', 'x', 'coord x', 'coordenada x'];

  let latVal = null, lngVal = null;
  for (const key of Object.keys(record)) {
    const nk = normalizeKey(key);
    if (latVal === null && LAT_KEYS.includes(nk)) latVal = record[key];
    if (lngVal === null && LNG_KEYS.includes(nk)) lngVal = record[key];
  }
  if (latVal !== null && lngVal !== null) {
    const flat = parseFloat(latVal), flng = parseFloat(lngVal);
    if (isFinite(flat) && isFinite(flng) && Math.abs(flat) <= 90 && Math.abs(flng) <= 180 && (flat !== 0 || flng !== 0)) {
      return { lat: flat, lng: flng, approx: false };
    }
  }

  // 3. Nombre de municipio / departamento
  const CITY_KEYS = ['municipio', 'ciudad', 'nombre municipio', 'municipio nombre', 'nom mpio', 'mpio', 'nombre del municipio'];
  const DEPT_KEYS = ['departamento', 'depto', 'nombre departamento', 'departamento nombre', 'nom dep', 'nombre del departamento'];

  let cityVal = null, deptVal = null;
  for (const key of Object.keys(record)) {
    const nk = normalizeKey(key);
    if (cityVal === null && CITY_KEYS.includes(nk)) cityVal = record[key];
    if (deptVal === null && DEPT_KEYS.includes(nk)) deptVal = record[key];
  }

  if (cityVal) {
    const k = normalizeKey(cityVal);
    if (COL_COORDS[k]) return { lat: COL_COORDS[k][0], lng: COL_COORDS[k][1], approx: true };
  }
  if (deptVal) {
    const k = normalizeKey(deptVal);
    if (COL_COORDS[k]) return { lat: COL_COORDS[k][0], lng: COL_COORDS[k][1], approx: true };
  }

  return null;
}