import { test, expect } from '@playwright/test';

/**
 * LE FORUM SE LIT SANS COMPTE — le parcours qui le prouve.
 *
 * ⚠️ LECTURE SEULE, ET CE N'EST PAS UNE PRÉCAUTION DE STYLE. Le déploiement de
 * préversion écrit dans la base de PRODUCTION : un e2e qui ouvrirait un sujet
 * laisserait un fil chez de vrais clients, visible de tous et indexable.
 * Ce fichier ne se connecte à aucun compte, n'envoie aucun POST, ne crée aucun
 * objet. Il ouvre des pages et regarde ce qu'elles rendent.
 *
 * ─── CE QU'IL ATTRAPE, ET QUE RIEN D'AUTRE N'ATTRAPE ───────────────────────
 * La propriété « le forum est public » est la conjonction de quatre réglages
 * dans quatre fichiers (`forumPublicEtIndexable.test.ts` les tient un par un)
 * PLUS le comportement réel du middleware d'authentification. Un banc unitaire
 * lit des fichiers ; lui seul ouvre vraiment `/forum` sans cookie de session.
 *
 * Le défaut qu'il ferme est celui qui ne se voit jamais en développant : la
 * page marche parfaitement pour qui est connecté — donc pour tous ceux qui la
 * testent — et renvoie un visiteur vers `/login`.
 */

test.describe('Forum — lisible sans compte', () => {
  test('/forum répond et rend son contenu, sans redirection vers /login', async ({ page }) => {
    const reponse = await page.goto('/forum');

    expect(reponse, 'aucune réponse pour /forum').not.toBeNull();
    expect(reponse!.status(), 'statut HTTP inattendu pour /forum').toBeLessThan(400);

    /**
     * ⚠️ L'URL FINALE, PAS CELLE DEMANDÉE. Une redirection vers `/login`
     * répondrait elle aussi 200 : le statut seul ne dit rien. C'est
     * exactement le défaut que ce cas existe pour attraper.
     */
    expect(
      new URL(page.url()).pathname,
      'Un visiteur déconnecté a été renvoyé ailleurs : le forum n’est plus public, ' +
        'donc plus indexable — et ça continue de marcher pour quiconque est connecté.',
    ).toBe('/forum');

    await expect(page.getByRole('heading', { level: 1, name: 'Forum' })).toBeVisible();
  });

  test('la page invite à se connecter au lieu de faire semblant', async ({ page }) => {
    // Un visiteur ne doit pas voir « Poser une question » : le bouton mènerait
    // à un refus. On propose la connexion — une porte de sortie, pas un mur.
    await page.goto('/forum');
    await expect(page.getByRole('link', { name: /connectez-vous/i })).toBeVisible();
  });

  test('le HTML SERVEUR porte déjà le contenu (indexabilité)', async ({ page }) => {
    /**
     * ⚠️ `page.content()` NE PROUVERAIT RIEN : il rend le DOM APRÈS
     * hydratation, donc une page chargée en `onMounted` y paraîtrait pleine.
     * C'est le défaut que j'ai livré puis corrigé — il faut lire la réponse
     * HTTP BRUTE, celle que reçoit un moteur de recherche.
     */
    const reponse = await page.request.get('/forum');
    const html = await reponse.text();

    expect(html, 'le titre n’est pas dans le HTML du serveur').toContain('<h1');
    expect(
      html,
      'Le HTML servi annonce un forum vide : les données ne partent pas au rendu serveur ' +
        '(un retour à `onMounted`, ou un `server: false`). Un moteur de recherche n’exécute ' +
        'pas le JavaScript de la page — il indexerait « aucun sujet ».',
    ).not.toContain('Personne n’a encore ouvert de sujet');
  });

  test('aucune barre latérale applicative pour un visiteur', async ({ page }) => {
    /**
     * Le forum porte le chrome MARKETING quand personne n'est connecté
     * (`ForumChrome`). Sans ça, un visiteur venu d'un moteur reçoit la barre
     * latérale de l'espace privé : dix liens qui le renverront tous vers
     * `/login`. On lui montrerait les meubles d'une maison où il n'est pas
     * entré.
     */
    await page.goto('/forum');
    await expect(page.getByRole('link', { name: 'Tableau de bord' })).toHaveCount(0);
  });
});
