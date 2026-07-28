<script setup lang="ts">
/**
 * Modale de déplacement — lit le trajet d'un coup d'œil : ce qui part à
 * gauche, où ça va à droite, la flèche entre les deux. Les destinations sont
 * des cartes (avec leur remplissage) plutôt qu'une liste déroulante : on voit
 * immédiatement où il reste de la place.
 */
import type { DestinationDeplacement, ConfirmationDeplacement } from '~/types/deplacement';

const props = defineProps<{
  modelValue: boolean;
  /** 'ruchers' : on pose des ruchers sur un emplacement. 'ruches' : on transfère des ruches. */
  mode: 'ruchers' | 'ruches';
  /** Résumé de ce qui part, ex. « 3 ruchers · 240 ruches ». */
  resumeOrigine: string;
  destinations: DestinationDeplacement[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirmer: [payload: ConfirmationDeplacement];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const destinationId = ref<string | null>(null);
const notes = ref('');
const date = ref('');
const motif = ref('transhumance');
const showDetails = ref(false);
const recherche = ref('');

const MOTIFS = [
  { label: 'Transhumance', value: 'transhumance' },
  { label: 'Réorganisation', value: 'reorganisation' },
  { label: 'Vente', value: 'vente' },
  { label: 'Autre', value: 'autre' },
];

watch(isOpen, (ouvert) => {
  if (!ouvert) return;
  destinationId.value = null;
  notes.value = '';
  recherche.value = '';
  showDetails.value = false;
  motif.value = props.mode === 'ruches' ? 'reorganisation' : 'transhumance';
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  date.value = now.toISOString().slice(0, 16);
});

const destinationsFiltrees = computed(() => {
  const q = recherche.value.trim().toLowerCase();
  if (!q) return props.destinations;
  return props.destinations.filter(
    (d) => d.nom.toLowerCase().includes(q) || (d.sousTitre ?? '').toLowerCase().includes(q),
  );
});

const choisie = computed(
  () => props.destinations.find((d) => d.id === destinationId.value) ?? null,
);

const titre = computed(() =>
  props.mode === 'ruchers' ? 'Déplacer vers un emplacement' : 'Déplacer vers un rucher',
);
const iconeDestination = computed(() =>
  props.mode === 'ruchers' ? 'i-lucide-map-pin-plus' : 'i-lucide-map-pin',
);

/** Remplissage en % — au-delà de la capacité, la jauge passe en alerte. */
function remplissage(d: DestinationDeplacement) {
  if (!d.capacite || d.capacite <= 0) return null;
  return Math.min(100, Math.round(((d.occupe ?? 0) / d.capacite) * 100));
}

function confirmer() {
  if (!destinationId.value) return;
  emit('confirmer', {
    destinationId: destinationId.value,
    date: date.value,
    notes: notes.value.trim(),
    motif: motif.value,
  });
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="titre" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div class="space-y-5">
        <!-- Trajet : ce qui part → où ça va -->
        <div
          class="flex items-center gap-3 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3"
        >
          <div class="min-w-0 flex-1">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
            >
              Je déplace
            </p>
            <p class="mt-0.5 truncate text-[14px] font-semibold text-[var(--text-primary)]">
              {{ resumeOrigine }}
            </p>
          </div>
          <UIcon name="i-lucide-arrow-right" class="h-5 w-5 shrink-0 text-[var(--honey)]" />
          <div class="min-w-0 flex-1">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
            >
              Vers
            </p>
            <p
              class="mt-0.5 truncate text-[14px] font-semibold"
              :class="choisie ? 'text-[var(--honey-deep)]' : 'text-[var(--text-tertiary)]'"
            >
              {{ choisie?.nom ?? 'À choisir ci-dessous' }}
            </p>
          </div>
        </div>

        <!-- Destinations sous forme de cartes -->
        <div>
          <UInput
            v-if="destinations.length > 6"
            v-model="recherche"
            icon="i-lucide-search"
            placeholder="Rechercher une destination…"
            class="mb-2.5"
          />
          <div
            v-if="destinationsFiltrees.length === 0"
            class="rounded-[12px] border border-dashed border-[var(--border-default)] py-8 text-center text-[13px] text-[var(--text-tertiary)]"
          >
            <!-- Une recherche sans résultat n'est pas une absence de destination -->
            <template v-if="recherche.trim()">
              Aucun résultat pour « {{ recherche.trim() }} ».
            </template>
            <template v-else-if="mode === 'ruchers'">
              Aucun emplacement disponible — créez-en un dans Emplacements.
            </template>
            <template v-else>Aucun autre rucher disponible.</template>
          </div>
          <div v-else class="grid max-h-[38vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            <button
              v-for="d in destinationsFiltrees"
              :key="d.id"
              type="button"
              :disabled="d.estActuelle"
              class="rounded-[12px] border p-3 text-left transition-all duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                destinationId === d.id
                  ? 'border-[var(--honey)] bg-[var(--honey-soft)] shadow-[var(--shadow-sm)]'
                  : 'border-[var(--border-default)] bg-white hover:border-[var(--honey)]/60'
              "
              @click="destinationId = d.id"
            >
              <div class="flex items-start gap-2">
                <UIcon
                  :name="iconeDestination"
                  class="mt-0.5 h-4 w-4 shrink-0"
                  :class="
                    destinationId === d.id
                      ? 'text-[var(--honey-deep)]'
                      : 'text-[var(--text-tertiary)]'
                  "
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
                    {{ d.nom }}
                    <span v-if="d.estActuelle" class="font-normal text-[var(--text-tertiary)]">
                      · position actuelle
                    </span>
                  </p>
                  <p v-if="d.sousTitre" class="truncate text-[11.5px] text-[var(--text-tertiary)]">
                    {{ d.sousTitre }}
                  </p>

                  <!-- Jauge de remplissage : voir en un clin d'œil où il reste de la place -->
                  <div v-if="remplissage(d) !== null" class="mt-2">
                    <div class="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :class="
                          (remplissage(d) ?? 0) >= 100
                            ? 'bg-[var(--status-bad)]'
                            : (remplissage(d) ?? 0) >= 80
                              ? 'bg-[var(--status-warn)]'
                              : 'bg-[var(--honey)]'
                        "
                        :style="{ width: `${remplissage(d)}%` }"
                      />
                    </div>
                    <p class="mt-1 text-[10.5px] text-[var(--text-tertiary)] tabular-nums">
                      {{ d.occupe ?? 0 }} / {{ d.capacite }} ruches
                    </p>
                  </div>
                  <p
                    v-else-if="d.occupe != null"
                    class="mt-1.5 text-[10.5px] text-[var(--text-tertiary)] tabular-nums"
                  >
                    {{ d.occupe }} ruche{{ d.occupe > 1 ? 's' : '' }} sur place
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Date, motif et note — repliés par défaut pour rester lisible -->
        <div>
          <button
            type="button"
            class="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            @click="showDetails = !showDetails"
          >
            <UIcon
              :name="showDetails ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="h-3.5 w-3.5"
            />
            Date, motif et note
          </button>
          <div v-if="showDetails" class="mt-3 space-y-3">
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField label="Date du déplacement">
                <UInput v-model="date" type="datetime-local" />
              </UFormField>
              <UFormField v-if="mode === 'ruches'" label="Motif">
                <USelect v-model="motif" :items="MOTIFS" value-key="value" label-key="label" />
              </UFormField>
            </div>
            <UFormField label="Note">
              <UTextarea v-model="notes" :rows="2" placeholder="Précision sur ce déplacement…" />
            </UFormField>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="isOpen = false">Annuler</UButton>
        <UButton
          color="primary"
          icon="i-lucide-move-right"
          :loading="loading"
          :disabled="!destinationId"
          @click="confirmer"
        >
          Déplacer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
