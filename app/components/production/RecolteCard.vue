<template>
  <NuxtLink
    :to="`/production/recoltes/${recolte.id}`"
    class="group block rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <!-- Header -->
    <div class="mb-3 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <UIcon name="i-lucide-droplets" class="h-5 w-5 text-honey-deep" />
        </div>
        <div>
          <p class="font-semibold text-stone-900">
            {{ recolte.typeMiel || 'Recolte' }}
          </p>
          <p class="text-xs text-stone-400">
            {{ formatDate(recolte.dateRecolte) }}
          </p>
        </div>
      </div>
      <span
        v-if="recolte.numeroLot"
        class="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
      >
        {{ recolte.numeroLot }}
      </span>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-3 gap-3">
      <div v-if="recolte.quantiteKg" class="text-center">
        <p class="text-lg font-bold text-stone-900">{{ Number(recolte.quantiteKg) }}</p>
        <p class="text-xs text-stone-400">kg</p>
      </div>
      <div v-if="recolte.humidite" class="text-center">
        <p class="text-lg font-bold" :class="humiditeColor">{{ Number(recolte.humidite) }}%</p>
        <p class="text-xs text-stone-400">humidite</p>
      </div>
      <div v-if="recolte.nombreHausses" class="text-center">
        <p class="text-lg font-bold text-stone-900">{{ recolte.nombreHausses }}</p>
        <p class="text-xs text-stone-400">hausse{{ recolte.nombreHausses > 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- Footer -->
    <div
      v-if="recolte.rucherNom || recolte.rucheNumero"
      class="mt-3 border-t border-stone-100 pt-3"
    >
      <div class="flex items-center gap-2 text-xs text-stone-400">
        <UIcon name="i-lucide-map-pin" class="h-3.5 w-3.5" />
        <span>{{ recolte.rucherNom }}</span>
        <span v-if="recolte.rucheNumero" class="text-stone-300">·</span>
        <span v-if="recolte.rucheNumero">Ruche {{ recolte.rucheNumero }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface RecolteDisplay {
  id: string;
  dateRecolte: string | Date;
  typeMiel: string | null;
  quantiteKg: string | null;
  humidite: string | null;
  nombreHausses: number | null;
  numeroLot: string | null;
  rucherNom?: string | null;
  rucheNumero?: string | null;
}

const props = defineProps<{
  recolte: RecolteDisplay;
}>();

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const humiditeColor = computed(() => {
  const h = Number(props.recolte.humidite);
  if (h <= 18) return 'text-honey-deep';
  if (h <= 20) return 'text-honey-deep';
  return 'text-red-600';
});
</script>
