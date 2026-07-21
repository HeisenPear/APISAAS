<template>
  <component
    :is="lien ? 'NuxtLink' : 'div'"
    :to="lien ? `/balances/${balance.id}` : undefined"
    class="group relative block overflow-hidden rounded-[14px] border bg-white p-4 transition-all duration-[250ms]"
    :class="[
      etat.muette
        ? 'border-[var(--clay)]/40'
        : 'border-[var(--border-default)] hover:border-[var(--honey)]/50',
      lien ? 'hover:shadow-[var(--shadow-md)]' : '',
      dense ? 'p-3.5' : '',
    ]"
  >
    <!-- Mini-courbe en filigrane, ancrée en bas de carte -->
    <svg
      v-if="trace"
      class="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full opacity-[0.16]"
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        :points="trace"
        fill="none"
        stroke="var(--honey)"
        stroke-width="1.6"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="relative">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="truncate text-[14px] font-semibold text-[var(--text-primary)]">
            {{ balance.nom }}
          </p>
          <p class="mt-0.5 truncate text-[11.5px] text-[var(--text-tertiary)]">
            {{ liaison }}
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          :style="`background:color-mix(in srgb, ${source.couleur} 14%, transparent); color:${source.couleur}`"
        >
          {{ badgeSource }}
        </span>
      </div>

      <!-- Le poids net : la seule chose qu'on lit à 2 mètres -->
      <div class="mt-3 flex items-end gap-2.5">
        <p
          class="font-semibold leading-none tracking-[-0.02em] tabular-nums text-[var(--text-primary)]"
          :class="dense ? 'text-[26px]' : 'text-[32px]'"
        >
          {{ poids === null ? '—' : poids.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }}
          <span class="text-[14px] font-medium text-[var(--text-tertiary)]">kg</span>
        </p>
        <span
          class="mb-1 inline-flex items-center gap-1 text-[13px] font-semibold tabular-nums"
          :style="`color:${couleurVariation(variation)}`"
        >
          <UIcon :name="iconeVariation(variation)" class="h-3.5 w-3.5" />
          {{ formatVariation(variation) }}
          <span class="text-[10.5px] font-medium text-[var(--text-tertiary)]">/24 h</span>
        </span>
      </div>

      <div
        class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--text-tertiary)]"
      >
        <span
          v-if="balance.batteriePct !== null"
          class="inline-flex items-center gap-1"
          :style="`color:${couleurBatterie(balance.batteriePct, balance.seuilBatteriePct ?? undefined)}`"
        >
          <UIcon :name="iconeBatterie(balance.batteriePct)" class="h-3.5 w-3.5" />
          {{ balance.batteriePct }} %
        </span>
        <span
          class="inline-flex items-center gap-1"
          :class="etat.muette ? 'font-semibold text-[var(--clay)]' : ''"
        >
          <UIcon :name="etat.muette ? 'i-lucide-bell-off' : 'i-lucide-clock'" class="h-3.5 w-3.5" />
          {{
            etat.heures === null ? etat.label : etat.muette ? `Muette · ${etat.label}` : etat.label
          }}
        </span>
        <span v-if="balance.statut !== 'active'" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-power-off" class="h-3.5 w-3.5" />
          {{ statutMeta(balance.statut).label }}
        </span>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import {
  couleurBatterie,
  couleurVariation,
  formatVariation,
  fraicheur,
  iconeBatterie,
  iconeVariation,
  nombre,
  sourceMeta,
  statutMeta,
} from '~/config/balances';
import {
  derniereMesureDe,
  fetchMesuresBalance,
  type Balance,
  type Mesure,
} from '~/composables/useBalances';

/**
 * Carte de poids compacte et AUTONOME : elle ne dépend d'aucun contexte de
 * page. Donnez-lui une balance, elle se débrouille — y compris pour aller
 * chercher elle-même les points de sa mini-courbe si on ne les lui passe pas.
 */
const props = withDefaults(
  defineProps<{
    balance: Balance;
    /** Points déjà chargés (évite le fetch interne). */
    mesures?: Mesure[];
    /** Mini-courbe 24 h. Si `mesures` est absent, la carte la charge seule. */
    sparkline?: boolean;
    /** Carte cliquable vers /balances/[id]. */
    lien?: boolean;
    /** Variante dense (fiche ruche, tableau de bord). */
    dense?: boolean;
  }>(),
  { mesures: undefined, sparkline: true, lien: true, dense: false },
);

const points = ref<Mesure[]>(props.mesures ?? []);

watch(
  () => props.mesures,
  (v) => {
    if (v) points.value = v;
  },
);

onMounted(async () => {
  // Si le parent fournit `mesures` (même vide), c'est LUI qui gère le chargement.
  if (!props.sparkline || props.mesures !== undefined) return;
  try {
    points.value = await fetchMesuresBalance(props.balance.id, '24h');
  } catch {
    // Une mini-courbe absente n'est pas une erreur qui mérite un toast.
  }
});

/** L'horloge bat à la minute — « il y a 12 min » doit rester vrai. */
const maintenant = ref(Date.now());
let battement: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  battement = setInterval(() => {
    maintenant.value = Date.now();
  }, 60000);
});
onBeforeUnmount(() => {
  if (battement) clearInterval(battement);
});

const source = computed(() => sourceMeta(props.balance.source));
const badgeSource = computed(() =>
  props.balance.source === 'csv' ? 'Import' : source.value.label.split(' ')[0],
);

/**
 * Le point de référence : celui servi avec la balance (cache serveur, toujours
 * le plus frais) et, à défaut, le dernier bucket de la mini-courbe.
 */
const derniere = computed(() => derniereMesureDe(props.balance) ?? points.value.at(-1) ?? null);

const poids = computed(
  () => valeurNette(derniere.value ?? undefined) ?? nombre(props.balance.dernierPoidsKg),
);

const variation = computed(() => nombre(derniere.value?.variation24hKg ?? null));

const etat = computed(() =>
  fraicheur(props.balance.derniereMesureAt, props.balance.seuilSilenceHeures, maintenant.value),
);

const liaison = computed(() => {
  const b = props.balance;
  const parts = [b.rucheNumero, b.hausseNumero, b.rucherNom].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return b.marque ? `${b.marque}${b.modele ? ` ${b.modele}` : ''}` : 'Non rattachée';
});

function valeurNette(m: Mesure | undefined): number | null {
  if (!m) return null;
  return nombre(m.poidsNetKg) ?? nombre(m.poidsKg);
}

/** Polyline normalisée sur 100×28 — pas d'ECharts pour un filigrane. */
const trace = computed(() => {
  const vals = points.value
    .map(valeurNette)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  if (vals.length < 3) return '';
  const min = Math.min(...vals);
  const span = Math.max(...vals) - min || 1;
  return vals
    .map(
      (v, i) =>
        `${((i / (vals.length - 1)) * 100).toFixed(2)},${(27 - ((v - min) / span) * 25).toFixed(2)}`,
    )
    .join(' ');
});
</script>
