<!--
  UiField — enveloppe UNIQUE de tout champ de formulaire (label, requis, hint, état).
  L'état "maya" affiche le rayon de miel + message ("Pré-rempli par Maya"). Voir handoff §5.
  Les contrôles natifs / <UInput> portent la classe .maya-input (définie dans main.css).
  Usage : <UiField label="Rucher" required><UInput class="maya-input" v-model="x"/></UiField>
-->
<template>
  <div class="ui-field">
    <label v-if="label" class="ui-field-label">
      {{ label }}
      <span v-if="required" class="ui-field-req">*</span>
      <span v-if="hint" class="ui-field-hint">{{ hint }}</span>
    </label>

    <slot />

    <p v-if="message" class="ui-field-msg" :class="`is-${status}`">
      <IaMayaMark v-if="status === 'maya'" :size="13" />
      <UIcon v-else-if="status === 'error'" name="i-lucide-info" class="h-3.5 w-3.5" />
      <UIcon v-else-if="status === 'success'" name="i-lucide-check" class="h-3.5 w-3.5" />
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
    required?: boolean;
    status?: 'default' | 'error' | 'success' | 'maya';
    message?: string;
  }>(),
  { status: 'default', label: '', hint: '', message: '' },
);
</script>

<style scoped>
.ui-field {
  margin-bottom: 18px;
}
.ui-field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
.ui-field-req {
  color: var(--status-bad);
}
.ui-field-hint {
  margin-left: auto;
  font-weight: 500;
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.ui-field-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.ui-field-msg.is-error {
  color: var(--status-bad);
}
.ui-field-msg.is-success {
  color: var(--sage-deep);
}
.ui-field-msg.is-maya {
  color: var(--honey-deep);
}
</style>
