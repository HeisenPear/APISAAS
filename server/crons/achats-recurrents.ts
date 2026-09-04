import { eq, and, lte, isNotNull, sql } from 'drizzle-orm';
import { transactions, stocks, mouvementsStock } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { prochaineEcheance } from '~~/server/utils/recurrence';
import { anneeParis } from '~~/server/utils/horloge';
import {
  FAMILLES_NUMERO,
  ordreNumeroDecroissant,
  prefixeMillesime,
  suiteDeNumeros,
} from '~~/server/utils/numerotation';

interface LigneTransaction {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  ajouterAuStock?: boolean;
  stockId?: string;
  stockCategorie?: string;
  stockUnite?: string;
  stockSeuilAlerte?: number;
  unitesParColis?: number;
}

const ACHAT_BATCH_SIZE = 10; // Achats traites en parallele par tour

type StockUpdate = { stockId: string; userId: string; addQty: number; numero: string };

/**
 * ⚠️ TROIS CHARGES DUES LE MÊME JOUR RECEVAIENT LE MÊME NUMÉRO D'ACHAT.
 *
 * Le numéro était calculé ICI, dans `processAchat` — et `processAchat` tourne
 * par lots de dix EN PARALLÈLE (`processInBatches`). Les dix lectures du
 * « dernier numéro » partaient donc AVANT que la première insertion n'ait eu
 * lieu : toutes lisaient le même dernier numéro, toutes calculaient le même
 * suivant.
 *
 * Ce n'est pas une course rare entre deux clics : c'est DÉTERMINISTE. Les
 * charges mensuelles d'un apiculteur sont naturellement ancrées au même jour
 * (assurance, sucre, expert-comptable, abonnements) ; elles échoient donc
 * ensemble, tous les mois, et repartaient toutes avec `AC-2026-0042`.
 *
 * Conséquences, en cascade : le journal des achats affiche deux, trois lignes
 * portant la même référence ; les mouvements de stock engendrés citent tous
 * « Achat recurrent AC-2026-0042 » et l'on ne sait plus quelle entrée vient de
 * quelle facture fournisseur ; l'export comptable sort avec des identifiants
 * dupliqués. `transactions.numero` n'a aucune contrainte d'unicité en base :
 * rien ne l'a jamais refusé, rien ne l'a jamais signalé.
 *
 * Le correctif attribue les numéros AVANT le lot, par apiculteur : une seule
 * lecture, N numéros consécutifs distribués localement. C'est exactement ce
 * que fait déjà la génération de hausses — le modèle existait dans le dépôt.
 */
async function attribuerNumeros(
  dus: (typeof transactions.$inferSelect)[],
  annee: number,
): Promise<Map<string, string>> {
  const parApiculteur = new Map<string, (typeof transactions.$inferSelect)[]>();
  for (const achat of dus) {
    const liste = parApiculteur.get(achat.userId);
    if (liste) liste.push(achat);
    else parApiculteur.set(achat.userId, [achat]);
  }

  const numeros = new Map<string, string>();
  const prefixe = prefixeMillesime('achat', annee);
  await Promise.all(
    Array.from(parApiculteur, async ([userId, achats]) => {
      const [dernier] = await db
        .select({ numero: transactions.numero })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'achat'),
            isNotNull(transactions.numero),
          ),
        )
        .orderBy(...ordreNumeroDecroissant(transactions.numero))
        .limit(1);
      // Ordre stable : l'échéance d'abord, l'identifiant pour départager. Sans
      // lui, deux passages du même lot n'attribueraient pas les mêmes numéros
      // aux mêmes charges, et un banc ne pourrait rien affirmer.
      const ordonnes = [...achats].sort(
        (a, b) =>
          new Date(a.nextRecurringDate ?? 0).getTime() -
            new Date(b.nextRecurringDate ?? 0).getTime() || a.id.localeCompare(b.id),
      );
      const suite = suiteDeNumeros(dernier?.numero ?? null, prefixe, ordonnes.length, {
        politique: FAMILLES_NUMERO.achat.politique,
        largeur: FAMILLES_NUMERO.achat.largeur,
      });
      ordonnes.forEach((achat, i) => numeros.set(achat.id, suite[i]!));
    }),
  );
  return numeros;
}

async function processAchat(
  achat: typeof transactions.$inferSelect,
  numero: string,
): Promise<{ created: boolean; stockUpdates: StockUpdate[] }> {
  const userId = achat.userId;
  const lignes = (achat.lignes ?? []) as LigneTransaction[];
  const interval = achat.recurringInterval as 'mensuel' | 'annuel' | null;
  if (!interval) return { created: false, stockUpdates: [] };

  // Prochaine date recurrente
  /**
   * ⚠️ LA MÊME FORMULE FAUTIVE VIVAIT ICI, et c'est ce qui rendait la dérive
   * DÉFINITIVE : le cron réappliquait `setMonth(+1)` à chaque passage, si bien
   * qu'une échéance une fois décalée ne revenait jamais à son jour.
   *
   * L'ancre est `achat.dateTransaction` — la date de l'achat d'ORIGINE. Sans
   * elle, borner au dernier jour du mois corrigerait le saut mais perdrait le
   * 31 pour toujours (31 janv → 28 fév → 28 mars → 28 avr…). Avec elle, on
   * retrouve ce qu'attend quiconque a déjà vu un prélèvement mensuel :
   * 28 février, puis 31 mars, puis 30 avril.
   */
  // L'échéance qui échoit aujourd'hui : c'est la date de l'achat qu'on crée.
  const base = new Date(achat.nextRecurringDate!);
  const nextDate = prochaineEcheance(base, interval, new Date(achat.dateTransaction));

  // Creer l'achat copie + maj du nextRecurringDate sur l'origine — en parallele
  const [newAchat] = await Promise.all([
    db
      .insert(transactions)
      .values({
        userId,
        clientId: null,
        type: 'achat',
        numero,
        dateTransaction: base,
        statut: 'payee',
        sousTotal: achat.sousTotal,
        tva: achat.tva,
        total: achat.total,
        lignes: achat.lignes,
        notes: achat.notes,
        categorie: achat.categorie,
        /**
         * ⚠️ UNE OCCURRENCE N'EST PAS UN GABARIT, ET LA CONFONDRE DOUBLAIT LA
         * CHARGE À CHAQUE ÉCHÉANCE.
         *
         * La copie était insérée `isRecurring: true` avec son propre
         * `nextRecurringDate`, pendant que l'origine voyait la sienne avancée
         * juste en dessous. Or le balayage du cron ne filtre que sur
         * `type='achat' AND is_recurring AND next_recurring_date <= now` :
         * rien ne distingue une charge MÈRE d'une occurrence GÉNÉRÉE. Le
         * nombre de lignes récurrentes doublait donc à chaque passage.
         *
         * Une assurance mensuelle à 120 € : 1 achat en juin, 2 en juillet, 4
         * en août, 8 en septembre — 2 048 le même jour au bout d'un an. Avec
         * autant de mouvements de stock, un résultat et une TVA déductible
         * multipliés par 2ⁿ, et une projection de trésorerie qui annonce
         * 2 048 × 120 € pour le mois suivant. Faux dans le sens qui
         * l'appauvrit.
         *
         * Ce n'est pas une course rare : c'est déterministe. L'occurrence est
         * une dépense CONSTATÉE ; seule l'origine porte le calendrier, et elle
         * est déjà mise à jour dans le même `Promise.all`.
         */
        isRecurring: false,
        recurringInterval: null,
        nextRecurringDate: null,
      })
      .returning(),
    db
      .update(transactions)
      .set({ nextRecurringDate: nextDate })
      .where(eq(transactions.id, achat.id)),
  ]);

  if (!newAchat || newAchat.length === 0) {
    return { created: false, stockUpdates: [] };
  }

  // Collecter les stock updates a appliquer en batch a la fin
  const stockUpdates: StockUpdate[] = [];
  for (const ligne of lignes) {
    if (!ligne.ajouterAuStock || !ligne.stockId) continue;
    const addQty = ligne.unitesParColis ? ligne.quantite * ligne.unitesParColis : ligne.quantite;
    stockUpdates.push({ stockId: ligne.stockId, userId, addQty, numero });
  }

  return { created: true, stockUpdates };
}

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();

  // Recupere tous les achats recurrents dus
  const dus = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'achat'),
        eq(transactions.isRecurring, true),
        lte(transactions.nextRecurringDate, now),
      ),
    );

  if (dus.length === 0) {
    return { created: 0, checked: 0 };
  }

  // Une échéance sans intervalle ne produira aucun achat : elle est écartée
  // AVANT l'attribution, sinon elle consommerait un numéro pour rien et
  // creuserait un trou dans la séquence.
  const traitables = dus.filter(
    (a) => a.recurringInterval === 'mensuel' || a.recurringInterval === 'annuel',
  );

  // Process en batches paralleles
  // Les numéros sont attribués AVANT le lot parallèle — voir `attribuerNumeros`.
  // L'année se lit à Paris : `getFullYear()` répondait dans le fuseau du
  // serveur, UTC sur Vercel.
  const numeros = await attribuerNumeros(traitables, anneeParis(now));

  const { results, errors } = await processInBatches(traitables, ACHAT_BATCH_SIZE, async (achat) =>
    processAchat(achat, numeros.get(achat.id)!),
  );

  const created = results.filter((r) => r.created).length;
  const allStockUpdates = results.flatMap((r) => r.stockUpdates);

  // Appliquer les stock updates en batch (1 UPDATE par stock + 1 INSERT
  // mouvement par stock — chunkes pour limiter la charge)
  if (allStockUpdates.length > 0) {
    // Group updates par stockId pour combiner les quantites (1 stock peut
    // recevoir plusieurs lignes du meme achat)
    const grouped = new Map<string, { userId: string; total: number; motifs: string[] }>();
    for (const u of allStockUpdates) {
      const existing = grouped.get(u.stockId);
      if (existing) {
        existing.total += u.addQty;
        existing.motifs.push(u.numero);
      } else {
        grouped.set(u.stockId, { userId: u.userId, total: u.addQty, motifs: [u.numero] });
      }
    }

    // Appliquer chaque stockUpdate (parallele, batch de 25)
    await processInBatches(
      Array.from(grouped.entries()),
      25,
      async ([stockId, { userId, total }]) => {
        await db
          .update(stocks)
          .set({
            quantite: sql`${stocks.quantite}::numeric + ${total}::numeric`,
            updatedAt: new Date(),
          })
          .where(and(eq(stocks.id, stockId), eq(stocks.userId, userId)));
      },
    );

    // INSERT mouvements en batch (1 mouvement par stockUpdate brut, pas groupe
    // — on garde le detail des achats sources)
    const mouvementsValues = allStockUpdates.map((u) => ({
      stockId: u.stockId,
      userId: u.userId,
      type: 'entree' as const,
      quantite: u.addQty.toString(),
      motif: `Achat recurrent ${u.numero}`,
    }));

    const CHUNK = 500;
    for (let i = 0; i < mouvementsValues.length; i += CHUNK) {
      await db.insert(mouvementsStock).values(mouvementsValues.slice(i, i + CHUNK));
    }
  }

  if (errors.length > 0) {
    console.error('[cron/achats-recurrents] achats failed', {
      count: errors.length,
      sample: errors.slice(0, 3).map((e) => ({ achatId: e.item.id, error: String(e.error) })),
    });
  }

  return { created, checked: dus.length, failed: errors.length };
});
