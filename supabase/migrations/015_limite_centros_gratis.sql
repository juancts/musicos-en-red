-- Límite de 1 centro gratis por usuario — el segundo en adelante requiere
-- suscripción activa. Mismo patrón que 012_suscripciones.sql aplicó a
-- anuncios_instrumentos: la policy "centros_insert_propio" solo exige
-- owner_id = auth.uid(), sin límite de conteo, así que la validación del
-- cliente por sí sola es evitable desde la consola del navegador.
-- Ejecutar después de 014_centros.sql.

create or replace function public.aplicar_limite_centros_gratis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  centros_actuales integer;
  es_suscriptor boolean;
begin
  select exists (
    select 1 from public.suscripciones s
    where s.usuario_id = new.owner_id
      and s.estado in ('active', 'trialing')
  ) into es_suscriptor;

  if es_suscriptor then
    return new;
  end if;

  select count(*) into centros_actuales
  from public.centros
  where owner_id = new.owner_id;

  if centros_actuales >= 1 then
    raise exception 'limite_centros_gratis'
      using detail = 'El plan gratuito permite 1 sala. Suscríbete para añadir más.';
  end if;

  return new;
end;
$$;

drop trigger if exists limite_centros_gratis on public.centros;
create trigger limite_centros_gratis
  before insert on public.centros
  for each row
  execute function public.aplicar_limite_centros_gratis();
