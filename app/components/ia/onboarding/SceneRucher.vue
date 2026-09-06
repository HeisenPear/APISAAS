<template>
  <div class="cine-form">
    <div class="cine-field">
      <label class="cine-flabel">Le nom de ton rucher</label>
      <input v-model="modele.nom" class="cine-input" placeholder="Le rucher du bois" />
    </div>

    <div class="cine-frow">
      <div class="cine-field">
        <label class="cine-flabel">Commune</label>
        <input v-model="modele.commune" class="cine-input" placeholder="Optionnel" />
      </div>
      <div class="cine-field">
        <label class="cine-flabel">Environnement</label>
        <select v-model="modele.environnement" class="cine-input">
          <option value="">À préciser</option>
          <option v-for="e in ENVIRONNEMENTS" :key="e" :value="e">{{ e }}</option>
        </select>
      </div>
    </div>

    <div class="cine-gps">
      <button class="cine-gps-btn" type="button" :disabled="geoLoading" @click.stop="emit('geo')">
        {{ geoLoading ? 'Je te localise…' : 'Utiliser ma position' }}
      </button>
      <span v-if="modele.latitude" class="cine-hint"
        >Position enregistrée — la météo sera juste.</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
export interface RucherSaisi {
  nom: string;
  commune: string;
  departement: string;
  environnement: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Scène « rucher » — le seul champ REQUIS de tout l'onboarding est le nom.
 * Tout le reste peut attendre : un apiculteur au rucher, avec des gants, ne
 * remplit pas un formulaire de six champs.
 *
 * La position sert la météo, qui n'a aucun sens sans coordonnées — d'où le
 * bouton dédié plutôt qu'une saisie de latitude.
 */
const modele = defineModel<RucherSaisi>({ required: true });
defineProps<{ geoLoading?: boolean }>();
const emit = defineEmits<{ geo: [] }>();

const ENVIRONNEMENTS = ['verger', 'garrigue', 'montagne', 'plaine', 'forêt', 'urbain'];
</script>
