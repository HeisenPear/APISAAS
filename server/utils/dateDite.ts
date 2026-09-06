import { jourUtc, joursDansLeMois, partiesParis } from '~~/server/utils/horloge';

// ═══════════════════════════════════════════════════════════════════════════
// « DEMAIN », « MARDI », « LE 15 MARS » — LA DATE QUE L'APICULTEUR A DITE.
//
// Maya savait enregistrer une visite ; elle ne savait pas QUAND. Mesuré avant
// d'écrire : « cale une visite mardi sur la ruche 5 » produisait bien une
// intervention, mais sans aucun champ de date — donc posée à `new Date()`,
// c'est-à-dire AUJOURD'HUI. Une visite calée pour mardi apparaissait dans le
// calendrier du jour même, et jamais mardi.
//
// ─── DEUX PIÈGES DE CE DÉPÔT, ET ILS SE CROISENT ICI ──────────────────────
//
// 1. LE JOUR DE QUI ? Les lambdas Vercel tournent en UTC. À 00 h 30 à Paris, il
//    est encore la veille en UTC : « demain » calculé sur l'horloge du serveur
//    donnerait AUJOURD'HUI pour l'apiculteur. Le jour de référence se lit donc
//    par `partiesParis`, jamais par `getDate()`.
//
// 2. STOCKER OU BORNER ? Une valeur date-seule qu'on ÉCRIT se pose à minuit
//    UTC (`jourUtc`) ; c'est une BORNE de requête qui se pose à minuit à Paris.
//    Ici on écrit une échéance, donc `jourUtc` — minuit à Paris se relirait
//    « jour J−1 » en UTC, et la visite tomberait la veille.
//
// Rien n'utilise `setDate`/`setMonth` : ils ne bornent pas le jour (le 31 mars
// + 1 mois donne « le 31 avril », reporté au 1er mai). On passe par des
// nombres, et `joursDansLeMois` quand il faut vérifier.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce qu'on a compris : le jour visé, et comment le redire à l'apiculteur. */
export interface DateDite {
  /** Le jour, en valeur date-seule : minuit UTC. */
  jour: Date;
  /** L'expression reconnue, telle qu'on la lui répètera (« demain », « mardi »). */
  dit: string;
}

const JOURS_SEMAINE = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
] as const;

const MOIS = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
] as const;

/** Normalise comme le reste du moteur : minuscules, sans accents. */
function normaliser(phrase: string): string {
  return phrase.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Ajoute `n` jours à un jour civil, en repassant par les nombres. */
function plusDeJours(annee: number, mois: number, jour: number, n: number): Date {
  // `Date.UTC` normalise lui-même les débordements de jour ET de mois : le
  // 31 janvier + 1 jour donne bien le 1er février. C'est `setMonth` qui ne
  // borne pas, pas l'arithmétique de jours.
  return new Date(Date.UTC(annee, mois - 1, jour + n, 0, 0, 0, 0));
}

/**
 * La date dite dans une phrase, ou `null` si elle n'en porte aucune.
 *
 * `maintenant` est passé explicitement — jamais `new Date()` à l'intérieur :
 * une fonction qui lit l'horloge ne se teste pas, et ce dépôt tient à ce que
 * chaque banc puisse fixer l'instant.
 */
export function dateDite(phrase: string, maintenant: Date): DateDite | null {
  const norm = normaliser(phrase);
  // ⚠️ LE JOUR DE L'APICULTEUR, PAS CELUI DU SERVEUR. Voir l'en-tête.
  const { annee, mois, jour } = partiesParis(maintenant);

  if (/\bapres[ -]demain\b/.test(norm)) {
    return { jour: plusDeJours(annee, mois, jour, 2), dit: 'après-demain' };
  }
  if (/\bdemain\b/.test(norm)) {
    return { jour: plusDeJours(annee, mois, jour, 1), dit: 'demain' };
  }
  /**
   * ⚠️ LES TROIS FORMES D'« AUJOURD'HUI ». L'apostrophe DROITE (clavier),
   * l'apostrophe TYPOGRAPHIQUE (correction automatique du téléphone, et le
   * registre du produit), et l'espace (dictée vocale, qui n'en met aucune).
   * Le premier jet n'acceptait que l'espace : la forme la plus TAPÉE des trois
   * n'était pas reconnue — le banc l'a dit avant l'apiculteur.
   */
  if (/\baujourd['’\s]?hui\b/.test(norm)) {
    return { jour: jourUtc(annee, mois, jour), dit: "aujourd'hui" };
  }

  const dansN = norm.match(/\bdans\s+(\d{1,3})\s+jours?\b/);
  if (dansN) {
    const n = Number(dansN[1]);
    return { jour: plusDeJours(annee, mois, jour, n), dit: `dans ${n} jour${n > 1 ? 's' : ''}` };
  }

  /**
   * « la semaine prochaine » — sept jours, et pas « lundi prochain ».
   *
   * ⚠️ ON NE DEVINE PAS LE LUNDI. Pour un apiculteur, « la semaine prochaine »
   * est une intention floue ; la transformer en une date précise du calendrier
   * (« lundi 8 à 00 h 00 ») afficherait une exactitude qu'il n'a pas voulue,
   * et il découvrirait un rendez-vous qu'il croyait approximatif. Sept jours
   * plus tard garde le flou tel qu'il l'a exprimé, et il peut corriger.
   */
  if (/\bla semaine prochaine\b/.test(norm)) {
    return { jour: plusDeJours(annee, mois, jour, 7), dit: 'la semaine prochaine' };
  }

  // « le 15 mars », « le 3 avril » — un jour et un mois nommés.
  const jourMois = norm.match(new RegExp(`\\b(?:le\\s+)?(\\d{1,2})\\s+(${MOIS.join('|')})\\b`));
  if (jourMois) {
    const j = Number(jourMois[1]);
    const m = MOIS.indexOf(jourMois[2] as (typeof MOIS)[number]) + 1;
    /**
     * ⚠️ « LE 31 FÉVRIER » N'EXISTE PAS, ET `Date.UTC` LE REPORTERAIT AU
     * 2 OU 3 MARS SANS RIEN DIRE. On refuse plutôt que d'inventer un jour :
     * une date fabriquée en silence est pire qu'une phrase non comprise —
     * Maya redemandera, alors qu'une visite mal datée passe inaperçue.
     */
    if (j < 1 || j > joursDansLeMois(annee, m)) return null;
    /**
     * L'année : celle en cours si la date est encore devant, la suivante
     * sinon. Un apiculteur qui dit « le 15 mars » en novembre parle du
     * printemps qui vient, pas de celui qui est passé.
     */
    const cetteAnnee = jourUtc(annee, m, j);
    const aujourdhui = jourUtc(annee, mois, jour);
    const an = cetteAnnee.getTime() < aujourdhui.getTime() ? annee + 1 : annee;
    if (j > joursDansLeMois(an, m)) return null;
    return { jour: jourUtc(an, m, j), dit: `le ${j} ${jourMois[2]}` };
  }

  // Un jour de la semaine : le PROCHAIN, jamais celui qui vient de passer.
  const nomJour = norm.match(new RegExp(`\\b(${JOURS_SEMAINE.join('|')})\\b`));
  if (nomJour) {
    const vise = JOURS_SEMAINE.indexOf(nomJour[1] as (typeof JOURS_SEMAINE)[number]);
    const actuel = new Date(Date.UTC(annee, mois - 1, jour)).getUTCDay();
    /**
     * ⚠️ `|| 7` : « MARDI » DIT UN MARDI, C'EST-À-DIRE LE PROCHAIN. Sans lui,
     * un mardi, l'écart vaudrait 0 et « cale une visite mardi » poserait la
     * visite le jour même — ce qui n'est pas planifier, c'est enregistrer une
     * visite qu'on est en train de faire. Celui qui veut aujourd'hui le dit :
     * « aujourd'hui ».
     */
    const ecart = (vise - actuel + 7) % 7 || 7;
    return { jour: plusDeJours(annee, mois, jour, ecart), dit: nomJour[1]! };
  }

  return null;
}
