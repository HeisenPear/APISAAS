// Les compteurs d'élevage et de transhumance sont des données PREMIUM.
//
// L'interface masque déjà leurs widgets par plan, mais l'API les servait à
// tout le monde. Sans conséquence pour un compte qui n'en a jamais eu — ses
// compteurs valent zéro. La fuite concerne le compte RÉTROGRADÉ : ses anciens
// chiffres d'élevage restaient lisibles dans la réponse brute.
//
// ─── POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT ────────────────────────────────────
// Sa première version redéclarait la règle dans le banc, puis la vérifiait
// contre elle-même. Elle n'importait AUCUN code du tableau de bord : elle
// serait restée verte avec un handler vide, ou avec le filtrage retiré.
//
// Un test qui définit ce qu'il mesure ne mesure rien. La règle vit maintenant
// dans `server/utils/agregatsPremium.ts`, la production l'applique, et ce banc
// exerce cette fonction-là.

import { describe, expect, it } from 'vitest';
import {
  FEATURE_PAR_COMPTEUR,
  servirCompteur,
  type CompteurPremium,
} from '~~/server/utils/agregatsPremium';
import { PLANS, hasFeature } from '~/config/plans';

const COMPTEURS = Object.keys(FEATURE_PAR_COMPTEUR) as CompteurPremium[];

describe('agrégats premium du tableau de bord', () => {
  it('sert la vraie valeur quand la formule comprend le compteur', () => {
    // Expert a l'élevage : il doit voir ses chiffres, pas des zéros. C'est le
    // sens « ce qui est vendu doit marcher » — un filtrage trop large serait
    // un faux blocage, pas une protection.
    expect(servirCompteur('expert', 'reines', 42)).toBe(42);
    expect(servirCompteur('expert', 'lignees', 7)).toBe(7);
    expect(servirCompteur('pro', 'transhumancesPrevues', 3)).toBe(3);
  });

  it('rend zéro quand la formule ne le comprend pas', () => {
    // Le cas qui compte : un compte RÉTROGRADÉ garde ses lignes en base, mais
    // l'API ne doit plus les servir.
    expect(servirCompteur('pro', 'reines', 42)).toBe(0);
    expect(servirCompteur('starter', 'lignees', 7)).toBe(0);
    expect(servirCompteur('starter', 'transhumancesPrevues', 3)).toBe(0);
    expect(servirCompteur('decouverte', 'cellulesAcceptees', 99)).toBe(0);
  });

  it('applique la même règle sur les quatre plans, pour chaque compteur', () => {
    for (const plan of PLANS) {
      for (const compteur of COMPTEURS) {
        const attendu = hasFeature(plan, FEATURE_PAR_COMPTEUR[compteur]) ? 42 : 0;
        expect(servirCompteur(plan, compteur, 42), `${plan} / ${compteur}`).toBe(attendu);
      }
    }
  });

  it('ne laisse aucun compteur rattaché à une feature morte', () => {
    // Une faute de frappe dans la table ne filtrerait jamais rien, et la donnée
    // continuerait de sortir sans que quoi que ce soit le signale.
    for (const compteur of COMPTEURS) {
      expect(hasFeature('expert', FEATURE_PAR_COMPTEUR[compteur]), compteur).toBe(true);
    }
  });

  it('le handler du tableau de bord passe bien par cette fonction', async () => {
    // Garde-fou de CÂBLAGE : si quelqu'un remet le filtrage en ligne dans le
    // handler, cette fonction cesserait d'être la source de vérité et ce banc
    // redeviendrait décoratif — exactement le défaut qu'on répare ici.
    const { readFileSync } = await import('node:fs');
    const source = readFileSync('server/api/dashboard/index.get.ts', 'utf-8');

    for (const compteur of COMPTEURS) {
      expect(source, `${compteur} doit passer par servirCompteur`).toContain(
        `servirCompteur(plan, '${compteur}'`,
      );
    }
  });
});
