import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { PLAN_CONFIGS } from '~/config/plans';
import { CATEGORIES_NOTIF, CATEGORIE_PAR_TYPE } from '~~/server/utils/alertesCategories';
import { intervalleVisiteJours } from '~~/server/utils/cadence';

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

  it('la page ne promet PAS un essai sans carte — Stripe en collecte toujours une', () => {
    /**
     * L'erreur la plus chère des trois que j'ai écrites sur cette page.
     *
     * `server/api/stripe/trial-checkout.post.ts` pose
     * `payment_method_collection: 'always'` : la carte est TOUJOURS collectée,
     * même si 0 € est débité pendant 60 jours. J'avais annoncé « 60 jours de Pro,
     * sans carte bancaire ». Un visiteur clique « Essayer gratuitement »,
     * découvre un formulaire de carte, et part — en ayant l'impression qu'on
     * lui a forcé la main. C'est aussi le genre d'écart qui se qualifie en
     * pratique commerciale trompeuse.
     *
     * Le reste du site dit juste : « sans carte » s'attache au plan DÉCOUVERTE
     * (tarifs.vue, faq.vue, conformite), jamais à l'essai Pro.
     *
     * Le banc lit la configuration Stripe plutôt que de faire confiance à une
     * chaîne : le jour où l'essai passerait réellement sans carte, il rendra la
     * formulation à nouveau permise, au lieu de l'interdire pour toujours.
     */
    const stripe = readFileSync('server/api/stripe/trial-checkout.post.ts', 'utf-8');
    const carteCollectee = /payment_method_collection:\s*'always'/.test(stripe);

    expect(
      carteCollectee,
      'La collecte de carte a changé dans trial-checkout.post.ts — relire ce banc ' +
        'ET la page, la formulation autorisée en dépend.',
    ).toBe(true);

    if (carteCollectee) {
      const fautif = PAGE.match(/sans carte[^.<]*/i);
      expect(
        fautif?.[0] ?? null,
        'app/pages/maya.vue promet un essai « sans carte » alors que Stripe en ' +
          'collecte toujours une. Formulation juste, alignée sur tarifs.vue : ' +
          '« 0 € débité aujourd’hui ».',
      ).toBeNull();
    }
  });

  it('l’hébergement annoncé est celui de la politique de confidentialité', () => {
    /**
     * J'avais écrit « Données hébergées en UE ». Trop large : la BASE l'est —
     * Supabase, Francfort — mais Vercel, Stripe, Resend et Sentry sont aux
     * États-Unis sous clauses contractuelles types, et la politique de
     * confidentialité le dit noir sur blanc. Une page commerciale ne doit pas
     * être plus rassurante que le document qui engage juridiquement.
     */
    const politique = readFileSync('app/pages/politique-confidentialite.vue', 'utf-8');
    expect(
      politique,
      'Supabase n’est plus annoncé en UE dans la politique de confidentialité : ' +
        'la garantie de app/pages/maya.vue doit suivre.',
    ).toMatch(/name: 'Supabase'[^}]*location: 'UE/);

    // Et la page ne prétend pas que TOUT est en UE.
    expect(
      PAGE,
      'formulation trop large : plusieurs sous-traitants sont hors UE (sous CCT)',
    ).not.toMatch(/données héberg[ée]{1,2}s? en UE/i);
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

  it('les seuils apicoles cités sont ceux du moteur, saison par saison', () => {
    /**
     * J'avais écrit « quinze jours sans visite en pleine saison ». Faux deux
     * fois : le chiffre n'existe nulle part, et surtout l'intervalle n'est PAS
     * fixe — c'est tout le propos de server/utils/cadence.ts. Aplatir une règle
     * saisonnière en un délai unique, c'est vendre le produit moins bien qu'il
     * n'est, en plus de mentir.
     *
     * On lit donc les seuils dans le moteur, à une date de chaque saison.
     */
    const AVRIL = new Date('2026-04-15T12:00:00Z'); // printemps
    const OCTOBRE = new Date('2026-10-15T12:00:00Z'); // automne

    expect(intervalleVisiteJours(AVRIL), 'seuil de printemps').toBe(10);
    expect(intervalleVisiteJours(OCTOBRE), 'seuil d’automne').toBe(21);

    const texte = CHAPITRE.toLowerCase();
    expect(
      texte,
      `Le seuil de printemps vaut ${intervalleVisiteJours(AVRIL)} j : le temps 2 de ` +
        'MayaRaisonne.vue annonce « dix jours au printemps ».',
    ).toContain('dix jours au printemps');
    expect(texte).toContain('vingt et un à l’automne');

    // Et surtout : plus jamais de délai fixe présenté comme LA règle.
    expect(
      texte,
      'un intervalle de visite présenté comme fixe efface la logique saisonnière',
    ).not.toMatch(/quinze jours sans visite|vingt et un jours sans visite/);
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
