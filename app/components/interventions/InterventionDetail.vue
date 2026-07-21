<template>
  <div class="space-y-4">
    <!-- Materiel -->
    <template v-if="type === 'materiel' && donnees">
      <div v-if="elements.length > 0" class="space-y-2">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Éléments</h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(el, i) in elements"
            :key="i"
            class="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
          >
            {{ el.element ?? el.type }} <span class="font-semibold">x{{ el.quantite }}</span>
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
          <span v-if="item.value === true" class="text-sm font-medium text-amber-600">Oui</span>
          <span v-else-if="item.value === false" class="text-sm font-medium text-red-500">Non</span>
          <span v-else class="text-sm text-stone-400">Non vérifié</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div v-if="forceColonie" class="flex items-center gap-1">
          <span class="text-sm text-stone-600">Force :</span>
          <span
            v-for="s in 4"
            :key="s"
            class="text-lg"
            :class="s <= forceColonie ? 'text-amber-400' : 'text-stone-200'"
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
          <dd class="text-sm font-medium capitalize text-stone-700">
            {{ d.typeProduit ?? d.type_produit }}
          </dd>
        </div>
        <div v-if="d.quantite" class="flex justify-between">
          <dt class="text-sm text-stone-500">Quantité</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.quantite }} {{ d.unite }}</dd>
        </div>
        <div v-if="d.typeMiel ?? d.type_miel" class="flex justify-between">
          <dt class="text-sm text-stone-500">Type de miel</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.typeMiel ?? d.type_miel }}</dd>
        </div>
        <div v-if="d.tauxHumidite ?? d.taux_humidite" class="flex justify-between">
          <dt class="text-sm text-stone-500">Humidité</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.tauxHumidite ?? d.taux_humidite }}%
          </dd>
        </div>
        <div v-if="d.numeroLot ?? d.numero_lot" class="flex justify-between">
          <dt class="text-sm text-stone-500">Lot</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.numeroLot ?? d.numero_lot }}</dd>
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
          <dt class="text-sm text-stone-500">Quantité</dt>
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
          <dt class="text-sm text-stone-500">Essaim récupéré</dt>
          <dd
            class="text-sm font-medium"
            :class="(d.essaimRecupere ?? d.essaim_recupere) ? 'text-amber-600' : 'text-red-500'"
          >
            {{ (d.essaimRecupere ?? d.essaim_recupere) ? 'Oui' : 'Non' }}
          </dd>
        </div>
        <div
          v-if="d.localisationRecuperation ?? d.localisation_recuperation"
          class="flex justify-between"
        >
          <dt class="text-sm text-stone-500">Localisation</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.localisationRecuperation ?? d.localisation_recuperation }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Division -->
    <template v-else-if="type === 'division' && donnees">
      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Nombre de divisions</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.nombreDivisions ?? d.nombre_divisions }}
          </dd>
        </div>
        <div v-if="d.cadresParDivision ?? d.cadres_par_division" class="flex justify-between">
          <dt class="text-sm text-stone-500">Cadres par division</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.cadresParDivision ?? d.cadres_par_division }}
          </dd>
        </div>
        <div
          v-if="d.reineDansLaDivision != null || d.reine_dans_division != null"
          class="flex justify-between"
        >
          <dt class="text-sm text-stone-500">Reine transférée</dt>
          <dd
            class="text-sm font-medium"
            :class="
              (d.reineDansLaDivision ?? d.reine_dans_division) ? 'text-amber-600' : 'text-amber-600'
            "
          >
            {{ (d.reineDansLaDivision ?? d.reine_dans_division) ? 'Oui' : 'Non (orpheline)' }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Deplacement -->
    <template v-else-if="type === 'deplacement' && donnees">
      <dl class="space-y-2">
        <div v-if="d.motif" class="flex justify-between">
          <dt class="text-sm text-stone-500">Motif</dt>
          <dd class="text-sm font-medium capitalize text-stone-700">{{ d.motif }}</dd>
        </div>
        <div v-if="d.rucherDestinationId" class="flex justify-between">
          <dt class="text-sm text-stone-500">Nouveau rucher</dt>
          <dd class="text-sm font-medium text-stone-700">Déplacement enregistré</dd>
        </div>
        <div v-if="d.emplacement" class="flex justify-between">
          <dt class="text-sm text-stone-500">Emplacement</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.emplacement }}</dd>
        </div>
        <div v-if="d.date_retour_prevue" class="flex justify-between">
          <dt class="text-sm text-stone-500">Retour prévu</dt>
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
        <template v-if="varroaSousAction === 'comptage_plancher'">
          <div class="flex justify-between">
            <dt class="text-sm text-stone-500">Varroas comptés</dt>
            <dd class="text-sm font-medium text-stone-700">
              {{ d.nombreVarroas ?? d.nombre_varroas ?? '-' }}
            </dd>
          </div>
          <div v-if="d.dureeJours" class="flex justify-between">
            <dt class="text-sm text-stone-500">Durée</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.dureeJours }} jours</dd>
          </div>
          <div v-if="chuteParJour != null" class="flex justify-between">
            <dt class="text-sm text-stone-500">Chute/jour</dt>
            <dd
              class="text-sm font-semibold"
              :class="
                chuteParJour > 5
                  ? 'text-red-600'
                  : chuteParJour > 2
                    ? 'text-amber-600'
                    : 'text-amber-600'
              "
            >
              {{ chuteParJour }} varroas/jour
            </dd>
          </div>
        </template>
        <template v-else-if="varroaSousAction === 'traitement'">
          <div v-if="d.typeTraitement ?? d.type_traitement" class="flex justify-between">
            <dt class="text-sm text-stone-500">Traitement</dt>
            <dd class="text-sm font-medium text-stone-700">
              {{ d.typeTraitement ?? d.type_traitement }}
            </dd>
          </div>
          <div v-if="d.dosage" class="flex justify-between">
            <dt class="text-sm text-stone-500">Dosage</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.dosage }}</dd>
          </div>
          <div v-if="d.numeroLotProduit" class="flex justify-between">
            <dt class="text-sm text-stone-500">N° lot produit</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.numeroLotProduit }}</dd>
          </div>
          <div v-if="d.dateDebut ?? d.date_debut" class="flex justify-between">
            <dt class="text-sm text-stone-500">Date début</dt>
            <dd class="text-sm font-medium text-stone-700">
              {{ formatDate(d.dateDebut ?? d.date_debut) }}
            </dd>
          </div>
          <div v-if="d.dateFinPrevue ?? d.date_fin_prevue" class="flex justify-between">
            <dt class="text-sm text-stone-500">Fin prévue</dt>
            <dd class="text-sm font-medium text-stone-700">
              {{ formatDate(d.dateFinPrevue ?? d.date_fin_prevue) }}
            </dd>
          </div>
        </template>
        <template
          v-else-if="
            varroaSousAction === 'suppression_couvain' ||
            varroaSousAction === 'suppression_couvain_male'
          "
        >
          <div class="flex justify-between">
            <dt class="text-sm text-stone-500">Cadres retirés</dt>
            <dd class="text-sm font-medium text-stone-700">
              {{ d.nombreCadres ?? d.nombre_cadres_retires ?? '-' }}
            </dd>
          </div>
        </template>
        <template v-else-if="varroaSousAction === 'vph' || varroaSousAction === 'comptage_vph'">
          <div v-if="d.nombreVarroas != null" class="flex justify-between">
            <dt class="text-sm text-stone-500">Varroas</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.nombreVarroas }}</dd>
          </div>
          <div v-if="d.nombreAbeilles" class="flex justify-between">
            <dt class="text-sm text-stone-500">Abeilles</dt>
            <dd class="text-sm font-medium text-stone-700">{{ d.nombreAbeilles }}</dd>
          </div>
          <div v-if="tauxVph != null" class="flex justify-between">
            <dt class="text-sm text-stone-500">Taux VPH</dt>
            <dd
              class="text-sm font-semibold"
              :class="
                tauxVph > 3 ? 'text-red-600' : tauxVph > 1 ? 'text-amber-600' : 'text-amber-600'
              "
            >
              {{ tauxVph.toFixed(1) }}%
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
          <dd class="text-sm font-medium text-stone-700">{{ d.poidsKg ?? d.poids_kg }} kg</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-stone-500">Type de pesée</dt>
          <dd class="text-sm font-medium text-stone-700">{{ peseeLabel }}</dd>
        </div>
        <div v-if="d.poids_estime_total" class="flex justify-between">
          <dt class="text-sm text-stone-500">Poids total estimé</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.poids_estime_total }} kg</dd>
        </div>
        <div v-if="d.variation_kg != null" class="flex justify-between">
          <dt class="text-sm text-stone-500">Variation</dt>
          <dd
            class="text-sm font-semibold"
            :class="
              d.variation_kg > 0
                ? 'text-amber-600'
                : d.variation_kg < 0
                  ? 'text-red-600'
                  : 'text-stone-500'
            "
          >
            {{ d.variation_kg > 0 ? '+' : '' }}{{ d.variation_kg }} kg
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
          class="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
        >
          {{ tag }}
        </span>
      </div>
    </template>

    <!-- Empilement -->
    <template v-else-if="type === 'empilement' && donnees">
      <dl class="space-y-2">
        <div v-if="d.methode_reunion" class="flex justify-between">
          <dt class="text-sm text-stone-500">Méthode</dt>
          <dd class="text-sm font-medium capitalize text-stone-700">
            {{ d.methode_reunion?.replace('_', ' ') }}
          </dd>
        </div>
        <div v-if="d.rucheDestinationId ?? d.devenir_ruche_source" class="flex justify-between">
          <dt class="text-sm text-stone-500">Ruche destination</dt>
          <dd class="text-sm font-medium capitalize text-stone-700">Empilement enregistré</dd>
        </div>
      </dl>
    </template>

    <!-- Sanitaire -->
    <template v-else-if="type === 'sanitaire' && donnees">
      <div
        class="mb-2 inline-flex rounded-lg bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
      >
        {{ sanitaireLabel }}
      </div>
      <dl class="space-y-2">
        <div v-if="d.causeProbable ?? d.cause_probable" class="flex justify-between">
          <dt class="text-sm text-stone-500">Cause probable</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.causeProbable ?? d.cause_probable }}
          </dd>
        </div>
        <div v-if="(d.declarationGdsa ?? d.declaration_gdsa) != null" class="flex justify-between">
          <dt class="text-sm text-stone-500">Déclaration GDSA</dt>
          <dd
            class="text-sm font-medium"
            :class="(d.declarationGdsa ?? d.declaration_gdsa) ? 'text-amber-600' : 'text-stone-500'"
          >
            {{ (d.declarationGdsa ?? d.declaration_gdsa) ? 'Oui' : 'Non' }}
          </dd>
        </div>
        <div v-if="d.typeNettoyage ?? d.type_nettoyage" class="flex justify-between">
          <dt class="text-sm text-stone-500">Type nettoyage</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.typeNettoyage ?? d.type_nettoyage }}
          </dd>
        </div>
        <div v-if="d.nombreCadres ?? d.nombre_cadres" class="flex justify-between">
          <dt class="text-sm text-stone-500">Cadres</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.nombreCadres ?? d.nombre_cadres }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Transvasement -->
    <template v-else-if="type === 'transvasement' && donnees">
      <dl class="space-y-2">
        <div v-if="d.cadresTransferes ?? d.cadres_transferes" class="flex justify-between">
          <dt class="text-sm text-stone-500">Cadres transférés</dt>
          <dd class="text-sm font-medium text-stone-700">
            {{ d.cadresTransferes ?? d.cadres_transferes }}
          </dd>
        </div>
        <div v-if="d.devenirRucheSource ?? d.devenir_ruche_source" class="flex justify-between">
          <dt class="text-sm text-stone-500">Ruche source</dt>
          <dd class="text-sm font-medium capitalize text-stone-700">
            {{ (d.devenirRucheSource ?? d.devenir_ruche_source)?.replace('_', ' ') }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Reine -->
    <template v-else-if="type === 'reine' && donnees">
      <div
        class="mb-2 inline-flex rounded-lg bg-amber-50 px-3 py-1 text-sm font-medium capitalize text-amber-700"
      >
        {{ reineTypeLabel }}
      </div>
      <dl class="space-y-2">
        <div v-if="d.couleur" class="flex items-center justify-between">
          <dt class="text-sm text-stone-500">Couleur</dt>
          <dd class="flex items-center gap-1.5">
            <span class="h-4 w-4 rounded-full border" :class="reineColorClass" />
            <span class="text-sm font-medium capitalize text-stone-700">{{ d.couleur }}</span>
          </dd>
        </div>
        <div v-if="d.race" class="flex justify-between">
          <dt class="text-sm text-stone-500">Race</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.race }}</dd>
        </div>
        <div v-if="d.origine" class="flex justify-between">
          <dt class="text-sm text-stone-500">Origine</dt>
          <dd class="text-sm font-medium capitalize text-stone-700">
            {{ d.origine?.replace('_', ' ') }}
          </dd>
        </div>
        <div v-if="d.qualitePonte" class="flex justify-between">
          <dt class="text-sm text-stone-500">Qualité ponte</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.qualitePonte }}/5</dd>
        </div>
        <div v-if="d.fournisseur" class="flex justify-between">
          <dt class="text-sm text-stone-500">Fournisseur</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.fournisseur }}</dd>
        </div>
        <div v-if="d.prix" class="flex justify-between">
          <dt class="text-sm text-stone-500">Prix</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.prix }} €</dd>
        </div>
        <div v-if="d.notes" class="pt-1">
          <dt class="mb-1 text-sm text-stone-500">Notes</dt>
          <dd class="whitespace-pre-line rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
            {{ d.notes }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Rendez-vous pro -->
    <template v-else-if="type === 'rendez_vous_pro' && donnees">
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="d.statut"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium"
          :class="rdvStatutClass"
        >
          <UIcon :name="rdvStatutIcon" class="h-4 w-4" />
          {{ rdvStatutLabel }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700"
        >
          <UIcon name="i-lucide-briefcase" class="h-4 w-4" />
          {{ rdvTypeLabel }}
        </span>
      </div>
      <dl class="mt-3 space-y-2">
        <div v-if="d.interlocuteur ?? d.contact" class="flex justify-between">
          <dt class="text-sm text-stone-500">Contact</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.interlocuteur ?? d.contact }}</dd>
        </div>
        <div v-if="d.lieu" class="flex justify-between">
          <dt class="text-sm text-stone-500">Lieu</dt>
          <dd class="text-sm font-medium text-stone-700">{{ d.lieu }}</dd>
        </div>
        <div v-if="d.notes" class="pt-1">
          <dt class="mb-1 text-sm text-stone-500">Notes</dt>
          <dd class="whitespace-pre-line rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
            {{ d.notes }}
          </dd>
        </div>
      </dl>
    </template>

    <!-- Fallback -->
    <template v-else>
      <p class="text-sm italic text-stone-400">Aucun détail enregistré.</p>
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

// Varroa — sous-action unifiée (Phase 1 snake_case + Phase 2 camelCase)
const varroaSousAction = computed(
  () => (d.value.sousAction ?? d.value.sous_action ?? '') as string,
);

const varroaSousActionLabel = computed(() => {
  const map: Record<string, string> = {
    comptage_plancher: 'Comptage sur plancher',
    traitement: 'Traitement',
    suppression_couvain: 'Suppression couvain mâle',
    suppression_couvain_male: 'Suppression couvain mâle',
    vph: 'Comptage VPH/100 AB',
    comptage_vph: 'Comptage VPH/100 AB',
  };
  return map[varroaSousAction.value] ?? varroaSousAction.value;
});

// Chute/jour calculée ou récupérée
const chuteParJour = computed<number | null>(() => {
  if (d.value.chuteParJour != null) return Number(d.value.chuteParJour);
  if (d.value.chute_par_jour != null) return Number(d.value.chute_par_jour);
  if (d.value.nombreVarroas != null && d.value.dureeJours > 0) {
    return Math.round((Number(d.value.nombreVarroas) / Number(d.value.dureeJours)) * 10) / 10;
  }
  return null;
});

// Taux VPH calculé ou récupéré
const tauxVph = computed<number | null>(() => {
  if (d.value.tauxVph != null) return Number(d.value.tauxVph);
  if (d.value.taux_vph != null) return Number(d.value.taux_vph);
  if (d.value.nombreVarroas != null && d.value.nombreAbeilles > 0) {
    return (Number(d.value.nombreVarroas) / Number(d.value.nombreAbeilles)) * 100;
  }
  return null;
});

// Controle
const forceColonie = computed(() => d.value.forceColonie ?? d.value.force_colonie);

const controleItems = computed(() => [
  { label: 'Reine vue', value: d.value.reineVue ?? d.value.reine_vue },
  { label: 'Couvain présent', value: d.value.couvainPresent ?? d.value.couvain_present },
  { label: 'Cellules royales', value: d.value.celluleRoyale ?? d.value.cellules_royales },
  { label: 'Réserves présentes', value: d.value.reserves ?? d.value.reserves_presentes },
]);

const comportementLabel = computed(() => {
  const map: Record<string, string> = { calme: 'Calme', agitee: 'Agitée', agressive: 'Agressive' };
  return map[d.value.comportement] ?? d.value.comportement;
});

const comportementColor = computed(() => {
  const map: Record<string, string> = {
    calme: 'text-amber-600',
    agitee: 'text-amber-600',
    agressive: 'text-red-600',
  };
  return map[d.value.comportement] ?? 'text-stone-600';
});

// Matériel — éléments (Phase 2: elements[].element, Phase 1: elements[].type)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const elements = computed(() => (d.value.elements ?? []) as Array<Record<string, any>>);

// Nourrissement — type unified
const nourritureLabel = computed(() => {
  const map: Record<string, string> = {
    sirop_sucre: 'Sirop de sucre',
    sirop_glucose: 'Sirop de glucose',
    candi: 'Candi',
    pate_proteique: 'Pâte protéique',
    miel: 'Miel',
    autre: 'Autre',
  };
  const key = d.value.type ?? d.value.type_nourriture ?? '';
  return map[key] ?? key;
});

// Pesée
const peseeLabel = computed(() => {
  const map: Record<string, string> = {
    totale: 'Pesée totale',
    cote_droit: 'Pesée de côté (droite)',
    cote_gauche: 'Pesée de côté (gauche)',
    arriere: 'Arrière',
  };
  const key = d.value.typePesee ?? d.value.type_pesee ?? '';
  return map[key] ?? key;
});

// Sanitaire
const sanitaireLabel = computed(() => {
  const map: Record<string, string> = {
    essaim_mort: 'Essaim mort',
    nettoyer_ruche: 'Nettoyage ruche',
    nettoyer_plancher: 'Nettoyage plancher',
    retrait_couvain: 'Retrait de couvain',
  };
  const key = d.value.typeEvenement ?? d.value.sous_action ?? '';
  return map[key] ?? key;
});

// Reine
const reineTypeLabel = computed(() => {
  const map: Record<string, string> = {
    introduction: 'Introduction',
    marquage: 'Marquage',
    clipping: 'Clipping',
    remplacement: 'Remplacement',
    perte: 'Perte',
    ponte_vue: 'Ponte observée',
    cellule_royale_trouvee: 'Cellule royale',
    elevage: 'Élevage',
  };
  const key = d.value.typeEvenement ?? d.value.sous_action ?? '';
  return map[key] ?? key;
});

const rdvTypeLabel = computed(() => {
  const map: Record<string, string> = {
    veterinaire: 'Vétérinaire',
    syndicat: 'Syndicat apicole',
    syndicat_apicole: 'Syndicat apicole',
    fournisseur: 'Fournisseur',
    client: 'Client / Acheteur',
    client_acheteur: 'Client / Acheteur',
    administration: 'Administration',
    formation: 'Formation',
    certification: 'Certification',
    inspection_dsa: 'Inspection DSA',
    autre: 'Autre',
  };
  const key = d.value.typeRdv ?? d.value.type_rdv ?? '';
  return map[key] ?? key;
});

const rdvStatutLabel = computed(() => {
  const map: Record<string, string> = {
    planifie: 'Planifié',
    realise: 'Réalisé',
    annule: 'Annulé',
  };
  return map[d.value.statut] ?? d.value.statut ?? '';
});

const rdvStatutClass = computed(() => {
  const map: Record<string, string> = {
    planifie: 'bg-sky-50 text-sky-700',
    realise: 'bg-amber-50 text-amber-700',
    annule: 'bg-red-50 text-red-600',
  };
  return map[d.value.statut] ?? 'bg-stone-50 text-stone-600';
});

const rdvStatutIcon = computed(() => {
  const map: Record<string, string> = {
    planifie: 'i-lucide-clock',
    realise: 'i-lucide-check-circle-2',
    annule: 'i-lucide-x-circle',
  };
  return map[d.value.statut] ?? 'i-lucide-circle';
});

const reineColorClass = computed(() => {
  const map: Record<string, string> = {
    blanc: 'bg-white border-stone-300',
    jaune: 'bg-yellow-400 border-yellow-500',
    rouge: 'bg-red-500 border-red-600',
    vert: 'bg-amber-500 border-amber-600',
    bleu: 'bg-blue-500 border-blue-600',
  };
  return map[d.value.couleur] ?? 'bg-stone-300 border-stone-400';
});

function formatDate(val: unknown): string {
  if (!val) return '';
  try {
    return new Date(val as string).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
}
</script>
