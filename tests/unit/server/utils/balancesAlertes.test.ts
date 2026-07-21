import { describe, it, expect } from 'vitest';
import {
  CATEGORIES_ALERTES_BALANCE,
  detecterAlertesBalance,
  filtrerNouvelles,
  resoudreSeuils,
  SEUILS_BALANCE_DEFAUT,
  TYPES_ALERTE_BALANCE,
  versAlerte,
  type ContexteBalance,
  type SeuilsBalance,
} from '~~/server/utils/balances/alertes';

const SEUILS: SeuilsBalance = { ...SEUILS_BALANCE_DEFAUT, poidsRecolteKg: 45 };

function ctx(partiel: Partial<ContexteBalance> = {}): ContexteBalance {
  return {
    balanceId: '11111111-1111-1111-1111-111111111111',
    nomBalance: 'Balance Nord',
    heureLocale: 14,
    poidsNetKg: 38,
    variationKg: 0,
    variation24hKg: 0,
    batteriePct: 80,
    recolteRecente: false,
    heuresDepuisDerniereMesure: null,
    ...partiel,
  };
}

const types = (ctxt: ContexteBalance, s: SeuilsBalance = SEUILS) =>
  detecterAlertesBalance(ctxt, s).map((d) => d.type);

describe('resoudreSeuils', () => {
  it('retombe sur les défauts quand la balance ne surcharge rien', () => {
    expect(resoudreSeuils({})).toEqual(SEUILS_BALANCE_DEFAUT);
  });
  it('convertit les colonnes decimal (strings) en nombres', () => {
    const s = resoudreSeuils({
      seuilVariationKg: '2.50',
      seuilPoidsRecolteKg: '48.00',
      seuilBatteriePct: 10,
      seuilSilenceHeures: 24,
    });
    expect(s).toEqual({
      variationKg: 2.5,
      poidsRecolteKg: 48,
      batteriePct: 10,
      silenceHeures: 24,
    });
  });
});

describe('règle balance_essaimage', () => {
  it('déclenche sur une chute brutale en pleine journée', () => {
    const d = detecterAlertesBalance(ctx({ variationKg: -2.3, heureLocale: 13 }), SEUILS);
    const essaimage = d.find((a) => a.type === 'balance_essaimage')!;
    expect(essaimage).toBeDefined();
    expect(essaimage.priorite).toBe('haute');
    expect(essaimage.titre).toContain('2,3 kg');
  });
  it('ne déclenche pas sous le seuil', () => {
    expect(types(ctx({ variationKg: -1.2, heureLocale: 13 }))).not.toContain('balance_essaimage');
  });
  it('ne déclenche pas la nuit (un essaim ne part pas à 3 h du matin)', () => {
    expect(types(ctx({ variationKg: -2.3, heureLocale: 3 }))).not.toContain('balance_essaimage');
  });
  it('ne déclenche pas si une récolte a été saisie', () => {
    expect(types(ctx({ variationKg: -2.3, recolteRecente: true }))).not.toContain(
      'balance_essaimage',
    );
  });
  it('respecte un seuil surchargé sur la balance', () => {
    const seuils = { ...SEUILS, variationKg: 3 };
    expect(types(ctx({ variationKg: -2.3 }), seuils)).not.toContain('balance_essaimage');
    expect(types(ctx({ variationKg: -3.5 }), seuils)).toContain('balance_essaimage');
  });
});

describe('règle balance_vol', () => {
  const vol = ctx({ poidsNetKg: 1.2, variationKg: -36, heureLocale: 2 });

  it('déclenche en critique sur une chute vers ~0 hors récolte', () => {
    const d = detecterAlertesBalance(vol, SEUILS);
    const a = d.find((x) => x.type === 'balance_vol')!;
    expect(a).toBeDefined();
    expect(a.priorite).toBe('critique');
  });
  it('masque l’essaimage : une ruche volée n’est pas un essaim', () => {
    expect(types({ ...vol, heureLocale: 14 })).not.toContain('balance_essaimage');
  });
  it('ne déclenche pas si une récolte explique la chute', () => {
    expect(types({ ...vol, recolteRecente: true })).not.toContain('balance_vol');
  });
  it('ne déclenche pas si le poids restant reste normal', () => {
    expect(types(ctx({ poidsNetKg: 30, variationKg: -12 }))).not.toContain('balance_vol');
  });
});

describe('règle balance_miellee', () => {
  it('déclenche sur un gain soutenu sur 24 h', () => {
    expect(types(ctx({ variation24hKg: 3.4 }))).toContain('balance_miellee');
  });
  it('ne déclenche pas sur un gain faible', () => {
    expect(types(ctx({ variation24hKg: 0.8 }))).not.toContain('balance_miellee');
  });
});

describe('règle balance_hausse_pleine', () => {
  it('déclenche quand le poids net atteint le seuil de récolte', () => {
    expect(types(ctx({ poidsNetKg: 46 }))).toContain('balance_hausse_pleine');
  });
  it('ne déclenche pas sous le seuil', () => {
    expect(types(ctx({ poidsNetKg: 44.9 }))).not.toContain('balance_hausse_pleine');
  });
  it('est désactivée quand aucun seuil de récolte n’est configuré', () => {
    expect(types(ctx({ poidsNetKg: 300 }), SEUILS_BALANCE_DEFAUT)).not.toContain(
      'balance_hausse_pleine',
    );
  });
});

describe('règle balance_batterie', () => {
  it('déclenche au seuil et monte en priorité quand c’est critique', () => {
    const d = detecterAlertesBalance(ctx({ batteriePct: 20 }), SEUILS);
    expect(d.find((a) => a.type === 'balance_batterie')?.priorite).toBe('moyenne');
    const d2 = detecterAlertesBalance(ctx({ batteriePct: 3 }), SEUILS);
    expect(d2.find((a) => a.type === 'balance_batterie')?.priorite).toBe('haute');
  });
  it('ne déclenche pas au-dessus du seuil, ni sans donnée batterie', () => {
    expect(types(ctx({ batteriePct: 21 }))).not.toContain('balance_batterie');
    expect(types(ctx({ batteriePct: null }))).not.toContain('balance_batterie');
  });
});

describe('règle balance_muette', () => {
  it('déclenche au-delà du silence toléré', () => {
    const d = detecterAlertesBalance(ctx({ heuresDepuisDerniereMesure: 30 }), SEUILS);
    expect(d.find((a) => a.type === 'balance_muette')?.titre).toContain('30 h');
  });
  it('ne déclenche pas sous le seuil ni quand le silence n’est pas évalué', () => {
    expect(types(ctx({ heuresDepuisDerniereMesure: 6 }))).not.toContain('balance_muette');
    expect(types(ctx({ heuresDepuisDerniereMesure: null }))).not.toContain('balance_muette');
  });
});

describe('anti-doublon', () => {
  it('écarte les types déjà actifs et garde les autres', () => {
    const d = detecterAlertesBalance(
      ctx({ variationKg: -2.5, batteriePct: 8, variation24hKg: 3 }),
      SEUILS,
    );
    expect(d.length).toBeGreaterThanOrEqual(3);
    const restantes = filtrerNouvelles(d, ['balance_batterie', 'balance_miellee']);
    expect(restantes.map((x) => x.type)).toEqual(['balance_essaimage']);
    expect(
      filtrerNouvelles(
        d,
        d.map((x) => x.type),
      ),
    ).toHaveLength(0);
    expect(filtrerNouvelles(d, [])).toHaveLength(d.length);
  });
});

describe('mise en forme', () => {
  it('produit une ligne d’alerte rattachée à la balance', () => {
    const [detection] = detecterAlertesBalance(ctx({ batteriePct: 4 }), SEUILS);
    const a = versAlerte('u-1', 'b-1', detection!);
    expect(a).toMatchObject({
      userId: 'u-1',
      type: 'balance_batterie',
      referenceType: 'balance',
      referenceId: 'b-1',
      actionUrl: '/balances/b-1',
      lue: false,
    });
  });
  it('les 6 types ont une catégorie de notification', () => {
    expect(TYPES_ALERTE_BALANCE).toHaveLength(6);
    for (const t of TYPES_ALERTE_BALANCE) {
      expect(CATEGORIES_ALERTES_BALANCE[t]).toBeTruthy();
    }
    expect(CATEGORIES_ALERTES_BALANCE.balance_miellee).toBe('production');
    expect(CATEGORIES_ALERTES_BALANCE.balance_batterie).toBe('gestion');
  });
});
