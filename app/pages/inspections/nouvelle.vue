<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/inspections"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux inspections
    </NuxtLink>

    <!-- Mode toggle -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold tracking-tight text-stone-900">
        {{ isTerrainMode ? 'Inspection rapide' : 'Nouvelle inspection' }}
      </h1>
      <div class="flex rounded-lg border border-stone-200 bg-white p-0.5">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            !isTerrainMode ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-700'
          "
          @click="isTerrainMode = false"
        >
          Complet
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="isTerrainMode ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-700'"
          @click="isTerrainMode = true"
        >
          Terrain
        </button>
      </div>
    </div>

    <!-- Loading ruches -->
    <div v-if="ruchesPending" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-stone-400" />
    </div>

    <!-- No ruches -->
    <UiEmptyState
      v-else-if="allRuches.length === 0"
      icon="i-lucide-box"
      title="Aucune ruche"
      description="Ajoutez d'abord des ruches pour pouvoir enregistrer des inspections"
      action-label="Ajouter une ruche"
      @action="navigateTo('/ruches/nouveau')"
    />

    <template v-else>
      <!-- Terrain mode -->
      <InspectionsInspectionQuick
        v-if="isTerrainMode"
        :ruches="allRuches"
        :loading="saving"
        @submit="handleQuickSubmit"
      />

      <!-- Full wizard mode -->
      <div
        v-else
        class="mx-auto max-w-2xl rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
      >
        <InspectionsInspectionForm
          :ruches="allRuches"
          :ruchers="allRuchers"
          :loading="saving"
          :initial-ruche-id="initialRucheId"
          @submit="handleWizardSubmit"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { InspectionFormData } from '~/components/inspections/InspectionForm.vue';
import type { QuickInspectionData } from '~/components/inspections/InspectionQuick.vue';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const { createInspection } = useInspections();
const { ruchers: allRuchers } = useRuchers();

const initialRucheId = computed(() => (route.query.rucheId as string) ?? '');
const isTerrainMode = ref(route.query.mode === 'terrain');
const saving = ref(false);

// Fetch all ruches with rucher names
const { data: ruchesData, pending: ruchesPending } = useFetch<
  ApiListResponse<Ruche & { rucherNom?: string }>
>('/api/ruches', {
  query: { limit: 200 },
  lazy: true,
});

const allRuches = computed(() => ruchesData.value?.data ?? []);

async function handleWizardSubmit(data: InspectionFormData) {
  saving.value = true;
  try {
    const newInspection = await createInspection({
      rucheId: data.rucheId,
      dateVisite: new Date(data.dateVisite).toISOString(),
      type: data.type || undefined,
      meteo:
        data.meteoTemp != null || data.meteoVent || data.meteoCiel
          ? {
              ...(data.meteoTemp != null && { temperature: data.meteoTemp }),
              ...(data.meteoVent && { vent: data.meteoVent }),
              ...(data.meteoCiel && { ciel: data.meteoCiel }),
            }
          : undefined,
      forceColonie: data.forceColonie || undefined,
      couvain: data.couvain != null ? data.couvain : undefined,
      reserves: data.reserves || undefined,
      comportement: data.comportement || undefined,
      reineVue: data.reineVue || undefined,
      celluleRoyale: data.celluleRoyale || undefined,
      signeEssaimage: data.signeEssaimage || undefined,
      varroa: data.varroa != null ? data.varroa : undefined,
      traitementApplique: data.traitementApplique || undefined,
      maladieObservee: data.maladieObservee || undefined,
      actionsRealisees: data.actionsRealisees.length > 0 ? data.actionsRealisees : undefined,
      nourrissementType: data.nourrissementType || undefined,
      nourrissementQuantite:
        data.nourrissementQuantite != null ? data.nourrissementQuantite : undefined,
      notes: data.notes || undefined,
      dureeMinutes: data.dureeMinutes != null ? data.dureeMinutes : undefined,
    });
    notifications.success('Inspection enregistree');
    await navigateTo(`/inspections/${newInspection.id}`);
  } catch (e: unknown) {
    notifications.error(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
  } finally {
    saving.value = false;
  }
}

async function handleQuickSubmit(data: QuickInspectionData) {
  saving.value = true;
  try {
    const newInspection = await createInspection({
      rucheId: data.rucheId,
      dateVisite: new Date().toISOString(),
      type: 'controle',
      forceColonie: data.forceColonie,
      couvain: data.couvain,
      reserves: data.reserves,
      reineVue: data.reineVue || undefined,
      celluleRoyale: data.celluleRoyale || undefined,
      signeEssaimage: data.signeEssaimage || undefined,
      comportement: data.comportementAgressif ? 'agressive' : undefined,
      notes: data.notes || undefined,
    });
    notifications.success('Inspection rapide enregistree');
    await navigateTo(`/inspections/${newInspection.id}`);
  } catch (e: unknown) {
    notifications.error(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
  } finally {
    saving.value = false;
  }
}
</script>
