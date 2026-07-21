<template>
  <div class="space-y-8">
    <!-- Calculette sirop -->
    <div>
      <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">Calculette de sirop</h2>
      <p class="mt-1 text-[12.5px] text-[var(--text-secondary)]">
        Ratios exprimés en kg de sucre pour 1 L d'eau — la convention habituelle en apiculture.
      </p>

      <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Type de sirop">
          <USelect
            v-model="ratioId"
            :items="RATIO_OPTIONS"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Nombre de ruches">
          <UInput v-model.number="nbRuches" type="number" :min="1" class="w-full" />
        </UFormField>
        <UFormField label="Dose de sucre par ruche (kg)">
          <UInput
            v-model.number="doseParRuche"
            type="number"
            :min="0"
            :step="0.5"
            :placeholder="String(ratioActif.doseSuggestion)"
            class="w-full"
          />
        </UFormField>
      </div>

      <p class="mt-2 text-[11.5px] text-[var(--text-tertiary)]">
        {{ ratioActif.usage }} — dose indicative : {{ ratioActif.doseSuggestion }} kg/ruche
      </p>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-[12px] bg-[var(--surface-muted)] p-4">
          <p
            class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
          >
            Sucre total
          </p>
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
            {{ formatNombre(sucreTotalKg) }} kg
          </p>
        </div>
        <div class="rounded-[12px] bg-[var(--surface-muted)] p-4">
          <p
            class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
          >
            Eau totale
          </p>
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
            {{ formatNombre(eauTotaleL) }} L
          </p>
        </div>
      </div>
    </div>

    <!-- Candi -->
    <div class="border-t border-[var(--border-default)] pt-6">
      <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">Candi</h2>
      <p class="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        Pâte sucrée prête à l'emploi, quasi sans eau — utilisée en hiver ou en urgence quand le
        sirop liquide n'est plus adapté (les abeilles ne se déplacent plus pour aller chercher un
        nourrisseur liquide en dessous d'environ 10°C).
      </p>
      <ul class="mt-3 space-y-1.5 text-[12.5px] text-[var(--text-secondary)]">
        <li>• Nourrissement d'urgence en plein hiver (réserves trop basses)</li>
        <li>• Complément de fin d'hiver avant la reprise de ponte</li>
        <li>• Se pose directement sur les cadres, sous le couvre-cadre</li>
      </ul>
      <p class="mt-3 text-[11.5px] text-[var(--text-tertiary)]">
        La fabrication maison est sensible (risque de fermentation si mal dosée) — privilégiez un
        candi du commerce, sauf si vous maîtrisez déjà une recette éprouvée.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RatioSirop {
  id: string;
  label: string;
  ratio: number;
  usage: string;
  doseSuggestion: number;
}

const RATIO_OPTIONS_DATA: RatioSirop[] = [
  {
    id: 'leger',
    label: 'Sirop léger 1:1 — stimulation de printemps',
    ratio: 1,
    usage: 'Stimule la ponte au printemps ou en cas de disette passagère',
    doseSuggestion: 2,
  },
  {
    id: 'moyen',
    label: "Sirop moyen 3:2 — nourrissement d'automne",
    ratio: 1.5,
    usage: 'Constitue des réserves progressivement après la dernière récolte',
    doseSuggestion: 6,
  },
  {
    id: 'lourd',
    label: 'Sirop lourd 2:1 — réserves hivernales',
    ratio: 2,
    usage: "Complète rapidement les réserves avant l'hiver",
    doseSuggestion: 10,
  },
];

const RATIO_OPTIONS = RATIO_OPTIONS_DATA.map((r) => ({ label: r.label, value: r.id }));

const ratioId = ref('leger');
const nbRuches = ref<number>(1);
const doseParRuche = ref<number | undefined>(undefined);

const ratioActif = computed(
  () => RATIO_OPTIONS_DATA.find((r) => r.id === ratioId.value) ?? RATIO_OPTIONS_DATA[0]!,
);

const doseEffective = computed(() => doseParRuche.value ?? ratioActif.value.doseSuggestion);

const sucreTotalKg = computed(() => (nbRuches.value || 0) * doseEffective.value);
const eauTotaleL = computed(() => sucreTotalKg.value / ratioActif.value.ratio);

function formatNombre(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}
</script>
