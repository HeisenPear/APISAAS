// ═══════════════════════════════════════════════════════════════════════════
// L'ÉCRAN NE DOIT PLUS ANNONCER UN ENVOI QU'IL N'A PAS VU PARTIR.
//
// ─── LE DÉFAUT ─────────────────────────────────────────────────────────────
// La page de facture affichait « Facture envoyée à client@exemple.fr » dès que
// la requête revenait — et la requête revenait toujours en succès, parce que
// `sendFactureAuClient` rendait `true` sans condition (le SDK Resend ne lève
// jamais d'exception, il rend `{ data, error }`). Domaine non vérifié, adresse
// rejetée, quota dépassé : l'apiculteur voyait un succès, le NUMÉRO LÉGAL était
// gravé, et le client n'avait rien reçu.
//
// Deux garanties, donc, et elles se mesurent séparément :
//   1. la notification qui suit le clic dépend de la réponse du serveur ;
//   2. la fiche PORTE la vérité, y compris des jours plus tard, après un simple
//      rechargement — c'est le rôle de `FinancesFactureEnvoi`.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · retirer le `if (!resultat?.sent) throw …` de la page ;
//   · faire passer la branche « refus » du composant après la branche « succès »
//     (un envoi ancien masquerait alors le dernier refus).
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import FactureEnvoi from '~~/app/components/finances/FactureEnvoi.vue';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

const STUBS = { UIcon: { template: '<i />', props: ['name'] } };

beforeEach(() => {
  vi.stubGlobal('computed', computed);
});

function rendre(props: Record<string, unknown>) {
  return mount(FactureEnvoi, { props: { statut: 'envoyee', ...props }, global: { stubs: STUBS } });
}

describe('la carte de trace dit ce qui s’est passé', () => {
  it('GARDE-FOU : un envoi confirmé affiche la date et l’adresse', () => {
    // Sans ce cas, un composant qui n'afficherait JAMAIS rien passerait les
    // deux règles suivantes — « le balayage vide », transposé à un rendu.
    const texte = rendre({
      clientEmail: 'client@exemple.fr',
      envoyeLe: '2026-09-04T12:12:00.000Z',
      messageId: 'msg_abc',
    }).text();
    expect(texte).toContain('client@exemple.fr');
    expect(texte).toMatch(/4 septembre/);
    expect(texte).toContain('msg_abc');
  });

  it('LA RÈGLE : un refus prime sur un envoi plus ancien', () => {
    // Le serveur efface `emailDernierEchec` à chaque succès : un motif présent
    // est donc TOUJOURS le dernier événement. Afficher « Envoyée le … » à la
    // place remettrait le mensonge qu'on vient de retirer.
    const texte = rendre({
      clientEmail: 'client@exemple.fr',
      envoyeLe: '2026-08-01T10:00:00.000Z',
      dernierEchec: 'Le quota d’envois d’APIGO est atteint pour aujourd’hui.',
    }).text();
    expect(texte).toContain('n’est pas parti');
    expect(texte).toContain('quota d’envois');
    expect(texte, 'l’ancien succès ne doit pas s’afficher').not.toMatch(/1 août/);
  });

  it('une facture marquée « envoyée » à la main le dit, au lieu de se taire', () => {
    // `markEnvoyee` change le statut sans envoyer d'email. Le silence laissait
    // chercher un message qui n'a jamais existé.
    expect(rendre({ statut: 'envoyee' }).text()).toContain('marquée « envoyée » à la main');
  });

  it('un brouillon ne dit rien — il n’y a rien à dire', () => {
    expect(rendre({ statut: 'brouillon' }).text()).toBe('');
  });
});

describe('la page de facture ne se félicite plus toute seule', () => {
  /**
   * ⚠️ SANS LES COMMENTAIRES. C'est tombé six fois dans ce dépôt : le
   * commentaire qui EXPLIQUE un correctif cite forcément le code corrigé, et
   * une règle qui cherche une chaîne la trouve alors dans sa propre
   * justification. Ici, le commentaire au-dessus du garde contient le mot
   * `sent`.
   */
  const corps = corpsDuComposant('app/pages/finances/facture/[id].vue');

  it('GARDE-FOU : le balayage voit bien la fonction d’envoi', () => {
    expect(corps).toContain('async function envoyerEmail');
    expect(corps).toContain('notifications.success');
  });

  it('la réussite annoncée est CONDITIONNÉE à la réponse du serveur', () => {
    const debut = corps.indexOf('async function envoyerEmail');
    const fin = corps.indexOf('async function markEnvoyee');
    expect(fin, 'les deux repères existent').toBeGreaterThan(debut);
    const fonction = corps.slice(debut, fin);

    // Le `sent` du serveur doit être LU, et une réponse qui ne le porte pas
    // doit valoir refus : « inconnu » ne vaut jamais « c'est parti ».
    expect(fonction).toMatch(/if\s*\(\s*!\s*\w+\?\.\s*sent\s*\)/);
    // Et le lu doit précéder la félicitation.
    expect(fonction.indexOf('.sent')).toBeLessThan(fonction.indexOf('notifications.success'));
  });

  it('la fiche branche bien la carte de trace', () => {
    const gabarit = readFileSync('app/pages/finances/facture/[id].vue', 'utf8');
    expect(gabarit).toContain('<FinancesFactureEnvoi');
    for (const liaison of [':envoye-le', ':dernier-echec', ':message-id']) {
      expect(gabarit, `la carte doit recevoir ${liaison}`).toContain(liaison);
    }
  });
});
