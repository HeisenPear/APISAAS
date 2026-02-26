<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="mb-2 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="typeConfig.bg">
        <UIcon :name="typeConfig.icon" class="h-5 w-5" :class="typeConfig.text" />
      </div>
      <div>
        <p class="font-semibold text-stone-900">{{ typeConfig.label }}</p>
        <p v-if="stockNom" class="text-xs text-stone-400">{{ stockNom }}</p>
      </div>
    </div>

    <!-- Quantite -->
    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Quantite *</label>
      <UInput
        v-model.number="form.quantite"
        type="number"
        step="0.01"
        :min="mouvementType === 'ajustement' ? '0' : '0.01'"
        :max="mouvementType === 'sortie' && stockQuantite !== undefined ? stockQuantite : undefined"
        required
        placeholder="0"
      />
      <p
        v-if="mouvementType === 'sortie' && stockQuantite !== undefined"
        class="mt-1 text-xs text-stone-400"
      >
        Disponible : {{ stockQuantite }} {{ stockUnite || 'unites' }}
      </p>
    </div>

    <!-- Motif -->
    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Motif</label>
      <UInput v-model="form.motif" placeholder="Raison du mouvement" />
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
      <UButton label="Annuler" variant="ghost" color="neutral" @click="$emit('cancel')" />
      <UButton
        type="submit"
        :label="typeConfig.action"
        :color="
          mouvementType === 'entree' ? 'primary' : mouvementType === 'sortie' ? 'error' : 'neutral'
        "
        :loading="loading"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  mouvementType: 'entree' | 'sortie' | 'ajustement';
  stockNom?: string;
  stockQuantite?: number;
  stockUnite?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: { quantite: number; motif: string }];
  cancel: [];
}>();

const typeConfigs = {
  entree: {
    label: 'Entree de stock',
    icon: 'i-lucide-plus-circle',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    action: 'Ajouter',
  },
  sortie: {
    label: 'Sortie de stock',
    icon: 'i-lucide-minus-circle',
    bg: 'bg-red-50',
    text: 'text-red-600',
    action: 'Retirer',
  },
  ajustement: {
    label: 'Ajustement de stock',
    icon: 'i-lucide-refresh-cw',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    action: 'Ajuster',
  },
};

const typeConfig = computed(() => typeConfigs[props.mouvementType]);

const form = reactive({
  quantite: 0,
  motif: '',
});

function handleSubmit() {
  emit('submit', { ...form });
}
</script>
