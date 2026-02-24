<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-stone-900">Alertes</h3>
        <p class="text-xs text-stone-500">
          {{ displayCount }} active{{ displayCount > 1 ? 's' : '' }}
        </p>
      </div>
      <NuxtLink
        to="/alertes"
        class="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
      >
        Voir toutes
      </NuxtLink>
    </div>

    <div v-if="alertes.length === 0" class="py-8 text-center text-sm text-stone-400">
      Aucune alerte active
    </div>

    <ul v-else class="mt-4 space-y-2">
      <li
        v-for="alerte in alertes"
        :key="alerte.id"
        class="rounded-xl border-l-[3px] bg-stone-50 px-3 py-2.5"
        :class="borderColor(alerte.priorite)"
      >
        <div class="flex items-start gap-2">
          <UIcon
            :name="prioriteIcon(alerte.priorite)"
            class="mt-0.5 h-4 w-4 shrink-0"
            :class="textColor(alerte.priorite)"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-stone-700">{{ alerte.titre }}</p>
            <p v-if="alerte.message" class="mt-0.5 truncate text-xs text-stone-500">
              {{ alerte.message }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  alertes: Array<{
    id: string;
    type: string;
    titre: string;
    message?: string | null;
    priorite?: string | null;
  }>;
  total?: number;
}>();

const displayCount = computed(() => props.total ?? props.alertes.length);

function borderColor(priorite?: string | null): string {
  switch (priorite) {
    case 'critique':
      return 'border-red-500';
    case 'haute':
      return 'border-orange-500';
    case 'moyenne':
      return 'border-amber-400';
    default:
      return 'border-blue-400';
  }
}

function textColor(priorite?: string | null): string {
  switch (priorite) {
    case 'critique':
      return 'text-red-500';
    case 'haute':
      return 'text-orange-500';
    case 'moyenne':
      return 'text-amber-500';
    default:
      return 'text-blue-500';
  }
}

function prioriteIcon(priorite?: string | null): string {
  switch (priorite) {
    case 'critique':
      return 'i-lucide-alert-octagon';
    case 'haute':
      return 'i-lucide-alert-triangle';
    case 'moyenne':
      return 'i-lucide-alert-circle';
    default:
      return 'i-lucide-info';
  }
}
</script>
