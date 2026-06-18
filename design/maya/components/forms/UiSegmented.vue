<!--
  UiSegmented — choix unique au tap (2–4 options courtes). Remplace les <select> / radios
  pour "Type d'intervention", "État de la reine", "Exposition"…
  Préféré à la saisie libre (terrain, gants). Cible : app/components/ui/UiSegmented.vue
  Usage : <UiSegmented v-model="type" :options="['Visite','Récolte','Traitement']" />
-->
<template>
  <div class="seg" role="tablist">
    <button
      v-for="o in options"
      :key="o"
      type="button"
      role="tab"
      class="seg-item"
      :class="{ 'is-sel': o === modelValue }"
      :aria-selected="o === modelValue"
      @click="emit('update:modelValue', o)"
    >
      {{ o }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; options: string[] }>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();
</script>

<style scoped>
.seg {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: var(--surface-muted);
  border-radius: 12px;
}
.seg-item {
  flex: 1;
  min-height: 40px;
  padding: 9px 8px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.seg-item.is-sel {
  background: var(--surface-card);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}
</style>
