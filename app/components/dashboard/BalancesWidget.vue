<template>
  <!-- Rien à afficher tant qu'aucune balance n'est posée : le tableau de bord ne
       doit pas se remplir de blocs vides pour une fonctionnalité non utilisée. -->
  <section v-if="pending || balances.length">
    <div class="mb-4 flex items-baseline justify-between gap-3">
      <h2
        class="text-[18px] font-semibold tracking-[-0.015em]"
        style="
          font-family:
            'SF Pro Display',
            -apple-system,
            system-ui,
            sans-serif;
        "
      >
        Poids des ruches
      </h2>
      <NuxtLink
        to="/balances"
        class="text-[12.5px] font-semibold text-[var(--honey-deep)] transition-colors hover:underline"
      >
        Toutes les balances →
      </NuxtLink>
    </div>

    <div v-if="pending" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="i in 2"
        :key="i"
        class="h-[104px] animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <BalancesBalancePoidsCard v-for="b in aAfficher" :key="b.id" :balance="b" dense />
    </div>

    <p v-if="reste > 0" class="mt-2 text-[12px] text-[var(--text-tertiary)]">
      + {{ reste }} autre{{ reste > 1 ? 's' : '' }} balance{{ reste > 1 ? 's' : '' }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Balance } from '~/composables/useBalances';

/**
 * Aperçu des balances sur le tableau de bord. Volontairement limité aux
 * premières : le tableau de bord donne l'état du jour, pas l'inventaire —
 * la page /balances est là pour ça.
 */
const MAX_AFFICHEES = 3;

const { data, pending } = useFetch<{ data: Balance[] }>('/api/balances', {
  key: 'dashboard-balances',
  lazy: true,
  default: () => ({ data: [] }),
});

const balances = computed(() => data.value?.data ?? []);

/**
 * Les plus « parlantes » d'abord : celles qui ont une mesure récente. Une
 * balance muette n'a pas à occuper la place d'une balance qui produit.
 */
const triees = computed(() =>
  [...balances.value].sort((a, b) => {
    const ta = a.derniereMesureAt ? new Date(a.derniereMesureAt).getTime() : 0;
    const tb = b.derniereMesureAt ? new Date(b.derniereMesureAt).getTime() : 0;
    return tb - ta;
  }),
);

const aAfficher = computed(() => triees.value.slice(0, MAX_AFFICHEES));
const reste = computed(() => Math.max(0, balances.value.length - MAX_AFFICHEES));
</script>
