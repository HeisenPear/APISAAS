-- ═══════════════════════════════════════════════════════════════════════════
-- INVARIANTS EN LECTURE — exactement ce que vérifie tests/integration/invariants.test.ts
--
-- Aucune écriture. Aucun verrou. Sûr à jouer sur la production, y compris en
-- pleine journée. C'est la même chose que `npm run test:invariants`, sous une
-- forme qui ne demande aucune chaîne de connexion à sortir de Supabase.
--
-- À jouer d'une traite dans l'éditeur SQL : chaque bloc rend une ligne de
-- verdict. Tout ce qui n'est pas « OK » mérite un regard.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. PLAFONDS DE CHEPTEL ────────────────────────────────────────────────
-- L'invariant du 3 août : trois comptes Découverte portaient 12, 35 et 80
-- colonies. Les plafonds sont ceux de app/config/plans.ts — Découverte 1,
-- Starter 10, Pro et Expert illimités. Statuts hors quota identiques à
-- quotaRuches.ts : un compteur qui divergerait rendrait le contrôle inutile.
--
-- Un compte listé ici n'est pas forcément un bug : ce peut être une
-- rétrogradation (le verrou rend les ruches excédentaires inaccessibles sans
-- les supprimer). Ce qui doit alerter, c'est un compte qui n'a JAMAIS payé.

SELECT
  p.id                                   AS compte,
  p.email,
  p.plan,
  count(r.id)::int                       AS ruches_actives,
  CASE p.plan WHEN 'decouverte' THEN 1 WHEN 'starter' THEN 10 END AS plafond,
  p.stripe_subscription_id IS NOT NULL   AS a_un_abonnement,
  p.trial_started_at IS NOT NULL         AS a_eu_un_essai
FROM profils p
JOIN ruches r ON r.user_id = p.id
WHERE p.plan IN ('decouverte', 'starter')
  AND r.statut NOT IN ('morte', 'vendue', 'fusionnee')
GROUP BY p.id, p.email, p.plan, p.stripe_subscription_id, p.trial_started_at
HAVING count(r.id) > CASE p.plan WHEN 'decouverte' THEN 1 WHEN 'starter' THEN 10 END
ORDER BY count(r.id) DESC;
-- Attendu : 0 ligne. Sinon, regarder `a_un_abonnement` et `a_eu_un_essai` —
-- les deux à `false` désignent une porte ouverte, pas une rétrogradation.


-- ─── 2. RUCHES ORPHELINES ──────────────────────────────────────────────────
SELECT count(*)::int AS ruches_sans_rucher
FROM ruches r
LEFT JOIN ruchers x ON x.id = r.rucher_id
WHERE r.rucher_id IS NOT NULL AND x.id IS NULL;
-- Attendu : 0.


-- ─── 3. CLOISONNEMENT ENTRE EXPLOITATIONS ──────────────────────────────────
-- Une ruche rattachée au rucher d'un AUTRE compte serait une fuite entre
-- exploitations que les politiques RLS ne rattraperaient pas : elles filtrent
-- sur `user_id`, pas sur la cohérence du lien.

SELECT count(*)::int AS liens_croises
FROM ruches r
JOIN ruchers x ON x.id = r.rucher_id
WHERE r.user_id <> x.user_id;
-- Attendu : 0. Toute valeur non nulle est à traiter en priorité.


-- ─── 4. VISITES DICTÉES SANS COLONNES PLATES ───────────────────────────────
-- Le défaut corrigé : Maya écrivait le JSONB en camelCase et laissait
-- `force_colonie`, `reine_vue`… nulles, alors que le score de santé et les
-- alertes les lisent. Tant que ce compte n'est pas à 0, le rattrapage
-- (server/database/rattrapage-controles-maya.sql) n'a pas été joué.

SELECT
  count(*)::int          AS visites_a_rattraper,
  count(DISTINCT user_id) AS comptes_concernes,
  min(date_visite)::date  AS plus_ancienne
FROM interventions
WHERE donnees IS NOT NULL
  AND jsonb_typeof(donnees -> 'forceColonie') = 'number'
  AND force_colonie IS NULL;
-- Attendu APRÈS rattrapage : 0. Avant : c'est le volume à traiter.


-- ─── 5. UNICITÉ DES NUMÉROS DE LOT ─────────────────────────────────────────
SELECT count(*)::int AS numeros_de_lot_en_double
FROM (
  SELECT user_id, numero_lot
  FROM conditionnements
  GROUP BY user_id, numero_lot
  HAVING count(*) > 1
) d;
-- Attendu : 0 — un index unique le garantit, ce contrôle vérifie qu'il existe
-- bien sur la base réelle et pas seulement dans le schéma Drizzle.


-- ─── 6. COMPTES DE HARNAIS OUBLIÉS ─────────────────────────────────────────
-- Le harnais de tests supprime son compte éphémère en `finally`, mais un
-- processus tué n'exécute pas de `finally`. Un compte oublié fausserait le
-- contrôle n°1 (« un Découverte avec 40 ruches » qui serait le nôtre).

SELECT count(*)::int AS comptes_harnais_orphelins
FROM profils
WHERE email LIKE 'harnais+%@example.invalid';
-- Attendu : 0. Sinon : DELETE FROM profils WHERE email LIKE 'harnais+%@example.invalid';


-- ─── 7. COHÉRENCE ABONNEMENT / PLAN ────────────────────────────────────────
-- Bonus, hors bancs : un plan payant sans abonnement Stripe ni essai en cours
-- est soit un geste commercial volontaire, soit un webhook manqué. Les deux
-- méritent d'être vus.

SELECT id AS compte, email, plan, trial_active, last_stripe_event_at
FROM profils
WHERE plan <> 'decouverte'
  AND stripe_subscription_id IS NULL
  AND trial_active IS NOT TRUE
ORDER BY plan;
-- Attendu : uniquement des comptes que vous reconnaissez (démos, proches).
