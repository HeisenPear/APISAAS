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

    <h1 class="mb-6 text-2xl font-bold tracking-tight text-stone-900">Nouvelle intervention</h1>

    <!-- Step 1: Select ruche -->
    <div v-if="step === 1" class="space-y-6">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Sélectionner une ruche
        </h2>

        <div v-if="ruchesLoading" class="flex items-center justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-stone-400" />
        </div>

        <UiEmptyState
          v-else-if="allRuches.length === 0"
          icon="i-lucide-box"
          title="Aucune ruche"
          description="Ajoutez d'abord des ruches"
          action-label="Ajouter une ruche"
          @action="navigateTo('/ruches/nouveau')"
        />

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button
            v-for="ruche in allRuches"
            :key="ruche.id"
            type="button"
            class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all"
            :class="
              selectedRucheId === ruche.id
                ? 'border-amber-500 bg-amber-50 shadow-sm'
                : 'border-stone-200/60 bg-white hover:border-stone-300'
            "
            @click="selectRuche(ruche)"
          >
            <UIcon
              name="i-lucide-box"
              class="h-6 w-6"
              :class="selectedRucheId === ruche.id ? 'text-amber-600' : 'text-stone-400'"
            />
            <span class="text-sm font-medium text-stone-900">{{ ruche.numero }}</span>
            <span class="text-xs text-stone-400">{{ ruche.type }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Select categories -->
    <div v-if="step === 2" class="space-y-6">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="mb-2 flex items-center gap-2 text-sm text-stone-500">
          <UIcon name="i-lucide-box" class="h-4 w-4" />
          <span>{{ selectedRuche?.numero }}</span>
          <button type="button" class="text-amber-600 hover:underline" @click="step = 1">
            Changer
          </button>
        </div>

        <InterventionsInterventionGrid v-model="selectedCategories" :multi="true" />
      </div>

      <div v-if="selectedCategories.length > 0" class="flex justify-end">
        <UButton label="Continuer" icon="i-lucide-arrow-right" color="primary" @click="step = 3" />
      </div>
    </div>

    <!-- Step 3: Fill forms + submit -->
    <div v-if="step === 3" class="space-y-6">
      <!-- Context bar -->
      <div class="flex flex-wrap items-center gap-3 text-sm text-stone-500">
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-box" class="h-4 w-4" />
          {{ selectedRuche?.numero }}
        </span>
        <InterventionsInterventionBadge v-for="t in selectedCategories" :key="t" :type="t" />
        <button type="button" class="text-amber-600 hover:underline" @click="step = 2">
          Modifier
        </button>
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
          :ruches="otherRuches"
          @update:model-value="(val: Record<string, unknown>) => updateCategoryData(cat, val)"
        />
        <p v-else class="text-sm text-stone-400">Formulaire en cours de développement</p>
      </div>

      <!-- Notes générales -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Notes générales
        </h2>
        <textarea
          v-model="formNotes"
          :rows="3"
          class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          placeholder="Observations, remarques..."
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
        <UButton
          label="Enregistrer"
          icon="i-lucide-check"
          color="primary"
          :loading="saving"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import { CATEGORIES_INTERVENTION } from '~/types/interventions';
import type { CategorieIntervention, BulkInterventionPayload } from '~/types/interventions';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const postAction = usePostAction();
const { createBulkIntervention } = useInterventions();
const { ruchers: allRuchers } = useRuchers();

const step = ref(1);
const selectedRucheId = ref('');
const selectedRuche = ref<(Ruche & { rucherNom?: string }) | null>(null);
const selectedCategories = ref<CategorieIntervention[]>([]);
const saving = ref(false);

const formDate = ref(
  route.query.date ? `${route.query.date}T09:00` : new Date().toISOString().slice(0, 16),
);
const formMeteo = reactive<{ temperature?: number }>({});
const formNotes = ref('');
const categoriesData = reactive<Record<string, Record<string, unknown>>>({});

// Form component map
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
  deplacement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormDeplacement.vue'),
  ),
  varroa: defineAsyncComponent(() => import('~/components/interventions/forms/FormVarroa.vue')),
  pesee: defineAsyncComponent(() => import('~/components/interventions/forms/FormPesee.vue')),
  commentaire: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormCommentaire.vue'),
  ),
  empilement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormEmpilement.vue'),
  ),
  sanitaire: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormSanitaire.vue'),
  ),
  transvasement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormTransvasement.vue'),
  ),
};

// Fetch ruches
const { data: ruchesData, status: ruchesStatus } = useFetch<
  ApiListResponse<Ruche & { rucherNom?: string }>
>('/api/ruches', {
  query: { limit: 100 },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

const ruchesLoading = computed(
  () => ruchesStatus.value !== 'success' && ruchesStatus.value !== 'error',
);
const allRuches = computed(() => ruchesData.value?.data ?? []);
const otherRuches = computed(() => allRuches.value.filter((r) => r.id !== selectedRucheId.value));

// Auto-select ruche from query param
watch(
  allRuches,
  (ruches) => {
    const rucheId = route.query.rucheId as string;
    if (rucheId && ruches.length > 0 && !selectedRucheId.value) {
      const found = ruches.find((r) => r.id === rucheId);
      if (found) selectRuche(found);
    }
  },
  { once: true },
);

function selectRuche(ruche: Ruche & { rucherNom?: string }) {
  selectedRucheId.value = ruche.id;
  selectedRuche.value = ruche;

  // preselect: liste de catégories séparées par virgule (ex: controle,pesee)
  const preselectQuery = route.query.preselect as string | undefined;
  const typeQuery = route.query.type as string | undefined;

  if (preselectQuery) {
    const cats = preselectQuery
      .split(',')
      .filter((c) =>
        (CATEGORIES_INTERVENTION as readonly string[]).includes(c),
      ) as CategorieIntervention[];
    if (cats.length > 0) {
      selectedCategories.value = cats;
      step.value = cats.length === 1 ? 3 : 2;
      return;
    }
  }

  if (typeQuery && (CATEGORIES_INTERVENTION as readonly string[]).includes(typeQuery)) {
    selectedCategories.value = [typeQuery as CategorieIntervention];
    step.value = 3;
  } else {
    step.value = 2;
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
    deplacement: { rucherDestinationId: '' },
    varroa: { sousAction: 'comptage_plancher', nombreVarroas: 0, dureeJours: 3 },
    pesee: { poidsKg: 1, typePesee: 'totale' },
    commentaire: { texte: '' },
    empilement: { rucheDestinationId: '' },
    sanitaire: { typeEvenement: 'essaim_mort' },
    transvasement: { rucheDestinationId: '', cadresTransferes: 0, devenirRucheSource: 'stockage' },
  };
  return defaults[cat] ?? {};
}

function updateCategoryData(cat: string, val: Record<string, unknown>) {
  categoriesData[cat] = val;
}

async function handleSubmit() {
  if (!selectedRucheId.value || selectedCategories.value.length === 0) return;

  saving.value = true;
  try {
    // Build bulk payload
    const categories: Record<string, Record<string, unknown>> = {};
    for (const cat of selectedCategories.value) {
      categories[cat] = categoriesData[cat] ?? getDefaultData(cat);
    }

    const payload: BulkInterventionPayload = {
      rucheId: selectedRucheId.value,
      dateVisite: new Date(formDate.value).toISOString(),
      notes: formNotes.value || undefined,
      meteo:
        cleanNumber(formMeteo.temperature) !== undefined
          ? { temperature: cleanNumber(formMeteo.temperature) }
          : undefined,
      categories,
    };

    const result = await createBulkIntervention(payload);

    const hasRecolte = selectedCategories.value.includes('recolte');
    const isSanitaireMort =
      selectedCategories.value.includes('sanitaire') &&
      (categoriesData.sanitaire as { typeEvenement?: string } | undefined)?.typeEvenement ===
        'essaim_mort';

    const title =
      selectedCategories.value.length > 1
        ? `${selectedCategories.value.length} catégories enregistrées`
        : 'Intervention enregistrée';

    let followUp: { label: string; to: string } | undefined;
    if (isSanitaireMort) {
      followUp = {
        label: 'Nettoyer cette ruche →',
        to: `/interventions/nouvelle?rucheId=${selectedRucheId.value}&preselect=sanitaire&from=/ruches/${selectedRucheId.value}`,
      };
    } else if (hasRecolte) {
      followUp = {
        label: 'Compléter la récolte →',
        to: '/production',
      };
    }

    postAction.execute(
      'intervention:created',
      { id: result?.id, extra: { rucheId: selectedRucheId.value } },
      {
        toast: { title },
        returnToOrigin: true,
        followUp,
      },
    );

    // Fallback si pas de `from` dans les query params
    if (!route.query.from) {
      await navigateTo('/interventions');
    }
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}
</script>
