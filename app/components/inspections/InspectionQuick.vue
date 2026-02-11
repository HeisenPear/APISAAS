<template>
  <div class="mx-auto max-w-lg space-y-6">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-xl font-bold text-stone-900">Inspection rapide</h2>
      <p class="mt-1 text-sm text-stone-500">Mode terrain — gros boutons</p>
    </div>

    <!-- Ruche selection (big cards) -->
    <div v-if="!selectedRuche" class="space-y-3">
      <p class="text-sm font-medium text-stone-700">Choisir la ruche :</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="ruche in ruches"
          :key="ruche.id"
          type="button"
          class="rounded-2xl border-2 border-stone-200 bg-white p-4 text-center transition-all active:scale-95"
          @click="selectedRuche = ruche"
        >
          <p class="text-lg font-bold text-stone-900">{{ ruche.numero }}</p>
          <p class="text-xs text-stone-400">
            {{ (ruche as RucheWithRucher).rucherNom ?? ruche.type }}
          </p>
        </button>
      </div>
    </div>

    <!-- Quick form -->
    <template v-else>
      <div class="rounded-2xl bg-amber-50 p-4 text-center">
        <p class="text-sm text-amber-600">Ruche selectionnee</p>
        <p class="text-xl font-bold text-amber-800">{{ selectedRuche.numero }}</p>
        <button
          type="button"
          class="mt-1 text-xs text-amber-600 underline"
          @click="selectedRuche = null"
        >
          Changer
        </button>
      </div>

      <!-- Force colonie — big touch buttons -->
      <div>
        <p class="mb-2 text-sm font-medium text-stone-700">Force colonie</p>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="flex h-14 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all active:scale-95"
            :class="
              quickData.forceColonie === n
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-stone-200 bg-white text-stone-600'
            "
            @click="quickData.forceColonie = n"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <!-- Couvain — big touch buttons -->
      <div>
        <p class="mb-2 text-sm font-medium text-stone-700">Couvain</p>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="n in 6"
            :key="n - 1"
            type="button"
            class="flex h-14 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all active:scale-95"
            :class="
              quickData.couvain === n - 1
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-stone-200 bg-white text-stone-600'
            "
            @click="quickData.couvain = n - 1"
          >
            {{ n - 1 }}
          </button>
        </div>
      </div>

      <!-- Reserves — big touch buttons -->
      <div>
        <p class="mb-2 text-sm font-medium text-stone-700">Reserves</p>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="flex h-14 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all active:scale-95"
            :class="
              quickData.reserves === n
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-stone-200 bg-white text-stone-600'
            "
            @click="quickData.reserves = n"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <!-- Quick toggles -->
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95"
          :class="
            quickData.reineVue
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-stone-200 bg-white text-stone-600'
          "
          @click="quickData.reineVue = !quickData.reineVue"
        >
          <UIcon name="i-lucide-crown" class="h-5 w-5" />
          Reine vue
        </button>
        <button
          type="button"
          class="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95"
          :class="
            quickData.signeEssaimage
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-stone-200 bg-white text-stone-600'
          "
          @click="quickData.signeEssaimage = !quickData.signeEssaimage"
        >
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5" />
          Essaimage
        </button>
        <button
          type="button"
          class="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95"
          :class="
            quickData.celluleRoyale
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-white text-stone-600'
          "
          @click="quickData.celluleRoyale = !quickData.celluleRoyale"
        >
          <UIcon name="i-lucide-hexagon" class="h-5 w-5" />
          Cellule royale
        </button>
        <button
          type="button"
          class="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95"
          :class="
            quickData.comportementAgressif
              ? 'border-orange-500 bg-orange-50 text-orange-700'
              : 'border-stone-200 bg-white text-stone-600'
          "
          @click="quickData.comportementAgressif = !quickData.comportementAgressif"
        >
          <UIcon name="i-lucide-zap" class="h-5 w-5" />
          Agressive
        </button>
      </div>

      <!-- Quick notes -->
      <UTextarea
        v-model="quickData.notes"
        placeholder="Notes rapides..."
        :rows="3"
        class="w-full"
      />

      <!-- Submit -->
      <UButton
        label="Enregistrer"
        icon="i-lucide-check"
        color="primary"
        size="lg"
        block
        :loading="loading"
        @click="handleSubmit"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';

type RucheWithRucher = Ruche & { rucherNom?: string };

defineProps<{
  ruches: RucheWithRucher[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: QuickInspectionData];
}>();

export interface QuickInspectionData {
  rucheId: string;
  forceColonie: number;
  couvain: number;
  reserves: number;
  reineVue: boolean;
  celluleRoyale: boolean;
  signeEssaimage: boolean;
  comportementAgressif: boolean;
  notes: string;
}

const selectedRuche = ref<Ruche | null>(null);

const quickData = reactive({
  forceColonie: 3,
  couvain: 3,
  reserves: 3,
  reineVue: false,
  celluleRoyale: false,
  signeEssaimage: false,
  comportementAgressif: false,
  notes: '',
});

function handleSubmit() {
  if (!selectedRuche.value) return;
  emit('submit', {
    rucheId: selectedRuche.value.id,
    ...quickData,
  });
}
</script>
