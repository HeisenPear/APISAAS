// ═══════════════════════════════════════════════════════════════════════════
// « UN COMPOSANT SE MONTE, ET PERSONNE NE LE FAISAIT. »
//
// La moitié « prévenir » du chantier frelon — annoncer la disparition d'un
// signalement avant qu'elle n'arrive — n'était tenue par RIEN. Une revue l'a
// mesuré : remplacer le calcul par `return null` laissait les quarante-neuf
// bancs frelon VERTS. Personne ne montait `/frelon` : ni banc de composant
// (`@vue/test-utils` et `happy-dom` sont pourtant installés), ni spec
// Playwright.
//
// C'est le piège nommé au §3 de CLAUDE.md, et le remède y est écrit aussi :
// faire descendre la décision dans une pièce qu'on peut monter. D'où
// l'extraction de ce bandeau hors des 785 lignes de la page.
//
// ─── CE QUI SE JOUE POUR L'APICULTEUR ──────────────────────────────────────
// Un nid qui s'efface sans prévenir est une information perdue. Celui qui passe
// devant chaque semaine n'a aucune raison de le confirmer s'il ignore qu'il va
// partir — et c'est presque toujours celui qui l'a signalé.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · remplacer le corps du `computed` par `return null` ;
//   · retirer la garde `if (restant > 30)` (le bandeau crierait en permanence) ;
//   · retirer `dernier-signe-de-vie` de la page.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import BandeauSilence from '~~/app/components/frelon/BandeauSilence.vue';
import { PEREMPTION_JOURS } from '~~/app/utils/frelonFiabilite';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

beforeEach(() => {
  vi.stubGlobal('computed', computed);
});

const MAINTENANT = new Date('2026-09-04T12:00:00Z');
const ilYA = (jours: number) => new Date(MAINTENANT.getTime() - jours * 86_400_000).toISOString();

const rendu = (dernierSigneDeVie: string | null) =>
  mount(BandeauSilence, { props: { dernierSigneDeVie, maintenant: MAINTENANT } }).text();

describe('le bandeau ne parle que quand il faut', () => {
  it('GARDE-FOU : un signalement frais n’affiche RIEN', () => {
    // Un bandeau permanent ne serait plus un avertissement, juste du décor —
    // et il passerait toutes les règles suivantes.
    expect(rendu(ilYA(0))).toBe('');
    expect(rendu(ilYA(30))).toBe('');
  });

  it('LA RÈGLE : le dernier mois, il annonce l’échéance', () => {
    const texte = rendu(ilYA(PEREMPTION_JOURS - 14));
    expect(texte).not.toBe('');
    expect(texte, 'l’échéance').toMatch(/quittera la carte dans/);
    expect(texte, 'la porte de sortie').toMatch(/confirmez-le/i);
  });

  it('il dit depuis combien de temps le silence dure', () => {
    expect(rendu(ilYA(PEREMPTION_JOURS - 10))).toMatch(
      new RegExp(`${PEREMPTION_JOURS - 10} jours`),
    );
  });

  it('sans date, il se tait au lieu d’exploser', () => {
    // La route peut ne pas renvoyer la colonne (déploiement décalé, cache) :
    // un bandeau qui planterait emporterait tout le panneau de détail.
    expect(rendu(null)).toBe('');
  });

  it('il traverse les trente derniers jours sans phrase bancale', () => {
    for (let j = PEREMPTION_JOURS - 30; j < PEREMPTION_JOURS; j++) {
      const t = rendu(ilYA(j));
      expect(t, `à ${j} jours`).not.toBe('');
      expect(t, `à ${j} jours`).not.toMatch(/dans 0 /);
      expect(t, `à ${j} jours`).not.toMatch(/\b1 semaines\b/);
    }
  });
});

describe('la page branche bien le bandeau', () => {
  const PAGE = corpsDuComposant('app/pages/frelon.vue');

  it('GARDE-FOU : le balayage lit bien la page', () => {
    expect(PAGE.length).toBeGreaterThan(1000);
    expect(PAGE).toContain('scoreFiabilite');
  });

  it('elle lui passe le dernier signe de vie', () => {
    // Sans cette liaison, le composant se tairait toujours — et le banc
    // ci-dessus mesurerait un bandeau que personne n'affiche.
    expect(PAGE).toContain('<FrelonBandeauSilence');
    expect(PAGE).toContain(':dernier-signe-de-vie=');
  });

  it('la route renvoie bien cette date', () => {
    // La chaîne complète : SQL → route → page → bandeau. Rompue à un maillon,
    // l'apiculteur ne voit rien venir.
    const route = readFileSync('server/api/frelon/index.get.ts', 'utf8');
    expect(route).toMatch(/dernierSigneDeVie:/);
  });
});
