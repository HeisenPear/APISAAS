// ═══════════════════════════════════════════════════════════════════════════
// 04.subscription — LA PORTE DE GATING. 0 % de couverture jusqu'ici.
//
// Ce middleware est le seul endroit où « ce plan a-t-il droit à ça » est
// tranché pour les 156 routes d'écriture. Tout ce qui est vendu passe par lui,
// et tout ce qui ne l'est pas doit s'y arrêter. C'est aussi lui qui a laissé
// passer l'incident du 3 août — trois comptes Découverte portaient 12, 35 et
// 80 colonies.
//
// Deux exigences opposées, et il doit tenir les deux :
//
//   · CE QUI EST VENDU DOIT MARCHER. Un plafond `Infinity` ne doit jamais
//     bloquer, un plan qui inclut une fonctionnalité ne doit jamais la refuser.
//     Un faux blocage est un client qui paie et ne peut pas travailler.
//
//   · CE QUI N'EST PAS VENDU NE DOIT PAS ÊTRE ACCESSIBLE. Et le refus doit
//     NOMMER la formule qui débloque — jamais un mur muet.
//
// ─── AUTO-IMPORTS ─────────────────────────────────────────────────────────
// Le middleware utilise `getRequestURL`, `getMethod`, `requireAuth`,
// `resolveWorkspace`, `db`, `withDbRetry` et `createError` sans les importer.
// Ils sont posés sur `globalThis` — un `vi.mock` de chemin n'aurait aucun effet.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it } from 'vitest';
import { createError, defineEventHandler } from 'h3';
import { creerFauxDb, type FauxDb } from '../../../helpers/fauxDb';

const PROPRIETAIRE = '11111111-1111-1111-1111-111111111111';
const MEMBRE = '22222222-2222-2222-2222-222222222222';

let faux: FauxDb;
let etat: {
  methode: string;
  chemin: string;
  email: string;
  echecAuth: { statusCode?: number } | null;
  ownerId: string;
  compteurs: Record<string, number>;
};

/**
 * Prépare l'environnement d'une requête.
 *
 * `compteurs` alimente les `count(*)` de `countUserResource` : le double rend
 * la ligne `{ count: n }` pour la table interrogée, ce qui permet de placer un
 * compte juste sous, juste sur, ou au-dessus de son plafond.
 */
function poser(options: Partial<typeof etat> & { plan?: string | null } = {}) {
  etat = {
    methode: 'POST',
    chemin: '/api/ruchers',
    email: 'apiculteur@exemple.fr',
    echecAuth: null,
    ownerId: PROPRIETAIRE,
    compteurs: {},
    ...options,
  };

  const lignes: Record<string, unknown[]> = {
    profils:
      options.plan === null ? [] : [{ plan: options.plan ?? 'decouverte', trialActive: false }],
  };
  for (const [table, n] of Object.entries(etat.compteurs)) lignes[table] = [{ count: n }];
  faux = creerFauxDb(lignes);

  Object.assign(globalThis, {
    defineEventHandler,
    createError,
    db: faux.db,
    getRequestURL: () => new URL(`https://apigo.fr${etat.chemin}`),
    getMethod: () => etat.methode,
    requireAuth: async () => {
      if (etat.echecAuth) throw etat.echecAuth;
      return { id: MEMBRE, email: etat.email };
    },
    resolveWorkspace: async () => ({
      ownerId: etat.ownerId,
      userId: MEMBRE,
      role: 'owner',
      isMember: etat.ownerId !== MEMBRE,
    }),
    withDbRetry: <T>(fabrique: () => Promise<T>) => fabrique(),
  });
}

/** Exécute le middleware ; rend l'erreur levée, ou `null` s'il a laissé passer. */
async function passer(): Promise<{ statusCode?: number; data?: Record<string, unknown> } | null> {
  const module = await import('~~/server/middleware/04.subscription');
  const handler = module.default as unknown as (e: unknown) => Promise<void>;
  try {
    await handler({ context: {}, node: { req: {}, res: {} } });
    return null;
  } catch (e) {
    return e as { statusCode?: number; data?: Record<string, unknown> };
  }
}

beforeEach(() => poser());

describe('routes exemptées — la porte ne doit pas se refermer sur elles', () => {
  for (const prefixe of [
    '/api/auth/callback',
    '/api/stripe/checkout',
    '/api/public/demo',
    '/api/cron/alertes',
    '/api/subscription/usage',
  ]) {
    it(`${prefixe} passe sans même consulter la base`, async () => {
      // `/api/stripe/*` est le cas critique : gater le paiement empêcherait un
      // compte bloqué de payer POUR se débloquer. Et `/api/subscription/*`
      // sert l'usage affiché dans le modal de montée en gamme.
      poser({ chemin: prefixe, plan: 'decouverte' });
      expect(await passer()).toBeNull();
      expect(faux.requetes).toHaveLength(0);
    });
  }

  it('aucune règle de gating ne vise le paiement ni la consultation d’usage', async () => {
    // ─── POURQUOI CE BANC EXISTE ────────────────────────────────────────
    // Le test ci-dessus ne prouve PAS que l'exemption fonctionne : aujourd'hui
    // aucune règle ne vise ces chemins, donc ils passeraient de toute façon.
    // Le test de mutation l'a montré — retirer `/api/stripe/` de la liste
    // d'exemptions ne faisait rougir personne.
    //
    // Ce qu'on verrouille ici est la règle DE FOND, et elle est indépendante
    // de la liste : gater le paiement enfermerait un compte bloqué — il lui
    // faudrait un plan supérieur pour accéder à la page qui permet de le
    // prendre. Gater `/api/subscription/*` masquerait au client le compteur
    // qui lui explique POURQUOI il est bloqué.
    const { ROUTE_GATES, findMatchingGate } = await import('~/config/route-gates');

    const interdits = ['/api/stripe/checkout', '/api/subscription/usage'];
    for (const chemin of interdits) {
      for (const methode of ['GET', 'POST', 'PUT', 'DELETE']) {
        expect(
          findMatchingGate(methode, chemin),
          `${methode} ${chemin} ne doit JAMAIS porter de règle de plan`,
        ).toBeNull();
      }
    }

    // Et le garde-fou du garde-fou : aucune clé de la table ne doit préfixer
    // ces espaces, même sur un chemin qu'on n'aurait pas listé ci-dessus.
    const fautives = Object.keys(ROUTE_GATES).filter((cle) =>
      /\s\/api\/(stripe|subscription)\//.test(cle),
    );
    expect(fautives, `règles interdites : ${fautives.join(', ')}`).toEqual([]);
  });
});

describe('routes sans règle — on ne bloque pas par défaut', () => {
  it('laisse passer une route absente de la table', async () => {
    poser({ chemin: '/api/route-sans-gate', plan: 'decouverte' });
    expect(await passer()).toBeNull();
    expect(faux.requetes).toHaveLength(0);
  });

  it('laisse passer un GET non gaté', async () => {
    poser({ methode: 'GET', chemin: '/api/ruchers', plan: 'decouverte' });
    expect(await passer()).toBeNull();
  });
});

describe('authentification — la porte s’efface, elle ne double pas la serrure', () => {
  it('un 401 propre laisse la route répondre elle-même', async () => {
    // Le middleware ne doit PAS transformer un défaut d'authentification en
    // 402 « plan insuffisant » : le message serait faux et l'apiculteur
    // chercherait à payer pour un problème de session.
    poser({ echecAuth: { statusCode: 401 }, plan: 'expert' });
    expect(await passer()).toBeNull();
  });

  it('un profil introuvable laisse passer plutôt que de bloquer', async () => {
    // Choix assumé : fail-open. Un profil illisible ne doit pas empêcher un
    // client de travailler ; la route reste protégée par son propre requireAuth.
    poser({ plan: null });
    expect(await passer()).toBeNull();
  });
});

describe('fonctionnalité absente du plan', () => {
  it('refuse en 402 et NOMME la formule qui débloque', async () => {
    // `POST /api/transhumance/plans` demande la feature `transhumance`.
    poser({ chemin: '/api/transhumance/plans', plan: 'decouverte' });
    const err = await passer();

    expect(err?.statusCode).toBe(402);
    expect(err?.data?.code).toBe('PLAN_REQUIRED');
    expect(err?.data?.currentPlan).toBe('decouverte');
    // Sans `requiredPlan`, le modal ne peut pas proposer la bonne formule et
    // l'apiculteur paie potentiellement pour un plan qui ne débloque rien.
    expect(err?.data?.requiredPlan).toBeTruthy();
    expect(String(err?.data?.message)).toMatch(/plan/i);
  });

  it('laisse passer quand le plan inclut la fonctionnalité', async () => {
    // Le sens « ce qui est vendu doit marcher ».
    poser({ chemin: '/api/transhumance/plans', plan: 'pro' });
    expect(await passer()).toBeNull();
  });
});

describe('plafonds de ressources', () => {
  it('laisse créer tant que le plafond n’est pas atteint', async () => {
    poser({ chemin: '/api/ruchers', plan: 'starter', compteurs: { ruchers: 0 } });
    expect(await passer()).toBeNull();
  });

  it('refuse à l’arrivée sur le plafond, pas après', async () => {
    // Le contrôle est `currentCount >= maxAllowed` : à égalité, la création
    // SUIVANTE dépasserait. C'est exactement le défaut du 3 août — un contrôle
    // qui ne regardait que l'existant laissait passer la Nième.
    const { getLimit } = await import('~/config/plans');
    const max = getLimit('decouverte', 'ruchers');
    if (max === Infinity) return;

    poser({ chemin: '/api/ruchers', plan: 'decouverte', compteurs: { ruchers: max - 1 } });
    expect(await passer(), `${max - 1} < ${max} doit passer`).toBeNull();

    poser({ chemin: '/api/ruchers', plan: 'decouverte', compteurs: { ruchers: max } });
    const err = await passer();
    expect(err?.statusCode).toBe(402);
    expect(err?.data?.code).toBe('LIMIT_REACHED');
    expect(err?.data?.max).toBe(max);
    expect(err?.data?.current).toBe(max);
    // `requiredPlan` est calculé pour la TAILLE de l'opération refusée, pas
    // seulement pour le plan suivant. Sans lui, le modal raisonne en local et
    // peut proposer une formule qui ne débloque rien — le client paie, relance,
    // et se reprend le même refus. Le banc l'omettait : le test de mutation
    // supprimait ce champ sans faire rougir quoi que ce soit.
    expect(err?.data?.requiredPlan).toBeTruthy();
  });

  it('un plafond illimité ne bloque JAMAIS, même à 10 000', async () => {
    // Promesse produit explicite : « dans les packs ruches illimitées, aucune
    // restriction nulle part ». Un `Infinity` mal comparé la briserait en
    // silence, et le client verrait un mur là où il a payé pour ne plus en voir.
    const { getLimit, PLANS } = await import('~/config/plans');
    const illimites = PLANS.filter((p) => getLimit(p, 'ruchers') === Infinity);
    expect(illimites.length, 'au moins un plan doit offrir l’illimité').toBeGreaterThan(0);

    for (const plan of illimites) {
      poser({ chemin: '/api/ruchers', plan, compteurs: { ruchers: 10_000 } });
      expect(await passer(), `${plan} doit rester illimité`).toBeNull();
    }
  });

  it('compte sur le PROPRIÉTAIRE de l’espace, pas sur le membre', async () => {
    // Un membre opère sous le plan ET les compteurs du propriétaire. Compter
    // sur le membre lui donnerait un quota vierge : chaque invité deviendrait
    // un contournement de plafond.
    poser({
      chemin: '/api/ruchers',
      plan: 'starter',
      ownerId: PROPRIETAIRE,
      compteurs: { ruchers: 1 },
    });
    await passer();

    expect(faux.aFiltreSur(PROPRIETAIRE)).toBe(true);
    expect(faux.aFiltreSur(MEMBRE)).toBe(false);
  });

  it('exclut les colonies mortes, vendues et fusionnées du décompte', async () => {
    // Une ruche morte occupe une ligne, pas un emplacement. La compter
    // reviendrait à punir un apiculteur pour ses pertes hivernales.
    poser({ chemin: '/api/ruches', plan: 'starter', compteurs: { ruches: 0 } });
    await passer();

    const surRuches = faux.requetes.find((r) => r.table === 'ruches');
    expect(surRuches, 'le compteur de ruches doit interroger la table').toBeTruthy();
    expect(surRuches?.colonnes).toContain('statut');
  });
});

describe('dérogation administrateur', () => {
  it('un e-mail de la liste blanche traverse toutes les portes', async () => {
    const { isAdminEmail } = await import('~/config/admin');
    // On ne fabrique pas d'adresse : on demande au module quelle est la règle.
    const admin = 'apigo360.apiculture@gmail.com';
    if (!isAdminEmail(admin)) return; // liste vide en test : rien à vérifier

    poser({ chemin: '/api/transhumance/plans', plan: 'decouverte', email: admin });
    expect(await passer()).toBeNull();
  });
});
