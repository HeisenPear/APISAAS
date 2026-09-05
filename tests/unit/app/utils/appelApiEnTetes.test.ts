import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { appelApi } from '../../../../app/utils/appelApi';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * `appelApi` PASSE PAR LE FETCH DE LA REQUÊTE COURANTE, PAS PAR `$fetch` NU.
 *
 * ─── POURQUOI CE BANC EXISTE ───────────────────────────────────────────────
 * C'est la SEULE différence de comportement entre `useFetch` — que ce dépôt
 * vient d'abandonner sur ~190 appels — et un `$fetch` nu. Pendant le rendu
 * serveur, `useFetch` transmet les en-têtes de la requête entrante, donc le
 * cookie de session ; `$fetch` nu, non.
 *
 * Vingt fichiers convertis appellent `appelApi` SANS `lazy` : ils bloquent le
 * rendu, donc s'exécutent bien côté serveur, sur des routes authentifiées
 * (`finances/index.vue`, `clients/index.vue`, `exports/registre.vue`,
 * `interventions/nouvelle.vue`, `ruches/[id]/index.vue`, `useRuches.ts`…).
 * Sans le forward, leurs appels reviendraient sans session : la page se rendrait
 * VIDE, puis se remplirait à l'hydratation.
 *
 * ⚠️ ET RIEN NE L'AURAIT DIT. Pas une erreur, pas une exception, pas un banc
 * rouge — un écran qui clignote, et un référencement qui voit du vide.
 * `verifier:ssr` ne visite que quatre pages PUBLIQUES. La CI serait restée
 * verte sur une régression touchant chaque page authentifiée du produit.
 *
 * ─── LA MUTATION QUI DOIT FAIRE ROUGIR ─────────────────────────────────────
 * Remplacer `useRequestFetch()` par `$fetch` dans `app/utils/appelApi.ts`.
 * ═══════════════════════════════════════════════════════════════════════════
 */
describe('appelApi transmet les en-têtes de la requête courante', () => {
  let fetchNu: ReturnType<typeof vi.fn>;
  let fetchDeLaRequete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Deux doubles DISTINCTS : c'est ce qui permet de dire lequel a servi.
    // Un double unique rendrait la règle inobservable — le piège « la porte
    // fermée, la valeur oubliée » de CLAUDE.md.
    fetchNu = vi.fn(async () => ({ via: 'fetch-nu' }));
    fetchDeLaRequete = vi.fn(async () => ({ via: 'requete' }));
    vi.stubGlobal('$fetch', fetchNu);
    vi.stubGlobal('useRequestFetch', () => fetchDeLaRequete);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GARDE-FOU : les deux doubles sont bien distincts et joignables', async () => {
    // Sans ce cas, un harnais cassé rendrait la règle ci-dessous vraie à vide.
    expect(await fetchNu()).toEqual({ via: 'fetch-nu' });
    expect(await fetchDeLaRequete()).toEqual({ via: 'requete' });
    expect(fetchNu).not.toBe(fetchDeLaRequete);
  });

  it('LA RÈGLE : c’est le fetch de la requête qui part, pas $fetch nu', async () => {
    const rendu = await appelApi<{ via: string }>('/api/ruches');

    expect(
      rendu.via,
      'appelApi est passé par `$fetch` nu : pendant le rendu serveur, le cookie de session ' +
        'ne serait pas transmis, et toute page authentifiée non-`lazy` se rendrait VIDE. ' +
        'Aucune porte de la CI ne le dirait — `verifier:ssr` ne visite que des pages publiques.',
    ).toBe('requete');
    expect(fetchNu, '`$fetch` nu ne doit jamais être appelé directement').not.toHaveBeenCalled();
  });

  it('LA RÈGLE : l’URL et les options traversent sans être retouchées', async () => {
    const options = { method: 'POST', body: { a: 1 } };
    await appelApi<unknown>('/api/interventions', options);

    expect(fetchDeLaRequete).toHaveBeenCalledWith('/api/interventions', options);
  });

  it('CONTRÔLE POSITIF : le module ne mentionne aucun `$fetch(` appelé', () => {
    /**
     * ⚠️ CE CAS EXISTE PARCE QUE LE PRÉCÉDENT NE SUFFIT PAS SEUL. Un jour où
     * `useRequestFetch` serait indisponible, un repli `?? $fetch` rendrait le
     * banc du dessus vert (le double est là) tout en réintroduisant le chemin
     * nu en production. On regarde donc aussi ce que le module ÉCRIT — et on
     * vise l'APPEL, pas le mot : `$fetch` reste cité dans les commentaires qui
     * expliquent précisément pourquoi on ne l'utilise plus.
     */
    const source = readFileSync('app/utils/appelApi.ts', 'utf-8');
    const corps = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

    expect(
      /(?<![\w.])\$fetch\s*[<(]/.test(corps),
      'le corps de `appelApi` appelle `$fetch` directement : le forward des en-têtes ' +
        'de la requête peut être contourné.',
    ).toBe(false);
    expect(
      corps.includes('useRequestFetch'),
      'le corps de `appelApi` n’appelle plus `useRequestFetch` du tout.',
    ).toBe(true);
  });
});
