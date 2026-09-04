// ═══════════════════════════════════════════════════════════════════════════
// LA COUPURE QUE PERSONNE NE PEUT EXPLIQUER — et qu'il faut donc devancer.
//
// Vercel rejette un corps de requête au-delà d'environ 4,5 Mo AVANT que la
// moindre ligne d'APIGO ne s'exécute : ni le middleware de taille, ni la route,
// ni le moindre `catch` ne voient passer la requête. L'apiculteur reçoit une
// erreur de plateforme, sans phrase et sans porte de sortie.
//
// Le schéma Zod de la route acceptait pourtant 8 Mo — presque le double. Un PDF
// entre les deux était donc validé par le code et coupé par l'infrastructure :
// la pire des combinaisons, puisque la coupure survient en amont de tout ce qui
// sait parler à l'apiculteur.
//
// La seule parade est de refuser DANS LE NAVIGATEUR, avant l'envoi. Ce banc
// garde les deux moitiés : le plafond garde sa marge, et la phrase reste une
// phrase.
//
// MUTATIONS QUI DOIVENT FAIRE ROUGIR :
//   · porter `PLAFOND_PDF_BASE64_OCTETS` à 8_000_000 ;
//   · retirer le `if (pdfTropLourd(base64)) throw …` de la page ;
//   · rendre `pdfTropLourd` toujours faux.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PLAFOND_CORPS_VERCEL_OCTETS,
  PLAFOND_PDF_BASE64_OCTETS,
  pdfTropLourd,
  refusPdfTropLourd,
} from '~~/app/config/tailles-envoi';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

describe('le plafond de PDF reste sous la coupure d’infrastructure', () => {
  it('LA RÈGLE : la marge existe, et elle est réelle', () => {
    // Les deux nombres ne doivent jamais se croiser. S'ils se rejoignent, on
    // recrée exactement la bande où le code accepte ce que la plateforme coupe.
    expect(PLAFOND_PDF_BASE64_OCTETS).toBeLessThan(PLAFOND_CORPS_VERCEL_OCTETS);
    // Au moins 200 Ko pour l'enveloppe JSON, le préfixe `data:` et les en-têtes.
    expect(PLAFOND_CORPS_VERCEL_OCTETS - PLAFOND_PDF_BASE64_OCTETS).toBeGreaterThan(200_000);
  });

  it('la route et l’écran partagent LE MÊME plafond', () => {
    // Deux tables qui décrivent la même règle finissent toujours par diverger,
    // et c'est la divergence qui rouvre le trou. La route doit donc lire la
    // constante, pas recopier un nombre.
    const source = readFileSync('server/api/finances/factures/[id]/email.post.ts', 'utf8');
    expect(source).toContain('PLAFOND_PDF_BASE64_OCTETS');
    expect(source, 'plus aucun plafond écrit en dur').not.toMatch(/max\(\s*\d[\d_]{5,}\s*\)/);
  });

  it('GARDE-FOU : un PDF ordinaire passe', () => {
    // Sans lui, un `pdfTropLourd` toujours vrai passerait pour un correctif —
    // et plus aucune facture ne partirait.
    expect(pdfTropLourd('J'.repeat(500_000))).toBe(false);
  });

  it('un PDF au-delà du plafond est refusé', () => {
    expect(pdfTropLourd('J'.repeat(PLAFOND_PDF_BASE64_OCTETS + 1))).toBe(true);
    expect(pdfTropLourd('J'.repeat(PLAFOND_PDF_BASE64_OCTETS))).toBe(false);
  });
});

describe('le refus est une phrase, avec sa porte de sortie', () => {
  const phrase = refusPdfTropLourd(5_242_880);

  it('il dit le poids en français, pas en octets', () => {
    expect(phrase).toContain('5,0 Mo');
    expect(phrase, 'jamais un nombre brut d’octets').not.toContain('5242880');
  });

  it('il rassure sur ce qui n’a PAS été fait', () => {
    // Le premier réflexe devant un refus est « ma facture est-elle abîmée ? ».
    expect(phrase).toMatch(/rien n’est parti|la facture est intacte/);
  });

  it('il nomme une sortie', () => {
    expect(phrase).toMatch(/[Tt]éléchargez/);
  });
});

describe('l’écran devance la coupure', () => {
  const corps = corpsDuComposant('app/pages/finances/facture/[id].vue');

  it('GARDE-FOU : le balayage voit bien la fonction d’envoi', () => {
    expect(corps).toContain('async function envoyerEmail');
  });

  it('le refus est prononcé AVANT l’appel à l’API', () => {
    const debut = corps.indexOf('async function envoyerEmail');
    const fin = corps.indexOf('async function markEnvoyee');
    const fonction = corps.slice(debut, fin);
    expect(fonction).toContain('pdfTropLourd');
    expect(
      fonction.indexOf('pdfTropLourd'),
      'contrôler après l’envoi ne servirait à rien : la requête est déjà coupée',
    ).toBeLessThan(fonction.indexOf('envoyerFactureEmail('));
  });
});
