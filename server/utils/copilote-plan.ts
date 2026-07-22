import type {
  ActionId,
  InterventionParsee,
  TypeIntervention,
  RucheRef,
} from '~~/server/utils/copilote-actions';
import type { CibleRuches } from '~~/server/utils/copilote-cibles';
import { libelleCible } from '~~/server/utils/copilote-cibles';

/**
 * Modèle de PLAN d'exécution de Maya — la couche d'orchestration qui transforme
 * une commande en une SÉQUENCE d'étapes atomiques, sans LLM. Ici : le fan-out en
 * LOT (une même intervention appliquée à N ruches). 100 % pur et testable : la
 * construction ne touche pas la base ; l'exécution transactionnelle vit dans
 * copilote-executeur. Réutilise les primitives d'écriture (executerAction*) via
 * les params de chaque étape.
 */

/** Domaine RBAC d'une étape (contrôle des rôles côté route, par étape). */
export type EtapeDomaine = 'terrain' | 'commerce';

/** Une étape atomique du plan : une action d'écriture prête à exécuter. */
export interface EtapePlan {
  /** Id stable dans le plan (« e1 », « e2 »…) — sert au journal/undo. */
  id: string;
  actionId: ActionId;
  domaine: EtapeDomaine;
  /** Libellé lisible (« Ruche 7 · Rucher Nord »). */
  libelle: string;
  /** Paramètres passés tels quels à executerAction (re-validés Zod côté serveur). */
  params: Record<string, unknown>;
}

/** Bloc riche « plan » affiché sous la réponse (aperçu consolidé + étapes). */
export interface BlocPlan {
  type: 'plan';
  titre: string;
  resume: string[];
  etapes: { libelle: string; detail?: string }[];
}

/** Un plan d'exécution complet : LOT (fan-out) ou SÉQUENCE (étapes hétérogènes ordonnées). */
export interface PlanMaya {
  type: 'lot' | 'sequence';
  titre: string;
  /** Lignes d'aperçu consolidé (« 6 ruches · Contrôle · force 3, calme »). */
  resume: string[];
  etapes: EtapePlan[];
}

/** Une étape déjà résolue (params prêts + libellé) pour une séquence composée. */
export interface EtapeResolue {
  actionId: ActionId;
  domaine: EtapeDomaine;
  /** Libellé lisible de l'étape (souvent la clause d'origine). */
  libelle: string;
  params: Record<string, unknown>;
}

const LABEL_TYPE: Record<TypeIntervention, string> = {
  controle: 'Contrôle',
  commentaire: 'Note',
  nourrissement: 'Nourrissement',
  recolte: 'Récolte',
  pesee: 'Pesée',
  varroa: 'Comptage varroa',
};

/** Libellé d'affichage d'une ruche (mêmes règles que copilote-actions). */
function libelleRuche(numero: string): string {
  const num = numero.trim();
  return /^\d/.test(num) ? `Ruche ${num}` : num;
}

const oui = (v: unknown): string => (v === true ? 'oui' : v === false ? 'non' : '—');

/**
 * Résumé compact et lisible des données partagées d'une intervention (ce qui sera
 * appliqué À TOUTES les ruches ciblées). Sert au récap du plan avant confirmation.
 */
export function resumeDonneesIntervention(t: InterventionParsee): string[] {
  const d = t.donnees as Record<string, unknown>;
  const lignes: string[] = [];
  switch (t.type) {
    case 'controle': {
      if ('reineVue' in d) lignes.push(`Reine vue : ${oui(d.reineVue)}`);
      if ('couvainPresent' in d) lignes.push(`Couvain : ${oui(d.couvainPresent)}`);
      if ('reserves' in d) lignes.push(`Réserves : ${oui(d.reserves)}`);
      if ('forceColonie' in d) lignes.push(`Force : ${String(d.forceColonie)}`);
      if ('comportement' in d) lignes.push(`Comportement : ${String(d.comportement)}`);
      break;
    }
    case 'nourrissement': {
      const parts: string[] = [];
      if (d.type) parts.push(String(d.type).replace(/_/g, ' '));
      if (d.quantite != null) parts.push(`${String(d.quantite)} ${String(d.unite ?? '')}`.trim());
      if (parts.length) lignes.push(`${parts.join(' · ')}`);
      break;
    }
    case 'recolte':
      if (d.typeProduit) lignes.push(`Produit : ${String(d.typeProduit)}`);
      break;
    case 'pesee':
      if (d.poidsKg != null) lignes.push(`Poids : ${String(d.poidsKg)} kg`);
      break;
    case 'varroa':
      if (d.nombreVarroas != null)
        lignes.push(`Varroas : ${String(d.nombreVarroas)} sur ${String(d.dureeJours ?? 3)} j`);
      break;
    case 'commentaire':
      if (d.texte) lignes.push(`« ${String(d.texte)} »`);
      break;
  }
  if (t.commentaire && t.type !== 'commentaire') lignes.push(`Note : ${t.commentaire}`);
  return lignes;
}

/**
 * Construit un plan de LOT : la même intervention (`template`, dé-ciblée de sa
 * ruche) est fan-out sur chaque ruche résolue. Les paramètres partagés (type +
 * données) sont figés UNE fois et copiés sur chaque étape. Pur.
 */
export function construirePlanLot(
  template: InterventionParsee,
  ruches: RucheRef[],
  cible: CibleRuches,
): PlanMaya {
  const donneesPartagees =
    template.type === 'commentaire'
      ? { texte: (template.donnees as { texte?: string }).texte ?? '' }
      : template.donnees;

  const etapes: EtapePlan[] = ruches.map((r, i) => {
    const params: Record<string, unknown> = {
      rucheId: r.id,
      rucherId: r.rucherId,
      type: template.type,
      donnees: donneesPartagees,
    };
    if (template.commentaire) params.commentaire = template.commentaire;
    return {
      id: `e${i + 1}`,
      actionId: 'intervention' as ActionId,
      domaine: 'terrain' as EtapeDomaine,
      libelle: `${libelleRuche(r.numero)} · ${r.rucherNom}`,
      params,
    };
  });

  const resume = [
    `${ruches.length} ${ruches.length > 1 ? 'ruches' : 'ruche'} — ${libelleCible(cible)}`,
    `Type : ${LABEL_TYPE[template.type]}`,
    ...resumeDonneesIntervention(template),
  ];

  return {
    type: 'lot',
    titre: `${LABEL_TYPE[template.type]} sur ${ruches.length} ${ruches.length > 1 ? 'ruches' : 'ruche'}`,
    resume,
    etapes,
  };
}

/**
 * Construit un plan de SÉQUENCE composée : des étapes hétérogènes déjà résolues
 * (client, récolte, intervention, stock…) exécutées DANS L'ORDRE, en une seule
 * transaction avec confirmation unique. Pur.
 */
export function construirePlanSequence(etapes: EtapeResolue[]): PlanMaya {
  return {
    type: 'sequence',
    titre: `${etapes.length} ${etapes.length > 1 ? 'actions enchaînées' : 'action'}`,
    resume: etapes.map((e, i) => `${i + 1}. ${e.libelle}`),
    etapes: etapes.map((e, i) => ({
      id: `e${i + 1}`,
      actionId: e.actionId,
      domaine: e.domaine,
      libelle: e.libelle,
      params: e.params,
    })),
  };
}

/** Transforme un plan en bloc riche « plan » (aperçu consolidé pour l'UI). */
export function planEnBloc(plan: PlanMaya): BlocPlan {
  return {
    type: 'plan',
    titre: plan.titre,
    resume: plan.resume,
    etapes: plan.etapes.map((e) => ({ libelle: e.libelle })),
  };
}
