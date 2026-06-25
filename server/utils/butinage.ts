// Analyse du rayon de butinage : on échantillonne des points autour d'un lieu,
// on classe chacun via l'occupation du sol IGN (RPG cultures + BD Forêt), puis on
// agrège en composition (% par ressource) et potentiel mellifère. Fonctions pures
// (le fetch IGN reste dans la route). Le butinage des abeilles porte sur ~3 km.

export type Categorie = 'foret' | 'culture' | 'prairie' | 'lande' | 'verger' | 'autre';

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
  label: 'Zone peu mellifère',
  mellifere: 0,
};

/** Groupes de cultures RPG (code_group) → catégorie, valeur mellifère, libellé. */
const GROUPES_RPG: Record<string, EchantillonClasse> = {
  '1': { categorie: 'culture', label: 'Céréales', mellifere: 0.1 },
  '2': { categorie: 'culture', label: 'Maïs', mellifere: 0.1 },
  '3': { categorie: 'culture', label: 'Céréales', mellifere: 0.1 },
  '4': { categorie: 'culture', label: 'Céréales', mellifere: 0.1 },
  '5': { categorie: 'culture', label: 'Colza', mellifere: 1, miel: 'colza' },
  '6': { categorie: 'culture', label: 'Tournesol', mellifere: 1, miel: 'tournesol' },
  '7': { categorie: 'culture', label: 'Oléagineux', mellifere: 0.5 },
  '8': { categorie: 'culture', label: 'Protéagineux', mellifere: 0.4 },
  '14': { categorie: 'culture', label: 'Riz', mellifere: 0.1 },
  '15': { categorie: 'culture', label: 'Légumineuses', mellifere: 0.5 },
  '16': { categorie: 'prairie', label: 'Fourrage', mellifere: 0.5 },
  '17': { categorie: 'lande', label: 'Estives et landes', mellifere: 0.8, miel: 'bruyère' },
  '18': { categorie: 'prairie', label: 'Prairies permanentes', mellifere: 0.5 },
  '19': { categorie: 'prairie', label: 'Prairies temporaires', mellifere: 0.5 },
  '20': { categorie: 'verger', label: 'Vergers', mellifere: 0.7 },
  '21': { categorie: 'culture', label: 'Vignes', mellifere: 0.05 },
  '22': { categorie: 'verger', label: 'Fruits à coque', mellifere: 0.5, miel: 'châtaignier' },
  '23': { categorie: 'culture', label: 'Oliviers', mellifere: 0.1 },
  '24': {
    categorie: 'culture',
    label: 'Cultures industrielles (PPAM)',
    mellifere: 0.8,
    miel: 'lavande',
  },
  '25': { categorie: 'culture', label: 'Légumes et fleurs', mellifere: 0.6 },
};

export function classifierCulture(codeGroup?: string | null): EchantillonClasse {
  if (codeGroup && GROUPES_RPG[codeGroup]) return GROUPES_RPG[codeGroup];
  return { categorie: 'culture', label: 'Culture', mellifere: 0.2 };
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
      mellifere: 0.4,
      miel: miel ?? 'sapin',
    };
  }
  if (t.includes('feuillu')) {
    return { categorie: 'foret', label: 'Forêt de feuillus', mellifere: 0.7, miel };
  }
  if (t.includes('mixte') || t.includes('mélange') || t.includes('melange')) {
    return { categorie: 'foret', label: 'Forêt mixte', mellifere: 0.55, miel };
  }
  return { categorie: 'foret', label: 'Forêt', mellifere: 0.6, miel };
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

const SEUIL_MELLIFERE = 0.4;

/** Agrège les échantillons classés en ressources (%) + potentiel mellifère global. */
export function agregerButinage(classes: EchantillonClasse[]): ResultatButinage {
  const n = classes.length || 1;
  const parLabel = new Map<string, { count: number; mellifere: number; categorie: Categorie }>();
  const parMiel = new Map<string, number>();
  let sommeMellifere = 0;
  for (const c of classes) {
    sommeMellifere += c.mellifere;
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

  const potentiel = Math.round((sommeMellifere / n) * 100);
  const potentielLabel =
    potentiel >= 70 ? 'excellent' : potentiel >= 50 ? 'bon' : potentiel >= 30 ? 'moyen' : 'faible';

  return { nbEchantillons: classes.length, potentiel, potentielLabel, ressources, mielsProbables };
}
