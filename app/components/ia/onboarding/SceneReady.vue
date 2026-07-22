<template>
  <div class="cine-recap">
    <div class="cine-recap-head">
      <UIcon name="i-lucide-check" class="cine-recap-ico" />
      <div>
        <p class="cine-recap-title">{{ rucher.nom || 'Ton rucher' }}</p>
        <p class="cine-recap-sub">{{ rucher.commune || 'Emplacement à préciser plus tard' }}</p>
      </div>
    </div>
    <div v-for="l in lignes" :key="l.label" class="cine-recap-row">
      <span>{{ l.label }}</span>
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
  { label: 'Ruches préparées', valeur: `${props.nbRuches}` },
  { label: 'Modules activés', valeur: `${props.modules.length}` },
  { label: 'Maya', valeur: PRESENCE_LIB[props.presence] ?? '' },
]);
</script>
