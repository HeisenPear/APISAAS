// ═══════════════════════════════════════════════════════════════════════════
// UN ENVOI D'EMAIL DOIT DIRE CE QU'IL A VRAIMENT FAIT.
//
// ─── LE DÉFAUT QUE CE FICHIER GARDE ────────────────────────────────────────
// `sendFactureAuClient` faisait :
//
//     await resend.emails.send({ … });
//     return true;
//
// Le SDK Resend NE LÈVE JAMAIS D'EXCEPTION. Il rend `{ data, error }`, et même
// une coupure réseau lui revient en `{ data: null, error: { name:
// 'application_error' } }` — vérifié dans le paquet installé
// (`node_modules/resend/dist/index.mjs`, fonction `post`). Le `return true`
// était donc INCONDITIONNEL, et le `try/catch` de `sendAlerteUrgenteEmail`
// était du code mort qui donnait l'illusion inverse.
//
// Ce que ça coûtait, sur de l'argent réel : la route de facture gravait le
// NUMÉRO LÉGAL et passait le brouillon en « envoyée » pendant que rien n'était
// parti. Sur les alertes d'urgence, le compteur « 4 emails envoyés » pouvait
// désigner quatre refus.
//
// ─── LA MUTATION QUI DOIT FAIRE ROUGIR ─────────────────────────────────────
// Dans `server/utils/refusEnvoi.ts`, remplacer le corps de `resultatDEnvoi`
// par `return { ok: true, messageId: null }` — c'est-à-dire rétablir le
// `return true` d'origine. Les cas « refus » de ce fichier doivent tomber.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  phraseDeRefus,
  resultatDEnvoi,
  REFUS_SANS_SERVICE,
  type CodeRefus,
} from '~~/server/utils/refusEnvoi';

// ─── Ce que le double de Resend rendra ─────────────────────────────────────

type ReponseResend = {
  data: { id: string } | null;
  error: { message: string; name: string } | null;
};
let reponse: ReponseResend;
/** Les envois RÉELLEMENT tentés — vide si la clé manque. */
let tentatives: Record<string, unknown>[];

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: async (opts: Record<string, unknown>) => {
        tentatives.push(opts);
        return reponse;
      },
    };
  },
}));

beforeEach(() => {
  tentatives = [];
  reponse = { data: { id: 'msg_abc123' }, error: null };
  vi.resetModules();
  // `getClient()` lit d'abord l'environnement ; la configuration Nuxt n'est
  // atteinte que si la variable manque — c'est le cas « service absent ».
  Object.assign(globalThis, { useRuntimeConfig: () => ({ resendApiKey: undefined }) });
  vi.stubEnv('NUXT_RESEND_API_KEY', 're_test_key');
});

afterEach(() => vi.unstubAllEnvs());

async function envoyerFacture() {
  const { sendFactureAuClient } = await import('~~/server/utils/email');
  return sendFactureAuClient({
    to: 'client@exemple.fr',
    vendeurNom: 'Jean Dupont',
    numeroFacture: 'FA-2026-0007',
    montantTtc: 120,
    attachments: [{ filename: 'facture.pdf', content: 'JVBER' }],
  });
}

async function envoyerAlerte() {
  const { sendAlerteUrgenteEmail } = await import('~~/server/utils/email');
  return sendAlerteUrgenteEmail({
    to: 'apiculteur@exemple.fr',
    prenom: 'Mael',
    type: 'meteo_danger',
    titre: 'Orage de grêle annoncé',
    message: 'Bâchez les ruches.',
    actionUrl: '/alertes',
    unsubscribeUrl: 'https://apigo.fr/desinscription?t=x',
  });
}

describe('sendFactureAuClient — ce qui est parti, et ce qui ne l’est pas', () => {
  it('GARDE-FOU : un envoi accepté rend bien un succès, avec l’identifiant', async () => {
    // Sans ce cas, un `resultatDEnvoi` qui refuserait TOUT passerait pour un
    // correctif — « le balayage vide » de CLAUDE.md, appliqué à un booléen.
    const r = await envoyerFacture();
    expect(tentatives, 'l’envoi a bien été tenté').toHaveLength(1);
    expect(r).toEqual({ ok: true, messageId: 'msg_abc123' });
  });

  it('un refus de Resend N’EST PAS un succès', async () => {
    reponse = {
      data: null,
      error: { name: 'invalid_from_address', message: 'Domain not verified' },
    };
    const r = await envoyerFacture();
    expect(r.ok, 'un `error` renvoyé par le SDK doit valoir échec').toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('invalid_from_address');
    expect(r.technique).toBe('Domain not verified');
  });

  it('une coupure réseau aussi — le SDK la rend en `application_error`', async () => {
    // C'est LE cas que le `try/catch` d'origine croyait attraper. Il ne
    // pouvait pas : le SDK avale l'exception et la rend en objet.
    reponse = { data: null, error: { name: 'application_error', message: 'Unable to fetch data' } };
    const r = await envoyerFacture();
    expect(r.ok).toBe(false);
  });

  it('sans clé d’API, RIEN n’est tenté et le refus le dit', async () => {
    vi.stubEnv('NUXT_RESEND_API_KEY', '');
    const r = await envoyerFacture();
    expect(tentatives, 'aucun appel ne doit partir sans service').toHaveLength(0);
    expect(r).toEqual(REFUS_SANS_SERVICE);
  });

  it('l’alerte urgente suit exactement la même règle', async () => {
    // Son `try/catch` était du code mort pour la même raison. Le compteur
    // `envoyes` de `alertesEmail.ts` en dépend : il comptait des refus.
    reponse = { data: null, error: { name: 'daily_quota_exceeded', message: 'Quota' } };
    expect((await envoyerAlerte()).ok).toBe(false);

    reponse = { data: { id: 'msg_zz' }, error: null };
    expect(await envoyerAlerte()).toEqual({ ok: true, messageId: 'msg_zz' });
  });
});

describe('resultatDEnvoi — la lecture de la réponse du SDK', () => {
  it('`error` l’emporte, même si `data` est présent', async () => {
    // Défensif à dessein : la réponse du SDK est typée en union, mais rien
    // n'empêche un jour un corps qui porte les deux. Devant l'ambiguïté on
    // refuse — « inconnu » ne vaut jamais « c'est parti ».
    const r = resultatDEnvoi({ data: { id: 'x' }, error: { name: 'validation_error' } });
    expect(r.ok).toBe(false);
  });

  it('un refus sans nom ni message reste un refus, jamais un vide', () => {
    const r = resultatDEnvoi({ data: null, error: {} });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('application_error');
    expect(r.technique.length).toBeGreaterThan(0);
  });

  it('un succès sans identifiant reste un succès', () => {
    expect(resultatDEnvoi({ data: null, error: null })).toEqual({ ok: true, messageId: null });
  });
});

// ─── Les phrases de refus ──────────────────────────────────────────────────

/**
 * ⚠️ LA LISTE EST DÉRIVÉE DU SDK, PAS RECOPIÉE ICI. Le type `CodeRefus` vaut
 * `ErrorResponse['name'] | 'sans_service'` : la couverture EXHAUSTIVE est déjà
 * garantie par le compilateur (`Record<CodeRefus, string>` ne compile pas s'il
 * manque un code). Ce banc-ci vérifie ce que le compilateur ne peut pas voir —
 * la QUALITÉ de chaque phrase.
 *
 * Les codes sont donc énumérés à partir du module lui-même, jamais d'une liste
 * tenue à la main : ajouter une traduction la fait balayer le jour même.
 */
const CODES = (() => {
  // On relit le fichier plutôt que d'exporter la table : elle est privée, et
  // l'exporter pour un banc reviendrait à élargir l'API du module.
  const src = readFileSync('server/utils/refusEnvoi.ts', 'utf8');
  const bloc = src.slice(src.indexOf('const PHRASE: Record<CodeRefus, string> = {'));
  const fin = bloc.indexOf('\n};');
  return [...bloc.slice(0, fin).matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1] as CodeRefus);
})();

describe('phraseDeRefus — un refus est une PHRASE, jamais un code', () => {
  it('GARDE-FOU : le balayage voit bien les codes', () => {
    // Sans lui, une expression régulière fautive rendrait une liste vide et
    // les trois règles ci-dessous seraient « vérifiées » sur rien.
    expect(CODES.length).toBeGreaterThanOrEqual(20);
    expect(CODES).toContain('sans_service');
    expect(CODES).toContain('daily_quota_exceeded');
  });

  it.each(CODES)('« %s » est traduit en français, sans jargon', (code) => {
    const phrase = phraseDeRefus(code);
    expect(phrase.length, 'une phrase, pas un mot').toBeGreaterThan(40);
    // Le code lui-même ne doit JAMAIS affleurer : « daily_quota_exceeded »
    // n'apprend rien à un apiculteur.
    expect(phrase).not.toContain(code);
    expect(phrase, 'aucun identifiant technique').not.toMatch(/[a-z]+_[a-z]+/);
  });

  it.each(CODES)('« %s » nomme une porte de sortie', (code) => {
    // La règle du dépôt : ne jamais bloquer sans dire ce qu'on peut faire.
    // Un refus qui s'arrête au « non » laisse l'apiculteur devant un mur.
    expect(phraseDeRefus(code)).toMatch(
      /[Rr]éessayez|téléchargez|[Vv]érifiez|signalez-le nous|Patientez/,
    );
  });

  it('un code INCONNU refuse quand même, et le dit', () => {
    // Le SDK peut ajouter un code demain. « Inconnu » ne vaut pas « c'est
    // parti » : on refuse, avec la porte de sortie.
    const phrase = phraseDeRefus('code_de_demain' as CodeRefus);
    expect(phrase.length).toBeGreaterThan(40);
    expect(phrase).toMatch(/téléchargez|réessayez/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LE COMPTEUR D'ALERTES URGENTES — « 4 emails envoyés » pouvait valoir 4 refus.
//
// `envoyerEmailsUrgents` rend un NOMBRE, et c'est ce nombre que remontent le
// cron des urgences et le tableau de bord. Il incrémentait sur `if (ok)` —
// où `ok` était le `true` inconditionnel de `sendAlerteUrgenteEmail`. C'est
// exactement la forme « le chiffre promis, pas mesuré » de CLAUDE.md, sur le
// canal de SECOURS : météo dangereuse, sanitaire critique.
//
// ⚠️ CE BLOC EXISTE PARCE QU'UNE MUTATION EST RESTÉE VERTE. Casser le compteur
// (`envoyes++` inconditionnel) ne faisait tomber aucun banc du dépôt : rien ne
// couvrait `alertesEmail.ts`. La règle du dépôt dit qu'un banc qu'on n'a pas vu
// rouge ne prouve rien ; ici, il n'y avait même pas de banc.
//
// MUTATION : remplacer `if (envoi.ok) envoyes++;` par `envoyes++;` → rouge.
// ═══════════════════════════════════════════════════════════════════════════

describe('envoyerEmailsUrgents — le compteur ne compte que ce qui est parti', () => {
  /** Les lignes que le claim atomique rendra (une par appel). */
  let claims: Array<Array<{ email: string; prenom: string | null }>>;

  async function urgences(nouvelles: Array<{ type: string; titre?: string }>) {
    claims = nouvelles.map(() => [{ email: 'apiculteur@exemple.fr', prenom: 'Mael' }]);
    Object.assign(globalThis, {
      db: {
        execute: async () => claims.shift() ?? [],
      },
    });
    const { envoyerEmailsUrgents } = await import('~~/server/utils/alertesEmail');
    // Le plan est `expert` pour que le gating par plan ne masque rien : ce
    // qu'on mesure ici est le COMPTEUR, pas la diffusion par formule (qui a son
    // propre banc). Les types viennent de `TYPES_URGENTS`, la source de vérité.
    return envoyerEmailsUrgents('user-1', 'expert', {}, nouvelles);
  }

  it('GARDE-FOU : deux alertes acceptées comptent bien pour deux', async () => {
    reponse = { data: { id: 'msg_1' }, error: null };
    expect(await urgences([{ type: 'meteo_danger' }, { type: 'sante_critique' }])).toBe(2);
    expect(tentatives, 'les deux envois ont bien été tentés').toHaveLength(2);
  });

  it('LA RÈGLE : un refus ne compte pas', async () => {
    reponse = { data: null, error: { name: 'daily_quota_exceeded', message: 'Quota' } };
    expect(await urgences([{ type: 'meteo_danger' }, { type: 'sante_critique' }])).toBe(0);
    expect(tentatives, 'les envois ont bien été tentés — ils ont été refusés').toHaveLength(2);
  });
});
