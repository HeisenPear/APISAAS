<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6">
        <div class="mb-6 text-center">
          <div
            class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100"
          >
            <UIcon name="i-lucide-crown" class="h-6 w-6 text-amber-600" />
          </div>
          <h2 class="text-lg font-semibold text-stone-900">Limite du plan atteinte</h2>
          <p class="mt-1 text-sm text-stone-500">
            Vous avez atteint la limite de {{ currentLimits?.ruches ?? 10 }} ruches de votre plan
            {{ currentLimits?.label ?? 'Découverte' }}.
          </p>
        </div>

        <!-- Plans comparison -->
        <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            v-for="(plan, key) in upgradePlans"
            :key="key"
            class="rounded-xl border-2 p-4 transition-all"
            :class="
              key === recommended ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-stone-200'
            "
          >
            <div class="mb-2 text-sm font-semibold text-stone-900">{{ plan.label }}</div>
            <div class="mb-1 text-lg font-bold text-amber-600">{{ plan.prix }}</div>
            <div class="text-xs text-stone-500">
              {{ plan.ruches === Infinity ? 'Ruches illimitées' : `Jusqu'à ${plan.ruches} ruches` }}
            </div>
            <UButton
              v-if="key !== currentPlan"
              :label="key === recommended ? 'Recommandé' : 'Choisir'"
              :color="key === recommended ? 'primary' : 'neutral'"
              :variant="key === recommended ? 'solid' : 'outline'"
              size="sm"
              class="mt-3 w-full"
              :loading="loading"
              @click="handleUpgrade(key as 'starter' | 'pro' | 'expert')"
            />
            <div v-else class="mt-3 text-center text-xs font-medium text-stone-400">
              Plan actuel
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <UButton label="Plus tard" variant="ghost" color="neutral" @click="isOpen = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { currentPlan, currentLimits, planLimits, nextPlan, loading, checkout } = useSubscription();

const isOpen = defineModel<boolean>({ default: false });

const recommended = computed(() => nextPlan.value ?? 'expert');

const upgradePlans = computed(() => {
  const plans: Record<string, { label: string; ruches: number; prix: string }> = {};
  for (const [key, val] of Object.entries(planLimits)) {
    if (key === 'decouverte') continue;
    plans[key] = val;
  }
  return plans;
});

async function handleUpgrade(plan: 'starter' | 'pro' | 'expert') {
  await checkout(plan);
}
</script>
