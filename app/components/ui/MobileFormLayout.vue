<template>
  <div class="mobile-form-layout">
    <!-- Header avec titre + bouton retour -->
    <div v-if="title" class="mobile-form-header lg:hidden">
      <button class="text-[var(--text-secondary)]" @click="emit('cancel')">
        <UIcon name="i-lucide-arrow-left" />
      </button>
      <h2 class="text-[17px] font-semibold flex-1 text-center">{{ title }}</h2>
      <div class="w-6" />
      <!-- spacer -->
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
  /* Offset depuis la bottom-nav mobile (sinon le bouton "Enregistrer" est cache derriere).
     Sur ecran sans bottom-nav (lg:), --bottom-nav-height vaut 0px. */
  bottom: var(--bottom-nav-height, 0px);
  padding: 12px 16px;
  /* La bottom-nav porte deja la safe-area, pas besoin de la dupliquer ici. */
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
