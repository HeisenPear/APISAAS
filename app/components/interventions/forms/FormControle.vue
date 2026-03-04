<template>
  <div class="space-y-5">
    <!-- Tri-state toggles -->
    <div class="space-y-3">
      <div v-for="field in triStateFields" :key="field.key" class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">{{ field.label }}</label>
        <div class="flex gap-2">
          <button
            type="button"
            class="min-h-[44px] flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-200"
            :class="
              props.modelValue[field.key] === true
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300'
            "
            @click="update(field.key, props.modelValue[field.key] === true ? null : true)"
          >
            Oui
          </button>
          <button
            type="button"
            class="min-h-[44px] flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-200"
            :class="
              props.modelValue[field.key] === false
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300'
            "
            @click="update(field.key, props.modelValue[field.key] === false ? null : false)"
          >
            Non
          </button>
        </div>
      </div>
    </div>

    <!-- Force colonie (4 segments) -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-stone-600">Force de la colonie</label>
      <div class="flex gap-1.5">
        <button
          v-for="n in [1, 2, 3, 4] as const"
          :key="n"
          type="button"
          class="min-h-[44px] flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-all duration-200"
          :class="
            n <= props.modelValue.forceColonie
              ? 'border-[#F5A623]/60 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300'
          "
          @click="update('forceColonie', n)"
        >
          {{ n }}
        </button>
      </div>
      <p class="text-xs text-stone-400">1 = faible, 4 = tres forte</p>
    </div>

    <!-- Comportement (3 icons) -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-stone-600">Comportement</label>
      <div class="flex gap-2">
        <button
          v-for="opt in comportementOptions"
          :key="opt.value"
          type="button"
          class="min-h-[44px] flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all duration-200"
          :class="
            props.modelValue.comportement === opt.value
              ? 'border-[#F5A623]/60 bg-amber-50'
              : 'border-stone-200/60 bg-white hover:border-stone-300'
          "
          @click="update('comportement', opt.value)"
        >
          <UIcon
            :name="opt.icon"
            class="h-5 w-5"
            :class="
              props.modelValue.comportement === opt.value ? 'text-amber-600' : 'text-stone-400'
            "
          />
          <span
            class="text-xs font-medium"
            :class="
              props.modelValue.comportement === opt.value ? 'text-amber-700' : 'text-stone-500'
            "
          >
            {{ opt.label }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormControleData } from '~/types/interventions';

const props = defineProps<{ modelValue: FormControleData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormControleData] }>();

function update<K extends keyof FormControleData>(key: K, value: FormControleData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const triStateFields: Array<{
  key: 'reineVue' | 'couvainPresent' | 'celluleRoyale' | 'reserves';
  label: string;
}> = [
  { key: 'reineVue', label: 'Reine vue ?' },
  { key: 'couvainPresent', label: 'Couvain present ?' },
  { key: 'celluleRoyale', label: 'Cellules royales ?' },
  { key: 'reserves', label: 'Reserves suffisantes ?' },
];

const comportementOptions = [
  { value: 'calme' as const, label: 'Calme', icon: 'i-lucide-smile' },
  { value: 'agitee' as const, label: 'Agitee', icon: 'i-lucide-meh' },
  { value: 'agressive' as const, label: 'Agressive', icon: 'i-lucide-angry' },
];
</script>
