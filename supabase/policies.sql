-- ============================================================
-- Row Level Security Policies
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

ALTER TABLE pdvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Público: solo puede leer PDVs activos
CREATE POLICY "public_read_active_pdvs"
  ON pdvs FOR SELECT
  USING (activo = true);

-- Admins autenticados: acceso total a PDVs
CREATE POLICY "admin_all_pdvs"
  ON pdvs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admins autenticados: acceso total a logs
CREATE POLICY "admin_all_audit_logs"
  ON audit_logs FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_import_logs"
  ON import_logs FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
