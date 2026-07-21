<template>
  <div>
    <UiPageHeader
      title="Balances connectées"
      description="Le poids de vos colonies, en direct. Ce qui rentre, ce qui chute, ce qui doit être récolté."
    >
      <template #actions>
        <UButton
          v-if="aDuBeep"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="synchro"
          @click="synchroniser"
        >
          Synchroniser BEEP
        </UButton>
        <UButton icon="i-lucide-plus" color="primary" to="/balances/nouvelle">
          Ajouter une balance
        </UButton>
      </template>
    </UiPageHeader>

    <UiFeatureGate feature="balancesConnectees" blur>
      <template #preview>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="i in 4" :key="i" class="h-20 rounded-[14px] bg-[var(--surface-muted)]" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div v-for="i in 3" :key="i" class="h-40 rounded-[14px] bg-[var(--surface-muted)]" />
          </div>
        </div>
      </template>

      <div class="space-y-5">
        <!-- Bandeau chiffré : les 4 questions du terrain -->
        <div v-if="!pending && balances.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            v-for="s in tuiles"
            :key="s.label"
            class="rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3"
          >
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              {{ s.label }}
            </p>
            <p
              class="mt-1 text-[21px] font-semibold leading-none tabular-nums"
              :style="`color:${s.couleur}`"
            >
              {{ s.valeur }}
            </p>
            <p class="mt-1 text-[11px] text-[var(--text-tertiary)]">{{ s.detail }}</p>
          </div>
        </div>

        <!-- Skeletons -->
        <div v-if="pending" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          <div
            v-for="i in 3"
            :key="i"
            class="h-40 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
          />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!balances.length"
          class="rounded-[16px] border border-dashed border-[var(--border-default)] bg-white"
        >
          <UiEmptyState
            icon="i-lucide-scale"
            title="Aucune balance pour l’instant"
            description="Une balance sous une ruche pèse la colonie en continu : vous voyez la miellée démarrer, une chute suspecte, une hausse pleine — sans ouvrir le couvercle."
            benefit="Le premier point de mesure arrive en général dans l’heure."
            action-label="Ajouter une balance"
            @action="navigateTo('/balances/nouvelle')"
          />
          <div
            class="border-t border-[var(--border-default)] px-6 py-4 text-center text-[12px] text-[var(--text-tertiary)]"
          >
            Pas de matériel connecté ? Une balance « pesée manuelle » suit aussi une ruche témoin.
          </div>
        </div>

        <!-- Liste -->
        <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <BalancesBalancePoidsCard
            v-for="b in balances"
            :key="b.id"
            :balance="b"
            :mesures="mesuresParBalance[b.id] ?? AUCUNE_MESURE"
          />
        </div>
      </div>
    </UiFeatureGate>
  </div>
</template>

<script setup lang="ts">
import { couleurVariation, formatVariation, fraicheur, nombre } from '~/config/balances';
import {
  derniereMesureDe,
  fetchMesuresBalance,
  type Balance,
  type Mesure,
} from '~/composables/useBalances';

definePageMeta({ title: 'Balances connectées' });

/** Référence stable : évite de re-déclencher le watch des cartes à chaque rendu. */
const AUCUNE_MESURE: Mesure[] = [];

const { balances, pending, refresh, synchroniserBeep } = useBalances();
const notifications = useNotifications();

/**
 * Les points 24 h (mini-courbes) sont chargés ICI, une fois, et distribués aux
 * cartes : sinon chaque carte irait les chercher elle-même et on aurait N
 * requêtes en double. Les chiffres, eux, viennent du dernier point déjà servi
 * avec la liste — le bandeau est donc juste dès la première peinture.
 */
const mesuresParBalance = ref<Record<string, Mesure[]>>({});

async function chargerMesures() {
  const lots = await Promise.all(
    balances.value.map(async (b) => {
      try {
        return [b.id, await fetchMesuresBalance(b.id, '24h')] as const;
      } catch {
        return [b.id, AUCUNE_MESURE] as const;
      }
    }),
  );
  mesuresParBalance.value = Object.fromEntries(lots);
}

watch(balances, (liste) => liste.length && chargerMesures(), { immediate: true });

onMounted(() => {
  refresh();
});

const aDuBeep = computed(() => balances.value.some((b) => b.source === 'beep'));

const variation24h = (b: Balance): number | null =>
  nombre(
    derniereMesureDe(b)?.variation24hKg ??
      mesuresParBalance.value[b.id]?.at(-1)?.variation24hKg ??
      null,
  );

const tuiles = computed(() => {
  const actives = balances.value.filter((b) => b.statut === 'active').length;

  const gains = balances.value.map(variation24h).filter((v): v is number => v !== null);
  const gainCumule = gains.length ? gains.reduce((s, v) => s + v, 0) : null;

  const muettes = balances.value.filter(
    (b) => fraicheur(b.derniereMesureAt, b.seuilSilenceHeures).muette,
  ).length;

  const batteries = balances.value.filter(
    (b) => b.batteriePct !== null && b.batteriePct <= (b.seuilBatteriePct ?? 20),
  ).length;

  return [
    {
      label: 'Balances',
      valeur: `${balances.value.length}`,
      detail: `${actives} en service`,
      couleur: 'var(--text-primary)',
    },
    {
      label: 'Sur 24 h',
      valeur: formatVariation(gainCumule),
      detail: 'tous ruchers confondus',
      couleur: couleurVariation(gainCumule),
    },
    {
      label: 'Muettes',
      valeur: `${muettes}`,
      detail: muettes ? 'capteur sans nouvelles' : 'toutes répondent',
      couleur: muettes ? 'var(--clay)' : 'var(--text-primary)',
    },
    {
      label: 'Batterie faible',
      valeur: `${batteries}`,
      detail: batteries ? 'à recharger' : 'rien à signaler',
      couleur: batteries ? 'var(--status-warn)' : 'var(--text-primary)',
    },
  ];
});

const synchro = ref(false);
async function synchroniser() {
  synchro.value = true;
  try {
    const res = await synchroniserBeep();
    notifications.success(
      'Synchronisation BEEP terminée',
      res.mesures ? `${res.mesures} mesure(s) récupérée(s).` : undefined,
    );
    await refresh();
    await chargerMesures();
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    synchro.value = false;
  }
}
</script>
