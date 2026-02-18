<template>
  <div class="space-y-5">
    <!-- Sous-action tabs -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in sousActions"
        :key="tab.value"
        type="button"
        class="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
        :class="
          form.sous_action === tab.value
            ? 'bg-amber-50 text-amber-700 ring-2 ring-amber-400'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        "
        @click="form.sous_action = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Marquage -->
    <div v-if="form.sous_action === 'marquage'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Marquage</h4>

      <div>
        <label class="mb-2 block text-sm font-medium text-stone-600">Couleur</label>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="c in couleurs"
            :key="c.value"
            type="button"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border-2"
            :class="
              form.couleur === c.value
                ? 'border-stone-800 shadow-sm'
                : 'border-stone-200 hover:border-stone-300'
            "
            @click="form.couleur = c.value"
          >
            <span
              class="inline-block h-5 w-5 rounded-full border border-stone-300 shadow-inner"
              :style="{ backgroundColor: c.hex }"
            />
            {{ c.label }}
          </button>
        </div>
      </div>

      <label
        class="flex items-center gap-3 rounded-lg bg-white px-4 py-3 border border-stone-200 cursor-pointer"
      >
        <input v-model="form.clippage" type="checkbox" class="h-4 w-4 rounded accent-amber-500" />
        <div>
          <span class="text-sm font-medium text-stone-700">Clippage</span>
          <p class="text-xs text-stone-400">Ailes de la reine clippees</p>
        </div>
      </label>
    </div>

    <!-- Changement -->
    <div v-if="form.sous_action === 'changement'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Changement de reine
      </h4>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Origine</label>
          <select
            v-model="form.origine"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">Choisir une origine</option>
            <option v-for="o in origines" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Race</label>
          <select
            v-model="form.race"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">Choisir une race</option>
            <option v-for="r in races" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Fournisseur</label>
        <input
          v-model="form.fournisseur"
          type="text"
          placeholder="Nom du fournisseur ou eleveur"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Prix (EUR)</label>
          <input
            v-model.number="form.prix"
            type="number"
            min="0"
            step="0.01"
            placeholder="35.00"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Date d'introduction</label>
          <input
            v-model="form.date_introduction"
            type="date"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>
    </div>

    <!-- Perte -->
    <div v-if="form.sous_action === 'perte'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Perte de reine</h4>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600"
          >Action pour colonie orpheline</label
        >
        <select
          v-model="form.action_orpheline"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option v-for="a in actionsOrphelines" :key="a.value" :value="a.value">
            {{ a.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Evaluation -->
    <div v-if="form.sous_action === 'evaluation'" class="space-y-5 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Evaluation de la reine
      </h4>

      <!-- Qualite ponte -->
      <div>
        <label class="mb-2 block text-sm font-medium text-stone-600">
          Qualite de ponte : <strong class="text-amber-600">{{ form.qualite_ponte }}/5</strong>
        </label>
        <input
          v-model.number="form.qualite_ponte"
          type="range"
          min="1"
          max="5"
          step="1"
          class="w-full accent-amber-500"
        />
        <div class="flex justify-between text-xs text-stone-400">
          <span>Mauvaise</span>
          <span>Excellente</span>
        </div>
      </div>

      <!-- Douceur -->
      <div>
        <label class="mb-2 block text-sm font-medium text-stone-600">
          Douceur : <strong class="text-amber-600">{{ form.douceur }}/5</strong>
        </label>
        <input
          v-model.number="form.douceur"
          type="range"
          min="1"
          max="5"
          step="1"
          class="w-full accent-amber-500"
        />
        <div class="flex justify-between text-xs text-stone-400">
          <span>Agressive</span>
          <span>Tres douce</span>
        </div>
      </div>

      <!-- Prolificite -->
      <div>
        <label class="mb-2 block text-sm font-medium text-stone-600">
          Prolificite : <strong class="text-amber-600">{{ form.prolificite }}/5</strong>
        </label>
        <input
          v-model.number="form.prolificite"
          type="range"
          min="1"
          max="5"
          step="1"
          class="w-full accent-amber-500"
        />
        <div class="flex justify-between text-xs text-stone-400">
          <span>Faible</span>
          <span>Tres prolifique</span>
        </div>
      </div>

      <!-- Score summary -->
      <div
        v-if="averageScore !== null"
        class="flex items-center gap-2 rounded-lg bg-white px-4 py-3 border border-stone-200"
      >
        <UIcon name="i-lucide-star" class="h-4 w-4 text-amber-500" />
        <span class="text-sm text-stone-600">
          Score moyen :
          <strong class="font-semibold text-amber-600">{{ averageScore }}/5</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesReine } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesReine;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesReine];
}>();

const sousActions = [
  { value: 'marquage' as const, label: 'Marquage' },
  { value: 'changement' as const, label: 'Changement' },
  { value: 'perte' as const, label: 'Perte' },
  { value: 'evaluation' as const, label: 'Evaluation' },
];

const couleurs = [
  { value: 'blanc' as const, label: 'Blanc', hex: '#FFFFFF' },
  { value: 'jaune' as const, label: 'Jaune', hex: '#FBBF24' },
  { value: 'rouge' as const, label: 'Rouge', hex: '#EF4444' },
  { value: 'vert' as const, label: 'Vert', hex: '#22C55E' },
  { value: 'bleu' as const, label: 'Bleu', hex: '#3B82F6' },
];

const origines = [
  { value: 'elevage_personnel', label: 'Elevage personnel' },
  { value: 'achat', label: 'Achat' },
  { value: 'cellule_royale_naturelle', label: 'Cellule royale naturelle' },
  { value: 'autre', label: 'Autre' },
];

const races = ['Buckfast', 'Noire', 'Carnica', 'Italienne', 'Caucasienne', 'Hybride', 'Autre'];

const actionsOrphelines = [
  { value: 'introduction_nouvelle' as const, label: 'Introduction nouvelle reine' },
  { value: 'reunion' as const, label: 'Reunion avec une autre colonie' },
  { value: 'attente_cellule' as const, label: 'Attente cellule royale' },
  { value: 'rien' as const, label: 'Aucune action' },
];

const form = reactive<DonneesReine>({
  sous_action: props.modelValue.sous_action ?? 'marquage',
  couleur: props.modelValue.couleur,
  clippage: props.modelValue.clippage ?? false,
  origine: props.modelValue.origine ?? '',
  race: props.modelValue.race ?? '',
  fournisseur: props.modelValue.fournisseur ?? '',
  prix: props.modelValue.prix,
  date_introduction: props.modelValue.date_introduction ?? '',
  action_orpheline: props.modelValue.action_orpheline ?? 'introduction_nouvelle',
  qualite_ponte: props.modelValue.qualite_ponte ?? 3,
  douceur: props.modelValue.douceur ?? 3,
  prolificite: props.modelValue.prolificite ?? 3,
});

const averageScore = computed(() => {
  if (form.sous_action !== 'evaluation') return null;
  const sum = (form.qualite_ponte ?? 3) + (form.douceur ?? 3) + (form.prolificite ?? 3);
  return Math.round((sum / 3) * 10) / 10;
});

watch(
  () => ({ ...form }),
  () => {
    const data: DonneesReine = {
      sous_action: form.sous_action,
    };

    if (form.sous_action === 'marquage') {
      data.couleur = form.couleur;
      data.clippage = form.clippage;
    } else if (form.sous_action === 'changement') {
      data.origine = form.origine || undefined;
      data.race = form.race || undefined;
      data.fournisseur = form.fournisseur || undefined;
      data.prix = form.prix;
      data.date_introduction = form.date_introduction || undefined;
    } else if (form.sous_action === 'perte') {
      data.action_orpheline = form.action_orpheline;
    } else if (form.sous_action === 'evaluation') {
      data.qualite_ponte = form.qualite_ponte;
      data.douceur = form.douceur;
      data.prolificite = form.prolificite;
    }

    emit('update:modelValue', data);
  },
  { deep: true, immediate: true },
);
</script>
