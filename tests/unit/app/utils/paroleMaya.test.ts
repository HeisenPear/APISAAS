import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  texteAOraliser,
  vautLaPeineDEtreDit,
  paroleDeLaReponse,
} from '../../../../app/utils/paroleMaya';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

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

describe('⚠️ une APPROXIMATION ne devient jamais un chiffre exact', () => {
  it.each([
    ['Traite au-dessus de ~3 varroas/jour.', /environ 3/],
    ['Compte **~5 varroas** pour 100 abeilles.', /environ 5/],
    ['Compter ≈2 jours après le traitement.', /environ 2/],
    ['Il faut < 5 % de perte.', /moins de 5/],
    ['Au moins ≥ 3 cadres de couvain.', /au moins 3/],
    ['Compte ± 2 jours.', /plus ou moins 2/],
  ])('« %s » garde sa nuance à l’oral', (ecrit, attendu) => {
    /**
     * ⚠️ LE « ~ » PARTAIT AVEC L'EMPHASE, et c'est une information perdue, pas
     * une coquille. Le nettoyage du balisage (`[*_\`~]`) emportait le tilde des
     * seuils sanitaires : « plus de ~5 varroas/jour » — un REPÈRE — se disait
     * « plus de 5 varroas par jour », c'est-à-dire un SEUIL. En apiculture,
     * cette nuance décide d'un traitement. Neuf fiches du savoir étaient
     * touchées, dont « Compter les varroas ». À l'écran l'apiculteur voyait le
     * tilde ; à l'oreille, jamais.
     */
    expect(texteAOraliser(ecrit)).toMatch(attendu);
  });

  it('un signe SANS nombre reste du balisage, pas une grandeur', () => {
    // « ~~barré~~ », une citation « > » : les prononcer inventerait un chiffre.
    expect(texteAOraliser('~~barré~~ et *emphase*')).toBe('barré et emphase');
    expect(texteAOraliser('Voir > la fiche')).not.toMatch(/plus de/);
  });

  it('ne bégaie pas quand le texte dit DÉJÀ la grandeur', () => {
    // Le savoir écrit parfois « plus de >20 kg » : le signe y répète les mots,
    // et « plus de plus de 20 » fait douter du chiffre à l'oreille.
    expect(texteAOraliser('Plus de >20 kg récoltés.')).toBe('Plus de 20 kilos récoltés.');
    expect(texteAOraliser('Moins de <5 % de perte.')).toBe('Moins de 5 pour cent de perte.');
  });

  it('élide, sinon la synthèse dit « de environ »', () => {
    expect(texteAOraliser('au-dessus de ~3 varroas')).toContain('d’environ 3');
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

// ═══════════════════════════════════════════════════════════════════════════
// CE QUE MAYA DIT À LA FIN D'UN TOUR — et ce qu'elle ne redit pas.
// ═══════════════════════════════════════════════════════════════════════════

const REPONSE = { role: 'assistant' as const, content: 'Tes douze ruches vont bien.' };

describe('garde-fou : une réponse neuve se dit', () => {
  it('rend le contenu de la bulle', () => {
    // Sans ce cas, une fonction qui rendrait toujours `null` passerait tous les
    // tests de silence ci-dessous — et Maya serait muette en mode vocal.
    expect(paroleDeLaReponse({ derniere: REPONSE, dejaDite: false })).toBe(
      'Tes douze ruches vont bien.',
    );
  });
});

describe('⚠️ un ÉCHEC se dit, et il passe avant tout', () => {
  it('prononce l’erreur au lieu de la réponse précédente', () => {
    /**
     * ⚠️ LE DÉFAUT EXACT. Sur une requête refusée, `useCopilote` RETIRE la
     * question et la bulle vide du fil : la dernière bulle redevient la réponse
     * PRÉCÉDENTE. Maya la relisait mot pour mot — consigne « dis oui pour
     * confirmer » comprise — pour une proposition qui n'existait plus.
     * L'apiculteur entendait deux fois la même chose et pouvait dire « oui » à
     * un vide. À l'écran, l'erreur s'affiche ; à l'oreille, il n'y avait rien.
     */
    expect(
      paroleDeLaReponse({
        erreur: 'Ton abonnement ne permet pas cette action.',
        derniere: { role: 'assistant', content: 'Je crée le client Jean ?', attendUnAccord: true },
        dejaDite: false,
      }),
    ).toBe('Ton abonnement ne permet pas cette action.');
  });
});

describe('⚠️ une bulle DÉJÀ lue ne se relit pas', () => {
  it('se tait sur une bulle déjà prononcée', () => {
    expect(paroleDeLaReponse({ derniere: REPONSE, dejaDite: true })).toBeNull();
  });

  it('se tait sur une bulle de l’apiculteur', () => {
    // La dernière bulle peut être la QUESTION (flux interrompu, envoi en
    // cours). La lire ferait répéter à l'apiculteur ce qu'il vient de dire.
    expect(
      paroleDeLaReponse({
        derniere: { role: 'user', content: 'combien de ruches' },
        dejaDite: false,
      }),
    ).toBeNull();
  });

  it('se tait sur une bulle vide ou absente', () => {
    expect(
      paroleDeLaReponse({ derniere: { role: 'assistant', content: '  ' }, dejaDite: false }),
    ).toBeNull();
    expect(paroleDeLaReponse({ derniere: null, dejaDite: false })).toBeNull();
    expect(paroleDeLaReponse({ dejaDite: false })).toBeNull();
  });
});

describe('la consigne d’accord est DITE', () => {
  it('s’ajoute quand une écriture attend un oui', () => {
    const dit = paroleDeLaReponse({
      derniere: { role: 'assistant', content: 'Je crée le client Jean ?', attendUnAccord: true },
      dejaDite: false,
    });
    expect(dit).toContain('Je crée le client Jean ?');
    expect(dit, 'à l’oreille, rien ne dit qu’on peut répondre à la voix').toMatch(/oui/i);
    expect(dit).toMatch(/annule/i);
  });

  it('ne s’ajoute PAS quand rien n’attend', () => {
    // La coller partout apprendrait à l'apiculteur à dire « oui » par réflexe,
    // ce qui est la dernière chose à installer sur un chemin qui écrit.
    expect(paroleDeLaReponse({ derniere: REPONSE, dejaDite: false })).not.toMatch(/confirmer/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MAYA NE PARLE JAMAIS DANS UN MICRO OUVERT
//
// ⚠️ CE CAS EST STRUCTUREL PARCE QUE LE DÉFAUT L'ÉTAIT. Trois branches
// appelaient `voix.dire(...)` directement, sans couper la dictée. Sur un
// téléphone posé près d'une ruche, haut-parleur allumé, le micro l'entend : le
// silence de fin d'énoncé tombe sur SA propre phrase, qui repart comme une
// question. Elle se répond à elle-même, et chaque réponse relance la suivante.
//
// La parade n'est pas de corriger les trois branches — c'est qu'il n'y ait
// qu'UNE porte. Ce cas la garde fermée.
// ═══════════════════════════════════════════════════════════════════════════

describe('la parole passe par une seule porte', () => {
  it('aucun `voix.dire(` hors des deux fonctions qui coupent le micro', () => {
    const source = sansCommentaires(readFileSync('app/components/ia/MayaBubble.vue', 'utf-8'));

    const portes = ['async function parler(', 'async function quitterALaVoix('];
    const plages = portes.map((entete) => {
      const debut = source.indexOf(entete);
      expect(debut, `porte introuvable : ${entete}`).toBeGreaterThan(-1);
      // Fin de la fonction : la première accolade fermante en colonne 0.
      const fin = source.indexOf('\n}', debut);
      return [debut, fin] as const;
    });

    const appels = [...source.matchAll(/voix\.dire\(/g)].map((m) => m.index ?? -1);
    expect(appels.length, 'aucun appel détecté — le motif a dû bouger').toBeGreaterThan(0);

    const dehors = appels.filter((i) => !plages.some(([a, b]) => i > a && i < b));
    expect(
      dehors.length,
      'Maya parle hors des deux portes qui coupent le micro : sur un téléphone ' +
        'haut-parleur, elle s’entend et se relance indéfiniment.',
    ).toBe(0);
  });
});
