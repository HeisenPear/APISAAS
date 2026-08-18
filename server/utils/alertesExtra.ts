import { and, eq, gte, lte, isNull, inArray } from 'drizzle-orm';
import { alertes, ordonnances, plansTranshumance, reinesElevage } from '~~/server/database/schema';
import { anneeParis } from '~~/server/utils/horloge';

/**
 * Règles d'alerte SUPPLÉMENTAIRES (échéance NAPI, fin de traitement / délai
 * récolte, transhumance à venir, reine âgée). Partagées entre la génération à la
 * demande (`/api/alertes/generate`) et le cron (`/api/cron/alertes`) pour éviter
 * toute divergence. Les données existent déjà — aucune migration.
 */

type AlerteInsert = typeof alertes.$inferInsert;
type DejaExiste = (type: string, referenceId?: string) => boolean;

const jours = (ms: number) => ms / 86_400_000;

/** Construit les nouvelles alertes supplémentaires pour un utilisateur. */
export async function construireAlertesExtra(
  userId: string,
  dejaExiste: DejaExiste,
  maintenant: Date,
): Promise<AlerteInsert[]> {
  const out: AlerteInsert[] = [];
  // Année civile de PARIS : le 1er janvier à 00 h 30, une lambda en UTC est
  // encore au 31 décembre et vieillirait les reines d'un an de retard.
  const annee = anneeParis(maintenant);

  // NB : l'échéance NAPI est gérée par le cron dédié `napi-reminders` (rappels
  // multi-paliers sur dates précises) — on ne la duplique pas ici.

  // 1. Transhumance à venir (J-7), non encore réalisée.
  const dans7j = new Date(maintenant);
  dans7j.setDate(dans7j.getDate() + 7);

  // Transhumance + reines âgées + ordonnances : 3 lectures indépendantes → en parallèle.
  const [plans, reines, ords] = await Promise.all([
    db
      .select({
        id: plansTranshumance.id,
        datePrevue: plansTranshumance.datePrevue,
        miellee: plansTranshumance.miellee,
      })
      .from(plansTranshumance)
      .where(
        and(
          eq(plansTranshumance.userId, userId),
          isNull(plansTranshumance.dateRealisee),
          gte(plansTranshumance.datePrevue, maintenant),
          lte(plansTranshumance.datePrevue, dans7j),
        ),
      ),
    db
      .select({
        id: reinesElevage.id,
        identifiant: reinesElevage.identifiant,
        anneeNaissance: reinesElevage.anneeNaissance,
      })
      .from(reinesElevage)
      .where(
        and(
          eq(reinesElevage.userId, userId),
          eq(reinesElevage.estActive, true),
          isNull(reinesElevage.dateRemplacement),
          lte(reinesElevage.anneeNaissance, annee - 2),
        ),
      ),
    db
      .select({
        id: ordonnances.id,
        datePrescription: ordonnances.datePrescription,
        medicament: ordonnances.medicament,
        duree: ordonnances.dureeTraitementJours,
        delai: ordonnances.delaiAttenteAvantRecolteJours,
      })
      .from(ordonnances)
      .where(eq(ordonnances.userId, userId)),
  ]);

  for (const p of plans) {
    if (!p.datePrevue || dejaExiste('transhumance_proche', p.id)) continue;
    const j = Math.max(
      0,
      Math.ceil(jours(new Date(p.datePrevue).getTime() - maintenant.getTime())),
    );
    out.push({
      userId,
      type: 'transhumance_proche',
      titre: j <= 1 ? 'Transhumance demain' : `Transhumance dans ${j} jours`,
      message: `Déplacement ${p.miellee ? `vers ${p.miellee} ` : ''}prévu le ${new Date(p.datePrevue).toLocaleDateString('fr-FR')}. Pensez au matériel, aux sangles et à fermer les ruches la veille au soir.`,
      priorite: j <= 2 ? 'haute' : 'moyenne',
      referenceType: 'transhumance',
      referenceId: p.id,
      actionUrl: '/transhumance',
      lue: false,
    });
  }

  // 3. Reine âgée (> 2 ans, encore active) → penser au remplacement.
  for (const r of reines) {
    if (dejaExiste('reine_agee', r.id)) continue;
    const age = annee - (r.anneeNaissance ?? annee);
    out.push({
      userId,
      type: 'reine_agee',
      titre: `Reine ${r.identifiant ?? ''} âgée de ${age} ans`.trim(),
      message: `Au-delà de 2 ans, la ponte d'une reine décline et le risque d'essaimage augmente. Pensez à la remplacer cette saison.`,
      priorite: 'moyenne',
      referenceType: 'reine',
      referenceId: r.id,
      actionUrl: '/elevage/reines',
      lue: false,
    });
  }

  // 4. Fin de traitement : délai d'attente avant récolte écoulé (fenêtre 0–14 j).
  for (const o of ords) {
    if (!o.datePrescription || dejaExiste('traitement_fin', o.id)) continue;
    const safe = new Date(o.datePrescription);
    safe.setDate(safe.getDate() + (o.duree ?? 0) + (o.delai ?? 0));
    const depuis = jours(maintenant.getTime() - safe.getTime());
    if (depuis >= 0 && depuis <= 14) {
      out.push({
        userId,
        type: 'traitement_fin',
        titre: 'Récolte à nouveau possible',
        message:
          `Le délai d'attente après le traitement ${o.medicament ? `« ${o.medicament} »` : ''} est écoulé : vous pouvez récolter sans risque de résidus.`.replace(
            /\s+/g,
            ' ',
          ),
        priorite: 'moyenne',
        referenceType: 'ordonnance',
        referenceId: o.id,
        actionUrl: '/conformite/ordonnances',
        lue: false,
      });
    }
  }

  return out;
}

/** Résout les alertes supplémentaires dont la condition n'est plus vraie. */
export async function autoResoudreExtra(userId: string, maintenant: Date): Promise<void> {
  const existantes = await db
    .select({ id: alertes.id, type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt)));
  if (existantes.length === 0) return;

  const aResoudre: string[] = [];

  // Transhumance : résolue si la date est passée ou le plan réalisé.
  const transhIds = existantes
    .filter((a) => a.type === 'transhumance_proche' && a.referenceId)
    .map((a) => a.referenceId!);
  if (transhIds.length > 0) {
    const encore = await db
      .select({ id: plansTranshumance.id })
      .from(plansTranshumance)
      .where(
        and(
          inArray(plansTranshumance.id, transhIds),
          isNull(plansTranshumance.dateRealisee),
          gte(plansTranshumance.datePrevue, maintenant),
        ),
      );
    const encoreSet = new Set(encore.map((p) => p.id));
    existantes
      .filter((a) => a.type === 'transhumance_proche' && !encoreSet.has(a.referenceId ?? ''))
      .forEach((a) => aResoudre.push(a.id));
  }

  // Reine : résolue si remplacée / inactive.
  const reineIds = existantes
    .filter((a) => a.type === 'reine_agee' && a.referenceId)
    .map((a) => a.referenceId!);
  if (reineIds.length > 0) {
    const encore = await db
      .select({ id: reinesElevage.id })
      .from(reinesElevage)
      .where(
        and(
          inArray(reinesElevage.id, reineIds),
          eq(reinesElevage.estActive, true),
          isNull(reinesElevage.dateRemplacement),
        ),
      );
    const encoreSet = new Set(encore.map((r) => r.id));
    existantes
      .filter((a) => a.type === 'reine_agee' && !encoreSet.has(a.referenceId ?? ''))
      .forEach((a) => aResoudre.push(a.id));
  }

  if (aResoudre.length > 0) {
    await db
      .update(alertes)
      .set({ resolvedAt: maintenant, updatedAt: maintenant })
      .where(inArray(alertes.id, aResoudre));
  }
}
