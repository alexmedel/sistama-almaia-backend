-- Motor de carga de colegios: esquema staging persistente.
-- Basado en tablas reales usadas por el backend:
-- colegios, calendarios_escolares, calendarios_dias_festivos,
-- calendarios_fechas_importantes, niveles_educativos, grados, materias,
-- cursos, personas, usuarios, usuarios_colegios, docentes, alumnos,
-- apoderados, alumnos_apoderados, alumnos_cursos, aulas.

create schema if not exists staging;

create type staging.carga_estado as enum (
  'INICIADO',
  'STAGING_CARGADO',
  'PREVALIDADO_OK',
  'PREVALIDADO_CON_CRITICOS',
  'BLOQUE1_OK',
  'BLOQUE2_OK',
  'BLOQUE3_OK',
  'CERRADO',
  'ABORTADO'
);

create type staging.fila_estado as enum (
  'PENDIENTE',
  'OK',
  'ALERTA',
  'EXCLUIDO',
  'MIGRADO'
);

create type staging.log_severidad as enum (
  'INFO',
  'NORMALIZACION',
  'ALERTA',
  'CRITICO'
);

create table if not exists staging.carga_procesos (
  proceso_id uuid primary key default gen_random_uuid(),
  nombre_archivo text,
  colegio_nombre text,
  estado staging.carga_estado not null default 'INICIADO',
  etapa text,
  modo_destino text not null default 'DIRECTO',
  total_filas integer not null default 0,
  total_ok integer not null default 0,
  total_alertas integer not null default 0,
  total_criticos integer not null default 0,
  total_excluidos integer not null default 0,
  creado_por integer,
  actualizado_por integer,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cerrado_en timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists staging.carga_parametros (
  proceso_id uuid primary key references staging.carga_procesos(proceso_id) on delete cascade,
  creado_por integer default 0,
  actualizado_por integer default 0,
  idioma_id integer default 1,
  password_inicial text,
  rol_directivo_id integer default 2,
  rol_docente_id integer default 3,
  rol_alumno_id integer default 4,
  rol_apoderado_id integer default 5,
  pais_default_id integer,
  region_default_id integer,
  zona_horaria text default 'America/Santiago',
  permitir_anonimo boolean default true,
  forzar_identificacion boolean default false,
  parametros jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists staging.carga_resumen_tablas (
  resumen_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  tabla_staging text not null,
  filas_leidas integer not null default 0,
  filas_ok integer not null default 0,
  filas_alerta integer not null default 0,
  filas_criticas integer not null default 0,
  filas_excluidas integer not null default 0,
  filas_migradas integer not null default 0,
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, tabla_staging)
);

create table if not exists staging.log_errores_carga (
  log_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  tabla_staging text not null,
  fila_excel integer,
  columna text,
  severidad staging.log_severidad not null,
  codigo text not null,
  mensaje text not null,
  valor_original text,
  valor_normalizado text,
  bloque text,
  creado_en timestamptz not null default now()
);

create table if not exists staging.carga_map (
  map_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  entidad text not null,
  clave_origen text not null,
  tabla_destino text not null,
  id_destino bigint not null,
  metadata jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  unique (proceso_id, entidad, clave_origen, tabla_destino)
);

create table if not exists staging.scripts_generados (
  script_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  bloque text not null,
  orden integer not null,
  descripcion text,
  sql_text text not null,
  rollback_sql text,
  creado_en timestamptz not null default now()
);

-- Hoja Colegio -> public.colegios
create table if not exists staging.stg_colegio (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  colegio_id_raw text,
  nombre_raw text,
  nombre_fantasia_raw text,
  tipo_colegio_raw text,
  tipo_religion_raw text,
  dependencia_raw text,
  sitio_web_raw text,
  instagram_raw text,
  direccion_raw text,
  telefono_contacto_raw text,
  correo_electronico_raw text,
  comuna_raw text,
  region_raw text,
  pais_raw text,
  director_raw text,
  nombre text,
  nombre_fantasia text,
  tipo_colegio text,
  dependencia text,
  sitio_web text,
  direccion text,
  telefono_contacto text,
  correo_electronico text,
  comuna_id integer,
  region_id integer,
  pais_id integer,
  correo_sos text,
  correo_denuncia text,
  permitir_anonimo boolean,
  forzar_identificacion boolean,
  zona_horaria text,
  colegio_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Año_Academico -> public.calendarios_escolares
create table if not exists staging.stg_ano_academico (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  ano_escolar_raw text,
  fecha_ingreso_raw text,
  fecha_egreso_raw text,
  colegio_id integer,
  ano_escolar integer,
  fecha_inicio date,
  fecha_fin date,
  dias_habiles integer,
  calendario_escolar_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Dias Festivos -> public.calendarios_dias_festivos
create table if not exists staging.stg_dias_festivos (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  fecha_raw text,
  descripcion_raw text,
  calendario_escolar_id integer,
  dia_festivo date,
  descripcion text,
  calendario_dia_festivo_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Fechas Importantes -> public.calendarios_fechas_importantes
create table if not exists staging.stg_fechas_importantes (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  tipo_raw text,
  curso_raw text,
  fecha_raw text,
  titulo_raw text,
  descripcion_raw text,
  colegio_id integer,
  curso_id integer,
  calendario_escolar_id integer,
  titulo text,
  descripcion text,
  fecha date,
  tipo text,
  calendario_fecha_importante_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Cargos_Directivos: catalogo operacional para resolver directivos.
create table if not exists staging.stg_cargos_directivos (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  cargo_raw text,
  descripcion_raw text,
  cargo text,
  descripcion text,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Niveles_Educativos -> public.niveles_educativos
create table if not exists staging.stg_niveles_educativos (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  nivel_educativo_id_raw text,
  nombre_raw text,
  colegio_id integer,
  nivel_educativo_id_origen integer,
  nombre text,
  nivel integer,
  nivel_educativo_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Grados -> public.grados
create table if not exists staging.stg_grados (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  grado_id_raw text,
  nombre_raw text,
  colegio_id integer,
  grado_id_origen integer,
  nivel_educativo_id integer,
  nombre text,
  estado text,
  grado_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Materias -> public.materias
create table if not exists staging.stg_materias (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  materia_id_raw text,
  nombre_raw text,
  codigo_raw text,
  colegio_id integer,
  materia_id_origen integer,
  nombre text,
  codigo text,
  materia_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Cursos -> public.cursos
create table if not exists staging.stg_cursos (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  curso_id_raw text,
  nombre_curso_raw text,
  colegio_raw text,
  grado_raw text,
  nivel_educativo_raw text,
  curso_id_origen integer,
  nombre_curso text,
  colegio_id integer,
  grado_id integer,
  nivel_educativo_id integer,
  curso_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Directivos -> public.personas, public.usuarios, public.usuarios_colegios
create table if not exists staging.stg_directivos (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  directivos_id_raw text,
  rut_raw text,
  nombre_raw text,
  apellidos_raw text,
  fecha_nacimiento_raw text,
  estado_civil_raw text,
  genero_raw text,
  direccion_raw text,
  comuna_raw text,
  region_raw text,
  cargo_raw text,
  telefono_contacto1_raw text,
  telefono_contacto2_raw text,
  email_raw text,
  tipo_documento text,
  numero_documento text,
  rut_limpio text,
  rut_dv_ok boolean,
  nombres text,
  apellidos text,
  fecha_nacimiento date,
  genero_id integer,
  estado_civil_id integer,
  comuna_id integer,
  region_id integer,
  email_final text,
  telefono_contacto text,
  rol_id integer,
  persona_id_destino integer,
  usuario_id_destino integer,
  usuarios_colegio_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Docentes -> public.personas, public.docentes, public.usuarios, public.usuarios_colegios
create table if not exists staging.stg_docentes (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  docente_id_raw text,
  rut_raw text,
  nombre_raw text,
  apellidos_raw text,
  fecha_nacimiento_raw text,
  estado_civil_raw text,
  genero_raw text,
  direccion_raw text,
  comuna_raw text,
  region_raw text,
  especialidad_raw text,
  curso_titular_raw text,
  email_raw text,
  telefono_contacto_raw text,
  tipo_documento text,
  numero_documento text,
  rut_limpio text,
  rut_dv_ok boolean,
  nombres text,
  apellidos text,
  fecha_nacimiento date,
  genero_id integer,
  estado_civil_id integer,
  comuna_id integer,
  region_id integer,
  email_final text,
  especialidad text,
  estado text,
  colegio_id integer,
  rol_id integer,
  curso_titular_id integer,
  persona_id_destino integer,
  docente_id_destino integer,
  usuario_id_destino integer,
  usuarios_colegio_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Alumnos -> public.personas, public.alumnos, public.usuarios, public.apoderados
create table if not exists staging.stg_alumnos (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  alumno_id_raw text,
  rut_raw text,
  nombre_raw text,
  apellidos_raw text,
  nombre_social_raw text,
  fecha_nacimiento_raw text,
  curso_raw text,
  genero_raw text,
  direccion_raw text,
  comuna_raw text,
  region_raw text,
  telefono_contacto1_raw text,
  telefono_contacto2_raw text,
  email_raw text,
  rut_apoderado_1_raw text,
  nombre_apoderado_1_raw text,
  apellido_apoderado_1_raw text,
  email_apoderado_1_raw text,
  telefono_apoderado_1_raw text,
  genero_apoderado_1_raw text,
  rut_apoderado_2_raw text,
  nombre_apoderado_2_raw text,
  apellido_apoderado_2_raw text,
  email_apoderado_2_raw text,
  telefono_apoderado_2_raw text,
  genero_apoderado_2_raw text,
  antecedentes_medicos_raw text,
  tipo_documento text,
  numero_documento text,
  rut_limpio text,
  rut_dv_ok boolean,
  nombres text,
  apellidos text,
  nombre_social text,
  fecha_nacimiento date,
  genero_id integer,
  comuna_id integer,
  region_id integer,
  colegio_id integer,
  curso_id integer,
  email_final text,
  telefono_contacto1 text,
  telefono_contacto2 text,
  rol_id integer,
  persona_id_destino integer,
  alumno_id_destino integer,
  usuario_id_destino integer,
  usuarios_colegio_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Aulas -> public.aulas / relacion docente-curso/materia.
create table if not exists staging.stg_aulas (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  aula_id_raw text,
  curso_raw text,
  materia_raw text,
  docente_raw text,
  nombre_docente_raw text,
  tipo_docente_raw text,
  aula_id_origen integer,
  colegio_id integer,
  curso_id integer,
  materia_id integer,
  docente_id integer,
  tipo_docente text,
  aula_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Hoja Matriz de Roles: referencia funcional, no migra directo.
create table if not exists staging.stg_matriz_roles (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  fila_excel integer not null,
  modulo_raw text,
  accion_raw text,
  apoderado_raw text,
  alumno_raw text,
  slep_raw text,
  contratante_sostenedor_raw text,
  director_raw text,
  docente_raw text,
  psicologo_raw text,
  convivencia_escolar_raw text,
  administrador_raw text,
  otros jsonb not null default '{}'::jsonb,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, fila_excel)
);

-- Consolidacion: apoderados unicos desde stg_alumnos.
create table if not exists staging.stg_apoderados (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  origen text not null,
  fila_excel integer,
  orden_apoderado integer not null,
  rut_raw text,
  nombre_raw text,
  apellidos_raw text,
  email_raw text,
  telefono_raw text,
  genero_raw text,
  tipo_documento text,
  numero_documento text,
  rut_limpio text,
  rut_dv_ok boolean,
  nombres text,
  apellidos text,
  email_final text,
  telefono_contacto1 text,
  telefono_contacto2 text,
  genero_id integer,
  estado_civil_id integer,
  colegio_id integer,
  rol_id integer,
  persona_id_destino integer,
  apoderado_id_destino integer,
  usuario_id_destino integer,
  usuarios_colegio_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Consolidacion: vinculos alumno-apoderado.
create table if not exists staging.stg_alumno_apoderado (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  alumno_fila_excel integer not null,
  orden_apoderado integer not null,
  alumno_rut_limpio text,
  apoderado_rut_limpio text,
  alumno_id_destino integer,
  apoderado_id_destino integer,
  parentesco text,
  es_principal boolean default false,
  alumno_apoderado_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, alumno_fila_excel, orden_apoderado)
);

-- Consolidacion: una persona por RUT dentro del proceso, multi-rol.
create table if not exists staging.stg_personas_proceso (
  stg_id bigserial primary key,
  proceso_id uuid not null references staging.carga_procesos(proceso_id) on delete cascade,
  rut_limpio text not null,
  tipo_documento text default 'RUT',
  numero_documento text,
  nombres text,
  apellidos text,
  fecha_nacimiento date,
  genero_id integer,
  estado_civil_id integer,
  email_principal text,
  telefono_principal text,
  roles_detectados text[] not null default '{}'::text[],
  fuentes jsonb not null default '[]'::jsonb,
  persona_id_destino integer,
  usuario_id_destino integer,
  estado_fila staging.fila_estado not null default 'PENDIENTE',
  excluido boolean not null default false,
  observaciones jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (proceso_id, rut_limpio)
);

create index if not exists idx_carga_procesos_estado on staging.carga_procesos (estado);
create index if not exists idx_log_errores_carga_proceso on staging.log_errores_carga (proceso_id, severidad);
create index if not exists idx_carga_map_lookup on staging.carga_map (proceso_id, entidad, clave_origen);
create index if not exists idx_stg_colegio_proceso on staging.stg_colegio (proceso_id, estado_fila);
create index if not exists idx_stg_cursos_lookup on staging.stg_cursos (proceso_id, nombre_curso);
create index if not exists idx_stg_materias_lookup on staging.stg_materias (proceso_id, nombre);
create index if not exists idx_stg_docentes_rut on staging.stg_docentes (proceso_id, rut_limpio);
create index if not exists idx_stg_alumnos_rut on staging.stg_alumnos (proceso_id, rut_limpio);
create index if not exists idx_stg_apoderados_rut on staging.stg_apoderados (proceso_id, rut_limpio);
create index if not exists idx_stg_personas_rut on staging.stg_personas_proceso (proceso_id, rut_limpio);

comment on schema staging is 'Motor de carga de colegios: staging persistente, validacion y migracion controlada a public.';
comment on table staging.carga_procesos is 'Cabecera de cada carga de colegio. Un proceso puede recargarse y prevalidarse N veces antes de migrar.';
comment on table staging.carga_map is 'Mapa entre claves del Excel/staging e IDs reales creados o reutilizados en public.';
comment on table staging.stg_colegio is 'Staging basado en public.colegios y hoja Colegio.';
comment on table staging.stg_alumnos is 'Staging basado en public.personas, public.alumnos, public.usuarios y datos de apoderados embebidos en hoja Alumnos.';
