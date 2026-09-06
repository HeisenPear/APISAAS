<script setup lang="ts">
type DeclarationNapi = { annee: number; statut: string };

/**
 * ⚠️ `appelApi` PLUTÔT QUE `$fetch`/`useFetch` — cf. `app/utils/appelApi.ts`.
 * Typer le chemin contre l'union des 213 routes fait déplier à TypeScript le
 * type de retour réel de chaque handler ; ce projet en était à 9,3 millions
 * d'instanciations pour une limite de 5, et la moindre route ajoutée rendait
 * le typecheck rouge. Le type est donné, donc toujours vérifié.
 */
const { data } = await useAsyncData<{ data: DeclarationNapi[] }>('napi-declarations', () =>
  appelApi<{ data: DeclarationNapi[] }>('/api/declarations/napi'),
);
const declarations = computed<DeclarationNapi[]>(() => data.value?.data ?? []);

const currentYear = new Date().getFullYear();
const now = new Date();
const month = now.getMonth() + 1; // 1-indexed
const day = now.getDate();

// Visible de août à décembre, masqué si déjà déclaré cette année
const alreadyDeclared = computed(() =>
  declarations.value.some((d) => d.annee === currentYear && d.statut !== 'brouillon'),
);

const inPeriod = month >= 8 && month <= 12;

const urgencyLevel = computed(() => {
  if (month < 9) return 'prep'; // août
  if (month < 11) return 'info'; // sept-oct
  if (month === 11 || (month === 12 && day < 15)) return 'warning'; // nov - 14 déc
  if (month === 12 && day <= 30) return 'danger'; // 15-30 déc
  return 'critical'; // 31 déc
});

const bannerConfig = computed(() => {
  switch (urgencyLevel.value) {
    case 'prep':
      return {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'i-lucide-calendar-check',
        iconColor: 'text-blue-500',
        title: 'Préparez votre déclaration NAPI',
        text: "La période de déclaration s'ouvre le 1er septembre. Vos données sont prêtes.",
      };
    case 'info':
      return {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'i-lucide-info',
        iconColor: 'text-blue-500',
        title: 'Déclaration NAPI ouverte',
        text: `Déclarez votre cheptel avant le 31 décembre ${currentYear}.`,
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 border-amber-200',
        icon: 'i-lucide-alert-triangle',
        iconColor: 'text-amber-500',
        title: 'Déclaration NAPI — Pensez-y !',
        text: `Il vous reste moins d'un mois pour déclarer votre cheptel (31 décembre ${currentYear}).`,
      };
    case 'danger':
      return {
        bg: 'bg-red-50 border-red-200',
        icon: 'i-lucide-alert-circle',
        iconColor: 'text-red-500',
        title: `URGENT — ${30 - day + 1} jours restants !`,
        text: `La déclaration NAPI expire le 31 décembre ${currentYear}. Agissez maintenant.`,
      };
    case 'critical':
      return {
        bg: 'bg-red-100 border-red-400',
        icon: 'i-lucide-alert-circle',
        iconColor: 'text-red-600',
        title: 'DERNIER JOUR — Déclaration NAPI !',
        text: `Dernière chance pour déclarer votre cheptel apicole ${currentYear}.`,
      };
    default:
      return null;
  }
});

const show = computed(() => inPeriod && !alreadyDeclared.value && bannerConfig.value !== null);
</script>

<template>
  <div
    v-if="show"
    class="mb-6 flex items-start gap-3 rounded-2xl border p-4"
    :class="bannerConfig!.bg"
  >
    <UIcon
      :name="bannerConfig!.icon"
      class="mt-0.5 h-5 w-5 shrink-0"
      :class="bannerConfig!.iconColor"
    />
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-stone-900 text-sm">{{ bannerConfig!.title }}</p>
      <p class="text-sm text-stone-600 mt-0.5">{{ bannerConfig!.text }}</p>
    </div>
    <NuxtLink to="/declarations/napi">
      <UButton size="xs" color="primary" variant="soft">Déclarer →</UButton>
    </NuxtLink>
  </div>
</template>
