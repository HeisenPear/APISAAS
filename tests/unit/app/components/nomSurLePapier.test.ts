// ═══════════════════════════════════════════════════════════════════════════
// UNE ADRESSE EMAIL S'EST IMPRIMÉE SUR DES POTS DE MIEL.
//
// ─── LA CHAÎNE COMPLÈTE ────────────────────────────────────────────────────
//   app/pages/production/lots/[numero].vue   :producteur="auth.fullName"
//   app/stores/auth.ts                       [prenom, nom].join(' ') || email
//   PasseportPotQr.vue                       prod: props.producteur
//                                            → charge du QR
//                                            → fragment d'URL
//                                            → image collée sur le pot
//   app/pages/p.vue (page PUBLIQUE)          « par jean.dupont@gmail.com »
//
// Le repli sur l'email est parfaitement légitime dans la barre latérale :
// l'apiculteur doit se reconnaître quelque part. Il est catastrophique sur un
// document. C'est « la dispense plus large que son motif » de CLAUDE.md — le
// banc anti-recopie dispensait `auth.ts` pour ses emplois d'INTERFACE, et la
// dispense couvrait aussi celui-ci.
//
// ─── POURQUOI LA GARDE EST DANS LE COMPOSANT ───────────────────────────────
// Corriger l'appelant a laissé la mutation VERTE : le banc anti-recopie ne voit
// pas un getter, et rien n'empêchait de réécrire `auth.fullName` demain. La
// garde vit donc là où elle ne peut plus être contournée — dans le composant
// qui IMPRIME, qui garantit sa propre charge utile.
//
// ⚠️ AUCUN CORRECTIF NE RATTRAPE LE PAPIER. Une mention absente se corrige au
// prochain tirage ; une adresse gravée sur mille étiquettes ne se reprend pas.
// Devant un nom qu'on ne sait pas nommer, on n'imprime rien.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · retirer `nomImprimable()` de la charge du passeport ;
//   · faire rendre sa valeur telle quelle à `nomImprimable`.
// ═══════════════════════════════════════════════════════════════════════════

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { nomImprimable } from '~~/app/config/identite-emetteur';
import PasseportPotQr from '~~/app/components/production/PasseportPotQr.vue';

const STUBS = {
  UIcon: { template: '<i />', props: ['name'] },
  UButton: { template: '<button>{{ label }}</button>', props: ['label'] },
  NuxtLink: { template: '<a><slot /></a>', props: ['to'] },
};

const LOT = {
  id: 'l1',
  numeroLot: 'L-2026-001',
  typesMiel: ['acacia'],
  ddm: '2028-06-01',
  conditionnement: null,
  humidite: null,
  ecoScore: null,
};

beforeEach(() => {
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('useQrCode', () => ({ qrDataUrl: ref('data:image/png;base64,') }));
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { baseUrl: 'https://apigo.fr' } }));
});

/**
 * LA CHARGE RÉELLE DU QR, décodée.
 *
 * ⚠️ ON DÉCODE LE BASE64, ON NE SE CONTENTE PAS DU HTML. La charge part dans le
 * fragment d'URL sous forme base64 : chercher « @gmail.com » dans le HTML brut
 * ne l'y trouverait JAMAIS, et le banc serait vert quoi qu'il arrive — un faux
 * vert parfait, sur la garantie la plus difficile à rattraper du produit.
 */
function chargeDuQr(producteur: string): string {
  const html = mount(PasseportPotQr, {
    props: { lot: LOT, producteur, origine: 'France' },
    global: { stubs: STUBS },
  }).html();
  const m = html.match(/\/p#([A-Za-z0-9+/=_-]+)/);
  expect(m, 'le lien du passeport doit porter une charge').not.toBeNull();
  return Buffer.from(m![1]!, 'base64').toString('utf8');
}

describe('nomImprimable — ce qu’on accepte de graver', () => {
  it('GARDE-FOU : un vrai nom passe', () => {
    // Sans lui, une fonction qui rendrait TOUJOURS '' passerait les règles
    // suivantes et effacerait la mention producteur de toutes les étiquettes.
    expect(nomImprimable('Maël Dupont')).toBe('Maël Dupont');
    expect(nomImprimable('Le Rucher de Maël')).toBe('Le Rucher de Maël');
  });

  it('LA RÈGLE : une adresse email n’est pas un nom', () => {
    expect(nomImprimable('jean.dupont@gmail.com')).toBe('');
    expect(nomImprimable('  contact@rucher.fr  ')).toBe('');
  });

  it('le vide reste vide, sans exploser', () => {
    expect(nomImprimable(null)).toBe('');
    expect(nomImprimable(undefined)).toBe('');
    expect(nomImprimable('   ')).toBe('');
  });
});

describe('le passeport du pot ne grave jamais d’adresse', () => {
  it('GARDE-FOU : un vrai nom apparaît bien dans la charge du QR', () => {
    // Le balayage vide, transposé : un composant qui n'écrirait plus AUCUN
    // producteur passerait la règle suivante sans rien garantir.
    expect(chargeDuQr('Maël Dupont')).toContain('Maël Dupont');
  });

  it('LA RÈGLE : une adresse email n’atteint pas le papier', () => {
    const charge = chargeDuQr('jean.dupont@gmail.com');
    expect(charge, 'ce QR est collé sur des pots vendus au public').not.toContain('@gmail.com');
    expect(charge, 'la clé `prod` doit être absente, pas vide').not.toContain('"prod"');
  });
});
