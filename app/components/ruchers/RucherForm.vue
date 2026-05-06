<template>
  <form class="space-y-6" @submit.prevent="$emit('submit')">

    <!-- Section: Informations -->
    <div class="space-y-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Informations</p>

      <UFormField label="Nom du rucher *" name="nom" required>
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
          class="form-select w-full h-10 rounded-[10px] border px-3 text-[14px] bg-white appearance-none cursor-pointer"
          style="border-color:var(--border-default);color:var(--text-primary)"
          @change="update('environnement', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Sélectionner...</option>
          <option value="Foret">Forêt</option>
          <option value="Culture">Culture</option>
          <option value="Prairie">Prairie</option>
          <option value="Montagne">Montagne</option>
          <option value="Urbain">Urbain</option>
          <option value="Mixte">Mixte</option>
          <option value="Autre">Autre</option>
        </select>
      </UFormField>
    </div>

    <!-- Section: Localisation -->
    <div class="space-y-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Localisation</p>

      <UFormField label="Rechercher une adresse" name="searchAddress">
        <div class="relative">
          <UInput
            v-model="addressQuery"
            placeholder="12 rue des Abeilles, 37000 Tours"
            class="w-full"
            :loading="searchingAddress"
            @input="debouncedSearch"
          />
          <div
            v-if="addressSuggestions.length > 0"
            class="absolute z-20 mt-1 w-full overflow-hidden rounded-[12px] border bg-white shadow-lg"
            style="border-color:var(--border-default)"
          >
            <button
              v-for="(suggestion, idx) in addressSuggestions"
              :key="idx"
              type="button"
              class="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-[12px] last:rounded-b-[12px]"
              style="color:var(--text-primary)"
              @mouseenter="($event.currentTarget as HTMLButtonElement).style.background = 'var(--honey-soft)'"
              @mouseleave="($event.currentTarget as HTMLButtonElement).style.background = ''"
              @click="selectAddress(suggestion)"
            >
              <UIcon name="i-lucide-map-pin" class="mt-0.5 h-4 w-4 shrink-0" style="color:var(--honey)" />
              <div>
                <p class="font-medium" style="color:var(--text-primary)">{{ suggestion.label }}</p>
                <p class="text-xs" style="color:var(--text-tertiary)">{{ suggestion.context }}</p>
              </div>
            </button>
          </div>
        </div>
      </UFormField>

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
          <UInput :model-value="modelValue.commune" placeholder="Amboise" class="w-full" @update:model-value="update('commune', $event)" />
        </UFormField>
        <UFormField label="Département" name="departement">
          <UInput :model-value="modelValue.departement" placeholder="Indre-et-Loire" class="w-full" @update:model-value="update('departement', $event)" />
        </UFormField>
      </div>

      <UFormField label="Code postal" name="codePostal">
        <UInput :model-value="modelValue.codePostal" placeholder="37000" class="w-full" @update:model-value="update('codePostal', $event)" />
      </UFormField>

      <!-- GPS card -->
      <div class="rounded-[12px] p-4" style="background:var(--surface-muted)">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium" style="color:var(--text-primary)">Position GPS</p>
            <p v-if="modelValue.latitude && modelValue.longitude" class="mt-0.5 text-xs" style="color:var(--text-secondary)">
              {{ modelValue.latitude }}, {{ modelValue.longitude }}
            </p>
            <p v-else class="mt-0.5 text-xs" style="color:var(--text-tertiary)">Non renseignée</p>
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

    <!-- Section: Accès -->
    <div class="space-y-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Accès</p>
      <UFormField label="Notes d'accès" name="notesAcces">
        <UInput
          :model-value="modelValue.notesAcces"
          placeholder="Chemin de terre après le portail vert..."
          class="w-full"
          @update:model-value="update('notesAcces', $event)"
        />
      </UFormField>
    </div>

    <!-- Submit -->
    <div class="flex items-center justify-end gap-3 border-t pt-5" style="border-color:var(--border-default)">
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
const addressQuery = ref('');
const searchingAddress = ref(false);
const addressSuggestions = ref<AddressSuggestion[]>([]);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

interface AddressSuggestion {
  label: string;
  context: string;
  name: string;
  city: string;
  postcode: string;
  department: string;
  lat: number;
  lng: number;
}

function update(key: keyof RucherFormData, value: string | number | undefined) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  const query = addressQuery.value.trim();
  if (query.length < 3) {
    addressSuggestions.value = [];
    return;
  }
  searchTimeout = setTimeout(() => searchAddress(query), 300);
}

async function searchAddress(query: string) {
  searchingAddress.value = true;
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`;
    const res = await $fetch<{
      features: Array<{
        properties: { label: string; context: string; name: string; city: string; postcode: string };
        geometry: { coordinates: [number, number] };
      }>;
    }>(url);
    addressSuggestions.value = res.features.map((f) => ({
      label: f.properties.label,
      context: f.properties.context,
      name: f.properties.name,
      city: f.properties.city,
      postcode: f.properties.postcode,
      department: f.properties.context.split(',').pop()?.trim() ?? '',
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  } catch {
    addressSuggestions.value = [];
  } finally {
    searchingAddress.value = false;
  }
}

function selectAddress(suggestion: AddressSuggestion) {
  emit('update:modelValue', {
    ...props.modelValue,
    adresse: suggestion.name,
    commune: suggestion.city,
    codePostal: suggestion.postcode,
    departement: suggestion.department,
    latitude: Math.round(suggestion.lat * 1e7) / 1e7,
    longitude: Math.round(suggestion.lng * 1e7) / 1e7,
  });
  addressQuery.value = suggestion.label;
  addressSuggestions.value = [];
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
    () => { geoLoading.value = false; },
  );
}
</script>

<style scoped>
.form-select:focus {
  outline: none;
  border-color: var(--honey);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--honey) 15%, transparent);
}
</style>
