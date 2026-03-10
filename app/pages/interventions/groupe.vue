<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/interventions"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux interventions
    </NuxtLink>

    <!-- Page title with badge -->
    <div class="mb-6 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
        <UIcon name="i-lucide-layers" class="h-5 w-5 text-emerald-600" />
      </div>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Intervention groupée</h1>
        <p class="text-sm text-stone-500">Appliquer la même action sur plusieurs ruches</p>
      </div>
    </div>

    <!-- Step indicator -->
    <div class="mb-6 flex items-center gap-2">
      <div v-for="(label, i) in stepLabels" :key="i" class="flex items-center gap-2">
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors"
          :class="
            step > i + 1
              ? 'bg-emerald-500 text-white'
              : step === i + 1
                ? 'bg-amber-500 text-white'
                : 'bg-stone-200 text-stone-500'
          "
        >
          <UIcon v-if="step > i + 1" name="i-lucide-check" class="h-3 w-3" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          class="text-xs font-medium transition-colors"
          :class="step === i + 1 ? 'text-stone-900' : 'text-stone-400'"
          >{{ label }}</span
        >
        <div v-if="i < stepLabels.length - 1" class="h-px w-6 bg-stone-200" />
      </div>
    </div>

    <!-- ─────────────────── Step 1: Multi-select ruches ─────────────────── -->
    <div v-if="step === 1" class="space-y-4">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Sélectionner les ruches
          </h2>
          <div class="flex items-center gap-2">
            <!-- Filter by rucher -->
            <select
              v-model="filterRucherId"
              class="h-8 rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs text-stone-600 focus:border-amber-400 focus:outline-none"
            >
              <option value="">Tous les ruchers</option>
              <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
            </select>
            <!-- Select all / none -->
            <button
              type="button"
              class="h-8 rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
              @click="toggleSelectAll"
            >
              {{ selectedRucheIds.length === filteredRuches.length ? 'Tout désél.' : 'Tout sél.' }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="ruchesLoading" class="flex items-center justify-center py-10">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-stone-400" />
        </div>

        <!-- Empty -->
        <UiEmptyState
          v-else-if="allRuches.length === 0"
          icon="i-lucide-box"
          title="Aucune ruche"
          description="Ajoutez d'abord des ruches"
          action-label="Ajouter une ruche"
          @action="navigateTo('/ruches/nouveau')"
        />

        <!-- Grid multi-select -->
        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button
            v-for="ruche in filteredRuches"
            :key="ruche.id"
            type="button"
            class="relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-left transition-all"
            :class="
              isSelected(ruche.id)
                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                : 'border-stone-200/60 bg-white hover:border-stone-300'
            "
            @click="toggleRuche(ruche.id)"
          >
            <!-- Checkbox indicator -->
            <div
              class="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors"
              :class="
                isSelected(ruche.id)
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-stone-300 bg-white'
              "
            >
              <UIcon
                v-if="isSelected(ruche.id)"
                name="i-lucide-check"
                class="h-2.5 w-2.5 text-white"
              />
            </div>

            <UIcon
              name="i-lucide-box"
              class="h-6 w-6"
              :class="isSelected(ruche.id) ? 'text-emerald-600' : 'text-stone-400'"
            />
            <span class="text-sm font-semibold text-stone-900">{{ ruche.numero }}</span>
            <span class="text-[11px] text-stone-400">{{ ruche.type }}</span>
            <span v-if="ruche.rucherNom" class="truncate text-[10px] text-stone-400">
              {{ ruche.rucherNom }}
            </span>
          </button>
        </div>
      </div>

      <!-- Selection summary -->
      <div
        v-if="selectedRucheIds.length > 0"
        class="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
      >
        <span class="text-sm font-medium text-emerald-800">
          <span class="font-bold">{{ selectedRucheIds.length }}</span>
          ruche{{ selectedRucheIds.length > 1 ? 's' : '' }} sélectionnée{{
            selectedRucheIds.length > 1 ? 's' : ''
          }}
        </span>
        <UButton
          label="Continuer"
          icon="i-lucide-arrow-right"
          color="primary"
          size="sm"
          @click="step = 2"
        />
      </div>
    </div>

    <!-- ─────────────────── Step 2: Select categories ─────────────────── -->
    <div v-if="step === 2" class="space-y-4">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <!-- Context bar -->
        <div class="mb-4 flex items-center gap-2 text-sm">
          <div
            class="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700"
          >
            <UIcon name="i-lucide-layers" class="h-3.5 w-3.5" />
            <span class="font-medium"
              >{{ selectedRucheIds.length }} ruche{{ selectedRucheIds.length > 1 ? 's' : '' }}</span
            >
          </div>
          <button type="button" class="text-xs text-amber-600 hover:underline" @click="step = 1">
            Modifier
          </button>
        </div>

        <InterventionsInterventionGrid v-model="selectedCategories" :multi="true" />
      </div>

      <div v-if="selectedCategories.length > 0" class="flex justify-end">
        <UButton label="Continuer" icon="i-lucide-arrow-right" color="primary" @click="step = 3" />
      </div>
    </div>

    <!-- ─────────────────── Step 3: Fill forms + submit ─────────────────── -->
    <div v-if="step === 3" class="space-y-6">
      <!-- Context bar -->
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <div
          class="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700"
        >
          <UIcon name="i-lucide-layers" class="h-3.5 w-3.5" />
          <span class="font-medium"
            >{{ selectedRucheIds.length }} ruche{{ selectedRucheIds.length > 1 ? 's' : '' }}</span
          >
        </div>
        <InterventionsInterventionBadge v-for="t in selectedCategories" :key="t" :type="t" />
        <button type="button" class="text-xs text-amber-600 hover:underline" @click="step = 2">
          Modifier
        </button>
      </div>

      <!-- Impact banner -->
      <div class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <UIcon name="i-lucide-info" class="h-4 w-4 shrink-0 text-amber-600" />
        <p class="text-sm text-amber-800">
          Ces paramètres seront appliqués à
          <strong
            >{{ selectedRucheIds.length }} ruche{{ selectedRucheIds.length > 1 ? 's' : '' }}</strong
          >
          simultanément. Les catégories <strong>Déplacement</strong>, <strong>Empilement</strong> et
          <strong>Transvasement</strong>
          ne sont pas disponibles en mode groupé.
        </p>
      </div>

      <!-- Date + Météo -->
      <div class="rounded-2xl border border-stone-200/60 bg-white px-5 py-4 shadow-sm">
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400"
              >Date</label
            >
            <input
              v-model="formDate"
              type="datetime-local"
              class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div class="w-32 shrink-0">
            <label class="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400"
              >Temp.</label
            >
            <div class="relative">
              <UIcon
                name="i-lucide-thermometer"
                class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
              />
              <input
                v-model.number="formMeteo.temperature"
                type="number"
                step="0.5"
                min="-20"
                max="50"
                class="h-9 w-full rounded-lg border border-stone-200 pl-7 pr-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                placeholder="22°C"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic forms per selected category -->
      <div
        v-for="cat in selectedCategories"
        :key="cat"
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
      >
        <div class="mb-4 flex items-center gap-2">
          <InterventionsInterventionBadge :type="cat" />
        </div>

        <component
          :is="formComponentMap[cat]"
          v-if="formComponentMap[cat]"
          :model-value="categoriesData[cat] ?? getDefaultData(cat)"
          :ruchers="allRuchers"
          :ruches="allRuches"
          @update:model-value="(val: Record<string, unknown>) => updateCategoryData(cat, val)"
        />
        <p v-else class="text-sm text-stone-400">Formulaire en cours de développement</p>
      </div>

      <!-- Notes générales -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Notes générales
        </h2>
        <textarea
          v-model="formNotes"
          :rows="3"
          class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          placeholder="Observations communes à toutes les ruches..."
        />
      </div>

      <!-- Submit -->
      <div class="flex items-center justify-end gap-3">
        <UButton
          label="Annuler"
          variant="ghost"
          color="neutral"
          @click="navigateTo('/interventions')"
        />
        <UButton icon="i-lucide-check" color="primary" :loading="saving" @click="handleSubmit">
          Enregistrer sur {{ selectedRucheIds.length }} ruche{{
            selectedRucheIds.length > 1 ? 's' : ''
          }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { CategorieIntervention } from '~/types/interventions';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createBulkGroupIntervention } = useInterventions();
const { ruchers: allRuchers } = useRuchers();

const step = ref(1);
const selectedRucheIds = ref<string[]>([]);
const selectedCategories = ref<CategorieIntervention[]>([]);
const filterRucherId = ref('');
const saving = ref(false);

const formDate = ref(new Date().toISOString().slice(0, 16));
const formMeteo = reactive<{ temperature?: number }>({});
const formNotes = ref('');
const categoriesData = reactive<Record<string, Record<string, unknown>>>({});

const stepLabels = ['Ruches', 'Catégories', 'Paramètres'];

// Form component map (same as nouvelle.vue, excluding ruche-specific ones)
const formComponentMap: Record<string, ReturnType<typeof defineAsyncComponent> | undefined> = {
  controle: defineAsyncComponent(() => import('~/components/interventions/forms/FormControle.vue')),
  materiel: defineAsyncComponent(() => import('~/components/interventions/forms/FormMateriel.vue')),
  recolte: defineAsyncComponent(() => import('~/components/interventions/forms/FormRecolte.vue')),
  nourrissement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormNourrissement.vue'),
  ),
  essaimage: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormEssaimage.vue'),
  ),
  division: defineAsyncComponent(() => import('~/components/interventions/forms/FormDivision.vue')),
  varroa: defineAsyncComponent(() => import('~/components/interventions/forms/FormVarroa.vue')),
  pesee: defineAsyncComponent(() => import('~/components/interventions/forms/FormPesee.vue')),
  commentaire: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormCommentaire.vue'),
  ),
  sanitaire: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormSanitaire.vue'),
  ),
  // deplacement / empilement / transvasement exclus (ruche-spécifique)
};

// Fetch ruches
const { data: ruchesData, status: ruchesStatus } = useFetch<
  ApiListResponse<Ruche & { rucherNom?: string }>
>('/api/ruches', {
  key: 'groupe-ruches-list',
  query: { limit: 200 },
  default: () => ({ data: [], pagination: { page: 1, limit: 200, total: 0, totalPages: 0 } }),
});

const ruchesLoading = computed(
  () => ruchesStatus.value !== 'success' && ruchesStatus.value !== 'error',
);
const allRuches = computed(() => ruchesData.value?.data ?? []);

const filteredRuches = computed(() => {
  if (!filterRucherId.value) return allRuches.value;
  return allRuches.value.filter((r) => r.rucherId === filterRucherId.value);
});

function isSelected(id: string) {
  return selectedRucheIds.value.includes(id);
}

function toggleRuche(id: string) {
  const idx = selectedRucheIds.value.indexOf(id);
  if (idx === -1) {
    selectedRucheIds.value.push(id);
  } else {
    selectedRucheIds.value.splice(idx, 1);
  }
}

function toggleSelectAll() {
  const ids = filteredRuches.value.map((r) => r.id);
  const allSelected = ids.every((id) => selectedRucheIds.value.includes(id));
  if (allSelected) {
    selectedRucheIds.value = selectedRucheIds.value.filter((id) => !ids.includes(id));
  } else {
    for (const id of ids) {
      if (!selectedRucheIds.value.includes(id)) selectedRucheIds.value.push(id);
    }
  }
}

function getDefaultData(cat: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    materiel: { elements: [] },
    controle: {
      reineVue: null,
      couvainPresent: null,
      celluleRoyale: null,
      reserves: null,
      forceColonie: 2,
      comportement: 'calme',
    },
    recolte: { typeProduit: 'miel' },
    nourrissement: { type: 'sirop_sucre', quantite: 1, unite: 'kg' },
    essaimage: { essaimRecupere: false },
    division: { nombreDivisions: 1 },
    varroa: { sousAction: 'comptage_plancher', nombreVarroas: 0, dureeJours: 3 },
    pesee: { poidsKg: 0, typePesee: 'totale' },
    commentaire: { texte: '' },
    sanitaire: { typeEvenement: 'essaim_mort' },
  };
  return defaults[cat] ?? {};
}

function updateCategoryData(cat: string, val: Record<string, unknown>) {
  categoriesData[cat] = val;
}

async function handleSubmit() {
  if (selectedRucheIds.value.length === 0 || selectedCategories.value.length === 0) return;

  saving.value = true;
  try {
    const categories: Record<string, Record<string, unknown>> = {};
    for (const cat of selectedCategories.value) {
      categories[cat] = categoriesData[cat] ?? getDefaultData(cat);
    }

    await createBulkGroupIntervention({
      rucheIds: selectedRucheIds.value,
      dateVisite: new Date(formDate.value).toISOString(),
      notes: formNotes.value || undefined,
      meteo: formMeteo.temperature != null ? { temperature: formMeteo.temperature } : undefined,
      categories,
    });

    notifications.success(
      `${selectedCategories.value.length} catégorie${selectedCategories.value.length > 1 ? 's' : ''} enregistrée${selectedCategories.value.length > 1 ? 's' : ''} sur ${selectedRucheIds.value.length} ruche${selectedRucheIds.value.length > 1 ? 's' : ''}`,
    );
    await navigateTo('/interventions');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement groupé"));
  } finally {
    saving.value = false;
  }
}
</script>
