-- Centros multiespacio: servicios del complejo + salas individuales
-- Ejecutar después de 001_salas_ensayo.sql

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS servicios text[];

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS comodidades text[];

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS modelos_alquiler text[];

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS packs_unlocked jsonb;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS precio_locked_mensual numeric;

CREATE TABLE IF NOT EXISTS espacios_ensayo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  precio_hora numeric,
  capacidad_max integer,
  equipamiento text[],
  metros_cuadrados integer,
  orden smallint NOT NULL DEFAULT 0,
  disponible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT espacios_ensayo_nombre_check CHECK (char_length(trim(nombre)) > 0)
);

CREATE INDEX IF NOT EXISTS espacios_ensayo_centro_id_idx
  ON espacios_ensayo (centro_id, orden);

ALTER TABLE espacios_ensayo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "espacios_select_publico" ON espacios_ensayo;
CREATE POLICY "espacios_select_publico"
  ON espacios_ensayo
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "espacios_gestion_centro" ON espacios_ensayo;
CREATE POLICY "espacios_gestion_centro"
  ON espacios_ensayo
  FOR ALL
  TO authenticated
  USING (auth.uid() = centro_id)
  WITH CHECK (auth.uid() = centro_id);

GRANT SELECT ON espacios_ensayo TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON espacios_ensayo TO authenticated;
