<template>
  <UModal v-model:open="ouvert" title="Partager une floraison">
    <template #content>
      <div class="p-5">
        <h2 class="text-[17px] font-semibold text-[var(--text-primary)]">Partager une floraison</h2>
        <p class="mt-0.5 text-[13px] text-[var(--text-secondary)]">
          Ce que vous voyez aujourd’hui aide toute la région à décider.
        </p>

        <div class="mt-4 space-y-3.5">
          <div>
            <label class="mb-1 block text-[12.5px] font-medium text-[var(--text-secondary)]">
              Espèce en fleur
            </label>
            <UInput
              v-model="form.espece"
              placeholder="Acacia, colza, châtaignier…"
              size="lg"
              :ui="{ root: 'w-full' }"
            />
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <button
                v-for="s in suggestionsEspece"
                :key="s.nom"
                type="button"
                class="rounded-full border border-[var(--border-default)] bg-white px-2.5 py-1 text-[12px] transition-colors hover:border-[var(--honey)]"
                @click="choisirEspece(s)"
              >
                {{ s.emoji }} {{ s.nom }}
              </button>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-[12.5px] font-medium text-[var(--text-secondary)]">
              Où en est-elle ?
            </label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="s in STADES"
                :key="s.value"
                type="button"
                class="rounded-[10px] border px-3 py-2 text-left text-[12.5px] font-medium transition-all"
                :class="
                  form.stade === s.value
                    ? 'text-white'
                    : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)]'
                "
                :style="
                  form.stade === s.value ? `background:${s.couleur};border-color:${s.couleur}` : ''
                "
                @click="form.stade = s.value"
              >
                {{ s.label }}
              </button>
            </div>
            <p class="mt-1.5 text-[12px] text-[var(--text-tertiary)]">{{ conseilCourant }}</p>
          </div>

          <div>
            <label class="mb-1 block text-[12.5px] font-medium text-[var(--text-secondary)]">
              Abondance
            </label>
            <div class="flex gap-1.5">
              <button
                v-for="i in INTENSITES"
                :key="i.value"
                type="button"
                class="flex-1 rounded-[10px] border px-3 py-2 text-[12.5px] font-medium transition-all"
                :class="
                  form.intensite === i.value
                    ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
                    : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)]'
                "
                @click="form.intensite = i.value"
              >
                {{ i.label }}
              </button>
            </div>
          </div>

          <UTextarea
            v-model="form.notes"
            placeholder="Remarque (facultatif)"
            :rows="2"
            :ui="{ root: 'w-full' }"
          />

          <p
            v-if="!coord"
            class="rounded-[10px] bg-[var(--honey-soft)] px-3 py-2 text-[12.5px] text-[var(--honey-deep)]"
          >
            Touchez la carte pour placer le point.
          </p>
          <p v-else class="text-[12px] text-[var(--text-tertiary)]">
            📍 {{ coord.lat.toFixed(4) }}, {{ coord.lng.toFixed(4) }}
          </p>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="ouvert = false">Annuler</UButton>
          <UButton
            color="primary"
            :loading="envoi"
            :disabled="!coord || form.espece.trim().length < 2"
            @click="enregistrer"
          >
            Partager
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import {
  STADES,
  INTENSITES,
  conseilStade,
  type FloraisonStade,
  type FloraisonIntensite,
} from '~/config/floraisons';

const ouvert = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  coord: { lat: number; lng: number } | null;
  commune: string | null;
}>();

const emit = defineEmits<{ enregistre: [] }>();

const notifications = useNotifications();
const envoi = ref(false);

const form = reactive({
  espece: '',
  stade: 'demarrage' as FloraisonStade,
  intensite: 'moyenne' as FloraisonIntensite,
  notes: '',
});

/** Raccourcis des espèces les plus signalées — évite de tout retaper au champ. */
const suggestionsEspece = [
  { nom: 'Colza', emoji: '🌼' },
  { nom: 'Acacia', emoji: '🌳' },
  { nom: 'Châtaignier', emoji: '🌰' },
  { nom: 'Tilleul', emoji: '🌿' },
  { nom: 'Tournesol', emoji: '🌻' },
  { nom: 'Ronce', emoji: '🫐' },
];

const conseilCourant = computed(() => conseilStade(form.stade));

function choisirEspece(s: { nom: string }) {
  form.espece = s.nom;
}

watch(ouvert, (o) => {
  if (o) {
    form.espece = '';
    form.stade = 'demarrage';
    form.intensite = 'moyenne';
    form.notes = '';
  }
});

async function enregistrer() {
  if (!props.coord) return;
  envoi.value = true;
  try {
    await appelApi('/api/floraisons/observations', {
      method: 'POST',
      body: {
        espece: form.espece.trim(),
        latitude: props.coord.lat,
        longitude: props.coord.lng,
        commune: props.commune,
        stade: form.stade,
        intensite: form.intensite,
        notes: form.notes.trim() || null,
      },
    });
    notifications.success('Merci — votre observation est sur la carte.');
    ouvert.value = false;
    emit('enregistre');
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    envoi.value = false;
  }
}
</script>
