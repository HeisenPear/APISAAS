<script setup lang="ts">
// Carte d'accroche dashboard : surface « Ma tournée du jour » si l'utilisateur y
// a droit ET qu'il y a effectivement des ruchers à visiter. Sinon : rien (la
// carte ne s'affiche pas, zéro impact layout).
interface Tournee {
  nbRuchersAVisiter: number;
  nbRuchesAVisiter: number;
  totalKm: number;
  arrets: unknown[];
}

const gating = useGating();
const entitled = computed(() => gating.can('tourneeOptimisee'));

/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
 * Typer ce chemin contre l'union des 213 routes fait déplier à TypeScript le
 * type de retour réel de chaque handler ; le projet est au-delà du plafond
 * d'instanciation. Le type est donné ici, donc toujours vérifié.
 */
const { data, execute } = useAsyncData<{ data: Tournee }>(
  'dashboard-tournee',
  () => appelApi<{ data: Tournee }>('/api/tournee'),
  { lazy: true, immediate: false },
);

// Le profil (donc l'éligibilité) peut arriver après le montage sur le dashboard
// post-login : on déclenche le fetch dès que l'éligibilité est confirmée.
watch(entitled, (ok) => ok && execute(), { immediate: true });

const t = computed(() => data.value?.data ?? null);
const show = computed(() => entitled.value && !!t.value && t.value.nbRuchersAVisiter > 0);
</script>

<template>
  <NuxtLink
    v-if="show && t"
    to="/tournee"
    class="flex items-center gap-4 rounded-[14px] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    style="
      border-color: color-mix(in srgb, var(--honey) 35%, transparent);
      background: var(--honey-soft);
    "
  >
    <span
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style="background: white"
    >
      <UIcon name="i-lucide-route" class="h-5 w-5" style="color: var(--honey-deep)" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="text-[15px] font-semibold text-[var(--text-primary)]">Ta tournée du jour</p>
      <p class="mt-0.5 text-[13px] text-[var(--text-secondary)]">
        {{ t.nbRuchersAVisiter }} rucher{{ t.nbRuchersAVisiter > 1 ? 's' : '' }} ·
        {{ t.nbRuchesAVisiter }} ruche{{ t.nbRuchesAVisiter > 1 ? 's' : '' }} à visiter<span
          v-if="t.arrets.length > 1"
        >
          · ~{{ t.totalKm }} km</span
        >
      </p>
    </div>
    <span
      class="hidden shrink-0 items-center gap-1 rounded-[10px] px-3 py-2 text-[13px] font-semibold text-white sm:flex"
      style="background: var(--honey)"
    >
      Voir l'itinéraire
      <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
    </span>
    <UIcon
      name="i-lucide-chevron-right"
      class="h-5 w-5 shrink-0 text-[var(--honey-deep)] sm:hidden"
    />
  </NuxtLink>
</template>
