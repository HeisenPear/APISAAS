<template>
  <UiExpandableCard
    title="A venir"
    subtitle="Interventions planifiees"
    icon="i-lucide-calendar-clock"
    icon-container-class="bg-[var(--honey-soft)]"
    icon-class="text-[var(--honey-deep)]"
    :default-expanded="true"
  >
    <template #header-right>
      <span
        v-if="tasks?.length"
        class="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--honey-soft)] px-1.5 text-[10px] font-bold text-[var(--honey-deep)]"
      >
        {{ tasks.length }}
      </span>
    </template>

    <div v-if="pending" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-12 animate-pulse rounded-xl bg-[var(--surface-muted)]"
      />
    </div>

    <div v-else-if="!tasks?.length" class="flex flex-col items-center py-6 text-center">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)]"
      >
        <UIcon name="i-lucide-calendar-check" class="h-5 w-5 text-[var(--text-tertiary)]" />
      </div>
      <p class="mt-2 text-sm text-[var(--text-tertiary)]">Aucune intervention planifiee</p>
    </div>

    <div v-else class="space-y-1.5">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center gap-3 rounded-xl bg-[var(--surface-muted)] px-3 py-2.5"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          :class="typeIconBg(task.type)"
        >
          <UIcon :name="typeIcon(task.type)" class="h-4 w-4" :class="typeIconColor(task.type)" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] font-medium text-[var(--text-primary)]">
            {{ formatType(task.type) }}
            <span v-if="task.rucheNumero" class="font-normal text-[var(--text-tertiary)]"
              >· R{{ task.rucheNumero }}</span
            >
          </p>
          <p v-if="task.notes" class="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-tertiary)]">
            {{ task.notes }}
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          :class="badgeClass(task.daysUntil)"
        >
          {{ badgeLabel(task.daysUntil) }}
        </span>
      </div>
    </div>

    <!-- Link -->
    <NuxtLink
      to="/calendrier"
      class="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-[var(--honey-deep)] transition-opacity hover:opacity-80"
    >
      Voir le calendrier
      <UIcon name="i-lucide-arrow-right" class="h-3 w-3" />
    </NuxtLink>
  </UiExpandableCard>
</template>

<script setup lang="ts">
interface UpcomingTask {
  id: string;
  type: string | null;
  dateVisite: string;
  rucheNumero: string | null;
  notes: string | null;
  daysUntil: number;
}

const { data: tasks, pending } = useFetch<UpcomingTask[]>('/api/dashboard/upcoming', {
  key: 'dashboard-upcoming',
  default: () => [],
});

function formatType(type: string | null): string {
  if (!type) return 'Intervention';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function badgeLabel(days: number): string {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days}j`;
}

function badgeClass(days: number): string {
  if (days === 0) return 'bg-[var(--clay-soft)] text-[var(--clay-deep)]';
  if (days <= 2) return 'bg-[var(--honey-soft)] text-[var(--honey-deep)]';
  return 'bg-[var(--surface-muted)] text-[var(--text-secondary)]';
}

function typeIcon(type: string | null): string {
  switch (type) {
    case 'nourrissement':
      return 'i-lucide-candy';
    case 'traitement':
      return 'i-lucide-shield-plus';
    case 'recolte':
      return 'i-lucide-droplets';
    default:
      return 'i-lucide-clipboard-check';
  }
}

function typeIconBg(type: string | null): string {
  switch (type) {
    case 'recolte':
      return 'bg-[var(--sage-soft)]';
    case 'traitement':
      return 'bg-[var(--clay-soft)]';
    default:
      return 'bg-[var(--honey-soft)]';
  }
}

function typeIconColor(type: string | null): string {
  switch (type) {
    case 'recolte':
      return 'text-[var(--sage-deep)]';
    case 'traitement':
      return 'text-[var(--clay-deep)]';
    default:
      return 'text-[var(--honey-deep)]';
  }
}
</script>
