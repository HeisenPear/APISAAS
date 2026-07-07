// Analyse du rayon de butinage (~3 km) : on échantillonne des points, on classe
// chacun via l'occupation du sol IGN — 3 sources complémentaires :
//   1. RPG (parcelles agricoles, Ministère Agriculture/PAC) → culture précise.
//   2. BD Forêt (IGN) → essence forestière → miel probable.
//   3. CORINE Land Cover CLC18 → couvre TOUT le reste (urbain, landes, garrigue,
//      prairies naturelles, zones humides, eau…), évitant les « trous » à 0.
// Puis on agrège en composition (% par ressource) + potentiel mellifère.
// Fonctions pures (le fetch IGN reste dans la route).

export type Categorie = 'foret' | 'culture' | 'prairie' | 'lande' | 'verger' | 'urbain' | 'autre';

export interface EchantillonClasse {
  categorie: Categorie;
  label: string;
  /** Valeur mellifère 0-1 (apport nectar/pollen de cette occupation du sol). */
  mellifere: number;
  /** Type de miel probable produit par cette ressource (clé référentiel), si net. */
  miel?: string | null;
}

export interface RessourceButinage {
  label: string;
  pct: number;
  mellifere: boolean;
  categorie: Categorie;
}
export interface MielProbable {
  typeMiel: string;
  pct: number;
}
export interface ResultatButinage {
  nbEchantillons: number;
  potentiel: number; // 0-100
  potentielLabel: 'faible' | 'moyen' | 'bon' | 'excellent';
  ressources: RessourceButinage[];
  /** Miels probables déduits de l'occupation du sol réelle (≠ zones curées). */
  mielsProbables: MielProbable[];
}

export const AUTRE: EchantillonClasse = {
  categorie: 'autre',
  label: 'Non déterminé',
  mellifere: 0.25,
};

/** Groupes de cultures RPG (code_group) → catégorie, valeur mellifère, libellé. */
const GROUPES_RPG: Record<string, EchantillonClasse> = {
  '1': { categorie: 'culture', label: 'Céréales', mellifere: 0.15 },
  '2': { categorie: 'culture', label: 'Maïs', mellifere: 0.12 },
  '3': { categorie: 'culture', label: 'Céréales', mellifere: 0.15 },
  '4': { categorie: 'culture', label: 'Céréales', mellifere: 0.15 },
  '5': { categorie: 'culture', label: 'Colza', mellifere: 1, miel: 'colza' },
  '6': { categorie: 'culture', label: 'Tournesol', mellifere: 1, miel: 'tournesol' },
  '7': { categorie: 'culture', label: 'Oléagineux', mellifere: 0.6 },
  '8': { categorie: 'culture', label: 'Protéagineux', mellifere: 0.5 },
  '14': { categorie: 'culture', label: 'Riz', mellifere: 0.1 },
  '15': { categorie: 'culture', label: 'Légumineuses', mellifere: 0.65 },
  '16': { categorie: 'prairie', label: 'Prairies de fauche', mellifere: 0.6 },
  '17': { categorie: 'lande', label: 'Estives et landes', mellifere: 0.85, miel: 'bruyère' },
  '18': { categorie: 'prairie', label: 'Prairies permanentes', mellifere: 0.7 },
  '19': { categorie: 'prairie', label: 'Prairies temporaires', mellifere: 0.55 },
  '20': { categorie: 'verger', label: 'Vergers', mellifere: 0.75 },
  '21': { categorie: 'culture', label: 'Vignes', mellifere: 0.1 },
  '22': { categorie: 'verger', label: 'Fruits à coque', mellifere: 0.65, miel: 'châtaignier' },
  '23': { categorie: 'culture', label: 'Oliviers', mellifere: 0.15 },
  '24': {
    categorie: 'culture',
    label: 'Cultures industrielles (PPAM)',
    mellifere: 0.9,
    miel: 'lavande',
  },
  '25': { categorie: 'culture', label: 'Légumes et fleurs', mellifere: 0.6 },
};

export function classifierCulture(codeGroup?: string | null): EchantillonClasse {
  if (codeGroup && GROUPES_RPG[codeGroup]) return GROUPES_RPG[codeGroup];
  return { categorie: 'culture', label: 'Cultures', mellifere: 0.3 };
}

/** Déduit le miel probable depuis l'essence forestière (BD Forêt). */
function mielEssence(essence?: string | null): string | null {
  const e = (essence ?? '').toLowerCase();
  if (e.includes('châtaign') || e.includes('chataign')) return 'châtaignier';
  if (e.includes('robinier') || e.includes('acacia')) return 'acacia';
  if (e.includes('tilleul')) return 'tilleul';
  if (e.includes('sapin') || e.includes('épicéa') || e.includes('epicea')) return 'sapin';
  return null;
}

export function classifierForet(
  tfvG11?: string | null,
  essence?: string | null,
): EchantillonClasse {
  const t = (tfvG11 ?? '').toLowerCase();
  const miel = mielEssence(essence);
  if (t.includes('conif')) {
    return {
      categorie: 'foret',
      label: 'Forêt de conifères',
      mellifere: 0.5,
      miel: miel ?? 'sapin',
    };
  }
  if (t.includes('feuillu')) {
    return { categorie: 'foret', label: 'Forêt de feuillus', mellifere: 0.75, miel };
  }
  if (t.includes('mixte') || t.includes('mélange') || t.includes('melange')) {
    return { categorie: 'foret', label: 'Forêt mixte', mellifere: 0.62, miel };
  }
  return { categorie: 'foret', label: 'Forêt', mellifere: 0.62, miel };
}

/** Classes CORINE Land Cover (code_18) → occupation du sol et valeur mellifère. */
const CLC: Record<string, EchantillonClasse> = {
  '111': { categorie: 'urbain', label: 'Zone urbaine dense', mellifere: 0.1 },
  '112': { categorie: 'urbain', label: 'Zone urbaine', mellifere: 0.2 },
  '121': { categorie: 'urbain', label: 'Zone d’activités', mellifere: 0.12 },
  '141': { categorie: 'urbain', label: 'Parcs et jardins', mellifere: 0.4 },
  '142': { categorie: 'urbain', label: 'Zone de loisirs', mellifere: 0.25 },
  '211': { categorie: 'culture', label: 'Terres arables', mellifere: 0.25 },
  '221': { categorie: 'culture', label: 'Vignes', mellifere: 0.1 },
  '222': { categorie: 'verger', label: 'Vergers', mellifere: 0.65 },
  '223': { categorie: 'culture', label: 'Oliveraies', mellifere: 0.15 },
  '231': { categorie: 'prairie', label: 'Prairies', mellifere: 0.65 },
  '241': { categorie: 'culture', label: 'Cultures mixtes', mellifere: 0.4 },
  '242': { categorie: 'prairie', label: 'Mosaïque agricole', mellifere: 0.5 },
  '243': { categorie: 'prairie', label: 'Agriculture et nature', mellifere: 0.55 },
  '244': { categorie: 'foret', label: 'Agroforesterie', mellifere: 0.6 },
  '311': { categorie: 'foret', label: 'Forêt de feuillus', mellifere: 0.72 },
  '312': { categorie: 'foret', label: 'Forêt de conifères', mellifere: 0.5, miel: 'sapin' },
  '313': { categorie: 'foret', label: 'Forêt mixte', mellifere: 0.6 },
  '321': { categorie: 'prairie', label: 'Pelouses naturelles', mellifere: 0.7 },
  '322': { categorie: 'lande', label: 'Landes et broussailles', mellifere: 0.8, miel: 'bruyère' },
  '323': { categorie: 'lande', label: 'Garrigue / maquis', mellifere: 0.72, miel: 'thym' },
  '324': { categorie: 'foret', label: 'Végétation arbustive', mellifere: 0.62 },
  '331': { categorie: 'autre', label: 'Dunes et plages', mellifere: 0.2 },
  '332': { categorie: 'autre', label: 'Roches nues', mellifere: 0.02 },
  '333': { categorie: 'lande', label: 'Végétation clairsemée', mellifere: 0.35 },
  '334': { categorie: 'autre', label: 'Zone incendiée', mellifere: 0.25 },
  '335': { categorie: 'autre', label: 'Glaciers et neiges', mellifere: 0 },
  '411': { categorie: 'autre', label: 'Marais intérieurs', mellifere: 0.45 },
  '412': { categorie: 'autre', label: 'Tourbières', mellifere: 0.45 },
  '421': { categorie: 'autre', label: 'Marais maritimes', mellifere: 0.3 },
  '422': { categorie: 'autre', label: 'Marais salants', mellifere: 0.1 },
  '423': { categorie: 'autre', label: 'Estran', mellifere: 0.05 },
  '511': { categorie: 'autre', label: 'Cours d’eau', mellifere: 0 },
  '512': { categorie: 'autre', label: 'Plans d’eau', mellifere: 0 },
  '521': { categorie: 'autre', label: 'Lagunes', mellifere: 0 },
  '522': { categorie: 'autre', label: 'Estuaires', mellifere: 0 },
  '523': { categorie: 'autre', label: 'Mer', mellifere: 0 },
};

export function classifierCorine(code18?: string | null): EchantillonClasse {
  if (code18 && CLC[code18]) return CLC[code18];
  // Codes 122-133, 212-213, 244… non listés : valeur naturelle prudente.
  const c = code18 ?? '';
  if (c.startsWith('1'))
    return { categorie: 'urbain', label: 'Zone artificialisée', mellifere: 0.15 };
  if (c.startsWith('2')) return { categorie: 'culture', label: 'Zone agricole', mellifere: 0.35 };
  if (c.startsWith('3')) return { categorie: 'lande', label: 'Espace naturel', mellifere: 0.55 };
  if (c.startsWith('4') || c.startsWith('5'))
    return { categorie: 'autre', label: 'Zone humide / eau', mellifere: 0.2 };
  return AUTRE;
}

/** Points d'échantillonnage : centre + 2 anneaux. ~13 points dans le rayon. */
export function genererEchantillons(
  lat: number,
  lng: number,
  rayonM = 3000,
): Array<{ lat: number; lng: number }> {
  const pts = [{ lat, lng }];
  const dLatM = 1 / 111320;
  const dLngM = 1 / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  const anneaux = [
    { frac: 0.5, n: 6 },
    { frac: 1, n: 6 },
  ];
  for (const a of anneaux) {
    const dist = a.frac * rayonM;
    for (let i = 0; i < a.n; i++) {
      const ang = (2 * Math.PI * i) / a.n;
      pts.push({
        lat: lat + dist * Math.cos(ang) * dLatM,
        lng: lng + dist * Math.sin(ang) * dLngM,
      });
    }
  }
  return pts;
}

const SEUIL_MELLIFERE = 0.45;

/**
 * Agrège les échantillons en ressources (%) + potentiel mellifère.
 * Le potentiel mêle la COUVERTURE globale (moyenne) et la qualité de la MEILLEURE
 * ressource disponible (moyenne de la moitié haute) : les abeilles exploitent les
 * bons massifs même au sein d'un paysage mixte, donc un paysage diversifié avec de
 * belles ressources n'est pas pénalisé par les parcelles pauvres.
 */
export function agregerButinage(classes: EchantillonClasse[]): ResultatButinage {
  const n = classes.length || 1;
  const parLabel = new Map<string, { count: number; mellifere: number; categorie: Categorie }>();
  const parMiel = new Map<string, number>();
  for (const c of classes) {
    const e = parLabel.get(c.label);
    if (e) e.count++;
    else parLabel.set(c.label, { count: 1, mellifere: c.mellifere, categorie: c.categorie });
    if (c.miel) parMiel.set(c.miel, (parMiel.get(c.miel) ?? 0) + 1);
  }
  const ressources: RessourceButinage[] = [...parLabel.entries()]
    .map(([label, v]) => ({
      label,
      pct: Math.round((v.count / n) * 100),
      mellifere: v.mellifere >= SEUIL_MELLIFERE,
      categorie: v.categorie,
    }))
    .sort((a, b) => b.pct - a.pct);

  const mielsProbables: MielProbable[] = [...parMiel.entries()]
    .map(([typeMiel, count]) => ({ typeMiel, pct: Math.round((count / n) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  const vals = classes.map((c) => c.mellifere).sort((a, b) => b - a);
  const mean = vals.reduce((s, v) => s + v, 0) / n;
  const half = Math.max(1, Math.ceil(n / 2));
  const meanTop = vals.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const potentiel = Math.round(100 * (0.6 * mean + 0.4 * meanTop));
  const potentielLabel =
    potentiel >= 70 ? 'excellent' : potentiel >= 50 ? 'bon' : potentiel >= 30 ? 'moyen' : 'faible';

  return { nbEchantillons: classes.length, potentiel, potentielLabel, ressources, mielsProbables };
}
