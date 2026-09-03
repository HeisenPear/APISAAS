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

// ═══════════════════════════════════════════════════════════════════════════
// LES FAUX OUI QU'UNE SONDE A TROUVÉS — et qui étaient LIVRÉS.
//
// ⚠️ CETTE SECTION N'EST PAS DÉFENSIVE, ELLE EST HISTORIQUE. La première
// version de `lireAccord` décomposait les expressions en JETONS — « d'accord »
// devenait `d` + `accord`, « pas maintenant » devenait `pas` + `maintenant` —
// puis acceptait n'importe quelle combinaison de ces jetons. Les 38 cas
// au-dessus passaient tous. Une sonde jetée sur du français parlé ordinaire a
// rendu ceci :
//
//     « bon alors »  → OUI       « note ça » → OUI      « si » → OUI
//     « du coup bon » → OUI      « ça »      → OUI      « y »  → OUI
//     « maintenant » → NON       « est »     → OUI      « merci » → NON
//
// « bon alors » est une HÉSITATION : c'est ce qu'on dit en réfléchissant, juste
// avant de parler. Si le silence de fin d'énoncé tombe là — et il tombe
// exactement là, puisqu'on hésite en se taisant — l'écriture partait en base de
// PRODUCTION sans que personne ne l'ait validée. Et « maintenant », qui veut
// dire « oui, tout de suite », valait REFUS : une inversion de sens pure.
//
// La leçon tient en une ligne, et elle est la même que « dériver, jamais
// recopier » : DÉCOMPOSER UNE EXPRESSION EN JETONS PERD L'EXPRESSION.
// ═══════════════════════════════════════════════════════════════════════════

describe('⚠️ les hésitations ne valident RIEN', () => {
  it.each([
    'bon',
    'bon alors',
    'alors bon',
    'bon donc',
    'bon ben',
    'euh bon alors',
    'du coup bon',
    'bon bah du coup',
    'hmm',
    'alors',
    // « ben voilà » ACQUIESCE, en français parlé — mais « voilà » est aussi un
    // marqueur de discours (« voilà, donc je disais… »). Sur le seul chemin du
    // produit où la parole ÉCRIT, on préfère demander de répéter.
    'ben voilà',
    'voilà',
  ])('« %s » n’est pas une réponse', (phrase) => {
    expect(
      lireAccord(phrase),
      'on hésite en se taisant — et c’est justement le silence qui déclenche l’envoi',
    ).toBe('autre');
  });
});

describe('⚠️ les mots ambigus prononcés seuls', () => {
  it.each([
    ['si', 'conjonction : « si la reine est morte… »'],
    ['ça', 'pronom nu, ne répond à rien'],
    ['y', 'n’existe que dans « vas-y »'],
    ['est', 'fragment de « c’est bon »'],
    ['note', 'un ORDRE (« note ça »), pas un accord'],
    ['note ça', 'un ordre complet'],
    ['go', 'trop faible pour engager une écriture'],
    ['allez', 'aussi souvent un filler : « allez, montre-moi… »'],
    ['merci', 'de la politesse, ni oui ni non'],
    ['maintenant', 'veut dire « tout de suite » — l’inverse d’un refus'],
    ['pas', 'fragment de « pas maintenant »'],
    ['surtout', 'fragment de « surtout pas »'],
  ])('« %s » ne tranche rien (%s)', (phrase) => {
    expect(lireAccord(phrase)).toBe('autre');
  });
});

describe('les expressions se reconnaissent ENTIÈRES', () => {
  it.each([
    ['pas maintenant', 'non'],
    ['pas du tout', 'non'],
    ['surtout pas', 'non'],
    ['non merci', 'non'],
    ['laisse tomber', 'annuler'],
    ['d’accord', 'oui'],
    ['c’est bon', 'oui'],
    ['c’est ça', 'oui'],
    ['très bien', 'oui'],
    ['vas-y', 'oui'],
    ['allez-y', 'oui'],
    ['je confirme', 'oui'],
  ])('« %s » vaut %s', (phrase, attendu) => {
    // ⚠️ AUCUN de ces mots pris SÉPARÉMENT ne porte ce sens. C'est tout
    // l'intérêt de canonicaliser avant de découper.
    expect(lireAccord(phrase)).toBe(attendu);
  });

  it('les pronoms d’objet ne bloquent pas une annulation claire', () => {
    for (const p of ['efface ça', 'annule le', 'annule tout', 'oublie ça']) {
      expect(lireAccord(p), p).toBe('annuler');
    }
  });
});
