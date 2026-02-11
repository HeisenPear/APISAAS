<template>
  <NuxtLink :to="`/ruchers/${rucher.id}`" class="group block">
    <div
      class="relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md"
    >
      <!-- Map preview / placeholder -->
      <div class="relative h-32 bg-gradient-to-br from-amber-50 to-stone-100">
        <div
          v-if="rucher.latitude && rucher.longitude"
          class="absolute inset-0 flex items-center justify-center"
        >
          <UIcon name="i-lucide-map-pin" class="h-8 w-8 text-amber-400/60" />
        </div>
        <div v-else class="absolute inset-0 flex items-center justify-center">
          <UIcon name="i-lucide-map" class="h-8 w-8 text-stone-300" />
        </div>

        <!-- Status badge -->
        <div class="absolute right-3 top-3">
          <UBadge v-if="rucher.actif" color="success" variant="subtle" size="xs">Actif</UBadge>
          <UBadge v-else color="neutral" variant="subtle" size="xs">Inactif</UBadge>
        </div>

        <!-- Environment badge -->
        <div v-if="rucher.environnement" class="absolute bottom-3 left-3">
          <span
            class="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-stone-600 backdrop-blur-sm"
          >
            {{ rucher.environnement }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        <h3 class="truncate font-semibold text-stone-900 group-hover:text-amber-700">
          {{ rucher.nom }}
        </h3>
        <p class="mt-1 truncate text-sm text-stone-500">
          {{ locationLabel }}
        </p>

        <!-- Stats row -->
        <div class="mt-3 flex items-center gap-4 text-xs text-stone-400">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-box" class="h-3.5 w-3.5" />
            {{ ruchesCount }} ruche{{ ruchesCount > 1 ? 's' : '' }}
          </span>
          <span v-if="rucher.departement" class="flex items-center gap-1">
            <UIcon name="i-lucide-map-pin" class="h-3.5 w-3.5" />
            {{ rucher.departement }}
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Rucher } from '~/types/models';

const props = defineProps<{
  rucher: Rucher;
  ruchesCount?: number;
}>();

const ruchesCount = computed(() => props.ruchesCount ?? 0);

const locationLabel = computed(() => {
  const parts = [props.rucher.commune, props.rucher.departement].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : props.rucher.adresse || 'Emplacement non renseigne';
});
</script>
