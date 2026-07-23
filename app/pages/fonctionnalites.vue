<template>
  <div class="min-h-screen bg-[#FAFAF8]">
    <LandingHeader />

    <main class="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
      <!-- Header -->
      <div class="mx-auto mb-9 max-w-2xl text-center">
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
          Survolez une carte pour voir ce que fait chaque fonctionnalité. Filtrez par plan pour
          savoir ce que chacun inclut, ou par domaine pour aller droit au but.
        </p>
      </div>

      <!-- FILTRE 1 — par plan (le comparateur, devenu filtre) -->
      <div class="mb-4 flex flex-col items-center gap-2.5">
        <span
          class="text-[10.5px] font-bold uppercase tracking-[0.1em]"
          style="color: var(--text-tertiary)"
        >
          Filtrer par plan
        </span>
        <div
          class="flex w-max max-w-full flex-wrap justify-center gap-1 rounded-[12px] border p-1"
          style="border-color: var(--border-default); background: var(--surface-muted)"
        >
          <button
            v-for="p in PLAN_FILTRES"
            :key="p.id"
            type="button"
            class="shrink-0 whitespace-nowrap rounded-[8px] px-4 py-1.5 text-xs font-medium transition-all duration-150"
            :class="planFiltre === p.id ? 'bg-white font-semibold shadow-sm' : ''"
            :style="
              planFiltre === p.id ? 'color: var(--text-primary)' : 'color: var(--text-tertiary)'
            "
            @click="planFiltre = p.id"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- FILTRE 2 — par domaine -->
      <div class="mb-8 flex flex-wrap items-center justify-center gap-1.5">
        <button
          v-for="c in CAT_FILTRES"
          :key="c.id"
          type="button"
          class="rounded-full border px-3 py-1 text-[12px] font-medium transition-all"
          :style="
            categorieFiltre === c.id
              ? 'background: var(--honey); border-color: var(--honey); color: #fff;'
              : 'background: white; border-color: var(--border-default); color: var(--text-secondary);'
          "
          @click="categorieFiltre = c.id"
        >
          {{ c.label }}
        </button>
      </div>

      <!-- Capacité du plan sélectionné (quand un plan précis est filtré) -->
      <div
        v-if="planFiltre !== 'tous'"
        class="mb-8 rounded-[14px] border p-4 sm:p-5"
        style="border-color: var(--border-default); background: white"
      >
        <p class="mb-3 text-[12px] font-bold" style="color: var(--text-primary)">
          Ce qu'inclut le plan {{ PLAN_CONFIGS[planFiltre].label }} — capacité
        </p>
        <div class="flex flex-wrap gap-x-6 gap-y-2">
          <span
            v-for="limit in LIMITS_CATALOG"
            :key="limit.key"
            class="text-[12.5px]"
            style="color: var(--text-secondary)"
          >
            {{ limit.label }} :
            <strong style="color: var(--honey-deep)">{{
              limit.format(PLAN_CONFIGS[planFiltre].limites[limit.key])
            }}</strong>
          </span>
        </div>
      </div>

      <!-- Cartes réversibles, groupées par domaine -->
      <div class="space-y-10">
        <div v-for="group in groupesFiltres" :key="group.category">
          <div class="mb-3.5 flex items-center gap-2">
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
            <span class="text-[12px]" style="color: var(--text-tertiary)"
              >· {{ group.features.length }}</span
            >
          </div>

          <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Carte flip : survol OU focus (tap mobile / clavier) la retourne -->
            <div
              v-for="f in group.features"
              :key="f.key"
              class="group h-[140px] cursor-default outline-none [perspective:1000px]"
              tabindex="0"
              role="button"
              :aria-label="`${f.label} — ${f.description}`"
            >
              <div
                class="relative h-full w-full rounded-[14px] transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]"
              >
                <!-- RECTO -->
                <div
                  class="absolute inset-0 flex flex-col justify-between rounded-[14px] border p-4 [backface-visibility:hidden]"
                  style="border-color: var(--border-default); background: white"
                >
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-[10px]"
                    style="background: var(--honey-soft)"
                  >
                    <UIcon
                      :name="CATEGORY_ICONS[group.category]"
                      class="h-4 w-4"
                      style="color: var(--honey-deep)"
                    />
                  </div>
                  <div>
                    <h3
                      class="line-clamp-2 text-[13.5px] font-semibold leading-snug tracking-[-0.01em]"
                      style="color: var(--text-primary)"
                    >
                      {{ f.label }}
                    </h3>
                    <span
                      class="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      :class="MIN_PLAN_BADGE[minimumPlanFor(f.key)].class"
                    >
                      {{ MIN_PLAN_BADGE[minimumPlanFor(f.key)].label }}
                    </span>
                  </div>
                </div>

                <!-- VERSO -->
                <div
                  class="absolute inset-0 flex flex-col justify-center rounded-[14px] border p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  style="border-color: var(--honey); background: var(--honey-soft)"
                >
                  <p
                    class="mb-1 text-[12px] font-bold tracking-[-0.01em]"
                    style="color: var(--honey-deep)"
                  >
                    {{ f.label }}
                  </p>
                  <p class="text-[12.5px] leading-relaxed" style="color: var(--text-primary)">
                    {{ f.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Aucun résultat -->
        <div
          v-if="!groupesFiltres.length"
          class="rounded-[14px] border p-8 text-center text-[13.5px]"
          style="
            border-color: var(--border-default);
            background: white;
            color: var(--text-tertiary);
          "
        >
          Aucune fonctionnalité ne correspond à ce filtre.
          <button
            type="button"
            class="ml-1 font-semibold underline"
            style="color: var(--honey-deep)"
            @click="reinitialiser"
          >
            Réinitialiser
          </button>
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
    "Découvrez toutes les fonctionnalités d'APIGO : terrain, pilotage, production, conformité, élevage, équipe. Une carte par fonctionnalité, filtrable par plan et par domaine.",
  path: '/fonctionnalites',
});

const gating = useGating();

// Filtre plan : 'tous' OU un plan précis (le comparateur devenu filtre).
type PlanFiltre = Plan | 'tous';
const planFiltre = ref<PlanFiltre>(
  gating.plan.value && gating.plan.value !== 'decouverte' ? gating.plan.value : 'tous',
);
const PLAN_FILTRES: { id: PlanFiltre; label: string }[] = [
  { id: 'tous', label: 'Tous les plans' },
  ...PLANS.map((p) => ({ id: p as PlanFiltre, label: PLAN_CONFIGS[p].label })),
];

// Filtre domaine : 'toutes' OU une catégorie.
type CatFiltre = FeatureCategory | 'toutes';
const categorieFiltre = ref<CatFiltre>('toutes');

const featureGroups = getFeatureCatalogByCategory();
const CAT_FILTRES: { id: CatFiltre; label: string }[] = [
  { id: 'toutes', label: 'Tous les domaines' },
  ...featureGroups.map((g) => ({ id: g.category as CatFiltre, label: g.category })),
];

// Groupes filtrés : par domaine (chip) puis, si un plan précis est choisi, on ne
// garde que les fonctionnalités qu'il inclut. Un groupe vidé disparaît.
const groupesFiltres = computed(() =>
  featureGroups
    .filter((g) => categorieFiltre.value === 'toutes' || g.category === categorieFiltre.value)
    .map((g) => ({
      category: g.category,
      features: g.features.filter(
        (f) => planFiltre.value === 'tous' || hasFeature(planFiltre.value, f.key),
      ),
    }))
    .filter((g) => g.features.length > 0),
);

function reinitialiser(): void {
  planFiltre.value = 'tous';
  categorieFiltre.value = 'toutes';
}

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
  { key: 'facturesParMois', label: 'Factures/mois', format: formatCount },
  { key: 'photosStorageMb', label: 'Stockage photos', format: formatStorageLimit },
  {
    key: 'membresEquipe',
    label: 'Équipe',
    format: (v) => (v === 0 ? 'Utilisateur unique' : formatEquipeLimit(v)),
  },
];

const MIN_PLAN_BADGE: Record<Plan, { label: string; class: string }> = {
  decouverte: { label: 'Dès Découverte', class: 'bg-stone-100 text-stone-600' },
  starter: { label: 'Dès Starter', class: 'bg-stone-100 text-stone-600' },
  pro: { label: 'Dès Pro', class: 'bg-[var(--honey-soft)] text-[var(--honey-deep)]' },
  expert: { label: 'Expert', class: 'bg-purple-100 text-purple-700' },
};
</script>
