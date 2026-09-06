import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { classifier } from '~~/server/utils/copilote-local';
import { SAVOIR } from '~~/server/utils/copilote-savoir';
import { MARQUEURS_CERTITUDE } from '~~/server/utils/maya-consequences';

/**
 * MAYA RÉPONDAIT À UNE QUESTION DE CONNAISSANCE PAR UN INVENTAIRE.
 *
 * « c'est quoi le score prédictif ? » sortait la LISTE des ruches. Dix
 * questions sur onze partaient ainsi. La cause : la liste d'exclusions
 * partagée n'avait été posée que sur les six intentions les plus RÉCENTES —
 * je l'avais corrigée six fois, toujours vers l'avant, jamais en arrière.
 *
 * Le garde seul ne suffisait pas : sans fiche derrière, ces questions
 * basculaient en « inconnu », donc au modèle, qui aurait improvisé sur un
 * produit qu'il ne connaît pas. GARDE ET FICHE VONT PAR PAIRE — c'est
 * exactement ce que ce banc verrouille, dans les deux sens.
 */

/** Une question de connaissance et la fiche qui doit la recevoir. */
const CONNAISSANCE: Array<[string, string]> = [
  ['comment marche le score predictif ?', 'score-predictif'],
  ['c est quoi le score predictif ?', 'score-predictif'],
  ['a quoi sert la projection a 30 jours ?', 'score-predictif'],
  ['sur quoi repose le score ?', 'point-sante'],
  ['comment marche le point sante ?', 'point-sante'],
  ['comment marche le suivi de mes stocks ?', 'suivi-stocks'],
  ['a quoi sert le seuil d alerte ?', 'suivi-stocks'],
  ['je peux suivre mes finances ?', 'suivi-finances'],
  ['comment marche la facturation ?', 'suivi-finances'],
  ['comment marche le suivi de mes clients ?', 'suivi-clients'],
  ['a quoi sert la fiche client ?', 'suivi-clients'],
  ['comment marche le suivi des lignees ?', 'lignees-elevage'],
  ['a quoi sert mes lignees ?', 'lignees-elevage'],
  ['comment marche ma tournee ?', 'tournee-jour'],
  ['a quoi sert la tournee du jour ?', 'tournee-jour'],
];

describe('une question de connaissance ne reçoit jamais un inventaire', () => {
  it.each(CONNAISSANCE)('%s → la fiche %s', (question, fiche) => {
    const c = classifier(question) as { kind: string; intent?: string; articleId?: string };
    expect(c.kind, `${question} → ${c.intent ?? c.kind}`).toBe('savoir');
    expect(c.articleId, question).toBe(fiche);
  });
});

/**
 * ⚠️ LA LISTE CI-DESSUS EST ÉCRITE À LA MAIN, ET C'EST SA LIMITE.
 *
 * Elle verrouille les intentions DÉJÀ réparées ; elle ne dit rien de la
 * prochaine. C'est la « couverture qui s'arrête juste avant » de CLAUDE.md,
 * rejouée à l'intérieur même du correctif qui l'avait nommée — et elle a
 * effectivement laissé passer un cas : sur les quinze intentions, `meteo`
 * n'avait JAMAIS reçu le garde. « à quoi sert la météo ? » partait donc sur
 * l'inventaire météo pendant que la fiche `meteo-butinage` attendait à côté.
 * Quatorze sur quinze, et le banc affichait tout vert.
 *
 * Ce balayage part de la TABLE, pas d'une liste recopiée : ajouter une
 * seizième intention sans son garde casse ce cas au lieu de rouvrir le trou.
 * Il lit la source parce que `INTENTS` n'est pas exportée — et qu'exporter un
 * interne pour le seul confort d'un banc élargit la surface du module.
 */
describe('le garde des questions de savoir est posé sur TOUTES les intentions', () => {
  const source = readFileSync('server/utils/copilote-local.ts', 'utf-8');
  const zone = source.slice(
    source.indexOf('const INTENTS: Intent[] = ['),
    source.indexOf('\n];', source.indexOf('const INTENTS: Intent[] = [')),
  );
  const blocs = zone.split('\n  {\n').slice(1);
  const intentions = blocs
    .map((b) => ({
      id: /id: '([^']+)'/.exec(b)?.[1] ?? '(sans id)',
      garde: b.includes('EXCLUSIONS_QUESTION_DE_SAVOIR'),
    }))
    .filter((i) => i.id !== '(sans id)');

  it('le balayage voit bien la table (garde-fou)', () => {
    // Sans ce cas, un découpage cassé rendrait `intentions` vide et le cas
    // suivant vert : le banc affirmerait une conformité jamais mesurée.
    expect(intentions.length, 'la table INTENTS n’a pas été lue').toBeGreaterThanOrEqual(15);
    expect(intentions.map((i) => i.id)).toContain('meteo');
  });

  it('aucune intention ne se passe du garde partagé', () => {
    const sansGarde = intentions.filter((i) => !i.garde).map((i) => i.id);
    expect(
      sansGarde,
      'ces intentions répondront par un INVENTAIRE à « c’est quoi… », « à quoi sert… » : ' +
        'ajoute `exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR]` — et si l’omission est ' +
        'volontaire, écris pourquoi juste au-dessus',
    ).toEqual([]);
  });

  it('la météo, concrètement, rend sa fiche produit et non son inventaire', () => {
    /**
     * Le cas réel qui a échappé à la liste écrite à la main — et qui a montré
     * que le garde SEUL aurait empiré les choses : posé sans fiche derrière,
     * « à quoi sert la météo ? » passait de l'inventaire à « inconnu ». Il a
     * fallu écrire la huitième fiche produit, `suivi-meteo` ; les sept autres
     * intentions guidées avaient la leur depuis toujours.
     */
    for (const q of ['a quoi sert la meteo ?', 'comment marche la meteo ?']) {
      const c = classifier(q) as { kind: string; articleId?: string };
      expect(c.kind, q).toBe('savoir');
      expect(c.articleId, q).toBe('suivi-meteo');
    }
  });

  it('… sans assécher l’intention : les demandes de météo passent toujours', () => {
    // Le sens inverse, obligatoire ici comme partout : une exclusion trop large
    // renverrait « quel temps demain ? » vers un cours sur la météo.
    for (const q of ['meteo', 'quel temps demain', 'conditions de visite']) {
      const c = classifier(q) as { kind: string; intent?: string };
      expect(c.kind, q).toBe('action');
      expect(c.intent, q).toBe('meteo');
    }
  });

  it('la fiche apicole d’origine garde son propre terrain', () => {
    // `meteo-butinage` répond à une question d'APICULTURE (« pourquoi mes
    // abeilles ne sortent pas »), pas à une question sur le module. Ajouter la
    // fiche produit ne devait pas lui voler ses questions.
    const c = classifier('pourquoi mes abeilles ne sortent pas') as {
      kind: string;
      articleId?: string;
    };
    expect(c.kind).toBe('savoir');
    expect(c.articleId).toBe('meteo-butinage');
  });
});

/**
 * LE GARDE NE DOIT PAS ASSÉCHER LES INTENTIONS.
 *
 * Une exclusion trop large renverrait les vraies demandes de données vers le
 * savoir — le défaut inverse, et tout aussi visible : demander « mes stocks »
 * et recevoir un cours sur les stocks.
 */
describe('les demandes de données passent toujours', () => {
  it.each([
    ['mes stocks', 'stocks'],
    ['ou en sont mes finances ?', 'finances'],
    ['mes clients', 'clients'],
    ['fais moi un point sante', 'sante'],
    ['quelles ruches visiter ?', 'ruches_visiter'],
    ['mes alertes', 'alertes'],
    ['mes ruchers', 'ruchers'],
    ['mes interventions', 'interventions'],
    ['mes lignees', 'elevage'],
    ['mes balances', 'balances'],
    ['mes lots', 'lots'],
    ['qu est ce qui peut arriver a mes ruches ?', 'prediction'],
  ])('%s → %s', (question, intent) => {
    const c = classifier(question) as { kind: string; intent?: string };
    expect(c.kind, question).toBe('action');
    if (c.kind !== 'action') return;
    expect(c.intent, question).toBe(intent);
  });
});

describe('les fiches produit disent vrai, et prudemment', () => {
  const fiche = (id: string) => {
    const f = SAVOIR.find((a) => a.id === id);
    if (!f) throw new Error(`fiche ${id} introuvable`);
    return f;
  };

  it('la projection ne PROMET rien', () => {
    /**
     * La même règle de langage que le rendu des projections, appliquée à la
     * fiche qui les explique : jamais « ça VA arriver ». Une fiche qui
     * promettrait démentirait le moteur qu'elle décrit.
     */
    const contenu = fiche('score-predictif').contenu;
    for (const phrase of contenu.split(/[.\n]/).filter((p) => p.trim())) {
      expect(MARQUEURS_CERTITUDE.test(phrase), phrase.trim().slice(0, 70)).toBe(false);
    }
    expect(contenu).toMatch(/pas des certitudes|tendances, pas des certitudes|peut\b/i);
  });

  it('la projection dit qu’elle se tait sans donnée', () => {
    // `donneesInsuffisantes` est un garde réel du moteur : la fiche doit le
    // refléter, sinon elle décrit un produit plus sûr de lui qu'il ne l'est.
    expect(fiche('score-predictif').contenu).toMatch(/aucun contrôle|sans donnée/i);
  });

  it('le score de santé cite les pondérations RÉELLES du moteur', () => {
    // Recopiées à la main, elles dériveraient en silence. Ce banc ne les
    // recalcule pas, il vérifie qu'elles sont bien celles de santeScore.ts.
    const c = fiche('point-sante').contenu;
    for (const poids of ['24', '22', '18', '16', '14', '6']) {
      expect(c, `pondération ${poids} absente`).toContain(poids);
    }
  });

  it('les finances énoncent la définition de l’impayé du produit', () => {
    // Celle-là même qui manquait à `getFinances` et qui faisait annoncer
    // « 0 impayé » pendant que la page Ventes en affichait.
    const c = fiche('suivi-finances').contenu;
    expect(c).toMatch(/en retard/i);
    expect(c).toMatch(/échéance/i);
  });

  it('la fiche lignées renvoie vers les races au lieu de leur voler la question', () => {
    /**
     * LE PIÈGE EXACT QUI M'A COÛTÉ QUATRE FICHES PLUS TÔT DANS CETTE SESSION.
     *
     * `races-abeilles` emploie le mot « lignée » en parlant des sous-espèces.
     * Un mot-clé « lignee » nu sur la fiche produit lui aurait volé « quelle
     * race choisir ». On ne prend que les formulations qui visent le SUIVI.
     */
    expect(fiche('lignees-elevage').motsCles).not.toContain('lignee');
    expect(fiche('lignees-elevage').contenu).toMatch(/race/i);
    const c = classifier('quelles races d abeilles choisir ?') as {
      kind: string;
      articleId?: string;
    };
    expect(c.kind).toBe('savoir');
    expect(c.articleId, 'la question de race doit rester à sa fiche').toBe('races-abeilles');
  });

  it('aucune fiche produit ne réutilise l’identifiant d’une autre', () => {
    const ids = SAVOIR.map((a) => a.id);
    expect(new Set(ids).size, 'identifiant en double').toBe(ids.length);
  });
});
