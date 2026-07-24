-- Salas como entidad propia: una tabla `centros` con owner_id, para que
-- cualquier usuario (músico o no) pueda poseer cero, una o varias salas sin
-- dejar de ser músico. Las cuentas tipo='sala' existentes siguen
-- funcionando igual (mismo id, mismo login) — este cambio es aditivo.
-- Ejecutar después de 013_notificaciones_email.sql.

-- =========================================================================
-- 1. Tabla centros
-- =========================================================================

create table if not exists public.centros (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.usuarios (id) on delete cascade,
  nombre text,
  bio text,
  direccion text,
  telefono text,
  ciudad text,
  codigo_postal text,
  provincia text,
  horario text,
  disponible boolean not null default true,
  servicios text[],
  comodidades text[],
  modelos_alquiler text[],
  packs_unlocked jsonb,
  precio_locked_mensual numeric,
  precio_hora numeric,
  capacidad_max integer,
  equipamiento text[],
  notificar_mensajes_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists centros_owner_id_idx on public.centros (owner_id);
create index if not exists centros_provincia_idx on public.centros (provincia);

create or replace function public.actualizar_centro_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists centros_updated_at on public.centros;
create trigger centros_updated_at
  before update on public.centros
  for each row
  execute function public.actualizar_centro_updated_at();

alter table public.centros enable row level security;

revoke all on table public.centros from anon;
revoke all on table public.centros from authenticated;

grant select on table public.centros to anon, authenticated;
grant insert, update, delete on table public.centros to authenticated;

drop policy if exists "centros_select_publico" on public.centros;
create policy "centros_select_publico"
  on public.centros
  for select
  to anon, authenticated
  using (true);

drop policy if exists "centros_insert_propio" on public.centros;
create policy "centros_insert_propio"
  on public.centros
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "centros_update_propio" on public.centros;
create policy "centros_update_propio"
  on public.centros
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "centros_delete_propio" on public.centros;
create policy "centros_delete_propio"
  on public.centros
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- =========================================================================
-- 2. Backfill: cada cuenta tipo='sala' existente se copia a centros
--    reutilizando el mismo id (owner_id = su propio id) — así las
--    referencias existentes (espacios_ensayo, conversaciones,
--    solicitudes_reserva_sala) no cambian de valor, solo de FK objetivo.
-- =========================================================================

insert into public.centros (
  id, owner_id, nombre, bio, direccion, telefono, ciudad, codigo_postal,
  provincia, horario, disponible, servicios, comodidades, modelos_alquiler,
  packs_unlocked, precio_locked_mensual, precio_hora, capacidad_max,
  equipamiento, notificar_mensajes_email, created_at
)
select
  id, id, nombre, bio, direccion, telefono, ciudad, codigo_postal, provincia,
  horario, coalesce(disponible, true), servicios, comodidades, modelos_alquiler,
  packs_unlocked, precio_locked_mensual, precio_hora, capacidad_max, equipamiento,
  coalesce(notificar_mensajes_email, true), created_at
from public.usuarios
where tipo = 'sala'
on conflict (id) do nothing;

-- =========================================================================
-- 3. Retargeting de FKs
-- =========================================================================

-- espacios_ensayo.centro_id: nunca es polimórfico, se redirige limpio.
alter table public.espacios_ensayo
  drop constraint if exists espacios_ensayo_centro_id_fkey;
alter table public.espacios_ensayo
  add constraint espacios_ensayo_centro_id_fkey
    foreign key (centro_id) references public.centros (id) on delete cascade;

-- solicitudes_reserva_sala.sala_id: tampoco es polimórfico (su INSERT ya
-- exigía tipo='sala'), se redirige limpio.
alter table public.solicitudes_reserva_sala
  drop constraint if exists solicitudes_reserva_sala_sala_id_fkey;
alter table public.solicitudes_reserva_sala
  add constraint solicitudes_reserva_sala_sala_id_fkey
    foreign key (sala_id) references public.centros (id) on delete cascade;

-- conversaciones.sala_id SÍ es polimórfico: se usa también para chats
-- músico↔músico (ver ContactarUsuarioButton.tsx, que guarda un id de
-- músico común ahí). No se puede apuntar a una sola tabla — se elimina el
-- FK (mismo patrón sin-FK que ya usa reportes.objetivo_id) y se reemplaza
-- la limpieza en cascada con triggers manuales.
alter table public.conversaciones
  drop constraint if exists conversaciones_sala_id_fkey;

create or replace function public.limpiar_conversaciones_huerfanas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.conversaciones where sala_id = old.id;
  return old;
end;
$$;

drop trigger if exists usuarios_limpia_conversaciones on public.usuarios;
create trigger usuarios_limpia_conversaciones
  after delete on public.usuarios
  for each row
  execute function public.limpiar_conversaciones_huerfanas();

drop trigger if exists centros_limpia_conversaciones on public.centros;
create trigger centros_limpia_conversaciones
  after delete on public.centros
  for each row
  execute function public.limpiar_conversaciones_huerfanas();

-- No se borran las columnas legacy de sala en usuarios en esta migración
-- (direccion, telefono, precio_hora, capacidad_max, equipamiento, horario,
-- servicios, comodidades, modelos_alquiler, packs_unlocked,
-- precio_locked_mensual) — el código deja de leerlas/escribirlas, pero se
-- limpian en una migración aparte más adelante, sin apuro.

-- =========================================================================
-- 4. RLS: reescribir policies que asumían auth.uid() = sala_id/centro_id
-- =========================================================================

-- espacios_ensayo: 008_supabase_security_hardening.sql ya dividió el ALL
-- original en 3 policies (insert/update/delete).
drop policy if exists "espacios_insert_centro" on public.espacios_ensayo;
create policy "espacios_insert_centro"
  on public.espacios_ensayo
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.centros c
      where c.id = espacios_ensayo.centro_id
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "espacios_update_centro" on public.espacios_ensayo;
create policy "espacios_update_centro"
  on public.espacios_ensayo
  for update
  to authenticated
  using (
    exists (
      select 1 from public.centros c
      where c.id = espacios_ensayo.centro_id
        and c.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.centros c
      where c.id = espacios_ensayo.centro_id
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "espacios_delete_centro" on public.espacios_ensayo;
create policy "espacios_delete_centro"
  on public.espacios_ensayo
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.centros c
      where c.id = espacios_ensayo.centro_id
        and c.owner_id = (select auth.uid())
    )
  );

-- conversaciones: se mantiene auth.uid() = sala_id (cubre músico↔músico y
-- salas legacy) y se agrega el exists contra centros (cubre centros nuevos).
drop policy if exists "Participantes ven conversaciones" on public.conversaciones;
create policy "Participantes ven conversaciones"
  on public.conversaciones
  for select
  to authenticated
  using (
    (select auth.uid()) = musico_id
    or (select auth.uid()) = sala_id
    or exists (
      select 1 from public.centros c
      where c.id = conversaciones.sala_id
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Músicos crean conversaciones" on public.conversaciones;
create policy "Músicos crean conversaciones"
  on public.conversaciones
  for insert
  to authenticated
  with check (
    (select auth.uid()) = musico_id
    and (
      exists (select 1 from public.usuarios u where u.id = conversaciones.sala_id)
      or exists (select 1 from public.centros c where c.id = conversaciones.sala_id)
    )
  );

-- mensajes: mismas 3 policies de 002_mensajes.sql, con el mismo criterio
-- ampliado. El INSERT también resuelve el owner_id real del centro antes
-- de comparar contra bloqueos (011_moderacion.sql).
drop policy if exists "Participantes ven mensajes" on public.mensajes;
create policy "Participantes ven mensajes"
  on public.mensajes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
          or exists (
            select 1 from public.centros ctr
            where ctr.id = c.sala_id and ctr.owner_id = (select auth.uid())
          )
        )
    )
  );

drop policy if exists "Participantes envían mensajes" on public.mensajes;
create policy "Participantes envían mensajes"
  on public.mensajes
  for insert
  to authenticated
  with check (
    (select auth.uid()) = remitente_id
    and exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
          or exists (
            select 1 from public.centros ctr
            where ctr.id = c.sala_id and ctr.owner_id = (select auth.uid())
          )
        )
    )
    and not exists (
      select 1
      from public.conversaciones c
      join public.bloqueos b
        on (
          b.bloqueador_id = c.musico_id
          and b.bloqueado_id = coalesce(
            (select ctr.owner_id from public.centros ctr where ctr.id = c.sala_id),
            c.sala_id
          )
        )
        or (
          b.bloqueado_id = c.musico_id
          and b.bloqueador_id = coalesce(
            (select ctr.owner_id from public.centros ctr where ctr.id = c.sala_id),
            c.sala_id
          )
        )
      where c.id = mensajes.conversacion_id
    )
  );

drop policy if exists "Destinatario marca leído" on public.mensajes;
create policy "Destinatario marca leído"
  on public.mensajes
  for update
  to authenticated
  using (
    remitente_id <> (select auth.uid())
    and exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
          or exists (
            select 1 from public.centros ctr
            where ctr.id = c.sala_id and ctr.owner_id = (select auth.uid())
          )
        )
    )
  )
  with check (
    remitente_id <> (select auth.uid())
    and exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
          or exists (
            select 1 from public.centros ctr
            where ctr.id = c.sala_id and ctr.owner_id = (select auth.uid())
          )
        )
    )
  );

-- solicitudes_reserva_sala: no es polimórfica, se retargetea limpio contra
-- centros (el exists ya reemplaza el viejo chequeo u.tipo = 'sala').
drop policy if exists "Solicitudes visibles para participantes" on public.solicitudes_reserva_sala;
create policy "Solicitudes visibles para participantes"
  on public.solicitudes_reserva_sala
  for select
  to authenticated
  using (
    (select auth.uid()) = musico_id
    or exists (
      select 1 from public.centros c
      where c.id = solicitudes_reserva_sala.sala_id
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Musicos crean solicitudes propias" on public.solicitudes_reserva_sala;
create policy "Musicos crean solicitudes propias"
  on public.solicitudes_reserva_sala
  for insert
  to authenticated
  with check (
    (select auth.uid()) = musico_id
    and estado = 'pendiente'
    and exists (
      select 1 from public.centros c
      where c.id = solicitudes_reserva_sala.sala_id
    )
  );

drop policy if exists "Salas responden solicitudes" on public.solicitudes_reserva_sala;
create policy "Salas responden solicitudes"
  on public.solicitudes_reserva_sala
  for update
  to authenticated
  using (
    exists (
      select 1 from public.centros c
      where c.id = solicitudes_reserva_sala.sala_id
        and c.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.centros c
      where c.id = solicitudes_reserva_sala.sala_id
        and c.owner_id = (select auth.uid())
    )
  );
