<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <button
      v-for="s in SOURCES"
      :key="s.value"
      type="button"
      class="flex flex-col rounded-[14px] border bg-white p-4 text-left transition-all duration-[250ms] active:scale-[0.99]"
      :class="
        selection === s.value
          ? 'border-[var(--honey)] shadow-[var(--shadow-md)] ring-1 ring-[var(--honey)]/20'
          : 'border-[var(--border-default)] hover:border-[var(--honey)]/60 hover:shadow-[var(--shadow-sm)]'
      "
      :aria-pressed="selection === s.value"
      @click="selection = s.value"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
          :style="`background:color-mix(in srgb, ${s.couleur} 14%, transparent)`"
        >
          <UIcon :name="s.icon" class="h-4.5 w-4.5" :style="`color:${s.couleur}`" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-[14.5px] font-semibold text-[var(--text-primary)]">{{ s.label }}</p>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="
                s.tempsReel
                  ? 'bg-[var(--honey-soft)] text-[var(--honey-deep)]'
                  : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]'
              "
            >
              {{ s.tempsReel ? 'Temps réel' : 'Pas de temps réel' }}
            </span>
          </div>
          <p class="mt-1 text-[12.5px] font-medium text-[var(--text-secondary)]">
            {{ s.resume }}
          </p>
        </div>
        <UIcon
          v-if="selection === s.value"
          name="i-lucide-check-circle-2"
          class="h-4.5 w-4.5 shrink-0 text-[var(--honey)]"
        />
      </div>

      <p class="mt-2.5 text-[12px] leading-relaxed text-[var(--text-tertiary)]">
        {{ s.description }}
      </p>
      <p
        v-if="s.marques"
        class="mt-2 rounded-[8px] bg-[var(--surface-muted)] px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)]"
      >
        <span class="font-semibold">Marques concernées :</span> {{ s.marques }}
      </p>
    </button>
  </div>
</template>

<script setup lang="ts">
import { SOURCES, type SourceBalance } from '~/config/balances';

/**
 * Premier écran de l'ajout : par quel chemin les mesures vont-elles arriver ?
 * On dit la vérité sur chaque voie, y compris quand elle est bancale — un
 * apiculteur qui découvre après coup que sa marque n'a pas d'API se sent floué.
 */
const selection = defineModel<SourceBalance | null>({ default: null });
</script>
