import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { PLAN_CONFIGS } from '~/config/plans';
import { CATEGORIES_NOTIF, CATEGORIE_PAR_TYPE } from '~~/server/utils/alertesCategories';

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

  it('les chapitres sont montés, et dans l’ordre du récit', () => {
    // « Raisonne » vient APRÈS « Propose » : la question qui suit une
    // proposition, c'est « d'où sort-elle ? ». L'ordre porte le sens.
    const ordre = ['Veille', 'Propose', 'Raisonne', 'Reagit', 'Anticipe', 'Parle', 'Limites'];
    const positions = ordre.map((c) => PAGE.indexOf(`<LandingMaya${c} />`));
    expect(
      positions.filter((p) => p === -1),
      'chapitre(s) absent(s) de la page',
    ).toEqual([]);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe('chapitre « Comment elle raisonne » — les chiffres annoncés', () => {
  const CHAPITRE = sansCommentaires(
    readFileSync('app/components/landing/maya/MayaRaisonne.vue', 'utf-8'),
  );

  /**
   * Le chapitre écrit « Vingt-six situations surveillées, réparties en six
   * familles ». Ces deux nombres viennent du moteur d'alertes, qui grossit à
   * chaque version — et une page qui annonce vingt-six quand le produit en
   * surveille trente ne ment pas seulement : elle se sous-vend.
   *
   * Le banc lit les nombres EN TOUTES LETTRES dans la page et les confronte au
   * code. Écrit à l'envers — chercher « vingt-six » dans le texte — il serait
   * satisfait par sa propre phrase, piège déjà tombé dans ce dépôt.
   */
  const EN_LETTRES: Record<number, string> = {
    6: 'six',
    26: 'vingt-six',
  };

  it('les vingt-six situations surveillées sont bien vingt-six', () => {
    const reels = Object.keys(CATEGORIE_PAR_TYPE).length;
    expect(
      CHAPITRE.toLowerCase(),
      `Le moteur surveille désormais ${reels} situations (${EN_LETTRES[reels] ?? reels}). ` +
        'Le temps 3 de app/components/landing/maya/MayaRaisonne.vue annonce un autre nombre.',
    ).toContain(`${EN_LETTRES[reels] ?? reels} situations`);
  });

  it('les six familles annoncées sont bien celles du moteur', () => {
    const reelles = CATEGORIES_NOTIF.length;
    expect(CHAPITRE.toLowerCase()).toContain(`${EN_LETTRES[reelles] ?? reelles} familles`);
  });

  it('les deux seules alertes qui percent la nuit sont bien les deux annoncées', () => {
    /**
     * La page promet : « Deux seulement vous réveillent la nuit ». C'est une
     * promesse de TRANQUILLITÉ, celle qui décide un apiculteur à laisser les
     * notifications actives. Le jour où une troisième alerte passe en priorité
     * critique, elle devient fausse — et l'apiculteur, réveillé pour rien,
     * coupera tout.
     *
     * On ne relit pas la page : on compte dans le moteur. Seule la priorité
     * `critique` traverse `dansHeuresCalmes` (server/utils/alertesPush.ts).
     */
    const sources = [
      'server/utils/alertes.ts',
      'server/utils/alertesAvancees.ts',
      'server/utils/alertesMeteo.ts',
      'server/utils/alertesSaison.ts',
      'server/utils/alertesExtra.ts',
      'server/utils/alertesCore.ts',
      'server/utils/balances/alertes.ts',
    ].filter((f) => existsSync(f));

    const critiques = new Set<string>();
    for (const f of sources) {
      const src = readFileSync(f, 'utf-8');
      for (const m of src.matchAll(/priorite:\s*'critique'/g)) {
        const avant = src.slice(0, m.index);
        const types = [...avant.matchAll(/type:\s*'([a-z_]+)'/g)];
        const dernier = types.at(-1)?.[1];
        if (dernier) critiques.add(dernier);
      }
    }

    expect(
      [...critiques].sort(),
      'Le jeu des alertes de priorité « critique » a changé. Le temps 3 de ' +
        'app/components/landing/maya/MayaRaisonne.vue annonce exactement deux ' +
        'réveils nocturnes : la balance et la loque. Réécrire la page, ou revoir ' +
        'la priorité.',
    ).toEqual(['balance_vol', 'maladie_loque']);
  });

  it('chaque temps nomme le fichier qui le tient — une promesse vérifiable', () => {
    // Un chapitre qui explique COMMENT elle raisonne perd tout si ses preuves
    // pointent des fichiers disparus. On vérifie qu'ils existent vraiment.
    const cites = [...CHAPITRE.matchAll(/preuve:\s*'([^']+)'/g)].map((m) => m[1]!);
    expect(cites.length, 'aucune preuve citée dans le chapitre').toBeGreaterThanOrEqual(4);
    for (const chemin of cites) {
      expect(existsSync(chemin), `preuve citée mais fichier absent : ${chemin}`).toBe(true);
    }
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
