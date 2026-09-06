<template>
  <div class="flex flex-col items-center justify-center py-16 px-8 text-center">
    <!-- Icon -->
    <div
      class="w-14 h-14 rounded-[14px] bg-[var(--surface-muted)] flex items-center justify-center mb-5"
    >
      <UIcon :name="icon" class="h-6 w-6 text-[var(--text-tertiary)]" />
    </div>

    <!-- Title -->
    <!-- <h2>, pas <h3> : cet état vide suit directement le <h1> de la page dans
         31 écrans du produit, et sauter un niveau casse la navigation au
         lecteur d'écran (l'utilisateur cherche le titre de section suivant et
         ne le trouve pas). L'apparence ne change pas — la taille vient des
         classes, pas du niveau. -->
    <h2 class="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
      {{ title }}
    </h2>

    <!-- Description -->
    <p class="text-[14px] text-[var(--text-tertiary)] max-w-sm leading-relaxed mb-6">
      {{ description }}
    </p>

    <!-- Benefit (optionnel) — vend la première valeur -->
    <p
      v-if="benefit"
      class="-mt-3 mb-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--honey-deep)]"
    >
      <UIcon name="i-lucide-sparkles" class="h-3.5 w-3.5 shrink-0" />
      {{ benefit }}
    </p>

    <!-- Action button -->
    <UButton v-if="actionLabel" color="primary" @click="emit('action')">
      {{ actionLabel }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
  /** Ligne « bénéfice » optionnelle sous la description (vend la 1re valeur). */
  benefit?: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>
