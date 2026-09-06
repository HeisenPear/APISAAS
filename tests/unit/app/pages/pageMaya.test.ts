import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { PLAN_CONFIGS } from '~/config/plans';
import { FAMILLES_SURVEILLEES, SITUATIONS_SURVEILLEES } from '~~/server/utils/alertesCategories';
import { intervalleVisiteJours } from '~~/server/utils/cadence';
import { planifierPushDetaille, dansHeuresCalmes } from '~~/server/utils/alertesPush';
import {
  SEUIL_VOL_CHUTE_KG,
  SEUIL_VOL_POIDS_KG,
  HEURE_ESSAIMAGE_DEBUT,
  HEURE_ESSAIMAGE_FIN,
} from '~~/server/utils/balances/alertes';

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
    /**
     * La page affiche « 6 · familles de règles EN VEILLE ». C'est bien de
     * veille qu'elle parle : `FAMILLES_SURVEILLEES` et non `CATEGORIES_NOTIF`,
     * qui compte aussi les interrupteurs sans règle — « Communauté » gouverne
     * les réponses de forum, que le moteur ne guette pas.
     */
    expect(
      FAMILLES_SURVEILLEES.length,
      'Le nombre de familles de RÈGLES a changé : app/pages/maya.vue en annonce 6 ' +
        'dans ses repères d’en-tête. (Ajouter une catégorie de NOTIFICATION sans ' +
        'règle de surveillance ne doit pas bouger ce chiffre.)',
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
    /**
     * ⚠️ ON COMPTE CE QUE LE MOTEUR SURVEILLE, PAS TOUS LES TYPES D'ALERTE.
     * `CATEGORIE_PAR_TYPE` porte AUSSI les notifications purement sociales —
     * « on a répondu à votre sujet » — que le moteur ne guette pas : personne
     * ne les anticipe, aucune règle ne les produit. Les compter ici gonflerait
     * d'une unité une promesse faite sur une page publique, et une promesse
     * gonflée par accident reste une promesse fausse.
     *
     * `SITUATIONS_SURVEILLEES` est cette lecture-là, et elle est dérivée : une
     * vraie règle ajoutée demain fera monter le chiffre toute seule.
     */
    const reels = SITUATIONS_SURVEILLEES.length;
    expect(
      CHAPITRE.toLowerCase(),
      `Le moteur surveille désormais ${reels} situations (${EN_LETTRES[reels] ?? reels}). ` +
        'Le temps 3 de app/components/landing/maya/MayaRaisonne.vue annonce un autre nombre.',
    ).toContain(`${EN_LETTRES[reels] ?? reels} situations`);
  });

  it('les six familles annoncées sont bien celles du moteur', () => {
    // Même distinction : les familles de RÈGLES, pas les interrupteurs des
    // réglages. « Communauté » est un interrupteur sans règle de surveillance.
    const reelles = FAMILLES_SURVEILLEES.length;
    expect(CHAPITRE.toLowerCase()).toContain(`${EN_LETTRES[reelles] ?? reelles} familles`);
  });

  it('les exemples d’alertes nocturnes passent VRAIMENT la nuit', () => {
    /**
     * ⚠️ JE ME SUIS TROMPÉ DEUX FOIS SUR CE PARAGRAPHE. La première version
     * disait « le danger sanitaire » — faux, le tri est par priorité, pas par
     * famille. J'ai corrigé en « deux seulement vous réveillent » après avoir
     * compté les priorités « critique »… et c'était faux aussi, parce que
     * `alertesPush.ts:244` retient AUSSI les « haute » pendant les heures
     * calmes. Seules « basse » et « moyenne » sont différées.
     *
     * Deux erreurs venant du même geste : lire un commentaire au lieu du code,
     * puis compter la moitié de la règle. D'où ce banc, qui n'interprète plus
     * rien — il fait tourner le planificateur à 3 h du matin et regarde ce qui
     * sort.
     */
    const NUIT = new Date('2026-05-12T01:00:00Z'); // 3 h à Paris, heures calmes
    expect(dansHeuresCalmes(NUIT), 'la date de test doit être en heures calmes').toBe(true);

    // Les quatre situations que le chapitre cite en exemple.
    const cites = [
      { type: 'balance_vol', priorite: 'critique' as const },
      { type: 'maladie_loque', priorite: 'critique' as const },
      { type: 'balance_essaimage', priorite: 'haute' as const },
      { type: 'colonie_orpheline', priorite: 'haute' as const },
    ];
    // 4e paramètre = le plan : `peutRecevoir` gate certains types (les balances
    // sont une feature payante). On prend Expert pour tester la RÈGLE HORAIRE,
    // pas le gating — qui a ses propres bancs.
    const plan = planifierPushDetaille(cites, null, NUIT, 'expert');
    expect(
      plan.differees,
      'une situation citée comme urgence nocturne est en fait reportée au matin — ' +
        'le temps 3 de MayaRaisonne.vue nomme un mauvais exemple',
    ).toEqual([]);
    expect(plan.payloads.length, 'rien ne partirait la nuit pour ces alertes').toBeGreaterThan(0);

    // Et le confort, lui, attend bien le matin.
    const confort = planifierPushDetaille(
      [{ type: 'stock_bas', priorite: 'moyenne' as const }],
      null,
      NUIT,
      'expert',
    );
    expect(
      confort.differees.length,
      'une alerte de confort passerait la nuit : la page promet l’inverse',
    ).toBe(1);

    // Aucun NOMBRE annoncé : il bougerait à chaque type ajouté au moteur.
    expect(
      CHAPITRE.toLowerCase(),
      'annoncer un nombre d’alertes nocturnes le rend faux au prochain type ajouté',
    ).not.toMatch(/(deux|trois|\d+) seulement vous réveillent/);
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

  it('chaque temps reste rattaché à un fichier qui existe', () => {
    // La traçabilité sert au développeur qui doute d'une affirmation. Elle perd
    // tout si elle pointe un fichier disparu — d'où ce contrôle, même si le
    // chemin ne s'affiche plus.
    const cites = [...CHAPITRE.matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]!);
    expect(cites.length, 'aucune source rattachée aux temps du chapitre').toBeGreaterThanOrEqual(4);
    for (const chemin of cites) {
      expect(existsSync(chemin), `source citée mais fichier absent : ${chemin}`).toBe(true);
    }
  });

  it('aucun chemin de fichier ne s’AFFICHE sur la page', () => {
    /**
     * Ces chemins ont été visibles, en police à chasse fixe, sous chaque temps.
     * L'intention était bonne — une promesse qu'on peut aller vérifier — mais
     * « server/utils/copilote-data.ts » ne dit rien à un apiculteur : au mieux
     * ça l'intrigue, au pire ça fait brouillon sur la page qui vend le produit.
     *
     * On vérifie donc que le GABARIT n'interpole aucun chemin. Le contrôle
     * porte sur ce qui est rendu, pas sur les données : `source` a parfaitement
     * le droit d'exister dans le script.
     */
    const gabarit = CHAPITRE.slice(0, CHAPITRE.indexOf('<script'));
    expect(
      gabarit,
      'un chemin de fichier est interpolé dans le gabarit — il s’affichera au visiteur',
    ).not.toMatch(/\{\{\s*[\w.]*\bsource\b/);
    expect(gabarit, 'chemin de fichier écrit en clair dans le gabarit').not.toMatch(
      /(server|app)\/[\w/-]+\.(ts|vue)/,
    );
  });
});

describe('chapitre « Elle veille » — les seuils de balance annoncés', () => {
  const VEILLE = sansCommentaires(
    readFileSync('app/components/landing/maya/MayaVeille.vue', 'utf-8'),
  );

  /**
   * Le chapitre disait « une chute de plus de 2 kg en pleine nuit, c'est le
   * profil d'un vol ». Le vrai seuil est une chute d'au moins 10 kg AVEC un
   * poids restant sous 5 kg : la ruche n'est plus sur la balance.
   *
   * L'écart n'est pas cosmétique. Un apiculteur qui perd 2 kg une nuit, ne
   * reçoit rien et se souvient de cette phrase conclut que la détection ne
   * marche pas — alors qu'elle fait exactement ce qu'elle doit.
   */
  it('le seuil de vol annoncé est celui du détecteur', () => {
    expect(SEUIL_VOL_CHUTE_KG, 'chute minimale pour parler de vol').toBe(10);
    expect(SEUIL_VOL_POIDS_KG, 'poids restant sous lequel la ruche n’est plus là').toBe(5);

    const texte = VEILLE.toLowerCase();
    expect(texte, 'le chapitre doit citer la chute réelle').toContain('dix kilos');
    expect(texte, 'et le poids restant réel').toContain('sous cinq');
    expect(
      texte,
      'un seuil de vol à 2 kg ferait attendre des alertes qui n’arriveront jamais',
    ).not.toMatch(/2 ?kg[^.]*vol|vol[^.]*2 ?kg/);
  });

  it('la fenêtre d’essaimage annoncée est celle du détecteur', () => {
    // C'est la finesse qui vend : un essaim ne part pas la nuit, donc on ne le
    // cherche pas la nuit. Si la fenêtre bouge, la phrase doit bouger.
    expect(HEURE_ESSAIMAGE_DEBUT).toBe(10);
    expect(HEURE_ESSAIMAGE_FIN).toBe(17);
    expect(VEILLE).toMatch(/entre 10 h et 17 h/);
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
