# Fuentes de Datos — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia  
Concurso: Datos Abiertos de Colombia — Categoría Intermedia  
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes 
Fecha: 11/07/2026

---

## 1. Introducción

GeoPly no genera datos propios. Todo el análisis territorial que produce (el Índice de Oportunidad, el GeoPly Score, los sectores emergentes, las tendencias históricas) se construye enteramente sobre información publicada por entidades oficiales del Estado colombiano y por el DANE.

Esto tiene una implicación importante: la plataforma es replicable, auditable y actualizable sin costo. Cualquier ciudadano, investigador o entidad que quiera verificar los cálculos puede acceder a las mismas fuentes que GeoPly consulta. Y cuando los organismos que publican esos datos los actualicen, GeoPly los reflejará automáticamente en la siguiente carga.

El proyecto integra dos tipos de fuentes: conjuntos de datos consultados directamente mediante la SODA API del portal datos.gov.co, y archivos estadísticos del DANE transformados en endpoints JSON propios para facilitar su consumo por la plataforma. Ambos tipos son datos abiertos; la diferencia está en la forma de acceso.

---

## 2. Estrategia de selección de fuentes

La selección de datasets no fue exhaustiva ni aleatoria. Se aplicaron cuatro criterios concretos:

Relevancia directa con el mercado laboral. Se priorizaron conjuntos que describen el mercado de trabajo desde distintos ángulos complementarios: quién busca empleo, quién ofrece vacantes, qué sectores contratan, cómo se distribuye la fuerza laboral por edad, sexo y nivel educativo. Se descartaron datasets que, aunque disponibles en datos.gov.co, no tenían relación directa con la dinámica laboral (sitios turísticos, procesos de contratación pública hospitalaria, registro de vendedores informales locales).

Cobertura territorial útil. Se seleccionaron fuentes con información a escala departamental o municipal. Fuentes con cobertura exclusivamente local o con un único municipio se incorporaron cuando aportaban una variable que ninguna otra fuente nacional cubría.

Posibilidad de geolocalización. Dado que GeoPly representa los datos en un mapa, fue necesario que los registros de cada dataset pudieran ubicarse geográficamente, ya sea mediante coordenadas explícitas, geometrías GeoJSON o nombres de municipio o departamento identificables.

Complementariedad entre fuentes. Se buscó que cada dataset aportara una dimensión que las demás no cubrían. Las fuentes del SENA describen la oferta de formación; las del DANE describen los indicadores agregados del mercado; las agencias de empleo municipales aportan datos de colocación real; el DAFP aporta la estructura del empleo público. Juntas construyen una imagen más completa que cualquiera por separado.

---

## 3. Inventario de fuentes

GeoPly integra dos grupos de fuentes. El primero se consulta directamente a través de la SODA API de datos.gov.co. El segundo está compuesto por archivos estadísticos del DANE que el equipo procesó y publicó como endpoints JSON accesibles por la plataforma.

### 3.1 Fuentes vía SODA API — datos.gov.co

|                    Dataset                   |     ID      |   Entidad publicadora  | Contenido principal | Uso en GeoPly |
|           Población NINI 18-28 años          | `yix6-7yeh` | Ministerio del Trabajo | Jóvenes que no estudian ni trabajan | Inserción juvenil (var. 9) |
|       Cupos formación profesional SENA       | `2c7k-9iru` |          SENA          | Cupos por tipo de población | Disponibilidad de talento (var. 11) |
|     Programas educación para el trabajo      | `2v94-3ypi` |       MinEducación     | Programas ETDH por institución | Nivel educativo (var. 8) |
|        Agencia de empleo — colocación        | `tgvn-r2n9` | Inst. Municipal de Empleo de Bucaramanga | Registros de colocación laboral | Sectores demanda (var. 6), dinámica (var. 12) |
|    Empleos y tipos de planta por entidad     | `fvq4-wwtz` |          DAFP          | Planta de personal del sector público | Dinámica empresarial (var. 12) |
|   Inscritos agencia pública de empleo SENA   | `8pqf-rmzr` |          SENA          | Registros de búsqueda de empleo | Sectores demanda (var. 6), brecha género (var. 10) |
| Certificación formación profesional integral | `28vu-5tx7` |          SENA          | Certificaciones emitidas por programa | Nivel educativo (var. 8), disponibilidad talento (var. 11) |

> Nota: Los identificadores `khhm-wccm`, `xs69-evan` y `canv-4tj3` están registrados en `dashboard.js` como "Demanda laboral por sector", "Oferta de empleo" y "Estadísticas de empleo" respectivamente, pero el documento de fuentes del proyecto no registra su nombre oficial ni entidad publicadora. Se integran al flujo de procesamiento pero no se documentan aquí con atribución específica para evitar información incorrecta.

### 3.2 Fuentes DANE procesadas como endpoints propios

El equipo tomó archivos estadísticos publicados por el DANE en formato XLSX, los procesó y los publicó como archivos JSON en un repositorio de acceso público para facilitar su consumo por la plataforma.

| Dataset | Fuente original | Encuesta/módulo DANE | Uso en GeoPly |
| Principales indicadores del mercado laboral | DANE | GEIH — Anexo Mercado Laboral general | Tasas TD, TO, TGP, TS (base de todos los indicadores) |
| Mercado laboral por departamentos | DANE | GEIH — GEIHMLD | Indicadores por departamento para el ranking territorial |
| Mercado laboral por sexo | DANE | GEIH — GEIHMLS | Brecha laboral por género (var. 10) |
| Mercado laboral de la juventud | DANE | GEIH — GEIHMLJ | Inserción juvenil y desempleo joven (var. 9) |
| Fuerza laboral y educación | DANE | GEIH — Módulo de educación | Nivel educativo de la fuerza laboral (var. 8) |
| Ocupación informal | DANE | GEIH — EISS (Empleo Informal y Seg. Social) | Estimación de informalidad (var. 4) |
| Perspectiva del mercado laboral | DANE | RELAB | Tendencias y crecimiento del empleo (var. 5, 14) |
| Mercado laboral por regiones | DANE | GEIH — Módulo regional | Competitividad y tendencia regional (var. 13, 14) |
| Mercado laboral Bogotá | DANE | GEIH | Indicadores específicos de la capital |
| Vinculaciones 2023 | Departamento Administrativo del Servicio Civil Distrital | CSV Datos Abiertos Bogotá | Dinámica de vinculación laboral pública |
| Zonas y vías de Medellín | Alcaldía de Medellín — Dpto. de Planeación | GeoMedellín (XLSX) | Contexto geoespacial para el Área Metropolitana |

---

## 4. Descripción detallada de cada fuente

### 4.1 Población NINI 18-28 años (`yix6-7yeh`) — Ministerio del Trabajo

Este dataset registra jóvenes entre 18 y 28 años que simultáneamente no están estudiando ni trabajando, una de las medidas más directas de exclusión del mercado laboral en población joven. En GeoPly alimenta el cálculo de inserción laboral juvenil (variable 9): los registros con dato de edad en ese rango se comparan contra el total de registros del departamento para obtener una proporción.

### 4.2 Cupos en formación profesional integral (`2c7k-9iru`) — SENA

Contiene el número de cupos disponibles en programas de formación del SENA, clasificados por tipo de población beneficiaria. En GeoPly contribuye a la variable de disponibilidad de talento (variable 11): junto con las certificaciones emitidas, permite estimar qué tan activa es la oferta de formación en cada departamento relativa a su población ocupada.

Fue seleccionado porque la formación para el trabajo es un predictor relevante de la capacidad futura del mercado laboral, y el SENA es una de las principales entidades de formación técnica y tecnológica del país.

### 4.3 Programas educación para el trabajo (`2v94-3ypi`) — MinEducación

Registra los programas de Educación para el Trabajo y el Desarrollo Humano (ETDH) habilitados por el Ministerio de Educación. Aporta información sobre el nivel y tipo de formación disponible por región, lo que contribuye a la variable de nivel educativo predominante (variable 8) en combinación con los datos DANE de fuerza laboral y educación.

### 4.4 Agencia de empleo — colocación (`tgvn-r2n9`) — Instituto Municipal de Empleo de Bucaramanga

Este dataset registra intermediaciones laborales efectivas realizadas a través de una agencia de empleo: candidatos, vacantes gestionadas y colocaciones realizadas. Es una de las fuentes con mayor contenido de variables categóricas (sector, perfil, tipo de contrato), lo que la convierte en la más útil para identificar sectores con mayor demanda (variable 6) y explorar la dinámica empresarial (variable 12) mediante detección automática de campos.

Una limitación reconocida: la cobertura geográfica corresponde principalmente a Bucaramanga y su área de influencia, por lo que los patrones detectados desde esta fuente son más representativos del nororiente colombiano que del país en su conjunto.

### 4.5 Empleos y tipos de planta por entidad (`fvq4-wwtz`) — DAFP

El Departamento Administrativo de la Función Pública publica la estructura de planta de personal de las entidades del Estado colombiano. En GeoPly aporta al indicador de dinámica empresarial (variable 12): la presencia de entidades públicas con planta activa en un departamento es un componente de la actividad económica local, especialmente relevante en regiones donde el empleo público es predominante.

### 4.6 Inscritos en la agencia pública de empleo SENA (`8pqf-rmzr`) — SENA

Registra personas inscritas en la Agencia de Empleo del SENA a nivel nacional. Es una de las fuentes con mayor potencial para detectar brecha laboral por sexo (variable 10) e identificar sectores demandados (variable 6), ya que los registros incluyen campos de sexo, área de interés y municipio. Su cobertura nacional la hace más representativa que la fuente de Bucaramanga para análisis a escala departamental.

### 4.7 Certificación de formación profesional integral (`28vu-5tx7`) — SENA

Contiene los certificados emitidos por el SENA por programa, nivel de formación y área. Junto con los cupos disponibles, permite estimar la relación entre formación ofertada y formación completada, lo que contribuye a disponibilidad de talento (variable 11) y nivel educativo (variable 8).

---

### 4.8 Principales indicadores del mercado laboral — DANE/GEIH

Base estructural de todos los indicadores del proyecto. Contiene las cuatro tasas que alimentan el Índice de Oportunidad Laboral: **Tasa de Desempleo (TD)**, **Tasa de Ocupación (TO)**, **Tasa Global de Participación (TGP)** y **Tasa de Subocupación (TS)**. Son los únicos indicadores oficiales y estandarizados del mercado laboral colombiano disponibles a escala departamental con periodicidad regular. Sin esta fuente, el Índice de Oportunidad no podría calcularse.

### 4.9 Mercado laboral por departamentos — DANE/GEIH (GEIHMLD)

Versión desagregada por departamento de los indicadores GEIH. Permite construir el ranking de competitividad territorial (variable 13) comparando los 33 departamentos en las mismas dimensiones. También proporciona los datos históricos de 2018 que hacen posible calcular la tendencia de crecimiento del empleo (variable 5): la variación en puntos porcentuales de la tasa de desempleo entre 2018 y 2025 es el indicador principal de si el mercado laboral de un departamento mejoró o se deterioró en ese período.

### 4.10 Mercado laboral por sexo — DANE/GEIH (GEIHMLS)

Desagrega los indicadores laborales por sexo, permitiendo cuantificar la brecha laboral de género (variable 10) a escala nacional y, donde los registros de las APIs lo permiten, a escala departamental. Esta fuente es relevante para el reto, que menciona explícitamente la equidad como criterio de impacto.

### 4.11 Mercado laboral de la juventud — DANE/GEIH (GEIHMLJ)

Módulo específico del GEIH sobre población joven. En GeoPly complementa el dataset NINI del Ministerio del Trabajo para construir el indicador de inserción laboral juvenil (variable 9), aportando tasas de desempleo y participación diferenciadas para el grupo de 15 a 28 años.

### 4.12 Fuerza laboral y educación — DANE/GEIH

Cruza los indicadores laborales con el nivel educativo de la población ocupada, lo que permite identificar el nivel educativo predominante (variable 8) en la fuerza laboral de cada departamento. Esta fuente también respalda la tendencia nacional de largo plazo incorporada en el README del proyecto: el crecimiento de 106.7% en ocupados con educación universitaria entre 2010 y 2024.

### 4.13 Ocupación informal — DANE/GEIH (EISS)

El Anexo de Empleo Informal y Seguridad Social del GEIH publica la tasa de informalidad a nivel nacional y por grandes ciudades, pero no por todos los departamentos. GeoPly utiliza esta fuente como base para la estimación de informalidad (variable 4): toma la tasa nacional y la ajusta por el desempleo relativo de cada departamento. La plataforma señala explícitamente que este valor es una estimación, no un dato oficial, precisamente porque la fuente no lo publica a ese nivel de desagregación.

### 4.14 Perspectiva del mercado laboral — DANE/RELAB

El Registro Estadístico de Relaciones Laborales (RELAB) aporta contexto sobre la dinámica de contratación y las perspectivas de las empresas. En GeoPly alimenta la variable de tendencia regional (variable 14).

### 4.15 Vinculaciones 2023 — Servicio Civil Distrital de Bogotá

Registra vinculaciones laborales en el sector público distrital de Bogotá para el año 2023. Fue incorporado como fuente adicional de dinámica de vinculación en la capital, que representa el mayor mercado laboral del país. El dataset original fue publicado como CSV en Datos Abiertos Bogotá y el equipo lo convirtió en endpoint JSON para facilitar su integración.

### 4.16 Zonas administrativas y vías de Medellín — Alcaldía de Medellín

Archivos geoespaciales del portal GeoMedellín con los límites de zonas administrativas y la red vial urbano-rural. Aportan contexto territorial para el Área Metropolitana de Medellín, que representa uno de los mercados laborales más significativos del país fuera de Bogotá.

---

## 5. Integración de las fuentes

El proceso de integración resuelve tres problemas concretos: la heterogeneidad de esquemas, la inconsistencia geográfica y la diferencia de escalas entre fuentes.

```
Fuentes SODA API          Fuentes DANE/JSON
(datos.gov.co)            (repositorio propio)
       │                         │
       ▼                         ▼
Consulta HTTP con timeout  Carga directa JSON
       │                         │
       └──────────┬──────────────┘
                  ▼
        Normalización de campos
        (nombres, tildes, mayúsculas)
                  │
                  ▼
        Geolocalización por nivel
        (GeoJSON → lat/lng → nombre)
                  │
                  ▼
        Asignación a departamento
        (polígono o texto)
                  │
                  ▼
        Conjunto unificado de registros
                  │
                  ▼
        Cálculo de 15 indicadores por departamento
```

Normalización de esquemas. Los nombres de columna varían entre datasets. El sistema aplica normalización de texto antes de buscar cualquier campo: elimina tildes, convierte a minúsculas y colapsa espacios. Así, `Nivel_Educativo`, `nivel educativo` y `NIVELEDUCATIVO` son tratados como equivalentes. Para cada variable de interés (nivel educativo, sexo, edad, sector) existe una lista de patrones de búsqueda que el sistema recorre hasta encontrar el primer campo coincidente.

Homologación geográfica. Cada registro es geolocalizado mediante el sistema de tres niveles descrito en el marco metodológico: geometría GeoJSON, coordenadas explícitas o resolución por nombre. Una vez ubicado, se asigna al departamento correspondiente mediante los polígonos de `geo-boundaries.js`. Los registros que no pueden ubicarse no se descartan silenciosamente: su ausencia es lo que produce los mensajes "Sin suficientes registros" en el dashboard cuando un departamento no tiene registros geolocalizados de una fuente específica.

Diferencia de escalas. Los datos DANE son indicadores agregados a nivel departamental; los registros de las APIs son individuales (por persona, vacante o certificación). GeoPly los usa de formas distintas: los indicadores DANE alimentan directamente las variables 1 a 5, mientras que los registros individuales de las APIs se analizan como conjuntos para construir las variables 6 a 14. No se mezclan en el mismo cálculo.

---

## 6. Consumo mediante las APIs

### SODA API — datos.gov.co

Los siete datasets de datos.gov.co se consultan mediante solicitudes HTTP GET al endpoint estándar de la SODA API:

```
https://www.datos.gov.co/resource/{id}.json?$limit=40
```

No se requiere autenticación. El límite de 40 registros por consulta es configurable en el código (`RECORD_LIMIT`) y responde a un equilibrio entre volumen de información y tiempo de respuesta aceptable para una aplicación web interactiva.

Cada solicitud tiene un timeout de 12 segundos. Si el endpoint no responde en ese tiempo o devuelve un error HTTP, el dataset se marca como no disponible y el sistema continúa con los demás sin interrumpirse. La plataforma informa al usuario cuántos datasets lograron cargarse de forma exitosa.

La carga es secuencial y progresiva: los datasets se consultan uno a uno, y cada uno que llega actualiza inmediatamente el mapa y el dashboard sin esperar a los demás. Esto hace que la experiencia del usuario mejore gradualmente durante los primeros segundos de uso.

### Endpoints JSON propios — DANE

Los archivos estadísticos del DANE se publicaron como JSON en un repositorio de GitHub y se consumen mediante el mismo mecanismo de `fetch`. No tienen límite de registros aplicado porque son archivos preprocesados con un tamaño definido. Al igual que la SODA API, incluyen timeout y manejo de error.

Esta decisión fue necesaria porque el DANE publica sus resultados estadísticos principalmente en formato XLSX, no como APIs consultables directamente. El procesamiento previo permite que GeoPly los integre al mismo flujo que el resto de las fuentes sin tratamiento especial.

---

## 7. Calidad y limitaciones de los datos

La documentación de limitaciones no es una advertencia de descargo: es parte del diseño de la plataforma. Cada limitación conocida está declarada explícitamente en la interfaz de usuario.

**Informalidad sin desagregación departamental.** La tasa de informalidad laboral no está disponible como dato oficial por departamento en ninguna de las fuentes consultadas. GeoPly calcula una estimación ajustada por el desempleo relativo de cada región, lo que produce un valor orientativo pero no equivalente a una medición oficial. La tarjeta correspondiente en el dashboard lleva la etiqueta "Estimado" y el texto narrativo describe el método.

**Esquemas heterogéneos entre datasets.** Cada fuente usa sus propias convenciones para nombrar columnas. El sistema de normalización resuelve la mayoría de los casos, pero puede haber campos que no coincidan con ningún patrón de búsqueda definido. Cuando esto ocurre, la variable correspondiente aparece como no disponible para ese departamento, no como cero.

**Cobertura geográfica desigual.** Algunos datasets tienen cobertura nacional efectiva; otros son predominantemente locales (como la agencia de empleo de Bucaramanga). Los departamentos con mayor presencia en los registros de las APIs tendrán variables 6 a 12 más ricas que aquellos con poca cobertura en las fuentes consultadas.

**Cruce sector-departamento no disponible.** No existe en datos.gov.co un dataset que publique de forma estandarizada la distribución de vacantes por sector económico y departamento simultáneamente. GeoPly detecta sectores a partir del campo categórico más frecuente en los registros de cada departamento, lo que produce una aproximación útil pero no equivalente a estadísticas sectoriales oficiales.

**Fuente no trazada.** Uno de los archivos integrados en el proceso de desarrollo no pudo ser atribuido con certeza a una entidad específica. Se integra funcionalmente pero no se documenta con atribución.
---

## 8. Contribución de los datos abiertos al proyecto

GeoPly no habría podido construirse sin el principio de datos abiertos. Cada componente de la plataforma (el mapa, los indicadores, el ranking, las tendencias, la brecha de género) existe porque existe una entidad pública que publicó esa información sin restricciones de acceso ni costo.

Pero el proyecto también argumenta algo más específico: que los datos abiertos solo generan valor completo cuando son integrables. Ninguno de los once datasets descritos en este documento, consultado de forma aislada, produce el análisis territorial que GeoPly ofrece. Es la integración, la geolocalización cruzada, la normalización de esquemas y la combinación de indicadores de distintas fuentes lo que transforma registros individuales en conocimiento territorial accionable.

En ese sentido, GeoPly es también una demostración de las posibilidades y los límites actuales del ecosistema de datos abiertos colombiano. Las posibilidades: once fuentes oficiales accesibles, sin autenticación, con cobertura nacional. Los límites: esquemas heterogéneos, ausencia de algunas variables críticas a escala departamental, y cobertura geográfica desigual entre fuentes.

Documentar esas limitaciones con la misma claridad que los logros es parte del compromiso con la transparencia que los datos abiertos exigen.
