create table if not exists public.solicitudes_reserva_sala (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null,
  musico_id uuid not null,
  espacio_id uuid,
  fecha date not null,
  hora_inicio time not null,
  duracion_horas numeric(4, 2) not null,
  num_musicos integer not null default 1,
  mensaje text,
  estado text not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint solicitudes_reserva_sala_sala_id_fkey
    foreign key (sala_id) references public.usuarios(id) on delete cascade,
  constraint solicitudes_reserva_sala_musico_id_fkey
    foreign key (musico_id) references public.usuarios(id) on delete cascade,
  constraint solicitudes_reserva_sala_espacio_id_fkey
    foreign key (espacio_id) references public.espacios_ensayo(id) on delete set null,
  constraint solicitudes_reserva_sala_partes_distintas_check
    check (sala_id <> musico_id),
  constraint solicitudes_reserva_sala_duracion_check
    check (duracion_horas > 0 and duracion_horas <= 12),
  constraint solicitudes_reserva_sala_num_musicos_check
    check (num_musicos > 0 and num_musicos <= 50),
  constraint solicitudes_reserva_sala_estado_check
    check (estado in ('pendiente', 'aceptada', 'rechazada', 'cancelada'))
);

create index if not exists solicitudes_reserva_sala_sala_fecha_idx
  on public.solicitudes_reserva_sala (sala_id, fecha desc);

create index if not exists solicitudes_reserva_sala_musico_fecha_idx
  on public.solicitudes_reserva_sala (musico_id, fecha desc);

create index if not exists solicitudes_reserva_sala_estado_idx
  on public.solicitudes_reserva_sala (estado);

create index if not exists solicitudes_reserva_sala_espacio_idx
  on public.solicitudes_reserva_sala (espacio_id);

alter table public.solicitudes_reserva_sala enable row level security;

revoke all on table public.solicitudes_reserva_sala from anon;
revoke all on table public.solicitudes_reserva_sala from authenticated;

grant select, insert on table public.solicitudes_reserva_sala to authenticated;
grant update (estado, updated_at) on table public.solicitudes_reserva_sala to authenticated;

drop policy if exists "Solicitudes visibles para participantes" on public.solicitudes_reserva_sala;
create policy "Solicitudes visibles para participantes"
on public.solicitudes_reserva_sala
for select
to authenticated
using (
  (select auth.uid()) = sala_id
  or (select auth.uid()) = musico_id
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
    select 1
    from public.usuarios u
    where u.id = sala_id
      and u.tipo = 'sala'
  )
);

drop policy if exists "Salas responden solicitudes" on public.solicitudes_reserva_sala;
create policy "Salas responden solicitudes"
on public.solicitudes_reserva_sala
for update
to authenticated
using ((select auth.uid()) = sala_id)
with check ((select auth.uid()) = sala_id);
