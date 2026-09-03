// ═══════════════════════════════════════════════════════════════════════════
// LA RÉPERCUSSION — « si Maya enregistre quelque chose, ça doit se voir partout »
//
// ─── LE DÉFAUT QUI A PRODUIT CE FICHIER ────────────────────────────────────
// Le dépôt a un bus d'invalidation complet (`useDataBus`) : vingt et un
// émetteurs, une trentaine d'abonnés. Maya était le SEUL producteur d'écritures
// à ne rien y émettre — pas par oubli de style, mais par ARCHITECTURE : les
// autres émetteurs sont des composables de domaine qui émettent après leur
// `$fetch`, et Maya n'écrit pas par eux. Elle parle au serveur, qui écrit.
//
// Vécu : l'apiculteur est sur /ruchers, dicte « ajoute une ruche », et la carte
// du rucher garde son ancien compte. La jauge de plan, elle, n'est JAMAIS
// démontée — elle ne se réparait donc même pas en changeant de page, et le
// refus de plafond pouvait contredire ce qui était à l'écran.
//
// ─── CE QUE CE BANC GARDE ──────────────────────────────────────────────────
// Trois règles, et aucune n'est une opinion :
//   1. une table écrite par un gestionnaire SAIT dire ce qu'elle fait bouger
//      (sinon une table nouvelle naît muette, en silence) ;
//   2. toute action qui écrit a un PLANCHER d'invalidation non vide ;
//   3. l'ANNULATION se répercute aussi — c'est le côté qu'on oublie, et le pire
//      des deux : un écran en retard sur une écriture est gênant, un écran qui
//      garde une ligne SUPPRIMÉE après « c'est annulé » est pire que l'inaction.
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EVENEMENTS_DONNEES,
  EVENEMENTS_PAR_TABLE,
  estEvenementDonnees,
  evenementInverse,
  evenementsInverses,
  evenementsDeLaTable,
  type DataEvent,
} from '../../../../app/config/evenements-donnees';
import { MAYA_ACTIONS, ACTIONS_IDS } from '../../../../app/config/maya-actions';
import {
  evenementsDuHandler,
  evenementsDeLEcriture,
  evenementsDeLAnnulation,
} from '../../../../server/utils/copilote-repercussion';

const DOSSIER_HANDLERS = 'server/services/interventions';

// ═══════════════════════════════════════════════════════════════════════════
// 1. Le balayage voit-il quelque chose ?
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ LE CAS GARDE-FOU, ET IL EST EN PREMIER PARCE QU'IL A DÉJÀ SAUVÉ CE DÉPÔT.
 * Un chemin erroné rend la liste vide, donc « tout conforme ». Le balayage
 * ci-dessous perdrait tout sens si les gestionnaires n'étaient plus trouvés.
 */
describe('garde-fou : le balayage voit bien les gestionnaires', () => {
  it('trouve les fichiers de gestionnaires ET des tables dedans', () => {
    const fichiers = readdirSync(DOSSIER_HANDLERS).filter(
      (f) => f.endsWith('.ts') && f !== 'index.ts',
    );
    expect(fichiers.length, 'aucun gestionnaire trouvé — le chemin a bougé').toBeGreaterThan(10);
    expect(tablesEcritesParLesHandlers().length, 'aucune table détectée').toBeGreaterThan(10);
  });
});

/** Toutes les tables que les gestionnaires déclarent écrire (`created`/`updated`). */
function tablesEcritesParLesHandlers(): string[] {
  const noms = new Set<string>();
  for (const fichier of readdirSync(DOSSIER_HANDLERS).filter((f) => f.endsWith('.ts'))) {
    const source = readFileSync(`${DOSSIER_HANDLERS}/${fichier}`, 'utf-8');
    for (const m of source.matchAll(/table:\s*'([a-z_]+)'/g)) noms.add(m[1]!);
  }
  return [...noms].sort();
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Aucune table ne naît muette
// ═══════════════════════════════════════════════════════════════════════════

describe('chaque table écrite sait dire ce qu’elle fait bouger', () => {
  it('toute table nommée par un gestionnaire a une entrée', () => {
    // ⚠️ ON ITÈRE SUR LA SOURCE DE VÉRITÉ (les gestionnaires eux-mêmes), pas
    // sur une liste recopiée ici. Un quatorzième geste ajouté demain, qui
    // écrirait dans une table neuve, tomberait tout seul.
    const orphelines = tablesEcritesParLesHandlers().filter((t) => evenementsDeLaTable(t) === null);

    expect(
      orphelines,
      "Ces tables sont écrites par un gestionnaire d'intervention mais personne ne sait ce " +
        "qu'elles font bouger à l'écran. Conséquence : Maya écrit dedans, l'écran reste figé " +
        'sur une donnée périmée, et rien ne le dit. Ajoute-les à EVENEMENTS_PAR_TABLE.',
    ).toEqual([]);
  });

  it('un gestionnaire DÉCLARE toutes les tables qu’il écrit', () => {
    /**
     * ⚠️ CE CAS EST NÉ D'UN DÉFAUT QUE LE BALAYAGE D'À CÔTÉ NE POUVAIT PAS VOIR.
     *
     * Le cas précédent vérifie que toute table DÉCLARÉE a un événement. Il ne
     * dit rien des tables ÉCRITES et tues — et `materiel` comme `reine`
     * modifiaient `ruches` sans le mentionner nulle part. Dicter « j'ai posé une
     * hausse sur la ruche 3 » changeait bien `nombre_hausses` en base, et la
     * fiche de la ruche gardait son ancien compte, sans un mot. La perte d'une
     * reine faisait pire : la base disait « absente », la fiche « présente ».
     *
     * C'est la « couverture qui s'arrête juste avant » de CLAUDE.md, appliquée
     * à un balayage qui se croyait exhaustif : il itérait sur les déclarations,
     * jamais sur les écritures.
     */
    const muets: string[] = [];
    for (const fichier of readdirSync(DOSSIER_HANDLERS).filter(
      (f) => f.endsWith('.ts') && f !== 'index.ts',
    )) {
      const source = readFileSync(`${DOSSIER_HANDLERS}/${fichier}`, 'utf-8');
      const declarees = new Set([...source.matchAll(/table:\s*'([a-z_]+)'/g)].map((m) => m[1]!));
      // Les tables Drizzle sont nommées en camelCase dans le code ; on compare
      // sur une forme normalisée pour ne pas dépendre de la convention.
      const aplati = (nom: string) => nom.replace(/([A-Z])/g, '_$1').toLowerCase();
      for (const m of source.matchAll(/\.(?:update|insert)\(([a-zA-Z]+)\)/g)) {
        const table = aplati(m[1]!);
        // `interventions` est le hub : toute intervention l'écrit par
        // construction, et `insererInterventionTx` en sème déjà l'événement.
        if (table === 'interventions') continue;
        if (!declarees.has(table)) muets.push(`${fichier} → ${table}`);
      }
    }

    expect(
      muets,
      'Ces gestionnaires ÉCRIVENT dans une table sans la déclarer. Le retour du ' +
        'gestionnaire est la seule chose que la répercussion sait lire : une écriture ' +
        'tue laisse l’écran affirmer le contraire de la base, sans un mot.',
    ).toEqual([]);
  });

  it('poser une HAUSSE déclare bien la ruche modifiée (exécution réelle)', async () => {
    /**
     * ⚠️ LE BALAYAGE DE SOURCE NE SUFFIT PAS ICI, ET UNE MUTATION L'A PROUVÉ.
     * Il vérifie qu'une table écrite est déclarée QUELQUE PART dans le fichier ;
     * `materiel.ts` déclare `ruches` dans sa branche « cadres », si bien que
     * retirer la déclaration de la branche « hausses » lui échappait. Or « j'ai
     * posé une hausse » est la phrase la plus fréquente du printemps.
     *
     * On fait donc TOURNER le gestionnaire, sur un double de transaction qui
     * n'interprète pas le SQL — on ne mesure pas la base, on mesure ce que le
     * gestionnaire DÉCLARE avoir écrit.
     */
    const { handleMateriel } = await import('../../../../server/services/interventions/materiel');
    const tx = {
      insert: () => ({
        values: () => ({ returning: async () => [{ id: 'mvt-1' }] }),
      }),
      update: () => ({ set: () => ({ where: async () => {} }) }),
    };

    const res = await handleMateriel(
      tx as never,
      {
        userId: 'u1',
        rucheId: 'r1',
        inspectionId: 'i1',
        donnees: { elements: [{ element: 'hausses', quantite: 1 }] },
      } as never,
    );

    const { evenements, inconnues } = evenementsDuHandler(res);
    expect(inconnues).toEqual([]);
    expect(
      evenements,
      'la hausse est posée en base et la fiche de la ruche garde son ancien compte',
    ).toContain('ruche:updated');
  });

  it('une table INCONNUE rend `null`, jamais un tableau vide', () => {
    // « Je ne sais pas quoi invalider » n'est pas « il n'y a rien à invalider ».
    // Un `[]` ici se confondrait avec une écriture sans effet d'écran, et
    // l'appelant ne pourrait plus prévenir. C'est la règle la plus chèrement
    // acquise de ce dépôt : inconnu ne vaut JAMAIS laisse-passer.
    expect(evenementsDeLaTable('table_qui_nexiste_pas')).toBeNull();
    expect(evenementsDeLaTable('')).toBeNull();
  });

  it('tous les événements déclarés par table existent vraiment', () => {
    const fautifs: string[] = [];
    for (const [table, evts] of Object.entries(EVENEMENTS_PAR_TABLE)) {
      for (const e of evts) if (!estEvenementDonnees(e)) fautifs.push(`${table} → ${e}`);
    }
    expect(fautifs).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Ce que le gestionnaire a écrit est LU, pas deviné
// ═══════════════════════════════════════════════════════════════════════════

describe('evenementsDuHandler lit le retour du gestionnaire', () => {
  it('traduit `created` et `updated` en événements d’écran', () => {
    const { evenements, inconnues } = evenementsDuHandler({
      created: [{ table: 'divisions' }, { table: 'ruches' }],
      updated: [{ table: 'interventions' }],
    });
    // Une DIVISION crée une RUCHE : c'est tout l'intérêt de mesurer plutôt que
    // de déclarer « intervention → intervention ». Sans ça, la ruche née d'une
    // dictée reste invisible partout, jauge de plan comprise.
    expect(evenements).toContain('ruche:created');
    expect(evenements).toContain('intervention:created');
    expect(inconnues).toEqual([]);
  });

  it('lit AUSSI les `updated`, et pas seulement les `created`', () => {
    // ⚠️ CE CAS EST NÉ D'UNE MUTATION SURVIVANTE. Le cas précédent mêlait les
    // deux listes, mais `divisions` (dans `created`) rend déjà
    // `intervention:created` : supprimer la lecture des `updated` restait donc
    // invisible. Or c'est TOUT le geste du déplacement — il ne crée pas de
    // ruche, il en MODIFIE une.
    const { evenements } = evenementsDuHandler({
      updated: [{ table: 'ruches' }],
    });
    expect(
      evenements,
      'un déplacement ne crée rien : si les `updated` ne comptent pas, la ruche ' +
        'reste affichée dans son ancien rucher',
    ).toContain('ruche:updated');
  });

  it('un DÉPLACEMENT rafraîchit la carte, pas seulement la frise', () => {
    // La table `deplacements_ruches` est la seule à nommer trois écrans : le
    // journal d'interventions, la ruche, ET les ruchers (elle change
    // l'appartenance). Réduire son entrée passait inaperçu.
    const { evenements } = evenementsDuHandler({
      created: [{ table: 'deplacements_ruches' }],
    });
    expect(evenements).toContain('intervention:created');
    expect(evenements, 'la ruche a changé de rucher').toContain('ruche:updated');
    expect(evenements, 'les deux ruchers ont changé de compte').toContain('rucher:updated');
  });

  it('une alerte levée fait bouger la pastille', () => {
    const { evenements } = evenementsDuHandler({ alerts: [{ niveau: 'critique' }] });
    expect(evenements).toEqual(['alerte:created']);
  });

  it('SIGNALE une table inconnue au lieu de l’avaler', () => {
    const { evenements, inconnues } = evenementsDuHandler({
      created: [{ table: 'ruches' }, { table: 'table_inventee' }],
    });
    expect(inconnues).toEqual(['table_inventee']);
    // Ce qu'on sait traduire passe quand même : on ne punit pas l'apiculteur
    // d'une lacune de notre table.
    expect(evenements).toContain('ruche:created');
  });

  it('ne rend rien sur un gestionnaire qui n’a rien écrit', () => {
    expect(evenementsDuHandler({}).evenements).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Toute action qui écrit a un plancher
// ═══════════════════════════════════════════════════════════════════════════

describe('le catalogue déclare ce que chaque action fait bouger', () => {
  it('AUCUNE action qui écrit n’a un plancher vide', () => {
    // ⚠️ LA LISTE EST LE CATALOGUE, pas un extrait. C'est le point exact où ce
    // dépôt s'est déjà fait avoir : un balayage « exhaustif » qui nommait
    // quatre actions sur cinq laissait passer la seule dont la règle était
    // cassée. Une dixième action ajoutée demain entre ici toute seule.
    const muettes = ACTIONS_IDS.filter(
      (id) => MAYA_ACTIONS[id].ecrit && MAYA_ACTIONS[id].invalide.length === 0,
    );
    expect(
      muettes,
      "Ces actions écrivent en base et ne déclarent RIEN à rafraîchir. L'apiculteur dicte, " +
        "Maya répond « c'est noté », et l'écran ne bouge pas — il ne sait plus si c'est passé.",
    ).toEqual([]);
  });

  it('tous les planchers déclarés sont de vrais événements', () => {
    const fautifs: string[] = [];
    for (const id of ACTIONS_IDS)
      for (const e of MAYA_ACTIONS[id].invalide)
        if (!estEvenementDonnees(e)) fautifs.push(`${id} → ${e}`);
    // Un nom inventé est INDÉTECTABLE en production : `emit` sur une clé
    // inconnue est un no-op parfait — pas d'erreur, pas de rafraîchissement,
    // rien dans les journaux.
    expect(fautifs).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. La mesure prime sur la déclaration
// ═══════════════════════════════════════════════════════════════════════════

describe('evenementsDeLEcriture', () => {
  it('préfère ce qui a été MESURÉ au plancher déclaré', () => {
    // Le cas qui compte : une intervention de type `division`. Son plancher ne
    // parle que d'intervention ; sa mesure, elle, sait qu'une RUCHE est née.
    const mesure = evenementsDeLEcriture('intervention', {
      ok: true,
      evenements: ['intervention:created', 'ruche:created'],
    });
    expect(mesure).toContain('ruche:created');
  });

  it('retombe sur le plancher quand rien n’a été mesuré', () => {
    expect(evenementsDeLEcriture('client', { ok: true })).toEqual(MAYA_ACTIONS.client.invalide);
  });

  it('n’invalide RIEN quand l’écriture a échoué', () => {
    // Un refus de plan, une panne : la base n'a pas bougé. Faire recharger des
    // listes ferait croire qu'il s'est passé quelque chose.
    expect(evenementsDeLEcriture('ruche', { ok: false })).toEqual([]);
    expect(
      evenementsDeLEcriture('ruche', { ok: false, evenements: ['ruche:created'] }),
      "même une mesure ne doit pas survivre à un échec — c'est un rollback",
    ).toEqual([]);
  });

  it('rend quelque chose pour CHAQUE action qui écrit', () => {
    const muettes = ACTIONS_IDS.filter(
      (id) => MAYA_ACTIONS[id].ecrit && evenementsDeLEcriture(id, { ok: true }).length === 0,
    );
    expect(muettes).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. L'annulation se répercute aussi
// ═══════════════════════════════════════════════════════════════════════════

describe('evenementInverse — dérivé, jamais inventé', () => {
  it('rend le contraire quand il existe', () => {
    expect(evenementInverse('ruche:created')).toBe('ruche:deleted');
    expect(evenementInverse('client:created')).toBe('client:deleted');
  });

  it('GARDE l’événement quand le contraire n’existe pas', () => {
    // `achat:deleted` n'existe pas dans ce dépôt. Le fabriquer n'aurait
    // réveillé PERSONNE (aucun abonné ne l'écoute), là où `achat:created`
    // réveille bien /finances. Inventer une chaîne, c'est du silence déguisé
    // en action.
    expect(evenementInverse('achat:created')).toBe('achat:created');
  });

  it('laisse intacts les verbes déjà symétriques', () => {
    expect(evenementInverse('stock:mouvement')).toBe('stock:mouvement');
    expect(evenementInverse('ruche:updated')).toBe('ruche:updated');
  });

  it('ne rend JAMAIS un événement hors de l’union — sur les 57', () => {
    // Balayage complet de l'union réelle, pas d'un échantillon.
    const hors = EVENEMENTS_DONNEES.filter((e) => !estEvenementDonnees(evenementInverse(e)));
    expect(hors).toEqual([]);
    expect(EVENEMENTS_DONNEES.length, 'union suspecte — a-t-elle été vidée ?').toBeGreaterThan(40);
  });

  it('déduplique sans perdre l’ordre', () => {
    expect(evenementsInverses(['ruche:created', 'ruche:deleted'])).toEqual(['ruche:deleted']);
  });
});

describe('evenementsDeLAnnulation', () => {
  it('rend l’INVERSE du plancher, pour chaque action qui écrit', () => {
    const muettes: string[] = [];
    for (const id of ACTIONS_IDS) {
      if (!MAYA_ACTIONS[id].ecrit) continue;
      const evts = evenementsDeLAnnulation(id, { ok: true });
      if (!evts.length) muettes.push(id);
    }
    expect(
      muettes,
      "Ces annulations ne rafraîchissent rien. L'apiculteur clique « Annuler », Maya répond " +
        "« c'est annulé », et la ligne reste à l'écran : il ne sait plus laquelle des deux croire.",
    ).toEqual([]);
  });

  it('l’annulation d’une ruche parle bien de SUPPRESSION', () => {
    expect(evenementsDeLAnnulation('ruche', { ok: true })).toContain('ruche:deleted');
  });

  it('n’invalide rien si l’annulation a échoué', () => {
    expect(evenementsDeLAnnulation('ruche', { ok: false })).toEqual([]);
  });

  it('IGNORE une mesure d’écriture — annuler n’est pas écrire', () => {
    // Piège concret : `annulerAction` rend un `ResultatExecution`. Si un jour
    // il portait `evenements` (parce que le type le permet), les réutiliser
    // tels quels annoncerait une CRÉATION là où il y a eu une suppression.
    const evts = evenementsDeLAnnulation('ruche', {
      ok: true,
      evenements: ['ruche:created'] as DataEvent[],
    });
    expect(evts).not.toContain('ruche:created');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Le dernier mètre : le client sait-il quoi en faire ?
// ═══════════════════════════════════════════════════════════════════════════

describe('le client reçoit et retransmet', () => {
  // ⚠️ QUE `useCopilote` ÉMETTE VRAIMENT se mesure ailleurs, et par le
  // COMPORTEMENT : `tests/unit/app/composables/repercussionMaya.test.ts`
  // branche le vrai bus sur un vrai flux SSE. Chercher la chaîne
  // « estEvenementDonnees » ici aurait été « le mot au lieu de l'appel » — elle
  // survit dans l'`import` même quand l'appel disparaît.

  it('l’union n’est PAS réexportée par useDataBus', () => {
    // L'auto-import de Nuxt résout par NOM : deux chemins pour `DataEvent`
    // donnent un module silencieusement ignoré. Le détecteur de collisions a
    // déjà attrapé ce défaut quatre fois dans ce dépôt.
    const bus = readFileSync('app/composables/useDataBus.ts', 'utf-8');
    expect(bus).not.toMatch(/export\s+(type\s+)?\{[^}]*DataEvent/);
    expect(bus, 'le bus doit importer le type, pas le redéfinir').toMatch(
      /import type \{ DataEvent \}/,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. L'AUTRE MOITIÉ : un événement que personne n'écoute ne change rien
//
// ⚠️ CE BANC EXISTE PARCE QUE LA PREMIÈRE MOITIÉ DU TRAVAIL DONNAIT L'ILLUSION
// D'ÊTRE LA TOTALITÉ.
//
// Brancher Maya sur le bus, mesurer ses invalidations, les faire traverser le
// flux SSE, les filtrer côté client : tout cela peut être parfait et ne rien
// produire à l'écran, parce qu'`emit` sur un événement SANS ABONNÉ est un
// no-op — le même silence exactement qu'un nom mal orthographié.
//
// C'est ce qui se passait pour `alerte:created` : Maya enregistre un comptage
// varroa au-dessus du seuil, une alerte naît, l'événement part… et personne ne
// l'écoutait. Ni la pastille de la barre latérale (qui lit le tableau de bord),
// ni la page /alertes. L'apiculteur ne l'apprenait qu'au rechargement suivant.
// ═══════════════════════════════════════════════════════════════════════════

/** Les événements auxquels au moins un écran s'abonne, lus dans les sources. */
function evenementsEcoutes(): Set<string> {
  const fichiers = execSync('grep -rl useDataBus app --include=*.ts --include=*.vue', {
    encoding: 'utf-8',
  })
    .trim()
    .split('\n')
    .filter(Boolean);
  const ecoutes = new Set<string>();
  for (const f of fichiers) {
    const src = readFileSync(f, 'utf-8');
    // Les abonnements prennent plusieurs noms locaux (`on`, `onBusEvent`,
    // `onStockEvent`, `onDataEvent`) : on les couvre tous plutôt que d'imposer
    // une convention que personne n'a écrite.
    for (const appel of src.matchAll(
      /\bon(?:BusEvent|StockEvent|DataEvent)?\(\s*(\[[^\]]*\]|'[a-z_]+:[a-z_]+')/g,
    )) {
      for (const lit of appel[1]!.matchAll(/'([a-z_]+:[a-z_]+)'/g)) ecoutes.add(lit[1]!);
    }
  }
  return ecoutes;
}

/** Tout ce que Maya peut émettre : planchers, tables écrites, et leurs inverses. */
function evenementsEmisParMaya(): DataEvent[] {
  const emis = new Set<DataEvent>();
  for (const id of ACTIONS_IDS) {
    if (!MAYA_ACTIONS[id].ecrit) continue;
    for (const e of MAYA_ACTIONS[id].invalide) {
      emis.add(e);
      emis.add(evenementInverse(e));
    }
  }
  /**
   * ⚠️ L'ALERTE NE VIENT D'AUCUNE TABLE, et c'est ce qui l'avait fait oublier.
   * `evenementsDuHandler` l'ajoute depuis `res.alerts`, une branche qui ne
   * passe pas par `EVENEMENTS_PAR_TABLE`. Une première version de ce balayage
   * ne lisait que les tables : `alerte:created` en sortait, donc la règle
   * « aucun orphelin » ne le protégeait pas — précisément l'événement qui
   * ÉTAIT orphelin. On interroge donc la fonction elle-même.
   */
  for (const e of evenementsDuHandler({ alerts: [{}] }).evenements) {
    emis.add(e);
    emis.add(evenementInverse(e));
  }
  // Les gestionnaires d'intervention écrivent dans des tables que le catalogue
  // ne nomme pas : c'est le sens même de la mesure.
  for (const table of tablesEcritesParLesHandlers()) {
    for (const e of evenementsDeLaTable(table) ?? []) {
      emis.add(e);
      emis.add(evenementInverse(e));
    }
  }
  return [...emis].sort();
}

describe('tout ce que Maya émet est écouté par quelqu’un', () => {
  it('garde-fou : le balayage des abonnements en trouve', () => {
    // Un motif qui ne correspond plus rendrait la liste vide, donc « tout
    // orphelin » — ou, selon le sens du test, « rien à vérifier ». Les deux
    // sont des faux. C'est la forme « le balayage vide » de CLAUDE.md.
    const ecoutes = evenementsEcoutes();
    expect(ecoutes.size, 'aucun abonnement détecté — le motif a dû bouger').toBeGreaterThan(20);
    expect(ecoutes.has('ruche:created')).toBe(true);
    expect(evenementsEmisParMaya().length, 'Maya n’émettrait plus rien ?').toBeGreaterThan(10);
  });

  it('AUCUN événement de Maya ne tombe dans le vide', () => {
    const ecoutes = evenementsEcoutes();
    const orphelins = evenementsEmisParMaya().filter((e) => !ecoutes.has(e));

    expect(
      orphelins,
      'Maya émet ces événements et AUCUN écran ne les écoute. `emit` sur un ' +
        'événement sans abonné est un no-op — le même silence exactement qu’un ' +
        'nom mal orthographié : rien ne plante, rien ne se rafraîchit, rien ne ' +
        'le dit. Abonne l’écran concerné, ou retire l’événement.',
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. L'ÉCRAN QUE L'APICULTEUR REGARDE
//
// ⚠️ « AU MOINS UN ABONNÉ » NE SUFFIT PAS, ET C'EST LA LEÇON DE CE BLOC.
//
// Le balayage du §8 exige qu'un événement soit écouté par QUELQU'UN. Il passait
// au vert pendant que /finances/achats et /finances/ventes — les deux écrans où
// une dépense et une facture ARRIVENT — n'écoutaient rien du tout : d'autres
// pages écoutaient les mêmes événements, et ça suffisait à la règle.
//
// Vécu : l'apiculteur ouvre ses achats, dicte « j'ai acheté 30 kg de candi »,
// Maya répond « c'est noté », la liste sous ses yeux ne bouge pas. Il redicte.
// Sur les VENTES, la même chose troue une séquence de numéros de facture.
// ═══════════════════════════════════════════════════════════════════════════

describe('une page qui AFFICHE un domaine écrit par Maya l’écoute', () => {
  /**
   * Les domaines que MAYA peut faire bouger (`achat`, `ruche`, …).
   *
   * ⚠️ CEUX DE MAYA, PAS TOUT LE BUS — et c'est un périmètre assumé, pas une
   * commodité. Une première version balayait l'union entière et accusait trois
   * pages de ne pas écouter `balance` ou `emplacement` : deux domaines que Maya
   * n'écrit PAS (les balances viennent d'un import CSV ou d'une synchro BEEP).
   * Elles sont peut-être sourdes à leur propre domaine — c'est une dette
   * réelle, et elle est nommée ici — mais ce banc garde la répercussion des
   * écritures de MAYA. Une règle dont le message et le périmètre divergent
   * finit par être désactivée en bloc.
   */
  function domainesDeMaya(): Set<string> {
    return new Set(evenementsEmisParMaya().map((e) => e.split(':')[0]!));
  }

  /**
   * LES TROIS FAÇONS D'ALLER CHERCHER UNE DONNÉE, dans une table nommée.
   *
   * ⚠️ ELLES SONT ICI PARCE QUE DEUX D'ENTRE ELLES ONT MANQUÉ, ET QUE LEUR
   * ABSENCE NE SE VOYAIT PAS. Ne chercher que la chaîne simple laissait hors du
   * balayage toutes les pages de DÉTAIL — dont `/ruches/[id]`, l'écran le plus
   * regardé du produit, qui ne rafraîchissait que sa frise pendant que le score
   * de santé affiché juste au-dessus gardait sa valeur d'avant. Le banc
   * affichait « conforme » sur un sous-ensemble choisi par une expression
   * régulière.
   *
   * En table nommée, un cas peut exiger que CHACUNE voie encore quelque chose :
   * en retirer une fait tomber le banc au lieu de rétrécir le balayage en
   * silence — « la liste qui rétrécit » de CLAUDE.md.
   */
  const MOTIFS_DIRECTS = [
    {
      nom: 'chaîne simple',
      motif: /use(?:Cached)?Fetch[\s\S]{0,120}?\(\s*'(\/api\/[a-z0-9/_-]+)'/g,
    },
    { nom: 'gabarit', motif: /use(?:Cached)?Fetch[\s\S]{0,160}?`(\/api\/[a-z0-9/_${}.-]+)`/g },
    { nom: '$fetch', motif: /\$fetch[\s\S]{0,160}?[`'](\/api\/[a-z0-9/_${}.-]+)[`']/g },
  ] as const;

  /**
   * ⚠️ LA QUATRIÈME FORME : LA DONNÉE VIENT D'UN COMPOSABLE MÉTIER.
   *
   * Les trois motifs ci-dessus cherchent une URL DANS LA PAGE. Or une page peut
   * n'en contenir aucune : `/stocks/alertes` écrit `const { getAlertes } =
   * useStocks()` puis appelle `getAlertes()` — l'URL vit trois fichiers plus
   * loin. Le balayage ne trouvait donc aucune route, `vus` restait vide, et la
   * page était écartée par le `continue` AVANT même qu'on regarde si elle
   * écoute. Elle n'était pas déclarée conforme : elle était invisible.
   *
   * Et c'est l'écran des RUPTURES DE STOCK. Une sortie dictée à Maya fait
   * franchir son seuil à un article ; la liste qu'on ouvre justement pour
   * savoir quoi racheter continuait d'afficher l'état d'avant.
   *
   * Le balayage suivait DÉJÀ les composables — mais pour l'abonnement
   * seulement (`ecoutable`). Regarder d'un côté et pas de l'autre laissait
   * passer exactement les pages qui délèguent leur chargement.
   *
   * On ne prend pas toutes les routes du composable : seulement celles des
   * MEMBRES que la page déstructure réellement. Sinon une page qui appelle une
   * seule méthode hériterait de tous les domaines du composable et le banc
   * accuserait à tort — un banc qui crie faux finit désactivé en bloc.
   */
  function appelsParComposable(source: string): { membre: string; route: string }[] {
    const sortie: { membre: string; route: string }[] = [];
    for (const dest of source.matchAll(/const\s*\{([^}]*)\}\s*=\s*(use[A-Z][A-Za-z0-9]*)\(/g)) {
      const fichier = `app/composables/${dest[2]!}.ts`;
      if (!existsSync(fichier)) continue;
      const compos = readFileSync(fichier, 'utf-8');
      const membres = dest[1]!
        .split(',')
        .map((m) => m.split(':')[0]!.trim())
        .filter(Boolean);
      for (const membre of membres) {
        // Le membre, puis l'URL qui suit son corps. La fenêtre est courte
        // exprès : au-delà, on ramasserait la méthode suivante.
        const def = new RegExp(
          `\\b(?:async\\s+)?function\\s+${membre}\\b|\\b${membre}\\s*[:=]`,
          'g',
        );
        for (const d of compos.matchAll(def)) {
          /**
           * ⚠️ LA FENÊTRE S'ARRÊTE À LA FIN DE LA MÉTHODE, et l'oublier a
           * produit une accusation fausse dès le premier essai : les 400
           * caractères suivant `createVente` débordaient sur `createAchat`, et
           * le banc reprochait à la page des VENTES de ne pas écouter les
           * ACHATS. Un banc qui accuse à tort finit désactivé en bloc — c'est
           * plus grave que la lacune qu'il devait combler.
           *
           * Les composables de ce dépôt sont formatés : une méthode se ferme
           * sur une accolade en début de ligne à deux espaces.
           */
          const brut = compos.slice(d.index!, d.index! + 400);
          const fin = brut.indexOf('\n  }');
          const fenetre = fin === -1 ? brut : brut.slice(0, fin);
          for (const url of fenetre.matchAll(/[`'](\/api\/[a-z0-9/_${}.-]+)[`']/g)) {
            sortie.push({ membre, route: url[1]! });
          }
        }
      }
    }
    return sortie;
  }

  /** Les routes seules — DÉRIVÉES des paires, jamais recopiées à côté. */
  function routesParComposable(source: string): string[] {
    return appelsParComposable(source).map((a) => a.route);
  }

  const FORMES_DE_ROUTE = [
    ...MOTIFS_DIRECTS.map((f) => ({
      nom: f.nom,
      extraire: (src: string) => [...src.matchAll(f.motif)].map((m) => m[1]!),
    })),
    { nom: 'via composable métier', extraire: routesParComposable },
  ] as const;

  /**
   * Les segments qui nomment un RÉGLAGE, jamais une donnée du domaine.
   *
   * ⚠️ C'EST UNE DISPENSE PAR RÈGLE, ET SON MOTIF EST ÉCRIT. CLAUDE.md interdit
   * de dispenser un FICHIER : on dispense une FORME, et on dit laquelle.
   * `/api/alertes/notif-prefs` vit dans l'espace de nom `alertes` mais rend les
   * PRÉFÉRENCES de notification de l'apiculteur. Aucune alerte levée par Maya
   * ne les change : exiger de `/parametres` qu'elle écoute `alerte:*` serait
   * réclamer un abonnement qui ne sert rien — et un banc qui accuse à tort
   * finit désactivé en bloc, avec les vraies lacunes qu'il gardait.
   */
  const SEGMENTS_DE_REGLAGE = /^(?:notif-)?(?:prefs|preferences|config|settings|parametres)$/;

  /**
   * Le domaine qu'une route AFFICHE — le premier segment connu, pas n'importe lequel.
   *
   * ⚠️ « N'IMPORTE LEQUEL » A PRODUIT UNE ACCUSATION FAUSSE. `/api/stocks/alertes`
   * rend des STOCKS sous leur seuil ; son dernier segment, lui, s'appelle
   * « alertes » et se faisait passer pour le domaine `alerte`. Une route est
   * possédée par sa PREMIÈRE ressource : c'est elle qui décide de ce qu'elle
   * rend. Les espaces de nom sans domaine (`finances`, `ia`) sont simplement
   * traversés.
   */
  function domaineDeLaRoute(route: string, domaines: Set<string>): string | null {
    const segments = route.split('/').filter(Boolean);
    if (segments.some((seg) => SEGMENTS_DE_REGLAGE.test(seg))) return null;
    for (const segment of segments) {
      const singulier = segment.replace(/s$/, '');
      for (const d of domaines) {
        if (d === segment || d === singulier || `${d}s` === segment) return d;
      }
    }
    return null;
  }

  /** Les pages qui vont chercher une liste d'un de ces domaines. */
  function pagesConcernees(): { page: string; domaines: string[]; ecoute: boolean }[] {
    const domaines = domainesDeMaya();
    const pages = execSync('find app/pages -name "*.vue"', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    const sortie: { page: string; domaines: string[]; ecoute: boolean }[] = [];
    for (const page of pages) {
      const source = readFileSync(page, 'utf-8');
      /**
       * ⚠️ LES GÉNÉRIQUES SONT FACULTATIFS, et l'exiger a failli vider le
       * balayage : `useFetch<T>(…)` et `useFetch(…)` coexistent dans ce dépôt,
       * et la première version ne voyait que sept fichiers sur des dizaines.
       * Le garde-fou du banc l'a attrapé — c'est exactement à ça qu'il sert.
       */
      /**
       * ⚠️ LES GÉNÉRIQUES IMBRIQUÉS ONT VIDÉ CE BALAYAGE, EN SILENCE.
       * `useFetch<ApiListResponse<AchatRow>>(…)` : un `[^>]*` s'arrête au
       * premier `>` et la correspondance échoue. Les deux pages où une dépense
       * et une facture ARRIVENT — celles-là mêmes que ce banc doit garder —
       * n'étaient donc jamais examinées. On ne tente plus de compter les
       * chevrons : on saute ce qui sépare l'appel de son URL.
       */
      /**
       * ⚠️ QUATRE FORMES, PAS UNE — et chacune de celles qui manquaient
       * cachait un écran que ce banc était censé garder.
       *
       * · La chaîne simple : `useFetch('/api/ruchers')`.
       * · Le GABARIT : `useFetch(() => \`/api/ruches/${'${id}'}/sante\`)`. C'est la forme
       *   de toute page de DÉTAIL — donc de `/ruches/[id]`, qui ne rafraîchissait
       *   que sa frise pendant que le score de santé affiché juste au-dessus
       *   gardait sa valeur d'avant.
       * · `$fetch` direct, employé par les pages qui chargent à la main.
       *
       * · VIA UN COMPOSABLE MÉTIER : la page n'écrit aucune URL, elle appelle
       *   `getAlertes()`. C'est la forme de `/stocks/alertes` — l'écran des
       *   ruptures, invisible au balayage jusqu'ici.
       *
       * Ne chercher que la première laissait ces pages hors du balayage, sans
       * que rien ne le dise : la conformité était « vérifiée » sur un sous-
       * ensemble choisi par une expression régulière.
       */
      const routes = FORMES_DE_ROUTE.flatMap((forme) => forme.extraire(source));
      const vus = new Set<string>();
      for (const route of routes) {
        const d = domaineDeLaRoute(route, domaines);
        if (d) vus.add(d);
      }
      if (!vus.size) continue;
      /**
       * ⚠️ ON CHERCHE L'ABONNEMENT, PAS LE COMPOSABLE. Une première version
       * demandait que le fichier « mentionne `useDataBus` » : retirer la ligne
       * qui s'abonne vraiment la laissait verte, puisque l'import restait. Le
       * mot au lieu de l'appel, encore. On lit les ÉVÉNEMENTS souscrits, et on
       * exige que chaque domaine affiché en ait au moins un.
       */
      /**
       * ⚠️ LE NOM LOCAL DE L'ABONNEMENT SE DÉRIVE DU FICHIER, il ne se recopie
       * pas. Une première version énumérait `on|onBusEvent|onStockEvent|
       * onDataEvent|surEvenementDonnees` — une liste écrite à la main, donc
       * fausse au premier alias suivant : `surEvenementDonneesReines` lui a
       * échappé le jour même. On lit les DÉSTRUCTURATIONS de `useDataBus()` de
       * ce fichier, et on ne cherche que ces noms-là.
       */
      /**
       * ⚠️ UNE PAGE PEUT DÉLÉGUER SON ABONNEMENT À UN COMPOSABLE, et l'ignorer
       * accuse à tort. `/dashboard` ne s'abonne à rien lui-même : c'est
       * `useDashboard()` qui écoute pour lui, et c'est le bon découpage — la
       * donnée vient du composable, l'abonnement aussi. On suit donc les
       * `useXxx()` de la page jusqu'à `app/composables/useXxx.ts` et on ajoute
       * ce qu'ils écoutent.
       */
      const parCompos = [...source.matchAll(/\b(use[A-Z][A-Za-z0-9]*)\(/g)]
        .map((m) => `app/composables/${m[1]!}.ts`)
        .filter((f, i, tous) => tous.indexOf(f) === i && existsSync(f))
        .map((f) => readFileSync(f, 'utf-8'))
        .join('\n');

      /** La page ET les composables dont elle tire ses données. */
      const ecoutable = `${source}\n${parCompos}`;

      const alias = [...ecoutable.matchAll(/const\s*\{([^}]*)\}\s*=\s*useDataBus\(\)/g)].flatMap(
        (m) =>
          m[1]!
            .split(',')
            .map((champ) => champ.trim())
            .filter((champ) => champ === 'on' || champ.startsWith('on:'))
            .map((champ) => (champ === 'on' ? 'on' : champ.slice(3).trim())),
      );
      const souscrits = new Set(
        alias.flatMap((nom) =>
          [
            ...ecoutable.matchAll(
              new RegExp(`\\b${nom}\\(\\s*(\\[[^\\]]*\\]|'[a-z_]+:[a-z_]+')`, 'g'),
            ),
          ].flatMap((appel) => [...appel[1]!.matchAll(/'([a-z_]+):[a-z_]+'/g)].map((l) => l[1]!)),
        ),
      );
      const nonCouverts = [...vus].filter((d) => !souscrits.has(d));
      sortie.push({ page, domaines: nonCouverts, ecoute: nonCouverts.length === 0 });
    }
    return sortie;
  }

  it('la PROPRIÉTÉ d’une route se lit sur sa première ressource', () => {
    /**
     * ⚠️ CE CAS PIN LES BORDS DE DEUX RÈGLES QUI, MAL POSÉES, ACCUSENT À TORT.
     * Les deux ont produit une fausse accusation avant d'être écrites :
     * `/api/stocks/alertes` se faisait passer pour le domaine `alerte` (c'est
     * une route de STOCK), et `/api/alertes/notif-prefs` pour une vue des
     * alertes (ce sont des RÉGLAGES). Sans ce cas, élargir la dispense —
     * ajouter un segment de plus au motif — ne ferait rien tomber, et le
     * balayage se viderait en silence.
     */
    const d = new Set(['stock', 'alerte', 'vente', 'achat', 'ruche']);
    expect(domaineDeLaRoute('/api/stocks/alertes', d), 'route de stock').toBe('stock');
    expect(domaineDeLaRoute('/api/stocks', d)).toBe('stock');
    expect(domaineDeLaRoute('/api/ruches/${id}/sante', d), 'page de détail').toBe('ruche');
    expect(domaineDeLaRoute('/api/finances/ventes', d), 'espace de nom traversé').toBe('vente');
    expect(domaineDeLaRoute('/api/alertes', d), 'la liste des alertes, elle, compte').toBe(
      'alerte',
    );
    expect(
      domaineDeLaRoute('/api/alertes/notif-prefs', d),
      'des réglages ne sont pas une vue du domaine',
    ).toBeNull();
    expect(domaineDeLaRoute('/api/meteo/actuelle', d), 'domaine inconnu').toBeNull();
    /**
     * ⚠️ CE CAS-CI EST CELUI QUI TIENT LA DISPENSE ÉTROITE. Sans lui, élargir
     * le motif à « tout segment contenant un tiret » ne faisait RIEN tomber :
     * aucune route du banc n'en portait. `/api/ruches/${'${id}'}/evenements-reine`
     * existe pour de bon dans `server/api/` — et c'est une route de RUCHE.
     */
    expect(
      domaineDeLaRoute('/api/ruches/${id}/evenements-reine', d),
      'un tiret ne fait pas d’une route un réglage',
    ).toBe('ruche');
  });

  /**
   * La ressource qu'une route rend VRAIMENT — son dernier segment nommé.
   *
   * ⚠️ CE N'EST PAS LA MÊME QUESTION QUE `domaineDeLaRoute`, ET LES CONFONDRE
   * ACCUSE À TORT. Celle-là demande « à quel domaine cette donnée
   * appartient-elle ? » et répond par la PREMIÈRE ressource, celle qui possède
   * la route. Celle-ci demande « qu'est-ce que cet appel-là rend ? » et répond
   * par la DERNIÈRE : `/api/ruches/${'$'}{id}/cire` rend l'historique de CIRE, pas
   * la ruche. Or `cire` n'est pas un événement du bus — Maya ne peut pas
   * l'écrire — donc exiger que la page le recharge sur le bus serait réclamer
   * un travail que rien ne déclenchera jamais. La première version de la règle
   * ci-dessous le réclamait, et c'est ce qui l'a fait écrire.
   *
   * Les segments d'identifiant (`${'$'}{...}`, `:id`) sont sautés : `/api/ruches/${'$'}{id}`
   * rend bien une RUCHE.
   */
  function ressourceDeLaRoute(route: string): string | null {
    const segments = route
      .split('/')
      .filter(Boolean)
      .filter((seg) => seg !== 'api' && !seg.includes('$') && !seg.startsWith(':'));
    const dernier = segments.at(-1);
    return dernier ?? null;
  }

  /** Le bloc d'arguments d'un appel `nom(...)`, parenthèses appariées. */
  function blocApres(source: string, nom: string): string[] {
    const blocs: string[] = [];
    for (const d of source.matchAll(new RegExp(`\\b${nom}\\s*\\(`, 'g'))) {
      let profondeur = 0;
      const debut = d.index! + d[0].length - 1;
      for (let i = debut; i < source.length; i++) {
        if (source[i] === '(') profondeur++;
        else if (source[i] === ')') {
          profondeur--;
          if (profondeur === 0) {
            blocs.push(source.slice(debut, i));
            break;
          }
        }
      }
    }
    return blocs;
  }

  it('un chargeur appelé au MONTAGE doit aussi repartir sur le bus', () => {
    /**
     * ⚠️ LA RÈGLE QUE LE BALAYAGE PRÉCÉDENT NE POUVAIT PAS VOIR, ET C'EST LUI
     * QUI ME L'A APPRIS : retirer l'abonnement de `/stocks/alertes` le laissait
     * VERT. La raison est honnête et déjà écrite plus haut — on suit les
     * composables pour l'abonnement, et `useStocks()` s'abonne pour son propre
     * compte. La page en hérite donc « quelqu'un écoute »… alors que l'écoute
     * du composable ne rappellera JAMAIS le chargeur local de la page.
     *
     * D'où cette règle-ci, qui regarde ailleurs : une page qui charge à la main
     * dans son propre `ref` au montage tient une donnée que personne d'autre ne
     * peut rafraîchir. Si elle ne rappelle pas son chargeur sur le bus, son
     * écran reste figé — c'est exactement ce qui arrivait à l'écran des
     * ruptures de stock et à la pastille rouge « Alertes ».
     *
     * Le périmètre est étroit à dessein : seulement les pages déjà concernées
     * par un domaine de Maya, et seulement les fonctions qui vont réellement
     * chercher une donnée (`await` + un getter du composable ou `$fetch`).
     * Une règle plus large accuserait les initialisations de graphiques et les
     * écouteurs de défilement — et un banc qui crie faux finit désactivé.
     */
    const concernees = pagesConcernees();
    expect(concernees.length, 'aucune page concernée — le balayage a dû se vider').toBeGreaterThan(
      10,
    );

    const fautives: string[] = [];
    for (const { page } of concernees) {
      const source = readFileSync(page, 'utf-8');
      const alias = [...source.matchAll(/const\s*\{([^}]*)\}\s*=\s*useDataBus\(\)/g)].flatMap((m) =>
        m[1]!
          .split(',')
          .map((champ) => champ.trim())
          .filter((champ) => champ === 'on' || champ.startsWith('on:'))
          .map((champ) => (champ === 'on' ? 'on' : champ.slice(3).trim())),
      );
      const rappels = alias.flatMap((nom) => blocApres(source, nom)).join('\n');

      // Les getters que la page tire de ses composables métier.
      const getters = [...source.matchAll(/const\s*\{([^}]*)\}\s*=\s*use[A-Z][A-Za-z0-9]*\(/g)]
        .flatMap((m) => m[1]!.split(',').map((x) => x.split(':')[0]!.trim()))
        .filter(Boolean);

      for (const bloc of blocApres(source, 'onMounted')) {
        for (const appel of bloc.matchAll(/\b([a-z][A-Za-z0-9]*)\s*\(/g)) {
          const nom = appel[1]!;
          const def = new RegExp(`(?:async\\s+function\\s+${nom}\\b|const\\s+${nom}\\s*=)`);
          const m = def.exec(source);
          if (!m) continue;
          const corps = source.slice(m.index, m.index + 600);
          if (!corps.includes('await ')) continue;

          /**
           * Ce que ce chargeur-là va chercher : soit une URL écrite dans son
           * corps, soit un getter de composable dont on relit la route.
           */
          const sesRoutes = [
            ...[...corps.matchAll(/[`'](\/api\/[a-z0-9/_${}.:-]+)[`']/g)].map((m) => m[1]!),
            /**
             * ⚠️ LA ROUTE DU GETTER QU'IL APPELLE, PAS TOUTES CELLES DU
             * COMPOSABLE. Prendre l'ensemble ferait hériter ce chargeur des
             * domaines de méthodes qu'il n'appelle pas — l'accusation large
             * qu'on vient justement de retirer, réintroduite par la bande.
             */
            ...appelsParComposable(source)
              .filter((a) => getters.includes(a.membre) && corps.includes(`${a.membre}(`))
              .map((a) => a.route),
          ];
          if (!sesRoutes.length) continue;

          /**
           * ⚠️ ON EXIGE LE RECHARGEMENT SEULEMENT SI MAYA PEUT CHANGER CETTE
           * DONNÉE-LÀ. Sans ce filtre, la règle réclamait que la fiche de ruche
           * recharge son historique de CIRE sur le bus — or aucun événement
           * `cire:*` n'existe : personne ne le déclencherait jamais.
           */
          const domaines2 = domainesDeMaya();
          const touche = sesRoutes.some((r) => {
            const res = ressourceDeLaRoute(r);
            if (!res) return false;
            const singulier = res.replace(/s$/, '');
            return domaines2.has(res) || domaines2.has(singulier);
          });
          if (!touche) continue;
          if (!new RegExp(`\\b${nom}\\s*\\(`).test(rappels)) {
            fautives.push(`${page} → ${nom}()`);
          }
        }
      }
    }

    expect(
      [...new Set(fautives)].sort(),
      'un chargeur lancé au montage et jamais rappelé fige l’écran : Maya écrit, ' +
        'la page continue d’afficher l’état d’avant, et rien à l’écran ne le dit.',
    ).toEqual([]);
  });

  it('garde-fou : les QUATRE façons d’aller chercher une donnée sont vues', () => {
    /**
     * ⚠️ CE CAS GARDE LE BALAYAGE LUI-MÊME. Retirer une forme ne fait pas
     * tomber « zéro page fautive » — le dépôt étant propre, moins regarder
     * donne le même vert. C'est exactement le faux vert « la liste qui rétrécit
     * en silence » : le banc mesurerait de moins en moins en affichant la même
     * conformité.
     */
    const pages = execSync('find app/pages -name "*.vue"', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((f) => readFileSync(f, 'utf-8'));

    expect(FORMES_DE_ROUTE.length, 'une forme a disparu de la table').toBe(4);
    for (const forme of FORMES_DE_ROUTE) {
      const vues = pages.filter((src) => forme.extraire(src).length > 0).length;
      expect(vues, `la forme « ${forme.nom} » ne voit plus aucune page`).toBeGreaterThan(0);
    }
  });

  it('garde-fou : le balayage trouve bien des pages concernées', () => {
    // Un motif de `useFetch` qui bougerait rendrait la liste vide, donc la
    // conformité « vérifiée » — le balayage vide de CLAUDE.md.
    const pages = pagesConcernees();
    expect(pages.length, 'aucune page détectée — le motif a dû bouger').toBeGreaterThan(5);
    expect(domainesDeMaya().size, 'Maya n’écrirait plus rien ?').toBeGreaterThan(4);
  });

  it('AUCUNE page n’affiche un domaine écrit sans écouter le bus', () => {
    const sourdes = pagesConcernees()
      .filter((p) => !p.ecoute)
      .map((p) => `${p.page} [${p.domaines.join(', ')}]`)
      .sort();

    expect(
      sourdes,
      /**
       * ⚠️ CE QUE CETTE RÈGLE NE GARANTIT PAS, ET IL FAUT LE DIRE. Elle exige
       * que la page — ou un composable dont elle tire ses données — écoute le
       * domaine affiché. Elle ne garantit PAS que la page rafraîchisse SA
       * propre requête : `/ruches/[id]` appelle `useRuches()`, qui écoute
       * `ruche:*`, si bien que retirer l'abonnement propre de la page la laisse
       * conforme ici. Une mutation l'a montré, et aller plus loin demanderait
       * de tracer quel abonnement rafraîchit quel `useFetch` — une machinerie
       * plus fragile que ce qu'elle garderait. La dette est nommée, pas cachée.
       */
      'Ces pages affichent une donnée que Maya écrit et n’écoutent rien. ' +
        'L’apiculteur dicte, Maya répond « c’est noté », et l’écran sous ses yeux ' +
        'ne bouge pas : il redicte. Sur une vente, cela troue une séquence de ' +
        'numéros de facture.',
    ).toEqual([]);
  });
});
