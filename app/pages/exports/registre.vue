<template>
  <div>
    <NuxtLink
      to="/finances/rapports"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700 print:hidden"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux exports
    </NuxtLink>

    <!-- Titre + sélecteur d'année + « Imprimer / PDF » : 440 px sur un écran de
         360. Sans passage à la ligne, le bouton d'impression — la seule action
         de cette page réglementaire — sortait de l'écran. -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Registre d'elevage</h1>
        <p class="mt-1 text-sm text-stone-500">Document reglementaire obligatoire</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-2">
          <label class="text-sm text-stone-600">Annee :</label>
          <select
            v-model="selectedYear"
            class="rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          >
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
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
      <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Printable content -->
    <UiErrorState
      v-else-if="erreurRegistre"
      :error="erreurRegistre"
      titre="Registre indisponible"
      :retry="rechargerRegistre"
    />

    <div v-else ref="printArea" class="print-document space-y-6">
      <!-- Header -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <div class="text-center">
          <h2 class="text-xl font-bold text-stone-900">REGISTRE D'ELEVAGE APICOLE</h2>
          <p class="text-sm text-stone-500">Annee {{ selectedYear }}</p>
          <!-- ⚠️ LE GARDE PORTE SUR LA VALEUR, PAS SUR L'OBJET. `v-if="profilData"`
               était vrai dès que la réponse existait, `nom` et `prenom` fussent-ils
               nuls : le registre imprimait alors une ligne d'un seul espace sous son
               titre. Et l'identité vient désormais du PROPRIÉTAIRE de l'exploitation,
               pas de l'utilisateur connecté — un technicien qui imprime le registre y
               gravait son propre nom. -->
          <p v-if="identite.affichage" class="mt-2 text-sm text-stone-700">
            {{ identite.affichage }}
            <span v-if="emetteur?.napi"> — NAPI : {{ emetteur.napi }}</span>
          </p>
          <p v-if="identite.mentionLegaleNecessaire" class="text-xs text-stone-500">
            {{ identite.legal }}
          </p>
          <p v-else-if="!identite.affichage" class="mt-2 text-sm italic text-[var(--clay-deep)]">
            Nom de l’exploitation non renseigné — complétez Réglages › Mon profil.
          </p>
          <p v-if="emetteur?.adresse" class="text-xs text-stone-500">
            {{ emetteur.adresse }}
            {{ emetteur.codePostal ? `, ${emetteur.codePostal}` : '' }}
            {{ emetteur.ville ?? '' }}
          </p>
          <p v-if="emetteur?.siret" class="text-xs text-stone-400">SIRET : {{ emetteur.siret }}</p>
        </div>
      </div>

      <!-- Ruchers -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Emplacements des ruchers
        </h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
              <th class="pb-2 pr-4">Nom</th>
              <th class="pb-2 pr-4">Commune</th>
              <th class="pb-2 pr-4">Departement</th>
              <th class="pb-2 pr-4">Nb ruches</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in ruchersData" :key="r.id" class="border-b border-stone-100">
              <td class="py-2 pr-4 font-medium text-stone-900">{{ r.nom }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ r.commune ?? '—' }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ r.departement ?? '—' }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ r.nbRuches ?? 0 }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="ruchersData.length === 0" class="py-4 text-center text-sm text-stone-400">
          Aucun rucher
        </p>
      </div>

      <!-- Ruches -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Inventaire des ruches
        </h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
              <th class="pb-2 pr-4">Numero</th>
              <th class="pb-2 pr-4">Rucher</th>
              <th class="pb-2 pr-4">Type</th>
              <th class="pb-2 pr-4">Race</th>
              <th class="pb-2 pr-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ruche in ruchesData" :key="ruche.id" class="border-b border-stone-100">
              <td class="py-2 pr-4 font-medium text-stone-900">{{ ruche.numero }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ ruche.rucherNom ?? '—' }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ ruche.type }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ ruche.raceAbeille ?? '—' }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ ruche.statut }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="ruchesData.length === 0" class="py-4 text-center text-sm text-stone-400">
          Aucune ruche
        </p>
      </div>

      <!-- Interventions de l'annee -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Interventions {{ selectedYear }}
        </h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
              <th class="pb-2 pr-4">Date</th>
              <th class="pb-2 pr-4">Ruche</th>
              <th class="pb-2 pr-4">Categorie</th>
              <th class="pb-2 pr-4">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inter in interventionsData"
              :key="inter.id"
              class="border-b border-stone-100"
            >
              <td class="py-2 pr-4 text-stone-600">{{ formatDate(inter.date) }}</td>
              <td class="py-2 pr-4 font-medium text-stone-900">{{ inter.rucheNumero ?? '—' }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ inter.categorie }}</td>
              <td class="py-2 pr-4 text-stone-600">{{ inter.description ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="interventionsData.length === 0" class="py-4 text-center text-sm text-stone-400">
          Aucune intervention
        </p>
      </div>

      <!-- Footer legal -->
      <div class="text-center text-xs text-stone-400 print:mt-8">
        <p>Document genere le {{ formatDate(new Date().toISOString()) }}</p>
        <p>Conformement a l'arrete du 5 juin 2000 relatif au registre d'elevage</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiListResponse, ApiResponse } from '~/types/api';
import { identiteEmetteur, type ProfilEmetteurDoc } from '~/config/identite-emetteur';

definePageMeta({ layout: 'default' });

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = computed(() => {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);
  return years;
});

interface RegistreRucher {
  id: string;
  nom: string;
  commune: string | null;
  departement: string | null;
  nbRuches: number;
}

interface RegistreRuche {
  id: string;
  numero: string;
  rucherNom: string | null;
  type: string;
  raceAbeille: string | null;
  statut: string;
}

interface RegistreIntervention {
  id: string;
  date: string;
  rucheNumero: string | null;
  categorie: string;
  description: string | null;
}

/**
 * L'identité qui signe ce document : celle du PROPRIÉTAIRE de l'exploitation,
 * pas de l'utilisateur connecté. `/api/profils/me` rend le second — un membre
 * d'équipe y gravait son propre nom sur un document réglementaire.
 */
const { data: emetteurRes } = useFetch<ApiResponse<ProfilEmetteurDoc>>('/api/profils/emetteur', {
  key: 'emetteur-document',
});
const emetteur = computed(() => emetteurRes.value?.data ?? null);
const identite = computed(() => identiteEmetteur(emetteur.value));

const {
  data: ruchersRes,
  pending: ruchersPending,
  error: ruchersError,
  refresh: refreshRuchers,
} = useFetch<ApiListResponse<RegistreRucher>>('/api/ruchers', {
  key: 'registre-ruchers',
  query: { limit: 200 },
});
const ruchersData = computed(() => ruchersRes.value?.data ?? []);

const {
  data: ruchesRes,
  pending: ruchesPending,
  error: ruchesError,
  refresh: refreshRuches,
} = useFetch<ApiListResponse<RegistreRuche>>('/api/ruches', {
  key: 'registre-ruches',
  query: { limit: 500 },
});
const ruchesData = computed(() => ruchesRes.value?.data ?? []);

const {
  data: interventionsRes,
  pending: interventionsPending,
  error: interventionsError,
  refresh: refreshInterventions,
} = useFetch<ApiListResponse<RegistreIntervention>>('/api/interventions', {
  key: `registre-interventions-${selectedYear.value}`,
  query: computed(() => ({ limit: 1000, year: selectedYear.value })),
});
const interventionsData = computed(() => interventionsRes.value?.data ?? []);

const pending = computed(
  () => ruchersPending.value || ruchesPending.value || interventionsPending.value,
);

// Le registre d'élevage se présente à un CONTRÔLE SANITAIRE. S'il manque une
// seule des trois lectures, le document imprimé est faux — et faux dans le sens
// qui accuse : « Aucun rucher », « Aucune ruche ». On refuse alors de le rendre
// plutôt que d'en produire une version incomplète d'apparence normale.
const erreurRegistre = computed(
  () => ruchersError.value ?? ruchesError.value ?? interventionsError.value ?? null,
);
function rechargerRegistre() {
  return Promise.all([refreshRuchers(), refreshRuches(), refreshInterventions()]);
}

/**
 * ⚠️ Le REGISTRE est le document qu'on présente en contrôle. Il agrégeait ruchers, ruches et interventions sans jamais écouter : une intervention dictée à Maya n'y figurait pas tant qu'on n'avait pas rechargé la page — sur la pièce même qui fait foi.
 */
const { on: surDonneesRegistre } = useDataBus();
surDonneesRegistre(
  [
    'rucher:created',
    'rucher:updated',
    'rucher:deleted',
    'ruche:created',
    'ruche:updated',
    'ruche:deleted',
    'intervention:created',
    'intervention:updated',
    'intervention:deleted',
  ],
  () => {
    void rechargerRegistre();
  },
);

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
