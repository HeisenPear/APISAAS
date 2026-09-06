<script setup lang="ts">
import { computeSelectionIndex, TRAIT_DEFINITIONS, type TraitKey } from '~/utils/selectionReines';

const props = defineProps<{
  open: boolean;
  reine: { id: string; identifiant?: string | null } | null;
}>();
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>();

const toast = useToast();
const saving = ref(false);

const traits = reactive<Record<TraitKey, number | null>>({
  productiviteMielKg: null,
  resistanceVarroaPctInfestation: null,
  hygienismePinTestPct: null,
  douceur: null,
  tenueCadre: null,
  tendanceEssaimage: null,
  hivernage: null,
  vigueurPrintemps: null,
  ponteQualite: null,
});
const saison = ref(new Date().getFullYear());
const dateEvaluation = ref(dateDuJour());
const observations = ref('');

function reset() {
  for (const key of Object.keys(traits) as TraitKey[]) traits[key] = null;
  saison.value = new Date().getFullYear();
  dateEvaluation.value = dateDuJour();
  observations.value = '';
}

// Réinitialise à chaque ouverture
watch(
  () => props.open,
  (v) => {
    if (v) reset();
  },
);

const result = computed(() => computeSelectionIndex(traits));

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

async function save() {
  if (!props.reine) return;
  saving.value = true;
  try {
    await appelApi('/api/elevage/tests', {
      method: 'POST',
      body: {
        reineId: props.reine.id,
        saison: saison.value,
        dateEvaluation: new Date(dateEvaluation.value).toISOString(),
        productiviteMielKg: traits.productiviteMielKg,
        resistanceVarroaPctInfestation: traits.resistanceVarroaPctInfestation,
        hygienismePinTestPct: traits.hygienismePinTestPct,
        douceur: traits.douceur,
        tenueCadre: traits.tenueCadre,
        tendanceEssaimage: traits.tendanceEssaimage,
        hivernage: traits.hivernage,
        vigueurPrintemps: traits.vigueurPrintemps,
        ponteQualite: traits.ponteQualite,
        observations: observations.value || undefined,
      },
    });
    toast.add({ title: 'Test enregistré · index recalculé', color: 'primary' });
    emit('saved');
    isOpen.value = false;
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de l’enregistrement'), color: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="`Évaluer ${reine?.identifiant || 'la reine'}`"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-5">
        <p class="text-[13px] text-[var(--text-secondary)]">
          Notez les traits observés cette saison. L'index de sélection est calculé automatiquement
          et de façon transparente — laissez vide ce que vous n'avez pas mesuré.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Saison">
            <UInput v-model.number="saison" type="number" :min="2000" :max="2100" />
          </UFormField>
          <UFormField label="Date d'évaluation">
            <UiMobileDatePicker v-model="dateEvaluation" mode="date" />
          </UFormField>
        </div>

        <!-- Traits -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UFormField
            v-for="def in TRAIT_DEFINITIONS"
            :key="def.key"
            :label="`${def.label} (${def.unit})`"
          >
            <UInput
              v-model.number="traits[def.key]"
              type="number"
              :min="def.scale.kind === 'bounded' ? def.scale.min : 0"
              :max="def.scale.kind === 'bounded' ? def.scale.max : undefined"
              :placeholder="def.direction === 'lower' ? 'plus bas = mieux' : 'plus haut = mieux'"
            />
          </UFormField>
        </div>

        <UFormField label="Observations">
          <UTextarea v-model="observations" :rows="2" placeholder="Notes libres…" />
        </UFormField>

        <!-- Aperçu live de l'index -->
        <div
          class="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
        >
          <div class="flex items-center justify-between">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
            >
              Index de sélection
            </p>
            <ElevageIndexBadge :index="result.index" :completeness="result.completeness" />
          </div>

          <p v-if="result.index === null" class="mt-2 text-[12px] text-[var(--text-tertiary)]">
            Renseignez au moins un trait pour calculer l'index.
          </p>

          <!-- Barres de contribution -->
          <div v-else class="mt-3 space-y-1.5">
            <div
              v-for="c in result.contributions"
              :key="c.key"
              class="flex items-center gap-3 text-[12px]"
            >
              <span class="w-28 shrink-0 text-[var(--text-secondary)]">{{ c.shortLabel }}</span>
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-card)]">
                <div
                  class="h-full rounded-full bg-[var(--honey)]"
                  :style="{ width: `${c.normalized}%` }"
                />
              </div>
              <span class="w-8 shrink-0 text-right tabular-nums text-[var(--text-tertiary)]">
                {{ Math.round(c.normalized) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="outline" @click="isOpen = false">Annuler</UButton>
        <UButton color="primary" :loading="saving" :disabled="result.index === null" @click="save">
          Enregistrer le test
        </UButton>
      </div>
    </template>
  </UModal>
</template>
