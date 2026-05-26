<template>
  <div class="mobile-form-layout">
    <!-- Header avec titre + bouton retour -->
    <div v-if="title" class="mobile-form-header lg:hidden">
      <button class="text-[var(--text-secondary)]" @click="emit('cancel')">
        <UIcon name="i-lucide-arrow-left" />
      </button>
      <h2 class="text-[17px] font-semibold flex-1 text-center">{{ title }}</h2>
      <div class="w-6" /> <!-- spacer -->
    </div>

    <!-- Contenu scrollable -->
    <div class="mobile-form-body">
      <slot />
    </div>

    <!-- Barre d'action sticky en bas (mobile) -->
    <div class="mobile-form-footer lg:hidden">
      <UButton
        block
        color="primary"
        size="lg"
        :loading="loading"
        :disabled="disabled"
        @click="emit('submit')"
      >
        {{ submitLabel || 'Enregistrer' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();
</script>

<style scoped>
.mobile-form-layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.mobile-form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-default);
  background: var(--surface-card);
  position: sticky;
  top: 0;
  z-index: 10;
}

.mobile-form-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.mobile-form-footer {
  position: sticky;
  bottom: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom, 0px)); /* iOS 11.0–11.2 */
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--surface-card);
  border-top: 1px solid var(--border-default);
  backdrop-filter: blur(12px);
}

@media (min-width: 1024px) {
  .mobile-form-layout {
    min-height: auto;
  }
  .mobile-form-body {
    padding: 0;
  }
}
</style>