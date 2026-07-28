import { describe, it, expect } from 'vitest';
import { PATCH_NOTE } from '~/config/patchNotes';

/**
 * La note de patch est vue UNE fois par apiculteur, à la première connexion qui
 * suit une mise à jour. Personne ne la relira pour corriger une coquille : ce
 * banc verrouille ce qui, s'il cassait, casserait en silence pour tout le monde
 * en même temps.
 */
describe('note de patch', () => {
  it('porte un identifiant de version exploitable', () => {
    // C'est LUI qui décide de re-montrer l'annonce (usePatchNotes compare la
    // valeur stockée). Vide ou avec une espace parasite, la comparaison se
    // décale et l'annonce se remontre à chaque connexion.
    expect(PATCH_NOTE.id.trim()).toBe(PATCH_NOTE.id);
    expect(PATCH_NOTE.id.length).toBeGreaterThan(0);
  });

  it('annonce entre 3 et 8 nouveautés', () => {
    // Au-delà de 8, la cascade `.animate-stagger` de main.css n'a plus de retard
    // à donner (nth-child s'arrête à 8) : les entrées suivantes surgiraient
    // toutes ensemble, en décalage avec les premières.
    expect(PATCH_NOTE.nouveautes.length).toBeGreaterThanOrEqual(3);
    expect(PATCH_NOTE.nouveautes.length).toBeLessThanOrEqual(8);
  });

  it('n’utilise que des icônes lucide réellement chargeables', () => {
    // Le bundle d'icônes est en mode `local` et ne contient QUE lucide : un
    // préfixe d'une autre collection rend un carré vide en production.
    for (const n of PATCH_NOTE.nouveautes) {
      expect(n.icone).toMatch(/^i-lucide-[a-z0-9-]+$/);
    }
  });

  it('ne répète ni une icône ni un titre', () => {
    const icones = PATCH_NOTE.nouveautes.map((n) => n.icone);
    const titres = PATCH_NOTE.nouveautes.map((n) => n.titre);
    expect(new Set(icones).size).toBe(icones.length);
    expect(new Set(titres).size).toBe(titres.length);
  });

  it('n’affiche aucun libellé vide ou mal détouré', () => {
    const textes = [
      PATCH_NOTE.badge,
      PATCH_NOTE.titre,
      PATCH_NOTE.sousTitre,
      PATCH_NOTE.cta,
      ...(PATCH_NOTE.pied ? [PATCH_NOTE.pied] : []),
      ...PATCH_NOTE.nouveautes.flatMap((n) => [n.titre, n.texte]),
    ];
    for (const t of textes) {
      expect(t.length).toBeGreaterThan(0);
      expect(t.trim()).toBe(t);
    }
  });

  it('garde un badge et un bouton assez courts pour ne pas déborder', () => {
    // Le badge est une pastille d'en-tête et le bouton fait toute la largeur
    // d'une modale de 420 px : au-delà, ça se coupe sur un téléphone.
    expect(PATCH_NOTE.badge.length).toBeLessThanOrEqual(18);
    expect(PATCH_NOTE.cta.length).toBeLessThanOrEqual(28);
  });
});
