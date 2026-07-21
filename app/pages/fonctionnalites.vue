<template>
  <div class="min-h-screen bg-[#FAFAF8]">
    <LandingHeader />

    <main class="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
      <!-- Header -->
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Fonctionnalités
        </p>
        <h1
          class="text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[38px] md:text-[44px]"
          style="color: var(--text-primary)"
        >
          Le véritable tout-en-un de l'apiculture
        </h1>
        <p class="mt-4 text-[15px] leading-relaxed" style="color: var(--text-secondary)">
          Terrain, pilotage, production, conformité, élevage, équipe : explorez tout ce qu'APIGO
          propose — vue d'ensemble, filtrée par plan, ou comparée côte à côte.
        </p>
      </div>

      <!-- Toggle principal -->
      <div class="mb-8 flex justify-center">
        <div
          class="flex w-max items-center gap-1 rounded-[12px] border p-1"
          style="border-color: var(--border-default); background: var(--surface-muted)"
        >
          <button
            v-for="opt in MODES"
            :key="opt.id"
            type="button"
            class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-4 py-1.5 text-xs font-medium transition-all duration-150"
            :class="
              mode === opt.id
                ? 'bg-white font-semibold shadow-sm'
                : 'hover:text-[var(--text-secondary)]'
            "
            :style="mode === opt.id ? 'color: var(--text-primary)' : 'color: var(--text-tertiary)'"
            @click="mode = opt.id"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Sélecteur de plan (mode "Par plan") -->
      <div v-if="mode === 'parPlan'" class="mb-8 flex flex-col items-center gap-3">
        <div
          class="flex w-max items-center gap-1 rounded-[12px] border p-1"
          style="border-color: var(--border-default); background: var(--surface-muted)"
        >
          <button
            v-for="p in PLANS"
            :key="p"
            type="button"
            class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-4 py-1.5 text-xs font-medium transition-all duration-150"
            :class="
              selectedPlan === p
                ? 'bg-white font-semibold shadow-sm'
                : 'hover:text-[var(--text-secondary)]'
            "
            :style="
              selectedPlan === p ? 'color: var(--text-primary)' : 'color: var(--text-tertiary)'
            "
            @click="selectedPlan = p"
          >
            {{ PLAN_CONFIGS[p].label }}
          </button>
        </div>
        <p class="text-[13.5px]" style="color: var(--text-secondary)">
          Voici tout ce qu'inclut le plan <strong>{{ PLAN_CONFIGS[selectedPlan].label }}</strong
          >.
        </p>
      </div>

      <!-- Mode "Tout voir" / "Par plan" : liste catégorisée -->
      <div v-if="mode === 'toutVoir' || mode === 'parPlan'" class="space-y-8">
        <!-- Capacité -->
        <div>
          <div class="mb-3 flex items-center gap-2">
            <UIcon name="i-lucide-hexagon" class="h-4 w-4" style="color: var(--honey-deep)" />
            <h2
              class="text-[13px] font-bold uppercase tracking-[0.08em]"
              style="color: var(--text-secondary)"
            >
              Capacité
            </h2>
          </div>
          <div
            class="rounded-[14px] border divide-y"
            style="border-color: var(--border-default); background: white"
          >
            <div
              v-for="limit in LIMITS_CATALOG"
              :key="limit.key"
              class="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
            >
              <span class="text-[13.5px] font-medium" style="color: var(--text-primary)">{{
                limit.label
              }}</span>
              <span
                v-if="mode === 'parPlan'"
                class="text-[13px] font-semibold"
                style="color: var(--honey-deep)"
              >
                {{ limit.format(PLAN_CONFIGS[selectedPlan].limites[limit.key]) }}
              </span>
              <div v-else class="flex flex-wrap justify-end gap-x-3 gap-y-1">
                <span
                  v-for="p in PLANS"
                  :key="p"
                  class="text-[11.5px] whitespace-nowrap"
                  style="color: var(--text-tertiary)"
                >
                  {{ PLAN_CONFIGS[p].label }}
                  <strong style="color: var(--text-secondary)">{{
                    limit.format(PLAN_CONFIGS[p].limites[limit.key])
                  }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Catégories de fonctionnalités -->
        <div v-for="group in featureGroups" :key="group.category">
          <div
            v-if="
              mode === 'toutVoir' || group.features.some((f) => hasFeature(selectedPlan, f.key))
            "
          >
            <div class="mb-3 flex items-center gap-2">
              <UIcon
                :name="CATEGORY_ICONS[group.category]"
                class="h-4 w-4"
                style="color: var(--honey-deep)"
              />
              <h2
                class="text-[13px] font-bold uppercase tracking-[0.08em]"
                style="color: var(--text-secondary)"
              >
                {{ group.category }}
              </h2>
            </div>
            <div
              class="rounded-[14px] border divide-y"
              style="border-color: var(--border-default); background: white"
            >
              <div
                v-for="feature in group.features.filter(
                  (f) => mode === 'toutVoir' || hasFeature(selectedPlan, f.key),
                )"
                :key="feature.key"
                class="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div class="flex items-center gap-2.5">
                  <UIcon
                    name="i-lucide-check"
                    class="h-4 w-4 shrink-0"
                    style="color: var(--sage)"
                  />
                  <span class="text-[13.5px] font-medium" style="color: var(--text-primary)">{{
                    feature.label
                  }}</span>
                </div>
                <span
                  v-if="mode === 'toutVoir'"
                  class="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap"
                  :class="minPlanBadgeClass(minimumPlanFor(feature.key))"
                >
                  {{ minPlanBadgeLabel(minimumPlanFor(feature.key)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode "Comparer" : matrice -->
      <div v-else-if="mode === 'comparer'" class="overflow-x-auto">
        <div
          class="min-w-[640px] rounded-[18px] border"
          style="border-color: var(--border-default); background: white"
        >
          <!-- En-têtes de colonnes -->
          <div
            class="grid grid-cols-5 rounded-t-[18px] border-b bg-white"
            style="border-color: var(--border-default)"
          >
            <div class="sticky left-0 bg-white p-4 sm:p-5" />
            <div
              v-for="p in PLANS"
              :key="p"
              class="flex flex-col items-center justify-center gap-1 border-l p-4 sm:p-5"
              :style="
                p === 'pro'
                  ? 'border-color: color-mix(in srgb, var(--honey) 25%, transparent); background: var(--honey-soft);'
                  : 'border-color: var(--border-default);'
              "
            >
              <span
                class="text-[13px] font-bold"
                :style="p === 'pro' ? 'color: var(--honey-deep)' : 'color: var(--text-primary)'"
              >
                {{ PLAN_CONFIGS[p].label }}
              </span>
              <span class="text-[11px]" style="color: var(--text-tertiary)">{{
                prixMensuel(p)
              }}</span>
              <NuxtLink
                :to="`/tarifs?plan=${p}`"
                class="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                :style="
                  p === 'pro'
                    ? 'background: var(--honey); color: white;'
                    : 'background: var(--surface-muted); color: var(--text-secondary);'
                "
              >
                Choisir
              </NuxtLink>
            </div>
          </div>

          <!-- Capacité -->
          <div
            class="grid grid-cols-5 border-b"
            style="background: var(--surface-muted); border-color: var(--border-default)"
          >
            <div class="col-span-5 px-4 py-2 sm:px-5">
              <span
                class="text-[11px] font-bold uppercase tracking-[0.08em]"
                style="color: var(--text-secondary)"
              >
                Capacité
              </span>
            </div>
          </div>
          <div
            v-for="limit in LIMITS_CATALOG"
            :key="limit.key"
            class="grid grid-cols-5 border-b"
            style="border-color: var(--border-default)"
          >
            <div class="sticky left-0 flex items-center bg-white p-4 sm:p-5">
              <span class="text-[12.5px] font-medium" style="color: var(--text-primary)">{{
                limit.label
              }}</span>
            </div>
            <div
              v-for="p in PLANS"
              :key="p"
              class="flex items-center justify-center border-l p-4 sm:p-5"
              :style="
                p === 'pro'
                  ? 'border-color: color-mix(in srgb, var(--honey) 25%, transparent); background: var(--honey-soft);'
                  : 'border-color: var(--border-default);'
              "
            >
              <span
                class="text-[12px] font-semibold"
                :style="p === 'pro' ? 'color: var(--honey-deep)' : 'color: var(--text-secondary)'"
              >
                {{ limit.format(PLAN_CONFIGS[p].limites[limit.key]) }}
              </span>
            </div>
          </div>

          <!-- Catégories de fonctionnalités -->
          <template v-for="group in featureGroups" :key="group.category">
            <div
              class="grid grid-cols-5 border-b"
              style="background: var(--surface-muted); border-color: var(--border-default)"
            >
              <div class="col-span-5 px-4 py-2 sm:px-5">
                <span
                  class="text-[11px] font-bold uppercase tracking-[0.08em]"
                  style="color: var(--text-secondary)"
                >
                  {{ group.category }}
                </span>
              </div>
            </div>
            <div
              v-for="feature in group.features"
              :key="feature.key"
              class="grid grid-cols-5 border-b"
              style="border-color: var(--border-default)"
            >
              <div class="sticky left-0 flex items-center bg-white p-4 sm:p-5">
                <span class="text-[12.5px] font-medium" style="color: var(--text-primary)">{{
                  feature.label
                }}</span>
              </div>
              <div
                v-for="p in PLANS"
                :key="p"
                class="flex items-center justify-center border-l p-4 sm:p-5"
                :style="
                  p === 'pro'
                    ? 'border-color: color-mix(in srgb, var(--honey) 25%, transparent); background: var(--honey-soft);'
                    : 'border-color: var(--border-default);'
                "
              >
                <UIcon
                  v-if="hasFeature(p, feature.key)"
                  name="i-lucide-check"
                  class="h-4 w-4"
                  :style="p === 'pro' ? 'color: var(--honey-deep)' : 'color: var(--sage)'"
                />
                <UIcon
                  v-else
                  name="i-lucide-minus"
                  class="h-4 w-4"
                  style="color: var(--text-quaternary)"
                />
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-14 text-center">
        <p class="mb-3 text-[15px] font-semibold" style="color: var(--text-primary)">
          Prêt à choisir votre plan ?
        </p>
        <NuxtLink
          to="/tarifs"
          class="inline-flex items-center gap-2 rounded-[12px] px-7 py-3 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5"
          style="
            background: var(--honey);
            box-shadow: 0 4px 16px color-mix(in srgb, var(--honey) 30%, transparent);
          "
        >
          Voir les tarifs
        </NuxtLink>
      </div>
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import {
  PLANS,
  PLAN_CONFIGS,
  hasFeature,
  minimumPlanFor,
  getFeatureCatalogByCategory,
  formatStorageLimit,
  formatEquipeLimit,
  type Plan,
  type PlanLimits,
  type FeatureCategory,
} from '~/config/plans';

definePageMeta({ layout: false });

useSeoPage({
  title: 'Fonctionnalités APIGO — Le tout-en-un de la gestion apicole',
  description:
    "Découvrez toutes les fonctionnalités d'APIGO : terrain, pilotage, production, conformité, élevage, équipe. Filtrez par plan ou comparez les 4 formules côte à côte.",
  path: '/fonctionnalites',
});

type Mode = 'toutVoir' | 'parPlan' | 'comparer';

const MODES: { id: Mode; label: string }[] = [
  { id: 'toutVoir', label: 'Tout voir' },
  { id: 'parPlan', label: 'Par plan' },
  { id: 'comparer', label: 'Comparer' },
];

const gating = useGating();
const mode = ref<Mode>('toutVoir');
const selectedPlan = ref<Plan>(
  gating.plan.value && gating.plan.value !== 'decouverte' ? gating.plan.value : 'pro',
);

const featureGroups = getFeatureCatalogByCategory();

const CATEGORY_ICONS: Record<FeatureCategory, string> = {
  'Terrain & interventions': 'i-lucide-map-pin',
  'Pilotage & analytics': 'i-lucide-trending-up',
  'Production & commerce': 'i-lucide-package',
  'Élevage & génétique': 'i-lucide-dna',
  Conformité: 'i-lucide-file-check',
  'Équipe & communauté': 'i-lucide-users',
  Services: 'i-lucide-headset',
};

interface LimitCatalogEntry {
  key: keyof PlanLimits;
  label: string;
  format: (v: number) => string;
}

function formatCount(v: number): string {
  return v === Infinity ? 'Illimité' : `${v}`;
}

const LIMITS_CATALOG: LimitCatalogEntry[] = [
  { key: 'ruches', label: 'Ruches', format: formatCount },
  { key: 'ruchers', label: 'Ruchers', format: formatCount },
  { key: 'clients', label: 'Clients', format: formatCount },
  { key: 'facturesParMois', label: 'Factures / mois', format: formatCount },
  { key: 'templatesIntervention', label: "Modèles d'intervention", format: formatCount },
  { key: 'alertesActives', label: 'Alertes actives', format: formatCount },
  { key: 'photosStorageMb', label: 'Stockage photos', format: formatStorageLimit },
  {
    key: 'membresEquipe',
    label: "Membres d'équipe",
    format: (v) => (v === 0 ? 'Utilisateur unique' : formatEquipeLimit(v)),
  },
];

const MIN_PLAN_BADGE: Record<Plan, { label: string; class: string }> = {
  decouverte: { label: 'Dès Découverte', class: 'bg-stone-100 text-stone-600' },
  starter: { label: 'Dès Starter', class: 'bg-stone-100 text-stone-600' },
  pro: { label: 'Dès Pro', class: 'bg-[var(--honey-soft)] text-[var(--honey-deep)]' },
  expert: { label: 'Expert uniquement', class: 'bg-purple-100 text-purple-700' },
};

function minPlanBadgeLabel(plan: Plan): string {
  return MIN_PLAN_BADGE[plan].label;
}
function minPlanBadgeClass(plan: Plan): string {
  return MIN_PLAN_BADGE[plan].class;
}

function prixMensuel(plan: Plan): string {
  const p = PLAN_CONFIGS[plan].prix;
  return p ? `${p.mois.toFixed(2)}€/mois` : 'Gratuit';
}
</script>
