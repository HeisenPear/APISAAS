// ═══════════════════════════════════════════════════════════════════════════
// REGISTRE DES ROUTES D'ÉCRITURE NON GATÉES — et pourquoi.
//
// Le 3 août, trois comptes en plan Découverte (plafond 1 ruche) portaient 12,
// 35 et 80 colonies. La cause n'était pas un gate FAUX : c'était un gate
// ABSENT. `route-gates.ts` ne peut pas signaler ce qu'il ne contient pas, et
// `plansGating.test.ts` ne vérifie que la validité des clés présentes — jamais
// qu'il n'en manque.
//
// Ce fichier ferme cette classe de trou. Toute route d'écriture de
// `server/api/**` doit être soit gatée dans `route-gates.ts`, soit inscrite
// ici avec une raison. Une route neuve n'est ni l'un ni l'autre : le banc
// `routeGatesCouverture.test.ts` échoue et imprime la ligne à coller.
//
// L'objectif n'est PAS « tout est gaté » — beaucoup de routes doivent rester
// ouvertes. L'objectif est « tout est CLASSÉ » : plus rien ne passe par
// inadvertance.
// ═══════════════════════════════════════════════════════════════════════════

/** Préfixes exemptés en bloc — miroir exact de `server/middleware/04.subscription.ts:32`. */
export const PREFIXES_EXEMPTS = [
  '/api/auth/', // pré-authentification : gater exigerait d'être déjà connecté
  '/api/stripe/', // gater le paiement empêcherait de payer pour dégater
  '/api/public/', // surface publique par token, aucune session
  '/api/cron/', // déclenché par Vercel, authentifié par `cronSecret`
  '/api/subscription/', // lire son propre plan doit rester possible à tout plan
] as const;

export type RaisonExemption =
  /** `requireAdmin` dans le handler : la liste blanche d'e-mails tient lieu de gate. */
  | 'ADMIN'
  /** Authentifié par un token d'appareil, pas par une session ; vérifie le plan lui-même. */
  | 'TOKEN_APPAREIL'
  /** Délibérément offert sur tous les plans (geste apicole de base, ou compte de l'utilisateur). */
  | 'GRATUIT'
  /** Télémétrie, notifications, sécurité : ni fonctionnalité vendue ni ressource comptée. */
  | 'INFRA'
  /** Mutation ou sous-ressource d'un objet dont la CRÉATION est gatée : sans plan, rien à modifier. */
  | 'MUTATION_EXISTANT'
  /** Le contrôle de plan vit DANS le handler (delta batch-aware), pas dans la table. */
  | 'GATE_HANDLER'
  /** Dette : personne n'a encore tranché. Ne doit que décroître (cliquet ci-dessous). */
  | 'A_ARBITRER';

/**
 * Plafond de dette non arbitrée. C'est un CLIQUET, comme celui du corpus Maya :
 * il descend quand on tranche, il ne remonte jamais. Le baisser à chaque
 * arbitrage fait partie du travail.
 */
export const PLAFOND_A_ARBITRER = 0;

export const EXEMPTIONS_GATE: Record<string, RaisonExemption> = {
  // ─── Administration ────────────────────────────────────────────────────
  'POST /api/admin/campagnes/*': 'ADMIN',
  'POST /api/admin/codes-promo': 'ADMIN',
  'PATCH /api/admin/codes-promo/*': 'ADMIN',
  'POST /api/admin/users/*/sync-stripe': 'ADMIN',
  'PATCH /api/admin/users/*': 'ADMIN',
  'DELETE /api/admin/users/*': 'ADMIN',
  'PATCH /api/admin/demos/*': 'ADMIN',
  'DELETE /api/admin/demos/*': 'ADMIN',

  // ─── Infrastructure ────────────────────────────────────────────────────
  'POST /api/track': 'INFRA',
  'POST /api/security/csp-report': 'INFRA',
  'POST /api/push/subscribe': 'INFRA',
  'POST /api/push/unsubscribe': 'INFRA',
  'POST /api/push/register-device': 'INFRA',
  'POST /api/push/test': 'INFRA',
  'POST /api/photos/delete': 'INFRA',
  'POST /api/photos/refresh-urls': 'INFRA',

  // ─── Capteur autonome ──────────────────────────────────────────────────
  // Une balance connectée pousse ses mesures sans session. Le token porte
  // l'identité, et la route vérifie elle-même l'accès (`balances/acces.ts`).
  'POST /api/balances/ingest/*': 'TOKEN_APPAREIL',

  // ─── Compte de l'utilisateur, et obligations légales ───────────────────
  'PUT /api/profils/me': 'GRATUIT',
  'DELETE /api/profils/me': 'GRATUIT', // droit à l'effacement (RGPD)
  'PUT /api/profils/onboarding': 'GRATUIT',
  'POST /api/feedback': 'GRATUIT',
  'POST /api/notif/unsubscribe-email': 'GRATUIT', // un opt-out qui casse est une infraction
  'PUT /api/alertes/notif-prefs': 'GRATUIT',
  // Répondre à une invitation : c'est l'ÉMISSION qui est gatée
  // (`POST /api/membres/inviter` → multiUsers + membresEquipe).
  'POST /api/membres/accepter': 'GRATUIT',
  'POST /api/membres/refuser': 'GRATUIT',

  // ─── Le geste apicole de base ──────────────────────────────────────────
  // Découverte a droit à 1 ruche : il doit pouvoir la visiter, la noter, et
  // gérer les alertes qui en découlent. Gater cela viderait le plan gratuit
  // de son sens. Le quota porte sur le CHEPTEL, pas sur le suivi.
  // Le hub d'intervention est gratuit — saisir une visite est le geste de base
  // du produit. Mais le TYPE de la visite, lui, peut relever d'une feature
  // vendue : `recolte` → production, `reine` → moduleReine. La route dispatche
  // donc vers les mêmes handlers que `/bulk`, qui portent ces contrôles.
  //
  // Elle ne les portait PAS : elle insérait le hub en direct, sans dispatcher.
  // Une récolte créée par ce chemin échappait au gate `production` — et ses
  // colonnes plates restaient nulles, ce qui la rendait invisible au score de
  // santé. Le modal rapide du calendrier, les visites d'emplacement et la
  // synchro hors-ligne passent tous par là.
  'POST /api/interventions': 'GATE_HANDLER',
  'PUT /api/interventions/*': 'GRATUIT',
  'DELETE /api/interventions/*': 'GRATUIT',
  'PUT /api/alertes/*': 'GRATUIT',
  'DELETE /api/alertes/*': 'GRATUIT',
  'POST /api/alertes/supprimer': 'GRATUIT',

  // ─── Contrôle de plan porté par le handler ─────────────────────────────
  // `POST /api/interventions/bulk` dispatche vers `division`, qui crée jusqu'à
  // 10 ruches par appel. Le middleware ne lit pas le corps et ne peut donc pas
  // connaître le nombre de lignes à créer : le contrôle est un DELTA, posé
  // dans `assertQuotaRuches` avant toute écriture, dans la transaction
  // (correctif du 03/08). `dispatchHandler` y vérifie aussi les features.
  'POST /api/interventions/bulk': 'GATE_HANDLER',

  // ─── Mutations d'objets dont la création est gatée ─────────────────────
  'PUT /api/ruchers/*': 'MUTATION_EXISTANT',
  'DELETE /api/ruchers/*': 'MUTATION_EXISTANT',
  'PUT /api/ruches/*': 'MUTATION_EXISTANT',
  'DELETE /api/ruches/*': 'MUTATION_EXISTANT',
  'POST /api/ruches/*/cire': 'MUTATION_EXISTANT',
  'PUT /api/clients/*': 'MUTATION_EXISTANT',
  'DELETE /api/clients/*': 'MUTATION_EXISTANT',
  'PUT /api/stocks/*': 'MUTATION_EXISTANT',
  'DELETE /api/stocks/*': 'MUTATION_EXISTANT',
  'PUT /api/production/recoltes/*': 'MUTATION_EXISTANT',
  'DELETE /api/production/recoltes/*': 'MUTATION_EXISTANT',
  'PUT /api/elevage/reines/*': 'MUTATION_EXISTANT',
  'DELETE /api/elevage/reines/*': 'MUTATION_EXISTANT',
  'PUT /api/elevage/lignees/*': 'MUTATION_EXISTANT',
  'DELETE /api/elevage/lignees/*': 'MUTATION_EXISTANT',
  'PUT /api/elevage/sessions/*': 'MUTATION_EXISTANT',
  'DELETE /api/elevage/sessions/*': 'MUTATION_EXISTANT',
  'DELETE /api/elevage/sessions/*/receptrices/*': 'MUTATION_EXISTANT',
  'PUT /api/campagnes/*': 'MUTATION_EXISTANT',
  'DELETE /api/campagnes/*': 'MUTATION_EXISTANT',
  'PUT /api/campagnes/*/ouvrir': 'MUTATION_EXISTANT',
  'PUT /api/campagnes/*/fermer': 'MUTATION_EXISTANT',
  'POST /api/campagnes/*/produits': 'MUTATION_EXISTANT',
  'PUT /api/campagnes/*/produits/*': 'MUTATION_EXISTANT',
  'DELETE /api/campagnes/*/produits/*': 'MUTATION_EXISTANT',
  'POST /api/campagnes/*/commandes/saisie': 'MUTATION_EXISTANT',
  'PUT /api/campagnes/*/commandes/*': 'MUTATION_EXISTANT',
  'PUT /api/bons-livraison/*': 'MUTATION_EXISTANT',
  'DELETE /api/bons-livraison/*': 'MUTATION_EXISTANT',
  'DELETE /api/ordonnances/*': 'MUTATION_EXISTANT',
  'DELETE /api/calendrier/tokens/*': 'MUTATION_EXISTANT',
  'DELETE /api/interventions/templates/*': 'MUTATION_EXISTANT',
  // NB : `PUT /api/transhumance/emplacements/*` est GATÉE (`transhumance`),
  // elle n'a donc rien à faire ici — le banc refuse la double déclaration.
  'DELETE /api/transhumance/emplacements/*': 'MUTATION_EXISTANT',
  'DELETE /api/transhumance/plans/*': 'MUTATION_EXISTANT',
  'PATCH /api/finances/tresorerie/previsions/*': 'MUTATION_EXISTANT',
  'DELETE /api/finances/tresorerie/previsions/*': 'MUTATION_EXISTANT',
  // Facturation : toutes les voies de CRÉATION sont gatées
  // (`finances/ventes`, `bons-livraison/*/convertir`, `factures/groupee`)
  // sur `facturationPdf` + `facturesParMois`.
  'PUT /api/finances/factures/*': 'MUTATION_EXISTANT',
  'DELETE /api/finances/factures/*': 'MUTATION_EXISTANT',
  'POST /api/finances/factures/*/email': 'MUTATION_EXISTANT',
  // Équipe : l'émission de l'invitation porte le gate.
  'PUT /api/membres/*': 'MUTATION_EXISTANT',
  'DELETE /api/membres/*': 'MUTATION_EXISTANT',
  'POST /api/membres/*/relancer': 'MUTATION_EXISTANT',
  // Hausses : la génération en lot et l'export QR sont gatés `qrCodesHausses`.
  'PUT /api/hausses/*': 'MUTATION_EXISTANT',
  'DELETE /api/hausses/*': 'MUTATION_EXISTANT',

  // ─── DETTE : à trancher ────────────────────────────────────────────────
  // Chacune de ces routes écrit sans qu'aucun plan n'ait été vérifié, et
  // personne n'a encore décidé si c'est voulu. Les cinq premières ont été
  // relevées par l'audit d'équilibrage : ce sont des jumelles de routes
  // gatées, ou des écritures dans des tables dont la lecture est vendue.
  // ARBITRÉ : déplacer une ruche entre SES PROPRES ruchers est un geste de
  // cheptel, pas de la transhumance (laquelle vise un EMPLACEMENT mellifère —
  // c'est `ruchers/deplacer`, gatée). Le gater sur `transhumance` créerait un
  // faux blocage : Starter a 2 ruchers mais pas la transhumance, il ne pourrait
  // plus bouger une ruche entre les siens. Découverte n'a qu'un rucher : rien à
  // déplacer. La borne du plan suffit.
  'POST /api/ruches/deplacer': 'GRATUIT',
  // Le contrôle dépend du CORPS (une visite sur un emplacement relève de la
  // transhumance, la même sur un rucher non), ce qu'une table statique ne sait
  // pas exprimer. Le gate vit donc dans le handler, avec le plan admin
  // neutralisé via `planEffectif`.
  'POST /api/interventions/visite-rucher': 'GATE_HANDLER',
  // Régénère les alertes DU compte appelant. Les alertes sont le socle du
  // produit — présentes sur tous les plans, avec leurs préférences de notif.
  // Les gater couperait le gratuit de sa seule fonction de veille.
  // Le vrai risque n'est pas le plan mais la CHARGE (watchdog à 15 s) : c'est
  // au limiteur de débit de le tenir, pas au catalogue d'abonnements.
  'POST /api/alertes/generate': 'GRATUIT',
  // Un rendez-vous au calendrier (vétérinaire, syndicat, fournisseur…). Le
  // calendrier est offert partout ; noter un rendez-vous vétérinaire est le
  // genre de geste qu'on ne fait pas payer.
  'POST /api/interventions/rdv-pro': 'GRATUIT',
  // CONFIRMÉ : `conformiteNapi` est vraie sur les QUATRE plans. Déclarer une
  // mortalité est une obligation réglementaire, pas une option de confort — la
  // gater reviendrait à faire payer le respect de la loi.
  'POST /api/mortalites': 'GRATUIT',
  // Le voisinage avec `ordonnances` est trompeur. Le catalogue produit nomme
  // précisément ce qui se vend : `ordonnancesVeto` = « conservez vos
  // ordonnances et l'historique de vos traitements ». Le carnet de contacts
  // vétérinaires et le registre des visites sanitaires n'y sont pas — ils font
  // partie du socle réglementaire que tout apiculteur doit tenir.
  //
  // Vérifié aussi côté interface : ces deux pages n'ont AUCUN garde de plan,
  // contrairement à `ordonnances`. Interface et API disent donc la même chose.
  'POST /api/veterinaires': 'GRATUIT',
  'POST /api/visites-sanitaires': 'GRATUIT',
};

/**
 * Sous-ensemble communautaire, laissé délibérément ouvert : ces routes servent
 * un bien commun (signalements de frelon, observations de floraison) que le
 * produit veut alimenter par TOUS les comptes, y compris gratuits. La donnée
 * agrégée est ensuite vendue via `communauteBase` / `suggestionsNationales`.
 */
const CONTRIBUTIONS_COMMUNAUTAIRES: Record<string, RaisonExemption> = {
  'POST /api/frelon': 'GRATUIT',
  'PUT /api/frelon/*': 'GRATUIT',
  'DELETE /api/frelon/*': 'GRATUIT',
  'POST /api/frelon/*/vote': 'GRATUIT',
  'POST /api/floraisons/observations': 'GRATUIT',
  'DELETE /api/floraisons/observations/*': 'GRATUIT',
  'PUT /api/veterinaires/*': 'MUTATION_EXISTANT',
  'DELETE /api/veterinaires/*': 'MUTATION_EXISTANT',
  'DELETE /api/visites-sanitaires/*': 'MUTATION_EXISTANT',
};

Object.assign(EXEMPTIONS_GATE, CONTRIBUTIONS_COMMUNAUTAIRES);
