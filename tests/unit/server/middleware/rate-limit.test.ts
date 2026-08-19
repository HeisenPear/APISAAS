// ═══════════════════════════════════════════════════════════════════════════
// 03.rate-limit — 248 lignes, 0 % de couverture. Six seaux, aucun vérifié.
//
// C'est la seule protection contre l'abus des routes publiques : création de
// comptes en masse, spam de commandes sur une campagne, force brute sur un
// jeton de calendrier. Elle est aussi la plus facile à casser sans s'en rendre
// compte — un seau qui compte au mauvais endroit, une fenêtre qui ne se
// réinitialise jamais, et soit on laisse tout passer, soit on bloque un
// apiculteur légitime au bout de trois clics.
//
// ─── DEUX PIÈGES DE BANC, TRAITÉS ICI ─────────────────────────────────────
//
// 1. Les compteurs sont des `Map` au niveau du MODULE : ils survivent d'un
//    test à l'autre. Sans `vi.resetModules()`, le second test hérite du seau
//    du premier et les seuils deviennent illisibles.
//
// 2. Les fenêtres se mesurent en heures. On ne les attend pas : `vi.useFakeTimers`
//    fait avancer l'horloge. Un banc qui dormirait vraiment une heure serait
//    supprimé au premier passage en CI.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEvent } from 'h3';

/** Un événement h3 réel — le middleware lit l'URL, la méthode et les en-têtes. */
function requete(chemin: string, ip: string, methode = 'POST') {
  return createEvent(
    {
      url: chemin,
      method: methode,
      headers: { host: 'apigo.fr', 'x-vercel-forwarded-for': ip },
      socket: { remoteAddress: '10.0.0.1' },
    } as never,
    { setHeader() {}, getHeader() {}, end() {} } as never,
  );
}

/** Charge une instance NEUVE du middleware — seaux vides. */
async function limiteurNeuf() {
  vi.resetModules();
  const module = await import('~~/server/middleware/03.rate-limit');
  return module.default as unknown as (e: unknown) => Promise<void>;
}

/** Rejoue N requêtes ; rend le rang de la première refusée, ou null. */
async function refuseAuRang(
  limiteur: (e: unknown) => Promise<void>,
  chemin: string,
  ip: string,
  methode: string,
  essais: number,
): Promise<number | null> {
  for (let i = 1; i <= essais; i++) {
    try {
      await limiteur(requete(chemin, ip, methode));
    } catch (e) {
      expect((e as { statusCode?: number }).statusCode, 'un refus doit être un 429').toBe(429);
      return i;
    }
  }
  return null;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('périmètre — on ne compte que ce qui doit l’être', () => {
  it('ignore tout ce qui n’est pas sous /api/', async () => {
    const limiteur = await limiteurNeuf();
    // 500 chargements de la page d'accueil ne doivent jamais produire un 429 :
    // le limiteur ne protège que les routes serveur.
    expect(await refuseAuRang(limiteur, '/tarifs', '203.0.113.1', 'GET', 500)).toBeNull();
  });

  it('compte par IP, pas globalement', async () => {
    // Le point qui décide si un seul visiteur agressif peut fermer le service
    // à tous les autres. Une clé mal composée — ou absente — ferait exactement
    // ça : le 101ᵉ appel de N'IMPORTE QUI serait refusé.
    const limiteur = await limiteurNeuf();
    expect(await refuseAuRang(limiteur, '/api/ruchers', '203.0.113.2', 'POST', 100)).toBeNull();
    // Une autre IP repart de zéro.
    expect(await refuseAuRang(limiteur, '/api/ruchers', '203.0.113.3', 'POST', 100)).toBeNull();
  });
});

describe('seau général — 100 requêtes par minute', () => {
  it('accepte les 100 premières, refuse la 101ᵉ', async () => {
    const limiteur = await limiteurNeuf();
    expect(await refuseAuRang(limiteur, '/api/ruchers', '203.0.113.4', 'POST', 101)).toBe(101);
  });

  it('la fenêtre se rouvre après une minute', async () => {
    // Sans réinitialisation, un apiculteur actif serait banni définitivement au
    // premier pic d'usage — la limite n'est pas une sanction, c'est un débit.
    const limiteur = await limiteurNeuf();
    await refuseAuRang(limiteur, '/api/ruchers', '203.0.113.5', 'POST', 101);

    vi.advanceTimersByTime(60_001);
    await expect(limiteur(requete('/api/ruchers', '203.0.113.5'))).resolves.toBeUndefined();
  });

  it('se rouvre même quand le nettoyage périodique n’est pas passé', async () => {
    // ─── POURQUOI CE BANC, EN PLUS DU PRÉCÉDENT ─────────────────────────
    // Deux mécanismes rouvrent une fenêtre : le balayage périodique
    // (`maybeCleanup`, toutes les 60 s) qui SUPPRIME les entrées échues, et la
    // remise à zéro dans `checkRateLimit` lui-même. Le banc précédent ne
    // distingue pas les deux — le test de mutation l'a prouvé : en retirant la
    // seconde, il restait vert, le balayage faisant le travail à sa place.
    //
    // Ici on construit le cas où le balayage NE PEUT PAS aider : une fenêtre
    // longue (création de compte, une heure) et une dernière requête juste
    // avant l'échéance, qui repositionne `lastCleanup`. La requête suivante
    // arrive donc après expiration mais moins de 60 s après le dernier
    // balayage. Seule la remise à zéro interne peut la laisser passer.
    const limiteur = await limiteurNeuf();
    const ip = '203.0.113.20';

    // Trois créations : le seau est plein mais pas dépassé.
    expect(await refuseAuRang(limiteur, '/api/auth/register', ip, 'POST', 3)).toBeNull();

    // Presque une heure plus tard : cette requête déclenche un balayage (donc
    // recale `lastCleanup`) alors que l'entrée n'a PAS encore expiré.
    vi.advanceTimersByTime(60 * 60 * 1000 - 1000);
    await expect(limiteur(requete('/api/auth/register', ip))).rejects.toMatchObject({
      statusCode: 429,
    });

    // Deux secondes après : la fenêtre est échue, mais le balayage ne repassera
    // pas avant 58 s. L'entrée périmée est toujours en mémoire.
    vi.advanceTimersByTime(2000);
    await expect(limiteur(requete('/api/auth/register', ip))).resolves.toBeUndefined();
  });

  it('la fenêtre NE se rouvre PAS avant l’échéance', async () => {
    const limiteur = await limiteurNeuf();
    await refuseAuRang(limiteur, '/api/ruchers', '203.0.113.6', 'POST', 101);

    vi.advanceTimersByTime(59_000);
    await expect(limiteur(requete('/api/ruchers', '203.0.113.6'))).rejects.toMatchObject({
      statusCode: 429,
    });
  });
});

describe('seaux dédiés — chacun sa mesure', () => {
  it('création de compte : 3 par heure', async () => {
    // Le seau le plus serré, et le plus important : sans lui, on fabrique des
    // comptes en masse pour épuiser les essais gratuits.
    const limiteur = await limiteurNeuf();
    expect(await refuseAuRang(limiteur, '/api/auth/register', '203.0.113.7', 'POST', 4)).toBe(4);
  });

  it('écriture publique : 5 par dix minutes', async () => {
    // Commande sur une campagne publique — antispam.
    const limiteur = await limiteurNeuf();
    expect(
      await refuseAuRang(limiteur, '/api/public/campagne/abc/commander', '203.0.113.8', 'POST', 6),
    ).toBe(6);
  });

  it('lecture publique : 30 par minute, et c’est un AUTRE seau', async () => {
    const limiteur = await limiteurNeuf();
    // 30 lectures passent…
    expect(
      await refuseAuRang(limiteur, '/api/public/campagne/abc', '203.0.113.9', 'GET', 30),
    ).toBeNull();
    // …et la 31ᵉ tombe. Si lecture et écriture partageaient un seau, la limite
    // d'écriture (5) aurait coupé dès la sixième.
    expect(await refuseAuRang(limiteur, '/api/public/campagne/abc', '203.0.113.9', 'GET', 1)).toBe(
      1,
    );
  });

  it('calendrier .ics : 60 par minute', async () => {
    // Un jeton de calendrier est devinable par force brute : la limite est ce
    // qui rend l'essai trop lent pour aboutir.
    const limiteur = await limiteurNeuf();
    expect(await refuseAuRang(limiteur, '/api/calendrier/abc.ics', '203.0.113.10', 'GET', 61)).toBe(
      61,
    );
  });

  it('une route de calendrier SANS .ics ne prend pas ce seau', async () => {
    const limiteur = await limiteurNeuf();
    expect(
      await refuseAuRang(limiteur, '/api/calendrier/abc', '203.0.113.11', 'GET', 61),
    ).toBeNull();
  });
});

describe('rapports CSP — bruyants par nature', () => {
  it('acceptent 60 rapports par minute, puis refusent', async () => {
    const limiteur = await limiteurNeuf();
    expect(
      await refuseAuRang(limiteur, '/api/security/csp-report', '203.0.113.12', 'POST', 61),
    ).toBe(61);
  });

  it('ne consomment PAS le budget général de l’apiculteur', async () => {
    // Les rapports CSP sont émis par le NAVIGATEUR, sans que l'utilisateur le
    // demande. S'ils grignotaient le seau des 100, une page à plusieurs
    // violations rendrait l'application inutilisable à son propre visiteur.
    // Le middleware sort tôt sur ce chemin ; ce banc vérifie cette sortie.
    const limiteur = await limiteurNeuf();
    const ip = '203.0.113.13';
    for (let i = 0; i < 50; i++) await limiteur(requete('/api/security/csp-report', ip));

    expect(await refuseAuRang(limiteur, '/api/ruchers', ip, 'POST', 100)).toBeNull();
  });
});

describe('empilement des seaux', () => {
  it('une écriture publique consomme AUSSI le budget général', async () => {
    // Les deux limites s'appliquent : la spécifique protège du spam ciblé, la
    // générale du volume. Un `return` prématuré dans la branche publique
    // ferait sauter la seconde sans que rien ne le signale.
    const limiteur = await limiteurNeuf();
    const ip = '203.0.113.14';

    // Cinq écritures publiques : autorisées, et comptées deux fois.
    for (let i = 0; i < 5; i++) {
      await limiteur(requete('/api/public/campagne/abc/commander', ip));
    }

    // Il ne doit donc rester que 95 unités au seau général.
    expect(await refuseAuRang(limiteur, '/api/ruchers', ip, 'POST', 96)).toBe(96);
  });
});
