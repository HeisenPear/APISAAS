<script setup lang="ts">
// Bannière globale : signale à l'utilisateur qu'il a des invitations d'équipe EN
// ATTENTE, où qu'il soit dans l'app — sinon il ne les découvre qu'en allant, par
// hasard, dans Paramètres → Équipe. Invisible s'il n'en a aucune.
interface InvitationRecue {
  id: string;
  ownerNom: string | null;
  ownerPrenom: string | null;
}

const { data } = useFetch<{ data: InvitationRecue[] }>('/api/membres/invitations', {
  key: 'invitations-recues-banner',
  lazy: true,
  default: () => ({ data: [] as InvitationRecue[] }),
});

const invitations = computed(() => data.value?.data ?? []);
const count = computed(() => invitations.value.length);
const premierNom = computed(() => {
  const inv = invitations.value[0];
  if (!inv) return null;
  return [inv.ownerPrenom, inv.ownerNom].filter(Boolean).join(' ') || 'Un apiculteur';
});
</script>

<template>
  <NuxtLink
    v-if="count > 0"
    to="/parametres/equipe"
    class="mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[13px] transition-[filter] hover:brightness-[0.97]"
    style="
      border-color: color-mix(in srgb, var(--sage) 30%, transparent);
      background: var(--sage-soft);
      color: var(--sage-deep);
    "
  >
    <UIcon name="i-lucide-mail-open" class="h-4 w-4 shrink-0" />
    <span class="flex-1">
      <template v-if="count === 1">
        <strong>{{ premierNom }}</strong> vous invite à rejoindre son exploitation.
      </template>
      <template v-else>
        Vous avez <strong>{{ count }}</strong> invitations d'équipe en attente.
      </template>
    </span>
    <span class="shrink-0 font-semibold">Voir →</span>
  </NuxtLink>
</template>
