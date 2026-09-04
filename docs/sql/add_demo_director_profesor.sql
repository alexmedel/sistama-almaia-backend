begin;

lock table public.personas, public.usuario_rol in share row exclusive mode;

with
params as (
  select
    1::int actor_id,
    16::int colegio_id,
    62::int curso_id,
    4::int idioma_id,
    'Almaia2026'::text default_password,
    now() ts
),
input_personas as (
  select * from (values
    ('director', '99000007-0', 'Demo Director', 'Bernardo', 4, 5, 'director@demo.cl', 'Demo Director', 6),
    ('docente',  '99000008-9', 'Demo Profesor', 'Bernardo', 4, 5, 'profesor@demo.cl', 'Demo Profesor', 3)
  ) as x(tipo, rut, nombres, apellidos, genero_id, estado_civil_id, email, nombre_social, rol_id)
),
base_persona as (
  select coalesce(max(persona_id), 0) base_id from public.personas
),
missing_personas as (
  select b.base_id + row_number() over (order by i.rut) persona_id, i.*
  from input_personas i
  cross join base_persona b
  where not exists (
    select 1 from public.personas p
    where p.numero_documento = i.rut
  )
),
personas_ins as (
  insert into public.personas (
    persona_id, tipo_documento, numero_documento, nombres, apellidos,
    genero_id, estado_civil_id, creado_por, actualizado_por,
    fecha_creacion, fecha_actualizacion, activo, is_blocked
  )
  select
    m.persona_id, 'RUT', m.rut, m.nombres, m.apellidos,
    m.genero_id, m.estado_civil_id, p.actor_id, p.actor_id,
    p.ts, p.ts, true, false
  from missing_personas m, params p
  returning persona_id, numero_documento
),
personas_all as (
  select pi.persona_id, i.*
  from personas_ins pi
  join input_personas i on i.rut = pi.numero_documento
  union all
  select p.persona_id, i.*
  from input_personas i
  join public.personas p on p.numero_documento = i.rut
),
login_users as (
  select persona_id, email, nombre_social, nombres, apellidos, rol_id
  from personas_all
),
auth_upd as (
  update auth.users au
  set
    encrypted_password = crypt((select default_password from params), gen_salt('bf')),
    email_confirmed_at = coalesce(au.email_confirmed_at, (select ts from params)),
    updated_at = (select ts from params)
  where lower(au.email) in (select lower(email) from login_users)
  returning au.id, au.email
),
auth_ins as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  select
    null, gen_random_uuid(), 'authenticated', 'authenticated', lower(lu.email),
    crypt((select default_password from params), gen_salt('bf')),
    p.ts,
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('email', lower(lu.email), 'email_verified', true, 'phone_verified', false),
    p.ts, p.ts, '', '', '', '', '', '', '', '', false, false
  from login_users lu, params p
  where not exists (
    select 1 from auth.users au
    where lower(au.email) = lower(lu.email)
  )
  returning id, email
),
auth_all as (
  select distinct on (lower(email)) id, lower(email) email
  from (
    select id, email from auth_upd
    union all
    select id, email from auth_ins
    union all
    select au.id, au.email
    from auth.users au
    join login_users lu on lower(lu.email) = lower(au.email)
  ) x
  order by lower(email), id
),
identities_ins as (
  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  select
    aa.id::text,
    aa.id,
    jsonb_build_object(
      'sub', aa.id::text,
      'email', lower(aa.email),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    p.ts, p.ts, p.ts
  from auth_all aa, params p
  on conflict (provider_id, provider) do update
  set identity_data = excluded.identity_data,
      updated_at = excluded.updated_at
  returning user_id
),
usuarios_upd as (
  update public.usuarios u
  set
    auth_id = aa.id,
    persona_id = lu.persona_id,
    rol_id = lu.rol_id,
    nombre_social = lu.nombre_social,
    nombres = lu.nombres,
    apellidos = lu.apellidos,
    email = lower(lu.email),
    estado_usuario = 'Activo',
    actualizado_por = (select actor_id from params),
    fecha_actualizacion = (select ts from params),
    activo = true,
    is_blocked = false
  from login_users lu
  join auth_all aa on lower(aa.email) = lower(lu.email)
  where lower(u.email) = lower(lu.email)
  returning u.usuario_id, u.email, u.rol_id
),
usuarios_ins as (
  insert into public.usuarios (
    nombre_social, email, encripted_password, rol_id, telefono_contacto,
    ultimo_inicio_sesion, estado_usuario, intentos_inicio_sesion,
    url_foto_perfil, persona_id, creado_por, actualizado_por,
    fecha_creacion, fecha_actualizacion, activo, idioma_id, auth_id,
    clave_generada, biometria_activa, nombres, apellidos,
    nacionalidad_id, is_blocked
  )
  select
    lu.nombre_social, lower(lu.email), '', lu.rol_id, '',
    null, 'Activo', 0,
    '', lu.persona_id, p.actor_id, p.actor_id,
    p.ts, p.ts, true, p.idioma_id, aa.id,
    null, false, lu.nombres, lu.apellidos,
    1, false
  from login_users lu
  join auth_all aa on lower(aa.email) = lower(lu.email)
  cross join params p
  where not exists (
    select 1 from public.usuarios u
    where lower(u.email) = lower(lu.email)
  )
  returning usuario_id, email, rol_id
),
usuarios_all as (
  select usuario_id, email, rol_id from usuarios_upd
  union all
  select usuario_id, email, rol_id from usuarios_ins
  union all
  select u.usuario_id, u.email, u.rol_id
  from public.usuarios u
  join login_users lu on lower(lu.email) = lower(u.email)
),
usuarios_dist as (
  select distinct on (usuario_id, rol_id) usuario_id, email, rol_id
  from usuarios_all
  order by usuario_id, rol_id
),
base_usuario_rol as (
  select coalesce(max(usuario_rol_id), 0) base_id
  from public.usuario_rol
),
usuario_rol_missing as (
  select
    b.base_id + row_number() over (order by u.usuario_id) usuario_rol_id,
    u.usuario_id,
    u.rol_id
  from usuarios_dist u
  cross join base_usuario_rol b
  where not exists (
    select 1 from public.usuario_rol ur
    where ur.usuario_id = u.usuario_id
      and ur.rol_id = u.rol_id
  )
),
usuario_rol_ins as (
  insert into public.usuario_rol (usuario_rol_id, usuario_id, rol_id)
  select usuario_rol_id, usuario_id, rol_id
  from usuario_rol_missing
  returning usuario_rol_id
),
usuarios_colegios_ins as (
  insert into public.usuarios_colegios (
    usuario_id, colegio_id, rol_id, fecha_asignacion,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion, activo
  )
  select
    u.usuario_id, p.colegio_id, u.rol_id, p.ts,
    p.actor_id, p.actor_id, p.ts, p.ts, true
  from usuarios_dist u, params p
  where not exists (
    select 1 from public.usuarios_colegios uc
    where uc.usuario_id = u.usuario_id
      and uc.colegio_id = p.colegio_id
      and uc.rol_id = u.rol_id
  )
  returning usuarios_colegio_id
),
docentes_ins as (
  insert into public.docentes (
    persona_id, colegio_id, especialidad, estado,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion, activo
  )
  select
    pa.persona_id, p.colegio_id, 'Profesor jefe', 'activo',
    p.actor_id, p.actor_id, p.ts, p.ts, true
  from personas_all pa, params p
  where pa.tipo = 'docente'
    and not exists (
      select 1 from public.docentes d
      where d.persona_id = pa.persona_id
        and d.colegio_id = p.colegio_id
    )
  returning docente_id, persona_id
),
docentes_all as (
  select di.docente_id, di.persona_id from docentes_ins di
  union all
  select d.docente_id, d.persona_id
  from public.docentes d
  join personas_all pa on pa.persona_id = d.persona_id
  join params p on p.colegio_id = d.colegio_id
  where pa.tipo = 'docente'
),
docentes_cursos_ins as (
  insert into public.docentes_cursos (
    docente_id, curso_id, ano_escolar,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion, activo
  )
  select
    d.docente_id, p.curso_id, 2026,
    p.actor_id, p.actor_id, p.ts, p.ts, true
  from docentes_all d, params p
  where not exists (
    select 1 from public.docentes_cursos dc
    where dc.docente_id = d.docente_id
      and dc.curso_id = p.curso_id
      and dc.ano_escolar = 2026
  )
  returning docente_curso_id
)
select
  (select count(*) from usuarios_dist) usuarios_total,
  (select count(*) from auth_all) auth_total,
  (select count(*) from docentes_all) docentes_total,
  (select count(*) from docentes_cursos_ins) docentes_cursos_insertados;

insert into public.usuarios_cursos (
  usuarios_colegio_id, curso_id, fecha_asignacion,
  creado_por, actualizado_por, fecha_creacion, fecha_actualizacion, activo
)
select uc.usuarios_colegio_id, 62, now(), 1, 1, now(), now(), true
from public.usuarios_colegios uc
join public.usuarios u on u.usuario_id = uc.usuario_id
where lower(u.email) = 'profesor@demo.cl'
  and uc.colegio_id = 16
  and uc.rol_id = 3
  and not exists (
    select 1 from public.usuarios_cursos ucu
    where ucu.usuarios_colegio_id = uc.usuarios_colegio_id
      and ucu.curso_id = 62
  );

commit;
