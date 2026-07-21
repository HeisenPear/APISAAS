/**
 * Configuration partagée des balances connectées.
 * Source unique des libellés, couleurs, seuils et formatages : la liste, la
 * fiche, la carte compacte et le formulaire de création lisent tous ici
 * (même patron que `~/config/floraisons` et `~/config/frelon`).
 *
 * ⚠️ Palette 100 % chaude — aucun vert nulle part. Un gain de poids est MIEL,
 * une perte est ARGILE. C'est une décision produit, pas un choix esthétique.
 */

export type SourceBalance = 'webhook' | 'beep' | 'csv' | 'manuelle';
export type StatutBalance = 'active' | 'inactive' | 'maintenance';
export type PeriodeBalance = '24h' | '7j' | '30j' | 'saison';

export interface SourceMeta {
  value: SourceBalance;
  label: string;
  /** Une ligne, sans enjoliver : ce que ça vaut vraiment. */
  resume: string;
  /** Le détail honnête, affiché au moment du choix. */
  description: string;
  icon: string;
  couleur: string;
  /** Les mesures arrivent-elles seules, en continu ? */
  tempsReel: boolean;
  /** Marques concernées, quand c'est ça le critère de décision. */
  marques?: string;
}

/**
 * Ordonné par « ce qui marche le mieux » d'abord.
 * Une seule balance du marché expose une API publique (BEEP, open source) ;
 * les marques françaises gardent leurs données dans un cloud fermé. On le dit.
 */
export const SOURCES: SourceMeta[] = [
  {
    value: 'webhook',
    label: 'Webhook (universel)',
    resume: 'Marche avec tout capteur capable d’envoyer une requête HTTP.',
    description:
      'On vous donne une URL et un jeton secret. Votre capteur poste ses mesures dessus — passerelle TTN/LoRaWAN, Raspberry maison, ou toute marque qui sait faire un appel HTTP. C’est la voie la plus ouverte, et elle est en temps réel.',
    icon: 'i-lucide-webhook',
    couleur: 'var(--honey)',
    tempsReel: true,
  },
  {
    value: 'beep',
    label: 'BEEP',
    resume: 'Temps réel, gratuit, open source — la seule API publique du marché.',
    description:
      'BEEP (api.beep.nl) est aujourd’hui la seule balance apicole à exposer une API publique. Vous collez votre jeton BEEP une fois, APIGO va chercher les mesures tout seul.',
    icon: 'i-lucide-radio',
    couleur: 'var(--sage)',
    tempsReel: true,
  },
  {
    value: 'csv',
    label: 'Import de fichier',
    resume: 'Pour les marques à cloud fermé. Pas de temps réel, mais l’historique est repris.',
    description:
      'Ces fabricants gardent les mesures dans leur propre espace et n’ouvrent pas d’API. Exportez le fichier depuis chez eux, déposez-le ici : tout l’historique est intégré aux courbes. Il faudra recommencer à chaque fois que vous voudrez les données à jour.',
    icon: 'i-lucide-file-spreadsheet',
    couleur: 'var(--clay)',
    tempsReel: false,
    marques: 'Optibee, Bee2Beep, Label Abeille, API&CO, Capaz',
  },
  {
    value: 'manuelle',
    label: 'Pesée manuelle',
    resume: 'Sans capteur : vous pesez au peson, vous notez.',
    description:
      'Aucun matériel connecté. Vous saisissez la pesée à la main lors de vos visites — utile pour suivre une ruche témoin sans investir dans une balance.',
    icon: 'i-lucide-hand',
    couleur: 'var(--text-tertiary)',
    tempsReel: false,
  },
];

const PAR_SOURCE = new Map(SOURCES.map((s) => [s.value, s]));

export function sourceMeta(source: SourceBalance): SourceMeta {
  return PAR_SOURCE.get(source) ?? SOURCES[0]!;
}

export interface StatutMeta {
  value: StatutBalance;
  label: string;
  couleur: string;
  fond: string;
}

export const STATUTS: StatutMeta[] = [
  { value: 'active', label: 'En service', couleur: 'var(--honey-deep)', fond: 'var(--honey-soft)' },
  {
    value: 'maintenance',
    label: 'Maintenance',
    couleur: 'var(--clay-deep)',
    fond: 'var(--clay-soft)',
  },
  {
    value: 'inactive',
    label: 'Hors service',
    couleur: 'var(--text-tertiary)',
    fond: 'var(--surface-muted)',
  },
];

const PAR_STATUT = new Map(STATUTS.map((s) => [s.value, s]));

export function statutMeta(statut: StatutBalance): StatutMeta {
  return PAR_STATUT.get(statut) ?? STATUTS[0]!;
}

export interface PeriodeMeta {
  value: PeriodeBalance;
  label: string;
  /** Sert au libellé des stats de miellée (« sur les 7 derniers jours »). */
  intitule: string;
}

export const PERIODES: PeriodeMeta[] = [
  { value: '24h', label: '24 h', intitule: 'sur les dernières 24 h' },
  { value: '7j', label: '7 jours', intitule: 'sur les 7 derniers jours' },
  { value: '30j', label: '30 jours', intitule: 'sur les 30 derniers jours' },
  { value: 'saison', label: 'Saison', intitule: 'sur la saison' },
];

/**
 * Valeurs par défaut des seuils d'alerte, alignées sur le service.
 * `null` en base = « utilise celle-ci » — on l'affiche donc en placeholder.
 */
export const SEUILS_DEFAUT = {
  variationKg: 2,
  poidsRecolteKg: 20,
  batteriePct: 20,
  silenceHeures: 12,
} as const;

/** Une variation en dessous de ce bruit n'est pas une information. */
const BRUIT_KG = 0.05;

/**
 * Les colonnes `decimal` de Drizzle arrivent en STRING. Point de passage
 * OBLIGATOIRE avant tout calcul ou affichage d'une valeur de mesure.
 */
export function nombre(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatPoids(kg: number | null, digits = 1): string {
  if (kg === null) return '—';
  return `${kg.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} kg`;
}

/** Toujours signé : c'est le signe qui porte l'information, pas la valeur. */
export function formatVariation(kg: number | null, digits = 1): string {
  if (kg === null) return '—';
  const abs = Math.abs(kg).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (kg > BRUIT_KG) return `+${abs} kg`;
  if (kg < -BRUIT_KG) return `−${abs} kg`;
  return `${abs} kg`;
}

/** Miel = ça rentre. Argile = ça part. Jamais de vert. */
export function couleurVariation(kg: number | null): string {
  if (kg === null) return 'var(--text-tertiary)';
  if (kg > BRUIT_KG) return 'var(--honey-deep)';
  if (kg < -BRUIT_KG) return 'var(--clay)';
  return 'var(--text-tertiary)';
}

export function iconeVariation(kg: number | null): string {
  if (kg === null) return 'i-lucide-minus';
  if (kg > BRUIT_KG) return 'i-lucide-trending-up';
  if (kg < -BRUIT_KG) return 'i-lucide-trending-down';
  return 'i-lucide-minus';
}

export function couleurBatterie(
  pct: number | null,
  seuil: number = SEUILS_DEFAUT.batteriePct,
): string {
  if (pct === null) return 'var(--text-tertiary)';
  if (pct <= seuil) return 'var(--status-bad)';
  if (pct <= seuil * 2) return 'var(--status-warn)';
  return 'var(--text-secondary)';
}

export function iconeBatterie(pct: number | null): string {
  if (pct === null) return 'i-lucide-battery';
  if (pct <= 20) return 'i-lucide-battery-low';
  if (pct <= 60) return 'i-lucide-battery-medium';
  return 'i-lucide-battery-full';
}

export interface Fraicheur {
  /** « il y a 12 min », « il y a 3 h », « jamais » */
  label: string;
  heures: number | null;
  /** Le capteur n'a plus donné signe de vie depuis trop longtemps. */
  muette: boolean;
}

/**
 * Fraîcheur de la dernière mesure. `maintenant` est injectable pour que les
 * composants puissent faire battre l'affichage à la minute sans recalcul global.
 */
export function fraicheur(
  derniereMesureAt: string | null | undefined,
  seuilSilenceHeures: number | null = null,
  maintenant: number = Date.now(),
): Fraicheur {
  const seuil = seuilSilenceHeures ?? SEUILS_DEFAUT.silenceHeures;
  if (!derniereMesureAt) return { label: 'aucune mesure', heures: null, muette: true };

  const ts = new Date(derniereMesureAt).getTime();
  if (!Number.isFinite(ts)) return { label: 'aucune mesure', heures: null, muette: true };

  const minutes = Math.max(0, Math.round((maintenant - ts) / 60000));
  const heures = minutes / 60;
  const muette = heures > seuil;

  if (minutes < 1) return { label: 'à l’instant', heures, muette };
  if (minutes < 60) return { label: `il y a ${minutes} min`, heures, muette };
  if (heures < 48) return { label: `il y a ${Math.round(heures)} h`, heures, muette };
  return { label: `il y a ${Math.round(heures / 24)} j`, heures, muette };
}

/** Étiquette de l'axe X des courbes — dépend de l'échelle de temps affichée. */
export function labelTemps(iso: string, periode: PeriodeBalance): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (periode === '24h') {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (periode === '7j') {
    return d.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
