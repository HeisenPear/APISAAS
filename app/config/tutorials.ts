import { PHASES_PAR_THEME, type PhaseGuide, type ThemeGuide } from '~/config/guides-contenu';
import type { PlanFeatures } from '~/config/plans';

/**
 * LES VISITES GUIDÉES — DÉRIVÉES du contenu des guides, plus jamais recopiées.
 *
 * ⚠️ CE FICHIER PORTAIT SON PROPRE TEXTE, ET C'ÉTAIT LA DEUXIÈME COPIE. Vingt-
 * trois étapes écrites à la main, pendant que les composants `Guide*.vue` en
 * portaient CINQUANTE-SEPT, plus détaillées, sur les mêmes sujets. Deux textes
 * pour la même chose : celui que l'apiculteur lit dans le guide et celui qu'il
 * entend dans la visite guidée ne disaient déjà plus tout à fait pareil, et
 * chaque correction n'en touchait qu'un.
 *
 * Les tours dérivent maintenant de `PHASES_PAR_THEME`. Écrire une phase de
 * guide ajoute l'étape correspondante ; corriger une phrase la corrige des deux
 * côtés.
 */

export interface TutorialStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  /**
   * La page où l'étape se joue.
   *
   * ⚠️ ELLE EST PAR ÉTAPE, PAS PAR TOUR. Une même visite traverse plusieurs
   * modules — la production parle des hausses puis des bons de livraison — et
   * un tour qui ne connaissait qu'UNE route ne pouvait pas les suivre.
   */
  route?: string;
  /** Fonctionnalité requise : l'étape est SAUTÉE si la formule ne l'inclut pas. */
  feature?: keyof PlanFeatures;
}

export interface Tutorial {
  id: string;
  name: string;
  route?: string;
  steps: TutorialStep[];
}

/**
 * Une phase devient une étape SI elle désigne un module.
 *
 * Une phase sans `ancre` est de la pédagogie pure — une notion, pas un écran.
 * On ne la transforme pas en étape : surligner un concept n'a pas de sens, et
 * une carte qui flotte sans rien montrer est exactement le défaut qu'on vient
 * de corriger sur le tour « Production ».
 */
function etapeDePhase(p: PhaseGuide): TutorialStep | null {
  if (!p.ancre) return null;
  return {
    id: p.id,
    target: `[data-tutorial="${p.ancre}"]`,
    title: p.titre,
    content: p.corps,
    position: 'right',
    route: p.route,
    feature: p.feature,
  };
}

/** Le nom affiché de chaque visite — la seule chose qui reste propre au tour. */
const NOMS: Record<ThemeGuide, string> = {
  'premiers-pas': "Découverte de l'interface",
  pilotage: 'Pilotage au quotidien',
  'ruchers-ruches': 'Ruchers & Ruches',
  interventions: 'Interventions',
  production: 'Production & traçabilité',
  finances: 'Finances & Facturation',
  transhumance: 'Transhumance',
  elevage: 'Élevage de reines',
  conformite: 'Conformité',
  equipe: 'Équipe',
};

/**
 * L'identifiant historique de chaque tour, tel que `guide.vue` le référence
 * dans son champ `tutorial`. Il diffère du thème pour « premiers-pas » — une
 * coquetterie d'origine (`premiers_pas`, avec un tiret bas) qu'on ne change pas
 * pour ne pas invalider les tours déjà vus par les apiculteurs.
 */
const IDS: Record<ThemeGuide, string> = {
  'premiers-pas': 'premiers_pas',
  pilotage: 'pilotage',
  'ruchers-ruches': 'ruchers',
  interventions: 'interventions',
  production: 'production',
  finances: 'finances',
  transhumance: 'transhumance',
  elevage: 'elevage',
  conformite: 'conformite',
  equipe: 'equipe',
};

function tourDuTheme(theme: ThemeGuide): Tutorial {
  const steps = PHASES_PAR_THEME[theme]
    .map(etapeDePhase)
    .filter((s): s is TutorialStep => s !== null);
  return {
    id: IDS[theme],
    name: NOMS[theme],
    route: steps[0]?.route,
    steps,
  };
}

export const ALL_TUTORIALS: Tutorial[] = (Object.keys(PHASES_PAR_THEME) as ThemeGuide[])
  .map(tourDuTheme)
  // Un tour sans étape ne se propose pas : le thème est de la pédagogie pure.
  .filter((t) => t.steps.length > 0);

/** Le tour d'un thème, par son identifiant historique. */
export function tutorielParId(id: string): Tutorial | undefined {
  return ALL_TUTORIALS.find((t) => t.id === id);
}
