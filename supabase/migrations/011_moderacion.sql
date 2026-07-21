-- Reportes de usuarios/contenido y bloqueos entre usuarios
-- Ejecutar después de 010_avatar_storage.sql

create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  reportante_id uuid not null references public.usuarios (id) on delete cascade,
  tipo_objetivo text not null check (tipo_objetivo in ('usuario', 'publicacion', 'anuncio')),
  objetivo_id uuid not null,
  motivo text not null,
  detalle text,
  created_at timestamptz not null default now()
);

create index if not exists reportes_objetivo_idx on public.reportes (tipo_objetivo, objetivo_id);
create index if not exists reportes_reportante_idx on public.reportes (reportante_id);

create table if not exists public.bloqueos (
  bloqueador_id uuid not null references public.usuarios (id) on delete cascade,
  bloqueado_id uuid not null references public.usuarios (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  constraint bloqueos_no_autobloqueo check (bloqueador_id <> bloqueado_id)
);

create index if not exists bloqueos_bloqueado_idx on public.bloqueos (bloqueado_id);

alter table public.reportes enable row level security;
alter table public.bloqueos enable row level security;

revoke all on table public.reportes from anon;
revoke all on table public.bloqueos from anon;

grant select, insert on table public.reportes to authenticated;
grant select, insert, delete on table public.bloqueos to authenticated;

drop policy if exists "Usuario crea reporte" on public.reportes;
create policy "Usuario crea reporte"
  on public.reportes
  for insert
  to authenticated
  with check ((select auth.uid()) = reportante_id);

drop policy if exists "Usuario ve sus reportes" on public.reportes;
create policy "Usuario ve sus reportes"
  on public.reportes
  for select
  to authenticated
  using ((select auth.uid()) = reportante_id);

drop policy if exists "Usuario ve sus bloqueos" on public.bloqueos;
create policy "Usuario ve sus bloqueos"
  on public.bloqueos
  for select
  to authenticated
  using ((select auth.uid()) = bloqueador_id);

drop policy if exists "Usuario crea bloqueo" on public.bloqueos;
create policy "Usuario crea bloqueo"
  on public.bloqueos
  for insert
  to authenticated
  with check ((select auth.uid()) = bloqueador_id);

drop policy if exists "Usuario elimina bloqueo" on public.bloqueos;
create policy "Usuario elimina bloqueo"
  on public.bloqueos
  for delete
  to authenticated
  using ((select auth.uid()) = bloqueador_id);

-- Un bloqueo en cualquier dirección impide nuevos mensajes entre ambos usuarios.
drop policy if exists "Participantes envían mensajes" on public.mensajes;
create policy "Participantes envían mensajes"
  on public.mensajes
  for insert
  to authenticated
  with check (
    (select auth.uid()) = remitente_id
    and exists (
      select 1
      from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
        )
    )
    and not exists (
      select 1
      from public.conversaciones c
      join public.bloqueos b
        on (b.bloqueador_id = c.musico_id and b.bloqueado_id = c.sala_id)
        or (b.bloqueador_id = c.sala_id and b.bloqueado_id = c.musico_id)
      where c.id = mensajes.conversacion_id
    )
  );
