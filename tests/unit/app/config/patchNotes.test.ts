import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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

  it('n’annonce pas plus d’entrées que la cascade n’en sait décaler', () => {
    // Le plafond n'est pas une opinion : `.animate-stagger` de main.css donne
    // son retard par `nth-child`, un par un. Au-delà du dernier rang écrit, les
    // entrées surgissent toutes ensemble, en décalage avec les premières.
    //
    // On LIT donc le plafond dans le CSS au lieu de le recopier ici. Recopié, il
    // aurait dérivé le jour où la liste s'allonge — c'est exactement ce qui est
    // arrivé : la note est passée à dix entrées alors que la cascade s'arrêtait
    // à huit.
    const css = readFileSync('app/assets/css/main.css', 'utf-8');
    const rangs = [...css.matchAll(/\.animate-stagger > \*:nth-child\((\d+)\)/g)].map((m) =>
      Number(m[1]),
    );
    expect(rangs.length, 'cascade introuvable dans main.css').toBeGreaterThan(0);

    // Le bloc « sécurité » est un enfant de plus dans le même conteneur.
    const enfants = PATCH_NOTE.nouveautes.length + (PATCH_NOTE.securite ? 1 : 0);
    expect(PATCH_NOTE.nouveautes.length).toBeGreaterThanOrEqual(3);
    expect(
      enfants,
      `La note rend ${enfants} blocs, la cascade n'en décale que ${Math.max(...rangs)}. ` +
        'Ajoute les rangs manquants dans main.css, ou raccourcis la note.',
    ).toBeLessThanOrEqual(Math.max(...rangs));
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
