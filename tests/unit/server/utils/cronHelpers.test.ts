// ═══════════════════════════════════════════════════════════════════════════
// cron-helpers — la serrure des 20 tâches planifiées, et zéro banc.
//
// `vercel.json` déclare 20 passages quotidiens, chacun sur une URL PUBLIQUE de
// la forme `/api/cron/<tâche>`. Rien d'autre qu'`assertCronAuth` n'empêche un
// inconnu de les déclencher : envoyer des e-mails à tous les clients, recalculer
// des alertes, rétrograder des essais.
//
// Le mode de défaillance à redouter n'est pas le refus, c'est l'OUVERTURE
// SILENCIEUSE. Un secret absent de l'environnement — oubli au déploiement,
// variable renommée — ne doit pas rendre les crons librement appelables. Le
// commentaire du module dit qu'il refuse dans ce cas ; c'est exactement le
// genre d'affirmation qu'il faut vérifier plutôt que croire.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createError, createEvent } from 'h3';

Object.assign(globalThis, { createError });

function requete(entetes: Record<string, string> = {}) {
  return createEvent(
    { url: '/api/cron/alertes', method: 'GET', headers: { host: 'apigo.fr', ...entetes } } as never,
    { setHeader() {}, getHeader() {}, end() {} } as never,
  );
}

/** Exécute la garde ; rend l'erreur levée, ou `null` si elle laisse passer. */
async function garder(event: unknown): Promise<{ statusCode?: number } | null> {
  const { assertCronAuth } = await import('~~/server/utils/cron-helpers');
  try {
    assertCronAuth(event as never);
    return null;
  } catch (e) {
    return e as { statusCode?: number };
  }
}

afterEach(() => vi.unstubAllEnvs());

describe('assertCronAuth — la serrure', () => {
  it('REFUSE quand aucun secret n’est configuré', async () => {
    // LE cas qui compte. Une variable oubliée au déploiement ne doit pas
    // transformer 20 tâches en points d'entrée ouverts. Un code qui
    // comparerait naïvement `authHeader === 'Bearer ' + undefined` ou qui
    // sortirait tôt sur secret vide laisserait tout passer.
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('NUXT_CRON_SECRET', '');

    expect(await garder(requete({ authorization: 'Bearer ' }))).toMatchObject({
      statusCode: 401,
    });
  });

  it('refuse une requête sans en-tête d’autorisation', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    expect(await garder(requete())).toMatchObject({ statusCode: 401 });
  });

  it('refuse un mauvais secret', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    expect(await garder(requete({ authorization: 'Bearer mauvais-secret' }))).toMatchObject({
      statusCode: 401,
    });
  });

  it('refuse le bon secret sans le préfixe Bearer', async () => {
    // L'en-tête que pose Vercel est `Bearer <secret>`. Accepter le secret nu
    // élargirait la surface sans raison.
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    expect(await garder(requete({ authorization: 'secret-de-test' }))).toMatchObject({
      statusCode: 401,
    });
  });

  it('accepte le secret attendu', async () => {
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    expect(await garder(requete({ authorization: 'Bearer secret-de-test' }))).toBeNull();
  });

  it('accepte aussi le secret sous son nom Nuxt', async () => {
    // Vercel envoie `CRON_SECRET`, la configuration Nuxt expose
    // `NUXT_CRON_SECRET`. Les deux doivent marcher, sinon un déploiement
    // configuré d'un seul côté voit ses 20 tâches refusées en silence — et les
    // alertes cessent d'arriver sans que personne ne le remarque.
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('NUXT_CRON_SECRET', 'secret-nuxt');
    expect(await garder(requete({ authorization: 'Bearer secret-nuxt' }))).toBeNull();
  });

  it('ne se laisse pas berner par un préfixe correct', async () => {
    // Comparaison sur la chaîne ENTIÈRE : un secret qui commence bien mais
    // continue autrement doit être refusé.
    vi.stubEnv('CRON_SECRET', 'secret-de-test');
    expect(await garder(requete({ authorization: 'Bearer secret-de-test-et-plus' }))).toMatchObject(
      { statusCode: 401 },
    );
  });
});

describe('processInBatches — avancer sans saturer le pool', () => {
  it('traite tous les éléments', async () => {
    const { processInBatches } = await import('~~/server/utils/cron-helpers');
    const { results } = await processInBatches([1, 2, 3, 4, 5], 2, async (n) => n * 10);
    expect(results.sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50]);
  });

  it('borne réellement le parallélisme', async () => {
    // La raison d'être de la fonction : le pooler Supabase plafonne à
    // 60 connexions. Tout lancer d'un coup le sature et fait échouer le cron
    // entier — avec des erreurs de connexion qu'on lira comme un bug métier.
    const { processInBatches } = await import('~~/server/utils/cron-helpers');
    let enCours = 0;
    let maximum = 0;

    await processInBatches(
      Array.from({ length: 20 }, (_, i) => i),
      3,
      async () => {
        enCours += 1;
        maximum = Math.max(maximum, enCours);
        await new Promise((r) => setTimeout(r, 1));
        enCours -= 1;
      },
    );

    expect(maximum).toBeLessThanOrEqual(3);
  });

  it('collecte les échecs SANS tout annuler', async () => {
    // Un cron doit rapporter qui a échoué, pas s'arrêter au premier. Sinon un
    // seul e-mail invalide prive tous les suivants de leur notification.
    const { processInBatches } = await import('~~/server/utils/cron-helpers');
    const { results, errors } = await processInBatches([1, 2, 3, 4], 2, async (n) => {
      if (n % 2 === 0) throw new Error(`échec sur ${n}`);
      return n;
    });

    expect(results.sort()).toEqual([1, 3]);
    expect(errors.map((e) => e.item).sort()).toEqual([2, 4]);
  });

  it('supporte une liste vide', async () => {
    const { processInBatches } = await import('~~/server/utils/cron-helpers');
    const { results, errors } = await processInBatches([], 5, async (n) => n);
    expect(results).toEqual([]);
    expect(errors).toEqual([]);
  });
});

describe('paginateByCursor — parcourir sans tout charger', () => {
  it('enchaîne les pages jusqu’à épuisement', async () => {
    const { paginateByCursor } = await import('~~/server/utils/cron-helpers');
    const tout = Array.from({ length: 7 }, (_, i) => ({ id: `id-${i}` }));

    const pages: string[][] = [];
    for await (const page of paginateByCursor(async (curseur, taille) => {
      const depart = curseur ? tout.findIndex((x) => x.id === curseur) + 1 : 0;
      return tout.slice(depart, depart + taille);
    }, 3)) {
      pages.push(page.map((x) => x.id));
    }

    // 3 + 3 + 1 : la dernière page incomplète arrête la boucle.
    expect(pages).toEqual([['id-0', 'id-1', 'id-2'], ['id-3', 'id-4', 'id-5'], ['id-6']]);
  });

  it('s’arrête immédiatement sur une table vide', async () => {
    const { paginateByCursor } = await import('~~/server/utils/cron-helpers');
    let appels = 0;
    const pages = [];
    for await (const page of paginateByCursor(async () => {
      appels += 1;
      return [];
    }, 10)) {
      pages.push(page);
    }
    expect(pages).toEqual([]);
    expect(appels, 'une seule interrogation suffit').toBe(1);
  });

  it('ne boucle pas indéfiniment quand une page est pleine puis vide', async () => {
    // Le piège classique d'une pagination par curseur : une page exactement
    // pleine relance la boucle, et si la suivante est vide il faut sortir. Une
    // condition mal posée tournerait sans fin — dans un cron, jusqu'au timeout
    // de la lambda, chaque nuit.
    const { paginateByCursor } = await import('~~/server/utils/cron-helpers');
    let tour = 0;
    const pages = [];
    for await (const page of paginateByCursor(async () => {
      tour += 1;
      return tour === 1 ? [{ id: 'a' }, { id: 'b' }] : [];
    }, 2)) {
      pages.push(page.length);
      if (tour > 5) throw new Error('boucle infinie');
    }
    expect(pages).toEqual([2]);
    expect(tour).toBe(2);
  });
});
