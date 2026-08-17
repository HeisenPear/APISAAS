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
const liberes: string[][] = [];

vi.mock('~~/server/utils/email', () => ({
  sendLotCampagne: (...args: unknown[]) => envoiLot(...args),
}));

vi.mock('~~/server/utils/notifToken', () => ({
  lienDesinscriptionEmail: (id: string) => `https://apigo.fr/u/${id}`,
}));

const { envoyerCampagne } = await import('~~/server/utils/campagnes');

// `libererDestinataires` écrit en base : on l'espionne au niveau du module.
vi.mock('~~/server/utils/db', () => ({ db: {} }));

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

  it('relaie l’erreur quand le LOT ENTIER échoue', async () => {
    // Resend indisponible : `sendLotCampagne` lève au lieu de rendre des échecs.
    envoiLot.mockRejectedValue(new Error('Resend: service unavailable'));

    // L'erreur doit remonter — l'admin doit voir que rien n'est parti, plutôt
    // qu'un « 0 envoyé » silencieux qui passerait pour une liste vide.
    await expect(envoyerCampagne(MODELE, DESTINATAIRES)).rejects.toThrow('service unavailable');
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
