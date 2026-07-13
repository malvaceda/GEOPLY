# Conclusiones — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia  
Concurso: Datos Abiertos de Colombia — Categoría Intermedia 
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes 
Fecha: 12/07/2026


---

## 1. Introducción

GeoPly surgió de una pregunta concreta: ¿es posible construir una herramienta útil para analizar el mercado laboral colombiano usando exclusivamente datos que el Estado ya publica de forma gratuita?

La respuesta que este proyecto ofrece es afirmativa, con matices. Sí es posible. Pero hacerlo requiere más trabajo de integración, normalización y diseño de lo que la disponibilidad técnica de los datos sugiere a primera vista. Este documento recoge lo que ese proceso enseñó: los logros alcanzados, los problemas encontrados, las decisiones que funcionaron y las que tienen margen de mejora.

---

## 2. Principales logros

Integración de 18 fuentes de datos oficiales en una sola plataforma. GeoPly conecta siete datasets consultados directamente vía SODA API desde datos.gov.co y once archivos estadísticos del DANE procesados como endpoints JSON propios. Que estas fuentes convivan en un mismo sistema sin requerir descarga manual ni conocimiento técnico por parte del usuario fue el objetivo arquitectónico central del proyecto, y fue alcanzado.

Cálculo de 15 indicadores territoriales por departamento. El motor de indicadores en `indicators.js` calcula, para cada uno de los 33 departamentos de Colombia, variables que van desde tasas directas del DANE hasta indicadores compuestos como el Índice de Oportunidad Laboral, el cociente de localización por sector y el GeoPly Score. Cada variable tiene su fuente documentada, su método descrito y, cuando corresponde, una advertencia explícita sobre su naturaleza estimada.

Visualización geoespacial funcional sobre datos abiertos. El mapa de Colombia con departamentos coloreados según su nivel de oportunidad laboral, capas de calor y panel de detalle interactivo es el resultado más visible del proyecto. Está construido íntegramente con Leaflet.js y OpenStreetMap, dos tecnologías de código abierto, sobre datos que provienen exclusivamente de fuentes oficiales.

Normalización geográfica automática con tres niveles de precisión. El sistema de geolocalización implementado en `geo-data.js` resuelve uno de los problemas más prácticos del trabajo con datos abiertos colombianos: que cada dataset publica la información geográfica de una forma distinta. La solución fue buscar primero geometrías GeoJSON, luego coordenadas explícitas, luego nombres de municipio o departamento, y funcionó para la mayoría de los registros sin intervención manual.

Degradación elegante ante fallas de datos. La plataforma fue diseñada para que ninguna falla de red o ausencia de campo produzca un error visible para el usuario. Los datasets que no cargan quedan registrados como no disponibles; los campos no encontrados producen mensajes informativos en lugar de valores vacíos; el registro de aspirantes cae a modo offline si el servidor no responde. Esta robustez operativa fue una decisión de diseño deliberada, no un añadido posterior.

---

## 3. Aprendizajes obtenidos

La heterogeneidad de los datos abiertos es el problema más subestimado. Antes de iniciar el desarrollo, el equipo anticipaba que la integración de múltiples datasets sería compleja. Lo que no se anticipó fue el grado de variación en nombres de columnas, esquemas de geolocalización y formatos de valores entre fuentes publicadas por el mismo portal. El sistema de detección dinámica de campos y la normalización de texto fueron respuestas a este descubrimiento, no parte del diseño original.

La disponibilidad técnica de un dato no equivale a su usabilidad. Que un dataset esté publicado en datos.gov.co y sea accesible vía API no significa que sus campos sean interpretables, que su cobertura sea representativa ni que su esquema sea estable. La exploración de cada fuente con `fletch_empleo_data.py` antes de integrarla fue una práctica que ahorró tiempo y evitó suposiciones incorrectas sobre el contenido de los datos.

Declarar las limitaciones fortalece el proyecto. La decisión de marcar explícitamente `informalidadEstimada` como un valor aproximado, de mostrar "Sin suficientes registros" cuando los datos no alcanzan para calcular una variable, y de documentar que el cruce sector-departamento no existe como dato oficial, generó una documentación más sólida que si esas limitaciones hubieran sido ocultadas o minimizadas. Un sistema que sabe lo que no sabe es más confiable que uno que siempre devuelve un número.

La arquitectura sin servidor intermediario simplificó el desarrollo y la verificabilidad. Calcular todos los indicadores en el navegador del usuario, consultando las APIs directamente desde el frontend, eliminó la necesidad de un pipeline de datos, sincronización periódica y gestión de caché en servidor. Esto también hizo al sistema más transparente: cualquier usuario puede abrir las herramientas de desarrollo del navegador y ver exactamente qué datos se consultaron y cómo se procesaron.

CRISP-ML como marco de trabajo, no como protocolo de cumplimiento. Aplicar las fases de la metodología como una guía para las decisiones de desarrollo, no como una lista de entregables, permitió que cada componente técnico pudiera trazarse hasta una necesidad identificada. Las fases no se siguieron en secuencia estricta; en varios momentos el equipo regresó a fases anteriores al encontrar limitaciones en los datos. Esa iteración es parte del proceso, no una desviación.

El desafío técnico más significativo fue el aprendizaje en tiempo real. El equipo se inscribió en la categoría intermedia del concurso con conocimientos base en programación web, pero varias de las tecnologías y técnicas que GeoPly termina usando, como la integración de mapas interactivos con Leaflet, la geolocalización automática de registros, el cálculo de indicadores compuestos o el consumo de APIs públicas desde el frontend, no eran parte del repertorio inicial. Cada uno de esos componentes requirió investigar, probar, fallar y ajustar. Lo que hoy es el sistema de normalización geográfica en tres niveles o el motor de detección dinámica de campos fue, en su momento, un problema sin solución obvia. Que el proyecto haya podido completarse con esa curva de aprendizaje activa dice tanto sobre el proceso como sobre el resultado.

---

## 4. Limitaciones del proyecto

Dependencia de la disponibilidad y actualización de las fuentes. GeoPly no controla la calidad ni la frecuencia de actualización de los datos que consume. Si datos.gov.co no está disponible, las variables 6 a 12 del dashboard no pueden calcularse. Si el DANE actualiza sus archivos con una estructura diferente, los endpoints JSON propios quedarán desactualizados hasta que el equipo los regenere. Esta es una limitación estructural de cualquier sistema construido sobre fuentes externas.

Cobertura geográfica desigual entre datasets. Los datasets de la SODA API tienen coberturas muy distintas: algunos son nacionales, otros corresponden principalmente a una ciudad o región. Los departamentos con menor presencia en los registros de las APIs (especialmente los del sur y el oriente del país) tendrán variables 6 a 10 con menos datos o directamente vacías. El mapa muestra todos los departamentos, pero el nivel de detalle del análisis varía significativamente entre ellos.

Informalidad sin dato oficial por departamento. La variable más relevante para caracterizar la calidad del empleo (la tasa de informalidad) no está disponible como dato oficial a escala departamental en ninguna de las fuentes consultadas. La estimación calculada por GeoPly es metodológicamente razonable pero no equivalente a una medición directa. Esto es una limitación del ecosistema de datos abiertos, no solo del proyecto.

El GeoPly Score como indicador relativo, no absoluto. El score compuesto que resume las 15 variables en un número de 0 a 100 facilita la comparación entre departamentos, pero no tiene un referente externo de validación. Un departamento con score 70 no es necesariamente un mercado laboral "bueno" en términos absolutos; es el más favorable dentro del conjunto de los 32. Esta distinción está explicada en la documentación pero puede perderse en el uso casual de la plataforma.

Ausencia de datos longitudinales continuos. Más allá del dato histórico de 2018 incorporado en `td_2018`, GeoPly no tiene acceso a series de tiempo continuas por departamento. Las tendencias que el sistema identifica son puntuales, no progresivas, lo que limita el análisis de estacionalidad o cambios recientes dentro del período actual.

---

## 5. Trabajo futuro

Actualización automática de los archivos DANE. El proceso actual de convertir los XLSX del DANE a endpoints JSON es manual. Automatizarlo mediante un script de actualización periódica (similar en concepto a `fletch_empleo_data.py`) reduciría el mantenimiento requerido y garantizaría que los indicadores base reflejen las publicaciones más recientes.

Ampliación de la cobertura a nivel municipal. La arquitectura actual soporta visualización a nivel comunas para Medellín y a nivel departamental para el resto del país. Extender el análisis al nivel municipal requeriría fuentes con esa desagregación y ampliar el diccionario geográfico de `geo-data.js`. Algunos de los datasets actuales ya contienen campos de municipio que podrían aprovecharse para este fin sin cambios estructurales mayores.

Incorporación de más fuentes del SENA y del SPE. El Sistema Público de Empleo publica datos de intermediación laboral con cobertura más amplia que los datasets actualmente integrados. Agregarlos mejoraría la representatividad de las variables de sectores y brecha de género, que hoy dependen de fuentes con cobertura geográfica concentrada.

Mejora del indicador de informalidad. Si el DANE publica en el futuro estimaciones de informalidad por departamento (algo que ya ocurre para 23 ciudades en el módulo EISS) ese dato debería reemplazar la estimación actual. El sistema está diseñado para que ese reemplazo sea directo: basta con añadir el campo al objeto de cada departamento en `departamentos-data.js`.

Perfil de usuario y orientación laboral personalizada. El servidor Express actual incluye endpoints para registro de aspirantes y cálculo de compatibilidad con vacantes que no están completamente integrados en la interfaz actual. Desarrollar esa funcionalidad conectaría el análisis territorial con una herramienta de orientación individual, extendiendo el valor de la plataforma hacia usuarios en búsqueda activa de empleo.

---

## 6. Reflexión final

GeoPly demuestra que los datos abiertos del Estado colombiano tienen un valor que va más allá de su disponibilidad técnica. Once fuentes oficiales, consultadas sin costo, sin autenticación y sin acuerdos especiales, fueron suficientes para construir una herramienta que permite comparar oportunidades laborales entre los 32 departamentos del país, identificar sectores con concentración emergente, analizar tendencias históricas y visualizar todo eso sobre un mapa interactivo.

Pero el proyecto también evidencia que ese valor no es automático. Requiere trabajo de integración, decisiones de diseño sobre cómo tratar la heterogeneidad y las ausencias, y honestidad sobre los límites de lo que los datos permiten afirmar. Un sistema que declara sus estimaciones como estimaciones, que muestra "sin datos" cuando no los tiene y que permite al usuario verificar sus fuentes directamente, es más útil a largo plazo que uno que siempre devuelve una cifra precisa.

El ecosistema de datos abiertos colombiano tiene fortalezas reales: cobertura territorial, acceso sin barreras técnicas, publicación sostenida por entidades como el DANE, el SENA y el Ministerio del Trabajo. También tiene brechas: esquemas inconsistentes entre fuentes, ausencia de algunos indicadores críticos a nivel subnacional y falta de estandarización en nombres de campos. Documentar ambas dimensiones desde la práctica del desarrollo es, en sí mismo, un aporte al ecosistema.

GeoPly es un punto de partida, no un producto terminado. Pero es un punto de partida construido sobre evidencia real, con métodos trazables y con una arquitectura que permite crecer. Eso es lo que los datos abiertos hacen posible cuando se les da el espacio para ser realmente utilizados.
