drop function if exists public.top_diagnosticos_alumno_por_tipo_concepto(integer, integer, text, date, date, integer);

create or replace function public.top_diagnosticos_alumno_por_tipo_concepto(
  p_alumno_id integer,
  p_tipo_concepto text,
  p_limit integer default 5,
  p_fecha_desde date default (current_date - interval '2 years')::date,
  p_fecha_hasta date default current_date,
  p_colegio_id integer default null::integer
)
returns table(
  diagnostico text,
  color text,
  total_respuestas bigint,
  respuestas_positivas bigint,
  respuestas_neutras bigint,
  respuestas_negativas bigint,
  cantidad_preguntas bigint
)
language plpgsql
as $function$
declare
  v_categoria text;
begin
  v_categoria :=
    case
      when p_tipo_concepto = 'Patologica' then 'Patología'
      when p_tipo_concepto = 'Neurodivergencia' then 'Neurodivergencia'
      else null
    end;

  if v_categoria is null then
    raise exception 'Tipo concepto no soportado: %', p_tipo_concepto;
  end if;

  return query
  with respuestas_base as (
    select
      d.subcategoria::text as diagnostico,
      d.hex::text as color,
      r.peso,
      p.pregunta_id
    from public.alumnos_respuestas_seleccion ars
    join public.alumnos a
      on a.alumno_id = ars.alumno_id
     and a.activo is true
    join public.preguntas p
      on p.pregunta_id = ars.pregunta_id
     and p.activo is true
     and p.tipo_concepto = p_tipo_concepto
    join public.diagnostico d
      on d.subcategoria = p.diagnostico
     and d.activo is true
     and d.categoria = v_categoria
    join public.respuestas_posibles_has_preguntas r
      on r.pregunta_id = ars.pregunta_id
     and r.respuesta_posible_id = ars.respuesta_posible_id
     and r.activo is true
    where ars.respondio is true
      and ars.activo is true
      and ars.tipo_concepto = p_tipo_concepto
      and ars.fecha_pregunta between p_fecha_desde and p_fecha_hasta
      and ars.alumno_id = p_alumno_id
      and (p_colegio_id is null or a.colegio_id = p_colegio_id)
  )
  select
    rb.diagnostico,
    rb.color,
    count(*) as total_respuestas,
    sum(case when rb.peso = 0 then 1 else 0 end) as respuestas_positivas,
    sum(case when rb.peso = 1 then 1 else 0 end) as respuestas_neutras,
    sum(case when rb.peso = 2 then 1 else 0 end) as respuestas_negativas,
    count(distinct rb.pregunta_id) as cantidad_preguntas
  from respuestas_base rb
  group by rb.diagnostico, rb.color
  order by total_respuestas desc, rb.diagnostico asc
  limit p_limit;
end;
$function$;
