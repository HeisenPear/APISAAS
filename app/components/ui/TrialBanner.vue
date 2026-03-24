<script setup lang="ts">
const gating = useGating();

const show = computed(
  () =>
    gating.trial.value?.active &&
    gating.trial.value?.daysRemaining !== null &&
    !gating.isAdmin.value,
);

const urgent = computed(() => (gating.trial.value?.daysRemaining ?? 0) <= 3);

const days = computed(() => gating.trial.value?.daysRemaining ?? 0);
</script>

<template>
  <div
    v-if="show"
    class="px-4 py-2 text-center text-sm font-medium transition-colors"
    :class="
      urgent
        ? 'bg-red-50 text-red-700 border-b border-red-100'
        : 'bg-amber-50 text-amber-700 border-b border-amber-100'
    "
  >
    <UIcon
      :name="urgent ? 'i-lucide-alert-triangle' : 'i-lucide-sparkles'"
      class="mr-1 inline-block"
    />
    Essai Pro :
    <strong>{{ days }} jour{{ days > 1 ? 's' : '' }}</strong>
    restant{{ days > 1 ? 's' : '' }}
    <NuxtLink to="/tarifs" class="underline ml-2 font-semibold hover:no-underline">
      Passer au plan Pro →
    </NuxtLink>
  </div>
</template>
