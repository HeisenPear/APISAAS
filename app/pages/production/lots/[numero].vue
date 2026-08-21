<template>
  <div>
    <NuxtLink
      to="/production/tracabilite"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour a la tracabilite
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-10 w-64 animate-pulse rounded-lg bg-stone-100" />
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <template v-else-if="lot">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
              <UIcon name="i-lucide-package" class="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-stone-900">
                Lot {{ lot.numeroLot }}
              </h1>
              <p class="text-sm text-stone-500">
                {{ lot.nombreRecoltes }} recolte(s) — {{ formatPeriod(lot.dateDebut, lot.dateFin) }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="conformiteClass">
            {{ lot.conformite.score }} conforme
          </span>
        </div>
      </div>

      <!-- KPIs -->
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Production totale</p>
          <p class="mt-1 text-2xl font-bold text-honey-deep">{{ lot.totalKg }} kg</p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Humidite moyenne</p>
          <p class="mt-1 text-2xl font-bold" :class="humiditeColor(lot.humidite.moyenne)">
            {{ lot.humidite.moyenne ?? '-' }}%
          </p>
          <p v-if="lot.humidite.min !== null" class="mt-0.5 text-xs text-stone-400">
            Min {{ lot.humidite.min }}% — Max {{ lot.humidite.max }}%
          </p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Type(s) de miel</p>
          <div class="mt-1 flex flex-wrap gap-1">
            <span
              v-for="type in lot.typesMiel"
              :key="type"
              class="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
            >
              {{ type }}
            </span>
            <span v-if="lot.typesMiel.length === 0" class="text-sm text-stone-400"
              >Non specifie</span
            >
          </div>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Recoltes</p>
          <p class="mt-1 text-2xl font-bold text-stone-900">{{ lot.nombreRecoltes }}</p>
          <p class="mt-0.5 text-xs text-stone-400">{{ lot.ruchers.length }} rucher(s)</p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">DDM</p>
          <p class="mt-1 text-lg font-bold text-stone-900">{{ formatDDM(lot.ddm) }}</p>
          <p class="mt-0.5 text-xs text-stone-400">Date de durabilite minimale</p>
        </div>
      </div>

      <!-- Main content grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left: Traceability chain + Recoltes -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Traceability chain -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Chaine de tracabilite
            </h2>
            <!-- Timeline -->
            <div class="relative space-y-0 pl-8">
              <!-- Step 1: Rucher(s) -->
              <div class="relative pb-6">
                <div
                  class="absolute -left-8 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100"
                >
                  <UIcon name="i-lucide-map-pin" class="h-4 w-4 text-honey-deep" />
                </div>
                <div class="absolute -left-4 top-8 bottom-0 w-px bg-stone-200" />
                <p class="text-xs font-medium uppercase text-stone-400">Origine</p>
                <div class="mt-1 space-y-1">
                  <div
                    v-for="rucher in lot.ruchers"
                    :key="rucher.nom"
                    class="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2"
                  >
                    <span class="text-sm font-medium text-stone-900">{{ rucher.nom }}</span>
                    <span class="text-xs text-stone-500"
                      >{{ rucher.totalKg }} kg — {{ rucher.nbRecoltes }} recolte(s)</span
                    >
                  </div>
                </div>
              </div>

              <!-- Step 2: Extraction -->
              <div class="relative pb-6">
                <div
                  class="absolute -left-8 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100"
                >
                  <UIcon name="i-lucide-droplets" class="h-4 w-4 text-honey-deep" />
                </div>
                <div class="absolute -left-4 top-8 bottom-0 w-px bg-stone-200" />
                <p class="text-xs font-medium uppercase text-stone-400">Extraction</p>
                <div class="mt-1 rounded-lg bg-stone-50 px-3 py-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-stone-700">{{
                      formatPeriod(lot.dateDebut, lot.dateFin)
                    }}</span>
                    <span class="text-sm font-semibold text-honey-deep">{{ lot.totalKg }} kg</span>
                  </div>
                  <p class="mt-0.5 text-xs text-stone-400">
                    Humidite: {{ lot.humidite.moyenne ?? '-' }}%
                    <span
                      v-if="lot.humidite.moyenne && lot.humidite.moyenne <= 20"
                      class="ml-1 text-honey-deep"
                      >&#10003; Conforme (≤ 20%)</span
                    >
                    <span v-else-if="lot.humidite.moyenne" class="ml-1 text-red-600"
                      >&#10007; Non conforme (> 20%)</span
                    >
                  </p>
                </div>
              </div>

              <!-- Step 3: Ruches -->
              <div v-if="lot.ruches.length > 0" class="relative pb-6">
                <div
                  class="absolute -left-8 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100"
                >
                  <UIcon name="i-lucide-box" class="h-4 w-4 text-blue-600" />
                </div>
                <div class="absolute -left-4 top-8 bottom-0 w-px bg-stone-200" />
                <p class="text-xs font-medium uppercase text-stone-400">
                  Ruches sources ({{ lot.ruches.length }})
                </p>
                <div class="mt-1 flex flex-wrap gap-2">
                  <span
                    v-for="ruche in lot.ruches"
                    :key="ruche.numero"
                    class="rounded-lg bg-stone-50 px-3 py-1.5 text-xs"
                  >
                    <span class="font-medium text-stone-900">{{ ruche.numero }}</span>
                    <span class="ml-1 text-stone-400">{{ ruche.totalKg }} kg</span>
                  </span>
                </div>
              </div>

              <!-- Step 4: DDM -->
              <div class="relative pb-6">
                <div
                  class="absolute -left-8 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100"
                >
                  <UIcon name="i-lucide-calendar-clock" class="h-4 w-4 text-violet-600" />
                </div>
                <div class="absolute -left-4 top-8 bottom-0 w-px bg-stone-200" />
                <p class="text-xs font-medium uppercase text-stone-400">Durabilite</p>
                <div class="mt-1 rounded-lg bg-stone-50 px-3 py-2">
                  <p class="text-sm text-stone-700">
                    A consommer de preference avant fin
                    <span class="font-semibold">{{ formatDDM(lot.ddm) }}</span>
                  </p>
                  <p class="mt-0.5 text-xs text-stone-400">
                    DDM = date derniere recolte + 2 ans (standard profession)
                  </p>
                </div>
              </div>

              <!-- Step 5: Ventes -->
              <div class="relative">
                <div
                  class="absolute -left-8 top-0 flex h-8 w-8 items-center justify-center rounded-full"
                  :class="lot.ventes.length > 0 ? 'bg-amber-100' : 'bg-stone-100'"
                >
                  <UIcon
                    name="i-lucide-shopping-bag"
                    class="h-4 w-4"
                    :class="lot.ventes.length > 0 ? 'text-honey-deep' : 'text-stone-400'"
                  />
                </div>
                <p class="text-xs font-medium uppercase text-stone-400">Commercialisation</p>
                <div v-if="lot.ventes.length > 0" class="mt-1 space-y-1">
                  <NuxtLink
                    v-for="vente in lot.ventes"
                    :key="vente.id"
                    :to="`/finances/facture/${vente.id}`"
                    class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 transition-colors hover:bg-amber-100"
                  >
                    <span class="text-sm font-medium text-amber-800">{{ vente.numero }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-honey-deep">{{
                        formatMoney(Number(vente.total ?? 0))
                      }}</span>
                      <span
                        class="rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
                        >{{ vente.statut }}</span
                      >
                    </div>
                  </NuxtLink>
                </div>
                <p v-else class="mt-1 text-xs text-stone-400">Aucune vente liee a ce lot</p>
              </div>
            </div>
          </div>

          <!-- Recoltes list -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Recoltes du lot ({{ lot.recoltes.length }})
            </h2>
            <div class="space-y-2">
              <div
                v-for="recolte in lot.recoltes"
                :key="recolte.id"
                class="flex items-center justify-between rounded-xl bg-stone-50 p-3"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-stone-900">
                      {{ formatDate(recolte.dateRecolte) }}
                    </span>
                    <span
                      v-if="recolte.typeMiel"
                      class="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700"
                    >
                      {{ recolte.typeMiel }}
                    </span>
                  </div>
                  <p class="mt-0.5 text-xs text-stone-400">
                    <template v-if="recolte.rucherNom">{{ recolte.rucherNom }}</template>
                    <template v-if="recolte.rucheNumero"> — {{ recolte.rucheNumero }}</template>
                  </p>
                </div>
                <div class="flex items-center gap-4">
                  <div v-if="recolte.quantiteKg" class="text-right">
                    <p class="text-sm font-bold text-stone-900">
                      {{ Number(recolte.quantiteKg) }} kg
                    </p>
                  </div>
                  <div v-if="recolte.humidite" class="text-right">
                    <p class="text-xs" :class="humiditeColor(Number(recolte.humidite))">
                      {{ Number(recolte.humidite) }}%
                    </p>
                  </div>
                  <div v-if="recolte.nombreHausses" class="text-right">
                    <p class="text-xs text-stone-400">{{ recolte.nombreHausses }}h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="space-y-6">
          <!-- Chaîne qualité : mise en pot + éco-score + qualité -->
          <ProductionChaineQualite
            :numero-lot="lot.numeroLot"
            :conditionnement="lot.conditionnement"
            :qualite="lot.qualite"
            :eco-score="lot.ecoScore"
            @refresh="fetchLot"
          />

          <!-- Passeport du pot : QR autonome à coller sur les pots (page publique /p) -->
          <ProductionPasseportPotQr :lot="lot" :producteur="auth.fullName" origine="France" />

          <!-- Conformite -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Conformite reglementaire
            </h3>
            <div class="space-y-2">
              <div
                v-for="(ok, label) in conformiteItems"
                :key="label"
                class="flex items-center gap-2"
              >
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full"
                  :class="ok ? 'bg-amber-100' : 'bg-red-100'"
                >
                  <UIcon
                    :name="ok ? 'i-lucide-check' : 'i-lucide-x'"
                    class="h-3 w-3"
                    :class="ok ? 'text-honey-deep' : 'text-red-600'"
                  />
                </div>
                <span class="text-sm text-stone-700">{{ label }}</span>
              </div>
            </div>
          </div>

          <!-- Etiquette : aperçu + export PDF / impression -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Étiquettes du lot
            </h3>
            <ProductionEtiquetteLot :lot="lot" />
          </div>

          <!-- Reglementation -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Rappels reglementaires
            </h3>
            <div class="space-y-2 text-xs text-stone-600">
              <div class="flex gap-2">
                <UIcon name="i-lucide-info" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                <p>
                  Humidite maximale autorisee : <span class="font-semibold">20%</span> (Directive
                  2001/110/CE)
                </p>
              </div>
              <div class="flex gap-2">
                <UIcon name="i-lucide-info" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                <p>
                  Cahier de miellerie : conservation <span class="font-semibold">5 ans</span> (Reg.
                  178/2002)
                </p>
              </div>
              <div class="flex gap-2">
                <UIcon name="i-lucide-info" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                <p>DDM standard : <span class="font-semibold">2 ans</span> apres extraction</p>
              </div>
              <div class="flex gap-2">
                <UIcon name="i-lucide-info" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                <p>Lot = identification pour retrait cible en cas de rappel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <UiEmptyState
      v-else
      icon="i-lucide-search-x"
      title="Lot introuvable"
      description="Ce lot n'existe pas ou n'a aucune recolte associee"
      action-label="Retour a la tracabilite"
      @action="navigateTo('/production/tracabilite')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ResultatEcoScore } from '~/utils/ecoScore';
import type { ResultatQualiteMiel } from '~/utils/qualiteMiel';

definePageMeta({ layout: 'default' });

const route = useRoute();
const auth = useAuthStore();
const numero = computed(() => decodeURIComponent(route.params.numero as string));

interface LotDetail {
  numeroLot: string;
  totalKg: number;
  nombreRecoltes: number;
  typesMiel: string[];
  dateDebut: string;
  dateFin: string;
  ddm: string;
  humidite: { moyenne: number | null; min: number | null; max: number | null };
  ruchers: Array<{ nom: string; totalKg: number; nbRecoltes: number }>;
  ruches: Array<{ numero: string; totalKg: number }>;
  recoltes: Array<{
    id: string;
    dateRecolte: string;
    typeMiel: string | null;
    quantiteKg: string | null;
    humidite: string | null;
    nombreHausses: number | null;
    notes: string | null;
    rucherNom: string | null;
    rucheNumero: string | null;
  }>;
  ventes: Array<{
    id: string;
    numero: string | null;
    dateTransaction: string;
    total: string | null;
    statut: string;
  }>;
  conformite: {
    humiditeConforme: boolean;
    lotRenseigne: boolean;
    rucherIdentifie: boolean;
    dateRecolteRenseignee: boolean;
    quantiteRenseignee: boolean;
    score: string;
  };
  conditionnement: {
    nombrePots: number | null;
    poidsPotG: number | null;
    dateConditionnement: string | null;
    teneurEauPct: string | null;
    hmfMgKg: string | null;
    dluo: string | null;
    circuitCourt: boolean;
    traitementsDoux: boolean;
    environnementPreserve: boolean;
    nourriSucre: boolean;
    distanceTranshumanceKm: string | null;
  } | null;
  qualite: ResultatQualiteMiel | null;
  ecoScore: ResultatEcoScore | null;
}

const loading = ref(true);
const lot = ref<LotDetail | null>(null);

const conformiteItems = computed(() => {
  if (!lot.value) return {};
  const c = lot.value.conformite;
  return {
    'Humidite ≤ 20%': c.humiditeConforme,
    'Lot renseigne': c.lotRenseigne,
    'Rucher identifie': c.rucherIdentifie,
    'Date de recolte': c.dateRecolteRenseignee,
    'Quantite renseignee': c.quantiteRenseignee,
  } as Record<string, boolean>;
});

const conformiteClass = computed(() => {
  if (!lot.value) return '';
  const parts = lot.value.conformite.score.split('/').map(Number);
  const ok = parts[0] ?? 0;
  const total = parts[1] ?? 1;
  if (ok === total) return 'bg-amber-100 text-amber-800';
  if (ok >= total - 1) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
});

async function fetchLot() {
  loading.value = true;
  try {
    const res = await $fetch<{ data: LotDetail }>(
      `/api/production/lots/${encodeURIComponent(numero.value)}`,
    );
    lot.value = res.data;
  } catch {
    lot.value = null;
  } finally {
    loading.value = false;
  }
}

function humiditeColor(value: number | null): string {
  if (value === null) return 'text-stone-400';
  if (value <= 18) return 'text-honey-deep';
  if (value <= 20) return 'text-honey-deep';
  return 'text-red-600';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDDM(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
  return `${fmt(s)} — ${fmt(e)}`;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

onMounted(fetchLot);
</script>
