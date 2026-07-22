import { describe, it, expect } from 'vitest';
import {
  aRecolteAutour,
  CATEGORIES_ALERTES_BALANCE,
  detecterAlertesBalance,
  detecterSurLot,
  filtrerNouvelles,
  resoudreSeuils,
  SEUILS_BALANCE_DEFAUT,
  TYPES_ALERTE_BALANCE,
  versAlerte,
  type ContexteBalance,
  type MesureAlertable,
  type SeuilsBalance,
} from '~~/server/utils/balances/alertes';
import { categorieDeType } from '~~/server/utils/alertesCategories';

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

  // Un net négatif = le brut est passé SOUS la tare, donc plus de ruche. En
  // valeur absolue le message annonçait « tombé à 21,7 kg » : on comprenait
  // qu'il restait une ruche, l'inverse de l'alerte.
  it('dit que le plateau est vide plutôt que d’annoncer un poids positif', () => {
    const d = detecterAlertesBalance(
      ctx({ poidsNetKg: -21.7, variationKg: -42, heureLocale: 3 }),
      SEUILS,
    );
    const message = d.find((x) => x.type === 'balance_vol')!.message;
    expect(message).toContain('ne porte plus rien');
    expect(message).not.toContain('21,7 kg');
    expect(message).toContain('42,0 kg');
  });

  it('annonce le poids restant quand il en reste vraiment un', () => {
    const d = detecterAlertesBalance(ctx({ poidsNetKg: 3.2, variationKg: -40 }), SEUILS);
    expect(d.find((x) => x.type === 'balance_vol')!.message).toContain('tombé à 3,2 kg');
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

  // Deux tables décrivent la même chose : celle du domaine balances et la source
  // de vérité globale. Si elles divergent, `categorieDeType()` retombe sur
  // « sante » sans rien signaler et la préférence de l'utilisateur est bafouée.
  it('la catégorie effective correspond à la table du domaine balances', () => {
    for (const t of TYPES_ALERTE_BALANCE) {
      expect(categorieDeType(t)).toBe(CATEGORIES_ALERTES_BALANCE[t]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DÉTECTION SUR UN LOT.
//
// Le test grandeur nature du 22/07/2026 a montré qu'une série de 691 mesures
// contenant DEUX chutes qualifiantes ne produisait AUCUNE alerte d'essaimage :
// seule la dernière mesure du lot était évaluée. Un capteur en store-and-forward
// perdait donc l'événement le plus précieux du produit.
// ═══════════════════════════════════════════════════════════════════════════

/** 12 h 34 UTC = 14 h 34 à Paris — dans la fenêtre d'essaimage (10 h-17 h). */
const MIDI = '2026-07-03T12:34:00Z';
const MAINTENANT = new Date('2026-07-03T20:00:00Z');

function mes(iso: string, partiel: Partial<MesureAlertable> = {}): MesureAlertable {
  return {
    mesureeAt: new Date(iso),
    poidsNetKg: 38,
    variationKg: 0,
    variation24hKg: 0,
    batteriePct: 80,
    ...partiel,
  };
}

function lot(
  mesures: MesureAlertable[],
  extra: Partial<Parameters<typeof detecterSurLot>[0]> = {},
) {
  return detecterSurLot({
    balanceId: 'b-1',
    nomBalance: 'Balance Nord',
    mesures,
    seuils: SEUILS,
    instantsRecoltes: [],
    maintenant: MAINTENANT,
    ...extra,
  });
}

describe('detecterSurLot', () => {
  it('détecte un essaimage survenu au MILIEU du lot, pas seulement sur la dernière mesure', () => {
    const types = lot([
      mes('2026-07-03T10:34:00Z'),
      mes(MIDI, { variationKg: -2.13 }), // le départ d'essaim
      mes('2026-07-03T14:34:00Z'),
    ]).map((d) => d.type);

    expect(types).toContain('balance_essaimage');
  });

  it("ne produit QU'UNE alerte par type même si des centaines de points qualifient", () => {
    const mesures = Array.from({ length: 300 }, (_, i) =>
      mes(new Date(MAINTENANT.getTime() - (300 - i) * 60_000).toISOString(), {
        variation24hKg: 3,
      }),
    );
    expect(lot(mesures).filter((d) => d.type === 'balance_miellee')).toHaveLength(1);
  });

  it('retient la PREMIÈRE occurrence chronologique, celle où la condition devient vraie', () => {
    const [essaimage] = lot([
      mes(MIDI, { variationKg: -2 }),
      mes('2026-07-03T13:34:00Z', { variationKg: -9 }),
    ]).filter((d) => d.type === 'balance_essaimage');

    // 2 kg = la première chute, pas la plus spectaculaire.
    expect(essaimage?.titre).toContain('2,0 kg');
  });

  it('ignore les mesures trop anciennes — un historique réimporté ne réveille rien', () => {
    const vieux = mes('2026-06-03T12:34:00Z', { variationKg: -5, variation24hKg: 4 });
    expect(lot([vieux])).toHaveLength(0);

    // …mais la même série reste évaluée si on élargit la fenêtre de fraîcheur.
    expect(lot([vieux], { fraicheurHeures: 24 * 60 }).length).toBeGreaterThan(0);
  });

  it("n'évalue le silence que sur le dernier point (l'état courant)", () => {
    const mesures = [mes('2026-07-03T10:34:00Z'), mes(MIDI)];
    expect(lot(mesures).some((d) => d.type === 'balance_muette')).toBe(false);

    const avecSilence = lot(mesures, { heuresDepuisDerniereMesure: 20 });
    expect(avecSilence.filter((d) => d.type === 'balance_muette')).toHaveLength(1);
  });

  it('une récolte saisie autour de la chute neutralise bien l’essaimage', () => {
    const mesures = [mes(MIDI, { variationKg: -21 })];
    expect(lot(mesures).map((d) => d.type)).toContain('balance_essaimage');

    const avecRecolte = lot(mesures, {
      instantsRecoltes: [new Date('2026-07-03T08:00:00Z').getTime()],
    });
    expect(avecRecolte.map((d) => d.type)).not.toContain('balance_essaimage');
  });
});

describe('aRecolteAutour', () => {
  const instant = new Date(MIDI);
  const decale = (heures: number) => [new Date(instant.getTime() + heures * 3_600_000).getTime()];

  it('accepte une récolte saisie jusqu’à 48 h avant et 24 h après', () => {
    expect(aRecolteAutour(decale(-47), instant)).toBe(true);
    expect(aRecolteAutour(decale(23), instant)).toBe(true);
  });

  it('rejette au-delà de la fenêtre', () => {
    expect(aRecolteAutour(decale(-49), instant)).toBe(false);
    expect(aRecolteAutour(decale(25), instant)).toBe(false);
    expect(aRecolteAutour([], instant)).toBe(false);
  });
});
