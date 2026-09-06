import { eq } from 'drizzle-orm';
import {
  acquisitionsPromo,
  alertes,
  balances,
  bonsLivraison,
  clients,
  commandesGroupees,
  comptagesVarroa,
  conditionnements,
  connexionsBalance,
  connexionsBancaires,
  declarationsNapi,
  deplacementsRuches,
  divisions,
  empilements,
  emplacements,
  essaimages,
  evenementsActivite,
  evenementsReine,
  evenementsSanitaires,
  hausses,
  historiqueCire,
  interventions,
  lignees,
  membres,
  messagesForum,
  mesuresBalance,
  mortalites,
  mouvementsBancaires,
  mouvementsMateriel,
  mouvementsStock,
  observationsFloraison,
  ordonnances,
  organisations,
  pesees,
  planExecutions,
  plansTranshumance,
  previsionsTresorerie,
  produitsCatalogue,
  profils,
  receptricesGreffage,
  recoltes,
  reinesElevage,
  ruchers,
  ruches,
  sessionsGreffage,
  signalementsAbus,
  signalementsFrelon,
  stocks,
  sujetsForum,
  templatesIntervention,
  testsPerformance,
  traitementsVarroa,
  transactions,
  transvasements,
  veterinaires,
  visitesSanitaires,
  votesFrelon,
} from '~~/server/database/schema';

/**
 * Export des données personnelles — RGPD article 15 (accès) et 20 (portabilité).
 *
 * Ce module porte la LISTE et la CLASSIFICATION. La route reste mince, et
 * `tests/unit/server/utils/exportPersonnel.test.ts` compare cette classification
 * au schéma réel : toute table qui NOMME UNE PERSONNE — par `user_id`,
 * `auteur_id`, `owner_id` ou `membre_id` — doit être soit exportée, soit exclue
 * AVEC un motif. Une table ajoutée au schéma et oubliée ici casse le banc.
 * C'est le seul garde-fou qui empêche l'export de se périmer en silence — il
 * l'était déjà deux fois : 18 tables exportées sur 51 au départ, puis les tables
 * communautaires en `auteur_id`, que le balayage ne regardait même pas.
 */

/**
 * Colonnes qui sont des CLÉS D'ACCÈS, jamais des données personnelles.
 *
 * Un export RGPD est fait pour SORTIR du produit : on le télécharge, on le
 * transmet à un tiers, on l'archive dans un nuage. Y laisser un jeton porteur,
 * c'est distribuer un droit d'écriture. `balances.ingestToken` en est un au sens
 * strict — `server/api/balances/ingest/[token].post.ts` l'accepte SEUL, sans
 * session : quiconque le détient peut injecter des pesées dans le rucher.
 */
export const CHAMPS_CENSURES: Record<string, readonly string[]> = {
  balances: ['ingestToken'],
  connexionsBalance: ['token'],
  /**
   * ⚠️ `commandesGroupees.tokenQr` OUVRE UNE PAGE PUBLIQUE À LUI SEUL.
   * `server/api/public/commande/[tokenQr].get.ts` l'accepte sans session : qui
   * le détient lit la commande, son montant et ses coordonnées. Le mettre en
   * clair dans un fichier qu'on télécharge et qu'on transmet reviendrait à
   * publier l'URL. Trouvé par le balayage anti-jeton à la seconde même où la
   * table est entrée dans l'export — c'est ce que ce balayage est là pour faire.
   */
  commandesGroupees: ['tokenQr'],
};

export const MENTION_CENSURE = '[clé d’accès retirée de l’export]';

/**
 * Tables nommant une personne mais volontairement HORS export, chacune avec son
 * motif. Le banc d'invariant lit cette liste : exclure devient un acte explicite.
 */
export const EXCLUSIONS_MOTIVEES: Record<string, string> = {
  auditLog:
    "Journal de sécurité (IP, user-agent, succès/échec). Ce n'est pas une donnée fournie par la personne au sens de l'article 20, et le publier dans un fichier qui circule affaiblirait la traçabilité qu'il sert. Communicable sur demande d'accès, au cas par cas.",
  tokensCalendrier:
    "N'a d'autre contenu qu'un jeton d'abonnement iCal — une clé d'accès, pas une donnée. La censurer ne laisserait qu'une ligne vide.",
};

/** Une table exportée : sa clé dans la charge utile, et sa requête. */
interface SourceExport {
  cle: string;
  lire: () => Promise<Record<string, unknown>[]>;
}

/**
 * Les requêtes de l'export, filtrées sur l'utilisateur LUI-MÊME (`user.id`), et
 * non sur le propriétaire de l'espace via `resolveOwnerId`. C'est voulu : le
 * droit d'accès porte sur les données de la PERSONNE qui le demande. Un
 * technicien invité sur l'exploitation d'un tiers repart avec ce qu'il a saisi,
 * pas avec le cheptel de son employeur.
 *
 * Corollaire sur `membres` : le filtre `userId` ne rend que les adhésions de la
 * personne. Les lignes où elle est `ownerId` — donc les adresses e-mail de SES
 * invités — restent dehors : ce sont les données de tiers.
 */
export function sourcesExport(userId: string): SourceExport[] {
  return [
    { cle: 'ruchers', lire: () => db.select().from(ruchers).where(eq(ruchers.userId, userId)) },
    { cle: 'ruches', lire: () => db.select().from(ruches).where(eq(ruches.userId, userId)) },
    { cle: 'hausses', lire: () => db.select().from(hausses).where(eq(hausses.userId, userId)) },
    {
      cle: 'empilements',
      lire: () => db.select().from(empilements).where(eq(empilements.userId, userId)),
    },
    {
      cle: 'emplacements',
      lire: () => db.select().from(emplacements).where(eq(emplacements.userId, userId)),
    },
    {
      cle: 'interventions',
      lire: () => db.select().from(interventions).where(eq(interventions.userId, userId)),
    },
    {
      cle: 'deplacementsRuches',
      lire: () => db.select().from(deplacementsRuches).where(eq(deplacementsRuches.userId, userId)),
    },
    {
      cle: 'plansTranshumance',
      lire: () => db.select().from(plansTranshumance).where(eq(plansTranshumance.userId, userId)),
    },
    {
      cle: 'divisions',
      lire: () => db.select().from(divisions).where(eq(divisions.userId, userId)),
    },
    {
      cle: 'essaimages',
      lire: () => db.select().from(essaimages).where(eq(essaimages.userId, userId)),
    },
    {
      cle: 'transvasements',
      lire: () => db.select().from(transvasements).where(eq(transvasements.userId, userId)),
    },
    {
      cle: 'mortalites',
      lire: () => db.select().from(mortalites).where(eq(mortalites.userId, userId)),
    },
    {
      cle: 'historiqueCire',
      lire: () => db.select().from(historiqueCire).where(eq(historiqueCire.userId, userId)),
    },

    // ── Élevage ──
    {
      cle: 'reinesElevage',
      lire: () => db.select().from(reinesElevage).where(eq(reinesElevage.userId, userId)),
    },
    {
      cle: 'evenementsReine',
      lire: () => db.select().from(evenementsReine).where(eq(evenementsReine.userId, userId)),
    },
    { cle: 'lignees', lire: () => db.select().from(lignees).where(eq(lignees.userId, userId)) },
    {
      cle: 'sessionsGreffage',
      lire: () => db.select().from(sessionsGreffage).where(eq(sessionsGreffage.userId, userId)),
    },
    {
      cle: 'receptricesGreffage',
      lire: () =>
        db.select().from(receptricesGreffage).where(eq(receptricesGreffage.userId, userId)),
    },
    {
      cle: 'testsPerformance',
      lire: () => db.select().from(testsPerformance).where(eq(testsPerformance.userId, userId)),
    },

    // ── Sanitaire et conformité ──
    {
      cle: 'comptagesVarroa',
      lire: () => db.select().from(comptagesVarroa).where(eq(comptagesVarroa.userId, userId)),
    },
    {
      cle: 'traitementsVarroa',
      lire: () => db.select().from(traitementsVarroa).where(eq(traitementsVarroa.userId, userId)),
    },
    {
      cle: 'evenementsSanitaires',
      lire: () =>
        db.select().from(evenementsSanitaires).where(eq(evenementsSanitaires.userId, userId)),
    },
    {
      cle: 'visitesSanitaires',
      lire: () => db.select().from(visitesSanitaires).where(eq(visitesSanitaires.userId, userId)),
    },
    {
      cle: 'ordonnances',
      lire: () => db.select().from(ordonnances).where(eq(ordonnances.userId, userId)),
    },
    {
      cle: 'veterinaires',
      lire: () => db.select().from(veterinaires).where(eq(veterinaires.userId, userId)),
    },
    {
      cle: 'declarationsNapi',
      lire: () => db.select().from(declarationsNapi).where(eq(declarationsNapi.userId, userId)),
    },

    // ── Production et stocks ──
    { cle: 'recoltes', lire: () => db.select().from(recoltes).where(eq(recoltes.userId, userId)) },
    {
      cle: 'conditionnements',
      lire: () => db.select().from(conditionnements).where(eq(conditionnements.userId, userId)),
    },
    { cle: 'stocks', lire: () => db.select().from(stocks).where(eq(stocks.userId, userId)) },
    {
      cle: 'mouvementsStock',
      lire: () => db.select().from(mouvementsStock).where(eq(mouvementsStock.userId, userId)),
    },
    {
      cle: 'mouvementsMateriel',
      lire: () => db.select().from(mouvementsMateriel).where(eq(mouvementsMateriel.userId, userId)),
    },
    {
      cle: 'produitsCatalogue',
      lire: () => db.select().from(produitsCatalogue).where(eq(produitsCatalogue.userId, userId)),
    },

    // ── Balances connectées ──
    { cle: 'balances', lire: () => db.select().from(balances).where(eq(balances.userId, userId)) },
    {
      cle: 'mesuresBalance',
      lire: () => db.select().from(mesuresBalance).where(eq(mesuresBalance.userId, userId)),
    },
    {
      cle: 'connexionsBalance',
      lire: () => db.select().from(connexionsBalance).where(eq(connexionsBalance.userId, userId)),
    },
    { cle: 'pesees', lire: () => db.select().from(pesees).where(eq(pesees.userId, userId)) },

    // ── Commerce et finances ──
    { cle: 'clients', lire: () => db.select().from(clients).where(eq(clients.userId, userId)) },
    {
      cle: 'transactions',
      lire: () => db.select().from(transactions).where(eq(transactions.userId, userId)),
    },
    {
      cle: 'bonsLivraison',
      lire: () => db.select().from(bonsLivraison).where(eq(bonsLivraison.userId, userId)),
    },
    {
      cle: 'previsionsTresorerie',
      lire: () =>
        db.select().from(previsionsTresorerie).where(eq(previsionsTresorerie.userId, userId)),
    },
    {
      cle: 'mouvementsBancaires',
      lire: () =>
        db.select().from(mouvementsBancaires).where(eq(mouvementsBancaires.userId, userId)),
    },
    {
      cle: 'connexionsBancaires',
      lire: () =>
        db.select().from(connexionsBancaires).where(eq(connexionsBancaires.userId, userId)),
    },

    // ── Compte, assistance et communauté ──
    { cle: 'alertes', lire: () => db.select().from(alertes).where(eq(alertes.userId, userId)) },
    {
      cle: 'templatesIntervention',
      lire: () =>
        db.select().from(templatesIntervention).where(eq(templatesIntervention.userId, userId)),
    },
    {
      cle: 'planExecutions',
      lire: () => db.select().from(planExecutions).where(eq(planExecutions.userId, userId)),
    },
    {
      cle: 'evenementsActivite',
      lire: () => db.select().from(evenementsActivite).where(eq(evenementsActivite.userId, userId)),
    },
    {
      cle: 'votesFrelon',
      lire: () => db.select().from(votesFrelon).where(eq(votesFrelon.userId, userId)),
    },
    { cle: 'membres', lire: () => db.select().from(membres).where(eq(membres.userId, userId)) },
    {
      cle: 'acquisitionsPromo',
      lire: () => db.select().from(acquisitionsPromo).where(eq(acquisitionsPromo.userId, userId)),
    },

    /**
     * ══════════════════════════════════════════════════════════════════════
     * CE QUI RATTACHE UNE LIGNE À UNE PERSONNE N'EST PAS TOUJOURS `user_id`.
     * ══════════════════════════════════════════════════════════════════════
     *
     * Le banc de cet export ne balayait que les tables portant
     * `userId: uuid('user_id')`. C'est la définition qui a laissé passer
     * `signalementsFrelon` et `observationsFloraison` — deux tables
     * COMMUNAUTAIRES, donc rattachées par `auteur_id`, invisibles au balayage
     * depuis leur création. L'oubli n'a pas été vu parce que le garde-fou
     * cherchait la mauvaise colonne, pas parce que quelqu'un a mal classé.
     *
     * Les tables du forum arrivaient avec exactement la même forme. Les
     * ajouter sans élargir le balayage aurait rendu ce trou-là au suivant.
     *
     * Quatre colonnes nomment une personne dans ce schéma : `user_id`,
     * `auteur_id`, `owner_id` et `membre_id`. Les quatre sont désormais
     * balayées, et toute table qui en porte une doit être ici ou dans
     * `EXCLUSIONS_MOTIVEES`.
     */

    // ── Communauté — rattachement par `auteur_id` ──
    {
      cle: 'signalementsFrelon',
      lire: () =>
        db.select().from(signalementsFrelon).where(eq(signalementsFrelon.auteurId, userId)),
    },
    {
      cle: 'observationsFloraison',
      lire: () =>
        db.select().from(observationsFloraison).where(eq(observationsFloraison.auteurId, userId)),
    },
    {
      cle: 'sujetsForum',
      lire: () => db.select().from(sujetsForum).where(eq(sujetsForum.auteurId, userId)),
    },
    {
      cle: 'messagesForum',
      lire: () => db.select().from(messagesForum).where(eq(messagesForum.auteurId, userId)),
    },
    /**
     * ⚠️ CE QUE LA PERSONNE A SIGNALÉ, C'EST CE QUI PEUT LUI COÛTER SON DROIT
     * DE SIGNALER — et la suspension est DÉFINITIVE tant qu'elle n'est pas
     * levée à la main. Un compte suspendu doit pouvoir lire ce qui a été
     * compté contre lui : chaque ligne porte son `arbitrage`, et ce sont les
     * `retabli` qui ont mené là. Le refuser rendrait la sanction opaque à
     * celui qui la subit, ce qui est précisément ce que l'article 15 interdit.
     *
     * La ligne ne rend que `messageId` — un identifiant, pas le texte d'un
     * tiers. Le motif et la précision, eux, sont bien de la personne.
     */
    {
      cle: 'signalementsAbus',
      lire: () => db.select().from(signalementsAbus).where(eq(signalementsAbus.auteurId, userId)),
    },

    /**
     * ── La seconde chaîne de propriété — `owner_id` et `membre_id` ──
     *
     * Une organisation et une commande groupée ne portent pas de `user_id` :
     * elles passent par `organisations.ownerId` et
     * `commandesGroupees.membreId`. Filtrées sur la personne, elles ne rendent
     * que ce qu'elle a créé ou commandé POUR ELLE-MÊME — les commandes des
     * invités sans compte (`nomInvite`, `emailInvite`) portent un `membreId`
     * nul et restent donc dehors, comme les invités de `membres`.
     */
    {
      cle: 'organisations',
      lire: () => db.select().from(organisations).where(eq(organisations.ownerId, userId)),
    },
    {
      cle: 'commandesGroupees',
      lire: () => db.select().from(commandesGroupees).where(eq(commandesGroupees.membreId, userId)),
    },
  ];
}

/** Remplace les clés d'accès par une mention, sans toucher au reste de la ligne. */
export function censurer(
  cle: string,
  lignes: Record<string, unknown>[],
): Record<string, unknown>[] {
  const champs = CHAMPS_CENSURES[cle];
  if (!champs) return lignes;
  return lignes.map((ligne) => {
    const copie = { ...ligne };
    for (const champ of champs) {
      if (champ in copie && copie[champ] != null) copie[champ] = MENTION_CENSURE;
    }
    return copie;
  });
}

export interface ExportPersonnel {
  exportedAt: string;
  user: { id: string; email: string | undefined };
  /** Tables volontairement absentes, avec leur motif — l'omission reste lisible. */
  exclusions: Record<string, string>;
  data: Record<string, unknown>;
}

/**
 * Construit la charge utile complète.
 *
 * ⚠️ Tout est chargé en mémoire puis sérialisé. Sur un compte très ancien avec
 * plusieurs balances connectées, `mesuresBalance` domine le volume. Le jour où
 * cela coince, la sortie à prévoir est un .zip par table, en flux — pas un
 * découpage silencieux qui rendrait l'export incomplet sans le dire.
 */
export async function construireExportPersonnel(
  userId: string,
  email: string | undefined,
  maintenant: Date,
): Promise<ExportPersonnel> {
  const sources = sourcesExport(userId);

  const [profilRows, ...resultats] = await Promise.all([
    db.select().from(profils).where(eq(profils.id, userId)),
    ...sources.map((s) => s.lire()),
  ]);

  const data: Record<string, unknown> = { profil: profilRows[0] ?? null };
  sources.forEach((source, i) => {
    data[source.cle] = censurer(source.cle, resultats[i] ?? []);
  });

  return {
    exportedAt: maintenant.toISOString(),
    user: { id: userId, email },
    exclusions: EXCLUSIONS_MOTIVEES,
    data,
  };
}
