// ═══════════════════════════════════════════════════════════════════════════
// CATÉGORIES DE NOTIFICATIONS — source de vérité unique.
//
// Plutôt qu'une case à cocher PAR type d'alerte (14 et ça augmente…), on
// regroupe les types en 6 grandes catégories. L'utilisateur ne voit que
// 6 interrupteurs dans les Paramètres ; chaque nouveau type d'alerte hérite
// automatiquement de sa catégorie sans ajouter de case.
//
// Le contrat partagé front ↔ back, ce sont les CLÉS de catégorie (CategorieNotif)
// + le fait que les préférences sont stockées par catégorie.
// ═══════════════════════════════════════════════════════════════════════════

export type CategorieNotif =
  | 'sante'
  | 'production'
  | 'stock'
  | 'saison'
  | 'gestion'
  | 'reglementaire'
  /**
   * ⚠️ UNE SEPTIÈME CATÉGORIE PLUTÔT QU'UN TYPE RANGÉ DE FORCE DANS UNE AUTRE.
   *
   * `categorieDeType` fait retomber tout type inconnu sur « sante » : sans
   * cette entrée, une réponse de forum aurait été gouvernée par l'interrupteur
   * « Santé du cheptel ». L'apiculteur qui coupe les alertes sanitaires — ce
   * qu'on ne souhaite à personne — aurait aussi coupé le forum, et celui qui
   * coupe le forum n'aurait plus été prévenu qu'une colonie va mal.
   *
   * Le repli sur « sante » n'est PAS un défaut du module : c'est le choix le
   * plus prudent pour une alerte sanitaire mal classée. Il devient faux dès
   * qu'on lui confie autre chose, et c'est à l'appelant de se déclarer.
   */
  | 'communaute';

/** Type d'alerte → catégorie. Tout type inconnu retombe sur « sante ». */
export const CATEGORIE_PAR_TYPE: Record<string, CategorieNotif> = {
  // Santé du cheptel
  visite_requise: 'sante',
  premiere_visite: 'sante',
  sante_critique: 'sante',
  reine_agee: 'sante',
  varroa_seuil: 'sante',
  maladie_observee: 'sante',
  maladie_loque: 'sante',
  colonie_orpheline: 'sante',
  mortalite_anormale: 'sante',
  // Récolte & production
  traitement_fin: 'production',
  pesee_chute: 'production',
  // Balances connectées — une chute brutale en pleine journée signe un
  // essaimage ; une chute vers zéro hors récolte déclarée signe un vol.
  balance_essaimage: 'sante',
  balance_vol: 'sante',
  balance_miellee: 'production',
  balance_hausse_pleine: 'production',
  // Santé du capteur lui-même : sans lui, plus aucune des alertes ci-dessus.
  balance_batterie: 'gestion',
  balance_muette: 'gestion',
  // Stocks & matériel
  stock_bas: 'stock',
  // Saison & agenda
  rappel_saison: 'saison',
  transhumance_proche: 'saison',
  rdv_rappel: 'saison',
  meteo_favorable: 'saison',
  meteo_danger: 'saison',
  // Gestion & ventes
  facture_retard: 'gestion',
  commande_a_cloturer: 'gestion',
  // Réglementaire
  napi: 'reglementaire',
  // Communauté — ce qui vient des autres apiculteurs.
  forum_reponse: 'communaute',
};

/**
 * Préférences par défaut : tout activé.
 *
 * ⚠️ `communaute` EST À `true`, ET C'EST LE SEUL CHOIX DE PRODUIT DE CE LOT.
 * Un forum dont personne n'apprend qu'on lui a répondu se vide : la question
 * posée reste sans retour, l'auteur ne revient pas, et le fil meurt avec une
 * réponse que personne n'a lue. Le défaut « actif » est ce que fait tout forum,
 * et l'interrupteur existe pour le couper — c'est une ligne à changer si
 * l'apiculteur préfère l'inverse.
 */
export const CATEGORIES_DEFAUT: Record<CategorieNotif, boolean> = {
  sante: true,
  production: true,
  stock: true,
  saison: true,
  gestion: true,
  reglementaire: true,
  communaute: true,
};

/**
 * ⚠️ DÉRIVÉE, PAS RECOPIÉE. Cette liste était une seconde énumération des mêmes
 * clés — donc deux endroits à tenir d'accord, et le second qu'on oublie. Une
 * catégorie ajoutée aux défauts mais absente d'ici aurait existé côté serveur
 * sans jamais apparaître dans les réglages : l'apiculteur recevrait des
 * notifications qu'aucun interrupteur ne coupe.
 *
 * `Record<CategorieNotif, …>` oblige déjà `CATEGORIES_DEFAUT` à être complet ;
 * en tirer la liste rend l'oubli impossible plutôt que détectable.
 */
export const CATEGORIES_NOTIF = Object.keys(CATEGORIES_DEFAUT) as CategorieNotif[];

/**
 * Ce qui vient des AUTRES apiculteurs. Une seule entrée aujourd'hui — la
 * réponse à son propre fil de forum.
 */
export const TYPE_FORUM_REPONSE = 'forum_reponse';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SURVEILLER N'EST PAS NOTIFIER — et la page publique compte les premières.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `/maya` annonce le nombre de « situations surveillées » et de « familles de
 * règles » du moteur. Ces chiffres se CALCULENT depuis ce fichier, jamais
 * écrits en dur — c'est une règle du dépôt, et un banc la tient.
 *
 * ⚠️ MAIS TOUT TYPE D'ALERTE N'EST PAS UNE SITUATION SURVEILLÉE. Une réponse de
 * forum est un ÉVÉNEMENT SOCIAL : quelqu'un a écrit, on prévient. Le moteur ne
 * la guette pas, ne l'anticipe pas, n'en tire aucune règle. La compter parmi
 * les situations surveillées gonflerait d'une unité une promesse commerciale —
 * et une promesse gonflée par accident reste une promesse fausse.
 *
 * D'où deux lectures distinctes de la même table, chacune avec son nom :
 *   · `CATEGORIE_PAR_TYPE` — TOUS les types, pour savoir quel interrupteur
 *     gouverne quelle alerte. Le forum en fait partie.
 *   · `SITUATIONS_SURVEILLEES` — ce que le MOTEUR guette. C'est ce nombre que
 *     la page annonce.
 */
const TYPES_NOTIFIES_SANS_SURVEILLANCE = new Set<string>([
  // Quelqu'un a répondu : un fait social, pas une condition qu'on surveille.
  TYPE_FORUM_REPONSE,
]);

/** Les situations que le moteur GUETTE — le chiffre annoncé sur `/maya`. */
export const SITUATIONS_SURVEILLEES = Object.keys(CATEGORIE_PAR_TYPE).filter(
  (t) => !TYPES_NOTIFIES_SANS_SURVEILLANCE.has(t),
);

/**
 * Les familles de RÈGLES du moteur : les catégories qui portent au moins une
 * situation surveillée. Dérivée, donc juste par construction — une catégorie
 * purement notificative (comme « communaute ») n'y entre pas, et une catégorie
 * qui gagnerait une vraie règle y entrerait toute seule.
 */
export const FAMILLES_SURVEILLEES = [
  ...new Set(SITUATIONS_SURVEILLEES.map((t) => CATEGORIE_PAR_TYPE[t]!)),
];

export function categorieDeType(type: string): CategorieNotif {
  return CATEGORIE_PAR_TYPE[type] ?? 'sante';
}

/**
 * Une alerte de ce `type` doit-elle déclencher une notification ?
 * On lit la préférence de SA CATÉGORIE. Les anciennes clés par type
 * éventuellement encore stockées sont ignorées (retombent sur le défaut = on).
 */
export function typeActif(
  prefs: Record<string, boolean | undefined> | null | undefined,
  type: string,
): boolean {
  const cat = categorieDeType(type);
  return (prefs?.[cat] ?? CATEGORIES_DEFAUT[cat]) !== false;
}

/** Normalise un objet de préférences brut → 6 booléens de catégorie. */
export function normaliserPrefs(
  brut: Record<string, unknown> | null | undefined,
): Record<CategorieNotif, boolean> {
  const out = { ...CATEGORIES_DEFAUT };
  if (brut) {
    for (const cat of CATEGORIES_NOTIF) {
      if (typeof brut[cat] === 'boolean') out[cat] = brut[cat] as boolean;
    }
  }
  return out;
}

/** Clé du réglage « résumé quotidien / feuille de route du matin ». */
export const RESUME_QUOTIDIEN_KEY = 'resume_quotidien';

/** Clé de l'heure d'envoi (heure locale Paris, entier). */
export const HEURE_RESUME_KEY = 'heure_resume';

/** Heure d'envoi par défaut du résumé (7 h — l'apiculteur planifie sa journée tôt). */
export const HEURE_RESUME_DEFAUT = 7;
/**
 * Bornes autorisées pour l'heure d'envoi du résumé « du matin ». 5-12 h : c'est
 * la plage couverte par les crons `feuille-de-route` (`0 3-11 * * *` UTC = Paris
 * 5 h-13 h été/hiver). Choisir au-delà ne serait jamais servi.
 */
export const HEURE_RESUME_MIN = 5;
export const HEURE_RESUME_MAX = 12;

/**
 * L'utilisateur veut-il le résumé quotidien consolidé (feuille de route poussée
 * le matin) ? Activé par défaut. Vit dans le même JSONB `pushNotifPrefs` que les
 * catégories mais n'en est pas une (il regroupe plusieurs catégories terrain).
 */
export function resumeQuotidienActif(brut: Record<string, unknown> | null | undefined): boolean {
  return brut?.[RESUME_QUOTIDIEN_KEY] !== false;
}

/**
 * Heure (Europe/Paris) à laquelle envoyer le résumé du jour. Défaut 7 h, bornée
 * pour éviter les envois en pleine nuit. Le cron horaire compare cette valeur à
 * l'heure courante de Paris pour ne pousser qu'aux bons utilisateurs.
 */
export function heureResumeQuotidien(brut: Record<string, unknown> | null | undefined): number {
  const v = brut?.[HEURE_RESUME_KEY];
  const n = typeof v === 'number' ? Math.round(v) : HEURE_RESUME_DEFAUT;
  return Math.min(HEURE_RESUME_MAX, Math.max(HEURE_RESUME_MIN, n));
}

/** Clé du réglage « emails d'alerte urgente » (canal de secours). */
export const EMAIL_URGENT_KEY = 'email_urgent';

/**
 * L'utilisateur veut-il recevoir les emails d'alerte URGENTE (météo dangereuse,
 * sanitaire critique) ? Activé par défaut — c'est le filet qui garantit la
 * réception même sans permission push. Coupable via l'UI ou le lien RGPD.
 */
export function emailUrgentActif(brut: Record<string, unknown> | null | undefined): boolean {
  return brut?.[EMAIL_URGENT_KEY] !== false;
}
