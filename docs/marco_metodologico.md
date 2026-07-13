# Marco Metodológico — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia  
Concurso: Datos Abiertos de Colombia — Categoría Intermedia  
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes 
Fecha: 10/07/2026

---

## 1. Introducción

CRISP-ML (*Cross-Industry Standard Process for Machine Learning*) es una metodología iterativa para el desarrollo de proyectos basados en datos. Organiza el trabajo en seis fases secuenciales (comprensión del problema, comprensión de los datos, preparación de los datos, desarrollo de la solución, evaluación e impacto esperado) y establece que cada decisión técnica debe poder trazarse hasta una necesidad identificada en el problema original.

GeoPly no es un proyecto de machine learning en sentido estricto: no entrena modelos ni hace predicciones probabilísticas. Sin embargo, CRISP-ML fue adoptada como marco de trabajo porque su estructura de fases es aplicable a cualquier proyecto que transforme datos crudos en conocimiento accionable. Lo que el equipo necesitaba era exactamente eso: un proceso que asegurara que cada componente construido respondiera a un problema real.

---

## 2. Aplicación de CRISP-ML en GeoPly

### 2.1 Comprensión del problema

El punto de partida fue una observación sencilla: los datos del mercado laboral colombiano en datos.gov.co existen, pero están distribuidos en decenas de datasets sin ninguna capa de integración ni visualización territorial. Un ciudadano que quisiera entender qué tan activo es el mercado laboral de su departamento tendría que identificar cuáles datasets son relevantes, descargarlos en formato técnico, cruzar información de fuentes con esquemas distintos y finalmente interpretar columnas con nombres como `td`, `to`, `tgp` o `ts` sin contexto comparativo.

Esa brecha entre disponibilidad técnica e interpretabilidad práctica definió el problema central del proyecto y su alcance: GeoPly no intentaría predecir el mercado laboral, sino hacerlo legible para usuarios no especializados.

La definición del problema también delimitó lo que el proyecto explícitamente no haría. El `dashboard.js` incluye una tarjeta `buildSpeExploreCard` que reconoce abiertamente una limitación: "GeoPly todavía no tiene un dato oficial que cruce sector económico y departamento, esa combinación no se publica hoy como dato abierto." Esta honestidad sobre los límites del sistema fue una decisión de diseño tomada desde la comprensión del problema.

Los objetivos que emergieron de esta fase fueron tres: integrar las fuentes de datos disponibles, calcular indicadores comparables entre regiones y presentar los resultados sobre un mapa interactivo sin requerir conocimientos técnicos del usuario.

---

### 2.2 Comprensión de los datos

Con los objetivos claros, el siguiente paso fue explorar qué datasets existían en datos.gov.co y evaluar su utilidad para el problema planteado.

El equipo desarrolló `fletch_empleo_data.py`, un script Python dedicado exclusivamente a esta fase. Su función es consultar cada dataset mediante la SODA API, contar los registros recibidos, detectar los campos disponibles, identificar sus tipos de dato y registrar un ejemplo de valor por campo:

```python
def summarize_fields(records):
    fields = {}
    for record in records:
        for key, value in record.items():
            if key not in fields:
                fields[key] = {
                    "tipo": type(value).__name__,
                    "ejemplo": str(sample)[:60],
                }
    return fields
```

Este script puede ejecutarse en modo `--schema` para obtener solo el inventario de campos sin guardar caché, o con `--out` para persistir los datos localmente durante el desarrollo:

```bash
python3 fletch_empleo_data.py --limit 20 --schema
```

La exploración reveló dos características importantes de los datasets. Primero, los once conjuntos seleccionados tienen esquemas heterogéneos: los nombres de columnas varían entre fuentes para referirse a los mismos conceptos (municipio, ciudad, nom_mpio, mpio). Segundo, la información geográfica se publica de formas distintas: algunos registros incluyen coordenadas explícitas, otros incluyen geometrías GeoJSON, y muchos solo traen nombres de municipio o departamento en texto libre.

Este hallazgo de la fase de comprensión de datos determinó directamente la arquitectura de la siguiente fase.

---

### 2.3 Preparación de los datos

La preparación de datos en GeoPly tiene dos componentes: la normalización geográfica de registros y el cálculo de indicadores a partir de los datos base de los departamentos.

#### Normalización geográfica

`geo-data.js` resuelve el problema de la heterogeneidad geográfica con una función `extractGeo` que intenta ubicar cada registro en tres niveles de precisión, en orden descendente de confiabilidad:

Nivel 1: GeoJSON embebido. Si el registro contiene un campo con geometría tipo `Point` (como los que publica algunos datasets bajo el nombre `the_geom` o `georeferencia`), se extraen directamente las coordenadas:

```javascript
if (val.type === 'Point' && Array.isArray(val.coordinates)) {
  const [lon, lat] = val.coordinates;
  return { lat: flat, lng: flon, approx: false };
}
```

Nivel 2: Campos explícitos de latitud/longitud. El sistema busca campos que coincidan con una lista normalizada de nombres posibles (`latitud`, `lat`, `latitude`, `y`, `coord y`, `coordenada y` y sus equivalentes para longitud), aplicando primero una función `normalizeKey` que elimina tildes, convierte a minúsculas y normaliza espacios para que variaciones como `Latitud`, `LATITUD` o `latítud` sean equivalentes.

Nivel 3: Resolución por nombre geográfico. Si ninguno de los dos métodos anteriores funciona, el sistema busca campos que correspondan a nombres de municipio o departamento y los resuelve contra un diccionario `COL_COORDS` con más de 70 entradas que cubre capitales departamentales, municipios del Área Metropolitana de Medellín y las principales ciudades del país. Los registros ubicados por este método se marcan con `approx: true` para distinguirlos de las ubicaciones precisas.

Esta jerarquía de tres niveles fue la consecuencia directa del hallazgo de la fase anterior sobre la heterogeneidad de los datos.

El resultado de la geolocalización alimenta `buildEmpleoRecords` en `dashboard.js`, que itera sobre todos los datasets cargados y construye `EMPLEO_RECORDS`, el conjunto unificado de registros ubicados sobre el que operan todos los indicadores posteriores:

```javascript
function buildEmpleoRecords() {
  EMPLEO_RECORDS = [];
  for (const ds of DATASETS) {
    const recs = DATA_CACHE[ds.id] || [];
    recs.forEach((record, index) => {
      const geo = extractGeo(record);
      if (geo) {
        EMPLEO_RECORDS.push({ datasetId: ds.id, datasetName: ds.name, index, geo, record });
      }
    });
  }
}
```

#### Datos base departamentales

Paralelo a los registros de la API, el proyecto mantiene en `departamentos-data.js` un conjunto estructurado con los indicadores DANE/GEIH de los 33 departamentos de Colombia. Este archivo contiene tasas de desempleo (`td`), ocupación (`to`), participación (`tgp`) y subocupación (`ts`) actuales junto con la tasa de desempleo de 2018 (`td_2018`), lo que permite comparación histórica.

El archivo `NATIONAL_TRENDS` complementa este conjunto con indicadores nacionales (informalidad, población ocupada, brecha de género en Bogotá) necesarios para contextualizar los indicadores departamentales.

#### Tratamiento de campos desconocidos

Un desafío real de la preparación fue que los datasets no tienen esquemas fijos o documentados de forma estándar. `indicators.js` implementa funciones de detección dinámica de campos para extraer información útil sin saber de antemano cómo se llaman las columnas:

- `findFieldByPattern(items, patterns)` busca campos cuyo nombre normalizado contenga alguno de los patrones dados (como `['nivel_educ', 'niveleduc', 'escolarid']` para nivel educativo, o `['sexo', 'genero']` para el campo de género).
- `detectCategoricalField(items, opts)` identifica automáticamente el campo categórico más significativo de un conjunto de registros, seleccionando aquel con mayor frecuencia de uso y cardinalidad entre 2 y 15 valores distintos.

Cuando estos métodos no encuentran el campo correspondiente, el sistema no genera un valor ni lo inventa: muestra explícitamente `"Campo no identificado en las fuentes actuales"` o `"Sin suficientes registros"`. Esa transparencia sobre los límites de los datos es también parte de la preparación.

---

### 2.4 Desarrollo de la solución

La solución de GeoPly tiene tres capas funcionales: la carga y caché de datos de la API, el cálculo de indicadores y la presentación visual.

#### Carga de datos

`dashboard.js` implementa `loadAllDatasets`, que consulta secuencialmente los once datasets mediante `fetch` a la SODA API con un timeout de 12 segundos por solicitud. Cada dataset se almacena en `DATA_CACHE` y su estado (pendiente, cargado, error) se registra en `DATA_STATUS`. La carga es secuencial y progresiva: cada dataset que llega actualiza inmediatamente el mapa y el dashboard sin esperar a que todos los demás estén disponibles, lo que mantiene la aplicación responsiva incluso cuando algunos endpoints son lentos o fallan.

```javascript
async function loadAllDatasets() {
  for (const ds of DATASETS) {
    const records = await fetchDataset(ds.id);
    DATA_CACHE[ds.id] = records || [];
    buildEmpleoRecords();
    if (typeof invalidateIndicatorsCache === 'function') invalidateIndicatorsCache();
    if (typeof refreshDeptStyles === 'function') refreshDeptStyles();
  }
}
```

#### Cálculo del Índice de Oportunidad y el GeoPly Score

`indicators.js` contiene la lógica analítica del proyecto. La función `computeIndicatorsForDept` calcula quince variables para cada departamento. Las variables 1 a 5 y 11 a 15 se derivan principalmente de los datos base de `departamentos-data.js`. Las variables 6 a 10 (sectores con mayor demanda, sectores emergentes, nivel educativo, inserción juvenil y brecha de género) se construyen desde los registros de la API mediante detección dinámica de campos.

El Índice de Oportunidad (variable 1) es una suma ponderada de cuatro tasas DANE normalizadas:

```javascript
const idxOportunidad = roundN(
  0.35 * normalize(d.to, 33, 70) +       // Tasa de ocupación: mayor peso
  0.30 * (100 - normalize(d.td, 5, 13)) + // Tasa de desempleo: penaliza
  0.20 * normalize(d.tgp, 38, 75) +       // Participación laboral
  0.15 * (100 - normalize(d.ts, 1, 14))   // Subocupación: penaliza
);
```

El GeoPly Score (variable 15) es el indicador compuesto final que integra siete dimensiones con ponderaciones explícitas:

```javascript
const geoplyScore = roundN(
  0.25 * scoreOportunidad +      // Índice de oportunidad
  0.20 * scoreCrecimiento +      // Variación TD 2018→2025
  0.15 * scoreInformalidad +     // Informalidad estimada
  0.15 * scoreEmergentes +       // Sectores emergentes (LQ)
  0.10 * scoreCompetitividad +   // Ranking territorial
  0.10 * scoreEducativo +        // Nivel educativo detectado
  0.05 * scoreJuvenil            // Inserción juvenil
);
```

Para los sectores emergentes se calcula un cociente de localización (location quotient): la proporción de un sector en los registros locales dividida entre su proporción en el total nacional. Un valor superior a 1.15 se interpreta como concentración relativa significativa.

Un aspecto importante sobre la informalidad estimada (variable 4): los datasets disponibles no publican la tasa de informalidad por departamento, por lo que `indicators.js` calcula una estimación basada en la informalidad nacional ajustada por el desempleo relativo del departamento. El sistema no oculta esto al usuario; el gráfico correspondiente lleva la etiqueta "Estimado — ver explicación" y el texto narrativo describe explícitamente el método y sus limitaciones.

#### Presentación visual

`app.js` maneja el mapa Leaflet con capas de polígonos departamentales, puntos de calor desde `EMPLEO_RECORDS` y marcadores interactivos. El color de cada departamento en el mapa se actualiza en tiempo real con `refreshDeptStyles` cada vez que llega un nuevo dataset, de modo que la visualización mejora progresivamente mientras cargan los datos.

El dashboard se presenta como una superposición (`dashboard-overlay`) que cubre la pantalla completa sin abandonar la página. Contiene quince tarjetas, cada una con un gráfico de barras, un gráfico de torta o un indicador numérico, más un botón "✦ Explicar este gráfico" que despliega el texto narrativo de `narrativeFor`, evitando saturar la interfaz con explicaciones que no todos los usuarios necesitan.

---

### 2.5 Evaluación

La evaluación de GeoPly no implicó métricas de machine learning porque el proyecto no genera predicciones que puedan compararse contra valores reales. Lo que sí fue verificado fue la coherencia y cobertura del sistema.

Cobertura territorial. Se verificó que los 33 departamentos de `departamentos-data.js` producen indicadores calculables y que el ranking de competitividad los ordena a todos. Esta verificación es estructural: si algún departamento no genera indicadores, `computeAllIndicators` lo excluye del ranking y el dashboard muestra un mensaje de error en lugar de un valor incorrecto.

Consistencia de los indicadores. Los valores límite de las funciones `normalize` en `indicators.js` fueron ajustados para que el rango de las tasas reales de los 33 departamentos produzca scores distribuidos a lo largo de la escala 0–100, sin que todos los departamentos se agrupen en un extremo. Esto se revisó manualmente comparando el ranking resultante contra la intuición sobre qué departamentos tienen mercados laborales más dinámicos.

Manejo de datos ausentes. Se verificó que el sistema se comporta correctamente cuando un dataset falla: `DATA_STATUS[ds.id] = 'error'` y `DATA_CACHE[ds.id] = []` aseguran que los componentes posteriores no reciben `null` sino un arreglo vacío, evitando errores en cascada. Las tarjetas del dashboard que dependen de campos no encontrados muestran mensajes informativos en lugar de valores vacíos o errores de JavaScript.

Validación de la geolocalización. La función `extractGeo` incluye validación de rangos geográficos (`Math.abs(flat) <= 90 && Math.abs(flng) <= 180`) y descarta coordenadas `(0, 0)` que son un valor inválido frecuente en datos sucios. Se verificó que registros con coordenadas fuera del territorio colombiano no aparecen como marcadores en el mapa.

Transparencia sobre estimaciones. Se revisó que toda variable calculada con un método aproximado lleve una etiqueta o explicación que lo indique. La tasa de informalidad, por ejemplo, aparece con la advertencia "Estimado" tanto en el gráfico como en el texto narrativo.

---

### 2.6 Impacto esperado

El impacto esperado de GeoPly opera en tres planos, derivados directamente de los problemas identificados en la primera fase.

Acceso ciudadano a datos abiertos. La plataforma reduce la barrera técnica para interpretar información del mercado laboral colombiano. Un ciudadano que antes necesitaría descargar archivos CSV y conocer la diferencia entre TD, TO y TGP puede ahora seleccionar un departamento en el mapa y leer en lenguaje natural qué significan esos indicadores para esa zona.

Apoyo a decisiones de búsqueda de empleo y emprendimiento. El GeoPly Score y el Índice de Oportunidad permiten comparar departamentos de forma directa. Alguien que evalúa moverse a otra región o expandir un negocio puede usar esa comparación como un punto de partida informado, con la advertencia explícita de que el indicador no reemplaza un análisis económico profundo.

Demostración del valor de los datos abiertos. Cada visualización en GeoPly está construida enteramente sobre información pública de datos.gov.co. El proyecto argumenta, mediante su funcionamiento, que los once datasets integrados tienen un valor latente que la simple publicación en formato JSON no explota. La integración territorial es lo que activa ese valor.

Utilidad potencial para entidades públicas. El dashboard con ranking de competitividad territorial y comparación de tendencias 2018–2025 podría ser útil para secretarías de desarrollo económico o entidades de promoción del empleo que necesitan contextualizar sus análisis regionales rápidamente. GeoPly no fue diseñado para uso institucional formal, pero su arquitectura de datos abiertos lo hace replicable sin costo de licenciamiento.

---

## 3. Reflexión metodológica

CRISP-ML resultó adecuada para GeoPly porque obligó a que cada decisión técnica tuviera un antecedente identificable en el problema o en los datos.

La función `extractGeo` con sus tres niveles de precisión no existiría si la fase de comprensión de datos no hubiera revelado la heterogeneidad geográfica de los datasets. La etiqueta "Estimado" en la tarjeta de informalidad no existiría si la fase de preparación no hubiera encontrado que ese dato no está disponible por departamento. El botón "✦ Explicar este gráfico" no existiría si la fase de comprensión del problema no hubiera identificado que el usuario objetivo no es un especialista en estadística laboral.

La metodología también impuso una disciplina útil sobre lo que el proyecto no debía hacer. En ningún momento del desarrollo se intentó añadir predicciones de empleo futuro o modelos de recomendación personalizada. No porque esas funcionalidades no sean técnicamente posibles, sino porque no resolvían el problema planteado en la primera fase, y CRISP-ML hace explícito que la evaluación de cualquier componente debe remitirse al problema original.

El resultado es un proyecto cuyas afirmaciones son sostenibles: cada indicador publicado tiene un método documentado, cada limitación está declarada en la interfaz y cada componente responde a una necesidad identificada antes de ser construido.