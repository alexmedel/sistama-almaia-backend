drop function if exists public.top_diagnosticos_alumno_por_connotacion_emocion(integer, integer, text[], date, date, integer);

create or replace function public.top_diagnosticos_alumno_por_connotacion_emocion(
  p_alumno_id integer,
  p_limit integer default 5,
  p_conotaciones text[] default array['Negativa'::text],
  p_fecha_desde date default (current_date - interval '2 years')::date,
  p_fecha_hasta date default current_date,
  p_colegio_id integer default null::integer
)
returns table(
  diagnostico text,
  conotacion_emocion text,
  color text,
  total_respuestas bigint,
  respuestas_positivas bigint,
  respuestas_neutras bigint,
  respuestas_negativas bigint,
  cantidad_preguntas bigint
)
language plpgsql
as $function$
begin
  return query
  with respuestas_base as (
    select
      d.subcategoria::text as diagnostico,
      e.conotacion::text as conotacion_emocion,
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
     and p.tipo_concepto = 'Emociones'
    join public.diagnostico d
      on d.subcategoria = p.diagnostico
     and d.activo is true
     and d.categoria = 'Emoción'
    join public.diagnostico_emocion_map dem
      on dem.diagnostico_id = d.diagnostico_id
     and dem.activo is true
    join public.emociones e
      on e.emocion_id = dem.emocion_id
     and e.activo is true
    join public.respuestas_posibles_has_preguntas r
      on r.pregunta_id = ars.pregunta_id
     and r.respuesta_posible_id = ars.respuesta_posible_id
     and r.activo is true
    where ars.respondio is true
      and ars.activo is true
      and ars.tipo_concepto = 'Emociones'
      and ars.fecha_pregunta between p_fecha_desde and p_fecha_hasta
      and ars.alumno_id = p_alumno_id
      and (p_colegio_id is null or a.colegio_id = p_colegio_id)
  )
  select
    rb.diagnostico,
    rb.conotacion_emocion,
    rb.color,
    count(*) as total_respuestas,
    sum(case when rb.peso = 0 then 1 else 0 end) as respuestas_positivas,
    sum(case when rb.peso = 1 then 1 else 0 end) as respuestas_neutras,
    sum(case when rb.peso = 2 then 1 else 0 end) as respuestas_negativas,
    count(distinct rb.pregunta_id) as cantidad_preguntas
  from respuestas_base rb
  where rb.conotacion_emocion = any(p_conotaciones)
  group by rb.diagnostico, rb.conotacion_emocion, rb.color
  order by total_respuestas desc, rb.diagnostico asc
  limit p_limit;
end;
$function$;
