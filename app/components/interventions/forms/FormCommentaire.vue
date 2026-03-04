<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-stone-600">Commentaire</label>

    <UTextarea
      :model-value="props.modelValue.texte"
      placeholder="Saisissez votre commentaire ici..."
      :rows="5"
      :maxlength="2000"
      class="w-full"
      @update:model-value="update('texte', String($event))"
    />

    <p class="text-right text-xs text-stone-400">
      {{ (props.modelValue.texte ?? '').length }} / 2000
    </p>
  </div>
</template>

<script setup lang="ts">
import type { FormCommentaireData } from '~/types/interventions';

const props = defineProps<{ modelValue: FormCommentaireData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormCommentaireData] }>();

function update<K extends keyof FormCommentaireData>(key: K, value: FormCommentaireData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>
