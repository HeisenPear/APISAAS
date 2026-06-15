<template>
  <div class="rounded-[12px] border border-[var(--border-default)] bg-white px-4 py-3">
    <!-- Annulée : état terminal -->
    <div v-if="statut === 'annulee'" class="flex items-center gap-2">
      <UIcon name="i-lucide-ban" class="h-4 w-4 text-[var(--text-tertiary)]" />
      <span class="text-[13px] font-semibold text-[var(--text-secondary)]">Facture annulée</span>
    </div>

    <template v-else>
      <!-- Stepper -->
      <ol class="flex items-center">
        <li
          v-for="(step, i) in steps"
          :key="step.key"
          class="flex flex-1 items-center last:flex-none"
        >
          <div class="flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full border text-[12px] transition-colors"
              :class="dotClass(i)"
            >
              <UIcon :name="i < currentIndex ? 'i-lucide-check' : step.icon" class="h-3.5 w-3.5" />
            </span>
            <span
              class="text-[12.5px] font-semibold"
              :class="
                i <= currentIndex ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              "
            >
              {{ i === 1 && enRetard ? 'En retard' : step.label }}
            </span>
          </div>
          <!-- Connecteur -->
          <span
            v-if="i < steps.length - 1"
            class="mx-3 h-px flex-1 rounded"
            :class="i < currentIndex ? 'bg-[var(--honey)]' : 'bg-[var(--border-default)]'"
          />
        </li>
      </ol>

      <!-- Aide contextuelle -->
      <p
        class="mt-2 text-[12px] leading-snug"
        :class="enRetard ? 'text-[var(--clay-deep)]' : 'text-[var(--text-secondary)]'"
      >
        {{ aide }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ statut: string }>();

const steps = [
  { key: 'brouillon', label: 'Brouillon', icon: 'i-lucide-file-pen' },
  { key: 'envoyee', label: 'Envoyée', icon: 'i-lucide-send' },
  { key: 'payee', label: 'Payée', icon: 'i-lucide-check-circle' },
];

const ORDRE: Record<string, number> = { brouillon: 0, envoyee: 1, en_retard: 1, payee: 2 };
const currentIndex = computed(() => ORDRE[props.statut] ?? 0);
const enRetard = computed(() => props.statut === 'en_retard');

function dotClass(i: number): string {
  if (i < currentIndex.value)
    return 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]';
  if (i === currentIndex.value) {
    return enRetard.value
      ? 'border-[var(--clay)] bg-[var(--clay-soft)] text-[var(--clay-deep)]'
      : 'border-[var(--honey)] bg-[var(--honey)] text-white';
  }
  return 'border-[var(--border-default)] bg-white text-[var(--text-quaternary)]';
}

const aide = computed(() => {
  switch (props.statut) {
    case 'brouillon':
      return 'Ce brouillon est encore modifiable. Une fois envoyée, la facture est figée — toute correction passera par un avoir.';
    case 'envoyee':
      return 'Facture envoyée et figée. Marquez-la « payée » dès réception du règlement.';
    case 'en_retard':
      return 'Paiement en retard — un petit rappel à votre client ne ferait pas de mal.';
    case 'payee':
      return 'Facture réglée — tout est en ordre 🎉';
    default:
      return '';
  }
});
</script>
