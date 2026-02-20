<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="flex gap-4">
        <div class="h-8 w-8 animate-pulse rounded-full bg-stone-100" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-32 animate-pulse rounded bg-stone-100" />
          <div class="h-3 w-48 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="entries.length === 0" class="py-8 text-center">
      <UIcon name="i-lucide-clock" class="mx-auto h-8 w-8 text-stone-300" />
      <p class="mt-2 text-sm text-stone-400">Aucune activite enregistree</p>
    </div>

    <!-- Timeline -->
    <div v-else class="relative">
      <!-- Vertical line -->
      <div class="absolute left-4 top-0 h-full w-px bg-stone-200" />

      <div v-for="entry in entries" :key="entry.id" class="relative mb-6 pl-11">
        <!-- Dot -->
        <div
          class="absolute left-2.5 top-0.5 h-3 w-3 rounded-full border-2 border-white"
          :class="dotClass(entry.type)"
        />

        <!-- Content (clickable) -->
        <NuxtLink
          :to="getEntryLink(entry)"
          class="block rounded-xl bg-stone-50 p-4 transition-colors hover:bg-stone-100/80"
        >
          <!-- Header -->
          <div class="mb-1 flex items-start justify-between">
            <div class="flex items-center gap-2">
              <UIcon :name="entryIcon(entry.type)" class="h-4 w-4" :class="iconClass(entry.type)" />
              <span class="text-sm font-medium text-stone-900">{{ entry.title }}</span>
            </div>
            <div class="flex items-center gap-2">
              <time class="text-xs text-stone-400">{{ formatDate(entry.date) }}</time>
              <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5 text-stone-300" />
            </div>
          </div>

          <!-- Description -->
          <p v-if="entry.description" class="mb-2 text-sm text-stone-600">
            {{ entry.description }}
          </p>

          <!-- Metadata for interventions (new style with donnees) -->
          <div
            v-if="entry.type === 'intervention' && entry.metadata.interventionType"
            class="flex flex-wrap gap-2"
          >
            <InterventionsInterventionBadge
              :type="entry.metadata.interventionType as TypeIntervention"
            />
            <span
              v-if="entry.metadata.summary"
              class="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-xs text-stone-600"
            >
              {{ entry.metadata.summary }}
            </span>
          </div>

          <!-- Metadata for recoltes -->
          <div v-if="entry.type === 'recolte'" class="flex flex-wrap gap-2">
            <span
              v-if="entry.metadata.quantiteKg"
              class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
            >
              {{ entry.metadata.quantiteKg }} kg
            </span>
            <span
              v-if="entry.metadata.typeMiel"
              class="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-stone-600"
            >
              {{ entry.metadata.typeMiel }}
            </span>
            <span
              v-if="entry.metadata.humidite"
              class="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs text-sky-700"
            >
              {{ entry.metadata.humidite }}% humidite
            </span>
            <span
              v-if="entry.metadata.numeroLot"
              class="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-stone-500"
            >
              Lot {{ entry.metadata.numeroLot }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Load more -->
      <div v-if="hasMore" class="pl-11 pt-2">
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
import type { TypeIntervention } from '~/types/interventions';

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

defineEmits<{
  'load-more': [];
}>();

function getEntryLink(entry: TimelineEntry): string {
  if (entry.type === 'intervention') {
    return `/interventions/${entry.id}`;
  }
  return '/production/recoltes';
}

function dotClass(type: string) {
  if (type === 'recolte') return 'bg-amber-500';
  return 'bg-emerald-500';
}

function iconClass(type: string) {
  if (type === 'recolte') return 'text-amber-600';
  return 'text-emerald-600';
}

function entryIcon(type: string) {
  if (type === 'recolte') return 'i-lucide-droplets';
  return 'i-lucide-activity';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>
