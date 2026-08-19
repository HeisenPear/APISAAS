import { describe, expect, it } from 'vitest';
import { collecterIdsRuches } from '~~/server/middleware/06.verrou-ruches';
import { idsRuchesAutorisees } from '~~/server/utils/quotaRuches';
import { dispatchHandler, FEATURE_PAR_CATEGORIE } from '~~/server/services/interventions';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import { hasFeature, PLANS } from '~~/app/config/plans';
import type { DrizzleTransaction, InterventionContext } from '~~/server/types/interventions';

/**
 * Verrou de cheptel + fermeture du contournement de features.
 *
 * Décision produit d'Antoine (03/08) : seuls les comptes admin ont accès à
 * tout. Au-delà du plafond du plan, les ruches excédentaires deviennent
 * INACCESSIBLES sans jamais être supprimées, et l'abonnement les rend là où
 * l'apiculteur s'était arrêté.
 */

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

describe('collecterIdsRuches — rien ne doit passer sous le radar', () => {
  it('ramasse un rucheId simple', () => {
    expect([...collecterIdsRuches({ rucheId: A })]).toEqual([A]);
  });

  it('ramasse un tableau rucheIds (bulk-group)', () => {
    expect([...collecterIdsRuches({ rucheIds: [A, B] })]).toEqual([A, B]);
  });

  it('ramasse rucheDestinationId (déplacements)', () => {
    expect([...collecterIdsRuches({ rucheDestinationId: A })]).toEqual([A]);
  });

  // Le cas qui ferait fuiter le verrou : `visite-rucher` porte les ruches dans
  // un tableau d'exceptions imbriqué, pas à la racine du corps.
  it('descend dans les objets IMBRIQUÉS', () => {
    const corps = { rucherId: 'x', exceptions: [{ rucheId: A }, { rucheId: B }] };
    expect([...collecterIdsRuches(corps)].sort()).toEqual([A, B].sort());
  });

  it("ignore ce qui n'est pas un UUID", () => {
    expect([...collecterIdsRuches({ rucheId: 'pas-un-uuid' })]).toEqual([]);
  });

  it('ignore les clés qui ne désignent pas une ruche', () => {
    expect([...collecterIdsRuches({ rucherId: A, clientId: B })]).toEqual([]);
  });

  // La création de ruches envoie des OBJETS dans `ruches: [...]`, pas des ids :
  // le verrou ne doit pas s'y déclencher (c'est `assertQuotaRuches` qui régit
  // la création).
  it('ne confond pas le corps de création de ruches avec des références', () => {
    const corps = { ruches: [{ numero: '1', type: 'dadant_10' }] };
    expect([...collecterIdsRuches(corps)]).toEqual([]);
  });

  it('borne la profondeur sur un corps hostile', () => {
    let profond: Record<string, unknown> = { rucheId: A };
    for (let i = 0; i < 40; i++) profond = { n: profond };
    expect(() => collecterIdsRuches(profond)).not.toThrow();
  });

  it('supporte un corps null ou primitif', () => {
    expect([...collecterIdsRuches(null)]).toEqual([]);
    expect([...collecterIdsRuches('texte')]).toEqual([]);
  });
});

/**
 * Exécuteur factice. Le `.limit(n)` est honoré pour de vrai : c'est lui qui
 * porte le plafond du plan, un faux qui l'ignorerait ne prouverait rien.
 */
/**
 * Double de base à DEUX requêtes, dans l'ordre où la fonction les émet :
 *   1. les ruches HORS quota (mortes/vendues/fusionnées) — sans limite ;
 *   2. les ruches qui CONSOMMENT du quota — triées puis bornées à `max`.
 *
 * Un double qui rendrait la même liste aux deux (ce qu'il faisait) ne peut pas
 * voir le défaut qu'on corrige ici : une colonie morte occupant un créneau.
 */
function executeur(vivantes: string[], horsQuota: string[] = []) {
  const chaine: Record<string, unknown> = {};
  const self = () => chaine;
  let limite = Infinity;
  let appel = 0;
  Object.assign(chaine, {
    from: self,
    where: self,
    orderBy: self,
    limit: (n: number) => {
      limite = n;
      return chaine;
    },
    then: (ok: (v: { id: string }[]) => unknown, ko?: (e: unknown) => unknown) => {
      const premiere = appel++ === 0;
      const lignes = premiere ? horsQuota : vivantes.slice(0, limite);
      limite = Infinity;
      return Promise.resolve(lignes.map((id) => ({ id }))).then(ok, ko);
    },
  });
  return { select: () => chaine } as unknown as DrizzleTransaction;
}

describe('idsRuchesAutorisees — les N PREMIÈRES créées', () => {
  it("n'autorise que la 1re ruche en Découverte", async () => {
    const set = await idsRuchesAutorisees(executeur([A, B, C]), 'u-1', 'decouverte');
    expect(set).not.toBeNull();
    expect([...set!]).toEqual([A]);
    expect(set!.has(B)).toBe(false);
    expect(set!.has(C)).toBe(false);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // UNE COLONIE MORTE NE PREND PAS LA PLACE D'UNE VIVANTE.
  //
  // Le compteur de quota exclut morte/vendue/fusionnee ; cette fonction, elle,
  // prenait les N PREMIÈRES lignes tous statuts confondus. Une ruche morte
  // occupait donc un créneau et condamnait une ruche vivante que le plan
  // autorise — sans que personne n'ait rien fait d'anormal.
  // ═══════════════════════════════════════════════════════════════════════
  it('une ruche morte ne consomme pas le créneau du plan', async () => {
    // Découverte : la ruche d'origine est morte cet hiver, une nouvelle a été
    // créée — création LÉGALE, le quota comptait 0 vivante.
    const set = await idsRuchesAutorisees(executeur(['vivante'], ['morte']), 'u-1', 'decouverte');

    expect(set!.has('vivante'), 'la ruche vivante doit rester accessible').toBe(true);
  });

  it('laisse toujours accéder aux colonies perdues', async () => {
    // L'inverse est tout aussi faux : filtrer les mortes les rendrait
    // inaccessibles, alors que la fonction promet que RIEN n'est supprimé.
    // L'apiculteur garde l'historique de ce qu'il a perdu.
    const set = await idsRuchesAutorisees(
      executeur(['vivante'], ['morte-1', 'morte-2']),
      'u-1',
      'decouverte',
    );

    expect(set!.has('morte-1')).toBe(true);
    expect(set!.has('morte-2')).toBe(true);
    expect(set!.size).toBe(3);
  });

  it('autorise 10 ruches en Starter', async () => {
    const ids = Array.from({ length: 30 }, (_, i) => `id-${i}`);
    const set = await idsRuchesAutorisees(executeur(ids), 'u-1', 'starter');
    expect(set!.size).toBe(10);
  });

  /**
   * Les 80 ruches d'un lot partagent la MÊME microseconde : sans départage,
   * la ruche débloquée changerait à chaque requête. Ce banc tient l'ordre
   * total ET le piège d'échappement — `\D` dans un littéral gabarit JS est
   * cuit en `D`, ce qui produirait `regexp_replace(numero,'D',…)` et ferait
   * lever le cast ::bigint en production. La classe POSIX `[^0-9]` l'évite.
   */
  it("trie sur 4 critères et n'utilise PAS l'échappement piégeux", async () => {
    let criteres: unknown[] = [];
    const chaine: Record<string, unknown> = {};
    const self = () => chaine;
    Object.assign(chaine, {
      from: self,
      where: self,
      orderBy: (...args: unknown[]) => {
        criteres = args;
        return chaine;
      },
      limit: self,
      then: (ok: (v: unknown[]) => unknown) => Promise.resolve([]).then(ok),
    });
    const espion = { select: () => chaine } as unknown as DrizzleTransaction;

    await idsRuchesAutorisees(espion, 'u-1', 'decouverte');

    // createdAt, valeur numérique du numéro, numero, id → ordre TOTAL, stable.
    expect(criteres).toHaveLength(4);

    // Les objets Drizzle sont circulaires : on lit le texte des `queryChunks`
    // plutôt que de les sérialiser.
    const texteSql = criteres
      .map((c) => {
        const chunks = (c as { queryChunks?: unknown[] })?.queryChunks;
        if (!Array.isArray(chunks)) return '';
        return chunks
          .map((k) => {
            const v = (k as { value?: unknown })?.value;
            return Array.isArray(v) ? v.join('') : '';
          })
          .join('');
      })
      .join(' ');

    expect(texteSql).toContain('[^0-9]');
    expect(texteSql).toContain('NULLS LAST');
    // Le piège : `\D` cuit en `D` produirait `regexp_replace(…, 'D', …)`.
    expect(texteSql).not.toContain("'D'");
  });

  // Pro/Expert : aucune restriction ET aucune requête émise.
  it('ne restreint ni ne requête rien sur un plan illimité', async () => {
    let requetes = 0;
    const espion = {
      select: () => {
        requetes++;
        return executeur([]);
      },
    } as unknown as DrizzleTransaction;
    expect(await idsRuchesAutorisees(espion, 'u-1', 'pro')).toBeNull();
    expect(await idsRuchesAutorisees(espion, 'u-1', 'expert')).toBeNull();
    expect(requetes).toBe(0);
  });
});

describe('dispatchHandler — le contournement des features est fermé', () => {
  const ctx = (plan: InterventionContext['plan']): InterventionContext => ({
    userId: 'u-1',
    inspectionId: 'i-1',
    rucheId: 'r-1',
    rucherId: 'rh-1',
    donnees: {},
    plan,
  });

  const txMuet = {} as DrizzleTransaction;

  // Le bug réel : laruchebleue17, plan Découverte, a saisi une récolte le 19/05
  // via POST /api/interventions/bulk alors que `production` y est faux.
  it('REFUSE une récolte en Découverte (le contournement constaté en prod)', async () => {
    await expect(dispatchHandler(txMuet, 'recolte', ctx('decouverte'))).rejects.toMatchObject({
      statusCode: 402,
      data: { code: 'PLAN_REQUIRED', feature: 'production' },
    });
  });

  it('REFUSE un événement de reine en Découverte', async () => {
    await expect(dispatchHandler(txMuet, 'reine', ctx('decouverte'))).rejects.toMatchObject({
      statusCode: 402,
      data: { code: 'PLAN_REQUIRED', feature: 'moduleReine' },
    });
  });

  it('laisse passer la récolte dès Starter', async () => {
    // Le handler est atteint (il échouera sur le tx muet) : la preuve est que
    // l'erreur n'est PLUS un 402 de plan.
    await expect(dispatchHandler(txMuet, 'recolte', ctx('starter'))).rejects.not.toMatchObject({
      data: { code: 'PLAN_REQUIRED' },
    });
  });

  it('ne gate pas les catégories qui ne le sont nulle part (commentaire)', async () => {
    await expect(
      dispatchHandler(txMuet, 'commentaire', ctx('decouverte')),
    ).rejects.not.toMatchObject({ data: { code: 'PLAN_REQUIRED' } });
  });
});

/**
 * Garde d'alignement : la table du dispatcher doit dire la MÊME chose que
 * `ROUTE_GATES` pour la route directe équivalente. Si quelqu'un change le gate
 * d'une route sans toucher au dispatcher, le contournement se rouvre en
 * silence — ce banc le fait tomber.
 */
describe('FEATURE_PAR_CATEGORIE — alignée sur ROUTE_GATES', () => {
  const EQUIVALENCES: Array<[string, string]> = [
    ['recolte', 'POST /api/production/recoltes'],
    ['reine', 'POST /api/ruches/*/evenements-reine'],
  ];

  for (const [categorie, route] of EQUIVALENCES) {
    it(`« ${categorie} » porte la feature de « ${route} »`, () => {
      expect(FEATURE_PAR_CATEGORIE[categorie]).toBe(ROUTE_GATES[route]?.feature);
    });
  }

  it('chaque feature citée existe et discrimine vraiment les plans', () => {
    for (const feature of Object.values(FEATURE_PAR_CATEGORIE)) {
      const valeurs = PLANS.map((p) => hasFeature(p, feature!));
      // Une feature vraie partout ne gate rien : ce serait une entrée morte.
      expect(valeurs).toContain(false);
      expect(valeurs).toContain(true);
    }
  });
});
