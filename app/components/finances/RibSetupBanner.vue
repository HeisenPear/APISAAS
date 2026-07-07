<template>
  <NuxtLink
    v-if="show"
    to="/parametres/facturation"
    class="flex items-center gap-3 rounded-[12px] border px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    style="
      border-color: color-mix(in srgb, var(--honey) 40%, transparent);
      background: var(--honey-soft);
    "
  >
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white">
      <UIcon name="i-lucide-landmark" class="h-4.5 w-4.5" style="color: var(--honey-deep)" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="text-[13px] font-semibold" style="color: var(--text-primary)">
        Ajoutez votre RIB et votre mode de paiement
      </p>
      <p class="text-[12px]" style="color: var(--text-secondary)">
        Ils apparaîtront sur vos factures pour faciliter le règlement de vos clients.
      </p>
    </div>
    <span
      class="inline-flex shrink-0 items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold"
      style="background: var(--honey); color: white"
    >
      Configurer
      <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
interface FacturationPrefs {
  iban?: string;
}

const authStore = useAuthStore();

// Affiché tant qu'aucun IBAN n'est renseigné (pas de RIB exploitable sur facture).
const show = computed(() => {
  const prefs = authStore.profil?.preferences as Record<string, unknown> | null | undefined;
  const f = (prefs?.facturation ?? {}) as FacturationPrefs;
  return !f.iban;
});
</script>
