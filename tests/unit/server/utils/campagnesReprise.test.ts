// Un destinataire réclamé mais non servi doit TOUJOURS être relibéré.
//
// Le marqueur d'idempotence est posé par la requête qui sélectionne : il est
// donc déjà en base quand l'envoi part. S'il n'est pas retiré après un échec,
// le compte est marqué « servi » à jamais et l'apiculteur ne recevra jamais
// cette campagne — aucun passage ultérieur ne le reprendra.
//
// Le cas partiel (Resend refuse 3 messages sur 100) était couvert. Le cas TOTAL
// (Resend indisponible, clé absente, réseau coupé) ne l'était pas : l'exception
// court-circuitait la relibération. Ces bancs verrouillent les deux.

import { describe, expect, it, vi, beforeEach } from 'vitest';

const envoiLot = vi.fn();
/** Les identifiants réellement relibérés, lus dans le SQL émis. */
const liberes: string[] = [];

vi.mock('~~/server/utils/email', () => ({
  sendLotCampagne: (...args: unknown[]) => envoiLot(...args),
}));

vi.mock('~~/server/utils/notifToken', () => ({
  lienDesinscriptionEmail: (id: string) => `https://apigo.fr/u/${id}`,
}));

const { envoyerCampagne } = await import('~~/server/utils/campagnes');

// `libererDestinataires` écrit en base : on l'espionne au niveau du module.
// `libererDestinataires` écrit via `db.execute(sql\`…\`)`, et `db` est un
// AUTO-IMPORT Nuxt : il n'apparaît dans aucun `import` du module. `vi.mock`
// ne l'intercepte donc pas — il faut le poser sur l'objet global, comme le
// runtime Nuxt le ferait.
//
// C'est précisément ce que la version précédente de ce banc avait raté : elle
// mockait `~~/server/utils/db`, sans effet. La relibération levait sur un `db`
// inexistant, le `catch` interne l'absorbait, et le test passait à l'identique
// sur le code d'AVANT correctif. Il n'attestait que la propagation de
// l'erreur — qui existait déjà. Il ne prouvait rien.
//
// On observe les identifiants placés dans la requête : c'est la SEULE preuve
// que la relibération a réellement eu lieu.
Object.assign(globalThis, {
  db: {
    execute: (requete: unknown) => {
      // Drizzle enveloppe les valeurs dans des objets `Param` et la structure
      // est circulaire : on la parcourt en collectant les chaînes, plutôt que
      // de la sérialiser (ce qui lèverait, et serait avalé par le catch).
      const vus = new Set<unknown>();
      const chaines: string[] = [];
      const parcourir = (n: unknown) => {
        if (n == null || vus.has(n)) return;
        if (typeof n === 'string') return void chaines.push(n);
        if (typeof n !== 'object') return;
        vus.add(n);
        for (const v of Object.values(n as Record<string, unknown>)) parcourir(v);
      };
      parcourir(requete);
      for (const id of chaines) if (/^u\d$/.test(id)) liberes.push(id);
      return Promise.resolve([]);
    },
  },
});

const MODELE = {
  slug: 'test-reprise',
  sujet: 'Sujet',
  rendu: () => '<p>corps</p>',
} as unknown as Parameters<typeof envoyerCampagne>[0];

const DESTINATAIRES = [
  { id: 'u1', email: 'a@example.test' },
  { id: 'u2', email: 'b@example.test' },
  { id: 'u3', email: 'c@example.test' },
] as unknown as Parameters<typeof envoyerCampagne>[1];

beforeEach(() => {
  envoiLot.mockReset();
  liberes.length = 0;
});

describe('campagnes — reprise après échec', () => {
  it('ne réclame personne quand la liste est vide', async () => {
    const r = await envoyerCampagne(MODELE, [] as typeof DESTINATAIRES);
    expect(r).toEqual({ envoyes: 0, echecs: 0 });
    expect(envoiLot).not.toHaveBeenCalled();
  });

  it('RELIBÈRE TOUT LE LOT quand l’envoi entier échoue', async () => {
    // Resend indisponible : `sendLotCampagne` lève au lieu de rendre des échecs.
    envoiLot.mockRejectedValue(new Error('Resend: service unavailable'));

    await expect(envoyerCampagne(MODELE, DESTINATAIRES)).rejects.toThrow('service unavailable');

    // LE point du correctif : sans relibération, ces trois comptes resteraient
    // marqués « servis » définitivement et ne recevraient jamais la campagne.
    // C'est cette assertion — et elle seule — qui distingue le code corrigé de
    // celui d'avant.
    expect(liberes.sort()).toEqual(['u1', 'u2', 'u3']);
  });

  it('ne relibère personne quand l’envoi réussit', async () => {
    // Le miroir : relibérer après un envoi réussi renverrait le même email deux
    // fois. Le banc précédent ne distinguait pas non plus ce cas.
    envoiLot.mockResolvedValue({ envoyes: 3, echecs: [] });
    await envoyerCampagne(MODELE, DESTINATAIRES);
    expect(liberes).toHaveLength(0);
  });

  it('tente l’envoi avec un lien de désinscription par destinataire', async () => {
    envoiLot.mockResolvedValue({ envoyes: 3, echecs: [] });
    const r = await envoyerCampagne(MODELE, DESTINATAIRES);

    expect(r).toEqual({ envoyes: 3, echecs: 0 });
    const messages = envoiLot.mock.calls[0]![0] as { to: string; unsubscribeUrl: string }[];
    expect(messages).toHaveLength(3);
    // RFC 8058 : un lien de désinscription par message, jamais partagé.
    expect(new Set(messages.map((m) => m.unsubscribeUrl)).size).toBe(3);
    for (const m of messages) expect(m.unsubscribeUrl).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FENÊTRE D'ANNULATION D'UN LOT MAYA
//
// « Tout annuler » supprime les lignes créées sans vérifier ce qu'on a bâti
// dessus depuis. Défaire un lot vieux de trois mois efface potentiellement un
// client déjà facturé ou une récolte déjà mise en pot. La règle est donc
// bornée dans le temps — et testée ici sans base, puisqu'elle est pure.
// ═══════════════════════════════════════════════════════════════════════════

// Importés de `annulationRegle`, leur module d'origine — et non de
// `copilote-executeur`, qui les réexportait : ce réexport donnait à Nitro un
// second chemin d'auto-import et faisait ignorer le module qui fait autorité.
const { annulationExpiree, FENETRE_ANNULATION_MS } =
  await import('~~/server/utils/annulationRegle');

describe('fenêtre d’annulation d’un lot', () => {
  const T0 = new Date('2026-08-17T12:00:00.000Z');

  it('laisse défaire un lot qui vient d’être exécuté', () => {
    expect(annulationExpiree(T0, T0)).toBe(false);
  });

  it('laisse défaire le lendemain matin — la fenêtre est généreuse', () => {
    const vingtTroisHeures = new Date(T0.getTime() + 23 * 3600_000);
    expect(annulationExpiree(T0, vingtTroisHeures)).toBe(false);
  });

  it('refuse au-delà de 24 heures', () => {
    const apres = new Date(T0.getTime() + FENETRE_ANNULATION_MS + 1);
    expect(annulationExpiree(T0, apres)).toBe(true);
  });

  it('refuse quand la date est illisible — jamais d’ouverture par défaut', () => {
    expect(annulationExpiree('pas une date', T0)).toBe(true);
  });
});
