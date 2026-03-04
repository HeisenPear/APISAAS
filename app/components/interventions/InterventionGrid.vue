<template>
  <div>
    <p class="mb-4 text-sm font-medium text-stone-500">Que souhaitez-vous enregistrer ?</p>
    <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <button
        v-for="item in items"
        :key="item.type"
        type="button"
        class="group flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200"
        :class="
          isSelected(item.type)
            ? `border-${item.color} ${item.bgColor} shadow-sm`
            : 'border-stone-200/60 bg-white hover:border-stone-300 hover:shadow-sm'
        "
        @click="toggle(item.type)"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
          :class="isSelected(item.type) ? item.bgColor : 'bg-stone-50 group-hover:bg-stone-100'"
        >
          <UIcon
            :name="item.icon"
            class="h-6 w-6 transition-colors"
            :class="
              isSelected(item.type) ? item.textColor : 'text-stone-400 group-hover:text-stone-600'
            "
          />
        </div>
        <span
          class="text-xs font-medium transition-colors"
          :class="isSelected(item.type) ? 'text-stone-900' : 'text-stone-500'"
        >
          {{ item.label }}
        </span>
        <div
          v-if="isSelected(item.type)"
          class="h-1.5 w-1.5 rounded-full"
          :class="`bg-${item.color}`"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { INTERVENTION_META, type TypeIntervention } from '~/types/interventions';

const props = defineProps<{
  modelValue: TypeIntervention[];
  multi?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: TypeIntervention[]];
}>();

const items = Object.entries(INTERVENTION_META).map(([type, meta]) => ({
  type: type as TypeIntervention,
  ...meta,
}));

function isSelected(type: TypeIntervention) {
  return props.modelValue.includes(type);
}

function toggle(type: TypeIntervention) {
  if (props.multi) {
    const newValue = isSelected(type)
      ? props.modelValue.filter((t) => t !== type)
      : [...props.modelValue, type];
    emit('update:modelValue', newValue);
  } else {
    emit('update:modelValue', isSelected(type) ? [] : [type]);
  }
}
</script>
