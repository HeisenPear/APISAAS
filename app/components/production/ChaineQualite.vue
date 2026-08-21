<!--
  ChaineQualite — dernier maillon du suivi récolte → mise en pot d'un lot :
  · Éco-Score (environnement) + note Qualité (teneur en eau / HMF), calculés
    côté serveur sur les données réelles du lot ;
  · éditeur de MISE EN POT (conditionnement) sauvegardé via PUT mutualisé.
  Palette chaude (miel → clay), zéro vert (charte). Émet `refresh` après save.
-->
<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Qualité & éco-score
      </h3>
      <button
        type="button"
        class="text-xs font-semibold text-honey-deep transition-colors hover:text-amber-700"
        @click="edition = !edition"
      >
        {{ edition ? 'Fermer' : conditionnement ? 'Modifier' : 'Renseigner' }}
      </button>
    </div>

    <!-- Affichage -->
    <div v-if="!edition" class="space-y-4">
      <!-- Éco-score -->
      <div v-if="ecoScore" class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white"
          :style="`background:${noteEcoStyle(ecoScore.note)}`"
        >
          {{ ecoScore.note }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-stone-900">Éco-score {{ ecoScore.score }}/100</p>
          <div class="mt-1.5 space-y-1">
            <div v-for="d in ecoScore.details" :key="d.critere" class="flex items-center gap-2">
              <span class="w-[130px] shrink-0 truncate text-[10.5px] text-stone-500">{{
                d.critere
              }}</span>
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                <div
                  class="h-full rounded-full"
                  :style="`width:${(d.points / d.max) * 100}%; background: var(--honey)`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-xs text-stone-400">
        Renseignez la mise en pot pour calculer l'éco-score de ce lot.
      </p>

      <!-- Qualité -->
      <div v-if="qualite" class="rounded-xl bg-stone-50 p-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-stone-900">Qualité : {{ labelQualite }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            :style="`background:${qualite.conforme ? 'var(--honey)' : '#a84e2f'}`"
          >
            {{ qualite.conforme ? 'Conforme' : 'Non conforme' }}
          </span>
        </div>
        <p class="mt-1 text-xs text-stone-500">
          Teneur en eau {{ qualite.teneurEau.valeur }} % (seuil {{ qualite.teneurEau.seuil }} %)
          <template v-if="qualite.hmf"> · HMF {{ qualite.hmf.valeur }} mg/kg</template>
        </p>
        <p v-for="m in qualite.messages" :key="m" class="mt-1 text-[11px]" style="color: #a84e2f">
          {{ m }}
        </p>
      </div>

      <!-- Mise en pot -->
      <div v-if="conditionnement" class="text-xs text-stone-500">
        <span v-if="conditionnement.nombrePots"
          >{{ conditionnement.nombrePots }} pot(s)<template v-if="conditionnement.poidsPotG">
            de {{ conditionnement.poidsPotG }} g</template
          ></span
        >
        <span v-if="conditionnement.dluo"> · DLUO {{ formatJour(conditionnement.dluo) }}</span>
      </div>
    </div>

    <!-- Éditeur de mise en pot -->
    <form v-else class="space-y-3" @submit.prevent="enregistrer">
      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="text-[11px] font-medium text-stone-500">Nombre de pots</span>
          <input v-model.number="form.nombrePots" type="number" min="0" class="champ" />
        </label>
        <label class="block">
          <span class="text-[11px] font-medium text-stone-500">Poids / pot (g)</span>
          <input v-model.number="form.poidsPotG" type="number" min="0" class="champ" />
        </label>
        <label class="block">
          <span class="text-[11px] font-medium text-stone-500">Teneur en eau (%)</span>
          <input v-model.number="form.teneurEauPct" type="number" step="0.1" class="champ" />
        </label>
        <label class="block">
          <span class="text-[11px] font-medium text-stone-500">HMF (mg/kg)</span>
          <input v-model.number="form.hmfMgKg" type="number" step="0.1" class="champ" />
        </label>
        <label class="block">
          <span class="text-[11px] font-medium text-stone-500">DLUO</span>
          <input v-model="form.dluo" type="date" class="champ" />
        </label>
        <label class="block">
          <span class="text-[11px] font-medium text-stone-500">Transhumance (km)</span>
          <input v-model.number="form.distanceTranshumanceKm" type="number" min="0" class="champ" />
        </label>
      </div>

      <div class="space-y-1.5 rounded-xl bg-stone-50 p-3">
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-stone-400">
          Signaux éco-score
        </p>
        <label v-for="t in TOGGLES" :key="t.cle" class="flex items-center gap-2">
          <input v-model="form[t.cle]" type="checkbox" class="accent-amber-500" />
          <span class="text-xs text-stone-700">{{ t.label }}</span>
        </label>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <span v-if="erreur" class="text-xs text-red-600">{{ erreur }}</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { ResultatEcoScore } from '~/utils/ecoScore';
import type { ResultatQualiteMiel } from '~/utils/qualiteMiel';

interface Conditionnement {
  nombrePots: number | null;
  poidsPotG: number | null;
  teneurEauPct: string | null;
  hmfMgKg: string | null;
  dluo: string | null;
  circuitCourt: boolean;
  traitementsDoux: boolean;
  environnementPreserve: boolean;
  nourriSucre: boolean;
  distanceTranshumanceKm: string | null;
}

const props = defineProps<{
  numeroLot: string;
  conditionnement: Conditionnement | null;
  qualite: ResultatQualiteMiel | null;
  ecoScore: ResultatEcoScore | null;
}>();
const emit = defineEmits<{ refresh: [] }>();

const edition = ref(false);
const saving = ref(false);
const erreur = ref('');

const TOGGLES = [
  { cle: 'circuitCourt', label: 'Vente en circuit court / directe' },
  { cle: 'traitementsDoux', label: 'Traitements doux (acides organiques, mécanique)' },
  { cle: 'environnementPreserve', label: 'Zone préservée (bio à proximité)' },
  { cle: 'nourriSucre', label: 'Colonies nourries au sucre' },
] as const;

const c = props.conditionnement;
const form = reactive({
  nombrePots: c?.nombrePots ?? null,
  poidsPotG: c?.poidsPotG ?? null,
  teneurEauPct: c?.teneurEauPct != null ? Number(c.teneurEauPct) : null,
  hmfMgKg: c?.hmfMgKg != null ? Number(c.hmfMgKg) : null,
  dluo: c?.dluo ?? '',
  distanceTranshumanceKm: c?.distanceTranshumanceKm != null ? Number(c.distanceTranshumanceKm) : 0,
  circuitCourt: c?.circuitCourt ?? false,
  traitementsDoux: c?.traitementsDoux ?? false,
  environnementPreserve: c?.environnementPreserve ?? false,
  nourriSucre: c?.nourriSucre ?? false,
});

const labelQualite = computed(() => {
  const map: Record<string, string> = {
    excellent: 'Excellent',
    tres_bon: 'Très bon',
    conforme: 'Conforme',
    non_conforme: 'Non conforme',
  };
  return props.qualite ? (map[props.qualite.note] ?? props.qualite.note) : '';
});

/** Échelle CHAUDE (miel doré → clay brûlé), pas de vert (charte). */
function noteEcoStyle(note: string): string {
  return (
    { A: '#F5A623', B: '#E6982C', C: '#d9863b', D: '#c9733a', E: '#a84e2f' }[note] ?? '#c9733a'
  );
}

function formatJour(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function enregistrer(): Promise<void> {
  saving.value = true;
  erreur.value = '';
  try {
    await $fetch(`/api/production/lots/${encodeURIComponent(props.numeroLot)}`, {
      method: 'PUT',
      body: {
        nombrePots: form.nombrePots,
        poidsPotG: form.poidsPotG,
        teneurEauPct: form.teneurEauPct,
        hmfMgKg: form.hmfMgKg,
        dluo: form.dluo || null,
        distanceTranshumanceKm: form.distanceTranshumanceKm,
        circuitCourt: form.circuitCourt,
        traitementsDoux: form.traitementsDoux,
        environnementPreserve: form.environnementPreserve,
        nourriSucre: form.nourriSucre,
      },
    });
    edition.value = false;
    emit('refresh');
  } catch (e) {
    erreur.value = getApiErrorMessage(e);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.champ {
  margin-top: 2px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border-default, #e7e5e4);
  background: #fff;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--text-primary, #1c1c1e);
  outline: none;
}
.champ:focus {
  border-color: var(--honey, #f5a623);
}
</style>
