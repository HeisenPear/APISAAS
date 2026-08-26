import { partiesParis, jourUtc, joursDansLeMois } from '~~/server/utils/horloge';

// ═══════════════════════════════════════════════════════════════════════════
// LA PROCHAINE ÉCHÉANCE D'UNE CHARGE RÉCURRENTE.
//
// ⚠️ UN ACHAT MENSUEL DATÉ DU 29, 30 OU 31 SAUTAIT UN MOIS ENTIER.
//
// Les deux endroits qui calculaient cette date — la route et le cron —
// écrivaient la même ligne :
//
//     base.setMonth(base.getMonth() + 1);
//
// `setMonth` ne borne pas le jour. Le 31 janvier + 1 mois donne « le 31
// février », que JavaScript reporte au 3 MARS. Février n'a donc AUCUNE
// occurrence. Mesuré sur les cas réels :
//
//     31/01 → 3 mars   (février sauté)
//     31/03 → 1er mai  (avril sauté)
//     31/05 → 1er juil (juin sauté)
//     31/08 → 1er oct  (septembre sauté)
//     30/01 → 2 mars   ·   29/01 → 1er mars
//
// La charge manque alors dans le journal des achats, dans le résultat du mois,
// dans la TVA déductible et dans la projection de trésorerie. Onze occurrences
// au lieu de douze sur l'année, sans un message.
//
// Et la dérive était DÉFINITIVE : le cron réappliquait la même formule à
// chaque passage, si bien que l'échéance ne revenait jamais à son jour.
//
// ─── POURQUOI UNE ANCRE, ET PAS SEULEMENT UN BORNAGE ──────────────────────
// Borner au dernier jour du mois corrige le saut mais introduit une autre
// dérive : 31 janvier → 28 février → 28 mars → 28 avril… le 31 est perdu pour
// toujours. La règle qu'attend quiconque a déjà vu un prélèvement mensuel est
// l'ANCRAGE : on retient le jour d'origine, et chaque mois on le reprend, borné
// au dernier jour quand le mois est plus court.
//
//     ancre le 31 janvier → 28 fév → 31 mars → 30 avril → 31 mai
//
// Le cron dispose de la ligne complète, donc de `dateTransaction` : l'ancre est
// là, il suffisait de la lire.
//
// ─── ON LIT À PARIS, ON ÉCRIT EN UTC ──────────────────────────────────────
// Les lambdas Vercel tournent en UTC. LIRE un jour du mois avec `getDate()` y
// répond dans le fuseau du SERVEUR : une échéance horodatée le 1er du mois à
// 00 h 30 à Paris est un 31 à 23 h 30 UTC, et l'on décalerait d'un mois entier.
// La lecture passe donc par `partiesParis`.
//
// ⚠️ MAIS L'ÉCRITURE, ELLE, SE FAIT À MINUIT UTC — ET LA PREMIÈRE VERSION DE
// CE CORRECTIF S'EST TROMPÉE LÀ-DESSUS. Elle posait l'échéance à minuit À
// PARIS, soit 23 h 00 UTC LA VEILLE. Ce dépôt stocke ses dates-seules à minuit
// UTC, et plusieurs lecteurs relisent le mois en UTC : une échéance du 1er du
// mois — le cas le plus courant pour un prélèvement — se relisait dans le mois
// PRÉCÉDENT. La projection de trésorerie l'avançait d'un mois, et l'achat créé
// le 1er janvier tombait dans l'exercice écoulé. Voir `horloge.ts`, bloc
// « deux façons de représenter un jour ».
// ═══════════════════════════════════════════════════════════════════════════

export type IntervalleRecurrence = 'mensuel' | 'annuel';

// `joursDansLeMois` et `minuitParis` vivaient ICI, en double de l'horloge. Ce
// module n'est pas le seul à décaler des mois — la série 12 mois de Maya et le
// flux iCal le font aussi — et deux tables qui décrivent la même règle
// finissent toujours par diverger. Les primitives sont remontées dans
// `horloge.ts`, la seule autorité de fuseau du dépôt.
//
// ⚠️ ELLES NE SONT PAS RÉEXPORTÉES ICI. Un ré-export crée un SECOND chemin
// d'auto-import Nitro vers le même nom, et Nitro en choisit un arbitrairement
// (« Duplicated imports … has been ignored »). Deux chemins pour un nom, c'est
// exactement la recopie qu'on vient de supprimer.

/**
 * L'échéance qui suit `precedente`, pour une charge d'intervalle donné.
 *
 * `ancre` porte le jour d'origine — la date de l'achat initial. Sans elle, on
 * retombe sur `precedente`, ce qui reste juste mais dérive dès qu'un mois court
 * a borné une occurrence.
 */
export function prochaineEcheance(
  precedente: Date,
  intervalle: IntervalleRecurrence,
  ancre: Date = precedente,
): Date {
  const p = partiesParis(precedente);
  const jourVoulu = partiesParis(ancre).jour;

  if (intervalle === 'annuel') {
    const annee = p.annee + 1;
    // Le 29 février d'une année bissextile n'existe pas l'année suivante : on
    // borne au 28, plutôt que de glisser au 1er mars.
    return jourUtc(annee, p.mois, Math.min(jourVoulu, joursDansLeMois(annee, p.mois)));
  }

  const mois = p.mois === 12 ? 1 : p.mois + 1;
  const annee = p.mois === 12 ? p.annee + 1 : p.annee;
  return jourUtc(annee, mois, Math.min(jourVoulu, joursDansLeMois(annee, mois)));
}
