# Guía de Usuario — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia  
Concurso: Datos Abiertos de Colombia — Categoría Intermedia  
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes  
Fecha: 12/07/2026

---

## 1. Introducción

Este documento describe, paso a paso, cómo se navega y se utiliza GeoPly desde la perspectiva de un usuario final. Su propósito es servir como referencia funcional de la plataforma: qué encuentra el usuario al abrirla, qué significa cada elemento visual y cómo se conectan entre sí el mapa, el panel de empleo, los paneles de educación y el registro de perfil. Esta guía se limita a describir la experiencia de uso tal como ocurre en pantalla.

---

## 2. Pantalla de bienvenida

Al abrir la aplicación, GeoPly presenta una tarjeta de bienvenida con el mensaje *"tu guía para encontrar oportunidades y prepararte para el futuro"*. Desde esta tarjeta el usuario tiene dos rutas de entrada:

- **Explorar mapa** — lleva directamente a la visualización geoespacial de Colombia.
- **Mi cuenta** — para usuarios que ya registraron su perfil o desean hacerlo.

Esta tarjeta reaparece cada vez que el usuario regresa a la pantalla principal, ya sea desde el mapa o desde el panel de empleo, y funciona como punto de partida constante de la navegación.

---

## 3. El mapa interactivo

### 3.1 Identificación de departamentos

Al seleccionar "Explorar mapa", el mapa de Colombia aparece en el centro de la pantalla con cada departamento dibujado en un color distinto, lo que permite identificarlos fácilmente unos de otros. GeoPly representa **33 departamentos**: aunque Colombia tiene 32 departamentos administrativos, la plataforma cuenta Bogotá D.C. como una entidad separada de Cundinamarca, de ahí la diferencia.

Al pasar el cursor o hacer clic sobre un departamento, se despliega un resumen breve con su nombre, su **Geoplay Score** y su tasa de desempleo (tasa de desocupación) regional.

### 3.2 Leyenda y Geoplay Score

En el panel izquierdo del mapa se muestra la leyenda, que indica el nivel de oportunidad de cada departamento según su Geoplay Score:

- 🟢 **Alta oportunidad** — score ≥ 70
- 🟡 **Oportunidad media** — score entre 45 y 69
- 🔴 **Baja oportunidad** — score < 45

El color de cada departamento en el mapa corresponde a esta clasificación, de modo que el usuario puede identificar visualmente las zonas de mayor dinamismo laboral sin necesidad de abrir ningún panel adicional. El mapa cuenta además con controles de zoom y un botón central, ubicado arriba a la derecha, que permite volver a la vista completa de Colombia en cualquier momento.

### 3.3 Tutorial de uso del mapa

Un botón en la parte superior del mapa abre un tutorial breve compuesto por dos pasos:

1. **Identificar cada departamento.** Explica que cada departamento tiene un color propio y que basta con pasar el cursor o hacer clic sobre él para ver su Geoplay Score, junto con la equivalencia de colores de la leyenda (verde, amarillo, rojo).
2. **Cómo funciona GeoPly.** Explica que, mediante clic o mediante la búsqueda por nombre con el ícono de lupa en la parte superior, se abre un panel con las tasas clave del DANE (desempleo, ocupación, participación, subocupación y población total), y que desde ese panel se puede profundizar en el **Panel de Empleo** para consultar las variables completas del modelo.

Al terminar el tutorial, el botón "Entendido" regresa al usuario al mapa.

---

## 4. Selección de un departamento

Al hacer clic sobre cualquier departamento, el panel derecho de la pantalla muestra:

- El nombre del departamento.
- El Geoplay Score, junto con su clasificación (baja, media o alta oportunidad).
- Las tasas oficiales del DANE para esa zona, con un resumen breve en lenguaje sencillo.
- Un botón **"Ver las 15 variables"** que lleva directamente al Panel de Empleo de ese departamento.

El mismo Panel de Empleo puede abrirse desde el botón dedicado ubicado en la parte superior del mapa, junto al botón del tutorial, sin necesidad de seleccionar primero un departamento en el mapa.

---

## 5. Panel de Empleo

El Panel de Empleo es la vista analítica de GeoPly. En su parte superior se muestra un resumen del departamento seleccionado con el Geoplay Score, el Índice de Oportunidad Laboral, el ranking de competitividad respecto a los demás departamentos y los registros de API asignados a esa zona.

Debajo del resumen, el panel despliega **15 variables** numeradas, cada una acompañada de un botón **"Explicar este gráfico"** que despliega un texto en lenguaje sencillo sobre el contenido de la gráfica correspondiente. El orden de las variables es el siguiente:

| # | Variable |
|---|---|
| 1 | Índice de Oportunidad Laboral |
| 2–3 | Tasas laborales del DANE |
| 4 | Tasa de informalidad estimada |
| 5 | Tasa de crecimiento del empleo (2018–2025) |
| 6 | Sectores con mayor demanda |
| 7 | Sectores emergentes |
| 8 | Nivel educativo predominante |
| 9 | Inserción laboral juvenil |
| 10 | Brecha laboral por sexo |
| 11 | Disponibilidad del talento |
| 12 | Dinámica empresarial |
| 13 | Competitividad territorial (ranking de todos los departamentos) |
| 14 | Tendencia regional de empleo (2018–actualidad) |
| 15 | Geoplay Score (resumen general) |

Cuando una variable no cuenta con suficiente información en las fuentes oficiales, el panel no muestra un dato vacío ni un error: informa explícitamente al usuario. Si existen registros parciales pero insuficientes, el mensaje indica que no hay suficientes registros localizados en Colombia para esa variable; si no existe ningún dato relacionado, el panel indica que no hay información disponible para calcular ese indicador en ese departamento.

Al final del panel se incluye un enlace directo al **Servicio Público de Empleo**, por si el usuario desea buscar vacantes reales en un sector específico por su cuenta. Además, desde el resumen del Geoplay Score el usuario puede visualizar las fuentes y páginas oficiales que alimentaron el modelo, para investigar por su cuenta y comparar la información.

### 5.1 Búsqueda de un sector específico

Al final del Panel de Empleo aparece un bloque de ayuda que orienta al usuario cuando busca información de un sector económico puntual que la plataforma no puede calcular por falta de dato oficial cruzado (sector × departamento). En ese caso, GeoPly informa que esa combinación no se publica como dato abierto y remite al usuario al Servicio Público de Empleo para filtrar vacantes reales por departamento y por sector.

### 5.2 Salir del Panel de Empleo

Existen dos formas de salir del Panel de Empleo: el botón "Volver al mapa" o el botón "GeoPly" ubicado en la esquina superior izquierda, que regresa a la tarjeta de bienvenida. También es posible, sin salir del panel, buscar directamente otro departamento o zona de interés desde la misma vista.

---

## 6. Paneles de educación y preparación

Además del mapa y del Panel de Empleo, la pantalla principal incluye tres paneles orientados a la formación del usuario:

**Habilidades que no pueden faltar.** Una guía de competencias clave para el futuro laboral: comunicación efectiva, análisis de datos, trabajo en equipo, liderazgo, aprendizaje continuo y uso de inteligencia artificial. Cada habilidad incluye recursos externos (YouTube, LinkedIn, Coursera u otras herramientas) para desarrollarla.

**Trabajos del presente y del futuro.** Describe sectores de alto crecimiento —inteligencia artificial, tecnología, salud digital, ciberseguridad, automatización, ciencia de datos, desarrollo de software, logística inteligente, entre otros— con una explicación de qué hace un profesional en cada rama, qué herramientas se usan y su nivel de empleabilidad. Para el momento actual, la plataforma indica de forma general que existen universidades tecnológicas y centros de formación en Colombia, sin recomendar una institución específica.

**Guía de aprendizaje.** Microcursos, proyectos y rutas de estudio pensadas para jóvenes y recién egresados. Incluye una ruta de aprendizaje recomendada —organizada de lo básico a lo avanzado—, temas sugeridos y recursos externos como canales de YouTube, cursos de Microsoft y libros.

---

## 7. Panel de Empresas

Junto al botón del Panel de Empleo, en la parte superior del mapa, se encuentra el botón **Empresas**. Este panel permite al usuario descubrir organizaciones con vacantes disponibles en el momento, entre ellas Bancolombia, Grupo Éxito, Alpina, Sura y Rappi. Cada organización incluye un enlace externo donde el usuario puede ampliar la información y consultar las vacantes.

---

## 8. Cuenta de usuario y formulario de perfil

El botón para visualizar la cuenta está disponible tanto en la tarjeta de bienvenida como en la barra superior del mapa. Desde ahí, el usuario puede registrar su perfil mediante un formulario de interés laboral con los siguientes campos:

- Datos personales: nombre, apellidos, edad, ciudad, departamento, correo y teléfono.
- Formación: nivel educativo, institución (colegio, universidad o técnico/tecnólogo), carrera, semestre y cursos realizados.
- Perfil profesional: experiencia, área de interés, habilidades, idiomas y disponibilidad.

Al final del formulario, el usuario encuentra una sección de autorización de tratamiento de datos, en la que puede seleccionar de forma independiente si autoriza:

1. El tratamiento general de sus datos personales.
2. Que su información sea compartida con empresas interesadas en contratarlo.
3. El uso de su perfil para mostrarle oportunidades educativas.
4. Ser contactado sobre programas técnicos y tecnológicos.

Cada autorización es opcional e independiente de las demás.

---

## 9. Flujo general de navegación

En síntesis, la navegación de GeoPly sigue un recorrido simple e intuitivo:

```
Tarjeta de bienvenida
     │
     ├─→ Explorar mapa ──→ Seleccionar departamento ──→ Panel de Empleo (15 variables)
     │                                                         │
     │                                                         ├─→ Buscar otro departamento
     │                                                         └─→ Volver al mapa / a GeoPly
     │
     └─→ Iniciar sesión / Editar cuenta ──→ Formulario de perfil
```

Desde cualquier punto del mapa o del Panel de Empleo, el botón "GeoPly" en la esquina superior izquierda regresa siempre a la tarjeta de bienvenida, desde donde el recorrido puede repetirse.

---

## 10. Conclusión

La experiencia de uso de GeoPly fue diseñada para que un usuario sin conocimientos técnicos pueda pasar, en pocos clics, de una pregunta general ¿dónde hay oportunidades laborales en Colombia? a una respuesta territorial concreta, respaldada por datos oficiales y explicada en lenguaje sencillo. El mapa ofrece la vista panorámica; el Panel de Empleo, la profundidad analítica; y los paneles de educación y el formulario de perfil, una vía de acción concreta para que esa información se traduzca en una decisión real.