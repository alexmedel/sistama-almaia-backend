-- ============================================================================
-- MIGRACION CONTROLADA: staging -> public
-- ============================================================================
-- Ejecutar este archivo completo en Supabase SQL Editor.
--
-- Luego ejecutar:
--
--   select *
--   from staging.migrar_colegio_desde_staging(
--     'c10a1f0f-209f-41e9-b304-38094ac46956'::uuid,
--     p_actor_id := 1,
--     p_omitir_conflictos := false
--   );
--
-- Si el Excel trae docentes con mismo RUT y nombres distintos, modo seguro
-- bloquea. Para migrar todo lo resolvible y omitir esas filas:
--
--   p_omitir_conflictos := true
--
-- Todo ID creado/reutilizado queda en staging.carga_map. Rollback usa ese mapa.
-- ============================================================================

create schema if not exists staging;

create or replace function staging._norm_colegio(p_text text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := lower(coalesce(p_text, ''));
  v := replace(v, 'á', 'a');
  v := replace(v, 'é', 'e');
  v := replace(v, 'í', 'i');
  v := replace(v, 'ó', 'o');
  v := replace(v, 'ú', 'u');
  v := replace(v, 'ü', 'u');
  v := replace(v, 'ñ', 'n');
  v := replace(v, '°', ' ');
  v := replace(v, 'º', ' ');
  v := regexp_replace(v, '[^a-z0-9]+', ' ', 'g');
  v := regexp_replace(v, '\bprimero\b|\bprimer\b', '1', 'g');
  v := regexp_replace(v, '\bsegundo\b', '2', 'g');
  v := regexp_replace(v, '\btercero\b', '3', 'g');
  v := regexp_replace(v, '\bcuarto\b', '4', 'g');
  v := regexp_replace(v, '\bquinto\b', '5', 'g');
  v := regexp_replace(v, '\bsexto\b', '6', 'g');
  v := regexp_replace(v, '\bseptimo\b', '7', 'g');
  v := regexp_replace(v, '\boctavo\b', '8', 'g');
  v := regexp_replace(v, '\bbasica\b', 'basico', 'g');
  v := regexp_replace(v, '\bed fisica\b', 'educacion fisica', 'g');
  v := regexp_replace(v, '\s+', ' ', 'g');
  return trim(v);
end;
$$;

create or replace function staging._to_date_colegio(p_text text)
returns date
language plpgsql
immutable
as $$
begin
  if nullif(trim(coalesce(p_text, '')), '') is null then
    return null;
  end if;

  begin
    return p_text::date;
  exception when others then
    return null;
  end;
end;
$$;

create or replace function staging._to_int_colegio(p_text text)
returns integer
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(p_text, ''), '[^0-9]', '', 'g');
  if v = '' then
    return null;
  end if;
  return v::integer;
end;
$$;

create or replace function staging._map_colegio(
  p_proceso_id uuid,
  p_entidad text,
  p_clave text,
  p_tabla text,
  p_id bigint,
  p_created boolean,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
as $$
begin
  insert into staging.carga_map (
    proceso_id,
    entidad,
    clave_origen,
    tabla_destino,
    id_destino,
    metadata
  ) values (
    p_proceso_id,
    p_entidad,
    p_clave,
    p_tabla,
    p_id,
    jsonb_build_object('created', p_created) || coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (proceso_id, entidad, clave_origen, tabla_destino)
  do update set
    id_destino = excluded.id_destino,
    metadata = (excluded.metadata || jsonb_build_object('created', ((staging.carga_map.metadata->>'created')::boolean or (excluded.metadata->>'created')::boolean)));
end;
$$;

create or replace function staging._log_colegio(
  p_proceso_id uuid,
  p_tabla text,
  p_fila integer,
  p_severidad staging.log_severidad,
  p_codigo text,
  p_mensaje text,
  p_valor text default null
)
returns void
language plpgsql
as $$
begin
  insert into staging.log_errores_carga (
    proceso_id,
    tabla_staging,
    fila_excel,
    severidad,
    codigo,
    mensaje,
    valor_original,
    bloque
  ) values (
    p_proceso_id,
    p_tabla,
    p_fila,
    p_severidad,
    p_codigo,
    p_mensaje,
    p_valor,
    'migracion_final'
  );
end;
$$;

create or replace function staging.migrar_colegio_desde_staging(
  p_proceso_id uuid,
  p_actor_id integer default 1,
  p_omitir_conflictos boolean default false,
  p_pais_default_id integer default 1,
  p_region_default_id integer default 14,
  p_comuna_default_id integer default 2
)
returns table (
  out_proceso_id uuid,
  out_colegio_id integer,
  out_estado text,
  out_resumen jsonb
)
language plpgsql
security invoker
as $$
declare
  v_ts timestamptz := now();
  v_estado text;
  v_colegio_id integer;
  v_calendario_id integer;
  v_ano integer;
  v_fecha_inicio date;
  v_fecha_fin date;
  v_id integer;
  v_created boolean;
  v_conflictos integer;
  v_insertados integer := 0;
  v_reutilizados integer := 0;
  v_omitidos integer := 0;
  r record;
  r2 record;
  v_ref_id integer;
begin
  select cp.estado::text
  into v_estado
  from staging.carga_procesos cp
  where cp.proceso_id = p_proceso_id
  for update;

  if v_estado is null then
    raise exception 'Proceso % no existe en staging.carga_procesos', p_proceso_id;
  end if;

  if exists (
    select 1
    from staging.carga_map
    where carga_map.proceso_id = p_proceso_id
      and metadata->>'created' = 'true'
      and coalesce(metadata->>'rolled_back', 'false') <> 'true'
  ) then
    raise exception 'Proceso % ya tiene migracion activa. Ejecuta rollback antes de repetir.', p_proceso_id;
  end if;

  delete from staging.log_errores_carga
  where log_errores_carga.proceso_id = p_proceso_id
    and bloque = 'migracion_final';
  -- Sincroniza secuencias seriales antes de insertar. Necesario porque algunas
  -- tablas fueron pobladas manualmente y nextval puede apuntar a IDs ya usados.
  perform setval(pg_get_serial_sequence('public.colegios', 'colegio_id'), coalesce((select max(colegio_id) from public.colegios), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.calendarios_escolares', 'calendario_escolar_id'), coalesce((select max(calendario_escolar_id) from public.calendarios_escolares), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.calendarios_dias_festivos', 'calendario_dia_festivo'), coalesce((select max(calendario_dia_festivo) from public.calendarios_dias_festivos), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.calendarios_fechas_importantes', 'calendario_fecha_importante_id'), coalesce((select max(calendario_fecha_importante_id) from public.calendarios_fechas_importantes), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.niveles_educativos', 'nivel_educativo_id'), coalesce((select max(nivel_educativo_id) from public.niveles_educativos), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.grados', 'grado_id'), coalesce((select max(grado_id) from public.grados), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.materias', 'materia_id'), coalesce((select max(materia_id) from public.materias), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.cursos', 'curso_id'), coalesce((select max(curso_id) from public.cursos), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.personas', 'persona_id'), coalesce((select max(persona_id) from public.personas), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.docentes', 'docente_id'), coalesce((select max(docente_id) from public.docentes), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.alumnos', 'alumno_id'), coalesce((select max(alumno_id) from public.alumnos), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.apoderados', 'apoderado_id'), coalesce((select max(apoderado_id) from public.apoderados), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.alumnos_cursos', 'alumno_curso_id'), coalesce((select max(alumno_curso_id) from public.alumnos_cursos), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.alumnos_apoderados', 'alumno_apoderado_id'), coalesce((select max(alumno_apoderado_id) from public.alumnos_apoderados), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.aulas', 'aula_id'), coalesce((select max(aula_id) from public.aulas), 0) + 1, false);

  select count(*)
  into v_conflictos
  from (
    select rut_raw
    from staging.stg_docentes
    where proceso_id = p_proceso_id
      and nullif(trim(coalesce(rut_raw, '')), '') is not null
    group by rut_raw
    having count(distinct staging._norm_colegio(coalesce(nombres, '') || ' ' || coalesce(apellidos, ''))) > 1
  ) x;

  if v_conflictos > 0 and not p_omitir_conflictos then
    perform staging._log_colegio(
      p_proceso_id,
      'stg_docentes',
      null,
      'CRITICO',
      'RUT_DUPLICADO_NOMBRES_DISTINTOS',
      'Mismo RUT con nombres distintos. No se puede reutilizar de forma segura.',
      null
    );
    raise exception 'Migracion bloqueada: % RUT docente duplicado con nombres distintos. Usa p_omitir_conflictos=true para omitir esas filas.', v_conflictos;
  end if;

  -- Colegio.
  select c.colegio_id
  into v_colegio_id
  from public.colegios c
  join staging.stg_colegio sc on sc.proceso_id = p_proceso_id
  where staging._norm_colegio(c.nombre) = staging._norm_colegio(sc.nombre)
  limit 1;

  v_created := false;
  if v_colegio_id is null then
    insert into public.colegios (
      nombre,
      nombre_fantasia,
      tipo_colegio,
      dependencia,
      sitio_web,
      direccion,
      telefono_contacto,
      correo_electronico,
      creado_por,
      actualizado_por,
      fecha_creacion,
      fecha_actualizacion,
      activo,
      comuna_id,
      region_id,
      pais_id,
      correo_sos,
      correo_denuncia,
      permitir_anonimo,
      forzar_identificacion,
      zona_horaria
    )
    select
      coalesce(nullif(nombre, ''), 'Colegio sin nombre'),
      coalesce(nullif(nombre_fantasia, ''), nullif(nombre, ''), 'Colegio sin nombre'),
      coalesce(nullif(tipo_colegio, ''), 'Colegio'),
      coalesce(nullif(dependencia, ''), 'No especificada'),
      coalesce(sitio_web, ''),
      coalesce(direccion, ''),
      left(coalesce(telefono_contacto, ''), 16),
      coalesce(correo_electronico, ''),
      p_actor_id,
      p_actor_id,
      v_ts,
      v_ts,
      true,
      coalesce(staging._to_int_colegio(comuna_raw), comuna_id, p_comuna_default_id),
      coalesce(staging._to_int_colegio(region_raw), region_id, p_region_default_id),
      coalesce(staging._to_int_colegio(pais_raw), pais_id, p_pais_default_id),
      coalesce(correo_sos, correo_electronico, ''),
      coalesce(correo_denuncia, correo_electronico, ''),
      coalesce(permitir_anonimo, true),
      coalesce(forzar_identificacion, false),
      coalesce(zona_horaria, 'America/Santiago')
    from staging.stg_colegio
    where proceso_id = p_proceso_id
    order by fila_excel
    limit 1
    returning public.colegios.colegio_id into v_colegio_id;

    v_created := true;
    v_insertados := v_insertados + 1;
  else
    v_reutilizados := v_reutilizados + 1;
  end if;

  perform staging._map_colegio(p_proceso_id, 'colegio', 'principal', 'public.colegios', v_colegio_id, v_created);

  -- Calendario.
  select
    coalesce(staging._to_int_colegio(ano_escolar_raw), extract(year from v_ts)::integer),
    coalesce(staging._to_date_colegio(fecha_ingreso_raw), make_date(extract(year from v_ts)::integer, 3, 1)),
    coalesce(staging._to_date_colegio(fecha_egreso_raw), make_date(extract(year from v_ts)::integer, 12, 31))
  into v_ano, v_fecha_inicio, v_fecha_fin
  from staging.stg_ano_academico
  where proceso_id = p_proceso_id
  order by fila_excel
  limit 1;

  select calendario_escolar_id
  into v_calendario_id
  from public.calendarios_escolares
  where colegio_id = v_colegio_id
    and ano_escolar = v_ano
  limit 1;

  v_created := false;
  if v_calendario_id is null then
    insert into public.calendarios_escolares (
      colegio_id,
      ano_escolar,
      fecha_inicio,
      fecha_fin,
      dias_habiles,
      creado_por,
      actualizado_por,
      fecha_creacion,
      fecha_actualizacion,
      activo
    ) values (
      v_colegio_id,
      v_ano,
      v_fecha_inicio,
      v_fecha_fin,
      greatest(v_fecha_fin - v_fecha_inicio, 0),
      p_actor_id,
      p_actor_id,
      v_ts,
      v_ts,
      true
    )
    returning calendario_escolar_id into v_calendario_id;

    v_created := true;
    v_insertados := v_insertados + 1;
  else
    v_reutilizados := v_reutilizados + 1;
  end if;

  perform staging._map_colegio(p_proceso_id, 'calendario', v_ano::text, 'public.calendarios_escolares', v_calendario_id, v_created);

  -- Niveles: hoja niveles + niveles usados por cursos.
  for r in
    with x as (
      select nombre from staging.stg_niveles_educativos where proceso_id = p_proceso_id
      union
      select nivel_educativo_raw from staging.stg_cursos where proceso_id = p_proceso_id
    )
    select distinct nombre
    from x
    where nullif(trim(coalesce(nombre, '')), '') is not null
  loop
    select nivel_educativo_id
    into v_id
    from public.niveles_educativos
    where colegio_id = v_colegio_id
      and staging._norm_colegio(nombre) = staging._norm_colegio(r.nombre)
    limit 1;

    v_created := false;
    if v_id is null then
      insert into public.niveles_educativos (
        nombre,
        creado_por,
        actualizado_por,
        fecha_actualizacion,
        fecha_creacion,
        activo,
        colegio_id,
        nivel
      ) values (
        r.nombre,
        p_actor_id,
        p_actor_id,
        v_ts,
        v_ts,
        true,
        v_colegio_id,
        0
      )
      returning nivel_educativo_id into v_id;

      v_created := true;
      v_insertados := v_insertados + 1;
    else
      v_reutilizados := v_reutilizados + 1;
    end if;

    perform staging._map_colegio(p_proceso_id, 'nivel', staging._norm_colegio(r.nombre), 'public.niveles_educativos', v_id, v_created);
  end loop;

  -- Grados: hoja grados + grados usados por cursos.
  for r in
    with x as (
      select nombre as grado, null::text as nivel from staging.stg_grados where proceso_id = p_proceso_id
      union
      select grado_raw, nivel_educativo_raw from staging.stg_cursos where proceso_id = p_proceso_id
    )
    select distinct grado, nivel
    from x
    where nullif(trim(coalesce(grado, '')), '') is not null
  loop
    select id_destino::integer
    into v_ref_id
    from staging.carga_map
    where proceso_id = p_proceso_id
      and entidad = 'nivel'
      and tabla_destino = 'public.niveles_educativos'
      and clave_origen = staging._norm_colegio(coalesce(r.nivel, (select nombre from staging.stg_niveles_educativos where proceso_id = p_proceso_id order by fila_excel limit 1)))
    limit 1;

    if v_ref_id is null then
      select id_destino::integer
      into v_ref_id
      from staging.carga_map
      where proceso_id = p_proceso_id
        and entidad = 'nivel'
        and tabla_destino = 'public.niveles_educativos'
      order by map_id
      limit 1;
    end if;

    select grado_id
    into v_id
    from public.grados
    where colegio_id = v_colegio_id
      and staging._norm_colegio(nombre) = staging._norm_colegio(r.grado)
    limit 1;

    v_created := false;
    if v_id is null then
      insert into public.grados (
        nombre,
        creado_por,
        actualizado_por,
        fecha_actualizacion,
        fecha_creacion,
        estado,
        nivel_educativo_id,
        colegio_id,
        activo
      ) values (
        r.grado,
        p_actor_id,
        p_actor_id,
        v_ts,
        v_ts,
        'activo',
        v_ref_id,
        v_colegio_id,
        true
      )
      returning grado_id into v_id;

      v_created := true;
      v_insertados := v_insertados + 1;
    else
      v_reutilizados := v_reutilizados + 1;
    end if;

    perform staging._map_colegio(p_proceso_id, 'grado', staging._norm_colegio(r.grado), 'public.grados', v_id, v_created);
  end loop;

  -- Materias. "Todas las asignaturas" no es materia real; aulas la expanden.
  for r in
    select distinct
      case
        when staging._norm_colegio(nombre) = 'ed fisica' then 'Educación Física'
        else nombre
      end as nombre,
      coalesce(nullif(codigo, ''), upper(substr(regexp_replace(staging._norm_colegio(nombre), '\s+', '_', 'g'), 1, 20))) as codigo
    from staging.stg_materias
    where proceso_id = p_proceso_id
      and nullif(trim(coalesce(nombre, '')), '') is not null
      and staging._norm_colegio(nombre) <> 'todas las asignaturas'
  loop
    select materia_id
    into v_id
    from public.materias
    where colegio_id = v_colegio_id
      and (
        staging._norm_colegio(nombre) = staging._norm_colegio(r.nombre)
        or staging._norm_colegio(codigo) = staging._norm_colegio(r.codigo)
      )
    limit 1;

    v_created := false;
    if v_id is null then
      insert into public.materias (
        colegio_id,
        nombre,
        codigo,
        creado_por,
        actualizado_por,
        fecha_creacion,
        fecha_actualizacion,
        activo
      ) values (
        v_colegio_id,
        r.nombre,
        left(r.codigo, 20),
        p_actor_id,
        p_actor_id,
        v_ts,
        v_ts,
        true
      )
      returning materia_id into v_id;

      v_created := true;
      v_insertados := v_insertados + 1;
    else
      v_reutilizados := v_reutilizados + 1;
    end if;

    perform staging._map_colegio(p_proceso_id, 'materia', staging._norm_colegio(r.nombre), 'public.materias', v_id, v_created);
  end loop;

  -- Cursos: hoja cursos + referencias usadas por alumnos/aulas.
  for r in
    with x as (
      select nombre_curso as curso, grado_raw as grado from staging.stg_cursos where proceso_id = p_proceso_id
      union
      select curso_raw, null from staging.stg_alumnos where proceso_id = p_proceso_id
      union
      select curso_raw, null from staging.stg_aulas where proceso_id = p_proceso_id
    )
    select distinct curso, grado
    from x
    where nullif(trim(coalesce(curso, '')), '') is not null
  loop
    select id_destino::integer
    into v_ref_id
    from staging.carga_map
    where proceso_id = p_proceso_id
      and entidad = 'grado'
      and tabla_destino = 'public.grados'
      and (
        clave_origen = staging._norm_colegio(r.grado)
        or staging._norm_colegio(r.curso) like clave_origen || '%'
      )
    order by case when clave_origen = staging._norm_colegio(r.grado) then 0 else 1 end
    limit 1;

    if v_ref_id is null then
      select id_destino::integer
      into v_ref_id
      from staging.carga_map
      where proceso_id = p_proceso_id
        and entidad = 'grado'
        and tabla_destino = 'public.grados'
      order by map_id
      limit 1;
    end if;

    select curso_id
    into v_id
    from public.cursos
    where colegio_id = v_colegio_id
      and staging._norm_colegio(nombre_curso) = staging._norm_colegio(r.curso)
    limit 1;

    v_created := false;
    if v_id is null then
      insert into public.cursos (
        nombre_curso,
        colegio_id,
        grado_id,
        nivel_educativo_id,
        creado_por,
        actualizado_por,
        fecha_creacion,
        fecha_actualizacion,
        activo
      )
      select
        r.curso,
        v_colegio_id,
        g.grado_id,
        g.nivel_educativo_id,
        p_actor_id,
        p_actor_id,
        v_ts,
        v_ts,
        true
      from public.grados g
      where g.grado_id = v_ref_id
      returning curso_id into v_id;

      v_created := true;
      v_insertados := v_insertados + 1;
    else
      v_reutilizados := v_reutilizados + 1;
    end if;

    perform staging._map_colegio(p_proceso_id, 'curso', staging._norm_colegio(r.curso), 'public.cursos', v_id, v_created);
  end loop;

  -- Días festivos.
  for r in
    select *
    from staging.stg_dias_festivos
    where proceso_id = p_proceso_id
      and staging._to_date_colegio(fecha_raw) is not null
  loop
    select calendario_dia_festivo
    into v_id
    from public.calendarios_dias_festivos
    where calendario_escolar_id = v_calendario_id
      and dia_festivo = staging._to_date_colegio(r.fecha_raw)
    limit 1;

    v_created := false;
    if v_id is null then
      insert into public.calendarios_dias_festivos (
        calendario_escolar_id,
        dia_festivo,
        descripcion,
        creado_por,
        actualizado_por,
        fecha_creacion,
        fecha_actualizacion,
        activo
      ) values (
        v_calendario_id,
        staging._to_date_colegio(r.fecha_raw),
        left(left(coalesce(r.descripcion, r.descripcion_raw, ''), 100), 20),
        p_actor_id,
        p_actor_id,
        v_ts,
        v_ts,
        true
      )
      returning calendario_dia_festivo into v_id;

      v_created := true;
      v_insertados := v_insertados + 1;
    else
      v_reutilizados := v_reutilizados + 1;
    end if;

    perform staging._map_colegio(p_proceso_id, 'dia_festivo', r.fila_excel::text, 'public.calendarios_dias_festivos', v_id, v_created);
  end loop;

  -- Fechas importantes.
  for r in
    select *
    from staging.stg_fechas_importantes
    where proceso_id = p_proceso_id
      and staging._to_date_colegio(fecha_raw) is not null
  loop
    insert into public.calendarios_fechas_importantes (
      colegio_id,
      curso_id,
      calendario_escolar_id,
      titulo,
      descripcion,
      fecha,
      tipo,
      creado_por,
      actualizado_por,
      fecha_creacion,
      fecha_actualizacion,
      activo
    ) values (
      v_colegio_id,
      (select id_destino::integer from staging.carga_map where proceso_id = p_proceso_id and entidad = 'curso' and tabla_destino = 'public.cursos' order by map_id limit 1),
      v_calendario_id,
      left(coalesce(r.titulo, r.titulo_raw, 'Fecha importante'), 100),
      left(coalesce(r.descripcion, r.descripcion_raw, ''), 100),
      staging._to_date_colegio(r.fecha_raw),
      left(coalesce(nullif(r.tipo, ''), nullif(r.tipo_raw, ''), 'GENERAL'), 50),
      p_actor_id,
      p_actor_id,
      v_ts,
      v_ts,
      true
    )
    returning calendario_fecha_importante_id into v_id;

    v_insertados := v_insertados + 1;
    perform staging._map_colegio(p_proceso_id, 'fecha_importante', r.fila_excel::text, 'public.calendarios_fechas_importantes', v_id, true);
  end loop;

  -- Personas: directivos/docentes/alumnos/apoderados. Sin Auth; Auth se debe hacer
  -- después cuando email exista y regla de credenciales esté aprobada.
  for r in
    with personas as (
      select 'directivo' as tipo, fila_excel, rut_raw as rut, nombres, apellidos, fecha_nacimiento_raw as fecha_nac from staging.stg_directivos where proceso_id = p_proceso_id
      union all
      select 'docente', fila_excel, rut_raw, nombres, apellidos, fecha_nacimiento_raw from staging.stg_docentes where proceso_id = p_proceso_id
      union all
      select 'alumno', fila_excel, rut_raw, nombres, apellidos, fecha_nacimiento_raw from staging.stg_alumnos where proceso_id = p_proceso_id
      union all
      select 'apoderado', fila_excel, rut_apoderado_1_raw, nombre_apoderado_1_raw, apellido_apoderado_1_raw, null from staging.stg_alumnos where proceso_id = p_proceso_id
      union all
      select 'apoderado', fila_excel, rut_apoderado_2_raw, nombre_apoderado_2_raw, apellido_apoderado_2_raw, null from staging.stg_alumnos where proceso_id = p_proceso_id
    ),
    filtradas as (
      select *,
             row_number() over (partition by rut order by tipo, fila_excel) as rn
      from personas
      where nullif(trim(coalesce(rut, '')), '') is not null
    )
    select *
    from filtradas
    where rn = 1
      and (
        p_omitir_conflictos
        or rut not in (
          select rut_raw
          from staging.stg_docentes
          where proceso_id = p_proceso_id
          group by rut_raw
          having count(distinct staging._norm_colegio(coalesce(nombres, '') || ' ' || coalesce(apellidos, ''))) > 1
        )
      )
  loop
    select persona_id
    into v_id
    from public.personas
    where numero_documento = trim(r.rut)
    limit 1;

    v_created := false;
    if v_id is null then
      insert into public.personas (
        persona_id,
        tipo_documento,
        numero_documento,
        nombres,
        apellidos,
        genero_id,
        estado_civil_id,
        creado_por,
        actualizado_por,
        fecha_creacion,
        fecha_actualizacion,
        activo,
        fecha_nacimiento,
        is_blocked
      ) values (
        (select coalesce(max(persona_id), 0) + 1 from public.personas),
        'RUT',
        left(trim(r.rut), 16),
        left(coalesce(nullif(r.nombres, ''), 'Sin nombre'), 50),
        left(coalesce(nullif(r.apellidos, ''), 'Sin apellidos'), 30),
        4,
        5,
        p_actor_id,
        p_actor_id,
        v_ts,
        v_ts,
        true,
        staging._to_date_colegio(r.fecha_nac),
        false
      )
      returning persona_id into v_id;

      v_created := true;
      v_insertados := v_insertados + 1;
    else
      v_reutilizados := v_reutilizados + 1;
    end if;

    perform staging._map_colegio(p_proceso_id, 'persona', trim(r.rut), 'public.personas', v_id, v_created, jsonb_build_object('tipo', r.tipo));
  end loop;

  -- Docentes. Si p_omitir_conflictos=false y hay conflicto, nunca llega aquí.
  for r in
    select distinct on (rut_raw) *
    from staging.stg_docentes
    where proceso_id = p_proceso_id
      and nullif(trim(coalesce(rut_raw, '')), '') is not null
    order by rut_raw, fila_excel
  loop
    select id_destino::integer
    into v_ref_id
    from staging.carga_map
    where proceso_id = p_proceso_id
      and entidad = 'persona'
      and tabla_destino = 'public.personas'
      and clave_origen = trim(r.rut_raw)
    limit 1;

    if v_ref_id is null then
      v_omitidos := v_omitidos + 1;
      perform staging._log_colegio(p_proceso_id, 'stg_docentes', r.fila_excel, 'ALERTA', 'DOCENTE_OMITIDO', 'Docente omitido por conflicto de RUT.', r.rut_raw);
      continue;
    end if;

    select docente_id
    into v_id
    from public.docentes
    where persona_id = v_ref_id
      and colegio_id = v_colegio_id
    limit 1;

    v_created := false;
    if v_id is null then
      insert into public.docentes (
        persona_id,
        colegio_id,
        especialidad,
        estado,
        creado_por,
        actualizado_por,
        fecha_creacion,
        fecha_actualizacion,
        activo
      ) values (
        v_ref_id,
        v_colegio_id,
        coalesce(r.especialidad, r.especialidad_raw, ''),
        'Activo',
        p_actor_id,
        p_actor_id,
        v_ts,
        v_ts,
        true
      )
      returning docente_id into v_id;

      v_created := true;
      v_insertados := v_insertados + 1;
    else
      v_reutilizados := v_reutilizados + 1;
    end if;

    perform staging._map_colegio(p_proceso_id, 'docente', trim(r.rut_raw), 'public.docentes', v_id, v_created);
  end loop;

  -- Alumnos + alumnos_cursos.
  for r in
    select *
    from staging.stg_alumnos
    where proceso_id = p_proceso_id
      and nullif(trim(coalesce(rut_raw, '')), '') is not null
  loop
    select id_destino::integer
    into v_ref_id
    from staging.carga_map
    where proceso_id = p_proceso_id
      and entidad = 'persona'
      and tabla_destino = 'public.personas'
      and clave_origen = trim(r.rut_raw)
    limit 1;

    select id_destino::integer
    into v_id
    from staging.carga_map
    where proceso_id = p_proceso_id
      and entidad = 'curso'
      and tabla_destino = 'public.cursos'
      and clave_origen = staging._norm_colegio(r.curso_raw)
    limit 1;

    if v_ref_id is null or v_id is null then
      v_omitidos := v_omitidos + 1;
      perform staging._log_colegio(p_proceso_id, 'stg_alumnos', r.fila_excel, 'ALERTA', 'ALUMNO_OMITIDO', 'Alumno omitido por persona/curso no resuelto.', r.rut_raw || ' / ' || r.curso_raw);
      continue;
    end if;

    declare
      v_persona_id integer := v_ref_id;
      v_curso_id integer := v_id;
      v_alumno_id integer;
    begin
      select alumno_id
      into v_alumno_id
      from public.alumnos
      where persona_id = v_persona_id
        and colegio_id = v_colegio_id
      limit 1;

      v_created := false;
      if v_alumno_id is null then
        insert into public.alumnos (
          colegio_id,
          telefono_contacto1,
          email,
          telefono_contacto2,
          creado_por,
          actualizado_por,
          fecha_creacion,
          fecha_actualizacion,
          activo,
          persona_id,
          consentimiento,
          asistido,
          asistencia_audio,
          perfil_completado,
          is_blocked
        ) values (
          v_colegio_id,
          left(coalesce(r.telefono_contacto1, ''), 16),
          left(coalesce(r.email_final, ''), 45),
          left(coalesce(r.telefono_contacto2, ''), 16),
          p_actor_id,
          p_actor_id,
          v_ts,
          v_ts,
          true,
          v_persona_id,
          false,
          'SI',
          false,
          false,
          false
        )
        returning alumno_id into v_alumno_id;

        v_created := true;
        v_insertados := v_insertados + 1;
      else
        v_reutilizados := v_reutilizados + 1;
      end if;

      perform staging._map_colegio(p_proceso_id, 'alumno', trim(r.rut_raw), 'public.alumnos', v_alumno_id, v_created);

      update staging.stg_alumnos
      set colegio_id = v_colegio_id,
          persona_id_destino = v_persona_id,
          alumno_id_destino = v_alumno_id,
          curso_id = v_curso_id,
          estado_fila = 'MIGRADO'
      where stg_id = r.stg_id;

      if not exists (
        select 1
        from public.alumnos_cursos
        where alumno_id = v_alumno_id
          and curso_id = v_curso_id
          and ano_escolar = v_ano
      ) then
        insert into public.alumnos_cursos (
          alumno_id,
          curso_id,
          ano_escolar,
          fecha_ingreso,
          fecha_egreso,
          creado_por,
          actualizado_por,
          fecha_creacion,
          fecha_actualizacion,
          activo
        ) values (
          v_alumno_id,
          v_curso_id,
          v_ano,
          v_fecha_inicio::timestamptz,
          v_fecha_fin::timestamptz,
          p_actor_id,
          p_actor_id,
          v_ts,
          v_ts,
          true
        )
        returning alumno_curso_id into v_id;

        v_insertados := v_insertados + 1;
        perform staging._map_colegio(p_proceso_id, 'alumno_curso', v_alumno_id::text || ':' || v_curso_id::text, 'public.alumnos_cursos', v_id, true);
      end if;
    end;
  end loop;

  -- Apoderados + alumno_apoderado.
  for r in
    with rel as (
      select alumno_id_destino, rut_apoderado_1_raw as rut_ap, 'Principal' as tipo_ap from staging.stg_alumnos where proceso_id = p_proceso_id and nullif(trim(coalesce(rut_apoderado_1_raw, '')), '') is not null
      union all
      select alumno_id_destino, rut_apoderado_2_raw, 'Secundario' from staging.stg_alumnos where proceso_id = p_proceso_id and nullif(trim(coalesce(rut_apoderado_2_raw, '')), '') is not null
    )
    select *
    from rel
  loop
    select id_destino::integer
    into v_ref_id
    from staging.carga_map
    where proceso_id = p_proceso_id
      and entidad = 'persona'
      and tabla_destino = 'public.personas'
      and clave_origen = trim(r.rut_ap)
    limit 1;

    if v_ref_id is null then
      continue;
    end if;

    declare
      v_persona_id integer := v_ref_id;
      v_apoderado_id integer;
      v_alumno_id integer;
    begin
      select apoderado_id
      into v_apoderado_id
      from public.apoderados
      where persona_id = v_persona_id
        and colegio_id = v_colegio_id
      limit 1;

      v_created := false;
      if v_apoderado_id is null then
        insert into public.apoderados (
          persona_id,
          colegio_id,
          telefono_contacto1,
          telefono_contacto2,
          email_contacto1,
          email_contacto2,
          creado_por,
          actualizado_por,
          fecha_creacion,
          fecha_actualizacion,
          activo,
          perfil_completado,
          is_blocked
        ) values (
          v_persona_id,
          v_colegio_id,
          '',
          '',
          '',
          '',
          p_actor_id,
          p_actor_id,
          v_ts,
          v_ts,
          true,
          false,
          false
        )
        returning apoderado_id into v_apoderado_id;

        v_created := true;
        v_insertados := v_insertados + 1;
      else
        v_reutilizados := v_reutilizados + 1;
      end if;

      perform staging._map_colegio(p_proceso_id, 'apoderado', trim(r.rut_ap), 'public.apoderados', v_apoderado_id, v_created);

      -- Resolver alumno por mapa usando staging alumno.
      select cm.id_destino::integer
      into v_alumno_id
      from staging.carga_map cm
      join staging.stg_alumnos a on a.proceso_id = cm.proceso_id
      where cm.proceso_id = p_proceso_id
        and cm.entidad = 'alumno'
        and cm.tabla_destino = 'public.alumnos'
        and trim(a.rut_raw) = cm.clave_origen
        and (
          trim(a.rut_apoderado_1_raw) = trim(r.rut_ap)
          or trim(a.rut_apoderado_2_raw) = trim(r.rut_ap)
        )
      limit 1;

      if v_alumno_id is not null
         and not exists (
           select 1
           from public.alumnos_apoderados
           where alumno_id = v_alumno_id
             and apoderado_id = v_apoderado_id
         ) then
        insert into public.alumnos_apoderados (
          alumno_id,
          apoderado_id,
          tipo_apoderado,
          observaciones,
          estado_usuario,
          creado_por,
          actualizado_por,
          fecha_creacion,
          fecha_actualizacion,
          activo
        ) values (
          v_alumno_id,
          v_apoderado_id,
          r.tipo_ap,
          'Carga staging colegio',
          'activo',
          p_actor_id,
          p_actor_id,
          v_ts,
          v_ts,
          true
        )
        returning alumno_apoderado_id into v_id;

        v_insertados := v_insertados + 1;
        perform staging._map_colegio(p_proceso_id, 'alumno_apoderado', v_alumno_id::text || ':' || v_apoderado_id::text, 'public.alumnos_apoderados', v_id, true);
      end if;
    end;
  end loop;

  -- Aulas. Si docente no coincide por nombre con hoja Docentes/personas, se omite
  -- y queda logueado. Esto evita crear FK incorrecta.
  for r in
    select *
    from staging.stg_aulas
    where proceso_id = p_proceso_id
  loop
    declare
      v_curso_id integer;
      v_materia_id integer;
      v_docente_id integer;
    begin
      select id_destino::integer
      into v_curso_id
      from staging.carga_map
      where proceso_id = p_proceso_id
        and entidad = 'curso'
        and tabla_destino = 'public.cursos'
        and clave_origen = staging._norm_colegio(r.curso_raw)
      limit 1;

      select d.docente_id
      into v_docente_id
      from public.docentes d
      join public.personas p on p.persona_id = d.persona_id
      where d.colegio_id = v_colegio_id
        and staging._norm_colegio(p.nombres || ' ' || p.apellidos) = staging._norm_colegio(r.nombre_docente_raw)
      limit 1;

      if v_curso_id is null then
        v_omitidos := v_omitidos + 1;
        perform staging._log_colegio(p_proceso_id, 'stg_aulas', r.fila_excel, 'ALERTA', 'AULA_OMITIDA_SIN_CURSO', 'Curso de aula no resuelto.', r.curso_raw);
        continue;
      end if;

      if v_docente_id is null then
        v_omitidos := v_omitidos + 1;
        perform staging._log_colegio(p_proceso_id, 'stg_aulas', r.fila_excel, 'ALERTA', 'AULA_OMITIDA_SIN_DOCENTE', 'Docente de aula no coincide con personas/docentes migrados.', r.nombre_docente_raw);
        continue;
      end if;

      if staging._norm_colegio(r.materia_raw) = 'todas las asignaturas' then
        for r2 in
          select materia_id
          from public.materias
          where colegio_id = v_colegio_id
            and activo = true
        loop
          if not exists (
            select 1
            from public.aulas
            where curso_id = v_curso_id
              and colegio_id = v_colegio_id
              and materia_id = r2.materia_id
              and docente_id = v_docente_id
          ) then
            insert into public.aulas (
              curso_id,
              colegio_id,
              materia_id,
              docente_id,
              tipo_docente,
              creado_por,
              actualizado_por,
              fecha_creacion,
              fecha_actualizacion,
              activo
            ) values (
              v_curso_id,
              v_colegio_id,
              r2.materia_id,
              v_docente_id,
              left(coalesce(r.tipo_docente, r.tipo_docente_raw, 'Titular'), 15),
              p_actor_id,
              p_actor_id,
              v_ts,
              v_ts,
              true
            )
            returning aula_id into v_id;

            v_insertados := v_insertados + 1;
            perform staging._map_colegio(p_proceso_id, 'aula', r.fila_excel::text || ':' || r2.materia_id::text, 'public.aulas', v_id, true);
          end if;
        end loop;
      else
        select id_destino::integer
        into v_materia_id
        from staging.carga_map
        where proceso_id = p_proceso_id
          and entidad = 'materia'
          and tabla_destino = 'public.materias'
          and clave_origen = staging._norm_colegio(r.materia_raw)
        limit 1;

        if v_materia_id is null then
          v_omitidos := v_omitidos + 1;
          perform staging._log_colegio(p_proceso_id, 'stg_aulas', r.fila_excel, 'ALERTA', 'AULA_OMITIDA_SIN_MATERIA', 'Materia de aula no resuelta.', r.materia_raw);
          continue;
        end if;

        if not exists (
          select 1
          from public.aulas
          where curso_id = v_curso_id
            and colegio_id = v_colegio_id
            and materia_id = v_materia_id
            and docente_id = v_docente_id
        ) then
          insert into public.aulas (
            curso_id,
            colegio_id,
            materia_id,
            docente_id,
            tipo_docente,
            creado_por,
            actualizado_por,
            fecha_creacion,
            fecha_actualizacion,
            activo
          ) values (
            v_curso_id,
            v_colegio_id,
            v_materia_id,
            v_docente_id,
            left(coalesce(r.tipo_docente, r.tipo_docente_raw, 'Titular'), 15),
            p_actor_id,
            p_actor_id,
            v_ts,
            v_ts,
            true
          )
          returning aula_id into v_id;

          v_insertados := v_insertados + 1;
          perform staging._map_colegio(p_proceso_id, 'aula', r.fila_excel::text, 'public.aulas', v_id, true);
        end if;
      end if;
    end;
  end loop;
  update staging.carga_procesos
  set estado = 'CERRADO',
      etapa = 'migrado_public',
      cerrado_en = v_ts,
      actualizado_en = v_ts,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'migracion_final',
        jsonb_build_object(
          'colegio_id', v_colegio_id,
          'insertados', v_insertados,
          'reutilizados', v_reutilizados,
          'omitidos', v_omitidos,
          'fecha', v_ts
        )
      )
  where carga_procesos.proceso_id = p_proceso_id;

  return query
  select
    p_proceso_id,
    v_colegio_id,
    'CERRADO'::text,
    jsonb_build_object(
      'colegio_id', v_colegio_id,
      'insertados', v_insertados,
      'reutilizados', v_reutilizados,
      'omitidos', v_omitidos
    );
end;
$$;

comment on function staging.migrar_colegio_desde_staging(uuid, integer, boolean, integer, integer, integer)
is 'Migra proceso staging de colegio a tablas public con trazabilidad en staging.carga_map.';














