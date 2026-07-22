<template>
  <div class="rounded-[12px] border border-[var(--border-default)] p-4">
    <div class="flex items-center justify-between">
      <p class="text-[12.5px] font-semibold text-[var(--text-primary)]">{{ label }}</p>
      <div class="flex items-center gap-1 rounded-[8px] bg-[var(--surface-muted)] p-0.5">
        <button
          type="button"
          class="rounded-[6px] px-2 py-1 text-[11px] font-medium transition-colors"
          :class="
            mode === 'rucher'
              ? 'bg-white shadow-sm text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)]'
          "
          @click="mode = 'rucher'"
        >
          Mes ruchers
        </button>
        <button
          type="button"
          class="rounded-[6px] px-2 py-1 text-[11px] font-medium transition-colors"
          :class="
            mode === 'manuel'
              ? 'bg-white shadow-sm text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)]'
          "
          @click="mode = 'manuel'"
        >
          Coordonnées GPS
        </button>
      </div>
    </div>

    <div v-if="mode === 'rucher'" class="mt-3">
      <USelect
        v-model="rucherId"
        :items="rucherOptions"
        value-key="value"
        label-key="label"
        placeholder="Sélectionner un rucher"
        class="w-full"
      />
      <p v-if="!ruchers.length" class="mt-2 text-[11.5px] text-[var(--text-tertiary)]">
        Aucun rucher avec des coordonnées GPS enregistrées
      </p>
    </div>

    <div v-else class="mt-3 grid grid-cols-2 gap-2">
      <UInput v-model.number="latManuel" type="number" step="0.0001" placeholder="Latitude" />
      <UInput v-model.number="lngManuel" type="number" step="0.0001" placeholder="Longitude" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RucherWithCount } from '~/types/models';

const props = defineProps<{
  label: string;
  ruchers: RucherWithCount[];
  modelValue: { lat: number | undefined; lng: number | undefined };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: { lat: number | undefined; lng: number | undefined }];
}>();

const mode = ref<'rucher' | 'manuel'>('rucher');
const rucherId = ref<string | undefined>(undefined);
const latManuel = ref<number | undefined>(undefined);
const lngManuel = ref<number | undefined>(undefined);

const rucherOptions = computed(() => props.ruchers.map((r) => ({ label: r.nom, value: r.id })));

watchEffect(() => {
  if (mode.value === 'rucher') {
    const rucher = props.ruchers.find((r) => r.id === rucherId.value);
    emit('update:modelValue', {
      lat: rucher ? Number(rucher.latitude) : undefined,
      lng: rucher ? Number(rucher.longitude) : undefined,
    });
  } else {
    emit('update:modelValue', { lat: latManuel.value, lng: lngManuel.value });
  }
});
</script>
