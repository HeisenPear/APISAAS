// ═══════════════════════════════════════════════════════════════════════════
// Les trois middlewares restants : en-têtes de sécurité, taille de corps, auth.
//
// 108 lignes à eux trois, 0 % de couverture — et l'un d'eux porte une politique
// qui a DÉJÀ cassé le produit une fois. Son propre commentaire le raconte :
// `Permissions-Policy` était `microphone=()`, ce qui coupait la dictée vocale
// de Maya sur l'ensemble du site. Rien ne l'avait vu venir, et rien n'empêche
// aujourd'hui que ça recommence.
//
// Un en-tête de sécurité se règle une fois et ne se relit jamais. Sa
// particularité est de casser SILENCIEUSEMENT : la CSP ne lève aucune erreur
// serveur, elle bloque juste une requête dans le navigateur d'un client. Ces
// bancs verrouillent donc ce qui doit rester ouvert autant que ce qui doit
// rester fermé.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEvent, defineEventHandler } from 'h3';

// `01.auth` utilise `defineEventHandler` en AUTO-IMPORT — contrairement aux
// deux autres, qui l'importent explicitement de h3. Sans ce dépôt sur
// `globalThis`, son import échoue sur « defineEventHandler is not defined ».
Object.assign(globalThis, { defineEventHandler });

/** Un événement dont on peut relire les en-têtes posés. */
function requete(chemin: string, methode = 'GET', entetes: Record<string, string> = {}) {
  const poses: Record<string, string> = {};
  const event = createEvent(
    {
      url: chemin,
      method: methode,
      headers: { host: 'apigo.fr', ...entetes },
      socket: { remoteAddress: '10.0.0.1' },
    } as never,
    {
      setHeader(nom: string, valeur: string) {
        poses[nom] = String(valeur);
      },
      getHeader: () => undefined,
      end() {},
    } as never,
  );
  return { event, poses };
}

async function executer(fichier: string, event: unknown) {
  const module = await import(`~~/server/middleware/${fichier}`);
  const handler = module.default as unknown as (e: unknown) => unknown;
  try {
    await handler(event);
    return null;
  } catch (e) {
    return e as { statusCode?: number; message?: string };
  }
}

afterEach(() => vi.unstubAllEnvs());

describe('02.security-headers — ce qui doit rester ouvert', () => {
  /** Les en-têtes tels que posés en production. */
  async function enProduction() {
    vi.stubEnv('NODE_ENV', 'production');
    const { event, poses } = requete('/');
    await executer('02.security-headers', event);
    return poses;
  }

  it('laisse le micro à Maya', async () => {
    // LA régression déjà vécue. `microphone=()` coupe la dictée vocale sur tout
    // le site — sans erreur serveur, sans log, sans rien : le navigateur refuse
    // silencieusement l'accès et l'apiculteur voit un bouton qui ne fait rien.
    const poses = await enProduction();
    expect(poses['Permissions-Policy']).toMatch(/microphone=\(self\)/);
  });

  it('laisse la caméra au scanner de QR codes', async () => {
    const poses = await enProduction();
    expect(poses['Permissions-Policy']).toMatch(/camera=\(self\)/);
  });

  it('laisse passer le paiement Stripe', async () => {
    // Trois autorisations sont nécessaires au parcours de paiement : charger le
    // script, l'afficher dans un cadre, et lui parler. En retirer une casse
    // l'encaissement sans que le serveur s'en aperçoive.
    const csp = (await enProduction())['Content-Security-Policy'] ?? '';
    expect(csp, 'script Stripe').toMatch(/script-src[^;]*js\.stripe\.com/);
    expect(csp, 'cadre Stripe').toMatch(/frame-src[^;]*js\.stripe\.com/);
    expect(csp, 'API Stripe').toMatch(/connect-src[^;]*api\.stripe\.com/);
  });

  it('laisse l’application parler à sa propre base', async () => {
    // Sans Supabase en `connect-src`, l'application ne peut plus rien lire :
    // elle s'affiche, et reste vide.
    const csp = (await enProduction())['Content-Security-Policy'] ?? '';
    expect(csp).toMatch(/connect-src[^;]*supabase\.co/);
    expect(csp, 'temps réel (WebSocket)').toMatch(/connect-src[^;]*wss:\/\/\*\.supabase\.co/);
  });

  it('laisse charger les fonds de carte et la météo', async () => {
    const poses = await enProduction();
    const csp = poses['Content-Security-Policy'] ?? '';
    expect(csp, 'tuiles OpenStreetMap').toMatch(/img-src[^;]*tile\.openstreetmap\.org/);
    expect(csp, 'Open-Meteo').toMatch(/connect-src[^;]*api\.open-meteo\.com/);
  });
});

describe('02.security-headers — ce qui doit rester fermé', () => {
  async function enProduction() {
    vi.stubEnv('NODE_ENV', 'production');
    const { event, poses } = requete('/');
    await executer('02.security-headers', event);
    return poses;
  }

  it('interdit l’encadrement du site (clickjacking)', async () => {
    const poses = await enProduction();
    expect(poses['X-Frame-Options']).toBe('DENY');
    expect(poses['Content-Security-Policy']).toMatch(/frame-ancestors 'none'/);
  });

  it('interdit les greffons et le détournement de la base d’URL', async () => {
    const csp = (await enProduction())['Content-Security-Policy'] ?? '';
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/base-uri 'self'/);
    expect(csp).toMatch(/form-action 'self'/);
  });

  it('n’autorise PAS `unsafe-eval`', async () => {
    // Le commentaire du module dit qu'il a été retiré volontairement. Sans
    // banc, il reviendrait au premier copier-coller depuis une réponse en ligne.
    const csp = (await enProduction())['Content-Security-Policy'] ?? '';
    expect(csp).not.toMatch(/unsafe-eval/);
  });

  it('impose HTTPS pour deux ans', async () => {
    const poses = await enProduction();
    expect(poses['Strict-Transport-Security']).toMatch(/max-age=63072000/);
  });

  it('signale les violations à l’endpoint prévu', async () => {
    const csp = (await enProduction())['Content-Security-Policy'] ?? '';
    expect(csp).toMatch(/report-uri \/api\/security\/csp-report/);
  });
});

describe('02.security-headers — en développement', () => {
  it('pose le strict minimum, sans CSP', async () => {
    // La CSP est désactivée en dev parce que le rechargement à chaud de Vite
    // ouvre des ports dynamiques impossibles à lister. Le prix : ce qu'on teste
    // en local n'est PAS ce qui protège en production — d'où l'intérêt des
    // bancs ci-dessus, qui sont le seul endroit où la politique réelle est vue.
    vi.stubEnv('NODE_ENV', 'development');
    const { event, poses } = requete('/');
    await executer('02.security-headers', event);

    expect(poses['X-Frame-Options']).toBe('DENY');
    expect(poses['X-Content-Type-Options']).toBe('nosniff');
    expect(poses['Content-Security-Policy']).toBeUndefined();
    expect(poses['Strict-Transport-Security']).toBeUndefined();
  });
});

describe('05.body-size — plafond de charge utile', () => {
  const MO = 1024 * 1024;

  it('ignore ce qui n’est pas une route d’API', async () => {
    const { event } = requete('/tarifs', 'POST', { 'content-length': String(50 * MO) });
    expect(await executer('05.body-size', event)).toBeNull();
  });

  it('ignore les lectures', async () => {
    const { event } = requete('/api/ruchers', 'GET', { 'content-length': String(50 * MO) });
    expect(await executer('05.body-size', event)).toBeNull();
  });

  it('laisse passer un corps sans `Content-Length` (transfert par morceaux)', async () => {
    // Choix assumé : l'en-tête vient du client et peut manquer. Vercel borne de
    // toute façon à ~4,5 Mo en amont ; cette couche est coopérative.
    const { event } = requete('/api/ruchers', 'POST');
    expect(await executer('05.body-size', event)).toBeNull();
  });

  it('refuse un `Content-Length` qui n’est pas un nombre', async () => {
    const { event } = requete('/api/ruchers', 'POST', { 'content-length': 'beaucoup' });
    expect(await executer('05.body-size', event)).toMatchObject({ statusCode: 400 });
  });

  it('accepte 1 Mo pile sur une route ordinaire, refuse au-delà', async () => {
    const juste = requete('/api/ruchers', 'POST', { 'content-length': String(1 * MO) });
    expect(await executer('05.body-size', juste.event)).toBeNull();

    const trop = requete('/api/ruchers', 'POST', { 'content-length': String(1 * MO + 1) });
    expect(await executer('05.body-size', trop.event)).toMatchObject({ statusCode: 413 });
  });

  it('accorde 6 Mo aux routes d’envoi de fichiers', async () => {
    // LE banc discriminant : 2 Mo dépassent la limite ordinaire mais doivent
    // passer sur une route de photo. Sans le plafond dédié, envoyer une photo
    // de ruche depuis un téléphone récent échouerait — un usage parfaitement
    // légitime, refusé par une protection anti-déni de service.
    for (const chemin of ['/api/photos/upload', '/api/profils/logo']) {
      const { event } = requete(chemin, 'POST', { 'content-length': String(2 * MO) });
      expect(await executer('05.body-size', event), chemin).toBeNull();
    }
  });

  it('refuse tout de même au-delà de 6 Mo sur ces routes', async () => {
    const { event } = requete('/api/photos/upload', 'POST', {
      'content-length': String(6 * MO + 1),
    });
    expect(await executer('05.body-size', event)).toMatchObject({ statusCode: 413 });
  });
});

describe('01.auth — inerte, et c’est voulu', () => {
  it('ne bloque rien', async () => {
    // Ce fichier existe mais ne protège RIEN : son propre en-tête le dit,
    // l'authentification se fait route par route via `requireAuth`. Le banc est
    // là pour que personne ne le prenne pour une barrière — un middleware nommé
    // « auth » invite à supposer qu'il en est une.
    const { event } = requete('/api/ruchers', 'POST');
    expect(await executer('01.auth', event)).toBeNull();
  });
});
