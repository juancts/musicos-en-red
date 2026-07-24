-- Preferencia de aviso por email cuando el usuario recibe un mensaje nuevo.
-- Ejecutar después de 012_suscripciones.sql.

alter table public.usuarios
  add column if not exists notificar_mensajes_email boolean not null default true;
