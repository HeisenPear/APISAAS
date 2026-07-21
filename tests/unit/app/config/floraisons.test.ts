import { describe, it, expect } from 'vitest';
import {
  emojiEspece,
  couleurStade,
  labelStade,
  conseilStade,
  labelIntensite,
  STADES,
} from '~/config/floraisons';

describe('emojiEspece', () => {
  it("privilégie toujours l'emoji du référentiel quand il existe", () => {
    // Même si le nom matcherait une autre règle, le référentiel fait autorité.
    expect(emojiEspece('Colza', '🐝')).toBe('🐝');
  });

  it('reconnaît une espèce connue saisie librement', () => {
    expect(emojiEspece('acacia')).toBe('🌳');
    expect(emojiEspece('Tournesol')).toBe('🌻');
  });

  it('reconnaît malgré les accents et la casse', () => {
    expect(emojiEspece('Châtaignier')).toBe('🌰');
    expect(emojiEspece('CHATAIGNIER')).toBe('🌰');
    expect(emojiEspece('chataignier')).toBe('🌰');
  });

  it('reconnaît une espèce nommée au sein d’une phrase', () => {
    expect(emojiEspece('grand tilleul du bourg')).toBe('🌿');
  });

  it('retombe sur une fleur générique pour une espèce inconnue', () => {
    expect(emojiEspece('plante mystère')).toBe('🌸');
    expect(emojiEspece('')).toBe('🌸');
  });
});

describe('stades de floraison', () => {
  it('couvre les 4 stades du cycle, dans l’ordre', () => {
    expect(STADES.map((s) => s.value)).toEqual(['demarrage', 'pleine', 'fin', 'terminee']);
  });

  it('donne une couleur, un libellé et un conseil pour chaque stade', () => {
    for (const s of STADES) {
      expect(couleurStade(s.value)).toMatch(/^#[0-9a-f]{6}$/i);
      expect(labelStade(s.value).length).toBeGreaterThan(0);
      expect(conseilStade(s.value).length).toBeGreaterThan(0);
    }
  });

  it('ne renvoie jamais de vert (palette 100 % chaude)', () => {
    // Garde-fou de la décision produit : aucune teinte à dominante verte.
    for (const s of STADES) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(s.couleur.slice(i, i + 2), 16));
      expect(g).not.toBeGreaterThan(Math.max(r!, b!));
    }
  });
});

describe('labelIntensite', () => {
  it('traduit les intensités connues', () => {
    expect(labelIntensite('forte')).toBe('Forte');
    expect(labelIntensite('faible')).toBe('Faible');
  });

  it('affiche un tiret quand l’intensité est absente', () => {
    expect(labelIntensite(null)).toBe('—');
  });
});
