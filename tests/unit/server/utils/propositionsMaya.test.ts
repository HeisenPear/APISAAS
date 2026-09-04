// ═══════════════════════════════════════════════════════════════════════════
// LES CARTES DE MAYA — CE QU'ELLES PROPOSENT DOIT ÊTRE VRAI, UTILE, ET DISTINCT.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// Ce banc gardait les « perches » et les « offres » de l'ancienne composition.
// Il vérifiait une seule chose de chacune : qu'elle ne se classe pas en « je
// n'ai pas compris ». C'était nécessaire, et très insuffisant — trois défauts
// vivaient sous ce vert, tous mesurés avant d'être corrigés :
//
//  1. TOUS LES LIENS POINTAIENT SUR LA PAGE COURANTE. Le filtre de contexte ne
//     gardait que les items dont le `to` était la route du contexte lui-même :
//     sur `/stocks`, la carte proposait d'aller… sur `/stocks`. Quatre cartes
//     sur cinq n'étaient faites que d'auto-liens.
//
//  2. DEUX BOUTONS RENDAIENT LE MÊME PARAGRAPHE. Le moteur répond à partir de
//     l'INTENTION, jamais du texte : `case 'alertes'` ne lit que `userId`.
//     « Mes alertes » et « Quelles sont mes alertes ? » se classent toutes deux
//     `action:alertes`. Sur la carte du calendrier, trois boutons sur quatre
//     donnaient le même texte, au mot près. L'ancien banc ne pouvait pas le
//     voir : il regardait chaque question SÉPARÉMENT.
//
//  3. UNE CARTE PROACTIVE VENDAIT DU PRO À UN COMPTE STARTER. « Qu'est-ce qui
//     peut leur arriver ? » se classe `action:prediction`, gatée
//     `scorePredictif` — plan Pro. Maya, elle, s'ouvre dès Starter. Personne
//     n'avait rien demandé, et le bouton ne menait qu'à un argumentaire.
//
// ─── CE QUE LE BANC TIENT MAINTENANT ───────────────────────────────────────
// Les quatre règles ci-dessous, plus tout ce que l'ancien tenait déjà. Et il
// itère sur `CONTEXTES_BRIEF` — la source de vérité — au lieu de la liste
// recopiée qu'il portait : ajouter une page où Maya s'invite la fait mesurer
// d'office.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer le `.map()` qui efface un écran menant à la page courante ;
//   · faire pointer un `pourquoi` sur une question d'ACTION au lieu d'une fiche ;
//   · retirer `selonLePlan` de `composerCarte` ;
//   · rendre la relance inconditionnelle quand `items` est vide ;
//   · réduire `CONTEXTES_BRIEF` à quatre entrées → le garde-fou de volume tombe.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  composerCarte,
  composerBriefDuJour,
  besoinsDuContexte,
  featureDeLaQuestion,
  selonLePlan,
  cheminEgal,
  CONTEXTES_BRIEF,
  RESERVES_HIVERNAGE_KG,
  FICHES_CITEES,
  type DonneesBrief,
  type PropositionMaya,
} from '../../../../server/utils/maya-brief';
import { classifierTour } from '../../../../server/utils/copilote-local';
import { SAVOIR } from '../../../../server/utils/copilote-savoir';
import { PLANS, hasFeature, type Plan } from '../../../../app/config/plans';
import { CATEGORIES_INTERVENTION } from '../../../../app/types/interventions';

/** Les formules qui donnent accès à Maya — les seules à voir une carte. */
const PLANS_AVEC_MAYA: Plan[] = PLANS.filter((p) => hasFeature(p, 'copiloteIa'));

/**
 * L'IDENTITÉ DE LA RÉPONSE QU'UNE QUESTION PRODUIRA.
 *
 * ⚠️ ELLE SE DEMANDE AU MOTEUR, elle ne se déduit pas du texte. C'est tout le
 * sujet du défaut n° 2 : deux formulations très différentes rendent le même
 * paragraphe dès qu'elles atterrissent sur la même intention, parce que
 * `repondreConversation` ne relit jamais la phrase. Comparer les libellés
 * n'aurait donc rien prouvé.
 *
 * `classifierTour` et non `classifier` : c'est la porte qu'emprunte le produit
 * (`copilote-local.ts`, `repondreConversation`). La couche basse ignore la
 * navigation et rangerait « ouvre un nouvel achat » en `inconnu`.
 */
function identiteDeLaReponse(question: string): string {
  const d = classifierTour([{ role: 'user', content: question }]);
  switch (d.kind) {
    case 'action':
      return `action:${d.intent}`;
    case 'savoir':
      return `savoir:${d.articleId}`;
    case 'navigation':
      return `navigation:${d.cible.to}`;
    default:
      return d.kind;
  }
}

// ─── Des données d'apiculteur, pour faire parler chaque contexte ────────────

const MAINTENANT = Date.UTC(2026, 8, 20, 7); // 20 septembre 2026 — automne

function ruche(over: Partial<DonneesBrief['ruches'][number]>): DonneesBrief['ruches'][number] {
  return {
    numero: '1',
    rucher: 'Le Chêne',
    statut: 'active',
    scoreSante: 80,
    derniereVisite: '2026-09-18',
    joursDepuisVisite: 2,
    varroa: null,
    maladieObservee: null,
    ...over,
  };
}

/** Un compte où CHAQUE contexte a quelque chose à dire. */
function donneesChargees(): DonneesBrief {
  return {
    ruches: [
      ruche({ numero: '4', scoreSante: 22, joursDepuisVisite: 40, derniereVisite: '2026-08-11' }),
      ruche({ numero: '7', varroa: 6, joursDepuisVisite: 35 }),
      ruche({ numero: '9', joursDepuisVisite: 60 }),
    ],
    alertes: [
      {
        type: 'varroa_seuil',
        titre: 'Varroa au-dessus du seuil sur la ruche 7',
        message: null,
        priorite: 'critique',
        createdAt: new Date(MAINTENANT - 3600_000),
        actionUrl: '/ruches/abc',
      },
      {
        type: 'stock_bas',
        titre: 'Sirop bientôt épuisé',
        message: null,
        priorite: 'haute',
        createdAt: new Date(MAINTENANT - 7200_000),
        actionUrl: '/stocks',
      },
      /**
       * ⚠️ IL EN FAUT UNE QU'AUCUNE AUTRE PROPOSITION NE DIT DÉJÀ.
       *
       * `varroa_seuil` et `stock_bas` ci-dessus figurent dans
       * `ALERTES_DEJA_DITES` : sur le tableau de bord et le calendrier, elles
       * cèdent la place à la proposition dédiée, qui en dit plus. Un jeu de
       * données qui n'aurait contenu QUE celles-là aurait donc rendu le besoin
       * « alertes » du calendrier invisible — et le banc qui vérifie que chaque
       * besoin déclaré est réellement lu l'a dit, tout de suite.
       */
      {
        type: 'cellule_royale',
        titre: 'Cellules royales sur la ruche 9',
        message: null,
        priorite: 'haute',
        createdAt: new Date(MAINTENANT - 10_800_000),
        actionUrl: '/ruches/def',
      },
    ],
    stocks: [
      {
        nom: 'Sirop 50/50',
        categorie: 'nourrissement',
        quantite: '12',
        unite: 'kg',
        seuilAlerte: '40',
        sousLeSeuil: true,
      },
      {
        nom: 'Cadres',
        categorie: 'materiel',
        quantite: '4',
        unite: 'u',
        seuilAlerte: '10',
        sousLeSeuil: true,
      },
    ],
    meteo: {
      rucher: 'Le Chêne',
      previsions: [
        {
          date: '2026-09-22',
          conditions: 'Ciel dégagé',
          tempMax: 23,
          tempMin: 11,
          pluieMm: 0,
          ventMaxKmh: 9,
          scoreVisite: 88,
        },
      ],
    },
  };
}

/** Un compte parfaitement calme : rien à signaler nulle part. */
function donneesCalmes(): DonneesBrief {
  return {
    ruches: [ruche({}), ruche({ numero: '2' })],
    alertes: [],
    stocks: [],
    meteo: { erreur: 'aucun_rucher' },
  };
}

/**
 * TOUTES LES SURFACES OÙ MAYA PROPOSE — les cinq cartes de page ET le tableau
 * de bord.
 *
 * ⚠️ CE BANC S'ARRÊTAIT JUSTE AVANT. Il itérait `CONTEXTES_BRIEF`, qui ne
 * contient pas le tableau de bord : toutes les règles ci-dessous étaient donc
 * vérifiées sur cinq surfaces et aveugles à la sixième. Le défaut central du
 * chantier — deux boutons rendant le même paragraphe — y survivait intact,
 * `fenetreMeteo` et `retardDeVisite` citant tous deux la fiche de la saison :
 * l'apiculteur voyait DEUX boutons « Préparer l'hivernage » côte à côte. C'est
 * « la couverture qui s'arrête juste avant », dans le banc écrit pour la
 * dénoncer.
 *
 * La liste est maintenant l'union explicite des deux, et le garde-fou compte
 * six surfaces : en retirer une le fait tomber.
 */
const toutesLesCartes = (plan: Plan = 'pro') => [
  ...CONTEXTES_BRIEF.map((c) => ({
    contexte: c as string,
    brief: composerCarte(c, donneesChargees(), { plan, maintenant: MAINTENANT }),
  })),
  {
    contexte: 'tableau de bord',
    brief: composerBriefDuJour({
      heure: 9,
      plan,
      donnees: donneesChargees(),
      mois: 8,
      maintenant: MAINTENANT,
      avecInfoDuJour: true,
    }),
  },
];

/** Toutes les questions qu'une carte met sous les doigts de l'apiculteur. */
function questionsDeLaCarte(brief: ReturnType<typeof composerCarte>): string[] {
  return [
    ...brief.items.flatMap((i) => (i.pourquoi ? [i.pourquoi.question] : [])),
    ...(brief.relance ? [brief.relance.question] : []),
  ];
}

describe('chaque carte a quelque chose à dire, et le dit', () => {
  it('GARDE-FOU : le balayage voit les cinq contextes, et chacun produit une carte', () => {
    // Sans ce cas, un `composerCarte` qui renverrait toujours zéro item ferait
    // passer TOUTES les règles ci-dessous — « le balayage vide ».
    expect(CONTEXTES_BRIEF.length, 'la liste des contextes a rétréci').toBe(5);
    expect(
      toutesLesCartes().length,
      'une surface a disparu du balayage — le tableau de bord en fait partie',
    ).toBe(6);
    for (const { contexte, brief } of toutesLesCartes()) {
      expect(
        brief.items.length,
        `${contexte} : aucune proposition sur un compte chargé`,
      ).toBeGreaterThan(0);
    }
  });

  it('elle NOMME et CHIFFRE — jamais « 3 colonies » sans dire lesquelles', () => {
    // Le reproche de fond fait aux anciennes cartes : elles comptaient. La
    // ruche 4 a un numéro, l'alerte a un titre, le sirop a un poids.
    const ruches = composerCarte('ruches', donneesChargees(), {
      plan: 'pro',
      maintenant: MAINTENANT,
    });
    expect(ruches.items[0]?.texte).toContain('ruche 4');
    expect(ruches.items[0]?.texte).toContain('22/100');

    const alertes = composerCarte('alertes', donneesChargees(), {
      plan: 'pro',
      maintenant: MAINTENANT,
    });
    expect(alertes.items[0]?.texte).toContain('Varroa au-dessus du seuil');

    const stocks = composerCarte('stocks', donneesChargees(), {
      plan: 'pro',
      maintenant: MAINTENANT,
    });
    expect(stocks.items[0]?.texte).toMatch(/12\s*kg/);
    expect(stocks.items[0]?.texte, 'le seuil se dit aussi').toMatch(/40\s*kg/);
  });
});

describe('LA RÈGLE : un chiffre annoncé est celui de la fiche qui l’explique', () => {
  it('les réserves d’hivernage disent ce que dit la fiche « hivernage »', () => {
    /**
     * ⚠️ LA CARTE ANNONÇAIT « environ 8 kg par colonie » — un ordre de grandeur
     * plausible, inventé, et CONTREDIT par la fiche que le bouton juste à côté
     * ouvre : « Préparer l'hivernage » y dit « 12-18 kg selon la région ».
     * Deux réponses du même produit, à un clic d'écart.
     *
     * Elle confondait de plus les RÉSERVES visées (ce que la colonie doit
     * avoir) et le SIROP à ajouter (ce qui manque à ce qu'elle a déjà), qu'on
     * ne connaît pas.
     *
     * Ce cas amarre le chiffre à sa source. Le jour où la fiche change, il
     * rougit — c'est exactement ce qu'on veut d'une valeur qu'on n'a pas pu
     * dériver programmatiquement (la fiche est de la prose).
     */
    const fiche = SAVOIR.find((a) => a.id === 'hivernage');
    expect(fiche, 'la fiche « hivernage » a disparu').toBeDefined();
    expect(
      fiche!.contenu,
      `la carte annonce ${RESERVES_HIVERNAGE_KG.min} à ${RESERVES_HIVERNAGE_KG.max} kg ; ` +
        `la fiche liée ne le dit plus. Les deux doivent raconter la même chose.`,
    ).toContain(`${RESERVES_HIVERNAGE_KG.min}-${RESERVES_HIVERNAGE_KG.max} kg`);
  });

  it('et la carte des stocks les annonce vraiment', () => {
    // Garde-fou : sans lui, retirer la phrase de la carte laisserait le cas
    // ci-dessus vert — il ne mesurerait plus qu'une fiche.
    const b = composerCarte('stocks', donneesChargees(), { plan: 'pro', maintenant: MAINTENANT });
    expect(b.items[0]?.texte).toContain(
      `${RESERVES_HIVERNAGE_KG.min} à ${RESERVES_HIVERNAGE_KG.max} kg`,
    );
  });
});

describe('LA RÈGLE : un écran pré-rempli l’est encore à l’arrivée', () => {
  it('les paramètres envoyés sont ceux que la page de saisie LIT', () => {
    /**
     * ⚠️ LES DEUX BOUTS, PAS UN SEUL. Une carte peut envoyer `?type=varroa` en
     * toute confiance : `/interventions/nouvelle` IGNORE EN SILENCE un `?type=`
     * qu'elle ne reconnaît pas, et un paramètre renommé ne produirait aucune
     * erreur — juste un formulaire qui ne se pré-remplit plus, sans que
     * personne ne s'en aperçoive. C'est le défaut de l'événement que personne
     * n'écoute, transposé à une URL.
     *
     * On vérifie donc que la page lit bien `route.query.type`, qu'elle le
     * valide contre `CATEGORIES_INTERVENTION`, et que chaque valeur envoyée par
     * une carte est dans ce catalogue.
     */
    const page = readFileSync('app/pages/interventions/nouvelle.vue', 'utf8');
    expect(page, 'la page ne lit plus `?type=`').toContain('route.query.type');
    expect(page, 'la page ne valide plus contre le catalogue').toContain('CATEGORIES_INTERVENTION');

    const envoyes = toutesLesCartes()
      .flatMap(({ brief }) => brief.items)
      .map((i) => i.ecran?.to)
      .filter((to): to is string => !!to && to.includes('/interventions/nouvelle?type='))
      .map((to) => new URL(to, 'https://x').searchParams.get('type')!);

    expect(
      envoyes.length,
      'aucune carte ne pré-remplit : le balayage mesure du vide',
    ).toBeGreaterThan(0);
    const inconnus = envoyes.filter(
      (t) => !(CATEGORIES_INTERVENTION as readonly string[]).includes(t),
    );
    expect(
      inconnus,
      `ces types ne sont pas dans le catalogue : la page les ignorera sans rien dire`,
    ).toEqual([]);
  });
});

describe('LA RÈGLE : un lien quitte la page, sinon ce n’est pas un lien', () => {
  it('aucune carte ne propose d’aller là où l’apiculteur se trouve déjà', () => {
    const PAGE: Record<string, string> = {
      ruches: '/ruches',
      meteo: '/meteo',
      alertes: '/alertes',
      stocks: '/stocks',
      calendrier: '/calendrier',
      'tableau de bord': '/dashboard',
    };
    for (const { contexte, brief } of toutesLesCartes()) {
      for (const it of brief.items) {
        if (!it.ecran) continue;
        expect(
          cheminEgal(it.ecran.to, PAGE[contexte]),
          `carte « ${contexte} » : le bouton « ${it.ecran.libelle} » renvoie vers ` +
            `${it.ecran.to}, c'est-à-dire l'écran que l'apiculteur regarde. Un lien ` +
            `vers soi-même est un bouton mort.`,
        ).toBe(false);
      }
    }
  });

  it('CONTRÔLE POSITIF : une alerte pointant sur la page courante perd son bouton', () => {
    /**
     * ⚠️ SANS CE CAS, LA GARDE N'ÉTAIT PAS MESURÉE. Aucune proposition du jeu
     * d'essai ne pointait vers la page où elle s'affiche — retirer
     * `retirerLesAutoLiens` du tableau de bord laissait tout vert. Or
     * l'`actionUrl` d'une alerte vient de la base : elle PEUT valoir
     * `/dashboard` ou `/alertes`. On le fabrique donc, sur les deux surfaces.
     */
    const alerteVersSaPage = (actionUrl: string): DonneesBrief => ({
      ...donneesCalmes(),
      alertes: [
        {
          type: 'cellule_royale',
          titre: 'Cellules royales sur la ruche 3',
          message: null,
          priorite: 'critique',
          createdAt: new Date(MAINTENANT),
          actionUrl,
        },
      ],
    });

    const surAlertes = composerCarte('alertes', alerteVersSaPage('/alertes'), {
      plan: 'pro',
      maintenant: MAINTENANT,
    });
    expect(surAlertes.items.length, 'le constat doit rester').toBe(1);
    expect(surAlertes.items[0]?.ecran, 'le bouton vers /alertes depuis /alertes').toBeUndefined();

    const ailleurs = composerCarte('alertes', alerteVersSaPage('/ruches/xyz'), {
      plan: 'pro',
      maintenant: MAINTENANT,
    });
    expect(ailleurs.items[0]?.ecran?.to, 'un lien qui SORT doit survivre').toBe('/ruches/xyz');

    const surDashboard = composerBriefDuJour({
      heure: 9,
      plan: 'pro',
      donnees: alerteVersSaPage('/dashboard'),
      mois: 8,
      maintenant: MAINTENANT,
      avecInfoDuJour: false,
    });
    const laCarte = surDashboard.items.find((i) => i.texte.includes('Cellules royales'));
    expect(laCarte, 'le constat doit être là').toBeDefined();
    expect(laCarte!.ecran, 'le bouton vers /dashboard depuis le tableau de bord').toBeUndefined();
  });

  it('CONTRÔLE POSITIF : la comparaison de chemins ignore la query, pas le segment', () => {
    // Sans ce cas, remplacer `cheminEgal` par une égalité stricte laisserait
    // passer `/stocks?x=1` depuis `/stocks` ; et un `startsWith` confondrait
    // `/ruches` avec `/ruchers`.
    expect(cheminEgal('/stocks?new=1', '/stocks')).toBe(true);
    expect(cheminEgal('/ruchers', '/ruches')).toBe(false);
    expect(cheminEgal('/ruches/12', '/ruches')).toBe(false);
  });
});

describe('LA RÈGLE : deux boutons d’une carte ne rendent jamais le même texte', () => {
  it('les réponses de chaque carte sont toutes distinctes', () => {
    for (const { contexte, brief } of toutesLesCartes()) {
      const questions = questionsDeLaCarte(brief);
      const identites = questions.map(identiteDeLaReponse);
      const doublons = identites.filter((x, i) => identites.indexOf(x) !== i);
      expect(
        doublons,
        `carte « ${contexte} » : plusieurs boutons mènent à la même réponse ` +
          `(${doublons.join(', ')}). Le moteur répond à partir de l'INTENTION, pas ` +
          `du texte : deux questions de même intention rendent le même paragraphe, ` +
          `au mot près.\nQuestions : ${questions.join(' | ')}`,
      ).toEqual([]);
    }
  });

  it('un « pourquoi » est TOUJOURS une fiche, une relance TOUJOURS une lecture', () => {
    // C'est ce qui rend la collision impossible par construction plutôt que par
    // vigilance : les deux familles ne peuvent pas se rencontrer.
    for (const { contexte, brief } of toutesLesCartes()) {
      for (const it of brief.items) {
        if (!it.pourquoi) continue;
        expect(
          identiteDeLaReponse(it.pourquoi.question),
          `carte « ${contexte} » : « ${it.pourquoi.question} » devrait ouvrir une fiche ` +
            `de savoir, pas relire les mêmes données`,
        ).toMatch(/^savoir:/);
      }
      if (brief.relance) {
        expect(
          identiteDeLaReponse(brief.relance.question),
          `carte « ${contexte} » : la perche doit être une lecture`,
        ).toMatch(/^action:/);
      }
    }
  });

  it('un libellé qui ressemble à une question tient la promesse de la question', () => {
    /**
     * ⚠️ UN LIBELLÉ EST UNE PROMESSE, ET L'UN D'EUX MENTAIT. « Le calendrier
     * apicole » ouvrait la fiche de la VISITE DE PRINTEMPS : en septembre,
     * l'apiculteur touchait un bouton annonçant le calendrier de l'année et
     * recevait un article sur la sortie d'hivernage.
     *
     * La règle ne s'applique QUE si le libellé se classe lui-même sur une fiche
     * — beaucoup ne sont pas des questions (« Combien par colonie ? » ne route
     * nulle part, et c'est très bien : ce n'est pas lui qui part). C'est la
     * distinction entre « ce qu'on affiche » et « ce qu'on envoie », les deux
     * lectures qu'il ne faut jamais confondre.
     */
    /**
     * ⚠️ ON BALAIE LE CATALOGUE, PAS CE QUE LES CARTES ONT ÉMIS. Une entrée
     * n'est rendue que si les données de l'apiculteur l'atteignent : le libellé
     * fautif n'apparaissait sur AUCUNE carte du jeu d'essai, faute d'alerte de
     * ce type. La règle était juste et ne mesurait rien — remettre le défaut
     * laissait le banc vert. Mesuré.
     */
    let mesures = 0;
    for (const fiche of FICHES_CITEES) {
      const duLibelle = identiteDeLaReponse(fiche.libelle);
      if (!duLibelle.startsWith('savoir:')) continue;
      mesures++;
      expect(
        duLibelle,
        `le bouton dit « ${fiche.libelle} » (qui mène à ${duLibelle}) mais envoie ` +
          `« ${fiche.question} » (qui mène à ${identiteDeLaReponse(fiche.question)}). ` +
          `Le libellé est une promesse.`,
      ).toBe(identiteDeLaReponse(fiche.question));
    }
    expect(mesures, 'aucun libellé routable : la règle mesure du vide').toBeGreaterThan(3);
  });

  it('toute fiche citée EXISTE dans le savoir embarqué', () => {
    // Une coquille dans une formulation ne fait pas d'erreur : elle atterrit
    // simplement ailleurs, ou nulle part. On vérifie donc la CIBLE.
    for (const { contexte, brief } of toutesLesCartes()) {
      for (const it of brief.items) {
        if (!it.pourquoi) continue;
        const id = identiteDeLaReponse(it.pourquoi.question).replace('savoir:', '');
        expect(
          SAVOIR.some((a) => a.id === id),
          `carte « ${contexte} » : « ${it.pourquoi.question} » vise la fiche « ${id} », ` +
            `qui n'existe pas`,
        ).toBe(true);
      }
    }
  });
});

describe('LA RÈGLE : Maya ne propose pas ce que la formule ne couvre pas', () => {
  it('CONTRÔLE POSITIF : la porte se DÉDUIT de la question, et elle mord', () => {
    /**
     * Le défaut, dans sa forme exacte : cette question-là était proposée à
     * tout le monde, et elle est gatée Pro. Sans ce cas fabriqué, la règle
     * serait vide de sens — aucune carte ne propose plus rien de gaté, donc
     * neutraliser `selonLePlan` ne ferait rien tomber sur un dépôt propre.
     */
    expect(featureDeLaQuestion('Qu’est-ce qui peut arriver à mes ruches ?')).toBe('scorePredictif');
    expect(featureDeLaQuestion('Fais-moi un point santé')).toBeNull();

    const gatee: PropositionMaya = {
      texte: 'x',
      ton: 'clay',
      pourquoi: { libelle: 'Et après ?', question: 'Qu’est-ce qui peut arriver à mes ruches ?' },
      ecran: { to: '/tournee', libelle: 'Ma tournée' },
    };
    // Starter n'a ni `scorePredictif` ni `tourneeOptimisee` : les deux suites
    // tombent, le constat reste.
    const enStarter = selonLePlan(gatee, 'starter');
    expect(enStarter.pourquoi, 'Starter ne doit pas se voir proposer du Pro').toBeUndefined();
    expect(enStarter.ecran).toBeUndefined();
    expect(enStarter.texte, 'le constat, lui, reste vrai').toBe('x');

    const enPro = selonLePlan(gatee, 'pro');
    expect(enPro.pourquoi, 'Pro y a droit — la règle ne doit pas tout refuser').toBeDefined();
    expect(enPro.ecran).toBeDefined();
  });

  it('sur CHAQUE formule qui a Maya, aucune carte ne propose du hors-plan', () => {
    for (const plan of PLANS_AVEC_MAYA) {
      for (const contexte of CONTEXTES_BRIEF) {
        const brief = composerCarte(contexte, donneesChargees(), { plan, maintenant: MAINTENANT });
        for (const q of questionsDeLaCarte(brief)) {
          const f = featureDeLaQuestion(q);
          expect(
            f == null || hasFeature(plan, f),
            `plan ${plan}, carte « ${contexte} » : « ${q} » exige ${f}, que ce plan n'a pas`,
          ).toBe(true);
        }
      }
    }
  });

  it('GARDE-FOU : au moins deux formules ont Maya — sinon la boucle ne prouve rien', () => {
    expect(PLANS_AVEC_MAYA.length).toBeGreaterThanOrEqual(2);
  });
});

describe('LA RÈGLE : au calme, la carte se tait entièrement', () => {
  it('aucune proposition ⟹ aucune relance, aucune intro', () => {
    /**
     * ⚠️ CES DEUX CHOSES NE SE SÉPARENT PAS, et c'est la correction. L'ancienne
     * composition rendait toujours une relance, ce qui obligeait à maintenir une
     * branche « calme » (`voix('contexteCalme')`, `RELANCES[…].calme`). Or les
     * deux composants se masquent sur `items.length === 0` : cette branche
     * n'atteignait AUCUN écran. Un banc la testait pourtant — il mesurait du
     * code mort, et il était vert.
     */
    for (const contexte of CONTEXTES_BRIEF) {
      const brief = composerCarte(contexte, donneesCalmes(), {
        plan: 'pro',
        maintenant: MAINTENANT,
      });
      expect(brief.items, `${contexte} : rien à signaler, donc rien à dire`).toEqual([]);
      expect(brief.relance, `${contexte} : pas de perche sans constat`).toBeUndefined();
      expect(brief.intro, `${contexte} : pas d'intro à afficher`).toBe('');
    }
  });

  it('le tableau de bord, LUI, ne se tait jamais', () => {
    const b = composerBriefDuJour({
      prenom: 'Antoine',
      heure: 9,
      plan: 'pro',
      donnees: donneesCalmes(),
      mois: 8,
      maintenant: MAINTENANT,
      avecInfoDuJour: false,
    });
    expect(b.items.length, 'la note de saison ferme toujours la carte').toBeGreaterThan(0);
    expect(b.items[b.items.length - 1]?.texte).toContain('saison');
    expect(b.relance, 'le point du jour n’est pas une carte : pas de perche').toBeUndefined();
  });
});

describe('ce qu’une carte va CHERCHER', () => {
  it('la carte des stocks ne réclame pas la météo', () => {
    /**
     * ⚠️ CE N'EST PAS UNE OPTIMISATION DE CONFORT. `getMeteoRucher` SORT SUR LE
     * RÉSEAU (Open-Meteo, 8 s de délai d'attente) et vivait dans un
     * `Promise.all` inconditionnel : la carte des stocks attendait un service
     * tiers dont elle ne lisait rien, sur chaque navigation, sous un chien de
     * garde à 9 s. Cinq pages montent une carte.
     */
    expect(besoinsDuContexte('stocks')).not.toContain('meteo');
    expect(besoinsDuContexte('alertes')).not.toContain('meteo');
    expect(besoinsDuContexte('meteo'), 'celle-ci en a besoin, elle').toContain('meteo');
  });

  it('un contexte ne demande QUE ce que son composeur lit vraiment', () => {
    // Contrôle positif de la déclaration : si un besoin est déclaré sans être
    // lu, retirer la donnée correspondante ne change rien à la carte — et la
    // déclaration ment. On le vérifie en privant chaque contexte, tour à tour,
    // d'une donnée qu'il déclare.
    for (const contexte of CONTEXTES_BRIEF) {
      const complet = composerCarte(contexte, donneesChargees(), {
        plan: 'pro',
        maintenant: MAINTENANT,
      });
      for (const besoin of besoinsDuContexte(contexte)) {
        const ampute: DonneesBrief = {
          ...donneesChargees(),
          ...(besoin === 'meteo'
            ? { meteo: { erreur: 'aucun_rucher' } }
            : { [besoin]: [] as never }),
        };
        const prive = composerCarte(contexte, ampute, { plan: 'pro', maintenant: MAINTENANT });
        expect(
          JSON.stringify(prive) !== JSON.stringify(complet),
          `carte « ${contexte} » : elle déclare avoir besoin de « ${besoin} », mais la ` +
            `priver n'y change rien. Soit le besoin est de trop, soit le composeur ` +
            `oublie de s'en servir.`,
        ).toBe(true);
      }
    }
  });
});

describe('ce que l’ancien banc tenait déjà, et qu’on ne perd pas', () => {
  it('toute question proposée se route — jamais « je n’ai pas compris »', () => {
    // La règle d'origine de ce fichier. Une perche que Maya ne saurait pas
    // comprendre serait la pire des expériences : elle propose, on clique, elle
    // répond « je n'ai pas bien saisi ».
    for (const { contexte, brief } of toutesLesCartes()) {
      for (const q of questionsDeLaCarte(brief)) {
        expect(identiteDeLaReponse(q), `${contexte} → ${q}`).not.toBe('inconnu');
        expect(identiteDeLaReponse(q), `${contexte} → ${q}`).not.toBe('suggestion');
      }
    }
  });

  it('la perche s’accompagne d’une amorce, et la question s’affiche telle quelle', () => {
    for (const { contexte, brief } of toutesLesCartes()) {
      if (!brief.relance) continue;
      expect(brief.relance.amorce.length, contexte).toBeGreaterThan(10);
      expect(brief.relance.question.length, contexte).toBeGreaterThan(10);
      // Le libellé du bouton EST la question envoyée : l'apiculteur voit
      // exactement ce qui sera demandé en son nom.
      expect(brief.relance.question.trim(), contexte).toBe(brief.relance.question);
    }
  });

  it('un libellé de « pourquoi » invite, il ne récite pas la question', () => {
    for (const { contexte, brief } of toutesLesCartes()) {
      for (const it of brief.items) {
        if (!it.pourquoi) continue;
        expect(it.pourquoi.libelle.length, `${contexte} — ${it.pourquoi.libelle}`).toBeGreaterThan(
          5,
        );
        expect(
          it.pourquoi.libelle.length,
          `${contexte} — ${it.pourquoi.libelle}`,
        ).toBeLessThanOrEqual(40);
      }
    }
  });

  it('la note de saison ne propose rien — ce n’est pas un constat actionnable', () => {
    const b = composerBriefDuJour({
      heure: 9,
      plan: 'pro',
      donnees: donneesCalmes(),
      mois: 8,
      maintenant: MAINTENANT,
      avecInfoDuJour: false,
    });
    const saison = b.items.find((it) => it.texte.startsWith('En cette saison'));
    expect(saison, 'la note de saison doit exister').toBeDefined();
    expect(saison!.pourquoi).toBeUndefined();
    expect(saison!.ecran).toBeUndefined();
  });

  it('au singulier, l’espace n’est jamais mangée', () => {
    // « 1 produit passe », pas « 1 produitpasse » — un pluriel construit par
    // concaténation avait déjà produit ce défaut à l'écran.
    for (const { brief } of toutesLesCartes()) {
      for (const it of brief.items) {
        expect(it.texte, it.texte).not.toMatch(/[a-zéèêà][A-ZÉÈ]/);
        expect(it.texte, it.texte).not.toMatch(/\s{2,}/);
      }
    }
  });
});
