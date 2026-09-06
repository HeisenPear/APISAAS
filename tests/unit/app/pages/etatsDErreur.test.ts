// ═══════════════════════════════════════════════════════════════════════════
// QUAND LE SERVEUR TOMBE, L'APPLICATION NE DOIT PAS DIRE « TU N'AS RIEN ».
//
// C'est le pire message qu'un logiciel de gestion puisse afficher. Pas une
// erreur : une AFFIRMATION FAUSSE sur les données de quelqu'un.
//
// Le cas mesuré sur `clients/index.vue` avant correction :
//
//     useFetch('/api/clients', { default: () => ({ data: [] }), lazy: true })
//     …
//     <UiEmptyState v-else-if="clientsList.length === 0"
//        title="Votre carnet de clients est vierge"
//        action-label="Nouveau client" />
//
// L'appel échoue (500, réseau coupé, lambda gelée) → `data` retombe sur le
// `default` → la liste est vide → l'apiculteur qui a 200 clients lit « Votre
// carnet de clients est vierge » et se voit proposer d'en créer un premier.
//
// Rien ne le rattrapait : le seul intercepteur global
// (`upgrade-interceptor.client.ts`) ne traite QUE les 402 de plan. Un 500 ou une
// coupure réseau ne produit ni message, ni toast, ni trace visible.
//
// ─── L'INVARIANT ───────────────────────────────────────────────────────────
// Une page qui charge des données ET sait dire « c'est vide » doit savoir dire
// « je n'ai pas pu charger ». Les deux états sont indiscernables pour
// l'utilisateur s'il n'y en a qu'un — et c'est le mauvais qui s'affiche.
//
// Le composant existait déjà (`UiErrorState`, avec son bouton « Réessayer ») et
// n'était branché que sur quatre pages. Ce banc vérifie qu'il l'est partout où
// il le faut.
// ═══════════════════════════════════════════════════════════════════════════

import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PAGES = globSync('app/pages/**/*.vue').sort();

interface Page {
  fichier: string;
  source: string;
  /** La page va chercher des données au serveur. */
  charge: boolean;
  /** Elle sait afficher « il n'y a rien ». */
  ditVide: boolean;
  /** Elle sait afficher « je n'ai pas pu charger ». */
  ditEchec: boolean;
}

const ANALYSE: Page[] = PAGES.map((fichier) => {
  const source = readFileSync(fichier, 'utf-8');
  return {
    fichier,
    source,
    charge: /useFetch|useAsyncData/.test(source),
    // Le composant dédié, MAIS AUSSI un état vide écrit à la main — une simple
    // branche sur une longueur nulle (« <p v-if="x.length === 0">Aucun rucher »).
    //
    // Cette seconde forme a été ajoutée après coup, et elle est la raison d'être
    // de ce banc : ma première version ne cherchait que `UiEmptyState`, et
    // laissait donc passer le pire cas de tous — `exports/registre.vue`, le
    // registre d'élevage. Ce document se présente à un contrôle sanitaire, et il
    // s'imprimait « Aucun rucher / Aucune ruche » quand l'appel échouait.
    // L'apiculteur attestait par écrit ne rien posséder.
    ditVide:
      /UiEmptyState|<EmptyState/.test(source) ||
      /v-(if|else-if)="[^"]*\.length === 0[^"]*"/.test(source),
    // Soit le composant dédié, soit une branche de template pilotée par `error`
    // (certaines pages rendent leur propre encart plutôt que le composant).
    // ⚠️ Détection DÉLIBÉRÉMENT étroite. J'y avais ajouté « un `catch` qui
    // notifie avec `getApiErrorMessage` » pour créditer les pages qui préviennent
    // par une notification plutôt que par un encart. Une mutation l'a réfutée :
    // en remettant le message figé « Bon de livraison introuvable » sur l'échec
    // de CHARGEMENT, le banc restait vert — parce que la page notifie
    // correctement sur ses écritures (modifier, supprimer, convertir), et que le
    // motif ne distingue pas les deux. Un test qui crédite une page pour du code
    // qui n'a rien à voir est pire qu'un test absent.
    ditEchec:
      /UiErrorState|<ErrorState/.test(source) || /v-(if|else-if)="[^"]*\berror\b/.test(source),
  };
});

describe('états d’erreur des pages', () => {
  it('le balayage voit bien les pages (garde-fou du banc)', () => {
    // Sans ce contrôle, un chemin erroné rendrait toutes les listes vides et
    // tous les cas verts — le banc mesurerait le néant.
    expect(PAGES.length).toBeGreaterThan(100);
    expect(ANALYSE.filter((p) => p.charge).length).toBeGreaterThan(30);
  });

  it('aucune page ne dit « tu n’as rien » sans savoir dire « je n’ai pas pu charger »', () => {
    // L'invariant. Une page qui affiche un état vide sur des données chargées
    // DOIT distinguer les deux situations, sinon la panne se déguise en compte
    // vide — et invite l'apiculteur à ressaisir ce qu'il possède déjà.
    const menteuses = ANALYSE.filter((p) => p.charge && p.ditVide && !p.ditEchec).map(
      (p) => p.fichier,
    );
    expect(menteuses).toEqual([]);
  });

  it('le repli `default:` ne masque jamais l’échec à lui seul', () => {
    // Le repli est ce qui rend le mensonge SILENCIEUX : sans lui, `data` reste
    // `null` et la page a au moins une chance de s'en apercevoir. Une page qui
    // se donne un repli vide doit d'autant plus afficher l'erreur.
    const replisAveugles = ANALYSE.filter(
      (p) => p.charge && /default:\s*\(\)\s*=>/.test(p.source) && !p.ditEchec && p.ditVide,
    ).map((p) => p.fichier);
    expect(replisAveugles).toEqual([]);
  });

  it('aucun DOCUMENT IMPRIMABLE ne se rend sur des données manquantes', () => {
    // Invariant plus strict, pour une raison plus grave : ces pages ne sont pas
    // consultées, elles sont IMPRIMÉES et remises à quelqu'un. Registre
    // d'élevage lors d'un contrôle sanitaire, bilan annuel au comptable,
    // facture au client, rapport de ruche.
    //
    // Un écran incomplet se corrige d'un rechargement. Un document faux, une
    // fois sorti de l'imprimante, circule tel quel : il atteste que l'apiculteur
    // n'a aucune ruche, ou qu'il n'a rien vendu de l'année. Ces pages doivent
    // donc REFUSER de se rendre plutôt que d'en produire une version amputée
    // d'apparence normale.
    // Volontairement SANS le filtre `charge` : un document imprimable va
    // forcément chercher ses données, que ce soit par `useFetch` ou par un
    // `$fetch` dans une fonction de chargement. `bons-livraison/[id].vue` est
    // exactement ce second cas — il échappait au balayage tant qu'on exigeait
    // `useFetch`, alors que c'est un document qu'on remet à un client.
    const documents = ANALYSE.filter((p) =>
      /print-document|handlePrint|window\.print/.test(p.source),
    );
    expect(documents.length, 'aucun document imprimable détecté').toBeGreaterThanOrEqual(5);

    const sansGarde = documents.filter((p) => !p.ditEchec).map((p) => p.fichier);
    expect(sansGarde).toEqual([]);
  });

  it('le composant d’erreur reste branché sur les pages de liste principales', () => {
    // Épingle nommément les écrans les plus consultés : un balayage seul
    // passerait au vert si quelqu'un retirait à la fois l'état vide et l'état
    // d'erreur d'une page — ce qui n'est pas une correction.
    const principales = [
      'app/pages/clients/index.vue',
      'app/pages/ruches/index.vue',
      'app/pages/interventions/index.vue',
      'app/pages/stocks/index.vue',
      'app/pages/finances/ventes.vue',
    ];
    const sansErreur = principales.filter((f) => !ANALYSE.find((p) => p.fichier === f)?.ditEchec);
    expect(sansErreur).toEqual([]);
  });
});
