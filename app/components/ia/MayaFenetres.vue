<template>
  <section class="space-y-4">
    <!-- En-tête -->
    <div class="flex items-start gap-3">
      <IaMayaMark :size="34" :state="pending ? 'loading' : aUneUrgence ? 'alert' : 'idle'" glow />
      <div class="min-w-0 flex-1">
        <h2
          class="text-[19px] font-semibold tracking-[-0.01em] leading-tight"
          style="color: var(--text-primary)"
        >
          Fenêtres d'intervention
        </h2>
        <p class="mt-0.5 text-[13px] leading-snug" style="color: var(--text-secondary)">
          Les meilleurs créneaux selon ton historique, la saison et la météo prévue.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="ghost"
        color="neutral"
        size="sm"
        :loading="pending"
        class="shrink-0"
        aria-label="Recalculer"
        @click="refresh"
      />
    </div>

    <!-- Skeleton -->
    <div v-if="pending" class="space-y-2.5">
      <div
        v-for="i in 3"
        :key="i"
        class="h-[92px] animate-pulse rounded-[14px]"
        style="background: var(--surface-muted)"
      />
    </div>

    <!-- Erreur -->
    <div
      v-else-if="erreur"
      class="rounded-[14px] border px-4 py-3.5 text-[13.5px]"
      style="
        border-color: color-mix(in srgb, var(--clay) 40%, transparent);
        background: var(--clay-soft);
        color: var(--clay-deep);
      "
    >
      {{ erreur }}
    </div>

    <!-- Vide : tout est à jour -->
    <UiEmptyState
      v-else-if="!fenetres.length"
      icon="i-lucide-shield-check"
      title="Rien d'urgent cette semaine"
      description="Tes ruchers sont à jour — Maya veille et te préviendra dès qu'un créneau s'ouvre."
    />

    <!-- Liste des suggestions -->
    <ul v-else class="space-y-2.5">
      <li
        v-for="f in fenetres"
        :key="`${f.rucherId}:${f.tache}`"
        class="relative overflow-hidden rounded-[14px] border bg-white p-4 pl-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
        style="border-color: var(--border-default)"
      >
        <!-- Barre d'accent par urgence -->
        <span
          class="absolute inset-y-0 left-0 w-[4px]"
          :style="`background: ${ton(f.urgence).accent}`"
        />

        <div class="flex items-start gap-3">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            :style="`background: ${ton(f.urgence).soft}; color: ${ton(f.urgence).deep}`"
          >
            <UIcon :name="f.icon" class="h-[18px] w-[18px]" />
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="text-[14.5px] font-semibold" style="color: var(--text-primary)">
                {{ f.tacheLabel }}
              </span>
              <span class="text-[13px]" style="color: var(--text-tertiary)">·</span>
              <span class="text-[13.5px] font-medium" style="color: var(--text-secondary)">
                {{ f.rucherNom }}
              </span>
              <span
                class="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                :style="`background: ${ton(f.urgence).soft}; color: ${ton(f.urgence).deep}`"
              >
                {{ URGENCE_LABEL[f.urgence] }}
              </span>
            </div>

            <p class="mt-1 text-[13px] leading-snug" style="color: var(--text-secondary)">
              {{ f.raison }}
            </p>

            <!-- Fenêtre météo -->
            <div
              v-if="f.meilleureDateLabel"
              class="mt-2 inline-flex items-center gap-2 rounded-[9px] px-2.5 py-1.5"
              style="background: var(--surface-muted)"
            >
              <UIcon
                name="i-lucide-calendar-check"
                class="h-3.5 w-3.5"
                style="color: var(--honey-deep)"
              />
              <span class="text-[12.5px] font-medium" style="color: var(--text-primary)">
                {{ capitaliser(f.meilleureDateLabel) }}
              </span>
              <span class="text-[12px]" style="color: var(--text-tertiary)">
                · {{ f.meteoResume }}
              </span>
            </div>

            <!-- Actions -->
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <UButton
                v-if="!estPlanifiee(f)"
                icon="i-lucide-bell-plus"
                size="xs"
                color="primary"
                variant="soft"
                :loading="estEnCours(f)"
                @click="creerAlerte(f)"
              >
                Créer une alerte
              </UButton>
              <span
                v-else
                class="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12px] font-semibold"
                style="background: var(--sage-soft); color: var(--sage-deep)"
              >
                <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
                Alerte créée
              </span>
              <NuxtLink
                :to="f.alerte.actionUrl"
                class="inline-flex items-center gap-1 text-[12.5px] font-semibold transition-colors"
                style="color: var(--honey-deep)"
              >
                Planifier
                <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { Urgence } from '~/composables/useMayaFenetres';

const { fenetres, pending, erreur, refresh, creerAlerte, estPlanifiee, estEnCours } =
  useMayaFenetres();

const aUneUrgence = computed(() => fenetres.value.some((f) => f.urgence === 'haute'));

const URGENCE_LABEL: Record<Urgence, string> = {
  haute: 'Prioritaire',
  moyenne: 'À planifier',
  basse: 'Quand tu peux',
};

function ton(urgence: Urgence): { accent: string; soft: string; deep: string } {
  const map: Record<Urgence, { accent: string; soft: string; deep: string }> = {
    haute: { accent: 'var(--clay)', soft: 'var(--clay-soft)', deep: 'var(--clay-deep)' },
    moyenne: { accent: 'var(--honey)', soft: 'var(--honey-soft)', deep: 'var(--honey-deep)' },
    basse: { accent: 'var(--sage)', soft: 'var(--sage-soft)', deep: 'var(--sage-deep)' },
  };
  return map[urgence];
}

const capitaliser = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

defineExpose({ refresh });

onMounted(refresh);
</script>
