// ═══════════════════════════════════════════════════════════════════════════
// PASSEPORT MIEL — le seul parcours de cette mise à jour qu'un INCONNU voit.
//
// Un consommateur scanne le QR d'un pot et arrive sur /p#<données>. Il n'a pas
// de compte, pas de session, et ne saura jamais qu'APIGO existe autrement que
// par cette page. Si elle échoue, elle échoue devant un client du client.
//
// Elle est aussi la plus testable de toute la maj : tout est décodé du
// FRAGMENT d'URL, côté navigateur. Aucune requête, aucune base, aucun quota.
// Ce qui veut dire qu'un banc de bout en bout la couvre RÉELLEMENT — pas une
// version simulée d'elle-même.
//
// Le fragment n'étant jamais envoyé au serveur, la page rend d'abord vide puis
// se remplit au montage. Les attentes ci-dessous portent donc sur le contenu
// final, jamais sur le premier rendu.
// ═══════════════════════════════════════════════════════════════════════════

import { test, expect, type Page } from '@playwright/test';

/**
 * Même encodage que `app/utils/passeportMiel.ts` : base64url d'un JSON UTF-8.
 * Réécrit ici volontairement — un banc de bout en bout qui importerait le code
 * de production validerait la fonction contre elle-même. On encode comme le
 * ferait un producteur, et on vérifie que la PAGE sait lire ça.
 */
function encoder(passeport: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(passeport), 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const POT_COMPLET = {
  v: 1,
  lot: 'L-2026-0042',
  prod: 'Rucher des Tilleuls',
  miels: ['acacia', 'tilleul'],
  origine: 'Charente-Maritime',
  recolte: 'juin–août 2026',
  pot: '2026-09',
  ddm: '2028-09',
  eau: 17.2,
  eco: { s: 78, n: 'B' },
};

/** Le minimum légal : un numéro de lot, rien d'autre. */
const POT_MINIMAL = { v: 1, lot: 'L-2026-0001' };

async function ouvrirPasseport(page: Page, donnees: Record<string, unknown>) {
  await page.goto(`/p#${encoder(donnees)}`);
}

test.describe('passeport miel — le pot raconte son histoire', () => {
  test('affiche le miel, le producteur et la traçabilité', async ({ page }) => {
    await ouvrirPasseport(page, POT_COMPLET);

    // Le titre se déduit des miels : deux fleurs → « toutes fleurs ».
    await expect(page.getByRole('heading', { level: 1 })).toContainText('toutes fleurs');
    await expect(page.getByText('Rucher des Tilleuls')).toBeVisible();

    // Le numéro de lot est l'ancre réglementaire : il DOIT être lisible.
    await expect(page.getByText('L-2026-0042')).toBeVisible();

    await expect(page.getByText('Charente-Maritime')).toBeVisible();
    await expect(page.getByText('juin–août 2026')).toBeVisible();
    await expect(page.getByText('acacia · tilleul')).toBeVisible();
  });

  test('nomme le miel par sa fleur quand il n’y en a qu’une', async ({ page }) => {
    await ouvrirPasseport(page, { ...POT_COMPLET, miels: ['acacia'] });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Miel de acacia');
  });

  test('montre l’éco-score et met en avant SA lettre', async ({ page }) => {
    await ouvrirPasseport(page, POT_COMPLET);

    await expect(page.getByText('Éco-score')).toBeVisible();
    await expect(page.getByText('78')).toBeVisible();

    // L'échelle affiche A→E ; seule la lettre obtenue porte la classe active.
    const active = page.locator('.pp-eco-seg.on');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('B');
  });

  test('se contente d’un lot quand le producteur n’a rien saisi d’autre', async ({ page }) => {
    // Cas réel : un producteur qui imprime ses QR sans avoir rempli la fiche.
    // La page doit rester digne, pas afficher des champs vides.
    await ouvrirPasseport(page, POT_MINIMAL);

    await expect(page.getByText('L-2026-0001')).toBeVisible();
    await expect(page.getByText('Éco-score')).toHaveCount(0);
    await expect(page.getByText('Récolte')).toHaveCount(0);
  });

  test('n’affiche pas la teneur en eau quand elle vaut zéro… si elle est saisie', async ({
    page,
  }) => {
    // `v-if="p.eau != null"` et non `v-if="p.eau"` : 0 % est une valeur, pas
    // une absence. Ce banc verrouille la distinction — la confondre ferait
    // disparaître une donnée réglementaire sur les miels très secs.
    await ouvrirPasseport(page, { ...POT_MINIMAL, eau: 0 });
    await expect(page.getByText('0 %')).toBeVisible();
  });
});

test.describe('passeport miel — quand le lien est abîmé', () => {
  test('explique au lieu de planter, sur un fragment illisible', async ({ page }) => {
    await page.goto('/p#ceci-nest-pas-du-base64!!');
    await expect(page.getByText(/ne contient pas de passeport valide/i)).toBeVisible();
  });

  test('explique aussi quand il n’y a aucun fragment', async ({ page }) => {
    await page.goto('/p');
    await expect(page.getByText(/ne contient pas de passeport valide/i)).toBeVisible();
  });

  test('refuse un passeport sans numéro de lot', async ({ page }) => {
    // Le lot est l'ancre de traçabilité : sans lui, la page ne doit RIEN
    // affirmer sur l'origine du miel, même si le reste est renseigné.
    await ouvrirPasseport(page, { v: 1, prod: 'Rucher fantôme', origine: 'Quelque part' });
    await expect(page.getByText(/ne contient pas de passeport valide/i)).toBeVisible();
    await expect(page.getByText('Rucher fantôme')).toHaveCount(0);
  });

  test('refuse une version de format inconnue', async ({ page }) => {
    // Compat ascendante : un QR d'une future version ne doit pas être rendu
    // à moitié par un ancien client. Mieux vaut ne rien dire que mal dire.
    await ouvrirPasseport(page, { v: 99, lot: 'L-FUTUR' });
    await expect(page.getByText(/ne contient pas de passeport valide/i)).toBeVisible();
  });
});

test.describe('passeport miel — hygiène de page publique', () => {
  test('reste hors des moteurs de recherche', async ({ page }) => {
    // Le fragment contient les données d'un lot précis : cette page n'a rien
    // à faire dans un index. Le `noindex` est une décision produit, pas un
    // détail — un banc la verrouille.
    await ouvrirPasseport(page, POT_COMPLET);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('ne déclenche aucune requête vers l’API', async ({ page }) => {
    // La promesse « zéro quota » : scanner un pot ne coûte rien au producteur.
    // Si un jour quelqu'un branche un appel ici, ce banc le dira.
    // On teste le CHEMIN, pas la présence de « /api/ » dans l'URL : en mode
    // dev, Vite sert des modules dont le chemin de fichier contient « /api/ »
    // (`@vue/devtools-api/lib/esm/api/index.js`). Les compter reviendrait à
    // faire échouer le banc sur l'outillage, pas sur le produit.
    const appels: string[] = [];
    page.on('request', (r) => {
      const { pathname } = new URL(r.url());
      if (pathname.startsWith('/api/')) appels.push(pathname);
    });

    await ouvrirPasseport(page, POT_COMPLET);
    await expect(page.getByText('L-2026-0042')).toBeVisible();

    expect(appels, `appels API inattendus : ${appels.join(', ')}`).toHaveLength(0);
  });

  test('s’ouvre sans erreur de console', async ({ page }) => {
    const erreurs: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') erreurs.push(m.text());
    });

    await ouvrirPasseport(page, POT_COMPLET);
    await expect(page.getByText('L-2026-0042')).toBeVisible();

    expect(erreurs, erreurs.join('\n')).toHaveLength(0);
  });
});
