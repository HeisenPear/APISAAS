<!--
  MayaRecap — moment humain : bilan chaleureux de fin de journée + « je veille la
  nuit ». Maya célèbre le travail fait et rassure (handoff §7, MayaPwaRecap).
  Purement présentiel. <IaMayaRecap :interventions="3" prenom="Antoine" /> (auto-import).
-->
<template>
  <div
    class="overflow-hidden rounded-[16px] border p-5"
    style="
      border-color: color-mix(in srgb, var(--honey) 35%, transparent);
      background: var(--honey-soft);
    "
  >
    <div class="flex items-center gap-3">
      <IaMayaMark :size="36" glow state="success" />
      <div class="min-w-0">
        <p
          class="text-[15.5px] font-semibold tracking-[-0.01em]"
          style="
            color: var(--text-primary);
            font-family:
              'SF Pro Display',
              -apple-system,
              sans-serif;
          "
        >
          {{ titre }}
        </p>
        <p class="mt-0.5 text-[12.5px]" style="color: var(--text-secondary)">{{ sousTitre }}</p>
      </div>
    </div>

    <div v-if="interventions > 0 || recolteKg > 0" class="mt-3.5 flex flex-wrap gap-2">
      <span
        v-if="interventions > 0"
        class="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold"
        style="color: var(--honey-deep)"
      >
        📋 {{ interventions }} {{ interventions > 1 ? 'gestes notés' : 'geste noté' }}
      </span>
      <span
        v-if="recolteKg > 0"
        class="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold"
        style="color: var(--honey-deep)"
      >
        🍯 {{ recolteKg }} kg récoltés
      </span>
    </div>

    <p
      class="mt-3.5 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[12.5px]"
      style="background: var(--surface-sidebar); color: #f5f4f1"
    >
      <span aria-hidden="true">🌙</span> Repose-toi — je veille le rucher cette nuit.
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ interventions?: number; recolteKg?: number; prenom?: string }>(),
  { interventions: 0, recolteKg: 0, prenom: '' },
);

const suffixe = computed(() => (props.prenom ? `, ${props.prenom}` : ''));
const titre = computed(() =>
  props.interventions > 0
    ? `On a bien travaillé aujourd'hui${suffixe.value} 🐝`
    : `Belle journée au rucher${suffixe.value} 🐝`,
);
const sousTitre = 'Le rucher est en ordre. Place au repos.';
</script>
