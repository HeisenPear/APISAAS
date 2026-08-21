import { describe, it, expect } from 'vitest';
import {
  cadenceFrappe,
  compterMots,
  dureeRevelation,
  PAS_MIN_MS,
  PAS_MAX_MS,
  DUREE_CIBLE_MS,
} from '~~/server/utils/maya-cadence';

/**
 * La cadence de frappe n'avait AUCUN banc — c'est ce qui a permis de la régler
 * trois fois à l'aveugle. Ce qui suit ne vérifie pas « la bonne vitesse » (c'est
 * un jugement, pas un invariant) mais les GARANTIES qu'elle doit tenir quelle
 * que soit la valeur choisie : bornée des deux côtés, monotone, et plafonnée en
 * durée totale.
 */
describe('cadenceFrappe — bornée des deux côtés', () => {
  it('ne descend jamais sous le pas minimum, même sur un texte énorme', () => {
    // 5 000 mots : 4000/5000 = 0,8 ms — sans borne, la révélation redevient un
    // bloc et l'effet de frappe disparaît complètement.
    expect(cadenceFrappe(5000)).toBe(PAS_MIN_MS);
    expect(cadenceFrappe(100000)).toBe(PAS_MIN_MS);
  });

  it('ne dépasse jamais le pas maximum, même sur un seul mot', () => {
    // 1 mot : 4000/1 = 4000 ms. Sans borne, « Oui. » mettrait quatre secondes.
    expect(cadenceFrappe(1)).toBe(PAS_MAX_MS);
    expect(cadenceFrappe(10)).toBe(PAS_MAX_MS);
  });

  it('reste dans ses bornes sur toute la plage utile', () => {
    for (let n = 1; n <= 2000; n++) {
      const pas = cadenceFrappe(n);
      expect(pas, `${n} mots`).toBeGreaterThanOrEqual(PAS_MIN_MS);
      expect(pas, `${n} mots`).toBeLessThanOrEqual(PAS_MAX_MS);
    }
  });

  it('ne s’accélère jamais quand le texte raccourcit', () => {
    // Monotonie : un texte plus court ne doit pas défiler PLUS vite qu'un long.
    // Sans cette garantie, une réponse de 40 mots pourrait passer plus vite
    // qu'une de 300 — l'inverse de l'intention.
    let precedent = 0;
    for (let n = 2000; n >= 1; n--) {
      const pas = cadenceFrappe(n);
      expect(pas, `${n} mots`).toBeGreaterThanOrEqual(precedent);
      precedent = pas;
    }
  });

  it('encaisse les entrées absurdes sans renvoyer n’importe quoi', () => {
    for (const n of [0, -1, -1000, 0.4, Number.NaN]) {
      const pas = cadenceFrappe(n);
      expect(Number.isFinite(pas), `${n}`).toBe(true);
      expect(pas, `${n}`).toBeGreaterThanOrEqual(PAS_MIN_MS);
      expect(pas, `${n}`).toBeLessThanOrEqual(PAS_MAX_MS);
    }
  });
});

describe('dureeRevelation — une longue réponse ne s’éternise pas', () => {
  it('plafonne autour de la durée visée dès que le texte est long', () => {
    // Le plafond n'est atteint QUE tant que le pas n'a pas touché son minimum.
    // Au-delà, la durée repart à la hausse — c'est assumé : mieux vaut une
    // très longue fiche qui prend 6 s qu'un pas de 2 ms qui ne se voit pas.
    const pivot = Math.floor(DUREE_CIBLE_MS / PAS_MIN_MS); // ≈ 444 mots
    for (const n of [125, 200, 300, pivot]) {
      expect(dureeRevelation(n), `${n} mots`).toBeLessThanOrEqual(DUREE_CIBLE_MS + 60);
    }
  });

  it('une réponse courte se pose au lieu d’apparaître d’un bloc', () => {
    // 8 mots × 32 ms ≈ 256 ms : court, mais assez pour lire une apparition.
    expect(dureeRevelation(8)).toBeGreaterThanOrEqual(200);
  });
});

describe('compterMots — la MÊME découpe que celle qui émet', () => {
  it('compte les mots, pas les séparateurs', () => {
    expect(compterMots('un deux trois')).toBe(3);
    expect(compterMots('un')).toBe(1);
  });

  it('encaisse les espaces multiples et les sauts de ligne', () => {
    expect(compterMots('un   deux\n\ntrois')).toBe(3);
  });

  it('ne renvoie jamais zéro — la division par le compte en dépend', () => {
    expect(compterMots('')).toBe(1);
    expect(compterMots('   ')).toBeGreaterThanOrEqual(1);
  });

  it('compte comme la découpe d’émission, pas approximativement', () => {
    /**
     * Le handler émet en itérant `texte.split(/(\s+)/)` et en poussant tous les
     * deux jetons. Si `compterMots` divisait autrement, la durée annoncée et la
     * durée réelle divergeraient — et le séquencement des blocs riches, qui se
     * cale dessus, glisserait sur les longues réponses.
     */
    const textes = ['a b c', 'Bonjour, je regarde vos ruches.', 'un\tdeux  trois\nquatre'];
    for (const t of textes) {
      const jetons = t.split(/(\s+)/);
      let emis = 0;
      let depuisFlush = 0;
      for (const _ of jetons) {
        depuisFlush += 1;
        if (depuisFlush >= 2) {
          emis += 1;
          depuisFlush = 0;
        }
      }
      // `emis` = nombre de salves poussées ; `compterMots` doit le suivre à 1 près
      // (le reliquat final part dans un dernier flush hors boucle).
      expect(Math.abs(compterMots(t) - emis), t).toBeLessThanOrEqual(1);
    }
  });
});
