<!--
  WidgetGrid — la zone de widgets CONFIGURABLE du tableau de bord. Le « chrome »
  (salut, KPIs, cartes Maya, activation) reste géré par dashboard.vue ; ici on ne
  pilote que les widgets de contenu : ordre choisi par l'apiculteur, ajout/retrait,
  et gating par plan (widgets verrouillés = teaser d'upgrade).

  Disposition persistée par appareil (localStorage) via useDashboardWidgets.
  Glisser-déposer natif (aucune lib). Rendu dynamique des composants Dashboard*.

  ⚠️ Page protégée : à vérifier à l'écran (hors portée des tests automatisés).
-->
<template>
  <section v-if="pret" class="space-y-4">
    <!-- Barre d'action : personnaliser -->
    <div class="flex items-center justify-between">
      <div
        class="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        Mes widgets
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[12.5px] font-medium transition-colors"
        :style="
          edition
            ? 'background: var(--honey); border-color: var(--honey); color: #fff;'
            : 'background: white; border-color: var(--border-default); color: var(--text-secondary);'
        "
        @click="edition = !edition"
      >
        <UIcon
          :name="edition ? 'i-lucide-check' : 'i-lucide-sliders-horizontal'"
          class="h-3.5 w-3.5"
        />
        {{ edition ? 'Terminé' : 'Personnaliser' }}
      </button>
    </div>

    <!-- Grille des widgets affichés -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div
        v-for="(w, i) in visibles"
        :key="w.id"
        :class="w.large ? 'lg:col-span-2' : ''"
        :draggable="edition"
        class="relative overflow-hidden rounded-[14px] border bg-white transition-all"
        :style="[
          'border-color: var(--border-default)',
          edition
            ? 'cursor: grab; outline: 1.5px dashed var(--border-strong); outline-offset: 2px;'
            : '',
          surviensIndex === i && glisseIndex !== null
            ? 'outline-color: var(--honey); outline-style: solid;'
            : '',
        ]"
        @dragstart="onDragStart(i)"
        @dragover.prevent="onDragOver(i)"
        @drop="onDrop"
        @dragend="onDragEnd"
      >
        <!-- Contrôles d'édition -->
        <div v-if="edition" class="absolute right-2 top-2 z-10 flex items-center gap-1">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-[7px] text-white"
            style="background: var(--honey-deep)"
            title="Glisser pour déplacer"
          >
            <UIcon name="i-lucide-grip-vertical" class="h-3.5 w-3.5" />
          </span>
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded-[7px] text-white"
            style="background: var(--clay, #b87959)"
            title="Retirer ce widget"
            @click="retirer(w.id)"
          >
            <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Le widget lui-même -->
        <component
          :is="composant(w.composant)"
          v-bind="propsPour(w)"
          :class="edition ? 'pointer-events-none select-none' : ''"
          @dismiss="(id: string) => emit('dismiss-alert', id)"
        />
      </div>
    </div>

    <p
      v-if="!visibles.length"
      class="rounded-[14px] border border-dashed py-8 text-center text-[13px]"
      style="border-color: var(--border-default); color: var(--text-tertiary)"
    >
      Aucun widget affiché. Ajoute-en ci-dessous.
    </p>

    <!-- Tiroir d'ajout (mode édition) -->
    <div
      v-if="edition"
      class="rounded-[14px] border p-4"
      style="border-color: var(--border-default); background: var(--surface-muted)"
    >
      <p
        class="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
        style="color: var(--text-tertiary)"
      >
        Ajouter un widget
      </p>

      <div v-if="masques.length" class="flex flex-wrap gap-2">
        <button
          v-for="w in masques"
          :key="w.id"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-white"
          style="background: white; border-color: var(--border-default); color: var(--text-primary)"
          @click="ajouter(w.id)"
        >
          <UIcon :name="w.icon" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
          {{ w.label }}
          <UIcon name="i-lucide-plus" class="h-3 w-3" style="color: var(--honey-deep)" />
        </button>
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
import { planMinimumWidget, type WidgetDef } from '~/config/widgets';
import { PLAN_CONFIGS, type Plan } from '~/config/plans';

interface DashboardData {
  productionMensuelle?: unknown;
  scoreSante?: unknown;
  alertesRecentes?: unknown[];
  kpis?: { alertesActives?: number };
}
const props = defineProps<{ dashboard: DashboardData | null }>();
const emit = defineEmits<{ 'dismiss-alert': [id: string] }>();

const { pret, visibles, masques, verrouilles, ajouter, retirer, reordonner } =
  useDashboardWidgets();

const edition = ref(false);

/** Résout le composant Dashboard* par son nom (rendu dynamique). */
function composant(nom: string) {
  return resolveComponent(`Dashboard${nom}`);
}

/** Props spécifiques aux widgets qui reçoivent des données ; les autres se servent seuls. */
function propsPour(w: WidgetDef): Record<string, unknown> {
  switch (w.id) {
    case 'production':
      return { data: props.dashboard?.productionMensuelle };
    case 'sante':
      return { data: props.dashboard?.scoreSante };
    case 'alertes':
      return {
        alertes: props.dashboard?.alertesRecentes ?? [],
        total: props.dashboard?.kpis?.alertesActives,
      };
    default:
      return {};
  }
}

function labelPlan(p: Plan): string {
  return PLAN_CONFIGS[p].label;
}

// ─── Glisser-déposer natif pour réordonner ──────────────────────────────────
const glisseIndex = ref<number | null>(null);
const surviensIndex = ref<number | null>(null);
function onDragStart(i: number): void {
  glisseIndex.value = i;
}
function onDragOver(i: number): void {
  surviensIndex.value = i;
}
function onDrop(): void {
  const from = glisseIndex.value;
  const to = surviensIndex.value;
  if (from == null || to == null || from === to) return;
  const ids = visibles.value.map((w) => w.id);
  const [deplace] = ids.splice(from, 1);
  if (deplace) ids.splice(to, 0, deplace);
  reordonner(ids);
}
function onDragEnd(): void {
  glisseIndex.value = null;
  surviensIndex.value = null;
}
</script>
