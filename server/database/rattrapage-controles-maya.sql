-- ═══════════════════════════════════════════════════════════════════════════
-- RATTRAPAGE — les contrôles dictés à Maya avant le correctif du dispatcher.
--
-- POURQUOI
-- Jusqu'au correctif, `insererInterventionTx` insérait le hub de l'intervention
-- et rien d'autre : le JSONB `donnees` en camelCase, et les colonnes plates
-- laissées nulles. Or les trois requêtes qui alimentent le score de santé, les
-- KPI du tableau de bord et la génération d'alertes lisent :
--
--     COALESCE((donnees->>'force_colonie')::int, force_colonie)
--
-- soit du snake_case dans le JSONB, avec repli sur la colonne plate. Le JSONB
-- étant en camelCase, la première branche est vide ; la colonne plate l'étant
-- aussi, la seconde l'est également. Une visite dictée à Maya était donc
-- enregistrée et visible dans la liste — mais invisible à tout le reste.
--
-- Les visites saisies par le FORMULAIRE ne sont pas concernées : elles passent
-- par `dispatchHandler` → `controle.ts`, qui remplit les colonnes plates. Le
-- repli fonctionne pour elles, et ce script ne les touche pas.
--
-- CE QUE FAIT CE SCRIPT
-- Il recopie dans les colonnes plates ce que le JSONB contient déjà, avec
-- exactement le même mapping que `server/services/interventions/controle.ts` —
-- y compris la conversion des booléens `couvainPresent`/`reserves` vers
-- l'échelle 1-5 attendue par le calcul de score (présent → 4, absent → 1).
--
-- Aucune donnée n'est inventée, aucune n'est écrasée : chaque colonne n'est
-- écrite que si elle est NULLE **et** que la clé existe dans le JSONB.
-- Le script est donc IDEMPOTENT — le rejouer ne change plus rien.
--
-- COMMENT L'EXÉCUTER
-- 1. Jouer d'abord la section CONSTAT seule, et lire les nombres.
-- 2. Ne jouer la section RATTRAPAGE que si le constat est cohérent.
-- 3. Rejouer la section VÉRIFICATION : « restants » doit être à 0.
--
-- Ce dépôt n'a pas de base de test et `.env` porte la PRODUCTION : à exécuter
-- dans l'éditeur SQL de Supabase, section par section, pas en une passe.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. CONSTAT ────────────────────────────────────────────────────────────
-- Combien de visites sont concernées, et depuis quand. À lire AVANT d'écrire.

SELECT
  count(*)                                              AS interventions_a_rattraper,
  count(DISTINCT user_id)                               AS comptes_concernes,
  min(date_visite)::date                                AS plus_ancienne,
  max(date_visite)::date                                AS plus_recente,
  count(*) FILTER (WHERE jsonb_exists(donnees, 'forceColonie'))      AS avec_force,
  count(*) FILTER (WHERE jsonb_exists(donnees, 'reineVue'))         AS avec_reine,
  count(*) FILTER (WHERE jsonb_exists(donnees, 'couvainPresent'))   AS avec_couvain,
  count(*) FILTER (WHERE jsonb_exists(donnees, 'reserves'))         AS avec_reserves,
  count(*) FILTER (WHERE jsonb_exists(donnees, 'celluleRoyale'))    AS avec_cellule_royale
FROM interventions
WHERE donnees IS NOT NULL
  -- Signature d'une écriture Maya : le JSONB porte les clés camelCase du
  -- schéma Zod, et AUCUNE colonne plate n'a été remplie.
  AND jsonb_exists_any(donnees, array['forceColonie', 'reineVue', 'couvainPresent', 'reserves', 'celluleRoyale'])
  AND force_colonie IS NULL
  AND reine_vue     IS NULL
  AND couvain       IS NULL
  AND reserves      IS NULL
  AND cellule_royale IS NULL;


-- ─── 2. RATTRAPAGE ─────────────────────────────────────────────────────────
-- Mapping identique à controle.ts. `jsonb_typeof` garde contre une valeur
-- inattendue (chaîne, null JSON) qui ferait échouer le cast sur toute la table.

UPDATE interventions SET
  force_colonie = COALESCE(
    force_colonie,
    CASE WHEN jsonb_typeof(donnees -> 'forceColonie') = 'number'
         THEN (donnees ->> 'forceColonie')::int END
  ),
  reine_vue = COALESCE(
    reine_vue,
    CASE WHEN jsonb_typeof(donnees -> 'reineVue') = 'boolean'
         THEN (donnees ->> 'reineVue')::boolean END
  ),
  cellule_royale = COALESCE(
    cellule_royale,
    CASE WHEN jsonb_typeof(donnees -> 'celluleRoyale') = 'boolean'
         THEN (donnees ->> 'celluleRoyale')::boolean END
  ),
  couvain_present = COALESCE(
    couvain_present,
    CASE WHEN jsonb_typeof(donnees -> 'couvainPresent') = 'boolean'
         THEN (donnees ->> 'couvainPresent')::boolean END
  ),
  -- Booléen → échelle 1-5 du calcul de score, comme controle.ts : 4 / 1.
  couvain = COALESCE(
    couvain,
    CASE WHEN jsonb_typeof(donnees -> 'couvainPresent') = 'boolean'
         THEN CASE WHEN (donnees ->> 'couvainPresent')::boolean THEN 4 ELSE 1 END END
  ),
  reserves = COALESCE(
    reserves,
    CASE WHEN jsonb_typeof(donnees -> 'reserves') = 'boolean'
         THEN CASE WHEN (donnees ->> 'reserves')::boolean THEN 4 ELSE 1 END END
  ),
  comportement = COALESCE(
    comportement,
    CASE WHEN jsonb_typeof(donnees -> 'comportement') = 'string'
         THEN donnees ->> 'comportement' END
  ),
  updated_at = now()
WHERE donnees IS NOT NULL
  AND jsonb_exists_any(donnees, array['forceColonie', 'reineVue', 'couvainPresent', 'reserves', 'celluleRoyale', 'comportement'])
  -- Ne toucher QUE les lignes réellement incomplètes : une visite dont les
  -- colonnes sont déjà remplies vient du formulaire et n'a rien à voir ici.
  AND (
    (force_colonie   IS NULL AND jsonb_typeof(donnees -> 'forceColonie')   = 'number')
    OR (reine_vue       IS NULL AND jsonb_typeof(donnees -> 'reineVue')       = 'boolean')
    OR (cellule_royale  IS NULL AND jsonb_typeof(donnees -> 'celluleRoyale')  = 'boolean')
    OR (couvain_present IS NULL AND jsonb_typeof(donnees -> 'couvainPresent') = 'boolean')
    OR (couvain         IS NULL AND jsonb_typeof(donnees -> 'couvainPresent') = 'boolean')
    OR (reserves        IS NULL AND jsonb_typeof(donnees -> 'reserves')       = 'boolean')
    OR (comportement    IS NULL AND jsonb_typeof(donnees -> 'comportement')   = 'string')
  );


-- ─── 3. VÉRIFICATION ───────────────────────────────────────────────────────
-- « restants » doit valoir 0. Sinon, les lignes restantes portent des valeurs
-- d'un type inattendu dans le JSONB : les inspecter avant d'insister.

SELECT count(*) AS restants
FROM interventions
WHERE donnees IS NOT NULL
  AND jsonb_typeof(donnees -> 'forceColonie') = 'number'
  AND force_colonie IS NULL;


-- ─── 4. À NE PAS OUBLIER ───────────────────────────────────────────────────
-- Le score de santé et les alertes sont recalculés à la lecture : rien d'autre
-- à régénérer. En revanche les ALERTES que `controle.ts` aurait levées à
-- l'époque (cellule royale → risque d'essaimage, colonie faible) n'ont jamais
-- été créées, et ce script ne les rejoue pas : lever aujourd'hui une alerte
-- d'essaimage sur une visite d'il y a trois mois serait un faux signal.
-- Le prochain contrôle sur ces ruches les produira normalement.
