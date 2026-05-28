-- ============================================================
-- Mad4Performance x Mobil — PDV Map Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla principal de Puntos de Venta
CREATE TABLE IF NOT EXISTS pdvs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        TEXT UNIQUE,
  nombre        TEXT NOT NULL,
  zona          TEXT NOT NULL DEFAULT 'CARACAS',
  direccion     TEXT,
  latitud       DECIMAL(12, 8),
  longitud      DECIMAL(12, 8),
  asesor_ventas TEXT,
  activo        BOOLEAN NOT NULL DEFAULT true,
  slug          TEXT UNIQUE NOT NULL,
  -- Campos escalables para futuro
  instagram     TEXT,
  telefono      TEXT,
  horario       TEXT,
  imagen_url    TEXT,
  -- Metadata
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pdvs_updated_at ON pdvs;
CREATE TRIGGER pdvs_updated_at
  BEFORE UPDATE ON pdvs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email      TEXT,
  accion           TEXT NOT NULL,
  tabla            TEXT NOT NULL DEFAULT 'pdvs',
  registro_id      UUID,
  datos_anteriores JSONB,
  datos_nuevos     JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import logs
CREATE TABLE IF NOT EXISTS import_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email          TEXT,
  total_importados     INTEGER NOT NULL DEFAULT 0,
  duplicados_detectados INTEGER NOT NULL DEFAULT 0,
  errores              INTEGER NOT NULL DEFAULT 0,
  archivo_nombre       TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS pdvs_activo_idx ON pdvs(activo);
CREATE INDEX IF NOT EXISTS pdvs_zona_idx ON pdvs(zona);
CREATE INDEX IF NOT EXISTS pdvs_slug_idx ON pdvs(slug);
CREATE INDEX IF NOT EXISTS pdvs_nombre_idx ON pdvs USING gin(to_tsvector('spanish', nombre));
