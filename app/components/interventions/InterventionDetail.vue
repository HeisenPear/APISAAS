<template>
  <div class="space-y-4">
    <!-- Materiel -->
    <template v-if="type === 'materiel' && donnees">
      <div v-if="d.elements?.length > 0" class="space-y-2">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Elements</h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(el, i) in d.elements"
            :key="i"
            class="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
          >
            {{ el.type }} <span class="font-semibold">x{{ el.quantite }}</span>
          </span>
        </div>
      </div>
    </template>

    <!-- Controle -->
    <template v-else-if="type === 'controle' && donnees">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in controleItems"
          :key="item.label"
          class="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2"
        >
          <span class="text-sm text-stone-600">{{ item.label }}</span>
          <span v-if="item.value === true" class="text-sm font-medium text-emerald-600">Oui</span>
          <span v-else-if="item.value === false" class="text-sm font-medium text-red-500">Non</span>
          <span v-else class="text-sm text-stone-400">Non verifie</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div v-if="d.force_colonie" class="flex items-center gap-1">
          <span class="text-sm text-stone-600">Force :</span>
          <span
            v-for="s in 4"
            :key="s"
            class="text-lg"
            :class="s <= d.force_colonie ? 'text-amber-400' : 'text-stone-200'"
            >&#9733;</span
          >
        </div>
        <div v-if="d.comportement" class="flex items-center gap-1.5">
          <span class="text-sm text-stone-600">Comportement :</span>
          <span class="text-sm font-medium" :class="comportementColor">{{
            comportementLabel
          }}</span>
        </div>
      </div>
    </template>

    <!-- Recolte -->
    <template v-else-if="type === 'recolte' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Produit</dt>
          <dd class="text-sm font-medium text-stone-700 capitalize">{{ d.type_produit }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Quantite</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.quantite }} {{ d.unite }}</dd>
        </div>
        <div v-if="d.type_miel" class="flex justify-between">
          <dt class="text-sm text-stone-500">Type de miel</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.type_miel }}</dd>
        </div>
        <div v-if="d.taux_humidite" class="flex justify-between">
          <dt class="text-sm text-stone-500">Humidite</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.taux_humidite }}%</dd>
        </div>
        <div v-if="d.numero_lot" class="flex justify-between">
          <dt class="text-sm text-stone-500">Lot</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.numero_lot }}</dd>
        </div>
      </dl>
    </template>

    <!-- Nourrissement -->
    <template v-else-if="type === 'nourrissement' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Type</dt>
          <dd class="text-sm font-medium text-stone-700">{{ nourritureLabel }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Quantite</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.quantite }} {{ d.unite }}</dd>
        </div>
        <div v-if="d.concentration" class="flex justify-between">
          <dt class="text-sm text-stone-500">Concentration</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.concentration }}</dd>
        </div>
      </dl>
    </template>

    <!-- Essaimage -->
    <template v-else-if="type === 'essaimage' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Essaim recupere</dt>
          <dd
            class="text-sm font-medium"
            :class="d.essaim_recupere ? 'text-emerald-600' : 'text-red-500'"
          >
            {{ d.essaim_recupere ? 'Oui' : 'Non' }}
          </dd>
        </div>
        <div v-if="d.localisation_recuperation" class="flex justify-between">
          <dt class="text-sm text-stone-500">Localisation</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.localisation_recuperation }}</dd>
        </div>
      </dl>
    </template>

    <!-- Division -->
    <template v-else-if="type === 'division' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Nombre de divisions</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.nombre_divisions }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Cadres par division</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.cadres_par_division }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Reine transferee</dt>
          <dd
            class="text-sm font-medium"
            :class="d.reine_dans_division ? 'text-emerald-600' : 'text-amber-600'"
          >
            {{ d.reine_dans_division ? 'Oui' : 'Non (orpheline)' }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Deplacement -->
    <template v-else-if="type === 'deplacement' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Motif</dt>
          <dd class="text-sm font-medium text-stone-700 capitalize">{{ d.motif }}</dd>
        </div>
        <div v-if="d.emplacement" class="flex justify-between">
          <dt class="text-sm text-stone-500">Emplacement</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.emplacement }}</dd>
        </div>
        <div v-if="d.date_retour_prevue" class="flex justify-between">
          <dt class="text-sm text-stone-500">Retour prevu</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.date_retour_prevue }}</dd>
        </div>
      </dl>
    </template>

    <!-- Varroa -->
    <template v-else-if="type === 'varroa' && donnees">
      <div class="mb-2 inline-flex rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
        {{ varroaSousActionLabel }}
      </div>
      <dl class="space-y-2">
        <template v-if="d.sous_action === 'comptage_plancher'">
          <div class="flex justify-between">
            <dt class="text-sm text-stone-500">Varroas comptes</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.nombre_varroas ?? '-' }}</dd>
          </div>
          <div v-if="d.chute_par_jour != null" class="flex justify-between">
            <dt class="text-sm text-stone-500">Chute/jour</dt>
            <dd
              class="text-sm font-semibold"
              :class="
                (d.chute_par_jour ?? 0) > 5
                  ? 'text-red-600'
                  : (d.chute_par_jour ?? 0) > 2
                    ? 'text-amber-600'
                    : 'text-green-600'
              "
            >
              {{ d.chute_par_jour }} varroas/jour
            </dd>
          </div>
        </template>
        <template v-else-if="d.sous_action === 'traitement'">
          <div v-if="d.type_traitement" class="flex justify-between">
            <dt class="text-sm text-stone-500">Traitement</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.type_traitement }}</dd>
          </div>
          <div v-if="d.dosage" class="flex justify-between">
            <dt class="text-sm text-stone-500">Dosage</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.dosage }}</dd>
          </div>
        </template>
        <template v-else-if="d.sous_action === 'suppression_couvain_male'">
          <div class="flex justify-between">
            <dt class="text-sm text-stone-500">Cadres retires</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.nombre_cadres_retires ?? '-' }}</dd>
          </div>
        </template>
        <template v-else-if="d.sous_action === 'comptage_vph'">
          <div v-if="d.taux_vph != null" class="flex justify-between">
            <dt class="text-sm text-stone-500">Taux VPH</dt>
            <dd
              class="text-sm font-semibold"
              :class="
                (d.taux_vph ?? 0) > 3
                  ? 'text-red-600'
                  : (d.taux_vph ?? 0) > 1
                    ? 'text-amber-600'
                    : 'text-green-600'
              "
            >
              {{ d.taux_vph }}%
            </dd>
          </div>
        </template>
      </dl>
    </template>

    <!-- Pesee -->
    <template v-else-if="type === 'pesee' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Poids</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.poids_kg }} kg</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Type de pesee</dt>
          <dd class="text-sm font-medium text-stone-700">{{ peseeLabel }}</dd>
        </div>
        <div v-if="d.poids_estime_total" class="flex justify-between">
          <dt class="text-sm text-stone-500">Poids total estime</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.poids_estime_total }} kg</dd>
        </div>
        <div v-if="d.variation_kg != null" class="flex justify-between">
          <dt class="text-sm text-stone-500">Variation</dt>
          <dd
            class="text-sm font-semibold"
            :class="
              (d.variation_kg ?? 0) > 0
                ? 'text-green-600'
                : (d.variation_kg ?? 0) < 0
                  ? 'text-red-600'
                  : 'text-stone-500'
            "
          >
            {{ (d.variation_kg ?? 0) > 0 ? '+' : '' }}{{ d.variation_kg }} kg
          </dd>
        </div>
      </dl>
    </template>

    <!-- Commentaire -->
    <template v-else-if="type === 'commentaire' && donnees">
      <p v-if="d.texte" class="whitespace-pre-line text-sm text-stone-700">{{ d.texte }}</p>
      <div v-if="d.tags?.length" class="flex flex-wrap gap-2">
        <span
          v-for="(tag, i) in d.tags"
          :key="i"
          class="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200"
        >
          {{ tag }}
        </span>
      </div>
    </template>

    <!-- Empilement -->
    <template v-else-if="type === 'empilement' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Methode</dt>
          <dd class="text-sm font-medium text-stone-700 capitalize">
            {{ d.methode_reunion?.replace('_', ' ') }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Ruche source</dt>
          <dd class="text-sm font-medium text-stone-700 capitalize">
            {{ d.devenir_ruche_source }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Sanitaire -->
    <template v-else-if="type === 'sanitaire' && donnees">
      <div
        class="mb-2 inline-flex rounded-lg bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
      >
        {{ sanitaireSousActionLabel }}
      </div>
      <dl class="space-y-2">
        <div v-if="d.cause_probable" class="flex justify-between">
          <dt class="text-sm text-stone-500">Cause probable</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.cause_probable }}</dd>
        </div>
        <div v-if="d.declaration_gdsa != null" class="flex justify-between">
          <dt class="text-sm text-stone-500">Declaration GDSA</dt>
          <dd
            class="text-sm font-medium"
            :class="d.declaration_gdsa ? 'text-emerald-600' : 'text-stone-500'"
          >
            {{ d.declaration_gdsa ? 'Oui' : 'Non' }}
          </dd>
        </div>
        <div v-if="d.type_nettoyage" class="flex justify-between">
          <dt class="text-sm text-stone-500">Type nettoyage</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.type_nettoyage }}</dd>
        </div>
        <div v-if="d.nombre_cadres" class="flex justify-between">
          <dt class="text-sm text-stone-500">Cadres</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.nombre_cadres }}</dd>
        </div>
      </dl>
    </template>

    <!-- Transvasement -->
    <template v-else-if="type === 'transvasement' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Cadres transferes</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.cadres_transferes }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Origine</dt>
          <dd class="text-sm font-medium text-stone-700 capitalize">
            {{ d.origine?.replace('_', ' ') }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Ruche source</dt>
          <dd class="text-sm font-medium text-stone-700 capitalize">
            {{ d.devenir_ruche_source?.replace('_', ' ') }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Reine -->
    <template v-else-if="type === 'reine' && donnees">
      <div
        class="mb-2 inline-flex rounded-lg bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 capitalize"
      >
        {{ d.sous_action }}
      </div>
      <dl class="space-y-2">
        <div v-if="d.couleur" class="flex items-center justify-between">
          <dt class="text-sm text-stone-500">Couleur</dt>
          <dd class="flex items-center gap-1.5">
            <span class="h-4 w-4 rounded-full border" :class="reineColorClass" />
            <span class="text-sm font-medium text-stone-700 capitalize">{{ d.couleur }}</span>
          </dd>
        </div>
        <div v-if="d.race" class="flex justify-between">
          <dt class="text-sm text-stone-500">Race</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.race }}</dd>
        </div>
        <div v-if="d.fournisseur" class="flex justify-between">
          <dt class="text-sm text-stone-500">Fournisseur</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.fournisseur }}</dd>
        </div>
        <div v-if="d.prix" class="flex justify-between">
          <dt class="text-sm text-stone-500">Prix</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.prix }} EUR</dd>
        </div>
      </dl>
    </template>

    <!-- Fallback -->
    <template v-else>
      <pre class="whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-xs text-stone-700">{{
        JSON.stringify(donnees, null, 2)
      }}</pre>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DonneesIntervention } from '~/types/interventions';

const props = defineProps<{
  type: string;
  donnees: DonneesIntervention | null;
}>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const d = computed(() => (props.donnees ?? {}) as Record<string, any>);

const controleItems = computed(() => [
  { label: 'Reine vue', value: d.value.reine_vue },
  { label: 'Couvain present', value: d.value.couvain_present },
  { label: 'Cellules royales', value: d.value.cellules_royales },
  { label: 'Reserves presentes', value: d.value.reserves_presentes },
]);

const comportementLabel = computed(() => {
  const map: Record<string, string> = { calme: 'Calme', agitee: 'Agitee', agressive: 'Agressive' };
  return map[d.value.comportement] ?? d.value.comportement;
});

const comportementColor = computed(() => {
  const map: Record<string, string> = {
    calme: 'text-green-600',
    agitee: 'text-amber-600',
    agressive: 'text-red-600',
  };
  return map[d.value.comportement] ?? 'text-stone-600';
});

const nourritureLabel = computed(() => {
  const map: Record<string, string> = {
    sirop_sucre: 'Sirop de sucre',
    sirop_glucose: 'Sirop de glucose',
    candi: 'Candi',
    pate_proteique: 'Pate proteique',
    miel: 'Miel',
    autre: 'Autre',
  };
  return map[d.value.type_nourriture] ?? d.value.type_nourriture;
});

const varroaSousActionLabel = computed(() => {
  const map: Record<string, string> = {
    comptage_plancher: 'Comptage sur plancher',
    traitement: 'Traitement',
    suppression_couvain_male: 'Suppression couvain male',
    comptage_vph: 'Comptage VPH/100 AB',
  };
  return map[d.value.sous_action] ?? d.value.sous_action;
});

const sanitaireSousActionLabel = computed(() => {
  const map: Record<string, string> = {
    essaim_mort: 'Essaim mort',
    nettoyer_ruche: 'Nettoyer la ruche',
    nettoyer_plancher: 'Nettoyer le plancher',
    retrait_couvain: 'Retrait de couvain',
  };
  return map[d.value.sous_action] ?? d.value.sous_action;
});

const peseeLabel = computed(() => {
  const map: Record<string, string> = {
    totale: 'Pesee totale',
    cote_droit: 'Pesee de cote (droite)',
    cote_gauche: 'Pesee de cote (gauche)',
    arriere: 'Arriere',
  };
  return map[d.value.type_pesee] ?? d.value.type_pesee;
});

const reineColorClass = computed(() => {
  const map: Record<string, string> = {
    blanc: 'bg-white border-stone-300',
    jaune: 'bg-yellow-400 border-yellow-500',
    rouge: 'bg-red-500 border-red-600',
    vert: 'bg-green-500 border-green-600',
    bleu: 'bg-blue-500 border-blue-600',
  };
  return map[d.value.couleur] ?? 'bg-stone-300 border-stone-400';
});
</script>
