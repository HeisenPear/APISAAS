// ═══════════════════════════════════════════════════════════════════════════
// LES CARTES DE MAYA — ELLE EXPLIQUE, ET ELLE PROPOSE.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// La version précédente fabriquait six constats génériques, puis les FILTRAIT
// pour chaque page. Trois défauts en découlaient, tous mesurés :
//
//  1. LES LIENS NE MENAIENT NULLE PART. `ROUTES_CONTEXTE` associait chaque
//     contexte à SA PROPRE route, et le filtre ne gardait que les items
//     pointant dessus. Résultat : sur `/stocks`, le seul lien de la carte
//     menait à `/stocks`. Quatre cartes sur cinq n'étaient composées QUE
//     d'auto-liens — un bouton qui ne fait rien.
//
//  2. DEUX BOUTONS RENDAIENT LE MÊME PARAGRAPHE. Chaque item portait une
//     `offre` (une question) et la carte une `relance` (une autre question),
//     toutes deux envoyées telles quelles au moteur. Or le moteur répond à
//     partir de l'INTENTION, pas du texte : `case 'alertes'` et `case 'stocks'`
//     ne lisent que `userId`. « Mes alertes » et « Quelles sont mes alertes ? »
//     se classent toutes deux `action:alertes` → réponse identique, au mot
//     près. Sur la carte du calendrier, TROIS boutons sur quatre rendaient le
//     même texte.
//
//  3. MAYA TENDAIT UN MUR PAYANT DE SA PROPRE INITIATIVE. « Qu'est-ce qui peut
//     leur arriver ? » se classe `action:prediction`, gatée `scorePredictif`
//     (plan Pro). Maya, elle, s'ouvre dès Starter. Un apiculteur Starter
//     recevait donc une carte non sollicitée dont le bouton ne menait qu'à un
//     argumentaire commercial.
//
// ─── COMMENT C'EST TENU MAINTENANT ─────────────────────────────────────────
//
//  · UN COMPOSEUR PAR CONTEXTE, qui part des données de son domaine au lieu de
//    filtrer un tronc commun. Il déclare ses BESOINS : la carte des stocks ne
//    déclenche plus l'appel réseau Open-Meteo qu'elle n'utilisait pas — il
//    était dans le `Promise.all` de CHAQUE carte de CHAQUE page, avec 8 s de
//    délai d'attente, sous un chien de garde à 9 s.
//
//  · LE « POURQUOI » EST TOUJOURS UNE QUESTION DE SAVOIR, LA RELANCE TOUJOURS
//    UNE INTENTION DE LECTURE. Une fiche de savoir et une lecture de données ne
//    peuvent pas rendre le même paragraphe : la collision du point 2 devient
//    impossible par construction, et non par vigilance.
//
//  · CE QUE LA FORMULE NE COUVRE PAS N'EST PAS PROPOSÉ. La porte est DÉRIVÉE
//    (`estLectureGatee` + `featureDeLaPage`), jamais redéclarée. Ce n'est pas
//    un refus : il n'y a pas eu de demande, donc rien à débloquer — la
//    proposition n'est simplement pas faite.
//
//  · LA BRANCHE « CALME » A DISPARU. Les deux composants masquent la carte dès
//    que `items` est vide : `voix('contexteCalme')` et `RELANCES[…].calme` ne
//    pouvaient atteindre aucun écran. Un banc les testait pourtant — il
//    mesurait du code mort. La règle est désormais explicite et tenue :
//    AUCUNE proposition ⟹ AUCUNE relance.
//
//  · SEUL LE TABLEAU DE BORD NE SE TAIT JAMAIS : point de saison, et de temps
//    en temps une info du jour. Cette info est TIRÉE de `PATCH_NOTE`, la note
//    de version — pas d'un second catalogue d'annonces qui aurait divergé du
//    premier dès la mise à jour suivante.
// ═══════════════════════════════════════════════════════════════════════════

import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import {
  getRuchesSante,
  getAlertes,
  getStocks,
  getMeteoRucher,
  type RucheSante,
  type AlerteRow,
  type StockRow,
  type MeteoResultat,
} from '~~/server/utils/copilote-data';
import { voix, seedVoix, choisir } from '~~/server/utils/maya-voix';
import { moisParis } from '~~/server/utils/horloge';
import { cadenceVisite, saisonApicole, type Saison } from '~~/server/utils/cadence';
import { fenetresSaisonOuvertes } from '~~/server/utils/alertesSaison';
import { SEUIL_COLONIE_FRAGILE, VARROA_PCT, scoreLabel } from '~~/server/utils/santeScore';
import {
  estLectureGatee,
  featureDeLecture,
  featureDeLaPage,
  planCouvre,
} from '~~/server/utils/copilote-gating';
import { classifierTour } from '~~/server/utils/copilote-local';
import { PATCH_NOTE } from '~~/app/config/patchNotes';
import type { CategorieIntervention } from '~~/app/types/interventions';
import { FEATURE_PAR_CATEGORIE } from '~~/server/services/interventions';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import type { Plan, PlanFeatures } from '~~/app/config/plans';

/**
 * LES CONTEXTES, ÉCRITS UNE SEULE FOIS.
 *
 * ⚠️ LA LISTE ÉTAIT RECOPIÉE QUATRE FOIS — ici en type, dans `brief.get.ts`
 * pour valider le paramètre d'URL, dans la prop de `MayaContextCard.vue`, et
 * dans un banc. Ajouter une page où Maya s'invite demandait donc de trouver
 * quatre endroits ; en oublier un ne produisait aucune erreur, juste une carte
 * qui ne s'affiche jamais (le paramètre refusé) ou un banc qui ne la mesure
 * pas. Le type DÉRIVE désormais de la donnée, et non l'inverse.
 */
export const CONTEXTES_BRIEF = ['ruches', 'meteo', 'alertes', 'stocks', 'calendrier'] as const;
export type ContexteBrief = (typeof CONTEXTES_BRIEF)[number];

export type TonProposition = 'honey' | 'sage' | 'clay' | 'neutre';

/**
 * CE QUE MAYA DIT, ET CE QU'ELLE PROPOSE D'EN FAIRE.
 *
 * Un constat qui se referme sur lui-même est un panneau d'affichage. Une
 * proposition porte donc au plus deux suites, et elles ne se recouvrent pas :
 *
 *   · `pourquoi` — la CONNAISSANCE. Une question d'apiculture, qui ouvre une
 *     fiche du savoir embarqué. Elle explique le constat au lieu de le relire.
 *   · `ecran` — le GESTE. La page où l'on va agir, souvent pré-remplie par ses
 *     paramètres d'URL (`/finances/achats?new=1` ouvre le formulaire d'achat).
 *     JAMAIS la page courante : un lien vers l'écran qu'on regarde déjà est un
 *     bouton mort, et c'est tout ce que les cartes contenaient.
 */
/**
 * UN ÉCRAN PROPOSÉ, AVEC LA PORTE DE CE QU'ON Y FERA.
 *
 * ⚠️ LA PORTE D'UNE PAGE N'EST PAS CELLE DU GESTE QU'ON Y FAIT, et cette
 * confusion a produit le pire défaut de ce chantier. La carte des stocks
 * proposait « Enregistrer l'achat » vers `/finances/achats?new=1` ; la porte
 * lue dans la navigation était celle de `/finances`, soit `facturationPdf`,
 * que le plan **Starter possède**. Mais l'écriture, elle, passe par
 * `POST /api/finances/achats`, gaté `comptabiliteAchats` — que Starter n'a pas.
 *
 * Conséquence vécue : l'apiculteur Starter lit « il te reste 12 kg de sirop »,
 * touche « Enregistrer l'achat », remplit fournisseur, montant, TVA — et
 * reçoit à l'enregistrement « Cette fonctionnalité nécessite le plan Pro ».
 * Sa saisie est perdue, et personne ne lui avait rien demandé : c'est Maya qui
 * a ouvert la porte, et Maya qui la lui referme.
 *
 * `feature` porte donc la porte du GESTE, lue à sa source (`ROUTE_GATES` pour
 * une route d'écriture, `FEATURE_PAR_CATEGORIE` pour une intervention).
 * `undefined` = l'écran ne sert qu'à consulter ; on retombe alors sur la porte
 * de la page.
 */
export interface EcranPropose {
  to: string;
  libelle: string;
  /** La feature exigée par le GESTE qu'on y accomplira. */
  feature?: keyof PlanFeatures;
}

export interface PropositionMaya {
  /** Le constat : chiffré, daté, nommé. Jamais « 3 colonies » sans dire lesquelles. */
  texte: string;
  ton: TonProposition;
  /** La fiche de savoir qui explique ce constat précis. */
  pourquoi?: { libelle: string; question: string };
  /** L'écran où agir — jamais celui d'où l'on vient. */
  ecran?: EcranPropose;
  /**
   * VRAI si le constat ne vient PAS des données de cet apiculteur — le
   * calendrier apicole, une nouveauté du produit. Il enrichit une carte qui
   * parle déjà, mais ne suffit JAMAIS à la faire apparaître.
   *
   * ⚠️ SANS CETTE DISTINCTION, LA CARTE NE SE TAIT PLUS. « Préparez
   * l'hivernage » est vrai du 15 septembre au 31 octobre pour tout le monde :
   * la carte du calendrier aurait donc parlé six semaines d'affilée à un
   * apiculteur dont le rucher va parfaitement bien. Or la règle du produit est
   * que sur une PAGE, au calme, Maya se tait — seul le tableau de bord garde
   * la parole.
   */
  general?: true;
}

/**
 * La PERCHE d'une carte : l'invitation à poursuivre, en bas.
 *
 * Sa `question` est TOUJOURS une intention de lecture (« fais-moi un point
 * santé »), là où les `pourquoi` sont toujours des questions de savoir. C'est
 * ce qui rend impossible qu'un bouton de la carte rende le même paragraphe
 * qu'un autre.
 */
export interface BriefRelance {
  /** Ce que Maya dit avant de tendre la perche. */
  amorce: string;
  /** La question posée en son nom, cliquable — et routable telle quelle. */
  question: string;
}

export interface Brief {
  /** Salutation personnalisée, ex. « Bonjour Antoine ». Vide sur une carte de page. */
  salutation: string;
  /** Phrase d'introduction, ton compagnon. */
  intro: string;
  items: PropositionMaya[];
  /** Carte contextuelle uniquement : la perche tendue en bas de carte. */
  relance?: BriefRelance;
}

// ─── Ce dont un contexte a besoin, et rien de plus ──────────────────────────

export type BesoinBrief = 'ruches' | 'alertes' | 'stocks' | 'meteo';

export interface DonneesBrief {
  ruches: RucheSante[];
  alertes: AlerteRow[];
  stocks: StockRow[];
  meteo: MeteoResultat | { erreur: string };
}

const DONNEES_VIDES: DonneesBrief = {
  ruches: [],
  alertes: [],
  stocks: [],
  meteo: { erreur: 'non_charge' },
};

// ─── Le savoir cité selon la saison ─────────────────────────────────────────

/**
 * La fiche que Maya propose quand le constat est « il faudrait y aller ».
 *
 * ⚠️ CHAQUE FORMULATION A ÉTÉ MESURÉE sur le classificateur, pas devinée : ce
 * sont exactement les phrases qui atteignent l'article visé. Une question de
 * savoir qui manquerait sa fiche tomberait sur une autre, ou sur « je n'ai pas
 * compris » — et le banc `propositionsMaya` refuse les deux.
 */
export interface FicheCitee {
  libelle: string;
  question: string;
}

const SAVOIR_DE_SAISON: Record<Saison, FicheCitee> = {
  printemps: {
    libelle: 'La visite de printemps',
    question: 'Comment se passe une visite de printemps ?',
  },
  ete: { libelle: 'Quand récolter ?', question: 'Quand récolter le miel ?' },
  automne: { libelle: 'Préparer l’hivernage', question: 'Comment préparer l’hivernage ?' },
  hiver: { libelle: 'Traiter le varroa', question: 'Comment traiter le varroa ?' },
};

/**
 * La fiche qui éclaire une alerte, par TYPE d'alerte.
 *
 * Un type absent ne casse rien : la proposition se fait sans « pourquoi ».
 * C'est une DÉGRADATION assumée, pas une porte laissée ouverte — il ne s'agit
 * pas d'autoriser quoi que ce soit, seulement d'enrichir quand on sait le
 * faire. Un banc vérifie en revanche que chaque fiche citée EXISTE : une
 * coquille dans un identifiant tuerait le lien en silence.
 */
const SAVOIR_PAR_ALERTE: Record<string, FicheCitee> = {
  varroa_seuil: { libelle: 'Traiter le varroa', question: 'Comment traiter le varroa ?' },
  traitement_fin: { libelle: 'Traiter le varroa', question: 'Comment traiter le varroa ?' },
  cellule_royale: { libelle: 'L’essaimage', question: 'Qu’est-ce que l’essaimage ?' },
  colonie_orpheline: {
    libelle: 'Une colonie orpheline',
    question: 'Qu’est-ce qu’une colonie orpheline ?',
  },
  maladie_loque: { libelle: 'Reconnaître la loque', question: 'Comment reconnaître la loque ?' },
  maladie_observee: {
    libelle: 'Les maladies',
    question: 'Quelles maladies touchent les abeilles ?',
  },
  sante_critique: { libelle: 'Les maladies', question: 'Quelles maladies touchent les abeilles ?' },
  stock_bas: { libelle: 'Quand nourrir ?', question: 'Quand nourrir les colonies ?' },
  /**
   * ⚠️ LE LIBELLÉ ET LA QUESTION DOIVENT VISER LA MÊME FICHE. Celui-ci
   * annonçait « Le calendrier apicole » et ouvrait… la visite de printemps.
   * En septembre, l'apiculteur touchait un bouton qui promet le calendrier de
   * l'année et recevait un article sur la sortie d'hivernage. Le libellé se lit
   * comme une promesse ; un banc l'exige désormais tenue.
   */
  rappel_saison: {
    libelle: 'Le calendrier apicole',
    question: 'Quel est le calendrier apicole ?',
  },
};

/**
 * L'ÉCRAN DE SAISIE, DÉJÀ OUVERT SUR LE BON GESTE.
 *
 * `/interventions/nouvelle` lit `?type=` et pré-sélectionne la catégorie une
 * fois la ruche choisie (`selectRuche`, l. 834-855). Le mécanisme existait ;
 * les cartes envoyaient tout le monde sur le formulaire nu, à recommencer le
 * chemin que Maya venait de décrire.
 *
 * ⚠️ LE TYPE EST CELUI DU CATALOGUE (`CategorieIntervention`), pas une chaîne
 * libre : la page IGNORE en silence un `?type=` qu'elle ne reconnaît pas. Une
 * coquille n'aurait produit aucune erreur, juste un formulaire qui ne se
 * pré-remplit plus — et personne ne l'aurait vu.
 *
 * La RUCHE, elle, ne peut pas être pré-choisie : `RucheSante` ne porte que le
 * numéro, pas l'identifiant que la page attend. C'est une limite connue, pas
 * un oubli.
 */
/**
 * La porte de l'enregistrement d'un achat, LUE dans `ROUTE_GATES` — jamais
 * recopiée. Si la route change de feature, la carte suit.
 */
const FEATURE_ACHAT = ROUTE_GATES['POST /api/finances/achats']?.feature;

function saisir(type: CategorieIntervention, libelle: string): EcranPropose {
  return {
    to: `/interventions/nouvelle?type=${type}`,
    libelle,
    // ⚠️ LUE À SA SOURCE. `dispatchHandler` refuse une catégorie hors plan
    // (`recolte` → `production`, `reine` → `moduleReine`) : proposer d'ouvrir
    // le formulaire sur une catégorie que le compte ne peut pas enregistrer
    // serait le même piège que l'achat en Starter. Aucune des catégories
    // proposées aujourd'hui n'est gatée — mais le jour où l'une le devient,
    // la carte le saura sans qu'on y pense.
    feature: FEATURE_PAR_CATEGORIE[type],
  };
}

// ─── Outils de rédaction ────────────────────────────────────────────────────

/** Fenêtre « depuis cette nuit » : les ~18 dernières heures. */
const FENETRE_VEILLE_MS = 18 * 3600 * 1000;

function msDe(x: string | Date | null | undefined): number | null {
  if (!x) return null;
  const t = x instanceof Date ? x.getTime() : Date.parse(x);
  return Number.isNaN(t) ? null : t;
}

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function pluriel(n: number, singulier: string, pluriel_: string): string {
  return n > 1 ? pluriel_ : singulier;
}

/** « et 2 autres », ou rien du tout. */
function etLesAutres(total: number): string {
  const reste = total - 1;
  if (reste <= 0) return '';
  return ` (et ${reste} ${pluriel(reste, 'autre', 'autres')})`;
}

/** Un nombre lisible : 12, 12,5 — jamais 12.500000001. */
function nombre(x: number): string {
  return (Math.round(x * 10) / 10).toString().replace('.', ',');
}

// ─── Ce que la formule autorise à proposer ──────────────────────────────────

/**
 * La feature exigée par une QUESTION, déduite de sa classification.
 *
 * ⚠️ RIEN N'EST REDÉCLARÉ ICI. On demande au moteur ce qu'il ferait de la
 * question, et si c'est une lecture gatée, on lit sa porte dans `ROUTE_GATES`
 * via `ROUTE_LECTURE`. Une porte qui bougerait sur une route bougerait donc
 * aussi pour les cartes, sans que personne n'y pense — ce qui est exactement
 * la raison d'être de `copilote-gating.ts`.
 */
export function featureDeLaQuestion(question: string): ReturnType<typeof featureDeLecture> {
  const d = classifierTour([{ role: 'user', content: question }]);
  if (d.kind !== 'action' || !estLectureGatee(d.intent)) return null;
  return featureDeLecture(d.intent);
}

/**
 * Ne garde d'une proposition que ce que la formule couvre, et la laisse tomber
 * si son constat perd tout intérêt sans sa suite.
 *
 * Une proposition dont l'écran est hors plan garde son constat (le fait reste
 * vrai et utile) et perd son bouton. C'est le bon compromis : on informe sans
 * vendre.
 */
export function selonLePlan(p: PropositionMaya, plan: Plan): PropositionMaya {
  const pourquoi =
    p.pourquoi && planCouvre(plan, featureDeLaQuestion(p.pourquoi.question))
      ? p.pourquoi
      : undefined;
  // La porte du GESTE l'emporte sur celle de la page : c'est elle qui refusera.
  const porteEcran = p.ecran ? (p.ecran.feature ?? featureDeLaPage(p.ecran.to)) : null;
  const ecran = p.ecran && planCouvre(plan, porteEcran) ? p.ecran : undefined;
  return { ...p, pourquoi, ecran };
}

// ─── Les composeurs, un par contexte ────────────────────────────────────────

interface Contexte {
  /** Les chargements dont ce contexte a besoin. Le reste n'est pas demandé. */
  besoins: readonly BesoinBrief[];
  /** La page où l'apiculteur se trouve déjà — aucun écran proposé n'y mène. */
  page: string;
  /** La perche : TOUJOURS une intention de lecture, jamais une fiche de savoir. */
  relance: BriefRelance;
  composer(d: DonneesBrief, now: Date): PropositionMaya[];
}

/** Les ruches actives, seules concernées par une proposition de terrain. */
function actives(ruches: RucheSante[]): RucheSante[] {
  return ruches.filter((r) => r.statut === 'active');
}

/**
 * Les colonies en retard de visite, au rythme de LA SAISON.
 *
 * En hiver la cadence est « repos » : on ne pousse personne à ouvrir une ruche
 * en décembre, donc aucune proposition. C'est `cadence.ts` qui le dit, et c'est
 * lui qu'on lit — le seuil de 21 jours avait déjà été recopié une fois ici, et
 * au printemps le briefing taisait une ruche que `/alertes` signalait au même
 * instant.
 */
function retardDeVisite(ruches: RucheSante[], now: Date): PropositionMaya | null {
  const cadence = cadenceVisite(now);
  if (cadence.repos) return null;
  const enRetard = actives(ruches).filter(
    (r) => r.joursDepuisVisite == null || r.joursDepuisVisite >= cadence.intervalleJours,
  );
  if (!enRetard.length) return null;

  const jamaisVues = enRetard.filter((r) => r.joursDepuisVisite == null).length;
  const detail = jamaisVues
    ? `dont ${jamaisVues} que tu n’as jamais ouverte${pluriel(jamaisVues, '', 's')}`
    : `la plus ancienne remonte à ${Math.max(...enRetard.map((r) => r.joursDepuisVisite ?? 0))} jours`;

  return {
    texte:
      `${enRetard.length} ${pluriel(enRetard.length, 'ruche attend', 'ruches attendent')} une visite — ` +
      `${detail}. ${cadence.label} : on compte environ ${cadence.intervalleJours} jours entre deux passages.`,
    ton: 'honey',
    pourquoi: SAVOIR_DE_SAISON[cadence.saison],
    ecran: saisir('controle', 'Noter une visite'),
  };
}

/** La colonie la plus fragile, NOMMÉE — pas un compteur anonyme. */
function colonieFragile(ruches: RucheSante[]): PropositionMaya | null {
  const fragiles = actives(ruches)
    .filter((r) => r.derniereVisite != null && r.scoreSante < SEUIL_COLONIE_FRAGILE)
    .sort((a, b) => a.scoreSante - b.scoreSante);
  const pire = fragiles[0];
  if (!pire) return null;

  const depuis =
    pire.joursDepuisVisite != null ? `, vue il y a ${pire.joursDepuisVisite} jours` : '';
  return {
    texte:
      `La ruche ${pire.numero} (${pire.rucher}) est à ${pire.scoreSante}/100 — ` +
      `${scoreLabel(pire.scoreSante).toLowerCase()}${depuis}.${etLesAutres(fragiles.length)}`,
    ton: 'clay',
    /**
     * ⚠️ ON NE POSE PAS DE DIAGNOSTIC QU'ON N'A PAS. La première version citait
     * « Qu'est-ce qu'une colonie orpheline ? » — l'article est excellent, mais
     * rien dans les données ne dit que celle-ci l'est. Une fiche présentée
     * comme L'explication d'un constat se lit comme une affirmation : Maya
     * aurait annoncé une reine perdue sur la foi d'un score bas. La fiche
     * « maladies » survole au contraire les hypothèses sans en trancher aucune,
     * ce qui est exactement l'état de nos connaissances ici.
     */
    pourquoi: SAVOIR_PAR_ALERTE.maladie_observee,
    ecran: { to: '/alertes', libelle: 'Ce que j’ai relevé' },
  };
}

/** Une infestation varroa au-dessus du seuil de traitement ITSAP. */
function varroaAuDessusDuSeuil(ruches: RucheSante[]): PropositionMaya | null {
  const touchees = actives(ruches)
    .filter((r) => r.varroa != null && r.varroa > VARROA_PCT.traitement)
    .sort((a, b) => (b.varroa ?? 0) - (a.varroa ?? 0));
  const pire = touchees[0];
  if (!pire || pire.varroa == null) return null;

  return {
    texte:
      `Ruche ${pire.numero} : ${nombre(pire.varroa)} % de varroa au dernier comptage. ` +
      `Au-delà de ${VARROA_PCT.traitement} %, un traitement s’impose.${etLesAutres(touchees.length)}`,
    ton: 'clay',
    pourquoi: SAVOIR_PAR_ALERTE.varroa_seuil,
    ecran: saisir('varroa', 'Noter le traitement'),
  };
}

/** La meilleure fenêtre météo des cinq prochains jours, chiffrée. */
function fenetreMeteo(
  meteo: MeteoResultat | { erreur: string },
  ruches: RucheSante[],
  now: Date,
): PropositionMaya | null {
  if ('erreur' in meteo || !meteo.previsions.length) return null;
  const meilleur = [...meteo.previsions].sort((a, b) => b.scoreVisite - a.scoreVisite)[0];
  if (!meilleur) return null;

  const cadence = cadenceVisite(now);
  const dues = cadence.repos
    ? 0
    : actives(ruches).filter(
        (r) => r.joursDepuisVisite == null || r.joursDepuisVisite >= cadence.intervalleJours,
      ).length;
  const suite = dues ? ` ${dues} ${pluriel(dues, 'ruche y est due', 'ruches y sont dues')}.` : '';

  if (meilleur.scoreVisite < 60) {
    return {
      texte:
        `Aucune vraie fenêtre d’ici cinq jours : au mieux ${dateCourte(meilleur.date)}, ` +
        `${Math.round(meilleur.tempMax)} °C et ${Math.round(meilleur.ventMaxKmh)} km/h de vent.`,
      ton: 'neutre',
      pourquoi: SAVOIR_DE_SAISON[cadence.saison],
      ecran: { to: '/ruches', libelle: 'Voir mes colonies' },
    };
  }

  return {
    texte:
      `${dateCourte(meilleur.date)} : ${Math.round(meilleur.tempMax)} °C, ` +
      `vent ${Math.round(meilleur.ventMaxKmh)} km/h, ${meilleur.conditions.toLowerCase()}. ` +
      `C’est la meilleure fenêtre des cinq prochains jours.${suite}`,
    ton: 'sage',
    pourquoi: SAVOIR_DE_SAISON[cadence.saison],
    ecran: { to: '/calendrier', libelle: 'Caler la visite' },
  };
}

/**
 * L'alerte la plus urgente, DITE PAR SON NOM, avec sa propre destination.
 *
 * La version précédente comptait (« 2 alertes à regarder ») et renvoyait vers
 * `/alertes` — l'écran d'où l'on venait. Or l'alerte porte son titre, rédigé
 * par le moteur, et son `actionUrl`, qui vise la ruche concernée.
 */
/**
 * LES TYPES D'ALERTE QU'UNE AUTRE PROPOSITION DIT DÉJÀ, EN MIEUX.
 *
 * ⚠️ LE TABLEAU DE BORD SE RÉPÉTAIT. Il affichait « Ruche 7 : 6 % de varroa au
 * dernier comptage » puis, deux lignes plus bas, « Varroa au-dessus du seuil
 * sur la ruche 7 — c'est critique ». Le même fait, deux fois, dans la même
 * carte : la lecture brute de la donnée, et la vue qu'en a le moteur d'alertes.
 *
 * On garde celle qui en dit le plus — la proposition dédiée, qui porte le
 * chiffre et le seuil — et l'alerte cède la place. Sur `/alertes`, où aucune
 * proposition dédiée n'existe, rien n'est exclu : c'est le paramètre qui le
 * décide, pas une règle cachée dans la fonction.
 */
const ALERTES_DEJA_DITES = [
  'varroa_seuil',
  'visite_requise',
  'premiere_visite',
  'sante_critique',
  'colonie_faible',
  'stock_bas',
  'meteo_favorable',
];

function alertePrioritaire(
  alertes: AlerteRow[],
  exclure: readonly string[] = [],
): PropositionMaya | null {
  const rang: Record<string, number> = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
  const urgentes = alertes
    .filter((a) => a.priorite === 'critique' || a.priorite === 'haute')
    .filter((a) => !exclure.includes(a.type))
    .sort((a, b) => (rang[a.priorite ?? 'basse'] ?? 9) - (rang[b.priorite ?? 'basse'] ?? 9));
  const premiere = urgentes[0];
  if (!premiere) return null;

  return {
    texte: `${premiere.titre}${premiere.priorite === 'critique' ? ' — c’est critique' : ''}.${etLesAutres(urgentes.length)}`,
    ton: 'clay',
    pourquoi: SAVOIR_PAR_ALERTE[premiere.type],
    /**
     * ⚠️ ON NE FILTRE PAS ICI L'ÉCRAN QUI MÈNE À LA PAGE COURANTE, et c'est
     * délibéré : une première version le faisait, avec un `startsWith` — donc
     * en confondant `/alertes` et `/alertesXYZ`, exactement le piège de
     * frontière de segment corrigé deux fonctions plus haut. Deux endroits
     * répondant à la même question auraient fini par y répondre différemment.
     * `retirerLesAutoLiens` s'en charge, une fois, pour toutes les surfaces.
     */
    ecran: premiere.actionUrl ? { to: premiere.actionUrl, libelle: 'Aller voir' } : undefined,
  };
}

/**
 * RÉSERVES D'HIVERNAGE VISÉES PAR COLONIE, EN KILOS.
 *
 * ⚠️ CE N'EST PAS UN CHIFFRE LIBRE, ET LA PREMIÈRE VERSION EN ÉTAIT UN. Elle
 * annonçait « environ 8 kg par colonie » — un ordre de grandeur plausible, mais
 * inventé, et surtout CONTREDIT par la fiche que le bouton juste à côté ouvre :
 * « Préparer l'hivernage » y dit « 12-18 kg selon la région ». Deux réponses
 * différentes du même produit, à un clic d'écart.
 *
 * Elle confondait en plus deux choses : les RÉSERVES visées (ce que la colonie
 * doit avoir) et le SIROP à ajouter (ce qui manque à ce qu'elle a déjà) — que
 * nous ne connaissons pas. On annonce donc la cible, pas un complément.
 *
 * Un banc vérifie que la fiche dit toujours la même chose : si elle change, ce
 * chiffre doit changer avec elle.
 */
export const RESERVES_HIVERNAGE_KG = { min: 12, max: 18 } as const;

/** Un article destiné à nourrir les colonies (sirop, candi, nourrissement). */
function estNourrissement(nom: string): boolean {
  return /sirop|candi|nourriss/i.test(nom);
}

/** L'article de stock le plus bas, chiffré, avec ce qu'il va manquer. */
function stockLePlusBas(stocks: StockRow[], ruches: RucheSante[]): PropositionMaya | null {
  const bas = stocks
    .filter((s) => s.sousLeSeuil && s.quantite != null && s.seuilAlerte != null)
    .sort(
      (a, b) =>
        Number(a.quantite) / Number(a.seuilAlerte) - Number(b.quantite) / Number(b.seuilAlerte),
    );
  const pire = bas[0];
  if (!pire) return null;

  const unite = pire.unite ? ` ${pire.unite}` : '';
  const nbColonies = actives(ruches).length;
  const contexte =
    nbColonies && estNourrissement(pire.nom)
      ? ` Tes ${nbColonies} ${pluriel(nbColonies, 'colonie vise', 'colonies visent')} ` +
        `${RESERVES_HIVERNAGE_KG.min} à ${RESERVES_HIVERNAGE_KG.max} kg de réserves ` +
        `chacune avant les froids.`
      : '';

  return {
    texte:
      `Il te reste ${nombre(Number(pire.quantite))}${unite} de ${pire.nom.toLowerCase()}, ` +
      `pour un seuil à ${nombre(Number(pire.seuilAlerte))}${unite}.${contexte}${etLesAutres(bas.length)}`,
    ton: 'honey',
    pourquoi: estNourrissement(pire.nom)
      ? {
          libelle: 'Combien par colonie ?',
          question: 'Combien de sirop par colonie pour l’hivernage ?',
        }
      : SAVOIR_PAR_ALERTE.stock_bas,
    // Le formulaire d'achat s'ouvre directement : `?new=1` est lu par la page
    // (`finances/achats.vue`). La porte est celle de l'ÉCRITURE, pas de la
    // page : `POST /api/finances/achats` exige `comptabiliteAchats` (Pro+),
    // là où la navigation ne connaît que `facturationPdf` (Starter+).
    ecran: {
      to: '/finances/achats?new=1',
      libelle: 'Enregistrer l’achat',
      feature: FEATURE_ACHAT,
    },
  };
}

/**
 * La fiche qui éclaire une FENÊTRE du calendrier apicole, par sa clé.
 *
 * ⚠️ ELLE SUIT LA FENÊTRE, PAS LA SAISON. La première version citait
 * `SAVOIR_DE_SAISON` — donc la même fiche que la proposition météo posée juste
 * au-dessus sur la carte du calendrier. Deux boutons, un seul paragraphe :
 * exactement le défaut que ce chantier corrige, réintroduit par distraction.
 * Le banc l'a vu tomber. La clé de fenêtre est plus précise de toute façon :
 * « pose des hausses » n'est pas « le printemps ».
 */
/**
 * Le geste que chaque fenêtre du calendrier apicole appelle. Un type absent
 * laisse simplement le formulaire au choix de l'apiculteur.
 */
const GESTE_PAR_FENETRE: Record<string, { type: CategorieIntervention; libelle: string }> = {
  'visite-printemps': { type: 'controle', libelle: 'Noter la visite' },
  'pose-hausses': { type: 'materiel', libelle: 'Noter la pose' },
  'surveillance-essaimage': { type: 'controle', libelle: 'Noter le contrôle' },
  'traitement-varroa': { type: 'varroa', libelle: 'Noter le traitement' },
  'preparation-hivernage': { type: 'nourrissement', libelle: 'Noter le nourrissement' },
  'suivi-hiver': { type: 'pesee', libelle: 'Noter la pesée' },
};

const SAVOIR_PAR_FENETRE: Record<string, FicheCitee> = {
  'visite-printemps': {
    libelle: 'La visite de printemps',
    question: 'Comment se passe une visite de printemps ?',
  },
  'pose-hausses': { libelle: 'Quand poser les hausses ?', question: 'Quand poser les hausses ?' },
  'surveillance-essaimage': { libelle: 'L’essaimage', question: 'Qu’est-ce que l’essaimage ?' },
  'traitement-varroa': {
    libelle: 'Traiter le varroa',
    question: 'Comment traiter le varroa ?',
  },
  'preparation-hivernage': {
    libelle: 'Préparer l’hivernage',
    question: 'Comment préparer l’hivernage ?',
  },
  'suivi-hiver': { libelle: 'Le suivi d’hiver', question: 'Comment préparer l’hivernage ?' },
};

/** Ce que le calendrier apicole ouvre en ce moment — daté, pas générique. */
function fenetreDeSaison(now: Date): PropositionMaya | null {
  const ouverte = fenetresSaisonOuvertes(now)[0];
  if (!ouverte) return null;
  return {
    texte: `${ouverte.titre} — ${ouverte.message}`,
    ton: ouverte.priorite === 'haute' ? 'clay' : 'sage',
    pourquoi: SAVOIR_PAR_FENETRE[ouverte.cle] ?? SAVOIR_DE_SAISON[saisonApicole(now)],
    ecran: (() => {
      const g = GESTE_PAR_FENETRE[ouverte.cle];
      return g
        ? saisir(g.type, g.libelle)
        : { to: '/interventions/nouvelle', libelle: 'Noter ce que j’ai fait' };
    })(),
    // Le calendrier apicole est vrai pour tout le monde : il ENRICHIT une carte,
    // il ne la fait pas exister. Cf. `dUnCompte` ci-dessous.
    general: true,
  };
}

const CONTEXTES: Record<ContexteBrief, Contexte> = {
  ruches: {
    besoins: ['ruches'],
    page: '/ruches',
    relance: {
      amorce: 'Je peux regarder ça de plus près.',
      question: 'Fais-moi un point santé',
    },
    composer: (d, now) =>
      [
        colonieFragile(d.ruches),
        varroaAuDessusDuSeuil(d.ruches),
        retardDeVisite(d.ruches, now),
      ].filter((p): p is PropositionMaya => p != null),
  },

  meteo: {
    besoins: ['meteo', 'ruches'],
    page: '/meteo',
    relance: {
      amorce: 'Dis-moi par où commencer.',
      question: 'Quelles ruches visiter en priorité ?',
    },
    composer: (d, now) =>
      [fenetreMeteo(d.meteo, d.ruches, now)].filter((p): p is PropositionMaya => p != null),
  },

  alertes: {
    besoins: ['alertes'],
    page: '/alertes',
    relance: {
      amorce: 'On regarde l’état du cheptel ?',
      question: 'Fais-moi un point santé',
    },
    composer: (d) => [alertePrioritaire(d.alertes)].filter((p): p is PropositionMaya => p != null),
  },

  stocks: {
    besoins: ['stocks', 'ruches'],
    page: '/stocks',
    relance: {
      amorce: 'Je peux replacer ça dans ton budget.',
      question: 'Où en sont mes finances ?',
    },
    composer: (d) =>
      [stockLePlusBas(d.stocks, d.ruches)].filter((p): p is PropositionMaya => p != null),
  },

  calendrier: {
    besoins: ['ruches', 'meteo', 'alertes'],
    page: '/calendrier',
    relance: {
      amorce: 'Je t’aide à organiser la semaine ?',
      question: 'Quelles ruches visiter en priorité ?',
    },
    composer: (d, now) =>
      [
        fenetreDeSaison(now),
        fenetreMeteo(d.meteo, d.ruches, now),
        retardDeVisite(d.ruches, now),
        alertePrioritaire(d.alertes, ALERTES_DEJA_DITES),
      ].filter((p): p is PropositionMaya => p != null),
  },
};

/**
 * TOUTES LES FICHES QUE MAYA PEUT CITER, catalogue compris.
 *
 * ⚠️ BALAYER CE QUE LES CARTES ÉMETTENT NE SUFFIT PAS. Une entrée n'est rendue
 * que si les données de l'apiculteur l'atteignent : le libellé menteur du
 * calendrier apicole (`rappel_saison`) n'apparaissait sur aucune carte du banc,
 * puisqu'aucune alerte de ce type ne figurait dans le jeu d'essai. La règle
 * était juste et ne mesurait rien. On lui donne donc la SOURCE, pas
 * l'échantillon : une entrée fautive ajoutée demain est vue même si aucun
 * apiculteur n'a encore de quoi la déclencher.
 */
export const FICHES_CITEES: readonly FicheCitee[] = [
  ...Object.values(SAVOIR_DE_SAISON),
  ...Object.values(SAVOIR_PAR_ALERTE),
  ...Object.values(SAVOIR_PAR_FENETRE),
  { libelle: 'Combien par colonie ?', question: 'Combien de sirop par colonie pour l’hivernage ?' },
];

/** Ce dont un contexte a besoin — lu par `briefDuJour` pour ne charger que ça. */
export function besoinsDuContexte(contexte: ContexteBrief): readonly BesoinBrief[] {
  return CONTEXTES[contexte].besoins;
}

// ─── La carte d'une page ────────────────────────────────────────────────────

/**
 * La carte d'une page. `items` vide ⟹ la carte disparaît, ET aucune relance.
 *
 * ⚠️ CES DEUX CHOSES NE SE SÉPARENT PAS. Tant qu'une relance survivait à
 * l'absence de constat, il fallait une branche « calme » pour l'accompagner —
 * une branche que les composants ne rendaient jamais, puisqu'ils se masquent
 * sur `items.length === 0`. Elle mentait dans les bancs sans exister à l'écran.
 */
export function composerCarte(
  contexte: ContexteBrief,
  d: DonneesBrief,
  opts: { plan: Plan; maintenant?: number },
): Brief {
  const ctx = CONTEXTES[contexte];
  const now = new Date(opts.maintenant ?? Date.now());
  const brutes = ctx.composer(d, now);

  // Rien qui vienne du rucher de CET apiculteur ⟹ la carte n'existe pas. Le
  // calendrier apicole ne parle pas de lui : il enrichit, il ne convoque pas.
  if (!brutes.some((p) => !p.general)) return { salutation: '', intro: '', items: [] };

  const items = dedupliquerLesSuites(
    retirerLesAutoLiens(brutes, ctx.page).map((p) => selonLePlan(p, opts.plan)),
  );

  // ⚠️ PAS DE SECOND `if (!items.length)` ICI, ET C'EST MESURÉ. Il y en avait
  // un ; le retirer ne faisait rougir aucun banc. C'est un GARDE MORT : les
  // trois transformations ci-dessus sont des `map`, donc `items` a exactement
  // la longueur de `brutes`, et le cas « vide » est déjà traité au-dessus. Un
  // garde mort donne l'illusion d'une protection et détourne de celle qui
  // manque — l'invariant « aucune proposition ⟹ aucune relance » est tenu par
  // un banc, pas par une ligne que rien ne peut atteindre.
  const relance = planCouvre(opts.plan, featureDeLaQuestion(ctx.relance.question))
    ? ctx.relance
    : undefined;

  return {
    salutation: '',
    intro: voix(`contexte_${contexte}` as const),
    items,
    relance,
  };
}

/**
 * DEUX BOUTONS D'UNE MÊME CARTE NE PEUVENT PAS MENER AU MÊME PARAGRAPHE.
 *
 * La séparation savoir / lecture rend impossible qu'un « pourquoi » collisionne
 * avec la relance. Elle ne dit rien, en revanche, de deux « pourquoi » qui
 * viseraient la même fiche — et c'est arrivé dès la première écriture : sur la
 * carte du calendrier, la fenêtre de saison et la fenêtre météo citaient toutes
 * deux « préparer l'hivernage ». On garde le premier, on retire la suite du
 * second : son constat reste, son bouton disparaît.
 *
 * On demande au MOTEUR où chaque question atterrit, on ne compare pas les
 * textes : deux formulations très différentes rendent le même paragraphe dès
 * qu'elles tombent sur la même fiche.
 */
function dedupliquerLesSuites(items: PropositionMaya[]): PropositionMaya[] {
  const vues = new Set<string>();
  return items.map((p) => {
    if (!p.pourquoi) return p;
    const d = classifierTour([{ role: 'user', content: p.pourquoi.question }]);
    const cle = d.kind === 'savoir' ? `savoir:${d.articleId}` : `autre:${p.pourquoi.question}`;
    if (vues.has(cle)) return { ...p, pourquoi: undefined };
    vues.add(cle);
    return p;
  });
}

/**
 * Retire les écrans qui mènent à la page où l'apiculteur se trouve déjà.
 *
 * UNE SEULE FONCTION, pour toutes les surfaces : le tableau de bord aussi bien
 * que les cartes de page. Le constat survit, seul son bouton disparaît.
 */
function retirerLesAutoLiens(items: PropositionMaya[], page: string): PropositionMaya[] {
  return items.map((p) =>
    p.ecran && cheminEgal(p.ecran.to, page) ? { ...p, ecran: undefined } : p,
  );
}

/** Deux chemins désignent-ils la même page ? (`/stocks` et `/stocks?x=1` : oui.) */
export function cheminEgal(a: string, b: string): boolean {
  return (a.split('?')[0] ?? a) === (b.split('?')[0] ?? b);
}

// ─── Le tableau de bord ─────────────────────────────────────────────────────

const SAISON: string[] = [
  'je surveillerais le poids des ruches et le varroa hors couvain.',
  'c’est le moment de préparer le matériel pour la reprise.',
  'place à la visite de printemps : ponte et réserves à vérifier.',
  'garde un œil sur l’essaimage et pose les premières hausses.',
  'pleine saison d’essaimage — des visites rapprochées s’imposent.',
  'gère les hausses et profite des miellées d’été.',
  'c’est la récolte : vise un miel mûr et bien operculé.',
  'après la dernière récolte, pense au traitement varroa.',
  'complète les réserves et prépare la déclaration des ruches.',
  'réduis les entrées et reste vigilant face au frelon.',
  'les colonies se reposent : entretenez le matériel.',
  'un traitement à l’acide oxalique hors couvain est idéal.',
];

/**
 * L'INFO DU JOUR — une nouveauté du produit, expliquée en passant.
 *
 * ⚠️ ELLE EST TIRÉE DE `PATCH_NOTE`, PAS D'UN SECOND CATALOGUE. La note de
 * version est déjà la liste, tenue à jour et relue, de ce qui a été livré ;
 * elle s'affiche une fois en modale et ne se revoit jamais. Un fichier
 * `infos-du-jour.ts` parallèle aurait divergé d'elle à la mise à jour suivante
 * — et c'est précisément la duplication qui produit la majorité des défauts de
 * ce dépôt. Une seule source, deux surfaces : la modale une fois, la carte de
 * temps en temps.
 *
 * Le tirage suit la graine du jour (`seedVoix`) : l'apiculteur voit la même
 * info toute la journée, une autre le lendemain.
 */
function infoDuJour(): PropositionMaya | null {
  const nouveautes = PATCH_NOTE.nouveautes;
  if (!nouveautes.length) return null;
  const item = choisir(nouveautes);
  return {
    texte: `${item.titre} — ${item.texte}`,
    ton: 'neutre',
    ecran: { to: '/guide', libelle: 'Me montrer' },
  };
}

/**
 * Verdict de « veille nocturne » : ce qui a changé depuis la nuit.
 * Renvoie une phrase prête à afficher, jamais vide.
 */
function verdictVeille(
  alertes: AlerteRow[],
  meteo: MeteoResultat | { erreur: string },
  maintenantMs: number,
): string {
  const faits: string[] = [];

  const nouvelles = alertes.filter((a) => {
    const t = msDe(a.createdAt);
    return t != null && maintenantMs - t <= FENETRE_VEILLE_MS && maintenantMs - t >= 0;
  });
  if (nouvelles.length) {
    faits.push(
      `${nouvelles.length} nouvelle${nouvelles.length > 1 ? 's' : ''} alerte${nouvelles.length > 1 ? 's' : ''} depuis hier`,
    );
  }

  if (!('erreur' in meteo) && meteo.previsions.length) {
    const nuit = meteo.previsions[0];
    if (nuit) {
      if (nuit.tempMin <= 1) faits.push(`gelée nocturne (jusqu'à ${Math.round(nuit.tempMin)} °C)`);
      if (/orage/i.test(nuit.conditions)) faits.push('orage');
      else if (nuit.ventMaxKmh >= 45) faits.push(`vent fort (${Math.round(nuit.ventMaxKmh)} km/h)`);
    }
  }

  const opener = voix('veilleNuit');
  if (!faits.length) return `${opener} ${voix('veilleRAS')}.`;
  return `${opener} À signaler : ${faits.join(', ')}.`;
}

/** Salutation selon l'heure (0-23) : matin / après-midi / soir. */
function salutationMoment(heure: number, prenom?: string): string {
  const nom = prenom ? ` ${prenom}` : '';
  if (heure < 7) return `Déjà debout${nom}`;
  if (heure < 12) return `Bonjour${nom}`;
  if (heure < 18) return `Bon après-midi${nom}`;
  return `Bonsoir${nom}`;
}

/**
 * Le point du jour. Contrairement aux cartes de page, il NE SE TAIT JAMAIS :
 * même sans rien à signaler, il porte la note de saison, et une fois sur trois
 * une info du jour.
 */
export function composerBriefDuJour(input: {
  prenom?: string;
  heure: number;
  plan: Plan;
  donnees: DonneesBrief;
  mois: number;
  maintenant?: number;
  /** Tirage de l'info du jour — injectable pour un banc déterministe. */
  avecInfoDuJour?: boolean;
}): Brief {
  const { prenom, heure, plan, donnees, mois } = input;
  const maintenant = input.maintenant ?? Date.now();
  const now = new Date(maintenant);

  const bruts = [
    fenetreMeteo(donnees.meteo, donnees.ruches, now),
    retardDeVisite(donnees.ruches, now),
    colonieFragile(donnees.ruches),
    varroaAuDessusDuSeuil(donnees.ruches),
    alertePrioritaire(donnees.alertes, ALERTES_DEJA_DITES),
    stockLePlusBas(donnees.stocks, donnees.ruches),
  ].filter((p): p is PropositionMaya => p != null);
  /**
   * ⚠️ LE DÉDOUBLONNAGE VAUT ICI AUSSI, ET IL Y MANQUAIT. `fenetreMeteo` et
   * `retardDeVisite` citent tous deux la fiche de la saison : le tableau de
   * bord affichait donc DEUX boutons « Préparer l'hivernage » côte à côte,
   * rendant le même paragraphe — exactement le défaut que ce chantier corrige,
   * survivant sur la seule surface que le banc ne balayait pas.
   */
  const items = dedupliquerLesSuites(
    retirerLesAutoLiens(bruts, '/dashboard').map((p) => selonLePlan(p, plan)),
  );

  // La note de saison ferme toujours la carte : c'est elle qui garantit que le
  // tableau de bord a quelque chose à dire, même un jour parfaitement calme.
  items.push({
    texte: `En cette saison, ${SAISON[mois] ?? 'suis tes colonies au rythme de l’année apicole.'}`,
    ton: 'neutre',
  });

  /**
   * ⚠️ LE TIRAGE SE FAIT ICI, AVANT `verdictVeille`, ET CE N'EST PAS UN HASARD
   * DE MISE EN PAGE. `choisir` AVANCE la graine à chaque appel. Or la veille
   * nocturne n'appelle `voix('veilleRAS')` que lorsqu'elle n'a rien à
   * signaler : le nombre de tirages qu'elle consomme dépend donc de l'état du
   * rucher. Tirer l'info du jour APRÈS elle la ferait changer à mi-journée
   * parce qu'une alerte est arrivée entre deux chargements — sans que rien ne
   * l'explique à l'apiculteur. Un banc de `maya-brief.test.ts` l'ancre, et
   * meurt si l'ordre bouge.
   */
  const info = (input.avecInfoDuJour ?? choisir([true, false, false])) ? infoDuJour() : null;
  if (info) items.push(selonLePlan(info, plan));

  return {
    salutation: salutationMoment(heure, prenom),
    intro: verdictVeille(donnees.alertes, donnees.meteo, maintenant),
    items,
  };
}

// ─── Chargement ─────────────────────────────────────────────────────────────

/**
 * Ne charge QUE ce que le contexte demande.
 *
 * ⚠️ `getMeteoRucher` SORT SUR LE RÉSEAU (Open-Meteo, 8 s de délai d'attente).
 * Il vivait dans un `Promise.all` inconditionnel : la carte des stocks, qui n'a
 * jamais rien fait de la météo, attendait quand même la réponse d'un service
 * tiers — sur chaque navigation, sous un chien de garde à 9 s.
 */
async function chargerDonnees(
  userId: string,
  besoins: readonly BesoinBrief[],
): Promise<DonneesBrief> {
  const veut = (b: BesoinBrief) => besoins.includes(b);
  const [ruches, alertes, stocks, meteo] = await Promise.all([
    veut('ruches') ? getRuchesSante(userId) : Promise.resolve(DONNEES_VIDES.ruches),
    veut('alertes') ? getAlertes(userId) : Promise.resolve(DONNEES_VIDES.alertes),
    veut('stocks') ? getStocks(userId) : Promise.resolve(DONNEES_VIDES.stocks),
    veut('meteo') ? getMeteoRucher(userId) : Promise.resolve(DONNEES_VIDES.meteo),
  ]);
  return { ruches, alertes, stocks, meteo };
}

const TOUS_LES_BESOINS: readonly BesoinBrief[] = ['ruches', 'alertes', 'stocks', 'meteo'];

/**
 * Le brief d'un espace : charge ce qu'il faut, puis compose.
 *
 * ⚠️ LE PROFIL EST LU UNE FOIS, PAS DEUX. Le prénom venait d'ici et le plan de
 * `planDuProprietaire()` appelé par la route : deux `select` sur LA MÊME LIGNE
 * de `profils`, à chaque chargement de carte, sur cinq pages. Une carte n'est
 * pas un écran rare — c'est le prix d'une navigation.
 */
export async function briefDuJour(
  userId: string,
  plan: Plan,
  contexte?: ContexteBrief,
): Promise<Brief> {
  const heure = Number(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  );

  const besoins = contexte ? besoinsDuContexte(contexte) : TOUS_LES_BESOINS;
  // Une carte de page n'affiche aucune salutation : on ne va pas chercher le
  // prénom pour ne rien en faire.
  const [profil, donnees] = await Promise.all([
    contexte
      ? Promise.resolve([])
      : db.select({ prenom: profils.prenom }).from(profils).where(eq(profils.id, userId)).limit(1),
    chargerDonnees(userId, besoins),
  ]);

  // Voix déterministe sur la journée : la carte reste identique à chaque
  // navigation du même utilisateur le même jour.
  const jour = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  seedVoix(`${userId}:${jour}`);

  if (contexte) return composerCarte(contexte, donnees, { plan });

  return composerBriefDuJour({
    prenom: profil[0]?.prenom ?? undefined,
    heure: Number.isNaN(heure) ? 9 : heure,
    plan,
    donnees,
    mois: moisParis(new Date()) - 1,
  });
}
