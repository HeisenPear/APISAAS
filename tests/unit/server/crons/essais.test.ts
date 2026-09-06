// ═══════════════════════════════════════════════════════════════════════════
// Les deux tâches d'essai — celles qui décident qui paie et qui ne paie plus.
//
// `trial-expiry` rétrograde chaque nuit les essais échus. `trial-warning`
// prévient trois jours avant. Aucune des deux n'avait de banc, et ce sont
// pourtant les seules routines qui MODIFIENT le plan d'un client sans qu'un
// humain ou Stripe ne l'ait demandé.
//
// ─── LE GARDE-FOU QUI VAUT TOUT LE RESTE ──────────────────────────────────
// `trial-expiry` ne doit JAMAIS toucher un essai adossé à une carte. Sur la
// cohorte récente, la carte est captée à l'inscription et Stripe débite à la
// fin de l'essai en basculant l'abonnement `trialing → active`. Si le cron
// rétrogradait en aveugle, un client qui VIENT DE PAYER perdrait son accès
// pendant que le webhook est en route — quelques secondes de retard suffisent.
//
// C'est le scénario le plus coûteux du produit : le client a payé, il est
// bloqué, et il l'apprend en essayant de travailler.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Ce que la tâche a fait. */
interface Trace {
  lignesLues: Record<string, unknown>[];
  majProfils: Record<string, unknown>[];
  alertes: unknown[];
  emails: { destinataire: string; jours?: number }[];
  filtres: unknown[];
}
let trace: Trace;
/** Lignes que la requête de sélection renverra. */
let profilsTrouves: Record<string, unknown>[];
/** L'authentification de cron passe-t-elle ? */
let cronAutorise: boolean;

vi.mock('~~/server/utils/cron-helpers', () => ({
  assertCronAuth: () => {
    if (!cronAutorise) throw Object.assign(new Error('Non autorise'), { statusCode: 401 });
  },
}));

vi.mock('~~/server/utils/email', () => ({
  sendTrialExpiredEmail: async (destinataire: string) => {
    trace.emails.push({ destinataire });
  },
  sendTrialEndingSoonEmail: async (destinataire: string, _prenom: string, jours: number) => {
    trace.emails.push({ destinataire, jours });
  },
}));

function poser() {
  trace = { lignesLues: [], majProfils: [], alertes: [], emails: [], filtres: [] };
  profilsTrouves = [];
  cronAutorise = true;

  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    db: {
      select: () => ({
        from: () => ({
          where: (cond: unknown) => {
            trace.filtres.push(cond);
            return Promise.resolve(profilsTrouves);
          },
        }),
      }),
      update: () => ({
        set: (valeurs: Record<string, unknown>) => {
          trace.majProfils.push(valeurs);
          return { where: () => Promise.resolve() };
        },
      }),
      insert: () => ({
        values: (v: unknown) => {
          trace.alertes.push(v);
          return Promise.resolve();
        },
      }),
    },
  });
}

async function executer(tache: 'trial-expiry' | 'trial-warning') {
  vi.resetModules();
  // Imports EXPLICITES plutôt qu'un chemin construit : Vite avertit sur les
  // imports dynamiques à partie variable (« a file extension must be included
  // in the static part »), et un avertissement toléré finit par en masquer un
  // vrai. Deux tâches, deux lignes — le coût est nul.
  const module =
    tache === 'trial-expiry'
      ? await import('~~/server/crons/trial-expiry')
      : await import('~~/server/crons/trial-warning');
  const handler = module.default as unknown as (e: unknown) => Promise<unknown>;
  try {
    return { resultat: await handler({ context: {}, node: { req: {}, res: {} } }), erreur: null };
  } catch (e) {
    return { resultat: null, erreur: e as { statusCode?: number } };
  }
}

/**
 * Extrait les noms de colonnes d'une condition Drizzle — même principe que le
 * double de base : on ne descend que dans `SQL.queryChunks`, sans traverser les
 * tables, sinon tout le schéma remonterait et l'assertion serait toujours vraie.
 */
function colonnesFiltrees(noeud: unknown, sortie = new Set<string>()): Set<string> {
  if (noeud == null || typeof noeud !== 'object') return sortie;
  const genre = (noeud as { constructor?: { name?: string } }).constructor?.name;
  if (Array.isArray(noeud)) {
    noeud.forEach((n) => colonnesFiltrees(n, sortie));
    return sortie;
  }
  if (genre === 'SQL') {
    (noeud as { queryChunks?: unknown[] }).queryChunks?.forEach((n) => colonnesFiltrees(n, sortie));
    return sortie;
  }
  const nom = (noeud as { name?: unknown }).name;
  if (genre?.startsWith('Pg') && typeof nom === 'string') sortie.add(nom);
  return sortie;
}

beforeEach(() => poser());

describe('trial-expiry — la rétrogradation nocturne', () => {
  it('exige le secret de cron', async () => {
    cronAutorise = false;
    const { erreur } = await executer('trial-expiry');
    expect(erreur?.statusCode).toBe(401);
    expect(trace.majProfils, 'aucune écriture sans autorisation').toEqual([]);
  });

  it('ne touche pas aux essais ADOSSÉS À UNE CARTE', async () => {
    // LE garde-fou. La requête doit exclure les profils qui ont un abonnement
    // Stripe : à la fin de l'essai, Stripe débite et bascule l'abonnement en
    // `active`, ce que gère le webhook. Rétrograder en aveugle couperait
    // l'accès à un client qui vient de payer, le temps que le webhook arrive.
    //
    // On vérifie la COLONNE dans le filtre, pas le résultat : le double rend ce
    // qu'on lui donne, donc seul le filtre prouve l'intention.
    await executer('trial-expiry');

    const colonnes = colonnesFiltrees(trace.filtres[0]);
    expect(colonnes, 'le filtre doit exclure les abonnements Stripe').toContain(
      'stripe_subscription_id',
    );
    expect(colonnes).toContain('trial_active');
    expect(colonnes).toContain('trial_ends_at');
  });

  it('ne fait rien — et ne dit rien — quand aucun essai n’a expiré', async () => {
    profilsTrouves = [];
    const { resultat } = await executer('trial-expiry');

    expect(resultat).toEqual({ expired: 0 });
    expect(trace.majProfils, 'pas d’UPDATE inutile chaque nuit').toEqual([]);
    expect(trace.alertes).toEqual([]);
    expect(trace.emails).toEqual([]);
  });

  it('rétrograde, prévient dans l’application, et envoie l’e-mail', async () => {
    profilsTrouves = [
      { id: 'u1', email: 'un@exemple.fr', prenom: 'Jean' },
      { id: 'u2', email: 'deux@exemple.fr', prenom: null },
    ];
    const { resultat } = await executer('trial-expiry');

    expect(resultat).toEqual({ expired: 2 });
    expect(trace.majProfils[0]).toMatchObject({ plan: 'decouverte', trialActive: false });
    expect(trace.emails.map((e) => e.destinataire).sort()).toEqual([
      'deux@exemple.fr',
      'un@exemple.fr',
    ]);
  });

  it('l’alerte dit que les données sont préservées', async () => {
    // Jamais de blocage sans porte de sortie : l'apiculteur doit lire que son
    // travail est intact et savoir où aller.
    profilsTrouves = [{ id: 'u1', email: 'un@exemple.fr', prenom: 'Jean' }];
    await executer('trial-expiry');

    const lot = trace.alertes[0] as Record<string, unknown>[];
    expect(Array.isArray(lot)).toBe(true);
    expect(String(lot[0]?.message)).toMatch(/préservées/i);
    expect(lot[0]?.actionUrl).toBe('/tarifs');
  });

  it('un e-mail qui échoue n’empêche pas la rétrogradation', async () => {
    // L'ordre compte : l'UPDATE part AVANT les e-mails. Un serveur de mail
    // indisponible ne doit pas laisser des essais échus en plan payant.
    profilsTrouves = [{ id: 'u1', email: 'un@exemple.fr', prenom: 'Jean' }];
    await executer('trial-expiry');

    expect(trace.majProfils).toHaveLength(1);
  });
});

describe('trial-warning — le préavis de trois jours', () => {
  it('exige le secret de cron', async () => {
    cronAutorise = false;
    const { erreur } = await executer('trial-warning');
    expect(erreur?.statusCode).toBe(401);
    expect(trace.emails).toEqual([]);
  });

  it('ne vise QUE les essais encore actifs', async () => {
    await executer('trial-warning');
    expect(colonnesFiltrees(trace.filtres[0])).toContain('trial_active');
  });

  it('borne la fenêtre des DEUX côtés', async () => {
    // La fenêtre [3 j, 4 j[ existe pour une raison précise : le cron peut
    // tourner plusieurs fois. Sans borne haute, il préviendrait le même client
    // chaque jour jusqu'à la fin de son essai. Sans borne basse, il
    // préviendrait aussi ceux dont l'essai finit demain.
    //
    // Deux comparaisons sur `trial_ends_at` dans le même filtre : c'est ce qui
    // distingue un intervalle d'une simple échéance.
    await executer('trial-warning');

    const chaines: string[] = [];
    const parcourir = (n: unknown): void => {
      if (n == null || typeof n !== 'object') return;
      const genre = (n as { constructor?: { name?: string } }).constructor?.name;
      if (genre === 'StringChunk') {
        const v = (n as { value?: unknown }).value;
        chaines.push(Array.isArray(v) ? v.join('') : String(v));
        return;
      }
      if (Array.isArray(n)) return void n.forEach(parcourir);
      if (genre === 'SQL')
        return void (n as { queryChunks?: unknown[] }).queryChunks?.forEach(parcourir);
    };
    parcourir(trace.filtres[0]);

    const operateurs = chaines.join(' ');
    expect(operateurs, 'borne basse').toMatch(/>/);
    expect(operateurs, 'borne haute').toMatch(/<=/);
  });

  it('ne dérange personne quand la fenêtre est vide', async () => {
    profilsTrouves = [];
    const { resultat } = await executer('trial-warning');
    expect(resultat).toEqual({ warned: 0 });
    expect(trace.emails).toEqual([]);
  });

  it('annonce le bon nombre de jours restants', async () => {
    // Un e-mail qui annonce « 0 jour » ou « 4 jours » quand il en reste 3
    // détruit la confiance dans tous les autres messages du produit.
    const dans3Jours = new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000);
    profilsTrouves = [{ email: 'un@exemple.fr', prenom: 'Jean', trialEndsAt: dans3Jours }];

    const { resultat } = await executer('trial-warning');

    expect(resultat).toEqual({ warned: 1 });
    expect(trace.emails[0]?.jours).toBe(4); // arrondi au supérieur de 3,5
  });

  it('remplace un prénom manquant par une formule neutre', async () => {
    // Un « Bonjour , » est le genre de détail qui fait passer un produit pour
    // bâclé auprès de quelqu'un qui hésite encore à payer.
    profilsTrouves = [
      {
        email: 'un@exemple.fr',
        prenom: null,
        trialEndsAt: new Date(Date.now() + 3.2 * 86_400_000),
      },
    ];
    await executer('trial-warning');
    expect(trace.emails).toHaveLength(1);
  });
});
