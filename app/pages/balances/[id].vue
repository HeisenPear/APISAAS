<template>
  <div class="space-y-5">
    <NuxtLink
      to="/balances"
      class="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Balances
    </NuxtLink>

    <!-- Chargement -->
    <div v-if="pending" class="space-y-4" aria-busy="true">
      <div class="h-10 w-64 animate-pulse rounded-[12px] bg-[var(--surface-muted)]" />
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>
      <div class="h-80 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <UiEmptyState
      v-else-if="!balance"
      icon="i-lucide-scale"
      title="Balance introuvable"
      description="Cette balance n’existe pas ou a été supprimée."
      action-label="Retour aux balances"
      @action="navigateTo('/balances')"
    />

    <template v-else>
      <!-- En-tête -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h1
            class="truncate text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
          >
            {{ balance.nom }}
          </h1>
          <div class="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
            <span
              class="rounded-full px-2 py-0.5 font-semibold"
              :style="`background:color-mix(in srgb, ${meta.couleur} 14%, transparent); color:${meta.couleur}`"
            >
              {{ meta.label }}
            </span>
            <span
              class="rounded-full px-2 py-0.5 font-semibold"
              :style="`background:${statut.fond}; color:${statut.couleur}`"
            >
              {{ statut.label }}
            </span>
            <span class="text-[var(--text-tertiary)]">{{ liaison }}</span>
          </div>
        </div>
        <UButton
          icon="i-lucide-settings-2"
          color="neutral"
          variant="outline"
          @click="reglages = true"
        >
          Réglages
        </UButton>
      </div>

      <!-- Capteur muet : c'est l'info la plus urgente, elle passe avant tout -->
      <div
        v-if="etat.muette"
        class="flex items-start gap-2.5 rounded-[12px] border border-[var(--clay)]/40 bg-[var(--clay-soft)] px-4 py-3"
      >
        <UIcon
          :name="etat.heures === null ? 'i-lucide-plug-zap' : 'i-lucide-bell-off'"
          class="mt-0.5 h-4 w-4 shrink-0 text-[var(--clay-deep)]"
        />
        <p class="text-[13px] leading-relaxed text-[var(--clay-deep)]">
          <template v-if="etat.heures === null">
            Cette balance n’a encore rien envoyé. Suivez le bloc « Comment cette balance envoie ses
            données » ci-dessous pour la brancher.
          </template>
          <template v-else>
            Aucune mesure depuis {{ etat.label.replace('il y a ', '') }}. Batterie, réseau ou
            capteur débranché — la courbe ci-dessous n’est plus à jour.
          </template>
        </p>
      </div>

      <!-- Les 4 chiffres qu'on regarde en premier -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="t in tuiles"
          :key="t.label"
          class="rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3"
        >
          <p
            class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            {{ t.label }}
          </p>
          <p
            class="mt-1 text-[22px] font-semibold leading-none tabular-nums"
            :style="`color:${t.couleur}`"
          >
            {{ t.valeur }}
          </p>
          <p class="mt-1 text-[11px] text-[var(--text-tertiary)]">{{ t.detail }}</p>
        </div>
      </div>

      <div class="grid gap-4 grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="space-y-2">
          <BalancesBalanceCourbe
            v-model:periode="periode"
            :mesures="mesures"
            :pending="mesuresPending"
          />
          <!-- Historique borné par le plan : la donnée n'est PAS perdue, elle est
               simplement hors de la fenêtre consultable. -->
          <p
            v-if="courbe.tronquee"
            class="flex items-center gap-1.5 px-1 text-[11.5px] text-[var(--text-tertiary)]"
          >
            <UIcon name="i-lucide-history" class="h-3.5 w-3.5 shrink-0" />
            Votre plan affiche
            {{ courbe.joursMaxPlan ? `les ${courbe.joursMaxPlan} derniers jours` : 'une partie' }}
            de l’historique. Rien n’est supprimé : passer à un plan supérieur rouvre tout le passé.
          </p>
        </div>
        <div class="space-y-4">
          <BalancesBalanceStatsMiellee
            :mesures="mesures"
            :periode="periode"
            :pending="mesuresPending"
          />
          <BalancesBalanceSourceGuide :balance="balance" @rafraichir="toutRecharger" />
        </div>
      </div>

      <BalancesBalanceMesuresTable :mesures="mesures" :pending="mesuresPending" />

      <p v-if="balance.notes" class="px-1 text-[12.5px] text-[var(--text-tertiary)]">
        {{ balance.notes }}
      </p>

      <BalancesBalanceReglages
        v-model:open="reglages"
        :balance="balance"
        @enregistre="refresh"
        @supprime="navigateTo('/balances')"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  couleurBatterie,
  couleurVariation,
  formatPoids,
  formatVariation,
  fraicheur,
  nombre,
  sourceMeta,
  statutMeta,
  type PeriodeBalance,
} from '~/config/balances';
import {
  derniereMesureDe,
  fetchCourbeBalance,
  poidsNetAffiche,
  type Balance,
  type CourbeBalance,
} from '~/composables/useBalances';

definePageMeta({ title: 'Balance' });

const route = useRoute();
const id = route.params.id as string;
const notifications = useNotifications();

const { data, pending, error, refresh } = useFetch<{ data: Balance }>(`/api/balances/${id}`, {
  key: `balance-${id}`,
  lazy: true,
});
const balance = computed(() => data.value?.data ?? null);

const periode = ref<PeriodeBalance>('7j');
const courbe = ref<CourbeBalance>({
  mesures: [],
  tronquee: false,
  joursMaxPlan: null,
  resume: null,
});
const mesures = computed(() => courbe.value.mesures);
const mesuresPending = ref(true);

async function chargerMesures() {
  mesuresPending.value = true;
  try {
    courbe.value = await fetchCourbeBalance(id, periode.value);
  } catch (e) {
    courbe.value = { mesures: [], tronquee: false, joursMaxPlan: null, resume: null };
    notifications.error(getApiErrorMessage(e, 'Mesures indisponibles'));
  } finally {
    mesuresPending.value = false;
  }
}

async function toutRecharger() {
  await Promise.all([refresh(), chargerMesures()]);
}

onMounted(chargerMesures);
watch(periode, chargerMesures);

const reglages = ref(false);

const meta = computed(() => sourceMeta(balance.value?.source ?? 'webhook'));
const statut = computed(() => statutMeta(balance.value?.statut ?? 'active'));

const etat = computed(() =>
  fraicheur(balance.value?.derniereMesureAt, balance.value?.seuilSilenceHeures ?? null),
);

const liaison = computed(() => {
  const b = balance.value;
  if (!b) return '';
  const parts = [b.rucheNumero, b.hausseNumero, b.rucherNom].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return [b.marque, b.modele].filter(Boolean).join(' ') || 'Non rattachée';
});

/** Le point de référence : celui servi avec la fiche, sinon le dernier bucket. */
const derniere = computed(() => {
  const b = balance.value;
  return (b ? derniereMesureDe(b) : null) ?? mesures.value.at(-1) ?? null;
});

const poidsNet = computed(() =>
  balance.value ? poidsNetAffiche(balance.value, derniere.value) : null,
);

const variation24h = computed(() => nombre(derniere.value?.variation24hKg ?? null));

const tuiles = computed(() => [
  {
    label: 'Poids net',
    valeur: formatPoids(poidsNet.value),
    detail: balance.value?.poidsTare
      ? `tare ${formatPoids(nombre(balance.value.poidsTare))}`
      : 'tare non renseignée',
    couleur: 'var(--text-primary)',
  },
  {
    label: 'Sur 24 h',
    valeur: formatVariation(variation24h.value),
    detail:
      variation24h.value === null
        ? 'pas de comparaison'
        : variation24h.value > 0.05
          ? 'ça rentre'
          : variation24h.value < -0.05
            ? 'ça repart'
            : 'stable',
    couleur: couleurVariation(variation24h.value),
  },
  {
    label: 'Batterie',
    valeur: balance.value?.batteriePct === null ? '—' : `${balance.value?.batteriePct} %`,
    detail: balance.value?.batteriePct === null ? 'non transmise' : 'du capteur',
    couleur: couleurBatterie(
      balance.value?.batteriePct ?? null,
      balance.value?.seuilBatteriePct ?? undefined,
    ),
  },
  {
    label: 'Dernière mesure',
    valeur: etat.value.label,
    detail:
      etat.value.heures === null
        ? 'jamais branchée'
        : etat.value.muette
          ? 'balance muette'
          : 'capteur en ligne',
    couleur: etat.value.muette ? 'var(--clay)' : 'var(--text-primary)',
  },
]);
</script>
