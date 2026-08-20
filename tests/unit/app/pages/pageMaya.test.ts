import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLAN_CONFIGS } from '~/config/plans';
import { CATEGORIES_NOTIF } from '~~/server/utils/alertesCategories';

/**
 * La page /maya vend Maya. Une page qui vend doit dire vrai, et deux de ses
 * affirmations sont adossées à des constantes du produit qui peuvent bouger
 * sans que personne ne repense à la page.
 *
 * Ce banc ne cherche pas des chaînes dans la page — ce piège s'est déjà produit
 * ici, un test satisfait par son propre commentaire. Il vérifie les FAITS du
 * produit dont la page dépend, et son message nomme la page à corriger.
 */

const SOURCE_PAGE = readFileSync('app/pages/maya.vue', 'utf-8');

/**
 * Ce qu'un visiteur peut RÉELLEMENT lire : on retire les commentaires.
 *
 * Sans ce nettoyage, le banc tombait sur l'en-tête de la page — qui cite la
 * formulation interdite pour expliquer pourquoi elle l'est. Un test qui
 * n'inspecte pas la même chose que l'œil du lecteur ne prouve rien.
 */
function sansCommentaires(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const PAGE = sansCommentaires(SOURCE_PAGE);

describe('page Maya — ce qu’elle promet doit rester vrai', () => {
  it('Maya n’est PAS incluse dans le plan gratuit — la page ne doit pas le laisser croire', () => {
    // La maquette d'origine annonçait « incluse dès le plan gratuit » et un badge
    // « Incluse dès Découverte ». `copiloteIa` est false sur `decouverte` : un
    // visiteur qui s'inscrirait en gratuit pour Maya ne l'aurait pas.
    //
    // Si ce test tombe parce que copiloteIa passe à true sur decouverte, tant
    // mieux — mais alors la page doit être réécrite, pas ce banc supprimé.
    expect(
      PLAN_CONFIGS.decouverte.features.copiloteIa,
      'copiloteIa est devenu vrai sur Découverte : app/pages/maya.vue annonce ' +
        '« à partir du plan Starter » et doit être réécrite.',
    ).toBe(false);

    expect(PLAN_CONFIGS.starter.features.copiloteIa).toBe(true);
    expect(PAGE).not.toMatch(/dès le plan gratuit|incluse dès découverte/i);
  });

  it('le prix affiché vient du catalogue, jamais d’une chaîne écrite dans la page', () => {
    // Les prix en dur dans une page ont déjà dérivé ici (ScenePlan.vue).
    expect(SOURCE_PAGE).toContain('PLAN_CONFIGS.starter.prix');
    const enDur = PAGE.match(/\d+[,.]\d{2}\s*€/g);
    expect(enDur, `prix écrit en dur dans la page : ${enDur?.join(', ')}`).toBeNull();
  });

  it('les six familles de règles annoncées sont bien celles du moteur', () => {
    // La page affiche « 6 · familles de règles en veille ».
    expect(
      CATEGORIES_NOTIF.length,
      'Le nombre de familles de notification a changé : app/pages/maya.vue en ' +
        'annonce 6 dans ses repères d’en-tête.',
    ).toBe(6);
  });

  it('les six chapitres sont montés, et dans l’ordre du récit', () => {
    const ordre = ['Veille', 'Propose', 'Reagit', 'Anticipe', 'Parle', 'Limites'];
    const positions = ordre.map((c) => PAGE.indexOf(`<LandingMaya${c} />`));
    expect(
      positions.filter((p) => p === -1),
      'chapitre(s) absent(s) de la page',
    ).toEqual([]);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe('landing — la section Maya est bien posée', () => {
  const INDEX = readFileSync('app/pages/index.vue', 'utf-8');

  it('la section Maya est montée sur la page d’accueil', () => {
    expect(INDEX).toContain('<LandingMaya />');
  });

  it('les sections qui portent la facturation n’ont pas été délogées', () => {
    // L'ajout de Maya ne doit rien retirer : la facturation électronique 2026 a
    // sa section dédiée, et quatre autres sections la mentionnent.
    for (const bloc of [
      '<LandingFacturationElec />',
      '<LandingFeatures />',
      '<LandingCompliance />',
      '<LandingComparison />',
      '<LandingAppPreview />',
      '<LandingPricing />',
    ]) {
      expect(INDEX, `${bloc} a disparu de la landing`).toContain(bloc);
    }
  });
});
