<template>
  <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">Miellée</h2>
      <span class="text-[11.5px] text-[var(--text-tertiary)]">{{ intitule }}</span>
    </div>

    <div v-if="pending" class="mt-4 grid grid-cols-2 gap-2.5">
      <div
        v-for="i in 4"
        :key="i"
        class="h-[68px] animate-pulse rounded-[12px] bg-[var(--surface-muted)]"
      />
    </div>

    <p v-else-if="!points.length" class="mt-3 text-[13px] text-[var(--text-secondary)]">
      Pas encore assez de mesures pour dire quoi que ce soit d’utile.
    </p>

    <template v-else>
      <!-- Le verdict, en une phrase -->
      <div
        class="mt-3 flex items-start gap-2.5 rounded-[12px] px-3.5 py-3"
        :style="`background:color-mix(in srgb, ${verdict.couleur} 10%, transparent)`"
      >
        <UIcon
          :name="verdict.icon"
          class="mt-0.5 h-4 w-4 shrink-0"
          :style="`color:${verdict.couleur}`"
        />
        <p class="text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {{ verdict.texte }}
        </p>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2.5">
        <div
          v-for="s in tuiles"
          :key="s.label"
          class="rounded-[12px] border border-[var(--border-default)] px-3.5 py-3"
        >
          <p
            class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            {{ s.label }}
          </p>
          <p
            class="mt-1 text-[19px] font-semibold leading-none tabular-nums"
            :style="`color:${s.couleur}`"
          >
            {{ s.valeur }}
          </p>
          <p v-if="s.detail" class="mt-1 text-[11px] text-[var(--text-tertiary)]">
            {{ s.detail }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  PERIODES,
  couleurVariation,
  formatPoids,
  formatVariation,
  nombre,
  type PeriodeBalance,
} from '~/config/balances';
import type { Mesure } from '~/composables/useBalances';

const props = defineProps<{
  mesures: Mesure[];
  periode: PeriodeBalance;
  pending?: boolean;
}>();

const intitule = computed(
  () => PERIODES.find((p) => p.value === props.periode)?.intitule ?? 'sur la période',
);

interface Point {
  t: number;
  jour: string;
  poids: number;
}

const points = computed<Point[]>(() =>
  props.mesures
    .map((m) => {
      const poids = nombre(m.poidsNetKg) ?? nombre(m.poidsKg);
      const t = new Date(m.mesureeAt).getTime();
      if (poids === null || !Number.isFinite(t)) return null;
      return { t, jour: m.mesureeAt.slice(0, 10), poids };
    })
    .filter((p): p is Point => p !== null)
    .sort((a, b) => a.t - b.t),
);

/** Bilan par journée : dernier poids du jour − premier poids du jour. */
const journees = computed(() => {
  const parJour = new Map<string, { premier: number; dernier: number }>();
  for (const p of points.value) {
    const j = parJour.get(p.jour);
    if (j) j.dernier = p.poids;
    else parJour.set(p.jour, { premier: p.poids, dernier: p.poids });
  }
  return [...parJour.entries()].map(([jour, v]) => ({ jour, gain: v.dernier - v.premier }));
});

const gainTotal = computed(() => {
  const premier = points.value[0];
  const dernier = points.value.at(-1);
  if (!premier || !dernier) return null;
  return dernier.poids - premier.poids;
});

const meilleure = computed(() =>
  journees.value.reduce<{ jour: string; gain: number } | null>(
    (best, j) => (best === null || j.gain > best.gain ? j : best),
    null,
  ),
);

const joursPositifs = computed(() => journees.value.filter((j) => j.gain > 0.05).length);

/** Tendance : rythme de la 2ᵉ moitié de période comparé à la 1ʳᵉ. */
const tendance = computed(() => {
  const j = journees.value;
  if (j.length < 4) return null;
  const moitie = Math.floor(j.length / 2);
  const moyenne = (arr: typeof j) => arr.reduce((s, x) => s + x.gain, 0) / (arr.length || 1);
  return moyenne(j.slice(moitie)) - moyenne(j.slice(0, moitie));
});

const verdict = computed(() => {
  const g = gainTotal.value ?? 0;
  if (g > 1) {
    const t = tendance.value;
    const suite =
      t === null
        ? ''
        : t > 0.2
          ? ' Et le rythme s’accélère — surveillez la place disponible.'
          : t < -0.2
            ? ' Mais le rythme ralentit : la miellée s’essouffle, pensez à la récolte.'
            : '';
    return {
      texte: `Ça rentre : ${formatVariation(g)} ${intitule.value}.${suite}`,
      couleur: 'var(--honey-deep)',
      icon: 'i-lucide-trending-up',
    };
  }
  if (g < -1) {
    return {
      texte: `La colonie a perdu ${formatPoids(Math.abs(g))} ${intitule.value}. Consommation, récolte, essaimage ou vol — allez voir.`,
      couleur: 'var(--clay)',
      icon: 'i-lucide-trending-down',
    };
  }
  return {
    texte: `Poids stable ${intitule.value}. Rien ne rentre, rien ne sort.`,
    couleur: 'var(--text-tertiary)',
    icon: 'i-lucide-minus',
  };
});

const tuiles = computed(() => [
  {
    label: 'Gain total',
    valeur: formatVariation(gainTotal.value),
    couleur: couleurVariation(gainTotal.value),
    detail: null as string | null,
  },
  {
    label: 'Meilleure journée',
    valeur: meilleure.value ? formatVariation(meilleure.value.gain) : '—',
    couleur: couleurVariation(meilleure.value?.gain ?? null),
    detail: meilleure.value
      ? new Date(meilleure.value.jour).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        })
      : null,
  },
  {
    label: 'Jours de récolte',
    valeur: `${joursPositifs.value}`,
    couleur: 'var(--text-primary)',
    detail: `sur ${journees.value.length} jour${journees.value.length > 1 ? 's' : ''} mesuré${journees.value.length > 1 ? 's' : ''}`,
  },
  {
    label: 'Tendance',
    valeur:
      tendance.value === null
        ? '—'
        : tendance.value > 0.2
          ? 'En hausse'
          : tendance.value < -0.2
            ? 'En baisse'
            : 'Stable',
    couleur: couleurVariation(tendance.value),
    detail: tendance.value === null ? 'trop peu de jours' : null,
  },
]);
</script>
