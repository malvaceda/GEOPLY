# Guion de Pitch — GeoPly
### Concurso Datos al Ecosistema 2026 – IA para Colombia · Categoría Intermedio · Reto Economía y Empleo
**Duración total: 10 minutos**

| Bloque | Responsable | Duración |
| 1. Apertura y problema | Tomás | 2:00 |
| 2. Datos abiertos y fuentes | Sarita | 3:00 |
| 3. Solución y demo | Jesús y Tomás | 3:00 |
| 4. Cierre e impacto | Juan David | 2:00 |

---

## BLOQUE 1 — TOMÁS (0:00 – 2:00)

**[Diapositiva 1: pantalla en negro o mapa de Colombia difuminado, sin texto]**

**TOMÁS:**
Antes de decir una sola palabra sobre nuestro proyecto, quiero hacerles una pregunta.

Si hoy tuvieran que mudarse a otro departamento de Colombia por trabajo... ¿sabrían decirme, con datos, si allá es más fácil o más difícil conseguir empleo que donde están ahora?

*(pausa breve)*

La mayoría de nosotros no podría responder eso con seguridad. Y no es porque la información no exista. Existe. Está publicada, gratis, en datos.gov.co. La tasa de desempleo nacional ronda el 8.94%, pero esa cifra esconde una geografía muy distinta: en Nariño está cerca del 5.96%, mientras que en Chocó, La Guajira y Norte de Santander supera el 11%. Son casi el doble de oportunidades entre un departamento y otro.

**[Diapositiva 2: título "GeoPly — Inteligencia Territorial para el Mercado Laboral"]**

Ese dato está ahí. Pero para llegar a él, alguien tendría que saber qué dataset buscar entre decenas disponibles, descargarlo, cruzarlo con otros, y entender columnas como `td`, `to` o `tgp` sin ningún contexto que le diga si eso es bueno o malo. Esa distancia entre el dato publicado y el ciudadano que lo necesita es el problema que nos propusimos resolver.

Nosotros somos el equipo detrás de GeoPly, una plataforma que toma la información abierta del mercado laboral colombiano y la convierte en algo que cualquier persona puede mirar, entender y comparar: un mapa interactivo de Colombia, departamento por departamento, construido enteramente sobre fuentes oficiales.

No inventamos datos. No hacemos predicciones. Tomamos lo que el Estado ya publica y lo hacemos legible.

Y para que entiendan por qué confiamos en lo que este mapa muestra, le paso la palabra a Sarita, que les va a contar exactamente de dónde sale cada número que van a ver.

---

## BLOQUE 2 — SARITA (2:00 – 5:00)

**[Diapositiva 3: logos/entidades — DANE, SENA, Ministerio del Trabajo, MinEducación, DAFP]**

**SARITA:**
Quiero que quede claro desde el inicio: GeoPly no genera ni un solo dato propio. Todo lo que van a ver — el mapa, los indicadores, el score — se construye sobre información publicada por entidades oficiales del Estado colombiano.

Integramos **18 fuentes de datos abiertos**, divididas en dos grupos. Siete las consultamos en tiempo real mediante la API SODA de datos.gov.co: datos del Ministerio del Trabajo, del SENA, de MinEducación, del DAFP y de agencias públicas de empleo. Las otras once son archivos estadísticos Y ESTÁTICOS del DANE —de la Gran Encuesta Integrada de Hogares— que procesamos y publicamos como servicios propios para que la plataforma los consuma igual que a las demás.

**[Mostrar fuentes oficiales]**

No elegimos estas fuentes al azar. Aplicamos cuatro criterios: que tuvieran relación directa con el mercado laboral, que su cobertura territorial aportara algo real, que sus registros se pudieran ubicar geográficamente, y que cada fuente complementara a las demás en lugar de repetir la misma información. El SENA nos habla de formación. El DANE nos da las tasas oficiales de desempleo, ocupación y participación. Las agencias de empleo nos muestran colocación real. El DAFP aporta la estructura del empleo público. Juntas, cuentan una historia que ninguna cuenta sola.

Aquí está el punto que más nos importa transmitirles: **todo es verificable**. No hay autenticación, no hay costo, no hay acuerdos especiales. Cualquier persona en este jurado podría abrir datos.gov.co ahora mismo y consultar exactamente los mismos datasets que alimentan a GeoPly. Y cuando esas entidades actualicen su información, GeoPly la refleja en la siguiente carga, sin que nosotros tengamos que intervenir manualmente.

Ahora bien, publicar datos no es lo mismo que poder usarlos. Nos encontramos con que cada fuente nombra sus columnas distinto —municipio, ciudad, `nom_mpio`— y ubica sus registros de forma distinta: unas con coordenadas, otras con geometrías, otras solo con el nombre del municipio en texto libre. La parte de analítica de GeoPly resuelve justamente eso: detecta automáticamente los campos relevantes en cada fuente y normaliza la ubicación geográfica en varios niveles de precisión, para que un registro de cualquiera de las 18 fuentes termine, sin intervención manual, en el lugar correcto del mapa.

Esa es la inteligencia detrás de GeoPly: no está en inventar información, está en integrar, limpiar y ubicar correctamente información que ya es oficial.

---

## BLOQUE 3 — JESÚS Y TOMÁS (5:00 – 8:00)

**[Diapositiva 4: esquema simple — "Fuentes oficiales → Navegador del usuario → Mapa y dashboard"]**

**JESÚS:**
Algo que queremos destacar de entrada: GeoPly no tiene un servidor intermedio procesando estos datos. Cuando alguien abre la plataforma, su propio navegador consulta directamente a datos.gov.co y a los servicios del DANE, y ahí mismo, en tiempo real, calcula todo.

**TOMÁS:**
¿Y por qué es importante eso? Porque significa que lo que ven en pantalla no pasó por ningún filtro nuestro. Cualquiera puede abrir las herramientas de desarrollador del navegador y ver exactamente qué se consultó y cómo se procesó. Es una plataforma auditable por diseño.

**[Mostrar mapa]**

**JESÚS:**
Este es el mapa de Colombia. Cada uno de los 33 departamentos está clasificado según su **GeoPly Score**, un indicador de 0 a 100 que resume la oportunidad laboral relativa de esa región. Mientras cargan los datos, el mapa se va actualizando progresivamente: no hay que esperar a que las 18 fuentes respondan para empezar a ver resultados.

**[Seleccionar un departamento]**

**TOMÁS:**
Al seleccionar un departamento aparece un panel con sus métricas base del DANE: desempleo, ocupación, participación, subocupación. Y desde ahí se puede entrar al análisis completo.

**[Abrir Panel de Empleo]**

**JESÚS:**
Este es el Panel de Empleo. Aquí calculamos **15 indicadores** para el departamento seleccionado: desde tasas directas del DANE hasta indicadores compuestos, como el Índice de Oportunidad Laboral o el cociente de sectores emergentes. Cada tarjeta tiene un botón de "Explicar este gráfico" que traduce el número a lenguaje no técnico, para que no haga falta ser economista para entenderlo.

**[Mostrar GeoPly Score]**

**TOMÁS:**
El GeoPly Score integra siete dimensiones con pesos explícitos: oportunidad laboral, crecimiento del empleo entre 2018 y 2025, informalidad estimada, sectores emergentes, competitividad territorial, nivel educativo e inserción juvenil. No es una caja negra: cada peso está documentado y cada variable tiene su fuente identificada.

**JESÚS:**
Y quiero que noten algo: cuando una fuente no responde, o un dato no está disponible para cierto departamento, GeoPly no lo oculta ni inventa un número. Muestra explícitamente que ese dato no está disponible. Preferimos ser honestos sobre lo que no sabemos, a mostrar una cifra que no podemos sostener.

**TOMÁS:**
Eso es GeoPly funcionando: una interfaz simple, sobre una arquitectura que conecta 18 fuentes oficiales, las normaliza, las cruza y las convierte en algo que se entiende de un vistazo.

---

## BLOQUE 4 — JUAN DAVID (8:00 – 10:00)

**[Diapositiva 5: "GeoPly — Resultados y camino a seguir"]**

**JUAN DAVID:**
Voy a cerrar con lo que este proyecto realmente logró, y también con lo que todavía no logra, porque creemos que ambas cosas son igual de importantes de decir en voz alta.

Lo que construimos: una plataforma que integra 18 fuentes de datos oficiales, calcula 15 indicadores territoriales para cada uno de los 33 departamentos de Colombia, y los presenta sobre un mapa interactivo, sin que el usuario necesite descargar un solo archivo ni tener conocimientos técnicos. Eso no existía antes en un solo lugar.

Lo más innovador no es una tecnología aislada, es la integración: normalizar automáticamente la geografía de 18 fuentes con esquemas distintos, y hacerlo todo en el navegador del usuario, sin depender de un servidor que sincronice datos. Eso hace que la plataforma sea liviana, barata de mantener y, sobre todo, verificable.

¿Para quién es útil esto? Para el ciudadano que busca empleo y quiere entender dónde hay más oportunidad. Para el emprendedor que evalúa dónde abrir un negocio. Para investigadores y periodistas que necesitan explorar el mercado laboral sin procesar datos crudos. Y para funcionarios públicos que necesitan contextualizar rápido un análisis regional.

Ahora, con la misma honestidad con la que construimos GeoPly, les decimos qué le falta. La tasa de informalidad no existe como dato oficial por departamento en ninguna fuente pública actual, así que la que mostramos es una estimación, y la marcamos como tal. La cobertura de nuestras fuentes no es pareja: algunos departamentos, especialmente del sur y el oriente, tienen menos registros que otros. Y el GeoPly Score es un indicador relativo, útil para comparar entre departamentos, no una medición absoluta de qué tan "bueno" es un mercado laboral.

Lo que viene: automatizar la actualización de los datos del DANE, ampliar el análisis a nivel municipal, incorporar más fuentes del SENA y del Servicio Público de Empleo, y mejorar la estimación de informalidad el día que el DANE la publique oficialmente por departamento. La arquitectura ya está lista para crecer sin rediseñarse.

**[Diapositiva final: mapa de Colombia con los 33 departamentos coloreados, logo GeoPly]**

Para cerrar, quiero dejarles una idea. Colombia no tiene un problema de falta de datos abiertos. Tiene un problema de distancia entre esos datos y las personas que podrían usarlos. Nosotros no llenamos esa distancia con predicciones ni con promesas. La llenamos con algo más simple: hicimos que 18 fuentes oficiales, que ya existían, finalmente se pudieran ver.

Los datos abiertos no necesitan que los reemplacemos. **Necesitan que alguien, por fin, los ponga en un mapa.**

Gracias.

**[Fin del pitch — 10:00]**

---

### Notas de producción

- Los tiempos son aproximados; se recomienda un ensayo cronometrado completo antes de la sustentación, ya que las transiciones y la demo en vivo son las partes con mayor riesgo de extenderse.
- Las indicaciones entre corchetes (`[Mostrar mapa]`, `[Seleccionar un departamento]`, etc.) son momentos de demo en vivo sobre la plataforma real, no capturas de pantalla en las diapositivas.
- El guion evita llamar "inteligencia artificial" o "modelos predictivos" a la analítica de GeoPly, porque el proyecto no entrena modelos ni hace predicciones (esto está documentado explícitamente en el marco metodológico). Si un jurado pregunta directamente por el componente de IA, la respuesta honesta es que GeoPly usa procesamiento y normalización automática de datos —detección de campos, geolocalización en tres niveles, cálculo de indicadores compuestos— no aprendizaje automático.
