<template>
  <div class="cine-recap">
    <!-- Le rayon en état « réussite », pas une coche générique : c'est Maya qui
         annonce que le rucher est prêt, comme dans la maquette. -->
    <div class="cine-recap-head">
      <IaMayaMark :size="40" state="success" />
      <div>
        <p class="cine-recap-title">{{ rucher.nom || 'Ton rucher' }}</p>
        <p class="cine-recap-sub">{{ rucher.commune || 'Emplacement à préciser plus tard' }}</p>
      </div>
    </div>
    <div v-for="l in lignes" :key="l.label" class="cine-recap-row">
      <span class="cine-recap-ico"><UIcon :name="l.icone" /></span>
      <span class="cine-recap-label">{{ l.label }}</span>
      <span class="cine-recap-ready">{{ l.valeur }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RucherSaisi } from './SceneRucher.vue';

/**
 * Scène « ready » — le récapitulatif avant d'entrer.
 *
 * Il ne célèbre pas dans le vide : il montre ce qui va RÉELLEMENT être créé, en
 * clair. L'apiculteur doit pouvoir vérifier avant que ça s'écrive.
 */
const props = defineProps<{
  rucher: RucherSaisi;
  nbRuches: number;
  presence: 'partout' | 'discrete' | 'pause';
  modules: string[];
}>();

const PRESENCE_LIB: Record<string, string> = {
  partout: 'Je prends les devants',
  discrete: 'Je reste dans un coin',
  pause: 'Je me fais oublier',
};

const lignes = computed(() => [
  {
    icone: 'i-lucide-grid-2x2',
    label: `Ruche${props.nbRuches > 1 ? 's' : ''} préparée${props.nbRuches > 1 ? 's' : ''}`,
    valeur: `${props.nbRuches}`,
  },
  {
    icone: 'i-lucide-layout-grid',
    label: `Module${props.modules.length > 1 ? 's' : ''} activé${props.modules.length > 1 ? 's' : ''}`,
    valeur: `${props.modules.length}`,
  },
  { icone: 'i-lucide-sparkle', label: 'Maya', valeur: PRESENCE_LIB[props.presence] ?? '' },
]);
</script>
