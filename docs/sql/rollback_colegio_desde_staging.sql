-- ============================================================================
-- ROLLBACK CONTROLADO: public -> rollback de ultima migracion staging
-- ============================================================================
-- Ejecutar este archivo completo en Supabase SQL Editor.
--
-- Luego ejecutar:
--
--   select *
--   from staging.rollback_colegio_desde_staging(
--     'c10a1f0f-209f-41e9-b304-38094ac46956'::uuid
--   );
--
-- Borra SOLO filas creadas por la migracion, marcadas en:
--
--   staging.carga_map.metadata.created = true
--
-- No borra filas reutilizadas.
-- ============================================================================

create schema if not exists staging;

create or replace function staging.rollback_colegio_desde_staging(
  p_proceso_id uuid
)
returns table (
  proceso_id uuid,
  estado text,
  resumen jsonb
)
language plpgsql
security invoker
as $$
declare
  v_deleted integer;
  v_total integer := 0;
  v_ts timestamptz := now();
begin
  if not exists (
    select 1
    from staging.carga_procesos
    where carga_procesos.proceso_id = p_proceso_id
  ) then
    raise exception 'Proceso % no existe', p_proceso_id;
  end if;

  -- Orden inverso por dependencias.
  delete from public.alumnos_apoderados t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.alumnos_apoderados'
    and cm.metadata->>'created' = 'true'
    and t.alumno_apoderado_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.alumnos_cursos t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.alumnos_cursos'
    and cm.metadata->>'created' = 'true'
    and t.alumno_curso_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.aulas t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.aulas'
    and cm.metadata->>'created' = 'true'
    and t.aula_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.apoderados t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.apoderados'
    and cm.metadata->>'created' = 'true'
    and t.apoderado_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.alumnos t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.alumnos'
    and cm.metadata->>'created' = 'true'
    and t.alumno_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.docentes t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.docentes'
    and cm.metadata->>'created' = 'true'
    and t.docente_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.personas t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.personas'
    and cm.metadata->>'created' = 'true'
    and t.persona_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.calendarios_fechas_importantes t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.calendarios_fechas_importantes'
    and cm.metadata->>'created' = 'true'
    and t.calendario_fecha_importante_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.calendarios_dias_festivos t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.calendarios_dias_festivos'
    and cm.metadata->>'created' = 'true'
    and t.calendario_dia_festivo = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.cursos t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.cursos'
    and cm.metadata->>'created' = 'true'
    and t.curso_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.materias t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.materias'
    and cm.metadata->>'created' = 'true'
    and t.materia_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.grados t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.grados'
    and cm.metadata->>'created' = 'true'
    and t.grado_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.niveles_educativos t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.niveles_educativos'
    and cm.metadata->>'created' = 'true'
    and t.nivel_educativo_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.calendarios_escolares t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.calendarios_escolares'
    and cm.metadata->>'created' = 'true'
    and t.calendario_escolar_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  delete from public.colegios t
  using staging.carga_map cm
  where cm.proceso_id = p_proceso_id
    and cm.tabla_destino = 'public.colegios'
    and cm.metadata->>'created' = 'true'
    and t.colegio_id = cm.id_destino::integer;
  get diagnostics v_deleted = row_count;
  v_total := v_total + v_deleted;

  update staging.carga_map
  set metadata = metadata || jsonb_build_object(
    'rolled_back',
    true,
    'rolled_back_at',
    v_ts
  )
  where carga_map.proceso_id = p_proceso_id
    and metadata->>'created' = 'true';

  update staging.carga_procesos
  set estado = 'ABORTADO',
      etapa = 'rollback_public',
      actualizado_en = v_ts,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'rollback',
        jsonb_build_object('deleted_rows', v_total, 'fecha', v_ts)
      )
  where carga_procesos.proceso_id = p_proceso_id;

  return query
  select
    p_proceso_id,
    'ABORTADO'::text,
    jsonb_build_object('deleted_rows', v_total);
end;
$$;

comment on function staging.rollback_colegio_desde_staging(uuid)
is 'Rollback seguro de migracion staging: borra solo IDs creados y marcados en staging.carga_map.';
