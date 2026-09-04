create or replace function public.comparativa_emociones_alumno(
  p_alumno_id integer,
  p_emociones text[],
  p_peso_objetivo integer default 0,
  p_scope text default 'curso',
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_colegio_id integer default null
)
returns table (
  emocion text,
  conotacion_emocion text,
  color text,
  alumno_total numeric,
  grupo_promedio numeric,
  diferencia numeric,
  scope_tipo text,
  scope_id integer,
  scope_nombre text,
  curso_id integer,
  grado_id integer,
  nivel_educativo_id integer
)
language sql
as $$
with alumno_contexto as (
  select
    a.alumno_id,
    a.colegio_id,
    ac.curso_id,
    c.nombre_curso,
    c.grado_id,
    g.nombre as grado_nombre,
    c.nivel_educativo_id,
    ne.nombre as nivel_nombre
  from public.alumnos a
  join public.alumnos_cursos ac
    on ac.alumno_id = a.alumno_id
   and ac.activo is true
  join public.cursos c
    on c.curso_id = ac.curso_id
   and c.activo is true
  left join public.grados g
    on g.grado_id = c.grado_id
   and g.activo is true
  left join public.niveles_educativos ne
    on ne.nivel_educativo_id = c.nivel_educativo_id
   and ne.activo is true
  where a.alumno_id = p_alumno_id
    and a.activo is true
    and (p_colegio_id is null or a.colegio_id = p_colegio_id)
  order by ac.alumno_curso_id desc
  limit 1
),
emociones_input as (
  select
    trim(valor)::text as emocion,
    ord::integer as orden
  from unnest(p_emociones) with ordinality as t(valor, ord)
  where trim(valor) <> ''
),
emociones_metadata as (
  select distinct on (d.subcategoria)
    d.subcategoria as emocion,
    e.conotacion as conotacion_emocion,
    d.hex as color
  from public.diagnostico d
  join public.diagnostico_emocion_map dem
    on dem.diagnostico_id = d.diagnostico_id
   and dem.activo is true
  join public.emociones e
    on e.emocion_id = dem.emocion_id
   and e.activo is true
  where d.activo is true
    and d.categoria = 'Emoción'
  order by d.subcategoria, dem.emocion_id
),
scope_alumnos as (
  select distinct
    a.alumno_id
  from public.alumnos a
  join public.alumnos_cursos ac
    on ac.alumno_id = a.alumno_id
   and ac.activo is true
  join public.cursos c
    on c.curso_id = ac.curso_id
   and c.activo is true
  join alumno_contexto ctx
    on true
  where a.activo is true
    and a.colegio_id = ctx.colegio_id
    and (
      (p_scope = 'curso' and c.curso_id = ctx.curso_id)
      or (p_scope = 'grado' and c.grado_id = ctx.grado_id)
      or (p_scope = 'nivel' and c.nivel_educativo_id = ctx.nivel_educativo_id)
      or (p_scope = 'colegio')
    )
),
conteos_alumno as (
  select
    p.diagnostico as emocion,
    count(*)::numeric as total
  from public.alumnos_respuestas_seleccion ars
  join public.preguntas p
    on p.pregunta_id = ars.pregunta_id
   -- incluir respuestas historicas de preguntas desactivadas
   and p.tipo_concepto = 'Emociones'
  join public.respuestas_posibles_has_preguntas rphp
    on rphp.pregunta_id = ars.pregunta_id
   and rphp.respuesta_posible_id = ars.respuesta_posible_id
   and rphp.activo is true
  where ars.alumno_id = p_alumno_id
    and ars.activo is true
    and ars.respondio is true
    and ars.tipo_concepto = 'Emociones'
    and p.diagnostico in (select emocion from emociones_input)
    and rphp.peso = p_peso_objetivo
    and (p_fecha_desde is null or ars.fecha_pregunta::date >= p_fecha_desde)
    and (p_fecha_hasta is null or ars.fecha_pregunta::date <= p_fecha_hasta)
  group by p.diagnostico
),
conteos_scope_por_alumno as (
  select
    sa.alumno_id,
    ei.emocion,
    coalesce(c.total, 0)::numeric as total
  from scope_alumnos sa
  cross join emociones_input ei
  left join (
    select
      ars.alumno_id,
      p.diagnostico as emocion,
      count(*)::numeric as total
    from public.alumnos_respuestas_seleccion ars
    join public.preguntas p
      on p.pregunta_id = ars.pregunta_id
     -- incluir respuestas historicas de preguntas desactivadas
     and p.tipo_concepto = 'Emociones'
    join public.respuestas_posibles_has_preguntas rphp
      on rphp.pregunta_id = ars.pregunta_id
     and rphp.respuesta_posible_id = ars.respuesta_posible_id
     and rphp.activo is true
    join scope_alumnos sa2
      on sa2.alumno_id = ars.alumno_id
    where ars.activo is true
      and ars.respondio is true
      and ars.tipo_concepto = 'Emociones'
      and p.diagnostico in (select emocion from emociones_input)
      and rphp.peso = p_peso_objetivo
      and (p_fecha_desde is null or ars.fecha_pregunta::date >= p_fecha_desde)
      and (p_fecha_hasta is null or ars.fecha_pregunta::date <= p_fecha_hasta)
    group by ars.alumno_id, p.diagnostico
  ) c
    on c.alumno_id = sa.alumno_id
   and c.emocion = ei.emocion
),
promedios_scope as (
  select
    emocion,
    avg(total)::numeric as grupo_promedio
  from conteos_scope_por_alumno
  group by emocion
)
select
  ei.emocion,
  em.conotacion_emocion,
  em.color,
  coalesce(ca.total, 0)::numeric as alumno_total,
  coalesce(ps.grupo_promedio, 0)::numeric as grupo_promedio,
  coalesce(ca.total, 0)::numeric - coalesce(ps.grupo_promedio, 0)::numeric as diferencia,
  p_scope::text as scope_tipo,
  case
    when p_scope = 'curso' then ctx.curso_id
    when p_scope = 'grado' then ctx.grado_id
    when p_scope = 'nivel' then ctx.nivel_educativo_id
    else ctx.colegio_id
  end as scope_id,
  case
    when p_scope = 'curso' then ctx.nombre_curso
    when p_scope = 'grado' then ctx.grado_nombre
    when p_scope = 'nivel' then ctx.nivel_nombre
    else ctx.colegio_id::text
  end as scope_nombre,
  ctx.curso_id,
  ctx.grado_id,
  ctx.nivel_educativo_id
from emociones_input ei
join alumno_contexto ctx
  on true
left join emociones_metadata em
  on em.emocion = ei.emocion
left join conteos_alumno ca
  on ca.emocion = ei.emocion
left join promedios_scope ps
  on ps.emocion = ei.emocion
order by ei.orden;
$$;
