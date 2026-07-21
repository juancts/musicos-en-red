-- Suscripción de pago (Stripe) con beneficios para suscriptores.
-- Ejecutar después de 011_moderacion.sql.
--
-- El estado de suscripción vive en una tabla separada de "usuarios" a propósito:
-- la policy "usuarios_update_propio" (008_supabase_security_hardening.sql) deja
-- que cualquier usuario actualice cualquier columna de su propia fila, así que si
-- el estado de suscripción fuera una columna de "usuarios" cualquiera podría
-- auto-otorgarse premium desde la consola del navegador. Aquí, solo el service
-- role (usado exclusivamente por el webhook de Stripe) puede escribir.

create table if not exists public.suscripciones (
  usuario_id uuid primary key references public.usuarios (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  estado text not null default 'inactive'
    check (estado in ('inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  precio_id text,
  periodo_actual_fin timestamptz,
  cancelar_al_final_periodo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suscripciones_estado_idx on public.suscripciones (estado);

create or replace function public.actualizar_suscripcion_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists suscripciones_updated_at on public.suscripciones;

create trigger suscripciones_updated_at
  before update on public.suscripciones
  for each row
  execute function public.actualizar_suscripcion_updated_at();

alter table public.suscripciones enable row level security;

revoke all on table public.suscripciones from anon;
revoke all on table public.suscripciones from authenticated;

grant select on table public.suscripciones to anon, authenticated;
-- Deliberadamente SIN grant de insert/update/delete a anon/authenticated:
-- solo el cliente con service role (el webhook de Stripe) escribe esta tabla.

drop policy if exists "Suscripciones visibles" on public.suscripciones;
create policy "Suscripciones visibles"
  on public.suscripciones
  for select
  to anon, authenticated
  using (true);

-- Límite de anuncios activos para el plan gratuito (defensa en profundidad:
-- la policy "Vendedor edita sus anuncios" permite actualizar cualquier columna
-- de sus propios anuncios sin límite de conteo, así que la validación del
-- cliente por sí sola es evitable desde la consola del navegador).
create or replace function public.aplicar_limite_anuncios_activos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  activos_actuales integer;
  es_suscriptor boolean;
begin
  if new.estado <> 'activo' then
    return new;
  end if;

  if TG_OP = 'UPDATE' and old.estado = 'activo' then
    return new; -- ya estaba activo, no cambia el conteo
  end if;

  select exists (
    select 1 from public.suscripciones s
    where s.usuario_id = new.vendedor_id
      and s.estado in ('active', 'trialing')
  ) into es_suscriptor;

  if es_suscriptor then
    return new;
  end if;

  select count(*) into activos_actuales
  from public.anuncios_instrumentos
  where vendedor_id = new.vendedor_id
    and estado = 'activo'
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if activos_actuales >= 3 then
    raise exception 'limite_anuncios_activos'
      using detail = 'Máximo 3 anuncios activos en el plan gratuito.';
  end if;

  return new;
end;
$$;

drop trigger if exists limite_anuncios_activos on public.anuncios_instrumentos;
create trigger limite_anuncios_activos
  before insert or update on public.anuncios_instrumentos
  for each row
  execute function public.aplicar_limite_anuncios_activos();
