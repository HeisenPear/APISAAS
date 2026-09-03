<template>
  <div class="rapport">
    <!-- Barre d'actions (masquée à l'impression) -->
    <div class="no-print toolbar">
      <NuxtLink :to="`/ruches/${id}`" class="tb-link">
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" /> Retour à la ruche
      </NuxtLink>
      <button type="button" class="tb-btn" @click="print">
        <UIcon name="i-lucide-printer" class="h-4 w-4" /> Imprimer / PDF
      </button>
    </div>

    <div v-if="pending" class="muted">Chargement du rapport…</div>
    <UiErrorState
      v-else-if="erreurRapport"
      :error="erreurRapport"
      titre="Rapport indisponible"
      :retry="rechargerRapport"
    />
    <div v-else-if="!ruche" class="muted">Ruche introuvable.</div>

    <article v-else class="sheet">
      <!-- En-tête -->
      <header class="head">
        <div>
          <p class="brand">🐝 APIGO</p>
          <h1>Rapport de ruche — {{ ruche.numero }}</h1>
          <p class="sub">
            {{ ruche.rucher?.nom ?? 'Rucher inconnu' }}
            <template v-if="ruche.rucher?.commune"> · {{ ruche.rucher.commune }}</template>
            <template v-if="ruche.rucher?.departement"> ({{ ruche.rucher.departement }})</template>
          </p>
        </div>
        <p class="gen">Généré le {{ today }}</p>
      </header>

      <!-- Identité -->
      <section>
        <h2>Identité</h2>
        <dl class="grid">
          <div>
            <dt>Statut</dt>
            <dd>{{ ruche.statut ?? '—' }}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{{ ruche.type ?? '—' }}</dd>
          </div>
          <div>
            <dt>Race d'abeille</dt>
            <dd>{{ ruche.raceAbeille ?? '—' }}</dd>
          </div>
          <div>
            <dt>Qualité reine</dt>
            <dd>{{ ruche.qualiteReine ?? '—' }}</dd>
          </div>
          <div>
            <dt>Installée le</dt>
            <dd>{{ fmtDate(ruche.dateInstallation) }}</dd>
          </div>
          <div>
            <dt>Cadres / Hausses</dt>
            <dd>{{ ruche.nombreCadres ?? '—' }} / {{ ruche.nombreHausses ?? '—' }}</dd>
          </div>
        </dl>
      </section>

      <!-- Santé -->
      <section v-if="sante">
        <h2>État de santé</h2>
        <div class="score-row">
          <div class="score" :style="{ borderColor: sante.couleur || '#F5A623' }">
            <span class="score-num">{{ sante.score }}</span
            ><span class="score-max">/100</span>
          </div>
          <div>
            <p class="score-niveau">{{ sante.niveau ?? '—' }}</p>
            <p class="muted">
              Dernier contrôle : {{ fmtDate(sante.dernierControle) }} · confiance
              {{ sante.confiance ?? '—' }}
            </p>
          </div>
        </div>
        <ul v-if="sante.raisons?.length" class="reasons">
          <li v-for="(r, i) in sante.raisons" :key="i">{{ r }}</li>
        </ul>
      </section>

      <!-- Interventions -->
      <section>
        <h2>Interventions récentes ({{ interventions.length }})</h2>
        <table v-if="interventions.length">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Force</th>
              <th>Reine vue</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="iv in interventions" :key="iv.id">
              <td>{{ fmtDate(iv.dateVisite) }}</td>
              <td>{{ iv.type ?? '—' }}</td>
              <td>{{ iv.forceColonie ?? '—' }}</td>
              <td>{{ iv.reineVue === true ? 'oui' : iv.reineVue === false ? 'non' : '—' }}</td>
              <td class="notes">{{ iv.notes ?? '' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">Aucune intervention enregistrée.</p>
      </section>

      <!-- Récoltes -->
      <section>
        <h2>Récoltes ({{ recoltes.length }})</h2>
        <table v-if="recoltes.length">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Variété</th>
              <th>Quantité</th>
              <th>Lot</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rc in recoltes" :key="rc.id">
              <td>{{ fmtDate(rc.dateRecolte) }}</td>
              <td>{{ rc.typeProduit ?? 'miel' }}</td>
              <td>{{ rc.typeMiel ?? '—' }}</td>
              <td>{{ rc.quantiteKg ? `${rc.quantiteKg} kg` : '—' }}</td>
              <td>{{ rc.numeroLot ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">Aucune récolte enregistrée.</p>
      </section>

      <footer class="foot">Rapport généré par APIGO — {{ today }}</footer>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const id = computed(() => route.params.id as string);

interface Rucher {
  nom?: string | null;
  commune?: string | null;
  departement?: string | null;
}
interface Ruche {
  numero?: string | null;
  statut?: string | null;
  type?: string | null;
  raceAbeille?: string | null;
  qualiteReine?: string | null;
  dateInstallation?: string | null;
  nombreCadres?: number | null;
  nombreHausses?: number | null;
  rucher?: Rucher | null;
}
interface Sante {
  score: number;
  niveau?: string | null;
  couleur?: string | null;
  confiance?: string | null;
  raisons?: string[];
  dernierControle?: string | null;
}
interface Intervention {
  id: string;
  dateVisite?: string | null;
  type?: string | null;
  forceColonie?: number | null;
  reineVue?: boolean | null;
  notes?: string | null;
}
interface Recolte {
  id: string;
  dateRecolte?: string | null;
  typeProduit?: string | null;
  typeMiel?: string | null;
  quantiteKg?: string | number | null;
  numeroLot?: string | null;
}

// Chargement parallèle (évite le waterfall de 4 requêtes séquentielles → -300/500 ms).
const [rucheFetch, santeFetch, ivFetch, rcFetch] = await Promise.all([
  useFetch<{ data: Ruche }>(() => `/api/ruches/${id.value}`),
  useFetch<{ data: Sante }>(() => `/api/ruches/${id.value}/sante`),
  useFetch<{ data: Intervention[] }>(() => `/api/ruches/${id.value}/interventions`, {
    query: { limit: 30 },
  }),
  useFetch<{ data: Recolte[] }>(() => `/api/ruches/${id.value}/recoltes`, {
    query: { limit: 30 },
  }),
]);
const rucheRes = rucheFetch.data;
const pending = rucheFetch.pending;
// Le rapport s'imprime : un échec de lecture ne doit pas se lire « Ruche
// introuvable », qui donne à croire à une suppression.
const erreurRapport = rucheFetch.error;
const rechargerRapport = rucheFetch.refresh;

/**
 * ⚠️ LE RAPPORT S'IMPRIME. C'est la pièce qu'on emporte, et il agrégeait ruche,
 * interventions et récoltes sans jamais écouter : une visite dictée à Maya n'y
 * figurait pas tant qu'on n'avait pas rechargé la page. Imprimer un document
 * incomplet sans que rien ne le signale est le pire des silences.
 */
const { on: surDonneesRapport } = useDataBus();
surDonneesRapport(
  [
    'ruche:updated',
    'intervention:created',
    'intervention:updated',
    'intervention:deleted',
    'recolte:created',
    'recolte:updated',
    'recolte:deleted',
  ],
  () => {
    void rechargerRapport();
    void santeFetch.refresh();
    void ivFetch.refresh();
    void rcFetch.refresh();
  },
);
const santeRes = santeFetch.data;
const ivRes = ivFetch.data;
const rcRes = rcFetch.data;

const ruche = computed(() => rucheRes.value?.data ?? null);
const sante = computed(() => santeRes.value?.data ?? null);
const interventions = computed(() => ivRes.value?.data ?? []);
const recoltes = computed(() => rcRes.value?.data ?? []);

const today = new Date().toLocaleDateString('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function fmtDate(d: unknown): string {
  if (!d) return '—';
  const date = new Date(d as string);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

function print() {
  if (import.meta.client) window.print();
}

useHead({ title: () => `Rapport ruche ${ruche.value?.numero ?? ''} — APIGO` });
</script>

<style scoped>
.rapport {
  background: #f5f4f1;
  min-height: 100vh;
  padding: 24px 16px;
}
.toolbar {
  max-width: 800px;
  margin: 0 auto 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #57534e;
  font-size: 13px;
}
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5a623;
  color: #1c1c1e;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 10px;
}
.sheet {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  padding: 40px 48px;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  color: #1c1c1e;
  font-size: 13px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #f5a623;
  padding-bottom: 16px;
  margin-bottom: 8px;
}
.brand {
  font-weight: 700;
  font-size: 15px;
}
.head h1 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 4px 0;
}
.sub {
  color: #57534e;
}
.gen {
  color: #706963;
  font-size: 12px;
}
section {
  margin-top: 24px;
}
h2 {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #925b0f;
  margin-bottom: 10px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px 24px;
}
dt {
  font-size: 11px;
  color: #706963;
}
dd {
  font-weight: 600;
}
.score-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.score {
  border: 3px solid #f5a623;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.score-num {
  font-size: 22px;
  font-weight: 700;
}
.score-max {
  font-size: 11px;
  color: #706963;
}
.score-niveau {
  font-weight: 600;
  font-size: 15px;
}
.reasons {
  margin-top: 10px;
  padding-left: 18px;
  list-style: disc;
  color: #57534e;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid #e7e5e0;
  vertical-align: top;
}
th {
  font-size: 11px;
  color: #57534e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.notes {
  color: #57534e;
  font-size: 12px;
}
.muted {
  color: #706963;
}
.foot {
  margin-top: 32px;
  padding-top: 12px;
  border-top: 1px solid #e7e5e0;
  text-align: center;
  color: #706963;
  font-size: 11px;
}

@media print {
  .rapport {
    background: #fff;
    padding: 0;
  }
  .no-print {
    display: none !important;
  }
  .sheet {
    box-shadow: none;
    border-radius: 0;
    max-width: none;
    padding: 0;
  }
  section {
    page-break-inside: avoid;
  }
}
</style>
