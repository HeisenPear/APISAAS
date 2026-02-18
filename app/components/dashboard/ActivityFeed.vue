<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-stone-900">Activite recente</h3>
        <p class="text-xs text-stone-500">Dernieres actions</p>
      </div>
    </div>

    <div v-if="activities.length === 0" class="py-8 text-center text-sm text-stone-400">
      Aucune activite pour le moment
    </div>

    <ul v-else class="mt-4 space-y-1">
      <li
        v-for="(item, index) in activities"
        :key="item.id"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <NuxtLink
          :to="getActivityLink(item)"
          class="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-stone-50"
        >
          <div
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            :class="iconBg(item.type)"
          >
            <UIcon :name="iconName(item.type)" class="h-4 w-4" :class="iconColor(item.type)" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-stone-700">{{ item.description }}</p>
            <p class="mt-0.5 text-xs text-stone-400">{{ formatDate(item.date) }}</p>
          </div>
          <UIcon name="i-lucide-chevron-right" class="mt-1.5 h-4 w-4 shrink-0 text-stone-300" />
        </NuxtLink>
      </li>
    </ul>
  </div>
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
  if (item.type === 'inspection') {
    return `/interventions/${item.id}`;
  }
  if (item.type === 'recolte') {
    return '/production/recoltes';
  }
  if (item.type === 'transaction') {
    return '/production/recoltes';
  }
  return '/interventions';
}

function iconName(type: string): string {
  switch (type) {
    case 'inspection':
      return 'i-lucide-clipboard-check';
    case 'recolte':
      return 'i-lucide-droplets';
    case 'transaction':
      return 'i-lucide-wallet';
    default:
      return 'i-lucide-activity';
  }
}

function iconBg(type: string): string {
  switch (type) {
    case 'inspection':
      return 'bg-blue-50';
    case 'recolte':
      return 'bg-amber-50';
    case 'transaction':
      return 'bg-emerald-50';
    default:
      return 'bg-stone-50';
  }
}

function iconColor(type: string): string {
  switch (type) {
    case 'inspection':
      return 'text-blue-600';
    case 'recolte':
      return 'text-amber-600';
    case 'transaction':
      return 'text-emerald-600';
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
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
</script>
