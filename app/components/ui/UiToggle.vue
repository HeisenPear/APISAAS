<!--
  UiToggle — bascule on/off (honey). "Surveillance nocturne", préférences…
  Usage : <UiToggle v-model="surveillance" />
-->
<template>
  <button
    type="button"
    class="tgl"
    :class="{ 'is-on': modelValue }"
    role="switch"
    :aria-checked="modelValue"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="tgl-track"><span class="tgl-knob" /></span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();
</script>

<style scoped>
.tgl {
  /* Cible tactile ≥ 44px (handoff §11) — la piste visuelle reste à 28px. */
  min-height: 44px;
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.tgl-track {
  position: relative;
  display: block;
  width: 46px;
  height: 28px;
  border-radius: 9999px;
  background: var(--surface-sunk);
  transition: background 0.2s;
}
.tgl.is-on .tgl-track {
  background: var(--honey);
}
.tgl-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: left 0.2s var(--ease-out-expo, ease);
}
.tgl.is-on .tgl-knob {
  left: 21px;
}
</style>
