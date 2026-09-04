// ═══════════════════════════════════════════════════════════════════════════
// UN PLAFOND DE PLAN N'EST PAS UNE PANNE TECHNIQUE.
//
// ⚠️ IL S'EN DÉGUISAIT EN UNE, ET SUR LE SEUL CHEMIN OÙ C'ÉTAIT POSSIBLE.
//
// `intervention` porte `route: null` dans le catalogue : `refusDePlan` ne s'y
// applique jamais. Son gating vit dans `dispatchHandler` (une catégorie hors
// formule) et, pour la division, dans `assertQuotaRuches` (le cheptel). Les
// deux LÈVENT un 402 — et cette levée tombait dans le `catch` générique de la
// route.
//
// L'apiculteur Starter au plafond de dix colonies dictait « ruche 3, j'ai fait
// une division », répondait « 2 », confirmait l'aperçu, et lisait :
//
//   « Je n'ai pas pu finaliser (informations incomplètes ou invalides).
//     Réessayez, ou ouvrez le formulaire pour la saisir à la main. »
//
// Trois mensonges en une phrase : ses informations étaient complètes,
// réessayer ne lèvera jamais un plafond, et le formulaire applique exactement
// la même limite. Aucune formule nommée, aucune porte de sortie.
//
// Les huit autres actions posent `refusPlan` et rendent une phrase. Celle-ci,
// la plus fréquente de la saison, était la seule à ne pas le faire.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it, vi } from 'vitest';
import { phraseDuRefusHorsPorte } from '~~/server/utils/copilote-gating';

const RUCHE_ID = '11111111-2222-4333-8444-555555555555';

/**
 * Un double de transaction minimal : la ruche existe, l'insertion réussit.
 * Il n'interprète aucun SQL — il rend ce que le cœur attend, et rien de plus.
 */
function execDouble() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => [{ id: RUCHE_ID, rucherId: 'ru1' }] }),
      }),
    }),
    insert: () => ({ values: () => ({ returning: () => [{ id: 'i1' }] }) }),
  };
}

/** Ce que lève `assertQuotaRuches` quand la division dépasserait le cheptel. */
const PLAFOND_RUCHES = {
  statusCode: 402,
  data: {
    code: 'LIMIT_REACHED',
    limit: 'ruches',
    current: 10,
    max: 10,
    currentPlan: 'starter',
    requiredPlan: 'pro',
    message: 'Cette création (2) dépasserait la limite de 10 ruches…',
  },
};

/** Ce que lève `dispatchHandler` sur une catégorie hors formule. */
const FEATURE_MANQUANTE = {
  statusCode: 402,
  data: {
    code: 'PLAN_REQUIRED',
    feature: 'elevage',
    currentPlan: 'starter',
    requiredPlan: 'expert',
    message: 'Cette fonctionnalité nécessite le plan Expert',
  },
};

describe('garde-fou : ce qui n’est PAS un refus d’abonnement le reste', () => {
  it('une vraie panne ne se déguise pas en argument de vente', () => {
    /**
     * Sans ce cas, une fonction qui rendrait toujours une phrase satisferait
     * tous les suivants — et une base injoignable dirait à l'apiculteur de
     * changer de formule. C'est le pire conseil possible : il envoie chercher
     * au mauvais endroit ET coûte de l'argent.
     */
    expect(phraseDuRefusHorsPorte(new Error('socket morte'), 'starter')).toBeNull();
    expect(phraseDuRefusHorsPorte({ statusCode: 500, data: {} }, 'starter')).toBeNull();
    expect(phraseDuRefusHorsPorte(null, 'starter')).toBeNull();
  });

  it('un 402 d’un code INCONNU ne vend pas non plus une formule', () => {
    // « Inconnu » ne vaut jamais laisse-passer — et ici, il ne vaut pas non
    // plus « propose un abonnement ».
    expect(
      phraseDuRefusHorsPorte({ statusCode: 402, data: { code: 'AUTRE_CHOSE' } }, 'starter'),
    ).toBeNull();
  });
});

describe('le plafond de cheptel se DIT, et nomme sa sortie', () => {
  it('la phrase nomme la formule qui débloque', () => {
    const phrase = phraseDuRefusHorsPorte(PLAFOND_RUCHES, 'starter');
    expect(phrase, 'un plafond doit produire une phrase').toBeTruthy();
    expect(phrase, 'la formule qui lève la limite doit être nommée').toMatch(/Pro/i);
  });

  it('elle dit OÙ changer — un refus sans porte de sortie est un mur', () => {
    expect(phraseDuRefusHorsPorte(PLAFOND_RUCHES, 'starter')).toContain('Réglages › Abonnement');
  });

  it('elle rassure sur les données, et ne dit JAMAIS « réessayez »', () => {
    /**
     * ⚠️ LES TROIS MENSONGES DE L'ANCIENNE PHRASE. « Réessayez » est le pire :
     * il envoie répéter un geste qui échouera à l'identique, indéfiniment.
     */
    const phrase = phraseDuRefusHorsPorte(PLAFOND_RUCHES, 'starter')!;
    expect(phrase.toLowerCase(), 'réessayer ne lève jamais un plafond').not.toMatch(
      /réessaie|réessayez/,
    );
    // ⚠️ L'apostrophe est DROITE dans la source. Une typographique ici ferait
    // passer l'assertion à côté — le piège qui traîne dans tout ce dépôt.
    expect(phrase, 'rien n’a été écrit, il faut le dire').toMatch(/rien n'a été enregistré/i);
  });

  it('le CHIFFRE du plafond est celui de la levée, pas un littéral', () => {
    // Un plafond annoncé de travers est un mensonge de plus. On le lit dans
    // `data.max`, jamais recopié.
    expect(phraseDuRefusHorsPorte(PLAFOND_RUCHES, 'starter')).toContain('10 ruches');
  });

  it('un refus de FONCTIONNALITÉ nomme lui aussi sa formule et sa sortie', () => {
    const phrase = phraseDuRefusHorsPorte(FEATURE_MANQUANTE, 'starter')!;
    expect(phrase).toMatch(/Expert/i);
    expect(phrase).toContain('Réglages › Abonnement');
  });

  it('un plafond SANS chiffre reste une phrase utile', () => {
    /**
     * `max` peut manquer si la levée change de forme. Le refus doit rester une
     * PHRASE qui nomme la sortie — jamais un texte tronqué ou un code.
     */
    const phrase = phraseDuRefusHorsPorte(
      { statusCode: 402, data: { code: 'LIMIT_REACHED', requiredPlan: 'pro' } },
      'starter',
    )!;
    expect(phrase).toContain('Réglages › Abonnement');
    expect(phrase, 'jamais un identifiant technique').not.toMatch(/LIMIT_REACHED|undefined|null/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ET LE BRANCHEMENT — c'est LUI qui manquait, pas la phrase.
//
// ⚠️ UNE PHRASE JUSTE QUE PERSONNE N'APPELLE NE RÉPARE RIEN. Les cas ci-dessus
// mesurent la formulation ; celui-ci mesure que la levée du gestionnaire est
// bien RATTRAPÉE dans le cœur transactionnel de l'intervention, convertie, et
// marquée `refusPlan` — sans quoi le lot la sert encore en « Réessaie dans un
// instant » (cf. `executerPlan`, qui teste ce drapeau).
// ═══════════════════════════════════════════════════════════════════════════

describe('la levée du gestionnaire est rattrapée là où elle passe', () => {
  it('un 402 du dispatch devient un refus de plan, pas un échec technique', async () => {
    vi.resetModules();
    vi.doMock('~~/server/services/interventions', () => ({
      handlerMap: { division: () => {} },
      dispatchHandler: () => {
        throw PLAFOND_RUCHES;
      },
    }));
    vi.doMock('~~/server/utils/db', () => ({ db: {}, dbWatchdog: <T>(p: T) => p }));

    const { insererInterventionTx } = await import('~~/server/utils/copilote-actions');
    const res = await insererInterventionTx(
      execDouble() as never,
      'u1',
      { rucheId: RUCHE_ID, type: 'division', donnees: { nombreDivisions: 2 } },
      'starter',
    );

    expect(res.ok, 'un plafond n’est pas une réussite').toBe(false);
    expect(res.texte, 'et c’est une PHRASE qui nomme la formule').toMatch(/Pro/i);
    expect(res.texte).toContain('Réglages › Abonnement');
    expect(
      res.texte.toLowerCase(),
      'jamais « réessayez » : le geste échouera à l’identique',
    ).not.toMatch(/réessaie|réessayez/);
    expect(
      (res as { refusPlan?: boolean }).refusPlan,
      'sans ce drapeau, le lot sert encore « Réessaie dans un instant »',
    ).toBe(true);
  });

  it('une vraie panne du gestionnaire, elle, REMONTE', async () => {
    /**
     * Le contre-test. Sans lui, un `catch` qui avalerait tout transformerait
     * une base injoignable en « change de formule » — et masquerait la panne.
     */
    vi.resetModules();
    vi.doMock('~~/server/services/interventions', () => ({
      handlerMap: { division: () => {} },
      dispatchHandler: () => {
        throw new Error('socket morte');
      },
    }));
    vi.doMock('~~/server/utils/db', () => ({ db: {}, dbWatchdog: <T>(p: T) => p }));

    const { insererInterventionTx } = await import('~~/server/utils/copilote-actions');
    await expect(
      insererInterventionTx(
        execDouble() as never,
        'u1',
        { rucheId: RUCHE_ID, type: 'division', donnees: { nombreDivisions: 2 } },
        'starter',
      ),
    ).rejects.toThrow('socket morte');
  });
});
