<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
          <UIcon name="i-lucide-layers" class="h-4 w-4 text-amber-600" />
        </div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Cire</h3>
      </div>
      <button
        class="rounded-lg px-2.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
        @click="$emit('addRenouvellement')"
      >
        + Renouvellement
      </button>
    </div>

    <div class="p-5">
      <!-- Statut indicator -->
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="statutBgClass">
          <UIcon :name="statutIcon" class="h-5 w-5" :class="statutIconClass" />
        </div>
        <div>
          <p class="text-sm font-semibold text-stone-900">{{ statutLabel }}</p>
          <p v-if="dernierRenouvellement" class="text-xs text-stone-400">
            Dernier renouvellement {{ relativeDate(dernierRenouvellement.dateRenouvellement) }}
          </p>
        </div>
      </div>

      <!-- Historique (derniers 3) -->
      <div v-if="historique.length > 0" class="space-y-2">
        <p class="text-[10px] font-medium uppercase tracking-wider text-stone-400">
          Historique renouvellement
        </p>
        <div
          v-for="entry in historique.slice(0, 3)"
          :key="entry.id"
          class="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2"
        >
          <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-50/70">
            <UIcon name="i-lucide-layers" class="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-medium text-stone-700">
              {{
                entry.nombreCadresRenouveles
                  ? `${entry.nombreCadresRenouveles} cadre(s) renouvelés`
                  : 'Renouvellement'
              }}
            </p>
          </div>
          <span class="shrink-0 text-[10px] text-stone-400">{{
            relativeDate(entry.dateRenouvellement)
          }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="py-2 text-center text-xs text-stone-400">
        Aucun renouvellement de cire enregistré
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface HistoriqueCireEntry {
  id: string;
  dateRenouvellement: string;
  nombreCadresRenouveles: number | null;
  notes: string | null;
}

const props = defineProps<{
  historique: HistoriqueCireEntry[];
}>();

defineEmits<{ addRenouvellement: [] }>();

const SEUIL_ALERTE_JOURS = 3 * 365;

const dernierRenouvellement = computed(() => props.historique[0] ?? null);

const ageJours = computed(() => {
  if (!dernierRenouvellement.value) return null;
  return Math.floor(
    (Date.now() - new Date(dernierRenouvellement.value.dateRenouvellement).getTime()) / 86400000,
  );
});

const enAlerte = computed(() => ageJours.value === null || ageJours.value > SEUIL_ALERTE_JOURS);

const statutLabel = computed(() => {
  if (!dernierRenouvellement.value) return 'Aucune donnée';
  if (enAlerte.value) return 'À renouveler';
  return 'Cire récente';
});

const statutBgClass = computed(() => (enAlerte.value ? 'bg-amber-50' : 'bg-amber-50'));
const statutIconClass = computed(() => (enAlerte.value ? 'text-amber-600' : 'text-amber-600'));
const statutIcon = computed(() =>
  enAlerte.value ? 'i-lucide-alert-triangle' : 'i-lucide-check-circle',
);

function relativeDate(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days}j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an(s)`;
}
</script>
