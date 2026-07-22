<template>
  <div
    class="rounded-[16px] border-2 bg-white p-4"
    :style="`border-color:color-mix(in srgb,${couleurStade(observation.stade)} 40%,transparent)`"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-1.5">
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            :style="`background:color-mix(in srgb,${couleurStade(observation.stade)} 16%,transparent);color:${couleurStade(observation.stade)}`"
          >
            {{ labelStade(observation.stade) }}
          </span>
          <span
            v-if="observation.intensite"
            class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--honey-deep)]"
          >
            {{ labelIntensite(observation.intensite) }}
          </span>
          <span
            v-if="observation.estMien"
            class="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]"
          >
            Vous
          </span>
        </div>

        <p class="mt-1.5 text-[15px] font-semibold text-[var(--text-primary)]">
          {{ emojiEspece(observation.espece, observation.emoji) }} {{ observation.espece }}
        </p>
        <p class="text-xs text-[var(--text-tertiary)]">
          {{ dateLisible }}
          <span v-if="observation.commune"> · {{ observation.commune }}</span>
          <span v-if="distance"> · 📍 {{ distance }}</span>
        </p>
      </div>

      <button
        class="shrink-0 rounded-lg p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)]"
        title="Fermer"
        @click="$emit('ferme')"
      >
        <UIcon name="i-lucide-x" class="h-4 w-4" />
      </button>
    </div>

    <!-- Le conseil est le cœur de la carte : que faire de cette information. -->
    <p
      class="mt-3 rounded-[10px] bg-[var(--honey-soft)] px-3 py-2 text-[12.5px] text-[var(--honey-deep)]"
    >
      {{ conseilStade(observation.stade) }}
    </p>

    <p v-if="observation.typeMiel" class="mt-2 text-[12.5px] text-[var(--text-secondary)]">
      Miel attendu : <strong>{{ observation.typeMiel }}</strong>
    </p>

    <p
      v-if="observation.notes"
      class="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--text-secondary)]"
    >
      {{ observation.notes }}
    </p>

    <div v-if="observation.estMien" class="mt-3 flex justify-end">
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-trash-2"
        :loading="suppression"
        @click="supprimer"
      >
        Retirer
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  couleurStade,
  labelStade,
  conseilStade,
  labelIntensite,
  emojiEspece,
  type FloraisonStade,
  type FloraisonIntensite,
} from '~/config/floraisons';

interface Observation {
  id: string;
  espece: string;
  commune: string | null;
  dateObservation: string;
  stade: FloraisonStade;
  intensite: FloraisonIntensite | null;
  notes: string | null;
  emoji: string | null;
  typeMiel: string | null;
  estMien: boolean;
}

const props = defineProps<{
  observation: Observation;
  distance: string | null;
}>();

const emit = defineEmits<{ supprime: []; ferme: [] }>();

const notifications = useNotifications();
const suppression = ref(false);

const dateLisible = computed(() =>
  new Date(props.observation.dateObservation).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  }),
);

async function supprimer() {
  suppression.value = true;
  try {
    await $fetch(`/api/floraisons/observations/${props.observation.id}`, { method: 'DELETE' });
    notifications.success('Observation retirée');
    emit('supprime');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Suppression impossible'));
  } finally {
    suppression.value = false;
  }
}
</script>
