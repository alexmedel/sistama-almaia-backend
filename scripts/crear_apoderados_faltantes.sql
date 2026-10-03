-- Crea los apoderados que faltan (persona + apoderado + usuario) y los vincula al alumno.
-- Colegio 22, 5º-8º. Fuente: Excel Planilla_de_Carga Francia.
-- * Solo crea a quien tenga RUT. Los que tienen rut = null se OMITEN (avisa con NOTICE).
-- * RUT PROVISORIO: los apoderados de 6º sin RUT en el origen usan 99991-K, 99992-K... (5 dígitos que
--   empiezan con 9999; no se les valida el dígito verificador). Hay que reemplazarlos cuando llegue el RUT real.
--   Es seguro ejecutarlo varias veces.
-- * Los id: si la columna no es autoincremental, usa max(id)+1 de la tabla (y bloquea las tablas mientras corre).
-- * NO crea la cuenta de Auth: eso lo hace luego el registro masivo (ver abajo).
-- * Copia solo las columnas obligatorias de un apoderado modelo (tpl_apo) y nunca sus datos
--   personales (teléfono, dirección, correo, auth_id).

-- Si la columna id NO es autoincremental (sin default ni identity), devuelve max(id)+1; si lo es, devuelve null.
create or replace function pg_temp.siguiente_id(tabla text, pk text)
returns bigint language plpgsql as $f$
declare tiene_default boolean; n bigint;
begin
  select (c.column_default is not null or c.is_identity = 'YES') into tiene_default
  from information_schema.columns c
  where c.table_schema='public' and c.table_name=tabla and c.column_name=pk;
  if not found or tiene_default then return null; end if;
  execute format('select coalesce(max(%I),0)+1 from public.%I', pk, tabla) into n;
  return n;
end $f$;

create or replace function pg_temp.clonar(tabla text, pk text, tpl_id bigint, ov jsonb, excluir text[] default '{}')
returns bigint language plpgsql as $f$
declare tj jsonb; base jsonb; ovf jsonb; cols text; nuevo bigint; nid bigint;
begin
  execute format('select to_jsonb(t) from public.%I t where %I = $1', tabla, pk) into tj using tpl_id;
  if tj is null then raise exception 'No existe el modelo % = % en %', pk, tpl_id, tabla; end if;
  -- columnas obligatorias sin default (se copian del modelo)
  select coalesce(jsonb_object_agg(c.column_name, tj -> c.column_name), '{}') into base
  from information_schema.columns c
  where c.table_schema='public' and c.table_name=tabla and c.is_nullable='NO'
    and c.column_default is null and c.is_identity='NO' and c.is_generated='NEVER'
    and c.column_name <> pk and not (c.column_name = any(excluir));
  -- valores propios (solo columnas que existen)
  select coalesce(jsonb_object_agg(e.key, e.value), '{}') into ovf
  from jsonb_each(ov) e
  where e.key in (select column_name from information_schema.columns where table_schema='public' and table_name=tabla) and e.key <> pk;
  base := base || ovf;
  nid := pg_temp.siguiente_id(tabla, pk);
  if nid is not null then base := base || jsonb_build_object(pk, nid); end if;
  select string_agg(quote_ident(k), ',') into cols from jsonb_object_keys(base) k;
  execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1) returning %I',
                 tabla, cols, cols, tabla, pk) into nuevo using base;
  return nuevo;
end $f$;

do $$
declare
  tpl_apo     int  := 1937;   -- apoderado modelo existente y completo (María Araya Figueroa)
  tpl_persona int; tpl_usuario int;
  r record; v_pk bigint; body text; dv text; suma int; mult int; i int; dv_ok text;
  rut_fmt text; v_persona int; v_apo int; v_email text; v_ok int := 0; v_skip int := 0;
begin
  -- evita que otro proceso tome el mismo id mientras corre el script
  lock table personas, apoderados, usuarios, alumnos_apoderados in share row exclusive mode;
  select persona_id into tpl_persona from apoderados where apoderado_id = tpl_apo;
  select usuario_id  into tpl_usuario from usuarios  where persona_id = tpl_persona;
  if tpl_persona is null or tpl_usuario is null then raise exception 'El modelo % no tiene persona/usuario', tpl_apo; end if;

  for r in select * from (values
      -- alumno_id, nombres, apellidos, rut (null = pendiente)
      (1912, 'ELENA',     'ANTONIE',              '26.984.143-5'),
      (2013, 'JESULENE',  'MELOUIS',              null),  -- el Excel repite el RUT de Elena Antonie: pedir el RUT correcto
      (1914, 'CAMILA',    'DONOSO SALINAS',       '99991-K'),  -- RUT provisorio
      (1915, 'JACQUELINE TAMRA', 'VERA AGUILERA', '99992-K'),  -- RUT provisorio
      (1916, 'BERNARDITA','JORQUERA ORELLANA',    '99993-K'),  -- RUT provisorio
      (2009, 'MARICELA',  'SANTIBÁÑEZ HENRÍQUEZ', '99994-K')   -- RUT provisorio
    ) as v(alumno_id, nombres, apellidos, rut)
  loop
    if r.rut is null then
      raise notice 'OMITIDO alumno % (% %): falta RUT', r.alumno_id, r.nombres, r.apellidos; v_skip := v_skip + 1; continue;
    end if;
    -- validar RUT: 7-8 dígitos con DV módulo 11, o 9 dígitos (provisorio)
    body := regexp_replace(split_part(r.rut,'-',1), '[^0-9]', '', 'g');
    dv   := upper(split_part(r.rut,'-',2));
    if body ~ '^9999[0-9]$' then
      null;  -- RUT provisorio: sin validación de dígito verificador
    elsif length(body) in (7,8) then
      suma := 0; mult := 2;
      for i in reverse length(body)..1 loop
        suma := suma + substr(body,i,1)::int * mult; mult := case when mult = 7 then 2 else mult + 1 end;
      end loop;
      dv_ok := case 11 - (suma % 11) when 11 then '0' when 10 then 'K' else (11 - (suma % 11))::text end;
      if dv <> dv_ok then raise notice 'OMITIDO alumno %: RUT % inválido (DV esperado %)', r.alumno_id, r.rut, dv_ok; v_skip := v_skip + 1; continue; end if;
    elsif length(body) <> 9 then
      raise notice 'OMITIDO alumno %: RUT % con largo inválido', r.alumno_id, r.rut; v_skip := v_skip + 1; continue;
    end if;
    rut_fmt := case when body ~ '^9999[0-9]$' then body || '-' || dv
                    else regexp_replace(body, '(\d)(?=(\d{3})+$)', '\1.', 'g') || '-' || dv end;
    v_email := translate(lower(split_part(r.nombres,' ',1)),'áéíóúüñ','aeiouun') || '.'
            || translate(lower(split_part(r.apellidos,' ',1)),'áéíóúüñ','aeiouun')
            || right(body,4) || '@almaia.cl';

    if not exists (select 1 from alumnos where alumno_id = r.alumno_id) then
      raise exception 'alumno % no existe', r.alumno_id; end if;

    -- persona (reutiliza si ya existe ese RUT)
    select persona_id into v_persona from personas
      where regexp_replace(numero_documento,'[^0-9Kk]','','g') = body || dv limit 1;
    if v_persona is not null and body ~ '^9999[0-9]$' and not exists (
         select 1 from personas where persona_id = v_persona and upper(apellidos) = upper(r.apellidos)) then
      raise exception 'El RUT provisorio % ya lo usa otra persona; revisa la numeración', rut_fmt;
    end if;
    if v_persona is null then
      v_persona := pg_temp.clonar('personas','persona_id', tpl_persona, jsonb_build_object(
        'tipo_documento','RUT','numero_documento',rut_fmt,'nombres',r.nombres,'apellidos',r.apellidos,
        'fecha_creacion', now()));
    end if;
    -- apoderado
    select apoderado_id into v_apo from apoderados where persona_id = v_persona limit 1;
    if v_apo is null then
      v_apo := pg_temp.clonar('apoderados','apoderado_id', tpl_apo, jsonb_build_object('persona_id', v_persona,'fecha_creacion', now()));
    end if;
    -- usuario (auth_id queda vacío: lo llena el registro masivo)
    if not exists (select 1 from usuarios where persona_id = v_persona) then
      perform pg_temp.clonar('usuarios','usuario_id', tpl_usuario, jsonb_build_object(
        'persona_id', v_persona,'email', v_email,'fecha_creacion', now()), array['auth_id']);
    end if;
    -- vínculo alumno-apoderado
    if not exists (select 1 from alumnos_apoderados where alumno_id = r.alumno_id and apoderado_id = v_apo) then
      v_pk := pg_temp.siguiente_id('alumnos_apoderados','alumno_apoderado_id');
      if v_pk is null then
        insert into alumnos_apoderados (alumno_id, apoderado_id, tipo_apoderado, observaciones, estado_usuario, creado_por, actualizado_por, fecha_creacion, activo)
        values (r.alumno_id, v_apo, 'Principal', 'creado según planilla de carga', 'activo', 1, 1, now(), true);
      else
        insert into alumnos_apoderados (alumno_apoderado_id, alumno_id, apoderado_id, tipo_apoderado, observaciones, estado_usuario, creado_por, actualizado_por, fecha_creacion, activo)
        values (v_pk, r.alumno_id, v_apo, 'Principal', 'creado según planilla de carga', 'activo', 1, 1, now(), true);
      end if;
    end if;

    raise notice 'OK alumno % -> persona % apoderado % email %', r.alumno_id, v_persona, v_apo, v_email;
    v_ok := v_ok + 1;
  end loop;
  raise notice 'Resumen: creados/vinculados=% omitidos=%', v_ok, v_skip;
end $$;