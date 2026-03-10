<template>
  <div class="space-y-2">
    <!-- Search -->
    <div class="relative">
      <UIcon
        name="i-lucide-search"
        class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-300"
      />
      <input
        v-model="search"
        type="text"
        placeholder="Filtrer les ruches…"
        class="h-8 w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 text-xs text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
      />
    </div>

    <!-- Select all -->
    <div class="flex items-center justify-between">
      <p class="text-xs text-stone-500">
        {{ modelValue.length }} / {{ ruches.length }} sélectionnées
      </p>
      <button type="button" class="text-xs text-amber-600 hover:text-amber-700" @click="toggleAll">
        {{
          modelValue.length === filteredRuches.length ? 'Tout désélectionner' : 'Tout sélectionner'
        }}
      </button>
    </div>

    <!-- Grid -->
    <div class="max-h-64 overflow-y-auto rounded-xl border border-stone-200">
      <div
        v-for="ruche in filteredRuches"
        :key="ruche.id"
        class="flex cursor-pointer items-center gap-3 border-b border-stone-100 px-3 py-2.5 last:border-0 hover:bg-stone-50"
        @click="toggleRuche(ruche.id)"
      >
        <!-- Checkbox -->
        <div
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
          :class="
            modelValue.includes(ruche.id)
              ? 'border-amber-400 bg-amber-400'
              : 'border-stone-300 bg-white'
          "
        >
          <UIcon
            v-if="modelValue.includes(ruche.id)"
            name="i-lucide-check"
            class="h-3 w-3 text-white"
          />
        </div>

        <!-- Accent dot (statut color) -->
        <span class="h-2 w-2 shrink-0 rounded-full" :class="statutDot(ruche.statut)" />

        <!-- Info -->
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-stone-800">{{ ruche.numero }}</p>
          <p class="truncate text-xs text-stone-400">{{ ruche.rucherNom ?? 'Rucher inconnu' }}</p>
        </div>
      </div>

      <div v-if="filteredRuches.length === 0" class="px-3 py-4 text-center text-xs text-stone-400">
        Aucune ruche trouvée
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RucheOption {
  id: string;
  numero: string;
  statut: string;
  rucherNom?: string | null;
}

const props = defineProps<{
  ruches: RucheOption[];
  modelValue: string[];
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

const search = ref('');

const filteredRuches = computed(() => {
  if (!search.value) return props.ruches;
  const q = search.value.toLowerCase();
  return props.ruches.filter(
    (r) => r.numero.toLowerCase().includes(q) || r.rucherNom?.toLowerCase().includes(q),
  );
});

function toggleRuche(id: string) {
  const next = props.modelValue.includes(id)
    ? props.modelValue.filter((i) => i !== id)
    : [...props.modelValue, id];
  emit('update:modelValue', next);
}

function toggleAll() {
  if (props.modelValue.length === filteredRuches.value.length) {
    emit('update:modelValue', []);
  } else {
    emit(
      'update:modelValue',
      filteredRuches.value.map((r) => r.id),
    );
  }
}

const STATUT_DOTS: Record<string, string> = {
  active: 'bg-emerald-400',
  faible: 'bg-amber-400',
  orpheline: 'bg-amber-400',
  essaimee: 'bg-sky-400',
  morte: 'bg-red-400',
  vendue: 'bg-stone-300',
  fusionnee: 'bg-stone-300',
};

function statutDot(statut: string) {
  return STATUT_DOTS[statut] ?? 'bg-stone-300';
}
</script>
