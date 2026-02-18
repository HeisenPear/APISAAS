<template>
  <div class="space-y-5">
    <!-- Toggle: Avez-vous recupere l'essaim ? -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Avez-vous recupere l'essaim ?</label>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200"
          :class="
            form.essaim_recupere
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
          "
          @click="form.essaim_recupere = true"
        >
          Oui
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200"
          :class="
            !form.essaim_recupere
              ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
          "
          @click="form.essaim_recupere = false"
        >
          Non
        </button>
      </div>
    </div>

    <!-- Conditional: si recupere -->
    <template v-if="form.essaim_recupere">
      <!-- Nouvelle ruche checkbox -->
      <div class="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-4">
        <input
          id="nouvelle_ruche"
          v-model="form.nouvelle_ruche"
          type="checkbox"
          class="h-4 w-4 rounded border-stone-300 text-amber-500 accent-amber-500 focus:ring-amber-500"
        />
        <label for="nouvelle_ruche" class="text-sm font-medium text-stone-700 cursor-pointer">
          Creer une nouvelle ruche pour cet essaim
        </label>
      </div>

      <!-- Ruche destination (dropdown si pas nouvelle ruche) -->
      <div v-if="!form.nouvelle_ruche" class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Ruche de destination</label>
        <div v-if="ruchesLoading" class="flex items-center gap-2 py-2 text-sm text-stone-400">
          <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
          Chargement des ruches...
        </div>
        <select
          v-else
          v-model="form.ruche_destination_id"
          class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">-- Selectionner une ruche --</option>
          <option v-for="r in ruches" :key="r.id" :value="r.id">
            {{ r.numero }} {{ r.type ? `(${r.type})` : '' }}
          </option>
        </select>
      </div>
    </template>

    <!-- Localisation recuperation -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">
        Localisation de recuperation
        <span class="text-stone-400 font-normal">optionnel</span>
      </label>
      <input
        v-model="form.localisation_recuperation"
        type="text"
        placeholder="Ex: Arbre devant la ruche, toit du voisin..."
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesEssaimage } from '~/types/interventions';
import type { ApiListResponse } from '~/types/api';

const props = defineProps<{
  modelValue: DonneesEssaimage;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesEssaimage];
}>();

// Fetch ruches
const { data: ruchesData, status: ruchesStatus } = useFetch<
  ApiListResponse<{ id: string; numero: string; type: string }>
>('/api/ruches', {
  query: { limit: 100 },
  key: 'form-essaimage-ruches',
  lazy: true,
});

const ruchesLoading = computed(() => ruchesStatus.value === 'pending');
const ruches = computed(() => ruchesData.value?.data ?? []);

const form = reactive<{
  essaim_recupere: boolean;
  ruche_destination_id: string;
  nouvelle_ruche: boolean;
  localisation_recuperation: string;
}>({
  essaim_recupere: props.modelValue.essaim_recupere,
  ruche_destination_id: props.modelValue.ruche_destination_id ?? '',
  nouvelle_ruche: props.modelValue.nouvelle_ruche ?? false,
  localisation_recuperation: props.modelValue.localisation_recuperation ?? '',
});

watch(
  form,
  () => {
    const data: DonneesEssaimage = {
      essaim_recupere: form.essaim_recupere,
    };
    if (form.essaim_recupere) {
      data.nouvelle_ruche = form.nouvelle_ruche;
      if (!form.nouvelle_ruche && form.ruche_destination_id) {
        data.ruche_destination_id = form.ruche_destination_id;
      }
    }
    if (form.localisation_recuperation.trim()) {
      data.localisation_recuperation = form.localisation_recuperation.trim();
    }
    emit('update:modelValue', data);
  },
  { deep: true },
);
</script>
