<template>
  <Teleport to="body">
    <Transition name="lc">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        @click.self="close"
      >
        <div
          class="lc-card flex w-full flex-col overflow-hidden rounded-t-[22px] bg-white shadow-2xl sm:max-w-md sm:rounded-[22px]"
        >
          <!-- Header -->
          <div
            class="flex shrink-0 items-center justify-between border-b px-5 py-4"
            style="border-color: var(--border-default)"
          >
            <div>
              <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
                Confirmer votre abonnement
              </p>
              <p v-if="planLabel" class="text-[12px]" style="color: var(--text-tertiary)">
                Formule {{ planLabel }}
              </p>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-muted)]"
              @click="close"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" style="color: var(--text-tertiary)" />
            </button>
          </div>

          <!-- Body -->
          <div class="space-y-3 px-5 py-4">
            <div class="flex items-start gap-2.5 text-[13.5px] text-stone-600">
              <UCheckbox v-model="acceptCgv" class="mt-0.5" />
              <span>
                J'ai lu et j'accepte les
                <NuxtLink
                  to="/cgv"
                  target="_blank"
                  class="font-medium text-amber-600 hover:underline"
                  >Conditions Générales de Vente</NuxtLink
                >
                et les
                <NuxtLink
                  to="/cgu"
                  target="_blank"
                  class="font-medium text-amber-600 hover:underline"
                  >CGU</NuxtLink
                >.
              </span>
            </div>

            <div class="flex items-start gap-2.5 text-[13.5px] text-stone-600">
              <UCheckbox v-model="acceptWaiver" class="mt-0.5" />
              <span>
                Je demande l'accès immédiat au service et reconnais
                <strong>renoncer à mon droit de rétractation</strong> de 14 jours (art. L221-28 du
                Code de la consommation).
              </span>
            </div>

            <p class="rounded-lg bg-stone-50 px-3 py-2 text-[12px] text-stone-500">
              Paiement sécurisé via Stripe · résiliable à tout moment depuis vos paramètres.
            </p>
          </div>

          <!-- Footer -->
          <div
            class="shrink-0 border-t px-5 py-4"
            style="
              border-color: var(--border-default);
              padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
            "
          >
            <UButton
              block
              color="primary"
              size="lg"
              icon="i-lucide-lock"
              :loading="loading"
              :disabled="!allAccepted"
              class="font-semibold"
              @click="confirm"
            >
              Confirmer et payer
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  planLabel?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [];
}>();

const acceptCgv = ref(false);
const acceptWaiver = ref(false);
const allAccepted = computed(() => acceptCgv.value && acceptWaiver.value);

function confirm() {
  if (!allAccepted.value) return;
  emit('confirm');
}

function close() {
  emit('update:open', false);
}

// Réinitialise les cases à chaque ouverture (évite une acceptation « fantôme »).
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      acceptCgv.value = false;
      acceptWaiver.value = false;
    }
  },
);
</script>

<style scoped>
.lc-enter-active,
.lc-leave-active {
  transition: opacity 200ms ease;
}
.lc-enter-active .lc-card,
.lc-leave-active .lc-card {
  transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
.lc-enter-from,
.lc-leave-to {
  opacity: 0;
}
.lc-enter-from .lc-card,
.lc-leave-to .lc-card {
  transform: translateY(16px);
}
</style>
