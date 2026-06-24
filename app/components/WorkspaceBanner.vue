<script setup lang="ts">
// Repère affiché à un MEMBRE : rappelle qu'il agit dans l'espace partagé d'un
// propriétaire (et non le sien). Invisible pour un compte solo / propriétaire.
const { isMember, workspaceOwner, refreshUsage } = useGating();
onMounted(() => refreshUsage());
</script>

<template>
  <div
    v-if="isMember && workspaceOwner"
    class="mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px]"
    style="
      border-color: color-mix(in srgb, var(--honey) 30%, transparent);
      background: var(--honey-soft);
      color: var(--honey-deep);
    "
  >
    <UIcon name="i-lucide-users-round" class="h-4 w-4 shrink-0" />
    <span>
      Vous travaillez dans l'exploitation de <strong>{{ workspaceOwner }}</strong>
    </span>
  </div>
</template>
