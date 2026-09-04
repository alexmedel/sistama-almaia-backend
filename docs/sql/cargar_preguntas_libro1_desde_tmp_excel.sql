begin;

-- Requiere public.tmp_excel cargada con:
-- fecha, turno, concepto, subconcepto, pregunta, respuesta1..respuesta6.
-- Esta carga reemplaza preguntas activas en el rango/turno/conceptos de tmp_excel.

-- 0) Validar staging.
do $$
declare
  v_incompletas integer;
  v_invalidos integer;
  v_filas integer;
begin
  select
    count(*)::int,
    count(*) filter (
      where fecha is null or trim(fecha) = ''
         or turno is null or trim(turno) = ''
         or concepto is null or trim(concepto) = ''
         or subconcepto is null or trim(subconcepto) = ''
         or pregunta is null or trim(pregunta) = ''
         or respuesta1 is null or trim(respuesta1) = ''
         or respuesta2 is null or trim(respuesta2) = ''
         or respuesta3 is null or trim(respuesta3) = ''
         or respuesta4 is null or trim(respuesta4) = ''
         or respuesta5 is null or trim(respuesta5) = ''
         or respuesta6 is null or trim(respuesta6) = ''
    )::int,
    count(*) filter (
      where trim(concepto) not in ('Emociones', 'Patologica', 'Neurodivergencia')
    )::int
  into v_filas, v_incompletas, v_invalidos
  from public.tmp_excel;

  if v_filas = 0 then
    raise exception 'tmp_excel está vacía';
  end if;

  if v_incompletas > 0 then
    raise exception 'tmp_excel tiene % filas incompletas', v_incompletas;
  end if;

  if v_invalidos > 0 then
    raise exception 'tmp_excel tiene % conceptos inválidos', v_invalidos;
  end if;
end $$;

-- 1) Backup rápido de preguntas activas que serán reemplazadas.
do $$
declare
  backup_name text := 'preguntas_backup_libro1_' || to_char(now(), 'YYYYMMDD_HH24MISS');
begin
  execute format(
    'create table public.%I as
     with src as (
       select
         to_date(replace(trim(fecha), ''-'', ''/''), ''DD/MM/YYYY'') as fecha_pregunta,
         upper(trim(turno)) as horario
       from public.tmp_excel
     ), scope as (
       select min(fecha_pregunta) min_fecha, max(fecha_pregunta) max_fecha from src
     )
     select p.*
     from public.preguntas p, scope s
     where p.activo = true
       and p.fecha_pregunta between s.min_fecha and s.max_fecha
       and upper(trim(p.horario)) in (select distinct horario from src)
       and trim(p.tipo_concepto) in (''Emociones'', ''Patologica'', ''Neurodivergencia'')
       and p.pregunta_grado_id between 1 and 12',
    backup_name
  );
end $$;

-- 2) Desactivar preguntas activas existentes en el mismo alcance.
with src as (
  select
    to_date(replace(trim(fecha), '-', '/'), 'DD/MM/YYYY') as fecha_pregunta,
    upper(trim(turno)) as horario
  from public.tmp_excel
), scope as (
  select min(fecha_pregunta) min_fecha, max(fecha_pregunta) max_fecha from src
), deactivated as (
  update public.preguntas p
  set
    activo = false,
    fecha_actualizacion = now(),
    actualizado_por = 1
  from scope s
  where p.activo = true
    and p.fecha_pregunta between s.min_fecha and s.max_fecha
    and upper(trim(p.horario)) in (select distinct horario from src)
    and trim(p.tipo_concepto) in ('Emociones', 'Patologica', 'Neurodivergencia')
    and p.pregunta_grado_id between 1 and 12
  returning p.pregunta_id
)
select count(*) as preguntas_desactivadas
from deactivated;

-- 3) Insertar nueva tanda completa: cada fila de tmp_excel para grados 1..12.
with src as (
  select
    row_number() over (order by id_temp) as source_row,
    to_date(replace(trim(fecha), '-', '/'), 'DD/MM/YYYY') as fecha_pregunta,
    upper(trim(turno)) as horario,
    trim(concepto) as tipo_concepto,
    trim(subconcepto) as diagnostico,
    trim(pregunta) as texto_pregunta,
    trim(respuesta1) as respuesta1,
    trim(respuesta2) as respuesta2,
    trim(respuesta3) as respuesta3,
    trim(respuesta4) as respuesta4,
    trim(respuesta5) as respuesta5,
    trim(respuesta6) as respuesta6
  from public.tmp_excel
), expanded as (
  select
    s.*,
    g.pregunta_grado_id,
    case when g.pregunta_grado_id between 1 and 8 then 1 else 2 end as nivel_educativo_id,
    case
      when s.tipo_concepto = 'Emociones' then 'Primera'
      when s.tipo_concepto = 'Patologica' then 'Segunda'
      when s.tipo_concepto = 'Neurodivergencia' then 'Tercera'
    end as grupo_preguntas
  from src s
  cross join generate_series(1, 12) as g(pregunta_grado_id)
), inserted_questions as (
  insert into public.preguntas (
    tipo_pregunta_id,
    nivel_educativo_id,
    diagnostico,
    sintomas,
    grupo_preguntas,
    palabra_clave,
    horario,
    texto_pregunta,
    creado_por,
    fecha_creacion,
    actualizado_por,
    fecha_actualizacion,
    template_code,
    tipo_concepto,
    fecha_pregunta,
    quien_es,
    pregunta_grado_id,
    activo
  )
  select
    1,
    nivel_educativo_id,
    diagnostico,
    '',
    grupo_preguntas,
    '',
    horario,
    texto_pregunta,
    1,
    now(),
    1,
    now(),
    'Template_' || tipo_concepto,
    tipo_concepto,
    fecha_pregunta,
    1,
    pregunta_grado_id,
    true
  from expanded
  returning pregunta_id, fecha_pregunta, horario, tipo_concepto, diagnostico, texto_pregunta, pregunta_grado_id
), answer_source as (
  select iq.pregunta_id, v.nombre, v.peso
  from inserted_questions iq
  join expanded e
    on e.fecha_pregunta = iq.fecha_pregunta
   and e.horario = iq.horario
   and e.tipo_concepto = iq.tipo_concepto
   and e.diagnostico = iq.diagnostico
   and e.texto_pregunta = iq.texto_pregunta
   and e.pregunta_grado_id = iq.pregunta_grado_id
  cross join lateral (values
    (e.respuesta1, 0),
    (e.respuesta2, 0),
    (e.respuesta3, 1),
    (e.respuesta4, 1),
    (e.respuesta5, 2),
    (e.respuesta6, 2)
  ) as v(nombre, peso)
), inserted_answers as (
  insert into public.respuestas_posibles (nombre, creado_por)
  select distinct a.nombre, 1
  from answer_source a
  where a.nombre is not null
    and trim(a.nombre) <> ''
    and not exists (
      select 1
      from public.respuestas_posibles rp
      where trim(rp.nombre) = trim(a.nombre)
    )
  returning respuesta_posible_id, nombre
), all_answers as (
  select respuesta_posible_id, nombre from inserted_answers
  union
  select rp.respuesta_posible_id, rp.nombre
  from public.respuestas_posibles rp
  where exists (
    select 1
    from answer_source a
    where trim(a.nombre) = trim(rp.nombre)
  )
), inserted_links as (
  insert into public.respuestas_posibles_has_preguntas (
    respuesta_posible_id,
    pregunta_id,
    creado_por,
    actualizado_por,
    fecha_creacion,
    fecha_actualizacion,
    activo,
    peso
  )
  select
    aa.respuesta_posible_id,
    a.pregunta_id,
    1,
    1,
    now(),
    now(),
    true,
    a.peso
  from answer_source a
  join all_answers aa on trim(aa.nombre) = trim(a.nombre)
  returning pregunta_id, respuesta_posible_id
)
select
  (select count(*) from inserted_questions) as preguntas_insertadas,
  (select count(*) from inserted_answers) as respuestas_posibles_nuevas,
  (select count(*) from inserted_links) as relaciones_insertadas;

-- 4) Validación post-insert: debe ser 0.
select
  count(*) as preguntas_sin_6_respuestas
from (
  select p.pregunta_id, count(rphp.respuesta_posible_id) as total_respuestas
  from public.preguntas p
  left join public.respuestas_posibles_has_preguntas rphp
    on rphp.pregunta_id = p.pregunta_id
  where p.activo = true
    and p.fecha_pregunta between
      (select min(to_date(replace(trim(fecha), '-', '/'), 'DD/MM/YYYY')) from public.tmp_excel)
      and
      (select max(to_date(replace(trim(fecha), '-', '/'), 'DD/MM/YYYY')) from public.tmp_excel)
    and upper(trim(p.horario)) in (select distinct upper(trim(turno)) from public.tmp_excel)
    and trim(p.tipo_concepto) in ('Emociones', 'Patologica', 'Neurodivergencia')
    and p.pregunta_grado_id between 1 and 12
  group by p.pregunta_id
  having count(rphp.respuesta_posible_id) <> 6
) q;

commit;
