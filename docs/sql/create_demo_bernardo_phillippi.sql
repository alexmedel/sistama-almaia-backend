begin;

lock table public.personas, public.usuario_rol in share row exclusive mode;

with
params as (
  select
    1::int actor_id,
    1::int pais_id,
    14::int region_id,
    4::int idioma_id,
    'Almaia2026'::text default_password,
    now() ts
),
comuna_ins as (
  insert into public.comunas (
    nombre, region_id, pais_id, creado_por, actualizado_por,
    fecha_creacion, fecha_actualizacion
  )
  select 'Frutillar', p.region_id, p.pais_id, p.actor_id, p.actor_id, p.ts, p.ts
  from params p
  where not exists (
    select 1
    from public.comunas c
    where lower(c.nombre) = lower('Frutillar')
      and c.region_id = p.region_id
      and c.pais_id = p.pais_id
  )
  returning comuna_id, region_id, pais_id
),
comuna as (
  select comuna_id, region_id, pais_id from comuna_ins
  union all
  select c.comuna_id, c.region_id, c.pais_id
  from public.comunas c, params p
  where lower(c.nombre) = lower('Frutillar')
    and c.region_id = p.region_id
    and c.pais_id = p.pais_id
  limit 1
),
colegio_ins as (
  insert into public.colegios (
    nombre, nombre_fantasia, tipo_colegio, dependencia, sitio_web,
    direccion, telefono_contacto, correo_electronico,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion,
    activo, comuna_id, region_id, pais_id,
    correo_sos, correo_denuncia, permitir_anonimo, forzar_identificacion,
    zona_horaria
  )
  select
    'Demo Bernardo Phillippi', 'Demo Bernardo Phillippi', 'Colegio', 'Demo', '',
    'Frutillar', '+56000000000', 'contacto@demo-bernardo.cl',
    p.actor_id, p.actor_id, p.ts, p.ts,
    true, c.comuna_id, c.region_id, c.pais_id,
    'sos@demo-bernardo.cl', 'denuncias@demo-bernardo.cl', true, false,
    'America/Santiago'
  from params p, comuna c
  where not exists (
    select 1 from public.colegios co
    where lower(co.nombre_fantasia) = lower('Demo Bernardo Phillippi')
  )
  returning colegio_id
),
colegio as (
  select colegio_id from colegio_ins
  union all
  select colegio_id
  from public.colegios
  where lower(nombre_fantasia) = lower('Demo Bernardo Phillippi')
  limit 1
),
nivel_ins as (
  insert into public.niveles_educativos (
    nombre, creado_por, actualizado_por, fecha_actualizacion,
    fecha_creacion, activo, colegio_id, nivel
  )
  select 'Básica', p.actor_id, p.actor_id, p.ts, p.ts, true, co.colegio_id, 2
  from params p, colegio co
  where not exists (
    select 1 from public.niveles_educativos n
    where n.colegio_id = co.colegio_id
      and lower(n.nombre) = lower('Básica')
  )
  returning nivel_educativo_id
),
nivel as (
  select nivel_educativo_id from nivel_ins
  union all
  select n.nivel_educativo_id
  from public.niveles_educativos n, colegio co
  where n.colegio_id = co.colegio_id
    and lower(n.nombre) = lower('Básica')
  limit 1
),
grado_ins as (
  insert into public.grados (
    nombre, creado_por, actualizado_por, fecha_actualizacion,
    fecha_creacion, estado, nivel_educativo_id, colegio_id, activo
  )
  select
    '8° básico', p.actor_id, p.actor_id, p.ts, p.ts, 'activo',
    n.nivel_educativo_id, co.colegio_id, true
  from params p, nivel n, colegio co
  where not exists (
    select 1 from public.grados g
    where g.colegio_id = co.colegio_id
      and g.nivel_educativo_id = n.nivel_educativo_id
      and lower(g.nombre) = lower('8° básico')
  )
  returning grado_id
),
grado as (
  select grado_id from grado_ins
  union all
  select g.grado_id
  from public.grados g, nivel n, colegio co
  where g.colegio_id = co.colegio_id
    and g.nivel_educativo_id = n.nivel_educativo_id
    and lower(g.nombre) = lower('8° básico')
  limit 1
),
curso_ins as (
  insert into public.cursos (
    nombre_curso, colegio_id, grado_id, nivel_educativo_id,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion, activo
  )
  select
    '8° básico A', co.colegio_id, g.grado_id, n.nivel_educativo_id,
    p.actor_id, p.actor_id, p.ts, p.ts, true
  from params p, colegio co, grado g, nivel n
  where not exists (
    select 1 from public.cursos cu
    where cu.colegio_id = co.colegio_id
      and lower(cu.nombre_curso) = lower('8° básico A')
  )
  returning curso_id
),
curso as (
  select curso_id from curso_ins
  union all
  select cu.curso_id
  from public.cursos cu, colegio co
  where cu.colegio_id = co.colegio_id
    and lower(cu.nombre_curso) = lower('8° básico A')
  limit 1
),
input_personas as (
  select * from (values
    ('apoderado', '16319536-4', 'Daniela Consuelo', 'Vivanco Peña', 2, 5, 'daniela.vivanco14@gmail.com', 'Daniela Consuelo Vivanco Peña', 4),
    ('alumno', '24129086-7', 'Camilo', 'Vásquez Vivanco', 1, 5, 'camilo.vasquez@demo.cl', 'Camilo Vásquez Vivanco', 2),
    ('alumno', '99000001-1', 'Demo Alumno 1', 'Bernardo', 4, 5, 'alumno1@demo.cl', 'Demo Alumno 1', 2),
    ('alumno', '99000002-K', 'Demo Alumno 2', 'Bernardo', 4, 5, 'alumno2@demo.cl', 'Demo Alumno 2', 2),
    ('alumno', '99000003-8', 'Demo Alumno 3', 'Bernardo', 4, 5, 'alumno3@demo.cl', 'Demo Alumno 3', 2),
    ('apoderado', '99000004-6', 'Demo Apoderado 1', 'Bernardo', 4, 5, 'apoderado1@demo.cl', 'Demo Apoderado 1', 4),
    ('apoderado', '99000005-4', 'Demo Apoderado 2', 'Bernardo', 4, 5, 'apoderado2@demo.cl', 'Demo Apoderado 2', 4),
    ('apoderado', '99000006-2', 'Demo Apoderado 3', 'Bernardo', 4, 5, 'apoderado3@demo.cl', 'Demo Apoderado 3', 4)
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
alumnos_ins as (
  insert into public.alumnos (
    colegio_id, telefono_contacto1, email, telefono_contacto2,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion,
    activo, persona_id, consentimiento, asistido, asistencia_audio,
    perfil_completado, is_blocked
  )
  select
    co.colegio_id, '', pa.email, '',
    p.actor_id, p.actor_id, p.ts, p.ts,
    true, pa.persona_id, false, 'SI', false, false, false
  from personas_all pa, colegio co, params p
  where pa.tipo = 'alumno'
    and not exists (
      select 1 from public.alumnos a
      where a.persona_id = pa.persona_id
    )
  returning alumno_id, persona_id
),
alumnos_all as (
  select ai.alumno_id, ai.persona_id, pa.rut, pa.email
  from alumnos_ins ai
  join personas_all pa on pa.persona_id = ai.persona_id
  union all
  select a.alumno_id, a.persona_id, pa.rut, pa.email
  from public.alumnos a
  join personas_all pa on pa.persona_id = a.persona_id
  where pa.tipo = 'alumno'
),
apoderados_ins as (
  insert into public.apoderados (
    persona_id, colegio_id, telefono_contacto1, telefono_contacto2,
    email_contacto1, email_contacto2, creado_por, actualizado_por,
    fecha_creacion, fecha_actualizacion, activo, perfil_completado, is_blocked
  )
  select
    pa.persona_id, co.colegio_id, '', '', pa.email, '',
    p.actor_id, p.actor_id, p.ts, p.ts, true, false, false
  from personas_all pa, colegio co, params p
  where pa.tipo = 'apoderado'
    and not exists (
      select 1 from public.apoderados ap
      where ap.persona_id = pa.persona_id
    )
  returning apoderado_id, persona_id
),
apoderados_all as (
  select api.apoderado_id, api.persona_id, pa.rut, pa.email
  from apoderados_ins api
  join personas_all pa on pa.persona_id = api.persona_id
  union all
  select ap.apoderado_id, ap.persona_id, pa.rut, pa.email
  from public.apoderados ap
  join personas_all pa on pa.persona_id = ap.persona_id
  where pa.tipo = 'apoderado'
),
relaciones as (
  select * from (values
    ('24129086-7', '16319536-4'),
    ('99000001-1', '99000004-6'),
    ('99000002-K', '99000005-4'),
    ('99000003-8', '99000006-2')
  ) as r(alumno_rut, apoderado_rut)
),
alumno_apoderado_ins as (
  insert into public.alumnos_apoderados (
    alumno_id, apoderado_id, tipo_apoderado, observaciones,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion, activo
  )
  select
    al.alumno_id, ap.apoderado_id, 'Principal', 'Carga demo',
    p.actor_id, p.actor_id, p.ts, p.ts, true
  from relaciones r
  join alumnos_all al on al.rut = r.alumno_rut
  join apoderados_all ap on ap.rut = r.apoderado_rut
  cross join params p
  where not exists (
    select 1 from public.alumnos_apoderados aa
    where aa.alumno_id = al.alumno_id
      and aa.apoderado_id = ap.apoderado_id
  )
  returning alumno_apoderado_id
),
alumno_curso_ins as (
  insert into public.alumnos_cursos (
    alumno_id, curso_id, ano_escolar, fecha_ingreso, fecha_egreso,
    creado_por, actualizado_por, fecha_creacion, fecha_actualizacion, activo
  )
  select
    a.alumno_id, cu.curso_id, 2026,
    p.ts, '2026-12-31 23:59:59-03'::timestamptz,
    p.actor_id, p.actor_id, p.ts, p.ts, true
  from alumnos_all a, curso cu, params p
  where not exists (
    select 1 from public.alumnos_cursos ac
    where ac.alumno_id = a.alumno_id
      and ac.curso_id = cu.curso_id
      and ac.ano_escolar = 2026
  )
  returning alumno_curso_id
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
    null, gen_random_uuid(), 'authenticated', 'authenticated',
    lower(lu.email),
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
    u.usuario_id, co.colegio_id, u.rol_id, p.ts,
    p.actor_id, p.actor_id, p.ts, p.ts, true
  from usuarios_dist u, colegio co, params p
  where not exists (
    select 1 from public.usuarios_colegios uc
    where uc.usuario_id = u.usuario_id
      and uc.colegio_id = co.colegio_id
      and uc.rol_id = u.rol_id
  )
  returning usuarios_colegio_id
)
select
  (select colegio_id from colegio) colegio_id,
  (select curso_id from curso) curso_id,
  (select count(*) from alumnos_all) alumnos_total,
  (select count(*) from apoderados_all) apoderados_total,
  (select count(*) from usuarios_dist) usuarios_total,
  (select count(*) from auth_all) auth_total;

commit;
