<template>
  <section class="space-y-3">
    <div>
      <h2 class="text-[18px] font-semibold text-[var(--text-primary)]">Droit de signaler</h2>
      <!--
        ⚠️ CETTE PHRASE EST LA RAISON D'ÊTRE DE L'ÉCRAN. La suspension est
        DÉFINITIVE — c'est la décision prise pour ce produit — et « définitif »
        ne veut dire quelque chose que s'il existe une main pour la lever. Sans
        ce panneau, retrouver un compte suspendu demanderait d'ouvrir la base :
        la sanction serait irréversible en pratique, ce qui n'a jamais été
        demandé.
      -->
      <p class="mt-0.5 text-sm text-[var(--text-secondary)]">
        Suspendu après {{ seuil }} signalements jugés injustifiés. La suspension ne s’éteint pas
        d’elle-même : vous la levez.
      </p>
    </div>

    <div v-if="chargement" class="space-y-2">
      <div
        v-for="n in 2"
        :key="n"
        class="h-16 animate-pulse rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)]"
      />
    </div>

    <UiEmptyState
      v-else-if="!comptes.length"
      icon="i-lucide-users"
      title="Aucun compte suspendu"
      description="Personne n’a atteint le seuil de signalements injustifiés."
    />

    <ul v-else class="space-y-2">
      <li
        v-for="c in comptes"
        :key="c.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--border-default)] bg-white px-4 py-3"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-[var(--text-primary)]">{{ c.email }}</p>
          <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">
            {{ c.torts }} signalement(s) jugé(s) injustifié(s) ·
            <span :class="c.suspendu ? 'text-[var(--danger)]' : 'text-[var(--success)]'">
              {{ c.suspendu ? 'suspendu' : 'droit rendu' }}
            </span>
          </p>
        </div>

        <UButton
          size="sm"
          :variant="c.suspendu ? 'solid' : 'outline'"
          :color="c.suspendu ? 'primary' : 'neutral'"
          :loading="enCours === c.id"
          @click="basculer(c)"
        >
          {{ c.suspendu ? 'Rendre le droit de signaler' : 'Retirer de nouveau' }}
        </UButton>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/apiError';

interface CompteSuspendu {
  id: string;
  email: string;
  torts: number;
  levee: boolean;
  /** Calculé par le serveur AVEC `peutSignaler()`, jamais recopié ici. */
  suspendu: boolean;
}

const comptes = ref<CompteSuspendu[]>([]);
const seuil = ref(3);
const chargement = ref(true);
const enCours = ref<string | null>(null);
const toast = useToast();

async function recharger() {
  chargement.value = true;
  try {
    const res = await appelApi<{ data: CompteSuspendu[]; seuil: number }>(
      '/api/admin/forum/suspensions',
    );
    comptes.value = res.data;
    seuil.value = res.seuil;
  } finally {
    chargement.value = false;
  }
}

async function basculer(compte: CompteSuspendu) {
  enCours.value = compte.id;
  try {
    await ($fetch as typeof $fetch<unknown, string>)(
      `/api/admin/forum/suspensions/${compte.id}/lever`,
      { method: 'POST', body: { levee: compte.suspendu } },
    );
    await recharger();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e), color: 'error' });
  } finally {
    enCours.value = null;
  }
}

/** Exposé pour que l'écran d'arbitrage rafraîchisse ce panneau : un tort compté peut suspendre. */
defineExpose({ recharger });

onMounted(() => recharger());
</script>
