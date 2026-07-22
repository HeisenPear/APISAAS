<script setup lang="ts">
interface ReineNoeud {
  id: string;
  identifiant: string | null;
  couleurMarquage: string | null;
  anneeNaissance: number | null;
  estActive: boolean;
  ligneeNom: string | null;
}
interface Generation {
  niveau: number;
  reines: ReineNoeud[];
}

const props = defineProps<{
  generations: Generation[];
  focusId: string;
}>();

const marquageColors: Record<string, string> = {
  blanc: 'bg-white border-2 border-stone-300',
  jaune: 'bg-yellow-400',
  rouge: 'bg-red-500',
  vert: 'bg-amber-500',
  bleu: 'bg-blue-500',
};

function libelleNiveau(niveau: number): string {
  if (niveau === 0) return 'Cette reine';
  if (niveau === -1) return 'Mère';
  if (niveau < -1) return `Ancêtre (${Math.abs(niveau)}ᵉ génération)`;
  if (niveau === 1) return 'Filles';
  return `Descendance (${niveau}ᵉ génération)`;
}

const nomReine = (r: ReineNoeud) => r.identifiant || `Reine ${r.id.slice(-4)}`;
const aUneSeuleGeneration = computed(() => props.generations.length <= 1);
</script>

<template>
  <div v-if="aUneSeuleGeneration" class="py-6 text-center text-sm text-[var(--text-tertiary)]">
    Aucune ascendance ni descendance enregistrée pour cette reine — renseignez sa
    <strong>reine mère</strong> ou reliez ses filles pour voir apparaître l'arbre.
  </div>
  <div v-else class="flex gap-6 overflow-x-auto pb-2">
    <div
      v-for="gen in generations"
      :key="gen.niveau"
      class="flex min-w-[180px] flex-shrink-0 flex-col gap-2"
    >
      <p class="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
        {{ libelleNiveau(gen.niveau) }}
      </p>
      <NuxtLink
        v-for="r in gen.reines"
        :key="r.id"
        :to="`/elevage/reines/${r.id}`"
        class="flex items-center gap-2 rounded-[12px] border p-3 text-left transition-colors"
        :class="
          r.id === focusId
            ? 'border-[var(--honey)] bg-[var(--honey-soft)]'
            : 'border-[var(--border-default)] bg-white hover:bg-[var(--surface-muted)]'
        "
      >
        <span
          :class="marquageColors[r.couleurMarquage || 'blanc']"
          class="h-3 w-3 shrink-0 rounded-full"
        />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[13px] font-medium text-[var(--text-primary)]">
            {{ nomReine(r) }}
          </span>
          <span class="block text-[11px] text-[var(--text-tertiary)]">
            {{ r.anneeNaissance ?? '—' }}<span v-if="r.ligneeNom"> · {{ r.ligneeNom }}</span>
          </span>
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
