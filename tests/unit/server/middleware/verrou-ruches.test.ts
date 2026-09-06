// ═══════════════════════════════════════════════════════════════════════════
// 06.verrou-ruches — l'orchestration du verrou de cheptel.
//
// Ses fonctions pures sont déjà couvertes ailleurs : `collecterIdsRuches` et
// `idsRuchesAutorisees` ont leurs bancs, à 100 %. Ce qui n'était pas testé,
// c'est le middleware qui les enchaîne — et c'est là que vivent les décisions
// les plus délicates de tout le lot.
//
// ─── LA PROMESSE QU'IL PORTE ──────────────────────────────────────────────
// Au-delà du plafond, les ruches excédentaires deviennent inaccessibles SANS
// JAMAIS être supprimées. Le message le dit à l'apiculteur : « cette ruche
// reste enregistrée, un abonnement vous rend l'intégralité de votre cheptel,
// là où vous l'aviez laissé ». Trois exigences en découlent, et chacune peut
// se casser en silence :
//
//   1. Un plan ILLIMITÉ ne doit jamais rien verrouiller — ni même chercher.
//   2. Une ruche qui n'est PAS de l'espace ne doit pas produire un 402 : ce
//      serait révéler qu'elle existe chez quelqu'un d'autre. La route rendra
//      son 404, et c'est la bonne réponse.
//   3. Le refus doit porter de quoi en sortir : `rucheId`, `max`, et la
//      formule qui débloque.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createError, createEvent } from 'h3';
import { creerFauxDb, type FauxDb } from '../../../helpers/fauxDb';

const PROPRIETAIRE = '11111111-1111-1111-1111-111111111111';
const RUCHE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RUCHE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

/** Ensemble d'identifiants autorisés, piloté par chaque banc. */
let autorisees: Set<string> | null;
/** Nombre d'appels à `idsRuchesAutorisees` — sa NON-invocation est une garantie. */
let appelsAutorisees = 0;

// `idsRuchesAutorisees` est importé EXPLICITEMENT par le middleware (pas un
// auto-import) : on peut donc le doubler par chemin. Il a son propre banc à
// 100 % — le rejouer ici mesurerait deux fois la même chose au lieu de
// mesurer l'enchaînement.
vi.mock('~~/server/utils/quotaRuches', () => ({
  idsRuchesAutorisees: async () => {
    appelsAutorisees += 1;
    return autorisees;
  },
}));

// `readBody` attend un vrai flux de requête et met son résultat en cache
// derrière un symbole PRIVÉ, inatteignable de l'extérieur. Deux tentatives ont
// échoué avant celle-ci — l'une posait `Symbol.for('h3RawBody')` (mauvais
// symbole, corps jamais vu), l'autre fournissait un `Readable` que h3
// n'écoutait pas (attente infinie). Aucune des deux ne mettait le middleware en
// cause, et c'est précisément le risque : un banc rouge pour une raison
// d'outillage envoie chercher un défaut qui n'existe pas.
//
// On double donc la seule fonction en jeu, et rien d'autre de h3. Ce qu'on
// mesure ici est la logique du verrou, pas l'analyseur de corps de h3 — qui a
// ses propres tests, chez h3.
vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: async () => corpsCourant,
}));

let faux: FauxDb;
let etat: { plan: string; email: string; echecAuth: { statusCode?: number } | null };

function poser(options: Partial<typeof etat> & { possedees?: string[] } = {}) {
  etat = {
    plan: 'decouverte',
    email: 'apiculteur@exemple.fr',
    echecAuth: null,
    ...options,
  };
  faux = creerFauxDb({ ruches: (options.possedees ?? []).map((id) => ({ id })) });

  Object.assign(globalThis, {
    db: faux.db,
    createError,
    requireAuth: async () => {
      if (etat.echecAuth) throw etat.echecAuth;
      return { id: PROPRIETAIRE, email: etat.email };
    },
    resolveOwnerId: async () => PROPRIETAIRE,
    planDuProprietaire: async () => etat.plan,
    withDbRetry: <T>(fabrique: () => Promise<T>) => fabrique(),
  });
}

/** Corps de la requête en cours, servi à `readBody` par le double ci-dessous. */
let corpsCourant: unknown;

function requete(chemin: string, corps?: unknown, methode = 'POST') {
  corpsCourant = corps;
  const req = {
    url: chemin,
    method: corps === undefined ? 'GET' : methode,
    headers: {
      host: 'apigo.fr',
      ...(corps === undefined ? {} : { 'content-type': 'application/json' }),
    },
    socket: { remoteAddress: '10.0.0.1' },
  };
  return createEvent(req as never, { setHeader() {}, getHeader() {}, end() {} } as never);
}

async function passer(event: unknown) {
  const module = await import('~~/server/middleware/06.verrou-ruches');
  const handler = module.default as unknown as (e: unknown) => Promise<void>;
  try {
    await handler(event);
    return null;
  } catch (e) {
    return e as { statusCode?: number; data?: Record<string, unknown> };
  }
}

beforeEach(() => {
  autorisees = new Set([RUCHE_A]);
  appelsAutorisees = 0;
  poser();
});

describe('le verrou ne se déclenche que s’il a une raison', () => {
  it('ignore ce qui n’est pas une route d’API', async () => {
    expect(await passer(requete('/ruches'))).toBeNull();
    expect(faux.requetes).toHaveLength(0);
  });

  for (const exempt of ['/api/stripe/checkout', '/api/subscription/usage', '/api/public/demo']) {
    it(`n’intervient pas sur ${exempt}`, async () => {
      // Même raison qu'au gating : un compte verrouillé doit pouvoir atteindre
      // le paiement, sinon le verrou devient une impasse.
      expect(await passer(requete(exempt))).toBeNull();
      expect(faux.requetes).toHaveLength(0);
    });
  }

  it('n’intervient pas sur un chemin exempté, MÊME s’il nomme une ruche', async () => {
    // Les bancs ci-dessus ne prouvent pas que la liste d'exemptions sert : sans
    // ruche nommée, ces requêtes ressortaient de toute façon. Le test de
    // mutation l'a montré — supprimer la liste ne cassait rien.
    //
    // Ici la ruche est hors quota ET nommée dans le corps : seule l'exemption
    // peut empêcher le 402. C'est ce qui protège une future route sous
    // `/api/subscription/` — celle qui explique justement au client POURQUOI il
    // est bloqué — de se retrouver bloquée elle-même.
    poser({ possedees: [RUCHE_B] });
    autorisees = new Set([RUCHE_A]);

    expect(await passer(requete('/api/subscription/simuler', { rucheId: RUCHE_B }))).toBeNull();
  });

  it('ne coûte AUCUNE requête quand rien ne nomme de ruche', async () => {
    // 32 routes manipulent un `rucheId`, mais ce middleware s'exécute sur
    // TOUTES. S'il interrogeait la base à chaque appel, il ajouterait deux
    // allers-retours à chaque requête de l'application.
    expect(await passer(requete('/api/ruchers'))).toBeNull();
    expect(faux.requetes).toHaveLength(0);
  });
});

describe('plan illimité — la promesse commerciale', () => {
  for (const plan of ['pro', 'expert']) {
    it(`${plan} : aucune ruche verrouillée, et aucune requête de cheptel`, async () => {
      // « Dans les packs ruches illimitées, aucune restriction nulle part. »
      // Le middleware doit sortir AVANT d'interroger le cheptel — un plan
      // illimité ne doit rien coûter.
      poser({ plan, possedees: [RUCHE_A, RUCHE_B] });
      autorisees = new Set(); // même avec un ensemble vide, rien ne doit bloquer

      expect(await passer(requete(`/api/ruches/${RUCHE_B}`))).toBeNull();
      expect(faux.requetes.filter((r) => r.table === 'ruches')).toHaveLength(0);
    });
  }
});

describe('cloisonnement — une ruche d’autrui n’est pas « verrouillée »', () => {
  it('laisse la route répondre quand la ruche n’est pas de l’espace', async () => {
    // Point subtil et VOULU : renvoyer 402 « ruche verrouillée » pour une ruche
    // qui appartient à quelqu'un d'autre révélerait son existence. La route
    // rendra son 404, et c'est la bonne réponse — le verrou se tait.
    poser({ possedees: [] }); // la requête ne trouve aucune ruche de cet espace
    autorisees = new Set();

    expect(await passer(requete(`/api/ruches/${RUCHE_B}`))).toBeNull();

    // Et le calcul du quota n'est même pas lancé. Sans cette assertion, la
    // sortie anticipée pouvait disparaître sans rien casser — le contrôle
    // suivant (`!verrouillee`) rattrapait le cas. Le test de mutation l'a
    // montré : la branche existe pour ÉVITER UNE REQUÊTE, et c'est cela qu'il
    // faut mesurer, pas seulement le verdict final.
    expect(appelsAutorisees).toBe(0);
  });

  it('n’interroge le cheptel que sur l’espace du propriétaire', async () => {
    poser({ possedees: [RUCHE_A] });
    await passer(requete(`/api/ruches/${RUCHE_A}`));

    const surRuches = faux.requetes.find((r) => r.table === 'ruches');
    expect(surRuches?.colonnes).toContain('user_id');
    expect(surRuches?.valeurs).toContain(PROPRIETAIRE);
  });
});

describe('le verrou proprement dit', () => {
  it('laisse passer une ruche dans le quota', async () => {
    poser({ possedees: [RUCHE_A] });
    autorisees = new Set([RUCHE_A]);

    expect(await passer(requete(`/api/ruches/${RUCHE_A}`))).toBeNull();
  });

  it('refuse une ruche hors quota, et dit comment en sortir', async () => {
    poser({ possedees: [RUCHE_B] });
    autorisees = new Set([RUCHE_A]);

    const err = await passer(requete(`/api/ruches/${RUCHE_B}`));

    expect(err?.statusCode).toBe(402);
    expect(err?.data?.code).toBe('RUCHE_VERROUILLEE');
    // L'interface a besoin de l'identifiant pour désigner LA ruche concernée.
    expect(err?.data?.rucheId).toBe(RUCHE_B);
    expect(err?.data?.requiredPlan).toBeTruthy();
    // Et le message doit rassurer : rien n'est perdu.
    expect(String(err?.data?.message)).toMatch(/reste enregistrée/i);
  });

  it('repère une ruche nommée dans le CORPS, pas seulement dans l’URL', async () => {
    // 15 des 32 routes passent l'identifiant par le corps. Ne lire que le
    // chemin laisserait la moitié du verrou inopérante.
    poser({ possedees: [RUCHE_B] });
    autorisees = new Set([RUCHE_A]);

    const err = await passer(requete('/api/interventions', { rucheId: RUCHE_B }));
    expect(err?.statusCode).toBe(402);
  });

  it('repère une ruche IMBRIQUÉE dans le corps', async () => {
    poser({ possedees: [RUCHE_B] });
    autorisees = new Set([RUCHE_A]);

    const err = await passer(
      requete('/api/interventions/bulk', { exceptions: [{ rucheId: RUCHE_B }] }),
    );
    expect(err?.statusCode).toBe(402);
  });
});

describe('cas où le verrou s’efface', () => {
  it('un 401 propre est laissé à la route', async () => {
    poser({ echecAuth: { statusCode: 401 }, possedees: [RUCHE_B] });
    autorisees = new Set([RUCHE_A]);

    expect(await passer(requete(`/api/ruches/${RUCHE_B}`))).toBeNull();
  });

  it('un ensemble autorisé indisponible ne bloque pas', async () => {
    // `idsRuchesAutorisees` peut rendre `null` (plan illimité, ou lecture
    // impossible). Choix assumé : on laisse passer plutôt que de verrouiller
    // un cheptel entier sur un aléa de base.
    poser({ possedees: [RUCHE_B] });
    autorisees = null;

    expect(await passer(requete(`/api/ruches/${RUCHE_B}`))).toBeNull();
  });
});
