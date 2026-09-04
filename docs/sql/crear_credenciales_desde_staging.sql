-- ============================================================================
-- CREACIÓN DE CREDENCIALES: staging -> auth.users + public.usuarios
-- ============================================================================
-- Ejecutar este archivo en Supabase SQL Editor para crear la función.
--
-- Luego, después de migrar el colegio con 'migrar_colegio_desde_staging', ejecuta:
--
--   select *
--   from staging.crear_credenciales_desde_staging(
--     'c10a1f0f-209f-41e9-b304-38094ac46956'::uuid,
--     p_default_password := 'Almaia2026!'
--   );
--
-- Esto creará o actualizará las cuentas en auth.users, auth.identities y public.usuarios
-- para todos los directivos, docentes, alumnos y apoderados cargados en ese proceso
-- que tengan un correo electrónico válido, asignándoles la contraseña por defecto.
-- ============================================================================

create or replace function staging.crear_credenciales_desde_staging(
  p_proceso_id uuid,
  p_default_password text default 'Almaia2026!'
)
returns table (
  out_email text,
  out_rol_id integer,
  out_usuario_id integer,
  out_estado text
)
language plpgsql
security definer
as $$
declare
  v_ts timestamptz := now();
  r record;
  v_auth_id uuid;
  v_usuario_id integer;
begin
  -- Sincronizar secuencias para evitar conflictos de llave duplicada si se insertó manualmente
  perform setval(pg_get_serial_sequence('public.usuarios', 'usuario_id'), coalesce((select max(usuario_id) from public.usuarios), 0) + 1, false);
  perform setval(pg_get_serial_sequence('public.usuario_rol', 'usuario_rol_id'), coalesce((select max(usuario_rol_id) from public.usuario_rol), 0) + 1, false);

  -- 1. Obtenemos todos los usuarios a crear combinando las tablas staging del proceso
  for r in
    with cte_users as (
      -- Directivos
      select 
        lower(trim(d.email_final)) as email,
        trim(d.nombres) as nombres,
        trim(d.apellidos) as apellidos,
        CASE 
          WHEN lower(trim(d.cargo_raw)) LIKE '%director%' THEN 6
          WHEN lower(trim(d.cargo_raw)) LIKE '%psicólogo/a del establecimiento%' OR lower(trim(d.cargo_raw)) LIKE '%psicologo%' THEN 9
          WHEN lower(trim(d.cargo_raw)) LIKE '%sostenedor%' OR lower(trim(d.cargo_raw)) LIKE '%representante%' THEN 7
          WHEN lower(trim(d.cargo_raw)) LIKE '%slep%' THEN 19
          WHEN lower(trim(d.cargo_raw)) LIKE '%convivencia%' THEN 8
          WHEN lower(trim(d.cargo_raw)) LIKE '%alma%' THEN 5
          ELSE 1 -- Administrador Colegio
        END as rol_id,
        cm.id_destino::integer as persona_id
      from staging.stg_directivos d
      join staging.carga_map cm on cm.proceso_id = p_proceso_id 
        and cm.entidad = 'persona' 
        and cm.clave_origen = trim(d.rut_raw)
      where d.proceso_id = p_proceso_id 
        and nullif(trim(d.email_final), '') is not null
      
      union
      
      -- Docentes
      select 
        lower(trim(doc.email_final)) as email,
        trim(doc.nombres) as nombres,
        trim(doc.apellidos) as apellidos,
        3 as rol_id,
        cm.id_destino::integer as persona_id
      from staging.stg_docentes doc
      join staging.carga_map cm on cm.proceso_id = p_proceso_id 
        and cm.entidad = 'persona' 
        and cm.clave_origen = trim(doc.rut_raw)
      where doc.proceso_id = p_proceso_id 
        and nullif(trim(doc.email_final), '') is not null
      
      union
      
      -- Alumnos
      select 
        lower(trim(a.email_final)) as email,
        trim(a.nombres) as nombres,
        trim(a.apellidos) as apellidos,
        2 as rol_id,
        cm.id_destino::integer as persona_id
      from staging.stg_alumnos a
      join staging.carga_map cm on cm.proceso_id = p_proceso_id 
        and cm.entidad = 'persona' 
        and cm.clave_origen = trim(a.rut_raw)
      where a.proceso_id = p_proceso_id 
        and nullif(trim(a.email_final), '') is not null
      
      union
      
      -- Apoderado 1
      select 
        lower(trim(a.email_apoderado_1_raw)) as email,
        trim(a.nombre_apoderado_1_raw) as nombres,
        trim(a.apellido_apoderado_1_raw) as apellidos,
        4 as rol_id,
        cm.id_destino::integer as persona_id
      from staging.stg_alumnos a
      join staging.carga_map cm on cm.proceso_id = p_proceso_id 
        and cm.entidad = 'persona' 
        and cm.clave_origen = trim(a.rut_apoderado_1_raw)
      where a.proceso_id = p_proceso_id 
        and nullif(trim(a.email_apoderado_1_raw), '') is not null
      
      union
      
      -- Apoderado 2
      select 
        lower(trim(a.email_apoderado_2_raw)) as email,
        trim(a.nombre_apoderado_2_raw) as nombres,
        trim(a.apellido_apoderado_2_raw) as apellidos,
        4 as rol_id,
        cm.id_destino::integer as persona_id
      from staging.stg_alumnos a
      join staging.carga_map cm on cm.proceso_id = p_proceso_id 
        and cm.entidad = 'persona' 
        and cm.clave_origen = trim(a.rut_apoderado_2_raw)
      where a.proceso_id = p_proceso_id 
        and nullif(trim(a.email_apoderado_2_raw), '') is not null
    )
    select distinct on (email) *
    from cte_users
  loop
    v_auth_id := null;
    v_usuario_id := null;

    -- A. Verificar o insertar en auth.users de Supabase
    select id into v_auth_id
    from auth.users
    where lower(email) = lower(r.email)
    limit 1;

    if v_auth_id is null then
      v_auth_id := gen_random_uuid();
      
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change, email_change_token_current,
        phone_change, phone_change_token, reauthentication_token,
        is_sso_user, is_anonymous
      )
      values (
        null, v_auth_id, 'authenticated', 'authenticated', lower(r.email),
        crypt(p_default_password, gen_salt('bf')),
        v_ts,
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('email', lower(r.email), 'email_verified', true, 'phone_verified', false),
        v_ts, v_ts, '', '', '', '', '', '', '', '', false, false
      );

      -- Vincular proveedor email para que el login funcione correctamente
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      )
      values (
        v_auth_id::text,
        v_auth_id,
        jsonb_build_object(
          'sub', v_auth_id::text,
          'email', lower(r.email),
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        v_ts, v_ts, v_ts
      )
      on conflict (provider_id, provider) do update
      set identity_data = excluded.identity_data,
          updated_at = excluded.updated_at;
    else
      -- Si ya existe el usuario de autenticación, actualizamos su contraseña
      update auth.users
      set encrypted_password = crypt(p_default_password, gen_salt('bf')),
          updated_at = v_ts
      where id = v_auth_id;
    end if;

    -- B. Verificar o insertar en public.usuarios (Esquema de Negocio)
    select usuario_id into v_usuario_id
    from public.usuarios
    where lower(email) = lower(r.email)
    limit 1;

    if v_usuario_id is null then
      insert into public.usuarios (
        nombre_social, email, encripted_password, rol_id, telefono_contacto,
        ultimo_inicio_sesion, estado_usuario, intentos_inicio_sesion,
        url_foto_perfil, persona_id, creado_por, actualizado_por,
        fecha_creacion, fecha_actualizacion, activo, idioma_id, auth_id,
        clave_generada, biometria_activa, nombres, apellidos,
        nacionalidad_id, is_blocked
      )
      values (
        coalesce(nullif(trim(r.nombres || ' ' || r.apellidos), ''), 'Usuario demo'), lower(r.email), '', r.rol_id, '',
        null, 'Activo', 0,
        '', r.persona_id, 1, 1,
        v_ts, v_ts, true, 1, v_auth_id,
        null, false, r.nombres, r.apellidos,
        1, false
      )
      returning usuario_id into v_usuario_id;
      
      out_estado := 'CREADO';
    else
      update public.usuarios
      set auth_id = v_auth_id,
          persona_id = r.persona_id,
          rol_id = r.rol_id,
          nombres = r.nombres,
          apellidos = r.apellidos,
          nombre_social = coalesce(nullif(trim(r.nombres || ' ' || r.apellidos), ''), nombre_social),
          estado_usuario = 'Activo',
          activo = true,
          fecha_actualizacion = v_ts
      where usuario_id = v_usuario_id;

      out_estado := 'ACTUALIZADO';
    end if;

    -- C. Asegurar asignación en public.usuario_rol
    if not exists (
      select 1 from public.usuario_rol
      where usuario_id = v_usuario_id
        and rol_id = r.rol_id
    ) then
      insert into public.usuario_rol (usuario_id, rol_id)
      values (v_usuario_id, r.rol_id);
    end if;

    -- D. Registrar trazabilidad en carga_map
    perform staging._map_colegio(
      p_proceso_id, 
      'usuario', 
      lower(r.email), 
      'public.usuarios', 
      v_usuario_id, 
      (out_estado = 'CREADO')
    );

    out_email := r.email;
    out_rol_id := r.rol_id;
    out_usuario_id := v_usuario_id;
    return next;
  end loop;
end;
$$;

comment on function staging.crear_credenciales_desde_staging(uuid, text)
is 'Genera credenciales en auth.users y public.usuarios para personas con correo procedentes de la carga staging.';
