// ═══════════════════════════════════════════════════════════════════════════
// TESTS DE HANDLERS — écritures réelles, sur compte éphémère.
//
// Ce que les bancs unitaires ne peuvent pas prouver : que le SQL passe, que
// les contraintes tiennent, et que le gating de plan s'applique VRAIMENT au
// moment d'écrire — pas seulement dans une table de configuration.
//
// Chaque scénario travaille sur un compte créé pour lui et supprimé après.
// L'isolation vient du LOCATAIRE, pas d'une transaction annulée : les handlers
// ouvrent leur propre transaction et commitent hors de toute portée que le
// test pourrait annuler (cf. l'en-tête de `harnais.ts`).
//
// Ces bancs SAUTENT tant que l'écriture n'est pas autorisée sur la cible —
// base locale, ou `APIGO_AUTORISE_ECRITURE_BASE=oui`. Ils ne tombent jamais en
// échec pour cette raison : un banc sauté se voit, un banc rouge se discute.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { and, eq, sql } from 'drizzle-orm';
import { clients, interventions } from '~~/server/database/schema';
import { avecCompteEphemere, baseDeTest, ecritureAutorisee } from './harnais';

const garde = ecritureAutorisee();
const siEcriture = garde.ok ? describe : describe.skip;

if (!garde.ok) {
  console.info(`[harnais] bancs d'écriture SAUTÉS — ${garde.raison}`);
}

siEcriture('gating de plan à l’écriture', () => {
  it('un compte Découverte ne peut pas créer de client', async () => {
    const { executerActionClient } = await import('~~/server/utils/copilote-actions');

    await avecCompteEphemere('decouverte', async (compte) => {
      const res = await executerActionClient(compte.id, { nom: 'Miellerie du Test' }, 'decouverte');

      expect(res.ok).toBe(false);
      // Le refus doit nommer la formule qui débloque : jamais un mur sec.
      expect(res.texte).toMatch(/Starter|Pro|Expert/);

      // Et surtout : RIEN ne doit avoir été écrit.
      const db = baseDeTest();
      const restants = await db.select().from(clients).where(eq(clients.userId, compte.id));
      expect(restants).toHaveLength(0);
    });
  });

  it('un compte Starter le peut — ce qui est vendu doit marcher', async () => {
    const { executerActionClient } = await import('~~/server/utils/copilote-actions');

    await avecCompteEphemere('starter', async (compte) => {
      const res = await executerActionClient(compte.id, { nom: 'Miellerie du Test' }, 'starter');

      expect(res.ok, `refus inattendu : ${res.texte}`).toBe(true);

      const db = baseDeTest();
      const crees = await db.select().from(clients).where(eq(clients.userId, compte.id));
      expect(crees).toHaveLength(1);
      expect(crees[0]?.nom).toBe('Miellerie du Test');
    });
  });

  it('le plafond de clients se cumule au fil des créations', async () => {
    // Le défaut du 3 août en miniature : un contrôle qui ne regarde que
    // l'existant laisse passer la Nième création. Ici on crée jusqu'au refus,
    // et on vérifie que le refus tombe au bon rang.
    const { executerActionClient } = await import('~~/server/utils/copilote-actions');
    const { getLimit } = await import('~/config/plans');
    const max = getLimit('starter', 'clients');
    if (max === Infinity) return;

    await avecCompteEphemere('starter', async (compte) => {
      let refusAu: number | null = null;
      for (let i = 1; i <= max + 1; i++) {
        const res = await executerActionClient(compte.id, { nom: `Client ${i}` }, 'starter');
        if (!res.ok) {
          refusAu = i;
          break;
        }
      }
      expect(refusAu, `aucun refus avant ${max + 1} créations`).toBe(max + 1);

      const db = baseDeTest();
      const [row] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(clients)
        .where(eq(clients.userId, compte.id));
      expect(row?.n).toBe(max);
    });
  });
});

siEcriture('une visite dictée alimente le score de santé', () => {
  it('remplit les colonnes plates, pas seulement le JSONB', async () => {
    // Le correctif : Maya écrivait `donnees` en camelCase et laissait
    // `force_colonie`, `reine_vue`… nulles. La visite existait mais restait
    // invisible au score de santé et aux alertes.
    //
    // ─── POURQUOI CE BANC A ÉTÉ RÉÉCRIT ──────────────────────────────────
    // Sa première version n'envoyait AUCUN `rucheId`, requis par le schéma de
    // validation : l'appel levait une ZodError avant toute assertion. Pire,
    // elle sortait en silence sur `if (!res.ok) return`, si bien que n'importe
    // quel refus la rendait verte. Elle ne pouvait NI passer NI échouer pour la
    // bonne raison — le seul banc censé attester le correctif phare.
    //
    // Il crée donc maintenant un vrai rucher et une vraie ruche avant de
    // dicter, et n'a plus d'échappatoire.
    const { executerActionIntervention } = await import('~~/server/utils/copilote-actions');
    const { ruchers, ruches } = await import('~~/server/database/schema');

    await avecCompteEphemere('starter', async (compte) => {
      const db = baseDeTest();

      const [rucher] = await db
        .insert(ruchers)
        .values({ userId: compte.id, nom: 'Rucher du harnais' })
        .returning({ id: ruchers.id });
      const [ruche] = await db
        .insert(ruches)
        .values({ userId: compte.id, rucherId: rucher!.id, numero: '1', statut: 'active' })
        .returning({ id: ruches.id });

      const res = await executerActionIntervention(
        compte.id,
        {
          rucheId: ruche!.id,
          type: 'controle',
          donnees: { forceColonie: 4, reineVue: true, couvainPresent: true, reserves: true },
        },
        'starter',
      );

      // Plus d'échappatoire : un refus est un ÉCHEC, et son texte doit le dire.
      expect(res.ok, `écriture refusée : ${res.texte}`).toBe(true);

      const [visite] = await db
        .select()
        .from(interventions)
        .where(and(eq(interventions.userId, compte.id), eq(interventions.rucheId, ruche!.id)))
        .limit(1);

      expect(visite, 'la visite doit exister en base').toBeTruthy();
      expect(visite?.forceColonie, 'force_colonie doit être remplie').toBe(4);
      expect(visite?.reineVue).toBe(true);
      // Booléen → échelle 1-5 du calcul de score, comme `controle.ts`.
      expect(visite?.couvain).toBe(4);
      expect(visite?.reserves).toBe(4);
    });
  });
});
