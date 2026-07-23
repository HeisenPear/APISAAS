// ═══════════════════════════════════════════════════════════════════════════
// Dashboard configurable : résout les widgets AFFICHÉS pour l'apiculteur.
//
// Disponibilité = autoritaire, dérivée du plan (widgets.ts). Disposition (ordre
// + widgets activés) = préférence locale (localStorage, par appareil) — zéro
// route serveur, zéro migration, et une jauge de plan ne peut jamais l'écraser.
// Si le plan change (up/downgrade), les widgets non disponibles disparaissent
// tout seuls et les nouveaux deviennent proposables.
// ═══════════════════════════════════════════════════════════════════════════
import {
  WIDGET_CATALOG,
  widgetDisponible,
  widgetsDisponibles,
  widgetParId,
  type WidgetDef,
} from '~/config/widgets';

const CLE = 'apigo_dashboard_widgets';

export function useDashboardWidgets() {
  const authStore = useAuthStore();
  const plan = computed(() => authStore.effectivePlan);
  const disponibles = computed(() => widgetsDisponibles(plan.value));

  /** Ordre des widgets ACTIVÉS (ids), persisté par appareil. */
  const ordre = ref<string[]>([]);
  const pret = ref(false);

  function lire(): string[] | null {
    if (!import.meta.client) return null;
    try {
      const raw = localStorage.getItem(CLE);
      if (!raw) return null;
      const arr: unknown = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : null;
    } catch {
      return null;
    }
  }
  function ecrire(): void {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(CLE, JSON.stringify(ordre.value));
    } catch {
      /* stockage indisponible — tant pis, disposition par défaut */
    }
  }

  onMounted(() => {
    // Défaut : tous les widgets disponibles, dans l'ordre du catalogue.
    ordre.value = lire() ?? disponibles.value.map((w) => w.id);
    pret.value = true;
  });

  /** Widgets AFFICHÉS : l'ordre choisi, filtré à ce que le plan autorise. */
  const visibles = computed<WidgetDef[]>(() =>
    ordre.value
      .map((id) => disponibles.value.find((w) => w.id === id))
      .filter((w): w is WidgetDef => Boolean(w)),
  );

  /** Widgets disponibles mais MASQUÉS (proposés à l'ajout). */
  const masques = computed<WidgetDef[]>(() =>
    disponibles.value.filter((w) => !ordre.value.includes(w.id)),
  );

  /** Widgets VERROUILLÉS par le plan (teaser d'upgrade). */
  const verrouilles = computed<WidgetDef[]>(() =>
    WIDGET_CATALOG.filter((w) => !widgetDisponible(w, plan.value)),
  );

  function ajouter(id: string): void {
    if (!ordre.value.includes(id) && widgetParId(id)) {
      ordre.value = [...ordre.value, id];
      ecrire();
    }
  }
  function retirer(id: string): void {
    ordre.value = ordre.value.filter((x) => x !== id);
    ecrire();
  }
  /** Réordonne à partir d'une liste d'ids (drag & drop). */
  function reordonner(ids: string[]): void {
    ordre.value = ids.filter((id) => widgetParId(id));
    ecrire();
  }
  function reinitialiser(): void {
    ordre.value = disponibles.value.map((w) => w.id);
    ecrire();
  }

  return {
    plan,
    pret,
    disponibles,
    visibles,
    masques,
    verrouilles,
    ajouter,
    retirer,
    reordonner,
    reinitialiser,
  };
}
