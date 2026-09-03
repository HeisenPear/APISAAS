import { describe, expect, it } from 'vitest';
import { texteAOraliser, vautLaPeineDEtreDit } from '../../../../app/utils/paroleMaya';

// ═══════════════════════════════════════════════════════════════════════════
// CE QUE MAYA DIT À VOIX HAUTE.
//
// ⚠️ LA SYNTHÈSE NE SE TESTE PAS HORS NAVIGATEUR ; CE QU'ELLE REÇOIT, SI. Et
// c'est là que tout se joue : un texte d'écran lu tel quel donne « astérisque
// astérisque douze kilogrammes astérisque astérisque », ou un silence là où il
// fallait une respiration.
//
// Le mode vocal existe pour l'apiculteur qui a les mains dans une ruche. Il
// n'ira pas s'essuyer les mains pour vérifier ce qu'il a mal entendu : une
// oralisation ratée n'est pas un défaut de confort, c'est une information
// perdue.
// ═══════════════════════════════════════════════════════════════════════════

describe('garde-fou : le texte ordinaire traverse intact', () => {
  it('ne touche pas à une phrase simple', () => {
    // Sans ce cas, une fonction qui rendrait '' passerait tous les tests de
    // suppression ci-dessous. C'est la forme « le balayage vide » de CLAUDE.md.
    expect(texteAOraliser('Tes douze ruches vont bien.')).toBe('Tes douze ruches vont bien.');
  });
});

describe('ce qui n’a de sens qu’à l’œil disparaît', () => {
  it('retire l’emphase sans manger le mot', () => {
    expect(texteAOraliser('La reine est **présente** sur le cadre 4.')).toBe(
      'La reine est présente sur le cadre 4.',
    );
  });

  it('garde le libellé d’un lien, jamais l’adresse', () => {
    // Lire une URL à voix haute est le pire des cas : long, incompréhensible,
    // et il masque la phrase.
    expect(texteAOraliser('Ouvre [la fiche de la ruche 7](/ruches/7) pour voir.')).toBe(
      'Ouvre la fiche de la ruche 7 pour voir.',
    );
  });

  it('transforme une liste à puces en énumération audible', () => {
    const dit = texteAOraliser('À faire :\n- poser une hausse\n- traiter le varroa');
    expect(dit).not.toContain('-');
    expect(dit).toContain('poser une hausse');
    expect(dit).toContain('traiter le varroa');
  });

  it('ne fait pas une phrase du numéro d’une liste numérotée', () => {
    // « 1. Nourrir » lu tel quel donne « un. » — point final, ton descendant,
    // puis « Nourrir » qui semble commencer autre chose.
    const dit = texteAOraliser('1. Nourrir\n2. Traiter');
    expect(dit).toContain('1, Nourrir');
    expect(dit).not.toMatch(/1\.\s/);
  });

  it('retire les émojis et les flèches', () => {
    const dit = texteAOraliser('Attention ⚠️ la ruche 3 → rucher des Tilleuls 🐝');
    // ⚠️ CHAQUE PICTOGRAMME À PART. Les réunir dans une classe de caractères en
    // ferait un caractère COMBINÉ (le « ⚠ » porte un sélecteur de variante
    // U+FE0F) : la classe ne voudrait plus dire ce qu'elle a l'air de dire.
    for (const signe of ['⚠', '\uFE0F', '→', '🐝']) expect(dit).not.toContain(signe);
    expect(dit).toContain('la ruche 3');
    expect(dit).toContain('rucher des Tilleuls');
  });

  it('retire les titres sans coller les phrases', () => {
    const dit = texteAOraliser('## Bilan\nTout va bien.');
    expect(dit).not.toContain('#');
    expect(dit).toContain('Bilan');
    expect(dit).toContain('Tout va bien');
  });
});

describe('les unités se prononcent', () => {
  it.each([
    ['24 kg de miel', '24 kilos de miel'],
    ['Il fait 12°C', 'Il fait 12 degrés'],
    ['une marge de 38 %', 'une marge de 38 pour cent'],
    ['450 € de charges', '450 euros de charges'],
    ['dans 21 j', 'dans 21 jours'],
  ])('« %s » se dit « %s »', (ecrit, dit) => {
    expect(texteAOraliser(ecrit)).toBe(dit);
  });
});

describe('les respirations', () => {
  it('une ligne vide devient une pause, pas un collage', () => {
    const dit = texteAOraliser('Tout va bien.\n\nPense à la hausse.');
    expect(dit).toBe('Tout va bien. Pense à la hausse.');
  });

  it('ne laisse pas de ponctuation doublée', () => {
    expect(texteAOraliser('Fini.\n\n- Suite')).not.toMatch(/[.,;:]{2}/);
  });
});

describe('ce qui ne vaut pas la peine d’être dit', () => {
  it('un texte vidé par le nettoyage ne déclenche pas une parole muette', () => {
    // ⚠️ CE CAS PROTÈGE LA BOUCLE VOCALE, PAS L'OREILLE. La boucle attend la
    // fin de la parole pour rendre le micro. Une énonciation vide ne rend
    // jamais `onend` sur certains navigateurs : le micro resterait éteint et
    // l'apiculteur devant un mode vocal muet, sans rien à l'écran pour
    // l'expliquer.
    expect(vautLaPeineDEtreDit('🐝')).toBe(false);
    expect(vautLaPeineDEtreDit('   ')).toBe(false);
    expect(vautLaPeineDEtreDit('***')).toBe(false);
  });

  it('une vraie réponse vaut la peine', () => {
    expect(vautLaPeineDEtreDit('Tes ruches vont bien.')).toBe(true);
  });

  it('un texte vide ou absent ne fait pas tomber la fonction', () => {
    expect(vautLaPeineDEtreDit('')).toBe(false);
    expect(texteAOraliser('')).toBe('');
  });
});
