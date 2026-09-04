# Documentación de cambios: motor de informes por período

## Objetivo

Se corrigió la lógica de generación de informes para que el sistema deje de usar la **fecha de ejecución** como si fuera el **período real del informe**.

Antes:

- `fecha` / `fecha_generacion` se usaba para dos cosas:
  - saber cuándo se ejecutó el proceso
  - inferir a qué mes pertenecía el informe

Eso provocaba errores como:

- ejecutar el proceso el `01/03/2026` para generar febrero y terminar etiquetando el informe como **Marzo 2026**
- generar ventanas móviles de `28 días` en vez de procesar el **mes completo**
- construir nombres de PDF con el mes de ejecución y no con el mes real del informe

---

## Problema original

La lógica antigua hacía esto:

```sql
periodo_fin := p_fecha;
periodo_inicio := periodo_fin - INTERVAL '27 days';
```

Eso no representa un mes calendario.  
Representa una ventana móvil de 28 días.

Ejemplo:

- si el proceso corría el `01/03/2026`
- el rango generado era:
  - inicio: `02/02/2026`
  - fin: `01/03/2026`

Eso mezclaba días de febrero con marzo y además podía etiquetar el informe como marzo aunque la intención fuera generar febrero.

---

## Nuevo criterio funcional

Ahora el sistema separa dos conceptos:

### 1. Fecha de ejecución

Es la fecha real en que se ejecutó el proceso:

- `alumnos_informes.fecha`
- `informes_generales.fecha_generacion`

Estas columnas quedan para:

- auditoría
- trazabilidad
- saber cuándo se procesó realmente

### 2. Período real del informe

Se representa con:

- `periodo_anio`
- `periodo_mes`
- `periodo_inicio`
- `periodo_fin`

Estas columnas son las que ahora deben usarse para:

- identificar el mes real del informe
- construir nombres de período
- evitar duplicados
- buscar pendientes
- cruzar información

---

## Cambios en tablas

### `alumnos_informes`

Se asumió / se trabajó con estas columnas de período:

- `periodo_anio`
- `periodo_mes`
- `periodo_inicio`
- `periodo_fin`

### `informes_generales`

También se trabajó con estas columnas:

- `periodo_anio`
- `periodo_mes`
- `periodo_inicio`
- `periodo_fin`

La idea es:

- `fecha` / `fecha_generacion` = fecha de proceso
- `periodo_*` = mes real del informe

---

## Funciones SQL nuevas por período

Se pasó de una lógica basada en `p_fecha` a una lógica basada en:

- `p_periodo_anio`
- `p_periodo_mes`

### Funciones nuevas / ajustadas por período

- `generar_informes_alumnos_por_periodo`
- `generar_informes_cursos_por_periodo`
- `generar_informes_grados_por_periodo`
- `generar_informes_colegios_por_periodo`
- `ejecutar_generacion_informes_por_colegios_por_periodo`

### Regla de cálculo del período

Las funciones ahora calculan:

```sql
periodo_inicio := make_date(p_periodo_anio, p_periodo_mes, 1);
periodo_fin := (date_trunc('month', periodo_inicio) + interval '1 month - 1 day')::date;
```

Eso asegura:

- febrero = febrero completo
- marzo = marzo completo
- no más ventanas móviles de 28 días

---

## Corrección en consultas pendientes de alumnos

La consulta `consultar_informes_pendientes` tenía lógica vieja:

- construía `periodo` desde `ai.fecha`
- calculaba alertas con `CURRENT_DATE - 27 days`

Eso era incorrecto porque:

- `ai.fecha` ahora representa la fecha de ejecución
- el período real debe salir de `ai.periodo_*`

### Cambio conceptual

Ahora debe usar:

- `ai.periodo_mes`
- `ai.periodo_anio`
- `ai.periodo_inicio`
- `ai.periodo_fin`

Con eso:

- el período visible pasa a ser correcto
- por ejemplo: `Marzo 2026`
- no `Abril 2026` solo porque se ejecutó en abril

---

## Corrección en funciones de connotación predominante

Se detectó que varias funciones seguían filtrando por fecha de ejecución.

### Error detectado

Funciones como estas usaban algo como:

```sql
ai.fecha BETWEEN p_inicio AND p_fin
```

o:

```sql
DATE(ig.fecha_generacion) BETWEEN p_inicio AND p_fin
```

Eso quedó inválido después del rediseño.

### Deben usar ahora

- `periodo_inicio`
- `periodo_fin`

o equivalentemente:

- `periodo_anio`
- `periodo_mes`

### Funciones afectadas

- `obtener_connotacion_predominante_curso`
- `obtener_connotacion_predominante_grado`
- `obtener_connotacion_predominante_colegio`

### Cambio esperado

Ejemplo correcto:

```sql
ai.periodo_inicio = p_inicio
AND ai.periodo_fin = p_fin
```

o:

```sql
ig.periodo_inicio = p_inicio
AND ig.periodo_fin = p_fin
```

---

## Corrección en consultas pendientes de generales

Se revisaron las funciones:

- `consultar_informes_grado_pendientes`
- `consultar_informes_curso_pendientes`
- `consultar_informes_colegio_pendientes`

### Problemas que tenían

- armaban `periodo` desde `fecha_generacion`
- usaban ventanas móviles con `CURRENT_DATE - 27 days`
- en cursos usaban `EXTRACT(YEAR FROM CURRENT_DATE)` para el docente

### Corrección conceptual

Ahora deben usar:

- `ig.periodo_mes`
- `ig.periodo_anio`
- `ig.periodo_inicio`
- `ig.periodo_fin`

Con esto:

- el período del PDF general queda correcto
- el docente se toma del año del período real
- las alertas se calculan contra el mes correcto

---

## Refactor en backend

Se separó la lógica para reducir complejidad ciclomática y dejar el código más legible.

### Archivos nuevos

- `src/infrestructure/server/informes/funciones/motorInformePeriodoTypes.ts`
- `src/infrestructure/server/informes/funciones/motorInformePeriodoRunner.ts`

### Archivo refactorizado

- `src/infrestructure/server/informes/MotorInformeService.ts`

### Qué se movió

La lógica de:

- detección de períodos válidos
- detección de períodos pendientes
- llenado de tablas por período
- concurrencia de alumnos

quedó encapsulada fuera del servicio principal.

---

## Lógica nueva de períodos en backend

### Regla importante

El backend **no inventa períodos**.

No hace:

- “generar todos los meses desde fecha X hasta hoy”

Sí hace:

- buscar meses reales donde existe actividad/datos

### Fuente de verdad

Los períodos válidos se detectan desde datos reales, no desde calendario vacío.

En la implementación actual se usa actividad real de respuestas para descubrir meses candidatos.

### Restricción aplicada

Solo se consideran:

- meses cerrados
- hasta un máximo de **12 meses hacia atrás**

Eso evita:

- generar períodos inexistentes
- reprocesar años completos sin control
- crear basura histórica

---

## Concurrencia para alumnos

Se implementó llenado concurrente de `alumnos_informes`.

### Regla solicitada

Procesar con **6 hilos/workers** simultáneos.

### Cómo quedó

Para cada período pendiente:

- se obtiene la lista de alumnos del colegio
- se disparan workers concurrentes
- cada worker llama la RPC de alumnos con:
  - `offset`
  - `limit = 1`

Eso permite:

- paralelizar la carga base de alumnos
- dejar lista la tabla
- sin tocar todavía el flujo PDF

### Importante

La parte PDF se dejó separada porque estaba inestable y se decidió no rehacerla todavía en paralelo.

---

## Cron

Se trabajó el cron para:

1. ejecutar el llenado de tablas por período
2. luego disparar la fase PDF
3. luego la fase de avisos

También se validó que:

- si el servidor arranca después de la hora del cron, `node-cron` **no ejecuta retroactivamente**
- solo dispara en el próximo match

---

## Hallazgo importante: por qué `informes_generales` quedó vacía

Esta fue la causa más importante detectada.

### Sí existían datos de alumnos por período

Se comprobó que sí se estaban generando `alumnos_informes` para:

- `02/2026`
- `03/2026`

### Pero la mayoría tenía este valor:

```text
No existe suficiente información del periodo para generar el informe.
```

### Distribución observada

Ejemplo real:

- Febrero 2026:
  - 61 con `"No existe suficiente información del periodo para generar el informe."`
  - 1 `POS_AC__5611`
  - 1 `NEG_AC__5621`

- Marzo 2026:
  - 60 con `"No existe suficiente información del periodo para generar el informe."`
  - 1 `NEG_D__5441`
  - 1 `NO_DEFINIDO_MATRIZ.docx`
  - 1 `POS_AP__7602`

### Qué pasaba entonces

Las funciones de connotación predominante:

- `obtener_connotacion_predominante_curso`
- `obtener_connotacion_predominante_grado`
- `obtener_connotacion_predominante_colegio`

excluían:

- `NO_DEFINIDO.docx`
- `NO_DEFINIDO_MATRIZ.docx`

pero **no** excluían este placeholder textual:

```text
No existe suficiente información del periodo para generar el informe.
```

### Consecuencia

Ese texto dominaba el conteo.

Luego la función intentaba mapearlo contra `matriz_informes` usando lógica como:

```sql
mi.codigo_informe LIKE cnd.grupo_calc || '%'
```

Como ese texto no corresponde a un código real de plantilla:

- `mapeo` quedaba vacío
- la función devolvía `NULL`
- no se insertaba nada en `informes_generales`

### Conclusión

El sistema ya estaba calculando períodos bien, pero:

- los placeholders textuales estaban contaminando la lógica de connotación

### Ajuste pendiente/clave

Las funciones de connotación deben excluir también:

```text
No existe suficiente información del periodo para generar el informe.
```

además de:

- `NO_DEFINIDO.docx`
- `NO_DEFINIDO_MATRIZ.docx`

---

## Resultado actual esperado

Después de todas estas correcciones:

- `alumnos_informes` debería llenarse por período real
- `consultar_informes_pendientes` debería mostrar mes correcto
- las funciones generales deberían empezar a llenar `informes_generales` una vez excluido correctamente el placeholder textual
- los PDFs deberían nombrarse con el período real, no con la fecha de ejecución

---

## Archivos backend tocados

### Nuevos

- `src/infrestructure/server/informes/funciones/motorInformePeriodoTypes.ts`
- `src/infrestructure/server/informes/funciones/motorInformePeriodoRunner.ts`

### Refactorizados

- `src/infrestructure/server/informes/MotorInformeService.ts`
- `src/infrestructure/config/cronjobs.ts`

---

## SQL que conviene usar para validar

### Ver cantidad de informes de alumnos por período

```sql
select periodo_anio, periodo_mes, count(*)
from alumnos_informes
group by periodo_anio, periodo_mes
order by periodo_anio, periodo_mes;
```

### Ver distribución de templates de alumnos

```sql
select
  periodo_anio,
  periodo_mes,
  template_informe,
  count(*) as total
from alumnos_informes
where periodo_anio = 2026
  and periodo_mes in (2, 3)
group by periodo_anio, periodo_mes, template_informe
order by periodo_anio, periodo_mes, total desc;
```

### Ver si se llenó generales

```sql
select tipo, periodo_anio, periodo_mes, count(*)
from informes_generales
group by tipo, periodo_anio, periodo_mes
order by periodo_anio, periodo_mes, tipo;
```

### Ver pendientes de alumnos

```sql
select * from consultar_informes_pendientes(0) limit 10;
```

### Ver pendientes de generales

```sql
select * from consultar_informes_grado_pendientes(0) limit 10;
select * from consultar_informes_curso_pendientes(0) limit 10;
select * from consultar_informes_colegio_pendientes() limit 10;
```

---

## Recomendaciones siguientes

1. Ajustar las tres funciones de connotación para excluir también el placeholder textual:

```text
No existe suficiente información del periodo para generar el informe.
```

2. Reprocesar:

- `alumnos_informes`
- `informes_generales`

3. Validar que `informes_generales` ya se inserta por:

- `Curso`
- `Grado`
- `Colegio`

4. Volver a generar PDF y confirmar que:

- el nombre del archivo usa el período correcto
- el contenido del documento muestra el mes correcto

---

## Resumen corto

Se corrigió el motor para que trabaje por **período real mensual**, no por fecha de ejecución ni ventanas de 28 días.  
Se separó la lógica en backend, se implementó concurrencia para alumnos, se limitó el backfill a 12 meses reales y se corrigieron consultas SQL para usar `periodo_anio`, `periodo_mes`, `periodo_inicio` y `periodo_fin`.

El problema restante más importante detectado fue que un placeholder textual:

```text
No existe suficiente información del periodo para generar el informe.
```

estaba entrando en la lógica de connotación predominante y evitando que se insertaran filas en `informes_generales`.
