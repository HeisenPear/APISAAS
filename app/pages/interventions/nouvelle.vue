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
          Selectionner une ruche
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

    <!-- Step 2: Select intervention types -->
    <div v-if="step === 2" class="space-y-6">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="mb-2 flex items-center gap-2 text-sm text-stone-500">
          <UIcon name="i-lucide-box" class="h-4 w-4" />
          <span>{{ selectedRuche?.numero }}</span>
          <button type="button" class="text-amber-600 hover:underline" @click="step = 1">
            Changer
          </button>
        </div>

        <InterventionsInterventionGrid v-model="selectedTypes" :multi="true" />
      </div>

      <div v-if="selectedTypes.length > 0" class="flex justify-end">
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
        <InterventionsInterventionBadge v-for="t in selectedTypes" :key="t" :type="t" />
        <button type="button" class="text-amber-600 hover:underline" @click="step = 2">
          Modifier
        </button>
      </div>

      <!-- Date + Meteo -->
      <div class="rounded-2xl border border-stone-200/60 bg-white px-5 py-4 shadow-sm">
        <div class="flex items-end gap-3">
          <!-- Date (toujours visible) -->
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-stone-400 uppercase tracking-wider"
              >Date</label
            >
            <input
              v-model="formDate"
              type="datetime-local"
              class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <!-- Température — masquée pour rendez-vous pro -->
          <div v-if="!isRendezVousPro" class="w-32 shrink-0">
            <label class="mb-1 block text-xs font-medium text-stone-400 uppercase tracking-wider"
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

      <!-- Dynamic forms per selected type -->
      <div
        v-for="type in selectedTypes"
        :key="type"
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
      >
        <div class="mb-4 flex items-center gap-2">
          <InterventionsInterventionBadge :type="type" />
        </div>

        <component
          :is="formComponentMap[type]"
          v-if="formComponentMap[type]"
          :model-value="donneesMap[type] || getDefaultDonnees(type)"
          @update:model-value="(val: unknown) => updateDonnees(type, val)"
        />
        <p v-else class="text-sm text-stone-400">Formulaire en cours de developpement</p>
      </div>

      <!-- Commentaire + photos -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Notes generales
        </h2>
        <textarea
          v-model="formCommentaire"
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
import { TYPES_INTERVENTION } from '~/types/interventions';
import type { TypeIntervention, DonneesIntervention } from '~/types/interventions';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const { createIntervention } = useInterventions();

const step = ref(1);
const selectedRucheId = ref('');
const selectedRuche = ref<(Ruche & { rucherNom?: string }) | null>(null);
const selectedTypes = ref<TypeIntervention[]>([]);
const saving = ref(false);
// Form data
// Pré-remplit la date depuis ?date=YYYY-MM-DD (venant du calendrier)
const formDate = ref(
  route.query.date ? `${route.query.date}T09:00` : new Date().toISOString().slice(0, 16),
);
const formMeteo = reactive<{ temperature?: number }>({});
const formCommentaire = ref('');
const donneesMap = reactive<Record<string, unknown>>({});

// Form component resolution
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
  reine: defineAsyncComponent(() => import('~/components/interventions/forms/FormReine.vue')),
  rendez_vous_pro: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormRendezVousPro.vue'),
  ),
};

// Fetch ruches — SSR fetch to ensure auth cookies are properly forwarded
const { data: ruchesData, status: ruchesStatus } = useFetch<
  ApiListResponse<Ruche & { rucherNom?: string }>
>('/api/ruches', {
  query: { limit: 100 },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

const ruchesLoading = computed(
  () => ruchesStatus.value !== 'success' && ruchesStatus.value !== 'error',
);
const isRendezVousPro = computed(
  () => selectedTypes.value.length === 1 && selectedTypes.value[0] === 'rendez_vous_pro',
);
const allRuches = computed(() => ruchesData.value?.data ?? []);

// Auto-select ruche from query param when data loads
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
  // Pré-sélectionner le type si fourni en query param (ex: depuis le calendrier)
  const typeQuery = route.query.type as TypeIntervention | undefined;
  if (typeQuery && TYPES_INTERVENTION.includes(typeQuery as TypeIntervention)) {
    selectedTypes.value = [typeQuery as TypeIntervention];
    step.value = 3;
  } else {
    step.value = 2;
  }
}

function getDefaultDonnees(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    materiel: { action: 'ajout', elements: [] },
    controle: {
      reine_vue: null,
      couvain_present: null,
      cellules_royales: null,
      reserves_presentes: null,
      force_colonie: 2,
      comportement: 'calme',
    },
    recolte: { type_produit: 'miel', quantite: 0, unite: 'kg', numero_lot: '' },
    nourrissement: { type_nourriture: 'sirop_sucre', quantite: 1, unite: 'kg' },
    essaimage: { essaim_recupere: false },
    division: {
      nombre_divisions: 1,
      cadres_par_division: 3,
      reine_dans_division: false,
      ruches_destination_ids: [],
    },
    deplacement: { rucher_destination_id: '', motif: 'reorganisation' },
    varroa: { sous_action: 'comptage_plancher' },
    pesee: { poids_kg: 0, type_pesee: 'totale' },
    commentaire: { tags: [] },
    empilement: {
      ruche_destination_id: '',
      methode_reunion: 'papier_journal',
      devenir_ruche_source: 'stockage',
    },
    sanitaire: { sous_action: 'essaim_mort' },
    transvasement: {
      ruche_destination_id: '',
      cadres_transferes: 0,
      devenir_ruche_source: 'stockage',
      origine: 'transvasement',
    },
    reine: { sous_action: 'marquage' },
    rendez_vous_pro: { type_rdv: 'autre', statut: 'planifie' },
  };
  return defaults[type] ?? {};
}

function updateDonnees(type: string, val: unknown) {
  donneesMap[type] = val;
}

async function handleSubmit() {
  if (!selectedRucheId.value || selectedTypes.value.length === 0) return;

  saving.value = true;
  try {
    // Create one intervention per selected type
    for (const type of selectedTypes.value) {
      const donnees = (donneesMap[type] ?? {}) as DonneesIntervention;
      await createIntervention({
        rucheId: selectedRucheId.value,
        rucherId: selectedRuche.value?.rucherId,
        date: new Date(formDate.value).toISOString(),
        type,
        meteo: formMeteo.temperature != null ? { temperature: formMeteo.temperature } : undefined,
        donnees,
        commentaire: formCommentaire.value || undefined,
      });
    }

    notifications.success(
      selectedTypes.value.length > 1
        ? `${selectedTypes.value.length} interventions enregistrees`
        : 'Intervention enregistree',
    );
    await navigateTo('/interventions');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}
</script>
