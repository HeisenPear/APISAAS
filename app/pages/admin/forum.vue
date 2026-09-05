<template>
  <div class="space-y-6">
    <UiPageHeader
      title="Modération du forum"
      description="Arbitrer les signalements, et rendre le droit de signaler."
      :breadcrumbs="[{ label: 'Administration', to: '/admin' }, { label: 'Forum' }]"
    />

    <!-- ─── LES SIGNALEMENTS À ARBITRER ─── -->
    <section class="space-y-3">
      <h2 class="text-[18px] font-semibold text-[var(--text-primary)]">
        Signalements en attente
        <span v-if="signalements.length" class="tabular-nums text-[var(--text-tertiary)]">
          ({{ signalements.length }})
        </span>
      </h2>

      <div v-if="chargement" class="space-y-2">
        <div
          v-for="n in 3"
          :key="n"
          class="h-28 animate-pulse rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)]"
        />
      </div>

      <UiEmptyState
        v-else-if="!signalements.length"
        icon="i-lucide-shield-check"
        title="Rien à arbitrer"
        description="Aucun signalement n’attend de décision."
      />

      <ul v-else class="space-y-2">
        <li
          v-for="s in signalements"
          :key="s.id"
          class="rounded-[12px] border border-[var(--border-default)] bg-white p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-medium text-[var(--text-primary)]">
                {{ libelleMotif(s.motif) }}
              </p>
              <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">
                Dans « {{ s.sujetTitre }} » · signalé par {{ s.signaleurEmail }} ·
                {{ s.messageSignalements }} signalement(s) retenu(s)
              </p>
            </div>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-xs"
              :class="
                s.messageStatut === 'masque'
                  ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
              "
            >
              {{ s.messageStatut === 'masque' ? 'masqué' : 'visible' }}
            </span>
          </div>

          <p v-if="s.precision" class="mt-2 text-xs italic text-[var(--text-secondary)]">
            « {{ s.precision }} »
          </p>

          <!--
            ⚠️ LE CONTENU EN CLAIR, ET SEULEMENT ICI. Le forum public remplace le
            texte d'un message masqué AVANT de répondre. On ne peut pas arbitrer
            ce qu'on ne peut pas lire : cet écran est le seul du produit à le
            recevoir, et c'est `requireAdmin` qui l'y autorise.
          -->
          <p
            class="mt-2 whitespace-pre-wrap rounded-[10px] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {{ s.messageContenu }}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <UButton
              size="sm"
              color="error"
              :loading="enCours === s.id"
              @click="arbitrer(s.id, 'retenu')"
            >
              Signalement fondé — le message reste masqué
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              :loading="enCours === s.id"
              @click="arbitrer(s.id, 'retabli')"
            >
              Signalement injustifié — rétablir le message
            </UButton>
          </div>
          <p class="mt-1.5 text-xs text-[var(--text-tertiary)]">
            « Injustifié » compte un tort à {{ s.signaleurEmail }} ; au {{ seuil }}<sup>e</sup>, son
            droit de signaler est suspendu.
          </p>
        </li>
      </ul>
    </section>

    <!-- ─── LES SUSPENSIONS ─── -->
    <AdminForumSuspensions ref="panneauSuspensions" />
  </div>
</template>

<script setup lang="ts">
import { MOTIFS_ABUS } from '~/config/forum';
import { getApiErrorMessage } from '~/utils/apiError';

definePageMeta({ layout: 'default', middleware: 'admin', title: 'Modération du forum' });

interface SignalementAdmin {
  id: string;
  motif: string;
  precision: string | null;
  signaleurEmail: string;
  messageContenu: string;
  messageStatut: string;
  messageSignalements: number;
  sujetTitre: string;
}

const signalements = ref<SignalementAdmin[]>([]);
const seuil = ref(3);
const chargement = ref(true);
const enCours = ref<string | null>(null);
const panneauSuspensions = ref<{ recharger: () => Promise<void> } | null>(null);
const toast = useToast();

const libelleMotif = (v: string) => MOTIFS_ABUS.find((m) => m.value === v)?.label ?? v;

async function charger() {
  chargement.value = true;
  try {
    const res = await appelApi<{ data: SignalementAdmin[] }>('/api/admin/forum/signalements', {
      query: { arbitrage: 'en_attente' },
    });
    signalements.value = res.data;
  } finally {
    chargement.value = false;
  }
}

async function arbitrer(id: string, arbitrage: 'retenu' | 'retabli') {
  enCours.value = id;
  try {
    await ($fetch as typeof $fetch<unknown, string>)(
      `/api/admin/forum/signalements/${id}/arbitrer`,
      { method: 'POST', body: { arbitrage } },
    );
    /**
     * ⚠️ ON RECHARGE LES DEUX PANNEAUX. Un arbitrage « injustifié » compte un
     * tort, et ce tort peut faire basculer un compte au-dessus du seuil : la
     * liste des suspensions vient de changer sans qu'on l'ait touchée. Ne
     * recharger que celui qu'on a cliqué laisserait l'écran affirmer, à côté,
     * que personne n'est suspendu.
     */
    await Promise.all([charger(), panneauSuspensions.value?.recharger() ?? Promise.resolve()]);
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e), color: 'error' });
  } finally {
    enCours.value = null;
  }
}

onMounted(() => charger());
</script>
