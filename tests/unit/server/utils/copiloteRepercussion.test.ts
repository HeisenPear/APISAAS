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

import { readFileSync, readdirSync } from 'node:fs';
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
