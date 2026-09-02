// ═══════════════════════════════════════════════════════════════════════════
// LES CATÉGORIES DE DÉPENSE — une seule liste, pour les TROIS endroits qui la
// portaient.
//
// ⚠️ CE FICHIER NAÎT D'UNE TRIPLE RECOPIE, exactement le motif que ce dépôt
// paie le plus cher :
//
//   server/api/finances/achats.post.ts   l'énumération Zod (8 valeurs)
//   app/pages/finances/achats.vue:130    la liste des <option> (8 valeurs)
//   app/pages/finances/achats.vue:755    l'union TypeScript du `categorie`
//   app/pages/finances/achats.vue:804    la table des libellés affichés
//
// Quatre copies de la même liste, donc quatre occasions de diverger. Ajouter
// une neuvième catégorie demandait de toucher les quatre, et n'en oublier
// aucune : la Zod l'aurait refusée en base pendant que le menu la proposait,
// ou l'inverse — le menu ne l'aurait jamais offerte pendant que l'API
// l'acceptait.
//
// Comme `plans.ts` ou `maya-actions.ts`, ce fichier ne contient QUE des
// données : pas une fonction, pas un import de serveur. C'est ce qui lui
// permet d'être lu par le navigateur (le menu, les libellés) comme par Nitro
// (la validation, Maya).
// ═══════════════════════════════════════════════════════════════════════════

import { MEDICAMENTS_APICOLES } from '~/config/medicaments-apicoles';

export interface CategorieAchatMeta {
  /** Ce que l'apiculteur lit dans le menu et sur la ligne d'achat. */
  readonly libelle: string;
  /**
   * Les mots qui, DICTÉS à Maya, désignent cette catégorie. Déjà normalisés :
   * minuscules, sans accents (cf. `normaliser`), parce que c'est sous cette
   * forme que la phrase arrive.
   *
   * ⚠️ UNE LISTE VIDE EST UNE DÉCLARATION, PAS UN OUBLI : « autre » est le
   * fourre-tout du formulaire, et Maya ne doit jamais l'attribuer d'office —
   * une dépense qu'elle ne sait pas classer reste NON catégorisée, ce que
   * l'apiculteur voit et corrige. Ranger d'autorité dans « autre » aurait
   * l'air d'un classement alors que c'est un aveu d'ignorance.
   */
  readonly mots: readonly string[];
}

/**
 * ⚠️ L'ORDRE COMPTE : c'est celui de la RECONNAISSANCE, du plus spécifique au
 * plus général. « j'ai acheté 200 € de pots » doit tomber sur EMBALLAGE, et
 * pas sur MATÉRIEL parce qu'un pot est aussi du matériel. Le matériel ferme
 * donc la marche, juste avant « autre » qui ne se reconnaît à rien.
 */
export const CATEGORIES_ACHAT = {
  traitement: {
    libelle: 'Traitement',
    /**
     * Les noms de spécialités NE SONT PAS RECOPIÉS : ils viennent de
     * `MEDICAMENTS_APICOLES`, le référentiel qui sert déjà au registre
     * d'élevage et au geste varroa de Maya. Un médicament ajouté là-bas devient
     * automatiquement une dépense de traitement ici.
     */
    mots: [
      // Même normalisation que `normaliser` côté serveur : minuscules, sans
      // accents. Réécrite ici plutôt qu'importée, parce que ce fichier ne doit
      // RIEN importer du serveur — c'est ce qui le rend lisible des deux côtés.
      ...MEDICAMENTS_APICOLES.map((m) =>
        m.nom
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      ),
      'traitement',
      'traitements',
      'varroa',
      'varroas',
      'acide oxalique',
      'acide formique',
      'lanieres',
      'laniere',
      'bandelettes',
      'medicament',
      'medicaments',
    ],
  },
  nourrissement: {
    libelle: 'Nourrissement',
    mots: [
      'candi',
      'sirop',
      'sirops',
      'nourrissement',
      'nourriture',
      'sucre',
      'fondant',
      'pollen',
      'proteine',
      'proteines',
    ],
  },
  emballage: {
    libelle: 'Emballage',
    mots: [
      'pot',
      'pots',
      'bocal',
      'bocaux',
      'couvercle',
      'couvercles',
      'capsule',
      'capsules',
      'etiquette',
      'etiquettes',
      'carton',
      'cartons',
      'seau',
      'seaux',
      'fut',
      'futs',
      'emballage',
      'emballages',
    ],
  },
  transport: {
    libelle: 'Transport',
    mots: [
      'carburant',
      'essence',
      'gazole',
      'gasoil',
      'diesel',
      'peage',
      'peages',
      'transport',
      'camionnette',
      'remorque',
      'livraison',
    ],
  },
  assurance: {
    libelle: 'Assurance',
    mots: ['assurance', 'assurances', 'mutuelle', 'responsabilite civile'],
  },
  formation: {
    libelle: 'Formation',
    mots: ['formation', 'formations', 'stage', 'stages', 'rucher ecole'],
  },
  materiel: {
    libelle: 'Matériel',
    mots: [
      'ruche',
      'ruches',
      'ruchette',
      'ruchettes',
      'hausse',
      'hausses',
      'cadre',
      'cadres',
      'cire',
      'cire gaufree',
      'enfumoir',
      'leve cadre',
      'combinaison',
      'vareuse',
      'gants',
      'grille a reine',
      'plancher',
      'planchers',
      'nourrisseur',
      'nourrisseurs',
      'extracteur',
      'maturateur',
      'refractometre',
      'materiel',
    ],
  },
  autre: {
    libelle: 'Autre',
    // Vide À DESSEIN — voir `CategorieAchatMeta.mots`.
    mots: [],
  },
} as const satisfies Record<string, CategorieAchatMeta>;

/** L'identifiant d'une catégorie de dépense — DÉRIVÉ, jamais réécrit. */
export type CategorieAchat = keyof typeof CATEGORIES_ACHAT;

/** Toutes les catégories, dans l'ordre de reconnaissance ET d'affichage. */
export const CATEGORIES_ACHAT_IDS = Object.keys(CATEGORIES_ACHAT) as CategorieAchat[];

/** Le libellé de chaque catégorie — dérivé, pour le menu et les listes. */
export const LIBELLE_CATEGORIE_ACHAT = Object.fromEntries(
  CATEGORIES_ACHAT_IDS.map((id) => [id, CATEGORIES_ACHAT[id].libelle]),
) as Record<CategorieAchat, string>;
