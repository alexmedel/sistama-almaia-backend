begin;

create table if not exists public.consentimiento_versiones (
  consentimiento_version_id bigserial primary key,
  consentimiento_codigo text not null,
  consentimiento_titulo text not null,
  consentimiento_version text not null,
  consentimiento_texto text not null,
  consentimiento_hash text not null,
  consentimiento_es_actual boolean not null default false,
  consentimiento_fecha_publicacion timestamptz not null default now(),
  consentimiento_metadata jsonb not null default '{}'::jsonb,
  creado_por bigint,
  actualizado_por bigint,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  activo boolean not null default true,
  constraint uq_consentimiento_versiones_codigo_version
    unique (consentimiento_codigo, consentimiento_version)
);

create unique index if not exists uq_consentimiento_versiones_codigo_actual
  on public.consentimiento_versiones (consentimiento_codigo)
  where consentimiento_es_actual = true and activo = true;

create index if not exists idx_consentimiento_versiones_codigo_activo
  on public.consentimiento_versiones (
    consentimiento_codigo,
    consentimiento_es_actual,
    activo,
    consentimiento_fecha_publicacion desc
  );

alter table public.consentimiento_versiones enable row level security;

grant select on public.consentimiento_versiones to anon;
grant select on public.consentimiento_versiones to authenticated;
grant select, insert, update, delete on public.consentimiento_versiones to service_role;

drop policy if exists "consentimiento_versiones_select_publico"
  on public.consentimiento_versiones;

create policy "consentimiento_versiones_select_publico"
  on public.consentimiento_versiones
  for select
  to anon, authenticated
  using (activo = true);

insert into public.consentimiento_versiones (
  consentimiento_codigo,
  consentimiento_titulo,
  consentimiento_version,
  consentimiento_texto,
  consentimiento_hash,
  consentimiento_es_actual,
  consentimiento_fecha_publicacion,
  consentimiento_metadata,
  creado_por,
  actualizado_por
)
values (
  'consentimiento_asentimiento_menor',
  'Consentimiento y asentimiento',
  'v1',
  $texto$
Consentimiento y
asentimiento

Para poder brindarle a tu hijo una experiencia personalizada y
segura dentro de AlmaIA, necesitamos tu consentimiento como padre,
madre o tutor legal.

Esto nos autoriza a recopilar y utilizar información relacionada con
sus gustos, intereses y preferencias, siempre con fines educativos y
de mejora de la experiencia.

Ambos acuerdos son fundamentales para asegurar una experiencia
respetuosa, consciente y alineada con el bienestar del menor.

Acepto el consentimiento y asentimiento.
$texto$,
  md5($texto$
Consentimiento y
asentimiento

Para poder brindarle a tu hijo una experiencia personalizada y
segura dentro de AlmaIA, necesitamos tu consentimiento como padre,
madre o tutor legal.

Esto nos autoriza a recopilar y utilizar información relacionada con
sus gustos, intereses y preferencias, siempre con fines educativos y
de mejora de la experiencia.

Ambos acuerdos son fundamentales para asegurar una experiencia
respetuosa, consciente y alineada con el bienestar del menor.

Acepto el consentimiento y asentimiento.
$texto$),
  true,
  now(),
  jsonb_build_object(
    'origen', 'seed',
    'idioma', 'es',
    'tipo', 'consentimiento_asentimiento'
  ),
  null,
  null
)
on conflict (consentimiento_codigo, consentimiento_version)
do update
set
  consentimiento_titulo = excluded.consentimiento_titulo,
  consentimiento_texto = excluded.consentimiento_texto,
  consentimiento_hash = excluded.consentimiento_hash,
  consentimiento_es_actual = excluded.consentimiento_es_actual,
  consentimiento_fecha_publicacion = excluded.consentimiento_fecha_publicacion,
  consentimiento_metadata = excluded.consentimiento_metadata,
  fecha_actualizacion = now(),
  activo = true;

update public.consentimiento_versiones
set
  consentimiento_es_actual = case
    when consentimiento_codigo = 'consentimiento_asentimiento_menor'
     and consentimiento_version = 'v1'
    then true
    else false
  end,
  fecha_actualizacion = now()
where consentimiento_codigo = 'consentimiento_asentimiento_menor';

commit;
