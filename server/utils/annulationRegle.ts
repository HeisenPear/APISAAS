// ═══════════════════════════════════════════════════════════════════════════
// « ANNULER » NE DOIT JAMAIS MENTIR — UNE SEULE RÈGLE, POUR LES DEUX CHEMINS.
//
// ⚠️ CE FICHIER NAÎT D'UNE ASYMÉTRIE, ET L'ASYMÉTRIE ÉTAIT DU MAUVAIS CÔTÉ.
//
// Il existait deux façons de défaire une écriture de Maya :
//
//   · LE LOT (`annulerPlan`) — gardé sérieusement. Il relit les types RÉELS en
//     base, refuse en bloc si l'un d'eux écrit hors du hub, refuse au-delà de
//     24 h, et ne touche à rien tant que la décision n'est pas prise. Quinze
//     lignes de commentaire expliquent pourquoi.
//   · L'ACTION SEULE (`annulerActionIntervention`) — un DELETE nu. Ni fenêtre,
//     ni garde de type, ni regard sur ce que l'intervention a entraîné.
//
// Or l'action seule est la SEULE à s'exécuter en autonomie. Dicter « ruche 3,
// 12 varroas » écrit directement et propose « Annuler ». Le bouton supprimait
// le hub pendant que le comptage varroa survivait, orphelin — et l'alerte
// « varroa critique » levée au passage restait, elle aussi. Le chemin le mieux
// gardé était celui qui demandait une confirmation ; le chemin sans filet était
// celui qui écrivait tout seul.
//
// ⚠️ UNE PRÉCISION QUE J'AVAIS FAUSSE, ET QUI CHANGE LE DIAGNOSTIC. Je croyais
// que le comptage orphelin continuait d'alimenter le SCORE DE SANTÉ. C'est
// faux : `computeHiveScore` lit la colonne plate `interventions.varroa`, pas la
// table `comptages_varroa`. Ce qui lit vraiment l'orphelin, c'est le détecteur
// d'alerte varroa (`alertesAvancees.ts`), la frise de la ruche, et l'export
// RGPD. Le défaut est réel, sa portée n'était pas celle que j'annonçais.
//
// La règle vit donc ici, PURE et partagée. Les deux chemins l'appellent, et le
// jour où un troisième apparaît, il n'aura pas à la réinventer — c'est
// exactement comme ça que le second a fini sans garde.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Les types d'intervention qu'on sait défaire ENTIÈREMENT.
 *
 * Le hub `interventions` n'est jamais seul : `dispatchHandler` remplit ensuite
 * des tables satellites selon le type — `comptages_varroa`, `recoltes`,
 * `pesees`, `divisions`, `deplacements_ruches`, `mouvements_materiel`… Toutes
 * ces clés étrangères sont en `ON DELETE SET NULL` : supprimer le hub ne
 * supprime pas la ligne, il la DÉTACHE. L'apiculteur croit avoir tout défait,
 * et sa base garde une mesure sans rattachement.
 *
 * Ne sont donc réversibles que les types dont le handler n'écrit QUE dans le
 * hub. Pour les autres, on REFUSE au lieu de défaire à moitié : mieux vaut un
 * refus qui explique qu'un « c'est annulé » qui ment.
 */
import { alertesLeveesPar } from '~~/server/utils/alertesControle';

export const TYPES_ANNULABLES: ReadonlySet<string> = new Set([
  'controle',
  'nourrissement',
  'commentaire',
]);

/**
 * Durée pendant laquelle une écriture reste défaisable d'un clic.
 *
 * Généreuse à dessein — un apiculteur peut revenir le lendemain matin — mais
 * bornée : au-delà, la donnée a eu le temps de servir ailleurs (une facture,
 * une mise en pot), et la défaire ferait plus de dégâts que le geste qu'on
 * répare.
 */
export const FENETRE_ANNULATION_MS = 24 * 60 * 60 * 1000;

/**
 * L'écriture est-elle trop vieille pour être défaite ? Fonction PURE, pour que
 * la règle soit vérifiable sans base : c'est la décision qui compte, pas la
 * requête.
 */
export function annulationExpiree(creeLe: Date | string, maintenant = new Date()): boolean {
  const t = new Date(creeLe).getTime();
  // Une date illisible ne doit pas ouvrir la porte : on refuse par défaut.
  if (!Number.isFinite(t)) return true;
  return maintenant.getTime() - t > FENETRE_ANNULATION_MS;
}

export type Verdict = { ok: true } | { ok: false; motif: string };

/**
 * Une ligne d'intervention, telle qu'on la relit EN BASE pour décider.
 *
 * ⚠️ PAS SEULEMENT SON TYPE, ET C'EST UNE CORRECTION. La règle ne jugeait que le
 * type — or `controle` est déclaré annulable ET lève des alertes selon son
 * CONTENU. « ruche 3, j'ai vu des cellules royales » est une phrase dictable :
 * elle s'écrivait en autonomie, levait une alerte « risque d'essaimage » en
 * priorité haute, et proposait « Annuler ». Le clic supprimait la visite et
 * laissait l'alerte, rattachée à une visite qui n'existait plus.
 */
export interface LigneAnnulable {
  type: string | null | undefined;
  celluleRoyale?: boolean | null;
  forceColonie?: number | null;
}

/**
 * Cette suppression serait-elle INTÉGRALE ?
 *
 * `types` : les types réellement lus en base — jamais ceux annoncés par le
 * client. `null` est traité comme inconnu, donc refusé : la colonne est
 * nullable, et une ligne sans type ne peut pas être déclarée réversible.
 *
 * L'ordre des deux contrôles compte. On refuse d'abord sur le TYPE, parce que
 * c'est le refus qui apprend quelque chose à l'apiculteur (« ça a créé des
 * données ailleurs ») ; la fenêtre, elle, ne dit que « c'est trop tard ».
 */
export function annulationAutorisee(
  lignes: readonly (LigneAnnulable | string | null | undefined)[],
  creeLe: Date | string,
  maintenant = new Date(),
): Verdict {
  const rangs: LigneAnnulable[] = lignes.map((l) =>
    l === null || l === undefined || typeof l === 'string' ? { type: l ?? null } : l,
  );
  const types = rangs.map((l) => l.type);

  const irreversibles = [...new Set(types.map((t) => t ?? 'inconnu'))].filter(
    (t) => !TYPES_ANNULABLES.has(t),
  );

  if (irreversibles.length) {
    const pluriel = types.length > 1;
    return {
      ok: false,
      motif:
        `${pluriel ? 'Ce lot contient des interventions' : 'C’est une intervention'} que je ne ` +
        `sais pas défaire proprement (${irreversibles.join(', ')}) : elle${pluriel ? 's' : ''} ` +
        `${pluriel ? 'ont' : 'a'} créé des données ailleurs — une récolte, un comptage, parfois ` +
        `des ruches. ${pluriel ? 'Les' : 'La'} retirer à moitié ferait plus de dégâts que de ` +
        `${pluriel ? 'les' : 'la'} laisser. Ouvre le journal des interventions : tu y garderas ` +
        `la main sur ce qui part.`,
    };
  }

  /**
   * ⚠️ LE TYPE NE SUFFIT PAS : LE CONTENU DÉCIDE AUSSI. Un contrôle ordinaire
   * n'écrit que dans le hub — il se défait proprement, et c'est le geste le plus
   * fréquent de la saison (« ruche 3, tout va bien »). Le même contrôle avec des
   * cellules royales, ou une colonie à 1/4, lève une ALERTE : elle vit dans une
   * autre table, elle survit à la suppression de la visite, et rien ne permet de
   * la retrouver à coup sûr — même ruche, même type, une autre visite a pu la
   * lever entre-temps. On refuse donc ce cas-là, en le disant.
   */
  const alertantes = rangs.filter((l) => alertesLeveesPar(l.type, l) > 0);
  if (alertantes.length) {
    return {
      ok: false,
      motif:
        'Cette visite a levé une alerte — cellules royales ou colonie très faible. ' +
        'L’alerte, elle, ne se défait pas avec la visite : elle vit ailleurs, et je ne sais pas ' +
        'la retrouver sans risquer d’en effacer une autre. Je préfère ne rien retirer plutôt que ' +
        'de te dire « c’est annulé » à moitié. Ouvre Alertes pour traiter celle-ci, et le journal ' +
        'des interventions pour la visite.',
    };
  }

  if (annulationExpiree(creeLe, maintenant)) {
    return {
      ok: false,
      motif:
        'C’est vieux de plus de 24 heures — je ne le défais pas automatiquement, ' +
        'car tu as pu t’appuyer dessus depuis (une facture, une mise en pot…). ' +
        'Tu peux le modifier ou le supprimer directement dans l’application.',
    };
  }

  return { ok: true };
}
