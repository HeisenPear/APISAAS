<script setup lang="ts">
/**
 * Barre d'action flottante qui apparaît dès qu'un élément est sélectionné.
 * Reste lisible sur mobile (au-dessus de la bottom-nav) comme sur desktop.
 */
defineProps<{
  /** Nombre d'éléments sélectionnés. */
  nombre: number;
  /** Libellé au singulier / pluriel, ex. ['rucher', 'ruchers']. */
  libelle: [string, string];
  /** Information secondaire, ex. « 240 ruches concernées ». */
  detail?: string;
  /** Tout est déjà sélectionné (bascule le bouton en « Tout désélectionner »). */
  toutSelectionne?: boolean;
  actionLabel?: string;
  actionIcon?: string;
  loading?: boolean;
}>();

defineEmits<{ action: []; tout: []; annuler: [] }>();
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-[var(--duration-fast)] ease-out"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition-all duration-[var(--duration-fast)] ease-in"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="nombre > 0"
      class="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+0.75rem)] z-40 px-4 lg:bottom-6 lg:left-[var(--sidebar-width)] lg:pl-8 lg:pr-[104px]"
    >
      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-xl)]"
      >
        <!-- Compteur -->
        <div class="flex min-w-0 items-center gap-2.5">
          <span
            class="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[var(--honey)] px-2 text-[13px] font-bold text-white tabular-nums"
          >
            {{ nombre }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-[14px] font-semibold text-[var(--text-primary)]">
              {{ nombre > 1 ? libelle[1] : libelle[0] }} sélectionné{{ nombre > 1 ? 's' : '' }}
            </p>
            <p v-if="detail" class="truncate text-[12px] text-[var(--text-tertiary)]">
              {{ detail }}
            </p>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            class="rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="$emit('tout')"
          >
            {{ toutSelectionne ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
          <button
            type="button"
            class="rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="$emit('annuler')"
          >
            Annuler
          </button>
          <UButton
            :icon="actionIcon ?? 'i-lucide-move-right'"
            :label="actionLabel ?? 'Déplacer'"
            color="primary"
            :loading="loading"
            @click="$emit('action')"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>
