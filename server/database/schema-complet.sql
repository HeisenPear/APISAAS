-- Apiculture 360° — Schema complet + RLS + Phase 2
-- PostgreSQL 16 / Supabase
-- ============================================================
-- Ce fichier est la référence UNIQUE à exécuter dans Supabase SQL Editor.
-- Il inclut : Phase 1 (tables de base) + Phase 2 (interventions spécialisées).
-- Safe re-run : IF NOT EXISTS / IF EXISTS partout.
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

DO $$ BEGIN
  CREATE TYPE statut_invitation AS ENUM ('en_attente', 'acceptee', 'refusee');
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

-- Profils (Stripe — Phase 1 Session 9)
ALTER TABLE profils ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT;
ALTER TABLE profils ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Interventions (Phase 2 — nouvelles colonnes)
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS nourrissement_unite text;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS categories_activees jsonb DEFAULT '[]';
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS couvain_present boolean;

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
-- DONE — 22 tables protégées RLS (dont divisions_ruches via FK),
--        11 enums, 11 tables Phase 2,
--        5 colonnes ajoutées (interventions: 3, recoltes: 2),
--        4 colonnes Phase 1 (stocks: 2, profils: 2),
--        21 indexes performance,
--        Toutes policies avec (select auth.uid()) optimisé,
--        Membres : policy unique fusionnée (owner OR membre)
-- ============================================================
