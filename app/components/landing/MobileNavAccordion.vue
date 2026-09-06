<template>
  <div>
    <button
      type="button"
      class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 transition-all"
      @click="open = !open"
    >
      <div class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
        <UIcon :name="icon" class="w-4 h-4 text-stone-500" />
      </div>
      <span class="text-sm font-medium text-stone-700 flex-1 text-left">{{ label }}</span>
      <UIcon
        name="i-lucide-chevron-down"
        class="w-4 h-4 text-stone-400 transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>
    <Transition name="accordion">
      <div v-if="open" class="ml-11 mt-1 flex flex-col gap-0.5">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  label: string;
  icon: string;
}>();

const open = ref(false);
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.2s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
