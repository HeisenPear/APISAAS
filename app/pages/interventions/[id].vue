<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/interventions"
      class="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux interventions
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="h-10 w-48 animate-pulse rounded-[10px] bg-[var(--surface-muted)]" />
      <div class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>
    </div>

    <template v-else-if="intervention">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-[10px]" :class="meta.bgColor">
            <UIcon :name="meta.icon" class="h-5 w-5" :class="meta.textColor" />
          </div>
          <div>
            <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{{ meta.label }}</h1>
            <p class="text-sm text-[var(--text-tertiary)]">{{ formattedDate }}</p>
          </div>
        </div>
        <UButton
          label="Supprimer"
          icon="i-lucide-trash-2"
          variant="ghost"
          color="error"
          @click="handleDelete"
        />
      </div>

      <!-- Context bar -->
      <div class="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <NuxtLink
          v-if="intervention.ruche"
          :to="`/ruches/${intervention.rucheId}`"
          class="flex items-center gap-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--honey-deep)]"
        >
          <UIcon name="i-lucide-box" class="h-4 w-4" />
          {{ intervention.ruche.numero }}
        </NuxtLink>
        <NuxtLink
          v-if="intervention.rucher"
          :to="`/ruchers/${intervention.rucher.id}`"
          class="flex items-center gap-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--honey-deep)]"
        >
          <UIcon name="i-lucide-map-pin" class="h-4 w-4" />
          {{ intervention.rucher.nom }}
        </NuxtLink>
        <span v-if="intervention.dureeMinutes" class="flex items-center gap-1.5 text-[var(--text-tertiary)]">
          <UIcon name="i-lucide-timer" class="h-4 w-4" />
          {{ intervention.dureeMinutes }} min
        </span>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left: Données -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Données spécifiques -->
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
              Détails
            </h2>
            <InterventionsInterventionDetail
              :type="intervention.type ?? 'commentaire'"
              :donnees="intervention.donnees ?? null"
            />
          </div>

          <!-- Notes -->
          <div
            v-if="intervention.notes"
            class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 shadow-sm"
          >
            <h2 class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
              Notes
            </h2>
            <p class="whitespace-pre-line text-sm text-[var(--text-primary)]">{{ intervention.notes }}</p>
          </div>

          <!-- Photos -->
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
              Photos
            </h2>
            <UiPhotoUploader
              v-model="photos"
              bucket="interventions-photos"
              :entity-id="intervention.id"
              :max-photos="10"
              @update:model-value="savePhotos"
            />
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="space-y-6">
          <!-- Météo -->
          <div
            v-if="intervention.meteo"
            class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 shadow-sm"
          >
            <h3 class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
              Météo
            </h3>
            <dl class="space-y-2 text-sm">
              <div v-if="intervention.meteo.temperature != null" class="flex justify-between">
                <dt class="text-[var(--text-tertiary)]">Température</dt>
                <dd class="font-medium text-[var(--text-primary)]">{{ intervention.meteo.temperature }}°C</dd>
              </div>
              <div v-if="intervention.meteo.vent" class="flex justify-between">
                <dt class="text-[var(--text-tertiary)]">Vent</dt>
                <dd class="font-medium text-[var(--text-primary)]">{{ intervention.meteo.vent }}</dd>
              </div>
            </dl>
          </div>

          <!-- Ruche -->
          <div
            v-if="intervention.ruche"
            class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 shadow-sm"
          >
            <h3 class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
              Ruche
            </h3>
            <NuxtLink
              :to="`/ruches/${intervention.rucheId}`"
              class="flex items-center gap-3 rounded-[10px] bg-[var(--surface-muted)] p-3 transition-colors hover:bg-[var(--honey-soft)]"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--honey-soft)]">
                <UIcon name="i-lucide-box" class="h-4 w-4 text-[var(--honey-deep)]" />
              </div>
              <div>
                <p class="text-sm font-medium text-[var(--text-primary)]">{{ intervention.ruche.numero }}</p>
                <p class="text-xs text-[var(--text-tertiary)]">{{ intervention.ruche.type }}</p>
              </div>
            </NuxtLink>
          </div>

          <!-- Dates -->
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 shadow-sm">
            <h3 class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
              Dates
            </h3>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-[var(--text-tertiary)]">Créée le</dt>
                <dd class="font-medium text-[var(--text-primary)]">
                  {{ formatDateFr(intervention.createdAt) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <UiEmptyState
      v-else
      icon="i-lucide-search-x"
      title="Intervention introuvable"
      description="Cette intervention n'existe pas ou a été supprimée"
      action-label="Retour aux interventions"
      @action="navigateTo('/interventions')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '~/types/api';
import type { PhotoEntry } from '~/types/models';
import {
  INTERVENTION_META,
  type InterventionWithContext,
  type TypeIntervention,
} from '~/types/interventions';

definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const notifications = useNotifications();
const { emit: busEmit } = useDataBus();

const interventionId = computed(() => route.params.id as string);
const loading = ref(true);
const intervention = ref<InterventionWithContext | null>(null);
const photos = ref<PhotoEntry[]>([]);

const meta = computed(
  () =>
    INTERVENTION_META[(intervention.value?.type as TypeIntervention) ?? 'commentaire'] ??
    INTERVENTION_META.commentaire,
);

const formattedDate = computed(() => {
  if (!intervention.value?.dateVisite) return '';
  return new Date(intervention.value.dateVisite).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

function formatDateFr(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function fetchIntervention() {
  loading.value = true;
  try {
    const res = await $fetch<ApiResponse<InterventionWithContext>>(
      `/api/interventions/${interventionId.value}`,
    );
    intervention.value = res.data;
    photos.value = (res.data.photos as PhotoEntry[] | undefined) ?? [];
  } catch {
    intervention.value = null;
  } finally {
    loading.value = false;
  }
}

async function savePhotos(updated: PhotoEntry[]) {
  photos.value = updated;
  if (!intervention.value) return;
  try {
    await $fetch(`/api/interventions/${intervention.value.id}`, {
      method: 'PUT',
      body: { photos: updated },
    });
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur sauvegarde photos'));
  }
}

async function handleDelete() {
  if (!intervention.value) return;
  if (!confirm('Voulez-vous vraiment supprimer cette intervention ?')) return;
  try {
    await ($fetch as typeof $fetch<unknown, string>)(
      `/api/interventions/${intervention.value.id}`,
      { method: 'DELETE' },
    );
    busEmit('intervention:deleted');
    notifications.success('Intervention supprimée');
    await router.push('/interventions');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

onMounted(fetchIntervention);
</script>
