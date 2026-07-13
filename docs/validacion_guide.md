# Guía de Validación — GeoPly

Proyecto: GeoPly — Inteligencia Territorial para el Mercado Laboral en Colombia
Concurso: Datos Abiertos de Colombia — Categoría Intermedia
Reto: Economía y Empleo — Tableros inteligentes para tendencias de empleo y sectores emergentes
Fecha: 12/07/2026

---

## 1. Introducción

Esta guía describe el proceso completo de instalación, ejecución y validación de GeoPly. Está dirigida a cualquier evaluador técnico que necesite reproducir el proyecto de forma independiente, sin requerir apoyo del equipo desarrollador, y comprobar que sus funcionalidades principales —mapa interactivo, cálculo de indicadores, Panel de Empleo y consumo de datos abiertos— operan correctamente.

La guía no repite el contenido de la arquitectura ni del marco metodológico del proyecto; se limita a los pasos verificables de instalación, ejecución y comprobación funcional.

---

## 2. Requisitos previos

* Sistema operativo Windows (instrucciones probadas sobre Windows; el proyecto es multiplataforma en tanto se cuente con Node.js y Git).
* [Git](https://git-scm.com/downloads) instalado.
* [Node.js](https://nodejs.org/) en su versión LTS (incluye npm).
* Acceso a Internet, ya que la aplicación consulta datasets en vivo mediante la SODA API de datos.gov.co.
* Un navegador web actualizado (Chrome, Edge o Firefox).

Verificación de la instalación de los requisitos:

```bash
git --version
node --version
npm --version
```

Los tres comandos deben devolver un número de versión. Si alguno falla, revisar la sección 8 (Solución de problemas).

---

## 3. Instalación

**Paso 1 — Clonar el repositorio**

```bash
git clone https://github.com/malvaceda/GEOPLY.git
```

**Paso 2 — Entrar a la carpeta del proyecto**

```bash
cd GEOPLY
```

**Paso 3 — Instalar dependencias**

```bash
npm install
```

Este comando descarga todas las librerías y dependencias declaradas en el proyecto.

No se requiere configuración adicional de variables de entorno para levantar la aplicación de forma local: el flujo documentado por el equipo consiste únicamente en clonar, instalar e iniciar.

---

## 4. Ejecución

**Iniciar la aplicación**

```bash
npm start
```

La terminal debe mostrar un mensaje similar a:

```
Servidor corriendo en http://localhost:3000
```

**Acceder a la aplicación**

Abrir el navegador en:

```
http://localhost:3000
```

Al cargar, GeoPly consulta de forma secuencial los datasets de la SODA API (datos.gov.co) y va actualizando el mapa y el dashboard de forma progresiva a medida que cada dataset responde, sin necesidad de esperar a que todos terminen.

**Actualizar el código (opcional, para evaluadores que quieran sincronizar cambios)**

```bash
git pull
```

---

## 5. Validación funcional

Lista de comprobaciones generales que debe cumplir la aplicación al abrirse por primera vez:

- [ ] La aplicación inicia correctamente y responde en `http://localhost:3000`.
- [ ] Aparece la tarjeta de bienvenida con el texto "tu guía para encontrar oportunidades y prepararte para el futuro" y los botones **Explorar mapa** y **Mi cuenta**.
- [ ] Al presionar **Explorar mapa**, la tarjeta desaparece y se muestra el mapa de Colombia.
- [ ] El mapa muestra los 33 departamentos (32 departamentos administrativos + Bogotá D.C. como entidad separada de Cundinamarca), cada uno en un color distinto.
- [ ] Al pasar el cursor o hacer clic sobre cualquier departamento —incluyendo San Andrés y Providencia— aparece un resumen con su nombre, su GeoPly Score y su tasa de desocupación, junto con su clasificación (alta / media / baja oportunidad).
- [ ] Al seleccionar un departamento, el panel derecho muestra su información y el botón **"Ver las 15 variables"**.
- [ ] El Panel de Empleo abre correctamente y despliega las 15 variables, cada una con su botón "Explicar este gráfico".
- [ ] El botón **Empresas**, ubicado junto al botón del Panel de Empleo, abre el panel de organizaciones con vacantes.
- [ ] No aparecen errores de JavaScript en la consola del navegador durante la navegación descrita.

---

## 6. Validación de datos

GeoPly no genera ni estima datos sin respaldo en una fuente oficial (según lo documentado en el marco metodológico del proyecto), por lo que la validación de datos consiste en comprobar la trazabilidad de cada indicador hacia su fuente:

* **Consulta a la SODA API.** La aplicación consulta once datasets de datos.gov.co mediante la SODA API. Se puede comprobar que la carga es real observando que el mapa y el dashboard se actualizan progresivamente a medida que cada dataset responde (no todo aparece de forma instantánea).
* **Registros de API asignados por zona.** En el resumen de cada departamento, dentro del Panel de Empleo, aparece la cantidad de "registros de API" asignados a esa zona. Este número varía por departamento (por ejemplo, Meta reporta 3 registros y San Andrés y Providencia reporta 0), lo cual es consistente con una consulta real a fuentes externas y no con un valor fijo o simulado.
* **Verificación de fuentes.** Al hacer clic sobre el indicador de registros de API asignados, se despliega una ventana con enlaces directos a las fuentes oficiales que alimentan el modelo: datos.gov.co (portal principal), DANE - Datos Abiertos, conjuntos sobre empleo, y el Servicio Público de Empleo. El evaluador puede seguir estos enlaces para contrastar la información directamente contra la fuente.
* **Comparación con datos.gov.co.** Las tasas laborales (desempleo, ocupación, participación global, subocupación) que aparecen para cada departamento pueden contrastarse contra los conjuntos de datos DANE/GEIH publicados en datos.gov.co para el mismo departamento y periodo.
* **Datos incompletos declarados explícitamente.** Cuando una variable no tiene suficiente información en las fuentes oficiales, GeoPly no muestra un dato vacío ni simulado: indica explícitamente que no hay suficientes registros localizados para esa variable, o que no hay información disponible para calcularla en ese departamento. Esta transparencia puede verificarse en variables como "Sectores emergentes" o "Inserción laboral juvenil" en departamentos con cobertura de datos limitada.

---

## 7. Casos de prueba

### 7.1 Flujo general

| Caso | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir la aplicación por primera vez | Aparece la tarjeta de bienvenida de GeoPly con los botones "Explorar mapa" y "Mi cuenta" |
| 2 | Presionar "Explorar mapa" | La tarjeta desaparece y se muestra el mapa de Colombia con los 33 departamentos en colores distintos |
| 3 | Pasar el cursor sobre un departamento (incluido San Andrés y Providencia) | Aparece un resumen con nombre, GeoPly Score, tasa de desocupación y clasificación de oportunidad |
| 4 | Seleccionar un departamento | Se abre el panel derecho con el resumen del departamento y el botón "Ver las 15 variables" |
| 5 | Presionar "Ver las 15 variables" | Se abre el Panel de Empleo con las 15 variables del departamento seleccionado |
| 6 | Buscar otro departamento desde el Panel de Empleo | El dashboard se actualiza sin necesidad de volver primero al mapa |
| 7 | Presionar "Volver al mapa" o el botón "GeoPly" | Se regresa al mapa o a la tarjeta de bienvenida, respectivamente |
| 8 | Presionar el botón "Empresas" | Se muestra el panel con organizaciones (Bancolombia, Grupo Éxito, Sura, Rappi, entre otras) con enlaces a sus vacantes |

### 7.2 Caso de prueba detallado — Departamento del Meta

| Elemento verificado | Valor esperado |
|---|---|
| GeoPly Score | 69.9 / 100 — Oportunidad media |
| Tasa de desocupación (2025) | 8.74 % |
| Tasa de ocupación (2025) | 58.81 % |
| Tasa global de participación (2025) | 64.45 % |
| Tasa de subocupación (2025) | 5.79 % |
| Índice de Oportunidad Laboral | 64.2 / 100 — Oportunidad media |
| Ranking de competitividad territorial | 8 de 33 |
| Registros de API asignados | 3 |
| Tasa de informalidad estimada | 53.5 % (etiquetada como "Estimado") |
| Crecimiento del empleo 2018–2025 | 2.94 pp |
| Sectores con mayor demanda | Administración Pública (100 %), Comercio Al Por Mayor Y Al Por Menor (33.3 %) |
| Sectores emergentes | Administración Pública (LQ 3.24), Comercio Al Por Mayor Y Al Por Menor (LQ 1.6) |
| Nivel educativo predominante | Secundaria (2), Primaria (1) |
| Inserción laboral juvenil | Sin dato |
| Brecha laboral por sexo | "Campo de sexo o género no identificado en las fuentes actuales" |
| Disponibilidad del talento | 0.6 |
| Dinámica empresarial | 3 perfiles ocupacionales |
| Tendencia regional de empleo 2018–2025 | Meta aparece después de Quindío (4.45 pp), Antioquia (4.04 pp), Huila (3.75 pp) y Tolima (3.2 pp), con 2.94 pp |

Resultado esperado general: todos los valores anteriores coinciden entre el panel derecho del mapa y el Panel de Empleo, y el botón "Buscar en la fuente oficial" del bloque inferior del Panel de Empleo redirige correctamente al Servicio Público de Empleo.

### 7.3 Caso de prueba detallado — San Andrés y Providencia

| Elemento verificado | Valor esperado |
|---|---|
| GeoPly Score | 52.8 / 100 — Oportunidad media |
| Tasa de desocupación (2025) | 8.6 % |
| Tasa de ocupación (2025) | 60.2 % |
| Tasa global de participación (2025) | 65.7 % |
| Tasa de subocupación (2025) | 6.4 % |
| Índice de Oportunidad Laboral | 66 / 100 — Oportunidad media |
| Ranking de competitividad territorial | 5 de 33 (por debajo de Bogotá D.C. y por encima de Guaviare) |
| Registros de API asignados | 0 |
| Tasa de informalidad estimada | 53.2 % |
| Crecimiento del empleo 2018–2025 | 0.3 pp |
| Sectores con mayor demanda | "Sin suficientes registros geolocalizados en San Andrés y Providencia para esta variable" |
| Sectores emergentes | "Sin suficientes registros geolocalizados en San Andrés y Providencia para esta variable" |
| Nivel educativo predominante | "Campo no identificado en las fuentes actuales" |
| Inserción laboral juvenil | Sin dato |
| Brecha laboral por sexo | "Campo de sexo o género no identificado en las fuentes actuales" |
| Disponibilidad del talento | 0 |
| Dinámica empresarial | Sin registro |
| Tendencia regional de empleo 2018–2025 | San Andrés y Providencia no aparece en el top (que incluye Quindío, Antioquia, Huila, Tolima, Meta, Cauca y César) |

Resultado esperado general: aunque San Andrés y Providencia tiene 0 registros de API asignados, el departamento sigue siendo completamente funcional en el mapa y en el Panel de Empleo, y las variables sin datos suficientes se comunican de forma explícita en vez de mostrarse vacías o como error.

---

## 8. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `git`, `node` o `npm` no reconocidos en la terminal | Instalación incompleta o terminal abierta antes de instalar | Reinstalar la herramienta correspondiente y abrir una nueva terminal |
| Error de dependencias al ejecutar `npm install` | Versión de Node.js incompatible o instalación interrumpida | Verificar que se está usando la versión LTS de Node.js y volver a ejecutar `npm install` |
| El puerto 3000 está ocupado | Otra aplicación o instancia previa de GeoPly sigue corriendo | Cerrar el proceso que usa el puerto 3000 o detener la instancia previa antes de ejecutar `npm start` |
| Un dataset no carga o el dashboard muestra menos información de la esperada | La SODA API está temporalmente no disponible o el dataset está fuera de servicio | Es un comportamiento esperado: GeoPly no genera datos falsos ante un dataset caído; el sistema continúa funcionando con los datasets que sí respondieron. Reintentar más tarde o verificar el estado del dataset directamente en datos.gov.co |
| El mapa no carga o aparece en blanco | Falta de conexión a Internet, ya que el mapa y los datos dependen de servicios externos | Verificar la conexión a Internet y recargar la página |
| No aparece ningún departamento resaltado con datos | Problema de conectividad hacia la SODA API | Revisar la consola del navegador para identificar el dataset que falló y confirmar si el servicio externo está disponible |

---

## 9. Criterios de aceptación

GeoPly se considera funcionando correctamente cuando se cumplen simultáneamente los siguientes criterios:

1. La aplicación se instala y se ejecuta siguiendo únicamente los comandos documentados en la sección 3 y 4, sin pasos adicionales no declarados.
2. El mapa muestra los 33 departamentos de Colombia, cada uno navegable y con su información desplegable al pasar el cursor o hacer clic.
3. El Panel de Empleo despliega las 15 variables para cualquier departamento seleccionado, incluyendo aquellos con cobertura de datos limitada (como San Andrés y Providencia).
4. Los valores mostrados (GeoPly Score, Índice de Oportunidad Laboral, tasas DANE) son consistentes entre el panel del mapa y el Panel de Empleo para un mismo departamento.
5. Cuando una variable no cuenta con datos suficientes, la aplicación lo declara explícitamente en vez de mostrar un valor vacío, inventado o un error de interfaz.
6. Los enlaces a fuentes oficiales (datos.gov.co, DANE, Servicio Público de Empleo) y a las organizaciones del panel Empresas redirigen correctamente.
7. No se observan errores de JavaScript en la consola durante el flujo de navegación descrito en la sección 5.

---

## 10. Conclusión

Esta guía permite a un evaluador técnico instalar, ejecutar y validar GeoPly de forma independiente, utilizando únicamente los comandos, rutas y comportamientos documentados a partir del proyecto real. Su seguimiento completo garantiza la reproducibilidad del proyecto y facilita su evaluación técnica dentro del concurso Datos Abiertos de Colombia.
