<template>
  <UiExpandableCard
    title="Alertes"
    :subtitle="`${displayCount} active${displayCount > 1 ? 's' : ''}`"
    icon-container-class="bg-[var(--clay-soft)]"
    icon-class="text-[var(--clay-deep)]"
    icon="i-lucide-bell-ring"
    :default-expanded="alertes.length > 0"
  >
    <template #badge>
      <span
        v-if="displayCount > 0"
        class="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
        style="background: var(--status-bad)"
      >
        {{ displayCount }}
      </span>
    </template>

    <div v-if="alertes.length === 0" class="flex flex-col items-center py-6 text-center">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sage-soft)]">
        <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-[var(--sage-deep)]" />
      </div>
      <p class="mt-2 text-sm font-medium text-[var(--text-secondary)]">Tout est en ordre</p>
      <p class="text-xs text-[var(--text-tertiary)]">Aucune alerte active</p>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="alerte in alertes"
        :key="alerte.id"
        class="group/alert flex items-start gap-3 rounded-xl bg-[var(--surface-muted)] px-3 py-3 transition-opacity hover:opacity-90"
      >
        <div
          class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          :class="alertBg(alerte.priorite)"
        >
          <UIcon
            :name="prioriteIcon(alerte.priorite)"
            class="h-3.5 w-3.5"
            :class="textColor(alerte.priorite)"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-medium text-[var(--text-primary)]">{{ alerte.titre }}</p>
          <p v-if="alerte.message" class="mt-0.5 line-clamp-1 text-xs text-[var(--text-tertiary)]">
            {{ alerte.message }}
          </p>
        </div>
        <div
          class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/alert:opacity-100"
        >
          <NuxtLink
            v-if="alerte.actionUrl"
            :to="alerte.actionUrl"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-white hover:text-[var(--honey-deep)]"
          >
            <UIcon name="i-lucide-external-link" class="h-3.5 w-3.5" />
          </NuxtLink>
          <button
            aria-label="Marquer cette alerte comme traitée"
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-white hover:text-[var(--sage-deep)]"
            @click="emit('dismiss', alerte.id)"
          >
            <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
          </button>
        </div>
      </li>
    </ul>

    <!-- Link -->
    <NuxtLink
      v-if="alertes.length > 0"
      to="/alertes"
      class="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-[var(--honey-deep)] transition-opacity hover:opacity-80"
    >
      Voir toutes les alertes
      <UIcon name="i-lucide-arrow-right" class="h-3 w-3" />
    </NuxtLink>
  </UiExpandableCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  alertes: Array<{
    id: string;
    type: string;
    titre: string;
    message?: string | null;
    priorite?: string | null;
    actionUrl?: string | null;
  }>;
  total?: number;
}>();

const emit = defineEmits<{
  dismiss: [id: string];
}>();

const displayCount = computed(() => props.total ?? props.alertes.length);

// Couleurs SÉMANTIQUES de priorité (tokens du design system).
function alertBg(priorite?: string | null): string {
  switch (priorite) {
    case 'critique':
    case 'haute':
      return 'bg-[var(--clay-soft)]';
    case 'moyenne':
      return 'bg-[var(--honey-soft)]';
    default:
      return 'bg-[var(--surface-muted)]';
  }
}

function textColor(priorite?: string | null): string {
  switch (priorite) {
    case 'critique':
      return 'text-[var(--status-bad)]';
    case 'haute':
      return 'text-[var(--clay-deep)]';
    case 'moyenne':
      return 'text-[var(--honey-deep)]';
    default:
      return 'text-[var(--text-secondary)]';
  }
}

function prioriteIcon(priorite?: string | null): string {
  switch (priorite) {
    case 'critique':
      return 'i-lucide-alert-octagon';
    case 'haute':
      return 'i-lucide-alert-triangle';
    case 'moyenne':
      return 'i-lucide-alert-circle';
    default:
      return 'i-lucide-info';
  }
}
</script>
