# Planteamiento del Problema — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia  
Concurso: Datos Abiertos de Colombia — Categoría Intermedia  
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes  
Fecha: 9/07/2026

---

## 1. Introducción

El acceso a la información pública es una condición necesaria para la participación ciudadana informada, la investigación independiente y la formulación de políticas basadas en evidencia. En Colombia, el Estado ha avanzado significativamente en la apertura de datos a través del portal [datos.gov.co](https://datos.gov.co), donde hoy se encuentran disponibles cientos de conjuntos de datos sobre mercado laboral, empleo, sectores económicos, formación profesional y dinámica empresarial.

Sin embargo, la existencia de datos abiertos no equivale automáticamente a su aprovechamiento. Entre la disponibilidad técnica de un dataset y la capacidad de un ciudadano común para extraer conclusiones útiles de él existe una brecha significativa. Esta brecha no es un problema de voluntad ni de alfabetización básica; es consecuencia de la forma en que los datos están estructurados, dispersos y presentados.

GeoPly nació como respuesta a esa brecha. Su propósito no es sustituir los estudios técnicos del DANE, el SENA o el Ministerio del Trabajo, sino actuar como una capa de acceso que permita a distintos tipos de usuarios (ciudadanos, emprendedores, investigadores, funcionarios) explorar el mercado laboral colombiano de forma visual, territorial y comprensible, a partir exclusivamente de datos públicos ya existentes.

Este documento desarrolla el planteamiento del problema que motiva el proyecto, sus implicaciones para la ciudadanía y su conexión con el reto de Economía y Empleo del concurso.

---

## 2. Contexto del problema

Colombia enfrenta desafíos estructurales en su mercado laboral que han sido documentados ampliamente. La tasa de informalidad laboral supera el 54% a nivel nacional. La tasa de desocupación reciente se ubica alrededor del 8.94%, con variaciones importantes entre departamentos: mientras Nariño registra tasas cercanas al 5.96%, departamentos como Chocó, La Guajira y Norte de Santander superan el 11%. La brecha de género en el desempleo es persistente, y el acceso a oportunidades laborales formales sigue concentrándose geográficamente en las grandes ciudades.

Estos datos existen. Están publicados. Son accesibles... en teoría. El problema no está en su ausencia sino en lo que ocurre cuando alguien intenta usarlos. Un ciudadano que quiere entender el mercado laboral de su departamento debe identificar cuál de los decenas de datasets disponibles es relevante, descargar archivos en formatos técnicos, cruzar información de múltiples fuentes con esquemas heterogéneos, y finalmente interpretar columnas con nombres como `tgp`, `td`, `to` o `ts` sin ningún contexto visual que facilite la comprensión.

Este proceso requiere tiempo, herramientas técnicas y conocimientos que la mayoría de las personas interesadas en la información no poseen. El resultado es que datos de alto valor público permanecen infrautilizados, y las decisiones que podrían basarse en ellos, como dónde buscar empleo, en qué sector formarse, qué regiones muestran mayor dinámica laboral, terminan tomándose a partir de intuición, rumor o información incompleta.

---

## 3. Descripción del problema

El problema central que aborda GeoPly puede formularse de la siguiente manera:

> Los datos abiertos sobre el mercado laboral colombiano están dispersos en múltiples fuentes, estructurados en formatos técnicos no fácilmente interpretables por usuarios no especializados, y carecen de una representación territorial integrada que permita comprender las diferencias y oportunidades entre regiones.

Esta formulación descompone el problema en tres dimensiones:

### 3.1 Dispersión de fuentes

La información relevante sobre empleo en Colombia no habita en un único dataset. La oferta de vacantes, los indicadores de desocupación, la demanda laboral por sector, los perfiles ocupacionales, las estadísticas de formación para el empleo y los registros de empresas son conjuntos de datos separados, publicados por entidades distintas, con periodicidades diferentes y sin un esquema de integración explícito entre ellos.

Un análisis mínimamente completo del mercado laboral de un departamento requeriría cruzar varias de estas fuentes, operación que ningún portal público facilita actualmente de forma automática.

### 3.2 Inaccesibilidad técnica

Incluso cuando el dato existe y está disponible, su forma de presentación supone una barrera. Los datasets de datos.gov.co se distribuyen principalmente como archivos CSV o mediante API con formato JSON. Sus columnas usan abreviaciones o nombres técnicos sin etiquetas descriptivas. No incluyen visualizaciones embebidas ni contexto comparativo que permita al usuario interpretar un valor de forma significativa. ¿Una tasa de desocupación del 10.47% en Córdoba es alta o baja comparada con sus departamentos vecinos? ¿Mejor o peor que el año anterior? Responder esas preguntas exige trabajo adicional que los datos por sí solos no resuelven.

### 3.3 Ausencia de dimensión territorial integrada

El mercado laboral colombiano tiene una geografía. Las oportunidades laborales no se distribuyen uniformemente en el territorio; varían según la densidad poblacional, la conectividad, la presencia industrial, el nivel educativo de la fuerza de trabajo y docenas de otras variables. Sin embargo, los datasets disponibles rara vez incorporan esta dimensión territorial de forma integrada. Un ciudadano que quiere comparar oportunidades entre su municipio de residencia y uno cercano no tiene actualmente una herramienta pública que le permita hacer esa comparación de forma visual y directa.

---

## 4. Justificación

Abordar este problema tiene relevancia en al menos tres planos.

En el plano ciudadano, la dificultad para interpretar datos laborales limita la capacidad de las personas para tomar decisiones informadas sobre su vida económica: dónde buscar trabajo, hacia qué sectores orientar su formación, si conviene migrar a otro municipio o departamento.

En el plano de la investigación y la política pública, la falta de herramientas de visualización integrada hace que el análisis territorial del mercado laboral demande recursos técnicos que no todas las instituciones poseen. Entidades municipales, organizaciones de base y centros de investigación regionales podrían beneficiarse de una herramienta que consolide y contextualice la información disponible sin requerir infraestructura analítica propia.

En el plano de los datos abiertos, existe un principio fundamental en el ecosistema de gobierno abierto: que la apertura de datos solo genera valor cuando va acompañada de herramientas que hagan esos datos accesibles y comprensibles. GeoPly propone justamente esa capa de acceso: no genera datos nuevos, sino que extrae valor de los datos que ya existen y están publicados.

---

## 5. Población objetivo

GeoPly está diseñado para ser útil a cuatro grupos principales, con necesidades distintas pero convergentes:

Ciudadanos en búsqueda activa de empleo: personas que necesitan entender qué sectores y regiones tienen mayor actividad laboral para orientar su búsqueda de manera más estratégica. No requieren análisis econométrico: necesitan una imagen clara y comparable del panorama.

Emprendedores y pequeños empresarios: personas que están evaluando dónde establecer un negocio o en qué sector invertir. El Índice de Oportunidad de GeoPly les permite comparar territorios según variables relevantes para su decisión sin necesitar contratar una consultoría de mercado.

Investigadores, estudiantes y periodistas: usuarios que trabajan con datos laborales y necesitan herramientas de exploración territorial que reduzcan el tiempo de procesamiento y les permitan identificar patrones o anomalías con mayor rapidez.

Funcionarios y tomadores de decisión en entidades públicas regionales: alcaldías, secretarías de desarrollo económico y entidades de promoción del empleo que podrían usar una herramienta de este tipo para contextualizar sus propios análisis o comunicar información a la ciudadanía de manera más accesible.

Estos grupos no son mutuamente excluyentes. Lo que los une es la necesidad de acceder a información laboral territorial de forma visual, integrada y comprensible, sin depender de conocimientos técnicos avanzados.

---

## 6. Objetivo general

Desarrollar una plataforma web de visualización geoespacial que integre múltiples conjuntos de datos abiertos del mercado laboral colombiano para facilitar la interpretación territorial de indicadores de empleo, apoyar la toma de decisiones de ciudadanos, investigadores, emprendedores y entidades públicas, y demostrar el valor práctico de los datos abiertos cuando se acompañan de herramientas accesibles de análisis y visualización.

---

## 7. Objetivos específicos

1. Integrar al menos diez conjuntos de datos abiertos de datos.gov.co relacionados con empleo, vacantes, sectores económicos, formación laboral e indicadores territoriales, mediante consulta directa a la SODA API sin requerir descarga ni procesamiento manual por parte del usuario.

2. Normalizar geográficamente los registros de cada dataset para ubicarlos en el territorio colombiano mediante coordenadas explícitas, resolución de nombres de departamento, o aproximación por nivel administrativo, garantizando su representación en el mapa interactivo.

3. Calcular un Índice de Oportunidad Laboral compuesto, de escala 0 a 100, que integre variables territoriales como dinámica de crecimiento poblacional, densidad comercial, conectividad, indicadores de seguridad y actividad socioeconómica, y que pueda ajustarse según el sector de interés del usuario.

4. Garantizar la accesibilidad de la plataforma para usuarios sin conocimientos técnicos, mediante una interfaz web sin instalación requerida, lenguaje no especializado en las etiquetas y análisis interpretados en lenguaje natural.

---

## 8. Alcance del proyecto

GeoPly es una herramienta de apoyo a la interpretación de datos públicos. Su alcance está deliberadamente delimitado para mantener la solidez de sus afirmaciones:

Está dentro del alcance:
- Visualizar y comparar indicadores laborales disponibles en datos.gov.co a escala departamental y municipal.
- Calcular un índice compuesto de oportunidad que facilite la comparación relativa entre territorios.
- Geolocalizar registros de los datasets consultados y representarlos en el mapa.
- Ofrecer análisis contextual por zona basado en los datos disponibles.
- Filtrar la visualización por tipo de sector económico o actividad.

Está fuera del alcance:
- Predecir tendencias futuras del mercado laboral con modelos estadísticos o de machine learning.
- Reemplazar estudios técnicos del DANE, el SENA o el Ministerio del Trabajo.
- Garantizar la completitud o exactitud de los datos de origen, que dependen de las fuentes publicadas.
- Ofrecer asesoría laboral personalizada ni orientación vocacional individual.

Esta delimitación no es una limitación del proyecto sino una condición de su rigor. Un sistema que promete más de lo que puede demostrar no sirve a sus usuarios; uno que cumple exactamente lo que describe, sí.

---

## 9. Relación del problema con los Datos Abiertos

El problema que aborda GeoPly es, en parte, un problema de los propios datos abiertos: no basta con publicar información para que esa información sea útil. La utilidad de los datos abiertos depende de la existencia de herramientas que los traduzcan en conocimiento accesible.

Desde esta perspectiva, GeoPly no es solo un proyecto que usa datos abiertos; es un proyecto que argumenta, mediante su funcionamiento, que los datos abiertos de datos.gov.co tienen un valor latente que aún no se ha explotado completamente. Cada visualización en GeoPly está construida sobre información pública ya disponible: ningún dato fue generado ni estimado sin respaldo en una fuente oficial.

Los once datasets integrados fueron seleccionados porque, en conjunto, ofrecen una descripción multidimensional del mercado laboral: la oferta de vacantes, la demanda empresarial, los perfiles de quienes buscan empleo, los sectores con mayor crecimiento, las estadísticas de formación y los indicadores agregados por departamento. Individualmente, cada uno responde una pregunta parcial. Integrados en una misma plataforma, permiten una lectura territorial que ninguno habilita por separado.

Esta integración es precisamente lo que los principios de datos abiertos buscan habilitar: que la reutilización cruzada de información pública genere valor mayor que la suma de sus partes.

---

## 10. Relación del problema con el reto Economía y Empleo

El reto seleccionado propone construir tableros inteligentes que identifiquen tendencias de empleo y sectores emergentes, con impacto esperado en la orientación de políticas de empleo y formación profesional.

GeoPly responde a este reto desde tres ángulos:

Tablero territorial: El mapa interactivo con capas de oportunidad laboral constituye en sí mismo un tablero que permite leer el mercado laboral colombiano en su dimensión geográfica, identificando rápidamente qué departamentos concentran mayor actividad y cuáles muestran señales de atraso o dinamismo emergente.

Identificación de tendencias: El Índice de Oportunidad integra variables de crecimiento poblacional proyectado y densidad comercial actual, lo que permite identificar territorios que están en proceso de expansión antes de que esa expansión se consolide.

Orientación de decisiones: Aunque GeoPly no formula políticas públicas directamente, ofrece a sus usuarios una lectura integrada del mercado laboral que puede informar decisiones sobre focalización de programas de formación, priorización de regiones para intervención y comunicación de oportunidades a la ciudadanía.

La conexión con los datos sugeridos por el reto también es directa: la plataforma integra estadísticas laborales (indicadores del mercado laboral, tasas de desocupación), registros relacionados con la actividad empresarial y datos de formación para el empleo, todos provenientes de fuentes públicas.

---

## 11. Conclusión

El problema que motiva GeoPly no es la falta de datos sobre el mercado laboral colombiano. Es la distancia entre esos datos y las personas que podrían beneficiarse de ellos.

Esa distancia tiene causas concretas: dispersión de fuentes, formatos técnicos, ausencia de contexto territorial y falta de herramientas de acceso diseñadas para usuarios no especializados. GeoPly propone reducir esa distancia mediante una plataforma que integra, normaliza, calcula y visualiza información laboral pública sobre el territorio colombiano.

El alcance del proyecto es deliberadamente acotado: no predice, no reemplaza estudios oficiales, no genera datos que no existan. Lo que hace es construir, sobre los datos que ya están disponibles, una capa de acceso que los vuelve comprensibles, comparables y accionables para una audiencia mucho más amplia que la que hoy puede aprovecharlos.

Este planteamiento establece la base sobre la cual se desarrollarán las fases siguientes del proceso CRISP-ML: la comprensión profunda de los datos disponibles, su preparación y normalización, el desarrollo de la solución técnica, su evaluación y la identificación de su impacto esperado.
