import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * « ZÉRO » NE DIT PAS POURQUOI, ET ÇA A COÛTÉ DES HEURES.
 *
 * `sendPushBatchToUser` renvoyait un nombre. Trois situations parfaitement
 * distinctes rendaient toutes `0` : clés VAPID absentes (le serveur est mal
 * configuré), aucun appareil abonné (l'utilisateur n'a rien activé), et des
 * abonnements tous révoqués par le navigateur.
 *
 * En bout de chaîne, la route de test renvoyait 200 sur un envoi à personne, et
 * l'écran affichait « Notification de test envoyée » EN VERT. L'apiculteur
 * voyait un succès, ne recevait rien, et aucune trace nulle part ne disait où
 * ça coinçait.
 *
 * Ce banc verrouille la distinction. Il ne teste PAS l'envoi réel (il faudrait
 * un service push) : il teste que chaque cause d'échec porte son propre nom.
 */

const etatDb: { prefs: Record<string, unknown> } = { prefs: {} };

vi.mock('~~/server/database/schema', () => ({ profils: { id: 'id', preferences: 'preferences' } }));

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
  inArray: () => ({}),
  sql: Object.assign(() => ({}), { raw: () => ({}) }),
}));

const envoisFaits: string[] = [];
let refuseTout = false;

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: async (sub: { endpoint: string }) => {
      if (refuseTout) throw Object.assign(new Error('gone'), { statusCode: 410 });
      envoisFaits.push(sub.endpoint);
    },
  },
}));

let vapid = { pub: 'cle-publique', priv: 'cle-privee' };

beforeEach(() => {
  envoisFaits.length = 0;
  refuseTout = false;
  vapid = { pub: 'cle-publique', priv: 'cle-privee' };
  etatDb.prefs = {};
  Object.assign(globalThis, {
    useRuntimeConfig: () => ({
      public: { vapidPublicKey: vapid.pub },
      vapidPrivateKey: vapid.priv,
      vapidSubject: 'mailto:test@apigo.fr',
    }),
    db: {
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [{ preferences: etatDb.prefs }] }) }),
      }),
      update: () => ({ set: () => ({ where: async () => {} }) }),
      execute: async () => {},
    },
    withDbRetry: async (fn: () => unknown) => fn(),
  });
});

afterEach(() => vi.resetModules());

async function envoyer(payloads = [{ title: 'T', body: 'B' }]) {
  const { sendPushBatchToUser } = await import('~~/server/utils/webPush');
  return sendPushBatchToUser('user-1', payloads);
}

const avecAppareils = (n: number) => {
  etatDb.prefs = {
    webPushSubscriptions: Array.from({ length: n }, (_, i) => ({
      endpoint: `https://push.example/${i}`,
      keys: { p256dh: 'x'.repeat(20), auth: 'y'.repeat(20) },
    })),
  };
};

describe('chaque échec porte son propre nom', () => {
  it('clés VAPID absentes → « vapid-absent », jamais un zéro muet', async () => {
    // Erreur d'EXPLOITATION : un cron tournerait tous les jours sans rien
    // envoyer, en rapportant un succès. C'est la cause la plus coûteuse à
    // diagnostiquer, parce qu'elle ne ressemble à rien.
    vapid = { pub: '', priv: '' };
    avecAppareils(2);
    const r = await envoyer();
    expect(r.raison).toBe('vapid-absent');
    expect(r.envoyes).toBe(0);
  });

  it('la clé PRIVÉE seule manquante suffit à tout bloquer', async () => {
    // La route publique /api/push/vapid-key n'expose que la clé PUBLIQUE : on
    // peut donc la voir renseignée et n'avoir quand même aucune notification.
    vapid = { pub: 'cle-publique', priv: '' };
    avecAppareils(1);
    expect((await envoyer()).raison).toBe('vapid-absent');
  });

  it('aucun appareil abonné → « aucun-abonnement »', async () => {
    etatDb.prefs = {};
    const r = await envoyer();
    expect(r.raison).toBe('aucun-abonnement');
    expect(r.envoyes).toBe(0);
  });

  it('des appareils tous révoqués → « tous-refuses », pas « aucun-abonnement »', async () => {
    /**
     * La distinction qui compte pour l'utilisateur : « tu n'as rien activé » et
     * « ton navigateur a retiré l'autorisation » appellent deux gestes
     * différents. Les confondre envoie réactiver ce qui l'est déjà.
     */
    avecAppareils(2);
    refuseTout = true;
    const r = await envoyer();
    expect(r.raison).toBe('tous-refuses');
    expect(r.envoyes).toBe(0);
  });

  it('un envoi réel → « ok » et le compte d’appareils touchés', async () => {
    avecAppareils(3);
    const r = await envoyer();
    expect(r.raison).toBe('ok');
    expect(r.envoyes).toBe(3);
    expect(envoisFaits).toHaveLength(3);
  });

  it('rien à envoyer n’est pas une panne', async () => {
    // Cas nominal : une liste vide ne doit pas alarmer.
    avecAppareils(2);
    const r = await envoyer([]);
    expect(r.raison).toBe('rien-a-envoyer');
    expect(envoisFaits).toHaveLength(0);
  });

  it('sans VAPID, on ne touche même pas la base', async () => {
    // Un cron qui tourne mal configuré ne doit pas marteler la base pour rien.
    vapid = { pub: '', priv: '' };
    avecAppareils(2);
    await envoyer();
    expect(envoisFaits).toHaveLength(0);
  });
});
