<template>
  <div class="space-y-6">
    <!-- Back link -->
    <NuxtLink
      :to="route.query.from ? String(route.query.from) : '/interventions'"
      class="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour
    </NuxtLink>

    <!-- ══════════════════════════════════════════ -->
    <!-- FLOW : Rendez-vous professionnel           -->
    <!-- ══════════════════════════════════════════ -->
    <template v-if="isRdvPro">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <UIcon name="i-lucide-briefcase" class="h-5 w-5 text-violet-600" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Rendez-vous professionnel</h1>
      </div>

      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="space-y-4">
          <!-- Date -->
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400"
              >Date &amp; heure</label
            >
            <input
              v-model="rdvDate"
              type="datetime-local"
              class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <!-- Type RDV -->
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400"
              >Type de rendez-vous</label
            >
            <select
              v-model="rdvType"
              class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="veterinaire">Vétérinaire</option>
              <option value="syndicat">Syndicat</option>
              <option value="fournisseur">Fournisseur</option>
              <option value="client">Client</option>
              <option value="administration">Administration</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <!-- Contact -->
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400"
              >Avec qui (optionnel)</label
            >
            <input
              v-model="rdvContact"
              type="text"
              placeholder="Nom ou organisme…"
              class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <!-- Notes -->
          <div>
            <label class="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400"
              >Notes</label
            >
            <textarea
              v-model="rdvNotes"
              :rows="3"
              placeholder="Observations, remarques…"
              class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3">
        <UButton
          label="Annuler"
          variant="ghost"
          color="neutral"
          @click="navigateTo('/calendrier')"
        />
        <UButton
          label="Enregistrer"
          icon="i-lucide-check"
          color="primary"
          :loading="saving"
          @click="handleRdvProSubmit"
        />
      </div>
    </template>

    <!-- ══════════════════════════════════════════ -->
    <!-- FLOW NORMAL : Wizard 3 étapes             -->
    <!-- ══════════════════════════════════════════ -->
    <template v-else>
      <h1 class="text-2xl font-bold tracking-tight text-stone-900">Nouvelle intervention</h1>

      <!-- Stepper -->
      <div class="flex items-start justify-center gap-0">
        <template v-for="(s, i) in STEPS" :key="s.label">
          <div class="flex flex-col items-center gap-1.5">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all"
              :class="stepCircleClass(i + 1)"
            >
              <UIcon v-if="step > i + 1" name="i-lucide-check" class="h-4 w-4" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-xs font-medium"
              :class="step === i + 1 ? 'text-amber-600' : 'text-stone-400'"
              >{{ s.label }}</span
            >
          </div>
          <div
            v-if="i < STEPS.length - 1"
            class="mt-4 h-px w-12 flex-shrink-0 bg-stone-200 sm:w-20"
          />
        </template>
      </div>

      <!-- Step 1 : Ruche -->
      <div v-if="step === 1" class="space-y-4">
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Sélectionner une ruche
          </h2>

          <!-- Search si > 4 ruches -->
          <div v-if="allRuches.length > 4" class="mb-4">
            <input
              v-model="rucheSearch"
              type="search"
              placeholder="Rechercher…"
              class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

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
              v-for="ruche in filteredRuches"
              :key="ruche.id"
              type="button"
              class="flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all"
              :class="
                selectedRucheId === ruche.id
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-stone-200/60 bg-white hover:border-stone-300'
              "
              @click="selectRuche(ruche)"
            >
              <!-- Hexagon icon + numero -->
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg"
                  :class="selectedRucheId === ruche.id ? 'bg-amber-100' : 'bg-stone-100'"
                >
                  <UIcon
                    name="i-lucide-hexagon"
                    class="h-5 w-5"
                    :class="selectedRucheId === ruche.id ? 'text-amber-600' : 'text-stone-400'"
                  />
                </div>
                <span class="text-sm font-bold text-stone-900">{{ ruche.numero }}</span>
              </div>
              <!-- Rucher name -->
              <span v-if="ruche.rucherNom" class="text-xs text-stone-500">{{
                ruche.rucherNom
              }}</span>
              <!-- Statut pill -->
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statutPillClass(ruche.statut)"
                >{{ ruche.statut ?? 'inconnu' }}</span
              >
            </button>

            <!-- Empty search state -->
            <p
              v-if="filteredRuches.length === 0 && rucheSearch"
              class="col-span-full py-4 text-center text-sm text-stone-400"
            >
              Aucune ruche trouvée pour "{{ rucheSearch }}"
            </p>
          </div>

          <!-- Footer : créer une ruche -->
          <div v-if="allRuches.length === 0" class="mt-4 text-center">
            <button
              type="button"
              class="text-sm text-amber-600 hover:underline"
              @click="navigateTo('/ruches/nouveau')"
            >
              + Créer une ruche
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2 : Catégories -->
      <div v-if="step === 2" class="space-y-4">
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <!-- Context bar -->
          <div class="mb-4 flex items-center gap-2 text-sm text-stone-500">
            <div class="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100">
              <UIcon name="i-lucide-hexagon" class="h-4 w-4 text-amber-600" />
            </div>
            <span class="font-medium text-stone-700">{{ selectedRuche?.numero }}</span>
            <span v-if="selectedRuche?.rucherNom" class="text-stone-400"
              >· {{ selectedRuche.rucherNom }}</span
            >
            <button
              type="button"
              class="ml-auto text-xs text-amber-600 hover:underline"
              @click="step = 1"
            >
              Changer
            </button>
          </div>
          <InterventionsInterventionGrid v-model="selectedCategories" :multi="true" />
        </div>

        <div v-if="selectedCategories.length > 0" class="flex justify-end">
          <UButton
            label="Continuer"
            icon="i-lucide-arrow-right"
            color="primary"
            @click="step = 3"
          />
        </div>
      </div>

      <!-- Step 3 : Formulaire -->
      <div v-if="step === 3" class="space-y-6">
        <!-- Context bar -->
        <div class="flex flex-wrap items-center gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-hexagon" class="h-4 w-4 text-amber-500" />
            <span class="font-medium text-stone-700">{{ selectedRuche?.numero }}</span>
          </div>
          <InterventionsInterventionBadge v-for="t in selectedCategories" :key="t" :type="t" />
          <button
            type="button"
            class="ml-auto text-xs text-amber-600 hover:underline"
            @click="step = 2"
          >
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

        <!-- Dynamic forms per category -->
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
            placeholder="Observations, remarques…"
          />
        </div>

        <!-- Sticky footer -->
        <div
          class="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-3 shadow-lg backdrop-blur-sm"
        >
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
    </template>
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
const { emit: busEmit } = useDataBus();
const { ruchers: allRuchers } = useRuchers();

// ── RDV Pro flow ──────────────────────────────────────────────
const isRdvPro = computed(() => route.query.type === 'rendez_vous_pro');
const rdvDate = ref(
  route.query.date ? `${route.query.date}T09:00` : new Date().toISOString().slice(0, 16),
);
const rdvType = ref<
  'veterinaire' | 'syndicat' | 'fournisseur' | 'client' | 'administration' | 'autre'
>('veterinaire');
const rdvContact = ref('');
const rdvNotes = ref('');

// ── Wizard state ──────────────────────────────────────────────
const STEPS = [{ label: 'Ruche' }, { label: 'Catégories' }, { label: 'Formulaire' }];
const step = ref(1);
const selectedRucheId = ref('');
const selectedRuche = ref<(Ruche & { rucherNom?: string; statut?: string | null }) | null>(null);
const selectedCategories = ref<CategorieIntervention[]>([]);
const saving = ref(false);
const rucheSearch = ref('');

const formDate = ref(
  route.query.date ? `${route.query.date}T09:00` : new Date().toISOString().slice(0, 16),
);
const formMeteo = reactive<{ temperature?: number }>({});
const formNotes = ref('');
const categoriesData = reactive<Record<string, Record<string, unknown>>>({});

// ── Ruches fetch ──────────────────────────────────────────────
const { data: ruchesData, status: ruchesStatus } = useFetch<
  ApiListResponse<Ruche & { rucherNom?: string; statut?: string | null }>
>('/api/ruches', {
  query: { limit: 100 },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

const ruchesLoading = computed(
  () => ruchesStatus.value !== 'success' && ruchesStatus.value !== 'error',
);
const allRuches = computed(() => ruchesData.value?.data ?? []);
const otherRuches = computed(() => allRuches.value.filter((r) => r.id !== selectedRucheId.value));
const filteredRuches = computed(() => {
  if (!rucheSearch.value) return allRuches.value;
  const q = rucheSearch.value.toLowerCase();
  return allRuches.value.filter(
    (r) =>
      String(r.numero).toLowerCase().includes(q) || (r.rucherNom ?? '').toLowerCase().includes(q),
  );
});

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

// ── Helpers ───────────────────────────────────────────────────
function stepCircleClass(n: number) {
  if (step.value > n) return 'bg-emerald-500 text-white';
  if (step.value === n) return 'bg-amber-500 text-white shadow-md shadow-amber-200';
  return 'bg-stone-100 text-stone-400';
}

function statutPillClass(statut: string | null | undefined) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    hivernage: 'bg-blue-50 text-blue-700',
    orpheline: 'bg-red-50 text-red-700',
    empilee: 'bg-violet-50 text-violet-700',
  };
  return map[statut ?? ''] ?? 'bg-stone-100 text-stone-600';
}

function selectRuche(ruche: Ruche & { rucherNom?: string; statut?: string | null }) {
  selectedRucheId.value = ruche.id;
  selectedRuche.value = ruche;

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

// ── Form components ───────────────────────────────────────────
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

// ── Submit RDV Pro ────────────────────────────────────────────
async function handleRdvProSubmit() {
  saving.value = true;
  try {
    await $fetch('/api/interventions/rdv-pro', {
      method: 'POST',
      body: {
        date: new Date(rdvDate.value).toISOString(),
        typeRdv: rdvType.value,
        contact: rdvContact.value || undefined,
        notes: rdvNotes.value || undefined,
      },
    });
    busEmit('intervention:created');
    notifications.success('Rendez-vous enregistré');
    await navigateTo('/calendrier');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}

// ── Submit wizard ─────────────────────────────────────────────
async function handleSubmit() {
  if (!selectedRucheId.value || selectedCategories.value.length === 0) return;

  saving.value = true;
  try {
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
      followUp = { label: 'Compléter la récolte →', to: '/production' };
    }

    postAction.execute(
      'intervention:created',
      { id: result?.id, extra: { rucheId: selectedRucheId.value } },
      { toast: { title }, returnToOrigin: true, followUp },
    );

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
