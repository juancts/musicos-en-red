-- Marketplace de instrumentos (compraventa entre usuarios)
-- Ejecutar en Supabase → SQL Editor después de 001 y 002

CREATE TABLE IF NOT EXISTS anuncios_instrumentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  categoria text NOT NULL,
  precio numeric NOT NULL,
  condicion text NOT NULL,
  ciudad text,
  codigo_postal text,
  provincia text,
  foto_urls text[] NOT NULL DEFAULT '{}',
  estado text NOT NULL DEFAULT 'activo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anuncios_titulo_check CHECK (
    char_length(trim(titulo)) >= 3 AND char_length(titulo) <= 120
  ),
  CONSTRAINT anuncios_precio_check CHECK (precio >= 0),
  CONSTRAINT anuncios_categoria_check CHECK (
    categoria IN (
      'guitarra',
      'bajo',
      'bateria',
      'teclas',
      'viento',
      'cuerda',
      'amplificacion',
      'audio',
      'otros'
    )
  ),
  CONSTRAINT anuncios_condicion_check CHECK (
    condicion IN ('nuevo', 'como_nuevo', 'buen_estado', 'usado')
  ),
  CONSTRAINT anuncios_estado_check CHECK (
    estado IN ('activo', 'vendido', 'pausado')
  )
);

CREATE INDEX IF NOT EXISTS anuncios_estado_idx
  ON anuncios_instrumentos (estado, created_at DESC);

CREATE INDEX IF NOT EXISTS anuncios_categoria_idx
  ON anuncios_instrumentos (categoria);

CREATE INDEX IF NOT EXISTS anuncios_provincia_idx
  ON anuncios_instrumentos (provincia);

CREATE INDEX IF NOT EXISTS anuncios_vendedor_id_idx
  ON anuncios_instrumentos (vendedor_id);

CREATE OR REPLACE FUNCTION actualizar_anuncio_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS anuncios_updated_at ON anuncios_instrumentos;

CREATE TRIGGER anuncios_updated_at
  BEFORE UPDATE ON anuncios_instrumentos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_anuncio_updated_at();

ALTER TABLE anuncios_instrumentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anuncios activos visibles" ON anuncios_instrumentos;
CREATE POLICY "Anuncios activos visibles"
  ON anuncios_instrumentos
  FOR SELECT
  TO anon, authenticated
  USING (estado = 'activo' OR vendedor_id = auth.uid());

DROP POLICY IF EXISTS "Vendedor publica anuncios" ON anuncios_instrumentos;
CREATE POLICY "Vendedor publica anuncios"
  ON anuncios_instrumentos
  FOR INSERT
  TO authenticated
  WITH CHECK (vendedor_id = auth.uid());

DROP POLICY IF EXISTS "Vendedor edita sus anuncios" ON anuncios_instrumentos;
CREATE POLICY "Vendedor edita sus anuncios"
  ON anuncios_instrumentos
  FOR UPDATE
  TO authenticated
  USING (vendedor_id = auth.uid())
  WITH CHECK (vendedor_id = auth.uid());

DROP POLICY IF EXISTS "Vendedor elimina sus anuncios" ON anuncios_instrumentos;
CREATE POLICY "Vendedor elimina sus anuncios"
  ON anuncios_instrumentos
  FOR DELETE
  TO authenticated
  USING (vendedor_id = auth.uid());

GRANT SELECT ON anuncios_instrumentos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON anuncios_instrumentos TO authenticated;

-- Storage: bucket público para fotos de anuncios
INSERT INTO storage.buckets (id, name, public)
VALUES ('anuncios-instrumentos', 'anuncios-instrumentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Fotos anuncios lectura pública" ON storage.objects;
CREATE POLICY "Fotos anuncios lectura pública"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'anuncios-instrumentos');

DROP POLICY IF EXISTS "Vendedor sube fotos anuncios" ON storage.objects;
CREATE POLICY "Vendedor sube fotos anuncios"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'anuncios-instrumentos'
    AND (storage.foldername (name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Vendedor actualiza sus fotos anuncios" ON storage.objects;
CREATE POLICY "Vendedor actualiza sus fotos anuncios"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'anuncios-instrumentos'
    AND (storage.foldername (name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Vendedor borra sus fotos anuncios" ON storage.objects;
CREATE POLICY "Vendedor borra sus fotos anuncios"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'anuncios-instrumentos'
    AND (storage.foldername (name))[1] = auth.uid()::text
  );
