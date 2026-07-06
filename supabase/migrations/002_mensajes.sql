-- Ejecutar en Supabase → SQL Editor
-- Mensajes entre músico y sala de ensayo
--
-- Opcional (chat en vivo): Database → Replication → activar mensajes

CREATE TABLE IF NOT EXISTS conversaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  musico_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  sala_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (musico_id, sala_id)
);

CREATE TABLE IF NOT EXISTS mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id uuid NOT NULL REFERENCES conversaciones (id) ON DELETE CASCADE,
  remitente_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  cuerpo text NOT NULL,
  leido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mensajes_cuerpo_check CHECK (
    char_length(trim(cuerpo)) > 0 AND char_length(cuerpo) <= 2000
  )
);

CREATE INDEX IF NOT EXISTS mensajes_conversacion_id_idx
  ON mensajes (conversacion_id, created_at);

CREATE INDEX IF NOT EXISTS conversaciones_musico_id_idx
  ON conversaciones (musico_id);

CREATE INDEX IF NOT EXISTS conversaciones_sala_id_idx
  ON conversaciones (sala_id);

CREATE INDEX IF NOT EXISTS conversaciones_updated_at_idx
  ON conversaciones (updated_at DESC);

CREATE OR REPLACE FUNCTION actualizar_conversacion_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversaciones
  SET updated_at = now()
  WHERE id = NEW.conversacion_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mensajes_actualiza_conversacion ON mensajes;

CREATE TRIGGER mensajes_actualiza_conversacion
  AFTER INSERT ON mensajes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_conversacion_updated_at();

ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes ven conversaciones" ON conversaciones;
CREATE POLICY "Participantes ven conversaciones"
  ON conversaciones
  FOR SELECT
  USING (auth.uid() = musico_id OR auth.uid() = sala_id);

DROP POLICY IF EXISTS "Músicos crean conversaciones" ON conversaciones;
CREATE POLICY "Músicos crean conversaciones"
  ON conversaciones
  FOR INSERT
  WITH CHECK (auth.uid() = musico_id);

DROP POLICY IF EXISTS "Participantes ven mensajes" ON mensajes;
CREATE POLICY "Participantes ven mensajes"
  ON mensajes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND (c.musico_id = auth.uid() OR c.sala_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participantes envían mensajes" ON mensajes;
CREATE POLICY "Participantes envían mensajes"
  ON mensajes
  FOR INSERT
  WITH CHECK (
    auth.uid() = remitente_id
    AND EXISTS (
      SELECT 1
      FROM conversaciones c
      WHERE c.id = conversacion_id
        AND (c.musico_id = auth.uid() OR c.sala_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Destinatario marca leído" ON mensajes;
CREATE POLICY "Destinatario marca leído"
  ON mensajes
  FOR UPDATE
  USING (
    remitente_id <> auth.uid()
    AND EXISTS (
      SELECT 1
      FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
        AND (c.musico_id = auth.uid() OR c.sala_id = auth.uid())
    )
  )
  WITH CHECK (
    remitente_id <> auth.uid()
    AND EXISTS (
      SELECT 1
      FROM conversaciones c
      WHERE c.id = conversacion_id
        AND (c.musico_id = auth.uid() OR c.sala_id = auth.uid())
    )
  );
