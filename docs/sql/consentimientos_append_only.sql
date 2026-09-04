alter table public.consentimientos
  add column if not exists usuario_id integer,
  add column if not exists apoderado_id integer,
  add column if not exists texto_consentimiento text,
  add column if not exists texto_consentimiento_hash text,
  add column if not exists canal character varying,
  add column if not exists origen_pantalla character varying,
  add column if not exists user_agent text,
  add column if not exists dispositivo_metadata jsonb not null default '{}'::jsonb,
  add column if not exists evidencia_metadata jsonb not null default '{}'::jsonb,
  add column if not exists motivo_revocacion text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'consentimientos_usuario_id_fkey'
  ) then
    alter table public.consentimientos
      add constraint consentimientos_usuario_id_fkey
      foreign key (usuario_id) references public.usuarios(usuario_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'consentimientos_apoderado_id_fkey'
  ) then
    alter table public.consentimientos
      add constraint consentimientos_apoderado_id_fkey
      foreign key (apoderado_id) references public.apoderados(apoderado_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'consentimientos_apoderado_required_check'
  ) then
    alter table public.consentimientos
      add constraint consentimientos_apoderado_required_check
      check (
        (
          tipo_titular = 'apoderado'
          and apoderado_id is not null
        )
        or (
          tipo_titular = 'alumno_mayor'
          and apoderado_id is null
        )
      );
  end if;
end $$;

create index if not exists idx_consentimientos_alumno_proposito_fecha
  on public.consentimientos (alumno_id, proposito, fecha_consentimiento desc);

create index if not exists idx_consentimientos_usuario_id
  on public.consentimientos (usuario_id);

create index if not exists idx_consentimientos_apoderado_id
  on public.consentimientos (apoderado_id);

create or replace function public.prevent_consentimientos_update_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'consentimientos is append-only: update/delete forbidden';
end;
$$;

revoke all on function public.prevent_consentimientos_update_delete() from public;

drop trigger if exists trg_prevent_consentimientos_update on public.consentimientos;
create trigger trg_prevent_consentimientos_update
  before update on public.consentimientos
  for each row execute function public.prevent_consentimientos_update_delete();

drop trigger if exists trg_prevent_consentimientos_delete on public.consentimientos;
create trigger trg_prevent_consentimientos_delete
  before delete on public.consentimientos
  for each row execute function public.prevent_consentimientos_update_delete();

alter table public.consentimientos enable row level security;

revoke all privileges on table public.consentimientos from anon;
revoke all privileges on table public.consentimientos from authenticated;
grant select, insert on table public.consentimientos to authenticated;
grant usage, select on sequence public.consentimientos_consentimiento_id_seq to authenticated;

drop policy if exists consentimientos_select_related on public.consentimientos;
create policy consentimientos_select_related
  on public.consentimientos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.auth_id = (select auth.uid())
        and u.activo is true
        and (
          u.usuario_id = consentimientos.usuario_id
          or u.persona_id = consentimientos.titular_id
          or u.persona_id = consentimientos.alumno_persona_id
          or exists (
            select 1
            from public.apoderados a
            join public.alumnos_apoderados aa
              on aa.apoderado_id = a.apoderado_id
            where a.persona_id = u.persona_id
              and a.activo is true
              and aa.alumno_id = consentimientos.alumno_id
              and aa.activo is true
          )
        )
    )
  );

drop policy if exists consentimientos_insert_related on public.consentimientos;
create policy consentimientos_insert_related
  on public.consentimientos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.usuarios u
      where u.auth_id = (select auth.uid())
        and u.activo is true
        and u.usuario_id = consentimientos.usuario_id
        and u.persona_id = consentimientos.titular_id
        and (
          (
            consentimientos.tipo_titular = 'alumno_mayor'
            and consentimientos.alumno_persona_id = u.persona_id
            and consentimientos.apoderado_id is null
          )
          or (
            consentimientos.tipo_titular = 'apoderado'
            and exists (
              select 1
              from public.apoderados a
              join public.alumnos_apoderados aa
                on aa.apoderado_id = a.apoderado_id
              where a.persona_id = u.persona_id
                and a.apoderado_id = consentimientos.apoderado_id
                and a.activo is true
                and aa.alumno_id = consentimientos.alumno_id
                and aa.activo is true
            )
          )
        )
    )
  );
