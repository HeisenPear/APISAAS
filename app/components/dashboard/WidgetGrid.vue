<!--
  WidgetGrid — tableau de bord CONFIGURABLE façon ÉCRAN D'ACCUEIL iPhone.

  Disposition en COLONNES : chaque widget vit dans une colonne à une position libre,
  donc on peut poser n'importe quel bloc n'importe où (ex. « Production sous Alertes »)
  sans que l'ordre des autres l'en empêche. Desktop = NB_COLONNES colonnes côte à
  côte ; mobile = colonnes empilées (une seule colonne visuelle). Tout se déplace
  SAUF la bannière Maya (chrome fixe, dans dashboard.vue).

  En mode « Personnaliser » : saisir un widget (carte à la souris, poignée ⠿ au
  doigt) et le déposer dans la colonne / à la hauteur voulue — aperçu live. Des
  zones « Déposer ici » apparaissent en bas de chaque colonne pendant le glisser.
  Disposition persistée par appareil (localStorage) via useDashboardWidgets.
  ⚠️ Page protégée : rendu à vérifier à l'écran.
-->
<template>
  <section v-if="pret" class="space-y-4">
    <!-- Barre d'action.

         ⚠️ EN ÉDITION, ELLE COLLE EN HAUT — signalé à l'usage : pour ajouter un
         bloc il fallait descendre sous TOUS les widgets, ouvrir la feuille, puis
         remonter. À chaque bloc. La feuille dépliable existait déjà ; c'est son
         point d'entrée qui était hors de portée. Elle se commande donc depuis la
         barre, et la barre reste visible tant qu'on personnalise.
         `<main class="app-content">` est le conteneur de défilement et l'en-tête
         de l'app lui est ANTÉRIEUR (cf. layouts/default.vue) : un `top: 0` se
         cale donc juste sous l'en-tête, sans se glisser dessous. -->
    <div
      class="flex items-center justify-between gap-2"
      :class="edition && !glisse ? 'wg-barre-collee' : ''"
    >
      <div
        class="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        Mon tableau de bord
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          v-if="edition"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
          style="
            background: var(--honey-soft);
            border-color: color-mix(in srgb, var(--honey) 45%, transparent);
            color: var(--honey-deep);
          "
          :aria-expanded="ajoutOuvert"
          @click="ajoutOuvert = !ajoutOuvert"
        >
          <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          Ajouter
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[12.5px] font-medium transition-colors"
          :style="
            edition
              ? 'background: var(--honey); border-color: var(--honey); color: #fff;'
              : 'background: white; border-color: var(--border-default); color: var(--text-secondary);'
          "
          @click="basculerEdition"
        >
          <UIcon
            :name="edition ? 'i-lucide-check' : 'i-lucide-sliders-horizontal'"
            class="h-3.5 w-3.5"
          />
          {{ edition ? 'Terminé' : 'Personnaliser' }}
        </button>
      </div>
    </div>

    <!-- MOBILE : une seule grille 2-colonnes (les 3 colonnes fusionnent via
         `display:contents`) → TOUS les petits widgets se rangent 2 côte à côte.
         DESKTOP : 3 colonnes côte à côte (md:flex-row). La structure DOM par colonne
         reste intacte (data-col) → le glisser-déposer par colonne fonctionne pareil. -->
    <div
      ref="grille"
      class="grid grid-cols-2 gap-4 md:flex md:flex-row md:items-start"
      @pointermove="onPointerMove"
      @pointerup="terminer"
      @pointercancel="terminer"
    >
      <div
        v-for="ci in NB_COLONNES"
        :key="ci"
        :data-col="ci - 1"
        class="contents md:flex md:flex-1 md:flex-col md:gap-4"
      >
        <div
          v-for="w in widgetsColonne(ci - 1)"
          :key="w.id"
          :data-widget-id="w.id"
          class="relative overflow-hidden rounded-[14px] border bg-white transition-all"
          :class="w.taille === 'petit' ? 'col-span-1' : 'col-span-2'"
          :style="[
            'border-color: var(--border-default)',
            edition
              ? 'cursor: grab; outline: 1.5px dashed var(--border-strong); outline-offset: 2px;'
              : '',
            draggedId === w.id
              ? 'opacity: 0.4; pointer-events: none; outline-color: var(--honey); outline-style: solid;'
              : '',
          ]"
          @pointerdown="onPointerDownCard($event, w.id)"
        >
          <!-- Contrôles d'édition -->
          <div v-if="edition" class="absolute right-2 top-2 z-10 flex items-center gap-1">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-[7px] text-white"
              style="background: var(--honey-deep); touch-action: none; cursor: grab"
              title="Glisser pour déplacer"
              @pointerdown="onPointerDownPoignee($event, w.id)"
            >
              <UIcon name="i-lucide-grip-vertical" class="h-4 w-4" />
            </span>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-[7px] text-white"
              style="background: var(--clay, #b87959)"
              title="Retirer ce widget"
              @pointerdown.stop
              @click="retirer(w.id)"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>

          <component
            :is="composant(w.composant)"
            v-bind="propsPour(w)"
            :class="edition ? 'pointer-events-none select-none' : ''"
            @dismiss="(id: string) => emit('dismiss-alert', id)"
          />
        </div>

        <!-- Zone de dépôt en bas de colonne : cible stable pour déposer au bout de
             CETTE colonne (et rendre les colonnes vides atteignables). -->
        <div
          v-if="edition && glisse"
          class="col-span-2 flex min-h-[58px] items-center justify-center rounded-[14px] border-2 border-dashed text-[12px] font-medium"
          style="
            border-color: var(--honey);
            color: var(--honey-deep);
            background: rgba(245, 166, 35, 0.08);
          "
        >
          Déposer ici
        </div>
      </div>
    </div>

    <!-- Ajouter un widget (mode édition) -->
    <button
      v-if="edition && !glisse"
      type="button"
      class="flex min-h-[64px] w-full flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed transition-colors hover:bg-[var(--surface-muted)]"
      style="border-color: var(--border-strong); color: var(--text-tertiary)"
      @click="ajoutOuvert = !ajoutOuvert"
    >
      <UIcon name="i-lucide-plus" class="h-5 w-5" />
      <span class="text-[12px] font-medium">Ajouter un widget</span>
    </button>

    <!-- Bottom sheet : ajout de widgets (se déplie depuis le bas de l'écran) -->
    <Teleport to="body">
      <Transition name="aw">
        <div
          v-if="edition && ajoutOuvert"
          class="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40"
          @click.self="ajoutOuvert = false"
        >
          <div
            class="aw-sheet flex max-h-[82vh] flex-col rounded-t-[22px] bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-2xl"
          >
            <div class="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-stone-300" />
            <div class="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
              <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
                Ajouter un widget
              </p>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full"
                style="background: var(--surface-muted); color: var(--text-secondary)"
                aria-label="Fermer"
                @click="ajoutOuvert = false"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
              <div v-if="masquesBlocs.length">
                <!-- Aperçu RÉEL de chaque widget non placé (composant rendu avec tes
                     vraies données, non interactif et rogné) + bouton d'ajout. -->
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    v-for="w in masquesBlocs"
                    :key="w.id"
                    class="overflow-hidden rounded-[12px] border bg-white"
                    style="border-color: var(--border-default)"
                  >
                    <WidgetPreview
                      :composant="composant(w.composant)"
                      :widget-props="propsPour(w)"
                      :icon="w.icon"
                      :label="w.label"
                      :description="w.description"
                    />
                    <button
                      type="button"
                      class="flex w-full items-center justify-center gap-1.5 border-t py-2 text-[12.5px] font-semibold transition-colors hover:bg-[var(--surface-muted)]"
                      style="border-color: var(--border-default); color: var(--honey-deep)"
                      @click="ajouter(w.id)"
                    >
                      <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
                      Ajouter {{ w.label }}
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="py-6 text-center text-[12.5px]" style="color: var(--text-tertiary)">
                Tous tes blocs disponibles sont déjà affichés.
              </p>

              <!-- RACCOURCIS : des puces, pas des aperçus. Un raccourci n'a rien
                   à montrer d'autre que sa destination, et il y en a un par
                   entrée de la barre latérale — en grand format, ils
                   noieraient les vrais widgets juste au-dessus. -->
              <template v-if="masquesRaccourcis.length">
                <p
                  class="mb-1 mt-5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style="color: var(--text-tertiary)"
                >
                  Raccourcis
                </p>
                <p class="mb-2.5 text-[12px]" style="color: var(--text-tertiary)">
                  Pose sur ton tableau de bord les pages que tu ouvres tous les jours.
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="w in masquesRaccourcis"
                    :key="w.id"
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--honey-soft)]"
                    style="border-color: var(--border-default); color: var(--text-secondary)"
                    @click="ajouter(w.id)"
                  >
                    <UIcon :name="w.icon" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
                    {{ w.label }}
                    <UIcon name="i-lucide-plus" class="h-3 w-3" style="color: var(--honey-deep)" />
                  </button>
                </div>
              </template>

              <!-- Widgets verrouillés par le plan → teaser d'upgrade -->
              <template v-if="verrouilles.length">
                <p
                  class="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style="color: var(--text-tertiary)"
                >
                  Débloquer avec un plan supérieur
                </p>
                <div class="flex flex-wrap gap-2">
                  <NuxtLink
                    v-for="w in verrouilles"
                    :key="w.id"
                    to="/tarifs"
                    class="inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-white"
                    style="border-color: var(--border-strong); color: var(--text-tertiary)"
                  >
                    <UIcon name="i-lucide-lock" class="h-3 w-3" />
                    {{ w.label }}
                    <span style="color: var(--honey-deep)"
                      >· {{ labelPlan(planMinimumWidget(w)) }}</span
                    >
                  </NuxtLink>
                </div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { planMinimumWidget, type WidgetDef } from '~/config/widgets';
import { PLAN_CONFIGS, type Plan } from '~/config/plans';
// Imports EXPLICITES (resolveComponent ne résolvait pas les auto-imports au
// runtime → widgets vides).
import KpiWidget from '~/components/dashboard/KpiWidget.vue';
import TourneeCard from '~/components/dashboard/TourneeCard.vue';
import AlertsWidget from '~/components/dashboard/AlertsWidget.vue';
import UpcomingTasks from '~/components/dashboard/UpcomingTasks.vue';
import SanteScore from '~/components/dashboard/SanteScore.vue';
import SanteChart from '~/components/dashboard/SanteChart.vue';
import ActiviteWidget from '~/components/dashboard/ActiviteWidget.vue';
import ProductionChart from '~/components/dashboard/ProductionChart.vue';
import BalancesWidget from '~/components/dashboard/BalancesWidget.vue';
import BudgetWidget from '~/components/dashboard/BudgetWidget.vue';
import RaccourciWidget from '~/components/dashboard/RaccourciWidget.vue';
import WidgetPreview from '~/components/dashboard/WidgetPreview.vue';

const COMPOSANTS: Record<string, Component> = {
  KpiWidget,
  TourneeCard,
  AlertsWidget,
  UpcomingTasks,
  SanteScore,
  SanteChart,
  ActiviteWidget,
  ProductionChart,
  BalancesWidget,
  BudgetWidget,
  RaccourciWidget,
};

interface DashboardKpis {
  ruchesActives?: number;
  totalRuches?: number;
  productionSaison?: number;
  caTotal?: number;
  alertesActives?: number;
  charges?: number;
  benefice?: number;
  interventions30j?: number;
  // `null` quand aucune colonie n'est encore notée — distinct de « non chargé ».
  santeGlobal?: number | null;
  reines?: number;
  reinesInseminees?: number;
  reinesARemplacer?: number;
  lignees?: number;
  cellulesAcceptees?: number;
  stockArticles?: number;
  transhumancesPrevues?: number;
  ruchers?: number;
  recoltes?: number;
  clients?: number;
  ventes?: number;
}
interface DashboardData {
  kpis?: DashboardKpis;
  productionMensuelle?: unknown;
  scoreSante?: { global?: number } | null;
  santeColonies?: Array<{ statut: string; count: number }>;
  activiteRecente?: unknown[];
  alertesRecentes?: unknown[];
}
const props = defineProps<{ dashboard: DashboardData | null }>();
const emit = defineEmits<{ 'dismiss-alert': [id: string] }>();

const {
  pret,
  widgetsColonne,
  masquesBlocs,
  masquesRaccourcis,
  verrouilles,
  ajouter,
  retirer,
  deplacer,
  NB_COLONNES,
} = useDashboardWidgets();

const edition = ref(false);
const ajoutOuvert = ref(false);
function basculerEdition(): void {
  edition.value = !edition.value;
  if (!edition.value) ajoutOuvert.value = false;
}

function composant(nom: string): Component | undefined {
  return COMPOSANTS[nom];
}

/** Props par widget : KPIs paramétrés + widgets à données ; les autres se servent seuls. */
function propsPour(w: WidgetDef): Record<string, unknown> {
  // Les raccourcis se servent de leur définition, pas des données du tableau de
  // bord : ils n'affichent aucun chiffre, seulement une destination.
  if (w.raccourciVers) return { to: w.raccourciVers, label: w.label, icon: w.icon };
  const k = props.dashboard?.kpis ?? {};
  switch (w.id) {
    case 'kpiRuches':
      return { label: 'Ruches', value: k.ruchesActives ?? 0, sub: `/ ${k.totalRuches ?? 0} total` };
    case 'kpiProduction':
      return {
        label: 'Production',
        value: Math.round((k.productionSaison ?? 0) * 10) / 10,
        suffix: ' kg',
        sub: 'Saison en cours',
      };
    case 'kpiCa':
      return {
        label: "Chiffre d'affaires",
        value: Math.round(k.caTotal ?? 0),
        suffix: ' €',
        sub: 'Cette année',
      };
    case 'kpiAlertes':
      return {
        label: 'Alertes',
        value: k.alertesActives ?? 0,
        color: (k.alertesActives ?? 0) > 0 ? 'var(--status-warn)' : undefined,
        to: '/alertes',
        toLabel: 'Voir les alertes',
      };
    case 'kpiRuchers':
      return { label: 'Ruchers', value: k.ruchers ?? 0, sub: 'De l’exploitation' };
    case 'kpiRendement': {
      const ruches = k.ruchesActives ?? 0;
      const rdt = ruches > 0 ? Math.round(((k.productionSaison ?? 0) / ruches) * 10) / 10 : 0;
      return { label: 'Rendement moyen', value: rdt, suffix: ' kg/ruche', sub: 'Saison en cours' };
    }
    case 'kpiRecoltes':
      return { label: 'Récoltes', value: k.recoltes ?? 0, sub: 'Cette année' };
    case 'kpiClients':
      return { label: 'Clients', value: k.clients ?? 0, sub: 'Carnet' };
    case 'kpiVentes':
      return { label: 'Ventes', value: k.ventes ?? 0, sub: 'Cette année' };
    case 'kpiReinesARemplacer': {
      const n = k.reinesARemplacer ?? 0;
      return {
        label: 'Reines à remplacer',
        value: n,
        sub: '2 ans et +',
        color: n > 0 ? 'var(--status-warn)' : undefined,
      };
    }
    case 'kpiInterventions':
      return { label: 'Interventions', value: k.interventions30j ?? 0, sub: '30 derniers jours' };
    case 'kpiReines':
      return { label: 'Reines actives', value: k.reines ?? 0, sub: 'Registre d’élevage' };
    case 'kpiLignees':
      return { label: 'Lignées', value: k.lignees ?? 0, sub: 'Génétique suivie' };
    case 'kpiGreffages':
      return { label: 'Cellules acceptées', value: k.cellulesAcceptees ?? 0, sub: 'Cette année' };
    case 'kpiInseminees':
      return {
        label: 'Reines inséminées',
        value: k.reinesInseminees ?? 0,
        sub: 'Sélection avancée',
      };
    case 'kpiStock':
      return { label: 'Articles en stock', value: k.stockArticles ?? 0, sub: 'Références' };
    case 'kpiTranshumance':
      return {
        label: 'Transhumances',
        value: k.transhumancesPrevues ?? 0,
        sub: 'Prévues à venir',
        to: '/transhumance',
        toLabel: 'Voir',
      };
    case 'kpiCharges':
      return {
        label: 'Charges',
        value: Math.round(k.charges ?? 0),
        suffix: ' €',
        sub: 'Cette année',
      };
    case 'kpiBenefice':
      return {
        label: 'Bénéfice',
        value: Math.round(k.benefice ?? 0),
        suffix: ' €',
        sub: 'Cette année',
        color: (k.benefice ?? 0) < 0 ? 'var(--status-bad)' : undefined,
      };
    case 'production':
      return { data: props.dashboard?.productionMensuelle };
    case 'sante':
      return { data: props.dashboard?.scoreSante };
    case 'santeRepartition':
      return { data: props.dashboard?.santeColonies ?? [] };
    case 'activite':
      return { activites: props.dashboard?.activiteRecente ?? [] };
    case 'alertes':
      return { alertes: props.dashboard?.alertesRecentes ?? [], total: k.alertesActives };
    default:
      return {};
  }
}

function labelPlan(p: Plan): string {
  return PLAN_CONFIGS[p].label;
}

// ─── Glisser-déposer 2D (souris + TACTILE), placement libre en colonnes ─────────
// On réorganise DÈS le déplacement (aperçu live). L'élément sous le pointeur donne
// la COLONNE (data-col) ; dans cette colonne, la position verticale du pointeur
// donne le point d'insertion (avant le premier widget dont le milieu est sous le
// curseur, sinon en fin de colonne). Suivi par ID (la disposition se recompose).
const grille = ref<HTMLElement | null>(null);
const draggedId = ref<string | null>(null);
const glisse = computed(() => draggedId.value !== null);

const SEUIL = 6;
let pointeurId: number | null = null;
let candidatId: string | null = null;
let enGlisser = false;
let departX = 0;
let departY = 0;

function placerSousPointeur(x: number, y: number): void {
  const dragged = draggedId.value;
  if (!dragged || !import.meta.client) return;
  const el = document.elementFromPoint(x, y);
  const colEl = el?.closest('[data-col]');
  if (!colEl) return;
  const col = Number(colEl.getAttribute('data-col'));
  if (Number.isNaN(col)) return;
  const cartes = Array.from(colEl.querySelectorAll('[data-widget-id]'));
  let avantId: string | null = null;
  for (const c of cartes) {
    const id = c.getAttribute('data-widget-id');
    if (!id || id === dragged) continue;
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) {
      avantId = id;
      break;
    }
  }
  deplacer(dragged, col, avantId);
}

function armer(event: PointerEvent, id: string, immediat: boolean): void {
  if (!edition.value) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  pointeurId = event.pointerId;
  candidatId = id;
  enGlisser = false;
  departX = event.clientX;
  departY = event.clientY;
  grille.value?.setPointerCapture(event.pointerId);
  if (immediat) {
    enGlisser = true;
    draggedId.value = id;
  }
}
/** Corps de carte : démarrage souris (seuil) — le tactile passe par la poignée. */
function onPointerDownCard(event: PointerEvent, id: string): void {
  if (event.pointerType !== 'mouse') return;
  armer(event, id, false);
}
/** Poignée ⠿ : démarrage IMMÉDIAT, tous pointeurs. */
function onPointerDownPoignee(event: PointerEvent, id: string): void {
  event.stopPropagation();
  armer(event, id, true);
}

function onPointerMove(event: PointerEvent): void {
  if (pointeurId !== event.pointerId || !candidatId) return;
  if (!enGlisser) {
    if (Math.hypot(event.clientX - departX, event.clientY - departY) < SEUIL) return;
    enGlisser = true;
    draggedId.value = candidatId;
  }
  event.preventDefault();
  placerSousPointeur(event.clientX, event.clientY);
}

function terminer(event: PointerEvent): void {
  if (pointeurId !== event.pointerId) return;
  if (enGlisser) placerSousPointeur(event.clientX, event.clientY);
  if (pointeurId !== null) grille.value?.releasePointerCapture?.(pointeurId);
  pointeurId = null;
  candidatId = null;
  enGlisser = false;
  draggedId.value = null;
}
</script>

<style scoped>
/* La barre d'action reste sous la main pendant qu'on personnalise.
   Retirée pendant un glisser : une barre flottante au-dessus des colonnes
   volerait le pointeur aux zones de dépôt. */
.wg-barre-collee {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: -0.5rem -0.25rem 0;
  padding: 0.5rem 0.25rem;
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-default);
}

/* Bottom sheet « Ajouter un widget » : voile en fondu + panneau qui remonte. */
.aw-enter-active,
.aw-leave-active {
  transition: opacity 220ms ease;
}
.aw-enter-active .aw-sheet,
.aw-leave-active .aw-sheet {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.aw-enter-from,
.aw-leave-to {
  opacity: 0;
}
.aw-enter-from .aw-sheet,
.aw-leave-to .aw-sheet {
  transform: translateY(100%);
}
</style>
