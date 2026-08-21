<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-xl bg-stone-100" />
    </div>

    <!-- Empty -->
    <div v-else-if="entries.length === 0" class="py-8 text-center">
      <UIcon name="i-lucide-clock" class="mx-auto h-8 w-8 text-stone-300" />
      <p class="mt-2 text-sm text-stone-400">Aucune activité enregistrée</p>
    </div>

    <!-- Entries -->
    <div v-else class="space-y-2.5">
      <NuxtLink
        v-for="entry in entries"
        :key="entry.id"
        :to="getEntryLink(entry)"
        class="group flex overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-md"
      >
        <!-- Accent bar -->
        <div class="w-1 shrink-0" :class="accentBg(entry)" />

        <!-- Icon zone -->
        <div class="flex w-14 shrink-0 items-center justify-center">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl" :class="iconBg(entry)">
            <UIcon :name="getIcon(entry)" class="h-5 w-5" :class="iconColor(entry)" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex flex-1 items-center justify-between gap-3 py-3.5 pr-4">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-stone-900">{{ entry.title }}</p>
            <p v-if="entry.description" class="mt-0.5 line-clamp-1 text-xs text-stone-500">
              {{ entry.description }}
            </p>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <InterventionsInterventionBadge
                v-if="entry.type === 'intervention' && entry.metadata.interventionType"
                :type="entry.metadata.interventionType as TypeIntervention"
              />
              <span
                v-if="entry.type === 'intervention' && entry.metadata.summary"
                class="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
                >{{ entry.metadata.summary }}</span
              >
              <span
                v-if="entry.type === 'recolte' && entry.metadata.typeMiel"
                class="inline-flex items-center rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                >{{ entry.metadata.typeMiel }}</span
              >
              <span
                v-if="entry.type === 'recolte' && entry.metadata.humidite"
                class="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs text-sky-700"
                >{{ entry.metadata.humidite }}% hum.</span
              >
            </div>
          </div>

          <!-- Right: quantity hero (récolte) + date -->
          <div class="shrink-0 text-right">
            <span
              v-if="entry.type === 'recolte' && entry.metadata.quantiteKg"
              class="block text-2xl font-bold leading-none text-amber-500"
              >{{ entry.metadata.quantiteKg
              }}<span class="text-sm font-normal text-amber-400"> kg</span></span
            >
            <time
              class="block text-xs text-stone-400"
              :class="{ 'mt-1': entry.type === 'recolte' && entry.metadata.quantiteKg }"
              >{{ formatDate(entry.date) }}</time
            >
            <UIcon
              name="i-lucide-chevron-right"
              class="ml-auto mt-1 h-3.5 w-3.5 text-stone-200 transition-all group-hover:translate-x-0.5 group-hover:text-stone-400"
            />
          </div>
        </div>
      </NuxtLink>

      <!-- Load more -->
      <div v-if="hasMore" class="pt-2 text-center">
        <UButton
          label="Charger plus"
          variant="ghost"
          color="neutral"
          size="sm"
          :loading="loadingMore"
          @click="$emit('load-more')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { INTERVENTION_META, type TypeIntervention } from '~/types/interventions';

interface TimelineEntry {
  id: string;
  type: 'intervention' | 'recolte';
  date: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
}

defineProps<{
  entries: TimelineEntry[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
}>();

defineEmits<{ 'load-more': [] }>();

function getEntryLink(entry: TimelineEntry): string {
  if (entry.type === 'intervention') return `/interventions/${entry.id}`;
  if (entry.type === 'recolte') return `/production/recoltes/${entry.id}`;
  return `/interventions`;
}

function accentBg(entry: TimelineEntry): string {
  return entry.type === 'recolte' ? 'bg-amber-400' : 'bg-amber-500';
}

function iconBg(entry: TimelineEntry): string {
  if (entry.type === 'recolte') return 'bg-amber-50';
  const t = entry.metadata.interventionType as TypeIntervention | undefined;
  return t && INTERVENTION_META[t] ? INTERVENTION_META[t].bgColor : 'bg-amber-50';
}

function iconColor(entry: TimelineEntry): string {
  if (entry.type === 'recolte') return 'text-honey-deep';
  const t = entry.metadata.interventionType as TypeIntervention | undefined;
  return t && INTERVENTION_META[t] ? INTERVENTION_META[t].textColor : 'text-honey-deep';
}

function getIcon(entry: TimelineEntry): string {
  if (entry.type === 'recolte') return 'i-lucide-droplets';
  const t = entry.metadata.interventionType as TypeIntervention | undefined;
  return t && INTERVENTION_META[t] ? INTERVENTION_META[t].icon : 'i-lucide-activity';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>
