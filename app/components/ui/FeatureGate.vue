<script setup lang="ts">
import { minimumPlanFor, PLAN_CONFIGS } from '~/config/plans';
import type { PlanFeatures } from '~/config/plans';

const props = defineProps<{
  feature: keyof PlanFeatures;
  blur?: boolean;
}>();

const emit = defineEmits<{
  'activate-trial': [];
}>();

const gating = useGating();
const hasAccess = computed(() => gating.can(props.feature));
const required = computed(() => minimumPlanFor(props.feature));
const requiredConfig = computed(() => PLAN_CONFIGS[required.value]);
</script>

<template>
  <!-- L'utilisateur a accès → afficher normalement -->
  <slot v-if="hasAccess" />

  <!-- Pas accès + mode blur → teaser flou avec overlay -->
  <div v-else-if="blur" class="relative">
    <!-- Contenu flou en arrière-plan -->
    <div class="pointer-events-none select-none blur-sm opacity-40">
      <slot name="preview">
        <slot />
      </slot>
    </div>

    <!-- Overlay CTA -->
    <div
      class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-xl"
    >
      <div class="text-center px-6 py-8 max-w-sm">
        <div
          class="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center"
        >
          <UIcon name="i-lucide-lock" class="text-amber-500 text-xl" />
        </div>
        <h3 class="text-lg font-semibold text-stone-800 mb-2">
          Fonctionnalité {{ requiredConfig.label }}
        </h3>
        <p class="text-sm text-stone-500 mb-6">
          Disponible à partir du plan {{ requiredConfig.label }}
          <template v-if="requiredConfig.prix"> ({{ requiredConfig.prix.mois }}€/mois) </template>
        </p>
        <div class="flex flex-col gap-2">
          <UButton color="primary" to="/tarifs" block> Voir les plans </UButton>
          <UButton
            v-if="
              gating.plan.value === 'decouverte' &&
              !gating.trial.value?.active &&
              !gating.trial.value?.daysRemaining
            "
            variant="outline"
            color="neutral"
            block
            @click="emit('activate-trial')"
          >
            Essayer Pro 14 jours gratuitement
          </UButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Pas accès + pas blur → rien -->
  <template v-else />
</template>
