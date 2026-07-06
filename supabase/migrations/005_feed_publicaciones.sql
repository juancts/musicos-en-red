-- Feed social: publicaciones (posts y shows)
-- Ejecutar en Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS publicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  contenido text NOT NULL,
  tipo text NOT NULL DEFAULT 'post',
  fecha_evento timestamptz,
  lugar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT publicaciones_contenido_check CHECK (
    char_length(trim(contenido)) > 0 AND char_length(contenido) <= 500
  ),
  CONSTRAINT publicaciones_tipo_check CHECK (tipo IN ('post', 'show')),
  CONSTRAINT publicaciones_show_campos_check CHECK (
    tipo <> 'show'
    OR (fecha_evento IS NOT NULL AND char_length(trim(lugar)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS publicaciones_created_at_idx
  ON publicaciones (created_at DESC);

CREATE INDEX IF NOT EXISTS publicaciones_autor_id_idx
  ON publicaciones (autor_id);

CREATE OR REPLACE FUNCTION actualizar_publicacion_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS publicaciones_updated_at ON publicaciones;

CREATE TRIGGER publicaciones_updated_at
  BEFORE UPDATE ON publicaciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_publicacion_updated_at();

ALTER TABLE publicaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed público lectura" ON publicaciones;
CREATE POLICY "Feed público lectura"
  ON publicaciones
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuario publica" ON publicaciones;
CREATE POLICY "Usuario publica"
  ON publicaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = autor_id);

DROP POLICY IF EXISTS "Autor edita publicación" ON publicaciones;
CREATE POLICY "Autor edita publicación"
  ON publicaciones
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = autor_id)
  WITH CHECK (auth.uid() = autor_id);

DROP POLICY IF EXISTS "Autor borra publicación" ON publicaciones;
CREATE POLICY "Autor borra publicación"
  ON publicaciones
  FOR DELETE
  TO authenticated
  USING (auth.uid() = autor_id);

GRANT SELECT ON publicaciones TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON publicaciones TO authenticated;
