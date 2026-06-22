-- ============================================================
-- Apiculture 360° — Row Level Security (RLS)
-- PostgreSQL 16 / Supabase
--
-- Chaque table est protegee par une policy qui verifie
-- que user_id = auth.uid() pour toutes les operations (ALL).
--
-- La table `profils` utilise `id = auth.uid()` car la PK
-- est directement l'ID utilisateur Supabase.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. PROFILS (PK = auth.users.id)
-- ──────────────────────────────────────────────

ALTER TABLE profils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profils_user_isolation" ON profils
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ──────────────────────────────────────────────
-- 2. RUCHERS
-- ──────────────────────────────────────────────

ALTER TABLE ruchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ruchers_user_isolation" ON ruchers
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 2b. SITES (regroupement géographique des ruchers)
-- ──────────────────────────────────────────────

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sites_user_isolation" ON sites
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 3. RUCHES
-- ──────────────────────────────────────────────

ALTER TABLE ruches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ruches_user_isolation" ON ruches
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 4. INSPECTIONS
-- ──────────────────────────────────────────────

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspections_user_isolation" ON inspections
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 5. RECOLTES
-- ──────────────────────────────────────────────

ALTER TABLE recoltes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recoltes_user_isolation" ON recoltes
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 6. STOCKS
-- ──────────────────────────────────────────────

ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stocks_user_isolation" ON stocks
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 7. MOUVEMENTS_STOCK
-- ──────────────────────────────────────────────

ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mouvements_stock_user_isolation" ON mouvements_stock
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 8. CLIENTS
-- ──────────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_user_isolation" ON clients
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 9. TRANSACTIONS
-- ──────────────────────────────────────────────

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_user_isolation" ON transactions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 10. ALERTES
-- ──────────────────────────────────────────────

ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertes_user_isolation" ON alertes
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
