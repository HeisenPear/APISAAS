<template>
  <div class="space-y-5">
    <!-- Champ de texte libre -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Commentaire</label>
      <textarea
        v-model="commentaire"
        :rows="5"
        placeholder="Saisissez votre commentaire ici..."
        class="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Tags optionnels -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-stone-600">
        Tags
        <span class="text-stone-400 font-normal">optionnel</span>
      </label>
      <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
        <span
          v-for="(tag, index) in tags"
          :key="index"
          class="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 border border-amber-200"
        >
          {{ tag }}
          <button
            type="button"
            class="flex h-4 w-4 items-center justify-center rounded-full text-amber-400 hover:bg-amber-200 hover:text-amber-700 transition-colors"
            @click="removeTag(index)"
          >
            <UIcon name="i-lucide-x" class="h-3 w-3" />
          </button>
        </span>
      </div>

      <div class="flex gap-2">
        <input
          v-model="tagInput"
          type="text"
          placeholder="Ajouter des tags (separes par des virgules)"
          class="h-9 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @keydown.enter.prevent="addTags"
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="flex h-9 items-center gap-1.5 rounded-lg bg-stone-100 px-3 text-sm font-medium text-stone-600 hover:bg-stone-200 transition-colors"
          @click="addTags"
        >
          <UIcon name="i-lucide-plus" class="h-4 w-4" />
          Ajouter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesCommentaire } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesCommentaire;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesCommentaire];
}>();

const commentaire = ref(props.modelValue.texte ?? '');
const tagInput = ref('');
const tags = ref<string[]>([...(props.modelValue.tags ?? [])]);

function onKeydown(e: KeyboardEvent) {
  if (e.key === ',') {
    e.preventDefault();
    addTags();
  }
}

function addTags() {
  const input = tagInput.value.trim();
  if (!input) return;

  const newTags = input
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !tags.value.includes(t));

  tags.value.push(...newTags);
  tagInput.value = '';
}

function removeTag(index: number) {
  tags.value.splice(index, 1);
}

watch(
  [commentaire, tags],
  () => {
    const data: DonneesCommentaire = {
      tags: [...tags.value],
    };
    if (commentaire.value.trim()) {
      data.texte = commentaire.value.trim();
    }
    emit('update:modelValue', data);
  },
  { deep: true, immediate: true },
);
</script>
