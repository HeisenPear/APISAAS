import { eq, sql } from 'drizzle-orm';
import { signalementsFrelon, votesFrelon, profils } from '~~/server/database/schema';
import {
  dernierSigneDeVie,
  deltaReputation,
  scoreFiabilite,
  silenceEnJours,
  statutCommunautaire,
} from '~~/app/utils/frelonFiabilite';
import type { FrelonVote } from '~~/app/config/frelon';

/**
 * Recalcule les compteurs dénormalisés, le score de fiabilité et le statut
 * communautaire d'un signalement à partir de ses votes, et ajuste la réputation
 * de l'auteur lors d'une bascule de statut. Source de vérité = la table votes.
 */
export async function recomputeSignalement(signalementId: string): Promise<void> {
  const [c] = await db
    .select({
      confirmations: sql<number>`count(*) filter (where ${votesFrelon.vote} = 'confirme')::int`,
      infirmations: sql<number>`count(*) filter (where ${votesFrelon.vote} = 'infirme')::int`,
      destructions: sql<number>`count(*) filter (where ${votesFrelon.vote} = 'detruit')::int`,
      // Le dernier SIGNE DE VIE : seules les confirmations en sont un. Une
      // infirmation dit « il n'y est pas », une destruction est terminale.
      derniereConfirmation: sql<
        string | null
      >`max(${votesFrelon.createdAt}) filter (where ${votesFrelon.vote} = 'confirme')`,
    })
    .from(votesFrelon)
    .where(eq(votesFrelon.signalementId, signalementId));

  const counts = c ?? {
    confirmations: 0,
    infirmations: 0,
    destructions: 0,
    derniereConfirmation: null,
  };

  const [sig] = await db
    .select({
      auteurId: signalementsFrelon.auteurId,
      createdAt: signalementsFrelon.createdAt,
      statut: signalementsFrelon.statut,
    })
    .from(signalementsFrelon)
    .where(eq(signalementsFrelon.id, signalementId))
    .limit(1);
  if (!sig) return;

  const [auteur] = await db
    .select({ rep: profils.reputationFrelon })
    .from(profils)
    .where(eq(profils.id, sig.auteurId))
    .limit(1);

  /**
   * ⚠️ LE SILENCE, PAS L'ÂGE. La décroissance partait de `createdAt` : confirmer
   * un nid ne rajeunissait rien, donc le geste même qui prouve qu'il est encore
   * là ne comptait pas. Elle ne s'appliquait en plus que si `confirmations === 0`
   * — une seule confirmation la désactivait pour toujours.
   */
  const signeDeVie = dernierSigneDeVie(sig.createdAt, counts.derniereConfirmation);
  const score = scoreFiabilite(counts, auteur?.rep ?? 0, silenceEnJours(signeDeVie, new Date()));
  // Un nid acté « détruit » par l'auteur ne revient pas en arrière via les votes.
  const nouveauStatut = sig.statut === 'detruit' ? 'detruit' : statutCommunautaire(counts);
  const delta = deltaReputation(sig.statut, nouveauStatut);

  await db
    .update(signalementsFrelon)
    .set({
      confirmations: counts.confirmations,
      infirmations: counts.infirmations,
      destructions: counts.destructions,
      scoreFiabilite: score,
      statut: nouveauStatut,
      updatedAt: new Date(),
    })
    .where(eq(signalementsFrelon.id, signalementId));

  if (delta !== 0) {
    await db
      .update(profils)
      .set({ reputationFrelon: sql`${profils.reputationFrelon} + ${delta}` })
      .where(eq(profils.id, sig.auteurId));
  }
}

/** Enregistre (ou met à jour) le vote d'un utilisateur puis recalcule le signalement. */
export async function appliquerVote(
  signalementId: string,
  userId: string,
  vote: FrelonVote,
): Promise<void> {
  await db
    .insert(votesFrelon)
    .values({ signalementId, userId, vote })
    .onConflictDoUpdate({
      target: [votesFrelon.signalementId, votesFrelon.userId],
      set: { vote, createdAt: new Date() },
    });
  await recomputeSignalement(signalementId);
}
