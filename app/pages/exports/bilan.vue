<template>
  <div>
    <NuxtLink
      to="/exports"
      class="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] print:hidden"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Exports & Documents
    </NuxtLink>

    <div class="mb-6 flex items-center justify-between print:hidden">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              BlinkMacSystemFont,
              sans-serif;
          "
        >
          Bilan annuel
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          Synthèse de votre activité apicole
        </p>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedYear"
          class="h-9 rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--honey)] focus:outline-none focus:ring-2 focus:ring-[var(--honey)]/20"
        >
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>
        <UButton
          label="Imprimer / PDF"
          icon="i-lucide-printer"
          color="primary"
          @click="handlePrint"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-32 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <UiErrorState
      v-else-if="bilanError"
      :error="bilanError"
      titre="Bilan indisponible"
      :retry="refreshBilan"
    />

    <!-- Printable content -->
    <div v-else class="print-document space-y-4">
      <!-- En-tête document -->
      <div
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 print:rounded-none print:border-none print:p-0"
      >
        <div class="text-center">
          <h2 class="text-xl font-bold text-[var(--text-primary)]">
            BILAN ANNUEL {{ selectedYear }}
          </h2>
          <!-- Même correction que le registre d'élevage : le garde porte sur la
               VALEUR composée, et l'identité est celle du PROPRIÉTAIRE. -->
          <p v-if="identite.affichage" class="mt-2 text-sm text-[var(--text-secondary)]">
            {{ identite.affichage }}
            <span v-if="emetteur?.napi"> — NAPI : {{ emetteur.napi }}</span>
          </p>
          <p v-if="identite.mentionLegaleNecessaire" class="text-xs text-[var(--text-tertiary)]">
            {{ identite.legal }}
          </p>
          <p v-else-if="!identite.affichage" class="mt-2 text-sm italic text-[var(--clay-deep)]">
            Nom de l’exploitation non renseigné — complétez Réglages › Mon profil.
          </p>
        </div>
      </div>

      <!-- Chiffres clés -->
      <div
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 print:rounded-none print:border-none print:p-0"
      >
        <h3
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
        >
          Chiffres clés
        </h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Ruchers</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {{ bilanData.nbRuchers }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Ruches actives</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {{ bilanData.nbRuchesActives }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Interventions</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {{ bilanData.nbInterventions }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Récoltes</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {{ bilanData.nbRecoltes }}
            </p>
          </div>
        </div>
      </div>

      <!-- Production -->
      <div
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 print:rounded-none print:border-none print:p-0"
      >
        <h3
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
        >
          Production
        </h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Production totale</p>
            <p class="mt-1 text-2xl font-bold text-[var(--honey-deep)]">
              {{ bilanData.productionTotaleKg.toFixed(1) }} kg
            </p>
          </div>
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Moyenne / ruche</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {{ bilanData.productionParRuche.toFixed(1) }} kg
            </p>
          </div>
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Types de miel</p>
            <p class="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {{ bilanData.typesMiel.length }}
            </p>
          </div>
        </div>
        <div v-if="bilanData.typesMiel.length > 0" class="mt-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border-default)] text-left">
                <th
                  class="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                >
                  Type
                </th>
                <th
                  class="pb-2 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                >
                  Quantité (kg)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in bilanData.typesMiel"
                :key="t.type"
                class="border-b border-[var(--border-faint)]"
              >
                <td class="py-2 pr-4 font-medium text-[var(--text-primary)]">{{ t.type }}</td>
                <td class="py-2 pr-4 text-right text-[var(--text-secondary)]">
                  {{ t.quantite.toFixed(1) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Finances -->
      <div
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 print:rounded-none print:border-none print:p-0"
      >
        <h3
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
        >
          Finances
        </h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Chiffre d'affaires</p>
            <p class="mt-1 text-2xl font-bold text-[var(--sage-deep)]">
              {{ formatMoney(bilanData.ca) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Charges</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-secondary)]">
              {{ formatMoney(bilanData.charges) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] text-[var(--text-tertiary)]">Résultat</p>
            <p
              class="mt-1 text-2xl font-bold"
              :class="bilanData.resultat >= 0 ? 'text-[var(--sage-deep)]' : 'text-red-600'"
            >
              {{ formatMoney(bilanData.resultat) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Pied de page -->
      <div class="text-center text-xs text-[var(--text-quaternary)] print:mt-8">
        <p>Document généré le {{ formatDate(new Date().toISOString()) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '~/types/api';
import { identiteEmetteur, type ProfilEmetteurDoc } from '~/config/identite-emetteur';

definePageMeta({ layout: 'default' });

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = computed(() => {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);
  return years;
});

interface BilanData {
  nbRuchers: number;
  nbRuchesActives: number;
  nbInterventions: number;
  nbRecoltes: number;
  productionTotaleKg: number;
  productionParRuche: number;
  typesMiel: { type: string; quantite: number }[];
  ca: number;
  charges: number;
  resultat: number;
}

/**
 * L'identité qui signe ce document : celle du PROPRIÉTAIRE de l'exploitation,
 * pas de l'utilisateur connecté. `/api/profils/me` rend le second — un membre
 * d'équipe y gravait son propre nom sur un document réglementaire.
 */
/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
 * Typer ce chemin contre l'union des 213 routes fait déplier à TypeScript le
 * type de retour réel de chaque handler, et le projet est au-delà de sa limite
 * d'instanciation.
 */
const { data: emetteurRes } = useAsyncData<ApiResponse<ProfilEmetteurDoc>>(
  'emetteur-document',
  () => appelApi<ApiResponse<ProfilEmetteurDoc>>('/api/profils/emetteur'),
);
const emetteur = computed(() => emetteurRes.value?.data ?? null);
const identite = computed(() => identiteEmetteur(emetteur.value));

/**
 * ⚠️ Même raison — cf. `app/utils/appelApi.ts`. L'URL reste construite DANS le
 * gestionnaire pour être relue à chaque appel : c'est ce qui fait que le
 * `watch: [selectedYear]` recharge bien l'année demandée.
 */
const {
  data: bilanRes,
  pending,
  error: bilanError,
  refresh: refreshBilan,
} = useAsyncData<ApiResponse<BilanData>>(
  'bilan-annuel',
  () => appelApi<ApiResponse<BilanData>>(`/api/export/bilan?year=${selectedYear.value}`),
  { watch: [selectedYear] },
);

const defaultBilan: BilanData = {
  nbRuchers: 0,
  nbRuchesActives: 0,
  nbInterventions: 0,
  nbRecoltes: 0,
  productionTotaleKg: 0,
  productionParRuche: 0,
  typesMiel: [],
  ca: 0,
  charges: 0,
  resultat: 0,
};

const bilanData = computed(() => bilanRes.value?.data ?? defaultBilan);

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function handlePrint() {
  window.print();
}
</script>

<style>
@media print {
  .print-document {
    font-size: 11pt;
  }
  .print-document table {
    page-break-inside: auto;
  }
  .print-document tr {
    page-break-inside: avoid;
  }
}
</style>
