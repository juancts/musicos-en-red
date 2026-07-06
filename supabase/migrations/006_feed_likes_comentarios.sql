-- Likes y comentarios en publicaciones del feed
-- Ejecutar después de 005_feed_publicaciones.sql

CREATE TABLE IF NOT EXISTS publicacion_likes (
  publicacion_id uuid NOT NULL REFERENCES publicaciones (id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (publicacion_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS publicacion_likes_usuario_idx
  ON publicacion_likes (usuario_id);

CREATE TABLE IF NOT EXISTS publicacion_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id uuid NOT NULL REFERENCES publicaciones (id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  parent_id uuid REFERENCES publicacion_comentarios (id) ON DELETE CASCADE,
  contenido text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comentarios_contenido_check CHECK (
    char_length(trim(contenido)) > 0 AND char_length(contenido) <= 280
  )
);

CREATE INDEX IF NOT EXISTS publicacion_comentarios_publicacion_idx
  ON publicacion_comentarios (publicacion_id, created_at);

CREATE INDEX IF NOT EXISTS publicacion_comentarios_parent_idx
  ON publicacion_comentarios (parent_id);

ALTER TABLE publicacion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE publicacion_comentarios ENABLE ROW LEVEL SECURITY;

-- Likes
DROP POLICY IF EXISTS "Likes lectura pública" ON publicacion_likes;
CREATE POLICY "Likes lectura pública"
  ON publicacion_likes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuario da like" ON publicacion_likes;
CREATE POLICY "Usuario da like"
  ON publicacion_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario quita like" ON publicacion_likes;
CREATE POLICY "Usuario quita like"
  ON publicacion_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = usuario_id);

-- Comentarios
DROP POLICY IF EXISTS "Comentarios lectura pública" ON publicacion_comentarios;
CREATE POLICY "Comentarios lectura pública"
  ON publicacion_comentarios
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuario comenta" ON publicacion_comentarios;
CREATE POLICY "Usuario comenta"
  ON publicacion_comentarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = autor_id
    AND (
      parent_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM publicacion_comentarios padre
        WHERE padre.id = parent_id
          AND padre.publicacion_id = publicacion_id
      )
    )
  );

DROP POLICY IF EXISTS "Autor borra comentario" ON publicacion_comentarios;
CREATE POLICY "Autor borra comentario"
  ON publicacion_comentarios
  FOR DELETE
  TO authenticated
  USING (auth.uid() = autor_id);

GRANT SELECT ON publicacion_likes TO anon, authenticated;
GRANT INSERT, DELETE ON publicacion_likes TO authenticated;

GRANT SELECT ON publicacion_comentarios TO anon, authenticated;
GRANT INSERT, DELETE ON publicacion_comentarios TO authenticated;
