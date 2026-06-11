import { describe, expect, it } from 'vitest';
import { classifier } from '../../../../server/utils/copilote-local';
import { SAVOIR } from '../../../../server/utils/copilote-savoir';

describe('classifier — intentions d’action', () => {
  it('route les questions de visite vers ruches_visiter', () => {
    expect(classifier('Quelles ruches dois-je visiter en priorité ?')).toEqual({
      kind: 'action',
      intent: 'ruches_visiter',
    });
  });

  it('route le point santé vers sante', () => {
    expect(classifier('Fais-moi un point santé de mes colonies')).toEqual({
      kind: 'action',
      intent: 'sante',
    });
  });

  it('route les stocks, finances, météo, alertes', () => {
    expect(classifier('Mes stocks sont-ils bas ?')).toMatchObject({ intent: 'stocks' });
    expect(classifier('Quel est mon chiffre d’affaires ?')).toMatchObject({ intent: 'finances' });
    expect(classifier('La météo permet-elle une visite demain ?')).toMatchObject({
      intent: 'meteo',
    });
    expect(classifier('Quelles sont mes alertes ?')).toMatchObject({ intent: 'alertes' });
  });

  it('insensible aux accents et à la casse', () => {
    expect(classifier('METEO du rucher ?')).toMatchObject({ kind: 'action', intent: 'meteo' });
    expect(classifier('mon chiffre d affaires')).toMatchObject({ intent: 'finances' });
  });
});

describe('classifier — base de savoir', () => {
  it('reconnaît une question sur le varroa', () => {
    const r = classifier('Comment traiter contre le varroa ?');
    expect(r.kind).toBe('savoir');
  });

  it('reconnaît une question sur l’essaimage', () => {
    expect(classifier("Qu'est-ce que l'essaimage ?")).toEqual({
      kind: 'savoir',
      articleId: 'essaimage',
    });
  });

  it('reconnaît une question réglementaire (déclaration de ruches)', () => {
    const r = classifier('Dois-je déclarer mes ruches chaque année ?');
    expect(r.kind).toBe('savoir');
    if (r.kind === 'savoir') expect(r.articleId).toBe('declaration-ruches');
  });

  it('chaque articleId retourné existe bien dans la base', () => {
    const ids = new Set(SAVOIR.map((a) => a.id));
    for (const q of [
      'pourquoi mon miel cristallise',
      'quand récolter le miel',
      'comment préparer hivernage',
      'le frelon asiatique attaque mes ruches',
    ]) {
      const r = classifier(q);
      if (r.kind === 'savoir') expect(ids.has(r.articleId)).toBe(true);
    }
  });
});

describe('classifier — salutations et repli', () => {
  it('détecte une salutation courte', () => {
    expect(classifier('Bonjour')).toEqual({ kind: 'salutation' });
    expect(classifier('Merci !')).toEqual({ kind: 'salutation' });
  });

  it('retombe sur inconnu pour du hors-sujet', () => {
    expect(classifier('Quelle est la capitale du Pérou ?')).toEqual({ kind: 'inconnu' });
    expect(classifier('azerty qwerty 123')).toEqual({ kind: 'inconnu' });
  });

  it('une phrase longue commençant par bonjour n’est pas qu’une salutation', () => {
    const r = classifier('Bonjour, quelles ruches dois-je visiter cette semaine ?');
    expect(r.kind).toBe('action');
  });
});

describe('base de savoir — intégrité', () => {
  it('aucun id en double', () => {
    const ids = SAVOIR.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque article a des mots-clés et un contenu non vide', () => {
    for (const a of SAVOIR) {
      expect(a.motsCles.length).toBeGreaterThan(0);
      expect(a.contenu.length).toBeGreaterThan(40);
    }
  });
});
