-- Apiculture 360° — Schema complet + RLS
-- PostgreSQL 16 / Supabase
-- ============================================================
-- Ce fichier est la référence UNIQUE à exécuter dans Supabase SQL Editor.
-- Phase 1 + Phase 2 + Phase 3 + Phase 4 (hausses, organisations, campagnes).
-- Safe re-run : IF NOT EXISTS / IF EXISTS / DO $$ BEGIN ... EXCEPTION partout.
-- NE PAS créer de nouveaux fichiers de migration — tout va ici.
-- ============================================================

-- ──────────────────────────────────────────────
-- 0. RENAME inspections → interventions
-- ──────────────────────────────────────────────

ALTER TABLE IF EXISTS inspections RENAME TO interventions;

-- ──────────────────────────────────────────────
-- 0b. ENUMS Phase 1 (safe re-run)
-- ──────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE role_membre AS ENUM ('admin', 'apiculteur', 'comptable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Rôles & accès granulaires (Expert) : ajouts idempotents.
ALTER TYPE role_membre ADD VALUE IF NOT EXISTS 'technicien';
ALTER TYPE role_membre ADD VALUE IF NOT EXISTS 'lecture';

DO $$ BEGIN
  CREATE TYPE statut_invitation AS ENUM ('en_attente', 'acceptee', 'refusee');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Réconciliation frelon « privé » → « communautaire » (safe re-run).
-- L'ancienne table privée (colonne user_id, enum statut = signale/confirme/detruit)
-- doit devenir communautaire (auteur_id, votes, scores, statut = a_verifier/...).
-- CREATE TABLE IF NOT EXISTS ne MIGRE pas une table existante → on la recrée, et on
-- droppe l'ancien enum statut pour qu'il soit recréé juste après avec les bonnes valeurs.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'signalements_frelon' AND column_name = 'user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'signalements_frelon' AND column_name = 'auteur_id')
  THEN
    DROP TABLE IF EXISTS votes_frelon CASCADE;
    DROP TABLE IF EXISTS signalements_frelon CASCADE;
    DROP TYPE  IF EXISTS frelon_statut;
  END IF;
END $$;

-- Surveillance frelon COMMUNAUTAIRE (type GeoNest + validation type Waze)
DO $$ BEGIN
  CREATE TYPE frelon_espece AS ENUM ('asiatique', 'europeen', 'indetermine');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE frelon_type AS ENUM ('nid_primaire', 'nid_secondaire', 'individu', 'piege');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE frelon_statut AS ENUM ('a_verifier', 'confirme', 'rejete', 'detruit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE frelon_vote AS ENUM ('confirme', 'infirme', 'detruit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE frelon_pression AS ENUM ('faible', 'modere', 'fort', 'infestation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE categorie_vente AS ENUM (
    'miel', 'gelee_royale', 'pollen', 'propolis_alimentaire', 'pain_abeille',
    'cire_alimentaire', 'vinaigre_miel',
    'essaim', 'reine', 'ruche_peuplee', 'nourrissement', 'traitement_veterinaire',
    'materiel_apicole', 'equipement_apiculteur', 'cire_technique',
    'conditionnement', 'hydromel', 'propolis_teinture', 'cosmetique', 'autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────────────
-- 0c. ENUMS Phase 2 — Interventions spécialisées
-- ──────────────────────────────────────────────

-- Enrichir enum existant (HORS transaction)
ALTER TYPE statut_colonie ADD VALUE IF NOT EXISTS 'empilee';

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

-- ──────────────────────────────────────────────
-- 0d. TABLE MEMBRES (si pas encore créée)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS membres (
  id           UUID              DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id     UUID              NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  user_id      UUID              REFERENCES profils(id) ON DELETE CASCADE,
  email        TEXT              NOT NULL,
  role         role_membre       NOT NULL DEFAULT 'apiculteur',
  statut       statut_invitation NOT NULL DEFAULT 'en_attente',
  invited_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 0e. COLONNES AJOUTÉES — Tables existantes
-- ──────────────────────────────────────────────

-- Stocks (TVA apicole — Phase 1 Session 11)
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS categorie_vente categorie_vente;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(4, 1);

-- Stocks (miel — champs spécifiques normes françaises Décret 2003-587)
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS type_miel        TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS presentation     TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS conditionnement  TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS annee_recolte    INTEGER;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS num_lot          TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS origine_geo      TEXT;

-- Profils (Stripe — Phase 1 Session 9)
ALTER TABLE profils ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Interventions (Phase 2 — nouvelles colonnes)
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS nourrissement_unite text;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS categories_activees jsonb DEFAULT '[]';
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS couvain_present boolean;

-- Interventions (rdv-pro — ruche_id devient nullable pour les rendez-vous sans ruche)
ALTER TABLE interventions ALTER COLUMN ruche_id DROP NOT NULL;

-- Recoltes (Phase 2 — lien intervention + type produit)
ALTER TABLE recoltes ADD COLUMN IF NOT EXISTS inspection_id uuid REFERENCES interventions(id) ON DELETE SET NULL;
ALTER TABLE recoltes ADD COLUMN IF NOT EXISTS type_produit text DEFAULT 'miel';

-- ──────────────────────────────────────────────
-- 0f. DROP existing policies (safe re-run)
-- ──────────────────────────────────────────────

-- Phase 1
DROP POLICY IF EXISTS "profils_user_isolation"          ON profils;
DROP POLICY IF EXISTS "ruchers_user_isolation"          ON ruchers;
DROP POLICY IF EXISTS "ruches_user_isolation"           ON ruches;
DROP POLICY IF EXISTS "inspections_user_isolation"      ON interventions;
DROP POLICY IF EXISTS "interventions_user_isolation"    ON interventions;
DROP POLICY IF EXISTS "recoltes_user_isolation"         ON recoltes;
DROP POLICY IF EXISTS "stocks_user_isolation"           ON stocks;
DROP POLICY IF EXISTS "mouvements_stock_user_isolation" ON mouvements_stock;
DROP POLICY IF EXISTS "clients_user_isolation"          ON clients;
DROP POLICY IF EXISTS "transactions_user_isolation"     ON transactions;
DROP POLICY IF EXISTS "alertes_user_isolation"          ON alertes;
DROP POLICY IF EXISTS "membres_owner_all"               ON membres;
DROP POLICY IF EXISTS "membres_member_read"             ON membres;
DROP POLICY IF EXISTS "membres_access"                  ON membres;

-- ============================================================
-- TABLES PHASE 2 — Interventions spécialisées (11 tables)
-- ============================================================

-- ──────────────────────────────────────────────
-- P2-1. PESÉES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pesees (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid         NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id           uuid         NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id      uuid         REFERENCES interventions(id) ON DELETE SET NULL,
  poids_kg           decimal(6,1) NOT NULL,
  type_pesee         type_pesee   NOT NULL,
  poids_estime_total decimal(6,1),
  variation_kg       decimal(6,1),
  notes              text,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-2. COMPTAGES VARROA
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comptages_varroa (
  id                        uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid                 NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id                  uuid                 NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id             uuid                 REFERENCES interventions(id) ON DELETE SET NULL,
  type_comptage             type_comptage_varroa NOT NULL,
  nombre_varroas            integer              NOT NULL,
  duree_comptage_jours      integer,
  chute_par_jour            decimal(6,2),
  nombre_abeilles_echantillon integer,
  taux_vph                  decimal(5,2),
  nombre_cadres_retires     integer,
  observations              text,
  created_at                timestamptz          NOT NULL DEFAULT now(),
  updated_at                timestamptz          NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-3. TRAITEMENTS VARROA
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS traitements_varroa (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id           uuid        NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id      uuid        REFERENCES interventions(id) ON DELETE SET NULL,
  type_traitement    text        NOT NULL,
  dosage             text,
  date_debut         timestamptz NOT NULL,
  date_fin_prevue    timestamptz,
  date_fin_reelle    timestamptz,
  numero_lot_produit text        NOT NULL,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-4. MOUVEMENTS MATÉRIEL
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mouvements_materiel (
  id            uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid             NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id      uuid             NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id uuid             REFERENCES interventions(id) ON DELETE SET NULL,
  action        action_materiel  NOT NULL,
  element       text             NOT NULL,
  quantite      integer          NOT NULL,
  notes         text,
  stock_id      uuid             REFERENCES stocks(id) ON DELETE SET NULL,
  created_at    timestamptz      NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-5. DÉPLACEMENTS RUCHES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deplacements_ruches (
  id                    uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid               NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id              uuid               NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id         uuid               REFERENCES interventions(id) ON DELETE SET NULL,
  rucher_source_id      uuid               NOT NULL REFERENCES ruchers(id),
  rucher_destination_id uuid               NOT NULL REFERENCES ruchers(id),
  date_deplacement      timestamptz        NOT NULL,
  motif                 motif_deplacement  DEFAULT 'reorganisation',
  notes                 text,
  created_at            timestamptz        NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-6. DIVISIONS (essaims artificiels)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS divisions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id  uuid        NOT NULL REFERENCES ruches(id),
  inspection_id    uuid        REFERENCES interventions(id) ON DELETE SET NULL,
  nombre_divisions integer     NOT NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-7. DIVISIONS RUCHES (filles)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS divisions_ruches (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id           uuid        NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  ruche_destination_id  uuid        NOT NULL REFERENCES ruches(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-8. ESSAIMAGES NATURELS
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS essaimages (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id       uuid        NOT NULL REFERENCES ruches(id),
  inspection_id         uuid        REFERENCES interventions(id) ON DELETE SET NULL,
  date_essaimage        timestamptz NOT NULL,
  essaim_recupere       boolean     NOT NULL,
  ruche_destination_id  uuid        REFERENCES ruches(id),
  nouvelle_ruche_cree   boolean     DEFAULT false,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-9. EMPILEMENTS (fusion colonies)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS empilements (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id      uuid        NOT NULL REFERENCES ruches(id),
  ruche_destination_id uuid        NOT NULL REFERENCES ruches(id),
  inspection_id        uuid        REFERENCES interventions(id) ON DELETE SET NULL,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-10. ÉVÉNEMENTS SANITAIRES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evenements_sanitaires (
  id              uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid                      NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id        uuid                      NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  inspection_id   uuid                      REFERENCES interventions(id) ON DELETE SET NULL,
  type_evenement  type_evenement_sanitaire  NOT NULL,
  cause_probable  cause_mortalite,
  date_constat    timestamptz,
  declaration_gdsa boolean,
  type_nettoyage  text,
  produit_utilise text,
  type_couvain    text,
  nombre_cadres   integer,
  notes           text,
  photos          jsonb                     DEFAULT '[]',
  created_at      timestamptz               NOT NULL DEFAULT now(),
  updated_at      timestamptz               NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- P2-11. TRANSVASEMENTS
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transvasements (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid          NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_source_id       uuid          NOT NULL REFERENCES ruches(id),
  ruche_destination_id  uuid          NOT NULL REFERENCES ruches(id),
  inspection_id         uuid          REFERENCES interventions(id) ON DELETE SET NULL,
  cadres_transferes     integer       NOT NULL,
  devenir_ruche_source  devenir_ruche NOT NULL,
  lieu_stockage         text,
  notes                 text,
  created_at            timestamptz   NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS — TOUTES LES TABLES
-- Optimisation Supabase : (select auth.uid()) évalué UNE SEULE FOIS
-- au lieu de auth.uid() réévalué par ligne
-- ============================================================

-- ── DROP Phase 2 policies (safe re-run, tables existent maintenant)

DROP POLICY IF EXISTS "user_own_pesees"                   ON pesees;
DROP POLICY IF EXISTS "user_own_comptages_varroa"         ON comptages_varroa;
DROP POLICY IF EXISTS "user_own_traitements_varroa"       ON traitements_varroa;
DROP POLICY IF EXISTS "user_own_mouvements_materiel"      ON mouvements_materiel;
DROP POLICY IF EXISTS "user_own_deplacements_ruches"      ON deplacements_ruches;
DROP POLICY IF EXISTS "user_own_divisions"                ON divisions;
DROP POLICY IF EXISTS "user_own_essaimages"               ON essaimages;
DROP POLICY IF EXISTS "user_own_empilements"              ON empilements;
DROP POLICY IF EXISTS "user_own_evenements_sanitaires"    ON evenements_sanitaires;
DROP POLICY IF EXISTS "user_own_transvasements"           ON transvasements;
DROP POLICY IF EXISTS "divisions_ruches_via_division"     ON divisions_ruches;

-- ── 1. PROFILS

ALTER TABLE profils ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profils_user_isolation" ON profils
  FOR ALL USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ── 2. RUCHERS

ALTER TABLE ruchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ruchers_user_isolation" ON ruchers
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 3. RUCHES

ALTER TABLE ruches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ruches_user_isolation" ON ruches
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 4. INTERVENTIONS

ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interventions_user_isolation" ON interventions
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 5. RECOLTES

ALTER TABLE recoltes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recoltes_user_isolation" ON recoltes
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 6. STOCKS

ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stocks_user_isolation" ON stocks
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 6b. PRODUITS_CATALOGUE (presets de produits hors miel, éditables)

CREATE TABLE IF NOT EXISTS produits_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  nom text NOT NULL,
  categorie categorie_stock NOT NULL,
  categorie_vente categorie_vente,
  taux_tva numeric(4,1),
  unite_typique text,
  mode_prix mode_prix NOT NULL DEFAULT 'format',
  conditionnement text,
  contenance numeric(10,3),
  unite_contenance text,
  icon text,
  groupe text,
  est_defaut boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_produits_catalogue_user ON produits_catalogue(user_id);
ALTER TABLE produits_catalogue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "produits_catalogue_user_isolation" ON produits_catalogue;
CREATE POLICY "produits_catalogue_user_isolation" ON produits_catalogue
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 7. MOUVEMENTS_STOCK

ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mouvements_stock_user_isolation" ON mouvements_stock
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 8. CLIENTS

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_user_isolation" ON clients
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 9. TRANSACTIONS

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_user_isolation" ON transactions
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 10. ALERTES

ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alertes_user_isolation" ON alertes
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 11. MEMBRES — Policy unique fusionnée (owner OU membre accepté)

ALTER TABLE membres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membres_access" ON membres
  FOR ALL
  USING (
    owner_id = (select auth.uid())
    OR (user_id = (select auth.uid()) AND statut = 'acceptee')
  )
  WITH CHECK (owner_id = (select auth.uid()));

-- ── 12. PESÉES

ALTER TABLE pesees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_pesees" ON pesees
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 13. COMPTAGES VARROA

ALTER TABLE comptages_varroa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_comptages_varroa" ON comptages_varroa
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 14. TRAITEMENTS VARROA

ALTER TABLE traitements_varroa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_traitements_varroa" ON traitements_varroa
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 15. MOUVEMENTS MATÉRIEL

ALTER TABLE mouvements_materiel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_mouvements_materiel" ON mouvements_materiel
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 16. DÉPLACEMENTS RUCHES

ALTER TABLE deplacements_ruches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_deplacements_ruches" ON deplacements_ruches
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 17. DIVISIONS

ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_divisions" ON divisions
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 17b. DIVISIONS_RUCHES (pas de user_id → policy via FK division parent)

ALTER TABLE divisions_ruches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "divisions_ruches_via_division" ON divisions_ruches
  FOR ALL
  USING (division_id IN (SELECT id FROM divisions WHERE user_id = (select auth.uid())))
  WITH CHECK (division_id IN (SELECT id FROM divisions WHERE user_id = (select auth.uid())));

-- ── 18. ESSAIMAGES

ALTER TABLE essaimages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_essaimages" ON essaimages
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 19. EMPILEMENTS

ALTER TABLE empilements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_empilements" ON empilements
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 20. ÉVÉNEMENTS SANITAIRES

ALTER TABLE evenements_sanitaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_evenements_sanitaires" ON evenements_sanitaires
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── 21. TRANSVASEMENTS

ALTER TABLE transvasements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_transvasements" ON transvasements
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- INDEXES PERFORMANCE — Phase 2
-- ============================================================

-- Index (ruche_id, created_at DESC) sur chaque table liée aux ruches
CREATE INDEX IF NOT EXISTS idx_pesees_ruche                ON pesees(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comptages_varroa_ruche      ON comptages_varroa(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traitements_varroa_ruche    ON traitements_varroa(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mouvements_materiel_ruche   ON mouvements_materiel(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deplacements_ruches_ruche   ON deplacements_ruches(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_divisions_ruche_source      ON divisions(ruche_source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_essaimages_ruche_source     ON essaimages(ruche_source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_empilements_ruche_source    ON empilements(ruche_source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evenements_sanitaires_ruche ON evenements_sanitaires(ruche_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transvasements_ruche_source ON transvasements(ruche_source_id, created_at DESC);

-- Index sur inspection_id pour les jointures depuis interventions
CREATE INDEX IF NOT EXISTS idx_pesees_inspection                ON pesees(inspection_id);
CREATE INDEX IF NOT EXISTS idx_comptages_varroa_inspection      ON comptages_varroa(inspection_id);
CREATE INDEX IF NOT EXISTS idx_traitements_varroa_inspection    ON traitements_varroa(inspection_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_materiel_inspection   ON mouvements_materiel(inspection_id);
CREATE INDEX IF NOT EXISTS idx_deplacements_ruches_inspection   ON deplacements_ruches(inspection_id);
CREATE INDEX IF NOT EXISTS idx_divisions_inspection             ON divisions(inspection_id);
CREATE INDEX IF NOT EXISTS idx_essaimages_inspection            ON essaimages(inspection_id);
CREATE INDEX IF NOT EXISTS idx_empilements_inspection           ON empilements(inspection_id);
CREATE INDEX IF NOT EXISTS idx_evenements_sanitaires_inspection ON evenements_sanitaires(inspection_id);
CREATE INDEX IF NOT EXISTS idx_transvasements_inspection        ON transvasements(inspection_id);
CREATE INDEX IF NOT EXISTS idx_recoltes_inspection              ON recoltes(inspection_id);

-- ============================================================
-- PHASE 3 — Module Reine, Templates, Calendrier ICS, Analytics
-- ============================================================

-- ── ENUMS Phase 3 ───────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE type_evenement_reine AS ENUM (
    'introduction', 'marquage', 'clipping', 'remplacement',
    'perte', 'ponte_vue', 'cellule_royale_trouvee', 'elevage'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE couleur_reine AS ENUM ('blanc', 'jaune', 'rouge', 'vert', 'bleu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE origine_reine AS ENUM ('elevage_propre', 'achat', 'capture_essaim', 'inconnue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE action_orpheline AS ENUM ('attente', 'introduction_reine', 'fusion', 'abandon');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Colonnes Phase 3 sur profils ────────────────────────────

ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ── Colonnes Trial Pro 60j (2 mois) ─────────────────────────
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS trial_active  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_used    BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Colonnes Phase 3 sur ruches ─────────────────────────────

ALTER TABLE ruches
  ADD COLUMN IF NOT EXISTS couleur_personnalisee TEXT,
  ADD COLUMN IF NOT EXISTS reine_presente BOOLEAN,
  ADD COLUMN IF NOT EXISTS reine_couleur couleur_reine,
  ADD COLUMN IF NOT EXISTS reine_annee INTEGER,
  ADD COLUMN IF NOT EXISTS reine_race race_abeille DEFAULT 'inconnue',
  ADD COLUMN IF NOT EXISTS reine_origine origine_reine DEFAULT 'inconnue',
  ADD COLUMN IF NOT EXISTS reine_date_introduction TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reine_qualite_ponte INTEGER CHECK (reine_qualite_ponte BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS reine_douceur INTEGER CHECK (reine_douceur BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS reine_prolificite INTEGER CHECK (reine_prolificite BETWEEN 1 AND 5);

-- ── Table evenements_reine ───────────────────────────────────

CREATE TABLE IF NOT EXISTS evenements_reine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id UUID NOT NULL REFERENCES ruches(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES interventions(id) ON DELETE SET NULL,
  type_evenement type_evenement_reine NOT NULL,
  date_evenement TIMESTAMPTZ NOT NULL,
  couleur couleur_reine,
  origine origine_reine,
  action_orpheline action_orpheline,
  qualite_ponte INTEGER CHECK (qualite_ponte BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table templates_intervention ────────────────────────────

CREATE TABLE IF NOT EXISTS templates_intervention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  categories JSONB DEFAULT '[]'::JSONB,
  donnees_defaut JSONB DEFAULT '{}'::JSONB,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table tokens_calendrier ──────────────────────────────────

CREATE TABLE IF NOT EXISTS tokens_calendrier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'all',
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  derniere_utilisation TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS Phase 3 ─────────────────────────────────────────────

ALTER TABLE evenements_reine ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_evenements_reine" ON evenements_reine;
CREATE POLICY "user_own_evenements_reine" ON evenements_reine
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER TABLE templates_intervention ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_templates_intervention" ON templates_intervention;
CREATE POLICY "user_own_templates_intervention" ON templates_intervention
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER TABLE tokens_calendrier ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_tokens_calendrier" ON tokens_calendrier;
CREATE POLICY "user_own_tokens_calendrier" ON tokens_calendrier
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Lecture publique pour les tokens ICS (endpoint sans auth)
DROP POLICY IF EXISTS "public_read_tokens_calendrier" ON tokens_calendrier;
CREATE POLICY "public_read_tokens_calendrier" ON tokens_calendrier
  FOR SELECT USING (actif = true);

-- ── Index Phase 3 ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_evenements_reine_ruche   ON evenements_reine(ruche_id, date_evenement DESC);
CREATE INDEX IF NOT EXISTS idx_evenements_reine_user    ON evenements_reine(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user           ON templates_intervention(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_calendrier_token  ON tokens_calendrier(token);
CREATE INDEX IF NOT EXISTS idx_tokens_calendrier_user   ON tokens_calendrier(user_id);

-- ============================================================
-- PHASE 4 — Hausses QR, Organisations, Campagnes groupées
-- ============================================================

-- ── ENUMS Phase 4 ────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE statut_hausse AS ENUM ('disponible', 'en_service', 'en_stock', 'hors_service');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE statut_campagne AS ENUM ('brouillon', 'ouverte', 'fermee', 'en_traitement', 'terminee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE statut_commande AS ENUM ('en_attente', 'validee', 'payee', 'annulee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE type_organisation AS ENUM ('gdsa', 'syndicat', 'cuma', 'gie', 'gaec', 'association', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLE: HAUSSES ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hausses (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  ruche_id          UUID        REFERENCES ruches(id) ON DELETE SET NULL,
  numero            TEXT        NOT NULL,
  type              type_ruche  NOT NULL,
  nombre_cadres     INTEGER     DEFAULT 10,
  statut            statut_hausse NOT NULL DEFAULT 'disponible',
  annee_acquisition INTEGER,
  qr_code_data      TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hausses_user_id  ON hausses(user_id);
CREATE INDEX IF NOT EXISTS idx_hausses_ruche_id ON hausses(ruche_id);

-- ── TABLE: ORGANISATIONS ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS organisations (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID              NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  nom               TEXT              NOT NULL,
  type              type_organisation NOT NULL,
  siret             TEXT,
  adresse           TEXT,
  code_postal       TEXT,
  ville             TEXT,
  email             TEXT,
  telephone         TEXT,
  logo_url          TEXT,
  cgv_url           TEXT,
  stripe_account_id TEXT,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organisations_owner_id ON organisations(owner_id);

-- ── TABLE: CAMPAGNES COMMANDE ─────────────────────────────────

CREATE TABLE IF NOT EXISTS campagnes_commande (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID            NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  nom             TEXT            NOT NULL,
  description     TEXT,
  date_ouverture  TIMESTAMPTZ     NOT NULL,
  date_fermeture  TIMESTAMPTZ     NOT NULL,
  statut          statut_campagne NOT NULL DEFAULT 'brouillon',
  token_public    TEXT            NOT NULL UNIQUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campagnes_commande_org   ON campagnes_commande(organisation_id);
CREATE INDEX IF NOT EXISTS idx_campagnes_commande_token ON campagnes_commande(token_public);

-- ── TABLE: PRODUITS CAMPAGNE ──────────────────────────────────

CREATE TABLE IF NOT EXISTS produits_campagne (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id      UUID        NOT NULL REFERENCES campagnes_commande(id) ON DELETE CASCADE,
  nom              TEXT        NOT NULL,
  description      TEXT,
  prix_unitaire_ht NUMERIC(10,2) NOT NULL,
  taux_tva         NUMERIC(4,1)  NOT NULL,
  unite            TEXT        DEFAULT 'piece',
  stock_disponible INTEGER,
  quantite_min     INTEGER     DEFAULT 1,
  quantite_max     INTEGER,
  categorie        TEXT,
  photo_url        TEXT,
  ordre            INTEGER     DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produits_campagne_campagne ON produits_campagne(campagne_id);

-- ── TABLE: COMMANDES GROUPÉES ─────────────────────────────────

CREATE TABLE IF NOT EXISTS commandes_groupees (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id      UUID            NOT NULL REFERENCES campagnes_commande(id),
  membre_id        UUID            REFERENCES profils(id),
  nom_invite       TEXT,
  email_invite     TEXT,
  telephone_invite TEXT,
  statut           statut_commande NOT NULL DEFAULT 'en_attente',
  total_ht         NUMERIC(10,2),
  total_tva        NUMERIC(10,2),
  total_ttc        NUMERIC(10,2),
  lignes           JSONB           NOT NULL DEFAULT '[]',
  mode_paiement    TEXT,
  paiement_ref     TEXT,
  saisie_admin     BOOLEAN         DEFAULT false,
  token_qr         TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commandes_groupees_campagne  ON commandes_groupees(campagne_id);
CREATE INDEX IF NOT EXISTS idx_commandes_groupees_membre    ON commandes_groupees(membre_id);
CREATE INDEX IF NOT EXISTS idx_commandes_groupees_token_qr  ON commandes_groupees(token_qr);

-- ── RLS Phase 4 ──────────────────────────────────────────────

ALTER TABLE hausses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagnes_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits_campagne  ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes_groupees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hausses_owner"                ON hausses;
DROP POLICY IF EXISTS "organisations_owner"          ON organisations;
DROP POLICY IF EXISTS "campagnes_owner"              ON campagnes_commande;
DROP POLICY IF EXISTS "produits_campagne_owner"      ON produits_campagne;
DROP POLICY IF EXISTS "commandes_groupees_select"    ON commandes_groupees;
DROP POLICY IF EXISTS "commandes_groupees_insert"    ON commandes_groupees;
DROP POLICY IF EXISTS "commandes_groupees_update"    ON commandes_groupees;

CREATE POLICY "hausses_owner" ON hausses
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "organisations_owner" ON organisations
  FOR ALL USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "campagnes_owner" ON campagnes_commande
  FOR ALL USING (
    organisation_id IN (
      SELECT id FROM organisations WHERE owner_id = (select auth.uid())
    )
  );

CREATE POLICY "produits_campagne_owner" ON produits_campagne
  FOR ALL USING (
    campagne_id IN (
      SELECT c.id FROM campagnes_commande c
      JOIN organisations o ON o.id = c.organisation_id
      WHERE o.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "commandes_groupees_select" ON commandes_groupees
  FOR SELECT USING (
    membre_id = (select auth.uid())
    OR campagne_id IN (
      SELECT c.id FROM campagnes_commande c
      JOIN organisations o ON o.id = c.organisation_id
      WHERE o.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "commandes_groupees_insert" ON commandes_groupees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "commandes_groupees_update" ON commandes_groupees
  FOR UPDATE USING (
    campagne_id IN (
      SELECT c.id FROM campagnes_commande c
      JOIN organisations o ON o.id = c.organisation_id
      WHERE o.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- Migration Sprint Bugfix — FK manquantes + rucheId nullable
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. interventions.ruche_id devient nullable (rendez-vous pro sans ruche)
ALTER TABLE interventions ALTER COLUMN ruche_id DROP NOT NULL;

-- 2. divisions.ruche_source_id — ajouter ON DELETE CASCADE
ALTER TABLE divisions DROP CONSTRAINT IF EXISTS divisions_ruche_source_id_fkey;
ALTER TABLE divisions ADD CONSTRAINT divisions_ruche_source_id_fkey
  FOREIGN KEY (ruche_source_id) REFERENCES ruches(id) ON DELETE CASCADE;

-- 3. divisions_ruches.ruche_destination_id — ajouter ON DELETE CASCADE
ALTER TABLE divisions_ruches DROP CONSTRAINT IF EXISTS divisions_ruches_ruche_destination_id_fkey;
ALTER TABLE divisions_ruches ADD CONSTRAINT divisions_ruches_ruche_destination_id_fkey
  FOREIGN KEY (ruche_destination_id) REFERENCES ruches(id) ON DELETE CASCADE;

-- 4. essaimages.ruche_source_id — ajouter ON DELETE CASCADE
ALTER TABLE essaimages DROP CONSTRAINT IF EXISTS essaimages_ruche_source_id_fkey;
ALTER TABLE essaimages ADD CONSTRAINT essaimages_ruche_source_id_fkey
  FOREIGN KEY (ruche_source_id) REFERENCES ruches(id) ON DELETE CASCADE;

-- 5. essaimages.ruche_destination_id — ajouter ON DELETE SET NULL
ALTER TABLE essaimages DROP CONSTRAINT IF EXISTS essaimages_ruche_destination_id_fkey;
ALTER TABLE essaimages ADD CONSTRAINT essaimages_ruche_destination_id_fkey
  FOREIGN KEY (ruche_destination_id) REFERENCES ruches(id) ON DELETE SET NULL;

-- 6. empilements.ruche_source_id — ajouter ON DELETE CASCADE
ALTER TABLE empilements DROP CONSTRAINT IF EXISTS empilements_ruche_source_id_fkey;
ALTER TABLE empilements ADD CONSTRAINT empilements_ruche_source_id_fkey
  FOREIGN KEY (ruche_source_id) REFERENCES ruches(id) ON DELETE CASCADE;

-- 7. empilements.ruche_destination_id — ajouter ON DELETE CASCADE
ALTER TABLE empilements DROP CONSTRAINT IF EXISTS empilements_ruche_destination_id_fkey;
ALTER TABLE empilements ADD CONSTRAINT empilements_ruche_destination_id_fkey
  FOREIGN KEY (ruche_destination_id) REFERENCES ruches(id) ON DELETE CASCADE;

-- ============================================================
-- FEEDBACK — Auto-hébergé, zéro dépendance externe
-- ============================================================

CREATE TABLE IF NOT EXISTS feedbacks (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID      REFERENCES profils(id) ON DELETE SET NULL,
  profil_apicole TEXT     NOT NULL,
  nombre_ruches INTEGER,
  apprecie      TEXT,
  frustre       TEXT,
  nps           INTEGER   CHECK (nps >= 1 AND nps <= 10),
  email_contact TEXT,
  page_source   TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_insert_feedback"    ON feedbacks;
DROP POLICY IF EXISTS "users_can_read_own_feedback"  ON feedbacks;

CREATE POLICY "users_can_insert_feedback" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_can_read_own_feedback" ON feedbacks
  FOR SELECT USING (user_id = (select auth.uid()));

-- ============================================================
-- Sprint Facturation Électronique 2026 (décret n° 2022-1299)
-- ============================================================

-- Table clients — SIREN + adresse livraison
ALTER TABLE clients ADD COLUMN IF NOT EXISTS siren TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS adresse_livraison TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS code_postal_livraison TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ville_livraison TEXT;

-- Table transactions — catégorie opération (mention obligatoire n°3)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS categorie_operation TEXT;

-- Table transactions — remise + achats récurrents
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS remise DECIMAL(5,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_interval TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS next_recurring_date TIMESTAMPTZ;

-- Table profils — option TVA débits
ALTER TABLE profils ADD COLUMN IF NOT EXISTS option_tva_debits BOOLEAN NOT NULL DEFAULT false;

-- Franchise en base de TVA (art. 293 B CGI) — aucune TVA facturée + mention obligatoire.
ALTER TABLE profils ADD COLUMN IF NOT EXISTS franchise_tva BOOLEAN NOT NULL DEFAULT false;

-- ─── Sprint 1 — Conformité Administrative ────────────────────

-- Columns GDS pour profils
ALTER TABLE profils ADD COLUMN IF NOT EXISTS gds_departement TEXT;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS gds_cotisation_annee INTEGER;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS gds_a_jour BOOLEAN DEFAULT false;

-- Déclarations NAPI
CREATE TABLE IF NOT EXISTS declarations_napi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  annee INTEGER NOT NULL,
  date_declaration TIMESTAMPTZ NOT NULL,
  nombre_total_colonies INTEGER NOT NULL,
  nombre_ruches_production INTEGER DEFAULT 0,
  nombre_ruchettes INTEGER DEFAULT 0,
  nombre_nuclei INTEGER DEFAULT 0,
  ruchers_data JSONB NOT NULL DEFAULT '[]',
  recepisse_url TEXT,
  numero_recepisse TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, annee)
);

-- Vétérinaires
CREATE TABLE IF NOT EXISTS veterinaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  nom_complet TEXT NOT NULL,
  cabinet TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  numero_ordre TEXT,
  est_principal BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ordonnances
CREATE TABLE IF NOT EXISTS ordonnances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  veterinaire_id UUID REFERENCES veterinaires(id) ON DELETE SET NULL,
  date_prescription TIMESTAMPTZ NOT NULL,
  medicament TEXT NOT NULL,
  substance TEXT,
  posologie TEXT,
  duree_traitement_jours INTEGER,
  delai_attente_avant_recolte_jours INTEGER NOT NULL,
  ruches_concernees JSONB,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Visites sanitaires
CREATE TABLE IF NOT EXISTS visites_sanitaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  veterinaire_id UUID REFERENCES veterinaires(id) ON DELETE SET NULL,
  date_visite TIMESTAMPTZ NOT NULL,
  rucher_id UUID REFERENCES ruchers(id) ON DELETE SET NULL,
  observations TEXT,
  recommandations TEXT,
  rapport_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Mortalités
CREATE TABLE IF NOT EXISTS mortalites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  rucher_id UUID REFERENCES ruchers(id) ON DELETE SET NULL,
  date_constatee TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  nombre_colonies INTEGER NOT NULL,
  cause_suspectee TEXT,
  declaration_traces BOOLEAN DEFAULT false NOT NULL,
  declaration_assurance BOOLEAN DEFAULT false NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE declarations_napi ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordonnances ENABLE ROW LEVEL SECURITY;
ALTER TABLE visites_sanitaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortalites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_own_declarations_napi" ON declarations_napi FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "user_own_veterinaires" ON veterinaires FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "user_own_ordonnances" ON ordonnances FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "user_own_visites_sanitaires" ON visites_sanitaires FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "user_own_mortalites" ON mortalites FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Sprint 2 — Transhumance & Miellées ────────────────────

CREATE TABLE IF NOT EXISTS emplacements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  adresse TEXT,
  commune TEXT,
  code_postal TEXT,
  altitude_metres INTEGER,
  capacite_max_ruches INTEGER,
  miellees_principales TEXT[],
  proprietaire_terrain TEXT,
  proprietaire_telephone TEXT,
  accord_signe BOOLEAN DEFAULT false NOT NULL,
  loyer_annuel_euros NUMERIC(10,2),
  loyer_en_miel_kg NUMERIC(8,2),
  acces_difficulte TEXT,
  notes TEXT,
  est_actif BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS plans_transhumance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  annee INTEGER NOT NULL,
  rucher_origine_id UUID REFERENCES ruchers(id) ON DELETE SET NULL,
  emplacement_destination_id UUID REFERENCES emplacements(id) ON DELETE SET NULL,
  date_prevue TIMESTAMPTZ NOT NULL,
  date_retour_prevue TIMESTAMPTZ,
  date_realisee TIMESTAMPTZ,
  miellee TEXT,
  nombre_ruches_prevues INTEGER NOT NULL,
  nombre_ruches_realisees INTEGER,
  cout_carburant_euros NUMERIC(10,2),
  duree_minutes INTEGER,
  distance_km NUMERIC(8,1),
  production_kg NUMERIC(10,2),
  notes TEXT,
  statut TEXT NOT NULL DEFAULT 'planifie',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS floraisons_referentiel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  nom_latin TEXT,
  type_miel TEXT,
  region_principale TEXT,
  mois_debut INTEGER NOT NULL,
  jour_debut_typique INTEGER NOT NULL,
  duree_jours_typique INTEGER NOT NULL,
  altitude_min INTEGER,
  altitude_max INTEGER,
  latitude_min NUMERIC(6,3),
  latitude_max NUMERIC(6,3),
  potentiel_production_kg_ruche NUMERIC(5,2),
  remarques TEXT,
  emoji TEXT
);

ALTER TABLE emplacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_transhumance ENABLE ROW LEVEL SECURITY;
ALTER TABLE floraisons_referentiel ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_own_emplacements" ON emplacements FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "user_own_plans_transhumance" ON plans_transhumance FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  -- Table de référence (seed) : lecture pour tous les authentifiés, pas d'écriture via PostgREST
  CREATE POLICY "floraisons_referentiel_read" ON floraisons_referentiel FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed floraisons_referentiel
INSERT INTO floraisons_referentiel (nom, nom_latin, type_miel, region_principale, mois_debut, jour_debut_typique, duree_jours_typique, altitude_min, altitude_max, latitude_min, latitude_max, potentiel_production_kg_ruche, emoji)
SELECT * FROM (VALUES
  ('Romarin', 'Salvia rosmarinus', 'romarin', 'PACA', 2, 15, 45, 0, 800, 43.0, 45.0, 15.0, '🌿'),
  ('Colza', 'Brassica napus', 'colza', 'France', 3, 25, 30, 0, 500, 44.0, 51.0, 30.0, '🌼'),
  ('Saule', 'Salix', 'saule', 'France entière', 3, 1, 30, NULL, NULL, NULL, NULL, 5.0, '🌿'),
  ('Aubépine', 'Crataegus', 'aubépine', 'France', 4, 25, 15, NULL, NULL, NULL, NULL, 8.0, '🌸'),
  ('Pissenlit', 'Taraxacum', 'pissenlit', 'France', 4, 10, 30, NULL, NULL, NULL, NULL, 12.0, '🌼'),
  ('Acacia', 'Robinia pseudoacacia', 'acacia', 'France', 5, 5, 15, 0, 800, 43.0, 50.0, 25.0, '🌳'),
  ('Thym', 'Thymus vulgaris', 'thym', 'PACA/Languedoc', 5, 15, 45, NULL, NULL, NULL, NULL, 10.0, '🌿'),
  ('Ronce', 'Rubus fruticosus', 'ronce', 'France', 6, 1, 60, NULL, NULL, NULL, NULL, 12.0, '🌿'),
  ('Tilleul', 'Tilia', 'tilleul', 'France', 6, 10, 25, NULL, NULL, NULL, NULL, 20.0, '🌳'),
  ('Châtaignier', 'Castanea sativa', 'châtaignier', 'Centre/Sud', 6, 15, 25, 200, 1200, 43.0, 47.0, 18.0, '🌰'),
  ('Sapin (miellat)', 'Abies', 'sapin', 'Vosges/Jura/Alpes', 6, 15, 60, 600, 1800, 44.0, 49.0, 25.0, '🌲'),
  ('Lavande', 'Lavandula angustifolia', 'lavande', 'PACA', 6, 20, 40, 400, 1600, 43.0, 45.5, 22.0, '💜'),
  ('Lavandin', 'Lavandula × intermedia', 'lavandin', 'PACA', 7, 1, 35, 200, 800, 43.0, 45.0, 30.0, '💜'),
  ('Tournesol', 'Helianthus annuus', 'tournesol', 'Centre/Sud-Ouest', 7, 5, 30, 0, 500, 43.0, 49.0, 25.0, '🌻'),
  ('Sarrasin', 'Fagopyrum esculentum', 'sarrasin', 'Bretagne', 7, 15, 30, NULL, NULL, NULL, NULL, 18.0, '🌾'),
  ('Bruyère callune', 'Calluna vulgaris', 'bruyère', 'Bretagne/Massif Central', 8, 1, 45, NULL, NULL, NULL, NULL, 15.0, '🌸'),
  ('Bruyère blanche', 'Erica arborea', 'bruyère blanche', 'Corse/Méditerranée', 11, 1, 90, NULL, NULL, NULL, NULL, 8.0, '🌸'),
  ('Lierre', 'Hedera helix', 'lierre', 'France', 9, 15, 30, NULL, NULL, NULL, NULL, 8.0, '🍃')
) AS v(nom, nom_latin, type_miel, region_principale, mois_debut, jour_debut_typique, duree_jours_typique, altitude_min, altitude_max, latitude_min, latitude_max, potentiel_production_kg_ruche, emoji)
WHERE NOT EXISTS (SELECT 1 FROM floraisons_referentiel LIMIT 1);

-- ─── Sprint 3 — Élevage de reines ────────────────────

CREATE TABLE IF NOT EXISTS lignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  race TEXT NOT NULL,
  origine TEXT,
  date_creation TIMESTAMPTZ NOT NULL,
  notes TEXT,
  est_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS reines_elevage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  ruche_id UUID REFERENCES ruches(id) ON DELETE SET NULL,
  lignee_id UUID REFERENCES lignees(id) ON DELETE SET NULL,
  reine_mere_id UUID REFERENCES reines_elevage(id) ON DELETE SET NULL,
  identifiant TEXT,
  couleur_marquage TEXT,
  annee_naissance INTEGER,
  date_introduction TIMESTAMPTZ,
  origine TEXT,
  fournisseur TEXT,
  est_insemine BOOLEAN DEFAULT false NOT NULL,
  station_fecondation TEXT,
  est_active BOOLEAN DEFAULT true NOT NULL,
  date_remplacement TIMESTAMPTZ,
  cause_remplacement TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions_greffage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  date_greffage TIMESTAMPTZ NOT NULL,
  reine_mere_id UUID REFERENCES reines_elevage(id) ON DELETE SET NULL,
  ruche_eleveuse TEXT,
  nombre_cellules_greffees INTEGER NOT NULL,
  nombre_cellules_acceptees INTEGER,
  nombre_cellules_naissance INTEGER,
  date_naissance_prevue TIMESTAMPTZ,
  date_mise_nuclei_prevue TIMESTAMPTZ,
  technique TEXT,
  notes TEXT,
  est_terminee BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS tests_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE NOT NULL,
  reine_id UUID REFERENCES reines_elevage(id) ON DELETE CASCADE NOT NULL,
  saison INTEGER NOT NULL,
  productivite_miel_kg NUMERIC(8,2),
  douceur INTEGER CHECK (douceur BETWEEN 1 AND 5),
  tenue_cadre INTEGER CHECK (tenue_cadre BETWEEN 1 AND 5),
  hygienisme_pin_test_pct INTEGER,
  resistance_varroa_pct_infestation NUMERIC(5,2),
  tendance_essaimage INTEGER CHECK (tendance_essaimage BETWEEN 1 AND 5),
  hivernage INTEGER CHECK (hivernage BETWEEN 1 AND 5),
  vigueur_printemps INTEGER CHECK (vigueur_printemps BETWEEN 1 AND 5),
  ponte_qualite INTEGER CHECK (ponte_qualite BETWEEN 1 AND 5),
  index_composite NUMERIC(5,2),
  observations TEXT,
  date_evaluation TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(reine_id, saison)
);

ALTER TABLE lignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reines_elevage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_greffage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests_performance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "user_own_lignees" ON lignees FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_own_reines_elevage" ON reines_elevage FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_own_sessions_greffage" ON sessions_greffage FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_own_tests_performance" ON tests_performance FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Sprint BL — Bons de livraison ───────────────────────────
CREATE TABLE IF NOT EXISTS bons_livraison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  date_creation TIMESTAMPTZ NOT NULL,
  date_livraison TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'brouillon',
  lignes JSONB NOT NULL DEFAULT '[]',
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  notes TEXT,
  adresse_livraison TEXT,
  code_postal_livraison TEXT,
  ville_livraison TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE bons_livraison ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "user_own_bons_livraison" ON bons_livraison FOR ALL USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────
-- Colonnes photos JSONB (Sprint Photos)
-- ──────────────────────────────────────────────
ALTER TABLE ruches      ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]';
ALTER TABLE recoltes    ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]';
ALTER TABLE stocks      ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]';
-- interventions.photos existe déjà depuis Phase 2

-- Buckets Supabase Storage (à exécuter dans le SQL Editor Supabase)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
--   ('interventions-photos', 'interventions-photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
--   ('ruches-photos',        'ruches-photos',        false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
--   ('produits-photos',      'produits-photos',      false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
--   ('recoltes-photos',      'recoltes-photos',      false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
-- ON CONFLICT (id) DO NOTHING;
-- CREATE POLICY "photos_owner" ON storage.objects FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);

-- ──────────────────────────────────────────────
-- Sprint Sécurité — Audit, Connexions, Lockout
-- ──────────────────────────────────────────────

-- Journal d'audit : trace toutes les actions sensibles (login, logout, delete, export, MFA, admin)
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip          TEXT,
  user_agent  TEXT,
  metadata    JSONB,
  success     BOOLEAN DEFAULT true NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Pas de RLS : table interne lue uniquement côté serveur (service role)
-- Index pour les requêtes admin par user ou par action
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx  ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at DESC);

-- Refacto auth (juil. 2026) : login/reset passent désormais 100 % par Supabase
-- (le front appelle directement supabase.auth), donc login-lockout.ts +
-- connexion-tracker.ts ont été supprimés. Les tables `connexions` et
-- `login_attempts` qu'ils alimentaient sont ORPHELINES → on les droppe
-- (idempotent, nettoie les DB déjà provisionnées). Le brute-force login est
-- désormais couvert par Supabase Auth + le CAPTCHA Turnstile.
-- NB : `audit_log` ci-dessus reste utilisée (logAudit).
DROP TABLE IF EXISTS connexions CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;

-- Sprint Pricing + Stocks matériel/produits + Stripe webhook ordering
-- ──────────────────────────────────────────────────────────────────

-- Nouveaux enums PR #20 / #21
DO $$ BEGIN
  CREATE TYPE type_stock AS ENUM ('materiel', 'produit_vente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mode_prix AS ENUM ('format', 'poids');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- stocks : type de stock + tarification poids/format (PR #20, #21)
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS type         type_stock  NOT NULL DEFAULT 'materiel';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS mode_prix    mode_prix   NOT NULL DEFAULT 'format';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS contenance   NUMERIC(10, 3);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS unite_contenance TEXT;

-- produits_campagne : tarification poids/format (PR #20)
ALTER TABLE produits_campagne ADD COLUMN IF NOT EXISTS mode_prix         mode_prix NOT NULL DEFAULT 'format';
ALTER TABLE produits_campagne ADD COLUMN IF NOT EXISTS contenance         NUMERIC(10, 3);
ALTER TABLE produits_campagne ADD COLUMN IF NOT EXISTS unite_contenance  TEXT;

-- profils : ordering webhook Stripe — évite les replays hors-ordre (PR #24)
ALTER TABLE profils ADD COLUMN IF NOT EXISTS last_stripe_event_at TIMESTAMPTZ;

-- ============================================================
-- ANALYTICS PRODUIT — comportement utilisateur (PR #25)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE type_evenement_activite AS ENUM ('page', 'action');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Colonnes présence sur profils
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS derniere_activite_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS derniere_page        TEXT;

-- Journal d'activité produit
CREATE TABLE IF NOT EXISTS evenements_activite (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  type        type_evenement_activite NOT NULL,
  nom         TEXT        NOT NULL,
  titre       TEXT,
  duree_ms    INTEGER,
  session_id  TEXT,
  ip          TEXT,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evenements_activite_user     ON evenements_activite(user_id);
CREATE INDEX IF NOT EXISTS idx_evenements_activite_created  ON evenements_activite(created_at);
CREATE INDEX IF NOT EXISTS idx_evenements_activite_type_nom ON evenements_activite(type, nom);

ALTER TABLE evenements_activite ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='evenements_activite' AND policyname='evenements_activite_user_select') THEN
    EXECUTE 'CREATE POLICY "evenements_activite_user_select" ON evenements_activite FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='evenements_activite' AND policyname='evenements_activite_user_insert') THEN
    EXECUTE 'CREATE POLICY "evenements_activite_user_insert" ON evenements_activite FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- ============================================================
-- Sprint Alertes v2 (resolved_at + push_notif_prefs)
-- ============================================================
ALTER TABLE alertes ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS push_notif_prefs JSONB DEFAULT '{"visite_requise":true,"sante_critique":true,"stock_bas":true,"facture_retard":true}'::jsonb;

-- ============================================================
-- Sprint Démos — prise de rdv prospects (parcours public)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_demande_demo') THEN
    CREATE TYPE statut_demande_demo AS ENUM ('nouveau','contacte','planifie','realise','annule');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS demandes_demo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom          TEXT NOT NULL,
  nom             TEXT NOT NULL,
  email           TEXT NOT NULL,
  telephone       TEXT NOT NULL,
  objectif        TEXT NOT NULL,
  creneau_periode TEXT,
  creneau_jour    TEXT,
  creneau_moment  TEXT,
  statut          statut_demande_demo NOT NULL DEFAULT 'nouveau',
  notes           TEXT,
  rdv_at          TIMESTAMPTZ,
  source          TEXT,
  ip              TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demandes_demo_statut  ON demandes_demo(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_demo_created ON demandes_demo(created_at);

-- Anti-double-réservation : un seul rdv actif par créneau (les annulés libèrent).
CREATE UNIQUE INDEX IF NOT EXISTS idx_demandes_demo_rdv_actif
  ON demandes_demo(rdv_at)
  WHERE statut <> 'annule' AND rdv_at IS NOT NULL;

-- RLS activée SANS policy : table accédée uniquement côté serveur (connexion
-- directe qui bypass RLS). Aucun accès anon/authenticated direct.
ALTER TABLE demandes_demo ENABLE ROW LEVEL SECURITY;

-- ── Codes promo / sponsoring ──────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_sponsoring') THEN
    CREATE TYPE type_sponsoring AS ENUM ('ambassadeur','syndicat','magasin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS codes_promo (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                     TEXT NOT NULL UNIQUE,
  sponsor_nom              TEXT NOT NULL,
  type_sponsoring          type_sponsoring NOT NULL,
  reduction_pourcent       INTEGER NOT NULL,
  duree_mois               INTEGER NOT NULL,
  stripe_coupon_id         TEXT NOT NULL,
  stripe_promotion_code_id TEXT NOT NULL,
  max_redemptions          INTEGER,
  actif                    BOOLEAN NOT NULL DEFAULT TRUE,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_codes_promo_code ON codes_promo(code);
CREATE INDEX IF NOT EXISTS idx_codes_promo_type ON codes_promo(type_sponsoring);

CREATE TABLE IF NOT EXISTS acquisitions_promo (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_promo_id        UUID NOT NULL REFERENCES codes_promo(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL,
  montant_remise_cents INTEGER NOT NULL DEFAULT 0,
  stripe_session_id    TEXT NOT NULL UNIQUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_acquisitions_promo_code ON acquisitions_promo(code_promo_id);
CREATE INDEX IF NOT EXISTS idx_acquisitions_promo_user ON acquisitions_promo(user_id);

-- Tables admin uniquement (gérées côté serveur) → RLS activée sans policy.
ALTER TABLE codes_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisitions_promo ENABLE ROW LEVEL SECURITY;

-- Surveillance frelon COMMUNAUTAIRE (carte partagée, validation par votes)
CREATE TABLE IF NOT EXISTS signalements_frelon (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id        UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  latitude         DECIMAL(10,7) NOT NULL,
  longitude        DECIMAL(10,7) NOT NULL,
  espece           frelon_espece   NOT NULL DEFAULT 'asiatique',
  type             frelon_type     NOT NULL DEFAULT 'nid_secondaire',
  pression         frelon_pression NOT NULL DEFAULT 'modere',
  statut           frelon_statut   NOT NULL DEFAULT 'a_verifier',
  date_observation TIMESTAMPTZ NOT NULL,
  commune          TEXT,
  hauteur_m        DECIMAL(5,1),
  notes            TEXT,
  photo_url        TEXT,
  confirmations    INTEGER NOT NULL DEFAULT 0,
  infirmations     INTEGER NOT NULL DEFAULT 0,
  destructions     INTEGER NOT NULL DEFAULT 0,
  score_fiabilite  INTEGER NOT NULL DEFAULT 50,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_frelon_auteur ON signalements_frelon(auteur_id);
CREATE INDEX IF NOT EXISTS idx_frelon_statut ON signalements_frelon(statut);

CREATE TABLE IF NOT EXISTS votes_frelon (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signalement_id  UUID NOT NULL REFERENCES signalements_frelon(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  vote            frelon_vote NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vote_frelon_user ON votes_frelon(signalement_id, user_id);
CREATE INDEX IF NOT EXISTS idx_vote_frelon_signalement ON votes_frelon(signalement_id);

-- Carte frelon = donnée communautaire partagée → RLS désactivée (lecture cross-tenant
-- assumée ; accès via API serveur service-role avec anonymisation de l'auteur).
ALTER TABLE signalements_frelon DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes_frelon ENABLE ROW LEVEL SECURITY;

-- Réputation communautaire frelon sur les profils
ALTER TABLE profils ADD COLUMN IF NOT EXISTS reputation_frelon INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Acceptation des documents contractuels (CGU / CGV) — preuve opposable
-- ============================================================
-- Horodatage + version acceptée. cgu/confidentialité acceptés à l'inscription ;
-- cgv acceptée au moment de la souscription d'un abonnement payant.
ALTER TABLE profils ADD COLUMN IF NOT EXISTS cgu_accepted_at TIMESTAMPTZ;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS cgu_version TEXT;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS cgv_accepted_at TIMESTAMPTZ;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS cgv_version TEXT;

-- ============================================================
-- Suivi des règlements — import relevé bancaire (PAS de la compta)
-- ============================================================
-- Mouvements bancaires importés (CSV/OFX, agrégateur plus tard) rapprochés aux factures
-- (transactions) pour les pointer « payée » et fiabiliser les relances d'impayés.
DO $$ BEGIN
  CREATE TYPE mouvement_bancaire_source AS ENUM ('import_csv', 'import_ofx', 'manuel', 'agregateur');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE mouvement_bancaire_statut AS ENUM ('a_rapprocher', 'rapproche', 'ignore');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS mouvements_bancaires (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  source             mouvement_bancaire_source NOT NULL DEFAULT 'import_csv',
  date_operation     TIMESTAMPTZ NOT NULL,
  montant            NUMERIC(12,2) NOT NULL,
  libelle            TEXT NOT NULL DEFAULT '',
  reference          TEXT,
  empreinte          TEXT NOT NULL,
  statut             mouvement_bancaire_statut NOT NULL DEFAULT 'a_rapprocher',
  transaction_id     UUID REFERENCES transactions(id) ON DELETE SET NULL,
  date_rapprochement TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mouvements_bancaires_user        ON mouvements_bancaires(user_id, date_operation);
CREATE INDEX IF NOT EXISTS idx_mouvements_bancaires_transaction ON mouvements_bancaires(transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_mouvement_bancaire_empreinte ON mouvements_bancaires(user_id, empreinte);

ALTER TABLE mouvements_bancaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mouvements_bancaires_user_isolation" ON mouvements_bancaires;
CREATE POLICY "mouvements_bancaires_user_isolation" ON mouvements_bancaires
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Connexions bancaires automatiques (agrégateur DSP2, facultatif).
DO $$ BEGIN
  CREATE TYPE connexion_bancaire_statut AS ENUM ('en_attente', 'liee', 'expiree', 'erreur');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS connexions_bancaires (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  requisition_id   TEXT NOT NULL,
  institution_id   TEXT NOT NULL,
  institution_nom  TEXT,
  statut           connexion_bancaire_statut NOT NULL DEFAULT 'en_attente',
  account_ids      JSONB DEFAULT '[]',
  derniere_sync    TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_connexions_bancaires_user ON connexions_bancaires(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_connexion_requisition ON connexions_bancaires(requisition_id);

ALTER TABLE connexions_bancaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "connexions_bancaires_user_isolation" ON connexions_bancaires;
CREATE POLICY "connexions_bancaires_user_isolation" ON connexions_bancaires
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- Index de performance (30/06) — jointures & filtres fréquents non couverts
-- ============================================================
-- transactions.client_id : LEFT JOIN clients sur chaque liste ventes/achats.
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
-- mouvements_stock (user_id, created_at) : historiques & audits par utilisateur.
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_user_created ON mouvements_stock(user_id, created_at DESC);
-- interventions (user_id, type, date_visite) : listes filtrées par type triées par date.
CREATE INDEX IF NOT EXISTS idx_interventions_user_type_date ON interventions(user_id, type, date_visite DESC);

-- ============================================================
-- Index de performance (03/07) — tables balayées par utilisateur sans index
-- ============================================================
-- membres : resolveWorkspace() interroge (user_id, statut='acceptee') sur QUASI
-- toutes les routes authentifiées → le plus systémique. + listes par propriétaire.
CREATE INDEX IF NOT EXISTS idx_membres_user_statut ON membres(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_membres_owner ON membres(owner_id);
-- Tables balayées par user_id dans le cron d'alertes (boucle sur tous les comptes).
CREATE INDEX IF NOT EXISTS idx_ordonnances_user ON ordonnances(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_transhumance_user ON plans_transhumance(user_id);
CREATE INDEX IF NOT EXISTS idx_reines_elevage_user ON reines_elevage(user_id);

-- ============================================================
-- DONE — 49 tables protégées RLS, 22 enums,
--        Phase 1 (core) + Phase 2 (interventions) +
--        Phase 3 (reine, templates, calendrier) +
--        Phase 4 (hausses, organisations, campagnes groupées) +
--        Sprint Bugfix (FK cascade, rucheId nullable) +
--        Sprint Facturation Électronique 2026 +
--        Sprint 1 Conformité Administrative (NAPI, vétérinaires, ordonnances, visites, mortalités) +
--        Sprint 2 Transhumance (emplacements, plans_transhumance, floraisons_referentiel) +
--        Sprint 3 Élevage de reines (lignees, reines_elevage, sessions_greffage, tests_performance) +
--        Sprint BL (bons_livraison) +
--        Sprint Photos (ruches/recoltes/stocks/interventions) +
--        Sprint Sécurité (audit_log ; connexions/login_attempts retirées — auth 100% Supabase) +
--        Sprint Pricing/Stocks (type_stock, mode_prix, contenance, last_stripe_event_at) +
--        Sprint Analytics (evenements_activite, présence profils)
-- ============================================================
