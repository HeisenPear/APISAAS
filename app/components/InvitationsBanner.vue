<script setup lang="ts">
// Bannière globale : signale à l'utilisateur qu'il a des invitations d'équipe EN
// ATTENTE, où qu'il soit dans l'app — sinon il ne les découvre qu'en allant, par
// hasard, dans Paramètres → Équipe. Invisible s'il n'en a aucune.
interface InvitationRecue {
  id: string;
  ownerNom: string | null;
  ownerPrenom: string | null;
}

type ReponseInvitations = { data: InvitationRecue[] };

/**
 * ⚠️ CE N'EST PAS UN `useFetch`, ET C'EST DÉLIBÉRÉ — LIRE AVANT DE « SIMPLIFIER ».
 *
 * Écrit en `useFetch<T>(…, { default })`, cet appel-là — et lui seul dans tout
 * le dépôt — faisait franchir à TypeScript sa limite de profondeur
 * d'instanciation (TS2589). Le coût n'était pas local : l'erreur EMPOISONNAIT
 * l'inférence, et le typecheck rendait alors **90 `implicit any` dans des
 * fichiers sans aucun rapport** (BalanceReglages, admin/analytics, tournee…).
 * Mesuré : 0 erreur avant, 92 après, dont 90 purement collatérales.
 *
 * Et le déclencheur n'était pas une faute de code : c'était **l'ajout d'UNE
 * route d'API**, n'importe laquelle — une route d'une ligne rendant
 * `{ ok: true }` suffisait. Nitro type `$fetch` en résolvant le chemin contre
 * l'union de TOUTES les routes du projet ; chaque route ajoutée épaissit cette
 * résolution, et ce site était pile sur le seuil.
 *
 * La parade est `appelApi` (`app/utils/appelApi.ts`), qui ne résout pas le
 * chemin contre l'union des routes : la profondeur redevient constante, quelle
 * que soit la taille du projet. Son en-tête raconte la mesure complète.
 *
 * Le `default` a disparu au passage, et il n'a jamais servi : la ligne
 * `data.value?.data ?? []` juste en dessous couvrait déjà le cas nul depuis le
 * premier jour. C'est justement lui qui coûtait le plus cher — `PickFrom` et
 * `KeysOf` se déplient sur la valeur par défaut ET sur la réponse.
 */
const { data } = useAsyncData<ReponseInvitations>(
  'invitations-recues-banner',
  () => appelApi<ReponseInvitations>('/api/membres/invitations'),
  { lazy: true },
);

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
