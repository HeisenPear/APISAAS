<script setup lang="ts">
/**
 * Prérequis manquants — affiché À LA PLACE d'un formulaire qu'on ne peut pas
 * encore remplir.
 *
 * Le réflexe courant est de montrer le formulaire avec des listes déroulantes
 * vides : l'utilisateur cherche ce qu'il a mal fait alors qu'il ne lui manque
 * qu'une étape en amont. On dit donc TROIS choses, dans cet ordre : ce qui
 * manque, POURQUOI c'est nécessaire, et où aller le créer.
 *
 * Les étapes déjà remplies restent visibles, cochées : l'apiculteur voit le
 * chemin en entier et ce qu'il lui reste, pas seulement le prochain obstacle.
 */
export interface EtapePrerequis {
  /** Déjà satisfait ? */
  fait: boolean;
  /** Ce qu'il faut avoir, côté métier : « Un rucher ». */
  label: string;
  /** Pourquoi c'est nécessaire — jamais une règle technique. */
  pourquoi: string;
  /** Où aller le créer. */
  to?: string;
  actionLabel?: string;
}

const props = defineProps<{
  /** Ce que l'utilisateur essayait de faire : « Créer une reine ». */
  objectif: string;
  etapes: EtapePrerequis[];
  icon?: string;
}>();

const manquantes = computed(() => props.etapes.filter((e) => !e.fait));
const faites = computed(() => props.etapes.filter((e) => e.fait).length);

/** La prochaine action à faire — celle qu'on met en avant. */
const prochaine = computed(() => manquantes.value[0] ?? null);
</script>

<template>
  <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-6" role="status">
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--honey-soft)]"
      >
        <UIcon :name="icon ?? 'i-lucide-list-checks'" class="h-5 w-5 text-[var(--honey-deep)]" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="text-[16px] font-semibold text-[var(--text-primary)]">
          {{ objectif }} — il manque
          {{ manquantes.length > 1 ? `${manquantes.length} étapes` : 'une étape' }}
        </h2>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          <template v-if="prochaine">{{ prochaine.pourquoi }}</template>
        </p>
      </div>
      <span
        v-if="etapes.length > 1"
        class="shrink-0 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--text-tertiary)] tabular-nums"
      >
        {{ faites }}/{{ etapes.length }}
      </span>
    </div>

    <!-- Le chemin complet : ce qui est fait, ce qui reste -->
    <ol class="mt-5 space-y-2.5">
      <li
        v-for="(e, i) in etapes"
        :key="i"
        class="flex items-start gap-3 rounded-[10px] border p-3 transition-colors"
        :class="
          e.fait
            ? 'border-[var(--border-faint)] bg-[var(--surface-muted)]'
            : 'border-[var(--border-default)] bg-white'
        "
      >
        <span
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          :class="
            e.fait
              ? 'bg-[var(--honey)] text-white'
              : 'border border-[var(--border-default)] text-[var(--text-tertiary)]'
          "
        >
          <UIcon v-if="e.fait" name="i-lucide-check" class="h-3 w-3" />
          <template v-else>{{ i + 1 }}</template>
        </span>

        <div class="min-w-0 flex-1">
          <p
            class="text-[13.5px] font-medium"
            :class="e.fait ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'"
          >
            {{ e.label }}
          </p>
          <p v-if="!e.fait" class="mt-0.5 text-[12.5px] text-[var(--text-tertiary)]">
            {{ e.pourquoi }}
          </p>
        </div>

        <UButton
          v-if="!e.fait && e.to"
          :to="e.to"
          :label="e.actionLabel ?? 'Créer'"
          :color="e === prochaine ? 'primary' : 'neutral'"
          :variant="e === prochaine ? 'solid' : 'ghost'"
          size="xs"
          class="shrink-0"
        />
      </li>
    </ol>
  </div>
</template>
