<template>
  <div class="rounded-[14px] border border-[var(--border-default)] bg-white">
    <div class="flex items-center justify-between px-5 py-4">
      <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">Dernières mesures</h2>
      <span class="text-[11.5px] text-[var(--text-tertiary)]">
        {{ lignes.length }} sur {{ mesures.length }}
      </span>
    </div>

    <div v-if="pending" class="space-y-1.5 px-5 pb-5">
      <div
        v-for="i in 5"
        :key="i"
        class="h-9 animate-pulse rounded-[8px] bg-[var(--surface-muted)]"
      />
    </div>

    <div
      v-else-if="!mesures.length"
      class="border-t border-[var(--border-default)] px-5 py-10 text-center"
    >
      <UIcon name="i-lucide-table" class="mx-auto h-6 w-6 text-[var(--text-tertiary)]" />
      <p class="mt-2 text-[13.5px] text-[var(--text-secondary)]">Aucune mesure enregistrée.</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[560px] text-left text-[12.5px]">
        <thead>
          <tr class="border-y border-[var(--border-default)] bg-[var(--surface-muted)]">
            <th
              class="whitespace-nowrap px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
            >
              Horodatage
            </th>
            <th
              v-for="c in colonnes"
              :key="c.cle"
              class="whitespace-nowrap px-4 py-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
            >
              {{ c.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(m, i) in lignes"
            :key="m.mesureeAt + i"
            class="border-b border-[var(--border-faint)] last:border-0 hover:bg-[var(--surface-muted)]/60"
          >
            <td class="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">
              {{ quand(m.mesureeAt) }}
            </td>
            <td
              v-for="c in colonnes"
              :key="c.cle"
              class="whitespace-nowrap px-4 py-2 text-right tabular-nums"
              :class="c.fort ? 'font-semibold text-[var(--text-primary)]' : ''"
              :style="c.signe ? `color:${couleurVariation(nombre(m[c.cle]))}` : ''"
            >
              {{ cellule(m, c) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="mesures.length > limite"
      class="border-t border-[var(--border-default)] px-5 py-3 text-center"
    >
      <button
        class="text-[12.5px] font-semibold text-[var(--honey-deep)] hover:underline"
        @click="limite += 25"
      >
        Afficher plus
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { couleurVariation, formatVariation, nombre } from '~/config/balances';
import type { Mesure } from '~/composables/useBalances';

const props = defineProps<{ mesures: Mesure[]; pending?: boolean }>();

type CleNum = Exclude<keyof Mesure, 'mesureeAt' | 'batteriePct'>;

interface Colonne {
  cle: CleNum | 'batteriePct';
  label: string;
  unite: string;
  digits?: number;
  /** Valeur signée : colorée miel (gain) / argile (perte). */
  signe?: boolean;
  /** Colonne principale, mise en avant. */
  fort?: boolean;
}

/**
 * Toutes les colonnes possibles. Selon la source et l'agrégation, l'API
 * n'en renvoie qu'une partie — on n'affiche donc QUE celles réellement
 * remplies, plutôt qu'une grille de tirets.
 */
const TOUTES: Colonne[] = [
  { cle: 'poidsNetKg', label: 'Net', unite: ' kg', fort: true },
  { cle: 'poidsKg', label: 'Brut', unite: ' kg' },
  { cle: 'poidsMinKg', label: 'Min', unite: ' kg' },
  { cle: 'poidsMaxKg', label: 'Max', unite: ' kg' },
  { cle: 'variationKg', label: 'Écart', unite: ' kg', signe: true },
  { cle: 'variation24hKg', label: '24 h', unite: ' kg', signe: true },
  { cle: 'temperatureC', label: 'Temp.', unite: ' °C' },
  { cle: 'temperatureIntC', label: 'Temp. int.', unite: ' °C' },
  { cle: 'humidite', label: 'Hum.', unite: ' %' },
  { cle: 'batteriePct', label: 'Batt.', unite: ' %', digits: 0 },
  { cle: 'signalDbm', label: 'Signal', unite: ' dBm', digits: 0 },
];

const colonnes = computed(() =>
  TOUTES.filter((c) => props.mesures.some((m) => nombre(m[c.cle]) !== null)),
);

const limite = ref(25);

/** Les plus récentes en haut — l'API renvoie la série dans l'ordre du temps. */
const lignes = computed(() => [...props.mesures].reverse().slice(0, limite.value));

function quand(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cellule(m: Mesure, c: Colonne): string {
  const n = nombre(m[c.cle]);
  if (n === null) return '—';
  if (c.signe) return formatVariation(n);
  return `${n.toFixed(c.digits ?? 1)}${c.unite}`;
}
</script>
