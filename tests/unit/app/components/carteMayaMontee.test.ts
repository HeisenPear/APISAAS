// ═══════════════════════════════════════════════════════════════════════════
// « UN COMPOSANT SE MONTE, ET PERSONNE NE LE FAISAIT. »
//
// Le serveur compose désormais des propositions riches : un constat, la fiche
// qui l'explique, l'écran où agir. Tout cela ne vaut que si la carte les REND —
// et si le clic envoie la bonne chose.
//
// ─── LE PIÈGE PRÉCIS QU'ON GARDE ICI ───────────────────────────────────────
// C'est celui de CLAUDE.md, « la porte fermée, la valeur oubliée » : un banc
// sur la DÉCISION ne suffit pas, il en faut un sur l'EMPLOI. Le libellé d'un
// bouton (« Traiter le varroa ») et la question envoyée (« Comment traiter le
// varroa ? ») sont DEUX choses. Envoyer le libellé au lieu de la question
// paraîtrait correct à l'écran — le bouton porte le bon mot — et Maya
// répondrait à côté, voire « je n'ai pas compris ». Aucun banc serveur ne peut
// voir ça : la valeur ne part pas du serveur.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · `@click="demander(it.pourquoi.libelle)"` au lieu de `.question` ;
//   · retirer le `v-if="afficher"` de la section (la carte parlerait au calme) ;
//   · retirer `maya.proactif` de `mayaDisponible` (elle parlerait en pause).
// ═══════════════════════════════════════════════════════════════════════════

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive, ref, watch } from 'vue';
import MayaContextCard from '~~/app/components/ia/MayaContextCard.vue';
import type { Brief } from '~~/server/utils/maya-brief';

const STUBS = {
  UIcon: { template: '<i />', props: ['name'] },
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
  IaMayaMark: { template: '<span />', props: ['size', 'state'] },
};

/** Ce qui est RÉELLEMENT parti vers Maya quand on touche un bouton. */
let questionsPosees: string[];
let proactif: boolean;
let aLaFeature: boolean;
let briefServi: Brief;

beforeEach(() => {
  questionsPosees = [];
  proactif = true;
  aLaFeature = true;
  briefServi = {
    salutation: '',
    intro: 'Côté colonies, voici ce qui attire mon œil :',
    items: [
      {
        texte: 'La ruche 4 (Le Chêne) est à 22/100 — fragile, vue il y a 40 jours.',
        ton: 'clay',
        pourquoi: { libelle: 'Traiter le varroa', question: 'Comment traiter le varroa ?' },
        ecran: { to: '/alertes', libelle: 'Ce que j’ai relevé' },
      },
    ],
    relance: { amorce: 'Je peux regarder ça de plus près.', question: 'Fais-moi un point santé' },
  };

  vi.stubGlobal('ref', ref);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('useSubscription', () => ({ aAcces: () => aLaFeature }));
  /**
   * ⚠️ LE DOUBLE PASSE PAR `reactive`, ET CE N'EST PAS UN DÉTAIL DE STYLE.
   *
   * `proactif` est un `computed` du magasin, mais un magasin Pinia est un objet
   * `reactive` : lire `maya.proactif` rend donc le BOOLÉEN, pas la ref. Une
   * première version de ce double renvoyait la ref telle quelle — un objet,
   * donc toujours vrai. La carte restait affichée Maya en pause, et le banc
   * accusait le composant. Un double plus permissif que le réel cache
   * exactement le défaut qu'on prétend garder ; `reactive` reproduit le
   * déballage de Pinia à l'identique.
   */
  vi.stubGlobal('useMayaStore', () =>
    reactive({
      proactif: computed(() => proactif),
      poserQuestion: (q: string) => questionsPosees.push(q),
    }),
  );
  /**
   * ⚠️ `useAsyncData`, ET PLUS `useFetch` — LE DOUBLE SUIT LE COMPOSANT.
   *
   * La carte est passée à `useAsyncData` + `appelApi` (cf.
   * `app/utils/appelApi.ts` : le chemin n'est plus résolu contre l'union des
   * routes). Un double resté sur `useFetch` ne rate pas discrètement : le
   * montage lève `useAsyncData is not defined` et les sept cas tombent d'un
   * coup — c'est ce qui a désigné ce fichier. La forme de retour ne change pas,
   * et le handler n'est jamais appelé : aucun réseau n'est touché.
   */
  vi.stubGlobal('useAsyncData', () => ({
    data: ref({ data: briefServi }),
    error: ref(null),
    execute: vi.fn(),
  }));
});

const rendre = () =>
  mount(MayaContextCard, { props: { contexte: 'ruches' }, global: { stubs: STUBS } });

describe('la carte rend ce que le serveur a composé', () => {
  it('GARDE-FOU : le constat, sa fiche et son écran sont bien à l’écran', () => {
    // Sans ce cas, une carte qui ne rendrait plus rien passerait toutes les
    // règles suivantes — « le balayage vide », transposé à un montage.
    const w = rendre();
    expect(w.text()).toContain('La ruche 4 (Le Chêne) est à 22/100');
    expect(w.text()).toContain('Traiter le varroa');
    expect(w.find('a[href="/alertes"]').exists(), 'l’écran est un vrai lien').toBe(true);
    expect(w.text()).toContain('Fais-moi un point santé');
  });

  it('LA RÈGLE : le bouton envoie la QUESTION, pas son libellé', async () => {
    /**
     * ⚠️ LES DEUX SONT DIFFÉRENTS À DESSEIN. « Traiter le varroa » tient à côté
     * d'un constat ; « Comment traiter le varroa ? » est ce que le moteur sait
     * router — et c'est cette formulation-là qui a été MESURÉE contre le
     * classificateur, côté serveur. Envoyer le libellé rendrait le bouton
     * parfaitement normal à l'écran et la réponse à côté de la plaque.
     */
    const w = rendre();
    await w.findAll('button')[0]!.trigger('click');
    expect(questionsPosees).toEqual(['Comment traiter le varroa ?']);
  });

  it('la perche envoie sa question, qui est aussi son libellé', async () => {
    // Ici l'apiculteur voit exactement ce qui part en son nom : les deux se
    // confondent volontairement, contrairement au « pourquoi ».
    const w = rendre();
    const boutons = w.findAll('button');
    await boutons[boutons.length - 1]!.trigger('click');
    expect(questionsPosees).toEqual(['Fais-moi un point santé']);
  });

  it('un constat sans suite n’affiche aucun bouton', () => {
    briefServi = {
      salutation: '',
      intro: 'x',
      items: [{ texte: 'Un simple constat.', ton: 'neutre' }],
    };
    const w = rendre();
    expect(w.text()).toContain('Un simple constat.');
    expect(w.findAll('button')).toHaveLength(0);
  });
});

describe('la carte se tait quand elle le doit', () => {
  it('aucune proposition ⟹ rien du tout à l’écran', () => {
    briefServi = { salutation: '', intro: '', items: [] };
    expect(rendre().text()).toBe('');
  });

  it('Maya en pause ou en discret ⟹ rien du tout', () => {
    // Une surface PROACTIVE ne s'invite qu'en présence « partout ».
    proactif = false;
    expect(rendre().text()).toBe('');
  });

  it('formule sans Maya ⟹ rien du tout, et aucun appel', () => {
    // Sans ce garde, l'appel partait, le serveur répondait 402, et
    // l'intercepteur global ouvrait le modal d'abonnement tout seul.
    aLaFeature = false;
    expect(rendre().text()).toBe('');
  });
});
