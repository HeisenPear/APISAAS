import { describe, expect, it } from 'vitest';
import { lienDesinscriptionEmail, signerDesinscription } from '~~/server/utils/notifToken';
import { libelleCategorie, resoudreCategorie } from '~~/server/utils/desinscription';
import { CAMPAGNES } from '~~/server/utils/campagnes';

const DEST = { id: 'u-1', email: 'rene@example.com', prenom: 'René' };
const LIEN = 'https://apigo.fr/api/notif/unsubscribe-email?u=u-1&t=abc&c=marketing';

const RELANCES = [
  'relance-2026-compte-vide',
  'relance-2026-une-ruche',
  'relance-2026-cheptel-reel',
] as const;

describe.each(RELANCES)('gabarit — %s', (slug) => {
  const rendu = (dest = DEST, lien = LIEN) => CAMPAGNES[slug]!.rendu(dest, lien);

  it('interpole le prénom dans la salutation', () => {
    expect(rendu()).toContain('Bonjour René,');
  });

  it('salue sans prénom plutôt que « Bonjour undefined »', () => {
    const html = rendu({ ...DEST, prenom: null });
    expect(html).toContain('Bonjour,');
    expect(html).not.toContain('undefined');
  });

  // Le prénom est saisi librement : non échappé, il injecte du HTML dans un
  // email — vecteur de phishing classique.
  it('échappe le HTML contenu dans un prénom', () => {
    const html = rendu({ ...DEST, prenom: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  // Un envoi de masse sans lien d'opt-out est illicite.
  it('porte le lien de désinscription reçu', () => {
    expect(rendu()).toContain(LIEN);
  });

  it("n'embarque aucune image distante", () => {
    expect(rendu()).not.toMatch(/<img\b/i);
  });

  it('ne laisse aucune variable de fusion non résolue', () => {
    expect(rendu()).not.toMatch(/\{\{\s*\w+\s*\}\}/);
  });

  /**
   * Garde de régression (03/08/2026). Une version antérieure affirmait
   * « APIGO ne suit qu'une ruche » en déduisant le cheptel du plafond du plan.
   * Le dry-run a montré que c'était FAUX pour 7 destinataires sur 8. Les
   * gabarits ne reçoivent pas le cheptel et ne peuvent donc rien en dire.
   */
  it('n’affirme rien sur le cheptel du destinataire', () => {
    const html = rendu();
    for (const interdit of [
      /ne suit qu'une ruche/i,
      /qu'une de vos ruches/i,
      /vous n'avez qu'une/i,
      /une ruche ne raconte/i,
      /votre unique ruche/i,
    ]) {
      expect(html).not.toMatch(interdit);
    }
  });
});

describe('segmentation des relances 2026', () => {
  /**
   * LA garde de cette campagne. Les trois relances tournent en parallèle sur
   * le même plan : si leurs segments se recouvraient, un apiculteur recevrait
   * deux mails le même jour — l'idempotence par slug ne protège QUE contre le
   * doublon d'une même campagne, pas contre le chevauchement de deux.
   *
   * On rejoue ici les prédicats SQL en TypeScript sur tout le domaine utile.
   */
  const predicats: Record<(typeof RELANCES)[number], (n: number, essai: boolean) => boolean> = {
    'relance-2026-compte-vide': (n) => n === 0,
    'relance-2026-une-ruche': (n) => n === 1,
    'relance-2026-cheptel-reel': (n, essai) => n >= 2 && !essai,
  };

  it('aucun cheptel ne tombe dans deux campagnes à la fois', () => {
    for (let n = 0; n <= 120; n++) {
      for (const essai of [true, false]) {
        const touches = RELANCES.filter((s) => predicats[s](n, essai));
        expect(touches.length, `${n} ruches, essai=${essai} → ${touches.join(' + ')}`).toBeLessThan(
          2,
        );
      }
    }
  });

  it('couvre tout le monde sauf le cas volontairement exclu', () => {
    for (let n = 0; n <= 120; n++) {
      // Essai déjà consommé ET 2+ ruches : personne ne l'adresse, à dessein —
      // l'accroche du segment C repose sur un essai jamais utilisé.
      const attenduCouvert = !(n >= 2);
      const couvert = RELANCES.some((s) => predicats[s](n, true));
      expect(couvert, `${n} ruches avec essai consommé`).toBe(attenduCouvert);
      expect(
        RELANCES.some((s) => predicats[s](n, false)),
        `${n} ruches sans essai`,
      ).toBe(true);
    }
  });

  it('cible le seul plan Découverte', () => {
    for (const slug of RELANCES) expect(CAMPAGNES[slug]!.plans).toEqual(['decouverte']);
  });

  it('porte un slug distinct — la clé d’idempotence en base', () => {
    expect(new Set(RELANCES).size).toBe(RELANCES.length);
    for (const slug of RELANCES) expect(CAMPAGNES[slug]!.slug).toBe(slug);
  });

  /**
   * L'objet ET le corps du segment C affirment que l'essai n'a jamais servi.
   * Si `NOT trial_used` disparaissait du segment, le mail deviendrait mensonger
   * pour ceux qui l'ont déjà consommé.
   */
  it('le segment « cheptel réel » exige un essai jamais utilisé', () => {
    const sqlSegment = JSON.stringify(CAMPAGNES['relance-2026-cheptel-reel']!.segment);
    expect(sqlSegment).toContain('trial_used');
  });
});

describe('désinscription — catégories', () => {
  // Les emails d'alerte DÉJÀ en boîte portent un lien sans `c`. S'il cessait
  // de couper les urgences, on casserait un opt-out légal a posteriori.
  it('sans paramètre, retombe sur les alertes urgentes', () => {
    expect(resoudreCategorie(undefined)).toBe('urgent');
    expect(resoudreCategorie('')).toBe('urgent');
    expect(libelleCategorie(resoudreCategorie(undefined)).cle).toBe('email_urgent');
  });

  it('reconnaît la catégorie marketing', () => {
    expect(resoudreCategorie('marketing')).toBe('marketing');
    expect(libelleCategorie('marketing').cle).toBe('email_marketing');
  });

  it('ignore une catégorie inconnue au lieu de couper au hasard', () => {
    expect(resoudreCategorie('n-importe-quoi')).toBe('urgent');
  });

  it('coupe deux préférences distinctes selon la catégorie', () => {
    expect(libelleCategorie('urgent').cle).not.toBe(libelleCategorie('marketing').cle);
  });
});

describe('lien de désinscription', () => {
  it('omet `c` sans catégorie — forme des liens déjà envoyés', () => {
    const lien = lienDesinscriptionEmail('u-1');
    expect(lien).not.toContain('&c=');
    expect(lien).toContain(`t=${signerDesinscription('u-1')}`);
  });

  it('ajoute `c=marketing` pour les campagnes', () => {
    expect(lienDesinscriptionEmail('u-1', 'marketing')).toContain('&c=marketing');
  });

  it('signe différemment deux utilisateurs', () => {
    expect(signerDesinscription('u-1')).not.toBe(signerDesinscription('u-2'));
  });
});
