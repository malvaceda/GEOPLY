# Diccionario de Datos — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia  
Concurso: Datos Abiertos de Colombia — Categoría Intermedia 
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes 
Fecha: 11/07/2026

---

## 1. Introducción

Este diccionario documenta todas las variables que GeoPly utiliza para calcular indicadores, colorear el mapa y construir el dashboard territorial. Está generado directamente desde `indicators.js` y `departamentos-data.js`: cada nombre de variable corresponde al campo real en el código fuente.

Su utilidad dentro del proyecto es doble. Para quien evalúa la plataforma, permite verificar que cada número que aparece en pantalla tiene una fuente y un método trazables. Para quien quiera extender o replicar GeoPly, indica exactamente qué campos deben estar presentes para que cada indicador se calcule correctamente.

El diccionario está dividido en tres niveles: **variables de entrada** (datos tal como llegan de las fuentes), **variables de los registros API** (campos detectados dinámicamente en los datasets) y **variables derivadas** (calculadas por GeoPly a partir de las anteriores).

---

## 2. Convenciones

|     Columna     | Significado |
|     Variable    | Nombre exacto del campo en el código fuente de GeoPly |
|   Descripción   | Qué representa el valor |
|       Tipo      | `Number` (numérico), `String` (texto), `Object` (estructura), `Boolean` |
|      Unidad     | Unidad de medida o escala del valor |
|     Fuente      | Dataset o archivo de origen |
|       Uso       | Variable o indicador que alimenta |

Las variables marcadas con ⚠️ en observaciones son estimadas o aproximadas; su valor no corresponde a un dato oficial publicado directamente por la entidad responsable.

---

## 3. Variables de entrada — Datos DANE por departamento

Estas variables están almacenadas en `DEPARTAMENTOS_EMPLEO` dentro de `departamentos-data.js`. Corresponden a los indicadores del DANE/GEIH procesados por el equipo.

### 3.1 Identificadores y geolocalización

| Variable | Descripción | Tipo | Unidad | Fuente |
| `id` | Identificador secuencial del departamento | Number | Entero | Interno |
| `nombre` | Nombre oficial del departamento | String | — | DANE |
| `lat` | Latitud del centroide departamental | Number | Grados decimales | Interno |
| `lng` | Longitud del centroide departamental | Number | Grados decimales | Interno |

### 3.2 Indicadores laborales DANE/GEIH

| Variable | Descripción | Tipo | Unidad | Fuente | Uso en GeoPly |
| `td` | Tasa de Desempleo 2025 | Number | Porcentaje (%) | DANE — GEIH GEIHMLD | Vars. 1, 2, 4, 5, 15 |
| `to` | Tasa de Ocupación 2025 | Number | Porcentaje (%) | DANE — GEIH GEIHMLD | Vars. 1, 3, 15 |
| `tgp` | Tasa Global de Participación 2025 | Number | Porcentaje (%) | DANE — GEIH GEIHMLD | Var. 1 |
| `ts` | Tasa de Subocupación 2025 | Number | Porcentaje (%) | DANE — GEIH GEIHMLD | Var. 1 |
| `td_2018` | Tasa de Desempleo 2018 | Number | Porcentaje (%) | DANE — GEIH histórico | Vars. 5, 14 |

### 3.3 Población

| Variable | Descripción | Tipo | Unidad | Fuente | Uso en GeoPly |
| `pob_total` | Población total del departamento | Number | Miles de personas | DANE | Contextual |
| `pob_ocupada` | Población ocupada | Number | Miles de personas | DANE — GEIH | Var. 11 |
| `pob_desocupada` | Población desocupada | Number | Miles de personas | DANE — GEIH | Contextual |

---

## 4. Variables de entrada — Indicadores nacionales

Estas variables están en el objeto `NATIONAL_TRENDS` dentro de `departamentos-data.js` y provienen de los módulos nacionales del GEIH.

| Variable | Descripción | Tipo | Unidad | Fuente | Uso en GeoPly |
| `tasa_informalidad_nacional` | Informalidad laboral nacional | Number | Porcentaje (%) | DANE — GEIH EISS | Var. 4 (base de estimación) |
| `poblacion_ocupada_nacional_miles` | Total de ocupados en el país | Number | Miles de personas | DANE — GEIH | Dashboard nacional |
| `poblacion_formal_miles` | Ocupados en empleo formal | Number | Miles de personas | DANE — GEIH EISS | Dashboard nacional |
| `poblacion_informal_miles` | Ocupados en empleo informal | Number | Miles de personas | DANE — GEIH EISS | Dashboard nacional |
| `tasa_desocupacion_nacional_reciente` | Tasa de desocupación nacional reciente | Number | Porcentaje (%) | DANE — GEIH | Dashboard nacional |
| `ocupados_educ_universitaria_2010_miles` | Ocupados con educación universitaria en 2010 | Number | Miles de personas | DANE — GEIH módulo educación | Dashboard tendencias |
| `ocupados_educ_universitaria_2024_miles` | Ocupados con educación universitaria en 2024 | Number | Miles de personas | DANE — GEIH módulo educación | Dashboard tendencias |
| `crecimiento_ocupados_universitarios_pct` | Crecimiento de ocupados universitarios 2010–2024 | Number | Porcentaje (%) | DANE — GEIH módulo educación | Dashboard tendencias |
| `td_hombres_bogota` | Tasa de desempleo masculino en Bogotá | Number | Porcentaje (%) | DANE — GEIH GEIHMLS | Var. 10 (contexto) |
| `td_mujeres_bogota` | Tasa de desempleo femenino en Bogotá | Number | Porcentaje (%) | DANE — GEIH GEIHMLS | Var. 10 (contexto) |
| `brecha_genero_desocupacion_bogota_pp` | Diferencia en puntos porcentuales entre td_mujeres y td_hombres en Bogotá | Number | Puntos porcentuales | DANE — GEIH GEIHMLS | Var. 10 (contexto) |

---

## 5. Variables detectadas dinámicamente desde las APIs

Estas variables no tienen nombre fijo: GeoPly las busca mediante patrones en los nombres de columna de cada dataset. Si el campo no se encuentra, la variable correspondiente queda como `null` y el dashboard muestra el mensaje informativo.

| Campo buscado | Patrones de detección | Datasets donde puede aparecer | Uso en GeoPly |
| Nivel educativo | `nivel_educ`, `niveleduc`, `escolarid`, `educacion` | `2v94-3ypi`, `8pqf-rmzr`, `28vu-5tx7`, DANE educación | Var. 8 |
| Edad o rango etario | `edad`, `rango_edad`, `grupo_edad` | `yix6-7yeh`, `8pqf-rmzr`, `tgvn-r2n9` | Var. 9 |
| Sexo o género | `sexo`, `genero` | `8pqf-rmzr`, `tgvn-r2n9`, DANE sexo | Var. 10 |
| Sector o categoría principal | Campo categórico con 2–15 valores distintos, excluidos municipio/ciudad/departamento | Todos los datasets | Vars. 6, 7 |

El campo de sector o categoría se detecta automáticamente mediante `detectCategoricalField`: el sistema identifica la columna de texto con mayor frecuencia de aparición y cardinalidad entre 2 y 15 valores, sin necesitar su nombre exacto.

---

## 6. Variables derivadas

Estas variables son calculadas por GeoPly en `indicators.js` a partir de las variables de entrada. Ninguna proviene directamente de una fuente; todas tienen un método de cálculo documentado.

| Variable interna | Título en el dashboard | Cómo se obtiene | Variables utilizadas |
| `idxOportunidad` | 1. Índice de Oportunidad Laboral | Suma ponderada de TO (35%), TD invertida (30%), TGP (20%), TS invertida (15%), normalizadas en escala 0–100 | `to`, `td`, `tgp`, `ts` |
| `tasaDesempleo` | 2. Tasa de Desempleo | Valor directo del DANE, sin transformación | `td` |
| `tasaOcupacion` | 3. Tasa de Ocupación | Valor directo del DANE, sin transformación | `to` |
| `informalidadEstimada` ⚠️ | 4. Tasa de Informalidad (estimada) | Informalidad nacional ajustada por la desviación del departamento respecto al promedio nacional de TD | `tasa_informalidad_nacional`, `td`, promedio de `td` de los 33 departamentos |
| `crecimientoEmpleo` | 5. Crecimiento del Empleo 2018→2025 | Diferencia `td_2018 − td` en puntos porcentuales. Positivo = mejoró (bajó desempleo). Clasificado como mejora / estable / deterioro según umbral de ±0.3 pp | `td`, `td_2018` |
| `sectoresDemanda` | 6. Sectores con Mayor Demanda | Top 6 de valores del campo categórico detectado, ordenados por frecuencia, con porcentaje sobre el total de registros locales | Campo categórico detectado en registros API del departamento |
| `sectoresEmergentes` | 7. Sectores Emergentes | Cociente de localización (LQ): proporción local del sector / proporción nacional. Umbral LQ > 1.15 para considerarlo emergente. Top 4 | Campo categórico detectado + conteo nacional agregado |
| `nivelEducativo` | 8. Nivel Educativo Predominante | Valor más frecuente del campo de nivel educativo detectado en los registros del departamento | Campo educativo detectado en registros API |
| `insercionJuvenil` | 9. Inserción Laboral Juvenil | Porcentaje de registros cuyo campo de edad corresponde a 15–28 años o contiene la palabra "joven" | Campo etario detectado en registros API |
| `brechaGenero` | 10. Brecha Laboral por Sexo | Conteo de registros por valor del campo de sexo (hombre/mujer), expresado como porcentaje sobre el total con dato de sexo | Campo de sexo detectado en registros API |
| `disponibilidadTalento` | 11. Disponibilidad de Talento | (Total de registros API del departamento / población ocupada en miles) × 100. Medida de visibilidad de la oferta en fuentes abiertas | `items.length`, `pob_ocupada` |
| `dinamicaEmpresarial` | 12. Dinámica Empresarial | Total de registros API geolocalizados en el departamento y su distribución por dataset de origen | Todos los registros API asignados al departamento |
| `competitividad` | 13. Competitividad Territorial | Puesto del departamento en el ranking nacional ordenado por `idxOportunidad` (1 = mayor oportunidad, 33 = menor) | `idxOportunidad` de los 33 departamentos |
| `tendenciaRegional` | 14. Tendencia Regional del Empleo | Mismo valor que `crecimientoEmpleo`; presentado en el dashboard bajo una tarjeta distinta con enfoque regional | `td`, `td_2018` |
| `geoplyScore` | 15. GeoPly Score | Score compuesto ponderado de siete dimensiones normalizadas en escala 0–100 (ver tabla siguiente) | Variables 1–9, 11, 13 |

### Ponderaciones del GeoPly Score

| Dimensión | Variable fuente | Peso |
| Índice de Oportunidad Laboral | `idxOportunidad` | 25% |
| Crecimiento del empleo 2018→2025 | `crecimientoEmpleo.variacionPP` normalizado en [−3, 5] | 20% |
| Informalidad estimada | `informalidadEstimada` invertida, normalizada en [25, 80] | 15% |
| Sectores emergentes | LQ del sector emergente principal, normalizado en [1, 2.5] | 15% |
| Competitividad territorial | Posición en ranking invertida | 10% |
| Nivel educativo detectado | 65 si detectado, 50 si ausente | 10% |
| Inserción laboral juvenil | `insercionJuvenil.pct` limitado a [0, 100] | 5% |

---

## 7. Relación entre variables e indicadores del dashboard

| Indicador (dashboard) | Variables de entrada | Variables derivadas | Observable en |
| Índice de Oportunidad | `to`, `td`, `tgp`, `ts` | `idxOportunidad` | Color del departamento en el mapa + tarjeta 1 |
| Tasa de Desempleo | `td` | `tasaDesempleo` | Panel lateral + tarjeta 2 |
| Tasa de Ocupación | `to` | `tasaOcupacion` | Panel lateral + tarjeta 3 |
| Informalidad | `tasa_informalidad_nacional`, `td` | `informalidadEstimada` ⚠️ | Tarjeta 4 |
| Evolución 2018→2025 | `td`, `td_2018` | `crecimientoEmpleo` | Tarjeta 5 y 14 |
| Sectores demandados | Campo categórico APIs | `sectoresDemanda` | Tarjeta 6 |
| Sectores emergentes | Campo categórico + LQ nacional | `sectoresEmergentes` | Tarjeta 7 |
| Nivel educativo | Campo educativo APIs | `nivelEducativo` | Tarjeta 8 |
| Juventud laboral | Campo edad APIs | `insercionJuvenil` | Tarjeta 9 |
| Brecha de género | Campo sexo APIs | `brechaGenero` | Tarjeta 10 |
| Disponibilidad de talento | `pob_ocupada` + registros API | `disponibilidadTalento` | Tarjeta 11 |
| Dinámica empresarial | Registros API por dataset | `dinamicaEmpresarial` | Tarjeta 12 |
| Ranking territorial | `idxOportunidad` × 33 deptos | `competitividad` | Tarjeta 13 |
| Tendencia regional | `td`, `td_2018` | `tendenciaRegional` | Tarjeta 14 |
| GeoPly Score | Variables 1–9, 11, 13 | `geoplyScore` | Color del mapa + tarjeta 15 |

---

## 8. Observaciones

⚠️ `informalidadEstimada` no es un dato oficial por departamento. El DANE publica la informalidad a escala nacional y para 23 ciudades principales, pero no para todos los departamentos. GeoPly calcula esta variable ajustando la tasa nacional por la desviación de desempleo de cada departamento. El resultado es orientativo. Tanto la tarjeta del dashboard como su texto narrativo identifican explícitamente este valor como estimado.

Variables 6–10 dependen de la cobertura de los datasets. Si ningún registro de las APIs queda geolocalizado dentro de un departamento, las variables de sectores, nivel educativo, inserción juvenil y brecha de género no pueden calcularse. El dashboard muestra un mensaje informativo en lugar de un valor vacío o cero.

Normalización. Las funciones `normalize(v, lo, hi)` y `clamp(v, lo, hi)` en `indicators.js` mapean cada variable a escala 0–100 usando los rangos mínimo y máximo esperados para el contexto colombiano. Una variable fuera del rango esperado se limita al extremo correspondiente (0 o 100), no produce error.

`td_2018` en departamentos con pocos datos históricos. Algunos departamentos de baja densidad poblacional tienen valores de 2018 estimados con menor precisión estadística que los departamentos grandes. GeoPly usa ese valor directamente sin ajuste adicional.

Detección dinámica de campos. Las variables 6–10 no tienen nombres de columna predefinidos. Si un dataset cambia el nombre de un campo (por ejemplo, de `sexo` a `genero_aspirante`), el sistema seguirá detectándolo si el nuevo nombre contiene alguno de los patrones de búsqueda definidos (`sexo`, `genero`). Si el patrón no coincide, la variable queda como `null`.

`disponibilidadTalento` es una medida relativa, no absoluta.nExpresa cuántos registros de oferta/formación existen en las fuentes abiertas por cada 100 mil personas ocupadas. Departamentos más grandes en términos de población pero con pocos registros en las APIs obtendrán valores bajos aunque tengan mercados laborales dinámicos.
