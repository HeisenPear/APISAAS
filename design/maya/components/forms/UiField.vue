<!--
  UiField — l'enveloppe UNIQUE de tout champ de formulaire du SaaS.
  Label + (requis) + hint + slot de contrôle + message d'état (error / success / maya / hint).
  L'état "maya" affiche le rayon de miel à côté du message ("Pré-rempli par Maya").

  Cible : app/components/ui/UiField.vue
  Usage :
    <UiField label="Rucher" required>
      <UInput v-model="rucher" icon="i-lucide-map-pin" class="maya-input" />
    </UiField>
    <UiField label="Code rucher" status="success" message="Disponible"> … </UiField>
    <UiField label="Date reine" status="maya" message="Pré-rempli par Maya · 2023"> … </UiField>

  ⚠️ Les <input>/<select> natifs ou <UInput> de Nuxt UI doivent porter la classe
  `.maya-input` (voir le bloc <style> ci-dessous, à remonter dans main.css si tu
  préfères un style global) — hauteur 46px, focus honey, états error/success.
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
  { status: 'default' }
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

<!--
  ── À placer dans app/assets/css/main.css (style global des contrôles de saisie) ──

  .maya-input,
  .maya-input input,
  .maya-textarea {
    height: 46px;
    padding: 0 14px;
    font-size: 14.5px;
    background: var(--surface-card);
    border: 1.5px solid var(--border-strong, rgba(168,162,158,0.5));
    border-radius: 11px;
    color: var(--text-primary);
    width: 100%;
    transition: border-color .15s, box-shadow .15s;
  }
  .maya-textarea { height: auto; min-height: 92px; padding: 12px 14px; line-height: 1.55; }
  .maya-input:focus-within,
  .maya-input input:focus,
  .maya-textarea:focus {
    outline: none;
    border-color: var(--honey);
    box-shadow: 0 0 0 3px rgba(245,166,35,0.16);
  }
  .maya-input.is-error { border-color: var(--status-bad); }
  .maya-input.is-success { border-color: var(--sage); }
-->
