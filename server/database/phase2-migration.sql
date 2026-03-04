-- ═══════════════════════════════════════════════════════════
-- PHASE 2 — Migration SQL pour Supabase SQL Editor
-- À exécuter APRÈS drizzle-kit push (ou manuellement si push échoue)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Enrichir enum existant ──────────────────────────
-- IMPORTANT : ALTER TYPE ... ADD VALUE ne peut PAS être dans une transaction
ALTER TYPE statut_colonie ADD VALUE IF NOT EXISTS 'empilee';

-- ─── 2. Nouveaux enums ─────────────────────────────────
-- (Créés automatiquement par drizzle-kit push, mais inclus ici en fallback)

DO $$ BEGIN
  CREATE TYPE type_pesee AS ENUM ('totale', 'cote_droit', 'cote_gauche', 'arriere');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE type_comptage_varroa AS ENUM ('plancher', 'vph', 'suppression_couvain_male');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE action_materiel AS ENUM ('ajout', 'retrait', 'remplacement');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE motif_deplacement AS ENUM ('transhumance', 'reorganisation', 'vente', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE devenir_ruche AS ENUM ('stockage', 'destruction', 'reutilisation', 'reutilisation_immediate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE type_evenement_sanitaire AS ENUM ('essaim_mort', 'nettoyer_ruche', 'nettoyer_plancher', 'retrait_couvain');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cause_mortalite AS ENUM ('varroa', 'famine', 'pesticides', 'maladie', 'pillage', 'froid', 'inconnue', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE origine_essaim AS ENUM ('sauvage', 'transvasement', 'recuperation_particulier', 'achat', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. Colonnes ajoutées aux tables existantes ────────

ALTER TABLE interventions ADD COLUMN IF NOT EXISTS nourrissement_unite text;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS categories_activees jsonb DEFAULT '[]';
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS couvain_present boolean;

ALTER TABLE recoltes ADD COLUMN IF NOT EXISTS inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL;
ALTER TABLE recoltes ADD COLUMN IF NOT EXISTS type_produit text DEFAULT 'miel';

-- ─── 4. Nouvelles tables ───────────────────────────────

-- pesees
CREATE TABLE IF NOT EXISTS pesees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id uuid NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  poids_kg decimal(6,1) NOT NULL,
  type_pesee type_pesee NOT NULL,
  poids_estime_total decimal(6,1),
  variation_kg decimal(6,1),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- comptages_varroa
CREATE TABLE IF NOT EXISTS comptages_varroa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id uuid NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  type_comptage type_comptage_varroa NOT NULL,
  nombre_varroas integer NOT NULL,
  duree_comptage_jours integer,
  chute_par_jour decimal(6,2),
  nombre_abeilles_echantillon integer,
  taux_vph decimal(5,2),
  nombre_cadres_retires integer,
  observations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- traitements_varroa
CREATE TABLE IF NOT EXISTS traitements_varroa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id uuid NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  type_traitement text NOT NULL,
  dosage text,
  date_debut timestamptz NOT NULL,
  date_fin_prevue timestamptz,
  date_fin_reelle timestamptz,
  numero_lot_produit text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- mouvements_materiel
CREATE TABLE IF NOT EXISTS mouvements_materiel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id uuid NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  action action_materiel NOT NULL,
  element text NOT NULL,
  quantite integer NOT NULL,
  notes text,
  stock_id uuid REFERENCES stocks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- deplacements_ruches
CREATE TABLE IF NOT EXISTS deplacements_ruches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id uuid NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  rucher_source_id uuid NOT NULL REFERENCES ruchers(id),
  rucher_destination_id uuid NOT NULL REFERENCES ruchers(id),
  date_deplacement timestamptz NOT NULL,
  motif motif_deplacement DEFAULT 'reorganisation',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- divisions
CREATE TABLE IF NOT EXISTS divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id uuid NOT NULL REFERENCES ruches(id),
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  nombre_divisions integer NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- divisions_ruches
CREATE TABLE IF NOT EXISTS divisions_ruches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  ruche_destination_id uuid NOT NULL REFERENCES ruches(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- essaimages
CREATE TABLE IF NOT EXISTS essaimages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id uuid NOT NULL REFERENCES ruches(id),
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  date_essaimage timestamptz NOT NULL,
  essaim_recupere boolean NOT NULL,
  ruche_destination_id uuid REFERENCES ruches(id),
  nouvelle_ruche_cree boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- empilements
CREATE TABLE IF NOT EXISTS empilements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id uuid NOT NULL REFERENCES ruches(id),
  ruche_destination_id uuid NOT NULL REFERENCES ruches(id),
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- evenements_sanitaires
CREATE TABLE IF NOT EXISTS evenements_sanitaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id uuid NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  type_evenement type_evenement_sanitaire NOT NULL,
  cause_probable cause_mortalite,
  date_constat timestamptz,
  declaration_gdsa boolean,
  type_nettoyage text,
  produit_utilise text,
  type_couvain text,
  nombre_cadres integer,
  notes text,
  photos jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- transvasements
CREATE TABLE IF NOT EXISTS transvasements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id uuid NOT NULL REFERENCES ruches(id),
  ruche_destination_id uuid NOT NULL REFERENCES ruches(id),
  inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  cadres_transferes integer NOT NULL,
  devenir_ruche_source devenir_ruche NOT NULL,
  lieu_stockage text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. RLS sur les nouvelles tables ───────────────────

ALTER TABLE pesees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_pesees" ON pesees FOR ALL USING (user_id = auth.uid());

ALTER TABLE comptages_varroa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_comptages_varroa" ON comptages_varroa FOR ALL USING (user_id = auth.uid());

ALTER TABLE traitements_varroa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_traitements_varroa" ON traitements_varroa FOR ALL USING (user_id = auth.uid());

ALTER TABLE mouvements_materiel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_mouvements_materiel" ON mouvements_materiel FOR ALL USING (user_id = auth.uid());

ALTER TABLE deplacements_ruches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_deplacements_ruches" ON deplacements_ruches FOR ALL USING (user_id = auth.uid());

ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_divisions" ON divisions FOR ALL USING (user_id = auth.uid());

-- divisions_ruches : pas de user_id, protégé par FK cascade via divisions

ALTER TABLE essaimages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_essaimages" ON essaimages FOR ALL USING (user_id = auth.uid());

ALTER TABLE empilements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_empilements" ON empilements FOR ALL USING (user_id = auth.uid());

ALTER TABLE evenements_sanitaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_evenements_sanitaires" ON evenements_sanitaires FOR ALL USING (user_id = auth.uid());

ALTER TABLE transvasements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_transvasements" ON transvasements FOR ALL USING (user_id = auth.uid());

-- ─── 6. Indexes performance ───────────────────────────

CREATE INDEX IF NOT EXISTS idx_pesees_ruche ON pesees(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comptages_varroa_ruche ON comptages_varroa(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traitements_varroa_ruche ON traitements_varroa(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mouvements_materiel_ruche ON mouvements_materiel(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deplacements_ruches_ruche ON deplacements_ruches(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_divisions_ruche_source ON divisions(ruche_source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_essaimages_ruche_source ON essaimages(ruche_source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_empilements_ruche_source ON empilements(ruche_source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evenements_sanitaires_ruche ON evenements_sanitaires(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transvasements_ruche_source ON transvasements(ruche_source_id, created_at DESC);

-- Index sur inspection_id pour les jointures depuis interventions
CREATE INDEX IF NOT EXISTS idx_pesees_inspection ON pesees(inspection_id);
CREATE INDEX IF NOT EXISTS idx_comptages_varroa_inspection ON comptages_varroa(inspection_id);
CREATE INDEX IF NOT EXISTS idx_traitements_varroa_inspection ON traitements_varroa(inspection_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_materiel_inspection ON mouvements_materiel(inspection_id);
CREATE INDEX IF NOT EXISTS idx_deplacements_ruches_inspection ON deplacements_ruches(inspection_id);
CREATE INDEX IF NOT EXISTS idx_divisions_inspection ON divisions(inspection_id);
CREATE INDEX IF NOT EXISTS idx_essaimages_inspection ON essaimages(inspection_id);
CREATE INDEX IF NOT EXISTS idx_empilements_inspection ON empilements(inspection_id);
CREATE INDEX IF NOT EXISTS idx_evenements_sanitaires_inspection ON evenements_sanitaires(inspection_id);
CREATE INDEX IF NOT EXISTS idx_transvasements_inspection ON transvasements(inspection_id);
CREATE INDEX IF NOT EXISTS idx_recoltes_inspection ON recoltes(inspection_id);
