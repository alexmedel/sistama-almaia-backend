# Carga de matriz_informes

## Objetivo

Actualizar la tabla `public.matriz_informes` usando la matriz consolidada entregada en Excel.

La carga correcta es por `codigo_informe`, no por `matriz_informe_id`.

Motivo:

- `codigo_informe` tiene constraint `unique`.
- El Excel puede traer IDs viejos, repetidos o no confiables.
- El motor de informes usa principalmente `codigo_informe` y `nombre_fisico`.

## Archivos usados

Excel limpio generado durante esta carga:

```text
outputs/matriz_informes_consolidada_corregida.xlsx
```

SQL documentado:

```text
docs/sql/cargar_matriz_informes_desde_excel.sql
```

Backup real creado antes de carga:

```text
outputs/matriz_informes_backup_antes_upsert_20260617_215616.xlsx
outputs/matriz_informes_backup_antes_upsert_20260617_215616.json
```

Nota: `outputs/` es artefacto local de operación. No subir backups con data real al repositorio público/compartido. Guardarlos en almacenamiento interno seguro.

## Resultado esperado

Después de la carga deben quedar:

- `2880` matrices activas.
- `720` para `Alumno`.
- `720` para `Curso`.
- `720` para `Nivel`.
- `720` para `Colegio`.
- `0` duplicados activos por `codigo_informe`.
- `0` duplicados activos por `nombre_fisico`.
- `0` activos sin `descripcion_informe`.
- `0` activos sin `recomendacion_almaia`.

## Reglas de carga

1. Siempre hacer backup completo antes de tocar `matriz_informes`.
2. No insertar por `matriz_informe_id`.
3. No confiar en IDs del Excel.
4. Usar `codigo_informe` como llave de reemplazo.
5. Hacer `upsert` por `codigo_informe`.
6. Activar las filas que vienen en el Excel nuevo.
7. Desactivar cualquier fila activa que no venga en el Excel nuevo.
8. Validar conteos al final.

## Flujo recomendado

### 1. Crear backup

```sql
create table public.matriz_informes_backup_YYYYMMDD_HHMMSS as
select *
from public.matriz_informes;
```

Cambiar `YYYYMMDD_HHMMSS` por fecha real.

Ejemplo:

```sql
create table public.matriz_informes_backup_20260617_215616 as
select *
from public.matriz_informes;
```

### 2. Crear tabla staging

```sql
create temporary table staging_matriz_informes (
  codigo_informe text primary key,
  nombre_informe text,
  nombre_fisico text,
  descripcion_informe text,
  emocion text,
  primera_patologia text,
  segunda_patologia text,
  variante integer,
  fecha_creacion timestamptz,
  creado_por integer,
  fecha_actualizacion timestamptz,
  actualizado_por integer,
  activo boolean,
  recomendacion_almaia text,
  ambitos text
) on commit drop;
```

### 3. Cargar Excel/CSV a staging

Exportar hoja `MATRIZ_CONSOLIDADA` a CSV.

Columnas que deben cargarse:

```text
codigo_informe,
nombre_informe,
nombre_fisico,
descripcion_informe,
emocion,
primera_patologia,
segunda_patologia,
variante,
fecha_creacion,
creado_por,
fecha_actualizacion,
actualizado_por,
activo,
recomendacion_almaia,
ambitos
```

No cargar `matriz_informe_id`.

Ejemplo con `psql`:

```sql
\copy staging_matriz_informes (
  codigo_informe,
  nombre_informe,
  nombre_fisico,
  descripcion_informe,
  emocion,
  primera_patologia,
  segunda_patologia,
  variante,
  fecha_creacion,
  creado_por,
  fecha_actualizacion,
  actualizado_por,
  activo,
  recomendacion_almaia,
  ambitos
) from '/ruta/matriz_informes_consolidada.csv' with (format csv, header true);
```

### 4. Upsert por codigo_informe

```sql
insert into public.matriz_informes (
  codigo_informe,
  nombre_informe,
  nombre_fisico,
  descripcion_informe,
  emocion,
  primera_patologia,
  segunda_patologia,
  variante,
  fecha_creacion,
  creado_por,
  fecha_actualizacion,
  actualizado_por,
  activo,
  recomendacion_almaia,
  ambitos
)
select
  codigo_informe,
  nombre_informe,
  nombre_fisico,
  descripcion_informe,
  emocion,
  primera_patologia,
  segunda_patologia,
  variante,
  coalesce(fecha_creacion, now()),
  coalesce(creado_por, 1),
  now(),
  coalesce(actualizado_por, 1),
  true,
  recomendacion_almaia,
  ambitos
from staging_matriz_informes
on conflict (codigo_informe) do update
set
  nombre_informe = excluded.nombre_informe,
  nombre_fisico = excluded.nombre_fisico,
  descripcion_informe = excluded.descripcion_informe,
  emocion = excluded.emocion,
  primera_patologia = excluded.primera_patologia,
  segunda_patologia = excluded.segunda_patologia,
  variante = excluded.variante,
  fecha_actualizacion = now(),
  actualizado_por = excluded.actualizado_por,
  activo = true,
  recomendacion_almaia = excluded.recomendacion_almaia,
  ambitos = excluded.ambitos;
```

### 5. Desactivar matrices que no vienen en Excel nuevo

```sql
update public.matriz_informes mi
set
  activo = false,
  fecha_actualizacion = now()
where mi.activo = true
  and not exists (
    select 1
    from staging_matriz_informes s
    where s.codigo_informe = mi.codigo_informe
  );
```

## Query de validación principal

```sql
select
  count(*) filter (where activo = true) as activas_total,
  count(*) filter (where activo = true and ambitos = 'Alumno') as activas_alumno,
  count(*) filter (where activo = true and ambitos = 'Curso') as activas_curso,
  count(*) filter (where activo = true and ambitos = 'Nivel') as activas_nivel,
  count(*) filter (where activo = true and ambitos = 'Colegio') as activas_colegio,
  count(*) filter (
    where activo = true
      and nullif(trim(descripcion_informe), '') is null
  ) as activas_sin_descripcion,
  count(*) filter (
    where activo = true
      and nullif(trim(recomendacion_almaia), '') is null
  ) as activas_sin_recomendacion
from public.matriz_informes;
```

Resultado esperado:

```text
activas_total = 2880
activas_alumno = 720
activas_curso = 720
activas_nivel = 720
activas_colegio = 720
activas_sin_descripcion = 0
activas_sin_recomendacion = 0
```

## Validar duplicados activos

```sql
select codigo_informe, count(*)
from public.matriz_informes
where activo = true
group by codigo_informe
having count(*) > 1;
```

Debe devolver `0` filas.

```sql
select nombre_fisico, count(*)
from public.matriz_informes
where activo = true
group by nombre_fisico
having count(*) > 1;
```

Debe devolver `0` filas.

## Validar distribución por ámbito

```sql
select ambitos, count(*) as activas
from public.matriz_informes
where activo = true
group by ambitos
order by ambitos;
```

Resultado esperado:

```text
Alumno   720
Colegio  720
Curso    720
Nivel    720
```

## Rollback

Si la carga queda mal, restaurar desde backup.

Ejemplo:

```sql
begin;

truncate table public.matriz_informes restart identity;

insert into public.matriz_informes
select *
from public.matriz_informes_backup_YYYYMMDD_HHMMSS;

commit;
```

Usar el nombre real del backup.

## Advertencias

- No borrar backups hasta validar PDFs/informes.
- No hacer `insert` directo con IDs del Excel.
- No usar `delete` salvo rollback controlado.
- Si aparece error de `duplicate key value violates unique constraint "matriz_informes_codigo_informe_key"`, significa que alguien intentó insertar duplicados. Usar `upsert`.
- Si frontend/backend no muestran nueva recomendación, revisar caché o que el informe esté apuntando a `nombre_fisico` correcto.
