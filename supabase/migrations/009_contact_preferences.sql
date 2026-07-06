alter table public.usuarios
  add column if not exists contacto_mensajes boolean not null default true,
  add column if not exists contacto_email_publico boolean not null default false,
  add column if not exists contacto_telefono_publico boolean not null default false;
