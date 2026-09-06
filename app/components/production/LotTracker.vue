<template>
  <div class="space-y-4">
    <NuxtLink
      v-for="lot in lots"
      :key="lot.numeroLot"
      :to="`/production/lots/${encodeURIComponent(lot.numeroLot)}`"
      class="block rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:border-amber-300 hover:shadow-md"
    >
      <!-- Header -->
      <div class="mb-3 flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <UIcon name="i-lucide-package" class="h-5 w-5 text-honey-deep" />
          </div>
          <div>
            <p class="font-semibold text-stone-900">{{ lot.numeroLot }}</p>
            <p class="text-xs text-stone-400">{{ lot.typeMiel || 'Non specifie' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {{ Number(lot.totalKg).toFixed(1) }} kg
          </span>
          <!-- Humidity badge -->
          <span
            v-if="lot.humiditeMoyenne"
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="
              humiditeConforme(lot.humiditeMoyenne)
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            "
          >
            {{ Number(lot.humiditeMoyenne) <= 20 ? '&#10003;' : '&#10007;' }}
            {{ lot.humiditeMoyenne }}%
          </span>
        </div>
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

      <!-- Footer: CTA -->
      <div class="mt-3 flex items-center justify-end gap-1 border-t border-stone-100 pt-3">
        <span class="text-xs text-honey-deep">Voir la tracabilite complete</span>
        <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5 text-amber-400" />
      </div>
    </NuxtLink>

    <!-- Empty -->
    <UiEmptyState
      v-if="lots.length === 0"
      icon="i-lucide-package"
      title="Aucun lot enregistre"
      description="Attribuez un numero de lot a vos recoltes pour activer la tracabilite."
    />
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
  if (h <= 18) return 'text-honey-deep';
  if (h <= 20) return 'text-honey-deep';
  return 'text-red-600';
}

function humiditeConforme(val: string | null): boolean {
  if (!val) return true;
  return Number(val) <= 20;
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
