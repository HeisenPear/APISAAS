<!--
  RaccourciWidget — une tuile qui ouvre un onglet, posée sur le tableau de bord.

  Même format qu'un KPI (« petit »), pour se ranger à côté d'eux sans casser le
  carrelage. Le catalogue les dérive de `config/navigation.ts` : l'icône et le
  libellé sont EXACTEMENT ceux de la barre latérale, pour qu'un raccourci se
  reconnaisse au premier coup d'œil.

  `NuxtLink` et non un `@click` : l'apiculteur garde le clic-milieu, le
  « ouvrir dans un nouvel onglet » et le survol qui montre la destination.
-->
<template>
  <NuxtLink
    :to="to"
    class="group flex h-full min-h-[92px] flex-col justify-between p-4 transition-colors"
    :aria-label="`Ouvrir ${label}`"
  >
    <span
      class="flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors"
      style="background: var(--honey-soft); color: var(--honey-deep)"
    >
      <UIcon :name="icon" class="h-[18px] w-[18px]" />
    </span>
    <span class="mt-3 flex items-end justify-between gap-2">
      <span
        class="text-[14px] font-semibold leading-tight"
        style="color: var(--text-primary); font-family: var(--font-display)"
      >
        {{ label }}
      </span>
      <UIcon
        name="i-lucide-arrow-up-right"
        class="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style="color: var(--text-quaternary)"
      />
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  /** Destination — vient de `navigation.ts` via le catalogue des widgets. */
  to: string;
  label: string;
  icon: string;
}>();
</script>
