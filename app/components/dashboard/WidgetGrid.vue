<!--
  WidgetGrid — le tableau de bord CONFIGURABLE, façon écran d'accueil Apple.

  Grille à tailles FIXES (petit/moyen/grand), rangée en LECTURE (haut-gauche →
  bas-droite) : la position visible suit l'ordre de la liste, donc un bloc atterrit
  EXACTEMENT là où on le pose (pas de rangement « dense » qui téléporterait le bloc
  pour combler un trou). L'espacement et l'alignement restent garantis par la
  grille — jamais du placement libre. Tout se déplace (KPIs, tournée, cartes) SAUF
  la bannière Maya, chrome fixe dans dashboard.vue.

  En mode « Personnaliser » : glisser-déposer pour placer un bloc n'importe où —
  déposer sur la MOITIÉ DROITE d'un widget l'insère APRÈS lui, sur la gauche AVANT ;
  un emplacement « Déposer ici » en fin de grille l'envoie tout au bout (coin bas-
  droite). Retrait par widget, et le même bloc sert à AJOUTER un widget au repos.

  Disposition persistée par appareil (localStorage) via useDashboardWidgets.
  ⚠️ Page protégée : rendu à vérifier à l'écran.
-->
<template>
  <section v-if="pret" class="space-y-4">
    <!-- Barre d'action -->
    <div class="flex items-center justify-between">
      <div
        class="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        Mon tableau de bord
      </div>
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

    <!-- Grille à tailles fixes, ordre de lecture (SANS « dense ») — items-start :
         chaque widget garde sa hauteur naturelle (un petit KPI ne s'étire pas à la
         hauteur d'un graphe). La position visible suit l'ordre → dépôt précis. -->
    <div
      ref="grille"
      class="grid grid-cols-2 items-start gap-4 md:grid-cols-4"
      @pointermove="onPointerMove"
      @pointerup="terminer"
      @pointercancel="terminer"
    >
      <div
        v-for="w in visibles"
        :key="w.id"
        :data-widget-id="w.id"
        :class="spanClasse(w.taille)"
        class="relative overflow-hidden rounded-[14px] border bg-white transition-all"
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
          <!-- Poignée : point de saisie tactile. touch-action:none → glisser sans
               faire défiler la page ; ailleurs sur la carte, le doigt fait défiler. -->
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

      <!-- Bloc de fin de grille : au repos → « + Ajouter un widget » ; pendant un
           glisser → emplacement « Déposer ici » qui envoie le bloc tout au bout
           (coin bas-droite). Il occupe naturellement le trou de fin de rangée. -->
      <!-- Pendant un glisser, cette tuile devient une BARRE PLEINE LARGEUR en bas :
           une grande cible stable qui ne se fait pas « pousser » par le widget en
           cours de déplacement (sinon la cible fuit et le dépôt de fin échoue). -->
      <button
        v-if="edition"
        type="button"
        data-fin-slot
        class="flex items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed transition-all"
        :class="glisse ? 'col-span-2 min-h-[60px] flex-row md:col-span-4' : 'min-h-[96px] flex-col'"
        :style="
          glisse
            ? 'border-color: var(--honey); color: var(--honey-deep); background: rgba(245, 166, 35, 0.1);'
            : 'border-color: var(--border-strong); color: var(--text-tertiary);'
        "
        @click="ajoutOuvert = !ajoutOuvert"
      >
        <UIcon :name="glisse ? 'i-lucide-corner-down-right' : 'i-lucide-plus'" class="h-5 w-5" />
        <span class="text-[12px] font-medium">{{
          glisse ? 'Déposer ici — placer en dernier' : 'Ajouter un widget'
        }}</span>
      </button>
    </div>

    <!-- Tiroir d'ajout -->
    <div
      v-if="edition && ajoutOuvert"
      class="rounded-[14px] border p-4"
      style="border-color: var(--border-default); background: var(--surface-muted)"
    >
      <div v-if="masques.length">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style="color: var(--text-tertiary)"
        >
          Widgets disponibles
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="w in masques"
            :key="w.id"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-white"
            style="
              background: white;
              border-color: var(--border-default);
              color: var(--text-primary);
            "
            @click="ajouter(w.id)"
          >
            <UIcon :name="w.icon" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
            {{ w.label }}
            <UIcon name="i-lucide-plus" class="h-3 w-3" style="color: var(--honey-deep)" />
          </button>
        </div>
      </div>
      <p v-else class="text-[12.5px]" style="color: var(--text-tertiary)">
        Tous tes widgets disponibles sont déjà affichés.
      </p>

      <!-- Widgets verrouillés par le plan → teaser d'upgrade -->
      <template v-if="verrouilles.length">
        <p
          class="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
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
            <span style="color: var(--honey-deep)">· {{ labelPlan(planMinimumWidget(w)) }}</span>
          </NuxtLink>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { planMinimumWidget, type TailleWidget, type WidgetDef } from '~/config/widgets';
import { PLAN_CONFIGS, type Plan } from '~/config/plans';
// Imports EXPLICITES (resolveComponent ne résolvait pas les auto-imports au
// runtime → widgets vides).
import KpiWidget from '~/components/dashboard/KpiWidget.vue';
import TourneeCard from '~/components/dashboard/TourneeCard.vue';
import AlertsWidget from '~/components/dashboard/AlertsWidget.vue';
import UpcomingTasks from '~/components/dashboard/UpcomingTasks.vue';
import SanteScore from '~/components/dashboard/SanteScore.vue';
import ProductionChart from '~/components/dashboard/ProductionChart.vue';
import BalancesWidget from '~/components/dashboard/BalancesWidget.vue';
import BudgetWidget from '~/components/dashboard/BudgetWidget.vue';

const COMPOSANTS: Record<string, Component> = {
  KpiWidget,
  TourneeCard,
  AlertsWidget,
  UpcomingTasks,
  SanteScore,
  ProductionChart,
  BalancesWidget,
  BudgetWidget,
};

interface DashboardKpis {
  ruchesActives?: number;
  totalRuches?: number;
  productionSaison?: number;
  caTotal?: number;
  alertesActives?: number;
}
interface DashboardData {
  kpis?: DashboardKpis;
  productionMensuelle?: unknown;
  scoreSante?: unknown;
  alertesRecentes?: unknown[];
}
const props = defineProps<{ dashboard: DashboardData | null }>();
const emit = defineEmits<{ 'dismiss-alert': [id: string] }>();

const { pret, visibles, masques, verrouilles, ajouter, retirer, reordonner } =
  useDashboardWidgets();

const edition = ref(false);
const ajoutOuvert = ref(false);
function basculerEdition(): void {
  edition.value = !edition.value;
  if (!edition.value) ajoutOuvert.value = false;
}

function composant(nom: string): Component | undefined {
  return COMPOSANTS[nom];
}

/** Classe de span selon la taille : petit = 1 col, moyen = 2, grand = pleine largeur. */
function spanClasse(taille: TailleWidget): string {
  if (taille === 'grand') return 'col-span-2 md:col-span-4';
  if (taille === 'moyen') return 'col-span-2';
  return 'col-span-1';
}

/** Props par widget : KPIs paramétrés + widgets à données ; les autres se servent seuls. */
function propsPour(w: WidgetDef): Record<string, unknown> {
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
    case 'production':
      return { data: props.dashboard?.productionMensuelle };
    case 'sante':
      return { data: props.dashboard?.scoreSante };
    case 'alertes':
      return {
        alertes: props.dashboard?.alertesRecentes ?? [],
        total: k.alertesActives,
      };
    default:
      return {};
  }
}

function labelPlan(p: Plan): string {
  return PLAN_CONFIGS[p].label;
}

// ─── Réorganisation POINTER EVENTS (souris + TACTILE) — placement précis + live ─
// Le glisser-déposer HTML natif ne se déclenche pas au doigt sur mobile ; on passe
// donc en Pointer Events, unifiés souris/tactile/stylet. On réorganise DÈS le
// déplacement (pas au lâcher) : les widgets se poussent en temps réel pour montrer
// où le bloc va atterrir, et l'item déplacé reste translucide.
//
// On suit le bloc par son ID (pas un index) : `visibles` se recompose à chaque
// mouvement, un index deviendrait faux. Le côté (moitié gauche/droite, ou haut/bas
// pour un widget pleine largeur) décide AVANT/APRÈS → toutes les positions sont
// atteignables, coin bas-droite compris. Sur mobile on saisit par la POIGNÉE ⠿
// (touch-action: none) pour ne jamais bloquer le défilement de la page.
const grille = ref<HTMLElement | null>(null);
const draggedId = ref<string | null>(null);
const glisse = computed(() => draggedId.value !== null);

const SEUIL = 6; // px de mouvement avant de démarrer un glisser à la souris
let pointeurId: number | null = null;
let candidatId: string | null = null; // pressé, pas encore en glisser
let enGlisser = false;
let departX = 0;
let departY = 0;

/** Applique un nouvel ordre seulement s'il diffère (évite le sur-rendu). */
function placer(ids: string[]): void {
  const cur = visibles.value.map((w) => w.id);
  if (ids.length === cur.length && ids.every((v, k) => v === cur[k])) return;
  reordonner(ids);
}

/** Insère le bloc glissé selon l'élément réellement sous le pointeur. */
function placerSousPointeur(x: number, y: number): void {
  const dragged = draggedId.value;
  if (!dragged || !import.meta.client) return;
  const el = document.elementFromPoint(x, y);
  if (!el) return;
  // Emplacement de fin → tout au bout.
  if (el.closest('[data-fin-slot]')) {
    const ids = visibles.value.map((w) => w.id).filter((id) => id !== dragged);
    ids.push(dragged);
    placer(ids);
    return;
  }
  const cible = el.closest('[data-widget-id]');
  const overId = cible?.getAttribute('data-widget-id');
  if (!cible || !overId || overId === dragged) return;
  const rect = cible.getBoundingClientRect();
  // Widget quasi pleine largeur (grand) → on raisonne en vertical, sinon horizontal.
  const pleineLargeur = rect.width >= (grille.value?.clientWidth ?? rect.width) * 0.75;
  const apres = pleineLargeur ? y > rect.top + rect.height / 2 : x > rect.left + rect.width / 2;
  const ids = visibles.value.map((w) => w.id).filter((id) => id !== dragged);
  const idx = ids.indexOf(overId);
  if (idx === -1) return;
  ids.splice(apres ? idx + 1 : idx, 0, dragged);
  placer(ids); // aperçu live : la disposition suit le doigt
}

/** Fait défiler la page quand on approche du haut/bas de l'écran en glissant. */
function autoDefilement(y: number): void {
  if (!import.meta.client) return;
  const marge = 90;
  if (y < marge) window.scrollBy(0, -14);
  else if (y > window.innerHeight - marge) window.scrollBy(0, 14);
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
/** Corps de carte : démarrage souris (seuil de mouvement) — le tactile passe par la poignée. */
function onPointerDownCard(event: PointerEvent, id: string): void {
  if (event.pointerType !== 'mouse') return;
  armer(event, id, false);
}
/** Poignée ⠿ : démarrage IMMÉDIAT, tous pointeurs (souris + doigt). */
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
  autoDefilement(event.clientY);
}

function terminer(event: PointerEvent): void {
  if (pointeurId !== event.pointerId) return;
  // Le lâcher fait foi : on replace une dernière fois sous le curseur, au cas où
  // le dernier mouvement aurait raté la cible (ex. l'emplacement de fin).
  if (enGlisser) placerSousPointeur(event.clientX, event.clientY);
  if (pointeurId !== null) grille.value?.releasePointerCapture?.(pointeurId);
  pointeurId = null;
  candidatId = null;
  enGlisser = false;
  draggedId.value = null;
}
</script>
