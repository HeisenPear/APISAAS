<template>
  <UiExpandableCard
    title="A venir"
    subtitle="Interventions planifiees"
    icon="i-lucide-calendar-clock"
    icon-container-class="bg-violet-50"
    icon-class="text-violet-600"
    :default-expanded="true"
  >
    <template #header-right>
      <span
        v-if="tasks?.length"
        class="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-1.5 text-[10px] font-bold text-violet-700"
      >
        {{ tasks.length }}
      </span>
    </template>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-xl bg-stone-100" />
    </div>

    <div v-else-if="!tasks?.length" class="flex flex-col items-center py-6 text-center">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
        <UIcon name="i-lucide-calendar-check" class="h-5 w-5 text-stone-400" />
      </div>
      <p class="mt-2 text-sm text-stone-500">Aucune intervention planifiee</p>
    </div>

    <div v-else class="space-y-1.5">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center gap-3 rounded-xl bg-stone-50/80 px-3 py-2.5"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          :class="typeIconBg(task.type)"
        >
          <UIcon :name="typeIcon(task.type)" class="h-4 w-4" :class="typeIconColor(task.type)" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] font-medium text-stone-800">
            {{ formatType(task.type) }}
            <span v-if="task.rucheNumero" class="font-normal text-stone-400"
              >· R{{ task.rucheNumero }}</span
            >
          </p>
          <p v-if="task.notes" class="mt-0.5 line-clamp-1 text-[11px] text-stone-400">
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
      class="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-amber-600 transition-colors hover:text-amber-700"
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

function formatType(type: unknown): string {
  // Defensif : une donnee non-string (héritée d'anciens enregistrements) ne doit
  // jamais crasher le rendu via .charAt (cf. Sentry « o.charAt is not a function »).
  if (typeof type !== 'string' || !type) return 'Intervention';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function badgeLabel(days: number): string {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days}j`;
}

function badgeClass(days: number): string {
  if (days === 0) return 'bg-red-50 text-red-700';
  if (days <= 2) return 'bg-amber-50 text-amber-700';
  return 'bg-stone-100 text-stone-600';
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
    case 'nourrissement':
      return 'bg-sky-50';
    case 'traitement':
      return 'bg-violet-50';
    case 'recolte':
      return 'bg-amber-50';
    default:
      return 'bg-stone-50';
  }
}

function typeIconColor(type: string | null): string {
  switch (type) {
    case 'nourrissement':
      return 'text-sky-600';
    case 'traitement':
      return 'text-violet-600';
    case 'recolte':
      return 'text-amber-600';
    default:
      return 'text-stone-500';
  }
}
</script>
