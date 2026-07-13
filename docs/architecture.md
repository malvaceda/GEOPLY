# Arquitectura del Sistema — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia  
Concurso: Datos Abiertos de Colombia — Categoría Intermedia  
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes   
Fecha: 11/07/2026

---

## 1. Introducción

GeoPly transforma datos públicos dispersos en un análisis territorial accesible. Su arquitectura está diseñada para hacer exactamente eso con el menor número de capas posible: consulta fuentes oficiales directamente, procesa la información en el navegador del usuario, y presenta los resultados sobre un mapa interactivo de Colombia.

La decisión de arquitectura central es que no existe un servidor intermediario entre el usuario y los datos. Los datasets de datos.gov.co se consultan directamente desde el frontend. El backend de Express que existe en el proyecto sirve únicamente para dos funciones periféricas: entregar los archivos estáticos de la aplicación y gestionar el registro de aspirantes en base de datos. El análisis territorial, el cálculo de indicadores y la visualización ocurren enteramente en el navegador.

Esta elección tiene consecuencias prácticas: la plataforma puede desplegarse con infraestructura mínima, los datos siempre provienen de la fuente oficial y el sistema no requiere sincronización periódica ni pipelines de datos.

---

## 2. Visión general de la arquitectura

```
Usuario (navegador)
        │
        ▼
   index.html  ──► styles.css
        │
        ▼  carga secuencial de scripts
   departamentos-data.js   (datos DANE base)
   geo-boundaries.js       (polígonos departamentales)
   geo-data.js             (normalización geográfica)
   indicators.js           (motor de indicadores)
   dashboard.js            (consulta de APIs + dashboard)
   app.js                  (mapa + interacción)
        │
        ├──► SODA API (datos.gov.co)     consulta HTTP directa
        │    7 datasets en paralelo
        │
        ├──► JSON endpoints propios      archivos DANE procesados
        │    (repositorio GitHub)
        │
        └──► Leaflet.js + OpenStreetMap  tiles del mapa
        │
        ▼
   Indicadores calculados en memoria
        │
        ▼
   Mapa + Dashboard + Panel de detalle
        │
  (opcional) POST /api/registro-aspirante
        │
        ▼
   Express server → MySQL
```

---

## 3. Componentes principales

### 3.1 Frontend

El frontend es una aplicación de página única (`index.html`) sin framework de JavaScript. Toda la interfaz (mapa, dashboard, modales, paneles laterales, páginas de contenido educativo) existe dentro de un único documento HTML que muestra u oculta secciones según la interacción del usuario.

La interfaz tiene cinco zonas funcionales visibles:

Mapa principal. Ocupa el centro de la pantalla. Renderizado con Leaflet.js v1.9.4 sobre tiles de OpenStreetMap filtrados con CSS para estética oscura. Muestra los 33 departamentos de Colombia como polígonos coloreados según su GeoPly Score, con hexágonos adicionales para las 16 comunas de Medellín cuando el zoom supera el umbral definido (`MEDELLIN_ZOOM_THRESHOLD = 9.2`).

Panel lateral derecho. Aparece al seleccionar un departamento. Muestra las métricas clave del DANE (desempleo, ocupación, participación, subocupación) y un acceso directo al dashboard completo.

Panel lateral izquierdo. Leyenda del mapa y accesos a las secciones de educación y orientación laboral.

Dashboard de empleo. Se despliega como una superposición de pantalla completa sin abandonar la página. Contiene 15 tarjetas de indicadores para el departamento seleccionado, cada una con su gráfico y un texto narrativo expandible en lenguaje no técnico.

Páginas de contenido. Cuatro secciones accesibles desde el menú (habilidades, trabajos del futuro, guía de aprendizaje y orientación laboral) que se renderizan en una superposición independiente construida dinámicamente en `app.js`.

La tipografía utilizada es Manrope y Plus Jakarta Sans (cuerpo) con JetBrains Mono (datos y cifras), cargadas desde Google Fonts.

---

### 3.2 Backend

El servidor Express (`server.js`) cumple dos funciones:

**Servir archivos estáticos.** Entrega `index.html`, los scripts JavaScript, `styles.css` y los recursos multimedia al navegador cuando se accede a la aplicación por HTTP.

**Registro de aspirantes.** El único endpoint activo que el frontend llama es `POST /api/registro-aspirante` (y su variante `PUT` para edición). Cuando un usuario completa el formulario de registro, `app.js` intenta enviarlo al servidor. Si el servidor no está disponible, el sistema cae a modo sin conexión: guarda los datos en `localStorage` y muestra el mensaje de éxito igualmente. Esto significa que el registro funciona en modo offline con degradación transparente.

El servidor también incluye endpoints para organizaciones, vacantes y el cálculo del GeoPly Score de compatibilidad aspirante-vacante, pero estos no son invocados por la interfaz actual de forma directa; están preparados para integraciones futuras.

La base de datos MySQL (`geoply_empleo`) almacena aspirantes, organizaciones, vacantes y servicios. Su uso es opcional para la funcionalidad principal de análisis territorial.

---

### 3.3 Integración con datos abiertos

La consulta de datos ocurre en `dashboard.js` al cargar la aplicación. El sistema construye la URL de cada dataset usando la SODA API:

```
https://www.datos.gov.co/resource/{id}.json?$limit=40
```

Los siete datasets de datos.gov.co se consultan sin autenticación. El límite de 40 registros por consulta es configurable (`RECORD_LIMIT`) y responde a un balance entre volumen de información y tiempo de respuesta aceptable para una aplicación web interactiva. Cada solicitud tiene un timeout de 12 segundos (`FETCH_TIMEOUT_MS`). Si un endpoint no responde o devuelve error, el dataset se marca como no disponible (`DATA_STATUS[id] = 'error'`) y la aplicación continúa cargando los demás sin interrumpirse. El estado de cada fuente es visible en el header de la interfaz.

Los archivos estadísticos del DANE se consumen mediante el mismo mecanismo de `fetch`, desde URLs de un repositorio GitHub donde el equipo publicó los archivos XLSX originales convertidos a JSON.

```
Inicio de la aplicación
        │
        ▼
loadAllDatasets() — itera los 11 datasets
        │
        ├── fetchDataset(id) con AbortController (timeout 12s)
        │     │
        │     ├── éxito → DATA_CACHE[id] = registros
        │     │            DATA_STATUS[id] = 'ok'
        │     │
        │     └── error → DATA_CACHE[id] = []
        │                 DATA_STATUS[id] = 'error'
        │
        ▼ (después de cada dataset, no al final)
buildEmpleoRecords()  → actualiza EMPLEO_RECORDS
invalidateIndicatorsCache()
refreshDeptStyles()   → actualiza colores del mapa
renderDeptDashboard() → actualiza dashboard si está abierto
```

La carga es progresiva: cada dataset que llega actualiza el mapa y el dashboard inmediatamente, sin esperar a que todos estén disponibles.

---

### 3.4 Motor de indicadores

`indicators.js` es el componente analítico central. Calcula 15 variables para cada uno de los 33 departamentos combinando dos tipos de información: los datos estructurados del DANE en `departamentos-data.js` y los registros individuales de las APIs en `EMPLEO_RECORDS`.

```
DEPARTAMENTOS_EMPLEO (datos DANE)   +   EMPLEO_RECORDS (registros APIs)
              │                                      │
              ▼                                      ▼
   Variables 1–5, 11–15                    Variables 6–10
   (tasas agregadas)                  (análisis de registros locales)
              │                                      │
              └──────────────┬───────────────────────┘
                             ▼
                computeIndicatorsForDept(deptName)
                             │
                             ▼
              15 variables por departamento
                             │
                             ▼
                    GeoPly Score (var. 15)
```

**Variables 1–5** se calculan desde datos DANE: Índice de Oportunidad (suma ponderada de TO, TD, TGP, TS), tasa de desempleo, tasa de ocupación, informalidad estimada y crecimiento del empleo (comparación TD 2018 vs. 2025).

**Variables 6–10** se construyen desde los registros de las APIs mediante detección dinámica de campos: sectores con mayor demanda, sectores emergentes (por cociente de localización), nivel educativo predominante, inserción laboral juvenil y brecha de género.

**Variables 11–15** combinan ambas fuentes: disponibilidad de talento, dinámica empresarial, competitividad territorial (ranking entre los 33 departamentos), tendencia regional y el GeoPly Score compuesto.

El GeoPly Score integra siete dimensiones con ponderaciones explícitas:

| Dimensión | Peso |
| Índice de Oportunidad Laboral | 25% |
| Crecimiento del empleo (2018→2025) | 20% |
| Informalidad estimada | 15% |
| Sectores emergentes (cociente de localización) | 15% |
| Competitividad territorial | 10% |
| Nivel educativo detectado | 10% |
| Inserción laboral juvenil | 5% |

Los resultados se cachean en `DEPT_INDICATORS_CACHE` hasta que llega un nuevo dataset, momento en que la caché se invalida y los indicadores se recalculan en la siguiente consulta.

---

## 4. Flujo de datos

```
1. Usuario abre GeoPly en el navegador
           │
           ▼
2. index.html carga scripts en orden:
   departamentos-data.js → geo-boundaries.js → geo-data.js
   → indicators.js → dashboard.js → app.js
           │
           ▼
3. app.js inicializa el mapa Leaflet y renderiza los
   polígonos departamentales (desde DEPT_BOUNDARIES)
           │
           ▼
4. dashboard.js inicia loadAllDatasets():
   consulta los 11 datasets en secuencia
           │
   ┌───────┤ Por cada dataset recibido:
   │       ▼
   │  buildEmpleoRecords() → geolocaliza cada registro
   │  refreshDeptStyles()  → recalcula colores del mapa
   └───────┤
           │
           ▼
5. Usuario selecciona un departamento en el mapa
           │
           ▼
6. app.js → showDeptDetail(deptName):
   lee DEPARTAMENTOS_EMPLEO para métricas base
   muestra panel lateral con TD, TO, TGP, TS
           │
           ▼
7. Usuario abre "Panel de Empleo"
           │
           ▼
8. dashboard.js → renderDeptDashboard(deptName):
   llama computeAllIndicators()
   genera las 15 tarjetas con gráficos y narrativa
           │
           ▼
9. Usuario puede registrarse como aspirante
           │
   ┌────── ▼
   │  POST /api/registro-aspirante → Express → MySQL
   │  (si falla: localStorage como fallback)
   └──────────────────────────────────────────────
```

---

## 5. Arquitectura lógica por capas

```
┌─────────────────────────────────────────────────────┐
│                 CAPA DE PRESENTACIÓN                │
│  index.html · styles.css · Leaflet.js               │
│  Mapa · Dashboard · Paneles · Modales · Páginas     │
├─────────────────────────────────────────────────────┤
│              CAPA DE ORQUESTACIÓN                   │
│  app.js                                             │
│  Gestiona estado global (STATE), interacciones,     │
│  navegación entre vistas y sesiones de usuario      │
├─────────────────────────────────────────────────────┤
│             CAPA DE PROCESAMIENTO                   │
│  indicators.js · dashboard.js                       │
│  Cálculo de 15 indicadores · GeoPly Score           │
│  Generación de tarjetas · Narrativa en lenguaje     │
│  natural · Cociente de localización                 │
├─────────────────────────────────────────────────────┤
│             CAPA DE INTEGRACIÓN                     │
│  geo-data.js · geo-boundaries.js                   │
│  Normalización geográfica en 3 niveles              │
│  Asignación de registros a departamentos            │
│  Polígonos GeoJSON de Colombia                     │
├─────────────────────────────────────────────────────┤
│              CAPA DE DATOS                          │
│  departamentos-data.js   Indicadores DANE/GEIH      │
│  SODA API datos.gov.co   7 datasets laborales       │
│  JSON endpoints propios  11 archivos DANE           │
│  MySQL (opcional)        Aspirantes y vacantes      │
└─────────────────────────────────────────────────────┘
```

Cada capa depende solo de las capas inferiores, nunca de las superiores. `indicators.js` no sabe nada del mapa; `geo-data.js` no sabe nada del dashboard. Esta separación permite actualizar o reemplazar cualquier capa sin afectar las demás.

---

## 6. Decisiones de diseño

Sin backend de procesamiento. La decisión de calcular todos los indicadores en el navegador no fue por limitación técnica sino por diseño deliberado: elimina la necesidad de sincronizar datos, reduce la infraestructura requerida y garantiza que los resultados siempre reflejen los datos más recientes de la fuente oficial. El tiempo adicional necesario para calcular los indicadores es muy bajo y prácticamente imperceptible para el usuario

Carga progresiva de datasets. En lugar de esperar a que todos los datasets carguen para mostrar el mapa, cada dataset que llega actualiza la visualización inmediatamente. Esto hace que la experiencia del usuario mejore gradualmente durante los primeros segundos, en lugar de mostrar una pantalla de carga prolongada.

Degradación elegante. Tanto la consulta de APIs como el registro de aspirantes están diseñados para fallar silenciosamente. Si un dataset falla, el sistema lo registra y continúa. Si el backend no está disponible, el registro se guarda en `localStorage`. El usuario nunca ve un error bloqueante por una falla de red.

Un solo HTML, múltiples vistas. El dashboard, las páginas de contenido educativo y los modales de registro se renderizan dentro del mismo `index.html`, mostrando y ocultando elementos según la interacción. Esto evita recargas de página y mantiene el estado del mapa entre navegaciones.

Detección dinámica de campos. En lugar de asumir nombres de columnas fijos en los datasets de la API, el motor de indicadores busca campos mediante patrones normalizados. Esto hace al sistema resistente a variaciones en los esquemas de las fuentes, que es una condición real de los datos abiertos disponibles.

---

## 7. Seguridad y confiabilidad

Validación de respuestas de API. Cada respuesta HTTP se verifica antes de procesarse: se comprueba que el código de estado sea exitoso, que la respuesta sea un arreglo válido y que los campos de coordenadas estén dentro de rangos geográficos válidos. Los registros con coordenadas fuera del territorio colombiano o con el valor nulo `(0, 0)` se descartan silenciosamente.

Manejo de datos ausentes. Cuando un campo esperado no puede identificarse en los registros de un dataset, el indicador correspondiente no se fuerza a un valor predeterminado: aparece como no disponible en el dashboard, con un mensaje informativo. Esto aplica especialmente a las variables 6–10, que dependen de la estructura de cada fuente.

Transparencia sobre estimaciones. La tasa de informalidad no está disponible como dato oficial por departamento en las fuentes consultadas. GeoPly la calcula como una estimación ajustada a partir de la informalidad nacional y el desempleo relativo de cada región. Tanto el gráfico como el texto narrativo de esa tarjeta identifican explícitamente el valor como estimado.

Dependencia de fuentes externas. El comportamiento de la plataforma depende de la disponibilidad de datos.gov.co. Si el portal no está accesible, el mapa se renderiza con los datos base de `departamentos-data.js` (indicadores DANE) pero las variables 6–10 del dashboard quedan vacías. La interfaz informa al usuario cuántos datasets lograron cargarse.

Sesiones de usuario. Los perfiles de aspirantes y empresas se almacenan en `localStorage` del navegador como mecanismo de persistencia del lado del cliente. No existe autenticación formal en la versión actual; las sesiones son locales al dispositivo.

---

## 8. Escalabilidad y evolución futura

La arquitectura actual facilita extensiones sin modificar los componentes existentes:

Nuevos datasets. Para integrar una fuente adicional basta con agregar su entrada al arreglo `DATASETS` en `dashboard.js`. El sistema de geolocalización y el motor de indicadores la procesarán automáticamente. Si el nuevo dataset tiene campos de nivel educativo, sexo o edad, las variables 8, 9 y 10 los detectarán sin cambios adicionales.

Nuevas variables. El modelo de 15 variables puede ampliarse agregando el cálculo en `computeIndicatorsForDept` y la tarjeta correspondiente en `renderDeptDashboard`. La función `narrativeFor` genera el texto explicativo por variable mediante un switch; agregar un caso nuevo es suficiente.

Mayor cobertura geográfica. `geo-data.js` incluye un diccionario `COL_COORDS` con más de 70 municipios. Agregar nuevas entradas extiende la cobertura de geolocalización por nombre. Para añadir límites de nuevas unidades administrativas (municipios, zonas metropolitanas), `geo-boundaries.js` acepta cualquier GeoJSON válido.

Nuevas visualizaciones. El dashboard genera tarjetas dinámicamente en una grilla CSS. Una nueva visualización puede agregarse como una función `buildXCard(r)` que devuelva HTML, sin afectar las tarjetas existentes.

Backend más robusto. El servidor Express actual es mínimo. Si el proyecto escala a usuarios concurrentes, la misma interfaz puede conectarse a un backend más completo sin cambios en el frontend, dado que la separación entre capas es explícita.

---

## 9. Conclusión

La arquitectura de GeoPly puede resumirse en una decisión: poner la inteligencia en el navegador y los datos en las fuentes oficiales, sin intermediarios. Esto hace al sistema ligero, auditable y alineado con los principios de los datos abiertos: cualquier usuario puede verificar de dónde vienen los números que ve en pantalla, porque los datos viajan directamente desde datos.gov.co hasta su navegador.

El resultado es una plataforma que convierte once conjuntos de datos públicos en 15 indicadores territoriales por departamento, presentados sobre un mapa interactivo de Colombia, sin requerir infraestructura compleja ni sincronización periódica de datos. Su arquitectura modular permite que cada componente evolucione de forma independiente a medida que el proyecto crece.

