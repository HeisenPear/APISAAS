import type { alertes } from '~~/server/database/schema';
import { intervalleVisiteJours } from '~~/server/utils/cadence';
import { computeHiveScore } from '~~/server/utils/santeScore';
import type { RucheSnapshot } from '~~/server/utils/moteurAlertes/cheptel';

// ═══════════════════════════════════════════════════════════════════════════
// RÈGLES DU CHEPTEL — visite en retard, première visite, santé critique.
//
// Communes au déclenchement à la demande (dashboard → /api/alertes/generate) et
// au cron quotidien : une seule implémentation = pas de divergence.
//
// Toutes PURES : elles reçoivent le cheptel déjà chargé (cf. moteurAlertes/
// cheptel.ts) et l'instant du run. C'est ce qui les rend testables — `db` est un
// auto-import Nitro indisponible sous Vitest, donc tout ce qui interroge la base
// est par construction hors de portée des tests.
// ═══════════════════════════════════════════════════════════════════════════

// Seuil de repli (automne). Le seuil réel dépend de la SAISON via
// `intervalleVisiteJours(maintenant)` — cf. server/utils/cadence.ts. Conservé
// pour les consommateurs qui importent encore la constante.
export const VISITE_DELAI_JOURS = 21;

/** Sous ce score, la colonie demande une intervention. */
export const SEUIL_SANTE_CRITIQUE = 40;
/** Sous ce score, l'alerte passe en priorité critique. */
export const SEUIL_SANTE_URGENCE = 20;

type AlerteInsert = typeof alertes.$inferInsert;
type DejaExiste = (type: string, referenceId?: string) => boolean;

/**
 * Alertes de visite :
 *  - ruches DÉJÀ visitées mais en retard (> seuil de saison) → une alerte PAR
 *    ruche (l'action est individuelle : on va voir CETTE ruche) ;
 *  - ruches JAMAIS visitées → UNE seule alerte groupée « première visite »
 *    (créer 100 ruches d'un coup = 1 notification, jamais 100).
 */
export function detecterVisites(
  userId: string,
  cheptel: readonly RucheSnapshot[],
  dejaExiste: DejaExiste,
  maintenant: Date,
): AlerteInsert[] {
  const out: AlerteInsert[] = [];
  const seuilJours = intervalleVisiteJours(maintenant);
  const cutoff = new Date(maintenant);
  cutoff.setDate(cutoff.getDate() - seuilJours);

  // En retard mais déjà suivies → une par ruche.
  for (const r of cheptel) {
    const derniere = r.dateVisite ? new Date(r.dateVisite) : null;
    if (derniere && derniere < cutoff && !dejaExiste('visite_requise', r.id)) {
      const joursDepuis = Math.floor((maintenant.getTime() - derniere.getTime()) / 86_400_000);
      out.push({
        userId,
        type: 'visite_requise',
        titre: `Ruche ${r.numero} non visitée`,
        message: `Dernière visite il y a ${joursDepuis} jours (seuil de saison : ${seuilJours} j)`,
        priorite: joursDepuis > 45 ? 'haute' : 'moyenne',
        referenceType: 'ruche',
        referenceId: r.id,
        actionUrl: `/ruches/${r.id}`,
        lue: false,
      });
    }
  }

  // Jamais visitées → une seule alerte groupée et douce.
  const nbJamais = cheptel.filter((r) => !r.dateVisite).length;
  if (nbJamais > 0 && !dejaExiste('premiere_visite')) {
    out.push({
      userId,
      type: 'premiere_visite',
      titre:
        nbJamais > 1
          ? `${nbJamais} ruches attendent leur première visite`
          : `Une ruche attend sa première visite`,
      message:
        'Fais un premier contrôle dès que tu peux : ça lance leur suivi et leur score de santé. 🐝',
      priorite: 'basse',
      actionUrl: '/ruches',
      lue: false,
    });
  }

  return out;
}

/**
 * Colonies dont le score de santé est sous le seuil critique.
 *
 * Une ruche non comptabilisée (vendue, fusionnée) a un score `null` : elle est
 * ignorée. Sans cette garde, `computeScore` la ramènerait à 0 via son `?? 0` et
 * on alerterait sur une ruche qui n'est plus au rucher.
 */
export function detecterSanteCritique(
  userId: string,
  cheptel: readonly RucheSnapshot[],
  dejaExiste: DejaExiste,
  maintenant: Date,
): AlerteInsert[] {
  const out: AlerteInsert[] = [];

  for (const r of cheptel) {
    if (dejaExiste('sante_critique', r.id)) continue;

    const { score } = computeHiveScore({
      rucheId: r.id,
      numero: r.numero,
      rucherId: r.rucherId,
      statut: r.statut,
      qualiteReine: r.qualiteReine,
      dateVisite: r.dateVisite,
      forceColonie: r.forceColonie,
      couvain: r.couvain,
      reserves: r.reserves,
      reineVue: r.reineVue,
      varroa: r.varroa,
      comportement: r.comportement,
      signeEssaimage: r.signeEssaimage,
      maladieObservee: r.maladieObservee,
      aujourdhui: maintenant,
    });

    if (score === null || score >= SEUIL_SANTE_CRITIQUE) continue;

    out.push({
      userId,
      type: 'sante_critique',
      titre: `Santé critique — Ruche ${r.numero}`,
      message: `Score de santé : ${score}/100. Une intervention urgente est recommandée.`,
      priorite: score < SEUIL_SANTE_URGENCE ? 'critique' : 'haute',
      referenceType: 'ruche',
      referenceId: r.id,
      actionUrl: `/ruches/${r.id}`,
      lue: false,
    });
  }

  return out;
}

/**
 * Ruches dont le score est REMONTÉ au-dessus du seuil critique — celles dont
 * l'alerte `sante_critique` doit être résolue.
 *
 * Ce type n'était auto-résolu par personne : une alerte survivait à la guérison
 * de la colonie et bloquait, par anti-doublon, toute alerte ultérieure.
 */
export function ruchesRetabliesIds(
  cheptel: readonly RucheSnapshot[],
  maintenant: Date,
): Set<string> {
  const retablies = new Set<string>();
  for (const r of cheptel) {
    const { score } = computeHiveScore({
      rucheId: r.id,
      numero: r.numero,
      rucherId: r.rucherId,
      statut: r.statut,
      qualiteReine: r.qualiteReine,
      dateVisite: r.dateVisite,
      forceColonie: r.forceColonie,
      couvain: r.couvain,
      reserves: r.reserves,
      reineVue: r.reineVue,
      varroa: r.varroa,
      comportement: r.comportement,
      signeEssaimage: r.signeEssaimage,
      maladieObservee: r.maladieObservee,
      aujourdhui: maintenant,
    });
    if (score === null || score >= SEUIL_SANTE_CRITIQUE) retablies.add(r.id);
  }
  return retablies;
}
