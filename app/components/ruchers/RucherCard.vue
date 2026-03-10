<template>
  <NuxtLink :to="`/ruchers/${rucher.id}`" class="group block">
    <div
      class="relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md"
    >
      <!-- Accent bar -->
      <div class="h-1" :class="rucher.actif ? 'bg-emerald-400' : 'bg-stone-300'" />

      <div class="p-4">
        <!-- Header: icon + name + badge -->
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="envStyle.bg"
          >
            <UIcon :name="envStyle.icon" class="h-5 w-5" :class="envStyle.text" />
          </div>
          <div class="min-w-0 flex-1">
            <h3
              class="truncate font-semibold text-stone-900 transition-colors group-hover:text-amber-700"
            >
              {{ rucher.nom }}
            </h3>
            <p class="truncate text-xs text-stone-400">{{ locationLabel }}</p>
          </div>
          <UBadge :color="rucher.actif ? 'success' : 'neutral'" variant="subtle" size="xs">
            {{ rucher.actif ? 'Actif' : 'Inactif' }}
          </UBadge>
        </div>

        <!-- Stats row -->
        <div class="mt-3 flex items-center gap-4 text-xs text-stone-500">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-box" class="h-3.5 w-3.5 text-stone-400" />
            <span class="font-medium tabular-nums">{{ ruchesCount }}</span>
            ruche{{ ruchesCount > 1 ? 's' : '' }}
          </span>
          <span v-if="productionSaison > 0" class="flex items-center gap-1">
            <UIcon name="i-lucide-droplets" class="h-3.5 w-3.5 text-amber-400" />
            <span class="font-medium tabular-nums">{{ formatKg(productionSaison) }}</span>
            kg
          </span>
          <span v-if="scoreSante" class="flex items-center gap-1">
            <span
              class="h-2 w-2 rounded-full"
              :class="
                scoreSante >= 70
                  ? 'bg-emerald-500'
                  : scoreSante >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              "
            />
            {{ scoreSante }}%
          </span>
        </div>

        <!-- Metadata pills -->
        <div class="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            v-if="rucher.environnement"
            class="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
          >
            {{ rucher.environnement }}
          </span>
          <span
            v-if="rucher.departement"
            class="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
          >
            {{ rucher.departement }}
          </span>
        </div>

        <!-- Footer: derniere visite -->
        <div
          v-if="derniereVisite"
          class="mt-3 border-t border-stone-100 pt-2.5 text-[11px] text-stone-400"
        >
          Derniere visite {{ derniereVisite }}
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
  productionSaison?: number;
  scoreSante?: number | null;
  derniereVisiteDate?: string | null;
}>();

const ruchesCount = computed(() => props.ruchesCount ?? 0);
const productionSaison = computed(() => props.productionSaison ?? 0);
const scoreSante = computed(() => props.scoreSante ?? null);

const locationLabel = computed(() => {
  const parts = [props.rucher.commune, props.rucher.departement].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : props.rucher.adresse || 'Emplacement non renseigne';
});

const derniereVisite = computed(() => {
  if (!props.derniereVisiteDate) return null;
  const date = new Date(props.derniereVisiteDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 30) return `il y a ${diffDays}j`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
  return `il y a ${Math.floor(diffDays / 365)} an(s)`;
});

function formatKg(value: number): string {
  return Math.round(value * 10) / 10 > 0
    ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
    : '0';
}

const envIcons: Record<string, { icon: string; bg: string; text: string }> = {
  foret: { icon: 'i-lucide-trees', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  plaine: { icon: 'i-lucide-flower-2', bg: 'bg-lime-50', text: 'text-lime-600' },
  montagne: { icon: 'i-lucide-mountain', bg: 'bg-sky-50', text: 'text-sky-600' },
  urbain: { icon: 'i-lucide-building-2', bg: 'bg-stone-100', text: 'text-stone-600' },
  littoral: { icon: 'i-lucide-waves', bg: 'bg-blue-50', text: 'text-blue-600' },
};

const envStyle = computed(() => {
  const env = props.rucher.environnement?.toLowerCase() ?? '';
  return envIcons[env] ?? { icon: 'i-lucide-map-pin', bg: 'bg-amber-50', text: 'text-amber-600' };
});
</script>
