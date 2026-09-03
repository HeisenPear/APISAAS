<template>
  <div class="space-y-6">
    <!-- Back link -->
    <NuxtLink
      to="/interventions"
      class="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      style="color: var(--text-tertiary)"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Retour aux interventions
    </NuxtLink>

    <!-- Page header -->
    <div class="flex items-center gap-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
        style="background: var(--sage-soft)"
      >
        <UIcon name="i-lucide-layers" class="h-5 w-5" style="color: var(--sage-deep)" />
      </div>
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Intervention groupée
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Appliquez la même action sur plusieurs ruches simultanément
        </p>
      </div>
    </div>

    <!-- Stepper -->
    <!-- Trois étapes + leurs traits de liaison font 368 px : huit de trop sur
         un téléphone de 360, et « Paramètres » passait hors écran. Le trait se
         raccourcit sur petit écran, et le tout peut passer à la ligne si un
         libellé s'allonge un jour. -->
    <div class="flex flex-wrap items-center gap-2">
      <div v-for="(label, i) in stepLabels" :key="i" class="flex items-center gap-2">
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200"
          :class="
            step > i + 1
              ? 'bg-[var(--sage)] text-white'
              : step === i + 1
                ? 'bg-[var(--honey)] text-white'
                : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]'
          "
        >
          <UIcon v-if="step > i + 1" name="i-lucide-check" class="h-3 w-3" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          class="text-xs font-medium transition-colors"
          :class="step === i + 1 ? 'text-[var(--honey-deep)]' : 'text-[var(--text-tertiary)]'"
          >{{ label }}</span
        >
        <div
          v-if="i < stepLabels.length - 1"
          class="h-px w-3 sm:w-6"
          style="background: var(--border-default)"
        />
      </div>
    </div>

    <!-- ─────────────────── Step 1: Multi-select ruches ─────────────────── -->
    <div v-if="step === 1" class="space-y-4">
      <div
        class="rounded-[14px] border bg-white p-6 shadow-sm"
        style="border-color: var(--border-default)"
      >
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Sélectionner les ruches
          </p>
          <div class="flex items-center gap-2">
            <select
              v-model="filterRucherId"
              class="form-select h-8 rounded-[8px] border px-2 text-xs bg-white appearance-none cursor-pointer"
              style="border-color: var(--border-default); color: var(--text-primary)"
            >
              <option value="">Tous les ruchers</option>
              <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
            </select>
            <button
              type="button"
              class="h-8 rounded-[8px] border px-3 text-xs font-medium transition-colors"
              style="
                border-color: var(--border-default);
                color: var(--text-secondary);
                background: var(--surface-muted);
              "
              @click="toggleSelectAll"
            >
              {{ selectedRucheIds.length === filteredRuches.length ? 'Tout désél.' : 'Tout sél.' }}
            </button>
          </div>
        </div>

        <div v-if="ruchesLoading" class="flex items-center justify-center py-10">
          <UIcon
            name="i-lucide-loader-2"
            class="h-6 w-6 animate-spin"
            style="color: var(--text-tertiary)"
          />
        </div>

        <UiErrorState v-else-if="ruchesError" :error="ruchesError" :retry="refreshRuches" />

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
            class="relative flex flex-col items-center gap-1.5 rounded-[12px] border-2 p-4 text-left transition-all duration-150 active:scale-95"
            :style="
              isSelected(ruche.id)
                ? 'border-color:var(--honey);background:var(--honey-soft)'
                : 'border-color:var(--border-default);background:white'
            "
            @click="toggleRuche(ruche.id)"
          >
            <!-- Checkbox indicator -->
            <div
              class="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all"
              :style="
                isSelected(ruche.id)
                  ? 'border-color:var(--honey);background:var(--honey)'
                  : 'border-color:var(--border-default);background:white'
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
              :style="isSelected(ruche.id) ? 'color:var(--honey)' : 'color:var(--text-tertiary)'"
            />
            <span class="text-sm font-semibold" style="color: var(--text-primary)">{{
              ruche.numero
            }}</span>
            <span class="text-[11px]" style="color: var(--text-tertiary)">{{ ruche.type }}</span>
            <span
              v-if="ruche.rucherNom"
              class="truncate text-[10px]"
              style="color: var(--text-tertiary)"
              >{{ ruche.rucherNom }}</span
            >
          </button>
        </div>
      </div>

      <!-- Selection summary -->
      <div
        v-if="selectedRucheIds.length > 0"
        class="flex items-center justify-between rounded-[12px] border px-4 py-3"
        style="border-color: var(--honey); background: var(--honey-soft)"
      >
        <span class="text-sm font-medium" style="color: var(--honey-deep)">
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
      <div
        class="rounded-[14px] border bg-white p-6 shadow-sm"
        style="border-color: var(--border-default)"
      >
        <div class="mb-4 flex items-center gap-2 text-sm">
          <div
            class="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1"
            style="background: var(--honey-soft)"
          >
            <UIcon name="i-lucide-layers" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
            <span class="font-medium" style="color: var(--honey-deep)"
              >{{ selectedRucheIds.length }} ruche{{ selectedRucheIds.length > 1 ? 's' : '' }}</span
            >
          </div>
          <button
            type="button"
            class="text-xs font-medium hover:underline"
            style="color: var(--honey-deep)"
            @click="step = 1"
          >
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
          class="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1"
          style="background: var(--honey-soft)"
        >
          <UIcon name="i-lucide-layers" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
          <span class="font-medium" style="color: var(--honey-deep)"
            >{{ selectedRucheIds.length }} ruche{{ selectedRucheIds.length > 1 ? 's' : '' }}</span
          >
        </div>
        <InterventionsInterventionBadge v-for="t in selectedCategories" :key="t" :type="t" />
        <button
          type="button"
          class="text-xs font-medium hover:underline"
          style="color: var(--honey-deep)"
          @click="step = 2"
        >
          Modifier
        </button>
      </div>

      <!-- Impact banner -->
      <div
        class="flex items-center gap-3 rounded-[12px] border px-4 py-3"
        style="
          border-color: color-mix(in srgb, var(--honey) 30%, transparent);
          background: var(--honey-soft);
        "
      >
        <UIcon name="i-lucide-info" class="h-4 w-4 shrink-0" style="color: var(--honey-deep)" />
        <p class="text-sm" style="color: var(--text-secondary)">
          Ces paramètres seront appliqués à
          <strong style="color: var(--text-primary)"
            >{{ selectedRucheIds.length }} ruche{{ selectedRucheIds.length > 1 ? 's' : '' }}</strong
          >
          simultanément. Les catégories <strong>Déplacement</strong>, <strong>Empilement</strong> et
          <strong>Transvasement</strong> ne sont pas disponibles en mode groupé.
        </p>
      </div>

      <!-- Date + Météo -->
      <div
        class="rounded-[14px] border bg-white px-5 py-4 shadow-sm"
        style="border-color: var(--border-default)"
      >
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <label
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
              >Date</label
            >
            <UiMobileDatePicker v-model="formDate" mode="datetime" />
          </div>
          <div class="w-32 shrink-0">
            <label
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
              >Temp.</label
            >
            <div class="relative">
              <UIcon
                name="i-lucide-thermometer"
                class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style="color: var(--text-tertiary)"
              />
              <input
                v-model.number="formMeteo.temperature"
                type="number"
                step="0.5"
                min="-20"
                max="50"
                placeholder="22°C"
                class="form-input h-10 w-full rounded-[10px] border pl-7 pr-3 text-[14px]"
                style="border-color: var(--border-default); color: var(--text-primary)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic forms per selected category -->
      <div
        v-for="cat in selectedCategories"
        :key="cat"
        class="rounded-[14px] border bg-white p-6 shadow-sm"
        style="border-color: var(--border-default)"
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
        <p v-else class="text-sm" style="color: var(--text-tertiary)">
          Formulaire en cours de développement
        </p>
      </div>

      <!-- Notes générales -->
      <div
        class="rounded-[14px] border bg-white p-6 shadow-sm"
        style="border-color: var(--border-default)"
      >
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Notes générales
        </p>
        <textarea
          v-model="formNotes"
          :rows="3"
          class="form-textarea w-full rounded-[10px] border px-3 py-2.5 text-[14px]"
          style="border-color: var(--border-default); color: var(--text-primary)"
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
};

const {
  data: ruchesData,
  status: ruchesStatus,
  error: ruchesError,
  refresh: refreshRuches,
} = useFetch<ApiListResponse<Ruche & { rucherNom?: string }>>('/api/ruches', {
  key: 'groupe-ruches-list',
  query: { limit: 200 },
  default: () => ({ data: [], pagination: { page: 1, limit: 200, total: 0, totalPages: 0 } }),
});

/**
 * ⚠️ Une intervention de GROUPE se pose sur une liste de ruches. Maya en crée à la voix : la ruche neuve manquait à la sélection, et l'apiculteur croyait l'avoir mal dictée.
 */
const { on: surRuchesGroupe } = useDataBus();
surRuchesGroupe(['ruche:created', 'ruche:updated', 'ruche:deleted'], () => {
  void refreshRuches();
});

const ruchesLoading = computed(
  () => ruchesStatus.value !== 'success' && ruchesStatus.value !== 'error',
);
const allRuches = computed(() => ruchesData.value?.data ?? []);
const filteredRuches = computed(() =>
  filterRucherId.value
    ? allRuches.value.filter((r) => r.rucherId === filterRucherId.value)
    : allRuches.value,
);

function isSelected(id: string) {
  return selectedRucheIds.value.includes(id);
}

function toggleRuche(id: string) {
  const idx = selectedRucheIds.value.indexOf(id);
  if (idx === -1) selectedRucheIds.value.push(id);
  else selectedRucheIds.value.splice(idx, 1);
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

<style scoped>
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--honey);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--honey) 15%, transparent);
}
</style>
