-- Ejecutar en Supabase → SQL Editor (todo el archivo de una vez)
-- Salas de ensayo: columnas en usuarios + permisos para listar perfiles

-- Columnas para salas (idempotente)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS tipo text;

UPDATE usuarios
SET tipo = 'musico'
WHERE tipo IS NULL;

ALTER TABLE usuarios
  ALTER COLUMN tipo SET DEFAULT 'musico';

ALTER TABLE usuarios
  ALTER COLUMN tipo SET NOT NULL;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS direccion text;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS telefono text;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS precio_hora numeric;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS capacidad_max integer;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS equipamiento text[];

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS horario text;

ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_tipo_check;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_tipo_check CHECK (tipo IN ('musico', 'sala'));

CREATE INDEX IF NOT EXISTS usuarios_tipo_idx ON usuarios (tipo);

-- Permisos de API (por si faltan)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON usuarios TO anon, authenticated;
GRANT INSERT, UPDATE ON usuarios TO authenticated;

-- RLS: directorio público + cada usuario edita su fila
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select_publico" ON usuarios;
CREATE POLICY "usuarios_select_publico"
  ON usuarios
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "usuarios_insert_propio" ON usuarios;
CREATE POLICY "usuarios_insert_propio"
  ON usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios_update_propio" ON usuarios;
CREATE POLICY "usuarios_update_propio"
  ON usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
