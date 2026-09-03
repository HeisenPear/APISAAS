// ═══════════════════════════════════════════════════════════════════════════
// LES ÉVÉNEMENTS DE DONNÉES — l'union, et ce que chaque TABLE fait bouger.
//
// ⚠️ CE FICHIER NAÎT D'UNE FRONTIÈRE QUE MAYA NE TRAVERSAIT PAS.
//
// Le dépôt a un bus d'invalidation complet (`app/composables/useDataBus.ts`) :
// vingt et un émetteurs, une trentaine d'abonnés. Chaque composable de domaine
// émet après son `$fetch`, et les listes, le tableau de bord, la jauge
// d'abonnement et la barre latérale se rafraîchissent.
//
// Maya était le SEUL producteur d'écritures qui ne s'y branchait pas — parce
// qu'elle n'écrit pas par ces composables : elle écrit côté SERVEUR, et le
// serveur n'avait pas accès à l'union, qui vivait dans un composable client.
// Conséquence vécue : l'apiculteur est sur /ruchers, dicte « ajoute une ruche »,
// la carte du rucher affiche toujours l'ancien compte — et la jauge de plan,
// jamais démontée, ne se répare même pas en changeant de page.
//
// L'union descend donc ici, SANS AUCUN IMPORT de serveur ni de composable —
// comme `plans.ts` et `maya-actions.ts`. C'est cette absence de dépendance, et
// elle seule, qui lui permet d'être lue par le navigateur ET par Nitro ; les
// quelques fonctions du bas sont de l'arithmétique de chaînes sur ces données,
// elles n'ouvrent aucune porte.
//
// ⚠️ ELLE N'EST PAS RÉEXPORTÉE PAR `useDataBus`. Un réexport n'est pas neutre :
// l'auto-import de Nuxt résout PAR NOM, et deux chemins pour `DataEvent`
// donneraient un module silencieusement ignoré — le défaut que
// `collisionsAutoImport` a déjà attrapé quatre fois dans ce dépôt.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * TOUS LES ÉVÉNEMENTS DU BUS — en DONNÉES, et le type s'en déduit.
 *
 * ⚠️ C'ÉTAIT UNE UNION DE TYPES SEULE, ET C'EST CE QUI EMPÊCHAIT DE LA VÉRIFIER.
 * Un type n'existe pas à l'exécution : impossible de demander « cet événement
 * existe-t-il ? », donc impossible de DÉRIVER l'événement inverse d'une
 * annulation sans recopier la liste à côté — la faute même que ce dépôt paie le
 * plus cher. En partant du tableau, le type se déduit (`(typeof …)[number]`) et
 * il n'y a toujours qu'une seule liste.
 */
export const EVENEMENTS_DONNEES = [
  'rucher:created',
  'rucher:updated',
  'rucher:deleted',
  'ruche:created',
  'ruche:updated',
  'ruche:deleted',
  'intervention:created',
  'intervention:updated',
  'intervention:deleted',
  'recolte:created',
  'recolte:updated',
  'recolte:deleted',
  'stock:created',
  'stock:updated',
  'stock:deleted',
  'stock:mouvement',
  'balance:created',
  'balance:updated',
  'balance:deleted',
  // Émis après un import CSV ou une synchronisation BEEP : la liste des
  // balances affiche un cache de dernière mesure, qui devient périmé.
  'balance:mesures',
  'client:created',
  'client:updated',
  'client:deleted',
  'vente:created',
  'vente:updated',
  'vente:deleted',
  'achat:created',
  'alerte:created',
  'alerte:read',
  'alerte:deleted',
  'membre:invited',
  'membre:updated',
  'membre:removed',
  'subscription:changed',
  'bl:created',
  'bl:updated',
  'bl:deleted',
  'bl:converti',
  'visite_rucher:created',
  'hausse:created',
  'hausse:updated',
  'hausse:deleted',
  'veterinaire:created',
  'veterinaire:updated',
  'veterinaire:deleted',
  'emplacement:created',
  'emplacement:updated',
  'emplacement:deleted',
  'lignee:created',
  'lignee:updated',
  'lignee:deleted',
  'reine:created',
  'reine:updated',
  'reine:deleted',
  'reine:tested',
  'session_greffage:created',
  'session_greffage:updated',
  'session_greffage:deleted',
] as const;

/** Un événement du bus de données (dérivé du tableau ci-dessus). */
export type DataEvent = (typeof EVENEMENTS_DONNEES)[number];

/** L'ensemble, pour les questions d'appartenance à l'exécution. */
const TOUS: ReadonlySet<string> = new Set(EVENEMENTS_DONNEES);

/** Vrai si cette chaîne est un événement connu du bus. */
export function estEvenementDonnees(valeur: string): valeur is DataEvent {
  return TOUS.has(valeur);
}

/**
 * CE QUE CHAQUE TABLE ÉCRITE FAIT BOUGER À L'ÉCRAN.
 *
 * ⚠️ ON NE DÉCLARE PAS LA RÉPERCUSSION, ON LA MESURE — et c'est ce qui distingue
 * cette table d'une seconde copie du catalogue des actions.
 *
 * Une table « action de Maya → domaines invalidés » serait FAUSSE, et pas d'un
 * peu : l'action `intervention` écrit dans trois autres domaines selon sa
 * CATÉGORIE. Dicter « ruche 7, j'ai fait une division » fait naître une RUCHE
 * (`server/services/interventions/division.ts`) ; une catégorie `recolte` écrit
 * dans `recoltes` ; un `deplacement` change le rucher de la ruche. Déclarer
 * « intervention → intervention » aurait laissé la ruche née d'une division
 * invisible partout, y compris de la jauge de plan qu'elle vient de consommer.
 *
 * Or les gestionnaires SAVENT déjà ce qu'ils ont écrit : `HandlerResult` porte
 * `created: {table,id}[]` et `updated: {table,id,changes}[]`. Il suffisait de ne
 * plus jeter ce retour. La seule table à tenir est donc celle-ci —
 * `table SQL → événements` — et elle est factuelle, pas déclarative.
 *
 * `tests/unit/app/config/evenementsParTable.test.ts` balaie les gestionnaires et
 * exige une entrée pour CHAQUE table qu'ils nomment : une table nouvelle ne peut
 * plus naître muette.
 */
export const EVENEMENTS_PAR_TABLE = {
  // ── Le hub et le cheptel ────────────────────────────────────────────────
  interventions: ['intervention:created'],
  ruches: ['ruche:created', 'ruche:updated'],
  ruchers: ['rucher:created', 'rucher:updated'],

  // ── Les satellites d'intervention : ce qu'ils changent à l'écran, c'est la
  //    FRISE de la ruche et le journal des interventions.
  comptages_varroa: ['intervention:created'],
  traitements_varroa: ['intervention:created'],
  divisions: ['intervention:created'],
  // La table de liaison d'une division : elle rattache la ruche FILLE à son
  // opération. À l'écran, elle change la frise de la ruche, comme sa division.
  divisions_ruches: ['intervention:created', 'ruche:created'],
  essaimages: ['intervention:created'],
  empilements: ['intervention:created'],
  transvasements: ['intervention:created'],
  evenements_sanitaires: ['intervention:created'],
  mouvements_materiel: ['intervention:created'],
  pesees: ['intervention:created'],
  // Un déplacement change le rucher de la ruche : la carte et les listes de
  // ruchers doivent suivre, pas seulement la frise.
  deplacements_ruches: ['intervention:created', 'ruche:updated', 'rucher:updated'],
  // Le module Reine a ses propres écrans.
  evenements_reine: ['intervention:created', 'reine:updated'],

  // ── Les domaines écrits directement par Maya (hors intervention) ─────────
  recoltes: ['recolte:created'],
  clients: ['client:created'],
  // Le stock se MEUT (entrée/sortie) : `stock:created` désigne un article neuf,
  // ce que Maya ne fait pas. `useStocks` émet exactement ce couple-là.
  mouvements_stock: ['stock:mouvement', 'stock:updated'],
  stocks: ['stock:updated'],
  // Vente et achat vivent dans la même table `transactions` : le SENS ne se
  // lit pas au nom de la table. Les primitives concernées nomment donc leur
  // événement elles-mêmes ; cette entrée est le repli honnête.
  transactions: ['vente:created', 'achat:created'],
  alertes: ['alerte:created'],
} as const satisfies Record<string, readonly DataEvent[]>;

/** Les tables dont on sait dire ce qu'elles font bouger. */
export type TableSuivie = keyof typeof EVENEMENTS_PAR_TABLE;

/**
 * Les événements d'une table écrite, ou `null` si la table est INCONNUE.
 *
 * ⚠️ `null`, PAS UN TABLEAU VIDE. « Je ne sais pas quoi invalider » n'est pas
 * « il n'y a rien à invalider » : c'est la règle la plus chèrement acquise du
 * dépôt (« inconnu ne vaut jamais laisse-passer »). L'appelant doit choisir
 * explicitement quoi faire d'un inconnu — et le banc, lui, refuse qu'il en
 * existe.
 */
export function evenementsDeLaTable(table: string): readonly DataEvent[] | null {
  return (EVENEMENTS_PAR_TABLE as Record<string, readonly DataEvent[]>)[table] ?? null;
}

/**
 * L'ÉVÉNEMENT SYMÉTRIQUE — celui d'une annulation.
 *
 * ⚠️ ANNULER EST AUSSI UNE ÉCRITURE, et c'est le côté qu'on oublie. Défaire une
 * ruche dictée doit rafraîchir exactement les mêmes écrans que la créer :
 * l'apiculteur qui clique « Annuler » et voit la ruche rester sur la carte est
 * dans un état PIRE que s'il n'avait rien fait — il ne sait plus ce qui est vrai.
 *
 * ⚠️ ET C'EST DÉRIVÉ, PAS RECOPIÉ. Une seconde table « création → suppression »
 * aurait divergé au premier événement ajouté. On lit le verbe, on demande le
 * contraire, et — point capital — **on ne l'invente pas** : `achat:deleted`
 * n'existe pas dans ce dépôt, et fabriquer cette chaîne n'aurait réveillé
 * personne (aucun abonné ne l'écoute), là où `achat:created` réveille bien
 * `/finances`. Quand le contraire n'existe pas, l'événement d'origine reste :
 * il vaut « ce domaine a bougé », ce qui est vrai dans les deux sens.
 *
 * Les verbes qui ne sont pas des créations (`stock:mouvement`, `:updated`) sont
 * déjà symétriques : un mouvement défait reste un mouvement.
 */
export function evenementInverse(evenement: DataEvent): DataEvent {
  if (!evenement.endsWith(':created')) return evenement;
  const contraire = `${evenement.slice(0, -':created'.length)}:deleted`;
  return estEvenementDonnees(contraire) ? contraire : evenement;
}

/** Les inverses d'une série d'événements, sans doublon et dans l'ordre. */
export function evenementsInverses(evenements: readonly DataEvent[]): readonly DataEvent[] {
  return [...new Set(evenements.map(evenementInverse))];
}
