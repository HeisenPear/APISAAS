// ═══════════════════════════════════════════════════════════════════════════
// Dashboard configurable façon ÉCRAN D'ACCUEIL — disposition en COLONNES.
//
// La disposition est un tableau de colonnes d'ids (`string[][]`). Chaque widget
// vit dans UNE colonne, à une position libre → on peut poser n'importe quel bloc
// n'importe où (ex. « Production sous Alertes »), indépendamment de l'ordre des
// autres, comme sur l'écran d'accueil d'un iPhone.
//
// Disponibilité = autoritaire (plan, widgets.ts). Disposition = préférence locale
// (localStorage, par appareil) → zéro route, zéro migration. Un widget non
// disponible (downgrade) disparaît tout seul ; un nouveau devient proposable.
// ═══════════════════════════════════════════════════════════════════════════
import {
  WIDGET_CATALOG,
  widgetDisponible,
  widgetsDisponibles,
  widgetParId,
  type WidgetDef,
} from '~/config/widgets';

const CLE = 'apigo_dashboard_cols_v2';
/** Nombre de colonnes sur desktop (empilées en une seule colonne sur mobile). */
export const NB_COLONNES = 3;

function grilleVide(): string[][] {
  return Array.from({ length: NB_COLONNES }, () => []);
}

export function useDashboardWidgets() {
  const authStore = useAuthStore();
  const plan = computed(() => authStore.effectivePlan);
  const disponibles = computed(() => widgetsDisponibles(plan.value));

  /** Disposition : une liste d'ids par colonne. Persistée par appareil. */
  const colonnes = ref<string[][]>(grilleVide());
  const pret = ref(false);

  function lire(): string[][] | null {
    if (!import.meta.client) return null;
    try {
      const raw = localStorage.getItem(CLE);
      if (!raw) return null;
      const arr: unknown = JSON.parse(raw);
      if (!Array.isArray(arr)) return null;
      return arr.map((c) =>
        Array.isArray(c) ? c.filter((x): x is string => typeof x === 'string') : [],
      );
    } catch {
      return null;
    }
  }
  function ecrire(): void {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(CLE, JSON.stringify(colonnes.value));
    } catch {
      /* stockage indisponible — tant pis, disposition par défaut */
    }
  }

  /** Défaut : tous les widgets disponibles, répartis en colonnes (round-robin). */
  function defaut(): string[][] {
    const cols = grilleVide();
    disponibles.value.forEach((w, i) => cols[i % NB_COLONNES]!.push(w.id));
    return cols;
  }

  /** Garantit NB_COLONNES colonnes, retire les ids inconnus/indisponibles/en double. */
  function normaliser(source: string[][]): string[][] {
    const dispoIds = new Set(disponibles.value.map((w) => w.id));
    const vus = new Set<string>();
    const cols = grilleVide();
    // On lit toutes les colonnes de la source (même au-delà de NB) pour ne rien
    // perdre à un changement de nombre de colonnes → tout est réabsorbé.
    source.forEach((c, i) => {
      const cible = i < NB_COLONNES ? i : i % NB_COLONNES;
      for (const id of c) {
        if (!dispoIds.has(id) || vus.has(id)) continue;
        vus.add(id);
        cols[cible]!.push(id);
      }
    });
    return cols;
  }

  onMounted(() => {
    const stored = lire();
    colonnes.value = stored ? normaliser(stored) : defaut();
    pret.value = true;
  });

  const idsAffiches = computed(() => new Set(colonnes.value.flat()));

  /** Widgets d'une colonne, dans l'ordre, filtrés à ce que le plan autorise. */
  function widgetsColonne(i: number): WidgetDef[] {
    return (colonnes.value[i] ?? [])
      .map((id) => disponibles.value.find((w) => w.id === id))
      .filter((w): w is WidgetDef => Boolean(w));
  }

  /** Widgets disponibles mais MASQUÉS (proposés à l'ajout). */
  const masques = computed<WidgetDef[]>(() =>
    disponibles.value.filter((w) => !idsAffiches.value.has(w.id)),
  );

  /** Widgets VERROUILLÉS par le plan (teaser d'upgrade). */
  const verrouilles = computed<WidgetDef[]>(() =>
    WIDGET_CATALOG.filter((w) => !widgetDisponible(w, plan.value)),
  );

  function ajouter(id: string): void {
    if (idsAffiches.value.has(id) || !widgetParId(id)) return;
    const cols = colonnes.value.map((c) => [...c]);
    // Colonne la plus courte, pour équilibrer.
    let min = 0;
    for (let i = 1; i < NB_COLONNES; i++) {
      if ((cols[i]?.length ?? 0) < (cols[min]?.length ?? 0)) min = i;
    }
    cols[min]!.push(id);
    colonnes.value = cols;
    ecrire();
  }

  function retirer(id: string): void {
    colonnes.value = colonnes.value.map((c) => c.filter((x) => x !== id));
    ecrire();
  }

  /**
   * Déplace `id` dans la colonne `col`, inséré JUSTE AVANT `avantId` (ou en fin de
   * colonne si `avantId` est null). Cœur du glisser-déposer 2D.
   */
  function deplacer(id: string, col: number, avantId: string | null): void {
    if (col < 0 || col >= NB_COLONNES || !widgetParId(id)) return;
    const cols = colonnes.value.map((c) => c.filter((x) => x !== id));
    const dest = cols[col]!;
    const idx = avantId ? dest.indexOf(avantId) : -1;
    if (idx === -1) dest.push(id);
    else dest.splice(idx, 0, id);
    // N'applique que si ça change vraiment (évite le sur-rendu pendant le survol).
    const avant = JSON.stringify(colonnes.value);
    if (JSON.stringify(cols) === avant) return;
    colonnes.value = cols;
    ecrire();
  }

  function reinitialiser(): void {
    colonnes.value = defaut();
    ecrire();
  }

  return {
    plan,
    pret,
    disponibles,
    colonnes,
    widgetsColonne,
    masques,
    verrouilles,
    ajouter,
    retirer,
    deplacer,
    reinitialiser,
    NB_COLONNES,
  };
}
