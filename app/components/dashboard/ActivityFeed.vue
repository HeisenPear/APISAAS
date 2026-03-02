<template>
  <UiExpandableCard
    title="Activite recente"
    subtitle="Dernieres actions"
    icon="i-lucide-activity"
    icon-container-class="bg-stone-100"
    icon-class="text-stone-600"
    :default-expanded="true"
  >
    <template #header-right>
      <span v-if="activities.length" class="text-xs tabular-nums text-stone-400">
        {{ activities.length }} action{{ activities.length > 1 ? 's' : '' }}
      </span>
    </template>

    <div v-if="activities.length === 0" class="flex flex-col items-center py-6 text-center">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
        <UIcon name="i-lucide-clock" class="h-5 w-5 text-stone-400" />
      </div>
      <p class="mt-2 text-sm text-stone-500">Aucune activite pour le moment</p>
    </div>

    <div v-else class="space-y-1">
      <NuxtLink
        v-for="item in activities"
        :key="item.id"
        :to="getActivityLink(item)"
        class="group/item flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-stone-50"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          :class="iconBg(item.type)"
        >
          <UIcon :name="iconName(item.type)" class="h-4 w-4" :class="iconColor(item.type)" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] text-stone-700 group-hover/item:text-stone-900">
            {{ item.description }}
          </p>
        </div>
        <span class="shrink-0 text-[11px] tabular-nums text-stone-400">{{
          formatDate(item.date)
        }}</span>
      </NuxtLink>
    </div>

    <!-- Link -->
    <NuxtLink
      v-if="activities.length > 0"
      to="/interventions"
      class="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-amber-600 transition-colors hover:text-amber-700"
    >
      Tout l'historique
      <UIcon name="i-lucide-arrow-right" class="h-3 w-3" />
    </NuxtLink>
  </UiExpandableCard>
</template>

<script setup lang="ts">
interface ActivityItem {
  id: string;
  type: string;
  date: string;
  description: string;
}

defineProps<{
  activities: ActivityItem[];
}>();

function getActivityLink(item: ActivityItem): string {
  if (item.type === 'recolte') return '/production/recoltes';
  if (item.type === 'transaction') return `/finances/facture/${item.id}`;
  return `/interventions/${item.id}`;
}

function iconName(type: string): string {
  switch (type) {
    case 'recolte':
      return 'i-lucide-droplets';
    case 'transaction':
      return 'i-lucide-wallet';
    case 'nourrissement':
      return 'i-lucide-candy';
    case 'traitement':
      return 'i-lucide-shield-plus';
    default:
      return 'i-lucide-clipboard-check';
  }
}

function iconBg(type: string): string {
  switch (type) {
    case 'recolte':
      return 'bg-amber-50';
    case 'transaction':
      return 'bg-emerald-50';
    case 'nourrissement':
      return 'bg-sky-50';
    case 'traitement':
      return 'bg-violet-50';
    default:
      return 'bg-stone-50';
  }
}

function iconColor(type: string): string {
  switch (type) {
    case 'recolte':
      return 'text-amber-600';
    case 'transaction':
      return 'text-emerald-600';
    case 'nourrissement':
      return 'text-sky-600';
    case 'traitement':
      return 'text-violet-600';
    default:
      return 'text-stone-500';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
</script>
