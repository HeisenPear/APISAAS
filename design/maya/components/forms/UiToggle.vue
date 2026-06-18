<!--
  UiToggle — bascule on/off (honey). "Surveillance nocturne", préférences…
  Cible : app/components/ui/UiToggle.vue
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
    <span class="tgl-knob" />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();
</script>

<style scoped>
.tgl {
  width: 46px;
  height: 28px;
  flex-shrink: 0;
  border: none;
  border-radius: 9999px;
  background: var(--surface-sunk);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}
.tgl.is-on {
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
