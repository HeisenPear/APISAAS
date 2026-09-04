// ═══════════════════════════════════════════════════════════════════════════
// « LE REFUS EST UNE PHRASE, JAMAIS UN CODE. ET JAMAIS UN IDENTIFIANT
// TECHNIQUE : “10 factures ce mois-ci”, PAS “10 facturesParMois”. »
//
// La règle est écrite dans le dépôt. Elle était respectée D'UN SEUL CÔTÉ.
//
// Maya disait bien « tu es au plafond de ton plan Starter : 10 factures ce
// mois-ci » — sa table de mots vivait dans `server/utils/copilote-gating.ts`.
// Au même moment, sur le même compte et pour le même refus, la fenêtre
// d'abonnement affichait :
//
//     « Votre formule Découverte en autorise 10 (facturesParMois) »
//
// Un identifiant camelCase lâché dans une phrase commerciale, sur l'écran qui
// demande à l'apiculteur de payer. Ce n'était pas une seconde table qui avait
// divergé : c'était une table et un TROU — le client n'en avait aucune.
//
// La table vit désormais dans `app/config/libelles-limites.ts`, qui ne contient
// que des données et se lit donc des deux côtés de la frontière.
//
// ⚠️ LE BALAYAGE PART DE `LIBELLE_LIMITE`, JAMAIS D'UNE LISTE ÉCRITE ICI :
// une limite ajoutée demain est mesurée le jour même, et le compilateur exige
// déjà son mot.
// ═══════════════════════════════════════════════════════════════════════════

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref, watch } from 'vue';
import { LIBELLE_LIMITE, libelleLimite } from '~~/app/config/libelles-limites';
import type { PlanLimits } from '~~/app/config/plans';

const CLES = Object.keys(LIBELLE_LIMITE) as (keyof PlanLimits)[];

/** Les états partagés vus par le double de `useState`. */
const etats = new Map<string, unknown>();

function poserRefus(limite: keyof PlanLimits) {
  etats.set(
    'upgrade-modal-refus',
    ref({ code: 'LIMIT_REACHED', limit: limite, max: 10, currentPlan: 'decouverte' }),
  );
}

beforeEach(() => {
  etats.clear();
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('useState', <T>(cle: string, init: () => T) => {
    if (!etats.has(cle)) etats.set(cle, ref(init()));
    return etats.get(cle);
  });
  /**
   * Les auto-imports de Nuxt sont, sous Vitest, des identifiants libres. On
   * rend l'abonnement en cours — « découverte », celui qui déclenche le plus
   * de refus — et un `checkout` inerte : ce banc mesure ce qui est ÉCRIT, pas
   * ce qui est appelé.
   */
  vi.stubGlobal('useSubscription', () => ({
    currentPlan: ref('decouverte'),
    loading: ref(false),
    checkout: () => Promise.resolve(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function monter() {
  const Modal = (await import('~~/app/components/ui/UpgradeModal.vue')).default;
  return mount(Modal, {
    props: { modelValue: true },
    global: {
      stubs: {
        UModal: { template: '<div><slot name="content" /></div>' },
        UIcon: true,
        UButton: { template: '<button><slot /></button>' },
        NuxtLink: true,
      },
    },
  });
}

describe('garde-fou : la fenêtre parle bien du plafond', () => {
  it('elle affiche le nombre autorisé', async () => {
    /**
     * Sans ce cas, une fenêtre qui n'afficherait RIEN satisferait la règle
     * ci-dessous — le balayage vide, forme de faux vert la plus banale ici.
     */
    poserRefus('facturesParMois');
    const w = await monter();
    expect(w.text(), 'le plafond n’est même pas affiché').toContain('10');
  });

  it('le repli d’une clé inconnue est un mot français, pas la clé', () => {
    /**
     * ⚠️ « null, default et inconnu ne valent JAMAIS laisse-passer » a ici sa
     * variante d'écriture : rendre l'identifiant « au cas où » remettrait
     * exactement le défaut qu'on répare.
     */
    expect(libelleLimite('cleQuiNExistePas')).toBe('éléments');
    expect(libelleLimite(null)).toBe('éléments');
    expect(libelleLimite(undefined)).toBe('éléments');
  });

  it('le balayage voit toutes les limites du plan', () => {
    expect(CLES.length, 'aucune limite lue — la règle ne mesure rien').toBeGreaterThan(8);
    expect(CLES, 'la limite témoin a disparu').toContain('facturesParMois');
  });
});

describe('la RÈGLE : aucun identifiant technique dans un refus', () => {
  it('pour chacune des limites, la fenêtre dit le mot et jamais la clé', async () => {
    const fautes: string[] = [];
    for (const cle of CLES) {
      etats.clear();
      poserRefus(cle);
      const texte = (await monter()).text();
      const mot = LIBELLE_LIMITE[cle];
      /**
       * ⚠️ ON N'ACCUSE PAS UNE CLÉ QUI EST DÉJÀ SON PROPRE MOT. `clients` se
       * dit « clients », `balances` se dit « balances connectées » : la clé y
       * est un morceau du mot français, et la trouver à l'écran ne prouve
       * rien. C'est exactement la coïncidence qui a caché le défaut si
       * longtemps — tant que le seul plafond appliqué était `clients`, la
       * phrase se lisait très bien. Une première version de ce cas les
       * accusait toutes les deux : elle mesurait la langue française, pas le
       * jargon.
       */
      if (!mot.includes(cle) && texte.includes(cle)) {
        fautes.push(`« ${cle} » apparaît tel quel à l’écran`);
      }
      if (!texte.includes(mot)) fautes.push(`« ${mot} » n’apparaît pas pour ${cle}`);
    }

    expect(
      fautes,
      'Un refus qui affiche son identifiant technique parle au développeur, pas ' +
        'à l’apiculteur — et il le fait sur l’écran qui lui demande de payer.',
    ).toEqual([]);
  });
});
