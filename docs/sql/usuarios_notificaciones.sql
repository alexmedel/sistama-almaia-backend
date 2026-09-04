-- Usuario notification ledger for app inbox and push delivery state.
-- Safe additive migration: keeps avisos_apps and aviso_destinatarios for compatibility.

create table if not exists public.usuarios_notificaciones (
  usuario_notificacion_id serial primary key,
  aviso_id integer not null references public.avisos_apps(aviso_id),
  usuario_id integer not null references public.usuarios(usuario_id),
  estado varchar(20) not null default 'pendiente'
    check (estado in ('pendiente', 'enviado', 'recibido', 'leido', 'fallido', 'sin_token')),
  cantidad_intentos integer not null default 0,
  fecha_envio timestamp without time zone null,
  fecha_recibido timestamp without time zone null,
  fecha_leido timestamp without time zone null,
  error_envio text null,
  creado_por integer null,
  actualizado_por integer null,
  fecha_creacion timestamp without time zone not null default now(),
  fecha_actualizacion timestamp without time zone not null default now(),
  activo boolean not null default true,
  constraint usuarios_notificaciones_aviso_usuario_uk unique (aviso_id, usuario_id)
);

create index if not exists idx_usuarios_notificaciones_usuario
  on public.usuarios_notificaciones (usuario_id, fecha_creacion desc);

create index if not exists idx_usuarios_notificaciones_pendientes
  on public.usuarios_notificaciones (estado, cantidad_intentos)
  where activo = true;

create or replace function public.crear_aviso_app(
  p_aviso_tipos_id integer,
  p_tipo_objetivo text,
  p_dirigido_a text,
  p_ids integer[],
  p_titulo text,
  p_contenido text,
  p_fecha_programacion timestamp without time zone,
  p_ruta_archivo text
)
returns bigint
language plpgsql
as $function$
declare
  v_aviso_id bigint;
begin
  insert into public.avisos_apps (
    aviso_tipos_id,
    aviso_titulo,
    aviso_contenido,
    aviso_fecha_programacion,
    aviso_ruta_archivo,
    aviso_activo
  )
  values (
    p_aviso_tipos_id,
    p_titulo,
    p_contenido,
    p_fecha_programacion,
    p_ruta_archivo,
    true
  )
  returning aviso_id into v_aviso_id;

  create temp table tmp_aviso_destinatarios on commit drop as
  select distinct d.destinatario_tipo, d.destinatario_id
  from (
    select * from obtener_destinatarios_por_alumno(p_ids, p_dirigido_a)
      where p_tipo_objetivo = 'alumno'
    union all
    select * from obtener_destinatarios_por_curso(p_ids, p_dirigido_a)
      where p_tipo_objetivo = 'curso'
    union all
    select * from obtener_destinatarios_por_grado(p_ids, p_dirigido_a)
      where p_tipo_objetivo = 'grado'
    union all
    select * from obtener_destinatarios_por_colegio(p_ids, p_dirigido_a)
      where p_tipo_objetivo = 'colegio'
  ) d;

  insert into public.aviso_destinatarios (
    aviso_id,
    destinatario_tipo,
    destinatario_id,
    cantidad_intentos
  )
  select
    v_aviso_id,
    d.destinatario_tipo,
    d.destinatario_id,
    0
  from tmp_aviso_destinatarios d;

  insert into public.usuarios_notificaciones (
    aviso_id,
    usuario_id,
    estado,
    cantidad_intentos
  )
  select distinct
    v_aviso_id,
    u.usuario_id,
    case
      when u.expo_push_token is null or btrim(u.expo_push_token) = '' then 'sin_token'
      else 'pendiente'
    end,
    0
  from tmp_aviso_destinatarios d
  left join public.alumnos al
    on d.destinatario_tipo = 'alumno'
   and al.alumno_id = d.destinatario_id
  left join public.apoderados ap
    on d.destinatario_tipo = 'apoderado'
   and ap.apoderado_id = d.destinatario_id
  join public.usuarios u
    on (
      d.destinatario_tipo = 'alumno'
      and u.persona_id = al.persona_id
    )
    or (
      d.destinatario_tipo = 'apoderado'
      and u.persona_id = ap.persona_id
    )
  where u.activo = true
  on conflict (aviso_id, usuario_id) do nothing;

  return v_aviso_id;
end;
$function$;

create or replace function public.obtener_usuarios_notificaciones_pendientes()
returns table (
  usuario_notificacion_id integer,
  aviso_id integer,
  usuario_id integer,
  expo_push_token text,
  aviso_titulo text,
  aviso_contenido text,
  cantidad_intentos integer
)
language plpgsql
as $function$
begin
  return query
  select
    un.usuario_notificacion_id,
    un.aviso_id,
    un.usuario_id,
    u.expo_push_token::text,
    a.aviso_titulo::text,
    a.aviso_contenido::text,
    un.cantidad_intentos
  from public.usuarios_notificaciones un
  join public.avisos_apps a on a.aviso_id = un.aviso_id
  join public.usuarios u on u.usuario_id = un.usuario_id
  where un.activo = true
    and a.aviso_activo = true
    and un.estado = 'pendiente'
    and un.cantidad_intentos < 3
    and u.expo_push_token is not null
    and btrim(u.expo_push_token) <> ''
    and (
      a.aviso_fecha_programacion is null
      or a.aviso_fecha_programacion <= now()
    );
end;
$function$;

drop function if exists public.listar_mis_notificaciones_usuario(integer);

create or replace function public.listar_mis_notificaciones_usuario(
  p_usuario_id integer
)
returns table (
  usuario_notificacion_id integer,
  aviso_id integer,
  aviso_titulo text,
  aviso_contenido text,
  aviso_ruta_archivo text,
  estado text,
  fecha_creacion timestamp with time zone,
  fecha_envio timestamp with time zone,
  fecha_recibido timestamp with time zone,
  fecha_leido timestamp with time zone,
  leido boolean
)
language plpgsql
security definer
as $function$
begin
  return query
  select
    un.usuario_notificacion_id,
    un.aviso_id,
    a.aviso_titulo::text,
    a.aviso_contenido::text,
    a.aviso_ruta_archivo::text,
    un.estado::text,
    un.fecha_creacion::timestamp with time zone,
    un.fecha_envio::timestamp with time zone,
    un.fecha_recibido::timestamp with time zone,
    un.fecha_leido::timestamp with time zone,
    (un.fecha_leido is not null)::boolean
  from public.usuarios_notificaciones un
  join public.avisos_apps a on a.aviso_id = un.aviso_id
  where un.usuario_id = p_usuario_id
    and un.activo = true
    and a.aviso_activo = true
    and (
      a.aviso_fecha_programacion is null
      or a.aviso_fecha_programacion <= now()
    )
  order by un.usuario_notificacion_id desc;
end;
$function$;

create or replace function public.marcar_usuario_notificacion_leida(
  p_usuario_notificacion_id integer,
  p_usuario_id integer
)
returns boolean
language plpgsql
security definer
as $function$
begin
  update public.usuarios_notificaciones
  set
    estado = 'leido',
    fecha_leido = coalesce(fecha_leido, now()),
    fecha_actualizacion = now()
  where usuario_notificacion_id = p_usuario_notificacion_id
    and usuario_id = p_usuario_id
    and activo = true;

  return found;
end;
$function$;

insert into public.usuarios_notificaciones (
  aviso_id,
  usuario_id,
  estado,
  cantidad_intentos,
  fecha_envio,
  fecha_recibido,
  fecha_leido,
  error_envio,
  fecha_creacion,
  fecha_actualizacion,
  activo
)
select distinct
  ad.aviso_id,
  u.usuario_id,
  case
    when ad.fecha_leido is not null then 'leido'
    when ad.fecha_recibido is not null then 'recibido'
    when ad.fecha_envio is not null then 'enviado'
    when u.expo_push_token is null or btrim(u.expo_push_token) = '' then 'sin_token'
    else 'pendiente'
  end,
  coalesce(ad.cantidad_intentos, 0),
  ad.fecha_envio,
  ad.fecha_recibido,
  ad.fecha_leido,
  null,
  now(),
  now(),
  true
from public.aviso_destinatarios ad
left join public.alumnos al
  on ad.destinatario_tipo = 'alumno'
 and al.alumno_id = ad.destinatario_id
left join public.apoderados ap
  on ad.destinatario_tipo = 'apoderado'
 and ap.apoderado_id = ad.destinatario_id
join public.usuarios u
  on (
    ad.destinatario_tipo = 'alumno'
    and u.persona_id = al.persona_id
  )
  or (
    ad.destinatario_tipo = 'apoderado'
    and u.persona_id = ap.persona_id
  )
where ad.aviso_id is not null
  and u.activo = true
on conflict (aviso_id, usuario_id) do nothing;
