import { describe, expect, it } from 'vitest';
import { lireAccord } from '../../../../app/utils/accordVocal';

// ═══════════════════════════════════════════════════════════════════════════
// DIRE OUI À LA VOIX — le seul endroit du produit où la parole ÉCRIT.
//
// ⚠️ CE BANC GARDE UNE RÈGLE PRODUIT, PAS UNE COMMODITÉ.
//
// « Rien ne s'écrit sans accord » reste entier : un « oui » prononcé EST
// l'accord, donné par la même personne au même instant — seul le canal change.
// Mais une écriture déclenchée par un « oui » mal entendu est une donnée fausse
// chez un client qui paie, et personne ne la verra passer.
//
// D'où la stricte règle gardée ici : une réponse est COURTE et ENTIÈREMENT
// composée de mots d'accord. « oui mais attends », « oui la ruche 3 aussi »
// sont des PHRASES — elles repartent comme des questions, et la demande de
// confirmation reste en attente. Le doute ne vaut jamais accord.
// ═══════════════════════════════════════════════════════════════════════════

describe('garde-fou : le vocabulaire de réponse est bien lu', () => {
  it('reconnaît les trois réponses de base', () => {
    // Sans ce cas, une fonction qui rendrait toujours 'autre' passerait tous
    // les tests de refus ci-dessous — et le mode vocal ne confirmerait jamais
    // rien, en silence.
    expect(lireAccord('oui')).toBe('oui');
    expect(lireAccord('non')).toBe('non');
    expect(lireAccord('annule')).toBe('annuler');
  });
});

describe('un oui franc vaut accord', () => {
  it.each([
    'oui',
    'ouais',
    'ok',
    'okay',
    'd’accord',
    'vas-y',
    'vasy',
    'confirme',
    'valide',
    'enregistre',
    'oui vas-y',
    'euh oui',
    'ok parfait',
    'oui confirme',
    // Les deux tournures les plus naturelles du français parlé pour dire oui.
    // L'apostrophe est mangée par la normalisation : sans traitement des
    // élisions, elles repartaient comme des phrases.
    'c’est bon',
    'c’est ça',
  ])('« %s » vaut oui', (phrase) => {
    expect(lireAccord(phrase)).toBe('oui');
  });
});

describe('un non franc renonce', () => {
  it.each(['non', 'nan', 'non merci', 'pas maintenant', 'surtout pas'])(
    '« %s » vaut non',
    (phrase) => {
      expect(lireAccord(phrase)).toBe('non');
    },
  );
});

describe('défaire se demande explicitement', () => {
  it.each(['annule', 'annuler', 'oublie', 'efface ça', 'retire'])(
    '« %s » demande de défaire',
    (phrase) => {
      expect(lireAccord(phrase)).toBe('annuler');
    },
  );

  it('« non » ne DÉFAIT pas — il refuse', () => {
    // ⚠️ LA DISTINCTION EST TOUT L'INTÉRÊT. Après une écriture autonome, Maya
    // propose « Annuler ». Un « non » y est ambigu : il peut répondre à autre
    // chose, à quelqu'un d'autre, à rien. Défaire une écriture sur une
    // ambiguïté est exactement ce qu'on ne peut pas se permettre.
    expect(lireAccord('non')).toBe('non');
  });
});

describe('⚠️ ce qui NE vaut PAS accord', () => {
  it.each([
    'oui mais attends',
    'oui la ruche 3 aussi',
    'oui enfin je crois que la reine est morte',
    'ok alors montre-moi les ruches du rucher nord',
    'non je voulais dire la ruche 7',
    'combien de ruches ai-je',
    'note une visite sur la ruche 3',
  ])('« %s » n’est pas une réponse', (phrase) => {
    expect(
      lireAccord(phrase),
      'un mot hors vocabulaire fait une PHRASE : la confirmation doit rester en attente',
    ).toBe('autre');
  });

  it('un mélange de oui et de non ne vaut JAMAIS accord', () => {
    // ⚠️ L'ORDRE DES PRIORITÉS EST UNE DÉCISION DE SÉCURITÉ. Devant
    // « non ok » — une hésitation, une reprise, un bruit — trancher pour
    // l'accord ferait écrire sur une phrase qui contient un « non ».
    expect(lireAccord('non ok')).toBe('non');
    expect(lireAccord('ok non')).toBe('non');
    expect(lireAccord('oui annule')).toBe('annuler');
  });

  it('une phrase longue n’est jamais une réponse', () => {
    expect(lireAccord('oui oui oui oui oui oui')).toBe('autre');
  });

  it('le silence n’est pas un accord', () => {
    // Le plus important de tous : un énoncé vide ne doit RIEN déclencher.
    expect(lireAccord('')).toBe('autre');
    expect(lireAccord('   ')).toBe('autre');
    expect(lireAccord('euh')).toBe('autre');
  });
});
