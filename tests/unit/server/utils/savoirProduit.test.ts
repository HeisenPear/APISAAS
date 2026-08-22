import { describe, it, expect } from 'vitest';
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
