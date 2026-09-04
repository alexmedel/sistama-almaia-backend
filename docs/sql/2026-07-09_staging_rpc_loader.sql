-- RPC segura para cargar staging desde backend usando service_role.
-- Evita exponer schema staging en Data API.

create or replace function public.carga_staging_crear_proceso(
  p_nombre_archivo text
)
returns uuid
language plpgsql
security definer
set search_path = public, staging, pg_temp
as $$
declare
  v_proceso_id uuid;
begin
  insert into staging.carga_procesos (
    nombre_archivo,
    estado,
    etapa
  ) values (
    p_nombre_archivo,
    'INICIADO',
    'carga_excel'
  )
  returning proceso_id into v_proceso_id;

  return v_proceso_id;
end;
$$;

create or replace function public.carga_staging_insertar_filas(
  p_tabla text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public, staging, pg_temp
as $$
declare
  v_tablas_permitidas text[] := array[
    'stg_colegio',
    'stg_ano_academico',
    'stg_dias_festivos',
    'stg_fechas_importantes',
    'stg_cargos_directivos',
    'stg_niveles_educativos',
    'stg_grados',
    'stg_materias',
    'stg_cursos',
    'stg_directivos',
    'stg_docentes',
    'stg_alumnos',
    'stg_aulas'
  ];
begin
  if p_tabla is null or not (p_tabla = any(v_tablas_permitidas)) then
    raise exception 'Tabla staging no permitida: %', p_tabla;
  end if;

  if jsonb_typeof(p_payload) <> 'array' then
    raise exception 'Payload debe ser arreglo JSON';
  end if;

  if jsonb_array_length(p_payload) = 0 then
    return;
  end if;

  execute format(
    'insert into staging.%1$I (%2$s) select %2$s from jsonb_populate_recordset(null::staging.%1$I, $1)',
    p_tabla,
    (
      select string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position)
      from information_schema.columns c
      where c.table_schema = 'staging'
        and c.table_name = p_tabla
        and c.column_name in (
          select jsonb_object_keys(p_payload->0)
        )
    )
  )
  using p_payload;
end;
$$;

create or replace function public.carga_staging_upsert_resumen(
  p_proceso_id uuid,
  p_tabla_staging text,
  p_filas_leidas integer
)
returns void
language plpgsql
security definer
set search_path = public, staging, pg_temp
as $$
begin
  insert into staging.carga_resumen_tablas (
    proceso_id,
    tabla_staging,
    filas_leidas,
    actualizado_en
  )
  values (
    p_proceso_id,
    p_tabla_staging,
    p_filas_leidas,
    now()
  )
  on conflict (proceso_id, tabla_staging)
  do update set
    filas_leidas = excluded.filas_leidas,
    actualizado_en = excluded.actualizado_en;
end;
$$;

create or replace function public.carga_staging_marcar_cargado(
  p_proceso_id uuid,
  p_total_filas integer,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public, staging, pg_temp
as $$
begin
  update staging.carga_procesos
  set
    estado = 'STAGING_CARGADO',
    etapa = 'staging_cargado',
    total_filas = p_total_filas,
    actualizado_en = now(),
    metadata = coalesce(p_metadata, '{}'::jsonb)
  where proceso_id = p_proceso_id;

  if not found then
    raise exception 'Proceso % no existe', p_proceso_id;
  end if;
end;
$$;

revoke all on function public.carga_staging_crear_proceso(text) from public;
revoke all on function public.carga_staging_insertar_filas(text, jsonb) from public;
revoke all on function public.carga_staging_upsert_resumen(uuid, text, integer) from public;
revoke all on function public.carga_staging_marcar_cargado(uuid, integer, jsonb) from public;

grant execute on function public.carga_staging_crear_proceso(text) to service_role;
grant execute on function public.carga_staging_insertar_filas(text, jsonb) to service_role;
grant execute on function public.carga_staging_upsert_resumen(uuid, text, integer) to service_role;
grant execute on function public.carga_staging_marcar_cargado(uuid, integer, jsonb) to service_role;
