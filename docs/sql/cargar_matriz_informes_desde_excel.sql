-- Carga segura de matriz_informes desde Excel consolidado.
-- Motivo: matriz_informes tiene unique en codigo_informe, por eso la carga correcta
-- es reemplazo por codigo_informe, no insertar duplicados.
--
-- Flujo:
-- 1. Crear respaldo completo.
-- 2. Cargar Excel/CSV a tabla staging.
-- 3. Upsert por codigo_informe.
-- 4. Desactivar cualquier matriz activa que ya no venga en staging.
-- 5. Validar conteos.

begin;

-- 1) Respaldo antes de tocar produccion.
create table if not exists public.matriz_informes_backup_YYYYMMDD_HHMMSS as
select *
from public.matriz_informes;

-- 2) Tabla staging. Cargar aqui el contenido de MATRIZ_CONSOLIDADA.
--    No cargar matriz_informe_id como fuente de verdad; el match es codigo_informe.
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

-- Ejemplo de carga desde CSV en psql:
-- \copy staging_matriz_informes (
--   codigo_informe,nombre_informe,nombre_fisico,descripcion_informe,emocion,
--   primera_patologia,segunda_patologia,variante,fecha_creacion,creado_por,
--   fecha_actualizacion,actualizado_por,activo,recomendacion_almaia,ambitos
-- ) from '/ruta/matriz_informes_consolidada.csv' with (format csv, header true);

-- 3) Upsert: reemplaza textos/datos por codigo_informe y deja activas las filas del Excel.
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

-- 4) Desactivar matrices activas que ya no estan en el Excel nuevo.
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

-- 5) Validaciones esperadas para esta carga:
-- total activo: 2880
-- Alumno/Curso/Nivel/Colegio: 720 cada uno
-- duplicados activos por codigo_informe: 0
-- duplicados activos por nombre_fisico: 0
-- vacios activos en descripcion/recomendacion: 0
select ambitos, count(*) as activos
from public.matriz_informes
where activo = true
group by ambitos
order by ambitos;

select
  count(*) filter (where activo = true) as activos_total,
  count(*) filter (where activo = true and nullif(trim(descripcion_informe), '') is null) as activos_sin_descripcion,
  count(*) filter (where activo = true and nullif(trim(recomendacion_almaia), '') is null) as activos_sin_recomendacion
from public.matriz_informes;

select codigo_informe, count(*)
from public.matriz_informes
where activo = true
group by codigo_informe
having count(*) > 1;

commit;
