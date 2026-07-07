import { and, eq, isNull, inArray } from 'drizzle-orm';
import { alertes } from '~~/server/database/schema';
import type { PrioriteAlerte } from '~~/server/utils/alertesPush';

// ═══════════════════════════════════════════════════════════════════════════
// NUDGES SAISONNIERS — rappels du calendrier apicole (hémisphère nord / France).
//
// Une SEULE alerte par fenêtre saisonnière (pas une par ruche) : c'est le patron
// « plein d'autres » réutilisable. Auto-résolue dès que la fenêtre est passée.
// Aucune donnée par entité, aucune migration : repose uniquement sur la date.
// On ne nudge que les comptes qui ont au moins une ruche active.
// ═══════════════════════════════════════════════════════════════════════════

type AlerteInsert = typeof alertes.$inferInsert;
type DejaExiste = (type: string, referenceId?: string) => boolean;

interface Saison {
  cle: string;
  titre: string;
  message: string;
  /** [mois (1-12), jour] de début */
  debut: [number, number];
  /** [mois (1-12), jour] de fin (incluse) */
  fin: [number, number];
  priorite: PrioriteAlerte;
}

const SAISONS: Saison[] = [
  {
    cle: 'visite-printemps',
    titre: 'Visite de printemps à planifier',
    message:
      "Sortie d'hivernage : c'est le moment de la visite de printemps — réserves, ponte, état des cadres et nettoyage des planchers.",
    debut: [3, 1],
    fin: [4, 20],
    priorite: 'moyenne',
  },
  {
    cle: 'pose-hausses',
    titre: 'Pensez à poser les hausses',
    message:
      'La miellée approche : posez vos hausses à temps pour ne pas brider la récolte ni favoriser l’essaimage.',
    debut: [4, 15],
    fin: [5, 31],
    priorite: 'moyenne',
  },
  {
    cle: 'surveillance-essaimage',
    titre: 'Surveillez l’essaimage',
    message:
      'Pic d’essaimage : contrôlez les cellules royales tous les 7 à 10 jours et donnez de la place aux colonnes fortes.',
    debut: [5, 1],
    fin: [6, 30],
    priorite: 'moyenne',
  },
  {
    cle: 'traitement-varroa',
    titre: 'Traitement varroa après récolte',
    message:
      'Après la récolte d’été, placez votre traitement anti-varroa sans tarder : c’est décisif pour la survie hivernale.',
    debut: [8, 1],
    fin: [9, 15],
    priorite: 'haute',
  },
  {
    cle: 'preparation-hivernage',
    titre: 'Préparez l’hivernage',
    message:
      'Faites le bilan des réserves, complétez le nourrissement si besoin, réduisez les entrées et vérifiez l’isolation.',
    debut: [9, 15],
    fin: [10, 31],
    priorite: 'moyenne',
  },
  {
    cle: 'suivi-hiver',
    titre: 'Suivi d’hiver des colonies',
    message:
      'Sans ouvrir les ruches : pesez-les, vérifiez les réserves et l’absence d’humidité, et protégez du vent.',
    debut: [12, 1],
    fin: [1, 31],
    priorite: 'basse',
  },
];

/** La date `now` tombe-t-elle dans la fenêtre [debut, fin] (gère le passage d'année) ? */
function dansFenetre(now: Date, debut: [number, number], fin: [number, number]): boolean {
  const m = now.getMonth() + 1;
  const j = now.getDate();
  const cur = m * 100 + j;
  const d = debut[0] * 100 + debut[1];
  const f = fin[0] * 100 + fin[1];
  return d <= f ? cur >= d && cur <= f : cur >= d || cur <= f; // fenêtre à cheval sur l'année
}

/** Année de campagne stable pour la clé (une seule clé par hiver à cheval). */
function anneeCampagne(now: Date, saison: Saison): number {
  const aCheval = saison.debut[0] > saison.fin[0];
  // En janvier d'une fenêtre à cheval, on est sur la campagne démarrée en décembre.
  if (aCheval && now.getMonth() + 1 <= saison.fin[0]) return now.getFullYear() - 1;
  return now.getFullYear();
}

/** Clés `${cle}-${annee}` des saisons actives à l'instant `now`. Pur, testable. */
export function clesSaisonsActives(now: Date): string[] {
  return SAISONS.filter((s) => dansFenetre(now, s.debut, s.fin)).map(
    (s) => `${s.cle}-${anneeCampagne(now, s)}`,
  );
}

/** Construit les alertes saisonnières dues (1 par fenêtre active non déjà émise). */
export function construireAlertesSaison(
  userId: string,
  now: Date,
  dejaExiste: DejaExiste,
): AlerteInsert[] {
  const out: AlerteInsert[] = [];
  for (const s of SAISONS) {
    if (!dansFenetre(now, s.debut, s.fin)) continue;
    const ref = `${s.cle}-${anneeCampagne(now, s)}`;
    if (dejaExiste('rappel_saison', ref)) continue;
    out.push({
      userId,
      type: 'rappel_saison',
      titre: s.titre,
      message: s.message,
      priorite: s.priorite,
      referenceType: 'saison',
      referenceId: ref,
      actionUrl: '/calendrier',
      lue: false,
    });
  }
  return out;
}

/** Résout les rappels saisonniers dont la fenêtre n'est plus active. */
export async function autoResoudreSaison(userId: string, now: Date): Promise<void> {
  const existantes = await db
    .select({ id: alertes.id, referenceId: alertes.referenceId })
    .from(alertes)
    .where(
      and(
        eq(alertes.userId, userId),
        eq(alertes.type, 'rappel_saison'),
        isNull(alertes.resolvedAt),
      ),
    );
  if (existantes.length === 0) return;

  const actives = new Set(clesSaisonsActives(now));
  const aResoudre = existantes.filter((a) => !actives.has(a.referenceId ?? '')).map((a) => a.id);
  if (aResoudre.length > 0) {
    await db
      .update(alertes)
      .set({ resolvedAt: now, updatedAt: now })
      .where(inArray(alertes.id, aResoudre));
  }
}
