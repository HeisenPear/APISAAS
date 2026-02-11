<template>
  <form class="space-y-6" @submit.prevent="$emit('submit')">
    <!-- Informations principales -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Informations</h3>

      <UFormField label="Nom du rucher" name="nom" required>
        <UInput
          :model-value="modelValue.nom"
          placeholder="Mon rucher principal"
          required
          class="w-full"
          @update:model-value="update('nom', $event)"
        />
      </UFormField>

      <UFormField label="Description" name="description">
        <UInput
          :model-value="modelValue.description"
          placeholder="Description du rucher..."
          class="w-full"
          @update:model-value="update('description', $event)"
        />
      </UFormField>

      <UFormField label="Environnement" name="environnement">
        <select
          :value="modelValue.environnement"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @change="update('environnement', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Selectionner...</option>
          <option value="Foret">Foret</option>
          <option value="Culture">Culture</option>
          <option value="Prairie">Prairie</option>
          <option value="Montagne">Montagne</option>
          <option value="Urbain">Urbain</option>
          <option value="Mixte">Mixte</option>
          <option value="Autre">Autre</option>
        </select>
      </UFormField>
    </div>

    <!-- Localisation -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Localisation</h3>

      <UFormField label="Adresse / Lieu-dit" name="adresse">
        <UInput
          :model-value="modelValue.adresse"
          placeholder="Lieu-dit Les Tilleuls"
          class="w-full"
          @update:model-value="update('adresse', $event)"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Commune" name="commune">
          <UInput
            :model-value="modelValue.commune"
            placeholder="Amboise"
            class="w-full"
            @update:model-value="update('commune', $event)"
          />
        </UFormField>
        <UFormField label="Departement" name="departement">
          <UInput
            :model-value="modelValue.departement"
            placeholder="Indre-et-Loire"
            class="w-full"
            @update:model-value="update('departement', $event)"
          />
        </UFormField>
      </div>

      <UFormField label="Code postal" name="codePostal">
        <UInput
          :model-value="modelValue.codePostal"
          placeholder="37000"
          class="w-full"
          @update:model-value="update('codePostal', $event)"
        />
      </UFormField>

      <!-- GPS -->
      <div class="rounded-xl bg-stone-50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-stone-700">Position GPS</p>
            <p
              v-if="modelValue.latitude && modelValue.longitude"
              class="mt-0.5 text-xs text-stone-500"
            >
              {{ modelValue.latitude }}, {{ modelValue.longitude }}
            </p>
            <p v-else class="mt-0.5 text-xs text-stone-400">Non renseignee</p>
          </div>
          <UButton
            label="Localiser"
            icon="i-lucide-locate"
            variant="outline"
            size="sm"
            :loading="geoLoading"
            @click="detectLocation"
          />
        </div>
      </div>
    </div>

    <!-- Notes acces -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Acces</h3>
      <UFormField label="Notes d'acces" name="notesAcces">
        <UInput
          :model-value="modelValue.notesAcces"
          placeholder="Chemin de terre apres le portail vert..."
          class="w-full"
          @update:model-value="update('notesAcces', $event)"
        />
      </UFormField>
    </div>

    <!-- Submit -->
    <div class="flex items-center justify-end gap-3 border-t border-stone-100 pt-6">
      <slot name="actions">
        <UButton
          type="submit"
          :label="submitLabel"
          icon="i-lucide-check"
          color="primary"
          :loading="loading"
          class="min-h-[44px]"
        />
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
interface RucherFormData {
  nom: string;
  description?: string;
  adresse?: string;
  commune?: string;
  departement?: string;
  codePostal?: string;
  environnement?: string;
  notesAcces?: string;
  latitude?: number;
  longitude?: number;
}

const props = defineProps<{
  modelValue: RucherFormData;
  loading?: boolean;
  submitLabel?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: RucherFormData];
  submit: [];
}>();

const submitLabel = computed(() => props.submitLabel ?? 'Enregistrer');

const geoLoading = ref(false);

function update(key: keyof RucherFormData, value: string | number | undefined) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function detectLocation() {
  if (!navigator.geolocation) return;
  geoLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      emit('update:modelValue', {
        ...props.modelValue,
        latitude: Math.round(pos.coords.latitude * 1e7) / 1e7,
        longitude: Math.round(pos.coords.longitude * 1e7) / 1e7,
      });
      geoLoading.value = false;
    },
    () => {
      geoLoading.value = false;
    },
  );
}
</script>
