create table if not exists public.diagnostico_emocion_map (
  diagnostico_id integer primary key references public.diagnostico(diagnostico_id),
  emocion_id integer not null references public.emociones(emocion_id),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

insert into public.diagnostico_emocion_map (diagnostico_id, emocion_id)
select d.diagnostico_id, e.emocion_id
from public.diagnostico d
join public.emociones e
  on lower(translate(d.subcategoria, 'áéíóúÁÉÍÓÚ', 'aeiouaeiou')) =
     lower(translate(e.nombre, 'áéíóúÁÉÍÓÚ', 'aeiouaeiou'))
where d.activo is true
  and d.categoria = 'Emoción'
  and e.activo is true
on conflict (diagnostico_id) do update
set emocion_id = excluded.emocion_id,
    activo = true,
    fecha_actualizacion = now();

insert into public.diagnostico_emocion_map (diagnostico_id, emocion_id)
select d.diagnostico_id, e.emocion_id
from public.diagnostico d
join public.emociones e
  on d.subcategoria = 'Calma'
 and e.nombre = 'Tranquilidad'
where d.activo is true
  and d.categoria = 'Emoción'
  and e.activo is true
on conflict (diagnostico_id) do update
set emocion_id = excluded.emocion_id,
    activo = true,
    fecha_actualizacion = now();

insert into public.diagnostico_emocion_map (diagnostico_id, emocion_id)
select d.diagnostico_id, e.emocion_id
from public.diagnostico d
join public.emociones e
  on d.subcategoria = 'Enojo/Rabia'
 and e.nombre = 'Enojo'
where d.activo is true
  and d.categoria = 'Emoción'
  and e.activo is true
on conflict (diagnostico_id) do update
set emocion_id = excluded.emocion_id,
    activo = true,
    fecha_actualizacion = now();

create or replace function public.top_diagnosticos_por_connotacion_emocion(
  p_limit integer default 5,
  p_conotaciones text[] default array['Negativa'::text],
  p_fecha date default current_date,
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
      case
        when r.peso = 0 then 'Positiva'
        when r.peso = 1 then 'Neutra'
        when r.peso = 2 then 'Negativa'
        else 'Sin clasificar'
      end as tono_respuesta,
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
      and ars.fecha_pregunta <= p_fecha
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
