<template>
  <div class="space-y-4">
    <div
      v-for="lot in lots"
      :key="lot.numeroLot"
      class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <!-- Header -->
      <div class="mb-3 flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <UIcon name="i-lucide-package" class="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p class="font-semibold text-stone-900">{{ lot.numeroLot }}</p>
            <p class="text-xs text-stone-400">{{ lot.typeMiel || 'Non specifie' }}</p>
          </div>
        </div>
        <span class="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
          {{ Number(lot.totalKg).toFixed(1) }} kg
        </span>
      </div>

      <!-- Details -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p class="text-xs text-stone-400">Recoltes</p>
          <p class="text-sm font-medium text-stone-700">{{ lot.nombreRecoltes }}</p>
        </div>
        <div>
          <p class="text-xs text-stone-400">Rucher</p>
          <p class="text-sm font-medium text-stone-700">{{ lot.rucherNom || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-stone-400">Humidite moy.</p>
          <p class="text-sm font-medium" :class="humiditeColor(lot.humiditeMoyenne)">
            {{ lot.humiditeMoyenne ? `${lot.humiditeMoyenne}%` : '-' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-stone-400">Periode</p>
          <p class="text-sm font-medium text-stone-700">
            {{ formatPeriod(lot.dateDebut, lot.dateFin) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="lots.length === 0" class="py-12 text-center text-sm text-stone-400">
      Aucun lot enregistre. Attribuez un numero de lot a vos recoltes pour activer la tracabilite.
    </div>
  </div>
</template>

<script setup lang="ts">
interface LotDisplay {
  numeroLot: string;
  typeMiel: string;
  totalKg: string;
  nombreRecoltes: number;
  dateDebut: string;
  dateFin: string;
  rucherNom: string;
  humiditeMoyenne: string;
}

defineProps<{
  lots: LotDisplay[];
}>();

function humiditeColor(val: string | null): string {
  if (!val) return 'text-stone-700';
  const h = Number(val);
  if (h <= 18) return 'text-emerald-600';
  if (h <= 20) return 'text-amber-600';
  return 'text-red-600';
}

function formatPeriod(debut: string, fin: string): string {
  const d = new Date(debut);
  const f = new Date(fin);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  if (d.getMonth() === f.getMonth() && d.getFullYear() === f.getFullYear()) {
    return d.toLocaleDateString('fr-FR', opts);
  }
  return `${d.toLocaleDateString('fr-FR', { month: 'short' })} - ${f.toLocaleDateString('fr-FR', opts)}`;
}
</script>
