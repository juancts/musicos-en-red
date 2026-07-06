-- Security and performance hardening for existing Supabase policies.
-- Keeps public directory/feed/catalog reads, but tightens private messaging,
-- trigger functions, redundant policies, and auth.uid() policy evaluation.

create index if not exists mensajes_remitente_id_idx
  on public.mensajes (remitente_id);

create index if not exists partituras_usuario_id_idx
  on public.partituras (usuario_id);

create index if not exists publicacion_comentarios_autor_id_idx
  on public.publicacion_comentarios (autor_id);

create or replace function public.actualizar_anuncio_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.actualizar_publicacion_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.actualizar_conversacion_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversaciones
  set updated_at = now()
  where id = new.conversacion_id;

  return new;
end;
$$;

revoke execute on function public.actualizar_conversacion_updated_at() from public;
revoke execute on function public.actualizar_conversacion_updated_at() from anon;
revoke execute on function public.actualizar_conversacion_updated_at() from authenticated;

revoke all on table public.conversaciones from anon;
revoke all on table public.mensajes from anon;

grant select, insert on table public.conversaciones to authenticated;
grant select, insert, update on table public.mensajes to authenticated;

drop policy if exists "Participantes ven conversaciones" on public.conversaciones;
create policy "Participantes ven conversaciones"
  on public.conversaciones
  for select
  to authenticated
  using (
    (select auth.uid()) = musico_id
    or (select auth.uid()) = sala_id
  );

drop policy if exists "Músicos crean conversaciones" on public.conversaciones;
drop policy if exists "MÃºsicos crean conversaciones" on public.conversaciones;
create policy "Músicos crean conversaciones"
  on public.conversaciones
  for insert
  to authenticated
  with check ((select auth.uid()) = musico_id);

drop policy if exists "Participantes ven mensajes" on public.mensajes;
create policy "Participantes ven mensajes"
  on public.mensajes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
        )
    )
  );

drop policy if exists "Participantes envían mensajes" on public.mensajes;
drop policy if exists "Participantes envÃ­an mensajes" on public.mensajes;
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
  );

drop policy if exists "Destinatario marca leído" on public.mensajes;
drop policy if exists "Destinatario marca leÃ­do" on public.mensajes;
create policy "Destinatario marca leído"
  on public.mensajes
  for update
  to authenticated
  using (
    remitente_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
        )
    )
  )
  with check (
    remitente_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (
          c.musico_id = (select auth.uid())
          or c.sala_id = (select auth.uid())
        )
    )
  );

drop policy if exists "usuarios_insert_propio" on public.usuarios;
create policy "usuarios_insert_propio"
  on public.usuarios
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "usuarios_update_propio" on public.usuarios;
create policy "usuarios_update_propio"
  on public.usuarios
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "espacios_gestion_centro" on public.espacios_ensayo;

drop policy if exists "espacios_insert_centro" on public.espacios_ensayo;
create policy "espacios_insert_centro"
  on public.espacios_ensayo
  for insert
  to authenticated
  with check ((select auth.uid()) = centro_id);

drop policy if exists "espacios_update_centro" on public.espacios_ensayo;
create policy "espacios_update_centro"
  on public.espacios_ensayo
  for update
  to authenticated
  using ((select auth.uid()) = centro_id)
  with check ((select auth.uid()) = centro_id);

drop policy if exists "espacios_delete_centro" on public.espacios_ensayo;
create policy "espacios_delete_centro"
  on public.espacios_ensayo
  for delete
  to authenticated
  using ((select auth.uid()) = centro_id);

drop policy if exists "Anuncios activos visibles" on public.anuncios_instrumentos;
create policy "Anuncios activos visibles"
  on public.anuncios_instrumentos
  for select
  to anon, authenticated
  using (estado = 'activo' or vendedor_id = (select auth.uid()));

drop policy if exists "Vendedor publica anuncios" on public.anuncios_instrumentos;
create policy "Vendedor publica anuncios"
  on public.anuncios_instrumentos
  for insert
  to authenticated
  with check (vendedor_id = (select auth.uid()));

drop policy if exists "Vendedor edita sus anuncios" on public.anuncios_instrumentos;
create policy "Vendedor edita sus anuncios"
  on public.anuncios_instrumentos
  for update
  to authenticated
  using (vendedor_id = (select auth.uid()))
  with check (vendedor_id = (select auth.uid()));

drop policy if exists "Vendedor elimina sus anuncios" on public.anuncios_instrumentos;
create policy "Vendedor elimina sus anuncios"
  on public.anuncios_instrumentos
  for delete
  to authenticated
  using (vendedor_id = (select auth.uid()));

drop policy if exists "Usuario publica" on public.publicaciones;
create policy "Usuario publica"
  on public.publicaciones
  for insert
  to authenticated
  with check ((select auth.uid()) = autor_id);

drop policy if exists "Autor edita publicación" on public.publicaciones;
drop policy if exists "Autor edita publicaciÃ³n" on public.publicaciones;
create policy "Autor edita publicación"
  on public.publicaciones
  for update
  to authenticated
  using ((select auth.uid()) = autor_id)
  with check ((select auth.uid()) = autor_id);

drop policy if exists "Autor borra publicación" on public.publicaciones;
drop policy if exists "Autor borra publicaciÃ³n" on public.publicaciones;
create policy "Autor borra publicación"
  on public.publicaciones
  for delete
  to authenticated
  using ((select auth.uid()) = autor_id);

drop policy if exists "Usuario da like" on public.publicacion_likes;
create policy "Usuario da like"
  on public.publicacion_likes
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);

drop policy if exists "Usuario quita like" on public.publicacion_likes;
create policy "Usuario quita like"
  on public.publicacion_likes
  for delete
  to authenticated
  using ((select auth.uid()) = usuario_id);

drop policy if exists "Usuario comenta" on public.publicacion_comentarios;
create policy "Usuario comenta"
  on public.publicacion_comentarios
  for insert
  to authenticated
  with check (
    (select auth.uid()) = autor_id
    and (
      parent_id is null
      or exists (
        select 1
        from public.publicacion_comentarios padre
        where padre.id = publicacion_comentarios.parent_id
          and padre.publicacion_id = publicacion_comentarios.publicacion_id
      )
    )
  );

drop policy if exists "Autor borra comentario" on public.publicacion_comentarios;
create policy "Autor borra comentario"
  on public.publicacion_comentarios
  for delete
  to authenticated
  using ((select auth.uid()) = autor_id);

drop policy if exists "select own" on public.partituras;
drop policy if exists "insert own" on public.partituras;
drop policy if exists "update own" on public.partituras;
drop policy if exists "delete own" on public.partituras;

revoke insert, update, delete on table public.partituras from anon;
grant select on table public.partituras to anon, authenticated;
grant insert, update, delete on table public.partituras to authenticated;

create policy "insert own"
  on public.partituras
  for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy "update own"
  on public.partituras
  for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy "delete own"
  on public.partituras
  for delete
  to authenticated
  using ((select auth.uid()) = usuario_id);

drop policy if exists "Fotos anuncios lectura pública" on storage.objects;
drop policy if exists "Fotos anuncios lectura pÃºblica" on storage.objects;

drop policy if exists "Vendedor sube fotos anuncios" on storage.objects;
create policy "Vendedor sube fotos anuncios"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'anuncios-instrumentos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Vendedor actualiza sus fotos anuncios" on storage.objects;
create policy "Vendedor actualiza sus fotos anuncios"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'anuncios-instrumentos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Vendedor borra sus fotos anuncios" on storage.objects;
create policy "Vendedor borra sus fotos anuncios"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'anuncios-instrumentos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
